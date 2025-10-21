const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/promotional');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'promotional-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get all promotional items
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM promotional_items 
      ORDER BY \`order\` ASC, created_at DESC
    `);
    
    // Convert MySQL boolean values (1/0) to JavaScript boolean (true/false)
    const convertedRows = rows.map(row => ({
      ...row,
      isActive: Boolean(row.is_active),
      ctaText: row.cta_text,
      ctaLink: row.cta_link
    }));
    
    res.json(convertedRows);
  } catch (error) {
    console.error('Error fetching promotional items:', error);
    res.status(500).json({ error: 'Failed to fetch promotional items' });
  }
});

// Get single promotional item
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM promotional_items WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Promotional item not found' });
    }
    
    // Convert MySQL boolean values (1/0) to JavaScript boolean (true/false)
    const row = rows[0];
    const convertedRow = {
      ...row,
      isActive: Boolean(row.is_active),
      ctaText: row.cta_text,
      ctaLink: row.cta_link
    };
    
    res.json(convertedRow);
  } catch (error) {
    console.error('Error fetching promotional item:', error);
    res.status(500).json({ error: 'Failed to fetch promotional item' });
  }
});

// Create new promotional item
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      ctaText,
      ctaLink,
      badge,
      isActive = true,
      order = 0
    } = req.body;

    // Validate required fields
    if (!title || !subtitle || !description || !badge) {
      return res.status(400).json({ error: 'Title, subtitle, description, and badge are required' });
    }

    const imagePath = req.file ? `/uploads/promotional/${req.file.filename}` : null;

    const [result] = await db.query(`
      INSERT INTO promotional_items (
        title, subtitle, description, image, cta_text, cta_link, 
        badge, is_active, \`order\`, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      title, subtitle, description, imagePath, ctaText, ctaLink, 
      badge, isActive, order
    ]);

    const [newItem] = await db.query(
      'SELECT * FROM promotional_items WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newItem[0]);
  } catch (error) {
    console.error('Error creating promotional item:', error);
    res.status(500).json({ error: 'Failed to create promotional item' });
  }
});

// Update promotional item
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      ctaText,
      ctaLink,
      badge,
      isActive,
      order
    } = req.body;

    // Check if item exists
    const [existingItem] = await db.query(
      'SELECT * FROM promotional_items WHERE id = ?',
      [req.params.id]
    );

    if (existingItem.length === 0) {
      return res.status(404).json({ error: 'Promotional item not found' });
    }

    // Handle image update
    let imagePath = existingItem[0].image;
    if (req.file) {
      // Delete old image if it exists
      if (existingItem[0].image) {
        const oldImagePath = path.join(__dirname, '..', existingItem[0].image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imagePath = `/uploads/promotional/${req.file.filename}`;
    }

    await db.query(`
      UPDATE promotional_items SET
        title = ?, subtitle = ?, description = ?, image = ?,
        cta_text = ?, cta_link = ?, badge = ?, is_active = ?,
        \`order\` = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      title, subtitle, description, imagePath, ctaText, ctaLink,
      badge, isActive, order, req.params.id
    ]);

    const [updatedItem] = await db.query(
      'SELECT * FROM promotional_items WHERE id = ?',
      [req.params.id]
    );

    res.json(updatedItem[0]);
  } catch (error) {
    console.error('Error updating promotional item:', error);
    res.status(500).json({ error: 'Failed to update promotional item' });
  }
});

// Update promotional item status (toggle active/inactive)
router.patch('/:id', async (req, res) => {
  try {
    const { isActive } = req.body;

    const [result] = await db.query(`
      UPDATE promotional_items SET
        is_active = ?, updated_at = NOW()
      WHERE id = ?
    `, [isActive, req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Promotional item not found' });
    }

    const [updatedItem] = await db.query(
      'SELECT * FROM promotional_items WHERE id = ?',
      [req.params.id]
    );

    // Convert MySQL boolean values (1/0) to JavaScript boolean (true/false)
    const row = updatedItem[0];
    const convertedRow = {
      ...row,
      isActive: Boolean(row.is_active),
      ctaText: row.cta_text,
      ctaLink: row.cta_link
    };

    res.json(convertedRow);
  } catch (error) {
    console.error('Error updating promotional item status:', error);
    res.status(500).json({ error: 'Failed to update promotional item status' });
  }
});

// Delete promotional item
router.delete('/:id', async (req, res) => {
  try {
    // Get item details before deletion
    const [item] = await db.query(
      'SELECT * FROM promotional_items WHERE id = ?',
      [req.params.id]
    );

    if (item.length === 0) {
      return res.status(404).json({ error: 'Promotional item not found' });
    }

    // Delete image file if it exists
    if (item[0].image) {
      const imagePath = path.join(__dirname, '..', item[0].image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete from database
    await db.query('DELETE FROM promotional_items WHERE id = ?', [req.params.id]);

    res.json({ message: 'Promotional item deleted successfully' });
  } catch (error) {
    console.error('Error deleting promotional item:', error);
    res.status(500).json({ error: 'Failed to delete promotional item' });
  }
});

module.exports = router;
