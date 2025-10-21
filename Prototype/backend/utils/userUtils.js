const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Email configuration - using the same email as existing system
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'museoweb1@gmail.com',
      pass: 'akrtgds yyprsfxyi'
    }
  });
};

// Generate a secure random password
const generateSecurePassword = () => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each category
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special character
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Hash a password using bcrypt
const hashPassword = async (password) => {
  const saltRounds = 12; // Higher number = more secure but slower
  return await bcrypt.hash(password, saltRounds);
};

// Verify a password against its hash
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Send user credentials email
const sendUserCredentials = async (userData) => {
  const { username, firstname, lastname, email, password, role } = userData;
  
  const transporter = createTransporter();
  
  const roleLabel = role === 'admin' ? 'Administrator' : 'Staff Member';
  
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Museum Account Credentials</title>
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
            border-bottom: 3px solid #AB8841;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #AB8841;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            font-size: 16px;
        }
        .content {
            margin-bottom: 30px;
        }
        .greeting {
            font-size: 18px;
            color: #2e2b41;
            margin-bottom: 20px;
        }
        .credentials-box {
            background-color: #f8f9fa;
            border: 2px solid #AB8841;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .credential-item {
            margin-bottom: 15px;
        }
        .label {
            font-weight: bold;
            color: #2e2b41;
            display: inline-block;
            width: 120px;
        }
        .value {
            background-color: #ffffff;
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid #ddd;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            color: #AB8841;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .warning-icon {
            color: #856404;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
        }
        .contact-info {
            background-color: #f8f9fa;
            border-radius: 5px;
            padding: 15px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏛️ Cagayan de Oro City Museum</div>
            <div class="subtitle">Museum Management System</div>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hello ${firstname} ${lastname},
            </div>
            
            <p>Welcome to the Cagayan de Oro City Museum Management System! Your account has been successfully created as a <strong>${roleLabel}</strong>.</p>
            
            <div class="credentials-box">
                <h3 style="color: #2e2b41; margin-top: 0;">Your Login Credentials:</h3>
                
                <div class="credential-item">
                    <span class="label">Username:</span>
                    <span class="value">${username}</span>
                </div>
                
                <div class="credential-item">
                    <span class="label">Password:</span>
                    <span class="value">${password}</span>
                </div>
                
                <div class="credential-item">
                    <span class="label">Role:</span>
                    <span class="value">${roleLabel}</span>
                </div>
            </div>
            
            <div class="warning">
                <div class="warning-icon">⚠️ Important Security Notice:</div>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Please change your password immediately after your first login</li>
                    <li>Keep your credentials secure and do not share them with others</li>
                    <li>If you suspect any security issues, contact the system administrator immediately</li>
                </ul>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ol style="padding-left: 20px;">
                <li>Visit the museum management system login page</li>
                <li>Use the credentials provided above to log in</li>
                <li>Change your password in the account settings</li>
                <li>Familiarize yourself with the system features</li>
            </ol>
        </div>
        
        <div class="footer">
            <div class="contact-info">
                <strong>Need Help?</strong><br>
                Contact the Museum Administrator<br>
                Email: admin@museum.com<br>
                Phone: (088) 123-4567
            </div>
            
            <p style="margin-top: 20px; font-size: 14px;">
                This is an automated message. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>`;

  const mailOptions = {
    from: 'museoweb1@gmail.com',
    to: email,
    subject: `Your Museum Account Credentials - ${firstname} ${lastname}`,
    html: htmlTemplate,
    text: `
Cagayan de Oro City Museum - Account Credentials

Hello ${firstname} ${lastname},

Welcome to the Cagayan de Oro City Museum Management System! Your account has been successfully created as a ${roleLabel}.

Your Login Credentials:
Username: ${username}
Password: ${password}
Role: ${roleLabel}

IMPORTANT SECURITY NOTICE:
- Please change your password immediately after your first login
- Keep your credentials secure and do not share them with others
- If you suspect any security issues, contact the system administrator immediately

Next Steps:
1. Visit the museum management system login page
2. Use the credentials provided above to log in
3. Change your password in the account settings
4. Familiarize yourself with the system features

Need Help?
Contact the Museum Administrator
Email: admin@museum.com
Phone: (088) 123-4567

This is an automated message. Please do not reply to this email.
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ User credentials email sent successfully to ${email}`);
    return { success: true, message: 'Credentials email sent successfully' };
  } catch (error) {
    console.error('❌ Error sending user credentials email:', error);
    return { success: false, message: 'Failed to send credentials email', error: error.message };
  }
};

module.exports = {
  generateSecurePassword,
  hashPassword,
  verifyPassword,
  sendUserCredentials,
  createTransporter
}; 