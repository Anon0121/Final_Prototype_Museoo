const express = require('express');
const pool = require('../db');
const router = express.Router();
const QRCode = require('qrcode');
const { logActivity } = require('../utils/activityLogger');

// Get individual walk-in visitor info
router.get('/:visitorId', async (req, res) => {
  const { visitorId } = req.params;
  
  try {
    // Get visitor information with booking details
    const [visitorRows] = await pool.query(
      `SELECT v.*, b.date as visit_date, b.time_slot, b.status as booking_status, b.booking_id, b.type as booking_type
       FROM visitors v
       JOIN bookings b ON v.booking_id = b.booking_id
       WHERE v.visitor_id = ? AND b.type = 'ind-walkin'`,
      [visitorId]
    );
    
    if (visitorRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Individual walk-in visitor not found or invalid token'
      });
    }
    
    const visitor = visitorRows[0];
    
    // Check if booking is still valid
    if (visitor.booking_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'This booking has been cancelled'
      });
    }
    
    // Check if visitor has already completed registration
    if (visitor.status === 'visited') {
      return res.status(400).json({
        success: false,
        error: 'This visitor has already completed registration and been checked in.',
        status: visitor.status
      });
    }
    
    res.json({
      success: true,
      visitorInfo: {
        visitorId: visitor.visitor_id,
        email: visitor.email,
        firstName: visitor.first_name,
        lastName: visitor.last_name,
        status: visitor.status,
        visitDate: visitor.visit_date,
        visitTime: visitor.time_slot,
        bookingId: visitor.booking_id,
        bookingType: visitor.booking_type,
        institution: visitor.institution,
        purpose: visitor.purpose,
        gender: visitor.gender,
        address: visitor.address,
        visitorType: visitor.visitor_type
      }
    });
    
  } catch (err) {
    console.error('Error fetching individual walk-in visitor info:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch visitor information'
    });
  }
});

// Update individual walk-in visitor details
router.put('/:visitorId', async (req, res) => {
  const { visitorId } = req.params;
  const { firstName, lastName, gender, address, visitorType, institution, purpose } = req.body;
  
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // First, get visitor information
    const [visitorRows] = await connection.query(
      `SELECT v.*, b.status as booking_status, b.booking_id, b.type as booking_type
       FROM visitors v
       JOIN bookings b ON v.booking_id = b.booking_id
       WHERE v.visitor_id = ? AND b.type = 'ind-walkin'`,
      [visitorId]
    );
    
    if (visitorRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Individual walk-in visitor not found or invalid token'
      });
    }
    
    const visitor = visitorRows[0];
    
    // Check if booking is still valid
    if (visitor.booking_status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'This booking has been cancelled'
      });
    }
    
    // Check if visitor has already completed registration
    if (visitor.status === 'visited') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'This visitor has already completed registration and been checked in.',
        status: visitor.status
      });
    }
    
    // Update visitor details
    await connection.query(
      `UPDATE visitors SET 
        first_name = ?, 
        last_name = ?, 
        gender = ?, 
        address = ?, 
        visitor_type = ?, 
        institution = ?, 
        purpose = ?,
        status = 'pending'
       WHERE visitor_id = ?`,
      [firstName, lastName, gender, address, visitorType, institution, purpose, visitorId]
    );
    
    // Generate QR code with visitor details
    const qrData = {
      type: 'walkin_visitor',
      visitorId: visitorId,
      bookingId: visitor.booking_id,
      email: visitor.email,
      visitDate: visitor.visit_date,
      visitTime: visitor.time_slot,
      visitorName: `${firstName} ${lastName}`,
      institution: institution,
      purpose: purpose
    };
    
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    
    // Update visitor with QR code
    await connection.query(
      `UPDATE visitors SET qr_code = ? WHERE visitor_id = ?`,
      [base64Data, visitorId]
    );
    
    await connection.commit();
    
    try { 
      await logActivity(req, 'individual.walkin.completed', { 
        visitorId, 
        bookingId: visitor.booking_id,
        visitorName: `${firstName} ${lastName}`
      }); 
    } catch {}
    
    res.json({
      success: true,
      message: 'Individual walk-in visitor registration completed successfully!',
      visitor: {
        firstName,
        lastName,
        email: visitor.email,
        gender,
        visitorType,
        address,
        institution,
        purpose,
        visitDate: visitor.visit_date,
        visitTime: visitor.time_slot,
        bookingId: visitor.booking_id
      },
      qrCode: base64Data,
      qrCodeDataUrl
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Error updating individual walk-in visitor:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update visitor information: ' + err.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Check-in individual walk-in visitor (for QR scanning)
router.post('/:visitorId/checkin', async (req, res) => {
  const { visitorId } = req.params;
  
  try {
    // Get visitor information with booking details
    const [visitorRows] = await pool.query(
      `SELECT v.*, b.date as visit_date, b.time_slot, b.status as booking_status, b.type as booking_type
       FROM visitors v
       JOIN bookings b ON v.booking_id = b.booking_id
       WHERE v.visitor_id = ? AND b.type = 'ind-walkin'`,
      [visitorId]
    );
    
    if (visitorRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Individual walk-in visitor not found'
      });
    }
    
    const visitor = visitorRows[0];
    
    // Check if booking is valid
    if (visitor.booking_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'This booking has been cancelled and cannot be checked in.',
        status: visitor.booking_status
      });
    }
    
    // Check if already checked in
    if (visitor.status === 'visited') {
      return res.status(400).json({
        success: false,
        error: 'This individual walk-in visitor has already been checked in.',
        status: visitor.status
      });
    }
    
    // Check if QR code has already been used
    if (visitor.qr_used) {
      return res.status(400).json({
        success: false,
        error: 'This QR code has already been used and cannot be scanned again.',
        qrUsed: true
      });
    }
    
    // Update visitor status to visited, set check-in time, and mark QR as used
    await pool.query(
      `UPDATE visitors SET status = 'visited', checkin_time = NOW(), qr_used = TRUE WHERE visitor_id = ?`,
      [visitorId]
    );
    
    // Get updated visitor information with check-in time
    const [updatedVisitorRows] = await pool.query(
      `SELECT v.*, b.date as visit_date, b.time_slot, b.type as booking_type
       FROM visitors v
       JOIN bookings b ON v.booking_id = b.booking_id
       WHERE v.visitor_id = ?`,
      [visitorId]
    );
    
    const updatedVisitor = updatedVisitorRows[0];
    
    try { 
      await logActivity(req, 'individual.walkin.checkin', { 
        visitorId, 
        bookingId: visitor.booking_id,
        visitorName: `${visitor.first_name} ${visitor.last_name}`
      }); 
    } catch {}
    
    res.json({
      success: true,
      message: 'Individual walk-in visitor checked in successfully!',
      visitor: {
        firstName: updatedVisitor.first_name,
        lastName: updatedVisitor.last_name,
        email: updatedVisitor.email,
        gender: updatedVisitor.gender,
        visitorType: updatedVisitor.visitor_type,
        address: updatedVisitor.address,
        institution: updatedVisitor.institution,
        purpose: updatedVisitor.purpose,
        visitDate: updatedVisitor.visit_date,
        visitTime: updatedVisitor.time_slot,
        checkin_time: updatedVisitor.checkin_time ? updatedVisitor.checkin_time.toISOString() : new Date().toISOString(),
        bookingType: updatedVisitor.booking_type,
        visitorType: 'individual_walkin'
      }
    });
    
  } catch (err) {
    console.error('Error checking in individual walk-in visitor:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to check in individual walk-in visitor: ' + err.message
    });
  }
});

module.exports = router;
