const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function setupPromotionalTable() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('📖 Reading SQL file...');
    const sqlFilePath = path.join(__dirname, '../database/create_promotional_table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL statements by semicolon and execute each one
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    console.log('🚀 Executing SQL statements...');
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        await connection.execute(statement);
      }
    }
    
    console.log('✅ Promotional table setup completed successfully!');
    
    // Verify the table was created
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM promotional_items');
    console.log(`📊 Found ${rows[0].count} promotional items in the database`);
    
  } catch (error) {
    console.error('❌ Error setting up promotional table:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the setup
setupPromotionalTable();
