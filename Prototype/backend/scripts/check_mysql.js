const mysql = require('mysql2/promise');

async function checkMySQL() {
  console.log('🔍 Checking MySQL connection...');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3306,
      connectTimeout: 5000
    });
    
    console.log('✅ MySQL is running and accessible!');
    
    // Test if the database exists
    const [databases] = await connection.query('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === 'museosmart');
    
    if (dbExists) {
      console.log('✅ museosmart database exists!');
      
      // Test connection to the specific database
      await connection.query('USE museosmart');
      console.log('✅ Successfully connected to museosmart database!');
      
      // Check if the bookings table has the checkin_time column
      const [columns] = await connection.query('DESCRIBE bookings');
      const hasCheckinTime = columns.some(col => col.Field === 'checkin_time');
      
      if (hasCheckinTime) {
        console.log('✅ checkin_time column exists in bookings table!');
        console.log('\n🎉 Everything is ready! You can now scan QR codes.');
      } else {
        console.log('❌ checkin_time column is missing from bookings table');
      }
      
    } else {
      console.log('❌ museosmart database does not exist');
      console.log('💡 Run the setup_database.sql script to create it');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    console.log('\n🔧 To fix this:');
    console.log('1. Start XAMPP Control Panel');
    console.log('2. Click "Start" next to MySQL');
    console.log('3. Wait for MySQL to start (should show green)');
    console.log('4. Run this script again');
    console.log('\n💡 If you\'re not using XAMPP, make sure MySQL service is running');
  }
}

checkMySQL(); 