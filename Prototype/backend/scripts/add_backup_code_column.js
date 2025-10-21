const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function addBackupCodeColumn() {
  let connection;
  
  try {
    console.log('🔧 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Connected to database');
    
    // Add backup_code column to visitors table
    console.log('📝 Adding backup_code column to visitors table...');
    await connection.execute(`
      ALTER TABLE visitors 
      ADD COLUMN backup_code VARCHAR(10) NULL 
      AFTER qr_code
    `);
    console.log('✅ Added backup_code column to visitors table');
    
    // Add backup_code column to additional_visitors table
    console.log('📝 Adding backup_code column to additional_visitors table...');
    await connection.execute(`
      ALTER TABLE additional_visitors 
      ADD COLUMN backup_code VARCHAR(10) NULL 
      AFTER qr_code
    `);
    console.log('✅ Added backup_code column to additional_visitors table');
    
    // Create indexes for better performance
    console.log('📝 Creating indexes...');
    await connection.execute(`
      CREATE INDEX idx_visitors_backup_code ON visitors(backup_code)
    `);
    console.log('✅ Created index on visitors.backup_code');
    
    await connection.execute(`
      CREATE INDEX idx_additional_visitors_backup_code ON additional_visitors(backup_code)
    `);
    console.log('✅ Created index on additional_visitors.backup_code');
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (err) {
    console.error('❌ Error during migration:', err);
    throw err;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
addBackupCodeColumn()
  .then(() => {
    console.log('✅ Migration script completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Migration script failed:', err);
    process.exit(1);
  });
