const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museoo_db'
};

async function removeDocumentType() {
  let connection;
  
  try {
    console.log('🔧 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');

    // Read the SQL migration file
    const sqlFilePath = path.join(__dirname, '../database/remove_document_type.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 Executing SQL migration...');
    console.log('SQL Content:');
    console.log(sqlContent);
    
    // Execute the SQL migration
    await connection.execute(sqlContent);
    
    console.log('✅ Document type removed successfully from donations table');
    
    // Verify the change
    console.log('🔍 Verifying the change...');
    const [types] = await connection.execute(`
      SELECT DISTINCT type FROM donations
    `);
    
    console.log('📋 Current donation types in database:');
    types.forEach(type => {
      console.log(`  - ${type.type}`);
    });
    
    // Check if document type still exists
    const documentTypeExists = types.some(type => type.type === 'document');
    if (documentTypeExists) {
      console.log('❌ Warning: Document type still exists');
    } else {
      console.log('✅ Document type successfully removed');
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
removeDocumentType()
  .then(() => {
    console.log('✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
