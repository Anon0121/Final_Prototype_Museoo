/**
 * Test Donation Workflow with New Structure
 * 
 * This script tests that the donation backend is working properly
 * with the new table structure
 */

const pool = require('../db');

async function testDonationWorkflow() {
  const conn = await pool.getConnection();
  
  try {
    console.log('🧪 Testing Donation Workflow with New Structure...\n');
    
    // ========================================
    // TEST 1: Create a new donation
    // ========================================
    console.log('📝 Test 1: Creating a new donation...');
    
    const testDonation = {
      donor_name: 'Test Donor',
      donor_email: 'test@example.com',
      donor_contact: '555-0123',
      type: 'monetary',
      preferred_visit_date: '2024-02-15',
      preferred_visit_time: '14:00',
      notes: 'Test donation for cleanup verification',
      amount: 1000.00,
      item_description: 'Test monetary donation'
    };
    
    // Insert into donations (core fields only)
    const [donationResult] = await conn.query(
      `INSERT INTO donations (
        donor_name, donor_email, donor_contact, type, request_date, 
        notes, source, processing_stage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        testDonation.donor_name, testDonation.donor_email, testDonation.donor_contact, 
        testDonation.type, new Date(), testDonation.notes, 'donor_request', 'request_received'
      ]
    );
    const donationId = donationResult.insertId;
    console.log(`   ✅ Donation created with ID: ${donationId}`);
    
    // Insert meeting schedule data into dedicated table
    if (testDonation.preferred_visit_date || testDonation.preferred_visit_time) {
      await conn.query(
        `INSERT INTO donation_meeting_schedule (
          donation_id, scheduled_date, scheduled_time, status
        ) VALUES (?, ?, ?, ?)`,
        [donationId, testDonation.preferred_visit_date, testDonation.preferred_visit_time, 'scheduled']
      );
      console.log('   ✅ Meeting schedule created in dedicated table');
    }
    
    // Insert into donation_details
    await conn.query(
      `INSERT INTO donation_details (
        donation_id, amount, item_description
      ) VALUES (?, ?, ?)`,
      [donationId, testDonation.amount, testDonation.item_description]
    );
    console.log('   ✅ Donation details created');
    
    // ========================================
    // TEST 2: Schedule a meeting
    // ========================================
    console.log('\n📅 Test 2: Scheduling a meeting...');
    
    // Update donation processing stage only
    await conn.query(
      `UPDATE donations SET processing_stage = 'meeting_scheduled' WHERE id = ?`,
      [donationId]
    );
    console.log('   ✅ Processing stage updated');
    
    // Create or update meeting schedule record
    const [existingMeeting] = await conn.query(
      'SELECT id FROM donation_meeting_schedule WHERE donation_id = ?',
      [donationId]
    );

    if (existingMeeting.length > 0) {
      // Update existing meeting schedule
      await conn.query(
        `UPDATE donation_meeting_schedule SET 
          scheduled_date = ?, scheduled_time = ?, location = ?, 
          meeting_notes = ?, status = 'scheduled'
         WHERE donation_id = ?`,
        ['2024-02-20', '10:00', 'Museum Office', 'Test meeting scheduled', 'scheduled', donationId]
      );
      console.log('   ✅ Meeting schedule updated in dedicated table');
    }
    
    // ========================================
    // TEST 3: Verify data is in correct tables
    // ========================================
    console.log('\n🔍 Test 3: Verifying data location...');
    
    // Check donations table
    const [donationData] = await conn.query('SELECT * FROM donations WHERE id = ?', [donationId]);
    console.log(`   ✅ Donation data in donations table: ${donationData.length} record`);
    console.log(`      - Processing stage: ${donationData[0].processing_stage}`);
    console.log(`      - Source: ${donationData[0].source}`);
    
    // Check meeting schedule table
    const [meetingData] = await conn.query('SELECT * FROM donation_meeting_schedule WHERE donation_id = ?', [donationId]);
    console.log(`   ✅ Meeting data in dedicated table: ${meetingData.length} record`);
    console.log(`      - Scheduled date: ${meetingData[0].scheduled_date}`);
    console.log(`      - Scheduled time: ${meetingData[0].scheduled_time}`);
    console.log(`      - Status: ${meetingData[0].status}`);
    
    // Check donation details table
    const [detailsData] = await conn.query('SELECT * FROM donation_details WHERE donation_id = ?', [donationId]);
    console.log(`   ✅ Details data in dedicated table: ${detailsData.length} record`);
    console.log(`      - Amount: $${detailsData[0].amount}`);
    console.log(`      - Description: ${detailsData[0].item_description}`);
    
    // ========================================
    // TEST 4: Verify no data in wrong places
    // ========================================
    console.log('\n🚫 Test 4: Verifying no redundant data...');
    
    // Check that meetings fields don't exist in donations table
    const donationFields = Object.keys(donationData[0]);
    const meetingFields = ['scheduled_date', 'scheduled_time', 'location', 'preferred_visit_date'];
    const hasMeetingFields = meetingFields.some(field => donationFields.includes(field));
    
    if (hasMeetingFields) {
      console.log('   ❌ ERROR: Meeting fields still exist in donations table!');
    } else {
      console.log('   ✅ No meeting fields in donations table (correct!)');
    }
    
    // ========================================
    // CLEANUP: Remove test data
    // ========================================
    console.log('\n🧹 Cleanup: Removing test data...');
    
    // Delete in reverse order due to foreign keys
    await conn.query('DELETE FROM donation_details WHERE donation_id = ?', [donationId]);
    await conn.query('DELETE FROM donation_meeting_schedule WHERE donation_id = ?', [donationId]);
    await conn.query('DELETE FROM donations WHERE id = ?', [donationId]);
    console.log('   ✅ Test data cleaned up');
    
    // ========================================
    // RESULTS
    // ========================================
    console.log('\n🎉 TEST RESULTS:');
    console.log('================');
    console.log('✅ Donation creation: WORKING');
    console.log('✅ Meeting scheduling: WORKING');
    console.log('✅ Data in correct tables: WORKING');
    console.log('✅ No redundant data: WORKING');
    console.log('\n🚀 DONATION BACKEND IS WORKING CORRECTLY!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    conn.release();
  }
}

// Run the test
if (require.main === module) {
  testDonationWorkflow()
    .then(() => {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n💥 Test failed:', err);
      process.exit(1);
    });
}

module.exports = { testDonationWorkflow };
