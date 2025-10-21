-- Remove unused fields from object_details table
-- This script removes fields that are not used in the form

USE museosmart;

-- Remove unused fields from object_details table
ALTER TABLE object_details 
DROP COLUMN dimensions,
DROP COLUMN last_maintenance_date,
DROP COLUMN maintenance_notes,
DROP COLUMN maintenance_priority,
DROP COLUMN maintenance_cost;

-- Verify the changes
DESCRIBE object_details;

