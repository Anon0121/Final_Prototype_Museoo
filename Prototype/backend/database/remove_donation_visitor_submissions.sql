-- Remove donation_visitor_submissions table and related relationships
-- This migration removes the incorrect visitor-donation linking
-- Donations should ONLY be made by DONORS, not visitors or participants

-- Drop the index first
DROP INDEX IF EXISTS idx_donation_visitor_submissions_status ON donation_visitor_submissions;
DROP INDEX IF EXISTS idx_donation_visitor_submissions_date ON donation_visitor_submissions;

-- Drop the foreign key relationship between visitors and donation_visitor_submissions
-- Note: This relationship should not exist as per the correct design
ALTER TABLE donation_visitor_submissions DROP FOREIGN KEY IF EXISTS donation_visitor_submissions_ibfk_1;
ALTER TABLE donation_visitor_submissions DROP FOREIGN KEY IF EXISTS donation_visitor_submissions_ibfk_2;

-- Drop the donation_visitor_submissions table
DROP TABLE IF EXISTS donation_visitor_submissions;

-- Remove visitor-specific fields from donations table
-- These fields were incorrectly added for visitor tracking
ALTER TABLE donations 
  DROP COLUMN IF EXISTS visitor_ip,
  DROP COLUMN IF EXISTS visitor_user_agent;

-- Update source enum to remove 'visitor' option
-- Donations should only come from 'admin' or 'staff' (donors contact staff to make donations)
ALTER TABLE donations 
  MODIFY COLUMN source ENUM('admin', 'staff', 'donor_request') DEFAULT 'donor_request';

-- Update existing donations that were marked as from 'visitor' to 'donor_request'
UPDATE donations 
SET source = 'donor_request' 
WHERE source = 'visitor' OR source IS NULL;

-- Add index for source if not exists
CREATE INDEX IF NOT EXISTS idx_donations_source ON donations(source);

-- Log the migration
-- Note: This assumes a migration log table exists, if not, this will fail gracefully
INSERT INTO migration_log (migration_name, executed_at, description) 
VALUES (
  'remove_donation_visitor_submissions', 
  NOW(), 
  'Removed donation_visitor_submissions table and visitor-specific fields from donations. Donations are now donor-only.'
) ON DUPLICATE KEY UPDATE executed_at = NOW();







