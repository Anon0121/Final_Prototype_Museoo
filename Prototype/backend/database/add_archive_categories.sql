-- Add category field to archives table
ALTER TABLE archives ADD COLUMN category VARCHAR(100) DEFAULT 'Other' AFTER type;

-- Update existing archives to have a default category
UPDATE archives SET category = 'Other' WHERE category IS NULL;

-- Create index for better performance on category searches
CREATE INDEX idx_archives_category ON archives(category);
