-- New Donation Process Workflow
-- This migration implements the new donation process with meeting scheduling and city hall approval

-- Add new fields to donations table for the new process
ALTER TABLE donations 
ADD COLUMN request_date TIMESTAMP NULL AFTER created_at,
ADD COLUMN preferred_visit_date DATE NULL AFTER request_date,
ADD COLUMN preferred_visit_time TIME NULL AFTER preferred_visit_date,
ADD COLUMN meeting_scheduled BOOLEAN DEFAULT FALSE AFTER preferred_visit_time,
ADD COLUMN meeting_date DATE NULL AFTER meeting_scheduled,
ADD COLUMN meeting_time TIME NULL AFTER meeting_date,
ADD COLUMN meeting_location VARCHAR(255) NULL AFTER meeting_time,
ADD COLUMN meeting_notes TEXT NULL AFTER meeting_location,
ADD COLUMN meeting_completed BOOLEAN DEFAULT FALSE AFTER meeting_notes,
ADD COLUMN handover_completed BOOLEAN DEFAULT FALSE AFTER meeting_completed,
ADD COLUMN city_hall_submitted BOOLEAN DEFAULT FALSE AFTER handover_completed,
ADD COLUMN city_hall_submission_date DATE NULL AFTER city_hall_submitted,
ADD COLUMN city_hall_approval_date DATE NULL AFTER city_hall_submission_date,
ADD COLUMN final_approval_date DATE NULL AFTER city_hall_approval_date,
ADD COLUMN gratitude_email_sent BOOLEAN DEFAULT FALSE AFTER final_approval_date;

-- Update processing_stage enum to include new stages
ALTER TABLE donations 
MODIFY COLUMN processing_stage ENUM(
    'request_received', 
    'under_review', 
    'meeting_scheduled', 
    'meeting_completed', 
    'handover_completed', 
    'city_hall_processing', 
    'city_hall_approved', 
    'final_approved', 
    'completed',
    'rejected'
) DEFAULT 'request_received';

-- Create donation_meeting_schedule table for tracking meeting details
CREATE TABLE IF NOT EXISTS donation_meeting_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id INT NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    staff_member VARCHAR(255) NOT NULL,
    donor_confirmed BOOLEAN DEFAULT FALSE,
    donor_confirmation_date TIMESTAMP NULL,
    meeting_notes TEXT NULL,
    status ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

-- Create donation_city_hall_submission table for tracking city hall process
CREATE TABLE IF NOT EXISTS donation_city_hall_submission (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id INT NOT NULL,
    submission_date DATE NOT NULL,
    submitted_by VARCHAR(255) NOT NULL,
    submission_documents TEXT NULL,
    city_hall_reference VARCHAR(255) NULL,
    status ENUM('submitted', 'under_review', 'approved', 'rejected', 'requires_additional_info') DEFAULT 'submitted',
    approval_date DATE NULL,
    rejection_reason TEXT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

-- Create donation_handover_documents table for tracking handover process
CREATE TABLE IF NOT EXISTS donation_handover_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id INT NOT NULL,
    document_type ENUM('receipt', 'inventory', 'condition_report', 'photograph', 'certificate', 'other') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_by VARCHAR(100) DEFAULT 'staff',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_donations_request_date ON donations(request_date);
CREATE INDEX idx_donations_meeting_scheduled ON donations(meeting_scheduled);
CREATE INDEX idx_donations_meeting_date ON donations(meeting_date);
CREATE INDEX idx_donations_handover_completed ON donations(handover_completed);
CREATE INDEX idx_donations_city_hall_submitted ON donations(city_hall_submitted);
CREATE INDEX idx_donations_city_hall_approval_date ON donations(city_hall_approval_date);
CREATE INDEX idx_donations_final_approval_date ON donations(final_approval_date);

CREATE INDEX idx_donation_meeting_schedule_date ON donation_meeting_schedule(scheduled_date);
CREATE INDEX idx_donation_meeting_schedule_status ON donation_meeting_schedule(status);

CREATE INDEX idx_donation_city_hall_submission_date ON donation_city_hall_submission(submission_date);
CREATE INDEX idx_donation_city_hall_submission_status ON donation_city_hall_submission(status);

CREATE INDEX idx_donation_handover_documents_type ON donation_handover_documents(document_type);
CREATE INDEX idx_donation_handover_documents_uploaded_at ON donation_handover_documents(uploaded_at);

-- Update existing donations to have request_date as created_at
UPDATE donations SET request_date = created_at WHERE request_date IS NULL;

-- Update existing donations to set appropriate processing_stage
UPDATE donations SET processing_stage = 'request_received' WHERE processing_stage = 'received';
UPDATE donations SET processing_stage = 'final_approved' WHERE status = 'approved' AND processing_stage = 'approved';

