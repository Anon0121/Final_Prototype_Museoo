const mysql = require('mysql2/promise');
const QRCode = require('qrcode');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function regenerateEventQRCodes() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    // Get all approved event registrations that need QR code regeneration
    console.log('📋 Fetching approved event registrations...');
    const [registrations] = await connection.execute(`
      SELECT er.*, a.title as event_title, ed.start_date, ed.time, ed.location
      FROM event_registrations er
      JOIN activities a ON er.event_id = a.id
      JOIN event_details ed ON a.id = ed.activity_id
      WHERE er.approval_status = 'approved' AND er.qr_code IS NOT NULL
      ORDER BY er.id
    `);
    
    console.log(`📊 Found ${registrations.length} approved registrations to process`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const registration of registrations) {
      try {
        console.log(`\n🔄 Processing registration ID: ${registration.id} - ${registration.firstname} ${registration.lastname}`);
        
        // Generate new QR code with email field
        const qrData = {
          type: 'event_participant',
          registration_id: registration.id,
          participant_id: registration.participant_id,
          firstname: registration.firstname,
          lastname: registration.lastname,
          email: registration.email,
          event_title: registration.event_title,
          event_id: registration.event_id
        };
        
        const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
        
        // Update the registration with new QR code
        await connection.execute(`
          UPDATE event_registrations 
          SET qr_code = ?
          WHERE id = ?
        `, [qrCode, registration.id]);
        
        console.log(`✅ Updated QR code for registration ${registration.id}`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Error processing registration ${registration.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 QR Code regeneration complete!`);
    console.log(`✅ Successfully updated: ${updatedCount} registrations`);
    console.log(`❌ Errors: ${errorCount} registrations`);
    
    if (errorCount > 0) {
      console.log(`\n⚠️  Some registrations failed to update. Check the logs above for details.`);
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  regenerateEventQRCodes()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { regenerateEventQRCodes };
