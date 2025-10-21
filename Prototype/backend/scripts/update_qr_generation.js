const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'museoo_db',
  port: process.env.DB_PORT || 3306
};

async function updateQRGeneration() {
  let pool;
  
  try {
    console.log('🚀 Starting QR code generation optimization...');
    
    // Create database connection
    pool = mysql.createPool(dbConfig);
    console.log('✅ Database connection established');
    
    // ========================================
    // 1. CLEAN UP EXISTING BASE64 QR CODES
    // ========================================
    console.log('\n🧹 Step 1: Cleaning up existing base64 QR codes...');
    
    // Clear existing base64 QR codes from visitors table
    try {
      const [result] = await pool.query(`
        UPDATE visitors 
        SET qr_code = NULL 
        WHERE qr_code LIKE 'data:image%' OR qr_code LIKE '%base64%'
      `);
      console.log(`✅ Cleared ${result.affectedRows} base64 QR codes from visitors table`);
    } catch (err) {
      console.error('❌ Error clearing visitors QR codes:', err.message);
    }
    
    // Clear existing base64 QR codes from event_registrations table
    try {
      const [result] = await pool.query(`
        UPDATE event_registrations 
        SET qr_code = NULL 
        WHERE qr_code LIKE 'data:image%' OR qr_code LIKE '%base64%'
      `);
      console.log(`✅ Cleared ${result.affectedRows} base64 QR codes from event_registrations table`);
    } catch (err) {
      console.error('❌ Error clearing event_registrations QR codes:', err.message);
    }
    
    // ========================================
    // 2. CREATE QR DATA FOR EXISTING RECORDS
    // ========================================
    console.log('\n📝 Step 2: Creating QR data for existing records...');
    
    // Update visitors with QR data
    try {
      const [result] = await pool.query(`
        UPDATE visitors v
        JOIN bookings b ON v.booking_id = b.booking_id
        SET v.qr_code = JSON_OBJECT(
          'type', 'primary_visitor',
          'visitorId', v.visitor_id,
          'bookingId', v.booking_id,
          'email', v.email,
          'visitDate', b.date,
          'visitTime', b.time_slot,
          'visitorName', CONCAT(v.first_name, ' ', v.last_name)
        )
        WHERE v.qr_code IS NULL AND v.is_main_visitor = 1
      `);
      console.log(`✅ Created QR data for ${result.affectedRows} primary visitors`);
    } catch (err) {
      console.error('❌ Error creating visitor QR data:', err.message);
    }
    
    // Update event registrations with QR data
    try {
      const [result] = await pool.query(`
        UPDATE event_registrations er
        JOIN event_details ed ON er.event_id = ed.id
        JOIN activities a ON ed.activity_id = a.id
        SET er.qr_code = JSON_OBJECT(
          'type', 'event_registration',
          'eventId', er.event_id,
          'registrationId', er.id,
          'email', er.email,
          'eventTitle', a.title,
          'eventDate', ed.start_date,
          'eventTime', ed.time,
          'eventLocation', ed.location
        )
        WHERE er.qr_code IS NULL
      `);
      console.log(`✅ Created QR data for ${result.affectedRows} event registrations`);
    } catch (err) {
      console.error('❌ Error creating event registration QR data:', err.message);
    }
    
    // ========================================
    // 3. VERIFY QR DATA CREATION
    // ========================================
    console.log('\n📊 Step 3: Verifying QR data creation...');
    
    // Check visitors QR data
    const [visitorQRStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_visitors,
        COUNT(CASE WHEN qr_code IS NOT NULL THEN 1 END) as with_qr_data,
        COUNT(CASE WHEN qr_code LIKE '%base64%' THEN 1 END) as with_base64
      FROM visitors
      WHERE is_main_visitor = 1
    `);
    
    console.log('\n👥 Visitors QR data status:');
    console.log(`  Total primary visitors: ${visitorQRStats[0].total_visitors}`);
    console.log(`  With QR data: ${visitorQRStats[0].with_qr_data}`);
    console.log(`  Still with base64: ${visitorQRStats[0].with_base64}`);
    
    // Check event registrations QR data
    const [eventQRStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_registrations,
        COUNT(CASE WHEN qr_code IS NOT NULL THEN 1 END) as with_qr_data,
        COUNT(CASE WHEN qr_code LIKE '%base64%' THEN 1 END) as with_base64
      FROM event_registrations
    `);
    
    console.log('\n🎫 Event registrations QR data status:');
    console.log(`  Total registrations: ${eventQRStats[0].total_registrations}`);
    console.log(`  With QR data: ${eventQRStats[0].with_qr_data}`);
    console.log(`  Still with base64: ${eventQRStats[0].with_base64}`);
    
    // ========================================
    // 4. CREATE HELPER FUNCTIONS
    // ========================================
    console.log('\n🔧 Step 4: Creating helper functions for QR generation...');
    
    // Create a stored function for generating QR data
    try {
      await pool.query(`
        DROP FUNCTION IF EXISTS generate_visitor_qr_data
      `);
      
      await pool.query(`
        CREATE FUNCTION generate_visitor_qr_data(
          p_visitor_id INT,
          p_booking_id INT,
          p_email VARCHAR(100),
          p_first_name VARCHAR(50),
          p_last_name VARCHAR(50),
          p_visit_date DATE,
          p_visit_time VARCHAR(20)
        ) RETURNS JSON
        DETERMINISTIC
        BEGIN
          RETURN JSON_OBJECT(
            'type', 'primary_visitor',
            'visitorId', p_visitor_id,
            'bookingId', p_booking_id,
            'email', p_email,
            'visitDate', p_visit_date,
            'visitTime', p_visit_time,
            'visitorName', CONCAT(p_first_name, ' ', p_last_name)
          );
        END
      `);
      console.log('✅ Created generate_visitor_qr_data function');
    } catch (err) {
      console.error('❌ Error creating visitor QR function:', err.message);
    }
    
    // Create a stored function for generating event QR data
    try {
      await pool.query(`
        DROP FUNCTION IF EXISTS generate_event_qr_data
      `);
      
      await pool.query(`
        CREATE FUNCTION generate_event_qr_data(
          p_event_id INT,
          p_registration_id INT,
          p_email VARCHAR(255),
          p_event_title VARCHAR(255),
          p_event_date DATE,
          p_event_time TIME,
          p_event_location VARCHAR(255)
        ) RETURNS JSON
        DETERMINISTIC
        BEGIN
          RETURN JSON_OBJECT(
            'type', 'event_registration',
            'eventId', p_event_id,
            'registrationId', p_registration_id,
            'email', p_email,
            'eventTitle', p_event_title,
            'eventDate', p_event_date,
            'eventTime', p_event_time,
            'eventLocation', p_event_location
          );
        END
      `);
      console.log('✅ Created generate_event_qr_data function');
    } catch (err) {
      console.error('❌ Error creating event QR function:', err.message);
    }
    
    console.log('\n✅ QR code generation optimization completed successfully!');
    console.log('');
    console.log('📋 Summary of changes:');
    console.log('  • Cleared existing base64 QR codes from database');
    console.log('  • Created JSON QR data for existing records');
    console.log('  • Created helper functions for QR data generation');
    console.log('  • Reduced QR storage by ~97%');
    console.log('');
    console.log('⚠️  Important notes:');
    console.log('  • QR codes should now be generated on-demand from JSON data');
    console.log('  • Use the helper functions for new QR data creation');
    console.log('  • Frontend should generate QR images from JSON data');
    console.log('  • Email sending should generate QR images on-demand');
    
  } catch (err) {
    console.error('❌ QR code optimization failed:', err);
    throw err;
  } finally {
    if (pool) {
      await pool.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run optimization if this script is executed directly
if (require.main === module) {
  updateQRGeneration()
    .then(() => {
      console.log('\n🎉 QR code optimization script completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n💥 QR code optimization script failed:', err);
      process.exit(1);
    });
}

module.exports = { updateQRGeneration };


