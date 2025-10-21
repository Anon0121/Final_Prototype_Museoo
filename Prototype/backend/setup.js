const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  let connection;
  
  try {
    // First connect without database to create it
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });

    console.log('✅ Connected to MySQL server');

    // Create database
    await connection.execute('CREATE DATABASE IF NOT EXISTS museosmart');
    console.log('✅ Database "museosmart" created/verified');

    // Use the database
    await connection.execute('USE museosmart');

    // Read and execute the SQL setup file
    const sqlFile = path.join(__dirname, 'setup_database.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }

    console.log('✅ Database tables created successfully');
    console.log('✅ Default admin user created (username: admin, password: admin123)');
    console.log('\n🎉 Database setup complete! You can now start your server.');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure MySQL is installed and running');
    console.log('2. Check if the username/password in db.js is correct');
    console.log('3. Try running: mysql -u root -p');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase(); 