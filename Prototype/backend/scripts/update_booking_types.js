const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function updateBookingTypes() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'museosmart'
    });

    console.log('✅ Connected to database');

    // Read SQL file
    const sqlPath = path.join(__dirname, '../database/update_booking_types.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Execute SQL
    await connection.query(sqlContent);
    
    console.log('✅ Successfully updated booking types ENUM');
    
    // Verify the change by checking the table structure
    const [columns] = await connection.query(
      `SHOW COLUMNS FROM bookings LIKE 'type'`
    );
    
    if (columns.length > 0) {
      console.log('📋 Current type column definition:');
      console.log(columns[0].Type);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Check if it's already updated
    if (error.message.includes('Duplicate column name') || error.message.includes('already exists')) {
      console.log('ℹ️  Booking types already updated, skipping...');
    } else {
      throw error;
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

// Run the script
updateBookingTypes().catch(console.error);
