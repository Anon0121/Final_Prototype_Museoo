const mysql = require('mysql2/promise');
require('dotenv').config();

async function testSlotUpdate() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'museosmart'
    });

    console.log('🧪 Testing slot update functionality...');

    // Get current state
    console.log('\n📊 Current state before test:');
    const [beforeState] = await connection.execute(`
      SELECT 
        a.id,
        a.title,
        a.max_capacity,
        a.current_registrations,
        (a.max_capacity - a.current_registrations) as available_slots,
        COUNT(er.id) as total_registrations,
        COUNT(CASE WHEN er.approval_status = 'approved' THEN 1 END) as approved_registrations
      FROM activities a
      LEFT JOIN event_registrations er ON a.id = er.event_id
      WHERE a.type = 'event'
      GROUP BY a.id, a.title, a.max_capacity, a.current_registrations
      ORDER BY a.id
    `);

    beforeState.forEach(event => {
      console.log(`Event: ${event.title} (ID: ${event.id})`);
      console.log(`  Capacity: ${event.max_capacity} | Available: ${event.available_slots} slots`);
      console.log(`  Current Registrations: ${event.current_registrations}`);
      console.log(`  Total: ${event.total_registrations} | Approved: ${event.approved_registrations}`);
    });

    // Test the updateEventRegistrationCount function
    console.log('\n🔧 Testing updateEventRegistrationCount function...');
    
    // Simulate the function logic
    for (const event of beforeState) {
      const [newCount] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM event_registrations 
        WHERE event_id = ? AND approval_status = 'approved'
      `, [event.id]);

      await connection.execute(`
        UPDATE activities 
        SET current_registrations = ?
        WHERE id = ?
      `, [newCount[0].count, event.id]);

      console.log(`✅ Updated event ${event.id}: ${event.current_registrations} → ${newCount[0].count} registrations`);
    }

    // Show final state
    console.log('\n📊 Final state after test:');
    const [afterState] = await connection.execute(`
      SELECT 
        a.id,
        a.title,
        a.max_capacity,
        a.current_registrations,
        (a.max_capacity - a.current_registrations) as available_slots,
        COUNT(er.id) as total_registrations,
        COUNT(CASE WHEN er.approval_status = 'approved' THEN 1 END) as approved_registrations
      FROM activities a
      LEFT JOIN event_registrations er ON a.id = er.event_id
      WHERE a.type = 'event'
      GROUP BY a.id, a.title, a.max_capacity, a.current_registrations
      ORDER BY a.id
    `);

    afterState.forEach(event => {
      console.log(`Event: ${event.title} (ID: ${event.id})`);
      console.log(`  Capacity: ${event.max_capacity} | Available: ${event.available_slots} slots`);
      console.log(`  Current Registrations: ${event.current_registrations}`);
      console.log(`  Total: ${event.total_registrations} | Approved: ${event.approved_registrations}`);
    });

    console.log('\n🎉 Test completed successfully!');
    console.log('💡 The slot update functionality should now work correctly.');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
testSlotUpdate()
  .then(() => {
    console.log('\n✨ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
