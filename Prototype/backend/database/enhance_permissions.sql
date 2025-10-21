-- Enhance permissions system with access levels
USE museosmart;

-- Update user_permissions table to include access levels
ALTER TABLE user_permissions 
ADD COLUMN access_level ENUM('none', 'view', 'edit', 'admin') DEFAULT 'none' AFTER is_allowed;

-- Update existing permissions to have 'edit' access for admins
UPDATE user_permissions 
SET access_level = 'edit' 
WHERE user_id IN (SELECT user_ID FROM system_user WHERE role = 'admin') AND is_allowed = 1;

-- Update existing permissions to have 'view' access for staff
UPDATE user_permissions 
SET access_level = 'view' 
WHERE user_id IN (SELECT user_ID FROM system_user WHERE role = 'staff') AND is_allowed = 1;

-- Show the updated structure
DESCRIBE user_permissions; 