const mysql = require('mysql2/promise');

async function debugQRCodes() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'museosmart'
  });

  try {
    console.log('🔍 Debugging QR codes in database...');
    
    // Check visitors table
    const [visitors] = await pool.query(`
      SELECT 
        visitor_id, 
        email, 
        is_main_visitor,
        qr_code IS NOT NULL as has_qr_code,
        status
      FROM visitors 
      WHERE qr_code IS NOT NULL 
      ORDER BY visitor_id DESC 
      LIMIT 5
    `);
    
    console.log('👥 Visitors with QR codes:', visitors.length);
    visitors.forEach(v => {
      console.log(`  - ID: ${v.visitor_id}, Email: ${v.email}, Main: ${v.is_main_visitor}, Status: ${v.status}`);
    });
    
    // Check additional_visitors table
    const [tokens] = await pool.query(`
      SELECT 
        token_id, 
        email, 
        status,
        details IS NOT NULL as has_details
      FROM additional_visitors 
      ORDER BY token_id DESC 
      LIMIT 5
    `);
    
    console.log('🎫 Tokens in additional_visitors:', tokens.length);
    tokens.forEach(t => {
      console.log(`  - Token: ${t.token_id}, Email: ${t.email}, Status: ${t.status}`);
    });
    
    // Check if there are any visitors without QR codes
    const [noQrVisitors] = await pool.query(`
      SELECT 
        visitor_id, 
        email, 
        is_main_visitor,
        status
      FROM visitors 
      WHERE qr_code IS NULL 
      ORDER BY visitor_id DESC 
      LIMIT 5
    `);
    
    console.log('❌ Visitors without QR codes:', noQrVisitors.length);
    noQrVisitors.forEach(v => {
      console.log(`  - ID: ${v.visitor_id}, Email: ${v.email}, Main: ${v.is_main_visitor}, Status: ${v.status}`);
    });
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await pool.end();
  }
}

debugQRCodes();
