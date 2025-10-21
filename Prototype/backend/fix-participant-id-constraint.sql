-- Fix participant_id constraint to allow multiple registrations per participant
-- This removes the UNIQUE constraint from participant_id and adds a composite unique constraint

-- Step 1: Remove the existing UNIQUE constraint from participant_id
ALTER TABLE event_registrations DROP INDEX participant_id;

-- Step 2: Add a composite unique constraint on (participant_id, event_id)
-- This prevents the same participant from registering twice for the same event
-- but allows them to register for multiple different events
ALTER TABLE event_registrations ADD UNIQUE KEY unique_participant_event (participant_id, event_id);

-- Step 3: Verify the changes
-- You can run this to check the table structure after the changes
DESCRIBE event_registrations;

