-- Event Registration System Tables
-- This script adds tables for event registration and capacity management

USE museosmart;

-- ========================================
-- 1. EVENT CAPACITY MANAGEMENT
-- ========================================

-- Add capacity field to event_details table
ALTER TABLE event_details 
ADD COLUMN max_capacity INT DEFAULT 50,
ADD COLUMN current_registrations INT DEFAULT 0;

-- ========================================
-- 2. EVENT REGISTRATIONS TABLE
-- ========================================

-- Create event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50),
    institution VARCHAR(255),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('registered', 'checked_in', 'cancelled') DEFAULT 'registered',
    qr_code VARCHAR(255),
    checkin_time TIMESTAMP NULL,
    FOREIGN KEY (event_id) REFERENCES activities(id) ON DELETE CASCADE
);

-- ========================================
-- 3. INDEXES FOR PERFORMANCE
-- ========================================

-- Add indexes for better query performance
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_email ON event_registrations(email);
CREATE INDEX idx_event_registrations_status ON event_registrations(status);

-- ========================================
-- 4. VERIFICATION
-- ========================================

-- Show the new table structure
DESCRIBE event_registrations;

-- Show updated event_details structure
DESCRIBE event_details;

-- Count records in the new table
SELECT 'event_registrations' as table_name, COUNT(*) as record_count FROM event_registrations;

