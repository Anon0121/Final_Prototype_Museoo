const express = require('express');
const pool = require('../db');
const router = express.Router();
const { logActivity } = require('../utils/activityLogger');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');

const SLOT_CAPACITY = 30;
const TIME_SLOTS = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
];

// Get slots for a date
router.get('/', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Date is required' });

  try {
    // Get all bookings for the date
    const [rows] = await pool.query(
      `SELECT time_slot, SUM(total_visitors) AS booked
       FROM bookings
       WHERE date = ?
       GROUP BY time_slot`,
      [date]
    );
    const slotMap = {};
    rows.forEach(row => {
      slotMap[row.time_slot] = row.booked;
    });
    const slots = TIME_SLOTS.map(time => ({
      time,
      booked: slotMap[time] ? Number(slotMap[time]) : 0,
      capacity: SLOT_CAPACITY
    }));
    res.json(slots);
  } catch (err) {
    console.error('Error fetching slots:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Book a slot (group or individual)
router.post('/book', async (req, res) => {
  const { type, mainVisitor, groupMembers, totalVisitors, date, time } = req.body;
  if (!date || !time || !mainVisitor || !totalVisitors) return res.status(400).json({ error: 'Missing data' });

  const conn = await pool.getConnection();
  try {
    // Check slot capacity
    const [rows] = await conn.query(
      `SELECT SUM(total_visitors) AS booked FROM bookings WHERE date = ? AND time_slot = ?`,
      [date, time]
    );
    const booked = rows[0].booked ? Number(rows[0].booked) : 0;
    if (booked + totalVisitors > SLOT_CAPACITY) {
      conn.release();
      return res.status(400).json({ error: 'Slot full' });
    }

    // Insert booking
    const [bookingResult] = await conn.query(
      `INSERT INTO bookings (first_name, last_name, type, status, date, time_slot, total_visitors) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        mainVisitor.firstName,
        mainVisitor.lastName,
        type === 'group' ? 'group' : 'individual',
        'pending',
        date,
        time,
        totalVisitors
      ]
    );
    const bookingId = bookingResult.insertId;

    // Insert main visitor
    const [mainVisitorResult] = await conn.query(
      `INSERT INTO visitors (booking_id, first_name, last_name, gender, address, email, visitor_type, purpose, status, is_main_visitor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
      [bookingId, mainVisitor.firstName, mainVisitor.lastName, mainVisitor.gender, mainVisitor.address, mainVisitor.email, mainVisitor.visitorType, mainVisitor.purpose || 'other', 'pending']
    );
    const mainVisitorId = mainVisitorResult.insertId;

    // Insert group members
    let groupIds = [];
    if (type === 'group' && Array.isArray(groupMembers)) {
      for (const member of groupMembers) {
        const [memberResult] = await conn.query(
          `INSERT INTO visitors (booking_id, first_name, last_name, gender, address, email, visitor_type, purpose, status, is_main_visitor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, false)`,
          [bookingId, member.firstName, member.lastName, member.gender, member.address, member.email, member.visitorType, member.purpose || mainVisitor.purpose || 'other', 'pending']
        );
        groupIds.push(memberResult.insertId);
      }
    }

    conn.release();
    try { await logActivity(req, 'booking.create', { bookingId, date, time, totalVisitors }); } catch {}
    res.json({ success: true, bookingId, visitorIds: [mainVisitorId, ...groupIds] });
  } catch (err) {
    conn.release();
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all bookings
router.get('/all', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM bookings ORDER BY date DESC, time_slot`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Approve a booking
router.put('/bookings/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Approve the booking
    await pool.query(
      `UPDATE bookings SET status = 'approved' WHERE booking_id = ?`,
      [id]
    );

    // 2. Get main visitor's email and name
    const [visitorRows] = await pool.query(
      `SELECT email, first_name, last_name FROM visitors WHERE booking_id = ? AND is_main_visitor = true`,
      [id]
    );
    if (!visitorRows.length || !visitorRows[0].email) {
      return res.json({ success: true, message: 'Booking approved, but no email sent (no visitor email found).' });
    }
    const visitor = visitorRows[0];

    // 3. Generate QR code (encode a check-in URL)
    const checkinUrl = `http://localhost:3000/api/visit/checkin/${id}`;
    const qrDataUrl = await QRCode.toDataURL(checkinUrl);

    // 4. Send email with QR code
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'museoweb1@gmail.com',
        pass: 'akrtgds yyprsfxyi'
      }
    });
    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
    await transporter.sendMail({
      from: 'MuseoSmart <your-email@gmail.com>',
      to: visitor.email,
      subject: 'Your Museum Visit is Confirmed!',
      text: `Hi ${visitor.first_name},\n\nYour schedule is confirmed! Please present this QR code at the museum for check-in.`,
      attachments: [{
        filename: 'qrcode.png',
        content: Buffer.from(base64Data, 'base64'),
        contentType: 'image/png'
      }]
    });

    try { await logActivity(req, 'booking.approve', { bookingId: id, emailSent: true }); } catch {}
    res.json({ success: true, message: 'Booking approved and email sent!' });
  } catch (err) {
    console.error('Error approving booking:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Cancel a booking
router.put('/bookings/:id/cancel', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      `UPDATE bookings SET status = 'cancelled' WHERE booking_id = ?`,
      [id]
    );
    try { await logActivity(req, 'booking.cancel', { bookingId: id }); } catch {}
    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Reject a booking (distinct from cancel for audit semantics)
router.put('/bookings/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    // Use existing enum 'cancelled' to represent rejection in DB
    await pool.query(
      `UPDATE bookings SET status = 'cancelled' WHERE booking_id = ?`,
      [id]
    );
    try { await logActivity(req, 'booking.reject', { bookingId: id }); } catch {}
    res.json({ success: true, message: 'Booking rejected successfully' });
  } catch (err) {
    console.error('Error rejecting booking:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete a booking
router.delete('/bookings/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      `DELETE FROM bookings WHERE booking_id = ?`,
      [id]
    );
    try { await logActivity(req, 'booking.delete', { bookingId: id }); } catch {}
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('Error deleting booking:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Check-in endpoint for QR code scanning
router.get('/visit/checkin/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Get booking information
    const [bookingRows] = await pool.query(
      `SELECT * FROM bookings WHERE booking_id = ?`,
      [id]
    );
    
    if (bookingRows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = bookingRows[0];
    
    console.log('Booking found:', {
      booking_id: booking.booking_id,
      status: booking.status,
      first_name: booking.first_name,
      last_name: booking.last_name
    });
    
    // Check if booking is valid for check-in
    if (booking.status === 'cancelled') {
      return res.status(400).json({ 
        error: 'Booking has been cancelled', 
        status: booking.status 
      });
    }
    
    if (booking.status === 'checked-in') {
      return res.status(400).json({ 
        error: 'Visitor has already been checked in', 
        status: booking.status 
      });
    }
    
    // Get visitor information
    const [visitorRows] = await pool.query(
      `SELECT * FROM visitors WHERE booking_id = ? AND is_main_visitor = true`,
      [id]
    );
    
    let visitor = null;
    if (visitorRows.length > 0) {
      visitor = visitorRows[0];
    }
    
    // Update booking status to checked-in
    await pool.query(
      `UPDATE bookings SET status = 'checked-in', checkin_time = NOW() WHERE booking_id = ?`,
      [id]
    );
    
    // Update visitor status
    if (visitor) {
      await pool.query(
        `UPDATE visitors SET status = 'visited' WHERE visitor_id = ?`,
        [visitor.visitor_id]
      );
    }
    
    try { await logActivity(req, 'visitor.checkin', { bookingId: id, visitorId: visitor?.visitor_id }); } catch {}
    
    res.json({
      success: true,
      message: 'Check-in successful!',
      booking: {
        id: booking.booking_id,
        name: `${booking.first_name} ${booking.last_name}`,
        date: booking.date,
        time: booking.time_slot,
        type: booking.type,
        totalVisitors: booking.total_visitors
      },
      visitor: visitor ? {
        id: visitor.visitor_id,
        name: `${visitor.first_name} ${visitor.last_name}`,
        email: visitor.email,
        gender: visitor.gender,
        visitor_type: visitor.visitor_type,
        purpose: visitor.purpose
      } : null
    });
    
  } catch (err) {
    console.error('Error during check-in:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
