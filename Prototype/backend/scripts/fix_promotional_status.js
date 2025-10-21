const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function fixPromotionalStatus() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    // Check current promotional items
    console.log('📊 Checking current promotional items...');
    const [items] = await connection.execute('SELECT id, title, is_active FROM promotional_items');
    
    console.log('Current items:');
    items.forEach(item => {
      console.log(`ID: ${item.id}, Title: ${item.title}, is_active: ${item.is_active}`);
    });
    
    // Fix items with undefined/null is_active
    console.log('\n🔧 Fixing items with undefined is_active...');
    const [updateResult] = await connection.execute(`
      UPDATE promotional_items 
      SET is_active = FALSE 
      WHERE is_active IS NULL OR is_active = ''
    `);
    
    console.log(`✅ Updated ${updateResult.affectedRows} items`);
    
    // Check again after fix
    console.log('\n📊 Checking items after fix...');
    const [fixedItems] = await connection.execute('SELECT id, title, is_active FROM promotional_items');
    
    console.log('Fixed items:');
    fixedItems.forEach(item => {
      console.log(`ID: ${item.id}, Title: ${item.title}, is_active: ${item.is_active}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing promotional status:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the fix
fixPromotionalStatus();
