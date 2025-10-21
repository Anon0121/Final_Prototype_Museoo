const mysql = require('mysql2/promise');

async function checkDatabase() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'museosmart'
    });

    console.log('🔗 Connected to database successfully');

    // Check if event_registrations table exists
    const [tables] = await connection.execute('SHOW TABLES LIKE "event_registrations"');
    console.log('✅ Event registrations table exists:', tables.length > 0);

    // Check activities table structure
    const [columns] = await connection.execute('DESCRIBE activities');
    const hasCapacity = columns.some(col => col.Field === 'max_capacity');
    const hasCurrentRegistrations = columns.some(col => col.Field === 'current_registrations');
    
    console.log('✅ Activities table has max_capacity field:', hasCapacity);
    console.log('✅ Activities table has current_registrations field:', hasCurrentRegistrations);

    // Check if there are any exhibits
    const [exhibits] = await connection.execute('SELECT COUNT(*) as count FROM activities WHERE type = "exhibit"');
    console.log('📊 Total exhibits in database:', exhibits[0].count);

    // Check if there are any registrations
    const [registrations] = await connection.execute('SELECT COUNT(*) as count FROM event_registrations');
    console.log('📊 Total registrations in database:', registrations[0].count);

    // Show sample data
    if (exhibits[0].count > 0) {
      const [sampleExhibits] = await connection.execute('SELECT id, title, max_capacity, current_registrations FROM activities WHERE type = "exhibit" LIMIT 3');
      console.log('📋 Sample exhibits:');
      sampleExhibits.forEach(exhibit => {
        console.log(`   - ID: ${exhibit.id}, Title: ${exhibit.title}, Capacity: ${exhibit.max_capacity || 'Not set'}, Registrations: ${exhibit.current_registrations || 0}`);
      });
    }

    if (registrations[0].count > 0) {
      const [sampleRegistrations] = await connection.execute('SELECT id, firstname, lastname, email, visitor_type, status FROM event_registrations LIMIT 3');
      console.log('📋 Sample registrations:');
      sampleRegistrations.forEach(reg => {
        console.log(`   - ID: ${reg.id}, Name: ${reg.firstname} ${reg.lastname}, Email: ${reg.email}, Type: ${reg.visitor_type}, Status: ${reg.status}`);
      });
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the check
checkDatabase(); 