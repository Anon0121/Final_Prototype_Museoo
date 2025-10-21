/**
 * Safe Donations Table Cleanup Script
 * 
 * This script safely migrates data from the donations table to dedicated tables
 * and provides a report on what will be removed.
 * 
 * IMPORTANT: This only migrates data. Field removal is a separate step.
 * 
 * Steps:
 * 1. Migrate data to dedicated tables
 * 2. Verify migration was successful
 * 3. Generate report
 * 4. DO NOT remove fields yet - that requires code updates first
 */

const pool = require('../db');
const fs = require('fs');
const path = require('path');

async function safeCleanupDonations() {
  const conn = await pool.getConnection();
  
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   SAFE DONATIONS TABLE CLEANUP - DATA MIGRATION ONLY      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    // ========================================
    // STEP 1: Check current state
    // ========================================
    console.log('📊 Step 1: Analyzing current state...\n');
    
    const [donationsWithMeetings] = await conn.query(`
      SELECT COUNT(*) as count 
      FROM donations 
      WHERE preferred_visit_date IS NOT NULL 
        OR meeting_date IS NOT NULL
        OR meeting_scheduled = TRUE
    `);
    
    const [donationsWithCityHall] = await conn.query(`
      SELECT COUNT(*) as count 
      FROM donations 
      WHERE city_hall_submitted = TRUE
        OR city_acknowledgment_required = TRUE
        OR city_hall_submission_date IS NOT NULL
    `);
    
    const [donationsWithAcknowledgments] = await conn.query(`
      SELECT COUNT(*) as count 
      FROM donations 
      WHERE acknowledgment_sent = TRUE
        OR gratitude_email_sent = TRUE
    `);
    
    console.log(`   Donations with meeting data: ${donationsWithMeetings[0].count}`);
    console.log(`   Donations with city hall data: ${donationsWithCityHall[0].count}`);
    console.log(`   Donations with acknowledgments: ${donationsWithAcknowledgments[0].count}`);
    console.log();
    
    // ========================================
    // STEP 2: Migrate data
    // ========================================
    console.log('🔄 Step 2: Migrating data to dedicated tables...\n');
    
    // Read migration SQL file
    const sqlFile = path.join(__dirname, '../database/migrate_data_to_dedicated_tables.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('SELECT'));
    
    let migratedCount = 0;
    for (const statement of statements) {
      try {
        if (statement.toUpperCase().includes('INSERT INTO')) {
          const result = await conn.query(statement);
          const affected = result[0].affectedRows || 0;
          if (affected > 0) {
            console.log(`   ✅ Migrated ${affected} records`);
            migratedCount += affected;
          }
        }
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log('   ⚠️  Some records already exist (skipping duplicates)');
        } else {
          console.error('   ❌ Error:', err.message);
        }
      }
    }
    
    console.log(`\n   Total records migrated: ${migratedCount}\n`);
    
    // ========================================
    // STEP 3: Verify migration
    // ========================================
    console.log('✅ Step 3: Verifying migration...\n');
    
    const [meetingRecords] = await conn.query('SELECT COUNT(*) as count FROM donation_meeting_schedule');
    const [cityHallRecords] = await conn.query('SELECT COUNT(*) as count FROM donation_city_hall_submission');
    const [acknowledgmentRecords] = await conn.query('SELECT COUNT(*) as count FROM donation_acknowledgments');
    
    console.log(`   Meeting records in dedicated table: ${meetingRecords[0].count}`);
    console.log(`   City hall records in dedicated table: ${cityHallRecords[0].count}`);
    console.log(`   Acknowledgment records in dedicated table: ${acknowledgmentRecords[0].count}`);
    console.log();
    
    // Check for unmigrated data
    const [unmigrated] = await conn.query(`
      SELECT 
        COUNT(*) as count
      FROM donations d
      LEFT JOIN donation_meeting_schedule dms ON d.id = dms.donation_id
      WHERE dms.id IS NULL
        AND (
          d.preferred_visit_date IS NOT NULL 
          OR d.meeting_date IS NOT NULL
          OR d.meeting_scheduled = TRUE
        )
    `);
    
    if (unmigrated[0].count > 0) {
      console.log(`   ⚠️  WARNING: ${unmigrated[0].count} donations with meeting data not migrated!`);
    } else {
      console.log('   ✅ All meeting data successfully migrated');
    }
    
    // ========================================
    // STEP 4: Generate report
    // ========================================
    console.log('\n📋 Step 4: Generating cleanup report...\n');
    
    const report = `
═══════════════════════════════════════════════════════════════
           DONATIONS TABLE CLEANUP REPORT
═══════════════════════════════════════════════════════════════

MIGRATION COMPLETED: ${new Date().toISOString()}

DATA MIGRATED:
  ✅ ${meetingRecords[0].count} meeting schedule records
  ✅ ${cityHallRecords[0].count} city hall submission records
  ✅ ${acknowledgmentRecords[0].count} acknowledgment records

NEXT STEPS:
  
  ⚠️  IMPORTANT: DO NOT remove fields from donations table yet!
  
  Before removing fields, you must:
  
  1. Update API routes to use dedicated tables (donations.js)
     - Replace direct field access with JOINs
     - Write to dedicated tables instead of donations table
  
  2. Test all donation workflows:
     - Creating new donations
     - Scheduling meetings
     - Submitting to city hall
     - Sending acknowledgments
  
  3. Update frontend if needed to work with new data structure
  
  4. Only AFTER testing, run cleanup_donations_table_redundant_fields.sql
  
FIELDS SAFE TO REMOVE (after code updates):
  
  From donations table:
    - preferred_visit_date, preferred_visit_time
    - meeting_date, meeting_time, meeting_location, meeting_notes
    - meeting_scheduled, meeting_completed, handover_completed
    - city_hall_submitted, city_hall_submission_date, city_hall_approval_date
    - city_acknowledgment_required, city_acknowledgment_sent, city_acknowledgment_date
    - acknowledgment_sent, acknowledgment_date, acknowledgment_type
    - gratitude_email_sent
    - rejection_reason, suggested_alternative_dates
  
  From donation_details table:
    - documents_uploaded, documents_count

ESTIMATED DATABASE SIZE REDUCTION:
  ~15-20 columns removed from donations table
  ~2 columns removed from donation_details table
  
  This will improve query performance and data integrity.

═══════════════════════════════════════════════════════════════
`;

    console.log(report);
    
    // Save report to file
    const reportPath = path.join(__dirname, '../../DONATION_CLEANUP_REPORT.txt');
    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 Report saved to: ${reportPath}\n`);
    
    console.log('✅ DATA MIGRATION COMPLETE!\n');
    console.log('⚠️  Remember: Field removal requires code updates first.\n');
    console.log('📖 See DONATION_TABLE_CLEANUP_PLAN.md for full details.\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    conn.release();
  }
}

// Run the migration
if (require.main === module) {
  safeCleanupDonations()
    .then(() => {
      console.log('🎉 All done!');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n💥 Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { safeCleanupDonations };







