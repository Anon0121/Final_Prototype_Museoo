const express = require('express');
const pool = require('../db');
const router = express.Router();
const QRCode = require('qrcode');
const { logActivity } = require('../utils/activityLogger');

// Get group walk-in leader info
router.get('/:visitorId', async (req, res) => {
  const { visitorId } = req.params;
  
  try {
    // Get visitor information with booking details
    const [visitorRows] = await pool.query(
      `SELECT v.*, b.date as visit_date, b.time_slot, b.status as booking_status, b.booking_id, b.type as booking_type
       FROM visitors v
       JOIN bookings b ON v.booking_id = b.booking_id
       WHERE v.visitor_id = ? AND b.type = 'group-walkin'`,
      [visitorId]
    );
    
    if (visitorRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Group walk-in leader not found or invalid token'
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
    console.error('Error fetching group walk-in leader info:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch visitor information'
    });
  }
});

// Update group walk-in leader details
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
       WHERE v.visitor_id = ? AND b.type = 'group-walkin'`,
      [visitorId]
    );
    
    if (visitorRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Group walk-in leader not found or invalid token'
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
    
         // Send emails to additional visitors with their form links
     const [additionalVisitors] = await connection.query(
       `SELECT token_id, email FROM additional_visitors 
        WHERE booking_id = ? AND token_id NOT LIKE ?`,
       [visitor.booking_id, '%-0']
     );
     
     console.log(`📧 Found ${additionalVisitors.length} additional visitors to send emails to`);
     
     // Send emails to each additional visitor
     for (const additionalVisitor of additionalVisitors) {
       try {
         // Create form link for additional visitor
         const memberFormUrl = `http://localhost:5173/group-walkin-visitor?token=${additionalVisitor.token_id}`;
         
          // Generate QR code and backup code for additional visitor (but don't send in first email)
          const shortBackupCode = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4-letter backup code
          const additionalQrData = {
            type: 'walkin_visitor',
            visitorId: shortBackupCode, // Use short backup code as visitorId
            bookingId: visitor.booking_id,
            email: additionalVisitor.email,
            visitDate: visitor.visit_date,
            visitTime: visitor.visit_time,
            groupLeader: `${firstName} ${lastName}`,
            institution: institution,
            purpose: purpose
          };
          
          const additionalQrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(additionalQrData));
          const additionalBase64Data = additionalQrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
          
          // Store QR code in database (backup code is embedded in QR code as visitorId)
          await connection.query(
            `UPDATE visitors SET qr_code = ? WHERE visitor_id = ?`,
            [additionalBase64Data, additionalVisitor.visitor_id]
          );
          
          // Create email content for additional visitor
          const additionalVisitorEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Group Registration - City Museum of Cagayan de Oro</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #8B6B21;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #8B6B21;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            font-size: 14px;
        }
        .date {
            text-align: right;
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #2e2b41;
        }
        .content {
            margin-bottom: 30px;
            text-align: justify;
        }
        .visit-details {
            background-color: #f8f9fa;
            border-left: 4px solid #8B6B21;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .visit-details h3 {
            color: #8B6B21;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .group-info {
            background-color: #e8f4fd;
            border-left: 4px solid #17a2b8;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .group-info h4 {
            color: #0c5460;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .registration-section {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .registration-section h3 {
            color: #856404;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .registration-button {
            display: inline-block;
            background: #8B6B21;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
            font-weight: bold;
        }
        .requirements {
            background-color: #f8f9fa;
            border-left: 4px solid #8B6B21;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .requirements h4 {
            color: #8B6B21;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .expiration-notice {
            background-color: #fdf6e3;
            border-left: 4px solid #8B6B21;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .expiration-notice h4 {
            color: #8B6B21;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .signature {
            margin-top: 40px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        .signature-name {
            font-weight: bold;
            color: #8B6B21;
        }
        .signature-title {
            color: #666;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
        .contact-info {
            background-color: #8B6B21;
            color: white;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            text-align: center;
        }
        .contact-info h4 {
            margin: 0 0 10px 0;
        }
        .contact-info p {
            margin: 5px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏛️ City Museum of Cagayan de Oro</div>
            <div class="subtitle">Preserving Our Cultural Heritage</div>
        </div>
        
        <div class="date">${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}</div>
        
        <div class="greeting">Dear Group Member,</div>
        
        <div class="content">
            <p>Your group walk-in museum visit has been <strong>approved</strong> for <strong>${visitor.visit_date}</strong> at <strong>${visitor.visit_time}</strong>.</p>
            
            <p>Your group leader <strong>${firstName} ${lastName}</strong> has completed their registration and provided the following information:</p>
            
            <div class="group-info">
                <h4>👥 Group Information (Inherited)</h4>
                <p><strong>Institution:</strong> ${institution}</p>
                <p><strong>Purpose:</strong> ${purpose}</p>
            </div>
            
            <div class="visit-details">
                <h3>📅 Visit Details</h3>
                <p><strong>Date:</strong> ${visitor.visit_date}</p>
                <p><strong>Time:</strong> ${visitor.visit_time}</p>
                <p><strong>Group Leader:</strong> ${firstName} ${lastName}</p>
                <p><strong>Status:</strong> ✅ Ready for Registration</p>
            </div>
            
            <div class="registration-section">
                <h3>📋 Complete Your Registration</h3>
                <p>Please click the link below to complete your registration with your basic details:</p>
                <a href="${memberFormUrl}" class="registration-button">Complete My Registration</a>
            </div>
            
            <div class="requirements">
                <h4>📝 What You Need to Provide</h4>
                <p><strong>Required:</strong> First Name, Last Name, Gender, Visitor Type, Address</p>
                <p><strong>Inherited:</strong> Institution and Purpose (from group leader)</p>
                <p><strong>Result:</strong> Your personal QR code for check-in</p>
            </div>
            
            <div class="backup-code-section">
                <h4>🔑 Your Backup Code</h4>
                <p>If your QR code doesn't work, use this backup code for manual check-in:</p>
                <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 15px; border-radius: 8px; text-align: center; margin: 15px 0;">
                    <strong style="font-size: 24px; color: #8B6B21;">${shortBackupCode}</strong>
                </div>
                <p style="font-size: 14px; color: #666;">Keep this code safe - you'll need it for manual check-in if your QR code fails.</p>
            </div>
            
            <div class="expiration-notice">
                <h4>⏰ Important Notice</h4>
                <p><strong>24-Hour Expiration:</strong> This registration link will expire in 24 hours. Please complete your profile within this time.</p>
            </div>
            
            <p>Please complete your registration as soon as possible to receive your QR code.</p>
        </div>
        
        <div class="signature">
            <p>We look forward to welcoming your group to our museum!</p>
            <p class="signature-name">The MuseoSmart Team</p>
            <p class="signature-title">City Museum of Cagayan de Oro</p>
        </div>
        
        <div class="contact-info">
            <h4>📞 Contact Information</h4>
            <p>📍 Address: City Hall Complex, Cagayan de Oro City</p>
            <p>📧 Email: museum@cagayandeoro.gov.ph</p>
            <p>📱 Phone: (088) 123-4567</p>
        </div>
        
        <div class="contact-info" style="background-color: #f8f9fa; color: #333; border: 2px solid #8B6B21;">
            <h4>💬 Share Your Feedback</h4>
            <p>We value your opinion! Please share your experience with our museum:</p>
            <p><a href="https://www.google.com/search?sca_esv=58ed7cc7eaa43e58&si=AMgyJEtREmoPL4P1I5IDCfuA8gybfVI2d5Uj7QMwYCZHKDZ-Eza3w70XE2bUhl_4JHIdJFwpiaWTxArrylZEC6pyrvuevVsptVu8TTqCekY0DtTwj2tQXcX9gjlgiec1Gt_YJwotEOq0OP914icPZV23Y7AURlQAYFgLV0vLtHf5igQ9by3V2oz6UcZXVDs6YOODx64rthNz&q=City+Museum+of+Cagayan+de+Oro+and+Heritage+Studies+Center+Reviews&sa=X&ved=2ahUKEwidju-_woiQAxX8dvUHHbtIHT0Q0bkNegQIIxAE&cshid=1759511386989816&biw=1536&bih=695&dpr=1.25#lrd=0x32fff2d5e2fc9e2d:0x11e18344b68beb41,3,,,," 
               style="color: #8B6B21; text-decoration: none; font-weight: bold; font-size: 16px;">⭐ Leave a Review for City Museum of Cagayan de Oro</a></p>
        </div>
        
        <div class="footer">
            <p>This is an official communication from the City Museum of Cagayan de Oro.</p>
            <p>Thank you for supporting our mission to preserve and celebrate our cultural heritage.</p>
        </div>
    </div>
</body>
</html>
        `;
         
         // Send email to additional visitor with QR code and backup code
         const nodemailer = require('nodemailer');
         const transporter = nodemailer.createTransporter({
           service: 'gmail',
           auth: {
             user: 'museoweb1@gmail.com',
             pass: 'akrtgds yyprsfxyi'
           }
         });
         
         await transporter.sendMail({
            from: 'MuseoSmart <museoweb1@gmail.com>',
            to: additionalVisitor.email,
            subject: '🎫 Your Group Walk-In Registration is Ready!',
            html: additionalVisitorEmailHtml,
            attachments: [{
              filename: 'group_member_qr_code.png',
              content: Buffer.from(additionalBase64Data, 'base64'),
              contentType: 'image/png'
            }]
          });
          
          // Store QR code and backup code in database
          await connection.query(
            `UPDATE visitors SET qr_code = ?, backup_code = ? WHERE visitor_id = ?`,
            [additionalBase64Data, shortBackupCode, additionalVisitor.visitor_id]
          );
         
         console.log(`✅ Email sent to additional visitor: ${additionalVisitor.email}`);
       } catch (err) {
         console.error(`❌ Error sending email to additional visitor ${additionalVisitor.email}:`, err);
       }
     }
    
    // Send email to group leader with their QR code and backup code
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: 'museoweb1@gmail.com',
          pass: 'akrtgds yyprsfxyi'
        }
      });
      
      const visitDate = new Date(visitor.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const leaderEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Your Group Walk-In Registration is Complete!</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #8B6B21, #A67C00); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
            .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
            .content { padding: 30px; }
            .booking-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8B6B21; }
            .qr-section { text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
            .backup-section { text-align: center; margin: 30px 0; padding: 20px; background: #fff3cd; border-radius: 8px; border: 2px solid #ffc107; }
            .backup-code { font-size: 24px; font-weight: bold; color: #8B6B21; background: white; padding: 15px; border-radius: 8px; display: inline-block; margin: 10px 0; border: 2px solid #8B6B21; }
            .footer { background: #8B6B21; color: white; padding: 20px; text-align: center; }
            .important { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Your Group Walk-In Registration is Complete!</h1>
              <p>You're all set for your museum visit</p>
            </div>
            
            <div class="content">
              <h2>📅 Visit Details</h2>
              <div class="booking-info">
                <p><strong>Date:</strong> ${visitDate}</p>
                <p><strong>Time:</strong> ${visitor.time_slot}</p>
                <p><strong>Group Leader:</strong> ${firstName} ${lastName}</p>
                <p><strong>Email:</strong> ${visitor.email}</p>
                <p><strong>Total Group Size:</strong> ${additionalVisitors.length + 1} visitors</p>
              </div>
              
              <div class="qr-section">
                <h3>📱 Your QR Code</h3>
                <p>Your QR code is attached to this email. Please present it at the museum entrance for check-in.</p>
                <p style="color: #666; font-size: 14px;">If your QR code doesn't work, use the backup code below.</p>
              </div>
              
              <div class="backup-section">
                <h3>🔑 Backup Code</h3>
                <p>If your QR code doesn't work, use this backup code:</p>
                <div class="backup-code">${backupCode}</div>
                <p style="color: #666; font-size: 14px;">Keep this code safe - you'll need it for manual check-in if your QR code fails.</p>
              </div>
              
              <div class="important">
                <h4>📝 Important Reminders</h4>
                <ul>
                  <li>Arrive 15 minutes before your scheduled time</li>
                  <li>Bring a valid ID for verification</li>
                  <li>Follow museum guidelines and safety protocols</li>
                  <li>Contact us if you need to reschedule or cancel</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>City Museum of Cagayan de Oro</strong></p>
              <p>📍 City Hall Complex, Cagayan de Oro City</p>
              <p>📧 museum@cagayandeoro.gov.ph | 📱 (088) 123-4567</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      await transporter.sendMail({
        from: 'MuseoSmart <museoweb1@gmail.com>',
        to: visitor.email,
        subject: '🎉 Your Group Walk-In Registration is Complete - QR Code & Backup Code Ready!',
        html: leaderEmailHtml,
        attachments: [{
          filename: 'group_leader_qr_code.png',
          content: Buffer.from(base64Data, 'base64'),
          contentType: 'image/png'
        }]
      });
      
      console.log(`✅ Email sent to group leader: ${visitor.email}`);
    } catch (emailError) {
      console.error(`❌ Error sending email to group leader:`, emailError);
      // Don't fail the registration if email fails
    }
    
    await connection.commit();
    
    try { 
      await logActivity(req, 'group.walkin.leader.completed', { 
        visitorId, 
        bookingId: visitor.booking_id,
        visitorName: `${firstName} ${lastName}`,
        additionalVisitorsCount: additionalVisitors.length
      }); 
    } catch {}
    
         res.json({
       success: true,
       message: `Group walk-in leader registration completed successfully! Emails have been sent to ${additionalVisitors.length} additional visitors with their registration links.`,
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
       qrCodeDataUrl,
       additionalVisitorsCount: additionalVisitors.length,
       emailsSent: true
     });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Error updating group walk-in leader:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update visitor information: ' + err.message
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
       WHERE v.visitor_id = ? AND b.type = 'group-walkin'`,
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
    
    // Check if already checked in
    if (visitor.status === 'visited') {
      return res.status(400).json({
        success: false,
        error: 'This group walk-in leader has already been checked in.',
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
      await logActivity(req, 'group.walkin.leader.checkin', { 
        visitorId, 
        bookingId: visitor.booking_id,
        visitorName: `${visitor.first_name} ${visitor.last_name}`
      }); 
    } catch {}
    
    res.json({
      success: true,
      message: 'Group walk-in leader checked in successfully!',
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
        visitorType: 'group_walkin_leader'
      }
    });
    
  } catch (err) {
    console.error('Error checking in group walk-in leader:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to check in group walk-in leader: ' + err.message
    });
  }
});

module.exports = router;
