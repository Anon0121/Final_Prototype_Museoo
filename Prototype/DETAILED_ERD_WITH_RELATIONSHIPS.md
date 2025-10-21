# Detailed Entity-Relationship Diagram (ERD) with Primary and Foreign Keys

## Complete Database Schema with PK-FK Relationships

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SYSTEM_USER (Parent)                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ PK: id (INT, AUTO_INCREMENT)                                                   │
│     username (VARCHAR)                                                         │
│     email (VARCHAR)                                                            │
│     password_hash (VARCHAR)                                                    │
│     role (VARCHAR)                                                             │
│     permissions (JSON)                                                         │
│     created_at (TIMESTAMP)                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                │
                                │ 1:Many
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         USER_ACTIVITY_LOGS (Child)                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│ PK: id (INT, AUTO_INCREMENT)                                                   │
│ FK: user_id (INT) → system_user.id                                             │
│     activity (VARCHAR)                                                         │
│     timestamp (TIMESTAMP)                                                      │
│     ip_address (VARCHAR)                                                       │
│     created_at (TIMESTAMP)                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              VISITORS (Parent)                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│ PK: id (INT, AUTO_INCREMENT)                                                   │
│     name (VARCHAR)                                                             │
│     email (VARCHAR)                                                            │
│     phone (VARCHAR)                                                            │
│     visit_date (DATE)                                                          │
│     purpose (VARCHAR)                                                          │
│     created_at (TIMESTAMP)                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                │
                                │ 1:Many
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ADDITIONAL_VISITORS (Child)                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│ PK: id (INT, AUTO_INCREMENT)                                                   │
│ FK: visitor_id (INT) → visitors.id                                             │
│     name (VARCHAR)                                                             │
│     relationship (VARCHAR)                                                     │
│     age (INT)                                                                  │
│     created_at (TIMESTAMP)                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            CULTURAL_OBJECTS (Parent)                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│ PK: id (INT, AUTO_INCREMENT)                                                   │
│     name (VARCHAR)                                                             │
│     category (VARCHAR)                                                         │
│     description (TEXT)                                                         │
│     created_at (TIMESTAMP)                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                │
                                │ 1:1
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          OBJECT_DETAILS (Child)                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│ PK: id (INT, AUTO_INCREMENT)                                                   │
│ FK: cultural_object_id (INT) → cultural_objects.id                            │
│     period (VARCHAR)                                                           │
│     origin (VARCHAR)                                                           │
│     material (VARCHAR)                                                         │
│     dimensions (VARCHAR)                                                       │
│     condition_status (ENUM)                                                    │
│     acquisition_date (DATE)                                                    │
│     acquisition_method (ENUM)                                                  │
│     current_location (VARCHAR)                                                 │
│     estimated_value (DECIMAL)                                                  │
│     conservation_notes (TEXT)                                                  │
│     exhibition_history (TEXT)                                                  │
│     last_maintenance_date (DATE)                                               │
│     next_maintenance_date (DATE)                                               │
│     maintenance_frequency_months (INT)                                         │
│     maintenance_notes (TEXT)                                                   │
│     maintenance_priority (ENUM)                                                │
│     maintenance_status (ENUM)                                                  │
│     maintenance_reminder_enabled (BOOLEAN)                                     │
│     maintenance_contact (VARCHAR)                                              │
│     maintenance_cost (DECIMAL)                                                 │
│     updated_at (TIMESTAMP)                                                     │
│     created_at (TIMESTAMP)                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                               DONATIONS (Parent)                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│ PK: id (INT, AUTO_INCREMENT)                                                   │
│     donor_name (VARCHAR)                                                       │
│     donor_email (VARCHAR)                                                      │
│     donation_date (DATE)                                                       │
│     status (VARCHAR)                                                           │
│     total_value (DECIMAL)                                                      │
│     created_at (TIMESTAMP)                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                │
                                │ 1:Many
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DONATION_DETAILS (Child)                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│ PK: id (INT, AUTO_INCREMENT)                                                   │
│ FK: donation_id (INT) → donations.id                                           │
│     item_name (VARCHAR)                                                        │
│     description (TEXT)                                                         │
│     estimated_value (DECIMAL)                                                  │
│     condition (VARCHAR)                                                        │
│     created_at (TIMESTAMP)                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DONATION_DOCUMENTS (Child)                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│ PK: id (INT, AUTO_INCREMENT)                                                   │
│ FK: donation_id (INT) → donations.id                                           │
│     document_type (VARCHAR)                                                    │
│     file_path (VARCHAR)                                                        │
│     upload_date (DATE)                                                         │
│     created_at (TIMESTAMP)                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                      DONATION_MEETING_SCHEDULE (Child)                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│ PK: id (INT, AUTO_INCREMENT)                                                   │
│ FK: donation_id (INT) → donations.id                                           │
│     meeting_date (DATE)                                                        │
│     meeting_time (TIME)                                                        │
│     location (VARCHAR)                                                         │
│     status (VARCHAR)                                                           │
│     created_at (TIMESTAMP)                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DONATION_CITY_HALL_SUBMISSION (Child)                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│ PK: id (INT, AUTO_INCREMENT)                                                   │
│ FK: donation_id (INT) → donations.id                                           │
│     submission_date (DATE)                                                     │
│     status (VARCHAR)                                                           │
│     notes (TEXT)                                                               │
│     created_at (TIMESTAMP)                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                       DONATION_WORKFLOW_LOG (Child)                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│ PK: id (INT, AUTO_INCREMENT)                                                   │
│ FK: donation_id (INT) → donations.id                                           │
│     step (VARCHAR)                                                             │
│     status (VARCHAR)                                                           │
│     notes (TEXT)                                                               │
│     timestamp (TIMESTAMP)                                                      │
│     created_at (TIMESTAMP)                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            EVENT_DETAILS (Parent)                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ PK: id (INT, AUTO_INCREMENT)                                                   │
│     title (VARCHAR)                                                            │
│     description (TEXT)                                                         │
│     event_date (DATE)                                                          │
│     location (VARCHAR)                                                         │
│     max_capacity (INT)                                                         │
│     current_registrations (INT)                                                │
│     created_at (TIMESTAMP)                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                │
                                │ 1:Many
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       EVENT_REGISTRATIONS (Child)                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ PK: id (INT, AUTO_INCREMENT)                                                   │
│ FK: event_id (INT) → event_details.id                                          │
│ FK: visitor_id (INT) → visitors.id                                             │
│     registration_date (DATE)                                                   │
│     status (VARCHAR)                                                           │
│     created_at (TIMESTAMP)                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                               BOOKINGS (Child)                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│ PK: id (INT, AUTO_INCREMENT)                                                   │
│ FK: visitor_id (INT) → visitors.id                                             │
│ FK: event_id (INT) → event_details.id                                          │
│     booking_date (DATE)                                                        │
│     status (VARCHAR)                                                           │
│     created_at (TIMESTAMP)                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DONATION_VISITOR_SUBMISSIONS (Child)                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│ PK: id (INT, AUTO_INCREMENT)                                                   │
│ FK: visitor_id (INT) → visitors.id                                             │
│     submission_date (DATE)                                                     │
│     status (VARCHAR)                                                           │
│     notes (TEXT)                                                               │
│     created_at (TIMESTAMP)                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                         USER_PERMISSIONS (Child)                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│ PK: id (INT, AUTO_INCREMENT)                                                   │
│ FK: user_id (INT) → system_user.id                                             │
│     permission (VARCHAR)                                                       │
│     granted_date (DATE)                                                        │
│     created_at (TIMESTAMP)                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            STANDALONE TABLES                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│ │   ACTIVITIES    │  │   AI_INSIGHTS   │  │    REPORTS      │                │
│ │                 │  │                 │  │                 │                │
│ │ PK: id          │  │ PK: id          │  │ PK: id          │                │
│ │     activity_   │  │     insight_    │  │     report_     │                │
│ │     type        │  │     type        │  │     type        │                │
│ │     description │  │     content     │  │     title       │                │
│ │     date        │  │     confidence_ │  │     content     │                │
│ │     created_at  │  │     score       │  │     generated_  │                │
│ │                 │  │     created_at  │  │     date        │                │
│ └─────────────────┘  │                 │  │     created_at  │                │
│                      └─────────────────┘  │                 │                │
│                                           └─────────────────┘                │
│                                                                                 │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│ │     IMAGES      │  │    ARCHIVES     │  │EXHIBIT_DETAILS  │                │
│ │                 │  │                 │  │                 │                │
│ │ PK: id          │  │ PK: id          │  │ PK: id          │                │
│ │     filename    │  │     title       │  │     title       │                │
│ │     file_path   │  │     description │  │     description │                │
│ │     file_size   │  │     file_path   │  │     start_date  │                │
│ │     upload_date │  │     archive_    │  │     end_date    │                │
│ │     created_at  │  │     date        │  │     location    │                │
│ │                 │  │     created_at  │  │     created_at  │                │
│ └─────────────────┘  │                 │  │                 │                │
│                      └─────────────────┘  │                 │                │
│                                           └─────────────────┘                │
│                                                                                 │
│ ┌─────────────────┐                                                           │
│ │ PROMOTIONAL_    │                                                           │
│ │ ITEMS           │                                                           │
│ │                 │                                                           │
│ │ PK: id          │                                                           │
│ │     name        │                                                           │
│ │     description │                                                           │
│ │     price       │                                                           │
│ │     stock_      │                                                           │
│ │     quantity    │                                                           │
│ │     created_at  │                                                           │
│ └─────────────────┘                                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Relationship Summary

### Primary Relationships (1:Many)

1. **system_user** (1) → **user_activity_logs** (Many)
   - PK: system_user.id → FK: user_activity_logs.user_id

2. **system_user** (1) → **user_permissions** (Many)
   - PK: system_user.id → FK: user_permissions.user_id

3. **visitors** (1) → **additional_visitors** (Many)
   - PK: visitors.id → FK: additional_visitors.visitor_id

4. **visitors** (1) → **bookings** (Many)
   - PK: visitors.id → FK: bookings.visitor_id

5. **visitors** (1) → **event_registrations** (Many)
   - PK: visitors.id → FK: event_registrations.visitor_id

6. **REMOVED** - donation_visitor_submissions (Donations are donor-only, no visitor link)

7. **cultural_objects** (1) → **object_details** (1)
   - PK: cultural_objects.id → FK: object_details.cultural_object_id

8. **donations** (1) → **donation_details** (Many)
   - PK: donations.id → FK: donation_details.donation_id

9. **donations** (1) → **donation_documents** (Many)
   - PK: donations.id → FK: donation_documents.donation_id

10. **donations** (1) → **donation_meeting_schedule** (Many)
    - PK: donations.id → FK: donation_meeting_schedule.donation_id

11. **donations** (1) → **donation_city_hall_submission** (Many)
    - PK: donations.id → FK: donation_city_hall_submission.donation_id

12. **donations** (1) → **donation_workflow_log** (Many)
    - PK: donations.id → FK: donation_workflow_log.donation_id

13. **event_details** (1) → **event_registrations** (Many)
    - PK: event_details.id → FK: event_registrations.event_id

14. **event_details** (1) → **bookings** (Many)
    - PK: event_details.id → FK: bookings.event_id

### Standalone Tables (No Foreign Keys)

- **activities**
- **ai_insights**
- **archives**
- **images**
- **reports**
- **exhibit_details**
- **promotional_items**

## Key Database Design Features

1. **Referential Integrity**: All foreign keys properly reference primary keys
2. **Cascade Operations**: Foreign key constraints ensure data consistency
3. **Audit Trails**: Most tables include created_at timestamps
4. **Flexible Permissions**: JSON-based permissions in system_user table
5. **Comprehensive Maintenance**: Detailed maintenance tracking in object_details
6. **Workflow Management**: Complete donation process workflow tracking
7. **Event Management**: Full event and booking management system

## Data Flow Patterns

1. **User Management**: system_user → user_activity_logs, user_permissions
2. **Visitor Management**: visitors → additional_visitors, bookings, event_registrations
3. **Cultural Object Management**: cultural_objects → object_details (with maintenance)
4. **Donation Management**: donations → multiple related tables for complete workflow
5. **Event Management**: event_details → event_registrations, bookings
6. **Audit and Logging**: Activities, reports, and user activity tracking

