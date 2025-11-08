const express = require('express');
const pool = require('../db');
const router = express.Router();
const { logActivity } = require('../utils/activityLogger');

// Test endpoint to verify the route is working
router.get('/test', (req, res) => {
  res.json({ message: 'Additional visitors route is working!' });
});

// Get all visitors for a booking (both primary and additional)
router.get('/booking/:bookingId', async (req, res) => {
  const { bookingId } = req.params;
  
  console.log('🔍 Backend: Fetching ALL visitors for booking ID:', bookingId);
  
  try {
    // Get booking information first
    const [bookingInfo] = await pool.query(
      `SELECT * FROM bookings WHERE booking_id = ?`,
      [bookingId]
    );
    
    if (bookingInfo.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    const booking = bookingInfo[0];
    console.log('🔍 Backend: Booking info:', booking);
    
    // First, let's get visitors from the visitors table
    const [visitorsFromTable] = await pool.query(
      `SELECT 
        v.visitor_id,
        v.booking_id,
        v.first_name,
        v.last_name,
        v.gender,
        v.address,
        v.email,
        v.visitor_type,
        v.purpose,
        v.institution,
        v.status as visitor_status,
        v.checkin_time,
        v.is_main_visitor,
        v.created_at
       FROM visitors v
       WHERE v.booking_id = ?`,
      [bookingId]
    );
    
    console.log('🔍 Backend: Visitors from table:', visitorsFromTable);
    
    // Then, let's get additional visitors from the unified visitors table
    const [additionalVisitors] = await pool.query(
      `SELECT 
        v.visitor_id,
        v.booking_id,
        v.first_name,
        v.last_name,
        v.gender,
        v.address,
        v.email,
        v.visitor_type,
        v.purpose,
        v.institution,
        v.status,
        v.checkin_time,
        v.created_at,
        av.token_id,
        av.status as token_status
       FROM visitors v
       LEFT JOIN additional_visitors av ON v.visitor_id = av.visitor_id
       WHERE v.booking_id = ? AND v.is_main_visitor = 0`,
      [bookingId]
    );
    
    console.log('🔍 Backend: Additional visitors raw:', additionalVisitors);
    
    // Combine both results
    const allVisitors = [
      ...visitorsFromTable.map(v => ({
        ...v,
        source_type: 'visitor',
        token_id: null,
        additional_status: null
      })),
      ...additionalVisitors.map(av => {
        return {
          visitor_id: av.visitor_id,
          booking_id: av.booking_id,
          first_name: av.first_name || 'Additional',
          last_name: av.last_name || 'Visitor',
          gender: av.gender || 'Not specified',
          address: av.address || 'Not provided',
          email: av.email,
          visitorType: av.visitor_type || 'Group Member',
          purpose: av.purpose || 'educational',
          institution: av.institution || 'Not specified',
          visitor_status: av.status,
          checkin_time: av.checkin_time,
          is_main_visitor: 0,
          created_at: av.created_at,
          source_type: 'additional',
          token_id: av.token_id,
          additional_status: av.token_status
        };
      })
    ];
    
    console.log('🔍 Backend: Found', allVisitors.length, 'total visitors');
    console.log('🔍 Backend: Raw visitors data:', allVisitors);
    
    const visitors = allVisitors.map(visitor => ({
      visitorId: visitor.visitor_id,
      tokenId: visitor.token_id,
      email: visitor.email,
      firstName: visitor.first_name || 'Unknown',
      lastName: visitor.last_name || 'Visitor',
      gender: visitor.gender || 'Not specified',
      address: visitor.address || 'Not provided',
      visitorType: visitor.visitor_type || visitor.visitorType || 'Visitor',
      institution: visitor.institution || 'Not specified',
      purpose: visitor.purpose || 'educational',
      checkinTime: visitor.checkin_time,
      status: visitor.source_type === 'additional' ? visitor.additional_status : visitor.visitor_status,
      isMainVisitor: visitor.is_main_visitor === 1,
      sourceType: visitor.source_type,
      createdAt: visitor.created_at
    }));
    
    console.log('🔍 Backend: Processed visitors:', visitors);
    
    res.json({
      success: true,
      booking: {
        bookingId: booking.booking_id,
        type: booking.type,
        status: booking.status,
        date: booking.date,
        timeSlot: booking.time_slot,
        totalVisitors: booking.total_visitors || allVisitors.length
      },
      visitors: visitors
    });
    
  } catch (err) {
    console.error('Error fetching all visitors:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch visitors: ' + err.message
    });
  }
});

// Get additional visitor token info
router.get('/token/:tokenId', async (req, res) => {
  const { tokenId } = req.params;
  
  try {
    // Get token information with booking details and primary visitor's institution
    const [tokenRows] = await pool.query(
      `SELECT av.*, b.date as visit_date, b.time_slot, b.status as booking_status, b.type as booking_type,
              v.institution as primary_institution, v.purpose as primary_purpose
       FROM additional_visitors av
       JOIN bookings b ON av.booking_id = b.booking_id
       LEFT JOIN visitors v ON v.booking_id = b.booking_id AND v.is_main_visitor = true
       WHERE av.token_id = ?`,
      [tokenId]
    );
    
    if (tokenRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Token not found or expired'
      });
    }
    
    const tokenInfo = tokenRows[0];
    
    // Check if booking is still valid
    if (tokenInfo.booking_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'This booking has been cancelled'
      });
    }
    
    // Check if token has expired (for walk-in types)
    if (tokenInfo.expires_at && new Date() > new Date(tokenInfo.expires_at)) {
      return res.status(400).json({
        success: false,
        error: 'This link has expired. Please contact the museum for assistance.',
        linkExpired: true
      });
    }
    
    // Check if QR code has already been used (form should be inaccessible after check-in)
    if (tokenInfo.visitor_id) {
      const [visitorCheck] = await pool.query(
        `SELECT qr_used, status FROM visitors WHERE visitor_id = ?`,
        [tokenInfo.visitor_id]
      );
      
      if (visitorCheck.length > 0) {
        const visitor = visitorCheck[0];
        if (visitor.qr_used === 1 || visitor.qr_used === true || visitor.status === 'visited') {
          return res.status(400).json({
            success: false,
            error: 'This form has already been completed and the QR code has been used. The form is no longer accessible.',
            qrUsed: true
          });
        }
      }
    }
    
    res.json({
      success: true,
      tokenInfo: {
        tokenId: tokenInfo.token_id,
        email: tokenInfo.email,
        status: tokenInfo.status,
        visitDate: tokenInfo.visit_date,
        visitTime: tokenInfo.time_slot,
        bookingType: tokenInfo.booking_type,
        primaryInstitution: tokenInfo.primary_institution,
        primaryPurpose: tokenInfo.primary_purpose,
        linkExpired: tokenInfo.expires_at ? (new Date() > new Date(tokenInfo.expires_at)) : false,
        details: tokenInfo.details ? JSON.parse(tokenInfo.details) : null
      }
    });
    
  } catch (err) {
    console.error('Error fetching token info:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token information'
    });
  }
});

// Update additional visitor details
router.put('/:tokenId', async (req, res) => {
  const { tokenId } = req.params;
  const { firstName, lastName, gender, address, visitorType, institution, purpose } = req.body;
  
  try {
    // First, get token information
    const [tokenRows] = await pool.query(
      `SELECT av.*, b.status as booking_status
       FROM additional_visitors av
       JOIN bookings b ON av.booking_id = b.booking_id
       WHERE av.token_id = ?`,
      [tokenId]
    );
    
    if (tokenRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Token not found or expired'
      });
    }
    
    const tokenInfo = tokenRows[0];
    
    // Check if booking is still valid
    if (tokenInfo.booking_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'This booking has been cancelled'
      });
    }
    
    // Check if already completed
    if (tokenInfo.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'This form has already been submitted and cannot be submitted again.',
        linkExpired: true
      });
    }
    
    // Check if link has expired
    if (tokenInfo.expires_at && new Date() > new Date(tokenInfo.expires_at)) {
      return res.status(400).json({
        success: false,
        error: 'This link has expired. Please contact the museum for assistance.',
        linkExpired: true
      });
    }
    
    // Check if QR code has already been used (form should be inaccessible after check-in)
    if (tokenInfo.visitor_id) {
      const [visitorCheck] = await pool.query(
        `SELECT qr_used, status FROM visitors WHERE visitor_id = ?`,
        [tokenInfo.visitor_id]
      );
      
      if (visitorCheck.length > 0) {
        const visitor = visitorCheck[0];
        if (visitor.qr_used === 1 || visitor.qr_used === true || visitor.status === 'visited') {
          return res.status(400).json({
            success: false,
            error: 'This form has already been completed and the QR code has been used. The form is no longer accessible.',
            qrUsed: true
          });
        }
      }
    }
    
    // Get booking type to determine if this is group walk-in
    const [bookingRows] = await pool.query(
      `SELECT type FROM bookings WHERE booking_id = ?`,
      [tokenInfo.booking_id]
    );
    
    const isGroupWalkin = bookingRows.length > 0 && bookingRows[0].type === 'group-walkin';
    
    let institution, purpose;
    
    if (isGroupWalkin) {
      // For group walk-in, get institution and purpose from the group leader (primary visitor)
      const [primaryVisitorRows] = await pool.query(
        `SELECT institution, purpose FROM visitors WHERE booking_id = ? AND is_main_visitor = true`,
        [tokenInfo.booking_id]
      );
      
      institution = primaryVisitorRows.length > 0 ? primaryVisitorRows[0].institution : '';
      purpose = primaryVisitorRows.length > 0 ? primaryVisitorRows[0].purpose : 'educational';
    } else {
      // For regular additional visitors, get from primary visitor
      const [primaryVisitorRows] = await pool.query(
        `SELECT institution, purpose FROM visitors WHERE booking_id = ? AND is_main_visitor = true`,
        [tokenInfo.booking_id]
      );
      
      // Additional visitors MUST inherit institution and purpose from primary visitor
      if (primaryVisitorRows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Primary visitor not found. Cannot proceed with form submission.'
        });
      }
      
      institution = primaryVisitorRows[0].institution;
      purpose = primaryVisitorRows[0].purpose;
    }
    
    // Prepare details object - use form data, inherit institution/purpose from primary visitor
    const details = {
      firstName: firstName || '',
      lastName: lastName || '',
      gender: gender || '',
      address: address || '',
      visitorType: visitorType || 'local',
      institution: institution, // Inherited from primary visitor
      purpose: purpose // Inherited from primary visitor
    };
    
    console.log('📝 Form data being saved:', details);
    
    // Update the existing QR code with visitor details embedded
    // Instead of generating a new QR, we'll update the existing one
    const QRCode = require('qrcode');
    
    // IMPORTANT: Get the premade backup code from the database (not from QR code image)
    // The backup code should already be stored in visitors.backup_code when booking was created
    const [visitorData] = await pool.query(
      `SELECT qr_code, backup_code FROM visitors WHERE email = ? AND booking_id = ? AND is_main_visitor = false`,
      [tokenInfo.email, tokenInfo.booking_id]
    );
    
    let existingQrCode = null;
    let shortBackupCode = null;
    
    if (visitorData.length > 0) {
      existingQrCode = visitorData[0].qr_code;
      // Use the backup code from the database (premade during booking)
      shortBackupCode = visitorData[0].backup_code;
      console.log(`✅ Found premade backup code in database: "${shortBackupCode}"`);
      console.log(`📱 Using pre-generated QR code from database`);
    }
    
    // If no backup code in database, try to extract from QR code (legacy support)
    if (!shortBackupCode && existingQrCode) {
      try {
        // QR codes are PNG images, but the JSON data was embedded when creating it
        // We can't easily decode PNG images, so this is a fallback
        console.log('⚠️ No backup code in database, trying to extract from QR code...');
        const qrCodeData = Buffer.from(existingQrCode, 'base64').toString('utf-8');
        const qrData = JSON.parse(qrCodeData);
        shortBackupCode = qrData.backupCode || qrData.visitorId;
        console.log(`🔑 Extracted backup code from QR: ${shortBackupCode}`);
      } catch (err) {
        console.error('❌ Error extracting backup code from QR:', err);
        // Don't use FALLBACK - use visitor_id as fallback instead
        console.log('⚠️ Using visitor_id as backup code fallback');
      }
    }
    
    // Don't generate new QR code - use Juan's pre-generated one
    const base64Data = existingQrCode;
    
    // Check if visitor record already exists (from booking creation)
    const [existingVisitor] = await pool.query(
      `SELECT visitor_id, first_name, last_name, backup_code FROM visitors 
       WHERE email = ? AND booking_id = ? AND is_main_visitor = false`,
      [tokenInfo.email, tokenInfo.booking_id]
    );
    
    console.log(`🔍 Checking for existing visitor record:`, {
      email: tokenInfo.email,
      booking_id: tokenInfo.booking_id,
      found: existingVisitor.length > 0,
      existing_data: existingVisitor.length > 0 ? existingVisitor[0] : null,
      backup_code_from_query: shortBackupCode
    });
    
    let visitorId;
    
    if (existingVisitor.length > 0) {
      // Update existing visitor record with form data
      visitorId = existingVisitor[0].visitor_id;
      
      // IMPORTANT: Preserve the original premade backup code from database
      // Only use the extracted one if database doesn't have it (and it's not FALLBACK)
      const originalBackupCode = existingVisitor[0].backup_code;
      const finalBackupCode = (originalBackupCode && originalBackupCode.trim() !== '' && originalBackupCode !== 'FALLBACK')
        ? originalBackupCode.trim().toUpperCase()
        : (shortBackupCode || String(visitorId));
      
      console.log(`🔄 Updating existing visitor record ${visitorId} with:`, {
        firstName, lastName, gender, address, visitorType, purpose, institution, 
        email: tokenInfo.email, 
        original_backup_code: originalBackupCode,
        final_backup_code: finalBackupCode
      });
      
      // IMPORTANT: Preserve original premade backup code, update with form data
      await pool.query(
        `UPDATE visitors SET 
         first_name = ?, last_name = ?, gender = ?, address = ?, email = ?,
         visitor_type = ?, purpose = ?, institution = ?, status = 'approved', qr_code = ?, backup_code = ?
         WHERE visitor_id = ?`,
        [firstName, lastName, gender, address, tokenInfo.email, visitorType, purpose, institution, base64Data, finalBackupCode, visitorId]
      );
      console.log(`✅ Updated existing visitor record ${visitorId}`);
      console.log(`🔑 Preserved/updated backup_code: "${finalBackupCode}" (was: "${originalBackupCode}")`);
    } else {
      // Create new visitor record (fallback - should rarely happen for group bookings)
      // Ensure we have a backup code - use visitor_id if none found
      const finalBackupCodeForNew = shortBackupCode || 'TEMP';
      
      const [visitorResult] = await pool.query(
        `INSERT INTO visitors (
          booking_id, first_name, last_name, gender, address, email, 
          visitor_type, purpose, institution, status, is_main_visitor, qr_code, backup_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', false, ?, ?)`,
        [
          tokenInfo.booking_id,
          firstName,
          lastName,
          gender,
          address,
          tokenInfo.email,
          visitorType,
          purpose,
          institution,
          base64Data,
          finalBackupCodeForNew
        ]
      );
      visitorId = visitorResult.insertId;
      
      // If we used TEMP, update with visitor_id as backup code
      if (finalBackupCodeForNew === 'TEMP') {
        await pool.query(
          `UPDATE visitors SET backup_code = ? WHERE visitor_id = ?`,
          [String(visitorId), visitorId]
        );
        console.log(`✅ Created new visitor record ${visitorId} with backup_code: ${visitorId}`);
      } else {
        console.log(`✅ Created new visitor record ${visitorId} with backup_code: ${finalBackupCodeForNew}`);
      }
    }
    
    // Backup code is already pre-generated and stored in the database
    console.log(`✅ Using pre-generated backup code: ${shortBackupCode}`);
    
    // Mark the token as completed and link to visitor record
    await pool.query(
      `UPDATE additional_visitors SET status = 'completed', visitor_id = ? WHERE token_id = ?`,
      [visitorId, tokenId]
    );
    
    console.log(`✅ Additional visitor form completed for token ${tokenId}, data saved to visitors table`);
    
    // No second email needed - everything is in the first email
    
    try { await logActivity(req, 'additional_visitor.update', { tokenId }); } catch {}
    
    res.json({
      success: true,
      message: '✅ Form completed! Your visitor record has been created and QR code is ready for check-in.',
      details,
      visitorId: visitorId,
      qrCode: base64Data,
      qrCodeDataUrl: `data:image/png;base64,${base64Data}`
    });
    
  } catch (err) {
    console.error('Error updating visitor details:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update visitor details'
    });
  }
});

// Check-in additional visitor (for QR scanning) - Updated for unified visitors table
router.post('/:tokenId/checkin', async (req, res) => {
  const { tokenId } = req.params;
  const { qrCodeData } = req.body; // Accept QR code data from request body
  
  try {
    console.log('🔍 === ADDITIONAL VISITOR CHECK-IN DEBUG START ===');
    console.log('🎫 Token ID:', tokenId);
    console.log('📱 QR Code Data:', qrCodeData);
    
    // Parse QR code data to get visitor information
    let qrData = {};
    let visitorDetails = {};
    let bookingId = null;
    let visitorId = null;
    
    if (qrCodeData) {
      try {
        qrData = JSON.parse(qrCodeData);
        console.log('📋 Parsed QR data:', qrData);
        
        // Extract different possible data structures from QR code
        visitorDetails = qrData.visitorDetails || qrData || {};
        bookingId = qrData.bookingId || qrData.booking_id;
        visitorId = qrData.visitorId || qrData.visitor_id;
        
        console.log('👤 Visitor details from QR:', visitorDetails);
        console.log('📅 Booking ID from QR:', bookingId);
        console.log('🆔 Visitor ID from QR:', visitorId);
      } catch (parseError) {
        console.error('❌ Error parsing QR code data:', parseError);
        return res.status(400).json({
          success: false,
          error: 'Invalid QR code data format'
        });
      }
    }
    
    // Get booking information
    let bookingInfo = null;
    if (bookingId) {
      const [bookingRows] = await pool.query(
        `SELECT * FROM bookings WHERE booking_id = ?`,
        [bookingId]
      );
      
      if (bookingRows.length > 0) {
        bookingInfo = bookingRows[0];
        console.log('📅 Booking info:', bookingInfo);
        
        // Check if booking is valid
        if (bookingInfo.status === 'cancelled') {
          return res.status(400).json({
            success: false,
            error: 'This booking has been cancelled and cannot be checked in.',
            status: bookingInfo.status
          });
        }
      }
    }
    
    // Look for existing visitor record using multiple strategies
    let existingVisitor = null;
    
    // Strategy 1: Find by visitor ID if available
    if (visitorId && !existingVisitor) {
      const [visitorRows] = await pool.query(
        `SELECT v.*, b.date as visit_date, b.time_slot, b.status as booking_status
         FROM visitors v
         JOIN bookings b ON v.booking_id = b.booking_id
         WHERE v.visitor_id = ? AND v.is_main_visitor = false`,
        [visitorId]
      );
      
      if (visitorRows.length > 0) {
        existingVisitor = visitorRows[0];
        console.log('👤 Found visitor by visitor ID:', existingVisitor);
      }
    }
    
    // Strategy 2: Find by email and booking ID
    if (!existingVisitor && visitorDetails.email && bookingId) {
      const [visitorRows] = await pool.query(
        `SELECT v.*, b.date as visit_date, b.time_slot, b.status as booking_status
         FROM visitors v
         JOIN bookings b ON v.booking_id = b.booking_id
         WHERE v.email = ? AND v.booking_id = ? AND v.is_main_visitor = false`,
        [visitorDetails.email, bookingId]
      );
      
      if (visitorRows.length > 0) {
        existingVisitor = visitorRows[0];
        console.log('👤 Found visitor by email and booking ID:', existingVisitor);
      }
    }
    
    // Strategy 3: Find by token ID in QR code data
    if (!existingVisitor && tokenId) {
      const [visitorRows] = await pool.query(
        `SELECT v.*, b.date as visit_date, b.time_slot, b.status as booking_status
         FROM visitors v
         JOIN bookings b ON v.booking_id = b.booking_id
         WHERE (v.qr_code LIKE ? OR v.visitor_id = ?) AND v.is_main_visitor = false`,
        [`%${tokenId}%`, tokenId]
      );
      
      if (visitorRows.length > 0) {
        existingVisitor = visitorRows[0];
        console.log('👤 Found visitor by token ID:', existingVisitor);
      }
    }
    
    // Strategy 4: Find by email only (fallback)
    if (!existingVisitor && visitorDetails.email) {
      const [visitorRows] = await pool.query(
        `SELECT v.*, b.date as visit_date, b.time_slot, b.status as booking_status
         FROM visitors v
         JOIN bookings b ON v.booking_id = b.booking_id
         WHERE v.email = ? AND v.is_main_visitor = false
         ORDER BY v.visitor_id DESC LIMIT 1`,
        [visitorDetails.email]
      );
      
      if (visitorRows.length > 0) {
        existingVisitor = visitorRows[0];
        console.log('👤 Found visitor by email only:', existingVisitor);
      }
    }
    
    let finalVisitorId;
    let finalVisitorData = {};
    
    if (existingVisitor) {
      // Update existing visitor record
      finalVisitorId = existingVisitor.visitor_id;
      
      // Check if already checked in
      if (existingVisitor.status === 'visited' && existingVisitor.checkin_time) {
        return res.status(400).json({
          success: false,
          error: 'This visitor has already been checked in.',
          status: 'checked-in'
        });
      }
      
      // Update visitor with check-in information
      await pool.query(
        `UPDATE visitors 
         SET status = 'visited', checkin_time = NOW()
         WHERE visitor_id = ?`,
        [finalVisitorId]
      );
      
      // Use existing data and merge with QR data - prioritize database data
      finalVisitorData = {
        firstName: existingVisitor.first_name || visitorDetails.firstName || '',
        lastName: existingVisitor.last_name || visitorDetails.lastName || '',
        email: existingVisitor.email || visitorDetails.email || '',
        gender: existingVisitor.gender || visitorDetails.gender || 'Not specified',
        visitorType: existingVisitor.visitor_type || visitorDetails.visitorType || 'Additional Visitor',
        address: existingVisitor.address || visitorDetails.address || 'Not provided',
        institution: existingVisitor.institution || visitorDetails.institution || 'N/A',
        purpose: existingVisitor.purpose || visitorDetails.purpose || 'educational',
        visitDate: existingVisitor.visit_date || (bookingInfo ? bookingInfo.date : null),
        visitTime: existingVisitor.time_slot || (bookingInfo ? bookingInfo.time_slot : null),
        checkin_time: new Date().toISOString()
      };
      
      console.log('✅ Updated existing visitor record:', finalVisitorId);
      console.log('👤 Final visitor data from existing record:', finalVisitorData);
    } else {
      // Create new visitor record
      if (!bookingId || !visitorDetails.email) {
        return res.status(400).json({
          success: false,
          error: 'Missing required information: booking ID and email are required'
        });
      }
      
      const [visitorResult] = await pool.query(
        `INSERT INTO visitors (
          booking_id, first_name, last_name, gender, address, email, 
          visitor_type, purpose, institution, status, is_main_visitor, 
          created_at, checkin_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'visited', false, NOW(), NOW())`,
        [
          bookingId,
          visitorDetails.firstName || '',
          visitorDetails.lastName || '',
          visitorDetails.gender || '',
          visitorDetails.address || '',
          visitorDetails.email,
          visitorDetails.visitorType || 'Additional Visitor',
          visitorDetails.purpose || 'educational',
          visitorDetails.institution || 'N/A'
        ]
      );
      
      finalVisitorId = visitorResult.insertId;
      
      finalVisitorData = {
        firstName: visitorDetails.firstName || '',
        lastName: visitorDetails.lastName || '',
        email: visitorDetails.email,
        gender: visitorDetails.gender || 'Not specified',
        visitorType: visitorDetails.visitorType || 'Additional Visitor',
        address: visitorDetails.address || 'Not provided',
        institution: visitorDetails.institution || 'N/A',
        purpose: visitorDetails.purpose || 'educational',
        visitDate: bookingInfo ? bookingInfo.date : null,
        visitTime: bookingInfo ? bookingInfo.time_slot : null,
        checkin_time: new Date().toISOString()
      };
      
      console.log('✅ Created new visitor record:', finalVisitorId);
      console.log('👤 Final visitor data from new record:', finalVisitorData);
    }
    
    // Log activity
    try { 
      await logActivity(req, 'additional_visitor.checkin', { 
        tokenId, 
        visitorId: finalVisitorId, 
        bookingId: bookingId || existingVisitor?.booking_id 
      }); 
    } catch (logError) {
      console.warn('⚠️ Failed to log activity:', logError);
    }
    
    console.log('🎉 === ADDITIONAL VISITOR CHECK-IN SUCCESS ===');
    console.log('👤 Final visitor data:', finalVisitorData);
    
    res.json({
      success: true,
      message: 'Additional visitor checked in successfully!',
      visitor: finalVisitorData
    });
    
  } catch (err) {
    console.error('❌ === ADDITIONAL VISITOR CHECK-IN ERROR ===');
    console.error('❌ Error details:', err);
    console.error('❌ Error message:', err.message);
    console.error('❌ Error stack:', err.stack);
    
    res.status(500).json({
      success: false,
      error: 'Failed to check in visitor: ' + err.message
    });
  }
});

// Debug endpoint to help troubleshoot QR code data
router.post('/debug-qr', async (req, res) => {
  const { qrCodeData } = req.body;
  
  try {
    console.log('🔍 === QR CODE DEBUG START ===');
    console.log('📱 Raw QR Code Data:', qrCodeData);
    
    if (!qrCodeData) {
      return res.json({
        success: false,
        error: 'No QR code data provided'
      });
    }
    
    const qrData = JSON.parse(qrCodeData);
    console.log('📋 Parsed QR Data:', qrData);
    
    // Try to find visitor using different strategies
    const strategies = [];
    
    // Strategy 1: By visitor ID
    if (qrData.visitorId || qrData.visitor_id) {
      const visitorId = qrData.visitorId || qrData.visitor_id;
      const [visitorRows] = await pool.query(
        `SELECT v.*, b.date as visit_date, b.time_slot, b.status as booking_status
         FROM visitors v
         JOIN bookings b ON v.booking_id = b.booking_id
         WHERE v.visitor_id = ? AND v.is_main_visitor = false`,
        [visitorId]
      );
      
      strategies.push({
        name: 'By Visitor ID',
        visitorId: visitorId,
        found: visitorRows.length > 0,
        data: visitorRows.length > 0 ? visitorRows[0] : null
      });
    }
    
    // Strategy 2: By email and booking ID
    if (qrData.email && (qrData.bookingId || qrData.booking_id)) {
      const email = qrData.email;
      const bookingId = qrData.bookingId || qrData.booking_id;
      
      const [visitorRows] = await pool.query(
        `SELECT v.*, b.date as visit_date, b.time_slot, b.status as booking_status
         FROM visitors v
         JOIN bookings b ON v.booking_id = b.booking_id
         WHERE v.email = ? AND v.booking_id = ? AND v.is_main_visitor = false`,
        [email, bookingId]
      );
      
      strategies.push({
        name: 'By Email and Booking ID',
        email: email,
        bookingId: bookingId,
        found: visitorRows.length > 0,
        data: visitorRows.length > 0 ? visitorRows[0] : null
      });
    }
    
    // Strategy 3: By email only
    if (qrData.email) {
      const email = qrData.email;
      
      const [visitorRows] = await pool.query(
        `SELECT v.*, b.date as visit_date, b.time_slot, b.status as booking_status
         FROM visitors v
         JOIN bookings b ON v.booking_id = b.booking_id
         WHERE v.email = ? AND v.is_main_visitor = false
         ORDER BY v.visitor_id DESC LIMIT 1`,
        [email]
      );
      
      strategies.push({
        name: 'By Email Only',
        email: email,
        found: visitorRows.length > 0,
        data: visitorRows.length > 0 ? visitorRows[0] : null
      });
    }
    
    console.log('🔍 === QR CODE DEBUG END ===');
    
    res.json({
      success: true,
      qrData: qrData,
      strategies: strategies,
      message: 'QR code debug completed'
    });
    
  } catch (err) {
    console.error('❌ QR Code Debug Error:', err);
    res.status(500).json({
      success: false,
      error: 'Debug failed: ' + err.message
    });
  }
});

module.exports = router;
