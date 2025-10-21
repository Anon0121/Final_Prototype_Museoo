const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixTriggers() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'museosmart'
    });

    console.log('🔧 Fixing event registration triggers...');

    // Drop existing triggers
    console.log('🗑️ Dropping existing triggers...');
    await connection.query('DROP TRIGGER IF EXISTS update_registration_count_insert');
    await connection.query('DROP TRIGGER IF EXISTS update_registration_count_update');
    await connection.query('DROP TRIGGER IF EXISTS update_registration_count_delete');

    // Create updated triggers
    console.log('🔨 Creating updated triggers...');
    
    // Insert trigger
    await connection.query(`
      CREATE TRIGGER update_registration_count_insert
      AFTER INSERT ON event_registrations
      FOR EACH ROW
      BEGIN
          UPDATE activities 
          SET current_registrations = (
              SELECT COUNT(*) 
              FROM event_registrations 
              WHERE event_id = NEW.event_id AND approval_status = 'approved'
          )
          WHERE id = NEW.event_id;
      END
    `);

    // Update trigger
    await connection.query(`
      CREATE TRIGGER update_registration_count_update
      AFTER UPDATE ON event_registrations
      FOR EACH ROW
      BEGIN
          UPDATE activities 
          SET current_registrations = (
              SELECT COUNT(*) 
              FROM event_registrations 
              WHERE event_id = NEW.event_id AND approval_status = 'approved'
          )
          WHERE id = NEW.event_id;
      END
    `);

    // Delete trigger
    await connection.query(`
      CREATE TRIGGER update_registration_count_delete
      AFTER DELETE ON event_registrations
      FOR EACH ROW
      BEGIN
          UPDATE activities 
          SET current_registrations = (
              SELECT COUNT(*) 
              FROM event_registrations 
              WHERE event_id = OLD.event_id AND approval_status = 'approved'
          )
          WHERE id = OLD.event_id;
      END
    `);

    console.log('✅ Triggers created successfully!');

    // Update all current registration counts
    console.log('📊 Updating current registration counts...');
    await connection.execute(`
      UPDATE activities a
      SET current_registrations = (
          SELECT COUNT(*) 
          FROM event_registrations er
          WHERE er.event_id = a.id AND er.approval_status = 'approved'
      )
      WHERE a.type = 'event'
    `);

    // Show verification
    console.log('\n📋 Current Event Registration Summary:');
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

    summary.forEach(event => {
      console.log(`\nEvent: ${event.title} (ID: ${event.id})`);
      console.log(`  Capacity: ${event.max_capacity} | Available: ${event.available_slots} slots`);
      console.log(`  Current Registrations: ${event.current_registrations}`);
      console.log(`  Total: ${event.total_registrations} | Approved: ${event.approved_registrations} | Pending: ${event.pending_registrations} | Rejected: ${event.rejected_registrations}`);
    });

    console.log('\n🎉 Trigger fix completed successfully!');
    console.log('💡 Now when you delete participants, the available slots should update correctly.');

  } catch (error) {
    console.error('❌ Error fixing triggers:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the fix
fixTriggers()
  .then(() => {
    console.log('\n✨ Fix completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fix failed:', error);
    process.exit(1);
  });
