-- Create reports table for AI-powered report generation
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  content LONGTEXT,
  data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES system_user(user_ID) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_report_type (report_type),
  INDEX idx_created_at (created_at)
);

-- Add some sample data for testing
INSERT INTO reports (user_id, title, description, report_type, start_date, end_date, content, data) VALUES
(1, 'Sample Visitor Analytics Report', 'Sample report for testing', 'visitor_analytics', '2024-01-01', '2024-01-31', 
'<div class="report-content"><h2>Sample Report</h2><p>This is a sample report for testing purposes.</p></div>',
'{"totalVisitors": 150, "uniqueDays": 31, "avgVisitorsPerBooking": 2.5}'); 