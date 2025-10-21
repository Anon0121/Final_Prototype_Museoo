-- Fix cultural_objects table by adding missing id column
-- This script fixes the database schema issue where cultural_objects table was missing the id column

-- Add the missing id column to cultural_objects table
ALTER TABLE cultural_objects ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- Verify the table structure
DESCRIBE cultural_objects;
DESCRIBE images;
