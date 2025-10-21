-- Move data from donations table to proper dedicated tables
-- This script moves data to where it belongs and updates the structure

-- ========================================
-- STEP 1: ENSURE DEDICATED TABLES EXIST
-- ========================================

-- Create donation_meeting_schedule table if not exists
CREATE TABLE IF NOT EXISTS donation_meeting_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id INT NOT NULL,
    preferred_visit_date DATE NULL,
    preferred_visit_time TIME NULL,
    meeting_date DATE NULL,
    meeting_time TIME NULL,
    meeting_location VARCHAR(255) NULL,
    meeting_notes TEXT NULL,
    status ENUM('pending', 'requested', 'scheduled', 'completed', 'cancelled') DEFAULT 'pending',
    handover_completed BOOLEAN DEFAULT FALSE,
    rejection_reason TEXT NULL,
    suggested_alternative_dates JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

-- Create donation_city_hall_submission table if not exists
CREATE TABLE IF NOT EXISTS donation_city_hall_submission (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id INT NOT NULL,
    submitted_by VARCHAR(100) NOT NULL,
    submission_date DATE NULL,
    approval_date DATE NULL,
    status ENUM('not_required', 'required', 'submitted', 'approved', 'rejected') DEFAULT 'not_required',
    reference_number VARCHAR(100) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

-- Create donation_acknowledgments table if not exists
CREATE TABLE IF NOT EXISTS donation_acknowledgments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id INT NOT NULL,
    acknowledgment_type ENUM('email', 'letter', 'certificate', 'plaque', 'gratitude_email') NOT NULL,
    sent_date DATE NOT NULL,
    sent_by VARCHAR(100) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NULL,
    recipient_address TEXT NULL,
    content TEXT NULL,
    file_path VARCHAR(500) NULL,
    status ENUM('draft', 'sent', 'delivered', 'confirmed') DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

-- ========================================
-- STEP 2: MIGRATE MEETING DATA
-- ========================================

-- Insert meeting schedule records for all donations with meeting-related data
INSERT INTO donation_meeting_schedule (
    donation_id,
    preferred_visit_date,
    preferred_visit_time,
    meeting_date,
    meeting_time,
    meeting_location,
    meeting_notes,
    status,
    handover_completed,
    rejection_reason,
    suggested_alternative_dates,
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
        WHEN d.meeting_completed = 1 THEN 'completed'
        WHEN d.meeting_scheduled = 1 THEN 'scheduled'
        WHEN d.preferred_visit_date IS NOT NULL OR d.preferred_visit_time IS NOT NULL THEN 'requested'
        ELSE 'pending'
    END as status,
    COALESCE(d.handover_completed, 0),
    d.rejection_reason,
    CASE 
        WHEN d.suggested_alternative_dates IS NOT NULL THEN d.suggested_alternative_dates
        ELSE NULL
    END,
    d.created_at,
    NOW()
FROM donations d
WHERE d.id NOT IN (SELECT donation_id FROM donation_meeting_schedule WHERE donation_id IS NOT NULL)
    AND (
        d.preferred_visit_date IS NOT NULL 
        OR d.preferred_visit_time IS NOT NULL
        OR d.meeting_date IS NOT NULL
        OR d.meeting_time IS NOT NULL
        OR d.meeting_location IS NOT NULL
        OR d.meeting_notes IS NOT NULL
        OR d.meeting_scheduled = 1
        OR d.meeting_completed = 1
        OR d.handover_completed = 1
        OR d.rejection_reason IS NOT NULL
        OR d.suggested_alternative_dates IS NOT NULL
    );

-- ========================================
-- STEP 3: MIGRATE CITY HALL DATA
-- ========================================

-- Insert city hall submission records for all donations with city hall data
INSERT INTO donation_city_hall_submission (
    donation_id,
    submitted_by,
    submission_date,
    approval_date,
    status,
    notes,
    created_at,
    updated_at
)
SELECT 
    d.id,
    'admin',
    d.city_hall_submission_date,
    d.city_hall_approval_date,
    CASE 
        WHEN d.city_hall_approval_date IS NOT NULL THEN 'approved'
        WHEN d.city_hall_submitted = 1 THEN 'submitted'
        WHEN d.city_hall_submission_date IS NOT NULL THEN 'submitted'
        ELSE 'not_required'
    END as status,
    CONCAT(
        'Migrated from donations table on ', NOW(), '. ',
        CASE WHEN d.city_hall_submitted = 1 THEN 'Was marked as submitted. ' ELSE '' END
    ) as notes,
    COALESCE(d.city_hall_submission_date, d.created_at),
    NOW()
FROM donations d
WHERE d.id NOT IN (SELECT donation_id FROM donation_city_hall_submission WHERE donation_id IS NOT NULL)
    AND (
        d.city_hall_submitted = 1
        OR d.city_hall_submission_date IS NOT NULL
        OR d.city_hall_approval_date IS NOT NULL
        OR d.final_approval_date IS NOT NULL
    );

-- ========================================
-- STEP 4: MIGRATE ACKNOWLEDGMENT DATA
-- ========================================

-- Insert acknowledgment records for donations that have been acknowledged
-- Note: We'll create separate records for different acknowledgment types

-- Regular acknowledgments
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
    d.created_at,
    'admin',
    d.donor_name,
    d.donor_email,
    'sent',
    d.created_at
FROM donations d
WHERE d.status = 'approved'
    AND d.id NOT IN (SELECT donation_id FROM donation_acknowledgments WHERE acknowledgment_type = 'email');

-- Gratitude emails
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
    'gratitude_email',
    d.final_approval_date,
    'admin',
    d.donor_name,
    d.donor_email,
    'sent',
    d.final_approval_date
FROM donations d
WHERE d.gratitude_email_sent = 1
    AND d.final_approval_date IS NOT NULL
    AND d.id NOT IN (SELECT donation_id FROM donation_acknowledgments WHERE acknowledgment_type = 'gratitude_email');

-- ========================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Create indexes on the new tables for better performance
CREATE INDEX IF NOT EXISTS idx_donation_meeting_schedule_donation_id ON donation_meeting_schedule(donation_id);
CREATE INDEX IF NOT EXISTS idx_donation_meeting_schedule_status ON donation_meeting_schedule(status);
CREATE INDEX IF NOT EXISTS idx_donation_meeting_schedule_date ON donation_meeting_schedule(meeting_date);

CREATE INDEX IF NOT EXISTS idx_donation_city_hall_submission_donation_id ON donation_city_hall_submission(donation_id);
CREATE INDEX IF NOT EXISTS idx_donation_city_hall_submission_status ON donation_city_hall_submission(status);
CREATE INDEX IF NOT EXISTS idx_donation_city_hall_submission_date ON donation_city_hall_submission(submission_date);

CREATE INDEX IF NOT EXISTS idx_donation_acknowledgments_donation_id ON donation_acknowledgments(donation_id);
CREATE INDEX IF NOT EXISTS idx_donation_acknowledgments_type ON donation_acknowledgments(acknowledgment_type);
CREATE INDEX IF NOT EXISTS idx_donation_acknowledgments_date ON donation_acknowledgments(sent_date);

-- ========================================
-- STEP 6: VERIFY MIGRATION
-- ========================================

-- Check migration results
SELECT 
    'MIGRATION SUMMARY' as summary_type,
    (SELECT COUNT(*) FROM donation_meeting_schedule) as meeting_records,
    (SELECT COUNT(*) FROM donation_city_hall_submission) as city_hall_records,
    (SELECT COUNT(*) FROM donation_acknowledgments) as acknowledgment_records;

-- Check for any unmigrated data
SELECT 
    'UNMIGRATED DATA CHECK' as check_type,
    COUNT(*) as donations_with_meeting_data_not_migrated
FROM donations d
LEFT JOIN donation_meeting_schedule dms ON d.id = dms.donation_id
WHERE dms.id IS NULL
    AND (
        d.preferred_visit_date IS NOT NULL 
        OR d.meeting_date IS NOT NULL
        OR d.meeting_scheduled = 1
    );

SELECT 
    'UNMIGRATED DATA CHECK' as check_type,
    COUNT(*) as donations_with_city_hall_data_not_migrated
FROM donations d
LEFT JOIN donation_city_hall_submission dchs ON d.id = dchs.donation_id
WHERE dchs.id IS NULL
    AND (
        d.city_hall_submitted = 1
        OR d.city_hall_submission_date IS NOT NULL
    );

-- ========================================
-- NOTES
-- ========================================
-- After running this migration:
-- 1. All meeting data will be in donation_meeting_schedule
-- 2. All city hall data will be in donation_city_hall_submission  
-- 3. All acknowledgment data will be in donation_acknowledgments
-- 4. The donations table will still have the old fields (for now)
-- 5. Next step: Update the code to use these dedicated tables
-- 6. Final step: Remove redundant fields from donations table






