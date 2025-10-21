const mysql = require('mysql2/promise');

async function debugQRContent() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'museosmart'
  });

  try {
    console.log('🔍 Debugging QR code content for additional visitors...');
    
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
        av.token_id,
        av.visitor_id as av_visitor_id
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
      console.log('📋 Most recent additional visitor:');
      console.log(`  - Visitor ID: ${visitor.visitor_id}`);
      console.log(`  - Name: ${visitor.first_name} ${visitor.last_name}`);
      console.log(`  - Email: ${visitor.email}`);
      console.log(`  - Token ID: ${visitor.token_id}`);
      console.log(`  - AV Visitor ID: ${visitor.av_visitor_id}`);
      
      // Check what QR codes were generated for this visitor
      console.log('\n🔍 Checking QR code generation logic...');
      
      // Simulate what the QR code should contain
      const expectedQRData = {
        type: 'additional_visitor',
        visitorId: visitor.visitor_id,
        tokenId: visitor.token_id
      };
      
      console.log('📱 Expected QR Code Content:');
      console.log(JSON.stringify(expectedQRData, null, 2));
      
      // Test if this QR data would work with our scanning logic
      console.log('\n🧪 Testing QR scanning with this data...');
      
      if (expectedQRData.visitorId) {
        const [testResult] = await pool.query(`
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
        `, [expectedQRData.visitorId]);
        
        console.log(`✅ Query by visitorId (${expectedQRData.visitorId}): Found ${testResult.length} records`);
        if (testResult.length > 0) {
          const result = testResult[0];
          console.log(`  - Name: ${result.first_name} ${result.last_name}`);
          console.log(`  - Gender: ${result.gender}`);
          console.log(`  - Address: ${result.address}`);
          console.log(`  - Visitor Type: ${result.visitor_type}`);
          console.log(`  - Institution: ${result.institution}`);
          console.log(`  - Purpose: ${result.purpose}`);
        }
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

debugQRContent();