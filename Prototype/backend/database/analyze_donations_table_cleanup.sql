-- Analyze donations table for cleanup opportunities
-- This script shows what can be safely removed

-- ========================================
-- CURRENT DONATIONS TABLE ANALYSIS
-- ========================================

-- Show current structure
DESCRIBE donations;

-- ========================================
-- IDENTIFY REDUNDANT FIELDS
-- ========================================

SELECT 
    'REDUNDANT FIELDS ANALYSIS' as analysis_type,
    '' as field_name,
    '' as reason,
    '' as target_table
UNION ALL
SELECT 
    'MEETING FIELDS' as analysis_type,
    'preferred_visit_date' as field_name,
    'Meeting scheduling data' as reason,
    'donation_meeting_schedule' as target_table
UNION ALL
SELECT 
    'MEETING FIELDS' as analysis_type,
    'preferred_visit_time' as field_name,
    'Meeting scheduling data' as reason,
    'donation_meeting_schedule' as target_table
UNION ALL
SELECT 
    'MEETING FIELDS' as analysis_type,
    'meeting_scheduled' as field_name,
    'Meeting status flag' as reason,
    'donation_meeting_schedule' as target_table
UNION ALL
SELECT 
    'MEETING FIELDS' as analysis_type,
    'meeting_date' as field_name,
    'Meeting scheduling data' as reason,
    'donation_meeting_schedule' as target_table
UNION ALL
SELECT 
    'MEETING FIELDS' as analysis_type,
    'meeting_time' as field_name,
    'Meeting scheduling data' as reason,
    'donation_meeting_schedule' as target_table
UNION ALL
SELECT 
    'MEETING FIELDS' as analysis_type,
    'meeting_location' as field_name,
    'Meeting details' as reason,
    'donation_meeting_schedule' as target_table
UNION ALL
SELECT 
    'MEETING FIELDS' as analysis_type,
    'meeting_notes' as field_name,
    'Meeting details' as reason,
    'donation_meeting_schedule' as target_table
UNION ALL
SELECT 
    'MEETING FIELDS' as analysis_type,
    'meeting_completed' as field_name,
    'Meeting status flag' as reason,
    'donation_meeting_schedule' as target_table
UNION ALL
SELECT 
    'MEETING FIELDS' as analysis_type,
    'handover_completed' as field_name,
    'Meeting status flag' as reason,
    'donation_meeting_schedule' as target_table
UNION ALL
SELECT 
    'CITY HALL FIELDS' as analysis_type,
    'city_hall_submitted' as field_name,
    'City hall submission status' as reason,
    'donation_city_hall_submission' as target_table
UNION ALL
SELECT 
    'CITY HALL FIELDS' as analysis_type,
    'city_hall_submission_date' as field_name,
    'City hall submission data' as reason,
    'donation_city_hall_submission' as target_table
UNION ALL
SELECT 
    'CITY HALL FIELDS' as analysis_type,
    'city_hall_approval_date' as field_name,
    'City hall approval data' as reason,
    'donation_city_hall_submission' as target_table
UNION ALL
SELECT 
    'VISITOR FIELDS' as analysis_type,
    'visitor_ip' as field_name,
    'Visitor tracking (not needed for donors)' as reason,
    'REMOVE' as target_table
UNION ALL
SELECT 
    'VISITOR FIELDS' as analysis_type,
    'visitor_user_agent' as field_name,
    'Visitor tracking (not needed for donors)' as reason,
    'REMOVE' as target_table
UNION ALL
SELECT 
    'OTHER FIELDS' as analysis_type,
    'rejection_reason' as field_name,
    'Should be in meeting_schedule or workflow_log' as reason,
    'donation_meeting_schedule' as target_table
UNION ALL
SELECT 
    'OTHER FIELDS' as analysis_type,
    'suggested_alternative_dates' as field_name,
    'Should be in meeting_schedule' as reason,
    'donation_meeting_schedule' as target_table;

-- ========================================
-- COUNT DATA IN REDUNDANT FIELDS
-- ========================================

SELECT 
    'DATA COUNT ANALYSIS' as analysis_type,
    COUNT(*) as total_donations,
    SUM(CASE WHEN preferred_visit_date IS NOT NULL THEN 1 ELSE 0 END) as has_preferred_visit_date,
    SUM(CASE WHEN meeting_date IS NOT NULL THEN 1 ELSE 0 END) as has_meeting_date,
    SUM(CASE WHEN meeting_scheduled = 1 THEN 1 ELSE 0 END) as meeting_scheduled_count,
    SUM(CASE WHEN city_hall_submitted = 1 THEN 1 ELSE 0 END) as city_hall_submitted_count,
    SUM(CASE WHEN visitor_ip IS NOT NULL THEN 1 ELSE 0 END) as has_visitor_ip,
    SUM(CASE WHEN rejection_reason IS NOT NULL THEN 1 ELSE 0 END) as has_rejection_reason
FROM donations;

-- ========================================
-- CHECK IF DEDICATED TABLES EXIST
-- ========================================

SELECT 
    'DEDICATED TABLES CHECK' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'donation_meeting_schedule') 
         THEN 'EXISTS' ELSE 'MISSING' END as meeting_schedule_table,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'donation_city_hall_submission') 
         THEN 'EXISTS' ELSE 'MISSING' END as city_hall_table,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'donation_acknowledgments') 
         THEN 'EXISTS' ELSE 'MISSING' END as acknowledgments_table;

-- ========================================
-- RECOMMENDED CLEANUP STRATEGY
-- ========================================

SELECT 
    'CLEANUP STRATEGY' as strategy_type,
    'PHASE 1: Remove visitor fields (SAFE)' as step_1,
    'PHASE 2: Migrate data to dedicated tables' as step_2,
    'PHASE 3: Update code to use dedicated tables' as step_3,
    'PHASE 4: Remove redundant fields (AFTER code update)' as step_4
UNION ALL
SELECT 
    'FIELDS TO REMOVE IMMEDIATELY' as strategy_type,
    'visitor_ip' as step_1,
    'visitor_user_agent' as step_2,
    'source enum value: visitor' as step_3,
    'TOTAL: 3 fields' as step_4
UNION ALL
SELECT 
    'FIELDS TO MIGRATE THEN REMOVE' as strategy_type,
    '9 meeting-related fields' as step_1,
    '3 city hall fields' as step_2,
    '2 other fields' as step_3,
    'TOTAL: 14 fields' as step_4
UNION ALL
SELECT 
    'FIELDS TO KEEP' as strategy_type,
    'Core donor info (name, email, contact)' as step_1,
    'Type, status, processing_stage' as step_2,
    'Dates (request_date, created_at)' as step_3,
    'TOTAL: ~12 fields' as step_4;






