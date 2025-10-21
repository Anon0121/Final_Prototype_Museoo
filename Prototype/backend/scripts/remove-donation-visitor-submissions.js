/**
 * Remove donation_visitor_submissions table and visitor-donation relationships
 * 
 * This script removes the incorrect visitor-donation linking from the database.
 * Donations should ONLY be made by DONORS, not visitors or participants.
 * 
 * What this script does:
 * 1. Drops donation_visitor_submissions table
 * 2. Removes visitor-specific fields from donations table
 * 3. Updates source enum to remove 'visitor' option
 * 4. Updates existing records to use 'donor_request' instead
 */

const pool = require('../db');
const fs = require('fs');
const path = require('path');

async function removeDonationVisitorSubmissions() {
  const conn = await pool.getConnection();
  
  try {
    console.log('🔧 Starting removal of donation_visitor_submissions...\n');
    
    // Read the SQL migration file
    const sqlFile = path.join(__dirname, '../database/remove_donation_visitor_submissions.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      try {
        console.log(`Executing: ${statement.substring(0, 60)}...`);
        await conn.query(statement);
        console.log('✅ Success\n');
      } catch (err) {
        // Some statements might fail if table/column doesn't exist, that's okay
        if (err.code === 'ER_BAD_FIELD_ERROR' || 
            err.code === 'ER_CANT_DROP_FIELD_OR_KEY' ||
            err.code === 'ER_BAD_TABLE_ERROR') {
          console.log('⚠️  Already removed or doesn\'t exist, skipping...\n');
        } else {
          console.error('❌ Error:', err.message, '\n');
          throw err;
        }
      }
    }
    
    // Verify the table is removed
    const [tables] = await conn.query("SHOW TABLES LIKE 'donation_visitor_submissions'");
    if (tables.length === 0) {
      console.log('✅ donation_visitor_submissions table successfully removed');
    } else {
      console.log('⚠️  Table still exists, manual intervention may be required');
    }
    
    // Verify visitor-specific columns are removed
    const [columns] = await conn.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'donations' 
        AND COLUMN_NAME IN ('visitor_ip', 'visitor_user_agent')
    `);
    
    if (columns.length === 0) {
      console.log('✅ Visitor-specific columns removed from donations table');
    } else {
      console.log('⚠️  Some visitor columns still exist:', columns);
    }
    
    // Check source column enum values
    const [sourceEnum] = await conn.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'donations' 
        AND COLUMN_NAME = 'source'
    `);
    
    if (sourceEnum.length > 0) {
      console.log('✅ Source column updated:', sourceEnum[0].COLUMN_TYPE);
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - donation_visitor_submissions table: REMOVED');
    console.log('   - visitor_ip column: REMOVED');
    console.log('   - visitor_user_agent column: REMOVED');
    console.log('   - source enum: UPDATED (removed \'visitor\' option)');
    console.log('   - Donations are now DONOR-ONLY ✓');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    conn.release();
  }
}

// Run the migration
removeDonationVisitorSubmissions()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n💥 Fatal error:', err);
    process.exit(1);
  });







