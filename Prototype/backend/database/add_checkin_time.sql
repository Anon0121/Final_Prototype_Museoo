-- Add missing checkin_time column to bookings table
USE museosmart;

-- Add checkin_time column if it doesn't exist
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS checkin_time TIMESTAMP NULL;

-- Update the status enum to include 'checked-in' if it doesn't exist
ALTER TABLE bookings 
MODIFY COLUMN status ENUM('pending', 'approved', 'checked-in', 'cancelled') DEFAULT 'pending'; 