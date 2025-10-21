# Enhanced Donation Management System Guide

## Overview
The enhanced donation management system provides comprehensive workflow management, document upload capabilities, requirement tracking, and acknowledgment management for the City Museum of Cagayan de Oro. This system handles various types of donations including monetary contributions, artifacts, documents, and loans with proper documentation and acknowledgment processes.

## Key Features

### 1. **Visitor vs Admin Donation Management**
- **Separate workflows** for visitor submissions and admin-created donations
- **Visitor submission tracking** with IP address and user agent logging
- **Public display management** for approved donations
- **Anonymous donor options** for privacy protection
- **Featured donation highlighting** for special recognition

### 2. **Payment Proof Management**
- **Cash-only payments** with proof of payment images
- **Automatic file upload** for payment proof during donation creation
- **Image validation** and storage management
- **Document tracking** for payment verification

### 3. **Legal Document Management**
- **Required legal documents** for artifact and historical item donations
- **Ownership certificates** and provenance documentation
- **PDF and image file support** for document uploads
- **Automatic document categorization** and storage

### 3. **Document Management**
- Upload multiple documents per donation (receipts, appraisals, certificates, agreements, photos)
- Automatic document tracking and counting
- File type validation and storage management
- Document history and audit trail

### 3. **Workflow Management**
- Multi-stage processing: Received → Under Review → Approved → Completed
- Priority levels: Low, Medium, High, Urgent
- Assignment tracking to staff members
- Complete workflow history logging

### 4. **Requirement Tracking**
- Automatic requirement generation based on donation type and amount
- Requirement types: Appraisal, Insurance, Conservation, Storage, Documentation, City Approval
- Due date tracking and completion status
- Assignment and progress monitoring

### 5. **Acknowledgment Management**
- Multiple acknowledgment types: Email, Letter, Certificate, Plaque, City Certificate
- Automatic acknowledgment requirements for high-value donations (₱50,000+)
- Acknowledgment history and tracking
- City acknowledgment for significant contributions

### 6. **Enhanced Reporting**
- Dashboard statistics and analytics
- Processing stage tracking
- Requirement completion rates
- Acknowledgment status monitoring
- Visitor submission statistics

## Database Schema

### Enhanced Tables

#### **donations** (Enhanced)
- `acknowledgment_sent` - Boolean flag for acknowledgment status
- `acknowledgment_date` - Date when acknowledgment was sent
- `acknowledgment_type` - Type of acknowledgment sent
- `processing_stage` - Current processing stage
- `assigned_to` - Staff member assigned to the donation
- `priority` - Priority level (low, medium, high, urgent)
- `city_acknowledgment_required` - Flag for city acknowledgment requirement
- `city_acknowledgment_sent` - Flag for city acknowledgment status
- `city_acknowledgment_date` - Date when city acknowledgment was sent
- `source` - Source of donation (visitor, admin, staff)
- `visitor_ip` - IP address of visitor submission
- `visitor_user_agent` - User agent of visitor submission
- `admin_notes` - Admin notes for internal use
- `public_visible` - Whether donation is visible to public

#### **donation_details** (Enhanced)
- `amount` - Monetary donation amount (for monetary donations)
- `item_description` - Description of donated item
- `estimated_value` - Estimated value of the donation
- `condition` - Condition of the donated item
- `loan_start_date` - Start date for loaned items
- `loan_end_date` - End date for loaned items
- `documents_uploaded` - Boolean flag for document upload status
- `documents_count` - Number of documents uploaded
- `appraisal_required` - Flag for appraisal requirement
- `appraisal_completed` - Flag for appraisal completion
- `appraisal_date` - Date when appraisal was completed
- `appraiser_name` - Name of the appraiser
- `insurance_required` - Flag for insurance requirement
- `insurance_obtained` - Flag for insurance status
- `storage_location` - Storage location for the item
- `conservation_notes` - Conservation-related notes

#### **donation_documents** (New)
- `donation_id` - Reference to donation
- `document_type` - Type of document (receipt, appraisal, certificate, agreement, photo, other)
- `file_name` - Original file name
- `file_path` - File storage path
- `file_size` - File size in bytes
- `mime_type` - File MIME type
- `uploaded_by` - User who uploaded the file
- `uploaded_at` - Upload timestamp
- `description` - Document description

#### **donation_workflow_log** (New)
- `donation_id` - Reference to donation
- `action` - Action performed
- `stage_from` - Previous processing stage
- `stage_to` - New processing stage
- `performed_by` - User who performed the action
- `performed_at` - Action timestamp
- `notes` - Additional notes

#### **donation_acknowledgments** (New)
- `donation_id` - Reference to donation
- `acknowledgment_type` - Type of acknowledgment
- `sent_date` - Date when acknowledgment was sent
- `sent_by` - User who sent the acknowledgment
- `recipient_name` - Recipient's name
- `recipient_email` - Recipient's email
- `recipient_address` - Recipient's address
- `content` - Acknowledgment content
- `file_path` - File path for acknowledgment document
- `status` - Acknowledgment status (draft, sent, delivered, confirmed)

#### **donation_requirements** (New)
- `donation_id` - Reference to donation
- `requirement_type` - Type of requirement
- `required` - Whether requirement is mandatory
- `completed` - Completion status
- `due_date` - Due date for completion
- `assigned_to` - Staff member assigned
- `notes` - Requirement notes
- `created_at` - Creation timestamp
- `completed_at` - Completion timestamp

#### **donation_public_display** (New)
- `donation_id` - Reference to donation
- `display_name` - Name to display publicly
- `display_description` - Description to display publicly
- `display_amount` - Whether to display amount
- `display_donor_name` - Whether to display donor name
- `display_donor_anonymous` - Whether donor is anonymous
- `display_date` - Whether to display date
- `display_category` - Category for display
- `featured` - Whether donation is featured
- `display_order` - Order for display
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## API Endpoints

### Document Management
- `POST /api/donations/:id/documents` - Upload donation documents
- `GET /api/donations/:id/documents` - Get donation documents

### Requirement Management
- `GET /api/donations/:id/requirements` - Get donation requirements
- `PUT /api/donations/:id/requirements/:requirementId` - Update requirement status

### Workflow Management
- `GET /api/donations/:id/workflow` - Get donation workflow log
- `PUT /api/donations/:id/stage` - Update processing stage

### Acknowledgment Management
- `POST /api/donations/:id/acknowledgments` - Create acknowledgment
- `GET /api/donations/:id/acknowledgments` - Get donation acknowledgments

### Enhanced Reporting
- `GET /api/donations/enhanced` - Get enhanced donation data
- `GET /api/donations/dashboard/stats` - Get dashboard statistics

### Public Display Management
- `GET /api/donations/public` - Get public donations for visitor display
- `PUT /api/donations/:id/public-display` - Update public display settings
- `GET /api/donations/:id/public-display` - Get public display settings

### Donation Management
- `DELETE /api/donations/:id` - Delete donation and all related data
- `POST /api/donations/:id/reject` - Reject donation

## Workflow Process

### 1. **Donation Received**
- Donation is recorded in the system
- Basic requirements are automatically generated
- Processing stage set to "received"
- Priority level assigned based on type and amount

### 2. **Under Review**
- Staff reviews donation details
- Additional requirements may be added
- Documents are uploaded as needed
- Appraisal scheduled for artifacts

### 3. **Approved**
- All requirements completed
- Donation approved for acceptance
- Acknowledgment prepared and sent
- City acknowledgment prepared if required

### 4. **Completed**
- All processes completed
- Donation fully processed
- Final documentation archived

## Requirement Types

### **Documentation** (All Donations)
- Basic documentation required for all donations
- Receipts, agreements, certificates
- **Legal documents** for artifacts and historical items
- **Ownership certificates** and provenance documentation

### **Appraisal** (Artifacts)
- Professional appraisal required for artifacts
- Appraiser assignment and scheduling
- Appraisal report documentation

### **Insurance** (Loans)
- Insurance coverage required for loaned items
- Insurance policy documentation
- Coverage amount verification

### **Conservation** (Artifacts)
- Conservation assessment for artifacts
- Storage requirements evaluation
- Conservation treatment planning

### **Storage** (Physical Items)
- Storage location assignment
- Environmental condition monitoring
- Security arrangements

### **City Approval** (High-Value Donations)
- City acknowledgment for donations ₱50,000+
- Mayor's office approval process
- Official certificate generation

## Acknowledgment Types

### **Email Acknowledgment**
- Immediate email confirmation
- Standard appreciation letter
- Donation details included

### **Letter Acknowledgment**
- Formal printed letter
- Museum letterhead
- Signed by museum director

### **Certificate Acknowledgment**
- Official donation certificate
- Suitable for framing
- Includes donation details

### **Plaque Acknowledgment**
- Physical plaque for display
- Donor recognition
- Museum location placement

### **City Certificate** (High-Value)
- Official city certificate
- Mayor's signature
- City seal and recognition

## Usage Instructions

### For Administrators

#### **Setting Up a New Donation**
1. Navigate to Donation Management
2. Click "Add Donation"
3. Fill in donor information
4. Select donation type and details
5. **For monetary donations**: Upload proof of payment image (required)
6. **For artifacts/historical items**: Upload legal documents (required)
7. System automatically generates requirements
8. Assign priority and staff member

#### **Processing Donations**
1. Review donation details
2. Upload required documents
3. Complete requirements checklist
4. Update processing stage
5. Send appropriate acknowledgments
6. Monitor workflow progress

#### **Managing Donations**
1. **Approve Donations**: Click "Approve" to approve and send appreciation letter
2. **Reject Donations**: Click "Reject" to mark donation as rejected
3. **Delete Donations**: Click "Delete" to permanently remove donation and all related data
4. **Preview Letters**: Click "Preview Letter" to see the appreciation letter before sending
5. **Download Letters**: Click "Download Letter" to download the appreciation letter for approved donations

#### **Document Management**
1. Click on donation to view details
2. Navigate to Documents tab
3. Upload required files
4. Add descriptions and categorize
5. Track upload history

#### **Requirement Tracking**
1. View requirements checklist
2. Assign staff members
3. Set due dates
4. Mark requirements as completed
5. Add notes and updates

#### **Acknowledgment Management**
1. Review acknowledgment requirements
2. Create appropriate acknowledgments
3. Send acknowledgments to donors
4. Track acknowledgment status
5. Generate city certificates for high-value donations

### For Staff Members

#### **Managing Assigned Donations**
1. View assigned donations
2. Update processing status
3. Upload required documents
4. Complete assigned requirements
5. Communicate with donors

#### **Document Upload**
1. Select donation from list
2. Click "Upload Documents"
3. Choose file type and description
4. Upload multiple files as needed
5. Verify upload success

## Migration Instructions

### Running the Database Migration
1. Ensure your database is running
2. Run the migration script:
   ```bash
   # Option 1: Using the batch file
   enhance-donation-system.bat
   
   # Option 2: Manual execution
   cd backend
   node scripts/enhance_donation_system.js
   ```

### Verification Steps
After running the migration, verify:
1. New tables are created successfully
2. Existing donations have requirements generated
3. Enhanced fields are added to existing tables
4. Indexes are created for performance
5. Sample data is populated correctly

## Benefits

### **Improved Organization**
- Systematic workflow management
- Clear processing stages
- Requirement tracking
- Document organization

### **Enhanced Accountability**
- Complete audit trail
- Staff assignment tracking
- Requirement completion monitoring
- Acknowledgment tracking

### **Better Donor Relations**
- Timely acknowledgments
- Professional documentation
- Multiple acknowledgment options
- City recognition for significant contributions

### **Operational Efficiency**
- Automated requirement generation
- Streamlined workflow
- Document management
- Dashboard analytics

### **Compliance and Documentation**
- Complete donation records
- Document archiving
- Requirement fulfillment tracking
- Audit trail maintenance

## Future Enhancements

### **Advanced Features**
- Automated email notifications
- Digital signature integration
- Mobile app for field work
- Integration with city systems

### **Analytics and Reporting**
- Advanced dashboard analytics
- Donation trend analysis
- Performance metrics
- Custom report generation

### **Integration Capabilities**
- Accounting system integration
- Inventory management integration
- CRM system integration
- Government system integration

## Technical Notes

### **File Storage**
- Documents stored in `/uploads/donations/`
- Unique file naming to prevent conflicts
- File type validation
- Size limits and security measures

### **Performance Optimization**
- Database indexes for fast queries
- Efficient relationship management
- Caching for frequently accessed data
- Optimized query structure

### **Security Considerations**
- File upload validation
- Access control for sensitive documents
- Audit trail for all actions
- Data backup and recovery

This enhanced donation management system provides a comprehensive solution for managing all aspects of museum donations, from initial receipt through final acknowledgment, ensuring proper documentation, workflow management, and donor recognition.
