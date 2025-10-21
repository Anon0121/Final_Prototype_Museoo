-- Add QR code column to additional_visitors table
USE museosmart;

-- Add qr_code column if it doesn't exist
ALTER TABLE additional_visitors 
ADD COLUMN IF NOT EXISTS qr_code LONGTEXT NULL AFTER details;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_additional_visitors_qr_code ON additional_visitors(qr_code);

-- Show the updated table structure
DESCRIBE additional_visitors;
