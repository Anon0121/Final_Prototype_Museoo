-- Remove date_received field from donations table
-- This migration removes the date_received field since it's no longer needed
-- The request_date field will be used instead for tracking when donations were submitted

-- Remove the date_received column from donations table
ALTER TABLE donations DROP COLUMN date_received;

-- Update any existing records to ensure request_date is set
UPDATE donations SET request_date = created_at WHERE request_date IS NULL;

-- Add a comment to document the change
ALTER TABLE donations COMMENT = 'Donations table updated to remove date_received field - using request_date instead';

