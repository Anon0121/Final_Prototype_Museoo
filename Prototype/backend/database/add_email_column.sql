-- Migration: Add email column to system_user table
USE museosmart;

-- Add email column if it doesn't exist
ALTER TABLE system_user 
ADD COLUMN IF NOT EXISTS email VARCHAR(100) UNIQUE NOT NULL DEFAULT 'admin@museum.com' AFTER lastname;

-- Update existing admin user with a proper email
UPDATE system_user 
SET email = 'admin@museum.com' 
WHERE username = 'admin' AND (email = 'admin@museum.com' OR email IS NULL);

-- Make email column required for new records
ALTER TABLE system_user 
MODIFY COLUMN email VARCHAR(100) NOT NULL;

-- Show the updated table structure
DESCRIBE system_user; 