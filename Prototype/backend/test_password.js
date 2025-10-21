const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function testPassword() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'museosmart'
  });

  try {
    // Get the admin user's password hash
    const [rows] = await pool.query('SELECT user_ID, username, password FROM system_user WHERE username = ?', ['admin']);
    
    if (rows.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }

    const user = rows[0];
    console.log(`✅ Found user: ${user.username} (ID: ${user.user_ID})`);
    console.log(`📋 Password hash: ${user.password.substring(0, 20)}...`);

    // Test with common passwords
    const testPasswords = ['admin', 'password', '123456', 'admin123', 'password123'];
    
    for (const testPassword of testPasswords) {
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log(`🔐 Testing "${testPassword}": ${isValid ? '✅ MATCH' : '❌ No match'}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testPassword();
