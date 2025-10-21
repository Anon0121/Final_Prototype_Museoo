-- Add table for additional visitor tokens
-- This table stores pre-generated QR tokens for companions

CREATE TABLE IF NOT EXISTS additional_visitors (
    token_id VARCHAR(50) PRIMARY KEY,
    booking_id INT NOT NULL,
    email VARCHAR(100) NOT NULL,
    status ENUM('pending', 'completed', 'checked-in') DEFAULT 'pending',
    details JSON DEFAULT NULL,
    qr_generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details_completed_at TIMESTAMP NULL,
    checkin_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

-- Add index for faster lookups
CREATE INDEX idx_additional_visitors_token ON additional_visitors(token_id);
CREATE INDEX idx_additional_visitors_booking ON additional_visitors(booking_id);
CREATE INDEX idx_additional_visitors_email ON additional_visitors(email);







