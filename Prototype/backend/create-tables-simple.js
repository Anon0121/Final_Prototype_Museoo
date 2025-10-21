const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function createTables() {
  try {
    const conn = await mysql.createConnection(dbConfig);
    console.log('🔧 Creating missing donation workflow tables...');
    
    // 1. Create donation_meeting_schedule table
    console.log('Creating donation_meeting_schedule table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS donation_meeting_schedule (
        id INT AUTO_INCREMENT PRIMARY KEY,
        donation_id INT NOT NULL,
        scheduled_date DATE NOT NULL,
        scheduled_time TIME NOT NULL,
        location VARCHAR(255) NOT NULL,
        staff_member VARCHAR(255) NOT NULL,
        status ENUM('scheduled', 'completed', 'cancelled', 'rescheduled') DEFAULT 'scheduled',
        meeting_notes TEXT,
        suggested_alternative_dates JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ donation_meeting_schedule created');
    
    // 2. Create donation_city_hall_submission table
    console.log('Creating donation_city_hall_submission table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS donation_city_hall_submission (
        id INT AUTO_INCREMENT PRIMARY KEY,
        donation_id INT NOT NULL,
        submission_date DATE NOT NULL,
        status ENUM('submitted', 'under_review', 'approved', 'rejected') DEFAULT 'submitted',
        approval_date DATE NULL,
        city_hall_reference VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ donation_city_hall_submission created');
    
    // 3. Create donation_visitor_submissions table
    console.log('Creating donation_visitor_submissions table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS donation_visitor_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        donation_id INT NOT NULL,
        visitor_name VARCHAR(255) NOT NULL,
        visitor_email VARCHAR(255) NOT NULL,
        visitor_phone VARCHAR(20),
        visitor_address TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ donation_visitor_submissions created');
    
    // 4. Create donation_workflow_log table
    console.log('Creating donation_workflow_log table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS donation_workflow_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        donation_id INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        performed_by VARCHAR(100) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ donation_workflow_log created');
    
    // 5. Create donation_documents table
    console.log('Creating donation_documents table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS donation_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        donation_id INT NOT NULL,
        document_type ENUM('receipt', 'certificate', 'legal', 'other') NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INT,
        mime_type VARCHAR(100),
        uploaded_by VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ donation_documents created');
    
    // 6. Add missing columns to donations table
    console.log('Adding missing columns to donations table...');
    try {
      await conn.query('ALTER TABLE donations ADD COLUMN rejection_reason TEXT NULL AFTER processing_stage');
      console.log('✅ Added rejection_reason column');
    } catch (err) {
      console.log('⚠️ rejection_reason column already exists');
    }
    
    try {
      await conn.query('ALTER TABLE donations ADD COLUMN suggested_alternative_dates JSON NULL AFTER rejection_reason');
      console.log('✅ Added suggested_alternative_dates column');
    } catch (err) {
      console.log('⚠️ suggested_alternative_dates column already exists');
    }
    
    try {
      await conn.query('ALTER TABLE donations ADD COLUMN meeting_scheduled BOOLEAN DEFAULT FALSE AFTER suggested_alternative_dates');
      console.log('✅ Added meeting_scheduled column');
    } catch (err) {
      console.log('⚠️ meeting_scheduled column already exists');
    }
    
    try {
      await conn.query('ALTER TABLE donations ADD COLUMN meeting_date DATE NULL AFTER meeting_scheduled');
      console.log('✅ Added meeting_date column');
    } catch (err) {
      console.log('⚠️ meeting_date column already exists');
    }
    
    try {
      await conn.query('ALTER TABLE donations ADD COLUMN meeting_time TIME NULL AFTER meeting_date');
      console.log('✅ Added meeting_time column');
    } catch (err) {
      console.log('⚠️ meeting_time column already exists');
    }
    
    try {
      await conn.query('ALTER TABLE donations ADD COLUMN meeting_location VARCHAR(255) NULL AFTER meeting_time');
      console.log('✅ Added meeting_location column');
    } catch (err) {
      console.log('⚠️ meeting_location column already exists');
    }
    
    try {
      await conn.query('ALTER TABLE donations ADD COLUMN meeting_notes TEXT NULL AFTER meeting_location');
      console.log('✅ Added meeting_notes column');
    } catch (err) {
      console.log('⚠️ meeting_notes column already exists');
    }
    
    await conn.end();
    console.log('\n🎉 All tables and columns created successfully!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

createTables();

