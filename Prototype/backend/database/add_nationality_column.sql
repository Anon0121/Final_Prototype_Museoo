-- Add nationality column to visitors table if it doesn't exist
USE museosmart;

-- Check if nationality column exists, if not add it
ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS nationality VARCHAR(50) NOT NULL DEFAULT 'local' 
AFTER email;

-- Update existing records to have a default nationality if they don't have one
UPDATE visitors SET nationality = 'local' WHERE nationality IS NULL OR nationality = '';

-- Make sure the column is NOT NULL
ALTER TABLE visitors MODIFY COLUMN nationality VARCHAR(50) NOT NULL;







