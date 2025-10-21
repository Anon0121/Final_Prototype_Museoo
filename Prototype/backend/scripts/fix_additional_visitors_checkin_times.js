const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'museosmart',
  port: process.env.DB_PORT || 3306
};

async function fixAdditionalVisitorsCheckinTimes() {
  let pool;
  
  try {
    console.log('🚀 Starting fix for additional visitors check-in times...');
    
    // Create database connection
    pool = mysql.createPool(dbConfig);
    console.log('✅ Database connection established');
    
    // Find additional visitors who are checked in but don't have check-in times in visitors table
    console.log('🔍 Finding additional visitors to fix...');
    const [additionalVisitors] = await pool.query(`
      SELECT 
        av.token_id,
        av.booking_id,
        av.email,
        av.checkin_time as av_checkin_time,
        av.details,
        v.visitor_id,
        v.checkin_time as v_checkin_time
      FROM additional_visitors av
      LEFT JOIN visitors v ON v.email = av.email AND v.booking_id = av.booking_id AND v.is_main_visitor = false
      WHERE av.status = 'checked-in' 
        AND av.checkin_time IS NOT NULL
        AND (v.visitor_id IS NULL OR v.checkin_time IS NULL)
    `);
    
    console.log(`📊 Found ${additionalVisitors.length} additional visitors to fix`);
    
    for (const visitor of additionalVisitors) {
      console.log(`🔧 Processing visitor: ${visitor.email}`);
      
      if (visitor.visitor_id) {
        // Update existing visitor record with check-in time
        await pool.query(`
          UPDATE visitors 
          SET checkin_time = ? 
          WHERE visitor_id = ?
        `, [visitor.av_checkin_time, visitor.visitor_id]);
        
        console.log(`✅ Updated visitor ${visitor.visitor_id} with check-in time`);
      } else {
        // Insert new visitor record
        const details = visitor.details ? JSON.parse(visitor.details) : {};
        
        await pool.query(`
          INSERT INTO visitors (
            booking_id, first_name, last_name, gender, address, email, 
            nationality, purpose, institution, status, is_main_visitor, 
            created_at, checkin_time
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'visited', false, NOW(), ?)
        `, [
          visitor.booking_id,
          details.firstName || '',
          details.lastName || '',
          details.gender || '',
          details.address || '',
          visitor.email,
          details.nationality || '',
          details.purpose || 'educational',
          details.institution || '',
          visitor.av_checkin_time
        ]);
        
        console.log(`✅ Inserted new visitor record for ${visitor.email}`);
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
if (require.main === module) {
  fixAdditionalVisitorsCheckinTimes()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = fixAdditionalVisitorsCheckinTimes;
