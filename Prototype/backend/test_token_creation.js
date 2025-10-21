const mysql = require('mysql2/promise');

async function testTokenCreation() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'museosmart'
  });

  try {
    console.log('🔍 Testing token creation...');
    
    // Check if we have any bookings
    const [bookings] = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5');
    console.log('📋 Recent bookings:', bookings.length);
    
    if (bookings.length > 0) {
      const latestBooking = bookings[0];
      console.log('🎯 Latest booking:', {
        id: latestBooking.booking_id,
        type: latestBooking.type,
        status: latestBooking.status
      });
      
      // Check if there are tokens for this booking
      const [tokens] = await pool.query(
        'SELECT * FROM additional_visitors WHERE booking_id = ?',
        [latestBooking.booking_id]
      );
      
      console.log('🎫 Tokens for latest booking:', tokens.length);
      if (tokens.length > 0) {
        console.log('✅ Sample token:', {
          token_id: tokens[0].token_id,
          email: tokens[0].email,
          status: tokens[0].status
        });
      }
    }
    
    // Check total tokens
    const [allTokens] = await pool.query('SELECT COUNT(*) as count FROM additional_visitors');
    console.log('📊 Total tokens in database:', allTokens[0].count);
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await pool.end();
  }
}

testTokenCreation();
