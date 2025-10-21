const pool = require('../db');

async function verifyTableRemoval() {
  const conn = await pool.getConnection();
  
  try {
    const [tables] = await conn.query('SHOW TABLES LIKE "donation_%"');
    
    console.log('📋 Current donation tables:');
    console.log('============================');
    
    tables.forEach(table => {
      console.log(`✅ ${Object.values(table)[0]}`);
    });
    
    console.log();
    
    const hasVisitorTable = tables.some(t => Object.values(t)[0] === 'donation_visitor_submissions');
    
    if (hasVisitorTable) {
      console.log('❌ donation_visitor_submissions still exists!');
    } else {
      console.log('✅ donation_visitor_submissions successfully removed!');
      console.log(`📊 Total donation tables: ${tables.length}`);
    }
    
  } finally {
    conn.release();
  }
}

verifyTableRemoval().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });






