const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupEventRegistration() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'museosmart'
    });

    console.log('🔗 Connected to database');

    // Read and execute the SQL file
    const sqlFile = path.join(__dirname, '../database/update_event_registration_system.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Split SQL commands by semicolon and execute each one
    const commands = sqlContent.split(';').filter(cmd => cmd.trim());
    
    for (const command of commands) {
      if (command.trim()) {
        try {
          await connection.execute(command);
          console.log('✅ Executed SQL command');
        } catch (error) {
          if (error.code !== 'ER_DUP_FIELDNAME' && error.code !== 'ER_DUP_KEYNAME') {
            console.error('❌ Error executing command:', error.message);
          } else {
            console.log('⚠️  Field/Index already exists, skipping...');
          }
        }
      }
    }

    console.log('🎉 Event registration system setup completed!');
    
    // Verify the setup
    const [tables] = await connection.execute('SHOW TABLES LIKE "event_registrations"');
    if (tables.length > 0) {
      console.log('✅ event_registrations table created successfully');
    }

    const [columns] = await connection.execute('DESCRIBE activities');
    const hasCapacity = columns.some(col => col.Field === 'max_capacity');
    if (hasCapacity) {
      console.log('✅ Capacity fields added to activities table');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the setup
setupEventRegistration();
