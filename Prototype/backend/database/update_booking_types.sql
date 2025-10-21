-- Update bookings table to allow new booking types
-- First, we need to modify the ENUM to include the new types

-- Step 1: Add the new values to the ENUM
ALTER TABLE bookings 
MODIFY COLUMN type ENUM('individual', 'group', 'ind-walkin', 'group-walkin', 'individual walk-in', 'group walk-in', 'walk-in scheduling') NOT NULL;

