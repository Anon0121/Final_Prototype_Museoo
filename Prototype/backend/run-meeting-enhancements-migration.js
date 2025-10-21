const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'museum_db',
  multipleStatements: true
};

async function runMigration() {
  let connection;
  
  try {
    console.log('🔄 Starting donation meeting enhancements migration...');
    
    // Create database connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'database', 'add_meeting_enhancements.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Reading migration file:', migrationPath);
    
    // Execute the migration
    console.log('🚀 Executing migration...');
    await connection.execute(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Added fields:');
    console.log('   - rejection_reason (TEXT) - For storing rejection reasons');
    console.log('   - suggested_alternative_dates (JSON) - For storing alternative meeting dates');
    console.log('   - Index on rejection_reason for better performance');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Some fields may already exist. This is normal if the migration was run before.');
    } else if (error.code === 'ER_DUP_KEYNAME') {
      console.log('ℹ️  Some indexes may already exist. This is normal if the migration was run before.');
    } else {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
runMigration();

