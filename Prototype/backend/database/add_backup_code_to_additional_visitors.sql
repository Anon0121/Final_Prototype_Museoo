-- Add backup_code column to additional_visitors table
USE museosmart;

-- Check if column exists, if not add it
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'museosmart' 
    AND TABLE_NAME = 'additional_visitors' 
    AND COLUMN_NAME = 'backup_code'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE additional_visitors ADD COLUMN backup_code VARCHAR(20) NULL AFTER qr_code',
    'SELECT "Column backup_code already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Show the updated table structure
DESCRIBE additional_visitors;

