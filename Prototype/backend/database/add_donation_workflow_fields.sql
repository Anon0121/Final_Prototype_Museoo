-- Add donation workflow fields to donations table
-- This migration adds the necessary fields for the new donation process

-- First, add the processing_stage column if it doesn't exist
ALTER TABLE donations 
ADD COLUMN processing_stage ENUM(
    'request_received', 
    'under_review', 
    'meeting_scheduled', 
    'meeting_completed', 
    'handover_completed', 
    'city_hall_processing', 
    'city_hall_approved', 
    'final_approved', 
    'completed',
    'rejected'
) DEFAULT 'request_received' AFTER status;

-- Add new fields to donations table for the new process
ALTER TABLE donations 
ADD COLUMN request_date TIMESTAMP NULL AFTER created_at,
ADD COLUMN preferred_visit_date DATE NULL AFTER request_date,
ADD COLUMN preferred_visit_time TIME NULL AFTER preferred_visit_date,
ADD COLUMN meeting_scheduled BOOLEAN DEFAULT FALSE AFTER preferred_visit_time,
ADD COLUMN meeting_date DATE NULL AFTER meeting_scheduled,
ADD COLUMN meeting_time TIME NULL AFTER meeting_date,
ADD COLUMN meeting_location VARCHAR(255) NULL AFTER meeting_time,
ADD COLUMN meeting_notes TEXT NULL AFTER meeting_location,
ADD COLUMN meeting_completed BOOLEAN DEFAULT FALSE AFTER meeting_notes,
ADD COLUMN handover_completed BOOLEAN DEFAULT FALSE AFTER meeting_completed,
ADD COLUMN city_hall_submitted BOOLEAN DEFAULT FALSE AFTER handover_completed,
ADD COLUMN city_hall_submission_date DATE NULL AFTER city_hall_submitted,
ADD COLUMN city_hall_approval_date DATE NULL AFTER city_hall_submission_date,
ADD COLUMN final_approval_date DATE NULL AFTER city_hall_approval_date,
ADD COLUMN gratitude_email_sent BOOLEAN DEFAULT FALSE AFTER final_approval_date;

-- Update existing donations to have request_date as created_at
UPDATE donations SET request_date = created_at WHERE request_date IS NULL;

-- Update existing donations to set appropriate processing_stage
UPDATE donations SET processing_stage = 'request_received' WHERE processing_stage IS NULL;

