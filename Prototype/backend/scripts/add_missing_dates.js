const mysql = require('mysql2/promise');

async function addMissingDateColumns() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'museosmart'
    });

    console.log('Connected to database successfully');

    // Add last_maintenance_date column
    try {
      await connection.execute('ALTER TABLE object_details ADD COLUMN last_maintenance_date DATE NULL');
      console.log('✅ Added last_maintenance_date column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ last_maintenance_date column already exists');
      } else {
        console.log('❌ Error adding last_maintenance_date:', err.message);
      }
    }

    // Add next_maintenance_date column
    try {
      await connection.execute('ALTER TABLE object_details ADD COLUMN next_maintenance_date DATE NULL');
      console.log('✅ Added next_maintenance_date column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ next_maintenance_date column already exists');
      } else {
        console.log('❌ Error adding next_maintenance_date:', err.message);
      }
    }

    // Verify all maintenance columns exist
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'object_details' 
      AND COLUMN_NAME LIKE 'maintenance%'
      ORDER BY COLUMN_NAME
    `);

    console.log('\nAll maintenance columns in object_details table:');
    columns.forEach(col => {
      console.log(`- ${col.COLUMN_NAME}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

addMissingDateColumns();
