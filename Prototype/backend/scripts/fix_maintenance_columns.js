const mysql = require('mysql2/promise');

async function fixMaintenanceColumns() {
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

    // Check if columns already exist
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'object_details' 
      AND COLUMN_NAME LIKE 'maintenance%'
    `);

    console.log('Existing maintenance columns:', columns.map(col => col.COLUMN_NAME));

    // Add maintenance columns one by one
    const maintenanceColumns = [
      'last_maintenance_date DATE NULL COMMENT "Date of last maintenance performed"',
      'next_maintenance_date DATE NULL COMMENT "Scheduled date for next maintenance"',
      'maintenance_frequency_months INT DEFAULT 12 COMMENT "Maintenance frequency in months"',
      'maintenance_notes TEXT NULL COMMENT "Notes about maintenance requirements"',
      'maintenance_priority ENUM("low", "medium", "high", "urgent") DEFAULT "medium" COMMENT "Priority level for maintenance"',
      'maintenance_status ENUM("up_to_date", "due_soon", "overdue", "in_progress") DEFAULT "up_to_date" COMMENT "Current maintenance status"',
      'maintenance_reminder_enabled BOOLEAN DEFAULT TRUE COMMENT "Whether maintenance reminders are enabled for this object"',
      'maintenance_contact VARCHAR(255) NULL COMMENT "Contact person responsible for maintenance"',
      'maintenance_cost DECIMAL(10,2) NULL COMMENT "Estimated cost for maintenance"'
    ];

    for (const column of maintenanceColumns) {
      const columnName = column.split(' ')[0];
      
      // Check if column already exists
      const [exists] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'object_details' 
        AND COLUMN_NAME = ?
      `, [columnName]);

      if (exists[0].count === 0) {
        console.log(`Adding column: ${columnName}`);
        await connection.execute(`ALTER TABLE object_details ADD COLUMN ${column}`);
      } else {
        console.log(`Column ${columnName} already exists, skipping...`);
      }
    }

    // Create indexes
    try {
      await connection.execute('CREATE INDEX idx_next_maintenance_date ON object_details(next_maintenance_date)');
      console.log('Created index: idx_next_maintenance_date');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('Index idx_next_maintenance_date already exists');
      } else {
        console.log('Error creating index:', err.message);
      }
    }

    try {
      await connection.execute('CREATE INDEX idx_maintenance_status ON object_details(maintenance_status)');
      console.log('Created index: idx_maintenance_status');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('Index idx_maintenance_status already exists');
      } else {
        console.log('Error creating index:', err.message);
      }
    }

    console.log('✅ Maintenance columns migration completed successfully!');

    // Verify the changes
    const [newColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'object_details' 
      AND COLUMN_NAME LIKE 'maintenance%'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('\nMaintenance columns in object_details table:');
    newColumns.forEach(col => {
      console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.COLUMN_COMMENT || 'No comment'})`);
    });

  } catch (error) {
    console.error('❌ Error during migration:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the migration
fixMaintenanceColumns();
