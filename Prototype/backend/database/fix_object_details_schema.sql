-- Fix object_details table schema
-- This script ensures all required fields exist and adds dimension fields

USE museosmart;

-- Add back the maintenance fields if they don't exist
ALTER TABLE object_details 
ADD COLUMN IF NOT EXISTS last_maintenance_date DATE NULL,
ADD COLUMN IF NOT EXISTS maintenance_notes TEXT NULL,
ADD COLUMN IF NOT EXISTS maintenance_priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS maintenance_cost DECIMAL(10,2) NULL;

-- Add proper dimension fields for height, width, length
ALTER TABLE object_details 
ADD COLUMN IF NOT EXISTS height DECIMAL(10,2) NULL COMMENT 'Height in specified unit',
ADD COLUMN IF NOT EXISTS width DECIMAL(10,2) NULL COMMENT 'Width in specified unit',
ADD COLUMN IF NOT EXISTS length DECIMAL(10,2) NULL COMMENT 'Length in specified unit',
ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2) NULL COMMENT 'Weight in kg',
ADD COLUMN IF NOT EXISTS dimension_unit VARCHAR(10) DEFAULT 'cm' COMMENT 'Unit of measurement';

-- Add maintenance reminder fields if they don't exist
ALTER TABLE object_details 
ADD COLUMN IF NOT EXISTS next_maintenance_date DATE NULL,
ADD COLUMN IF NOT EXISTS maintenance_frequency_months INT DEFAULT 12,
ADD COLUMN IF NOT EXISTS maintenance_reminder_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS maintenance_status ENUM('up_to_date', 'due_soon', 'overdue') DEFAULT 'up_to_date';

-- Verify the changes
DESCRIBE object_details;

SELECT 'Schema update completed successfully!' as Status;

