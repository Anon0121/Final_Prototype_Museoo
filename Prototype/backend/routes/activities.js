const express = require('express');
const multer = require('multer');
const pool = require('../db');
const { logActivity, logUserActivity } = require('../utils/activityLogger');
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

const upload = multer({ dest: 'uploads/' }); // images will be saved in /uploads

// Create a new activity (event or exhibit) with details and images
router.post('/', isAuthenticated, logUserActivity, upload.array('images'), async (req, res) => {
  const { title, description, type, ...details } = req.body;
  const files = req.files;

  try {
    // 1. Insert into activities
    const [activityResult] = await pool.query(
      'INSERT INTO activities (title, description, type) VALUES (?, ?, ?)',
      [title, description, type]
    );
    const activityId = activityResult.insertId;

    // 2. Insert into event_details or exhibit_details
    if (type === 'event') {
      await pool.query(
        'INSERT INTO event_details (activity_id, start_date, time, location, organizer, max_capacity, current_registrations) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [activityId, details.start_date, details.time, details.location, details.organizer, details.max_capacity || 50, 0]
      );
      
      // Capacity is now managed in event_details table
      // No need to update activities table
    } else if (type === 'exhibit') {
      await pool.query(
        'INSERT INTO exhibit_details (activity_id, start_date, end_date, location, curator, category) VALUES (?, ?, ?, ?, ?, ?)',
        [activityId, details.start_date, details.end_date, details.location, details.curator, details.category]
      );
      
      // Update activities table with capacity info for exhibits
      if (details.max_capacity) {
        await pool.query(
          'UPDATE activities SET max_capacity = ? WHERE id = ?',
          [details.max_capacity, activityId]
        );
      }
    }

    // 3. Save image URLs
    if (files && files.length > 0) {
      for (const file of files) {
        await pool.query(
          'INSERT INTO images (activity_id, url) VALUES (?, ?)',
          [activityId, `/uploads/${file.filename}`]
        );
      }
    }

    try { await logActivity(req, 'activity.create', { activityId, type, title }); } catch {}
    res.json({ success: true, activityId });
  } catch (err) {
    console.error('Error creating activity:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all exhibits with details and images
router.get('/exhibits', async (req, res) => {
  try {
    // Get all exhibits
    const [exhibits] = await pool.query(
      "SELECT a.id, a.title, a.description, ed.start_date, ed.end_date, ed.location, ed.curator, ed.category \
       FROM activities a \
       JOIN exhibit_details ed ON a.id = ed.activity_id \
       WHERE a.type = 'exhibit'"
    );

    // Get all images for these exhibits
    let images = [];
    const exhibitIds = exhibits.map(e => e.id);
    if (exhibitIds.length > 0) {
      [images] = await pool.query(
        "SELECT * FROM images WHERE activity_id IN (?)",
        [exhibitIds]
      );
    }

    // Attach images to each exhibit
    const exhibitsWithImages = exhibits.map(ex => ({
      ...ex,
      images: images.filter(img => img.activity_id === ex.id).map(img => img.url)
    }));

    res.json(exhibitsWithImages);
  } catch (err) {
    console.error('Error fetching exhibits:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all events with details and images
router.get('/events', async (req, res) => {
  try {
    // Get all events
    const [events] = await pool.query(
      "SELECT a.id, a.title, a.description, ed.start_date, ed.time, ed.location, ed.organizer, \
              ed.max_capacity, ed.current_registrations \
       FROM activities a \
       JOIN event_details ed ON a.id = ed.activity_id \
       WHERE a.type = 'event'"
    );

    // Get all images for these events
    const [images] = await pool.query(
      "SELECT * FROM images WHERE activity_id IN (?)",
      [events.map(e => e.id).length ? events.map(e => e.id) : [0]]
    );

    // Attach images to each event
    const eventsWithImages = events.map(ev => ({
      ...ev,
      images: images.filter(img => img.activity_id === ev.id).map(img => img.url)
    }));

    res.json(eventsWithImages);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update an activity (event or exhibit) with details and images
router.put('/:id', isAuthenticated, logUserActivity, upload.array('images'), async (req, res) => {
  const { id } = req.params;
  const { title, description, type, ...details } = req.body;
  const files = req.files;

  try {
    // 1. Update activities table
    await pool.query(
      'UPDATE activities SET title = ?, description = ? WHERE id = ?',
      [title, description, id]
    );

    // 2. Update event_details or exhibit_details
    if (type === 'event') {
      await pool.query(
        'UPDATE event_details SET start_date = ?, time = ?, location = ?, organizer = ?, max_capacity = ? WHERE activity_id = ?',
        [details.start_date || details.startDate, details.time, details.location, details.organizer, details.max_capacity || 50, id]
      );
      
      // Capacity is now managed in event_details table
      // No need to update activities table
    } else if (type === 'exhibit') {
      await pool.query(
        'UPDATE exhibit_details SET start_date = ?, end_date = ?, location = ?, curator = ?, category = ? WHERE activity_id = ?',
        [details.startDate, details.endDate, details.location, details.curator, details.category, id]
      );
      
      // Capacity is now managed in exhibit_details table
      // No need to update activities table
    }

    // 3. Add new images if any
    if (files && files.length > 0) {
      for (const file of files) {
        await pool.query(
          'INSERT INTO images (activity_id, url) VALUES (?, ?)',
          [id, `/uploads/${file.filename}`]
        );
      }
    }

    try { await logActivity(req, 'activity.update', { activityId: id, type, title }); } catch {}
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating activity:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete an activity (event or exhibit) and its details and images
router.delete('/:id', isAuthenticated, logUserActivity, async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`🗑️ Deleting activity with ID: ${id}`);
    
    // First, check if the activity exists
    const [activityCheck] = await pool.query('SELECT id, title, type FROM activities WHERE id = ?', [id]);
    if (activityCheck.length === 0) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }
    
    const activity = activityCheck[0];
    console.log(`🗑️ Found activity: ${activity.title} (${activity.type})`);
    
    // Delete from activities table - CASCADE will handle related tables
    const [result] = await pool.query('DELETE FROM activities WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }
    
    console.log(`✅ Successfully deleted activity ${id} and all related records`);
    try { await logActivity(req, 'activity.delete', { activityId: id, title: activity.title, type: activity.type }); } catch {}
    res.json({ success: true, message: 'Activity deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting activity:', err);
    res.status(500).json({ success: false, error: 'Database error: ' + err.message });
  }
});

module.exports = router; 