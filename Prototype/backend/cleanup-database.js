nationality because i replace it with 
const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanupDatabase() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'museoo'
    });

    console.log('🔗 Connected to database successfully');
    console.log('🧹 Starting database cleanup...\n');

    // Remove backup_code column from bookings table
    try {
      await connection.execute('ALTER TABLE bookings DROP COLUMN IF EXISTS backup_code');
      console.log('✅ Removed backup_code column from bookings table');
    } catch (error) {
      console.log('ℹ️  backup_code column not found in bookings table (already removed)');
    }

    // Remove backup_code column from visitors table
    try {
      await connection.execute('ALTER TABLE visitors DROP COLUMN IF EXISTS backup_code');
      console.log('✅ Removed backup_code column from visitors table');
    } catch (error) {
      console.log('ℹ️  backup_code column not found in visitors table (already removed)');
    }

    // Remove backup_code column from additional_visitors table
    try {
      await connection.execute('ALTER TABLE additional_visitors DROP COLUMN IF EXISTS backup_code');
      console.log('✅ Removed backup_code column from additional_visitors table');
    } catch (error) {
      console.log('ℹ️  backup_code column not found in additional_visitors table (already removed)');
    }

    // Drop backup_codes table if it exists
    try {
      await connection.execute('DROP TABLE IF EXISTS backup_codes');
      console.log('✅ Dropped backup_codes table (if it existed)');
    } catch (error) {
      console.log('ℹ️  backup_codes table not found (already removed)');
    }

    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('📋 Summary:');
    console.log('   • Removed backup_code columns from all tables');
    console.log('   • Dropped backup_codes table');
    console.log('   • Database is now clean and optimized');
    console.log('\n✨ The system now uses visitor IDs as backup codes');

  } catch (error) {
    console.error('❌ Error during database cleanup:', error.message);
    console.error('Please check your database connection and try again.');
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the cleanup
cleanupDatabase();

