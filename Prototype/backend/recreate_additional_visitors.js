const mysql = require('mysql2/promise');

async function recreateAdditionalVisitorsTable() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'museosmart'
  });

  try {
    console.log('🔄 Recreating additional_visitors table for walk-in tokens...');
    
    // Create the table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS additional_visitors (
        token_id VARCHAR(50) PRIMARY KEY,
        booking_id INT NOT NULL,
        email VARCHAR(100) NOT NULL,
        status ENUM('pending', 'completed', 'checked-in') DEFAULT 'pending',
        details JSON DEFAULT NULL,
        qr_generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        details_completed_at TIMESTAMP NULL,
        checkin_time TIMESTAMP NULL,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
      )
    `);
    
    // Add indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_additional_visitors_token ON additional_visitors(token_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_additional_visitors_booking ON additional_visitors(booking_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_additional_visitors_email ON additional_visitors(email)');
    
    console.log('✅ additional_visitors table recreated successfully!');
    
    // Verify
    const [tables] = await pool.query('SHOW TABLES LIKE "additional_visitors"');
    console.log('✅ Table exists:', tables.length > 0);
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await pool.end();
  }
}

recreateAdditionalVisitorsTable();
