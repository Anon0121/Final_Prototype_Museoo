const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateGenderEnum() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'museosmart'
    });

    console.log('🔧 Updating gender enum for event registrations...');

    // Update the gender enum to include lgbtq
    await connection.execute(`
      ALTER TABLE event_registrations 
      MODIFY COLUMN gender ENUM('male', 'female', 'lgbtq') NOT NULL
    `);

    console.log('✅ Gender enum updated successfully!');

    // Update any existing 'other' records to 'lgbtq'
    const [updateResult] = await connection.execute(`
      UPDATE event_registrations 
      SET gender = 'lgbtq' 
      WHERE gender = 'other'
    `);

    console.log(`📊 Updated ${updateResult.affectedRows} records from 'other' to 'lgbtq'`);

    // Verify the changes
    const [columns] = await connection.execute(`
      DESCRIBE event_registrations
    `);
    
    const genderColumn = columns.find(col => col.Field === 'gender');
    console.log('\n📋 Updated gender column structure:');
    console.log(`  Field: ${genderColumn.Field}`);
    console.log(`  Type: ${genderColumn.Type}`);
    console.log(`  Null: ${genderColumn.Null}`);
    console.log(`  Default: ${genderColumn.Default}`);

    // Show gender distribution
    const [genderStats] = await connection.execute(`
      SELECT 
        gender, 
        COUNT(*) as count 
      FROM event_registrations 
      GROUP BY gender
    `);

    console.log('\n📊 Gender distribution:');
    genderStats.forEach(stat => {
      console.log(`  ${stat.gender}: ${stat.count}`);
    });

    console.log('\n🎉 Gender enum update completed successfully!');

  } catch (error) {
    console.error('❌ Error updating gender enum:', error.message);
    
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Column already exists with this definition');
    } else {
      throw error;
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the update
updateGenderEnum()
  .then(() => {
    console.log('\n✨ Update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Update failed:', error);
    process.exit(1);
  });
