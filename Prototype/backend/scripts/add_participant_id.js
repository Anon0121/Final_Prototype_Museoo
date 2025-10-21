const mysql = require('mysql2/promise');
require('dotenv').config();

async function addParticipantId() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'museosmart'
    });

    console.log('🔧 Adding participant_id column to event_registrations...');

    // Add participant_id column
    await connection.execute(`
      ALTER TABLE event_registrations 
      ADD COLUMN participant_id VARCHAR(20) UNIQUE AFTER id
    `);

    console.log('✅ participant_id column added successfully!');

    // Generate participant IDs for existing records
    const [existingRecords] = await connection.execute(`
      SELECT id FROM event_registrations WHERE participant_id IS NULL
    `);

    if (existingRecords.length > 0) {
      console.log(`📊 Generating participant IDs for ${existingRecords.length} existing records...`);
      
      for (const record of existingRecords) {
        const participantId = `PID${String(record.id).padStart(6, '0')}`;
        await connection.execute(`
          UPDATE event_registrations 
          SET participant_id = ? 
          WHERE id = ?
        `, [participantId, record.id]);
      }
      
      console.log('✅ Participant IDs generated for existing records!');
    }

    // Verify the changes
    const [columns] = await connection.execute(`
      DESCRIBE event_registrations
    `);
    
    const participantIdColumn = columns.find(col => col.Field === 'participant_id');
    console.log('\n📋 Updated table structure:');
    console.log(`  Field: ${participantIdColumn.Field}`);
    console.log(`  Type: ${participantIdColumn.Type}`);
    console.log(`  Null: ${participantIdColumn.Null}`);
    console.log(`  Key: ${participantIdColumn.Key}`);

    // Show sample data
    const [sampleData] = await connection.execute(`
      SELECT 
        id, 
        participant_id,
        firstname, 
        lastname, 
        email 
      FROM event_registrations 
      LIMIT 5
    `);

    console.log('\n📊 Sample data with participant IDs:');
    sampleData.forEach(row => {
      console.log(`  ID: ${row.id}, Participant ID: ${row.participant_id}, Name: ${row.firstname} ${row.lastname}`);
    });

    console.log('\n🎉 Participant ID system setup completed successfully!');

  } catch (error) {
    console.error('❌ Error adding participant_id:', error.message);
    
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  participant_id column already exists');
    } else if (error.code === 'ER_DUP_KEYNAME') {
      console.log('ℹ️  Unique constraint already exists');
    } else {
      throw error;
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup
addParticipantId()
  .then(() => {
    console.log('\n✨ Setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
