const express = require('express');
const pool = require('../db');
const router = express.Router();
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const { logActivity } = require('../utils/activityLogger');

// Get group walk-in leader token info
router.get('/:tokenId', async (req, res) => {
  const { tokenId } = req.params;
  
  try {
    // Get token information with booking details
    const [tokenRows] = await pool.query(
      `SELECT av.*, b.date as visit_date, b.time_slot, b.status as booking_status, b.booking_id, b.type as booking_type,
              (SELECT COUNT(*) FROM additional_visitors WHERE booking_id = b.booking_id) as group_size
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
    
    // Check if token has expired (for walk-in types)
    if (tokenInfo.expires_at && new Date() > new Date(tokenInfo.expires_at)) {
      return res.status(400).json({
        success: false,
        error: 'This link has expired. Please contact the museum for assistance.',
        linkExpired: true
      });
    }
    
    res.json({
      success: true,
      tokenInfo: {
        tokenId: tokenInfo.token_id,
        email: tokenInfo.email,
        status: tokenInfo.status,
        visitDate: tokenInfo.visit_date,
        visitTime: tokenInfo.time_slot,
        bookingId: tokenInfo.booking_id,
        bookingType: tokenInfo.booking_type,
        groupSize: tokenInfo.group_size,
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

// Update group walk-in leader details and generate QR codes for all members
router.put('/:tokenId', async (req, res) => {
  const { tokenId } = req.params;
  const { firstName, lastName, gender, address, visitorType, institution, purpose } = req.body;
  
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // First, get token information
    const [tokenRows] = await connection.query(
      `SELECT av.*, b.status as booking_status, b.booking_id, b.type as booking_type, b.date as visit_date, b.time_slot
       FROM additional_visitors av
       JOIN bookings b ON av.booking_id = b.booking_id
       WHERE av.token_id = ?`,
      [tokenId]
    );
    
    if (tokenRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Token not found or expired'
      });
    }
    
    const tokenInfo = tokenRows[0];
    
    // Check if booking is still valid
    if (tokenInfo.booking_status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'This booking has been cancelled'
      });
    }
    
         // Check if already completed
     if (tokenInfo.status === 'completed') {
       await connection.rollback();
       return res.status(400).json({
         success: false,
         error: 'This form has already been submitted and cannot be submitted again.',
         linkExpired: true
       });
     }
    
    // Check if link has expired
    if (tokenInfo.expires_at && new Date() > new Date(tokenInfo.expires_at)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'This link has expired. Please contact the museum for assistance.',
        linkExpired: true
      });
    }
    
    // Prepare details object
    const details = {
      firstName,
      lastName,
      gender,
      address,
      visitorType,
      institution: institution || '',
      purpose: purpose || 'educational'
    };
    
    // Update the additional visitor record
    await connection.query(
      `UPDATE additional_visitors 
       SET details = ?, status = 'completed', details_completed_at = NOW()
       WHERE token_id = ?`,
      [JSON.stringify(details), tokenId]
    );
    
    // Create visitor record in visitors table
    const [visitorResult] = await connection.query(
      `INSERT INTO visitors (
        booking_id, first_name, last_name, gender, address, email, 
        visitor_type, purpose, institution, status, is_main_visitor
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', true)`,
      [
        tokenInfo.booking_id,
        firstName,
        lastName,
        gender,
        address,
        tokenInfo.email,
        visitorType,
        purpose || 'educational',
        institution || '',
      ]
    );
    
    const visitorId = visitorResult.insertId;
    
    // Generate QR code for the group leader
    const qrData = {
      type: 'walkin_visitor',
      visitorId: visitorId,
      bookingId: tokenInfo.booking_id,
      email: tokenInfo.email,
      visitDate: tokenInfo.visit_date,
      visitTime: tokenInfo.time_slot,
      visitorName: `${firstName} ${lastName}`,
      isGroupLeader: true
    };
    
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    
    // Update visitor record with QR code
    await connection.query(
      `UPDATE visitors SET qr_code = ? WHERE visitor_id = ?`,
      [base64Data, visitorId]
    );
    
    // Use visitor ID as backup code
    const backupCode = visitorId;
    
    // Send email with QR code to group leader
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
            <p style="margin: 10px 0 0 0; font-size: 16px;">Group leader registration complete</p>
        </div>
        
        <div style="padding: 30px; background: white;">
            <h2 style="color: #2e2b41; margin-bottom: 20px;">Hello ${firstName}!</h2>
            
            <p style="color: #2e2b41;">Your group walk-in leader registration is complete! Here's your QR code for check-in.</p>
            
            <div style="background: #faf7f1; border-left: 4px solid #AB8841; padding: 20px; margin: 25px 0; border-radius: 5px;">
                <h3 style="margin: 0 0 15px 0; color: #AB8841;">📋 Your QR Code</h3>
                <p style="margin: 0; font-size: 14px; color: #2e2b41;">Your QR code is attached to this email. Please present it at the museum entrance for check-in.</p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; margin: 25px 0; border-radius: 5px;">
                <h3 style="margin: 0 0 15px 0; color: #856404;">🔑 Backup Code</h3>
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #2e2b41;">If your QR code doesn't work, use this backup code:</p>
                <div style="background: #f8f9fa; padding: 15px; text-align: center; margin: 10px 0; border-radius: 5px;">
                    <h2 style="color: #AB8841; font-size: 24px; margin: 0; letter-spacing: 3px; font-family: monospace;">${backupCode}</h2>
                </div>
                <p style="margin: 0; font-size: 12px; color: #856404;">
                    <strong>Important:</strong> This backup code is shared for the entire group. Use only if QR code scanning fails.
                </p>
            </div>
            
            <div style="background: #e8f4fd; border: 1px solid #AB8841; border-radius: 5px; padding: 15px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #2e2b41;">👥 Group Information</h4>
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #2e2b41;"><strong>Institution:</strong> ${institution || 'Not specified'}</p>
                <p style="margin: 0; font-size: 14px; color: #2e2b41;"><strong>Purpose:</strong> ${purpose || 'Educational'}</p>
            </div>
            
            <div style="background: #f5f4f7; border: 1px solid #2e2b41; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #2e2b41;">📅 Visit Details</h4>
                <p style="color: #2e2b41;"><strong>Name:</strong> ${firstName} ${lastName}</p>
                <p style="color: #2e2b41;"><strong>Date:</strong> ${tokenInfo.visit_date}</p>
                <p style="color: #2e2b41;"><strong>Time:</strong> ${tokenInfo.visit_time}</p>
                <p style="color: #2e2b41;"><strong>Booking ID:</strong> ${tokenInfo.booking_id}</p>
                <p style="color: #2e2b41;"><strong>Status:</strong> ✅ Confirmed</p>
            </div>
            
            <div style="background: #fdf6e3; border: 1px solid #AB8841; border-radius: 5px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #8B6B21;">
                    <strong>⏰ Important:</strong> Please arrive 10 minutes before your scheduled time.
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #AB8841;">
                <p style="margin: 0 0 10px 0; font-size: 16px; color: #2e2b41;">Thank you for choosing our museum!</p>
                <p style="margin: 0; color: #AB8841;">Best regards,<br><strong>MuseoSmart Team</strong></p>
            </div>
        </div>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: 'MuseoSmart <museoweb1@gmail.com>',
      to: tokenInfo.email,
      subject: '🎫 Your Group Walk-In Leader QR Code',
      html: emailHtml,
      attachments: [{
        filename: 'group_leader_qr.png',
        content: Buffer.from(base64Data, 'base64'),
        contentType: 'image/png'
      }]
    });
    
    // SPECIAL LOGIC: Send QR codes to all additional visitors
    console.log('🎯 Group walk-in leader completed - sending QR codes to additional visitors');
    
    // Get all additional visitors for this booking (excluding the group leader)
    const [additionalVisitors] = await connection.query(
      `SELECT token_id, email FROM additional_visitors 
       WHERE booking_id = ? AND token_id NOT LIKE ?`,
      [tokenInfo.booking_id, '%-0']
    );
    
    console.log(`📧 Found ${additionalVisitors.length} additional visitors to send QR codes to`);
    
    // Send QR codes to each additional visitor
    for (const additionalVisitor of additionalVisitors) {
      try {
        // Generate QR code for additional visitor
        const additionalQrData = {
          type: 'walkin_visitor',
          visitorId: `GROUP-${tokenInfo.booking_id}-${additionalVisitor.token_id}`,
          bookingId: tokenInfo.booking_id,
          email: additionalVisitor.email,
          visitDate: tokenInfo.visit_date,
          visitTime: tokenInfo.time_slot,
          groupLeader: `${firstName} ${lastName}`,
          institution: institution,
          purpose: purpose
        };
        
        const additionalQrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(additionalQrData));
        const additionalBase64Data = additionalQrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
        
        // Create simplified form link for additional visitors
        const additionalFormUrl = `http://localhost:5173/group-walkin-member?token=${additionalVisitor.token_id}`;
        
        const additionalVisitorEmailHtml = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #AB8841 0%, #8B6B21 100%); padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">🎫 Your Group Walk-In QR Code is Ready!</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">Your group leader has completed registration</p>
            </div>
            
            <div style="padding: 30px; background: white;">
                <h2 style="color: #2e2b41; margin-bottom: 20px;">Hello!</h2>
                
                <p style="color: #2e2b41;">Your group leader <strong>${firstName} ${lastName}</strong> has completed the group walk-in registration! Here's your QR code for check-in.</p>
                
                <div style="background: #faf7f1; border-left: 4px solid #AB8841; padding: 20px; margin: 25px 0; border-radius: 5px;">
                    <h3 style="margin: 0 0 15px 0; color: #AB8841;">📋 Your QR Code</h3>
                    <p style="margin: 0; font-size: 14px; color: #2e2b41;">Your QR code is attached to this email. Please present it at the museum entrance for check-in.</p>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; margin: 25px 0; border-radius: 5px;">
                    <h3 style="margin: 0 0 15px 0; color: #856404;">🔑 Backup Code</h3>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #2e2b41;">If your QR code doesn't work, use this backup code:</p>
                    <div style="background: #f8f9fa; padding: 15px; text-align: center; margin: 10px 0; border-radius: 5px;">
                        <h2 style="color: #AB8841; font-size: 24px; margin: 0; letter-spacing: 3px; font-family: monospace;">${backupCode}</h2>
                    </div>
                    <p style="margin: 0; font-size: 12px; color: #856404;">
                        <strong>Important:</strong> This backup code is shared for the entire group. Use only if QR code scanning fails.
                    </p>
                </div>
                
                <div style="background: #e8f4fd; border: 1px solid #AB8841; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <h4 style="margin-top: 0; color: #2e2b41;">👥 Group Information</h4>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #2e2b41;"><strong>Group Leader:</strong> ${firstName} ${lastName}</p>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #2e2b41;"><strong>Institution:</strong> ${institution || 'Not specified'}</p>
                    <p style="margin: 0; font-size: 14px; color: #2e2b41;"><strong>Purpose:</strong> ${purpose || 'Educational'}</p>
                </div>
                
                <div style="background: #f5f4f7; border: 1px solid #2e2b41; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="margin-top: 0; color: #2e2b41;">📅 Visit Details</h4>
                    <p style="color: #2e2b41;"><strong>Date:</strong> ${tokenInfo.visit_date}</p>
                    <p style="color: #2e2b41;"><strong>Time:</strong> ${tokenInfo.visit_time}</p>
                    <p style="color: #2e2b41;"><strong>Booking ID:</strong> ${tokenInfo.booking_id}</p>
                    <p style="color: #2e2b41;"><strong>Status:</strong> ✅ Confirmed</p>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <h4 style="margin-top: 0; color: #856404;">📝 Complete Your Details</h4>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #856404;">Please click the link below to provide your basic details (name, gender, address). Institution and purpose are already set by your group leader.</p>
                    <a href="${additionalFormUrl}" style="display: inline-block; background: #AB8841; color: white; padding: 8px 16px; text-decoration: none; border-radius: 5px; font-size: 14px;">Complete My Details</a>
                </div>
                
                <div style="background: #fdf6e3; border: 1px solid #AB8841; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #8B6B21;">
                        <strong>⏰ Important:</strong> Please arrive 10 minutes before your scheduled time.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #AB8841;">
                    <p style="margin: 0 0 10px 0; font-size: 16px; color: #2e2b41;">Thank you for choosing our museum!</p>
                    <p style="margin: 0; color: #AB8841;">Best regards,<br><strong>MuseoSmart Team</strong></p>
                </div>
            </div>
        </body>
        </html>
        `;
        
        await transporter.sendMail({
          from: 'MuseoSmart <museoweb1@gmail.com>',
          to: additionalVisitor.email,
          subject: '🎫 Your Group Walk-In QR Code is Ready!',
          html: additionalVisitorEmailHtml,
          attachments: [{
            filename: 'group_walkin_visitor_qr.png',
            content: Buffer.from(additionalBase64Data, 'base64'),
            contentType: 'image/png'
          }]
        });
        
        console.log(`✅ QR code sent to additional visitor: ${additionalVisitor.email}`);
      } catch (emailError) {
        console.error(`❌ Failed to send QR code to ${additionalVisitor.email}:`, emailError);
      }
    }
    
    await connection.commit();
    
    try { await logActivity(req, 'group_walkin_leader.registration.complete', { visitorId, bookingId: tokenInfo.booking_id }); } catch {}
    
    res.json({
      success: true,
      message: 'Group leader registration completed successfully! QR codes have been sent to all group members.',
      visitorId: visitorId
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Error updating group walk-in leader info:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update information. Please try again.'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Check-in group walk-in leader (for QR scanning)
router.post('/:visitorId/checkin', async (req, res) => {
  const { visitorId } = req.params;
  
  try {
    // Get visitor information with booking details
    const [visitorRows] = await pool.query(
      `SELECT v.*, b.date as visit_date, b.time_slot, b.status as booking_status, b.type as booking_type
       FROM visitors v
       JOIN bookings b ON v.booking_id = b.booking_id
       WHERE v.visitor_id = ?`,
      [visitorId]
    );
    
    if (visitorRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Group walk-in leader not found'
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
    
    if (visitor.status === 'visited') {
      return res.status(400).json({
        success: false,
        error: 'This visitor has already been checked in.',
        status: visitor.status
      });
    }
    
    // Update visitor status to visited and set check-in time
    await pool.query(
      `UPDATE visitors SET status = 'visited', checkin_time = NOW() WHERE visitor_id = ?`,
      [visitorId]
    );
    
    try { await logActivity(req, 'group_walkin_leader.checkin', { visitorId, bookingId: visitor.booking_id }); } catch {}
    
    // Get the actual check-in time from the database
    const [checkinTimeResult] = await pool.query(
      `SELECT checkin_time FROM visitors WHERE visitor_id = ?`,
      [visitorId]
    );
    
    const actualCheckinTime = checkinTimeResult[0].checkin_time;
    
    res.json({
      success: true,
      message: 'Group walk-in leader checked in successfully!',
      visitor: {
        first_name: visitor.first_name,
        last_name: visitor.last_name,
        email: visitor.email,
        gender: visitor.gender,
        visitorType: visitor.visitor_type,
        address: visitor.address,
        institution: visitor.institution,
        purpose: visitor.purpose,
        visit_date: visitor.visit_date,
        visit_time: visitor.time_slot,
        checkin_time: actualCheckinTime ? actualCheckinTime.toISOString() : new Date().toISOString(),
        visitorType: 'group_walkin_leader'
      }
    });
    
  } catch (err) {
    console.error('Error during group walk-in leader check-in:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
