# New Donation Process Workflow Guide

## Overview
The museum has implemented a comprehensive donation process workflow that follows the exact process you specified. This new system ensures proper documentation, meeting scheduling, city hall approval, and automatic gratitude emails.

## New Donation Process Flow

### For Donors

#### 1. Schedule a Visit & Declare Donation
- **Action**: Donor submits a request through the system
- **Details**: They specify the date/time of their planned visit and what item(s) they intend to donate
- **System Response**: Request is stored with status "Request Received"
- **Staff Action**: Staff reviews the request and details of the intended donation

#### 2. Receive Meeting Schedule
- **Staff Action**: If acceptable, staff approves the request and schedules a meeting
- **System Response**: Official meeting schedule is sent back to the donor via email
- **Email Content**: Includes meeting date, time, location, and staff member details
- **Status Update**: Donation status changes to "Meeting Scheduled"

#### 3. Meeting & Handover
- **Action**: Donor meets with staff on the scheduled date
- **Process**: Donation item(s) are turned over for review and processing
- **Staff Action**: Staff marks meeting as completed and indicates if handover was successful
- **Status Update**: Donation status changes to "Meeting Completed" or "Handover Completed"

#### 4. Final Approval & Gratitude
- **Process**: After city hall approves the donation
- **System Response**: Donor receives an official confirmation email with gratitude message
- **Email Content**: Beautiful appreciation letter thanking them for their contribution
- **Status Update**: Donation status changes to "Final Approved"

### For Museum Staff/Admin

#### 1. Review Donor Request
- **Action**: Staff receives the donor's request in the admin dashboard
- **Review**: Check the schedule and details of the intended donation
- **Decision**: If acceptable, approve the request and schedule a meeting

#### 2. Meeting with Donor
- **Action**: Staff meets with the donor at the scheduled time
- **Process**: Item(s) are received and documented
- **System Update**: Mark meeting as completed and indicate handover status

#### 3. Processing Donation
- **Action**: Staff submits the donation to city hall for approval
- **System Update**: Donation status is marked as "City Hall Processing"
- **Documentation**: Staff uploads supporting documents, photographs, and proof of donation

#### 4. Final Approval
- **Action**: Once city hall approves, staff/admin updates the system by clicking "Final Approve"
- **System Response**: Donation status changes to "Final Approved"
- **Storage**: System stores all final files, photos, and donation contract
- **Email**: System automatically sends a thank-you email to the donor

## Database Changes

### New Tables Added:
1. **donation_meeting_schedule** - Tracks meeting details and status
2. **donation_city_hall_submission** - Tracks city hall submission process
3. **donation_handover_documents** - Stores handover-related documents

### New Fields Added to donations table:
- `request_date` - When the donation request was submitted
- `preferred_visit_date` - Donor's preferred visit date
- `preferred_visit_time` - Donor's preferred visit time
- `meeting_scheduled` - Boolean flag for meeting scheduling
- `meeting_date` - Scheduled meeting date
- `meeting_time` - Scheduled meeting time
- `meeting_location` - Meeting location
- `meeting_notes` - Notes about the meeting
- `meeting_completed` - Boolean flag for meeting completion
- `handover_completed` - Boolean flag for handover completion
- `city_hall_submitted` - Boolean flag for city hall submission
- `city_hall_submission_date` - Date submitted to city hall
- `city_hall_approval_date` - Date approved by city hall
- `final_approval_date` - Date of final approval
- `gratitude_email_sent` - Boolean flag for gratitude email

### Updated processing_stage enum:
- `request_received` - Initial request submitted
- `under_review` - Being reviewed by staff
- `meeting_scheduled` - Meeting has been scheduled
- `meeting_completed` - Meeting completed
- `handover_completed` - Donation handover completed
- `city_hall_processing` - Submitted to city hall
- `city_hall_approved` - Approved by city hall
- `final_approved` - Finally approved by museum
- `completed` - Process fully completed
- `rejected` - Request rejected

## API Endpoints

### New Endpoints Added:

#### 1. Submit Donation Request
- **POST** `/api/donations/request`
- **Purpose**: For donors to submit donation requests
- **Fields**: Includes preferred visit date/time

#### 2. Schedule Meeting
- **POST** `/api/donations/:id/schedule-meeting`
- **Purpose**: For staff to schedule meetings with donors
- **Response**: Sends meeting schedule email to donor

#### 3. Complete Meeting
- **POST** `/api/donations/:id/complete-meeting`
- **Purpose**: For staff to mark meeting as completed
- **Fields**: Meeting notes and handover status

#### 4. Submit to City Hall
- **POST** `/api/donations/:id/submit-city-hall`
- **Purpose**: For staff to submit donation to city hall
- **Fields**: Submission documents and reference number

#### 5. City Hall Approval
- **POST** `/api/donations/:id/city-hall-approve`
- **Purpose**: For staff to mark city hall approval
- **Fields**: Approval notes

#### 6. Final Approval
- **POST** `/api/donations/:id/final-approve`
- **Purpose**: For staff to give final approval
- **Response**: Sends gratitude email to donor

#### 7. Get Process Status
- **GET** `/api/donations/:id/process-status`
- **Purpose**: Get detailed process status for a donation

#### 8. Get All Requests
- **GET** `/api/donations/requests`
- **Purpose**: Get all donation requests for staff dashboard

## Frontend Changes

### Updated Donation Component:
1. **New Form Fields**: Added preferred visit date and time
2. **Process Status Display**: Shows current stage in the donation process
3. **Action Buttons**: Context-sensitive buttons based on process stage
4. **Meeting Schedule Modal**: For scheduling meetings with donors
5. **City Hall Submission Modal**: For submitting to city hall
6. **Final Approval Modal**: For final approval process

### Process Status Indicators:
- **Request Received** (Blue) - Initial request submitted
- **Under Review** (Yellow) - Being reviewed by staff
- **Meeting Scheduled** (Purple) - Meeting has been scheduled
- **Meeting Completed** (Indigo) - Meeting completed
- **Handover Completed** (Cyan) - Donation handover completed
- **City Hall Processing** (Orange) - Submitted to city hall
- **City Hall Approved** (Emerald) - Approved by city hall
- **Final Approved** (Green) - Finally approved by museum
- **Completed** (Gray) - Process fully completed
- **Rejected** (Red) - Request rejected

## Email Templates

### 1. Meeting Schedule Email
- **Trigger**: When staff schedules a meeting
- **Content**: Meeting details, location, staff member, preparation instructions
- **Design**: Professional museum branding

### 2. Gratitude Email
- **Trigger**: When final approval is given
- **Content**: Thank you message, donation details, contact information
- **Design**: Beautiful appreciation letter with museum branding

## Installation Instructions

### 1. Run Database Migration
```bash
cd Prototype/backend
node run-donation-migration.js
```

### 2. Restart Backend Server
```bash
npm start
```

### 3. Restart Frontend
```bash
cd Prototype/Museoo
npm run dev
```

## Usage Instructions

### For Staff/Admin:
1. **View Requests**: Go to Donation Management page
2. **Schedule Meeting**: Click "Schedule Meeting" for new requests
3. **Complete Meeting**: Click "Complete Meeting" after meeting
4. **Submit to City Hall**: Click "Submit to City Hall" after handover
5. **Mark City Hall Approval**: Click "City Hall Approved" when approved
6. **Final Approval**: Click "Final Approve" to complete process

### For Donors:
1. **Submit Request**: Fill out donation request form with preferred visit date/time
2. **Receive Email**: Get meeting schedule email from staff
3. **Attend Meeting**: Meet with staff at scheduled time
4. **Receive Gratitude**: Get appreciation email after final approval

## Benefits of New Process

1. **Structured Workflow**: Clear steps from request to final approval
2. **Meeting Scheduling**: Proper coordination between donors and staff
3. **City Hall Integration**: Formal approval process through city hall
4. **Automatic Emails**: Professional communication with donors
5. **Document Tracking**: Complete audit trail of the donation process
6. **Status Visibility**: Clear visibility of where each donation is in the process
7. **Staff Efficiency**: Streamlined workflow for staff management

## Support

For any issues or questions about the new donation process, please refer to this guide or contact the system administrator.

