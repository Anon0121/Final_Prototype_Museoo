const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function updatePromotionalSchema() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    // Update the table schema to make CTA fields optional
    console.log('🔧 Updating promotional table schema...');
    
    // Make cta_text nullable
    await connection.execute(`
      ALTER TABLE promotional_items 
      MODIFY COLUMN cta_text VARCHAR(100) NULL
    `);
    
    // Make cta_link nullable
    await connection.execute(`
      ALTER TABLE promotional_items 
      MODIFY COLUMN cta_link VARCHAR(255) NULL
    `);
    
    console.log('✅ Schema updated successfully!');
    
    // Update sample data to remove links
    console.log('📝 Updating sample data...');
    await connection.execute(`
      UPDATE promotional_items 
      SET cta_text = 'Now Showing', cta_link = NULL 
      WHERE id = 1
    `);
    
    await connection.execute(`
      UPDATE promotional_items 
      SET cta_text = 'Coming Soon', cta_link = NULL 
      WHERE id = 2
    `);
    
    await connection.execute(`
      UPDATE promotional_items 
      SET cta_text = 'Special Event', cta_link = NULL 
      WHERE id = 3
    `);
    
    console.log('✅ Sample data updated!');
    
    // Verify the changes
    console.log('\n📊 Current promotional items:');
    const [items] = await connection.execute('SELECT id, title, cta_text, cta_link FROM promotional_items');
    items.forEach(item => {
      console.log(`ID: ${item.id}, Title: ${item.title}, Tag: ${item.cta_text || 'No tag'}, Link: ${item.cta_link || 'No link'}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating promotional schema:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the update
updatePromotionalSchema();
