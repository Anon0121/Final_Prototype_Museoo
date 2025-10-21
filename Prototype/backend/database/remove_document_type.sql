-- Remove 'document' type from donations table ENUM
-- This migration removes the 'document' donation type from the database schema

-- First, update any existing 'document' type donations to 'artifact' type
UPDATE donations SET type = 'artifact' WHERE type = 'document';

-- Modify the ENUM to remove 'document' type
ALTER TABLE donations 
MODIFY COLUMN type ENUM('monetary', 'artifact', 'loan') NOT NULL;

-- Verify the change
SELECT DISTINCT type FROM donations;
