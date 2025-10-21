const mysql = require('mysql2/promise');

async function checkVisitorData() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'museosmart'
  });

  try {
    console.log('🔍 Checking visitor data for QR scanning...');
    
    // Check the specific visitor that's being scanned
    const [visitors] = await pool.query(`
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
        b.time_slot
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE v.email = 'jfamboy13216@liceo.edu.ph' 
        AND v.is_main_visitor = 0
      ORDER BY v.visitor_id DESC
    `);
    
    console.log('👥 Additional visitors for email jfamboy13216@liceo.edu.ph:');
    visitors.forEach(visitor => {
      console.log(`  - Visitor ID: ${visitor.visitor_id}`);
      console.log(`    Name: "${visitor.first_name}" "${visitor.last_name}"`);
      console.log(`    Gender: "${visitor.gender}"`);
      console.log(`    Address: "${visitor.address}"`);
      console.log(`    Visitor Type: "${visitor.visitor_type}"`);
      console.log(`    Purpose: "${visitor.purpose}"`);
      console.log(`    Institution: "${visitor.institution}"`);
      console.log(`    Status: "${visitor.status}"`);
      console.log(`    Visit Date: ${visitor.visit_date}`);
      console.log(`    Time Slot: ${visitor.time_slot}`);
      console.log('    ---');
    });
    
    // Check if there are any visitors with complete data
    const [completeVisitors] = await pool.query(`
      SELECT 
        v.visitor_id,
        v.first_name,
        v.last_name,
        v.gender,
        v.address,
        v.email,
        v.visitor_type,
        v.purpose,
        v.institution
      FROM visitors v
      WHERE v.is_main_visitor = 0
        AND v.first_name IS NOT NULL 
        AND v.first_name != ''
        AND v.last_name IS NOT NULL 
        AND v.last_name != ''
        AND v.gender IS NOT NULL 
        AND v.gender != ''
      ORDER BY v.visitor_id DESC
      LIMIT 5
    `);
    
    console.log('✅ Additional visitors with complete data:');
    completeVisitors.forEach(visitor => {
      console.log(`  - ID: ${visitor.visitor_id}, Name: ${visitor.first_name} ${visitor.last_name}, Email: ${visitor.email}`);
    });
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await pool.end();
  }
}

checkVisitorData();
