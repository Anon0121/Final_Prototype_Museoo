const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function setupWalkInSchedules() {
  let connection;
  
  try {
    console.log('🔧 Setting up walk-in schedules table...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to museosmart database');
    
    // Read and execute SQL script
    const sqlPath = path.join(__dirname, '../database/add_walkin_schedules_table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL directly
    await connection.query(sqlContent);
    console.log('✅ Walk-in schedules table created successfully');
    
    console.log('🎉 Walk-in schedules table setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up walk-in schedules table:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the setup
setupWalkInSchedules();
