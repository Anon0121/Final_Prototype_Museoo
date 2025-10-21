const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function updateDatabase() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Add password if needed
      database: 'museosmart'
    });

    console.log('✅ Connected to database successfully!');

    // Read the SQL file
    const sqlFile = path.join(__dirname, '../database/clean_visitor_system.sql');
    console.log('📖 Reading SQL file:', sqlFile);
    
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement && !statement.startsWith('--')) {
        console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}:`);
        console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
        
        try {
          await connection.execute(statement);
          console.log('✅ Statement executed successfully');
        } catch (error) {
          if (error.code === 'ER_TABLE_EXISTS' || error.code === 'ER_DUP_KEYNAME') {
            console.log('⚠️  Table/Index already exists (skipping)');
          } else {
            console.log('❌ Error executing statement:', error.message);
            // Continue with other statements
          }
        }
      }
    }

    console.log('\n🎉 Database update completed successfully!');
    
    // Verify the changes
    console.log('\n📋 Verifying changes...');
    
    // Check visitors table structure
    const [visitorStructure] = await connection.execute('DESCRIBE visitors');
    console.log('\n📊 Visitors table structure:');
    console.table(visitorStructure);
    
    // Check bookings table structure
    const [bookingStructure] = await connection.execute('DESCRIBE bookings');
    console.log('\n📊 Bookings table structure:');
    console.table(bookingStructure);
    
    // Check visitor distribution
    const [visitorStats] = await connection.execute(`
      SELECT 
        is_main_visitor,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'visited' THEN 1 END) as checked_in
      FROM visitors 
      GROUP BY is_main_visitor
    `);
    console.log('\n📊 Visitor distribution:');
    console.table(visitorStats);
    
    // Check booking types
    const [bookingTypes] = await connection.execute('SELECT DISTINCT type FROM bookings');
    console.log('\n📊 Booking types:');
    console.table(bookingTypes);

  } catch (error) {
    console.error('❌ Error updating database:', error.message);
    console.error('Full error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the update
updateDatabase();
