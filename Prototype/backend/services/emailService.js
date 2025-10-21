const nodemailer = require('nodemailer');

// Create transporter (configure with your email service)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'museoweb1@gmail.com',
      pass: 'akrtgds yyprsfxyi'
    }
  });
};

// Send event registration approval email with QR code and unique ID
const sendEventApprovalEmail = async (registrationData) => {
  try {
    const transporter = createTransporter();
    
    const { 
      firstname, 
      lastname, 
      email, 
      event_title, 
      start_date, 
      time, 
      location, 
      qr_code,
      registration_id
    } = registrationData;
    
    const fullName = `${firstname} ${lastname}`;
    const eventDate = new Date(start_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const eventTime = time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }) : 'TBD';
    
    console.log('📧 Preparing elegant invitation email with QR code attachment for:', email);
    console.log('🔍 QR Code data length:', qr_code ? qr_code.length : 'No QR code');
    
    // Prepare attachments array
    let attachments = [];
    
    if (qr_code) {
      // Convert data URL to base64 buffer for attachment
      const base64Data = qr_code.replace(/^data:image\/png;base64,/, '');
      attachments.push({
        filename: `invitation_qr_code_${registration_id}.png`,
        content: Buffer.from(base64Data, 'base64'),
        contentType: 'image/png'
      });
    }
    
    const mailOptions = {
      from: 'MuseoSmart <museoweb1@gmail.com>',
      to: email,
      subject: `Event Registration Approved - ${event_title}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Registration - City Museum of Cagayan de Oro</title>
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
        .event-details {
            background-color: #f8f9fa;
            border-left: 4px solid #8B6B21;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .event-details h3 {
            color: #8B6B21;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .event-details ul {
            margin: 0;
            padding-left: 20px;
        }
        .event-details li {
            margin-bottom: 8px;
        }
        .access-code {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .access-code h3 {
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
        
        <div class="greeting">Dear ${fullName},</div>
        
        <div class="content">
            <p>We are delighted to inform you that your registration for our upcoming event has been approved. We look forward to welcoming you to this special occasion.</p>
            
            <div class="event-details">
                <h3>📅 Event Details</h3>
                <ul>
                    <li><strong>Event:</strong> ${event_title}</li>
                    <li><strong>Date:</strong> ${eventDate}</li>
                    <li><strong>Time:</strong> ${eventTime}</li>
                    <li><strong>Location:</strong> ${location}</li>
                </ul>
            </div>
            
            <div class="access-code">
                <h3>🔑 Your Access Code</h3>
                <p>Please bring this access code for check-in at the event:</p>
                <div class="code-display">${registration_id}</div>
                <p style="margin-top: 15px; font-size: 14px; color: #856404;">You can also use your QR code if you have it saved on your device.</p>
            </div>
            
            <p>Please arrive 10 minutes early for a smooth check-in experience. Bring a valid photo ID for verification purposes and dress appropriately for the event atmosphere.</p>
            
            <p>If you need to cancel or have any questions, please contact us as soon as possible.</p>
        </div>
        
        <div class="signature">
            <p>We look forward to welcoming you to this special event!</p>
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
      `,
      attachments: attachments
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Elegant event invitation email sent with QR code attachment:', result.messageId);
    return result;
    
  } catch (error) {
    console.error('❌ Error sending elegant event invitation email:', error);
    throw error;
  }
};

// Send event reminder email
const sendEventReminderEmail = async (registrationData) => {
  try {
    const transporter = createTransporter();
    
    const { fullName, email, event, qrCode } = registrationData;
    
    const mailOptions = {
      from: 'MuseoSmart <museoweb1@gmail.com>',
      to: email,
      subject: `Event Reminder - ${event.title} Tomorrow`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Reminder - City Museum of Cagayan de Oro</title>
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
        .event-details {
            background-color: #f8f9fa;
            border-left: 4px solid #8B6B21;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .event-details h3 {
            color: #8B6B21;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .event-details ul {
            margin: 0;
            padding-left: 20px;
        }
        .event-details li {
            margin-bottom: 8px;
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
        
        <div class="greeting">Dear ${fullName},</div>
        
        <div class="content">
            <p>This is a friendly reminder that you have an event tomorrow! We're excited to see you there.</p>
            
            <div class="event-details">
                <h3>📅 Event Details</h3>
                <ul>
                    <li><strong>Event:</strong> ${event.title}</li>
                    <li><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</li>
                    <li><strong>Time:</strong> ${event.time}</li>
                    <li><strong>Location:</strong> ${event.location}</li>
                </ul>
            </div>
            
            ${qrCode ? `
            <div style="text-align: center; margin: 20px 0; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
                <h3 style="color: #8B6B21; margin-top: 0;">Your QR Code</h3>
                <p style="color: #666; margin-bottom: 15px;">Don't forget to bring your QR code for check-in:</p>
                <img src="${qrCode}" alt="Registration QR Code" style="max-width: 200px; border: 2px solid #ddd; border-radius: 8px;">
            </div>
            ` : ''}
            
            <p>Please set your alarm for tomorrow, plan your route to the venue, and arrive 10 minutes early. Don't forget to bring your QR code or registration confirmation and a valid ID.</p>
        </div>
        
        <div class="signature">
            <p>We're excited to see you tomorrow!</p>
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
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Event reminder email sent:', result.messageId);
    return result;
    
  } catch (error) {
    console.error('❌ Error sending event reminder email:', error);
    throw error;
  }
};

module.exports = {
  sendEventApprovalEmail,
  sendEventReminderEmail
};

