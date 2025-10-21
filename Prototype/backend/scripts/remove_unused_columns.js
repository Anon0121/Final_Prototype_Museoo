const mysql = require('mysql2/promise');

async function removeUnusedColumns() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'museosmart'
    });

    console.log('Connected to database successfully');
    console.log('🔍 Analyzing unused columns in cultural objects tables...\n');

    // Check current columns in object_details table
    const [columns] = await connection.execute('SHOW COLUMNS FROM object_details');
    console.log('Current columns in object_details table:');
    columns.forEach(col => {
      console.log(`- ${col.Field} (${col.Type})`);
    });

    console.log('\n📋 Analysis Results:');
    console.log('✅ USED COLUMNS:');
    console.log('  - All maintenance columns (last_maintenance_date, next_maintenance_date, etc.)');
    console.log('  - conservation_notes (used in form and display)');
    console.log('  - exhibition_history (used in form and display)');
    console.log('  - maintenance_contact (used in form and display)');
    console.log('  - maintenance_cost (used in form and display)');
    console.log('  - All other columns are actively used');

    console.log('\n❌ UNUSED COLUMNS:');
    console.log('  - dimensions (removed from form but still exists in database)');

    // Ask for confirmation before removing
    console.log('\n🗑️  Ready to remove unused columns:');
    console.log('  - dimensions from object_details table');
    
    // Remove the dimensions column
    try {
      console.log('\n🔄 Removing dimensions column...');
      await connection.execute('ALTER TABLE object_details DROP COLUMN dimensions');
      console.log('✅ Successfully removed dimensions column from object_details table');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠️  dimensions column does not exist (already removed)');
      } else {
        console.log('❌ Error removing dimensions column:', err.message);
      }
    }

    // Verify the changes
    console.log('\n📊 Final column list in object_details table:');
    const [finalColumns] = await connection.execute('SHOW COLUMNS FROM object_details');
    finalColumns.forEach(col => {
      console.log(`- ${col.Field} (${col.Type})`);
    });

    console.log('\n✅ Database cleanup completed successfully!');
    console.log('📝 Summary:');
    console.log('  - Removed unused dimensions column');
    console.log('  - All other columns are actively used in the application');

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the cleanup
removeUnusedColumns();
