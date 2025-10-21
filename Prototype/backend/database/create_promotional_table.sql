-- Create promotional_items table
CREATE TABLE IF NOT EXISTS promotional_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image VARCHAR(500) NULL,
  cta_text VARCHAR(100) NULL,
  cta_link VARCHAR(255) NULL,
  badge VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  `order` INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX idx_promotional_active ON promotional_items(is_active);
CREATE INDEX idx_promotional_order ON promotional_items(`order`);
CREATE INDEX idx_promotional_created ON promotional_items(created_at);

-- Insert sample promotional items
INSERT INTO promotional_items (
  title, subtitle, description, cta_text, badge, is_active, `order`
) VALUES 
(
  'Special Exhibition: Heritage of Cagayan de Oro',
  'Discover the rich cultural heritage of our beloved city',
  'Experience the fascinating journey through time as we showcase the unique heritage and traditions that make Cagayan de Oro truly special. From ancient artifacts to modern cultural expressions, explore the diverse tapestry of our city\'s history.',
  'Now Showing',
  'Featured',
  TRUE,
  1
),
(
  'Interactive Museum Experience',
  'Engage with history like never before',
  'Our interactive exhibits bring history to life with cutting-edge technology and immersive storytelling experiences. Touch, explore, and discover the past in ways that will captivate visitors of all ages.',
  'Coming Soon',
  'New',
  TRUE,
  2
),
(
  'Educational Programs for All Ages',
  'Learning through discovery and exploration',
  'From school groups to families, our educational programs offer engaging ways to learn about our city\'s history and culture. Join our guided tours, workshops, and special events designed to inspire curiosity and learning.',
  'Special Event',
  'Popular',
  TRUE,
  3
);
