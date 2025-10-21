const mysql = require('mysql2/promise');

async function addWorkflowFields() {
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

    // Add processing_stage column
    try {
      await connection.execute(`
        ALTER TABLE donations 
        ADD COLUMN processing_stage ENUM(
            'request_received', 
            'under_review', 
            'meeting_scheduled', 
            'meeting_completed', 
            'handover_completed', 
            'city_hall_processing', 
            'city_hall_approved', 
            'final_approved', 
            'completed',
            'rejected'
        ) DEFAULT 'request_received' AFTER status
      `);
      console.log('✅ Added processing_stage column');
    } catch (error) {
      console.log('⚠️  processing_stage column might already exist:', error.message);
    }

    // Add request_date column
    try {
      await connection.execute(`
        ALTER TABLE donations 
        ADD COLUMN request_date TIMESTAMP NULL AFTER created_at
      `);
      console.log('✅ Added request_date column');
    } catch (error) {
      console.log('⚠️  request_date column might already exist:', error.message);
    }

    // Add preferred_visit_date column
    try {
      await connection.execute(`
        ALTER TABLE donations 
        ADD COLUMN preferred_visit_date DATE NULL AFTER request_date
      `);
      console.log('✅ Added preferred_visit_date column');
    } catch (error) {
      console.log('⚠️  preferred_visit_date column might already exist:', error.message);
    }

    // Add preferred_visit_time column
    try {
      await connection.execute(`
        ALTER TABLE donations 
        ADD COLUMN preferred_visit_time TIME NULL AFTER preferred_visit_date
      `);
      console.log('✅ Added preferred_visit_time column');
    } catch (error) {
      console.log('⚠️  preferred_visit_time column might already exist:', error.message);
    }

    // Update existing records
    try {
      await connection.execute(`
        UPDATE donations SET request_date = created_at WHERE request_date IS NULL
      `);
      console.log('✅ Updated existing records with request_date');
    } catch (error) {
      console.log('⚠️  Error updating existing records:', error.message);
    }

    try {
      await connection.execute(`
        UPDATE donations SET processing_stage = 'request_received' WHERE processing_stage IS NULL
      `);
      console.log('✅ Updated existing records with processing_stage');
    } catch (error) {
      console.log('⚠️  Error updating processing_stage:', error.message);
    }

    console.log('🎉 Migration completed successfully!');

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
addWorkflowFields();

