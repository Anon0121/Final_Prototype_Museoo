const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function debugDonations() {
  try {
    const conn = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected');
    
    // Test 1: Check donations table
    console.log('\n=== TEST 1: Donations Table ===');
    const [donations] = await conn.query('SELECT * FROM donations ORDER BY created_at DESC');
    console.log('Total donations:', donations.length);
    donations.forEach((d, i) => {
      console.log(`${i+1}. ID: ${d.id}, Name: ${d.donor_name}, Status: ${d.status}, Stage: ${d.processing_stage}`);
    });
    
    // Test 2: Check donation_details table
    console.log('\n=== TEST 2: Donation Details Table ===');
    const [details] = await conn.query('SELECT * FROM donation_details ORDER BY id DESC');
    console.log('Total details records:', details.length);
    details.forEach((d, i) => {
      console.log(`${i+1}. Donation ID: ${d.donation_id}, Amount: ${d.amount}, Description: ${d.item_description}`);
    });
    
    // Test 3: Try the basic query that should work
    console.log('\n=== TEST 3: Basic JOIN Query ===');
    try {
      const [result] = await conn.query(
        `SELECT d.*, dd.amount, dd.item_description, dd.estimated_value
         FROM donations d
         LEFT JOIN donation_details dd ON d.id = dd.donation_id
         ORDER BY d.request_date DESC`
      );
      console.log('✅ Basic query successful, records:', result.length);
      result.forEach((r, i) => {
        console.log(`${i+1}. ID: ${r.id}, Name: ${r.donor_name}, Amount: ${r.amount}`);
      });
    } catch (err) {
      console.log('❌ Basic query failed:', err.message);
    }
    
    // Test 4: Try the full query with missing tables
    console.log('\n=== TEST 4: Full Query with Missing Tables ===');
    try {
      const [result] = await conn.query(
        `SELECT d.*, dd.amount, dd.item_description, dd.estimated_value,
                ms.preferred_visit_date, ms.preferred_visit_time, ms.scheduled_date, ms.scheduled_time, ms.location, ms.staff_member, ms.status as meeting_status,
                chs.submission_date, chs.status as city_hall_status, chs.approval_date
         FROM donations d
         LEFT JOIN donation_details dd ON d.id = dd.donation_id
         LEFT JOIN donation_meeting_schedule ms ON d.id = ms.donation_id
         LEFT JOIN donation_city_hall_submission chs ON d.id = chs.donation_id
         ORDER BY d.request_date DESC`
      );
      console.log('✅ Full query successful, records:', result.length);
    } catch (err) {
      console.log('❌ Full query failed:', err.message);
    }
    
    await conn.end();
  } catch (err) {
    console.error('❌ Database error:', err.message);
  }
}

debugDonations();

