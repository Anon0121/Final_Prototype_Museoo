const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function addArchiveVisibility() {
  let connection;
  
  try {
    // Database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'museosmart'
    });

    console.log('Connected to database successfully');

    // Read and execute the SQL migration
    const sqlPath = path.join(__dirname, '../database/add_archive_visibility.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim());
        await connection.execute(statement);
      }
    }

    console.log('✅ Archive visibility migration completed successfully!');
    console.log('📋 Changes made:');
    console.log('   - Added is_visible BOOLEAN column to archives table');
    console.log('   - Set default visibility to TRUE for existing archives');
    console.log('   - Created index for visibility searches');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
addArchiveVisibility();
