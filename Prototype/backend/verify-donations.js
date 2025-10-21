const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function verifyDonations() {
  try {
    const conn = await mysql.createConnection(dbConfig);
    
    console.log('=== VERIFICATION ===');
    const [donations] = await conn.query(`
      SELECT d.id, d.donor_name, dd.amount, dd.item_description 
      FROM donations d 
      LEFT JOIN donation_details dd ON d.id = dd.donation_id 
      ORDER BY d.id DESC
    `);
    
    console.log('All donations with details:');
    donations.forEach((d, i) => {
      console.log(`${i+1}. ID: ${d.id}`);
      console.log(`   Name: "${d.donor_name}"`);
      console.log(`   Amount: ${d.amount}`);
      console.log(`   Description: ${d.item_description}`);
      console.log('');
    });
    
    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

verifyDonations();

