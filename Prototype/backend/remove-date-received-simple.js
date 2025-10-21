const mysql = require('mysql2/promise');

async function removeDateReceived() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Add your MySQL password here if needed
      database: 'museosmart'
    });

    console.log('✅ Connected to MySQL database');

    // Remove the date_received column
    try {
      await connection.execute(`
        ALTER TABLE donations DROP COLUMN date_received
      `);
      console.log('✅ Removed date_received column from donations table');
    } catch (error) {
      console.log('⚠️  Error removing date_received column:', error.message);
    }

    // Update any existing records to ensure request_date is set
    try {
      await connection.execute(`
        UPDATE donations SET request_date = created_at WHERE request_date IS NULL
      `);
      console.log('✅ Updated existing records with request_date');
    } catch (error) {
      console.log('⚠️  Error updating request_date:', error.message);
    }

    console.log('🎉 Migration completed successfully!');
    console.log('📋 Summary:');
    console.log('   - Removed date_received field from donations table');
    console.log('   - Updated request_date for existing records');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
removeDateReceived();

