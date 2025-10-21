-- Updated Event Registration System
-- This script sets up the proper event registration system with required fields

USE museosmart;

-- ========================================
-- 1. UPDATE ACTIVITIES TABLE FOR CAPACITY
-- ========================================

-- Add capacity fields to activities table (for exhibits/events)
ALTER TABLE activities 
ADD COLUMN max_capacity INT DEFAULT 50,
ADD COLUMN current_registrations INT DEFAULT 0;

-- ========================================
-- 2. DROP OLD EVENT_REGISTRATIONS TABLE
-- ========================================

-- Drop the old table if it exists
DROP TABLE IF EXISTS event_registrations;

-- ========================================
-- 3. CREATE NEW EVENT_REGISTRATIONS TABLE
-- ========================================

-- Create new event_registrations table with required fields
CREATE TABLE event_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    email VARCHAR(255) NOT NULL,
    visitor_type ENUM('local', 'foreign') NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('registered', 'checked_in', 'cancelled') DEFAULT 'registered',
    qr_code VARCHAR(255),
    checkin_time TIMESTAMP NULL,
    FOREIGN KEY (event_id) REFERENCES activities(id) ON DELETE CASCADE
);

-- ========================================
-- 4. INDEXES FOR PERFORMANCE
-- ========================================

-- Add indexes for better query performance
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_email ON event_registrations(email);
CREATE INDEX idx_event_registrations_status ON event_registrations(status);
CREATE INDEX idx_event_registrations_visitor_type ON event_registrations(visitor_type);

-- ========================================
-- 5. TRIGGER TO UPDATE CAPACITY
-- ========================================

-- Create trigger to automatically update current_registrations count
DELIMITER //
CREATE TRIGGER update_registration_count_insert
AFTER INSERT ON event_registrations
FOR EACH ROW
BEGIN
    UPDATE activities 
    SET current_registrations = (
        SELECT COUNT(*) 
        FROM event_registrations 
        WHERE event_id = NEW.event_id AND status != 'cancelled'
    )
    WHERE id = NEW.event_id;
END//

CREATE TRIGGER update_registration_count_update
AFTER UPDATE ON event_registrations
FOR EACH ROW
BEGIN
    UPDATE activities 
    SET current_registrations = (
        SELECT COUNT(*) 
        FROM event_registrations 
        WHERE event_id = NEW.event_id AND status != 'cancelled'
    )
    WHERE id = NEW.event_id;
END//

CREATE TRIGGER update_registration_count_delete
AFTER DELETE ON event_registrations
FOR EACH ROW
BEGIN
    UPDATE activities 
    SET current_registrations = (
        SELECT COUNT(*) 
        FROM event_registrations 
        WHERE event_id = OLD.event_id AND status != 'cancelled'
    )
    WHERE id = OLD.event_id;
END//
DELIMITER ;

-- ========================================
-- 6. VERIFICATION
-- ========================================

-- Show the new table structure
DESCRIBE event_registrations;

-- Show updated activities structure
DESCRIBE activities;

-- Count records in the new table
SELECT 'event_registrations' as table_name, COUNT(*) as record_count FROM event_registrations;

-- Show triggers
SHOW TRIGGERS LIKE 'update_registration_count%';

