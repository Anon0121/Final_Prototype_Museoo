-- Add user permissions functionality
USE museosmart;

-- Create permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  permission_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  permission_name VARCHAR(50) NOT NULL,
  is_allowed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES system_user(user_ID) ON DELETE CASCADE,
  UNIQUE KEY unique_user_permission (user_id, permission_name)
);

-- Add permissions column to system_user table for quick access
ALTER TABLE system_user 
ADD COLUMN IF NOT EXISTS permissions JSON NULL AFTER profile_photo;

-- Insert default permissions for existing users
INSERT IGNORE INTO user_permissions (user_id, permission_name, is_allowed) 
SELECT user_ID, 'dashboard', TRUE FROM system_user WHERE role = 'admin';

INSERT IGNORE INTO user_permissions (user_id, permission_name, is_allowed) 
SELECT user_ID, 'schedule', TRUE FROM system_user WHERE role = 'admin';

INSERT IGNORE INTO user_permissions (user_id, permission_name, is_allowed) 
SELECT user_ID, 'visitors', TRUE FROM system_user WHERE role = 'admin';

INSERT IGNORE INTO user_permissions (user_id, permission_name, is_allowed) 
SELECT user_ID, 'scanner', TRUE FROM system_user WHERE role = 'admin';

INSERT IGNORE INTO user_permissions (user_id, permission_name, is_allowed) 
SELECT user_ID, 'exhibit', TRUE FROM system_user WHERE role = 'admin';

INSERT IGNORE INTO user_permissions (user_id, permission_name, is_allowed) 
SELECT user_ID, 'event', TRUE FROM system_user WHERE role = 'admin';

INSERT IGNORE INTO user_permissions (user_id, permission_name, is_allowed) 
SELECT user_ID, 'cultural_objects', TRUE FROM system_user WHERE role = 'admin';

INSERT IGNORE INTO user_permissions (user_id, permission_name, is_allowed) 
SELECT user_ID, 'archive', TRUE FROM system_user WHERE role = 'admin';

INSERT IGNORE INTO user_permissions (user_id, permission_name, is_allowed) 
SELECT user_ID, 'donation', TRUE FROM system_user WHERE role = 'admin';

INSERT IGNORE INTO user_permissions (user_id, permission_name, is_allowed) 
SELECT user_ID, 'reports', TRUE FROM system_user WHERE role = 'admin';

INSERT IGNORE INTO user_permissions (user_id, permission_name, is_allowed) 
SELECT user_ID, 'settings', TRUE FROM system_user WHERE role = 'admin';

-- Show the structure
DESCRIBE user_permissions;
DESCRIBE system_user; 