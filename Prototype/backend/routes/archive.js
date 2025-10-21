const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const fs = require('fs');
const router = express.Router();
const { logActivity } = require('../utils/activityLogger');

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

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/archives');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// POST /api/archives - Upload new archive (admin only)
router.post('/', isAuthenticated, upload.single('file'), async (req, res) => {
  const { title, description, date, type, category, tags, is_visible } = req.body;
  const file = req.file;      
  if (!title || !file || !type) {
    return res.status(400).json({ error: 'Title, type, and file are required.' });
  }
  try {
    const file_url = `/uploads/archives/${file.filename}`;
    await pool.query(
      'INSERT INTO archives (title, description, date, type, category, tags, file_url, uploaded_by, is_visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, date || null, type, category || 'Other', tags, file_url, 'admin', is_visible === 'true' || is_visible === true] // Replace 'admin' with actual user if you have auth
    );
    try { await logActivity(req, 'archive.create', { title, type, category, file: file.filename, is_visible }); } catch {}
    res.json({ success: true });
  } catch (err) {
    console.error('Archive upload error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/archives - List/search all archives (public - only visible)
router.get('/', async (req, res) => {
  const { search, type, category } = req.query;
  try {
    let query = 'SELECT * FROM archives WHERE is_visible = TRUE';
    let params = [];
    
    if (search || type || category) {
      query += ' AND (';
      if (search) {
        query += ' (title LIKE ? OR description LIKE ? OR tags LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      if (type) {
        if (search) query += ' AND';
        query += ' type = ?';
        params.push(type);
      }
      if (category) {
        if (search || type) query += ' AND';
        query += ' category = ?';
        params.push(category);
      }
      query += ')';
    }
    
    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/archives/categories - Get all available categories
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT category FROM archives WHERE category IS NOT NULL ORDER BY category');
    const categories = rows.map(row => row.category);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/archives/admin - List all archives for admin (including hidden)
router.get('/admin', async (req, res) => {
  const { search, type, category } = req.query;
  try {
    let query = 'SELECT * FROM archives';
    let params = [];
    
    if (search || type || category) {
      query += ' WHERE';
      if (search) {
        query += ' (title LIKE ? OR description LIKE ? OR tags LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      if (type) {
        if (search) query += ' AND';
        query += ' type = ?';
        params.push(type);
      }
      if (category) {
        if (search || type) query += ' AND';
        query += ' category = ?';
        params.push(category);
      }
    }
    
    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// PATCH /api/archives/:id/visibility - Toggle archive visibility (admin only)
router.patch('/:id/visibility', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { is_visible } = req.body;
  
  try {
    await pool.query('UPDATE archives SET is_visible = ? WHERE id = ?', [is_visible, id]);
    try { await logActivity(req, 'archive.visibility_toggle', { id, is_visible }); } catch {}
    res.json({ success: true });
  } catch (err) {
    console.error('Archive visibility update error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE /api/archives/:id - Delete archive (admin only)
router.delete('/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  try {
    // Get file URL to delete file from disk
    const [[archive]] = await pool.query('SELECT file_url FROM archives WHERE id = ?', [id]);
    if (archive && archive.file_url) {
      const filePath = path.join(__dirname, '..', archive.file_url);
      fs.unlink(filePath, (err) => { /* ignore error */ });
    }
    await pool.query('DELETE FROM archives WHERE id = ?', [id]);
    try { await logActivity(req, 'archive.delete', { id }); } catch {}
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
