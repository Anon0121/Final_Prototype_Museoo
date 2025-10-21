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

async function removeMethodColumn() {
  let connection;
  
  try {
    console.log('🔧 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');

    // Read the SQL migration file
    const sqlFilePath = path.join(__dirname, '../database/remove_method_column.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 Executing SQL migration...');
    console.log('SQL Content:');
    console.log(sqlContent);
    
    // Execute the SQL migration
    await connection.execute(sqlContent);
    
    console.log('✅ Method column removed successfully from donation_details table');
    
    // Verify the change
    console.log('🔍 Verifying the change...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'museoo_db' 
      AND TABLE_NAME = 'donation_details'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Current columns in donation_details table:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}`);
    });
    
    // Check if method column still exists
    const methodColumnExists = columns.some(col => col.COLUMN_NAME === 'method');
    if (methodColumnExists) {
      console.log('❌ Warning: Method column still exists');
    } else {
      console.log('✅ Method column successfully removed');
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    
    if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
      console.log('ℹ️  The method column may not exist or cannot be dropped');
    }
    
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
removeMethodColumn()
  .then(() => {
    console.log('✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
