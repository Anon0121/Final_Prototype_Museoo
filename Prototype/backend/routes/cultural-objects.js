const express = require('express');
const multer = require('multer');
const pool = require('../db');
const { logActivity } = require('../utils/activityLogger');
const router = express.Router();

// Session-based authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }
  return res.status(401).json({ 
    success: false, 
    message: 'Not authenticated' 
  });
};

const upload = multer({ dest: 'uploads/' });

// CREATE a new cultural object
router.post('/', isAuthenticated, upload.array('images'), async (req, res) => {
  const {
    name, description, category, period, origin, material,
    condition_status, acquisition_date, acquisition_method, current_location,
    estimated_value, conservation_notes, exhibition_history,
    // Dimension fields
    height, width, length, weight, dimension_unit,
    // Maintenance fields
    last_maintenance_date, next_maintenance_date, maintenance_frequency_months,
    maintenance_notes, maintenance_priority, maintenance_cost,
    maintenance_reminder_enabled
  } = req.body;
  const files = req.files;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insert into cultural_objects
    const [mainResult] = await conn.query(
      'INSERT INTO cultural_objects (name, category, description) VALUES (?, ?, ?)',
      [name, category, description]
    );
    const objectId = mainResult.insertId;

    // Insert into object_details
    await conn.query(
      `INSERT INTO object_details (
        cultural_object_id, period, origin, material, condition_status,
        acquisition_date, acquisition_method, current_location, estimated_value,
        conservation_notes, exhibition_history, 
        height, width, length, weight, dimension_unit,
        last_maintenance_date, next_maintenance_date,
        maintenance_frequency_months, maintenance_notes, maintenance_priority,
        maintenance_cost, maintenance_reminder_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        objectId, period, origin, material, condition_status,
        acquisition_date, acquisition_method, current_location, estimated_value,
        conservation_notes, exhibition_history,
        height || null, width || null, length || null, weight || null, dimension_unit || 'cm',
        last_maintenance_date || null, next_maintenance_date || null,
        maintenance_frequency_months || 12, maintenance_notes, maintenance_priority || 'medium',
        maintenance_cost, maintenance_reminder_enabled !== 'false'
      ]
    );

    // Save image URLs
    if (files && files.length > 0) {
      for (const file of files) {
        await conn.query(
          'INSERT INTO images (cultural_object_id, url) VALUES (?, ?)',
          [objectId, `/uploads/${file.filename}`]
        );
      }
    }

    await conn.commit();
    try { await logActivity(req, 'cobject.create', { culturalObjectId: objectId, name }); } catch {}
    res.json({ success: true, culturalObjectId: objectId });
  } catch (err) {
    await conn.rollback();
    console.error('Error creating cultural object:', err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    conn.release();
  }
});

// READ all cultural objects with details and images
router.get('/', async (req, res) => {
  try {
    const [objects] = await pool.query(
      `SELECT co.id, co.name, co.category, co.description, co.created_at, 
              od.id as details_id, od.cultural_object_id, od.period, od.origin, od.material, 
              od.condition_status, od.acquisition_date, od.acquisition_method, od.current_location, 
              od.estimated_value, od.conservation_notes, od.exhibition_history, od.updated_at,
              od.height, od.width, od.length, od.weight, od.dimension_unit,
              od.last_maintenance_date, od.next_maintenance_date, od.maintenance_frequency_months, 
              od.maintenance_notes, od.maintenance_priority, od.maintenance_reminder_enabled, 
              od.maintenance_cost, od.maintenance_status
       FROM cultural_objects co
       LEFT JOIN object_details od ON co.id = od.cultural_object_id
       ORDER BY co.created_at DESC`
    );
    const [images] = await pool.query(
      'SELECT * FROM images WHERE cultural_object_id IS NOT NULL'
    );
    const objectsWithImages = objects.map(obj => ({
      ...obj,
      // Use the cultural_object_id from the object_details table to match with images
      images: images.filter(img => img.cultural_object_id == obj.cultural_object_id).map(img => img.url)
    }));
    res.json(objectsWithImages);
  } catch (err) {
    console.error('Error fetching cultural objects:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// READ by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [objects] = await pool.query(
      `SELECT co.*, od.*, od.id as details_id
       FROM cultural_objects co
       LEFT JOIN object_details od ON co.id = od.cultural_object_id
       WHERE co.id = ?`,
      [id]
    );
    if (objects.length === 0) {
      return res.status(404).json({ error: 'Cultural object not found' });
    }
    const [images] = await pool.query(
      'SELECT * FROM images WHERE cultural_object_id = ?',
      [id]
    );
    const objectWithImages = {
      ...objects[0],
      images: images.map(img => img.url)
    };
    res.json(objectWithImages);
  } catch (err) {
    console.error('Error fetching cultural object:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// UPDATE
router.put('/:id', isAuthenticated, upload.array('images'), async (req, res) => {
  const { id } = req.params;
  const {
    name, description, category, period, origin, material,
    condition_status, acquisition_date, acquisition_method, current_location,
    estimated_value, conservation_notes, exhibition_history,
    // Dimension fields
    height, width, length, weight, dimension_unit,
    // Maintenance fields
    last_maintenance_date, next_maintenance_date, maintenance_frequency_months,
    maintenance_notes, maintenance_priority, maintenance_cost,
    maintenance_reminder_enabled, existing_images
  } = req.body;
  const files = req.files;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check if cultural object exists first
    const [checkResult] = await conn.query('SELECT id FROM cultural_objects WHERE id = ?', [id]);
    if (checkResult.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Cultural object not found' });
    }

    // Update cultural_objects
    await conn.query(
      'UPDATE cultural_objects SET name = ?, category = ?, description = ? WHERE id = ?',
      [name, category, description, id]
    );

    // Update object_details
    await conn.query(
      `UPDATE object_details SET
        period = ?, origin = ?, material = ?, condition_status = ?,
        acquisition_date = ?, acquisition_method = ?, current_location = ?, estimated_value = ?,
        conservation_notes = ?, exhibition_history = ?,
        height = ?, width = ?, length = ?, weight = ?, dimension_unit = ?,
        last_maintenance_date = ?,
        next_maintenance_date = ?, maintenance_frequency_months = ?, maintenance_notes = ?,
        maintenance_priority = ?, maintenance_cost = ?,
        maintenance_reminder_enabled = ?
       WHERE cultural_object_id = ?`,
      [
        period, origin, material, condition_status,
        acquisition_date, acquisition_method, current_location, estimated_value,
        conservation_notes, exhibition_history,
        height || null, width || null, length || null || null, weight || null, dimension_unit || 'cm',
        last_maintenance_date || null,
        next_maintenance_date, maintenance_frequency_months, maintenance_notes,
        maintenance_priority, maintenance_cost,
        maintenance_reminder_enabled !== 'false', id
      ]
    );

    // Handle images: remove old ones and add new ones
    if (existing_images) {
      // Parse existing images to keep
      const imagesToKeep = JSON.parse(existing_images);
      
      // Delete all current images
      await conn.query('DELETE FROM images WHERE cultural_object_id = ?', [id]);
      
      // Re-add the images we want to keep
      for (const imageUrl of imagesToKeep) {
        await conn.query(
          'INSERT INTO images (cultural_object_id, url) VALUES (?, ?)',
          [id, imageUrl]
        );
      }
    }
    
    // Add new images if any
    if (files && files.length > 0) {
      for (const file of files) {
        await conn.query(
          'INSERT INTO images (cultural_object_id, url) VALUES (?, ?)',
          [id, `/uploads/${file.filename}`]
        );
      }
    }

    await conn.commit();
    try { await logActivity(req, 'cobject.update', { culturalObjectId: id }); } catch {}
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('Error updating cultural object:', err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    conn.release();
  }
});

// DELETE object and its images/details
router.delete('/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ Attempting to delete cultural object with ID: ${id}`);
  
  try {
    // First, check if the cultural object exists
    const [checkResult] = await pool.query('SELECT id, name FROM cultural_objects WHERE id = ?', [id]);
    console.log(`🔍 Object to delete:`, checkResult);
    
    if (checkResult.length === 0) {
      console.log(`❌ Object with ID ${id} not found`);
      return res.status(404).json({ success: false, error: 'Cultural object not found' });
    }
    
    const objectName = checkResult[0].name;
    console.log(`🗑️ Found cultural object: ${objectName}`);
    
    // Delete from cultural_objects table - CASCADE will handle related tables
    const [result] = await pool.query('DELETE FROM cultural_objects WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      console.log(`❌ No cultural object was deleted - object may not exist`);
      return res.status(404).json({ success: false, error: 'Cultural object not found' });
    }
    
    console.log(`✅ Successfully deleted cultural object ${id} (${objectName}) and all related records`);
    try { await logActivity(req, 'cobject.delete', { culturalObjectId: id, objectName }); } catch {}
    res.json({ success: true, message: 'Cultural object deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting cultural object:', err);
    console.error('❌ Error details:', err.message);
    res.status(500).json({ success: false, error: 'Database error: ' + err.message });
  }
});

// DELETE a specific image
router.delete('/:id/images/:imageId', async (req, res) => {
  const { id, imageId } = req.params;
  try {
    await pool.query(
      'DELETE FROM images WHERE id = ? AND cultural_object_id = ?',
      [imageId, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting image:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// FILTER by category
router.get('/category/:category', async (req, res) => {
  const { category } = req.params;
  try {
    const [objects] = await pool.query(
      `SELECT co.*, od.*, od.id as details_id
       FROM cultural_objects co
       LEFT JOIN object_details od ON co.id = od.cultural_object_id
       WHERE co.category = ?
       ORDER BY co.created_at DESC`,
      [category]
    );
    const [images] = await pool.query(
      'SELECT * FROM images WHERE cultural_object_id IS NOT NULL'
    );
    const objectsWithImages = objects.map(obj => ({
      ...obj,
      images: images.filter(img => img.cultural_object_id === obj.cultural_object_id).map(img => img.url)
    }));
    res.json(objectsWithImages);
  } catch (err) {
    console.error('Error fetching cultural objects by category:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET maintenance overview
router.get('/maintenance/overview', async (req, res) => {
  try {
    const [maintenanceData] = await pool.query(`
      SELECT 
        co.id as object_id,
        co.name as object_name,
        co.category,
        od.condition_status,
        od.last_maintenance_date,
        od.next_maintenance_date,
        od.maintenance_frequency_months,
        od.maintenance_priority,
        od.maintenance_status,
        od.maintenance_reminder_enabled,
        od.maintenance_cost,
        od.maintenance_notes,
        CASE 
          WHEN od.next_maintenance_date IS NULL THEN 'No maintenance scheduled'
          WHEN od.next_maintenance_date < CURDATE() THEN 'Overdue'
          WHEN od.next_maintenance_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Due Soon'
          ELSE 'Up to Date'
        END as maintenance_alert_status,
        DATEDIFF(od.next_maintenance_date, CURDATE()) as days_until_maintenance
      FROM cultural_objects co
      LEFT JOIN object_details od ON co.id = od.cultural_object_id
      WHERE od.maintenance_reminder_enabled = TRUE
      ORDER BY od.next_maintenance_date ASC
    `);
    res.json(maintenanceData);
  } catch (err) {
    console.error('Error fetching maintenance overview:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET maintenance alerts (overdue and due soon)
router.get('/maintenance/alerts', async (req, res) => {
  try {
    const [alerts] = await pool.query(`
      SELECT 
        co.id as object_id,
        co.name as object_name,
        co.category,
        od.condition_status,
        od.next_maintenance_date,
        od.maintenance_priority,
        od.maintenance_notes,
        CASE 
          WHEN od.next_maintenance_date < CURDATE() THEN 'Overdue'
          WHEN od.next_maintenance_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Due Soon'
        END as alert_type,
        DATEDIFF(od.next_maintenance_date, CURDATE()) as days_until_maintenance
      FROM cultural_objects co
      LEFT JOIN object_details od ON co.id = od.cultural_object_id
      WHERE od.maintenance_reminder_enabled = TRUE
      AND (od.next_maintenance_date < CURDATE() OR od.next_maintenance_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY))
      ORDER BY od.next_maintenance_date ASC
    `);
    res.json(alerts);
  } catch (err) {
    console.error('Error fetching maintenance alerts:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// UPDATE maintenance status for an object
router.put('/:id/maintenance', async (req, res) => {
  const { id } = req.params;
  const {
    last_maintenance_date,
    next_maintenance_date,
    maintenance_notes,
    maintenance_cost,
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // If next_maintenance_date is null, calculate it based on frequency
    let calculatedNextDate = next_maintenance_date;
    if (!next_maintenance_date && last_maintenance_date) {
      // Get the maintenance frequency
      const [frequencyResult] = await conn.query(
        'SELECT maintenance_frequency_months FROM object_details WHERE cultural_object_id = ?',
        [id]
      );
      
      if (frequencyResult.length > 0) {
        const frequency = frequencyResult[0].maintenance_frequency_months || 12;
        // Calculate next maintenance date by adding frequency months to last maintenance date
        const [nextDateResult] = await conn.query(
          'SELECT DATE_ADD(?, INTERVAL ? MONTH) as next_date',
          [last_maintenance_date, frequency]
        );
        calculatedNextDate = nextDateResult[0].next_date;
      }
    }

    // Update maintenance information
    await conn.query(
      `UPDATE object_details SET
        last_maintenance_date = ?,
        next_maintenance_date = ?,
        maintenance_notes = ?,
        maintenance_cost = ?,
        maintenance_status = CASE 
          WHEN ? IS NULL THEN 'up_to_date'
          WHEN ? < CURDATE() THEN 'overdue'
          WHEN ? <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'due_soon'
          ELSE 'up_to_date'
        END
       WHERE cultural_object_id = ?`,
      [
        last_maintenance_date, calculatedNextDate, maintenance_notes,
        maintenance_cost, calculatedNextDate,
        calculatedNextDate, calculatedNextDate, id
      ]
    );

    await conn.commit();
    try { await logActivity(req, 'cobject.maintenance.update', { culturalObjectId: id }); } catch {}
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('Error updating maintenance:', err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    conn.release();
  }
});

// GET maintenance history for an object
router.get('/:id/maintenance/history', async (req, res) => {
  const { id } = req.params;
  try {
    const [history] = await pool.query(`
      SELECT 
        last_maintenance_date,
        next_maintenance_date,
        maintenance_notes,
        maintenance_cost,
,
        maintenance_priority,
        maintenance_frequency_months,
        maintenance_status,
        updated_at
      FROM object_details 
      WHERE cultural_object_id = ?
    `, [id]);
    res.json(history[0] || {});
  } catch (err) {
    console.error('Error fetching maintenance history:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router; 