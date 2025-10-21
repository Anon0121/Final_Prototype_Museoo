const mysql = require('mysql2/promise');

async function restoreFullAdditionalVisitors() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'museosmart'
  });

  try {
    console.log('🔧 Restoring full additional_visitors table...');
    
    // Drop the current incomplete table
    await pool.query('DROP TABLE IF EXISTS additional_visitors');
    console.log('✅ Dropped incomplete additional_visitors table');
    
    // Create the full table with all necessary columns
    await pool.query(`
      CREATE TABLE additional_visitors (
        token_id VARCHAR(50) PRIMARY KEY,
        booking_id INT NOT NULL,
        email VARCHAR(100) NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        gender ENUM('male', 'female', 'other') DEFAULT 'other',
        address TEXT,
        visitor_type ENUM('local', 'foreign', 'student', 'senior') DEFAULT 'local',
        purpose ENUM('educational', 'recreational', 'research', 'other') DEFAULT 'educational',
        institution VARCHAR(100),
        status ENUM('pending', 'completed', 'expired') DEFAULT 'pending',
        details JSON,
        qr_code LONGTEXT,
        backup_code VARCHAR(20),
        details_completed_at TIMESTAMP NULL,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created full additional_visitors table with all columns');
    
    // Check the new structure
    const [columns] = await pool.query('DESCRIBE additional_visitors');
    console.log('📋 New additional_visitors table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await pool.end();
  }
}

restoreFullAdditionalVisitors();
