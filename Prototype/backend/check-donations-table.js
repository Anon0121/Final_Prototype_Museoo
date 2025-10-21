const mysql = require('mysql2/promise');

async function checkTable() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Add your MySQL password here if needed
      database: 'museosmart'
    });

    console.log('✅ Connected to MySQL database');

    // Check the donations table structure
    const [rows] = await connection.execute('DESCRIBE donations');
    
    console.log('📋 Donations table structure:');
    console.table(rows);
    
    // Check if date_received column exists
    const hasDateReceived = rows.some(row => row.Field === 'date_received');
    const hasRequestDate = rows.some(row => row.Field === 'request_date');
    
    console.log('\n🔍 Column Analysis:');
    console.log(`- date_received column exists: ${hasDateReceived ? '✅ YES' : '❌ NO'}`);
    console.log(`- request_date column exists: ${hasRequestDate ? '✅ YES' : '❌ NO'}`);
    
    if (hasDateReceived) {
      console.log('\n⚠️  The date_received column still exists and needs to be removed.');
    } else {
      console.log('\n✅ The date_received column has already been removed.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the check
checkTable();

