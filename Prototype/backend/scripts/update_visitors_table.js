const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function updateVisitorsTable() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Add password if needed
      database: 'museosmart'
    });

    console.log('🔗 Connected to database');

    // Read the SQL file
    const sqlFile = path.join(__dirname, '../database/add_visitor_type_and_institution.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('📝 Executing:', statement.trim().substring(0, 50) + '...');
        await connection.execute(statement);
      }
    }

    console.log('✅ Database update completed successfully!');
    
    // Verify the changes
    const [rows] = await connection.execute('DESCRIBE visitors');
    console.log('📋 Updated visitors table structure:');
    console.table(rows);

  } catch (error) {
    console.error('❌ Error updating database:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

updateVisitorsTable();
