-- Enhanced Donation Management System
-- This migration adds comprehensive features for donation processing

-- Add new fields to donations table
ALTER TABLE donations 
ADD COLUMN acknowledgment_sent BOOLEAN DEFAULT FALSE AFTER status,
ADD COLUMN acknowledgment_date DATE NULL AFTER acknowledgment_sent,
ADD COLUMN acknowledgment_type ENUM('email', 'letter', 'certificate', 'plaque') NULL AFTER acknowledgment_date,
ADD COLUMN processing_stage ENUM('received', 'under_review', 'approved', 'rejected', 'completed') DEFAULT 'received' AFTER acknowledgment_type,
ADD COLUMN assigned_to VARCHAR(100) NULL AFTER processing_stage,
ADD COLUMN priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' AFTER assigned_to,
ADD COLUMN city_acknowledgment_required BOOLEAN DEFAULT FALSE AFTER priority,
ADD COLUMN city_acknowledgment_sent BOOLEAN DEFAULT FALSE AFTER city_acknowledgment_required,
ADD COLUMN city_acknowledgment_date DATE NULL AFTER city_acknowledgment_sent,
ADD COLUMN source ENUM('admin', 'staff', 'donor_request') DEFAULT 'donor_request' AFTER city_acknowledgment_date,
ADD COLUMN admin_notes TEXT NULL AFTER source,
ADD COLUMN public_visible BOOLEAN DEFAULT TRUE AFTER admin_notes;

-- Add new fields to donation_details table
ALTER TABLE donation_details 
ADD COLUMN documents_uploaded BOOLEAN DEFAULT FALSE AFTER loan_end_date,
ADD COLUMN documents_count INT DEFAULT 0 AFTER documents_uploaded,
ADD COLUMN appraisal_required BOOLEAN DEFAULT FALSE AFTER documents_count,
ADD COLUMN appraisal_completed BOOLEAN DEFAULT FALSE AFTER appraisal_required,
ADD COLUMN appraisal_date DATE NULL AFTER appraisal_completed,
ADD COLUMN appraiser_name VARCHAR(255) NULL AFTER appraisal_date,
ADD COLUMN insurance_required BOOLEAN DEFAULT FALSE AFTER appraiser_name,
ADD COLUMN insurance_obtained BOOLEAN DEFAULT FALSE AFTER insurance_required,
ADD COLUMN storage_location VARCHAR(255) NULL AFTER insurance_obtained,
ADD COLUMN conservation_notes TEXT NULL AFTER storage_location;

-- Create donation_documents table for file uploads
CREATE TABLE IF NOT EXISTS donation_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id INT NOT NULL,
    document_type ENUM('receipt', 'appraisal', 'certificate', 'agreement', 'photo', 'other') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_by VARCHAR(100) DEFAULT 'admin',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

-- Create donation_workflow_log table for tracking processing steps
CREATE TABLE IF NOT EXISTS donation_workflow_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    stage_from VARCHAR(50) NULL,
    stage_to VARCHAR(50) NULL,
    performed_by VARCHAR(100) NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

-- Create donation_acknowledgments table for tracking different types of acknowledgments
CREATE TABLE IF NOT EXISTS donation_acknowledgments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id INT NOT NULL,
    acknowledgment_type ENUM('email', 'letter', 'certificate', 'plaque', 'city_certificate') NOT NULL,
    sent_date DATE NOT NULL,
    sent_by VARCHAR(100) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NULL,
    recipient_address TEXT NULL,
    content TEXT,
    file_path VARCHAR(500) NULL,
    status ENUM('draft', 'sent', 'delivered', 'confirmed') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

-- Create donation_requirements table for tracking specific requirements based on donation type and amount
CREATE TABLE IF NOT EXISTS donation_requirements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id INT NOT NULL,
    requirement_type ENUM('appraisal', 'insurance', 'conservation', 'storage', 'documentation', 'city_approval') NOT NULL,
    required BOOLEAN DEFAULT TRUE,
    completed BOOLEAN DEFAULT FALSE,
    due_date DATE NULL,
    assigned_to VARCHAR(100) NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

-- REMOVED: donation_visitor_submissions table
-- Donations should ONLY be made by DONORS, not visitors or participants.
-- Visitors are people who visit the museum, donors are people making donations.
-- These are separate concepts and should not be mixed.

-- Create donation_public_display table for managing public visibility of donations
CREATE TABLE IF NOT EXISTS donation_public_display (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id INT NOT NULL,
    display_name VARCHAR(255) NULL,
    display_description TEXT NULL,
    display_amount BOOLEAN DEFAULT FALSE,
    display_donor_name BOOLEAN DEFAULT FALSE,
    display_donor_anonymous BOOLEAN DEFAULT FALSE,
    display_date BOOLEAN DEFAULT TRUE,
    display_category VARCHAR(100) NULL,
    featured BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_processing_stage ON donations(processing_stage);
CREATE INDEX idx_donations_priority ON donations(priority);
CREATE INDEX idx_donations_assigned_to ON donations(assigned_to);
CREATE INDEX idx_donations_acknowledgment_sent ON donations(acknowledgment_sent);
CREATE INDEX idx_donations_city_acknowledgment_required ON donations(city_acknowledgment_required);
CREATE INDEX idx_donations_source ON donations(source);
CREATE INDEX idx_donations_public_visible ON donations(public_visible);

CREATE INDEX idx_donation_documents_type ON donation_documents(document_type);
CREATE INDEX idx_donation_documents_uploaded_at ON donation_documents(uploaded_at);

CREATE INDEX idx_donation_workflow_log_action ON donation_workflow_log(action);
CREATE INDEX idx_donation_workflow_log_performed_at ON donation_workflow_log(performed_at);

CREATE INDEX idx_donation_acknowledgments_type ON donation_acknowledgments(acknowledgment_type);
CREATE INDEX idx_donation_acknowledgments_sent_date ON donation_acknowledgments(sent_date);

CREATE INDEX idx_donation_requirements_type ON donation_requirements(requirement_type);
CREATE INDEX idx_donation_requirements_completed ON donation_requirements(completed);

-- REMOVED: Indices for donation_visitor_submissions table (table removed)

CREATE INDEX idx_donation_public_display_featured ON donation_public_display(featured);
CREATE INDEX idx_donation_public_display_order ON donation_public_display(display_order);

-- Insert default requirements based on donation types
INSERT INTO donation_requirements (donation_id, requirement_type, required, notes)
SELECT 
    id,
    'documentation',
    TRUE,
    'Basic documentation required for all donations'
FROM donations;

-- Update existing donations to set appropriate requirements based on type and amount
UPDATE donation_requirements dr
JOIN donations d ON dr.donation_id = d.id
JOIN donation_details dd ON d.id = dd.donation_id
SET 
    dr.required = TRUE,
    dr.notes = CASE 
        WHEN d.type = 'artifact' THEN 'Artifact requires appraisal and conservation assessment'
        WHEN d.type = 'loan' THEN 'Loan requires insurance and storage arrangement'
        WHEN d.type = 'monetary' AND dd.amount >= 50000 THEN 'High-value monetary donation requires city acknowledgment'
        ELSE dr.notes
    END
WHERE dr.requirement_type = 'documentation';

-- Insert additional requirements for artifacts
INSERT INTO donation_requirements (donation_id, requirement_type, required, notes)
SELECT 
    id,
    'appraisal',
    TRUE,
    'Artifact requires professional appraisal'
FROM donations 
WHERE type = 'artifact' 
AND id NOT IN (SELECT donation_id FROM donation_requirements WHERE requirement_type = 'appraisal');

-- Insert additional requirements for loans
INSERT INTO donation_requirements (donation_id, requirement_type, required, notes)
SELECT 
    id,
    'insurance',
    TRUE,
    'Loan requires insurance coverage'
FROM donations 
WHERE type = 'loan' 
AND id NOT IN (SELECT donation_id FROM donation_requirements WHERE requirement_type = 'insurance');

-- Insert city acknowledgment requirements for high-value donations
INSERT INTO donation_requirements (donation_id, requirement_type, required, notes)
SELECT 
    id,
    'city_approval',
    TRUE,
    'High-value donation requires city acknowledgment'
FROM donations d
JOIN donation_details dd ON d.id = dd.donation_id
WHERE d.type = 'monetary' 
AND dd.amount >= 50000
AND id NOT IN (SELECT donation_id FROM donation_requirements WHERE requirement_type = 'city_approval');

-- Update donation_details to set appraisal_required for artifacts
UPDATE donation_details dd
JOIN donations d ON dd.donation_id = d.id
SET dd.appraisal_required = TRUE
WHERE d.type = 'artifact';

-- Update donation_details to set insurance_required for loans
UPDATE donation_details dd
JOIN donations d ON dd.donation_id = d.id
SET dd.insurance_required = TRUE
WHERE d.type = 'loan';

-- Update donations to set city_acknowledgment_required for high-value monetary donations
UPDATE donations d
JOIN donation_details dd ON d.id = dd.donation_id
SET d.city_acknowledgment_required = TRUE
WHERE d.type = 'monetary' AND dd.amount >= 50000;

-- REMOVED: visitor submission records creation (table removed)
-- All donations are now properly categorized as donor requests

-- Create public display records for existing donations
INSERT INTO donation_public_display (donation_id, display_name, display_description, display_amount, display_donor_name)
SELECT 
    id,
    donor_name,
    notes,
    CASE WHEN type = 'monetary' THEN TRUE ELSE FALSE END,
    TRUE
FROM donations 
WHERE id NOT IN (SELECT donation_id FROM donation_public_display);
