const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function addArchiveCategories() {
  let connection;
  
  try {
    // Database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'museosmart'
    });

    console.log('Connected to database successfully');

    // Read and execute the SQL migration
    const sqlPath = path.join(__dirname, '../database/add_archive_categories.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim());
        await connection.execute(statement);
      }
    }

    console.log('✅ Archive categories migration completed successfully!');
    
    // Verify the changes
    const [rows] = await connection.execute('DESCRIBE archives');
    console.log('\n📋 Current archives table structure:');
    rows.forEach(row => {
      console.log(`  - ${row.Field}: ${row.Type} ${row.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${row.Default ? `DEFAULT ${row.Default}` : ''}`);
    });

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
addArchiveCategories();
