-- Create AI insights table for storing AI-generated insights
CREATE TABLE IF NOT EXISTS ai_insights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  insights JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  INDEX idx_report_id (report_id),
  INDEX idx_created_at (created_at)
);

-- Add some sample AI insights for testing
INSERT INTO ai_insights (report_id, insights) VALUES
(1, '{"summary": "Sample AI analysis shows positive visitor trends with 15% increase in weekend attendance.", "trends": ["Weekend visitors increased by 15%", "Peak hours are 2-4 PM", "Family groups are the most common visitor type"], "recommendations": ["Consider extending weekend hours", "Add more family-friendly exhibits", "Optimize staffing during peak hours"]}');


