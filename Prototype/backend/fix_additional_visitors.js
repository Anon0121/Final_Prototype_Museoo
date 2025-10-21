const mysql = require('mysql2/promise');

async function fixAdditionalVisitors() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'museosmart'
  });

  try {
    console.log('🔧 Fixing additional_visitors table to only handle tokens...');
    
    // Drop the current table
    await pool.query('DROP TABLE IF EXISTS additional_visitors');
    console.log('✅ Dropped current additional_visitors table');
    
    // Create minimal table with only token management
    await pool.query(`
      CREATE TABLE additional_visitors (
        token_id VARCHAR(50) PRIMARY KEY,
        booking_id INT NOT NULL,
        email VARCHAR(100) NOT NULL,
        status ENUM('pending', 'completed', 'expired') DEFAULT 'pending',
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created minimal additional_visitors table for token management only');
    
    // Check the new structure
    const [columns] = await pool.query('DESCRIBE additional_visitors');
    console.log('📋 New additional_visitors table structure (TOKEN MANAGEMENT ONLY):');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });
    
    console.log('\n🎯 Purpose:');
    console.log('  - additional_visitors: Token management for form access');
    console.log('  - visitors: All actual visitor data (names, details, etc.)');
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await pool.end();
  }
}

fixAdditionalVisitors();
