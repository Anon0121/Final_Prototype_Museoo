-- Migrate data from donations table to dedicated tables
-- Run this BEFORE removing any fields from donations table
-- This ensures data is preserved in the proper tables

-- ========================================
-- 1. MIGRATE MEETING DATA
-- ========================================

-- Insert meeting schedule records for donations that have meeting data
INSERT INTO donation_meeting_schedule (
    donation_id,
    preferred_visit_date,
    preferred_visit_time,
    meeting_date,
    meeting_time,
    meeting_location,
    meeting_notes,
    status,
    created_at,
    updated_at
)
SELECT 
    d.id,
    d.preferred_visit_date,
    d.preferred_visit_time,
    d.meeting_date,
    d.meeting_time,
    d.meeting_location,
    d.meeting_notes,
    CASE 
        WHEN d.meeting_completed = TRUE THEN 'completed'
        WHEN d.meeting_scheduled = TRUE THEN 'scheduled'
        WHEN d.preferred_visit_date IS NOT NULL THEN 'requested'
        ELSE 'pending'
    END as status,
    d.created_at,
    NOW()
FROM donations d
WHERE d.id NOT IN (SELECT donation_id FROM donation_meeting_schedule)
    AND (
        d.preferred_visit_date IS NOT NULL 
        OR d.meeting_date IS NOT NULL
        OR d.meeting_scheduled = TRUE
        OR d.meeting_completed = TRUE
    );

-- ========================================
-- 2. MIGRATE CITY HALL SUBMISSION DATA
-- ========================================

-- Insert city hall submission records for donations that have city hall data
INSERT INTO donation_city_hall_submission (
    donation_id,
    submitted_by,
    submission_date,
    approval_date,
    status,
    notes,
    created_at
)
SELECT 
    d.id,
    'admin',
    d.city_hall_submission_date,
    d.city_hall_approval_date,
    CASE 
        WHEN d.city_hall_approval_date IS NOT NULL THEN 'approved'
        WHEN d.city_hall_submitted = TRUE THEN 'submitted'
        WHEN d.city_acknowledgment_required = TRUE THEN 'required'
        ELSE 'not_required'
    END as status,
    CONCAT(
        'Migrated from donations table. ',
        CASE WHEN d.city_acknowledgment_required = TRUE THEN 'City acknowledgment required. ' ELSE '' END,
        CASE WHEN d.city_acknowledgment_sent = TRUE THEN 'City acknowledgment sent. ' ELSE '' END
    ) as notes,
    d.city_hall_submission_date OR d.created_at
FROM donations d
WHERE d.id NOT IN (SELECT donation_id FROM donation_city_hall_submission)
    AND (
        d.city_hall_submitted = TRUE
        OR d.city_acknowledgment_required = TRUE
        OR d.city_hall_submission_date IS NOT NULL
        OR d.city_hall_approval_date IS NOT NULL
    );

-- ========================================
-- 3. MIGRATE ACKNOWLEDGMENT DATA
-- ========================================

-- Insert acknowledgment records for donations that have been acknowledged
INSERT INTO donation_acknowledgments (
    donation_id,
    acknowledgment_type,
    sent_date,
    sent_by,
    recipient_name,
    recipient_email,
    status,
    created_at
)
SELECT 
    d.id,
    COALESCE(d.acknowledgment_type, 'email'),
    d.acknowledgment_date,
    'admin',
    d.donor_name,
    d.donor_email,
    'sent',
    d.acknowledgment_date OR d.created_at
FROM donations d
WHERE d.id NOT IN (SELECT donation_id FROM donation_acknowledgments WHERE acknowledgment_type != 'city_certificate')
    AND d.acknowledgment_sent = TRUE
    AND d.acknowledgment_date IS NOT NULL;

-- Insert gratitude email records
INSERT INTO donation_acknowledgments (
    donation_id,
    acknowledgment_type,
    sent_date,
    sent_by,
    recipient_name,
    recipient_email,
    status,
    created_at
)
SELECT 
    d.id,
    'email',
    d.final_approval_date,
    'admin',
    d.donor_name,
    d.donor_email,
    'sent',
    d.final_approval_date OR d.created_at
FROM donations d
WHERE d.gratitude_email_sent = TRUE
    AND d.id NOT IN (
        SELECT donation_id 
        FROM donation_acknowledgments 
        WHERE sent_date = d.final_approval_date
    );

-- ========================================
-- 4. VERIFY DATA MIGRATION
-- ========================================

-- Check meeting data migration
SELECT 
    'Meeting Data' as migration_type,
    COUNT(*) as records_migrated
FROM donation_meeting_schedule;

-- Check city hall data migration
SELECT 
    'City Hall Data' as migration_type,
    COUNT(*) as records_migrated
FROM donation_city_hall_submission;

-- Check acknowledgment data migration
SELECT 
    'Acknowledgment Data' as migration_type,
    COUNT(*) as records_migrated
FROM donation_acknowledgments;

-- Check for any donations with meeting data not yet migrated
SELECT 
    'Unmigrated Meeting Records' as check_type,
    COUNT(*) as count
FROM donations d
LEFT JOIN donation_meeting_schedule dms ON d.id = dms.donation_id
WHERE dms.id IS NULL
    AND (
        d.preferred_visit_date IS NOT NULL 
        OR d.meeting_date IS NOT NULL
        OR d.meeting_scheduled = TRUE
    );

-- ========================================
-- NOTES
-- ========================================
-- After running this migration:
-- 1. Verify all counts match expected values
-- 2. Check that unmigrated records count is 0
-- 3. Test the application to ensure it works with dedicated tables
-- 4. Only AFTER successful testing, run cleanup_donations_table_redundant_fields.sql







