const mysql = require('mysql2/promise');

async function checkTokens() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'museosmart'
  });

  try {
    console.log('🔍 Checking tokens in database...');
    
    // Check additional_visitors table for tokens
    const [tokens] = await pool.query(`
      SELECT 
        token_id, 
        booking_id, 
        email, 
        status,
        expires_at,
        created_at
      FROM additional_visitors 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('🎫 Tokens in additional_visitors table:', tokens.length);
    tokens.forEach(token => {
      console.log(`  - Token: ${token.token_id}`);
      console.log(`    Booking ID: ${token.booking_id}`);
      console.log(`    Email: ${token.email}`);
      console.log(`    Status: ${token.status}`);
      console.log(`    Expires: ${token.expires_at}`);
      console.log(`    Created: ${token.created_at}`);
      console.log('    ---');
    });
    
    // Check if tokens exist for recent bookings
    const [recentBookings] = await pool.query(`
      SELECT 
        b.booking_id,
        b.type,
        b.status,
        COUNT(av.token_id) as token_count
      FROM bookings b
      LEFT JOIN additional_visitors av ON b.booking_id = av.booking_id
      GROUP BY b.booking_id
      ORDER BY b.created_at DESC 
      LIMIT 5
    `);
    
    console.log('📋 Recent bookings and their token counts:');
    recentBookings.forEach(booking => {
      console.log(`  - Booking ${booking.booking_id}: ${booking.type} (${booking.status}) - ${booking.token_count} tokens`);
    });
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await pool.end();
  }
}

checkTokens();
