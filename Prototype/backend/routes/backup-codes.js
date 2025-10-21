const express = require('express');
const pool = require('../db');
const router = express.Router();

// Note: We no longer need the /generate endpoint since we use existing visitor IDs as backup codes

// Validate a backup code (using visitor ID) - Updated for unified visitors table
router.post('/validate', async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ 
      success: false, 
      error: 'Backup code is required' 
    });
  }
  
  try {
    console.log('🔍 === BACKUP CODE VALIDATION DEBUG START ===');
    console.log('🎫 Backup Code:', code);
    
    // First, try to find in the unified visitors table
    // Check for direct visitor_id, backup_code, or extract visitorId from QR code data
    let [visitorRows] = await pool.query(
      `SELECT v.*, b.date, b.time_slot, b.type as booking_type, b.status as booking_status
       FROM visitors v
       JOIN bookings b ON v.booking_id = b.booking_id
       WHERE v.visitor_id = ? OR v.backup_code = ? OR v.qr_code LIKE ?`,
      [code, code, `%${code}%`]
    );
    
    console.log(`🔍 Direct query found ${visitorRows.length} visitors`);
    if (visitorRows.length > 0) {
      console.log(`✅ Found visitor with backup_code: ${visitorRows[0].backup_code}`);
    }
    
    // If no direct match, try to extract backup code from QR code data
    if (visitorRows.length === 0) {
      console.log('🔍 No direct match found, checking QR code data for backup code...');
      
      // Get all visitors and check their QR code data
      const [allVisitors] = await pool.query(
        `SELECT v.*, b.date, b.time_slot, b.type as booking_type, b.status as booking_status
         FROM visitors v
         JOIN bookings b ON v.booking_id = b.booking_id
         WHERE v.qr_code IS NOT NULL`
      );
      
      for (const visitor of allVisitors) {
        try {
          // Decode the QR code data
          const qrCodeData = Buffer.from(visitor.qr_code, 'base64').toString('utf-8');
          const qrData = JSON.parse(qrCodeData);
          
          // Check if the code matches the backupCode or visitorId in the QR code
          if (qrData.backupCode === code || qrData.visitorId === code) {
            console.log('✅ Found match in QR code data:', qrData.backupCode || qrData.visitorId);
            visitorRows = [visitor];
            break;
          }
        } catch (err) {
          // Skip if QR code data is invalid
          continue;
        }
      }
    }
    
    // All visitor information is stored in the visitors table
    // No need to check additional_visitors table since data is moved there
    
    console.log('🔍 Found visitor rows:', visitorRows.length);
    
    if (visitorRows.length === 0) {
      console.log('❌ No visitor found with code:', code);
      return res.status(400).json({
        success: false,
        error: 'Invalid visitor ID or token'
      });
    }
    
    const visitor = visitorRows[0];
    console.log('👤 Visitor data:', visitor);
    console.log('🔍 Is additional visitor:', visitor.is_additional_visitor);
    console.log('🔍 Visitor status:', visitor.status);
    console.log('🔍 Booking status:', visitor.booking_status);
    
    // Check if booking is valid
    if (visitor.booking_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'This booking has been cancelled and cannot be checked in.',
        status: visitor.booking_status
      });
    }
    
    // Check if already checked in
    if (visitor.status === 'visited' && visitor.checkin_time) {
      return res.status(400).json({
        success: false,
        error: 'This visitor has already been checked in.',
        status: 'checked-in'
      });
    }
    
    // Check if visitor has completed their details
    // Allow check-in if visitor has completed form (has first_name, last_name, etc.) or has valid status
    const hasCompletedForm = visitor.first_name && visitor.last_name && visitor.first_name.trim() !== '' && visitor.last_name.trim() !== '';
    const hasValidStatus = visitor.status === 'completed' || visitor.status === 'approved' || visitor.status === 'pending';
    
    // Check if visitor has completed their details
    if (!hasCompletedForm && !hasValidStatus) {
      return res.status(400).json({
        success: false,
        error: 'Please complete your visitor information first before checking in.',
        status: 'incomplete'
      });
    }
    
    // Determine visitor type and create visitor info
    let visitorInfo = {
      ...visitor,
      firstName: visitor.first_name || '',
      lastName: visitor.last_name || '',
      email: visitor.email || '',
      gender: visitor.gender || 'Not specified',
      address: visitor.address || 'Not provided',
      institution: visitor.institution || 'Not specified',
      purpose: visitor.purpose || 'educational',
      visitDate: visitor.date,
      visitTime: visitor.time_slot,
      bookingType: visitor.booking_type,
      isPrimary: visitor.is_main_visitor === 1,
      checkin_time: new Date().toISOString()
    };
    
    // Set appropriate visitor type
    if (visitor.is_main_visitor === 1) {
      if (visitor.booking_type === 'ind-walkin' || visitor.booking_type === 'group-walkin') {
        visitorInfo.visitorType = 'walkin_visitor';
        visitorInfo.displayType = 'Walk-in Visitor';
      } else {
        visitorInfo.visitorType = 'primary_visitor';
        visitorInfo.displayType = 'Primary Visitor';
      }
    } else {
      visitorInfo.visitorType = 'group_walkin_member';
      visitorInfo.displayType = 'Group Walk-in Member';
    }
    
    console.log('👤 Final visitor info:', visitorInfo);
    
    // Update check-in status in visitors table
    await pool.query(
      `UPDATE visitors SET status = 'visited', checkin_time = NOW() WHERE visitor_id = ?`,
      [visitor.visitor_id]
    );
    
    console.log('✅ Updated visitor check-in status');
    
    res.json({
      success: true,
      visitor: visitorInfo,
      message: 'Visitor ID validated successfully'
    });
    
  } catch (err) {
    console.error('❌ === BACKUP CODE VALIDATION ERROR ===');
    console.error('❌ Error details:', err);
    console.error('❌ Error message:', err.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to validate visitor ID: ' + err.message
    });
  }
});

module.exports = router;
