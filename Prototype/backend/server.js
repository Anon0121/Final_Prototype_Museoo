const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const https = require('https');
const fs = require('fs');
const pool = require('./db'); // Import the pool from db.js

const app = express();
const PORT = process.env.PORT || 3000;

// Custom route handler for archive files with proper CORS headers - MUST be before /uploads route
const handleArchiveFile = (req, res) => {
  console.log('📁 Archive file request:', req.method, req.originalUrl);
  
  // Set CORS headers - ALWAYS use specific origin to avoid wildcard issues
  const origin = req.headers.origin;
  // If we have an origin, use it; otherwise default to localhost:5173 (common dev frontend)
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Default to localhost:5173 if no origin header (direct requests)
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'false'); // Archive files don't need credentials
  res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Length');
  
  // Get the file path - req.path is relative to /uploads/archives mount point
  // Remove leading slash if present
  const relativePath = req.path.startsWith('/') ? req.path.slice(1) : req.path;
  const filePath = path.join(__dirname, 'uploads', 'archives', relativePath);
  
  console.log('📂 Looking for file:', filePath);
  console.log('📂 Original URL:', req.originalUrl);
  console.log('📂 Path:', req.path);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error('❌ File not found:', filePath);
    return res.status(404).json({ error: 'File not found', path: filePath });
  }
  
  // Set Content-Type based on file extension
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    res.setHeader('Content-Type', 'application/pdf');
  } else if (ext === '.doc' || ext === '.docx') {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  } else if (ext === '.xls' || ext === '.xlsx') {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  } else if (ext === '.ppt' || ext === '.pptx') {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
  }
  
  // Allow embedding in iframes
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  console.log('✅ Sending file with CORS headers');
  
  // Send the file
  res.sendFile(filePath);
};

// Register routes for archive files - MUST come before app.use('/uploads')
// Use app.use with a specific path to ensure it matches before static middleware
app.use('/uploads/archives', (req, res, next) => {
  // Only handle if it's a file request (has a filename after /archives/)
  if (req.path === '/' || req.path === '') {
    return next(); // Let static middleware handle directory listing
  }
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    console.log('🔧 OPTIONS request for archive file:', req.path);
    const origin = req.headers.origin;
    // Always use specific origin, never wildcard
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
    return res.sendStatus(200);
  }
  
  // Handle GET requests
  handleArchiveFile(req, res);
});

// Serve uploaded images
app.use('/uploads', express.static('uploads'));

app.use('/uploads/profiles', express.static('uploads/profiles'));

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../Museoo/dist')));

// ✅ Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
// Ensure activity log table exists
const { ensureActivityLogTable, logActivity, logUserActivity } = require('./utils/activityLogger');
ensureActivityLogTable().catch(err => console.error('Activity log table ensure failed:', err));


// Allow both local and Vercel frontend (HTTP and HTTPS)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:3000',
  'http://192.168.1.4:5173',
  'http://192.168.1.4:3000',
  'http://192.168.1.6:5173',
  'http://192.168.1.6:3000',   // Your current IP
  'http://192.168.1.9:5173',
  'http://192.168.1.9:3000',
  'http://192.168.56.1:5173',  // VirtualBox/VMware network
  'http://192.168.56.1:3000',
  'https://localhost:5173',
  'https://localhost:3000',     // HTTPS localhost
  'https://127.0.0.1:5173',
  'https://127.0.0.1:3000',
  'https://192.168.1.6:5173',  // Your current IP HTTPS
  'https://192.168.1.6:3000',  // Your current IP HTTPS
  'https://192.168.1.9:5173',
  'https://192.168.1.9:3000',
  'https://192.168.56.1:5173',
  'https://192.168.56.1:3000',
  'https://museoo-project.vercel.app',
  'https://museoo-frontend-vercel.app',
  // Allow all devices on local network (phones, tablets, etc.)
  /^https?:\/\/(192\.168\.\d+\.\d+|localhost|127\.0\.0\.1)/  // Allow any local IP
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check against allowed origins
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('⚠️ Blocked origin:', origin);
      callback(null, true); // Allow all for now - remove this in production
    }
  },
  credentials: true
}));

// For production, use a persistent session store (e.g., Redis) instead of MemoryStore!
app.use(session({
  secret: 'your_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    // Removed secure and sameSite for local development
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// ✅ Middleware for session authentication
const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  return res.status(401).json({ success: false, message: 'Not authenticated' });
};

// ✅ Global activity logging middleware for all authenticated routes
app.use((req, res, next) => {
  // Only log for authenticated users and non-GET requests (modifications)
  if (req.session?.user && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    logUserActivity(req, res, next);
  } else {
    next();
  }
});

// Import user utilities
const { generateSecurePassword, hashPassword, verifyPassword, sendUserCredentials } = require('./utils/userUtils');

// ✅ Signup route (for regular signup)
app.post('/api/signup', async (req, res) => {
  const { username, firstname, lastname, password, role } = req.body;

  if (!username || !firstname || !lastname || !password || role === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    const sql = `INSERT INTO system_user (username, firstname, lastname, email, password, role, status)
                 VALUES (?, ?, ?, ?, ?, ?, 'active')`;
    await pool.query(sql, [username, firstname, lastname, `${username}@museum.com`, hashedPassword, role]);
    res.json({ success: true, message: 'Account created successfully!' });
  } catch (err) {
    console.error('❌ Signup error:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ✅ Create user with auto-generated password and email notification
app.post('/api/create-user', isAuthenticated, async (req, res) => {
  const { username, firstname, lastname, email, role, permissions } = req.body;

  if (!username || !firstname || !lastname || !email || role === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // Generate secure password
    const password = generateSecurePassword();
    
    // Hash the password before storing
    const hashedPassword = await hashPassword(password);
    
    // Insert user into database with hashed password and permissions
    const sql = `INSERT INTO system_user (username, firstname, lastname, email, password, role, status, permissions)
                 VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`;
    await pool.query(sql, [username, firstname, lastname, email, hashedPassword, role, JSON.stringify(permissions || {})]);
    
    // Get the inserted user ID
    const [result] = await pool.query(`SELECT user_ID FROM system_user WHERE username = ?`, [username]);
    const userId = result[0].user_ID;
    
    // Insert permissions into user_permissions table
    if (permissions && typeof permissions === 'object') {
      for (const [permissionName, config] of Object.entries(permissions)) {
        if (config && typeof config === 'object') {
          await pool.query(`
            INSERT INTO user_permissions (user_id, permission_name, is_allowed, access_level) 
            VALUES (?, ?, ?, ?)
          `, [userId, permissionName, config.allowed, config.access]);
        } else {
          // Handle legacy format (boolean)
          await pool.query(`
            INSERT INTO user_permissions (user_id, permission_name, is_allowed, access_level) 
            VALUES (?, ?, ?, ?)
          `, [userId, permissionName, config, 'edit']);
        }
      }
    }
    
    // Send credentials email with plain text password (for user to see)
    let emailResult = { success: false, message: 'Email sending disabled' };
    try {
      emailResult = await sendUserCredentials({
        username,
        firstname,
        lastname,
        email,
        password, // Send plain text password in email
        role
      });
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      emailResult = { success: false, message: 'Email sending failed: ' + emailError.message };
    }
    
    // Log activity
    logActivity(req, 'user.create', { username, role, emailSent: !!emailResult.success });

    if (emailResult.success) {
      res.json({ 
        success: true, 
        message: 'User created successfully! Credentials have been sent to the user\'s email.',
        emailSent: true
      });
    } else {
      res.json({ 
        success: true, 
        message: 'User created successfully! However, there was an issue sending the credentials email.',
        emailSent: false,
        emailError: emailResult.message
      });
    }
  } catch (err) {
    console.error('❌ Create user error:', err);
    logActivity(req, 'user.create.error', { username, error: err.message });
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.message.includes('username')) {
        res.status(400).json({ success: false, message: 'Username already exists' });
      } else if (err.message.includes('email')) {
        res.status(400).json({ success: false, message: 'Email already exists' });
      } else {
        res.status(400).json({ success: false, message: 'Duplicate entry error' });
      }
    } else {
      res.status(500).json({ success: false, message: 'Database error' });
    }
  }
});

// ✅ Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [results] = await pool.query(`SELECT * FROM system_user WHERE username = ?`, [username]);
    
    if (results.length === 0) {
      return res.json({ success: false, message: 'Invalid username or password' });
    }

    const user = results[0];
    
    // Verify password using bcrypt
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.json({ success: false, message: 'Invalid username or password' });
    }

    if (user.status === 'deactivated' || !user.status || user.status.trim() === '') {
      return res.json({ success: false, message: 'Account is deactivated.' });
    }

    req.session.user = {
      id: user.user_ID,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      role: user.role
    };

    // Log activity
    logActivity(req, 'auth.login', { username });
    res.json({ success: true, message: 'Login successful', user: req.session.user });
  } catch (err) {
    console.error('❌ Login error:', err);
    logActivity(req, 'auth.login.error', { username, error: err.message });
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ✅ Current logged-in user
app.get('/api/user', isAuthenticated, async (req, res) => {
  try {
    console.log('🔄 Fetching fresh user data for ID:', req.session.user.id);
    
    // Get complete user data including profile_photo from database
    const [results] = await pool.query(`
      SELECT user_ID, username, firstname, lastname, email, role, status, profile_photo
      FROM system_user WHERE user_ID = ?
    `, [req.session.user.id]);
    
    if (results.length > 0) {
      const user = results[0];
      
      // Check if user is deactivated
      if (user.status === 'deactivated' || !user.status || user.status.trim() === '') {
        // Destroy the session for deactivated users
        req.session.destroy((err) => {
          if (err) {
            console.error('❌ Session destruction error:', err);
          }
        });
        return res.status(401).json({ 
          success: false, 
          message: 'Account is deactivated. Please contact an administrator.' 
        });
      }
      
      // Fetch permissions from user_permissions table
      const [permissionResults] = await pool.query(`
        SELECT permission_name, is_allowed, access_level
        FROM user_permissions 
        WHERE user_id = ?
      `, [req.session.user.id]);
      
      // Convert permissions to the expected format
      const permissions = {};
      permissionResults.forEach(row => {
        permissions[row.permission_name] = {
          allowed: row.is_allowed,
          access: row.access_level
        };
      });
      
      const freshUserData = {
        id: user.user_ID,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        status: user.status,
        profile_photo: user.profile_photo || null,
        permissions: permissions
      };
      
      console.log('📋 Fresh user data from database:', freshUserData);
      
      // Update session with fresh data
      req.session.user = freshUserData;
      
      // Avoid logging frequent user.me to reduce noise
      res.json({ success: true, user: freshUserData });
    } else {
      console.log('❌ User not found in database');
      // Avoid logging missing events for noise reduction
      res.json({ success: true, user: req.session.user });
    }
  } catch (err) {
    console.error('❌ Get user error:', err);
    // Avoid logging frequent user.me errors to logs list
    res.json({ success: true, user: req.session.user });
  }
});

// ✅ Get all users
app.get('/api/users', async (req, res) => {
  try {
    const sql = `
      SELECT 
        user_ID AS id,
        username,
        firstname,
        lastname,
        email,
        role,
        status
      FROM system_user
    `;

    const [results] = await pool.query(sql);
    res.json({ success: true, users: results });
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

// ✅ Logout
app.get('/api/logout', (req, res) => {
  const uid = req.session?.user?.id;
  req.session.destroy(err => {
    if (err) return res.status(500).json({ success: false, message: 'Logout failed' });
    // Log logout (no session now; log without req.session.user)
    try { logActivity({ headers: req.headers, socket: req.socket }, 'auth.logout', { userId: uid }); } catch {}
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out' });
  });
});

// ✅ Change password
app.post('/api/change-password', isAuthenticated, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session.user.id;

  try {
    const [results] = await pool.query(`SELECT password FROM system_user WHERE user_ID = ?`, [userId]);
    
    const user = results[0];
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }
    
    // Verify current password using bcrypt
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.json({ success: false, message: 'Current password incorrect' });
    }

    // Hash the new password
    const hashedNewPassword = await hashPassword(newPassword);
    
    await pool.query(`UPDATE system_user SET password = ? WHERE user_ID = ?`, [hashedNewPassword, userId]);
    logActivity(req, 'user.password.change', {});
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('❌ Change password error:', err);
    logActivity(req, 'user.password.change.error', { error: err.message });
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ✅ Update profile
app.put('/api/update-profile', isAuthenticated, async (req, res) => {
  const { firstname, lastname, email } = req.body;
  const userId = req.session.user.id;

  try {
    const sql = `UPDATE system_user SET firstname = ?, lastname = ?, email = ? WHERE user_ID = ?`;
    await pool.query(sql, [firstname, lastname, email, userId]);
    
    // Update session data
    req.session.user.firstname = firstname;
    req.session.user.lastname = lastname;
    
    logActivity(req, 'user.profile.update', { firstname, lastname, email });
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('❌ Update profile error:', err);
    logActivity(req, 'user.profile.update.error', { error: err.message });
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ✅ Upload profile photo
const multer = require('multer');

// Configure multer for profile photo uploads
const profilePhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure the directory exists
    const fs = require('fs');
    const uploadDir = 'uploads/profiles/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + req.session.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const profilePhotoUpload = multer({
  storage: profilePhotoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

app.post('/api/upload-profile-photo', isAuthenticated, profilePhotoUpload.single('profile_photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const userId = req.session.user.id;
    const filename = req.file.filename;

    console.log(`📸 Uploading profile photo: ${filename} for user ${userId}`);

    // Update user's profile photo in database
    await pool.query(`UPDATE system_user SET profile_photo = ? WHERE user_ID = ?`, [filename, userId]);
    
    // Update session data
    req.session.user.profile_photo = filename;
    
    console.log(`✅ Profile photo uploaded successfully: ${filename}`);
    
    res.json({ 
      success: true, 
      message: 'Profile photo uploaded successfully',
      filename: filename
    });
  } catch (err) {
    console.error('❌ Upload profile photo error:', err);
    res.status(500).json({ success: false, message: 'Upload failed: ' + err.message });
  }
});

// ✅ Deactivate user
app.post('/api/users/:id/deactivate', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`UPDATE system_user SET status = 'deactivated' WHERE user_ID = ?`, [id]);
    logActivity(req, 'user.deactivate', { targetUserId: id });
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Deactivate user error:', err);
    logActivity(req, 'user.deactivate.error', { targetUserId: id, error: err.message });
    res.status(500).json({ success: false, message: 'Deactivate failed' });
  }
});

// ✅ Activate user
app.post('/api/users/:id/activate', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`UPDATE system_user SET status = 'active' WHERE user_ID = ?`, [id]);
    logActivity(req, 'user.activate', { targetUserId: id });
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Activate user error:', err);
    logActivity(req, 'user.activate.error', { targetUserId: id, error: err.message });
    res.status(500).json({ success: false, message: 'Activate failed' });
  }
});

// ✅ Delete user
app.delete('/api/users/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM system_user WHERE user_ID = ?`, [id]);
    logActivity(req, 'user.delete', { targetUserId: id });
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete user error:', err);
    logActivity(req, 'user.delete.error', { targetUserId: id, error: err.message });
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

// ✅ Get user permissions
app.get('/api/users/:id/permissions', isAuthenticated, async (req, res) => {
  try {
    const userId = req.params.id;
    const [results] = await pool.query(`
      SELECT permission_name, is_allowed, access_level
      FROM user_permissions 
      WHERE user_id = ?
    `, [userId]);
    
    const permissions = {};
    results.forEach(row => {
      permissions[row.permission_name] = {
        allowed: row.is_allowed,
        access: row.access_level
      };
    });
    
    res.json({ success: true, permissions });
  } catch (err) {
    console.error('❌ Get permissions error:', err);
    res.status(500).json({ success: false, message: 'Error fetching permissions' });
  }
});

// ✅ Update user permissions
app.put('/api/users/:id/permissions', isAuthenticated, async (req, res) => {
  try {
    const userId = req.params.id;
    const { permissions } = req.body;
    
    // Delete existing permissions
    await pool.query('DELETE FROM user_permissions WHERE user_id = ?', [userId]);
    
    // Insert new permissions
    if (permissions && typeof permissions === 'object') {
      for (const [permissionName, config] of Object.entries(permissions)) {
        if (config && typeof config === 'object') {
          await pool.query(`
            INSERT INTO user_permissions (user_id, permission_name, is_allowed, access_level)
            VALUES (?, ?, ?, ?)
          `, [userId, permissionName, config.allowed, config.access]);
        }
      }
    }
    
    // Update permissions JSON in system_user table
    await pool.query(`
      UPDATE system_user 
      SET permissions = ? 
      WHERE user_ID = ?
    `, [JSON.stringify(permissions), userId]);
    
    logActivity(req, 'user.permissions.update', { targetUserId: userId, permissions });
    res.json({ success: true, message: 'Permissions updated successfully' });
  } catch (err) {
    console.error('❌ Update permissions error:', err);
    logActivity(req, 'user.permissions.update.error', { targetUserId: req.params.id, error: err.message });
    res.status(500).json({ success: false, message: 'Error updating permissions' });
  }
});

app.use('/api/slots', require('./routes/slots'));
app.use('/api', require('./routes/slots')); // Add check-in routes
app.use('/api/activities', require('./routes/activities'));
app.use('/api/cultural-objects', require('./routes/cultural-objects'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/additional-visitors', require('./routes/additional-visitors'));
app.use('/api/walkin-visitors', require('./routes/walkin-visitors'));
app.use('/api/individual-walkin', require('./routes/individual-walkin'));
app.use('/api/group-walkin-leader', require('./routes/group-walkin-leader'));
app.use('/api/group-walkin-leaders', require('./routes/group-walkin-leaders'));
app.use('/api/group-walkin-members', require('./routes/group-walkin-members'));
app.use('/api/group-walkin-visitors', require('./routes/group-walkin-visitors'));
app.use('/api/backup-codes', require('./routes/backup-codes'));



const archiveRoutes = require('./routes/archive');
app.use('/api/archives', archiveRoutes);

// Serve donation files
app.use('/uploads/donations', express.static(__dirname + '/uploads/donations'));

app.use('/api/donations', require('./routes/donations'));
app.use('/api/reports', require('./routes/reports').router);
app.use('/api/promotional', require('./routes/promotional'));
app.use('/api/event-registrations', require('./routes/event-registrations'));

const statsRouter = require('./routes/stats');
app.use('/api/stats', statsRouter);

// Test endpoint for serving images without extensions
app.get('/test-image/:filename', (req, res) => {
  const fs = require('fs');
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  
  if (fs.existsSync(filePath)) {
    // Read first few bytes to determine file type
    const buffer = fs.readFileSync(filePath, { start: 0, end: 10 });
    
    // Check for JPEG signature (FF D8 FF)
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      res.setHeader('Content-Type', 'image/jpeg');
      return res.sendFile(filePath);
    }
    // Check for PNG signature (89 50 4E 47)
    else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      res.setHeader('Content-Type', 'image/png');
      return res.sendFile(filePath);
    }
    // Check for GIF signature (47 49 46)
    else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      res.setHeader('Content-Type', 'image/gif');
      return res.sendFile(filePath);
    }
  }
  
  res.status(404).send('Image not found');
});


// Activity log endpoints
app.get('/api/activity-logs', isAuthenticated, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 500);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
    const importantOnly = (req.query.important === '1' || req.query.important === 'true');
    let sql = `SELECT l.id, l.user_id, u.username, u.firstname, u.lastname, u.role, l.action, l.details, l.ip_address, l.user_agent, l.created_at
               FROM user_activity_logs l
               LEFT JOIN system_user u ON u.user_ID = l.user_id`;
    const params = [];
    if (importantOnly) {
      sql += ` WHERE l.action NOT IN ('user.me','user.list')`;
    }
    sql += ` ORDER BY l.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, logs: rows });
  } catch (err) {
    console.error('❌ Fetch logs error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
});

// Clear logs (admin only). Optional: olderThanDate=YYYY-MM-DD to clear older logs
app.delete('/api/activity-logs', isAuthenticated, async (req, res) => {
  try {
    if (req.session?.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can clear logs' });
    }
    const olderThanDate = req.query.olderThanDate;
    let sql = 'DELETE FROM user_activity_logs';
    const params = [];
    if (olderThanDate) {
      sql += ' WHERE created_at < ?';
      params.push(olderThanDate);
    }
    const [result] = await pool.query(sql, params);
    try { logActivity(req, 'logs.clear', { olderThanDate: olderThanDate || null, affected: result.affectedRows }); } catch {}
    res.json({ success: true, message: 'Logs cleared', affected: result.affectedRows });
  } catch (err) {
    console.error('❌ Clear logs error:', err);
    res.status(500).json({ success: false, message: 'Failed to clear logs' });
  }
});


// Compression middleware removed - not essential for basic functionality

// Optimize for mobile networks
app.use((req, res, next) => {
  // Add cache headers for static assets
  if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
  next();
});

// Handle React routing - temporarily disabled due to path-to-regexp error
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../Museoo/dist/index.html'));
// });

// Start HTTP server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🌐 External access: http://192.168.1.9:${PORT}`);
  console.log(`📱 Mobile access: http://192.168.1.9:${PORT}`);
});
