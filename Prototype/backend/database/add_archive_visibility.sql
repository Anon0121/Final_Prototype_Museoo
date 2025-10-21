-- Add visibility field to archives table
ALTER TABLE archives ADD COLUMN is_visible BOOLEAN DEFAULT TRUE AFTER category;

-- Update existing archives to be visible by default
UPDATE archives SET is_visible = TRUE WHERE is_visible IS NULL;

-- Create index for better performance on visibility searches
CREATE INDEX idx_archives_visibility ON archives(is_visible);
