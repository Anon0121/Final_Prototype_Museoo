const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart',
  multipleStatements: true
};

async function runMigration() {
  let connection;
  
  try {
    console.log('🔄 Starting donation process workflow migration...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database', 'donation_process_workflow.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded');
    
    // Execute the migration
    console.log('🚀 Executing migration...');
    await connection.execute(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 New donation process workflow has been implemented:');
    console.log('   • Donors can now submit requests with preferred visit dates');
    console.log('   • Staff can schedule meetings and send email notifications');
    console.log('   • Meeting completion and handover tracking');
    console.log('   • City hall submission and approval workflow');
    console.log('   • Final approval with automatic gratitude emails');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
runMigration();
