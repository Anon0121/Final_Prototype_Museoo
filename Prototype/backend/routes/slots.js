const express = require('express');
const pool = require('../db');
const router = express.Router();
const { logActivity } = require('../utils/activityLogger');
// Session-based authentication middleware (consistent with other routes)
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

// Function to send emails for walk-in bookings
async function sendWalkInBookingEmails(bookingId, mainVisitor, companionTokens, date, time) {
  try {
    // Create email transporter
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'museoweb1@gmail.com',
        pass: 'akrtgds yyprsfxyi'
      }
    });

    // Send email to main visitor
    if (mainVisitor.email) {
      const isWalkInScheduling = mainVisitor.firstName === 'Walk-in';
      const emailSubject = isWalkInScheduling ? '🎫 Your Walk-In Museum Visit - Complete Your Profile' : '🎫 Your Museum Visit QR Code - Complete Your Profile';
      const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Museum Visit - City Museum of Cagayan de Oro</title>
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
        .profile-completion {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .profile-completion h3 {
            color: #856404;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .profile-button {
            display: inline-block;
            background: #8B6B21;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
            font-weight: bold;
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
        .important-notice {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .important-notice h4 {
            color: #856404;
            margin-top: 0;
            margin-bottom: 15px;
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
        
        <div class="greeting">Dear ${mainVisitor.firstName === 'Walk-in' ? 'Visitor' : mainVisitor.firstName},</div>
        
        <div class="content">
            <p>We are pleased to inform you that your museum visit has been ${isWalkInScheduling ? 'scheduled' : 'approved'} for <strong>${date}</strong> at <strong>${time}</strong>.</p>
            
            <div class="visit-details">
                <h3>📅 Visit Details</h3>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${time}</p>
                <p><strong>Booking ID:</strong> ${bookingId}</p>
                <p><strong>Status:</strong> ✅ ${isWalkInScheduling ? 'Scheduled' : 'Approved'}</p>
            </div>
            
            <div class="profile-completion">
                <h3>📋 Complete Your Profile</h3>
                <p>To get your QR code and complete your booking, please click the link below and fill in your details:</p>
                <a href="http://localhost:3000/complete-profile/${bookingId}" class="profile-button">Complete Profile</a>
                <p style="margin-top: 15px; font-size: 14px; color: #856404;">Please complete your profile as soon as possible to receive your QR code.</p>
            </div>
            
            <p>Please arrive 10 minutes early for a smooth check-in experience. Bring a valid photo ID for verification purposes.</p>
        </div>
        
        <div class="signature">
            <p>We look forward to welcoming you to our museum!</p>
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
      
      const mailOptions = {
        from: 'museoweb1@gmail.com',
        to: mainVisitor.email,
        subject: emailSubject,
        html: emailHtml
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent to main visitor: ${mainVisitor.email}`);
    }

    // Send emails to additional visitors (FIRST EMAIL - Form Link Only)
    for (const companion of companionTokens) {
      if (companion.email) {
        const mailOptions = {
          from: 'museoweb1@gmail.com',
          to: companion.email,
          subject: '📝 Complete Your Group Visit Registration',
          html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Museum Visit - City Museum of Cagayan de Oro</title>
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
        .profile-completion {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .profile-completion h3 {
            color: #856404;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .profile-button {
            display: inline-block;
            background: #8B6B21;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
            font-weight: bold;
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
        .important-notice {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .important-notice h4 {
            color: #856404;
            margin-top: 0;
            margin-bottom: 15px;
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
        
        <div class="greeting">Dear Visitor,</div>
        
        <div class="content">
            <p>You have been added to a museum visit scheduled for <strong>${date}</strong> at <strong>${time}</strong>.</p>
            
            <div class="visit-details">
                <h3>📅 Visit Details</h3>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${time}</p>
                <p><strong>Token ID:</strong> ${companion.tokenId}</p>
            </div>
            
            <div class="profile-completion">
                <h3>📋 Complete Your Information</h3>
                <p>Please complete your visitor information by clicking the link below:</p>
                <a href="http://localhost:3000/complete-profile/${companion.tokenId}" class="profile-button">Complete Your Details</a>
                <p style="margin-top: 15px; font-size: 14px; color: #856404;">After completing your information, you will receive your QR code and backup code for check-in.</p>
            </div>
            
            <p>Please arrive 10 minutes early for a smooth check-in experience. Bring a valid photo ID for verification purposes.</p>
        </div>
        
        <div class="signature">
            <p>We look forward to welcoming you to our museum!</p>
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
          `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to additional visitor: ${companion.email}`);
      }
    }
  } catch (error) {
    console.error('❌ Error sending walk-in booking emails:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

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
  const { type, mainVisitor, groupMembers, companions, totalVisitors, date, time } = req.body;
  if (!date || !time || !mainVisitor || !totalVisitors) return res.status(400).json({ error: 'Missing data' });

  // Validate visitor limits for group walk-in bookings
  if (type === 'group-walkin') {
    const additionalVisitors = groupMembers?.length || companions?.length || 0;
    if (additionalVisitors > 29) {
      return res.status(400).json({ error: 'Maximum 29 additional visitors allowed for group walk-in bookings' });
    }
    if (totalVisitors > 30) { // 1 main visitor + 29 additional = 30 total
      return res.status(400).json({ error: 'Maximum 30 total visitors allowed for group walk-in bookings' });
    }
  }

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

    // Determine initial status based on booking type
    const initialStatus = (type === 'individual walk-in' || type === 'group walk-in') ? 'approved' : 'pending';
    
    // Insert booking
    const [bookingResult] = await conn.query(
      `INSERT INTO bookings (first_name, last_name, type, status, date, time_slot, total_visitors) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        mainVisitor.firstName,
        mainVisitor.lastName,
        type, // Use the exact type passed (individual walk-in, group walk-in, etc.)
        initialStatus,
        date,
        time,
        totalVisitors
      ]
    );
    const bookingId = bookingResult.insertId;

    // Insert main visitor with complete information
    let mainVisitorId = null;
    const visitorStatus = (type === 'individual-walkin' || type === 'group-walkin') ? 'approved' : 'pending';
    const [mainVisitorResult] = await conn.query(
      `INSERT INTO visitors (booking_id, first_name, last_name, gender, address, email, visitor_type, purpose, institution, status, is_main_visitor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
      [bookingId, mainVisitor.firstName, mainVisitor.lastName, mainVisitor.gender || '', mainVisitor.address || '', mainVisitor.email, mainVisitor.visitorType || 'local', mainVisitor.purpose || 'other', mainVisitor.institution || null, visitorStatus]
    );
    mainVisitorId = mainVisitorResult.insertId;

    // Handle group members (additional visitors) - insert directly into visitors table
    let companionTokens = [];
    const membersToProcess = groupMembers || companions || [];
    
    if ((type === 'group' || type === 'group-walkin') && Array.isArray(membersToProcess)) {
      for (let i = 0; i < membersToProcess.length; i++) {
        const member = membersToProcess[i];
        
        // Generate backup code for companion
        const companionBackupCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        
        // Generate QR code for companion
        const QRCode = require('qrcode');
        const companionQrData = {
          type: 'additional_visitor',
          visitorId: companionBackupCode,
          bookingId: bookingId,
          email: member.email,
          visitDate: date,
          visitTime: time,
          groupLeader: `${mainVisitor.firstName} ${mainVisitor.lastName}`
        };
        
        const companionQrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(companionQrData));
        const companionQrBase64 = companionQrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
        
        // Insert group member directly into visitors table with both QR code and backup code
        const [memberResult] = await pool.query(
          `INSERT INTO visitors (booking_id, first_name, last_name, gender, address, email, visitor_type, purpose, institution, status, is_main_visitor, backup_code, qr_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, false, ?, ?)`,
          [bookingId, member.firstName || '', member.lastName || '', member.gender || '', member.address || '', member.email, member.visitorType || 'local', member.purpose || 'other', member.institution || null, visitorStatus, companionBackupCode, companionQrBase64]
        );
        
        companionTokens.push({
          visitorId: memberResult.insertId,
          email: member.email,
          backupCode: companionBackupCode // Use the secure backup code
        });
      }
    }

    // Handle walk-in types - create tokens with 24-hour expiration
    if (type === 'walk-in scheduling' || type === 'ind-walkin' || type === 'group-walkin') {
      // Calculate expiration time (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      if (type === 'walk-in scheduling') {
        // Walk-in scheduling - create visitor record directly in visitors table
        // No need for tokens since it's a direct walk-in
        console.log('✅ Walk-in scheduling: Visitor record already created in visitors table');
      } else if (type === 'group-walkin') {
        // Group walk-in - all visitors already created in visitors table above
        console.log('✅ Group walk-in: All visitor records already created in visitors table');
      } else if (type === 'group') {
        // Regular group booking - create tokens for additional visitors to complete their forms
        for (let i = 0; i < membersToProcess.length; i++) {
          const member = membersToProcess[i];
          const tokenId = `GROUP-${bookingId}-${i + 1}`;
          
          // Create token for additional visitor form
          await conn.query(
            `INSERT INTO additional_visitors (token_id, booking_id, email, expires_at) VALUES (?, ?, ?, ?)`,
            [tokenId, bookingId, member.email, expiresAt]
          );
          
          companionTokens.push({
            tokenId,
            email: member.email
          });
        }
      }
    }

    conn.release();
    try { await logActivity(req, 'booking.create', { bookingId, date, time, totalVisitors, companions: companionTokens.length }); } catch {}
    
    // Send emails for walk-in bookings immediately (only for auto-approved types)
    if (type === 'individual walk-in' || type === 'group walk-in') {
      console.log(`Walk-in booking detected: ${type}`);
      console.log(`Main visitor email: ${mainVisitor.email}`);
      console.log(`Additional visitors: ${companionTokens.length}`);
      console.log(`Booking ID: ${bookingId}`);
      console.log(`Date: ${date}, Time: ${time}`);
      try {
        await sendWalkInBookingEmails(bookingId, mainVisitor, companionTokens, date, time);
        console.log('✅ Walk-in booking emails sent successfully');
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError);
        console.error('Error details:', emailError.message);
        // Don't fail the booking if email fails
      }
    } else if (type === 'ind-walkin') {
      console.log(`Individual walk-in booking detected: ${type}`);
      console.log(`Main visitor email: ${mainVisitor.email}`);
      console.log(`Booking ID: ${bookingId}`);
      console.log(`Date: ${date}, Time: ${time}`);
      // For ind-walkin, visitor is already in visitors table, no additional email needed
    } else {
      console.log(`Regular booking type: ${type} - no immediate email sent`);
    }
    
    res.json({ 
      success: true, 
      bookingId, 
      visitorIds: mainVisitorId ? [mainVisitorId] : [], 
      companionTokens 
    });
  } catch (err) {
    conn.release();
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all bookings
router.get('/all', isAuthenticated, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        b.*,
        v.first_name,
        v.last_name,
        v.email,
        v.gender,
        v.address,
        v.visitor_type,
        v.purpose,
        v.institution
       FROM bookings b
       LEFT JOIN visitors v ON b.booking_id = v.booking_id AND v.is_main_visitor = 1
       ORDER BY b.date DESC, b.time_slot`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Approve a booking
router.put('/bookings/:id/approve', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  try {
    // Check if booking already exists and is approved
    const [existingBooking] = await pool.query(
      `SELECT status FROM bookings WHERE booking_id = ?`,
      [id]
    );
    
    if (existingBooking.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (existingBooking[0].status === 'approved') {
      return res.json({ 
        success: true, 
        message: 'Booking is already approved' 
      });
    }

    // Create email transporter
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'museoweb1@gmail.com',
        pass: 'akrtgds yyprsfxyi'
      }
    });

    // 1. Approve the booking
    await pool.query(
      `UPDATE bookings SET status = 'approved' WHERE booking_id = ?`,
      [id]
    );

    // 2. Get booking information
    const [bookingRows] = await pool.query(
      `SELECT * FROM bookings WHERE booking_id = ?`,
      [id]
    );
    const booking = bookingRows[0];
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if this is a walk-in type booking
    const isWalkInScheduling = booking.type === 'walk-in scheduling';
    const isIndWalkin = booking.type === 'ind-walkin';
    const isGroupWalkin = booking.type === 'group-walkin';
    
    console.log('🎫 Booking type:', booking.type);
    console.log('📅 Booking date:', booking.date);
    console.log('⏰ Booking time_slot:', booking.time_slot);
    console.log('📋 Is walk-in scheduling:', isWalkInScheduling);
    console.log('👤 Is individual walk-in:', isIndWalkin);
    console.log('👥 Is group walk-in:', isGroupWalkin);

    // 3. Get main visitor's email, name, and institution
    let mainVisitor = null;
    
    if (isGroupWalkin) {
      // For group walk-in, get the primary visitor from visitors table
      const [groupWalkinRows] = await pool.query(
        `SELECT visitor_id, email, first_name, last_name, institution FROM visitors WHERE booking_id = ? AND is_main_visitor = true`,
        [id]
      );
      if (groupWalkinRows.length > 0) {
        mainVisitor = groupWalkinRows[0];
      }
    } else {
      // For other booking types, get from visitors table
      const [visitorRows] = await pool.query(
        `SELECT visitor_id, email, first_name, last_name, institution FROM visitors WHERE booking_id = ? AND is_main_visitor = true`,
        [id]
      );
      if (visitorRows.length > 0) {
        mainVisitor = visitorRows[0];
      }
    }
    
    if (!mainVisitor || !mainVisitor.email) {
      return res.json({ success: true, message: 'Booking approved, but no email sent (no visitor email found).' });
    }

    // 4. Check booking type first
    const [bookingType] = await pool.query(
      `SELECT type FROM bookings WHERE booking_id = ?`,
      [id]
    );
    const hasWalkInTokens = bookingType[0]?.type?.includes('walk-in') || false;

    // 5. Get companions (if any) - check both tables based on booking type
    let companionRows = [];
    
    if (hasWalkInTokens) {
      // For walk-in bookings, get from visitors table
      const [visitorCompanions] = await pool.query(
        `SELECT visitor_id as token_id, email FROM visitors WHERE booking_id = ? AND is_main_visitor = 0`,
        [id]
      );
      companionRows = visitorCompanions;
    } else {
      // For regular group bookings, get from additional_visitors table (tokens)
      const [tokenCompanions] = await pool.query(
        `SELECT token_id, email FROM additional_visitors WHERE booking_id = ?`,
        [id]
      );
      
      // If no tokens exist, create them now (for existing bookings)
      if (tokenCompanions.length === 0) {
        console.log('🔄 No tokens found, creating them for booking approval...');
        
        // Get additional visitors from visitors table
        const [additionalVisitors] = await pool.query(
          `SELECT email FROM visitors WHERE booking_id = ? AND is_main_visitor = 0`,
          [id]
        );
        
        // Create tokens for each additional visitor
        for (let i = 0; i < additionalVisitors.length; i++) {
          const visitor = additionalVisitors[i];
          const tokenId = `GROUP-${id}-${i + 1}`;
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now
          
          await pool.query(
            `INSERT INTO additional_visitors (token_id, booking_id, email, expires_at) VALUES (?, ?, ?, ?)`,
            [tokenId, id, visitor.email, expiresAt]
          );
          
          console.log(`✅ Created token ${tokenId} for ${visitor.email}`);
        }
        
        // Re-query to get the newly created tokens
        const [newTokenCompanions] = await pool.query(
          `SELECT token_id, email FROM additional_visitors WHERE booking_id = ?`,
          [id]
        );
        companionRows = newTokenCompanions;
      } else {
        companionRows = tokenCompanions;
      }
    }

    // 5. Generate QR codes and prepare email content
    let emailContent = `Hi ${mainVisitor.first_name},\n\nYour museum visit is confirmed!\n\n`;
    let attachments = [];

    // Generate primary visitor QR code
    const checkinUrl = `http://localhost:3000/api/visit/checkin/${id}`;
    const qrDataUrl = await QRCode.toDataURL(checkinUrl);
    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
    attachments.push({
      filename: 'primary_visitor_qr.png',
        content: Buffer.from(base64Data, 'base64'),
        contentType: 'image/png'
    });

    // Get primary visitor ID for backup code
    const [primaryVisitorRows] = await pool.query(
      `SELECT visitor_id FROM visitors WHERE booking_id = ? AND is_main_visitor = true`,
      [id]
    );
    
    const primaryVisitorId = primaryVisitorRows[0]?.visitor_id;

    emailContent += `📋 **Primary Visitor QR Code**: Please present this QR code at the museum for check-in.\n\n`;
    emailContent += `🔑 **Backup Code**: ${primaryVisitorId} (use if QR code doesn't work)\n\n`;

    // Create HTML version for primary visitor
    let emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Museum Visit Confirmed - City Museum of Cagayan de Oro</title>
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
        .qr-code-section {
            background-color: #f8f9fa;
            border-left: 4px solid #8B6B21;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .qr-code-section h3 {
            color: #8B6B21;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .backup-code {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .backup-code h3 {
            color: #856404;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .code-display {
            background-color: #ffffff;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            color: #8B6B21;
            border: 1px solid #ddd;
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
        .important-notice {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .important-notice h4 {
            color: #856404;
            margin-top: 0;
            margin-bottom: 15px;
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
        
        <div class="greeting">Dear ${mainVisitor.first_name},</div>
        
        <div class="content">
            <p>Your museum visit is confirmed! We're excited to welcome you to our museum.</p>
            
            <div class="qr-code-section">
                <h3>📋 Your QR Code</h3>
                <p>Your QR code is attached to this email. Please present it at the museum entrance for check-in.</p>
            </div>
            
            <div class="backup-code">
                <h3>🔑 Backup Code</h3>
                <p>If your QR code doesn't work, use this backup code:</p>
                <div class="code-display">${primaryVisitorId}</div>
                <p style="margin-top: 15px; font-size: 14px; color: #856404;">
                    <strong>Important:</strong> This backup code expires in 24 hours. Use only if QR code scanning fails.
                </p>
            </div>
            
            <p>Please arrive 10 minutes early for a smooth check-in experience. Bring a valid photo ID for verification purposes.</p>
        </div>
        
        <div class="signature">
            <p>We look forward to welcoming you to our museum!</p>
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

    // Generate companion QR codes if this is a group booking
    if (companionRows.length > 0) {
      emailContent += `👥 **Companions**: ${companionRows.length} additional visitor(s)\n\n`;
      emailContent += `📧 **Separate emails will be sent to each companion with their individual QR codes and form links.**\n\n`;
      
      // Add companion section to HTML email
      emailHtml += `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #856404;">👥 Group Visit Information</h3>
                <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Companions:</strong> ${companionRows.length} additional visitor(s)</p>
                <p style="margin: 0; font-size: 14px; color: #856404;">📧 Separate emails have been sent to each companion with their individual QR codes and form links.</p>
            </div>
      `;
      
      for (let i = 0; i < companionRows.length; i++) {
        const companion = companionRows[i];
        
        // Generate QR code data for companion
        const qrData = {
          type: 'additional_visitor',
          tokenId: companion.token_id, // Use tokenId for pre-generated QR codes
          bookingId: id,
          email: companion.email,
          visitDate: booking.date,
          visitTime: booking.time_slot,
          groupLeader: `${mainVisitor.first_name} ${mainVisitor.last_name}`
        };

        // Use the pre-generated QR code and backup code from database
        const [visitorData] = await pool.query(
          `SELECT qr_code, backup_code FROM visitors WHERE email = ? AND booking_id = ? AND is_main_visitor = false`,
          [companion.email, id]
        );
        
        const companionBase64Data = visitorData[0].qr_code;
        const companionBackupCode = visitorData[0].backup_code;
        console.log(`🔑 Using backup code from database: ${companionBackupCode}`);
        
        // Generate companion form link
        const companionFormUrl = `http://localhost:5173/additional-visitor?token=${companion.token_id}`;
        
        // Send separate email to each companion
        let companionEmailContent = `Hi,\n\nYou have been invited to join a museum visit!\n\n`;
        companionEmailContent += `📅 **Visit Details**:\n`;
        companionEmailContent += `   Date: ${booking.date}\n`;
        companionEmailContent += `   Time: ${booking.time_slot}\n`;
        companionEmailContent += `   Group Leader: ${mainVisitor.first_name} ${mainVisitor.last_name}\n\n`;
        companionEmailContent += `📋 **Your QR Code**: Attached to this email\n`;
        companionEmailContent += `🔑 **Backup Code**: ${companionBackupCode} (use if QR code doesn't work)\n\n`;
        companionEmailContent += `🔗 **Complete Your Details**:\n`;
        companionEmailContent += `   Click here: ${companionFormUrl}\n\n`;
        companionEmailContent += `📝 **Important**: Please complete your details using the link above before your visit.\n\n`;
        companionEmailContent += `Thank you!\nMuseoSmart Team`;

        // Create HTML version with uniform design
        let companionEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Museum Visit Invitation - City Museum of Cagayan de Oro</title>
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
        .qr-code-section {
            background-color: #f8f9fa;
            border-left: 4px solid #8B6B21;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .qr-code-section h3 {
            color: #8B6B21;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .backup-code {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .backup-code h3 {
            color: #856404;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .code-display {
            background-color: #ffffff;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            color: #8B6B21;
            border: 1px solid #ddd;
        }
        .details-section {
            background-color: #f8f9fa;
            border-left: 4px solid #8B6B21;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .details-section h3 {
            color: #8B6B21;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .details-button {
            display: inline-block;
            background: #8B6B21;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
            font-weight: bold;
        }
        .details-section p {
            color: #333;
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
        
        <div class="greeting">Dear Visitor,</div>
        
        <div class="content">
            <p>You have been invited to join a museum visit!</p>
            
            <div class="visit-details">
                <h3>📅 Visit Details</h3>
                <p><strong>Date:</strong> ${booking.date}</p>
                <p><strong>Time:</strong> ${booking.time_slot}</p>
                <p><strong>Group Leader:</strong> ${mainVisitor.first_name} ${mainVisitor.last_name}</p>
            </div>
            
            <div class="qr-code-section">
                <h3>📱 Your QR Code</h3>
                <p>Your QR code is attached to this email. Please present it at the museum entrance for check-in.</p>
            </div>
            
            <div class="backup-code">
                <h3>🔑 Backup Code</h3>
                <p>If your QR code doesn't work, use this backup code:</p>
                <div class="code-display">${companionBackupCode}</div>
                <p style="margin-top: 15px; font-size: 14px; color: #856404;">
                    <strong>Important:</strong> Please complete your details using the link above before your visit.
                </p>
            </div>
            
            <div class="details-section">
                <h3>📝 Complete Your Details</h3>
                <p>Please click the link below to complete your information:</p>
                <a href="${companionFormUrl}" class="details-button">Complete My Details</a>
            </div>
            
            <p>Please arrive 10 minutes early for a smooth check-in experience. Bring a valid photo ID for verification purposes.</p>
        </div>
        
        <div class="signature">
            <p>We look forward to welcoming you to our museum!</p>
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

        const companionAttachments = [{
          filename: `companion_${i + 1}_qr.png`,
          content: Buffer.from(companionBase64Data, 'base64'),
          contentType: 'image/png'
        }];

        // Backup code is now stored in QR code data, no need to store separately

        // Send email to companion
        try {
          await transporter.sendMail({
            from: 'MuseoSmart <museoweb1@gmail.com>',
            to: companion.email,
            subject: 'Complete Your Museum Visit Details 🎫',
            text: companionEmailContent,
            html: companionEmailHtml,
            attachments: companionAttachments
          });
          console.log(`✅ Companion email sent to: ${companion.email}`);
        } catch (emailError) {
          console.log(`⚠️ Companion email failed for ${companion.email}:`, emailError.message);
          // Continue processing other companions
        }

        emailContent += `👤 **Companion ${i + 1} (${companion.email})**: Email sent with QR code and form link.\n`;
      }
      
      emailContent += `\n📝 **Note**: Each companion has received their own email with individual QR code and form link.\n\n`;
    }

    emailContent += `📅 **Visit Details**:\n`;
    emailContent += `   Date: ${booking.date}\n`;
    emailContent += `   Time: ${booking.time_slot}\n`;
    emailContent += `   Total Visitors: ${booking.total_visitors}\n\n`;
    emailContent += `📍 **Location**: Museum entrance\n`;
    emailContent += `⏰ **Please arrive 10 minutes before your scheduled time.**\n\n`;
    emailContent += `Thank you for choosing our museum!\n\n`;
    emailContent += `Best regards,\nMuseoSmart Team`;

    // Complete the HTML email
    emailHtml += `
            <div class="visit-details">
                <h3>📅 Visit Details</h3>
                <p><strong>Date:</strong> ${booking.date}</p>
                <p><strong>Time:</strong> ${booking.time_slot}</p>
                <p><strong>Total Visitors:</strong> ${booking.total_visitors}</p>
                <p><strong>Location:</strong> Museum entrance</p>
            </div>
            
            <div class="important-notice">
                <h4>⏰ Important Notice</h4>
                <p>Please arrive 10 minutes before your scheduled time for a smooth check-in experience.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    // 6. Send email based on booking type
    if (isWalkInScheduling || isIndWalkin) {
      // For individual walk-in, we don't need to find a token - the visitor is already in the visitors table
      if (isIndWalkin) {
        // Get form link for registration using visitor_id
        const walkInFormUrl = `http://localhost:5173/walkin-visitor?visitorId=${mainVisitor.visitor_id}`;
      
        // For individual walk-in, send single email with QR code, backup code, and form link
        // Generate QR code for immediate use
        const qrData = {
          type: 'walkin_visitor',
          visitorId: mainVisitor.visitor_id,
          bookingId: id,
          email: mainVisitor.email,
          visitDate: booking.date,
          visitTime: booking.time_slot,
          visitorName: `${mainVisitor.first_name} ${mainVisitor.last_name}`
        };
        
        const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));
        const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
        
        // Create comprehensive email with QR code attachment
        const comprehensiveWalkInEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Walk-In Visit Approved - City Museum of Cagayan de Oro</title>
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
        .registration-section {
            background-color: #f8f9fa;
            border-left: 4px solid #8B6B21;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .registration-section h3 {
            color: #8B6B21;
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
        .important-notice {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .important-notice h4 {
            color: #856404;
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
        
        <div class="greeting">Dear ${mainVisitor.first_name},</div>
        
        <div class="content">
            <p>Your walk-in museum visit has been approved for <strong>${booking.date}</strong> at <strong>${booking.time_slot}</strong>.</p>
            
            <div class="visit-details">
                <h3>📅 Visit Details</h3>
                <p><strong>Date:</strong> ${booking.date}</p>
                <p><strong>Time:</strong> ${booking.time_slot}</p>
                <p><strong>Booking ID:</strong> ${id}</p>
                <p><strong>Status:</strong> ✅ Approved</p>
            </div>
            
            <div class="registration-section">
                <h3>📋 Complete Your Registration</h3>
                <p>Please click the link below to complete your registration and get your QR code:</p>
                <a href="${walkInFormUrl}" class="registration-button">Complete My Registration</a>
            </div>
            
            <div class="important-notice">
                <h4>⏰ Important Notice</h4>
                <p><strong>24-Hour Expiration:</strong> This registration link will expire in 24 hours. Please complete your profile within this time.</p>
            </div>
            
            <p>Please complete your registration as soon as possible.</p>
        </div>
        
        <div class="signature">
            <p>We look forward to welcoming you to our museum!</p>
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
        
        // Send single email with QR code attachment and form link
        await transporter.sendMail({
          from: 'MuseoSmart <museoweb1@gmail.com>',
          to: mainVisitor.email,
          subject: '🎫 Your Walk-In Museum Visit - Complete Registration',
          html: comprehensiveWalkInEmailHtml,
          attachments: [{
            filename: 'walkin_qr_code.png',
            content: Buffer.from(base64Data, 'base64'),
            contentType: 'image/png'
          }]
        });
        
        console.log('✅ Single comprehensive individual walk-in email sent with QR code and form link');
      } else if (isWalkInScheduling) {
        // For walk-in scheduling, we need to find the walk-in token
        const walkInToken = companionRows.find(companion => 
          companion.token_id.startsWith('WALKIN-') || 
          companion.token_id.startsWith('INDWALKIN-')
        );
        
        if (walkInToken) {
          // Get form link for registration using token
          const walkInFormUrl = `http://localhost:5173/walkin-visitor?token=${walkInToken.token_id}`;
          
          // Generate QR code for immediate use
          const qrData = {
            type: 'walkin_visitor',
            tokenId: walkInToken.token_id,
            bookingId: id,
            email: mainVisitor.email,
            visitDate: booking.date,
            visitTime: booking.time_slot,
            visitorName: `${mainVisitor.first_name} ${mainVisitor.last_name}`
          };
          
          const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));
          const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
          
          // Create comprehensive email with QR code attachment
          const comprehensiveWalkInEmailHtml = `
          <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #AB8841 0%, #8B6B21 100%); padding: 30px; text-align: center; color: white;">
                  <h1 style="margin: 0; font-size: 28px;">🎫 Your Walk-In Visit is Ready!</h1>
                  <p style="margin: 10px 0 0 0; font-size: 16px;">Complete your registration and get your QR code</p>
              </div>
              
              <div style="padding: 30px; background: #faf7f1;">
                  <h2 style="color: #2e2b41; margin-bottom: 20px;">Hello ${mainVisitor.first_name}!</h2>
                  
                  <p style="color: #2e2b41;">Your walk-in museum visit has been <strong>approved</strong> for <strong>${booking.date}</strong> at <strong>${booking.time_slot}</strong>.</p>
                  
                  <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #AB8841;">
                      <h3 style="color: #AB8841; margin-top: 0;">📋 Complete Your Registration</h3>
                      <p style="color: #2e2b41;">Please click the link below to complete your registration and get your QR code:</p>
                      <a href="${walkInFormUrl}" style="display: inline-block; background: #AB8841; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; transition: background-color 0.3s;">Complete My Registration</a>
                  </div>
                  
                  <div style="background: #f5f4f7; border: 1px solid #2e2b41; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <h4 style="margin-top: 0; color: #2e2b41;">📅 Visit Details</h4>
                      <p style="color: #2e2b41;"><strong>Date:</strong> ${booking.date}</p>
                      <p style="color: #2e2b41;"><strong>Time:</strong> ${booking.time_slot}</p>
                      <p style="color: #2e2b41;"><strong>Booking ID:</strong> ${id}</p>
                      <p style="color: #2e2b41;"><strong>Status:</strong> ✅ Approved</p>
                  </div>
                  
                  <div style="background: #fdf6e3; border: 1px solid #AB8841; border-radius: 5px; padding: 15px; margin: 20px 0;">
                      <h4 style="margin-top: 0; color: #8B6B21;">⏰ Important Notice</h4>
                      <p style="margin: 0; font-size: 14px; color: #8B6B21;">
                          <strong>24-Hour Expiration:</strong> This registration link will expire in 24 hours. Please complete your profile within this time.
                      </p>
                  </div>
                  
                  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #AB8841;">
                      <p style="margin: 0 0 10px 0; font-size: 16px; color: #2e2b41;">Please complete your registration as soon as possible.</p>
                      <p style="margin: 0; color: #AB8841;">Best regards,<br><strong>MuseoSmart Team</strong></p>
                  </div>
              </div>
          </body>
          </html>
        `;
          
          // Send single email with QR code attachment and form link
          await transporter.sendMail({
            from: 'MuseoSmart <museoweb1@gmail.com>',
            to: mainVisitor.email,
            subject: '🎫 Your Walk-In Museum Visit - Complete Registration',
            html: comprehensiveWalkInEmailHtml,
            attachments: [{
              filename: 'walkin_qr_code.png',
              content: Buffer.from(base64Data, 'base64'),
              contentType: 'image/png'
            }]
          });
          
          console.log('✅ Single comprehensive walk-in scheduling email sent with QR code and form link');
        } else {
          console.log('⚠️ No walk-in token found for walk-in scheduling visitor');
        }
      }
    } else if (isGroupWalkin) {
      console.log('🎯 Processing group walk-in booking...');
      console.log('📧 Main visitor:', mainVisitor);
      console.log('👥 Companion rows:', companionRows.length);
      
      // UNIQUE GROUP WALK-IN LOGIC: Only primary visitor gets email with form link
      // Additional visitors will get QR codes directly when primary visitor completes form
      
      // For group walk-in, we already have mainVisitor from the visitors table
      if (mainVisitor && mainVisitor.visitor_id) {
        // Generate QR code for primary visitor
        const qrData = {
          type: 'walkin_visitor',
          visitorId: mainVisitor.visitor_id,
          bookingId: id,
          email: mainVisitor.email,
          visitDate: booking.date,
          visitTime: booking.time_slot,
          visitorName: `${mainVisitor.first_name} ${mainVisitor.last_name}`
        };
        
        const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));
        const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
        
        // Generate backup code
        const backupCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        
        // For group walk-in, use visitor_id for the leader form
        const primaryFormUrl = `http://localhost:5173/group-walkin-leader?visitorId=${mainVisitor.visitor_id}`;
        
        const groupWalkInPrimaryEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Group Museum Visit - City Museum of Cagayan de Oro</title>
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
        .group-registration {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .group-registration h3 {
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
        .important-notice {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .important-notice h4 {
            color: #856404;
            margin-top: 0;
            margin-bottom: 15px;
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
        
        <div class="greeting">Dear Group Leader,</div>
        
        <div class="content">
            <p>Your group walk-in museum visit has been <strong>approved</strong> for <strong>${booking.date}</strong> at <strong>${booking.time_slot}</strong>.</p>
            
            <div class="visit-details">
                <h3>📅 Visit Details</h3>
                <p><strong>Date:</strong> ${booking.date}</p>
                <p><strong>Time:</strong> ${booking.time_slot}</p>
                <p><strong>Booking ID:</strong> ${id}</p>
                <p><strong>Group Size:</strong> ${companionRows.length} visitors</p>
                <p><strong>Status:</strong> ✅ Approved</p>
            </div>
            
            <div class="group-registration">
                <h3>📋 Complete Your Group Leader Registration</h3>
                <p>As the group leader, please complete your registration with ALL details including institution and purpose of visit. This information will be shared with all group members.</p>
                <a href="${primaryFormUrl}" class="registration-button">Complete Group Leader Registration</a>
            </div>
            
            <div class="group-info">
                <h4>👥 Group Information</h4>
                <p><strong>Important:</strong> After you complete your registration, all group members will automatically receive their QR codes via email. They will only need to provide their basic details (name, gender, address) - institution and purpose will be inherited from your information.</p>
            </div>
            
            <div class="expiration-notice">
                <h4>⏰ Important Notice</h4>
                <p><strong>24-Hour Expiration:</strong> This link will expire in 24 hours. Please complete your profile within this time to receive your QR code and send QR codes to group members.</p>
            </div>
            
            <p>Please complete your profile as soon as possible to receive your QR code and send QR codes to group members.</p>
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
        
        await transporter.sendMail({
          from: 'MuseoSmart <museoweb1@gmail.com>',
          to: mainVisitor.email,
          subject: '🎫 Your Group Walk-In Museum Visit - Complete Group Leader Registration',
          html: groupWalkInPrimaryEmailHtml,
          attachments: [{
            filename: 'group_leader_qr_code.png',
            content: Buffer.from(base64Data, 'base64'),
            contentType: 'image/png'
          }]
        });
        
        // Store QR code and backup code in database
        await pool.query(
          `UPDATE visitors SET qr_code = ?, backup_code = ? WHERE visitor_id = ?`,
          [base64Data, backupCode, mainVisitor.visitor_id]
        );
        
        console.log('✅ Group walk-in leader email sent with QR code and form link');
        console.log('📧 Email sent to:', mainVisitor.email);
        console.log('🔗 Form URL:', primaryFormUrl);
      } else {
        console.log('❌ No mainVisitor or visitor_id found for group walk-in');
      }
    } else {
      // Send regular booking email
      try {
        await transporter.sendMail({
          from: 'MuseoSmart <museoweb1@gmail.com>',
          to: mainVisitor.email,
          subject: 'Your Museum Visit is Confirmed! 🎫',
          text: emailContent,
          html: emailHtml,
          attachments: attachments
        });
        console.log('✅ Main visitor email sent successfully');
      } catch (emailError) {
        console.log('⚠️ Email sending failed, but booking approved:', emailError.message);
        // Continue with success response even if email fails
      }
    }

    try { await logActivity(req, 'booking.approve', { bookingId: id, emailSent: true, companions: companionRows.length }); } catch {}
    res.json({ 
      success: true, 
      message: (isWalkInScheduling || isIndWalkin || isGroupWalkin) ? 
        'Walk-in booking approved and email sent with profile completion link (24-hour expiration)!' : 
        `Booking approved and email sent! ${companionRows.length > 0 ? `Generated ${companionRows.length} companion QR codes.` : ''}` 
    });
  } catch (err) {
    console.error('Error approving booking:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Cancel a booking
router.put('/bookings/:id/cancel', isAuthenticated, async (req, res) => {
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
router.put('/bookings/:id/reject', isAuthenticated, async (req, res) => {
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
router.delete('/bookings/:id', isAuthenticated, async (req, res) => {
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
      console.log('🔍 Primary visitor data from database:', {
        first_name: visitor.first_name,
        last_name: visitor.last_name,
        email: visitor.email,
        gender: visitor.gender,
        visitor_type: visitor.visitor_type,
        address: visitor.address,
        institution: visitor.institution,
        purpose: visitor.purpose,
        is_main_visitor: visitor.is_main_visitor
      });
    } else {
      console.log('❌ No primary visitor found for booking ID:', id);
    }
    
    // Update visitor status and check-in time
    if (visitor) {
      await pool.query(
        `UPDATE visitors SET status = 'visited', checkin_time = NOW() WHERE visitor_id = ?`,
        [visitor.visitor_id]
      );
      
      // Update booking name with actual visitor name
      await pool.query(
        `UPDATE bookings SET first_name = ?, last_name = ? WHERE booking_id = ?`,
        [visitor.first_name, visitor.last_name, id]
      );
    }
    
    // Keep booking status as 'Approved' - no need to update to 'checked-in' or 'visited'
    // Individual visitor status is updated to 'visited' when QR is scanned
    
    try { await logActivity(req, 'visitor.checkin', { bookingId: id, visitorId: visitor?.visitor_id }); } catch {}
    
    // Get the actual check-in time that was just set
    const [checkinTimeResult] = await pool.query(
      `SELECT checkin_time FROM visitors WHERE visitor_id = ?`,
      [visitor.visitor_id]
    );
    
    const actualCheckinTime = checkinTimeResult[0]?.checkin_time;
    
    res.json({
      success: true,
      message: 'Primary visitor checked in successfully!',
      visitor: visitor ? {
        firstName: visitor.first_name,
        lastName: visitor.last_name,
        email: visitor.email,
        gender: visitor.gender,
        visitorType: visitor.visitor_type,
        visitorCategory: 'primary_visitor',
        address: visitor.address,
        institution: visitor.institution || 'N/A',
        purpose: visitor.purpose || 'N/A',
        visitDate: booking.date,
        visitTime: booking.time_slot,
        checkin_time: actualCheckinTime ? actualCheckinTime.toISOString() : new Date().toISOString()
      } : null
    });
    
  } catch (err) {
    console.error('Error during check-in:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Unified QR scanning endpoint for group members and legacy primary visitors
router.post('/visit/qr-scan', async (req, res) => {
  const { qrData } = req.body;
  
  if (!qrData) {
    return res.status(400).json({ 
      success: false, 
      error: 'QR data is required' 
    });
  }

  try {
    const qrInfo = JSON.parse(qrData);
    
    if (qrInfo.type === 'additional_visitor') {
      // UNIFIED LOGIC FOR ALL VISITORS (now using visitors table)
      const { visitorId, tokenId } = qrInfo;
      
      console.log('🎯 Processing Additional Visitor QR Code:', { visitorId, tokenId });
      console.log('🔍 QR Code Data:', qrInfo);
      
      let visitorRows;
      
      if (visitorId) {
        // New QR codes with visitorId - fetch complete visitor data
        [visitorRows] = await pool.query(
          `SELECT 
            v.visitor_id,
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
            v.is_main_visitor,
            b.date as visit_date, 
            b.time_slot, 
            b.status as booking_status
           FROM visitors v
           JOIN bookings b ON v.booking_id = b.booking_id
           WHERE v.visitor_id = ? AND v.is_main_visitor = false`,
          [visitorId]
        );
      } else if (tokenId) {
        // Legacy QR codes with tokenId - find visitor by email from token
        const [tokenRows] = await pool.query(
          `SELECT email FROM additional_visitors WHERE token_id = ?`,
          [tokenId]
        );
        
        if (tokenRows.length === 0) {
          return res.status(404).json({ 
            success: false, 
            error: 'Token not found or expired' 
          });
        }
        
        const tokenEmail = tokenRows[0].email;
        
        [visitorRows] = await pool.query(
          `SELECT 
            v.visitor_id,
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
            v.is_main_visitor,
            b.date as visit_date, 
            b.time_slot, 
            b.status as booking_status
           FROM visitors v
           JOIN bookings b ON v.booking_id = b.booking_id
           WHERE v.email = ? AND v.is_main_visitor = false
           ORDER BY v.visitor_id DESC LIMIT 1`,
          [tokenEmail]
        );
      } else {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid QR code format' 
        });
      }
      
      if (visitorRows.length === 0) {
        console.log('❌ No visitor found with the given criteria');
        return res.status(404).json({ 
          success: false, 
          error: 'Additional visitor not found' 
        });
      }
      
      console.log('✅ Found visitor record:', visitorRows.length, 'records');
      
      const visitor = visitorRows[0];
      console.log('📋 Visitor Info:', {
        visitor_id: visitor.visitor_id,
        first_name: visitor.first_name,
        last_name: visitor.last_name,
        gender: visitor.gender,
        address: visitor.address,
        visitor_type: visitor.visitor_type,
        institution: visitor.institution,
        purpose: visitor.purpose,
        status: visitor.status,
        booking_status: visitor.booking_status,
        email: visitor.email
      });
      
      // Check if booking is valid
      if (visitor.booking_status === 'cancelled') {
        return res.status(400).json({ 
          success: false, 
          error: 'This booking has been cancelled and cannot be checked in.',
          status: visitor.booking_status 
        });
      }
      
      // Check if QR code has already been used (PREVENT RE-SCANNING)
      if (visitor.qr_used === 1 || visitor.qr_used === true) {
        return res.status(400).json({ 
          success: false, 
          error: 'This QR code has already been used and cannot be scanned again.',
          qrUsed: true
        });
      }
      
      // Check if already checked in (PREVENT RE-SCANNING)
      if (visitor.status === 'visited') {
        return res.status(400).json({ 
          success: false, 
          error: 'This visitor has already been checked in.',
          status: visitor.status,
          alreadyCheckedIn: true
        });
      }
      
      // STEP 1: Update visitors table with check-in time and mark QR as used
      console.log('⏰ Setting check-in time for additional visitor and marking QR as used...');
      await pool.query(
        `UPDATE visitors 
         SET status = 'visited', checkin_time = NOW(), qr_used = TRUE
         WHERE visitor_id = ?`,
        [visitor.visitor_id]
      );
      
      // Update booking name with actual visitor name (use the first visitor's name if this is the first check-in)
      const [bookingCheck] = await pool.query(
        `SELECT first_name, last_name FROM bookings WHERE booking_id = ?`,
        [visitor.booking_id]
      );
      
      // Only update if booking still has generic name
      if (bookingCheck[0] && 
          (bookingCheck[0].first_name === 'Walk-in Visitor' || 
           bookingCheck[0].first_name === 'Group Visitor' ||
           bookingCheck[0].last_name === 'Visitor')) {
        await pool.query(
          `UPDATE bookings SET first_name = ?, last_name = ? WHERE booking_id = ?`,
          [visitor.first_name, visitor.last_name, visitor.booking_id]
        );
      }
      
      // STEP 2: Get the actual check-in time that was just set
      const [checkinTimeResult] = await pool.query(
        `SELECT checkin_time FROM visitors WHERE visitor_id = ?`,
        [visitor.visitor_id]
      );
      
      const actualCheckinTime = checkinTimeResult[0].checkin_time;
      console.log('📅 Actual check-in time:', actualCheckinTime);
      
      // STEP 3: Check if all visitors are checked in (for booking status)
      const [allVisitors] = await pool.query(
        `SELECT 
          COUNT(*) as total_visitors,
          COUNT(CASE WHEN status = 'visited' THEN 1 END) as checked_in_visitors
        FROM visitors 
        WHERE booking_id = ?`,
        [visitor.booking_id]
      );
      
      const visitorCount = allVisitors[0];
      console.log('📊 Visitor Count:', {
        total: visitorCount.total_visitors,
        checkedIn: visitorCount.checked_in_visitors
      });
      
      // Keep booking status as 'Approved' - no need to update to 'checked-in'
      // Individual visitor status is updated to 'visited' when QR is scanned
      
      // STEP 4: Log activity
      try { 
        await logActivity(req, 'visitor.checkin', { visitorId: visitor.visitor_id, bookingId: visitor.booking_id }); 
      } catch (error) {
        console.log('⚠️ Activity logging failed:', error.message);
      }
      
      // STEP 5: Return success response
      res.json({
        success: true,
        message: 'Additional visitor checked in successfully!',
        visitor: {
          firstName: visitor.first_name,
          lastName: visitor.last_name,
          email: visitor.email,
          gender: visitor.gender,
          visitorType: visitor.visitor_type,
          visitorCategory: 'additional_visitor',
          address: visitor.address,
          institution: visitor.institution || 'N/A',
          purpose: visitor.purpose || 'N/A',
          visitDate: visitor.visit_date,
          visitTime: visitor.time_slot,
          checkin_time: actualCheckinTime ? actualCheckinTime.toISOString() : new Date().toISOString()
        }
      });
      
      console.log('🎉 Additional visitor check-in completed successfully!');
      
    } else if (qrInfo.type === 'primary_visitor') {
      // Handle legacy primary visitor QR code
      const { visitorId } = qrInfo;
      
      // Get visitor information
      const [visitorRows] = await pool.query(
        `SELECT v.*, b.date as visit_date, b.time_slot, b.status as booking_status
         FROM visitors v
         JOIN bookings b ON v.booking_id = b.booking_id
         WHERE v.visitor_id = ? AND v.is_main_visitor = true`,
        [visitorId]
      );
      
      if (visitorRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Primary visitor not found' 
        });
      }
      
      const visitor = visitorRows[0];
      console.log('🔍 Primary visitor data from database:', {
        first_name: visitor.first_name,
        last_name: visitor.last_name,
        email: visitor.email,
        gender: visitor.gender,
        visitor_type: visitor.visitor_type,
        address: visitor.address,
        institution: visitor.institution,
        purpose: visitor.purpose,
        visit_date: visitor.visit_date,
        time_slot: visitor.time_slot
      });
      
      // Check if booking is valid
      if (visitor.booking_status === 'cancelled') {
        return res.status(400).json({ 
          success: false, 
          error: 'This booking has been cancelled and cannot be checked in.',
          status: visitor.booking_status 
        });
      }
      
      // Check if QR code has already been used (PREVENT RE-SCANNING)
      if (visitor.qr_used === 1 || visitor.qr_used === true) {
        return res.status(400).json({ 
          success: false, 
          error: 'This QR code has already been used and cannot be scanned again.',
          qrUsed: true
        });
      }
      
      if (visitor.status === 'visited') {
        return res.status(400).json({ 
          success: false, 
          error: 'This visitor has already been checked in.',
          status: visitor.status 
        });
      }
      
      // Update visitor status to visited, set check-in time, and mark QR as used
      await pool.query(
        `UPDATE visitors SET status = 'visited', checkin_time = NOW(), qr_used = TRUE WHERE visitor_id = ?`,
        [visitorId]
      );
      
      // Check if all visitors for this booking are checked in
      const [allVisitors] = await pool.query(
        `SELECT 
          (SELECT COUNT(*) FROM visitors WHERE booking_id = ? AND is_main_visitor = 1) as main_visitors,
          (SELECT COUNT(*) FROM visitors WHERE booking_id = ? AND is_main_visitor = 1 AND status = 'visited') as main_checked_in,
          (SELECT COUNT(*) FROM visitors WHERE booking_id = ? AND is_main_visitor = 0) as additional_visitors,
          (SELECT COUNT(*) FROM visitors WHERE booking_id = ? AND is_main_visitor = 0 AND status = 'visited') as additional_checked_in
        `,
        [visitor.booking_id, visitor.booking_id, visitor.booking_id, visitor.booking_id]
      );
      
      const visitorCount = allVisitors[0];
      const totalVisitors = visitorCount.main_visitors + visitorCount.additional_visitors;
      const checkedInVisitors = visitorCount.main_checked_in + visitorCount.additional_checked_in;
      
      // Keep booking status as 'Approved' - no need to update to 'checked-in'
      // Individual visitor status is updated to 'visited' when QR is scanned
      
      try { await logActivity(req, 'visitor.checkin', { bookingId: visitor.booking_id, visitorId }); } catch {}
      
      // Get the actual check-in time from the database
      const [checkinTimeResult] = await pool.query(
        `SELECT checkin_time FROM visitors WHERE visitor_id = ?`,
        [visitorId]
      );
      
      const actualCheckinTime = checkinTimeResult[0].checkin_time;
      
      const responseData = {
        success: true,
        message: 'Primary visitor checked in successfully!',
        visitor: {
          firstName: visitor.first_name,
          lastName: visitor.last_name,
          email: visitor.email,
          gender: visitor.gender,
          visitorType: visitor.visitor_type,
          visitorCategory: 'primary_visitor',
          address: visitor.address,
          institution: visitor.institution || 'N/A',
          purpose: visitor.purpose || 'N/A',
          visitDate: visitor.visit_date,
          visitTime: visitor.time_slot,
          checkin_time: actualCheckinTime ? actualCheckinTime.toISOString() : new Date().toISOString()
        }
      };
      
      console.log('🔍 Primary visitor response data:', responseData);
      
      res.json(responseData);
      
         } else if (qrInfo.type === 'walkin_visitor') {
           // Handle walk-in visitor QR code
           const { visitorId } = qrInfo;
           
           console.log('🎯 Processing Walk-in Visitor QR Code:', visitorId);
           
           // Determine which check-in endpoint to use based on visitor type
           let checkinUrl;
           if (visitorId.toString().startsWith('GROUP-') || visitorId.toString().includes('WALKIN-')) {
             // Additional visitor or group walk-in - use walkin-visitors endpoint
             checkinUrl = `${req.protocol}://${req.get('host')}/api/walkin-visitors/${visitorId}/checkin`;
           } else {
             // Individual walk-in visitor - use individual-walkin endpoint
             checkinUrl = `${req.protocol}://${req.get('host')}/api/individual-walkin/${visitorId}/checkin`;
           }
           console.log('🌐 Walk-in check-in URL:', checkinUrl);
           
           const checkinResponse = await fetch(checkinUrl, {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
             }
           });
           
           console.log('📡 Walk-in check-in response status:', checkinResponse.status);
           
           if (!checkinResponse.ok) {
             const errorData = await checkinResponse.json();
             console.error('❌ Walk-in check-in failed:', errorData);
             return res.status(checkinResponse.status).json({
               success: false,
               error: errorData.error || 'Failed to check in walk-in visitor'
             });
           }
           
           const checkinData = await checkinResponse.json();
           console.log('✅ Walk-in check-in success:', checkinData);
           
           res.json({
             success: true,
             message: checkinData.message,
             visitor: checkinData.visitor
           });
           
         } else if (qrInfo.type === 'group_walkin_visitor') {
           // Handle group walk-in visitor QR code
           const { tokenId } = qrInfo;
           
           console.log('🎯 Processing Group Walk-in Visitor QR Code:', tokenId);
           
           // Use the new group-walkin-visitors endpoint
           const checkinUrl = `${req.protocol}://${req.get('host')}/api/group-walkin-visitors/${tokenId}/checkin`;
           console.log('🌐 Group walk-in check-in URL:', checkinUrl);
           
           const checkinResponse = await fetch(checkinUrl, {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
             }
           });
           
           console.log('📡 Group walk-in check-in response status:', checkinResponse.status);
           
           if (!checkinResponse.ok) {
             const errorData = await checkinResponse.json();
             console.error('❌ Group walk-in check-in failed:', errorData);
             return res.status(checkinResponse.status).json({
               success: false,
               error: errorData.message || 'Failed to check in group walk-in visitor'
             });
           }
           
           const checkinData = await checkinResponse.json();
           console.log('✅ Group walk-in check-in success:', checkinData);
           
           res.json({
             success: true,
             message: checkinData.message,
             visitor: checkinData.visitor
           });
           
         } else {
       return res.status(400).json({ 
         success: false, 
         error: 'Invalid QR code type. Expected "additional_visitor", "primary_visitor", "walkin_visitor", or "group_walkin_visitor".' 
       });
     }
    
  } catch (err) {
    console.error('Error processing QR scan:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process QR code: ' + err.message 
    });
  }
});

module.exports = router;
