const mysql = require('mysql2/promise');
require('dotenv').config();

const updateRegistrationStatuses = async () => {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'museo_db'
    });

    console.log('🔄 Starting automatic registration status update...');
    
    // Get all approved registrations with event details
    const [registrations] = await connection.execute(`
      SELECT 
        er.id,
        er.status,
        er.approval_status,
        ed.start_date,
        ed.time,
        er.firstname,
        er.lastname
      FROM event_registrations er
      JOIN activities a ON er.event_id = a.id
      JOIN event_details ed ON a.id = ed.activity_id
      WHERE er.approval_status = 'approved'
    `);

    const now = new Date();
    let updatedCount = 0;
    let cancelledCount = 0;

    for (const registration of registrations) {
      // Skip if already checked in or cancelled
      if (registration.status === 'checked_in' || registration.status === 'cancelled') {
        continue;
      }

      // Calculate event end time (assume 2-hour event)
      let eventEndTime = new Date(registration.start_date);
      if (registration.time) {
        const [hours, minutes] = registration.time.split(':');
        eventEndTime.setHours(parseInt(hours) + 2, parseInt(minutes), 0, 0);
      } else {
        eventEndTime.setHours(23, 59, 59, 999);
      }

      // If event has ended and participant hasn't checked in, mark as cancelled
      if (now > eventEndTime && registration.status !== 'checked_in') {
        await connection.execute(`
          UPDATE event_registrations 
          SET status = 'cancelled'
          WHERE id = ?
        `, [registration.id]);
        
        console.log(`❌ Auto-cancelled: ${registration.firstname} ${registration.lastname} - Event ended without check-in`);
        cancelledCount++;
      }
      // If event hasn't ended and status is not pending, update to pending
      else if (now <= eventEndTime && registration.status !== 'pending') {
        await connection.execute(`
          UPDATE event_registrations 
          SET status = 'pending'
          WHERE id = ?
        `, [registration.id]);
        
        console.log(`⏳ Auto-pending: ${registration.firstname} ${registration.lastname} - Event not ended yet`);
        updatedCount++;
      }
    }

    console.log(`✅ Status update complete: ${updatedCount} set to pending, ${cancelledCount} cancelled`);

  } catch (error) {
    console.error('❌ Error updating registration statuses:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run the update
updateRegistrationStatuses();
