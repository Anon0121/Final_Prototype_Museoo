-- Create missing tables for donation workflow system

-- 1. Donation Meeting Schedule Table
CREATE TABLE IF NOT EXISTS donation_meeting_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id INT NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    staff_member VARCHAR(255) NOT NULL,
    status ENUM('scheduled', 'completed', 'cancelled', 'rescheduled') DEFAULT 'scheduled',
    meeting_notes TEXT,
    suggested_alternative_dates JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);
