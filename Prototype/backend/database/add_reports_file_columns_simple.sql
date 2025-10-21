-- Add file storage columns to reports table
USE museosmart;

-- Add columns for PDF file storage
ALTER TABLE reports ADD COLUMN pdf_file LONGBLOB;
ALTER TABLE reports ADD COLUMN pdf_size INT;
ALTER TABLE reports ADD COLUMN pdf_filename VARCHAR(255);
ALTER TABLE reports ADD COLUMN pdf_generated_at TIMESTAMP NULL;

-- Add columns for Excel file storage
ALTER TABLE reports ADD COLUMN excel_file LONGBLOB;
ALTER TABLE reports ADD COLUMN excel_size INT;
ALTER TABLE reports ADD COLUMN excel_filename VARCHAR(255);
ALTER TABLE reports ADD COLUMN excel_generated_at TIMESTAMP NULL;

-- Show the updated table structure
DESCRIBE reports;
