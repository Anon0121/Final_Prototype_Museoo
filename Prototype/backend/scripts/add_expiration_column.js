const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function addExpirationColumn() {
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
    const sqlPath = path.join(__dirname, '../database/add_expiration_to_additional_visitors.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Execute SQL
    await connection.query(sqlContent);
    
    console.log('✅ Successfully added expiration column to additional_visitors table');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Check if column already exists
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️  Expiration column already exists, skipping...');
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
addExpirationColumn().catch(console.error);
