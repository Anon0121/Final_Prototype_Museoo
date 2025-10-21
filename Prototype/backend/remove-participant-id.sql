-- Remove participant_id column and add email+event unique constraint
-- This allows same person to register for multiple events but prevents duplicate registrations

-- Step 1: Remove the participant_id column entirely
ALTER TABLE event_registrations DROP COLUMN participant_id;

-- Step 2: Add unique constraint on (email, event_id) to prevent duplicate registrations
-- This allows same email to register for different events but not the same event twice
ALTER TABLE event_registrations ADD UNIQUE KEY unique_email_event (email, event_id);

-- Step 3: Verify the changes
DESCRIBE event_registrations;

