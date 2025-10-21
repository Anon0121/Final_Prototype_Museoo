const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDonations() {
  let connection;
  
  try {
    console.log('🔍 Checking donations table...');
    
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'museosmart'
    });
    
    console.log('✅ Connected to database');
    
    // Check all donations
    const [donations] = await connection.query('SELECT * FROM donations ORDER BY created_at DESC LIMIT 10');
    console.log(`📋 Found ${donations.length} donations:`);
    
    donations.forEach((donation, index) => {
      console.log(`\n${index + 1}. ID: ${donation.id}`);
      console.log(`   Name: ${donation.donor_name}`);
      console.log(`   Email: ${donation.donor_email}`);
      console.log(`   Type: ${donation.type}`);
      console.log(`   Status: ${donation.status}`);
      console.log(`   Processing Stage: ${donation.processing_stage}`);
      console.log(`   Preferred Date: ${donation.preferred_visit_date}`);
      console.log(`   Preferred Time: ${donation.preferred_visit_time}`);
      console.log(`   Created: ${donation.created_at}`);
      console.log(`   Request Date: ${donation.request_date}`);
    });
    
    // Check specifically for meeting requests
    const [meetingRequests] = await connection.query(
      "SELECT * FROM donations WHERE processing_stage = 'request_received' AND preferred_visit_date IS NOT NULL ORDER BY created_at DESC"
    );
    console.log(`\n🎯 Found ${meetingRequests.length} meeting requests:`);
    
    meetingRequests.forEach((request, index) => {
      console.log(`\n${index + 1}. Meeting Request ID: ${request.id}`);
      console.log(`   Donor: ${request.donor_name}`);
      console.log(`   Email: ${request.donor_email}`);
      console.log(`   Preferred Date: ${request.preferred_visit_date}`);
      console.log(`   Preferred Time: ${request.preferred_visit_time}`);
      console.log(`   Created: ${request.created_at}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDonations();

