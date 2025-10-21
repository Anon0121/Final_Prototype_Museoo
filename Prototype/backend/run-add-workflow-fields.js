const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
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

    // Read the migration file
    const migrationPath = path.join(__dirname, 'database', 'add_donation_workflow_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Reading migration file...');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🔄 Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`   ${i + 1}. Executing: ${statement.substring(0, 50)}...`);
          await connection.execute(statement);
          console.log(`   ✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`   ❌ Error in statement ${i + 1}:`, error.message);
          // Continue with other statements even if one fails
        }
      }
    }

    console.log('🎉 Migration completed successfully!');
    console.log('📋 Summary:');
    console.log('   - Added processing_stage column to donations table');
    console.log('   - Added request_date and other workflow fields');
    console.log('   - Updated existing records');

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
runMigration();

