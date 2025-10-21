const mysql = require('mysql2/promise');

async function cleanupExpiredBookings() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'museosmart'
    });

    console.log('✅ Connected to database');

    // Find expired tokens and their associated bookings
    const [expiredTokens] = await connection.query(
      `SELECT DISTINCT av.booking_id, b.type, b.status
       FROM additional_visitors av
       JOIN bookings b ON av.booking_id = b.booking_id
       WHERE av.expires_at IS NOT NULL 
       AND av.expires_at < NOW()
       AND av.status != 'completed'
       AND b.status != 'archived'`
    );

    if (expiredTokens.length === 0) {
      console.log('ℹ️  No expired bookings found');
      return;
    }

    console.log(`📋 Found ${expiredTokens.length} expired bookings to archive`);

    for (const booking of expiredTokens) {
      try {
        // Archive the booking
        await connection.query(
          `UPDATE bookings SET status = 'archived' WHERE booking_id = ?`,
          [booking.booking_id]
        );

        // Mark all associated tokens as expired
        await connection.query(
          `UPDATE additional_visitors SET status = 'expired' WHERE booking_id = ?`,
          [booking.booking_id]
        );

        console.log(`✅ Archived booking ${booking.booking_id} (${booking.type})`);
      } catch (error) {
        console.error(`❌ Error archiving booking ${booking.booking_id}:`, error.message);
      }
    }

    console.log('✅ Cleanup completed successfully');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

// Run the cleanup
cleanupExpiredBookings().catch(console.error);
