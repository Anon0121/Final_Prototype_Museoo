const mysql = require('mysql2/promise');

async function addVisitorIdForeignKey() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'museosmart'
  });

  try {
    console.log('🔧 Adding visitor_id foreign key to additional_visitors table...');
    
    // Add visitor_id column to additional_visitors table
    await pool.query(`
      ALTER TABLE additional_visitors 
      ADD COLUMN visitor_id INT NULL,
      ADD FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id) ON DELETE SET NULL
    `);
    console.log('✅ Added visitor_id foreign key to additional_visitors table');
    
    // Check the new structure
    const [columns] = await pool.query('DESCRIBE additional_visitors');
    console.log('📋 Updated additional_visitors table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });
    
    console.log('\n🎯 New Relationship:');
    console.log('  - additional_visitors.visitor_id → visitors.visitor_id');
    console.log('  - Direct link between token and visitor record');
    console.log('  - Better data integrity and tracking');
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await pool.end();
  }
}

addVisitorIdForeignKey();
