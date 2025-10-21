const express = require('express');
const router = express.Router();
const { logActivity, logUserActivity } = require('../utils/activityLogger');
const pool = require('../db');

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

// Get all visitors with their details (from unified visitors table)
router.get('/all', async (req, res) => {
  try {
    // Get ALL visitors from the unified visitors table
    const [allVisitors] = await pool.query(`
      SELECT 
        v.visitor_id,
        v.first_name,
        v.last_name,
        v.gender,
        v.visitor_type,
        v.address,
        v.email,
        v.purpose,
        v.institution,
        v.status,
        v.created_at,
        v.checkin_time,
        v.is_main_visitor,
        b.date as visit_date,
        b.time_slot,
        b.type as booking_type,
        CASE 
          WHEN v.is_main_visitor = 1 THEN
            CASE 
              WHEN b.type = 'ind-walkin' THEN 'Individual Walk-in'
              WHEN b.type = 'walk-in scheduling' THEN 'Walk-in Scheduling'
              WHEN b.type = 'group-walkin' THEN 'Group Walk-in'
              ELSE 'Primary Visitor'
            END
          ELSE 'Additional Visitor'
        END as visitor_category,
        CASE 
          WHEN v.is_main_visitor = 1 THEN
            CASE 
              WHEN b.type = 'ind-walkin' THEN 'Individual Walk-in'
              WHEN b.type = 'walk-in scheduling' THEN 'Walk-in Scheduling'
              WHEN b.type = 'group-walkin' THEN 'Group Walk-in'
              ELSE 'Primary Visitor'
            END
          ELSE 'Additional Visitor'
        END as visitor_type_display,
        CASE 
          WHEN v.is_main_visitor = 1 THEN
            CASE 
              WHEN b.type IN ('ind-walkin', 'walk-in scheduling', 'group-walkin') THEN 'Walk-in'
              ELSE 'Primary'
            END
          ELSE 'Additional'
        END as visitor_role
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE (v.first_name IS NOT NULL AND v.first_name != '')  -- Only show visitors with data
      AND v.checkin_time IS NOT NULL  -- Only show visitors who have actually been scanned/checked in
      ORDER BY v.checkin_time DESC  -- Sort by check-in time (most recent first)
    `);
    
    // Visitors are already sorted by check-in time in the SQL query
    
    // Debug: Log visitor data
    console.log('🔍 All visitors from unified table:');
    allVisitors.forEach((visitor, index) => {
      console.log(`Visitor ${index + 1}: ${visitor.first_name} ${visitor.last_name}`);
      console.log(`  - Role: ${visitor.visitor_role} (${visitor.visitor_category})`);
      console.log(`  - Status: ${visitor.status}`);
      console.log(`  - Main Visitor: ${visitor.is_main_visitor}`);
      console.log(`  - Check-in time: ${visitor.checkin_time}`);
      console.log(`  - Created: ${visitor.created_at}`);
    });
    
    res.json({ 
      success: true, 
      visitors: allVisitors 
    });
  } catch (err) {
    console.error('Error fetching visitors:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch visitors' 
    });
  }
});

// Get visitor statistics (including additional visitors)
router.get('/stats', async (req, res) => {
  try {
    // Get main visitors stats
    const [mainStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_main,
        COUNT(CASE WHEN v.status = 'visited' THEN 1 END) as visited_main,
        COUNT(CASE WHEN v.status = 'pending' THEN 1 END) as pending_main,
        COUNT(CASE WHEN DATE(v.created_at) = CURDATE() THEN 1 END) as today_main
      FROM visitors v
      WHERE v.is_main_visitor = 1
    `);

    // Get additional visitors stats
    const [additionalStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_additional,
        COUNT(CASE WHEN av.status = 'checked-in' THEN 1 END) as visited_additional,
        COUNT(CASE WHEN av.status = 'completed' THEN 1 END) as pending_additional,
        COUNT(CASE WHEN DATE(av.created_at) = CURDATE() THEN 1 END) as today_additional
      FROM additional_visitors av
    `);

    // Combine stats
    const stats = {
      total: (mainStats[0].total_main || 0) + (additionalStats[0].total_additional || 0),
      visited: (mainStats[0].visited_main || 0) + (additionalStats[0].visited_additional || 0),
      pending: (mainStats[0].pending_main || 0) + (additionalStats[0].pending_additional || 0),
      today: (mainStats[0].today_main || 0) + (additionalStats[0].today_additional || 0),
      main_visitors: mainStats[0].total_main || 0,
      additional_visitors: additionalStats[0].total_additional || 0
    };
    
    res.json({ 
      success: true, 
      stats: stats 
    });
  } catch (err) {
    console.error('Error fetching visitor stats:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch visitor stats' 
    });
  }
});

// Get visitor by ID (for QR code scanning)
router.get('/:visitorId', async (req, res) => {
  try {
    const { visitorId } = req.params;
    
    const [visitor] = await pool.query(`
      SELECT 
        v.visitor_id,
        v.first_name,
        v.last_name,
        v.gender,
        v.visitor_type,
        v.address,
        v.email,
        v.purpose,
        v.status,
        v.created_at,
        v.checkin_time,
        b.date as visit_date,
        b.time_slot,
        b.booking_id
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE v.visitor_id = ?
    `, [visitorId]);
    
    if (visitor.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Visitor not found'
      });
    }
    
    res.json({
      success: true,
      visitor: visitor[0]
    });
  } catch (err) {
    console.error('Error fetching visitor:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch visitor'
    });
  }
});

// Update visitor check-in time (when QR is scanned)
router.post('/checkin/:visitorId', isAuthenticated, logUserActivity, async (req, res) => {
  try {
    const { visitorId } = req.params;
    
    // First, get visitor information to ensure it exists
    const [visitor] = await pool.query(
      'SELECT * FROM visitors WHERE visitor_id = ?',
      [visitorId]
    );
    
    if (visitor.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Visitor not found'
      });
    }
    
    // Update visitor status to visited and set individual check-in time
    await pool.query(
      'UPDATE visitors SET status = "visited", checkin_time = NOW() WHERE visitor_id = ?',
      [visitorId]
    );
    
    // Update booking status (but not checkin_time - keep individual times)
    await pool.query(`
      UPDATE bookings b 
      JOIN visitors v ON b.booking_id = v.booking_id 
      SET b.status = 'checked-in'
      WHERE v.visitor_id = ?
    `, [visitorId]);
    
    // Get updated visitor information with individual check-in time
    const [updatedVisitor] = await pool.query(`
      SELECT 
        v.visitor_id,
        v.first_name,
        v.last_name,
        v.gender,
        v.visitor_type,
        v.address,
        v.email,
        v.purpose,
        v.status,
        v.created_at,
        v.checkin_time,
        b.date as visit_date,
        b.time_slot
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE v.visitor_id = ?
    `, [visitorId]);
    
    try { await logActivity(req, 'visitor.checkin', { visitorId }); } catch {}
    res.json({ 
      success: true, 
      message: 'Visitor checked in successfully',
      visitor: {
        ...updatedVisitor[0],
        checkin_time: updatedVisitor[0].checkin_time ? updatedVisitor[0].checkin_time.toISOString() : null
      }
    });
  } catch (err) {
    console.error('Error checking in visitor:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check in visitor' 
    });
  }
});

// Update visitor information (for group members)
router.put('/:visitorId', isAuthenticated, logUserActivity, async (req, res) => {
  try {
    const { visitorId } = req.params;
    const { firstName, lastName, gender, address, email, visitorType, institution, purpose } = req.body;
    
    // First, get visitor information to ensure it exists
    const [visitor] = await pool.query(
      'SELECT * FROM visitors WHERE visitor_id = ?',
      [visitorId]
    );
    
    if (visitor.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Visitor not found'
      });
    }
    
    // Update visitor information
    await pool.query(`
      UPDATE visitors 
      SET first_name = ?, last_name = ?, gender = ?, address = ?, 
          email = ?, visitor_type = ?, purpose = ?
      WHERE visitor_id = ?
    `, [firstName, lastName, gender, address, email, visitorType, purpose, visitorId]);
    
    // If institution is provided, we might want to store it in a separate field
    // For now, we'll store it in the purpose field or create a new field if needed
    if (institution) {
      // You could add an institution field to the visitors table if needed
      // For now, we'll store it as part of the purpose or create a custom field
      await pool.query(`
        UPDATE visitors 
        SET purpose = CONCAT(purpose, ' - Institution: ', ?)
        WHERE visitor_id = ?
      `, [institution, visitorId]);
    }
    
    // Get updated visitor information
    const [updatedVisitor] = await pool.query(`
      SELECT 
        v.visitor_id,
        v.first_name,
        v.last_name,
        v.gender,
        v.visitor_type,
        v.address,
        v.email,
        v.purpose,
        v.status,
        v.created_at,
        b.date as visit_date,
        b.time_slot
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE v.visitor_id = ?
    `, [visitorId]);
    
    try { await logActivity(req, 'visitor.update', { visitorId }); } catch {}
    res.json({ 
      success: true, 
      message: 'Visitor information updated successfully',
      visitor: updatedVisitor[0]
    });
  } catch (err) {
    console.error('Error updating visitor:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update visitor information' 
    });
  }
});

// Get visitors by type (Primary or Additional)
router.get('/by-type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['primary', 'additional'].includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid visitor type. Use "primary" or "additional"'
      });
    }

    let query;
    let params = [];

    if (type.toLowerCase() === 'primary') {
      // Get primary visitors from visitors table
      query = `
        SELECT 
          v.visitor_id,
          v.first_name,
          v.last_name,
          v.gender,
          v.visitor_type,
          v.address,
          v.email,
          v.purpose,
          v.status,
          v.created_at,
          v.checkin_time,
          b.date as visit_date,
          b.time_slot,
          'Primary Visitor' as visitor_category,
          'Primary' as visitor_role,
          b.type as booking_type,
          'main' as source_table
        FROM visitors v
        LEFT JOIN bookings b ON v.booking_id = b.booking_id
        WHERE v.is_main_visitor = 1
        ORDER BY v.created_at DESC
      `;
    } else {
      // Get additional visitors from unified visitors table
      query = `
        SELECT 
          v.visitor_id,
          v.first_name,
          v.last_name,
          v.gender,
          v.visitor_type,
          v.address,
          v.email,
          v.purpose,
          v.status,
          v.created_at,
          v.checkin_time,
          b.date as visit_date,
          b.time_slot,
          'Additional Visitor' as visitor_category,
          'Additional' as visitor_role,
          b.type as booking_type,
          'additional' as source_table
        FROM visitors v
        LEFT JOIN bookings b ON v.booking_id = b.booking_id
        WHERE v.is_main_visitor = 0
        ORDER BY v.created_at DESC
      `;
    }

    const [visitors] = await pool.query(query, params);
    
    res.json({
      success: true,
      visitorType: type,
      count: visitors.length,
      visitors: visitors
    });

  } catch (err) {
    console.error('Error fetching visitors by type:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch visitors by type'
    });
  }
});

module.exports = router; 