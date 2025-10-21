CREATE TABLE IF NOT EXISTS backup_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  booking_id INT NOT NULL,
  visitor_type ENUM('primary', 'additional') NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_email (email),
  INDEX idx_booking (booking_id),
  INDEX idx_expires (expires_at)
);
