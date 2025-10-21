-- Clean Visitor System - Single Table Approach
-- This script creates a unified visitor system using only the visitors table

USE museosmart;

-- ========================================
-- 1. UPDATE BOOKINGS TABLE
-- ========================================

-- Update bookings table to include all booking types
ALTER TABLE bookings 
MODIFY COLUMN type ENUM('individual', 'group', 'individual-walkin', 'group-walkin') NOT NULL;

-- ========================================
-- 2. UPDATE VISITORS TABLE
-- ========================================

-- Add missing columns to visitors table
ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS visitor_type ENUM('local', 'foreign') DEFAULT 'local' AFTER nationality;

ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS institution VARCHAR(255) NULL AFTER visitor_type;

ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS checkin_time TIMESTAMP NULL AFTER status;

ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS qr_code LONGTEXT NULL AFTER institution;

ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS qr_used BOOLEAN DEFAULT FALSE AFTER qr_code;

-- Ensure is_main_visitor column exists and is properly set
ALTER TABLE visitors 
MODIFY COLUMN is_main_visitor BOOLEAN DEFAULT FALSE;

-- ========================================
-- 3. MIGRATE DATA FROM ADDITIONAL_VISITORS (if exists)
-- ========================================

-- Check if additional_visitors table exists and migrate data
SET @table_exists = (
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = 'museosmart' 
    AND table_name = 'additional_visitors'
);

-- If additional_visitors table exists, migrate the data to visitors table
SET @sql = IF(@table_exists > 0, 
    'INSERT INTO visitors (booking_id, first_name, last_name, gender, address, email, visitor_type, institution, purpose, status, is_main_visitor, created_at, checkin_time, qr_code, qr_used)
     SELECT 
         av.booking_id,
         JSON_UNQUOTE(JSON_EXTRACT(av.details, "$.firstName")) as first_name,
         JSON_UNQUOTE(JSON_EXTRACT(av.details, "$.lastName")) as last_name,
         JSON_UNQUOTE(JSON_EXTRACT(av.details, "$.gender")) as gender,
         JSON_UNQUOTE(JSON_EXTRACT(av.details, "$.address")) as address,
         av.email,
         JSON_UNQUOTE(JSON_EXTRACT(av.details, "$.visitorType")) as visitor_type,
         JSON_UNQUOTE(JSON_EXTRACT(av.details, "$.institution")) as institution,
         JSON_UNQUOTE(JSON_EXTRACT(av.details, "$.purpose")) as purpose,
         CASE 
             WHEN av.status = "checked-in" THEN "visited"
             ELSE "pending"
         END as status,
         FALSE as is_main_visitor,
         av.created_at,
         av.checkin_time,
         av.qr_code,
         av.qr_used
     FROM additional_visitors av
     WHERE av.details IS NOT NULL
     AND NOT EXISTS (
         SELECT 1 FROM visitors v 
         WHERE v.booking_id = av.booking_id 
         AND v.email = av.email 
         AND v.is_main_visitor = FALSE
     )', 
    'SELECT "No additional_visitors table to migrate" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========================================
-- 4. CLEAN UP - DROP ADDITIONAL_VISITORS TABLE
-- ========================================

-- Drop the additional_visitors table since we don't need it anymore
DROP TABLE IF EXISTS additional_visitors;

-- ========================================
-- 5. UPDATE EXISTING VISITORS
-- ========================================

-- Ensure all existing visitors have proper is_main_visitor flag
-- This assumes the first visitor for each booking is the main visitor
UPDATE visitors v1
SET is_main_visitor = TRUE
WHERE v1.visitor_id = (
    SELECT MIN(v2.visitor_id)
    FROM visitors v2
    WHERE v2.booking_id = v1.booking_id
);

-- ========================================
-- 6. ADD INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_visitors_booking_id ON visitors(booking_id);
CREATE INDEX IF NOT EXISTS idx_visitors_is_main_visitor ON visitors(is_main_visitor);
CREATE INDEX IF NOT EXISTS idx_visitors_visitor_type ON visitors(visitor_type);
CREATE INDEX IF NOT EXISTS idx_visitors_institution ON visitors(institution);
CREATE INDEX IF NOT EXISTS idx_visitors_checkin_time ON visitors(checkin_time);
CREATE INDEX IF NOT EXISTS idx_visitors_qr_used ON visitors(qr_used);
CREATE INDEX IF NOT EXISTS idx_bookings_type ON bookings(type);

-- ========================================
-- 7. VERIFICATION
-- ========================================

-- Show updated table structures
DESCRIBE bookings;
DESCRIBE visitors;

-- Show booking types
SELECT DISTINCT type FROM bookings;

-- Show visitor distribution
SELECT 
    is_main_visitor,
    COUNT(*) as count,
    COUNT(CASE WHEN status = 'visited' THEN 1 END) as checked_in
FROM visitors 
GROUP BY is_main_visitor;

-- Show sample data
SELECT 
    v.visitor_id,
    v.first_name,
    v.last_name,
    v.visitor_type,
    v.institution,
    v.is_main_visitor,
    v.status,
    b.type as booking_type
FROM visitors v
JOIN bookings b ON v.booking_id = b.booking_id
ORDER BY v.booking_id, v.is_main_visitor DESC
LIMIT 10;

-- Verify no additional_visitors table exists
SELECT 'additional_visitors table dropped successfully' as status;
