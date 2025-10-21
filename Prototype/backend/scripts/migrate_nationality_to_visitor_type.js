const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'museosmart',
  port: process.env.DB_PORT || 3306
};

async function migrateNationalityToVisitorType() {
  let pool;
  
  try {
    console.log('🚀 Starting migration from nationality to visitor_type...');
    
    // Create database connection
    pool = mysql.createPool(dbConfig);
    console.log('✅ Database connection established');
    
    // Check if visitor_type column exists
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'visitors' AND COLUMN_NAME = 'visitor_type'
    `, [dbConfig.database]);
    
    if (columns.length === 0) {
      console.log('📝 Adding visitor_type column to visitors table...');
      await pool.query(`
        ALTER TABLE visitors 
        ADD COLUMN visitor_type ENUM('local', 'foreign') NULL
      `);
      console.log('✅ Added visitor_type column to visitors table');
    } else {
      console.log('✅ visitor_type column already exists in visitors table');
    }
    
    // Migrate existing nationality data to visitor_type
    console.log('🔄 Migrating existing nationality data to visitor_type...');
    
    // Update records where nationality is 'local' or 'Local'
    const [localUpdates] = await pool.query(`
      UPDATE visitors 
      SET visitor_type = 'local' 
      WHERE LOWER(nationality) = 'local' AND visitor_type IS NULL
    `);
    console.log(`✅ Updated ${localUpdates.affectedRows} records with 'local' visitor_type`);
    
    // Update records where nationality is 'foreign' or 'Foreign'
    const [foreignUpdates] = await pool.query(`
      UPDATE visitors 
      SET visitor_type = 'foreign' 
      WHERE LOWER(nationality) = 'foreign' AND visitor_type IS NULL
    `);
    console.log(`✅ Updated ${foreignUpdates.affectedRows} records with 'foreign' visitor_type`);
    
    // Set default value for any remaining NULL records
    const [defaultUpdates] = await pool.query(`
      UPDATE visitors 
      SET visitor_type = 'local' 
      WHERE visitor_type IS NULL
    `);
    console.log(`✅ Set default 'local' for ${defaultUpdates.affectedRows} remaining records`);
    
    // Make visitor_type NOT NULL
    console.log('📝 Making visitor_type NOT NULL...');
    await pool.query(`
      ALTER TABLE visitors 
      MODIFY COLUMN visitor_type ENUM('local', 'foreign') NOT NULL DEFAULT 'local'
    `);
    console.log('✅ Made visitor_type NOT NULL with default value');
    
    // Create index for better performance
    console.log('📝 Creating index for visitor_type...');
    try {
      await pool.query(`
        CREATE INDEX idx_visitors_visitor_type ON visitors(visitor_type)
      `);
      console.log('✅ Created index on visitors.visitor_type');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('✅ Index on visitors.visitor_type already exists');
      } else {
        console.error('❌ Error creating visitor_type index:', err.message);
      }
    }
    
    // Verify migration
    console.log('🔍 Verifying migration...');
    const [verification] = await pool.query(`
      SELECT 
        visitor_type,
        COUNT(*) as count
      FROM visitors 
      GROUP BY visitor_type
    `);
    
    console.log('📊 Migration verification results:');
    verification.forEach(row => {
      console.log(`  ${row.visitor_type}: ${row.count} visitors`);
    });
    
    // Check for any remaining nationality values that might need attention
    const [nationalityCheck] = await pool.query(`
      SELECT 
        nationality,
        COUNT(*) as count
      FROM visitors 
      WHERE LOWER(nationality) NOT IN ('local', 'foreign')
      GROUP BY nationality
    `);
    
    if (nationalityCheck.length > 0) {
      console.log('⚠️  Found nationality values that may need manual review:');
      nationalityCheck.forEach(row => {
        console.log(`  ${row.nationality}: ${row.count} visitors`);
      });
    } else {
      console.log('✅ All nationality values are properly mapped');
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📋 Summary of changes:');
    console.log('  • Added visitor_type ENUM column with values: local, foreign');
    console.log('  • Migrated existing nationality data to visitor_type');
    console.log('  • Made visitor_type NOT NULL with default value');
    console.log('  • Created database index for better performance');
    console.log('');
    console.log('⚠️  Important notes:');
    console.log('  • The nationality field is still present but should be updated in frontend');
    console.log('  • Frontend forms should now use visitor_type instead of nationality');
    console.log('  • Backend API should be updated to handle visitor_type field');
    
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    if (pool) {
      await pool.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateNationalityToVisitorType()
    .then(() => {
      console.log('🎉 Migration script completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('💥 Migration script failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateNationalityToVisitorType };


