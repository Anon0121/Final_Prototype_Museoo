# Visual Entity-Relationship Diagram (ERD)

## Database Schema Visualization

```
                    ┌─────────────────────────────────┐
                    │         SYSTEM_USER             │
                    │  ┌─────────────────────────────┐│
                    │  │ PK: id (INT, AUTO_INCREMENT) ││
                    │  │     username (VARCHAR)       ││
                    │  │     email (VARCHAR)          ││
                    │  │     password_hash (VARCHAR)   ││
                    │  │     role (VARCHAR)           ││
                    │  │     permissions (JSON)       ││
                    │  │     created_at (TIMESTAMP)   ││
                    │  └─────────────────────────────┘│
                    └─────────────────────────────────┘
                               │
                               │ 1:Many
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
    ┌─────────────────────────┐  ┌─────────────────────────┐
    │   USER_ACTIVITY_LOGS    │  │   USER_PERMISSIONS     │
    │  ┌─────────────────────┐│  │  ┌─────────────────────┐│
    │  │ PK: id              ││  │  │ PK: id              ││
    │  │ FK: user_id →       ││  │  │ FK: user_id →       ││
    │  │     system_user.id  ││  │  │     system_user.id  ││
    │  │     activity        ││  │  │     permission      ││
    │  │     timestamp       ││  │  │     granted_date    ││
    │  │     ip_address      ││  │  │     created_at      ││
    │  │     created_at      ││  │  └─────────────────────┘│
    │  └─────────────────────┘│  └─────────────────────────┘
    └─────────────────────────┘

                    ┌─────────────────────────────────┐
                    │           VISITORS              │
                    │  ┌─────────────────────────────┐│
                    │  │ PK: id (INT, AUTO_INCREMENT) ││
                    │  │     name (VARCHAR)           ││
                    │  │     email (VARCHAR)          ││
                    │  │     phone (VARCHAR)          ││
                    │  │     visit_date (DATE)        ││
                    │  │     purpose (VARCHAR)        ││
                    │  │     created_at (TIMESTAMP)   ││
                    │  └─────────────────────────────┘│
                    └─────────────────────────────────┘
                               │
                               │ 1:Many
                               │
                    ┌──────────┼──────────┼──────────┼──────────┐
                    │          │          │          │          │
                    ▼          ▼          ▼          ▼          ▼
    ┌─────────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐
    │ADDITIONAL_      │ │  BOOKINGS   │ │EVENT_       │ │DONATION_    │ │                 │
    │VISITORS         │ │             │ │REGISTRATIONS│ │VISITOR_     │ │                 │
    │┌───────────────┐│ │┌───────────┐│ │             │ │SUBMISSIONS  │ │                 │
    ││ PK: id        ││ ││ PK: id    ││ │┌───────────┐│ │┌───────────┐│ │                 │
    ││ FK: visitor_id││ ││ FK: visitor││ ││ PK: id    ││ ││ PK: id    ││ │                 │
    ││ → visitors.id ││ ││_id →      ││ ││ FK: event_││ ││ FK: visitor││ │                 │
    ││     name      ││ ││ visitors. ││ ││id →       ││ ││_id →      ││ │                 │
    ││     relation- ││ ││id         ││ ││event_     ││ ││visitors.id││ │                 │
    ││     ship      ││ ││ FK: event_││ ││details.id ││ ││     submi-││ │                 │
    ││     age       ││ ││id →       ││ ││ FK: visitor││ ││ssion_date ││ │                 │
    ││     created_at││ ││event_     ││ ││_id →      ││ ││     status││ │                 │
    │└───────────────┘│ ││details.id ││ ││visitors.id││ ││     notes ││ │                 │
    └─────────────────┘ ││     book- ││ ││     regis-││ ││     creat-││ │                 │
                        ││ing_date  ││ ││tration_  ││ ││ed_at     ││ │                 │
                        ││     status││ ││date      ││ │└───────────┘│ │                 │
                        ││     creat-││ ││     status││ └─────────────┘ │                 │
                        ││ed_at     ││ ││     creat-││                 │                 │
                        │└───────────┘│ ││ed_at     ││                 │                 │
                        └─────────────┘ │└───────────┘│                 │                 │
                                        └─────────────┘                 │                 │
                                                                        │                 │
                    ┌─────────────────────────────────┐                │                 │
                    │       CULTURAL_OBJECTS          │                │                 │
                    │  ┌─────────────────────────────┐│                │                 │
                    │  │ PK: id (INT, AUTO_INCREMENT) ││                │                 │
                    │  │     name (VARCHAR)           ││                │                 │
                    │  │     category (VARCHAR)       ││                │                 │
                    │  │     description (TEXT)       ││                │                 │
                    │  │     created_at (TIMESTAMP)   ││                │                 │
                    │  └─────────────────────────────┘│                │                 │
                    └─────────────────────────────────┘                │                 │
                               │                                      │                 │
                               │ 1:1                                  │                 │
                               │                                      │                 │
                               ▼                                      │                 │
                    ┌─────────────────────────────────┐                │                 │
                    │        OBJECT_DETAILS           │                │                 │
                    │  ┌─────────────────────────────┐│                │                 │
                    │  │ PK: id (INT, AUTO_INCREMENT) ││                │                 │
                    │  │ FK: cultural_object_id →    ││                │                 │
                    │  │     cultural_objects.id     ││                │                 │
                    │  │     period (VARCHAR)        ││                │                 │
                    │  │     origin (VARCHAR)        ││                │                 │
                    │  │     material (VARCHAR)      ││                │                 │
                    │  │     dimensions (VARCHAR)    ││                │                 │
                    │  │     condition_status (ENUM) ││                │                 │
                    │  │     acquisition_date (DATE) ││                │                 │
                    │  │     acquisition_method (ENUM││                │                 │
                    │  │     current_location (VARCHAR││                │                 │
                    │  │     estimated_value (DECIMAL││                │                 │
                    │  │     conservation_notes (TEXT││                │                 │
                    │  │     exhibition_history (TEXT││                │                 │
                    │  │     last_maintenance_date   ││                │                 │
                    │  │     next_maintenance_date   ││                │                 │
                    │  │     maintenance_frequency_  ││                │                 │
                    │  │     months (INT)           ││                │                 │
                    │  │     maintenance_notes (TEXT ││                │                 │
                    │  │     maintenance_priority    ││                │                 │
                    │  │     maintenance_status      ││                │                 │
                    │  │     maintenance_reminder_   ││                │                 │
                    │  │     enabled (BOOLEAN)       ││                │                 │
                    │  │     maintenance_contact    ││                │                 │
                    │  │     maintenance_cost        ││                │                 │
                    │  │     updated_at (TIMESTAMP)  ││                │                 │
                    │  │     created_at (TIMESTAMP)  ││                │                 │
                    │  └─────────────────────────────┘│                │                 │
                    └─────────────────────────────────┘                │                 │
                                                                        │                 │
                    ┌─────────────────────────────────┐                │                 │
                    │           DONATIONS              │                │                 │
                    │  ┌─────────────────────────────┐│                │                 │
                    │  │ PK: id (INT, AUTO_INCREMENT) ││                │                 │
                    │  │     donor_name (VARCHAR)    ││                │                 │
                    │  │     donor_email (VARCHAR)   ││                │                 │
                    │  │     donation_date (DATE)    ││                │                 │
                    │  │     status (VARCHAR)       ││                │                 │
                    │  │     total_value (DECIMAL)   ││                │                 │
                    │  │     created_at (TIMESTAMP)  ││                │                 │
                    │  └─────────────────────────────┘│                │                 │
                    └─────────────────────────────────┘                │                 │
                               │                                      │                 │
                               │ 1:Many                               │                 │
                               │                                      │                 │
                    ┌──────────┼──────────┼──────────┼──────────┼──────┘                 │
                    │          │          │          │          │                       │
                    ▼          ▼          ▼          ▼          ▼                       │
    ┌─────────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
    │DONATION_        │ │DONATION_    │ │DONATION_    │ │DONATION_    │ │DONATION_    │ │
    │DETAILS          │ │DOCUMENTS    │ │MEETING_     │ │CITY_HALL_   │ │WORKFLOW_    │ │
    │┌───────────────┐│ │┌───────────┐│ │SCHEDULE     │ │SUBMISSION   │ │LOG          │ │
    ││ PK: id        ││ ││ PK: id    ││ │┌───────────┐│ │┌───────────┐│ │┌───────────┐│ │
    ││ FK: donation_ ││ ││ FK: dona- ││ ││ PK: id    ││ ││ PK: id    ││ ││ PK: id    ││ │
    ││id → donations││ ││tion_id →  ││ ││ FK: dona- ││ ││ FK: dona- ││ ││ FK: dona- ││ │
    ││.id           ││ ││donations. ││ ││tion_id →  ││ ││tion_id →  ││ ││tion_id →  ││ │
    ││     item_name ││ ││id         ││ ││donations. ││ ││donations. ││ ││donations. ││ │
    ││     description││ ││     docu- ││ ││id         ││ ││id         ││ ││id         ││ │
    ││     estimated_││ ││ment_type  ││ ││     meet- ││ ││     submi-││ ││     step   ││ │
    ││value          ││ ││     file_ ││ ││ing_date   ││ ││ssion_date ││ ││     status ││ │
    ││     condition ││ ││path       ││ ││     meet- ││ ││     status││ ││     notes  ││ │
    ││     created_at││ ││     upload││ ││ing_time   ││ ││     notes ││ ││     times- ││ │
    │└───────────────┘│ ││_date      ││ ││     loca- ││ ││     creat-││ ││tamp       ││ │
    └─────────────────┘ ││     creat-││ ││tion       ││ ││ed_at     ││ ││     creat-││ │
                        ││ed_at     ││ ││     status││ │└───────────┘│ ││ed_at     ││ │
                        │└───────────┘│ ││     creat-││ └─────────────┘ │└───────────┘│ │
                        └─────────────┘ ││ed_at     ││                 │└─────────────┘ │
                                        │└───────────┘│                 └─────────────┘ │
                                        └─────────────┘                               │
                                                                                      │
                    ┌─────────────────────────────────┐                              │
                    │         EVENT_DETAILS           │                              │
                    │  ┌─────────────────────────────┐│                              │
                    │  │ PK: id (INT, AUTO_INCREMENT) ││                              │
                    │  │     title (VARCHAR)          ││                              │
                    │  │     description (TEXT)       ││                              │
                    │  │     event_date (DATE)        ││                              │
                    │  │     location (VARCHAR)       ││                              │
                    │  │     max_capacity (INT)       ││                              │
                    │  │     current_registrations    ││                              │
                    │  │     (INT)                    ││                              │
                    │  │     created_at (TIMESTAMP)   ││                              │
                    │  └─────────────────────────────┘│                              │
                    └─────────────────────────────────┘                              │
                               │                                                    │
                               │ 1:Many                                            │
                               │                                                    │
                    ┌──────────┼──────────┐                                        │
                    │          │          │                                        │
                    ▼          ▼          ▼                                        │
    ┌─────────────────┐ ┌─────────────┐ ┌─────────────┐                        │
    │  EVENT_          │ │  BOOKINGS   │ │             │                        │
    │  REGISTRATIONS   │ │             │ │             │                        │
    │┌───────────────┐│ │┌───────────┐│ │             │                        │
    ││ PK: id        ││ ││ PK: id    ││ │             │                        │
    ││ FK: event_id →││ ││ FK: visitor││ │             │                        │
    ││     event_    ││ ││_id →      ││ │             │                        │
    ││     details.id││ ││visitors.id││ │             │                        │
    ││ FK: visitor_id││ ││ FK: event_││ │             │                        │
    ││ → visitors.id ││ ││id →       ││ │             │                        │
    ││     registra- ││ ││event_     ││ │             │                        │
    ││tion_date      ││ ││details.id ││ │             │                        │
    ││     status    ││ ││     book- ││ │             │                        │
    ││     created_at││ ││ing_date  ││ │             │                        │
    │└───────────────┘│ ││     status││ │             │                        │
    └─────────────────┘ ││     creat-││ │             │                        │
                        ││ed_at     ││ │             │                        │
                        │└───────────┘│ │             │                        │
                        └─────────────┘ │             │                        │
                                        │             │                        │
                                        │             │                        │
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                        STANDALONE TABLES                                   │
    │                                                                             │
    │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
    │ │ ACTIVITIES  │ │AI_INSIGHTS  │ │   REPORTS   │ │   IMAGES    │          │
    │ │┌───────────┐│ │┌───────────┐│ │┌───────────┐│ │┌───────────┐│          │
    │ ││ PK: id    ││ ││ PK: id    ││ ││ PK: id    ││ ││ PK: id    ││          │
    │ ││     acti- ││ ││     insi- ││ ││     repo- ││ ││     file- ││          │
    │ ││vity_type  ││ ││ght_type   ││ ││rt_type    ││ ││name       ││          │
    │ ││     desc- ││ ││     cont- ││ ││     title ││ ││     file_ ││          │
    │ ││ription    ││ ││ent        ││ ││     cont- ││ ││path       ││          │
    │ ││     date  ││ ││     confi-││ ││ent        ││ ││     file_ ││          │
    │ ││     creat-││ ││dence_score││ ││     gene- ││ ││size       ││          │
    │ ││ed_at      ││ ││     creat-││ ││rated_date ││ ││     upload││          │
    │ │└───────────┘│ ││ed_at     ││ ││     creat-││ ││_date      ││          │
    │ └─────────────┘ │└───────────┘│ ││ed_at     ││ ││     creat-││          │
    │                 └─────────────┘ │└───────────┘│ ││ed_at     ││          │
    │                                 └─────────────┘ │└───────────┘│          │
    │                                                 └─────────────┘          │
    │                                                                             │
    │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                            │
    │ │  ARCHIVES   │ │EXHIBIT_     │ │PROMOTIONAL_ │                            │
    │ │             │ │DETAILS     │ │ITEMS        │                            │
    │ │┌───────────┐│ │┌───────────┐│ │┌───────────┐│                            │
    │ ││ PK: id    ││ ││ PK: id    ││ ││ PK: id    ││                            │
    │ ││     title ││ ││     title ││ ││     name  ││                            │
    │ ││     desc- ││ ││     desc- ││ ││     desc- ││                            │
    │ ││ription    ││ ││ription    ││ ││ription   ││                            │
    │ ││     file_ ││ ││     start_││ ││     price ││                            │
    │ ││path       ││ ││date       ││ ││     stock_││                            │
    │ ││     arch- ││ ││     end_  ││ ││quantity   ││                            │
    │ ││ive_date   ││ ││date       ││ ││     creat-││                            │
    │ ││     creat-││ ││     loca- ││ ││ed_at     ││                            │
    │ ││ed_at      ││ ││tion       ││ │└───────────┘│                            │
    │ │└───────────┘│ ││     creat-││ └─────────────┘                            │
    │ └─────────────┘ ││ed_at     ││                                            │
    │                 │└───────────┘│                                            │
    │                 └─────────────┘                                            │
    └─────────────────────────────────────────────────────────────────────────────┘
```

## Key Relationship Summary:

### **Primary Relationships (1:Many)**
1. **system_user** → **user_activity_logs** (user_id)
2. **system_user** → **user_permissions** (user_id)
3. **visitors** → **additional_visitors** (visitor_id)
4. **visitors** → **bookings** (visitor_id)
5. **visitors** → **event_registrations** (visitor_id)
6. **REMOVED** - donation_visitor_submissions (Donations are donor-only)
7. **cultural_objects** → **object_details** (cultural_object_id) - 1:1
8. **donations** → **donation_details** (donation_id)
9. **donations** → **donation_documents** (donation_id)
10. **donations** → **donation_meeting_schedule** (donation_id)
11. **donations** → **donation_city_hall_submission** (donation_id)
12. **donations** → **donation_workflow_log** (donation_id)
13. **event_details** → **event_registrations** (event_id)
14. **event_details** → **bookings** (event_id)

### **Standalone Tables (No Foreign Keys)**
- **activities**
- **ai_insights**
- **archives**
- **images**
- **reports**
- **exhibit_details**
- **promotional_items**

This visual representation shows the current database structure with all existing relationships. The standalone tables are those that don't currently have foreign key relationships defined in the schema.

