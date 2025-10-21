const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function checkDonorData() {
  try {
    const conn = await mysql.createConnection(dbConfig);
    
    console.log('=== DONATIONS TABLE STRUCTURE ===');
    const [columns] = await conn.query('DESCRIBE donations');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
    });
    
    console.log('\n=== CURRENT DONATION DATA ===');
    const [donations] = await conn.query(`
      SELECT id, donor_name, donor_email, status, processing_stage, created_at, request_date
      FROM donations 
      ORDER BY id DESC
    `);
    
    console.log(`Total donations: ${donations.length}`);
    donations.forEach((d, i) => {
      console.log(`${i+1}. ID: ${d.id}`);
      console.log(`   Name: "${d.donor_name}"`);
      console.log(`   Email: ${d.donor_email}`);
      console.log(`   Status: ${d.status}`);
      console.log(`   Stage: ${d.processing_stage}`);
      console.log(`   Created: ${d.created_at}`);
      console.log(`   Request Date: ${d.request_date}`);
      console.log('');
    });
    
    await conn.end();
  } catch (err) {
    console.error('Database error:', err.message);
  }
}

checkDonorData();

