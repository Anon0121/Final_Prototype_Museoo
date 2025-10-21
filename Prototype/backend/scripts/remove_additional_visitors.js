const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function removeAdditionalVisitorsTable() {
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

    // First, check if additional_visitors table exists
    const [tables] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'museosmart' 
      AND table_name = 'additional_visitors'
    `);
    
    if (tables[0].count === 0) {
      console.log('ℹ️  additional_visitors table does not exist - nothing to remove');
      return;
    }

    console.log('📊 Checking data migration status...');
    
    // Check record counts
    const [additionalCount] = await connection.execute('SELECT COUNT(*) as count FROM additional_visitors');
    const [visitorCount] = await connection.execute('SELECT COUNT(*) as count FROM visitors WHERE is_main_visitor = FALSE');
    
    console.log(`📈 additional_visitors records: ${additionalCount[0].count}`);
    console.log(`📈 visitors (additional) records: ${visitorCount[0].count}`);
    
    // Check for unmigrated data
    const [unmigrated] = await connection.execute(`
      SELECT 
        av.token_id,
        av.booking_id,
        av.email,
        av.status
      FROM additional_visitors av
      LEFT JOIN visitors v ON v.booking_id = av.booking_id AND v.email = av.email AND v.is_main_visitor = FALSE
      WHERE v.visitor_id IS NULL
    `);
    
    if (unmigrated.length > 0) {
      console.log('⚠️  Found unmigrated data:');
      console.table(unmigrated);
      console.log('❌ Cannot safely remove table - please migrate data first');
      return;
    }
    
    console.log('✅ All data appears to be migrated safely');
    
    // Drop the table
    console.log('🗑️  Dropping additional_visitors table...');
    await connection.execute('DROP TABLE IF EXISTS additional_visitors');
    console.log('✅ additional_visitors table removed successfully!');
    
    // Verify removal
    const [remainingTables] = await connection.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'museosmart'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Remaining tables:');
    console.table(remainingTables);
    
    // Show final visitor distribution
    const [visitorStats] = await connection.execute(`
      SELECT 
        is_main_visitor,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'visited' THEN 1 END) as checked_in
      FROM visitors 
      GROUP BY is_main_visitor
    `);
    
    console.log('\n📊 Final visitor distribution:');
    console.table(visitorStats);

  } catch (error) {
    console.error('❌ Error removing additional_visitors table:', error.message);
    console.error('Full error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the removal
removeAdditionalVisitorsTable();
