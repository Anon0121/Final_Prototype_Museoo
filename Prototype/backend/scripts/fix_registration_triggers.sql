-- Fix Event Registration Triggers
-- This script updates the triggers to properly handle the approval_status system

USE museosmart;

-- ========================================
-- 1. DROP EXISTING TRIGGERS
-- ========================================

DROP TRIGGER IF EXISTS update_registration_count_insert;
DROP TRIGGER IF EXISTS update_registration_count_update;
DROP TRIGGER IF EXISTS update_registration_count_delete;

-- ========================================
-- 2. CREATE UPDATED TRIGGERS
-- ========================================

DELIMITER //

-- Trigger for INSERT operations
CREATE TRIGGER update_registration_count_insert
AFTER INSERT ON event_registrations
FOR EACH ROW
BEGIN
    UPDATE activities 
    SET current_registrations = (
        SELECT COUNT(*) 
        FROM event_registrations 
        WHERE event_id = NEW.event_id AND approval_status = 'approved'
    )
    WHERE id = NEW.event_id;
END//

-- Trigger for UPDATE operations
CREATE TRIGGER update_registration_count_update
AFTER UPDATE ON event_registrations
FOR EACH ROW
BEGIN
    UPDATE activities 
    SET current_registrations = (
        SELECT COUNT(*) 
        FROM event_registrations 
        WHERE event_id = NEW.event_id AND approval_status = 'approved'
    )
    WHERE id = NEW.event_id;
END//

-- Trigger for DELETE operations
CREATE TRIGGER update_registration_count_delete
AFTER DELETE ON event_registrations
FOR EACH ROW
BEGIN
    UPDATE activities 
    SET current_registrations = (
        SELECT COUNT(*) 
        FROM event_registrations 
        WHERE event_id = OLD.event_id AND approval_status = 'approved'
    )
    WHERE id = OLD.event_id;
END//

DELIMITER ;

-- ========================================
-- 3. VERIFICATION
-- ========================================

-- Show the updated triggers
SHOW TRIGGERS LIKE 'update_registration_count%';

-- Show current registration counts for all events
SELECT 
    a.id,
    a.title,
    a.max_capacity,
    a.current_registrations,
    (a.max_capacity - a.current_registrations) as available_slots,
    COUNT(er.id) as total_registrations,
    COUNT(CASE WHEN er.approval_status = 'approved' THEN 1 END) as approved_registrations,
    COUNT(CASE WHEN er.approval_status = 'pending' THEN 1 END) as pending_registrations,
    COUNT(CASE WHEN er.approval_status = 'rejected' THEN 1 END) as rejected_registrations
FROM activities a
LEFT JOIN event_registrations er ON a.id = er.event_id
WHERE a.type = 'event'
GROUP BY a.id, a.title, a.max_capacity, a.current_registrations
ORDER BY a.id;

-- ========================================
-- 4. UPDATE CURRENT COUNTS
-- ========================================

-- Update all event registration counts to match the current data
UPDATE activities a
SET current_registrations = (
    SELECT COUNT(*) 
    FROM event_registrations er
    WHERE er.event_id = a.id AND er.approval_status = 'approved'
)
WHERE a.type = 'event';

-- Show final verification
SELECT 
    'Final Counts' as status,
    a.id,
    a.title,
    a.current_registrations,
    (a.max_capacity - a.current_registrations) as available_slots
FROM activities a
WHERE a.type = 'event'
ORDER BY a.id;
