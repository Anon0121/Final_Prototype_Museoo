-- SAFE removal of redundant fields from donations table
-- 
-- IMPORTANT: This script has 3 parts:
-- 1. IMMEDIATE removal (safe - no code dependencies)
-- 2. Data migration (safe - copies data to dedicated tables)
-- 3. Conditional removal (only after code updates)
--
-- Run each part separately and test!

-- ========================================
-- PART 1: IMMEDIATE REMOVAL (SAFE)
-- ========================================
-- These fields have no code dependencies and can be removed immediately

-- Remove visitor tracking fields (donors don't need visitor tracking)
ALTER TABLE donations 
  DROP COLUMN IF EXISTS visitor_ip,
  DROP COLUMN IF EXISTS visitor_user_agent;

-- Update source enum to remove 'visitor' option
ALTER TABLE donations 
  MODIFY COLUMN source ENUM('admin', 'staff', 'donor_request') DEFAULT 'donor_request';

-- Update existing records
UPDATE donations 
SET source = 'donor_request' 
WHERE source = 'visitor' OR source IS NULL;

-- ========================================
-- PART 2: DATA MIGRATION (SAFE - BACKUP)
-- ========================================
-- This copies data to dedicated tables but doesn't remove anything yet

-- Migrate meeting data to donation_meeting_schedule
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
        WHEN d.meeting_completed = 1 THEN 'completed'
        WHEN d.meeting_scheduled = 1 THEN 'scheduled'
        WHEN d.preferred_visit_date IS NOT NULL THEN 'requested'
        ELSE 'pending'
    END as status,
    d.created_at,
    NOW()
FROM donations d
WHERE d.id NOT IN (SELECT donation_id FROM donation_meeting_schedule WHERE donation_id IS NOT NULL)
    AND (
        d.preferred_visit_date IS NOT NULL 
        OR d.meeting_date IS NOT NULL
        OR d.meeting_scheduled = 1
        OR d.meeting_completed = 1
    );

-- Migrate city hall data to donation_city_hall_submission
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
        WHEN d.city_hall_submitted = 1 THEN 'submitted'
        ELSE 'not_required'
    END as status,
    'Migrated from donations table',
    d.city_hall_submission_date OR d.created_at
FROM donations d
WHERE d.id NOT IN (SELECT donation_id FROM donation_city_hall_submission WHERE donation_id IS NOT NULL)
    AND (
        d.city_hall_submitted = 1
        OR d.city_hall_submission_date IS NOT NULL
        OR d.city_hall_approval_date IS NOT NULL
    );

-- ========================================
-- PART 3: CONDITIONAL REMOVAL (ONLY AFTER CODE UPDATE)
-- ========================================
-- ⚠️  DO NOT RUN THIS PART YET! 
-- ⚠️  Only run after updating the code in donations.js
-- ⚠️  The code currently uses these fields!

/*
-- Remove meeting-related fields (AFTER code is updated)
ALTER TABLE donations
  DROP COLUMN IF EXISTS preferred_visit_date,
  DROP COLUMN IF EXISTS preferred_visit_time,
  DROP COLUMN IF EXISTS meeting_scheduled,
  DROP COLUMN IF EXISTS meeting_date,
  DROP COLUMN IF EXISTS meeting_time,
  DROP COLUMN IF EXISTS meeting_location,
  DROP COLUMN IF EXISTS meeting_notes,
  DROP COLUMN IF EXISTS meeting_completed,
  DROP COLUMN IF EXISTS handover_completed;

-- Remove city hall fields (AFTER code is updated)
ALTER TABLE donations
  DROP COLUMN IF EXISTS city_hall_submitted,
  DROP COLUMN IF EXISTS city_hall_submission_date,
  DROP COLUMN IF EXISTS city_hall_approval_date;

-- Remove other redundant fields (AFTER code is updated)
ALTER TABLE donations
  DROP COLUMN IF EXISTS rejection_reason,
  DROP COLUMN IF EXISTS suggested_alternative_dates;

-- Clean up processing_stage enum (AFTER code is updated)
-- Remove stages that will be managed by dedicated tables
ALTER TABLE donations
  MODIFY COLUMN processing_stage ENUM(
    'request_received', 
    'under_review', 
    'approved', 
    'rejected',
    'completed'
  ) DEFAULT 'request_received';
*/

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check what was removed in Part 1
SELECT 
    'IMMEDIATE CLEANUP COMPLETE' as status,
    'visitor_ip: REMOVED' as field_1,
    'visitor_user_agent: REMOVED' as field_2,
    'source enum: UPDATED' as field_3;

-- Check data migration
SELECT 
    'DATA MIGRATION STATUS' as status,
    (SELECT COUNT(*) FROM donation_meeting_schedule) as meeting_records,
    (SELECT COUNT(*) FROM donation_city_hall_submission) as city_hall_records;

-- Show remaining fields that need code updates before removal
SELECT 
    'FIELDS STILL IN DONATIONS TABLE' as status,
    'preferred_visit_date' as meeting_field_1,
    'meeting_date' as meeting_field_2,
    'city_hall_submitted' as city_hall_field_1,
    'rejection_reason' as other_field_1;






