CREATE TABLE IF NOT EXISTS walkin_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_email VARCHAR(100) NOT NULL,
    visit_date DATE NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    purpose VARCHAR(30) DEFAULT 'educational',
    notes TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    approved_by VARCHAR(50) NULL,
    INDEX idx_status (status),
    INDEX idx_visit_date (visit_date),
    INDEX idx_email (visitor_email)
);
