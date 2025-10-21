# Enhanced ERD with Missing Foreign Keys

## Improved Database Schema with Suggested Relationships

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
                    ┌──────────┴──────────┼──────────┼──────────┐
                    │                     │          │          │
                    ▼                     ▼          ▼          ▼
    ┌─────────────────────────┐  ┌─────────────────┐ ┌─────────────┐ ┌─────────────┐
    │   USER_ACTIVITY_LOGS    │  │USER_PERMISSIONS │ │ ACTIVITIES  │ │   REPORTS   │
    │  ┌─────────────────────┐│  │ ┌─────────────┐ │ │┌───────────┐│ │┌───────────┐│
    │  │ PK: id              ││  │ │ PK: id     │ │ ││ PK: id    ││ ││ PK: id    ││
    │  │ FK: user_id →       ││  │ │ FK: user_id│ │ ││ FK: user_ ││ ││ FK: user_ ││
    │  │     system_user.id  ││  │ │ → system_  │ │ ││id →       ││ ││id →       ││
    │  │     activity        ││  │ │   user.id  │ │ ││system_    ││ ││system_    ││
    │  │     timestamp       ││  │ │     permi- │ │ ││user.id    ││ ││user.id    ││
    │  │     ip_address      ││  │ │     ssion  │ │ ││     acti- ││ ││     repo- ││
    │  │     created_at      ││  │ │     granted│ │ ││vity_type  ││ ││rt_type    ││
    │  └─────────────────────┘│  │ │     _date  │ │ ││     desc- ││ ││     title ││
    └─────────────────────────┘  │ │     creat- │ │ ││ription    ││ ││     cont- ││
                                │ │ed_at     │ │ ││     date   ││ ││ent        ││
                                │ └─────────────┘ │ │     creat-││ ││     gene- ││
                                └─────────────────┘ ││ed_at     ││ ││rated_date ││
                                                   │└───────────┘│ ││     creat-││
                                                   └─────────────┘ ││ed_at     ││
                                                                  │└───────────┘│
                                                                  └─────────────┘

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
                    ┌──────────┼──────────┼──────────┼──────────┼──────────┐
                    │          │          │          │          │          │
                    ▼          ▼          ▼          ▼          ▼          ▼
    ┌─────────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ADDITIONAL_      │ │  BOOKINGS   │ │EVENT_       │ │DONATION_    │ │             │ │             │
    │VISITORS         │ │             │ │REGISTRATIONS│ │VISITOR_     │ │             │ │             │
    │┌───────────────┐│ │┌───────────┐│ │             │ │SUBMISSIONS  │ │             │ │             │
    ││ PK: id        ││ ││ PK: id    ││ │┌───────────┐│ │┌───────────┐│ │             │ │             │
    ││ FK: visitor_id││ ││ FK: visitor││ ││ PK: id    ││ ││ PK: id    ││ │             │ │             │
    ││ → visitors.id ││ ││_id →      ││ ││ FK: event_││ ││ FK: visitor││ │             │ │             │
    ││     name      ││ ││ visitors. ││ ││id →       ││ ││_id →      ││ │             │ │             │
    ││     relation- ││ ││id         ││ ││event_     ││ ││visitors.id││ │             │ │             │
    ││     ship      ││ ││ FK: event_││ ││details.id ││ ││     submi-││ │             │ │             │
    ││     age       ││ ││id →       ││ ││ FK: visitor││ ││ssion_date ││ │             │ │             │
    ││     created_at││ ││event_     ││ ││_id →      ││ ││     status││ │             │ │             │
    │└───────────────┘│ ││details.id ││ ││visitors.id││ ││     notes ││ │             │ │             │
    └─────────────────┘ ││     book- ││ ││     regis-││ ││     creat-││ │             │ │             │
                        ││ing_date  ││ ││tration_  ││ ││ed_at     ││ │             │ │             │
                        ││     status││ ││date      ││ │└───────────┘│ │             │ │             │
                        ││     creat-││ ││     status││ └─────────────┘ │             │ │             │
                        ││ed_at     ││ ││     creat-││                 │             │ │             │
                        │└───────────┘│ ││ed_at     ││                 │             │ │             │
                        └─────────────┘ │└───────────┘│                 │             │ │             │
                                        └─────────────┘                 │             │ │             │
                                                                        │             │ │             │
                    ┌─────────────────────────────────┐                │             │ │             │
                    │       CULTURAL_OBJECTS          │                │             │ │             │
                    │  ┌─────────────────────────────┐│                │             │ │             │
                    │  │ PK: id (INT, AUTO_INCREMENT) ││                │             │ │             │
                    │  │     name (VARCHAR)           ││                │             │ │             │
                    │  │     category (VARCHAR)       ││                │             │ │             │
                    │  │     description (TEXT)       ││                │             │ │             │
                    │  │     created_at (TIMESTAMP)   ││                │             │ │             │
                    │  └─────────────────────────────┘│                │             │ │             │
                    └─────────────────────────────────┘                │             │ │             │
                               │                                      │             │ │             │
                               │ 1:Many                               │             │ │             │
                               │                                      │             │ │             │
                    ┌──────────┼──────────┼──────────┼──────────┐    │             │ │             │
                    │          │          │          │          │    │             │ │             │
                    ▼          ▼          ▼          ▼          ▼    │             │ │             │
    ┌─────────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │             │ │             │
    │OBJECT_DETAILS   │ │   IMAGES    │ │AI_INSIGHTS  │ │  ARCHIVES   │ │             │ │             │
    │┌───────────────┐│ │┌───────────┐│ │┌───────────┐│ │┌───────────┐│ │             │ │             │
    ││ PK: id        ││ ││ PK: id    ││ ││ PK: id    ││ ││ PK: id    ││ │             │ │             │
    ││ FK: cultural_ ││ ││ FK: cult- ││ ││ FK: cult- ││ ││ FK: cult- ││ │             │ │             │
    ││object_id →    ││ ││ural_      ││ ││ural_      ││ ││ural_      ││ │             │ │             │
    ││cultural_      ││ ││object_id →││ ││object_id →││ ││object_id →││ │             │ │             │
    ││objects.id     ││ ││cultural_  ││ ││cultural_  ││ ││cultural_  ││ │             │ │             │
    ││     period    ││ ││objects.id ││ ││objects.id ││ ││objects.id ││ │             │ │             │
    ││     origin    ││ ││     file- ││ ││     insi- ││ ││     title ││ │             │ │             │
    ││     material  ││ ││name       ││ ││ght_type   ││ ││     desc- ││ │             │ │             │
    ││     dimensions││ ││     file_ ││ ││     cont- ││ ││ription    ││ │             │ │             │
    ││     condition_││ ││path       ││ ││ent        ││ ││     file_ ││ │             │ │             │
    ││status         ││ ││     file_ ││ ││     confi-││ ││path       ││ │             │ │             │
    ││     acquisit- ││ ││size       ││ ││dence_score││ ││     arch- ││ │             │ │             │
    ││ion_date       ││ ││     upload││ ││     creat-││ ││ive_date   ││ │             │ │             │
    ││     acquisit- ││ ││_date      ││ ││ed_at     ││ ││     creat-││ │             │ │             │
    ││ion_method     ││ ││     creat-││ │└───────────┘│ ││ed_at     ││ │             │ │             │
    ││     current_  ││ ││ed_at     ││ └─────────────┘ │└───────────┘│ │             │ │             │
    ││location       ││ │└───────────┘                 └─────────────┘ │             │ │             │
    ││     estimated_││ └─────────────┘                               │             │ │             │
    ││value          ││                                             │             │ │             │
    ││     conserva- ││                                             │             │ │             │
    ││tion_notes     ││                                             │             │ │             │
    ││     exhibit-  ││                                             │             │ │             │
    ││ion_history    ││                                             │             │ │             │
    ││     last_     ││                                             │             │ │             │
    ││maintenance_   ││                                             │             │ │             │
    ││date           ││                                             │             │ │             │
    ││     next_     ││                                             │             │ │             │
    ││maintenance_   ││                                             │             │ │             │
    ││date           ││                                             │             │ │             │
    ││     mainten-  ││                                             │             │ │             │
    ││ance_frequency_││                                             │             │ │             │
    ││months         ││                                             │             │ │             │
    ││     mainten-  ││                                             │             │ │             │
    ││ance_notes     ││                                             │             │ │             │
    ││     mainten-  ││                                             │             │ │             │
    ││ance_priority  ││                                             │             │ │             │
    ││     mainten-  ││                                             │             │ │             │
    ││ance_status    ││                                             │             │ │             │
    ││     mainten-  ││                                             │             │ │             │
    ││ance_reminder_ ││                                             │             │ │             │
    ││enabled        ││                                             │             │ │             │
    ││     mainten-  ││                                             │             │ │             │
    ││ance_contact   ││                                             │             │ │             │
    ││     mainten-  ││                                             │             │ │             │
    ││ance_cost      ││                                             │             │ │             │
    ││     updated_at││                                             │             │ │             │
    ││     created_at││                                             │             │ │             │
    │└───────────────┘│                                             │             │ │             │
    └─────────────────┘                                             │             │ │             │
                                                                   │             │ │             │
                    ┌─────────────────────────────────┐           │             │ │             │
                    │           DONATIONS              │           │             │ │             │
                    │  ┌─────────────────────────────┐│           │             │ │             │
                    │  │ PK: id (INT, AUTO_INCREMENT) ││           │             │ │             │
                    │  │     donor_name (VARCHAR)    ││           │             │ │             │
                    │  │     donor_email (VARCHAR)   ││           │             │ │             │
                    │  │     donation_date (DATE)    ││           │             │ │             │
                    │  │     status (VARCHAR)       ││           │             │ │             │
                    │  │     total_value (DECIMAL)   ││           │             │ │             │
                    │  │     created_at (TIMESTAMP)  ││           │             │ │             │
                    │  └─────────────────────────────┘│           │             │ │             │
                    └─────────────────────────────────┘           │             │ │             │
                               │                                 │             │ │             │
                               │ 1:Many                         │             │ │             │
                               │                                 │             │ │             │
                    ┌──────────┼──────────┼──────────┼──────────┼──────────────┘             │
                    │          │          │          │          │                             │
                    ▼          ▼          ▼          ▼          ▼                             │
    ┌─────────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
    │DONATION_        │ │DONATION_    │ │DONATION_    │ │DONATION_    │ │DONATION_    │      │
    │DETAILS          │ │DOCUMENTS    │ │MEETING_     │ │CITY_HALL_   │ │WORKFLOW_    │      │
    │┌───────────────┐│ │┌───────────┐│ │SCHEDULE     │ │SUBMISSION   │ │LOG          │      │
    ││ PK: id        ││ ││ PK: id    ││ │┌───────────┐│ │┌───────────┐│ │┌───────────┐│      │
    ││ FK: donation_ ││ ││ FK: dona- ││ ││ PK: id    ││ ││ PK: id    ││ ││ PK: id    ││      │
    ││id → donations││ ││tion_id →  ││ ││ FK: dona- ││ ││ FK: dona- ││ ││ FK: dona- ││      │
    ││.id           ││ ││donations. ││ ││tion_id →  ││ ││tion_id →  ││ ││tion_id →  ││      │
    ││     item_name ││ ││id         ││ ││donations. ││ ││donations. ││ ││donations. ││      │
    ││     description││ ││     docu- ││ ││id         ││ ││id         ││ ││id         ││      │
    ││     estimated_││ ││ment_type  ││ ││     meet- ││ ││     submi-││ ││     step   ││      │
    ││value          ││ ││     file_ ││ ││ing_date   ││ ││ssion_date ││ ││     status ││      │
    ││     condition ││ ││path       ││ ││     meet- ││ ││     status││ ││     notes  ││      │
    ││     created_at││ ││     upload││ ││ing_time   ││ ││     notes ││ ││     times- ││      │
    │└───────────────┘│ ││_date      ││ ││     loca- ││ ││     creat-││ ││tamp       ││      │
    └─────────────────┘ ││     creat-││ ││tion       ││ ││ed_at     ││ ││     creat-││      │
                        ││ed_at     ││ ││     status││ │└───────────┘│ ││ed_at     ││      │
                        │└───────────┘│ ││     creat-││ └─────────────┘ │└───────────┘│      │
                        └─────────────┘ ││ed_at     ││                 │└─────────────┘      │
                                        │└───────────┘│                 └─────────────┘      │
                                        └─────────────┘                                     │
                                                                                           │
                    ┌─────────────────────────────────┐                                   │
                    │         EVENT_DETAILS           │                                   │
                    │  ┌─────────────────────────────┐│                                   │
                    │  │ PK: id (INT, AUTO_INCREMENT) ││                                   │
                    │  │     title (VARCHAR)          ││                                   │
                    │  │     description (TEXT)       ││                                   │
                    │  │     event_date (DATE)        ││                                   │
                    │  │     location (VARCHAR)       ││                                   │
                    │  │     max_capacity (INT)       ││                                   │
                    │  │     current_registrations    ││                                   │
                    │  │     (INT)                    ││                                   │
                    │  │     created_at (TIMESTAMP)   ││                                   │
                    │  └─────────────────────────────┘│                                   │
                    └─────────────────────────────────┘                                   │
                               │                                                         │
                               │ 1:Many                                                  │
                               │                                                         │
                    ┌──────────┼──────────┼──────────┐                                   │
                    │          │          │          │                                   │
                    ▼          ▼          ▼          ▼                                   │
    ┌─────────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
    │  EVENT_         │ │  BOOKINGS   │ │EXHIBIT_     │ │PROMOTIONAL_ │                │
    │  REGISTRATIONS  │ │             │ │DETAILS      │ │ITEMS        │                │
    │┌───────────────┐│ │┌───────────┐│ │┌───────────┐│ │┌───────────┐│                │
    ││ PK: id        ││ ││ PK: id    ││ ││ PK: id    ││ ││ PK: id    ││                │
    ││ FK: event_id →││ ││ FK: visitor││ ││ FK: event_││ ││ FK: event_││                │
    ││     event_    ││ ││_id →      ││ ││id →       ││ ││id →       ││                │
    ││     details.id││ ││visitors.id││ ││event_     ││ ││event_     ││                │
    ││ FK: visitor_id││ ││ FK: event_││ ││details.id ││ ││details.id ││                │
    ││ → visitors.id ││ ││id →       ││ ││     title ││ ││     name  ││                │
    ││     registra- ││ ││event_     ││ ││     desc- ││ ││     desc- ││                │
    ││tion_date      ││ ││details.id ││ ││ription    ││ ││ription   ││                │
    ││     status    ││ ││     book- ││ ││     start_││ ││     price ││                │
    ││     created_at││ ││ing_date  ││ ││date       ││ ││     stock_││                │
    │└───────────────┘│ ││     status││ ││     end_  ││ ││quantity   ││                │
    └─────────────────┘ ││     creat-││ ││date       ││ ││     creat-││                │
                        ││ed_at     ││ ││     loca- ││ ││ed_at     ││                │
                        │└───────────┘│ ││tion       ││ │└───────────┘│                │
                        └─────────────┘ ││     creat-││ └─────────────┘                │
                                        ││ed_at     ││                                │
                                        │└───────────┘│                                │
                                        └─────────────┘                                │
                                                                                      │
```

## Key Improvements with Missing Foreign Keys:

### **NEW SUGGESTED RELATIONSHIPS:**

1. **ACTIVITIES** → **system_user**
   - **ADD FK**: `user_id` → `system_user.id`
   - **Reason**: Track which user performed each activity

2. **REPORTS** → **system_user**
   - **ADD FK**: `user_id` → `system_user.id`
   - **Reason**: Track which user generated each report

3. **IMAGES** → **cultural_objects**
   - **ADD FK**: `cultural_object_id` → `cultural_objects.id`
   - **Reason**: Link images to specific cultural objects

4. **AI_INSIGHTS** → **cultural_objects**
   - **ADD FK**: `cultural_object_id` → `cultural_objects.id`
   - **Reason**: Link AI insights to specific objects

5. **ARCHIVES** → **cultural_objects**
   - **ADD FK**: `cultural_object_id` → `cultural_objects.id`
   - **Reason**: Link archived documents to specific objects

6. **EXHIBIT_DETAILS** → **event_details**
   - **ADD FK**: `event_id` → `event_details.id`
   - **Reason**: Link exhibits to specific events

7. **PROMOTIONAL_ITEMS** → **event_details**
   - **ADD FK**: `event_id` → `event_details.id`
   - **Reason**: Link promotional items to specific events

### **Benefits of Adding These Foreign Keys:**

1. **Data Integrity**: Ensures referential integrity across all related data
2. **Better Queries**: Enables complex JOIN operations for reporting
3. **Audit Trails**: Complete tracking of who did what and when
4. **Logical Relationships**: Makes the data model more intuitive
5. **Cascade Operations**: Automatic cleanup when parent records are deleted
6. **Performance**: Better indexing and query optimization

### **SQL Migration Script for Missing Foreign Keys:**

```sql
-- Add missing foreign keys
ALTER TABLE activities 
ADD COLUMN user_id INT,
ADD FOREIGN KEY (user_id) REFERENCES system_user(id) ON DELETE SET NULL;

ALTER TABLE reports 
ADD COLUMN user_id INT,
ADD FOREIGN KEY (user_id) REFERENCES system_user(id) ON DELETE SET NULL;

ALTER TABLE images 
ADD COLUMN cultural_object_id INT,
ADD FOREIGN KEY (cultural_object_id) REFERENCES cultural_objects(id) ON DELETE SET NULL;

ALTER TABLE ai_insights 
ADD COLUMN cultural_object_id INT,
ADD FOREIGN KEY (cultural_object_id) REFERENCES cultural_objects(id) ON DELETE SET NULL;

ALTER TABLE archives 
ADD COLUMN cultural_object_id INT,
ADD FOREIGN KEY (cultural_object_id) REFERENCES cultural_objects(id) ON DELETE SET NULL;

ALTER TABLE exhibit_details 
ADD COLUMN event_id INT,
ADD FOREIGN KEY (event_id) REFERENCES event_details(id) ON DELETE SET NULL;

ALTER TABLE promotional_items 
ADD COLUMN event_id INT,
ADD FOREIGN KEY (event_id) REFERENCES event_details(id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_images_cultural_object_id ON images(cultural_object_id);
CREATE INDEX idx_ai_insights_cultural_object_id ON ai_insights(cultural_object_id);
CREATE INDEX idx_archives_cultural_object_id ON archives(cultural_object_id);
CREATE INDEX idx_exhibit_details_event_id ON exhibit_details(event_id);
CREATE INDEX idx_promotional_items_event_id ON promotional_items(event_id);
```

This enhanced schema would create a much more robust and interconnected database with proper referential integrity throughout the entire system!







