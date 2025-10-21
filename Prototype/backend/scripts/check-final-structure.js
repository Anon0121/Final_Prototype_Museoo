const pool = require('../db');

async function checkFinalStructure() {
  const conn = await pool.getConnection();
  
  try {
    const [fields] = await conn.query('DESCRIBE donations');
    
    console.log('🎉 FINAL DONATIONS TABLE STRUCTURE:');
    console.log('=====================================');
    console.log(`Total fields: ${fields.length}`);
    console.log();
    
    fields.forEach(f => {
      console.log(`- ${f.Field} (${f.Type})`);
    });
    
    console.log('\n✅ CLEANUP COMPLETE!');
    console.log(`Reduced from 29 fields to ${fields.length} fields`);
    console.log(`Size reduction: ${Math.round(((29 - fields.length) / 29) * 100)}%`);
    
  } finally {
    conn.release();
  }
}

checkFinalStructure().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });






