-- Add profile_photo column to system_user table
USE museosmart;

-- Add profile_photo column
ALTER TABLE system_user 
ADD COLUMN profile_photo VARCHAR(500) NULL AFTER email;

-- Show the updated table structure
DESCRIBE system_user; 