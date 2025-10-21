const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function addMaintenanceReminders() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'museosmart',
      multipleStatements: true
    });

    console.log('Connected to database successfully');

    // Read the SQL migration file
    const sqlFilePath = path.join(__dirname, '../database/add_maintenance_reminders.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the migration
    console.log('Executing maintenance reminders migration...');
    await connection.execute(sqlContent);
    
    console.log('✅ Maintenance reminders migration completed successfully!');
    console.log('Added the following features:');
    console.log('- Maintenance tracking fields to object_details table');
    console.log('- Maintenance overview view for easy tracking');
    console.log('- Indexes for efficient querying');
    console.log('- Sample data setup for existing objects');

    // Verify the changes
    console.log('\nVerifying changes...');
    
    // Check if columns were added
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'object_details' 
      AND COLUMN_NAME LIKE 'maintenance%'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('\nNew maintenance columns added:');
    columns.forEach(col => {
      console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.COLUMN_COMMENT || 'No comment'})`);
    });

    // Check the view
    const [viewExists] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.VIEWS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'maintenance_overview'
    `);

    if (viewExists[0].count > 0) {
      console.log('\n✅ Maintenance overview view created successfully');
    }

    // Show sample data
    const [sampleData] = await connection.execute(`
      SELECT 
        object_id,
        object_name,
        maintenance_status,
        next_maintenance_date,
        maintenance_alert_status,
        days_until_maintenance
      FROM maintenance_overview 
      LIMIT 5
    `);

    if (sampleData.length > 0) {
      console.log('\nSample maintenance data:');
      sampleData.forEach(item => {
        console.log(`- ${item.object_name}: ${item.maintenance_alert_status} (${item.days_until_maintenance} days)`);
      });
    }

  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Note: Some columns may already exist. This is normal if the migration was run before.');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the migration
addMaintenanceReminders();
