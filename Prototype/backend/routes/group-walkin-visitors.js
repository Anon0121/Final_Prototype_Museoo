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

    // Generate backup code
    const backupCode = Math.random().toString(36).substring(2, 6).toUpperCase();

    // Store QR code and backup code
    await pool.query(
      `UPDATE additional_visitors SET 
        qr_code = ?, 
        backup_code = ? 
       WHERE token_id = ?`,
      [base64Data, backupCode, token]
    );

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
          content: Buffer.from(base64Data, 'base64'),
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
router.post('/:token/checkin', async (req, res) => {
  const { token } = req.params;
  
  try {
    // Find the visitor by token
    const [visitorRows] = await pool.query(
      `SELECT * FROM additional_visitors WHERE token_id = ?`,
      [token]
    );

    if (visitorRows.length === 0) {
      return res.json({
        success: false,
        message: 'Visitor not found'
      });
    }

    const visitor = visitorRows[0];

    // Check if form has been completed
    if (visitor.status !== 'completed') {
      return res.json({
        success: false,
        message: 'Visitor information not completed. Please complete the form first.'
      });
    }

    // Check if QR code has already been used
    if (visitor.qr_used) {
      return res.json({
        success: false,
        message: 'QR code has already been used for check-in'
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
      message: 'Server error during check-in'
    });
  }
});

module.exports = router;
