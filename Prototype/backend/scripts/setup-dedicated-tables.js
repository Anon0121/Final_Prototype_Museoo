/**
 * Setup Dedicated Tables for Donations
 * 
 * This script creates the missing dedicated tables needed for the cleanup
 */

const pool = require('../db');

async function setupDedicatedTables() {
  const conn = await pool.getConnection();
  
  try {
    console.log('🔧 Setting up dedicated donation tables...\n');
    
    // Check existing tables
    const [tables] = await conn.query("SHOW TABLES LIKE 'donation_%'");
    console.log('Existing donation tables:');
    tables.forEach(table => {
      console.log(`   ✅ ${Object.values(table)[0]}`);
    });
    console.log();
    
    // Create donation_meeting_schedule table
    console.log('Creating donation_meeting_schedule table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS donation_meeting_schedule (
        id INT AUTO_INCREMENT PRIMARY KEY,
        donation_id INT NOT NULL,
        preferred_visit_date DATE NULL,
        preferred_visit_time TIME NULL,
        meeting_date DATE NULL,
        meeting_time TIME NULL,
        meeting_location VARCHAR(255) NULL,
        meeting_notes TEXT NULL,
        status ENUM('pending', 'requested', 'scheduled', 'completed', 'cancelled') DEFAULT 'pending',
        handover_completed BOOLEAN DEFAULT FALSE,
        rejection_reason TEXT NULL,
        suggested_alternative_dates JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
      )
    `);
    console.log('   ✅ donation_meeting_schedule created');
    
    // Create donation_city_hall_submission table
    console.log('Creating donation_city_hall_submission table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS donation_city_hall_submission (
        id INT AUTO_INCREMENT PRIMARY KEY,
        donation_id INT NOT NULL,
        submitted_by VARCHAR(100) NOT NULL,
        submission_date DATE NULL,
        approval_date DATE NULL,
        status ENUM('not_required', 'required', 'submitted', 'approved', 'rejected') DEFAULT 'not_required',
        reference_number VARCHAR(100) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
      )
    `);
    console.log('   ✅ donation_city_hall_submission created');
    
    // Create donation_acknowledgments table
    console.log('Creating donation_acknowledgments table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS donation_acknowledgments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        donation_id INT NOT NULL,
        acknowledgment_type ENUM('email', 'letter', 'certificate', 'plaque', 'gratitude_email') NOT NULL,
        sent_date DATE NOT NULL,
        sent_by VARCHAR(100) NOT NULL,
        recipient_name VARCHAR(255) NOT NULL,
        recipient_email VARCHAR(255) NULL,
        recipient_address TEXT NULL,
        content TEXT NULL,
        file_path VARCHAR(500) NULL,
        status ENUM('draft', 'sent', 'delivered', 'confirmed') DEFAULT 'sent',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
      )
    `);
    console.log('   ✅ donation_acknowledgments created');
    
    // Create indexes
    console.log('\nCreating indexes...');
    await conn.query('CREATE INDEX IF NOT EXISTS idx_donation_meeting_schedule_donation_id ON donation_meeting_schedule(donation_id)');
    await conn.query('CREATE INDEX IF NOT EXISTS idx_donation_city_hall_submission_donation_id ON donation_city_hall_submission(donation_id)');
    await conn.query('CREATE INDEX IF NOT EXISTS idx_donation_acknowledgments_donation_id ON donation_acknowledgments(donation_id)');
    console.log('   ✅ Indexes created');
    
    console.log('\n🎉 All dedicated tables created successfully!');
    console.log('\nNow you can run the data migration:');
    console.log('node scripts/move-data-to-proper-tables.js\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    conn.release();
  }
}

// Run the setup
if (require.main === module) {
  setupDedicatedTables()
    .then(() => {
      console.log('✅ Setup complete!');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n💥 Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { setupDedicatedTables };






