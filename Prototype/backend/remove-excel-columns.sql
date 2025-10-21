-- Remove Excel-related columns from reports table
-- This script removes all Excel/CSV file storage columns that are no longer needed

USE museosmart;

-- Remove Excel file storage columns from reports table
ALTER TABLE reports 
DROP COLUMN IF EXISTS excel_file,
DROP COLUMN IF EXISTS excel_size,
DROP COLUMN IF EXISTS excel_filename,
DROP COLUMN IF EXISTS excel_generated_at,
DROP COLUMN IF EXISTS excel_file_path;

-- Verify the changes
DESCRIBE reports;

