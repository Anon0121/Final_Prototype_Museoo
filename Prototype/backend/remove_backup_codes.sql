-- Remove backup code columns from database
-- Run this script in your database management tool (phpMyAdmin, MySQL Workbench, etc.)

USE museoo;

-- Remove backup_code column from bookings table
ALTER TABLE bookings DROP COLUMN IF EXISTS backup_code;

-- Remove backup_code column from visitors table (if it exists)
ALTER TABLE visitors DROP COLUMN IF EXISTS backup_code;

-- Remove backup_code column from additional_visitors table (if it exists)
ALTER TABLE additional_visitors DROP COLUMN IF EXISTS backup_code;

-- Drop the backup_codes table if it exists (from previous implementation)
DROP TABLE IF EXISTS backup_codes;

-- Show confirmation
SELECT 'Backup code columns removed successfully!' as message;

