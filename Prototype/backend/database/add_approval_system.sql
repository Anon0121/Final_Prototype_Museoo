-- Add Approval System to Event Registrations
-- This script adds approval functionality where admins must approve registrations before QR codes are generated

USE museosmart;

-- ========================================
-- 1. UPDATE EVENT_REGISTRATIONS TABLE
-- ========================================

-- Add approval status to event_registrations table
ALTER TABLE event_registrations 
ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' AFTER status,
ADD COLUMN approval_date TIMESTAMP NULL AFTER approval_status,
ADD COLUMN approved_by VARCHAR(100) NULL AFTER approval_date,
ADD COLUMN rejection_reason TEXT NULL AFTER approved_by;

-- ========================================
-- 2. UPDATE STATUS ENUM
-- ========================================

-- Update the status enum to include 'pending_approval'
ALTER TABLE event_registrations 
MODIFY COLUMN status ENUM('pending_approval', 'registered', 'checked_in', 'cancelled') DEFAULT 'pending_approval';

-- ========================================
-- 3. UPDATE EXISTING RECORDS
-- ========================================

-- Update existing registrations to have pending approval status
UPDATE event_registrations 
SET status = 'pending_approval', 
    approval_status = 'pending' 
WHERE status = 'registered';

-- ========================================
-- 4. INDEXES FOR PERFORMANCE
-- ========================================

-- Add indexes for approval-related queries
CREATE INDEX idx_event_registrations_approval_status ON event_registrations(approval_status);
CREATE INDEX idx_event_registrations_approval_date ON event_registrations(approval_date);

-- ========================================
-- 5. VERIFICATION
-- ========================================

-- Show the updated table structure
DESCRIBE event_registrations;

-- Show sample data with new approval fields
SELECT 
    id, 
    firstname, 
    lastname, 
    email, 
    status, 
    approval_status, 
    approval_date, 
    approved_by 
FROM event_registrations 
LIMIT 5;

