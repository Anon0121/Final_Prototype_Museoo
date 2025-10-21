const mysql = require('mysql2/promise');

async function debugQRScanning() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'museosmart'
  });

  try {
    console.log('🔍 Debugging QR scanning for additional visitors...');
    
    // Check the most recent additional visitor with complete data
    const [recentVisitor] = await pool.query(`
      SELECT 
        v.visitor_id,
        v.first_name,
        v.last_name,
        v.gender,
        v.address,
        v.email,
        v.visitor_type,
        v.purpose,
        v.institution,
        v.status,
        v.is_main_visitor,
        b.date as visit_date,
        b.time_slot,
        av.token_id
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      LEFT JOIN additional_visitors av ON v.visitor_id = av.visitor_id
      WHERE v.is_main_visitor = 0
        AND v.first_name IS NOT NULL 
        AND v.first_name != ''
        AND v.email = 'jfamboy13216@liceo.edu.ph'
      ORDER BY v.visitor_id DESC
      LIMIT 1
    `);
    
    if (recentVisitor.length > 0) {
      const visitor = recentVisitor[0];
      console.log('📋 Most recent additional visitor with data:');
      console.log(`  - Visitor ID: ${visitor.visitor_id}`);
      console.log(`  - Name: ${visitor.first_name} ${visitor.last_name}`);
      console.log(`  - Email: ${visitor.email}`);
      console.log(`  - Gender: ${visitor.gender}`);
      console.log(`  - Address: ${visitor.address}`);
      console.log(`  - Visitor Type: ${visitor.visitor_type}`);
      console.log(`  - Purpose: ${visitor.purpose}`);
      console.log(`  - Institution: ${visitor.institution}`);
      console.log(`  - Token ID: ${visitor.token_id}`);
      console.log(`  - Visit Date: ${visitor.visit_date}`);
      console.log(`  - Time Slot: ${visitor.time_slot}`);
      
      // Test the exact query that QR scanning would use
      console.log('\n🔍 Testing QR scanning queries...');
      
      // Test visitorId query
      const [visitorIdTest] = await pool.query(`
        SELECT 
          v.visitor_id,
          v.first_name,
          v.last_name,
          v.gender,
          v.address,
          v.email,
          v.visitor_type,
          v.purpose,
          v.institution,
          v.status,
          v.checkin_time,
          v.is_main_visitor,
          b.date as visit_date, 
          b.time_slot, 
          b.status as booking_status
        FROM visitors v
        JOIN bookings b ON v.booking_id = b.booking_id
        WHERE v.visitor_id = ? AND v.is_main_visitor = false
      `, [visitor.visitor_id]);
      
      console.log(`✅ Query by visitorId (${visitor.visitor_id}): Found ${visitorIdTest.length} records`);
      if (visitorIdTest.length > 0) {
        console.log(`  - Name: ${visitorIdTest[0].first_name} ${visitorIdTest[0].last_name}`);
        console.log(`  - Gender: ${visitorIdTest[0].gender}`);
        console.log(`  - Address: ${visitorIdTest[0].address}`);
      }
      
      // Test email query (for legacy tokens)
      const [emailTest] = await pool.query(`
        SELECT 
          v.visitor_id,
          v.first_name,
          v.last_name,
          v.gender,
          v.address,
          v.email,
          v.visitor_type,
          v.purpose,
          v.institution,
          v.status,
          v.checkin_time,
          v.is_main_visitor,
          b.date as visit_date, 
          b.time_slot, 
          b.status as booking_status
        FROM visitors v
        JOIN bookings b ON v.booking_id = b.booking_id
        WHERE v.email = ? AND v.is_main_visitor = false
        ORDER BY v.visitor_id DESC LIMIT 1
      `, [visitor.email]);
      
      console.log(`✅ Query by email (${visitor.email}): Found ${emailTest.length} records`);
      if (emailTest.length > 0) {
        console.log(`  - Name: ${emailTest[0].first_name} ${emailTest[0].last_name}`);
        console.log(`  - Gender: ${emailTest[0].gender}`);
        console.log(`  - Address: ${emailTest[0].address}`);
      }
      
    } else {
      console.log('❌ No additional visitors with complete data found');
    }
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await pool.end();
  }
}

debugQRScanning();
