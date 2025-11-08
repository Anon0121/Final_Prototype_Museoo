const express = require('express');
const pool = require('../db');
const router = express.Router();
const { logActivity } = require('../utils/activityLogger');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');

// GET - Fetch group walk-in visitor data by token
router.get('/:token', async (req, res) => {
  const { token } = req.params;
  
  try {
    // Find the visitor by token in additional_visitors table
    const [visitorRows] = await pool.query(
      `SELECT * FROM additional_visitors WHERE token_id = ?`,
      [token]
    );

    if (visitorRows.length === 0) {
      return res.json({ 
        success: false, 
        message: 'Visitor not found or token has expired' 
      });
    }

    const visitor = visitorRows[0];

    // Check if token has expired (24 hours)
    if (visitor.expires_at && new Date() > new Date(visitor.expires_at)) {
      return res.json({ 
        success: false, 
        message: 'This form link has expired. Please contact the museum for assistance.' 
      });
    }

    // Check if form has already been completed
    if (visitor.status === 'completed') {
      return res.json({ 
        success: false, 
        message: 'This form has already been completed. Please contact the museum if you need to make changes.' 
      });
    }

    res.json({
      success: true,
      visitor: {
        token_id: visitor.token_id,
        email: visitor.email,
        first_name: visitor.first_name || '',
        last_name: visitor.last_name || '',
        gender: visitor.gender || '',
        visitor_type: visitor.visitor_type || 'local',
        address: visitor.address || '',
        institution: visitor.institution || '',
        purpose: visitor.purpose || '',
        status: visitor.status
      }
    });

  } catch (error) {
    console.error('Error fetching group walk-in visitor:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching visitor data' 
    });
  }
});

// PUT - Update group walk-in visitor information
router.put('/:token', async (req, res) => {
  const { token } = req.params;
  const {
    firstName,
    lastName,
    gender,
    visitorType,
    email,
    address,
    institution,
    purpose
  } = req.body;

  try {
    // Validate required fields
    if (!firstName || !lastName || !gender || !visitorType || !email || !address) {
      return res.json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    // Check if visitor exists and token is valid
    const [visitorRows] = await pool.query(
      `SELECT * FROM additional_visitors WHERE token_id = ?`,
      [token]
    );

    if (visitorRows.length === 0) {
      return res.json({
        success: false,
        message: 'Visitor not found or token has expired'
      });
    }

    const visitor = visitorRows[0];

    // Check if token has expired
    if (visitor.expires_at && new Date() > new Date(visitor.expires_at)) {
      return res.json({
        success: false,
        message: 'This form link has expired. Please contact the museum for assistance.'
      });
    }

    // Check if form has already been completed
    if (visitor.status === 'completed') {
      return res.json({
        success: false,
        message: 'This form has already been completed. Please contact the museum if you need to make changes.'
      });
    }

    // Update visitor information
    await pool.query(
      `UPDATE additional_visitors SET 
        first_name = ?, 
        last_name = ?, 
        gender = ?, 
        visitor_type = ?, 
        email = ?, 
        address = ?, 
        institution = ?, 
        purpose = ?, 
        status = 'completed',
        updated_at = NOW()
       WHERE token_id = ?`,
      [firstName, lastName, gender, visitorType, email, address, institution, purpose, token]
    );

    // Generate QR code for this visitor
    const qrData = {
      type: 'group_walkin_visitor',
      tokenId: token,
      bookingId: visitor.booking_id,
      email: email,
      visitorName: `${firstName} ${lastName}`
    };

    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');

    // Check if visitor record exists first to get visitor_id and existing backup code
    const [existingVisitorRecord] = await pool.query(
      `SELECT visitor_id, backup_code FROM visitors 
       WHERE email = ? AND booking_id = ? AND is_main_visitor = false`,
      [email, visitor.booking_id]
    );

    // Preserve existing backup code if it exists, otherwise use visitor_id as backup code
    // This matches the group leader approach - preserves random code from initial email
    let backupCode = null;
    let visitorIdForBackup = null;
    
    if (existingVisitorRecord.length > 0) {
      visitorIdForBackup = existingVisitorRecord[0].visitor_id;
      // Preserve existing backup code if it exists, otherwise use visitor_id
      // Ensure backup code is always a string for consistency
      backupCode = existingVisitorRecord[0].backup_code ? String(existingVisitorRecord[0].backup_code) : String(visitorIdForBackup);
      console.log(`🔍 Found existing visitor record, backup code: ${backupCode}`);
    }

    // Update QR code data to include backup code (will be set after we know visitor_id)
    // For now, we'll update it after we have the visitor_id
    let updatedBase64Data;
    if (backupCode) {
      qrData.backupCode = backupCode;
      const updatedQrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));
      updatedBase64Data = updatedQrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    } else {
      // Generate QR code without backup code first, will update later
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));
      updatedBase64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    }

    // Store QR code and backup code in additional_visitors
    // Try to update backup_code column, but handle if it doesn't exist
    try {
      await pool.query(
        `UPDATE additional_visitors SET 
          qr_code = ?, 
          backup_code = ? 
         WHERE token_id = ?`,
        [updatedBase64Data, backupCode, token]
      );
    } catch (err) {
      // If backup_code column doesn't exist, just update qr_code
      if (err.message.includes('backup_code')) {
        console.log('⚠️ backup_code column not found in additional_visitors, updating qr_code only...');
        await pool.query(
          `UPDATE additional_visitors SET 
            qr_code = ? 
           WHERE token_id = ?`,
          [updatedBase64Data, token]
        );
      } else {
        throw err;
      }
    }

    if (existingVisitorRecord.length > 0) {
      // Update existing visitor record with complete information
      // IMPORTANT: Preserve the original backup_code that was created during booking
      // Only update backup_code if it's NULL or empty, otherwise keep the original premade code
      const originalBackupCode = existingVisitorRecord[0].backup_code;
      const finalBackupCode = (originalBackupCode && originalBackupCode.trim() !== '') 
        ? originalBackupCode.trim().toUpperCase() 
        : (backupCode || String(visitorIdForBackup));
      
      await pool.query(
        `UPDATE visitors SET 
         first_name = ?, 
         last_name = ?, 
         gender = ?, 
         address = ?, 
         email = ?,
         visitor_type = ?, 
         purpose = ?, 
         institution = ?, 
         backup_code = ?,
         qr_code = ?,
         status = 'approved'
         WHERE visitor_id = ?`,
        [firstName, lastName, gender, address, email, visitorType, purpose, institution, finalBackupCode, updatedBase64Data, visitorIdForBackup]
      );
      console.log(`✅ Updated existing visitor record ${visitorIdForBackup}`);
      console.log(`🔑 Original premade backup_code: "${originalBackupCode}", Final backup_code: "${finalBackupCode}"`);
      console.log(`🔍 Verification: backup_code stored in DB is: "${finalBackupCode}"`);
    } else {
      // Create new visitor record in visitors table
      const [visitorResult] = await pool.query(
        `INSERT INTO visitors (
          booking_id, first_name, last_name, gender, address, email, 
          visitor_type, purpose, institution, status, is_main_visitor, qr_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', false, ?)`,
        [visitor.booking_id, firstName, lastName, gender, address, email, visitorType, purpose, institution, updatedBase64Data]
      );
      
      const newVisitorId = visitorResult.insertId;
      // Use the new visitor_id as backup code (same as leader)
      // Ensure it's stored as string for consistency
      backupCode = String(newVisitorId);
      
      // Update with backup code (store as string)
      await pool.query(
        `UPDATE visitors SET backup_code = ? WHERE visitor_id = ?`,
        [backupCode, newVisitorId]
      );
      
      console.log(`✅ Created visitor record ${newVisitorId} with backup code ${backupCode} (stored as string)`);
      
      // Update QR code with backup code
      qrData.backupCode = backupCode;
      const finalQrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));
      const finalBase64Data = finalQrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      await pool.query(
        `UPDATE visitors SET qr_code = ? WHERE visitor_id = ?`,
        [finalBase64Data, newVisitorId]
      );
      
      // Link the visitor_id to additional_visitors
      await pool.query(
        `UPDATE additional_visitors SET visitor_id = ? WHERE token_id = ?`,
        [newVisitorId, token]
      );
      
      // Use final QR code for email
      updatedBase64Data = finalBase64Data;
    }

    // Send confirmation email with QR code
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'museoweb1@gmail.com',
          pass: 'akrtgds yyprsfxyi'
        }
      });

      const emailHtml = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #AB8841 0%, #8B6B21 100%); padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">🎫 Your Group Walk-In QR Code is Ready!</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">Your visitor information has been updated successfully</p>
            </div>
            
            <div style="padding: 30px; background: #faf7f1;">
                <h2 style="color: #2e2b41; margin-bottom: 20px;">Hello ${firstName}!</h2>
                
                <p style="color: #2e2b41;">Your group walk-in visitor information has been updated successfully. Your QR code is now ready for museum check-in.</p>
                
                <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #AB8841;">
                    <h3 style="color: #AB8841; margin-top: 0;">📋 Your QR Code</h3>
                    <p style="color: #2e2b41;">Your QR code is attached to this email. Please present it at the museum entrance for check-in.</p>
                </div>
                
                <div style="background: #f5f4f7; border: 1px solid #2e2b41; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="margin-top: 0; color: #2e2b41;">📅 Your Information</h4>
                    <p style="color: #2e2b41;"><strong>Name:</strong> ${firstName} ${lastName}</p>
                    <p style="color: #2e2b41;"><strong>Email:</strong> ${email}</p>
                    <p style="color: #2e2b41;"><strong>Visitor Type:</strong> ${visitorType}</p>
                    <p style="color: #2e2b41;"><strong>Status:</strong> ✅ Ready for Check-in</p>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #AB8841; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <h4 style="margin-top: 0; color: #8B6B21;">🔑 Backup Code</h4>
                    <p style="margin: 0; font-size: 14px; color: #8B6B21;">
                        If your QR code doesn't work, use this backup code: <strong>${backupCode}</strong>
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #AB8841;">
                    <p style="margin: 0; color: #AB8841;">Best regards,<br><strong>MuseoSmart Team</strong></p>
                </div>
            </div>
        </body>
        </html>
      `;

      await transporter.sendMail({
        from: 'MuseoSmart <museoweb1@gmail.com>',
        to: email,
        subject: '🎫 Your Group Walk-In QR Code is Ready!',
        html: emailHtml,
        attachments: [{
          filename: 'group_walkin_qr_code.png',
          content: Buffer.from(updatedBase64Data, 'base64'),
          contentType: 'image/png'
        }]
      });

      console.log(`✅ Group walk-in visitor email sent to: ${email}`);
    } catch (emailError) {
      console.error('❌ Error sending email:', emailError);
      // Don't fail the request if email fails
    }

    // Log the activity
    try {
      await logActivity(req, 'group_walkin_visitor.update', {
        tokenId: token,
        visitorName: `${firstName} ${lastName}`,
        email: email
      });
    } catch (logError) {
      console.error('Error logging activity:', logError);
    }

    res.json({
      success: true,
      message: 'Visitor information updated successfully. QR code has been sent to your email.'
    });

  } catch (error) {
    console.error('Error updating group walk-in visitor:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating visitor information'
    });
  }
});

// POST - Check-in group walk-in visitor (for QR code scanning)
// This endpoint handles both group leaders (in visitors table) and group members (in additional_visitors table)
router.post('/:token/checkin', async (req, res) => {
  const { token } = req.params;
  
  try {
    // First, try to find as group leader in visitors table
    let [leaderRows] = await pool.query(
      `SELECT v.*, b.date as visit_date, b.time_slot, b.status as booking_status, b.type as booking_type
       FROM visitors v
       JOIN bookings b ON v.booking_id = b.booking_id
       WHERE (v.visitor_id = ? OR v.backup_code = ?) 
       AND v.is_main_visitor = true 
       AND b.type = 'group-walkin'`,
      [token, token]
    );

    if (leaderRows.length > 0) {
      // This is a group leader
      const leader = leaderRows[0];
      
      // Check if booking is valid
      if (leader.booking_status === 'cancelled') {
        return res.status(400).json({
          success: false,
          error: 'This booking has been cancelled and cannot be checked in.',
          status: leader.booking_status
        });
      }
      
      // Check if already checked in
      if (leader.status === 'visited') {
        return res.status(400).json({
          success: false,
          error: 'This group walk-in leader has already been checked in.',
          status: leader.status
        });
      }
      
      // STEP: Check if visitor has completed their details - REQUIRED before check-in
      console.log('📋 Checking group walk-in leader completion status...');
      console.log('📋 Visitor fields:', {
        first_name: leader.first_name,
        last_name: leader.last_name,
        email: leader.email,
        gender: leader.gender
      });
      
      // Check for placeholder/default values that indicate incomplete information
      const firstName = (leader.first_name || '').trim();
      const lastName = (leader.last_name || '').trim();
      const email = (leader.email || '').trim();
      const gender = (leader.gender || '').trim();
      
      // Check if name is a placeholder (like "Walk-in Visitor", "Visitor", "Group Leader", etc.)
      const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
      const isPlaceholderName = fullName === 'walk-in visitor' || 
                                fullName === 'visitor' ||
                                fullName === 'group leader' ||
                                fullName === 'group visitor' ||
                                firstName.toLowerCase() === 'walk-in visitor' ||
                                firstName.toLowerCase() === 'visitor' ||
                                firstName.toLowerCase() === 'walk-in' ||
                                firstName.toLowerCase() === 'group' ||
                                lastName.toLowerCase() === 'visitor' ||
                                lastName.toLowerCase() === 'leader' ||
                                (firstName === '' && lastName === '') ||
                                (firstName.toLowerCase() === 'walk-in' && lastName.toLowerCase() === 'visitor') ||
                                (firstName.toLowerCase() === 'group' && lastName.toLowerCase() === 'leader');
      
      const hasRequiredFields = firstName !== '' && 
                                lastName !== '' && 
                                email !== '' &&
                                !isPlaceholderName;
      
      // Group walk-in leaders need all fields including gender
      const hasAllRequiredInfo = hasRequiredFields && gender !== '';
      
      console.log('📋 Has all required info:', hasAllRequiredInfo);
      console.log('📋 Is placeholder name:', isPlaceholderName);
      console.log('📋 Field values:', { firstName, lastName, email, gender });
      
      if (!hasAllRequiredInfo) {
        const missingFields = [];
        // Check each field individually - only add if it's actually missing
        // For name fields, check if they're empty OR if the full name is a placeholder
        if (isPlaceholderName || !firstName || firstName.trim() === '') {
          missingFields.push('first_name');
        }
        if (isPlaceholderName || !lastName || lastName.trim() === '') {
          missingFields.push('last_name');
        }
        if (!email || email.trim() === '') {
          missingFields.push('email');
        }
        if (!gender || gender.trim() === '') {
          missingFields.push('gender');
        }
        
        console.log('❌ Missing required fields:', missingFields);
        
        return res.status(400).json({
          success: false,
          error: 'Please complete your visitor information first before you can use the backup code to check in.',
          status: 'incomplete',
          message: 'You must fill out all required fields in your visitor form before checking in.',
          missingFields: missingFields
        });
      }
      
      // Update visitor status to visited, set check-in time, and mark QR as used
      await pool.query(
        `UPDATE visitors SET status = 'visited', checkin_time = NOW(), qr_used = TRUE WHERE visitor_id = ?`,
        [leader.visitor_id]
      );
      
      // Get updated visitor information
      const [updatedLeaderRows] = await pool.query(
        `SELECT v.*, b.date as visit_date, b.time_slot, b.type as booking_type
         FROM visitors v
         JOIN bookings b ON v.booking_id = b.booking_id
         WHERE v.visitor_id = ?`,
        [leader.visitor_id]
      );
      
      const updatedLeader = updatedLeaderRows[0];
      
      try {
        await logActivity(req, 'group_walkin_leader.checkin', {
          visitorId: leader.visitor_id,
          visitorName: `${firstName} ${lastName}`,
          email: email
        });
      } catch (logError) {
        console.error('Error logging activity:', logError);
      }
      
      return res.json({
        success: true,
        message: 'Group walk-in leader checked in successfully!',
        visitor: {
          firstName: updatedLeader.first_name,
          lastName: updatedLeader.last_name,
          email: updatedLeader.email,
          gender: updatedLeader.gender,
          visitorType: updatedLeader.visitor_type,
          address: updatedLeader.address,
          institution: updatedLeader.institution,
          purpose: updatedLeader.purpose,
          visitDate: updatedLeader.visit_date,
          visitTime: updatedLeader.time_slot,
          checkin_time: updatedLeader.checkin_time ? updatedLeader.checkin_time.toISOString() : new Date().toISOString(),
          bookingType: updatedLeader.booking_type,
          visitorType: 'group_walkin_leader'
        }
      });
    }
    
    // If not found as leader, try to find as group member in additional_visitors table
    const [visitorRows] = await pool.query(
      `SELECT * FROM additional_visitors WHERE token_id = ?`,
      [token]
    );

    if (visitorRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Visitor not found'
      });
    }

    const visitor = visitorRows[0];

    // Check if form has been completed
    if (visitor.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Visitor information not completed. Please complete the form first.',
        status: 'incomplete'
      });
    }

    // Check if QR code has already been used
    if (visitor.qr_used) {
      return res.status(400).json({
        success: false,
        error: 'QR code has already been used for check-in',
        qrUsed: true
      });
    }

    // Mark QR code as used and record check-in time
    await pool.query(
      `UPDATE additional_visitors SET 
        qr_used = TRUE, 
        checkin_time = NOW(),
        updated_at = NOW()
       WHERE token_id = ?`,
      [token]
    );

    // Log the check-in activity
    try {
      await logActivity(req, 'group_walkin_visitor.checkin', {
        tokenId: token,
        visitorName: `${visitor.first_name} ${visitor.last_name}`,
        email: visitor.email
      });
    } catch (logError) {
      console.error('Error logging activity:', logError);
    }

    res.json({
      success: true,
      message: `Welcome ${visitor.first_name} ${visitor.last_name}! Check-in successful.`,
      visitor: {
        name: `${visitor.first_name} ${visitor.last_name}`,
        email: visitor.email,
        visitorType: visitor.visitor_type,
        institution: visitor.institution,
        purpose: visitor.purpose
      }
    });

  } catch (error) {
    console.error('Error checking in group walk-in visitor:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during check-in: ' + error.message
    });
  }
});

module.exports = router;
