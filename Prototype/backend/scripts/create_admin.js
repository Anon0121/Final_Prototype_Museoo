const mysql = require('mysql2/promise');

async function createAdminUser() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'museosmart'
    });

    console.log('✅ Connected to database');

    // Check if admin user exists
    const [existingUsers] = await connection.execute(
      'SELECT * FROM system_user WHERE username = ?',
      ['admin']
    );

    if (existingUsers.length === 0) {
      // Create admin user
      await connection.execute(
        `INSERT INTO system_user (username, firstname, lastname, password, role, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['admin', 'Admin', 'User', 'admin123', 'admin', 'active']
      );
      console.log('✅ Admin user created successfully');
      console.log('📋 Login credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.log('✅ Admin user already exists');
      console.log('📋 Login credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    }

    // Show all users
    const [allUsers] = await connection.execute('SELECT username, role, status FROM system_user');
    console.log('\n📊 Current users in database:');
    allUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.role}) - ${user.status}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure XAMPP MySQL is running');
    console.log('2. Make sure the museosmart database exists');
    console.log('3. Run: node setup.js to create the database first');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createAdminUser(); 