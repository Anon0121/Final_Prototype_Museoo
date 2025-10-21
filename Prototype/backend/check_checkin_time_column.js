const mysql = require('mysql2/promise');

async function checkCheckinTimeColumn() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'museosmart'
  });

  try {
    console.log('🔍 Checking checkin_time column in database tables...');
    
    // Check visitors table
    const [visitorsColumns] = await pool.query('DESCRIBE visitors');
    const hasCheckinTime = visitorsColumns.some(col => col.Field === 'checkin_time');
    console.log('📋 visitors table has checkin_time column:', hasCheckinTime);
    
    if (!hasCheckinTime) {
      console.log('🔧 Adding checkin_time column to visitors table...');
      await pool.query(`
        ALTER TABLE visitors 
        ADD COLUMN checkin_time TIMESTAMP NULL
      `);
      console.log('✅ Added checkin_time column to visitors table');
    }
    
    // Check additional_visitors table
    const [additionalColumns] = await pool.query('DESCRIBE additional_visitors');
    const additionalHasCheckinTime = additionalColumns.some(col => col.Field === 'checkin_time');
    console.log('📋 additional_visitors table has checkin_time column:', additionalHasCheckinTime);
    
    if (!additionalHasCheckinTime) {
      console.log('🔧 Adding checkin_time column to additional_visitors table...');
      await pool.query(`
        ALTER TABLE additional_visitors 
        ADD COLUMN checkin_time TIMESTAMP NULL
      `);
      console.log('✅ Added checkin_time column to additional_visitors table');
    }
    
    // Show final structure
    console.log('\n📋 Final visitors table structure:');
    const [finalVisitorsColumns] = await pool.query('DESCRIBE visitors');
    finalVisitorsColumns.forEach(col => {
      if (col.Field.includes('checkin') || col.Field.includes('time')) {
        console.log(`  - ${col.Field}: ${col.Type}`);
      }
    });
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await pool.end();
  }
}

checkCheckinTimeColumn();
