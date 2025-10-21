
const pool = require('../db');

async function ensureActivityLogTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      action VARCHAR(100) NOT NULL,
      details TEXT NULL,
      ip_address VARCHAR(64) NULL,
      user_agent VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX (user_id),
      FOREIGN KEY (user_id) REFERENCES system_user(user_ID) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
}

async function logActivity(req, action, detailsObj) {
  try {
    // Check both req.session.user and req.user for user context
    const userId = req.session?.user?.id || req.user?.id || null;
    const ip = getClientIp(req);
    const ua = req.headers['user-agent'] || null;
    const details = detailsObj ? JSON.stringify(detailsObj) : null;
    
    console.log('📝 Logging activity:', { 
      action, 
      userId, 
      ip, 
      details: detailsObj,
      sessionUser: req.session?.user,
      reqUser: req.user,
      hasSession: !!req.session,
      sessionId: req.sessionID
    });
    
    await pool.query(
      'INSERT INTO user_activity_logs (user_id, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
      [userId, action, details, ip, ua]
    );
  } catch (e) {
    console.error('⚠️ Failed to log activity:', e.message);
  }
}

// Enhanced logging function with automatic action detection
async function logUserActivity(req, res, next) {
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Store original request data for logging
  const originalBody = { ...req.body };
  const originalParams = { ...req.params };
  const originalQuery = { ...req.query };
  
  // Override res.send to capture response
  res.send = function(data) {
    logRequestActivity(req, originalBody, originalParams, originalQuery, data);
    return originalSend.call(this, data);
  };
  
  // Override res.json to capture response
  res.json = function(data) {
    logRequestActivity(req, originalBody, originalParams, originalQuery, data);
    return originalJson.call(this, data);
  };
  
  next();
}

// Function to log request activity based on method and route
async function logRequestActivity(req, body, params, query, response) {
  try {
    const method = req.method;
    const path = req.route?.path || req.path;
    const userId = req.session?.user?.id || req.user?.id || null;
    
    if (!userId) return; // Only log authenticated requests
    
    let action = '';
    let details = {};
    
    // Determine action based on method and path
    if (method === 'POST') {
      if (path.includes('/archives')) {
        action = 'archive.create';
        details = { title: body.title, type: body.type, category: body.category };
      } else if (path.includes('/cultural-objects')) {
        action = 'cobject.create';
        details = { name: body.name, category: body.category };
      } else if (path.includes('/activities')) {
        action = 'activity.create';
        details = { title: body.title, type: body.type };
      } else if (path.includes('/donations')) {
        action = 'donation.create';
        details = { donor_name: body.donor_name, type: body.type };
      } else if (path.includes('/visitors')) {
        action = 'visitor.create';
        details = { name: body.name, email: body.email };
      } else if (path.includes('/users')) {
        action = 'user.create';
        details = { username: body.username, role: body.role };
      }
    } else if (method === 'PUT' || method === 'PATCH') {
      if (path.includes('/archives')) {
        action = 'archive.update';
        details = { id: params.id, changes: body };
      } else if (path.includes('/cultural-objects')) {
        action = 'cobject.update';
        details = { id: params.id, changes: body };
      } else if (path.includes('/activities')) {
        action = 'activity.update';
        details = { id: params.id, changes: body };
      } else if (path.includes('/donations')) {
        action = 'donation.update';
        details = { id: params.id, changes: body };
      } else if (path.includes('/visitors')) {
        action = 'visitor.update';
        details = { id: params.id, changes: body };
      } else if (path.includes('/users')) {
        action = 'user.update';
        details = { id: params.id, changes: body };
      }
    } else if (method === 'DELETE') {
      if (path.includes('/archives')) {
        action = 'archive.delete';
        details = { id: params.id };
      } else if (path.includes('/cultural-objects')) {
        action = 'cobject.delete';
        details = { id: params.id };
      } else if (path.includes('/activities')) {
        action = 'activity.delete';
        details = { id: params.id };
      } else if (path.includes('/donations')) {
        action = 'donation.delete';
        details = { id: params.id };
      } else if (path.includes('/visitors')) {
        action = 'visitor.delete';
        details = { id: params.id };
      } else if (path.includes('/users')) {
        action = 'user.delete';
        details = { id: params.id };
      }
    }
    
    // Log the activity if we determined an action
    if (action) {
      await logActivity(req, action, details);
    }
  } catch (e) {
    console.error('⚠️ Failed to log request activity:', e.message);
  }
}

module.exports = { ensureActivityLogTable, logActivity, logUserActivity };















