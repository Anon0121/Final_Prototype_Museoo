-- Add expiration column to additional_visitors table for 24-hour expiration feature
ALTER TABLE additional_visitors 
ADD COLUMN expires_at TIMESTAMP NULL,
ADD INDEX idx_expires_at (expires_at);

