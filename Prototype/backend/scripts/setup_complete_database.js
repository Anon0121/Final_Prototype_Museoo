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

async function setupCompleteDatabase() {
  let connection;
  
  try {
    console.log('🏗️  Setting up complete database structure...');
    
    // Create connection without specifying database first
    const baseConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    // Create database if it doesn't exist
    await baseConnection.execute('CREATE DATABASE IF NOT EXISTS museosmart');
    console.log('✅ Database museosmart created/verified');
    
    await baseConnection.end();
    
    // Connect to the specific database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to museosmart database');
    
    // Read the complete setup SQL
    const setupPath = path.join(__dirname, 'complete_database_setup.sql');
    const setupSQL = fs.readFileSync(setupPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = setupSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`  [${i + 1}/${statements.length}] Executing statement...`);
          await connection.execute(statement);
        } catch (error) {
          // Skip errors for DROP TABLE statements (tables might not exist)
          if (statement.includes('DROP TABLE') && error.code === 'ER_BAD_TABLE_ERROR') {
            console.log(`  ⚠️  Skipping DROP TABLE (table doesn't exist)`);
          } else {
            console.error(`  ❌ Error executing statement: ${error.message}`);
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Database setup completed successfully!');
    
    // Verify all tables exist
    console.log('\n📋 Verifying table structure...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('\n📊 Tables in database:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  ✅ ${tableName}`);
    });
    
    // Check system_user table specifically
    console.log('\n👤 Checking system_user table...');
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM system_user');
    console.log(`  📊 Total users: ${users[0].count}`);
    
    const [adminUser] = await connection.execute(`
      SELECT user_ID, username, firstname, lastname, email, role, status 
      FROM system_user WHERE username = 'admin'
    `);
    
    if (adminUser.length > 0) {
      console.log('  ✅ Admin user found:');
      console.log(`    - Username: ${adminUser[0].username}`);
      console.log(`    - Email: ${adminUser[0].email}`);
      console.log(`    - Role: ${adminUser[0].role}`);
      console.log(`    - Status: ${adminUser[0].status}`);
    } else {
      console.log('  ❌ Admin user not found!');
    }
    
    // Check for any missing tables by comparing with expected tables
    const expectedTables = [
      'system_user',
      'bookings', 
      'visitors',
      'activities',
      'event_details',
      'exhibit_details',
      'images',
      'archives',
      'donations',
      'donation_details',
      'cultural_objects',
      'object_details'
    ];
    
    const existingTables = tables.map(table => Object.values(table)[0]);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('\n⚠️  Missing tables:');
      missingTables.forEach(table => console.log(`  ❌ ${table}`));
    } else {
      console.log('\n🎉 All expected tables are present!');
    }
    
    console.log('\n✅ Complete database setup finished successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the setup
setupCompleteDatabase(); 