-- Update Gender Enum for Event Registrations
-- This script updates the gender enum to include lgbtq instead of other

USE museosmart;

-- ========================================
-- 1. UPDATE EVENT_REGISTRATIONS GENDER ENUM
-- ========================================

-- Update the gender enum to include lgbtq
ALTER TABLE event_registrations 
MODIFY COLUMN gender ENUM('male', 'female', 'lgbtq') NOT NULL;

-- ========================================
-- 2. UPDATE EXISTING RECORDS
-- ========================================

-- Update any existing 'other' records to 'lgbtq'
UPDATE event_registrations 
SET gender = 'lgbtq' 
WHERE gender = 'other';

-- ========================================
-- 3. VERIFICATION
-- ========================================

-- Show the updated table structure
DESCRIBE event_registrations;

-- Show sample data with new gender values
SELECT 
    id, 
    firstname, 
    lastname, 
    gender, 
    email, 
    visitor_type 
FROM event_registrations 
LIMIT 5;

-- Show gender distribution
SELECT 
    gender, 
    COUNT(*) as count 
FROM event_registrations 
GROUP BY gender;

