/**
 * Analyze and Cleanup Donations Table
 * 
 * This script provides a safe, step-by-step approach to removing unnecessary attributes
 * from the donations table without breaking the application.
 */

const pool = require('../db');
const fs = require('fs');
const path = require('path');

async function analyzeAndCleanupDonations() {
  const conn = await pool.getConnection();
  
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           DONATIONS TABLE CLEANUP ANALYSIS               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    // ========================================
    // STEP 1: Analyze current structure
    // ========================================
    console.log('📊 Step 1: Analyzing current donations table structure...\n');
    
    const [fields] = await conn.query('DESCRIBE donations');
    console.log(`   Total fields in donations table: ${fields.length}`);
    
    // Categorize fields
    const coreFields = fields.filter(f => 
      ['id', 'donor_name', 'donor_email', 'donor_contact', 'type', 'notes', 'status', 'processing_stage', 'assigned_to', 'priority', 'source', 'admin_notes', 'request_date', 'created_at', 'final_approval_date', 'public_visible'].includes(f.Field)
    );
    
    const meetingFields = fields.filter(f => 
      f.Field.includes('meeting') || f.Field.includes('visit') || f.Field.includes('handover')
    );
    
    const cityHallFields = fields.filter(f => 
      f.Field.includes('city_hall') || f.Field.includes('approval')
    );
    
    const visitorFields = fields.filter(f => 
      f.Field.includes('visitor')
    );
    
    const otherFields = fields.filter(f => 
      !coreFields.includes(f) && !meetingFields.includes(f) && !cityHallFields.includes(f) && !visitorFields.includes(f)
    );
    
    console.log(`   Core fields (keep): ${coreFields.length}`);
    console.log(`   Meeting fields (redundant): ${meetingFields.length}`);
    console.log(`   City hall fields (redundant): ${cityHallFields.length}`);
    console.log(`   Visitor fields (unnecessary): ${visitorFields.length}`);
    console.log(`   Other fields: ${otherFields.length}`);
    console.log();
    
    // ========================================
    // STEP 2: Show what can be removed immediately
    // ========================================
    console.log('🟢 Step 2: Fields safe to remove immediately (no code dependencies):\n');
    
    visitorFields.forEach(field => {
      console.log(`   ✅ ${field.Field} (${field.Type}) - Visitor tracking not needed for donors`);
    });
    
    // ========================================
    // STEP 3: Show what needs code updates first
    // ========================================
    console.log('\n🟡 Step 3: Fields that need code updates before removal:\n');
    
    console.log('   Meeting-related fields:');
    meetingFields.forEach(field => {
      console.log(`   ⚠️  ${field.Field} (${field.Type}) - Used in donations.js`);
    });
    
    console.log('\n   City hall fields:');
    cityHallFields.forEach(field => {
      console.log(`   ⚠️  ${field.Field} (${field.Type}) - Used in donations.js`);
    });
    
    // ========================================
    // STEP 4: Data analysis
    // ========================================
    console.log('\n📈 Step 4: Data usage analysis...\n');
    
    const [dataUsage] = await conn.query(`
      SELECT 
        COUNT(*) as total_donations,
        SUM(CASE WHEN preferred_visit_date IS NOT NULL THEN 1 ELSE 0 END) as has_meeting_data,
        SUM(CASE WHEN city_hall_submitted = 1 THEN 1 ELSE 0 END) as has_city_hall_data,
        SUM(CASE WHEN visitor_ip IS NOT NULL THEN 1 ELSE 0 END) as has_visitor_data,
        SUM(CASE WHEN rejection_reason IS NOT NULL THEN 1 ELSE 0 END) as has_rejection_data
      FROM donations
    `);
    
    const usage = dataUsage[0];
    console.log(`   Total donations: ${usage.total_donations}`);
    console.log(`   With meeting data: ${usage.has_meeting_data}`);
    console.log(`   With city hall data: ${usage.has_city_hall_data}`);
    console.log(`   With visitor data: ${usage.has_visitor_data}`);
    console.log(`   With rejection data: ${usage.has_rejection_data}`);
    console.log();
    
    // ========================================
    // STEP 5: Check dedicated tables
    // ========================================
    console.log('🗄️  Step 5: Checking dedicated tables...\n');
    
    const tables = [
      'donation_meeting_schedule',
      'donation_city_hall_submission', 
      'donation_acknowledgments',
      'donation_documents'
    ];
    
    for (const table of tables) {
      try {
        const [exists] = await conn.query(`SHOW TABLES LIKE '${table}'`);
        if (exists.length > 0) {
          const [count] = await conn.query(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`   ✅ ${table}: EXISTS (${count[0].count} records)`);
        } else {
          console.log(`   ❌ ${table}: MISSING`);
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ERROR - ${err.message}`);
      }
    }
    console.log();
    
    // ========================================
    // STEP 6: Generate cleanup plan
    // ========================================
    console.log('📋 Step 6: Recommended cleanup plan...\n');
    
    const plan = `
╔════════════════════════════════════════════════════════════════════════════╗
║                           CLEANUP PLAN                                    ║
╚════════════════════════════════════════════════════════════════════════════╝

🟢 PHASE 1: IMMEDIATE CLEANUP (SAFE - Run Now)
   Remove visitor fields (no code dependencies):
   ${visitorFields.map(f => `   - ${f.Field}`).join('\n')}
   
   Expected reduction: ${visitorFields.length} fields
   
🟡 PHASE 2: DATA MIGRATION (SAFE - Backup data)
   Copy data to dedicated tables:
   - Meeting data → donation_meeting_schedule
   - City hall data → donation_city_hall_submission
   
   This creates backup copies but doesn't remove anything yet.
   
🔴 PHASE 3: CODE UPDATES (REQUIRED - Before field removal)
   Update backend/routes/donations.js to:
   - Use JOINs instead of direct field access
   - Write to dedicated tables instead of donations table
   - Update dashboard queries
   
   This is a significant refactoring effort.
   
🟢 PHASE 4: FIELD REMOVAL (After Phase 3)
   Remove ${meetingFields.length + cityHallFields.length} redundant fields:
   ${meetingFields.map(f => `   - ${f.Field}`).join('\n')}
   ${cityHallFields.map(f => `   - ${f.Field}`).join('\n')}
   
   Final result: ${coreFields.length} clean fields (down from ${fields.length})

╔════════════════════════════════════════════════════════════════════════════╗
║                           WHAT TO DO NOW                                  ║
╚════════════════════════════════════════════════════════════════════════════╝

1. 🟢 Run Phase 1 immediately (safe):
   node backend/scripts/safe-cleanup-donations-table.js

2. 🟡 Run Phase 2 (safe backup):
   The script will also migrate data to dedicated tables

3. 🔴 Plan Phase 3 (requires work):
   - Refactor donations.js API routes
   - Update queries to use JOINs
   - Test thoroughly

4. 🟢 Run Phase 4 (after Phase 3):
   Only after code is updated and tested

ESTIMATED BENEFITS:
- Database size reduction: ~${Math.round(((fields.length - coreFields.length) / fields.length) * 100)}%
- Query performance improvement
- Better data integrity
- Cleaner code structure

`;

    console.log(plan);
    
    // ========================================
    // STEP 7: Save analysis report
    // ========================================
    const reportPath = path.join(__dirname, '../../DONATIONS_TABLE_ANALYSIS.txt');
    const report = `
DONATIONS TABLE CLEANUP ANALYSIS
Generated: ${new Date().toISOString()}

CURRENT STATE:
- Total fields: ${fields.length}
- Core fields (keep): ${coreFields.length}
- Redundant fields (remove): ${fields.length - coreFields.length}

FIELDS BY CATEGORY:
Core Fields (${coreFields.length}):
${coreFields.map(f => `- ${f.Field} (${f.Type})`).join('\n')}

Meeting Fields (${meetingFields.length}):
${meetingFields.map(f => `- ${f.Field} (${f.Type})`).join('\n')}

City Hall Fields (${cityHallFields.length}):
${cityHallFields.map(f => `- ${f.Field} (${f.Type})`).join('\n')}

Visitor Fields (${visitorFields.length}):
${visitorFields.map(f => `- ${f.Field} (${f.Type})`).join('\n')}

DATA USAGE:
- Total donations: ${usage.total_donations}
- With meeting data: ${usage.has_meeting_data}
- With city hall data: ${usage.has_city_hall_data}
- With visitor data: ${usage.has_visitor_data}

NEXT STEPS:
1. Run safe cleanup script
2. Update code to use dedicated tables
3. Remove redundant fields
4. Test thoroughly
`;

    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 Analysis report saved to: ${reportPath}\n`);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    throw error;
  } finally {
    conn.release();
  }
}

// Run the analysis
if (require.main === module) {
  analyzeAndCleanupDonations()
    .then(() => {
      console.log('✅ Analysis complete!');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n💥 Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { analyzeAndCleanupDonations };






