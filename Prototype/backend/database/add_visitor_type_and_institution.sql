-- Add visitor_type and institution columns to visitors table
USE museosmart;

-- Add visitor_type column to visitors table
ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS visitor_type ENUM('local', 'foreign') DEFAULT 'local' AFTER nationality;

-- Add institution column to visitors table
ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS institution VARCHAR(255) NULL AFTER visitor_type;

-- Add checkin_time column to visitors table if it doesn't exist
ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS checkin_time TIMESTAMP NULL AFTER status;

-- Add qr_code column to visitors table if it doesn't exist
ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS qr_code LONGTEXT NULL AFTER institution;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visitors_visitor_type ON visitors(visitor_type);
CREATE INDEX IF NOT EXISTS idx_visitors_institution ON visitors(institution);
CREATE INDEX IF NOT EXISTS idx_visitors_checkin_time ON visitors(checkin_time);

-- Show the updated table structure
DESCRIBE visitors;

-- Show sample data to verify the changes
SELECT visitor_id, first_name, last_name, visitor_type, institution, checkin_time FROM visitors LIMIT 5;
