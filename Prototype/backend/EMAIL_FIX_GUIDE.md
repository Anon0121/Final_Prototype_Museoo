# Email Configuration Fix Guide

## Current Issue
Gmail is blocking emails with error: `451-4.3.0 Mail server temporarily rejected message`

## Solutions

### Option 1: Fix Gmail Configuration (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account → Security → 2-Step Verification
   - Click "App passwords"
   - Select "Mail" and generate password
   - Replace the password in `services/emailService.js`

### Option 2: Use Different Email Service

Replace Gmail with a more reliable service like:
- **SendGrid** (Free tier: 100 emails/day)
- **Mailgun** (Free tier: 5,000 emails/month)
- **Outlook/Hotmail** (More lenient than Gmail)

### Option 3: Temporary Bypass (For Testing)

For now, you can:
1. Comment out email sending in the booking approval
2. Test the form functionality without emails
3. Fix email configuration later

## Quick Fix for Testing

In `routes/slots.js`, find the email sending code and add a try-catch to continue without emails:

```javascript
try {
  // Email sending code here
} catch (emailError) {
  console.log('Email sending failed, but booking approved:', emailError.message);
  // Continue with success response
}
```

## Current Email Settings
- Service: Gmail
- User: museoweb1@gmail.com
- Password: akrtgds yyprsfxyi (needs to be App Password)
