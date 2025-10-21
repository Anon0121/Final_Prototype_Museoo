const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateRegistrationCounts() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'museosmart'
    });

    console.log('🔧 Updating registration counts for all events...');

    // Get all events
    const [events] = await connection.execute(`
      SELECT id, title, max_capacity, current_registrations 
      FROM activities 
      WHERE type = 'event'
    `);

    console.log(`📊 Found ${events.length} events to update`);

    for (const event of events) {
      // Count approved registrations for this event
      const [approvedCount] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM event_registrations 
        WHERE event_id = ? AND approval_status = 'approved'
      `, [event.id]);

      const newCount = approvedCount[0].count;
      const oldCount = event.current_registrations || 0;

      // Update the event's current_registrations
      await connection.execute(`
        UPDATE activities 
        SET current_registrations = ? 
        WHERE id = ?
      `, [newCount, event.id]);

      console.log(`✅ Event "${event.title}": ${oldCount} → ${newCount} approved registrations`);
    }

    // Show summary
    const [summary] = await connection.execute(`
      SELECT 
        a.id,
        a.title,
        a.max_capacity,
        a.current_registrations,
        (a.max_capacity - a.current_registrations) as available_slots,
        COUNT(er.id) as total_registrations,
        COUNT(CASE WHEN er.approval_status = 'approved' THEN 1 END) as approved_registrations,
        COUNT(CASE WHEN er.approval_status = 'pending' THEN 1 END) as pending_registrations,
        COUNT(CASE WHEN er.approval_status = 'rejected' THEN 1 END) as rejected_registrations
      FROM activities a
      LEFT JOIN event_registrations er ON a.id = er.event_id
      WHERE a.type = 'event'
      GROUP BY a.id, a.title, a.max_capacity, a.current_registrations
      ORDER BY a.id
    `);

    console.log('\n📋 Registration Summary:');
    console.log('='.repeat(80));
    summary.forEach(event => {
      console.log(`Event: ${event.title}`);
      console.log(`  Capacity: ${event.max_capacity} | Available: ${event.available_slots} slots`);
      console.log(`  Total Registrations: ${event.total_registrations}`);
      console.log(`  Approved: ${event.approved_registrations} | Pending: ${event.pending_registrations} | Rejected: ${event.rejected_registrations}`);
      console.log('');
    });

    console.log('🎉 Registration counts updated successfully!');

  } catch (error) {
    console.error('❌ Error updating registration counts:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the update
updateRegistrationCounts()
  .then(() => {
    console.log('\n✨ Update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Update failed:', error);
    process.exit(1);
  });
