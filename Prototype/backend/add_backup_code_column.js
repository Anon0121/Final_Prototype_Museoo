const mysql = require('mysql2/promise');

async function addBackupCodeColumn() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'museosmart'
  });

  try {
    console.log('🔧 Adding backup_code column to additional_visitors table...');
    
    // Check if column exists
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'museosmart' 
      AND TABLE_NAME = 'additional_visitors' 
      AND COLUMN_NAME = 'backup_code'
    `);
    
    if (columns.length > 0) {
      console.log('✅ Column backup_code already exists in additional_visitors table');
    } else {
      // Add the column
      await pool.query(`
        ALTER TABLE additional_visitors 
        ADD COLUMN backup_code VARCHAR(20) NULL AFTER qr_code
      `);
      console.log('✅ Added backup_code column to additional_visitors table');
    }
    
    // Show the updated table structure
    const [tableColumns] = await pool.query('DESCRIBE additional_visitors');
    console.log('📋 Updated additional_visitors table structure:');
    tableColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await pool.end();
  }
}

addBackupCodeColumn();

