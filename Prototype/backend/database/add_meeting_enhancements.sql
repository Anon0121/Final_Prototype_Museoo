-- Add missing fields for enhanced donation meeting scheduling workflow
-- This migration adds fields needed for rejection reasons and alternative dates

-- Add rejection_reason field to donations table
ALTER TABLE donations 
ADD COLUMN rejection_reason TEXT NULL AFTER gratitude_email_sent;

-- Add suggested_alternative_dates field to donations table
-- Using JSON to store array of alternative dates
ALTER TABLE donations 
ADD COLUMN suggested_alternative_dates JSON NULL AFTER rejection_reason;

-- Add index for rejection_reason for better query performance
CREATE INDEX idx_donations_rejection_reason ON donations(rejection_reason(255));

-- Add comment to document the changes
ALTER TABLE donations COMMENT = 'Donations table updated with rejection_reason and suggested_alternative_dates fields for enhanced meeting scheduling workflow';

-- Update existing rejected donations to have empty rejection_reason
UPDATE donations SET rejection_reason = 'No reason provided' WHERE status = 'rejected' AND rejection_reason IS NULL;

