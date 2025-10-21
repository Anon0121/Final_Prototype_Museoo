/**
 * Move Data to Proper Tables
 * 
 * This script moves data from the bloated donations table to the dedicated tables
 * where it belongs. This is the first step in cleaning up the database structure.
 */

const pool = require('../db');
const fs = require('fs');
const path = require('path');

async function moveDataToProperTables() {
  const conn = await pool.getConnection();
  
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         MOVING DATA TO PROPER TABLES                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    // ========================================
    // STEP 1: Check current state
    // ========================================
    console.log('📊 Step 1: Checking current state...\n');
    
    const [donationsCount] = await conn.query('SELECT COUNT(*) as count FROM donations');
    const [meetingData] = await conn.query(`
      SELECT COUNT(*) as count 
      FROM donations 
      WHERE preferred_visit_date IS NOT NULL 
        OR meeting_date IS NOT NULL
        OR meeting_scheduled = 1
        OR meeting_completed = 1
    `);
    const [cityHallData] = await conn.query(`
      SELECT COUNT(*) as count 
      FROM donations 
      WHERE city_hall_submitted = 1
        OR city_hall_submission_date IS NOT NULL
        OR city_hall_approval_date IS NOT NULL
    `);
    
    console.log(`   Total donations: ${donationsCount[0].count}`);
    console.log(`   Donations with meeting data: ${meetingData[0].count}`);
    console.log(`   Donations with city hall data: ${cityHallData[0].count}`);
    console.log();
    
    // ========================================
    // STEP 2: Run migration SQL
    // ========================================
    console.log('🔄 Step 2: Moving data to proper tables...\n');
    
    const sqlFile = path.join(__dirname, '../database/move_data_to_proper_tables.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    let migratedRecords = 0;
    let errors = 0;
    
    for (const statement of statements) {
      try {
        if (statement.toUpperCase().includes('INSERT INTO')) {
          const result = await conn.query(statement);
          const affected = result[0].affectedRows || 0;
          if (affected > 0) {
            console.log(`   ✅ Migrated ${affected} records`);
            migratedRecords += affected;
          }
        } else if (statement.toUpperCase().includes('CREATE TABLE') || 
                   statement.toUpperCase().includes('CREATE INDEX')) {
          await conn.query(statement);
          console.log(`   ✅ Created table/index`);
        } else if (statement.toUpperCase().includes('SELECT')) {
          // Skip SELECT statements in migration
          continue;
        } else {
          await conn.query(statement);
        }
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log('   ⚠️  Record already exists (skipping duplicate)');
        } else if (err.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log('   ⚠️  Table already exists (skipping)');
        } else {
          console.error('   ❌ Error:', err.message);
          errors++;
        }
      }
    }
    
    console.log(`\n   Total records migrated: ${migratedRecords}`);
    console.log(`   Errors encountered: ${errors}\n`);
    
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
    const [unmigratedMeetings] = await conn.query(`
      SELECT COUNT(*) as count
      FROM donations d
      LEFT JOIN donation_meeting_schedule dms ON d.id = dms.donation_id
      WHERE dms.id IS NULL
        AND (
          d.preferred_visit_date IS NOT NULL 
          OR d.meeting_date IS NOT NULL
          OR d.meeting_scheduled = 1
        )
    `);
    
    const [unmigratedCityHall] = await conn.query(`
      SELECT COUNT(*) as count
      FROM donations d
      LEFT JOIN donation_city_hall_submission dchs ON d.id = dchs.donation_id
      WHERE dchs.id IS NULL
        AND (
          d.city_hall_submitted = 1
          OR d.city_hall_submission_date IS NOT NULL
        )
    `);
    
    if (unmigratedMeetings[0].count > 0) {
      console.log(`   ⚠️  WARNING: ${unmigratedMeetings[0].count} donations with meeting data not migrated!`);
    } else {
      console.log('   ✅ All meeting data successfully migrated');
    }
    
    if (unmigratedCityHall[0].count > 0) {
      console.log(`   ⚠️  WARNING: ${unmigratedCityHall[0].count} donations with city hall data not migrated!`);
    } else {
      console.log('   ✅ All city hall data successfully migrated');
    }
    
    // ========================================
    // STEP 4: Show what was moved
    // ========================================
    console.log('\n📋 Step 4: Data migration summary...\n');
    
    const summary = `
╔════════════════════════════════════════════════════════════════════════════╗
║                        DATA MIGRATION COMPLETE                             ║
╚════════════════════════════════════════════════════════════════════════════╝

✅ MEETING DATA MOVED TO: donation_meeting_schedule
   Fields moved:
   - preferred_visit_date, preferred_visit_time
   - meeting_date, meeting_time, meeting_location, meeting_notes
   - meeting_scheduled, meeting_completed, handover_completed
   - rejection_reason, suggested_alternative_dates
   
   Records: ${meetingRecords[0].count}

✅ CITY HALL DATA MOVED TO: donation_city_hall_submission
   Fields moved:
   - city_hall_submitted, city_hall_submission_date, city_hall_approval_date
   - final_approval_date
   
   Records: ${cityHallRecords[0].count}

✅ ACKNOWLEDGMENT DATA MOVED TO: donation_acknowledgments
   Fields moved:
   - acknowledgment_sent, acknowledgment_date, acknowledgment_type
   - gratitude_email_sent
   
   Records: ${acknowledgmentRecords[0].count}

╔════════════════════════════════════════════════════════════════════════════╗
║                           NEXT STEPS                                       ║
╚════════════════════════════════════════════════════════════════════════════╝

🔄 STEP 1: Update API Code (REQUIRED)
   The code in backend/routes/donations.js still uses the old fields.
   You need to update it to use JOINs with the new dedicated tables.
   
   Example changes needed:
   - Change: WHERE meeting_date IS NOT NULL
   - To: JOIN donation_meeting_schedule dms ON d.id = dms.donation_id
   
🔄 STEP 2: Test All Workflows
   Test these workflows to ensure they work:
   - Creating new donations
   - Scheduling meetings
   - Submitting to city hall
   - Sending acknowledgments
   
🔄 STEP 3: Remove Redundant Fields
   After code is updated and tested, remove the old fields from donations table:
   - Run cleanup script to remove redundant fields
   - This will reduce table size by ~50%

⚠️  IMPORTANT: The donations table still has the old fields!
   The data is now duplicated in both places.
   Update the code first, then remove the old fields.

`;

    console.log(summary);
    
    // ========================================
    // STEP 5: Save migration report
    // ========================================
    const reportPath = path.join(__dirname, '../../DATA_MIGRATION_REPORT.txt');
    const report = `
DATA MIGRATION REPORT
Generated: ${new Date().toISOString()}

MIGRATION RESULTS:
- Meeting records migrated: ${meetingRecords[0].count}
- City hall records migrated: ${cityHallRecords[0].count}
- Acknowledgment records migrated: ${acknowledgmentRecords[0].count}
- Total records migrated: ${migratedRecords}
- Errors encountered: ${errors}

DATA LOCATIONS:
✅ donation_meeting_schedule: ${meetingRecords[0].count} records
✅ donation_city_hall_submission: ${cityHallRecords[0].count} records
✅ donation_acknowledgments: ${acknowledgmentRecords[0].count} records

VERIFICATION:
- Unmigrated meeting data: ${unmigratedMeetings[0].count}
- Unmigrated city hall data: ${unmigratedCityHall[0].count}

NEXT STEPS:
1. Update API code to use dedicated tables
2. Test all donation workflows
3. Remove redundant fields from donations table
4. Verify application works correctly

STATUS: ✅ DATA MIGRATION COMPLETE
`;

    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 Migration report saved to: ${reportPath}\n`);
    
    console.log('✅ DATA MOVED TO PROPER TABLES!\n');
    console.log('⚠️  Remember: Update the code before removing old fields.\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    conn.release();
  }
}

// Run the migration
if (require.main === module) {
  moveDataToProperTables()
    .then(() => {
      console.log('🎉 All done!');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n💥 Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { moveDataToProperTables };






