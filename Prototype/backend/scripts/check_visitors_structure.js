const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'museosmart',
  port: process.env.DB_PORT || 3306
};

async function checkVisitorsStructure() {
  let pool;
  
  try {
    console.log('🔍 Checking visitors table structure...');
    
    // Create database connection
    pool = mysql.createPool(dbConfig);
    console.log('✅ Database connection established');
    
    // Check current table structure
    const [columns] = await pool.query(`
      DESCRIBE visitors
    `);
    
    console.log('\n📋 Current visitors table structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default} | ${col.Extra}`);
    });
    
    // Check if there are any records
    const [count] = await pool.query(`SELECT COUNT(*) as total FROM visitors`);
    console.log(`\n📊 Total visitors: ${count[0].total}`);
    
    if (count[0].total > 0) {
      // Check sample data
      const [sample] = await pool.query(`SELECT * FROM visitors LIMIT 3`);
      console.log('\n🔍 Sample visitor data:');
      sample.forEach((visitor, index) => {
        console.log(`\nVisitor ${index + 1}:`);
        Object.keys(visitor).forEach(key => {
          console.log(`  ${key}: ${visitor[key]}`);
        });
      });
    }
    
  } catch (err) {
    console.error('❌ Error checking visitors structure:', err.message);
  } finally {
    if (pool) {
      await pool.end();
      console.log('🔌 Database connection closed');
    }
  }
}

checkVisitorsStructure();
