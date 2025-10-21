-- Remove method column from donation_details table
-- Since we only accept cash payments now, the method column is no longer needed

ALTER TABLE donation_details 
DROP COLUMN method;

-- Update any existing records to ensure data consistency
-- (This is optional since we're dropping the column anyway)
