const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const nodemailer = require('nodemailer');
const router = express.Router();
const { logActivity, logUserActivity } = require('../utils/activityLogger');
const donationAIService = require('../services/donationAIService');

// Session-based authentication middleware
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

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/donations');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Test nodemailer import
console.log('📧 Nodemailer import test:');
console.log('- Nodemailer object:', typeof nodemailer);
console.log('- Nodemailer version:', nodemailer.version);
console.log('- createTransport function:', typeof nodemailer.createTransport);

// Email configuration - using the same email as QR code system
const createTransporter = () => {
  console.log('🔧 Creating email transporter with Gmail configuration...');
  console.log('📧 Nodemailer version:', nodemailer.version);
  console.log('📧 Nodemailer createTransport function:', typeof nodemailer.createTransport);
  
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'museoweb1@gmail.com',
        pass: 'akrtgds yyprsfxyi'
      }
    });
    
    // Test the transporter configuration
    transporter.verify(function(error, success) {
      if (error) {
        console.error('❌ Email transporter verification failed:', error);
      } else {
        console.log('✅ Email transporter is ready to send emails');
      }
    });
    
    return transporter;
  } catch (error) {
    console.error('❌ Error creating transporter:', error);
    throw error;
  }
};

// Enhanced email function with HTML template
const sendAppreciationLetter = async (donorName, donorEmail, donationDetails) => {
  const {
    type,
    request_date,
    amount,
    item_description,
    estimated_value,
    method
  } = donationDetails;

  // Format the donation details for display
  const formatDonationDetails = () => {
    let details = [];
    
    if (type === 'monetary' && amount) {
      details.push(`<strong>Amount:</strong> ₱${parseFloat(amount).toLocaleString()}`);
      details.push(`<strong>Payment Method:</strong> Cash (with proof of payment)`);
    }
    
    if (item_description) {
      details.push(`<strong>Item Description:</strong> ${item_description}`);
    }
    
    if (estimated_value) {
      details.push(`<strong>Estimated Value:</strong> ₱${parseFloat(estimated_value).toLocaleString()}`);
    }

    if (type === 'artifact') {
      details.push(`<strong>Legal Documentation:</strong> Ownership certificates and provenance documents provided`);
    }
    
    return details.map(detail => `<li>${detail}</li>`).join('');
  };

  const donationTypeLabels = {
    monetary: 'Monetary Donation',
    artifact: 'Artifact/Historical Item',
    loan: 'Loan (Temporary)'
  };

  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appreciation Letter - City Museum of Cagayan de Oro</title>
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
        .donation-details {
            background-color: #f8f9fa;
            border-left: 4px solid #8B6B21;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .donation-details h3 {
            color: #8B6B21;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .donation-details ul {
            margin: 0;
            padding-left: 20px;
        }
        .donation-details li {
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
        
        <div class="greeting">Dear ${donorName},</div>
        
        <div class="content">
            <p>On behalf of the entire team at the City Museum of Cagayan de Oro, I am delighted to inform you that your generous donation has been approved and accepted with great appreciation.</p>
            
            <p>Your contribution plays a vital role in our mission to preserve and showcase the rich cultural heritage of Cagayan de Oro. Your support enables us to continue our work in educating the community and future generations about our city's history and cultural significance.</p>
            
            <div class="donation-details">
                <h3>📋 Donation Details</h3>
                <ul>
                    <li><strong>Type:</strong> ${donationTypeLabels[type]}</li>
                    <li><strong>Date Submitted:</strong> ${new Date(request_date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</li>
                    ${formatDonationDetails()}
                </ul>
            </div>
            
            <p>We are truly grateful for your generosity and commitment to preserving our cultural heritage. Your donation will be carefully documented and utilized to enhance our museum's collections and educational programs.</p>
            
            <p>Our team will contact you soon to arrange the collection or transfer of your donation, and to discuss any specific requirements or arrangements you may have.</p>
        </div>
        
        <div class="signature">
            <p>Once again, thank you for your invaluable support.</p>
            <p class="signature-name">Dr. Maria Santos</p>
            <p class="signature-title">Museum Director</p>
            <p class="signature-title">City Museum of Cagayan de Oro</p>
        </div>
        
        <div class="contact-info">
            <h4>📞 Contact Information</h4>
            <p>📍 Address: City Hall Complex, Cagayan de Oro City</p>
            <p>📧 Email: museum@cagayandeoro.gov.ph</p>
            <p>📱 Phone: (088) 123-4567</p>
            <p>🌐 Website: www.cagayandeoromuseum.gov.ph</p>
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

  const textVersion = `
Dear ${donorName},

On behalf of the entire team at the City Museum of Cagayan de Oro, I am delighted to inform you that your generous donation has been approved and accepted with great appreciation.

Your contribution plays a vital role in our mission to preserve and showcase the rich cultural heritage of Cagayan de Oro. Your support enables us to continue our work in educating the community and future generations about our city's history and cultural significance.

DONATION DETAILS:
- Type: ${donationTypeLabels[type]}
- Date Submitted: ${new Date(request_date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
${type === 'monetary' && amount ? `- Amount: ₱${parseFloat(amount).toLocaleString()}` : ''}
${method ? `- Payment Method: ${method}` : ''}
${item_description ? `- Item Description: ${item_description}` : ''}
${estimated_value ? `- Estimated Value: ₱${parseFloat(estimated_value).toLocaleString()}` : ''}

We are truly grateful for your generosity and commitment to preserving our cultural heritage. Your donation will be carefully documented and utilized to enhance our museum's collections and educational programs.

Our team will contact you soon to arrange the collection or transfer of your donation, and to discuss any specific requirements or arrangements you may have.

Once again, thank you for your invaluable support.

Best regards,
Dr. Maria Santos
Museum Director
City Museum of Cagayan de Oro

Contact Information:
Address: City Hall Complex, Cagayan de Oro City
Email: museum@cagayandeoro.gov.ph
Phone: (088) 123-4567
Website: www.cagayandeoromuseum.gov.ph

Share Your Feedback:
We value your opinion! Please share your experience with our museum:
Leave a Review: https://www.google.com/search?sca_esv=58ed7cc7eaa43e58&si=AMgyJEtREmoPL4P1I5IDCfuA8gybfVI2d5Uj7QMwYCZHKDZ-Eza3w70XE2bUhl_4JHIdJFwpiaWTxArrylZEC6pyrvuevVsptVu8TTqCekY0DtTwj2tQXcX9gjlgiec1Gt_YJwotEOq0OP914icPZV23Y7AURlQAYFgLV0vLtHf5igQ9by3V2oz6UcZXVDs6YOODx64rthNz&q=City+Museum+of+Cagayan+de+Oro+and+Heritage+Studies+Center+Reviews&sa=X&ved=2ahUKEwidju-_woiQAxX8dvUHHbtIHT0Q0bkNegQIIxAE&cshid=1759511386989816&biw=1536&bih=695&dpr=1.25#lrd=0x32fff2d5e2fc9e2d:0x11e18344b68beb41,3,,,,
  `;

  try {
    console.log('📧 Creating email transporter...');
    // Create transporter
    const transporter = createTransporter();
    console.log('✅ Email transporter created successfully');
    
    // Send email
    const mailOptions = {
      from: 'museoweb1@gmail.com',
      to: donorEmail,
      subject: 'Thank You for Your Generous Donation - City Museum of Cagayan de Oro',
      text: textVersion,
      html: htmlTemplate
    };

    console.log('📧 Mail options prepared:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      htmlLength: htmlTemplate.length,
      textLength: textVersion.length
    });

    console.log('📧 Attempting to send email...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('📧 APPRECIATION LETTER SENT SUCCESSFULLY:');
    console.log('To:', donorEmail);
    console.log('Message ID:', info.messageId);
    console.log('Subject: Thank You for Your Generous Donation - City Museum of Cagayan de Oro');
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ ERROR SENDING EMAIL:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      command: error.command
    });
    
    // Fallback: Log the email content for manual sending
    console.log('📧 EMAIL CONTENT (for manual sending):');
    console.log('To:', donorEmail);
    console.log('Subject: Thank You for Your Generous Donation - City Museum of Cagayan de Oro');
    console.log('HTML Content Length:', htmlTemplate.length);
    console.log('Text Content Length:', textVersion.length);
    
    return { success: false, error: error.message };
  }
};

// Generate appreciation letter HTML for PDF download
const generateAppreciationLetterHTML = (donorName, donationDetails) => {
  const {
    type,
    date_received,
    amount,
    item_description,
    estimated_value,
    method
  } = donationDetails;

  const formatDonationDetails = () => {
    let details = [];
    
    if (type === 'monetary' && amount) {
      details.push(`<strong>Amount:</strong> ₱${parseFloat(amount).toLocaleString()}`);
    }
    
    if (method) {
      details.push(`<strong>Payment Method:</strong> ${method}`);
    }
    
    if (item_description) {
      details.push(`<strong>Item Description:</strong> ${item_description}`);
    }
    
    if (estimated_value) {
      details.push(`<strong>Estimated Value:</strong> ₱${parseFloat(estimated_value).toLocaleString()}`);
    }
    
    return details.map(detail => `<li>${detail}</li>`).join('');
  };

  const donationTypeLabels = {
    monetary: 'Monetary Donation',
    artifact: 'Artifact/Historical Item',
    loan: 'Loan (Temporary)'
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appreciation Letter - ${donorName}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #8B6B21;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #8B6B21;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            font-size: 16px;
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
        .donation-details {
            background-color: #f8f9fa;
            border-left: 4px solid #8B6B21;
            padding: 20px;
            margin: 20px 0;
        }
        .donation-details h3 {
            color: #8B6B21;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .donation-details ul {
            margin: 0;
            padding-left: 20px;
        }
        .donation-details li {
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
        .contact-info {
            background-color: #8B6B21;
            color: white;
            padding: 15px;
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
    <div class="header">
        <div class="logo">🏛️ City Museum of Cagayan de Oro</div>
        <div class="subtitle">Preserving Our Cultural Heritage</div>
    </div>
    
    <div class="date">${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })}</div>
    
    <div class="greeting">Dear ${donorName},</div>
    
    <div class="content">
        <p>On behalf of the entire team at the City Museum of Cagayan de Oro, I am delighted to inform you that your generous donation has been approved and accepted with great appreciation.</p>
        
        <p>Your contribution plays a vital role in our mission to preserve and showcase the rich cultural heritage of Cagayan de Oro. Your support enables us to continue our work in educating the community and future generations about our city's history and cultural significance.</p>
        
        <div class="donation-details">
            <h3>📋 Donation Details</h3>
            <ul>
                <li><strong>Type:</strong> ${donationTypeLabels[type]}</li>
                    <li><strong>Date Submitted:</strong> ${new Date(date_received).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</li>
                ${formatDonationDetails()}
            </ul>
        </div>
        
        <p>We are truly grateful for your generosity and commitment to preserving our cultural heritage. Your donation will be carefully documented and utilized to enhance our museum's collections and educational programs.</p>
        
        <p>Our team will contact you soon to arrange the collection or transfer of your donation, and to discuss any specific requirements or arrangements you may have.</p>
    </div>
    
    <div class="signature">
        <p>Once again, thank you for your invaluable support.</p>
        <p class="signature-name">Dr. Maria Santos</p>
        <p class="signature-title">Museum Director</p>
        <p class="signature-title">City Museum of Cagayan de Oro</p>
    </div>
    
    <div class="contact-info">
        <h4>📞 Contact Information</h4>
        <p>📍 Address: City Hall Complex, Cagayan de Oro City</p>
        <p>📧 Email: museum@cagayandeoro.gov.ph</p>
        <p>📱 Phone: (088) 123-4567</p>
        <p>🌐 Website: www.cagayandeoromuseum.gov.ph</p>
    </div>
</body>
</html>
  `;
};

// Simple email function (you can replace with nodemailer for production)
const sendEmail = async (to, subject, message) => {
  // For now, we'll just log the email
  // In production, use nodemailer or similar service
  console.log('📧 Email would be sent:');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Message:', message);
  
  // TODO: Implement actual email sending
  // Example with nodemailer:
  // const transporter = nodemailer.createTransporter({
  //   service: 'gmail',
  //   auth: { user: 'your-email@gmail.com', pass: 'your-password' }
  // });
  // await transporter.sendMail({ from: 'museum@example.com', to, subject, text: message });
};

// CREATE donation (POST)
router.post('/', isAuthenticated, logUserActivity, upload.fields([
  { name: 'payment_proof', maxCount: 1 },
  { name: 'legal_documents', maxCount: 1 }
]), async (req, res) => {
  const {
    donor_name, donor_email, donor_contact, type, notes,
    amount, item_description, estimated_value, condition, loan_start_date, loan_end_date,
    preferred_visit_date, preferred_visit_time,
    visitor_phone, visitor_address
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get visitor IP and user agent
    const visitor_ip = req.ip || req.connection.remoteAddress;
    const visitor_user_agent = req.get('User-Agent');

    // Insert into donations
    const [donationResult] = await conn.query(
      'INSERT INTO donations (donor_name, donor_email, donor_contact, type, notes, preferred_visit_date, preferred_visit_time, request_date) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [donor_name, donor_email, donor_contact, type, notes, preferred_visit_date, preferred_visit_time]
    );
    const donationId = donationResult.insertId;

    // Insert into donation_details
    await conn.query(
      `INSERT INTO donation_details (
        donation_id, amount, item_description, estimated_value, \`condition\`, loan_start_date, loan_end_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        donationId,
        amount || null,
        item_description || null,
        estimated_value || null,
        condition || null,
        loan_start_date || null,
        loan_end_date || null
      ]
    );

    // Handle payment proof file upload for monetary donations
    if (type === 'monetary' && req.files && req.files.payment_proof) {
      const paymentProofFile = req.files.payment_proof[0];
      const paymentProofPath = paymentProofFile.path;
      await conn.query(
        `INSERT INTO donation_documents (
          donation_id, document_type, file_name, file_path, file_size, mime_type, uploaded_by, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          donationId,
          'receipt',
          paymentProofFile.originalname,
          paymentProofPath,
          paymentProofFile.size,
          paymentProofFile.mimetype,
          'admin',
          'Payment proof for monetary donation'
        ]
      );
    }

    // Handle legal documents upload for artifacts
    if (type === 'artifact' && req.files && req.files.legal_documents) {
      const legalDocFile = req.files.legal_documents[0];
      const legalDocPath = legalDocFile.path;
      await conn.query(
        `INSERT INTO donation_documents (
          donation_id, document_type, file_name, file_path, file_size, mime_type, uploaded_by, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          donationId,
          'certificate',
          legalDocFile.originalname,
          legalDocPath,
          legalDocFile.size,
          legalDocFile.mimetype,
          'admin',
          'Legal documents for artifact donation'
        ]
      );
    }

    // Create visitor submission record for all donations
    await conn.query(
      'INSERT INTO donation_visitor_submissions (donation_id, visitor_name, visitor_email, visitor_phone, visitor_address, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [donationId, donor_name, donor_email, visitor_phone, visitor_address, visitor_ip, visitor_user_agent]
    );

      // Create public display record for visitor submissions
      await conn.query(
        `INSERT INTO donation_public_display (
          donation_id, display_name, display_description, display_amount, 
          display_donor_name, display_donor_anonymous, display_date, display_category
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          donationId,
          donor_name,
          notes,
          type === 'monetary' ? true : false,
          true, // Show donor name by default
          false, // Not anonymous by default
          true, // Show date
          type // Use donation type as category
        ]
      );

    await conn.commit();
    try { await logActivity(req, 'donation.create', { donationId, type, donor_name }); } catch {}
    res.json({ success: true, donationId });
  } catch (err) {
    await conn.rollback();
    console.error('Error creating donation:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// GET all donations (with details and documents)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, dd.amount, dd.item_description, dd.estimated_value, dd.\`condition\`, dd.loan_start_date, dd.loan_end_date,
              dms.preferred_visit_date, dms.preferred_visit_time,
              GROUP_CONCAT(doc.file_path ORDER BY doc.id) as attachment_paths,
              GROUP_CONCAT(doc.file_name ORDER BY doc.id) as attachment_names,
              GROUP_CONCAT(doc.document_type ORDER BY doc.id) as attachment_types,
              COUNT(doc.id) as attachment_count
       FROM donations d
       LEFT JOIN donation_details dd ON d.id = dd.donation_id
       LEFT JOIN donation_meeting_schedule dms ON d.id = dms.donation_id
       LEFT JOIN donation_documents doc ON d.id = doc.donation_id
       GROUP BY d.id
       ORDER BY d.created_at DESC`
    );
    res.json({ donations: rows });
  } catch (err) {
    console.error('Error fetching donations:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// GET single donation (with details)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT d.*, dd.amount, dd.item_description, dd.estimated_value, dd.\`condition\`, dd.loan_start_date, dd.loan_end_date
       FROM donations d
       LEFT JOIN donation_details dd ON d.id = dd.donation_id
       WHERE d.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Donation not found' });
    }
    res.json({ donation: rows[0] });
  } catch (err) {
    console.error('Error fetching donation:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// UPDATE donation (PUT)
router.put('/:id', isAuthenticated, logUserActivity, async (req, res) => {
  const { id } = req.params;
  const {
    donor_name, donor_email, donor_contact, type, notes,
    amount, method, item_description, estimated_value, condition, loan_start_date, loan_end_date
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Update donations
    await conn.query(
      'UPDATE donations SET donor_name=?, donor_email=?, donor_contact=?, type=?, notes=? WHERE id=?',
      [donor_name, donor_email, donor_contact, type, notes, id]
    );

    // Update donation_details
    await conn.query(
      `UPDATE donation_details SET
        amount=?, method=?, item_description=?, estimated_value=?, \`condition\`=?, loan_start_date=?, loan_end_date=?
       WHERE donation_id=?`,
      [
        amount || null,
        method || null,
        item_description || null,
        estimated_value || null,
        condition || null,
        loan_start_date || null,
        loan_end_date || null,
        id
      ]
    );

    await conn.commit();
    // Optional: when status is included and set to rejected/approved, log it here too
    if (typeof req.body.status === 'string') {
      const s = req.body.status.toLowerCase();
      if (s === 'rejected') { try { await logActivity(req, 'donation.reject', { donationId: id }); } catch {} }
      if (s === 'approved') { try { await logActivity(req, 'donation.approve', { donationId: id }); } catch {} }
    }
    try { await logActivity(req, 'donation.update', { donationId: id }); } catch {}
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('Error updating donation:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// DELETE donation
router.delete('/:id', isAuthenticated, logUserActivity, async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Delete related records first (due to foreign key constraints)
    // Handle missing tables gracefully
    try {
      await conn.query('DELETE FROM donation_documents WHERE donation_id = ?', [id]);
    } catch (err) {
      console.log('⚠️ donation_documents table not found, skipping...');
    }
    
    try {
      await conn.query('DELETE FROM donation_workflow_log WHERE donation_id = ?', [id]);
    } catch (err) {
      console.log('⚠️ donation_workflow_log table not found, skipping...');
    }
    
    try {
      await conn.query('DELETE FROM donation_acknowledgments WHERE donation_id = ?', [id]);
    } catch (err) {
      console.log('⚠️ donation_acknowledgments table not found, skipping...');
    }
    
    try {
      await conn.query('DELETE FROM donation_requirements WHERE donation_id = ?', [id]);
    } catch (err) {
      console.log('⚠️ donation_requirements table not found, skipping...');
    }
    
    try {
      await conn.query('DELETE FROM donation_visitor_submissions WHERE donation_id = ?', [id]);
    } catch (err) {
      console.log('⚠️ donation_visitor_submissions table not found, skipping...');
    }
    
    try {
      await conn.query('DELETE FROM donation_public_display WHERE donation_id = ?', [id]);
    } catch (err) {
      console.log('⚠️ donation_public_display table not found, skipping...');
    }
    
    try {
      await conn.query('DELETE FROM donation_details WHERE donation_id = ?', [id]);
    } catch (err) {
      console.log('⚠️ donation_details table not found, skipping...');
    }
    
    // Delete from donations
    await conn.query('DELETE FROM donations WHERE id = ?', [id]);

    await conn.commit();
    try { await logActivity(req, 'donation.delete', { donationId: id }); } catch {}
    res.json({ success: true, message: 'Donation deleted successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('Error deleting donation:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// APPROVE donation and send appreciation letter
router.post('/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    console.log('🔄 Starting donation approval process for ID:', id);
    
    // Get donation details
    const [donations] = await pool.query(
      `SELECT d.*, dd.amount, dd.item_description, dd.estimated_value
       FROM donations d
       LEFT JOIN donation_details dd ON d.id = dd.donation_id
       WHERE d.id = ?`,
      [id]
    );
    
    if (donations.length === 0) {
      console.log('❌ Donation not found for ID:', id);
      return res.status(404).json({ success: false, error: 'Donation not found' });
    }
    
    const donation = donations[0];
    console.log('📋 Donation details found:', {
      id: donation.id,
      donor_name: donation.donor_name,
      donor_email: donation.donor_email,
      type: donation.type,
      status: donation.status
    });
    
    // Update status to approved
    await pool.query('UPDATE donations SET status = ? WHERE id = ?', ['approved', id]);
    console.log('✅ Donation status updated to approved');
    
    // Send beautiful appreciation letter
    console.log('📧 Attempting to send appreciation letter to:', donation.donor_email);
    const emailResult = await sendAppreciationLetter(
      donation.donor_name, 
      donation.donor_email, 
      {
        type: donation.type,
        request_date: donation.request_date,
        amount: donation.amount,
        item_description: donation.item_description,
        estimated_value: donation.estimated_value,
        method: donation.method || null
      }
    );
    
    console.log('📧 Email sending result:', emailResult);
    
    if (emailResult.success) {
      console.log('✅ Email sent successfully!');
      try { await logActivity(req, 'donation.approve.email_ok', { donationId: id }); } catch {}
      res.json({ 
        success: true, 
        message: 'Donation approved and appreciation letter sent successfully to donor' 
      });
    } else {
      console.log('⚠️ Email sending failed:', emailResult.error);
      // Donation is still approved, but email failed
      try { await logActivity(req, 'donation.approve.email_failed', { donationId: id, error: emailResult.error }); } catch {}
      res.json({ 
        success: true, 
        message: 'Donation approved but email sending failed. Please check email configuration.',
        emailError: emailResult.error
      });
    }
  } catch (err) {
    console.error('❌ Error in donation approval process:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// REJECT donation (sets status=rejected)
router.post('/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { rejection_reason } = req.body;
  
  try {
    // Get donation details before updating
    const [donations] = await pool.query(
      'SELECT donor_name, donor_email FROM donations WHERE id = ?',
      [id]
    );
    
    if (donations.length === 0) {
      return res.status(404).json({ success: false, error: 'Donation not found' });
    }
    
    const donation = donations[0];
    
    // Update donation status with rejection reason
    await pool.query('UPDATE donations SET status = ?, processing_stage = ?, rejection_reason = ? WHERE id = ?', 
      ['rejected', 'rejected', rejection_reason || 'No reason provided', id]);
    
    // Log activity
    try { await logActivity(req, 'donation.reject', { donationId: id }); } catch {}
    
    // Send rejection email to donor
    try {
      const emailResult = await sendMeetingRejectionEmail(
        donation.donor_name,
        donation.donor_email,
        rejection_reason || 'Unable to schedule meeting at this time'
      );
      
      if (emailResult.success) {
        console.log('✅ Meeting rejection email sent successfully');
        res.json({ 
          success: true, 
          message: 'Donation rejected and donor has been notified via email' 
        });
      } else {
        console.log('⚠️ Meeting rejection email failed:', emailResult.error);
        res.json({ 
          success: true, 
          message: 'Donation rejected but email notification failed',
          emailError: emailResult.error
        });
      }
    } catch (emailError) {
      console.error('❌ Error sending rejection email:', emailError);
      res.json({ 
        success: true, 
        message: 'Donation rejected but email notification failed',
        emailError: emailError.message
      });
    }
  } catch (err) {
    console.error('❌ Donation reject error:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// GET appreciation letter HTML for download
router.get('/:id/appreciation-letter', async (req, res) => {
  const { id } = req.params;
  try {
    // Get donation details
    const [donations] = await pool.query(
      `SELECT d.*, dd.amount, dd.item_description, dd.estimated_value
       FROM donations d
       LEFT JOIN donation_details dd ON d.id = dd.donation_id
       WHERE d.id = ?`,
      [id]
    );
    
    if (donations.length === 0) {
      return res.status(404).json({ success: false, error: 'Donation not found' });
    }
    
    const donation = donations[0];
    
    // Generate appreciation letter HTML
    const htmlContent = generateAppreciationLetterHTML(donation.donor_name, {
      type: donation.type,
      date_received: donation.date_received,
      amount: donation.amount,
      item_description: donation.item_description,
      estimated_value: donation.estimated_value,
      method: donation.method
    });
    
    // Set headers for HTML download
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="appreciation-letter-${donation.donor_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html"`);
    
    res.send(htmlContent);
  } catch (err) {
    console.error('Error generating appreciation letter:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Simple test endpoint to verify email system
router.get('/test-email-system', async (req, res) => {
  try {
    console.log('🧪 Testing email system...');
    
    // Test transporter creation
    const transporter = createTransporter();
    
    // Test email sending with minimal content
    const testMailOptions = {
      from: 'museoweb1@gmail.com',
      to: 'museoweb1@gmail.com', // Send to self for testing
      subject: 'Test Email - Museum System',
      text: 'This is a test email from the museum donation system.',
      html: '<h1>Test Email</h1><p>This is a test email from the museum donation system.</p>'
    };

    console.log('🧪 Sending test email...');
    const info = await transporter.sendMail(testMailOptions);
    
    console.log('✅ Test email sent successfully:', info.messageId);
    res.json({ 
      success: true, 
      message: 'Email system test successful!',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('❌ Email system test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Email system test failed',
      details: error.message
    });
  }
});

// Test email endpoint (for debugging)
router.post('/test-email', async (req, res) => {
  const { testEmail } = req.body;
  
  if (!testEmail) {
    return res.status(400).json({ success: false, error: 'Test email address is required' });
  }

  try {
    const testDonationDetails = {
      type: 'monetary',
      request_date: new Date().toISOString().split('T')[0],
      amount: '5000',
      item_description: 'Test donation for email verification',
      estimated_value: '5000',
      method: 'cash'
    };

    const result = await sendAppreciationLetter('Test Donor', testEmail, testDonationDetails);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Test email sent successfully!',
        messageId: result.messageId
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Test email failed to send',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send test email',
      details: error.message
    });
  }
});

// ========================================
// ENHANCED DONATION MANAGEMENT ENDPOINTS
// ========================================

// Upload donation documents
router.post('/:id/documents', upload.array('documents', 10), async (req, res) => {
  const { id } = req.params;
  const { document_type, description } = req.body;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ success: false, error: 'No files uploaded' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const file of files) {
      await conn.query(
        'INSERT INTO donation_documents (donation_id, document_type, file_name, file_path, file_size, mime_type, description, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          document_type || 'other',
          file.originalname,
          file.path, // Use the actual file path from multer
          file.size,
          file.mimetype,
          description || '',
          'admin'
        ]
      );
    }

    // Update donation_details to reflect documents uploaded
    await conn.query(
      'UPDATE donation_details SET documents_uploaded = TRUE, documents_count = documents_count + ? WHERE donation_id = ?',
      [files.length, id]
    );

    // Log the workflow action
    await conn.query(
      'INSERT INTO donation_workflow_log (donation_id, action, performed_by, notes) VALUES (?, ?, ?, ?)',
      [id, 'documents_uploaded', 'admin', `${files.length} document(s) uploaded`]
    );

    await conn.commit();
    try { await logActivity(req, 'donation.documents_uploaded', { donationId: id, fileCount: files.length }); } catch {}
    res.json({ success: true, message: `${files.length} document(s) uploaded successfully` });
  } catch (err) {
    await conn.rollback();
    console.error('Error uploading documents:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// Get donation documents
router.get('/:id/documents', async (req, res) => {
  const { id } = req.params;
  try {
    const [documents] = await pool.query(
      'SELECT * FROM donation_documents WHERE donation_id = ? ORDER BY uploaded_at DESC',
      [id]
    );
    res.json({ success: true, documents });
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Get donation requirements
router.get('/:id/requirements', async (req, res) => {
  const { id } = req.params;
  try {
    const [requirements] = await pool.query(
      'SELECT * FROM donation_requirements WHERE donation_id = ? ORDER BY created_at ASC',
      [id]
    );
    res.json({ success: true, requirements });
  } catch (err) {
    console.error('Error fetching requirements:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Update requirement status
router.put('/:id/requirements/:requirementId', async (req, res) => {
  const { id, requirementId } = req.params;
  const { completed, assigned_to, notes, due_date } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const updateData = {};
    if (completed !== undefined) updateData.completed = completed;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
    if (notes !== undefined) updateData.notes = notes;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (completed) updateData.completed_at = new Date();

    if (Object.keys(updateData).length > 0) {
      const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updateData), requirementId];
      
      await conn.query(
        `UPDATE donation_requirements SET ${setClause} WHERE id = ? AND donation_id = ?`,
        [...values, id]
      );
    }

    // Log the workflow action
    await conn.query(
      'INSERT INTO donation_workflow_log (donation_id, action, performed_by, notes) VALUES (?, ?, ?, ?)',
      [id, 'requirement_updated', 'admin', `Requirement ${requirementId} updated`]
    );

    await conn.commit();
    try { await logActivity(req, 'donation.requirement_updated', { donationId: id, requirementId }); } catch {}
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('Error updating requirement:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// Get donation workflow log
router.get('/:id/workflow', async (req, res) => {
  const { id } = req.params;
  try {
    const [workflow] = await pool.query(
      'SELECT * FROM donation_workflow_log WHERE donation_id = ? ORDER BY performed_at DESC',
      [id]
    );
    res.json({ success: true, workflow });
  } catch (err) {
    console.error('Error fetching workflow:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Update donation processing stage
router.put('/:id/stage', async (req, res) => {
  const { id } = req.params;
  const { processing_stage, assigned_to, priority, notes } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get current stage
    const [current] = await conn.query('SELECT processing_stage FROM donations WHERE id = ?', [id]);
    const currentStage = current[0]?.processing_stage;

    // Update donation
    const updateData = {};
    if (processing_stage !== undefined) updateData.processing_stage = processing_stage;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
    if (priority !== undefined) updateData.priority = priority;

    if (Object.keys(updateData).length > 0) {
      const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updateData), id];
      
      await conn.query(
        `UPDATE donations SET ${setClause} WHERE id = ?`,
        [...values, id]
      );
    }

    // Log the workflow action
    await conn.query(
      'INSERT INTO donation_workflow_log (donation_id, action, stage_from, stage_to, performed_by, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [id, 'stage_updated', currentStage, processing_stage, 'admin', notes || 'Stage updated']
    );

    await conn.commit();
    try { await logActivity(req, 'donation.stage_updated', { donationId: id, stage: processing_stage }); } catch {}
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('Error updating stage:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// Create acknowledgment
router.post('/:id/acknowledgments', async (req, res) => {
  const { id } = req.params;
  const { acknowledgment_type, recipient_name, recipient_email, recipient_address, content } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      'INSERT INTO donation_acknowledgments (donation_id, acknowledgment_type, sent_date, sent_by, recipient_name, recipient_email, recipient_address, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, acknowledgment_type, new Date(), 'admin', recipient_name, recipient_email, recipient_address, content]
    );

    // Update donation acknowledgment status
    await conn.query(
      'UPDATE donations SET acknowledgment_sent = TRUE, acknowledgment_date = ?, acknowledgment_type = ? WHERE id = ?',
      [new Date(), acknowledgment_type, id]
    );

    // Log the workflow action
    await conn.query(
      'INSERT INTO donation_workflow_log (donation_id, action, performed_by, notes) VALUES (?, ?, ?, ?)',
      [id, 'acknowledgment_created', 'admin', `${acknowledgment_type} acknowledgment created`]
    );

    await conn.commit();
    try { await logActivity(req, 'donation.acknowledgment_created', { donationId: id, type: acknowledgment_type }); } catch {}
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('Error creating acknowledgment:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// Get donation acknowledgments
router.get('/:id/acknowledgments', async (req, res) => {
  const { id } = req.params;
  try {
    const [acknowledgments] = await pool.query(
      'SELECT * FROM donation_acknowledgments WHERE donation_id = ? ORDER BY created_at DESC',
      [id]
    );
    res.json({ success: true, acknowledgments });
  } catch (err) {
    console.error('Error fetching acknowledgments:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Enhanced GET all donations with new fields
router.get('/enhanced', async (req, res) => {
  try {
    const [donations] = await pool.query(
      `SELECT d.*, dd.*, 
              COUNT(doc.id) as document_count,
              COUNT(req.id) as requirement_count,
              SUM(CASE WHEN req.completed = TRUE THEN 1 ELSE 0 END) as completed_requirements,
              COUNT(ack.id) as acknowledgment_count
       FROM donations d
       LEFT JOIN donation_details dd ON d.id = dd.donation_id
       LEFT JOIN donation_documents doc ON d.id = doc.donation_id
       LEFT JOIN donation_requirements req ON d.id = req.donation_id
       LEFT JOIN donation_acknowledgments ack ON d.id = ack.donation_id
       GROUP BY d.id
       ORDER BY d.created_at DESC`
    );
    res.json({ success: true, donations });
  } catch (err) {
    console.error('Error fetching enhanced donations:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_donations,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_donations,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_donations,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_donations,
        SUM(CASE WHEN processing_stage = 'received' THEN 1 ELSE 0 END) as received_stage,
        SUM(CASE WHEN processing_stage = 'under_review' THEN 1 ELSE 0 END) as under_review_stage,
        SUM(CASE WHEN processing_stage = 'approved' THEN 1 ELSE 0 END) as approved_stage,
        SUM(CASE WHEN processing_stage = 'completed' THEN 1 ELSE 0 END) as completed_stage,
        SUM(CASE WHEN acknowledgment_sent = FALSE THEN 1 ELSE 0 END) as pending_acknowledgments,
        SUM(CASE WHEN city_acknowledgment_required = TRUE AND city_acknowledgment_sent = FALSE THEN 1 ELSE 0 END) as pending_city_acknowledgments,
        COUNT(*) as total_submissions
      FROM donations
    `);
    
    const [typeStats] = await pool.query(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count
      FROM donations 
      GROUP BY type
    `);

    const [priorityStats] = await pool.query(`
      SELECT 
        priority,
        COUNT(*) as count
      FROM donations 
      WHERE priority IS NOT NULL
      GROUP BY priority
    `);

    const [visitorSubmissionStats] = await pool.query(`
      SELECT 
        submission_status,
        COUNT(*) as count
      FROM donation_visitor_submissions 
      GROUP BY submission_status
    `);

    res.json({ 
      success: true, 
      stats: stats[0], 
      typeStats, 
      priorityStats,
      visitorSubmissionStats
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// ========================================
// VISITOR SUBMISSION MANAGEMENT - REMOVED
// ========================================
// Donations are now DONOR-ONLY. Visitors are people who visit the museum.
// Donors are people who make donations. These are separate concepts.

// ========================================
// PUBLIC DISPLAY MANAGEMENT
// ========================================

// Get public donations (for visitor display)
router.get('/public', async (req, res) => {
  try {
    const [donations] = await pool.query(`
      SELECT 
        d.id,
        dpd.display_name,
        dpd.display_description,
        dpd.display_amount,
        dpd.display_donor_name,
        dpd.display_donor_anonymous,
        dpd.display_date,
        dpd.display_category,
        dpd.featured,
        dpd.display_order,
        d.type,
        d.request_date,
        d.created_at,
        dd.amount,
        dd.item_description,
        dd.estimated_value,
        CASE 
          WHEN dpd.display_donor_anonymous = TRUE THEN 'Anonymous Donor'
          WHEN dpd.display_donor_name = TRUE THEN d.donor_name
          ELSE 'Anonymous Donor'
        END as display_donor
      FROM donations d
      JOIN donation_public_display dpd ON d.id = dpd.donation_id
      WHERE d.public_visible = TRUE 
      AND d.status = 'approved'
      ORDER BY dpd.featured DESC, dpd.display_order ASC, d.created_at DESC
    `);
    res.json({ success: true, donations });
  } catch (err) {
    console.error('Error fetching public donations:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Update public display settings
router.put('/:id/public-display', async (req, res) => {
  const { id } = req.params;
  const { 
    display_name, 
    display_description, 
    display_amount, 
    display_donor_name, 
    display_donor_anonymous,
    display_date,
    display_category,
    featured,
    display_order,
    public_visible
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Update donation public visibility
    if (public_visible !== undefined) {
      await conn.query('UPDATE donations SET public_visible = ? WHERE id = ?', [public_visible, id]);
    }

    // Update or insert public display settings
    const [existing] = await conn.query('SELECT id FROM donation_public_display WHERE donation_id = ?', [id]);
    
    if (existing.length > 0) {
      // Update existing
      const updateData = {};
      if (display_name !== undefined) updateData.display_name = display_name;
      if (display_description !== undefined) updateData.display_description = display_description;
      if (display_amount !== undefined) updateData.display_amount = display_amount;
      if (display_donor_name !== undefined) updateData.display_donor_name = display_donor_name;
      if (display_donor_anonymous !== undefined) updateData.display_donor_anonymous = display_donor_anonymous;
      if (display_date !== undefined) updateData.display_date = display_date;
      if (display_category !== undefined) updateData.display_category = display_category;
      if (featured !== undefined) updateData.featured = featured;
      if (display_order !== undefined) updateData.display_order = display_order;

      if (Object.keys(updateData).length > 0) {
        const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updateData), id];
        
        await conn.query(
          `UPDATE donation_public_display SET ${setClause} WHERE donation_id = ?`,
          [...values, id]
        );
      }
    } else {
      // Insert new
      await conn.query(
        `INSERT INTO donation_public_display (
          donation_id, display_name, display_description, display_amount, 
          display_donor_name, display_donor_anonymous, display_date, 
          display_category, featured, display_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, 
          display_name || null, 
          display_description || null, 
          display_amount || false,
          display_donor_name || false, 
          display_donor_anonymous || false, 
          display_date || true,
          display_category || null, 
          featured || false, 
          display_order || 0
        ]
      );
    }

    // Log the workflow action
    await conn.query(
      'INSERT INTO donation_workflow_log (donation_id, action, performed_by, notes) VALUES (?, ?, ?, ?)',
      [id, 'public_display_updated', 'admin', 'Public display settings updated']
    );

    await conn.commit();
    try { await logActivity(req, 'donation.public_display_updated', { donationId: id }); } catch {}
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('Error updating public display:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// Get public display settings for a donation
router.get('/:id/public-display', async (req, res) => {
  const { id } = req.params;
  try {
    const [display] = await pool.query(
      'SELECT * FROM donation_public_display WHERE donation_id = ?',
      [id]
    );
    res.json({ success: true, display: display[0] || null });
  } catch (err) {
    console.error('Error fetching public display settings:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// ========================================
// NEW DONATION PROCESS WORKFLOW ENDPOINTS
// ========================================

// CREATE donation request (POST) - For donors to submit requests
router.post('/request', upload.fields([
  { name: 'payment_proof', maxCount: 1 },
  { name: 'legal_documents', maxCount: 1 },
  { name: 'artifact_images', maxCount: 10 },
  { name: 'loan_images', maxCount: 10 }
]), async (req, res) => {
  const {
    donor_name, donor_email, donor_contact, type, preferred_visit_date, preferred_visit_time, notes,
    amount, item_description, estimated_value, condition, loan_start_date, loan_end_date
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insert into donations (core fields only)
    const [donationResult] = await conn.query(
      `INSERT INTO donations (
        donor_name, donor_email, donor_contact, type, request_date, 
        notes, processing_stage
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        donor_name, donor_email, donor_contact, type, new Date(),
        notes, 'request_meeting'
      ]
    );
    const donationId = donationResult.insertId;

    // Insert meeting schedule data into dedicated table
    if (preferred_visit_date || preferred_visit_time) {
      await conn.query(
        `INSERT INTO donation_meeting_schedule (
          donation_id, preferred_visit_date, preferred_visit_time, status
        ) VALUES (?, ?, ?, ?)`,
        [donationId, preferred_visit_date || null, preferred_visit_time || null, 'requested']
      );
    }

    // Insert into donation_details
    await conn.query(
      `INSERT INTO donation_details (
        donation_id, amount, item_description, estimated_value, \`condition\`, loan_start_date, loan_end_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        donationId,
        amount || null,
        item_description || null,
        estimated_value || null,
        condition || null,
        loan_start_date || null,
        loan_end_date || null
      ]
    );

    // Handle file uploads (if table exists)
    if (type === 'monetary' && req.files && req.files.payment_proof) {
      try {
        const paymentProofFile = req.files.payment_proof[0];
        await conn.query(
          `INSERT INTO donation_documents (
            donation_id, document_type, file_name, file_path, file_size, mime_type, uploaded_by, description
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            donationId, 'receipt', paymentProofFile.originalname, paymentProofFile.path,
            paymentProofFile.size, paymentProofFile.mimetype, 'visitor', 'Payment proof for monetary donation'
          ]
        );
      } catch (err) {
        console.log('⚠️ donation_documents table not found, skipping file upload...');
      }
    }

    if (type === 'artifact' && req.files && req.files.legal_documents) {
      try {
        const legalDocFile = req.files.legal_documents[0];
        await conn.query(
          `INSERT INTO donation_documents (
            donation_id, document_type, file_name, file_path, file_size, mime_type, uploaded_by, description
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            donationId, 'certificate', legalDocFile.originalname, legalDocFile.path,
            legalDocFile.size, legalDocFile.mimetype, 'visitor', 'Legal documents for artifact donation'
          ]
        );
      } catch (err) {
        console.log('⚠️ donation_documents table not found, skipping file upload...');
      }
    }

    // Handle artifact images uploads
    if (type === 'artifact' && req.files && req.files.artifact_images) {
      try {
        for (const file of req.files.artifact_images) {
          await conn.query(
            `INSERT INTO donation_documents (
              donation_id, document_type, file_name, file_path, file_size, mime_type, uploaded_by, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              donationId, 'artifact_image', file.originalname, file.path,
              file.size, file.mimetype, 'visitor', 'Artifact photo/document'
            ]
          );
        }
        console.log(`✅ Uploaded ${req.files.artifact_images.length} artifact files for donation ${donationId}`);
      } catch (err) {
        console.log('⚠️ donation_documents table not found, skipping artifact file upload...');
      }
    }

    // Handle loan images uploads
    if (type === 'loan' && req.files && req.files.loan_images) {
      try {
        for (const file of req.files.loan_images) {
          await conn.query(
            `INSERT INTO donation_documents (
              donation_id, document_type, file_name, file_path, file_size, mime_type, uploaded_by, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              donationId, 'loan_image', file.originalname, file.path,
              file.size, file.mimetype, 'visitor', 'Loan item photo/document'
            ]
          );
        }
        console.log(`✅ Uploaded ${req.files.loan_images.length} loan files for donation ${donationId}`);
      } catch (err) {
        console.log('⚠️ donation_documents table not found, skipping loan file upload...');
      }
    }

    // REMOVED: visitor submission record creation
    // Donations are now DONOR-ONLY, no visitor tracking needed

    // Log workflow action (if table exists)
    try {
      await conn.query(
        'INSERT INTO donation_workflow_log (donation_id, action, performed_by, notes) VALUES (?, ?, ?, ?)',
        [donationId, 'request_submitted', 'donor', 'Donation request submitted by donor']
      );
    } catch (err) {
      console.log('⚠️ donation_workflow_log table not found, skipping...');
    }

    await conn.commit();
    res.json({ 
      success: true, 
      donationId,
      message: 'Donation request submitted successfully. Our staff will review your request and contact you to schedule a meeting.'
    });
  } catch (err) {
    await conn.rollback();
    console.error('Error creating donation request:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// SCHEDULE meeting (POST) - For staff to schedule meetings with donors
router.post('/:id/schedule-meeting', isAuthenticated, logUserActivity, async (req, res) => {
  const { id } = req.params;
  const { scheduled_date, scheduled_time, location, staff_member, meeting_notes, suggested_alternative_dates } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Update donation processing stage only
    await conn.query(
      `UPDATE donations SET processing_stage = 'schedule_meeting' WHERE id = ?`,
      [id]
    );

    // Create or update meeting schedule record
    const [existingMeeting] = await conn.query(
      'SELECT id FROM donation_meeting_schedule WHERE donation_id = ?',
      [id]
    );

    if (existingMeeting.length > 0) {
      // Update existing meeting schedule
      await conn.query(
        `UPDATE donation_meeting_schedule SET 
          scheduled_date = ?, scheduled_time = ?, location = ?, 
          meeting_notes = ?, suggested_alternative_dates = ?, status = 'scheduled'
         WHERE donation_id = ?`,
        [scheduled_date, scheduled_time, location, meeting_notes, 
         suggested_alternative_dates ? JSON.stringify(suggested_alternative_dates) : null, id]
      );
    } else {
      // Insert new meeting schedule
      await conn.query(
        `INSERT INTO donation_meeting_schedule (
          donation_id, scheduled_date, scheduled_time, location, 
          meeting_notes, suggested_alternative_dates, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, scheduled_date, scheduled_time, location, meeting_notes, 
         suggested_alternative_dates ? JSON.stringify(suggested_alternative_dates) : null, 'scheduled']
      );
    }

    // Log workflow action
    await conn.query(
      'INSERT INTO donation_workflow_log (donation_id, action, performed_by, notes) VALUES (?, ?, ?, ?)',
      [id, 'meeting_scheduled', req.user.username, `Meeting scheduled for ${scheduled_date} at ${scheduled_time}`]
    );

    // Get donor details for email
    const [donations] = await conn.query(
      'SELECT donor_name, donor_email FROM donations WHERE id = ?',
      [id]
    );

    if (donations.length > 0) {
      const donation = donations[0];
      
      // Send meeting schedule email to donor
      try {
        const emailResult = await sendMeetingScheduleEmail(
          donation.donor_name,
          donation.donor_email,
          {
            scheduled_date,
            scheduled_time,
            location,
            staff_member,
            suggested_alternative_dates
          }
        );
        
        if (emailResult.success) {
          console.log('✅ Meeting schedule email sent successfully');
        } else {
          console.log('⚠️ Meeting schedule email failed:', emailResult.error);
        }
      } catch (emailError) {
        console.error('❌ Error sending meeting schedule email:', emailError);
      }
    }

    await conn.commit();
    res.json({ 
      success: true, 
      message: 'Meeting scheduled successfully and donor has been notified'
    });
  } catch (err) {
    await conn.rollback();
    console.error('Error scheduling meeting:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// COMPLETE meeting (POST) - For staff to mark meeting as completed
router.post('/:id/complete-meeting', isAuthenticated, logUserActivity, async (req, res) => {
  const { id } = req.params;
  const { meeting_notes } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Update donation processing stage
    await conn.query(
      `UPDATE donations SET processing_stage = 'finished_meeting' WHERE id = ?`,
      [id]
    );

    // Update meeting schedule
    await conn.query(
      'UPDATE donation_meeting_schedule SET status = ?, meeting_notes = ? WHERE donation_id = ?',
      ['completed', meeting_notes, id]
    );

    // Log workflow action
    await conn.query(
      'INSERT INTO donation_workflow_log (donation_id, action, performed_by, notes) VALUES (?, ?, ?, ?)',
      [id, 'meeting_completed', req.user.username, 'Meeting completed successfully']
    );

    // Get donation details for email
    const [donations] = await conn.query(
      'SELECT donor_name, donor_email FROM donations WHERE id = ?',
      [id]
    );

    await conn.commit();

    // Send meeting completion email
    if (donations.length > 0) {
      const donation = donations[0];
      try {
        const emailResult =         await sendMeetingCompletionEmail(
          donation.donor_name,
          donation.donor_email,
          {
            meeting_notes
          }
        );
        
        if (emailResult.success) {
          console.log('✅ Meeting completion email sent successfully');
          res.json({ 
            success: true, 
            message: 'Meeting completed and donor notified via email'
          });
        } else {
          console.log('⚠️ Meeting completion email failed:', emailResult.error);
          res.json({ 
            success: true, 
            message: 'Meeting completed but email notification failed',
            emailError: emailResult.error
          });
        }
      } catch (emailError) {
        console.error('❌ Error sending meeting completion email:', emailError);
        res.json({ 
          success: true, 
          message: 'Meeting completed but email notification failed',
          emailError: emailError.message
        });
      }
    } else {
      res.json({ 
        success: true, 
        message: 'Meeting marked as completed successfully'
      });
    }
  } catch (err) {
    await conn.rollback();
    console.error('Error completing meeting:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// SUBMIT to city hall (POST) - For staff to submit donation to city hall
router.post('/:id/submit-city-hall', isAuthenticated, logUserActivity, upload.array('submission_files', 10), async (req, res) => {
  const { id } = req.params;
  const { submission_documents, city_hall_reference, notes } = req.body;

  console.log('🔍 City hall submission debug:');
  console.log('  - Donation ID:', id);
  console.log('  - User:', req.user ? req.user.username : 'undefined');
  console.log('  - Files:', req.files ? req.files.length : 0);
  console.log('  - Body:', { submission_documents, city_hall_reference, notes });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Update donation processing stage
    await conn.query(
      `UPDATE donations SET processing_stage = 'city_hall' WHERE id = ?`,
      [id]
    );

    // Create city hall submission record
    const submittedBy = req.user ? req.user.username : 'admin';
    await conn.query(
      `INSERT INTO donation_city_hall_submission (
        donation_id, submission_date, submitted_by, submission_documents, city_hall_reference, notes
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, new Date(), submittedBy, submission_documents, city_hall_reference, notes]
    );

    // Handle file uploads for city hall submission
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          await conn.query(
            `INSERT INTO donation_documents (
              donation_id, document_type, file_name, file_path, file_size, mime_type, uploaded_by, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id, 'city_hall_submission', file.originalname, file.path,
              file.size, file.mimetype, submittedBy, 'City hall submission document'
            ]
          );
        }
        console.log(`✅ Uploaded ${req.files.length} city hall submission files for donation ${id}`);
      } catch (err) {
        console.log('⚠️ Error uploading city hall submission files:', err);
      }
    }

    // Log workflow action
    await conn.query(
      'INSERT INTO donation_workflow_log (donation_id, action, performed_by, notes) VALUES (?, ?, ?, ?)',
      [id, 'city_hall_submitted', submittedBy, `Submitted to city hall for approval. Reference: ${city_hall_reference || 'N/A'}`]
    );

    // Get donation details for email
    const [donations] = await conn.query(
      'SELECT donor_name, donor_email FROM donations WHERE id = ?',
      [id]
    );

    await conn.commit();

    // Send city hall submission email
    if (donations.length > 0) {
      const donation = donations[0];
      try {
        const emailResult = await sendCityHallSubmissionEmail(
          donation.donor_name,
          donation.donor_email,
          {
            submission_date: new Date(),
            documents_submitted: submission_documents
          }
        );
        
        if (emailResult.success) {
          console.log('✅ City hall submission email sent successfully');
          res.json({ 
            success: true, 
            message: 'Donation submitted to city hall and donor notified via email'
          });
        } else {
          console.log('⚠️ City hall submission email failed:', emailResult.error);
          res.json({ 
            success: true, 
            message: 'Donation submitted to city hall but email notification failed',
            emailError: emailResult.error
          });
        }
      } catch (emailError) {
        console.error('❌ Error sending city hall submission email:', emailError);
        res.json({ 
          success: true, 
          message: 'Donation submitted to city hall but email notification failed',
          emailError: emailError.message
        });
      }
    } else {
      res.json({ 
        success: true, 
        message: 'Donation submitted to city hall successfully'
      });
    }
  } catch (err) {
    await conn.rollback();
    console.error('Error submitting to city hall:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// APPROVE by city hall (POST) - For staff to mark city hall approval
router.post('/:id/city-hall-approve', isAuthenticated, logUserActivity, async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Update donation
    await conn.query(
      `UPDATE donations SET processing_stage = 'complete' WHERE id = ?`,
      [id]
    );

    // Update city hall submission
    await conn.query(
      'UPDATE donation_city_hall_submission SET status = ?, approval_date = ?, notes = ? WHERE donation_id = ?',
      ['approved', new Date(), notes, id]
    );

    // Log workflow action
    await conn.query(
      'INSERT INTO donation_workflow_log (donation_id, action, performed_by, notes) VALUES (?, ?, ?, ?)',
      [id, 'city_hall_approved', req.user.username, 'City hall approval received']
    );

    await conn.commit();
    res.json({ 
      success: true, 
      message: 'City hall approval recorded successfully'
    });
  } catch (err) {
    await conn.rollback();
    console.error('Error recording city hall approval:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// FINAL APPROVE (POST) - For staff to give final approval and send gratitude email
router.post('/:id/final-approve', isAuthenticated, logUserActivity, async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  console.log('🔍 Final approval debug:');
  console.log('  - Donation ID:', id);
  console.log('  - User:', req.user ? req.user.username : 'undefined');
  console.log('  - Notes:', notes);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get donation details
    const [donations] = await conn.query(
      `SELECT d.*, dd.amount, dd.item_description, dd.estimated_value
       FROM donations d
       LEFT JOIN donation_details dd ON d.id = dd.donation_id
       WHERE d.id = ?`,
      [id]
    );
    
    if (donations.length === 0) {
      return res.status(404).json({ success: false, error: 'Donation not found' });
    }
    
    const donation = donations[0];

    // Update donation
    await conn.query(
      `UPDATE donations SET 
        status = 'approved',
        processing_stage = 'complete'
       WHERE id = ?`,
      [id]
    );

    // Log workflow action
    const performedBy = req.user ? req.user.username : 'admin';
    await conn.query(
      'INSERT INTO donation_workflow_log (donation_id, action, performed_by, notes) VALUES (?, ?, ?, ?)',
      [id, 'final_approved', performedBy, notes || 'Final approval granted']
    );

    // Send gratitude email
    console.log('📧 Sending final gratitude email to:', donation.donor_email);
    const emailResult = await sendAppreciationLetter(
      donation.donor_name, 
      donation.donor_email, 
      {
        type: donation.type,
        request_date: donation.request_date,
        amount: donation.amount,
        item_description: donation.item_description,
        estimated_value: donation.estimated_value,
        method: donation.method || null
      }
    );

    await conn.commit();
    
    if (emailResult.success) {
      res.json({ 
        success: true, 
        message: 'Donation finally approved and gratitude email sent successfully'
      });
    } else {
      res.json({ 
        success: true, 
        message: 'Donation finally approved but gratitude email failed to send',
        emailError: emailResult.error
      });
    }
  } catch (err) {
    await conn.rollback();
    console.error('Error in final approval:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// GET donation process status
router.get('/:id/process-status', async (req, res) => {
  const { id } = req.params;
  try {
    const [donations] = await pool.query(
      `SELECT d.*, dd.amount, dd.item_description, dd.estimated_value,
              ms.preferred_visit_date, ms.preferred_visit_time, ms.scheduled_date, ms.scheduled_time, ms.location, ms.staff_member, ms.status as meeting_status,
              chs.submission_date, chs.status as city_hall_status, chs.approval_date
       FROM donations d
       LEFT JOIN donation_details dd ON d.id = dd.donation_id
       LEFT JOIN donation_meeting_schedule ms ON d.id = ms.donation_id
       LEFT JOIN donation_city_hall_submission chs ON d.id = chs.donation_id
       WHERE d.id = ?`,
      [id]
    );
    
    if (donations.length === 0) {
      return res.status(404).json({ success: false, error: 'Donation not found' });
    }
    
    res.json({ success: true, donation: donations[0] });
  } catch (err) {
    console.error('Error fetching donation process status:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// GET all donation requests (for staff dashboard)
router.get('/requests', async (req, res) => {
  try {
    // First try the full query with all tables
    let donations;
    try {
      const [result] = await pool.query(
        `SELECT d.*, dd.amount, dd.item_description, dd.estimated_value,
                ms.preferred_visit_date, ms.preferred_visit_time, ms.scheduled_date, ms.scheduled_time, ms.location, ms.staff_member, ms.status as meeting_status,
                chs.submission_date, chs.status as city_hall_status, chs.approval_date
         FROM donations d
         LEFT JOIN donation_details dd ON d.id = dd.donation_id
         LEFT JOIN donation_meeting_schedule ms ON d.id = ms.donation_id
         LEFT JOIN donation_city_hall_submission chs ON d.id = chs.donation_id
         ORDER BY d.request_date DESC`
      );
      donations = result;
    } catch (err) {
      // If the full query fails (missing tables), fall back to basic query
      console.log('⚠️ Some tables missing, using basic query...');
      const [result] = await pool.query(
        `SELECT d.*, dd.amount, dd.item_description, dd.estimated_value
         FROM donations d
         LEFT JOIN donation_details dd ON d.id = dd.donation_id
         ORDER BY d.request_date DESC`
      );
      donations = result;
    }
    
    res.json({ success: true, donations });
  } catch (err) {
    console.error('Error fetching donation requests:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Email function for meeting schedule
const sendMeetingScheduleEmail = async (donorName, donorEmail, meetingDetails) => {
  const { scheduled_date, scheduled_time, location, staff_member, suggested_alternative_dates } = meetingDetails;

  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meeting Schedule - City Museum of Cagayan de Oro</title>
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
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #2e2b41;
        }
        .meeting-details {
            background-color: #f8f9fa;
            border-left: 4px solid #8B6B21;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .meeting-details h3 {
            color: #8B6B21;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .contact-info {
            background-color: #8B6B21;
            color: white;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏛️ City Museum of Cagayan de Oro</div>
            <div class="subtitle">Preserving Our Cultural Heritage</div>
        </div>
        
        <div class="greeting">Dear ${donorName},</div>
        
        <p>Thank you for your generous donation request. We are pleased to inform you that your request has been reviewed and approved for a meeting with our museum staff.</p>
        
        <div class="meeting-details">
            <h3>📅 Meeting Schedule</h3>
            <p><strong>Date:</strong> ${new Date(scheduled_date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}</p>
            <p><strong>Time:</strong> ${scheduled_time}</p>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Staff Member:</strong> ${staff_member}</p>
        </div>
        
        <p>Please bring the following items to the meeting:</p>
        <ul>
            <li>Valid identification</li>
            <li>Any supporting documents for your donation</li>
            <li>Contact information for any questions</li>
        </ul>
        
        ${suggested_alternative_dates && suggested_alternative_dates.length > 0 ? `
        <div class="meeting-details">
            <h3>📅 Alternative Dates Available</h3>
            <p>If the scheduled date doesn't work for you, we also have these alternative dates available:</p>
            <ul>
                ${suggested_alternative_dates.map(date => `<li>${new Date(date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</li>`).join('')}
            </ul>
            <p>Please contact us to reschedule to any of these alternative dates.</p>
        </div>
        ` : ''}
        
        <p>If you need to reschedule or have any questions, please contact us as soon as possible.</p>
        
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
    </div>
</body>
</html>
  `;

  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: 'museoweb1@gmail.com',
      to: donorEmail,
      subject: 'Meeting Schedule - City Museum of Cagayan de Oro Donation',
      html: htmlTemplate
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ ERROR SENDING MEETING SCHEDULE EMAIL:', error);
    return { success: false, error: error.message };
  }
};

// Email function for meeting rejection
const sendMeetingRejectionEmail = async (donorName, donorEmail, rejectionReason = '') => {
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meeting Request Update - City Museum of Cagayan de Oro</title>
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
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #2e2b41;
        }
        .rejection-notice {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .rejection-notice h3 {
            color: #856404;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .contact-info {
            background-color: #8B6B21;
            color: white;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            text-align: center;
        }
        .retry-notice {
            background-color: #d1ecf1;
            border-left: 4px solid #17a2b8;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏛️ City Museum of Cagayan de Oro</div>
            <div class="subtitle">Preserving Our Cultural Heritage</div>
        </div>
        
        <div class="greeting">Dear ${donorName},</div>
        
        <p>Thank you for your interest in donating to the City Museum of Cagayan de Oro. We appreciate your generosity and commitment to preserving our cultural heritage.</p>
        
        <div class="rejection-notice">
            <h3>📅 Meeting Request Update</h3>
            <p>We regret to inform you that we are unable to schedule a meeting for your donation request at this time.</p>
            ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
        </div>
        
        <div class="retry-notice">
            <h4>🔄 You Can Try Again</h4>
            <p>Please don't be discouraged! You are welcome to submit a new donation request at any time. We encourage you to:</p>
            <ul>
                <li>Submit a new request with different preferred dates</li>
                <li>Contact us directly to discuss your donation</li>
                <li>Visit our museum to learn more about our collection needs</li>
            </ul>
        </div>
        
        <p>We value your interest in supporting our museum and look forward to the possibility of working with you in the future.</p>
        
        <div class="contact-info">
            <h4>📞 Contact Information</h4>
            <p>📍 Address: City Hall Complex, Cagayan de Oro City</p>
            <p>📧 Email: museum@cagayandeoro.gov.ph</p>
            <p>📱 Phone: (088) 123-4567</p>
            <p>🌐 Website: www.cagayandeoromuseum.gov.ph</p>
        </div>
        
        <div class="contact-info" style="background-color: #f8f9fa; color: #333; border: 2px solid #8B6B21;">
            <h4>💬 Share Your Feedback</h4>
            <p>We value your opinion! Please share your experience with our museum:</p>
            <p><a href="https://www.google.com/search?sca_esv=58ed7cc7eaa43e58&si=AMgyJEtREmoPL4P1I5IDCfuA8gybfVI2d5Uj7QMwYCZHKDZ-Eza3w70XE2bUhl_4JHIdJFwpiaWTxArrylZEC6pyrvuevVsptVu8TTqCekY0DtTwj2tQXcX9gjlgiec1Gt_YJwotEOq0OP914icPZV23Y7AURlQAYFgLV0vLtHf5igQ9by3V2oz6UcZXVDs6YOODx64rthNz&q=City+Museum+of+Cagayan+de+Oro+and+Heritage+Studies+Center+Reviews&sa=X&ved=2ahUKEwidju-_woiQAxX8dvUHHbtIHT0Q0bkNegQIIxAE&cshid=1759511386989816&biw=1536&bih=695&dpr=1.25#lrd=0x32fff2d5e2fc9e2d:0x11e18344b68beb41,3,,,," 
               style="color: #8B6B21; text-decoration: none; font-weight: bold; font-size: 16px;">⭐ Leave a Review for City Museum of Cagayan de Oro</a></p>
        </div>
    </div>
</body>
</html>
  `;

  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: 'museoweb1@gmail.com',
      to: donorEmail,
      subject: 'Meeting Request Update - City Museum of Cagayan de Oro',
      html: htmlTemplate
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ ERROR SENDING MEETING REJECTION EMAIL:', error);
    return { success: false, error: error.message };
  }
};

// ========================================
// MEETING REQUEST ENDPOINT (Simplified)
// ========================================

// CREATE meeting request (POST) - For donors to request a meeting
router.post('/meeting-request', async (req, res) => {
  const {
    first_name, last_name, donor_email, donor_contact, 
    preferred_visit_date, preferred_visit_time, notes
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get visitor IP and user agent
    const visitor_ip = req.ip || req.connection.remoteAddress;
    const visitor_user_agent = req.get('User-Agent');
    
    // Combine first and last name
    const donor_name = `${first_name} ${last_name}`.trim();

    // Insert into donations as a meeting request
    const [donationResult] = await conn.query(
      `INSERT INTO donations (
        donor_name, donor_email, donor_contact, type, request_date, 
        preferred_visit_date, preferred_visit_time, notes, 
        visitor_ip, visitor_user_agent, processing_stage, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        donor_name, donor_email, donor_contact, 'monetary', new Date(),
        preferred_visit_date, preferred_visit_time, notes,
        visitor_ip, visitor_user_agent, 'request_received', 'pending'
      ]
    );
    const donationId = donationResult.insertId;

    await conn.commit();

    console.log('✅ Meeting request created:', donationId);

    res.json({ 
      success: true, 
      message: 'Meeting request submitted successfully',
      donationId: donationId
    });

  } catch (err) {
    await conn.rollback();
    console.error('❌ Error creating meeting request:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to submit meeting request',
      details: err.message 
    });
  } finally {
    conn.release();
  }
});

// ADVANCE STAGE (POST) - For admin to manually advance donation to next stage
router.post('/:id/advance-stage', isAuthenticated, logUserActivity, async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get current donation details
    const [donations] = await conn.query(
      'SELECT donor_name, donor_email, processing_stage, type, request_date, amount, item_description, estimated_value, method FROM donations WHERE id = ?',
      [id]
    );

    if (donations.length === 0) {
      return res.status(404).json({ success: false, error: 'Donation not found' });
    }

    const donation = donations[0];
    const currentStage = donation.processing_stage;
    
    // Define stage progression
    const stageProgression = {
      'request_meeting': 'schedule_meeting',
      'schedule_meeting': 'finished_meeting', 
      'finished_meeting': 'city_hall',
      'city_hall': 'complete'
    };

    const nextStage = stageProgression[currentStage];
    
    if (!nextStage) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot advance from current stage',
        message: `Donation is already at the final stage: ${currentStage}`
      });
    }

    // Update donation stage
    await conn.query(
      'UPDATE donations SET processing_stage = ? WHERE id = ?',
      [nextStage, id]
    );

    // Log workflow action
    await conn.query(
      'INSERT INTO donation_workflow_log (donation_id, action, performed_by, notes) VALUES (?, ?, ?, ?)',
      [id, 'stage_advanced', req.user.username, `Advanced from ${currentStage} to ${nextStage}. ${notes || ''}`]
    );

    // Send notification email to donor
    try {
      // If advancing to complete stage, send appreciation letter
      if (nextStage === 'complete') {
        const appreciationResult = await sendAppreciationLetter(
          donation.donor_name, 
          donation.donor_email, 
          {
            type: donation.type,
            request_date: donation.request_date,
            amount: donation.amount,
            item_description: donation.item_description,
            estimated_value: donation.estimated_value,
            method: donation.method || null
          }
        );
        
        if (appreciationResult.success) {
          console.log('✅ Appreciation letter sent successfully');
        } else {
          console.log('⚠️ Appreciation letter failed:', appreciationResult.error);
        }
      } else {
        // For other stages, send regular stage advancement email
        const emailResult = await sendStageAdvancementEmail(
          donation.donor_name,
          donation.donor_email,
          {
            fromStage: currentStage,
            toStage: nextStage,
            notes: notes
          }
        );
        
        if (emailResult.success) {
          console.log('✅ Stage advancement email sent successfully');
        } else {
          console.log('⚠️ Stage advancement email failed:', emailResult.error);
        }
      }
    } catch (emailError) {
      console.error('❌ Error sending email:', emailError);
    }

    await conn.commit();
    res.json({ 
      success: true, 
      message: `Donation advanced from ${currentStage} to ${nextStage}`,
      newStage: nextStage
    });

  } catch (err) {
    await conn.rollback();
    console.error('Error advancing donation stage:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// Email function for stage advancement
const sendStageAdvancementEmail = async (donorName, donorEmail, stageDetails) => {
  try {
    const stageNames = {
      'request_meeting': 'Request Meeting',
      'schedule_meeting': 'Schedule Meeting', 
      'finished_meeting': 'Finished Meeting',
      'city_hall': 'City Hall Processing',
      'complete': 'Complete'
    };

    const fromStageName = stageNames[stageDetails.fromStage] || stageDetails.fromStage;
    const toStageName = stageNames[stageDetails.toStage] || stageDetails.toStage;

    const subject = `Donation Status Update - ${toStageName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8B6B21 0%, #D4AF37 100%); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Donation Status Update</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Dear ${donorName},
          </p>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            We are pleased to inform you that your donation request has been updated:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8B6B21;">
            <p style="margin: 0; font-size: 16px; color: #333;">
              <strong>Previous Stage:</strong> ${fromStageName}<br>
              <strong>Current Stage:</strong> ${toStageName}
            </p>
          </div>
          
          ${stageDetails.notes ? `
            <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #333;">
                <strong>Additional Notes:</strong> ${stageDetails.notes}
              </p>
            </div>
          ` : ''}
          
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Thank you for your continued support of the City Museum of Cagayan de Oro.
          </p>
          
          <p style="font-size: 14px; color: #666;">
            Best regards,<br>
            City Museum of Cagayan de Oro Team
          </p>
        </div>
      </div>
    `;

    const result = await sendEmail(donorEmail, subject, html);
    return { success: true, result };
  } catch (error) {
    console.error('Error sending stage advancement email:', error);
    return { success: false, error: error.message };
  }
};

// Email function for meeting completion
const sendMeetingCompletionEmail = async (donorName, donorEmail, meetingDetails) => {
  const { meeting_notes } = meetingDetails;

  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Donation Status Update - City Museum of Cagayan de Oro</title>
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
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #2e2b41;
        }
        .status-details {
            background-color: #f8f9fa;
            border-left: 4px solid #8B6B21;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .status-details h3 {
            color: #8B6B21;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .contact-info {
            background-color: #8B6B21;
            color: white;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏛️ City Museum of Cagayan de Oro</div>
            <div class="subtitle">Preserving Our Cultural Heritage</div>
        </div>
        
        <div class="greeting">Dear ${donorName},</div>
        
        <p>Thank you for your generous donation to our museum. We are pleased to provide you with an update on your donation status.</p>
        
        <div class="status-details">
            <h3>📋 Donation Status</h3>
            <p><strong>Status:</strong> Meeting completed successfully</p>
            <p><strong>Next Step:</strong> Your donation will be processed through city hall</p>
            ${meeting_notes ? `<p><strong>Notes:</strong> ${meeting_notes}</p>` : ''}
        </div>
        
        <p>Your donation will now be processed through the city hall approval system. You will receive another update once the final approval is granted.</p>
        
        <div class="contact-info">
            <h4 style="margin: 0 0 10px 0;">📞 Contact Information</h4>
            <p style="margin: 5px 0; font-size: 14px;">📍 Address: City Hall Complex, Cagayan de Oro City</p>
            <p style="margin: 5px 0; font-size: 14px;">📧 Email: museum@cagayandeoro.gov.ph</p>
            <p style="margin: 5px 0; font-size: 14px;">📱 Phone: (088) 123-4567</p>
        </div>
        
        <div class="contact-info" style="background-color: #f8f9fa; color: #333; border: 2px solid #8B6B21;">
            <h4>💬 Share Your Feedback</h4>
            <p>We value your opinion! Please share your experience with our museum:</p>
            <p><a href="https://www.google.com/search?sca_esv=58ed7cc7eaa43e58&si=AMgyJEtREmoPL4P1I5IDCfuA8gybfVI2d5Uj7QMwYCZHKDZ-Eza3w70XE2bUhl_4JHIdJFwpiaWTxArrylZEC6pyrvuevVsptVu8TTqCekY0DtTwj2tQXcX9gjlgiec1Gt_YJwotEOq0OP914icPZV23Y7AURlQAYFgLV0vLtHf5igQ9by3V2oz6UcZXVDs6YOODx64rthNz&q=City+Museum+of+Cagayan+de+Oro+and+Heritage+Studies+Center+Reviews&sa=X&ved=2ahUKEwidju-_woiQAxX8dvUHHbtIHT0Q0bkNegQIIxAE&cshid=1759511386989816&biw=1536&bih=695&dpr=1.25#lrd=0x32fff2d5e2fc9e2d:0x11e18344b68beb41,3,,,," 
               style="color: #8B6B21; text-decoration: none; font-weight: bold; font-size: 16px;">⭐ Leave a Review for City Museum of Cagayan de Oro</a></p>
        </div>
    </div>
</body>
</html>
  `;

  const textVersion = `
Donation Status Update - City Museum of Cagayan de Oro

Dear ${donorName},

We are pleased to provide you with an update on your generous donation to our museum.

Donation Status:
✅ Meeting completed successfully. Your donation is now ready for city hall processing.

${meeting_notes ? `Process Notes: ${meeting_notes}` : ''}

Next Steps:
Your donation will now be processed through the city hall approval system. You will receive another update once the final approval is granted.

Thank you for your generous contribution to our museum. Your donation helps us preserve and share our cultural heritage for future generations.

Contact Information:
📍 Address: City Hall Complex, Cagayan de Oro City
📧 Email: museum@cagayandeoro.gov.ph
📱 Phone: (088) 123-4567
🌐 Website: www.cagayandeoromuseum.gov.ph

Share Your Feedback:
We value your opinion! Please share your experience with our museum:
Leave a Review: https://www.google.com/search?sca_esv=58ed7cc7eaa43e58&si=AMgyJEtREmoPL4P1I5IDCfuA8gybfVI2d5Uj7QMwYCZHKDZ-Eza3w70XE2bUhl_4JHIdJFwpiaWTxArrylZEC6pyrvuevVsptVu8TTqCekY0DtTwj2tQXcX9gjlgiec1Gt_YJwotEOq0OP914icPZV23Y7AURlQAYFgLV0vLtHf5igQ9by3V2oz6UcZXVDs6YOODx64rthNz&q=City+Museum+of+Cagayan+de+Oro+and+Heritage+Studies+Center+Reviews&sa=X&ved=2ahUKEwidju-_woiQAxX8dvUHHbtIHT0Q0bkNegQIIxAE&cshid=1759511386989816&biw=1536&bih=695&dpr=1.25#lrd=0x32fff2d5e2fc9e2d:0x11e18344b68beb41,3,,,,

City Museum of Cagayan de Oro
Preserving Our Heritage, Inspiring Our Future
  `;

  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: 'museoweb1@gmail.com',
      to: donorEmail,
      subject: 'Donation Status Update - City Museum of Cagayan de Oro',
      html: htmlTemplate,
      text: textVersion
    };

    console.log('📧 Sending meeting completion email to:', donorEmail);
    const info = await transporter.sendMail(mailOptions);
    
    console.log('📧 MEETING COMPLETION EMAIL SENT SUCCESSFULLY:');
    console.log('To:', donorEmail);
    console.log('Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending meeting completion email:', {
      to: donorEmail,
      error: error.message,
      code: error.code,
      command: error.command
    });
    
    return { success: false, error: error.message };
  }
};

// Email function for city hall submission
const sendCityHallSubmissionEmail = async (donorName, donorEmail, submissionDetails) => {
  const { submission_date, documents_submitted } = submissionDetails;

  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documents Submitted to City Hall - City Museum of Cagayan de Oro</title>
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
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #2e2b41;
        }
        .submission-details {
            background-color: #f8f9fa;
            border-left: 4px solid #8B6B21;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .submission-details h3 {
            color: #8B6B21;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .contact-info {
            background-color: #8B6B21;
            color: white;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏛️ City Museum of Cagayan de Oro</div>
            <div class="subtitle">Preserving Our Cultural Heritage</div>
        </div>
        
        <div class="greeting">Dear ${donorName},</div>
        
        <p>Thank you for your generous donation to our museum. We are pleased to inform you that your donation documents have been successfully submitted to the City Hall for final approval.</p>
        
        <div class="submission-details">
            <h3>📋 Submission Status</h3>
            <p><strong>Status:</strong> Documents submitted to City Hall</p>
            <p><strong>Submission Date:</strong> ${new Date(submission_date).toLocaleDateString()}</p>
            <p><strong>Documents:</strong> ${documents_submitted || 'Donation documentation and related materials'}</p>
        </div>
        
        <p>Your donation is now in the final approval process with the City Hall. This typically takes 5-10 business days. You will receive a final notification once the approval is granted and your donation is officially accepted into our museum collection.</p>
        
        <p>If you have any questions about the approval process or need updates on your donation status, please don't hesitate to contact us.</p>
        
        <div class="contact-info">
            <h4 style="margin: 0 0 10px 0;">📞 Contact Information</h4>
            <p style="margin: 5px 0; font-size: 14px;">📍 Address: City Hall Complex, Cagayan de Oro City</p>
            <p style="margin: 5px 0; font-size: 14px;">📧 Email: museum@cagayandeoro.gov.ph</p>
            <p style="margin: 5px 0; font-size: 14px;">📱 Phone: (088) 123-4567</p>
        </div>
        
        <div class="contact-info" style="background-color: #f8f9fa; color: #333; border: 2px solid #8B6B21;">
            <h4>💬 Share Your Feedback</h4>
            <p>We value your opinion! Please share your experience with our museum:</p>
            <p><a href="https://www.google.com/search?sca_esv=58ed7cc7eaa43e58&si=AMgyJEtREmoPL4P1I5IDCfuA8gybfVI2d5Uj7QMwYCZHKDZ-Eza3w70XE2bUhl_4JHIdJFwpiaWTxArrylZEC6pyrvuevVsptVu8TTqCekY0DtTwj2tQXcX9gjlgiec1Gt_YJwotEOq0OP914icPZV23Y7AURlQAYFgLV0vLtHf5igQ9by3V2oz6UcZXVDs6YOODx64rthNz&q=City+Museum+of+Cagayan+de+Oro+and+Heritage+Studies+Center+Reviews&sa=X&ved=2ahUKEwidju-_woiQAxX8dvUHHbtIHT0Q0bkNegQIIxAE&cshid=1759511386989816&biw=1536&bih=695&dpr=1.25#lrd=0x32fff2d5e2fc9e2d:0x11e18344b68beb41,3,,,," 
               style="color: #8B6B21; text-decoration: none; font-weight: bold; font-size: 16px;">⭐ Leave a Review for City Museum of Cagayan de Oro</a></p>
        </div>
    </div>
</body>
</html>
  `;

  const textVersion = `
Documents Submitted to City Hall - City Museum of Cagayan de Oro

Dear ${donorName},

We are pleased to inform you that your donation documents have been successfully submitted to the City Hall for final approval.

Submission Status:
✅ Documents submitted to City Hall
📅 Submission Date: ${new Date(submission_date).toLocaleDateString()}
📄 Documents: ${documents_submitted || 'Donation documentation and related materials'}

What Happens Next?
Your donation is now in the final approval process with the City Hall. This typically takes 5-10 business days. 
You will receive a final notification once the approval is granted and your donation is officially accepted into our museum collection.

Need Updates?
If you have any questions about the approval process or need updates on your donation status, 
please don't hesitate to contact us using the information below.

Thank you for your generous contribution to our museum. Your donation will help preserve our cultural heritage for future generations.

Contact Information:
📍 Address: City Hall Complex, Cagayan de Oro City
📧 Email: museum@cagayandeoro.gov.ph
📱 Phone: (088) 123-4567
🌐 Website: www.cagayandeoromuseum.gov.ph

Share Your Feedback:
We value your opinion! Please share your experience with our museum:
Leave a Review: https://www.google.com/search?sca_esv=58ed7cc7eaa43e58&si=AMgyJEtREmoPL4P1I5IDCfuA8gybfVI2d5Uj7QMwYCZHKDZ-Eza3w70XE2bUhl_4JHIdJFwpiaWTxArrylZEC6pyrvuevVsptVu8TTqCekY0DtTwj2tQXcX9gjlgiec1Gt_YJwotEOq0OP914icPZV23Y7AURlQAYFgLV0vLtHf5igQ9by3V2oz6UcZXVDs6YOODx64rthNz&q=City+Museum+of+Cagayan+de+Oro+and+Heritage+Studies+Center+Reviews&sa=X&ved=2ahUKEwidju-_woiQAxX8dvUHHbtIHT0Q0bkNegQIIxAE&cshid=1759511386989816&biw=1536&bih=695&dpr=1.25#lrd=0x32fff2d5e2fc9e2d:0x11e18344b68beb41,3,,,,

City Museum of Cagayan de Oro
Preserving Our Heritage, Inspiring Our Future
  `;

  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: 'museoweb1@gmail.com',
      to: donorEmail,
      subject: 'Documents Submitted to City Hall - City Museum of Cagayan de Oro',
      html: htmlTemplate,
      text: textVersion
    };

    console.log('📧 Sending city hall submission email to:', donorEmail);
    const info = await transporter.sendMail(mailOptions);
    
    console.log('📧 CITY HALL SUBMISSION EMAIL SENT SUCCESSFULLY:');
    console.log('To:', donorEmail);
    console.log('Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending city hall submission email:', {
      to: donorEmail,
      error: error.message,
      code: error.code,
      command: error.command
    });
    
    return { success: false, error: error.message };
  }
};

// ========================================
// AI-POWERED DONATION ANALYTICS ENDPOINTS
// ========================================

// Get AI-powered donation insights and analytics
router.get('/analytics/insights', isAuthenticated, logUserActivity, async (req, res) => {
  try {
    console.log('🤖 Generating AI-powered donation insights...');
    
    const { startDate, endDate, includePredictions = true, includeComparisons = true } = req.query;
    
    // Get donation data for analysis
    const [donations] = await pool.query(`
      SELECT 
        d.*,
        dd.amount,
        dd.item_description,
        dd.estimated_value,
        dd.condition,
        dd.loan_start_date,
        dd.loan_end_date
      FROM donations d
      LEFT JOIN donation_details dd ON d.id = dd.donation_id
      WHERE (? IS NULL OR d.created_at >= ?) 
        AND (? IS NULL OR d.created_at <= ?)
      ORDER BY d.created_at DESC
    `, [startDate, startDate, endDate, endDate]);

    const donationData = {
      donations: donations,
      totalDonations: donations.length,
      totalAmount: donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0),
      timeRange: { startDate, endDate }
    };

    // Generate AI insights
    const insights = await donationAIService.generateDonationInsights(
      donationData, 
      `${startDate || 'all'} to ${endDate || 'all'}`
    );

    res.json({
      success: true,
      data: insights,
      meta: {
        totalDonations: donations.length,
        timeRange: { startDate, endDate },
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating donation insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate donation insights'
    });
  }
});

// Get donor-specific recommendations
router.get('/analytics/donor/:email/recommendations', isAuthenticated, logUserActivity, async (req, res) => {
  try {
    const { email } = req.params;
    
    console.log(`🤖 Generating recommendations for donor: ${email}`);
    
    // Get donation history for this donor
    const [donations] = await pool.query(`
      SELECT 
        d.*,
        dd.amount,
        dd.item_description,
        dd.estimated_value
      FROM donations d
      LEFT JOIN donation_details dd ON d.id = dd.donation_id
      WHERE d.donor_email = ?
      ORDER BY d.created_at DESC
    `, [email]);

    if (donations.length === 0) {
      return res.json({
        success: true,
        data: {
          summary: 'No donation history found for this donor',
          donorRecommendations: {
            personalized: [
              'Welcome to our museum donation program!',
              'Consider making your first donation',
              'Explore our different donation types'
            ],
            basedOnHistory: { message: 'No donation history available' },
            suggestedAmount: 100,
            nextSteps: [
              'Learn about our museum mission',
              'Visit our exhibits',
              'Connect with our team'
            ]
          }
        }
      });
    }

    // Generate donor-specific recommendations
    const recommendations = await donationAIService.generateDonorRecommendations(email, donations);

    res.json({
      success: true,
      data: recommendations,
      meta: {
        donorEmail: email,
        donationCount: donations.length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating donor recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate donor recommendations'
    });
  }
});

// Get donation trends and patterns
router.get('/analytics/trends', isAuthenticated, logUserActivity, async (req, res) => {
  try {
    console.log('📈 Analyzing donation trends...');
    
    const { period = '30' } = req.query; // days
    
    // Get donations for the specified period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    const [donations] = await pool.query(`
      SELECT 
        d.*,
        dd.amount,
        dd.item_description,
        dd.estimated_value
      FROM donations d
      LEFT JOIN donation_details dd ON d.id = dd.donation_id
      WHERE d.created_at >= ?
      ORDER BY d.created_at DESC
    `, [startDate]);

    // Analyze trends
    const trends = {
      period: `${period} days`,
      totalDonations: donations.length,
      totalAmount: donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0),
      averageDonation: donations.length > 0 ? 
        donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0) / donations.length : 0,
      dailyTrends: {},
      weeklyTrends: {},
      monthlyTrends: {},
      typeDistribution: {},
      processingStages: {}
    };

    // Calculate daily trends
    donations.forEach(d => {
      const date = new Date(d.created_at);
      const dayKey = date.toISOString().split('T')[0];
      const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Daily trends
      if (!trends.dailyTrends[dayKey]) {
        trends.dailyTrends[dayKey] = { count: 0, amount: 0 };
      }
      trends.dailyTrends[dayKey].count++;
      trends.dailyTrends[dayKey].amount += parseFloat(d.amount) || 0;
      
      // Weekly trends
      if (!trends.weeklyTrends[weekKey]) {
        trends.weeklyTrends[weekKey] = { count: 0, amount: 0 };
      }
      trends.weeklyTrends[weekKey].count++;
      trends.weeklyTrends[weekKey].amount += parseFloat(d.amount) || 0;
      
      // Monthly trends
      if (!trends.monthlyTrends[monthKey]) {
        trends.monthlyTrends[monthKey] = { count: 0, amount: 0 };
      }
      trends.monthlyTrends[monthKey].count++;
      trends.monthlyTrends[monthKey].amount += parseFloat(d.amount) || 0;
      
      // Type distribution
      const type = d.type || 'unknown';
      if (!trends.typeDistribution[type]) {
        trends.typeDistribution[type] = { count: 0, amount: 0 };
      }
      trends.typeDistribution[type].count++;
      trends.typeDistribution[type].amount += parseFloat(d.amount) || 0;
      
      // Processing stages
      const stage = d.processing_stage || 'unknown';
      trends.processingStages[stage] = (trends.processingStages[stage] || 0) + 1;
    });

    res.json({
      success: true,
      data: trends,
      meta: {
        period: `${period} days`,
        generatedAt: new Date().toISOString(),
        dataPoints: donations.length
      }
    });

  } catch (error) {
    console.error('Error analyzing donation trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze donation trends'
    });
  }
});

// Get donation dashboard summary
router.get('/analytics/dashboard', isAuthenticated, logUserActivity, async (req, res) => {
  try {
    console.log('📊 Generating donation dashboard summary...');
    
    // Get overall statistics
    const [totalStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_donations,
        COUNT(DISTINCT donor_email) as unique_donors,
        SUM(dd.amount) as total_amount,
        AVG(dd.amount) as average_amount,
        COUNT(CASE WHEN d.processing_stage = 'completed' THEN 1 END) as completed_donations,
        COUNT(CASE WHEN d.processing_stage = 'pending' THEN 1 END) as pending_donations
      FROM donations d
      LEFT JOIN donation_details dd ON d.id = dd.donation_id
    `);

    // Get recent donations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [recentStats] = await pool.query(`
      SELECT 
        COUNT(*) as recent_donations,
        SUM(dd.amount) as recent_amount,
        COUNT(DISTINCT donor_email) as recent_donors
      FROM donations d
      LEFT JOIN donation_details dd ON d.id = dd.donation_id
      WHERE d.created_at >= ?
    `, [thirtyDaysAgo]);

    // Get top donors
    const [topDonors] = await pool.query(`
      SELECT 
        donor_name,
        donor_email,
        COUNT(*) as donation_count,
        SUM(dd.amount) as total_donated,
        MAX(d.created_at) as last_donation
      FROM donations d
      LEFT JOIN donation_details dd ON d.id = dd.donation_id
      GROUP BY donor_name, donor_email
      ORDER BY total_donated DESC
      LIMIT 10
    `);

    // Get donation type distribution
    const [typeDistribution] = await pool.query(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(dd.amount) as total_amount
      FROM donations d
      LEFT JOIN donation_details dd ON d.id = dd.donation_id
      GROUP BY type
      ORDER BY count DESC
    `);

    const dashboard = {
      overview: {
        totalDonations: totalStats[0].total_donations || 0,
        uniqueDonors: totalStats[0].unique_donors || 0,
        totalAmount: totalStats[0].total_amount || 0,
        averageAmount: totalStats[0].average_amount || 0,
        completedDonations: totalStats[0].completed_donations || 0,
        pendingDonations: totalStats[0].pending_donations || 0
      },
      recentActivity: {
        last30Days: {
          donations: recentStats[0].recent_donations || 0,
          amount: recentStats[0].recent_amount || 0,
          newDonors: recentStats[0].recent_donors || 0
        }
      },
      topDonors: topDonors,
      typeDistribution: typeDistribution,
      efficiency: {
        completionRate: totalStats[0].total_donations > 0 ? 
          ((totalStats[0].completed_donations / totalStats[0].total_donations) * 100).toFixed(1) : 0,
        pendingRate: totalStats[0].total_donations > 0 ? 
          ((totalStats[0].pending_donations / totalStats[0].total_donations) * 100).toFixed(1) : 0
      }
    };

    res.json({
      success: true,
      data: dashboard,
      meta: {
        generatedAt: new Date().toISOString(),
        dataRange: 'All time with 30-day recent activity'
      }
    });

  } catch (error) {
    console.error('Error generating donation dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate donation dashboard'
    });
  }
});

// Generate donation performance report
router.post('/analytics/report', isAuthenticated, logUserActivity, async (req, res) => {
  try {
    console.log('📋 Generating donation performance report...');
    
    const { 
      startDate, 
      endDate, 
      includeInsights = true, 
      includeRecommendations = true,
      includePredictions = false,
      includeComparisons = false 
    } = req.body;

    // Get donation data
    const [donations] = await pool.query(`
      SELECT 
        d.*,
        dd.amount,
        dd.item_description,
        dd.estimated_value,
        dd.condition,
        dd.loan_start_date,
        dd.loan_end_date
      FROM donations d
      LEFT JOIN donation_details dd ON d.id = dd.donation_id
      WHERE (? IS NULL OR d.created_at >= ?) 
        AND (? IS NULL OR d.created_at <= ?)
      ORDER BY d.created_at DESC
    `, [startDate, startDate, endDate, endDate]);

    const donationData = {
      donations: donations,
      totalDonations: donations.length,
      totalAmount: donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0),
      timeRange: { startDate, endDate }
    };

    let insights = null;
    if (includeInsights) {
      insights = await donationAIService.generateDonationInsights(donationData);
    }

    const report = {
      summary: {
        totalDonations: donations.length,
        totalAmount: donationData.totalAmount,
        timeRange: { startDate, endDate },
        generatedAt: new Date().toISOString()
      },
      data: donationData,
      insights: insights,
      recommendations: includeRecommendations ? (insights?.recommendations || []) : [],
      predictions: includePredictions ? (insights?.predictions || []) : [],
      comparisons: includeComparisons ? (insights?.comparisons || []) : []
    };

    res.json({
      success: true,
      data: report,
      meta: {
        reportType: 'donation_performance',
        generatedAt: new Date().toISOString(),
        includesAI: includeInsights
      }
    });

  } catch (error) {
    console.error('Error generating donation performance report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate donation performance report'
    });
  }
});

module.exports = router;
