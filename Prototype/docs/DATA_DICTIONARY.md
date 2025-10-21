# Museum Management System - Data Dictionary

## Overview
Complete database schema documentation for the Museum Management System.

---

## SYSTEM_USER Table
**Purpose:** User account management for administrators and staff

| Field Name | Data Type | Size | Constraints | Default | Description |
|------------|-----------|------|-------------|---------|-------------|
| user_ID | INT | 11 | PK, AUTO_INCREMENT | NULL | Unique user identifier |
| username | VARCHAR | 50 | NOT NULL, UNIQUE | NULL | Login username |
| firstname | VARCHAR | 50 | NOT NULL | NULL | First name |
| lastname | VARCHAR | 50 | NOT NULL | NULL | Last name |
| email | VARCHAR | 100 | NOT NULL, UNIQUE | NULL | Email address |
| profile_photo | VARCHAR | 500 | NULL | NULL | Profile image URL |
| permissions | LONGTEXT | - | NULL | NULL | JSON permissions |
| password | VARCHAR | 255 | NOT NULL | NULL | Hashed password |
| role | ENUM | - | NULL | 'staff' | 'admin' or 'staff' |
| status | ENUM | - | NULL | 'active' | 'active' or 'inactive' |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Creation time |

---

## USER_PERMISSIONS Table
**Purpose:** Granular user permissions

| Field Name | Data Type | Size | Constraints | Default | Description |
|------------|-----------|------|-------------|---------|-------------|
| permission_id | INT | 11 | PK, AUTO_INCREMENT | NULL | Permission ID |
| user_id | INT | 11 | NOT NULL, FK | NULL | User reference |
| permission_name | VARCHAR | 50 | NOT NULL | NULL | Permission name |
| is_allowed | TINYINT | 1 | NULL | 1 | Allow/deny flag |
| access_level | ENUM | - | NULL | 'none' | Access level |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Update time |

---

## USER_ACTIVITY_LOGS Table
**Purpose:** User activity tracking

| Field Name | Data Type | Size | Constraints | Default | Description |
|------------|-----------|------|-------------|---------|-------------|
| id | INT | 11 | PK, AUTO_INCREMENT | NULL | Log entry ID |
| user_id | INT | 11 | NULL, FK | NULL | User reference |
| action | VARCHAR | 100 | NOT NULL | NULL | Action performed |
| details | TEXT | - | NULL | NULL | Action details |
| ip_address | VARCHAR | 64 | NULL | NULL | User IP address |
| user_agent | VARCHAR | 255 | NULL | NULL | Browser info |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Action time |

---

## BOOKINGS Table
**Purpose:** Museum visit bookings

| Field Name | Data Type | Size | Constraints | Default | Description |
|------------|-----------|------|-------------|---------|-------------|
| booking_id | INT | 11 | PK, AUTO_INCREMENT | NULL | Booking ID |
| first_name | VARCHAR | 50 | NULL | NULL | Main visitor first name |
| last_name | VARCHAR | 50 | NULL | NULL | Main visitor last name |
| type | ENUM | - | NOT NULL | NULL | 'individual' or 'group' |
| institution | VARCHAR | 100 | NULL | NULL | Institution name |
| group_leader_email | VARCHAR | 100 | NULL | NULL | Group leader email |
| status | ENUM | - | NULL | 'pending' | Booking status |
| date | DATE | - | NOT NULL | NULL | Visit date |
| time_slot | VARCHAR | 20 | NOT NULL | NULL | Time slot |
| total_visitors | INT | 11 | NOT NULL | NULL | Visitor count |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Creation time |
| checkin_time | TIMESTAMP | - | NULL | NULL | Check-in time |
| backup_code | VARCHAR | 20 | NULL, UNIQUE | NULL | Backup code |
| qr_code | LONGTEXT | - | NULL | NULL | QR code data |
| checkin_status | ENUM | - | NULL | 'not-checked-in' | Check-in status |

---

## VISITORS Table
**Purpose:** Individual visitor information

| Field Name | Data Type | Size | Constraints | Default | Description |
|------------|-----------|------|-------------|---------|-------------|
| visitor_id | INT | 11 | PK, AUTO_INCREMENT | NULL | Visitor ID |
| booking_id | INT | 11 | NOT NULL, FK | NULL | Booking reference |
| first_name | VARCHAR | 50 | NULL | NULL | First name |
| last_name | VARCHAR | 50 | NULL | NULL | Last name |
| gender | ENUM | - | NULL | NULL | Gender selection |
| address | TEXT | - | NULL | NULL | Address |
| email | VARCHAR | 100 | NULL | NULL | Email address |
| nationality | VARCHAR | 50 | NOT NULL | 'local' | Nationality |
| visitor_type | ENUM | - | NULL | NULL | 'Local' or 'Foreign' |
| purpose | VARCHAR | 30 | NULL | NULL | Visit purpose |
| institution | VARCHAR | 100 | NULL | NULL | Institution |
| status | ENUM | - | NULL | 'pending' | Visit status |
| is_main_visitor | TINYINT | 1 | NULL | 0 | Main visitor flag |
| details_complete | TINYINT | 1 | NULL | 0 | Details complete flag |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Creation time |
| backup_code | VARCHAR | 20 | NULL | NULL | Backup code |
| qr_code | LONGTEXT | - | NULL | NULL | QR code data |
| checkin_status | ENUM | - | NULL | 'not-checked-in' | Check-in status |
| checkin_time | DATETIME | - | NULL | NULL | Check-in time |
| visitor_code | VARCHAR | 20 | NULL, UNIQUE | NULL | Unique visitor code |
| qr_code_sent | TINYINT | 1 | NULL | 0 | QR sent flag |
| checked_in_by | INT | 11 | NULL, FK | NULL | Check-in user |

---

## ADDITIONAL_VISITORS Table
**Purpose:** Group booking additional visitors

| Field Name | Data Type | Size | Constraints | Default | Description |
|------------|-----------|------|-------------|---------|-------------|
| token_id | VARCHAR | 50 | PK | NULL | Token ID |
| booking_id | INT | 11 | NOT NULL, FK | NULL | Booking reference |
| email | VARCHAR | 100 | NOT NULL | NULL | Email address |
| status | ENUM | - | NULL | 'pending' | Status |
| details | LONGTEXT | - | NULL | NULL | Visitor details |
| qr_generated_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | QR generation time |
| details_completed_at | TIMESTAMP | - | NULL | NULL | Details completion time |
| link_expires_at | TIMESTAMP | - | NULL | NULL | Link expiration |
| checkin_time | TIMESTAMP | - | NULL | NULL | Check-in time |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Creation time |

---

## ACTIVITIES Table
**Purpose:** Museum events and exhibits

| Field Name | Data Type | Size | Constraints | Default | Description |
|------------|-----------|------|-------------|---------|-------------|
| id | INT | 11 | PK, AUTO_INCREMENT | NULL | Activity ID |
| title | VARCHAR | 255 | NOT NULL | NULL | Activity title |
| description | TEXT | - | NULL | NULL | Description |
| type | ENUM | - | NOT NULL | NULL | 'event' or 'exhibit' |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Creation time |

---

## EVENT_DETAILS Table
**Purpose:** Event-specific information

| Field Name | Data Type | Size | Constraints | Default | Description |
|------------|-----------|------|-------------|---------|-------------|
| id | INT | 11 | PK, AUTO_INCREMENT | NULL | Event detail ID |
| activity_id | INT | 11 | NOT NULL, FK | NULL | Activity reference |
| start_date | DATE | - | NOT NULL | NULL | Start date |
| time | TIME | - | NOT NULL | NULL | Event time |
| location | VARCHAR | 255 | NOT NULL | NULL | Location |
| organizer | VARCHAR | 255 | NOT NULL | NULL | Organizer |
| max_capacity | INT | 11 | NULL | 50 | Maximum capacity |
| current_registrations | INT | 11 | NULL | 0 | Current registrations |

---

## EVENT_REGISTRATIONS Table
**Purpose:** Event registration management

| Field Name | Data Type | Size | Constraints | Default | Description |
|------------|-----------|------|-------------|---------|-------------|
| id | INT | 11 | PK, AUTO_INCREMENT | NULL | Registration ID |
| event_id | INT | 11 | NOT NULL, FK | NULL | Event reference |
| full_name | VARCHAR | 255 | NOT NULL | NULL | Registrant name |
| email | VARCHAR | 255 | NOT NULL | NULL | Email address |
| contact_number | VARCHAR | 50 | NULL | NULL | Phone number |
| institution | VARCHAR | 255 | NULL | NULL | Institution |
| registration_date | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Registration time |
| status | ENUM | - | NULL | 'registered' | Registration status |
| qr_code | VARCHAR | 255 | NULL | NULL | QR code |
| checkin_time | TIMESTAMP | - | NULL | NULL | Check-in time |

---

## CULTURAL_OBJECTS Table
**Purpose:** Museum artifacts and objects

| Field Name | Data Type | Size | Constraints | Default | Description |
|------------|-----------|------|-------------|---------|-------------|
| id | INT | 11 | PK, AUTO_INCREMENT | NULL | Object ID |
| name | VARCHAR | 255 | NOT NULL | NULL | Object name |
| category | VARCHAR | 100 | NOT NULL | NULL | Category |
| description | TEXT | - | NULL | NULL | Description |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Creation time |

---

## OBJECT_DETAILS Table
**Purpose:** Detailed object information

| Field Name | Data Type | Size | Constraints | Default | Description |
|------------|-----------|------|-------------|---------|-------------|
| id | INT | 11 | PK, AUTO_INCREMENT | NULL | Detail ID |
| cultural_object_id | INT | 11 | NOT NULL, FK | NULL | Object reference |
| period | VARCHAR | 100 | NULL | NULL | Historical period |
| origin | VARCHAR | 255 | NULL | NULL | Origin |
| material | VARCHAR | 255 | NULL | NULL | Material |
| dimensions | VARCHAR | 100 | NULL | NULL | Dimensions |
| condition_status | ENUM | - | NULL | 'good' | Condition status |
| acquisition_date | DATE | - | NULL | NULL | Acquisition date |
| acquisition_method | ENUM | - | NULL | NULL | Acquisition method |
| current_location | VARCHAR | 255 | NULL | NULL | Current location |
| estimated_value | DECIMAL | 15,2 | NULL | NULL | Estimated value |
| conservation_notes | TEXT | - | NULL | NULL | Conservation notes |
| exhibition_history | TEXT | - | NULL | NULL | Exhibition history |
| updated_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Update time |

---

## DONATIONS Table
**Purpose:** Museum donations

| Field Name | Data Type | Size | Constraints | Default | Description |
|------------|-----------|------|-------------|---------|-------------|
| id | INT | 11 | PK, AUTO_INCREMENT | NULL | Donation ID |
| donor_name | VARCHAR | 255 | NOT NULL | NULL | Donor name |
| donor_email | VARCHAR | 255 | NOT NULL | NULL | Donor email |
| donor_contact | VARCHAR | 100 | NULL | NULL | Contact info |
| type | ENUM | - | NOT NULL | NULL | Donation type |
| date_received | DATE | - | NULL | NULL | Receipt date |
| notes | TEXT | - | NULL | NULL | Notes |
| status | ENUM | - | NULL | 'pending' | Status |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Creation time |

---

## DONATION_DETAILS Table
**Purpose:** Detailed donation information

| Field Name | Data Type | Size | Constraints | Default | Description |
|------------|-----------|------|-------------|---------|-------------|
| id | INT | 11 | PK, AUTO_INCREMENT | NULL | Detail ID |
| donation_id | INT | 11 | NOT NULL, FK | NULL | Donation reference |
| amount | DECIMAL | 15,2 | NULL | NULL | Amount |
| method | VARCHAR | 100 | NULL | NULL | Payment method |
| item_description | TEXT | - | NULL | NULL | Item description |
| estimated_value | DECIMAL | 15,2 | NULL | NULL | Estimated value |
| condition | VARCHAR | 100 | NULL | NULL | Condition |
| loan_start_date | DATE | - | NULL | NULL | Loan start |
| loan_end_date | DATE | - | NULL | NULL | Loan end |

---

## IMAGES Table
**Purpose:** Image file management

| Field Name | Data Type | Size | Constraints | Default | Description |
|------------|-----------|------|-------------|---------|-------------|
| id | INT | 11 | PK, AUTO_INCREMENT | NULL | Image ID |
| activity_id | INT | 11 | NULL, FK | NULL | Activity reference |
| cultural_object_id | INT | 11 | NULL, FK | NULL | Object reference |
| url | VARCHAR | 500 | NOT NULL | NULL | Image URL |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Creation time |

---

## REPORTS Table
**Purpose:** System reports

| Field Name | Data Type | Size | Constraints | Default | Description |
|------------|-----------|------|-------------|---------|-------------|
| id | INT | 11 | PK, AUTO_INCREMENT | NULL | Report ID |
| user_id | INT | 11 | NOT NULL, FK | NULL | User reference |
| title | VARCHAR | 255 | NOT NULL | NULL | Report title |
| description | TEXT | - | NULL | NULL | Description |
| report_type | VARCHAR | 100 | NOT NULL | NULL | Report type |
| start_date | DATE | - | NOT NULL | NULL | Start date |
| end_date | DATE | - | NOT NULL | NULL | End date |
| content | LONGTEXT | - | NULL | NULL | Report content |
| data | LONGTEXT | - | NULL | NULL | Report data |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Update time |

---

## ARCHIVES Table
**Purpose:** Digital archives

| Field Name | Data Type | Size | Constraints | Default | Description |
|------------|-----------|------|-------------|---------|-------------|
| id | INT | 11 | PK, AUTO_INCREMENT | NULL | Archive ID |
| title | VARCHAR | 255 | NOT NULL | NULL | Archive title |
| description | TEXT | - | NULL | NULL | Description |
| date | DATE | - | NULL | NULL | Archive date |
| type | VARCHAR | 100 | NOT NULL | NULL | Archive type |
| tags | VARCHAR | 500 | NULL | NULL | Search tags |
| file_url | VARCHAR | 500 | NOT NULL | NULL | File URL |
| uploaded_by | VARCHAR | 100 | NULL | 'admin' | Uploader |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Creation time |

---

## Key Relationships

### Foreign Key Relationships
- USER_PERMISSIONS.user_id → SYSTEM_USER.user_ID
- USER_ACTIVITY_LOGS.user_id → SYSTEM_USER.user_ID
- VISITORS.booking_id → BOOKINGS.booking_id
- VISITORS.checked_in_by → SYSTEM_USER.user_ID
- ADDITIONAL_VISITORS.booking_id → BOOKINGS.booking_id
- EVENT_DETAILS.activity_id → ACTIVITIES.id
- EVENT_REGISTRATIONS.event_id → EVENT_DETAILS.id
- OBJECT_DETAILS.cultural_object_id → CULTURAL_OBJECTS.id
- DONATION_DETAILS.donation_id → DONATIONS.id
- IMAGES.activity_id → ACTIVITIES.id
- IMAGES.cultural_object_id → CULTURAL_OBJECTS.id
- REPORTS.user_id → SYSTEM_USER.user_ID

### Unique Constraints
- SYSTEM_USER.username (UNIQUE)
- SYSTEM_USER.email (UNIQUE)
- BOOKINGS.backup_code (UNIQUE)
- VISITORS.visitor_code (UNIQUE)

---

## Data Types Summary

| Data Type | Usage | Description |
|-----------|-------|-------------|
| INT(11) | IDs, counts | Integer values |
| VARCHAR | Text fields | Variable-length strings |
| TEXT | Long content | Large text fields |
| LONGTEXT | JSON, QR codes | Maximum text length |
| ENUM | Status, types | Predefined values |
| DATE | Dates only | Date without time |
| TIME | Time only | Time without date |
| DATETIME | Date and time | Date with time |
| TIMESTAMP | Auto timestamps | Auto-updating |
| DECIMAL(15,2) | Money values | Precise decimals |
| TINYINT(1) | Boolean flags | 0/1 values |

---

## Business Rules

1. **User Management**
   - Unique usernames and emails
   - Hashed passwords
   - Role-based permissions

2. **Booking System**
   - Multiple visitors per booking
   - QR code generation
   - Status tracking

3. **Visitor Tracking**
   - Individual check-in times
   - Unique visitor codes
   - Group management

4. **Event Management**
   - Capacity limits
   - Registration tracking
   - QR code access

5. **Cultural Objects**
   - Detailed metadata
   - Condition tracking
   - Value estimation

6. **Donations**
   - Multiple types
   - Status approval
   - Detailed records

7. **Media & Reports**
   - Image associations
   - User-generated reports
   - Data analytics

---

*This data dictionary documents the complete database schema for the Museum Management System.*
