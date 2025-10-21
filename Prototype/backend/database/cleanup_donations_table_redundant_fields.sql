-- Clean up donations table by removing redundant fields
-- These fields have dedicated tables and should not be duplicated in the main table
-- 
-- This migration removes:
-- 1. Meeting-related fields (use donation_meeting_schedule table)
-- 2. City hall submission fields (use donation_city_hall_submission table)
-- 3. Acknowledgment fields (use donation_acknowledgments table)
-- 4. Date received field (use request_date instead)
--
-- IMPORTANT: Run this AFTER data has been migrated to the respective tables

-- ========================================
-- 1. REMOVE MEETING-RELATED FIELDS
-- ========================================
-- These should be in donation_meeting_schedule table

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

-- ========================================
-- 2. REMOVE CITY HALL SUBMISSION FIELDS
-- ========================================
-- These should be in donation_city_hall_submission table

ALTER TABLE donations
  DROP COLUMN IF EXISTS city_hall_submitted,
  DROP COLUMN IF EXISTS city_hall_submission_date,
  DROP COLUMN IF EXISTS city_hall_approval_date,
  DROP COLUMN IF EXISTS city_acknowledgment_required,
  DROP COLUMN IF EXISTS city_acknowledgment_sent,
  DROP COLUMN IF EXISTS city_acknowledgment_date;

-- ========================================
-- 3. REMOVE ACKNOWLEDGMENT FIELDS
-- ========================================
-- These should be in donation_acknowledgments table

ALTER TABLE donations
  DROP COLUMN IF EXISTS acknowledgment_sent,
  DROP COLUMN IF EXISTS acknowledgment_date,
  DROP COLUMN IF EXISTS acknowledgment_type,
  DROP COLUMN IF EXISTS gratitude_email_sent;

-- ========================================
-- 4. REMOVE OTHER REDUNDANT FIELDS
-- ========================================

-- Remove date_received (use request_date instead)
ALTER TABLE donations
  DROP COLUMN IF EXISTS date_received;

-- Remove rejection_reason and suggested_alternative_dates (should be in meeting_schedule or workflow_log)
ALTER TABLE donations
  DROP COLUMN IF EXISTS rejection_reason,
  DROP COLUMN IF EXISTS suggested_alternative_dates;

-- ========================================
-- 5. CLEAN UP DONATION_DETAILS TABLE
-- ========================================
-- Remove document tracking fields (should be in donation_documents table)

ALTER TABLE donation_details
  DROP COLUMN IF EXISTS documents_uploaded,
  DROP COLUMN IF EXISTS documents_count;

-- ========================================
-- FINAL DONATIONS TABLE STRUCTURE (CLEAN)
-- ========================================
-- After this migration, donations table should only have:
-- 
-- Core Fields:
--   - id (PRIMARY KEY)
--   - donor_name, donor_email, donor_contact (donor info)
--   - type (monetary, artifact, document, loan)
--   - notes (general notes)
--   - status (pending, approved, rejected)
--   - created_at (timestamp)
-- 
-- Workflow Fields:
--   - processing_stage (workflow stage tracking)
--   - assigned_to (staff member assigned)
--   - priority (low, medium, high, urgent)
--   - source (donor_request, admin, staff)
--   - admin_notes (admin notes)
-- 
-- Date Fields:
--   - request_date (when donor requested)
--   - final_approval_date (when finally approved)
-- 
-- Display Fields:
--   - public_visible (whether to show publicly)
--
-- All other details should be in their respective tables:
--   - donation_details (amounts, descriptions, values, conditions)
--   - donation_documents (file uploads)
--   - donation_meeting_schedule (meeting scheduling)
--   - donation_city_hall_submission (city hall approvals)
--   - donation_acknowledgments (thank you letters, certificates)
--   - donation_workflow_log (audit trail)
--   - donation_requirements (requirements tracking)
--   - donation_public_display (public display settings)

-- Add comments to document the clean structure
ALTER TABLE donations COMMENT = 'Clean donations table - all related data moved to dedicated tables';
ALTER TABLE donation_details COMMENT = 'Donation monetary/item details - no document tracking';







