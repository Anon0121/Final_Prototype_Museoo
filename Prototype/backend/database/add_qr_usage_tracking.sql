-- Add QR usage tracking to prevent re-scanning
USE museosmart;

-- Add qr_used field to additional_visitors table
ALTER TABLE additional_visitors 
ADD COLUMN IF NOT EXISTS qr_used BOOLEAN DEFAULT FALSE AFTER qr_code;

-- Add qr_used field to visitors table
ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS qr_used BOOLEAN DEFAULT FALSE AFTER qr_code;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_additional_visitors_qr_used ON additional_visitors(qr_used);
CREATE INDEX IF NOT EXISTS idx_visitors_qr_used ON visitors(qr_used);

-- Show the updated table structures
DESCRIBE additional_visitors;
DESCRIBE visitors;

