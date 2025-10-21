-- Remove additional_visitors table since we're using unified visitors table
USE museosmart;

-- ========================================
-- 1. VERIFY DATA MIGRATION
-- ========================================

-- Check if there's any data in additional_visitors that hasn't been migrated
SELECT 
    'additional_visitors' as table_name,
    COUNT(*) as record_count
FROM additional_visitors
UNION ALL
SELECT 
    'visitors (additional)' as table_name,
    COUNT(*) as record_count
FROM visitors 
WHERE is_main_visitor = FALSE;

-- ========================================
-- 2. SAFETY CHECK - ENSURE ALL DATA IS MIGRATED
-- ========================================

-- Check if there are any additional_visitors records that don't have corresponding visitors
SELECT 
    av.token_id,
    av.booking_id,
    av.email,
    av.status
FROM additional_visitors av
LEFT JOIN visitors v ON v.booking_id = av.booking_id AND v.email = av.email AND v.is_main_visitor = FALSE
WHERE v.visitor_id IS NULL;

-- ========================================
-- 3. DROP THE TABLE
-- ========================================

-- Drop the additional_visitors table
DROP TABLE IF EXISTS additional_visitors;

-- ========================================
-- 4. VERIFICATION
-- ========================================

-- Verify the table is gone
SELECT 'additional_visitors table successfully removed' as status;

-- Show remaining tables
SHOW TABLES;

-- Show final visitor distribution
SELECT 
    is_main_visitor,
    COUNT(*) as count,
    COUNT(CASE WHEN status = 'visited' THEN 1 END) as checked_in
FROM visitors 
GROUP BY is_main_visitor;
