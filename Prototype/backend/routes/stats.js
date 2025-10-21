const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/summary', async (req, res) => {
  try {
    // Get comprehensive statistics
    const [
      totalVisitors,
      totalBookings,
      totalEvents,
      totalExhibits,
      totalCulturalObjects,
      totalDonations,
      totalArchives,
      recentBookings,
      recentDonations,
      recentActivities
    ] = await Promise.all([
      // Count total visitors (from visitors table - only actual visitors, not system users)
      pool.query('SELECT COUNT(*) AS count FROM visitors WHERE is_main_visitor = 1'),
      
      // Count total bookings
      pool.query('SELECT COUNT(*) AS count FROM bookings'),
      
      // Count total events (activities with type = event)
      pool.query('SELECT COUNT(*) AS count FROM activities WHERE type = "event"'),
      
      // Count total exhibits (activities with type = exhibit)
      pool.query('SELECT COUNT(*) AS count FROM activities WHERE type = "exhibit"'),
      
      // Count cultural objects
      pool.query('SELECT COUNT(*) AS count FROM cultural_objects'),
      
      // Count donations
      pool.query('SELECT COUNT(*) AS count FROM donations'),
      
      // Count archives
      pool.query('SELECT COUNT(*) AS count FROM archives'),
      
             // Get recent bookings with detailed information (last 5)
       pool.query(`
         SELECT 
           b.*, 
           v.first_name, 
           v.last_name,
           v.email,
           v.institution,
           v.visitor_type,
           COUNT(CASE WHEN v2.is_main_visitor = 0 THEN 1 END) as additional_visitors
         FROM bookings b 
         LEFT JOIN visitors v ON b.booking_id = v.booking_id AND v.is_main_visitor = 1
         LEFT JOIN visitors v2 ON b.booking_id = v2.booking_id
         GROUP BY b.booking_id
         ORDER BY b.created_at DESC 
         LIMIT 5
       `),
      
      // Get recent donations (last 5)
      pool.query(`
        SELECT * FROM donations 
        ORDER BY created_at DESC 
        LIMIT 5
      `),
      
      // Get recent activities (events and exhibits)
      pool.query(`
        SELECT a.*, 
               CASE 
                 WHEN a.type = 'event' THEN ed.start_date
                 WHEN a.type = 'exhibit' THEN exd.start_date
               END as start_date,
               CASE 
                 WHEN a.type = 'event' THEN ed.location
                 WHEN a.type = 'exhibit' THEN exd.location
               END as location
        FROM activities a
        LEFT JOIN event_details ed ON a.id = ed.activity_id
        LEFT JOIN exhibit_details exd ON a.id = exd.activity_id
        ORDER BY a.created_at DESC 
        LIMIT 5
      `)
    ]);

    // Get today's statistics
    const today = new Date().toISOString().split('T')[0];
    const [
      todayVisitors,
      todayBookings,
      pendingDonations,
      todayScheduleVisits
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) AS count FROM visitors WHERE DATE(created_at) = ? AND is_main_visitor = 1', [today]),
      pool.query('SELECT COUNT(*) AS count FROM bookings WHERE DATE(created_at) = ?', [today]),
      pool.query('SELECT COUNT(*) AS count FROM donations WHERE status = "pending"'),
             // Get today's schedule visits with detailed information
       pool.query(`
         SELECT 
           b.*, 
           v.first_name, 
           v.last_name,
           v.email,
           v.institution,
           v.visitor_type,
           COUNT(CASE WHEN v2.is_main_visitor = 0 THEN 1 END) as additional_visitors
         FROM bookings b 
         LEFT JOIN visitors v ON b.booking_id = v.booking_id AND v.is_main_visitor = 1
         LEFT JOIN visitors v2 ON b.booking_id = v2.booking_id
         WHERE DATE(b.date) = ?
         GROUP BY b.booking_id
         ORDER BY b.time_slot ASC
         LIMIT 10
       `, [today])
    ]);

    res.json({
      // Main statistics
      visitors: totalVisitors[0][0].count,
      schedules: totalBookings[0][0].count,
      events: totalEvents[0][0].count,
      exhibits: totalExhibits[0][0].count,
      culturalObjects: totalCulturalObjects[0][0].count,
      donations: totalDonations[0][0].count,
      archives: totalArchives[0][0].count,
      
      // Today's statistics
      todayVisitors: todayVisitors[0][0].count,
      todayBookings: todayBookings[0][0].count,
      pendingDonations: pendingDonations[0][0].count,
      
      // Recent activity
      recentBookings: recentBookings[0],
      recentDonations: recentDonations[0],
      recentActivities: recentActivities[0],
      todayScheduleVisits: todayScheduleVisits[0]
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats', details: err.message });
  }
});

// Get detailed visitor statistics
router.get('/visitors', async (req, res) => {
  try {
      const [visitorStats] = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'visited' THEN 1 END) as visited,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
      COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today
    FROM visitors
    WHERE is_main_visitor = 1
  `);
    
    res.json(visitorStats[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch visitor stats' });
  }
});

// Get booking statistics
router.get('/bookings', async (req, res) => {
  try {
    const [bookingStats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'checked-in' THEN 1 END) as checkedIn,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today
      FROM bookings
    `);
    
    res.json(bookingStats[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch booking stats' });
  }
});

// Debug route to check visitors table
router.get('/debug/visitors', async (req, res) => {
  try {
    const [visitors] = await pool.query(`
      SELECT 
        visitor_id,
        booking_id,
        first_name,
        last_name,
        is_main_visitor,
        status,
        created_at
      FROM visitors
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    res.json({ visitors: visitors });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch visitor debug info' });
  }
});

module.exports = router; 