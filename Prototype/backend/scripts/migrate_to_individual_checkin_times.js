const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'museoo_db',
  port: process.env.DB_PORT || 3306
};

async function migrateToIndividualCheckinTimes() {
  let pool;
  
  try {
    console.log('🚀 Starting migration to individual check-in times...');
    
    // Create database connection
    pool = mysql.createPool(dbConfig);
    console.log('✅ Database connection established');
    
    // Check if visitors table has checkin_time column
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'visitors' AND COLUMN_NAME = 'checkin_time'
    `, [dbConfig.database]);
    
    if (columns.length === 0) {
      console.log('📝 Adding checkin_time column to visitors table...');
      await pool.query(`
        ALTER TABLE visitors 
        ADD COLUMN checkin_time TIMESTAMP NULL DEFAULT NULL
      `);
      console.log('✅ Added checkin_time column to visitors table');
    } else {
      console.log('✅ checkin_time column already exists in visitors table');
    }
    
    // Check if additional_visitors table has checkin_time column
    const [additionalColumns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'additional_visitors' AND COLUMN_NAME = 'checkin_time'
    `, [dbConfig.database]);
    
    if (additionalColumns.length === 0) {
      console.log('📝 Adding checkin_time column to additional_visitors table...');
      await pool.query(`
        ALTER TABLE additional_visitors 
        ADD COLUMN checkin_time TIMESTAMP NULL DEFAULT NULL
      `);
      console.log('✅ Added checkin_time column to additional_visitors table');
    } else {
      console.log('✅ checkin_time column already exists in additional_visitors table');
    }
    
    // Migrate existing data: Set individual check-in times for visitors who are marked as visited
    console.log('🔄 Migrating existing visitor check-in times...');
    const [visitedVisitors] = await pool.query(`
      SELECT v.visitor_id, v.booking_id, b.checkin_time as booking_checkin_time
      FROM visitors v
      JOIN bookings b ON v.booking_id = b.booking_id
      WHERE v.status = 'visited' AND v.checkin_time IS NULL AND b.checkin_time IS NOT NULL
    `);
    
    console.log(`📊 Found ${visitedVisitors.length} visitors to migrate`);
    
    for (const visitor of visitedVisitors) {
      await pool.query(`
        UPDATE visitors 
        SET checkin_time = ? 
        WHERE visitor_id = ?
      `, [visitor.booking_checkin_time, visitor.visitor_id]);
      
      console.log(`✅ Migrated visitor ${visitor.visitor_id} check-in time`);
    }
    
    // Migrate existing data: Set individual check-in times for additional visitors who are checked in
    console.log('🔄 Migrating existing additional visitor check-in times...');
    const [checkedInAdditional] = await pool.query(`
      SELECT av.token_id, av.booking_id, b.checkin_time as booking_checkin_time
      FROM additional_visitors av
      JOIN bookings b ON av.booking_id = b.booking_id
      WHERE av.status = 'checked-in' AND av.checkin_time IS NULL AND b.checkin_time IS NOT NULL
    `);
    
    console.log(`📊 Found ${checkedInAdditional.length} additional visitors to migrate`);
    
    for (const additional of checkedInAdditional) {
      await pool.query(`
        UPDATE additional_visitors 
        SET checkin_time = ? 
        WHERE token_id = ?
      `, [additional.booking_checkin_time, additional.token_id]);
      
      console.log(`✅ Migrated additional visitor ${additional.token_id} check-in time`);
    }
    
    // Create indexes for better performance
    console.log('📝 Creating indexes for better performance...');
    try {
      await pool.query(`
        CREATE INDEX idx_visitors_checkin_time ON visitors(checkin_time)
      `);
      console.log('✅ Created index on visitors.checkin_time');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('✅ Index on visitors.checkin_time already exists');
      } else {
        console.error('❌ Error creating visitors index:', err.message);
      }
    }
    
    try {
      await pool.query(`
        CREATE INDEX idx_additional_visitors_checkin_time ON additional_visitors(checkin_time)
      `);
      console.log('✅ Created index on additional_visitors.checkin_time');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('✅ Index on additional_visitors.checkin_time already exists');
      } else {
        console.error('❌ Error creating additional_visitors index:', err.message);
      }
    }
    
    // Verify migration
    console.log('🔍 Verifying migration...');
    const [verification] = await pool.query(`
      SELECT 
        'visitors' as table_name,
        COUNT(*) as total_visited,
        COUNT(checkin_time) as with_checkin_time,
        COUNT(*) - COUNT(checkin_time) as missing_checkin_time
      FROM visitors 
      WHERE status = 'visited'
      UNION ALL
      SELECT 
        'additional_visitors' as table_name,
        COUNT(*) as total_checked_in,
        COUNT(checkin_time) as with_checkin_time,
        COUNT(*) - COUNT(checkin_time) as missing_checkin_time
      FROM additional_visitors 
      WHERE status = 'checked-in'
    `);
    
    console.log('📊 Migration verification results:');
    verification.forEach(row => {
      console.log(`  ${row.table_name}: ${row.total_visited} total, ${row.with_checkin_time} with check-in time, ${row.missing_checkin_time} missing`);
    });
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📋 Summary of changes:');
    console.log('  • Each visitor now has their own individual check-in time');
    console.log('  • Booking-level check-in time is no longer set automatically');
    console.log('  • Existing data has been migrated to preserve check-in times');
    console.log('  • Database indexes added for better performance');
    console.log('');
    console.log('⚠️  Important notes:');
    console.log('  • The booking.checkin_time field is now deprecated for group visits');
    console.log('  • Use individual visitor check-in times for accurate tracking');
    console.log('  • Group arrival time can be calculated as MIN(checkin_time) for all visitors in a booking');
    
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
  migrateToIndividualCheckinTimes()
    .then(() => {
      console.log('🎉 Migration script completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('💥 Migration script failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateToIndividualCheckinTimes };
