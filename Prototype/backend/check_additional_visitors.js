const mysql = require('mysql2/promise');

async function checkAdditionalVisitors() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'museosmart'
  });

  try {
    console.log('🔍 Checking additional_visitors table structure and data...');
    
    // Check table structure
    const [columns] = await pool.query(`
      DESCRIBE additional_visitors
    `);
    
    console.log('📋 additional_visitors table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    console.log('\n');
    
    // Check actual data
    const [data] = await pool.query(`
      SELECT * FROM additional_visitors 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('📊 Sample data in additional_visitors:');
    data.forEach(row => {
      console.log('  Record:');
      Object.keys(row).forEach(key => {
        console.log(`    ${key}: ${row[key]}`);
      });
      console.log('    ---');
    });
    
    // Check if there are any records with names
    const [withNames] = await pool.query(`
      SELECT 
        token_id,
        first_name,
        last_name,
        email,
        status
      FROM additional_visitors 
      WHERE first_name IS NOT NULL OR last_name IS NOT NULL
      LIMIT 5
    `);
    
    console.log('👥 Records with names:');
    withNames.forEach(row => {
      console.log(`  - Token: ${row.token_id}`);
      console.log(`    Name: ${row.first_name} ${row.last_name}`);
      console.log(`    Email: ${row.email}`);
      console.log(`    Status: ${row.status}`);
      console.log('    ---');
    });
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await pool.end();
  }
}

checkAdditionalVisitors();
