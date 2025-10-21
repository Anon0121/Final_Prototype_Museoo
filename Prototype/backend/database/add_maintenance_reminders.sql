-- Add maintenance reminder fields to object_details table
-- This migration adds maintenance tracking capabilities to cultural objects

-- Add maintenance-related columns to object_details table
ALTER TABLE object_details 
ADD COLUMN last_maintenance_date DATE NULL COMMENT 'Date of last maintenance performed',
ADD COLUMN next_maintenance_date DATE NULL COMMENT 'Scheduled date for next maintenance',
ADD COLUMN maintenance_frequency_months INT DEFAULT 12 COMMENT 'Maintenance frequency in months',
ADD COLUMN maintenance_notes TEXT NULL COMMENT 'Notes about maintenance requirements',
ADD COLUMN maintenance_priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' COMMENT 'Priority level for maintenance',
ADD COLUMN maintenance_status ENUM('up_to_date', 'due_soon', 'overdue', 'in_progress') DEFAULT 'up_to_date' COMMENT 'Current maintenance status',
ADD COLUMN maintenance_reminder_enabled BOOLEAN DEFAULT TRUE COMMENT 'Whether maintenance reminders are enabled for this object',
ADD COLUMN maintenance_contact VARCHAR(255) NULL COMMENT 'Contact person responsible for maintenance',
ADD COLUMN maintenance_cost DECIMAL(10,2) NULL COMMENT 'Estimated cost for maintenance';

-- Note: Dimensions column removal is handled in the application layer
-- The frontend no longer sends dimensions data, so it will be ignored

-- Create index for efficient querying of maintenance due dates
CREATE INDEX idx_next_maintenance_date ON object_details(next_maintenance_date);
CREATE INDEX idx_maintenance_status ON object_details(maintenance_status);

-- Create a view for easy maintenance tracking
CREATE OR REPLACE VIEW maintenance_overview AS
SELECT 
    co.id as object_id,
    co.name as object_name,
    co.category,
    od.condition_status,
    od.last_maintenance_date,
    od.next_maintenance_date,
    od.maintenance_frequency_months,
    od.maintenance_priority,
    od.maintenance_status,
    od.maintenance_reminder_enabled,
    od.maintenance_contact,
    od.maintenance_cost,
    od.maintenance_notes,
    CASE 
        WHEN od.next_maintenance_date IS NULL THEN 'No maintenance scheduled'
        WHEN od.next_maintenance_date < CURDATE() THEN 'Overdue'
        WHEN od.next_maintenance_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Due Soon'
        ELSE 'Up to Date'
    END as maintenance_alert_status,
    DATEDIFF(od.next_maintenance_date, CURDATE()) as days_until_maintenance
FROM cultural_objects co
LEFT JOIN object_details od ON co.id = od.cultural_object_id
WHERE od.maintenance_reminder_enabled = TRUE;

-- Insert some sample maintenance data for existing objects (optional)
-- This will set a default next maintenance date for objects that don't have one
UPDATE object_details 
SET next_maintenance_date = DATE_ADD(CURDATE(), INTERVAL maintenance_frequency_months MONTH)
WHERE next_maintenance_date IS NULL AND maintenance_reminder_enabled = TRUE;

-- Update maintenance status based on next maintenance date
UPDATE object_details 
SET maintenance_status = CASE 
    WHEN next_maintenance_date IS NULL THEN 'up_to_date'
    WHEN next_maintenance_date < CURDATE() THEN 'overdue'
    WHEN next_maintenance_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'due_soon'
    ELSE 'up_to_date'
END
WHERE maintenance_reminder_enabled = TRUE;
