const { sendUserCredentials } = require('./utils/userUtils');

async function testEmail() {
  try {
    console.log('🧪 Testing email sending...');
    
    const result = await sendUserCredentials({
      username: 'testuser',
      firstname: 'Test',
      lastname: 'User',
      email: 'test@example.com', // Use a test email
      password: 'TestPass123!',
      role: 'staff'
    });
    
    console.log('📧 Email result:', result);
    
  } catch (err) {
    console.error('❌ Email test error:', err.message);
  }
}

testEmail();




