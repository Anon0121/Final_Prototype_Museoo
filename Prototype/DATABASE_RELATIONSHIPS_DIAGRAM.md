# 🗺️ DATABASE RELATIONSHIPS DIAGRAM
## Museum Management System - Visual Table Relationships

---

## 📊 MAINTENANCE SYSTEM (Primary Focus)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CULTURAL OBJECTS MODULE                       │
│                  (Maintenance System Core)                       │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────┐
    │   cultural_objects      │ ◄── Parent Table
    │─────────────────────────│
    │ • id (PK)               │
    │ • name                  │
    │ • category              │
    │ • description           │
    │ • created_at            │
    └───────────┬─────────────┘
                │
                │ 1:1 relationship
                ↓
    ┌─────────────────────────────────────────────────────────┐
    │   object_details (or oobject_details?)                   │ ◄── CRITICAL
    │──────────────────────────────────────────────────────────│
    │ • id (PK)                                                │
    │ • cultural_object_id (FK) → cultural_objects.id          │
    │                                                          │
    │ ORIGINAL FIELDS:                                         │
    │ • period, origin, material, dimensions                   │
    │ • condition_status, acquisition_date, acquisition_method │
    │ • current_location, estimated_value                      │
    │ • conservation_notes, exhibition_history                 │
    │                                                          │
    │ 🆕 MAINTENANCE FIELDS (9 new):                          │
    │ • last_maintenance_date (DATE)                           │
    │ • next_maintenance_date (DATE)                           │
    │ • maintenance_frequency_months (INT)                     │
    │ • maintenance_notes (TEXT)                               │
    │ • maintenance_priority (ENUM: low/medium/high/urgent)    │
    │ • maintenance_status (ENUM: up_to_date/due_soon/...)     │
    │ • maintenance_reminder_enabled (BOOLEAN)                 │
    │ • maintenance_contact (VARCHAR)                          │
    │ • maintenance_cost (DECIMAL)                             │
    │                                                          │
    │ 📊 INDEXES:                                              │
    │ • idx_next_maintenance_date                              │
    │ • idx_maintenance_status                                 │
    └──────────────────────────────────────────────────────────┘
                │
                │ Referenced by VIEW
                ↓
    ┌─────────────────────────────────────────────────────────┐
    │   maintenance_overview (VIEW) 👁️                        │
    │──────────────────────────────────────────────────────────│
    │ Joins cultural_objects + object_details                  │
    │ Calculates:                                              │
    │ • maintenance_alert_status (Overdue/Due Soon/Up to Date) │
    │ • days_until_maintenance                                 │
    │ Used by: /api/cultural-objects/maintenance/overview      │
    └──────────────────────────────────────────────────────────┘

    ┌─────────────────────────┐
    │   images                │
    │─────────────────────────│
    │ • id (PK)               │
    │ • cultural_object_id    │ ──► Links to cultural objects
    │ • activity_id           │ ──► OR links to events/exhibits
    │ • url                   │
    │ • created_at            │
    └─────────────────────────┘
              ↑
              │ 1:many
              └── Links photos (including maintenance before/after)
```

---

## 👤 USER MANAGEMENT MODULE

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER MANAGEMENT                             │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────┐
    │   system_user           │ ◄── Core user table
    │─────────────────────────│
    │ • user_ID (PK)          │
    │ • username              │
    │ • firstname, lastname   │
    │ • email                 │
    │ • password              │
    │ • role (admin/user)     │
    │ • status                │
    │ • profile_photo         │
    │ • permissions (JSON)    │
    └───────────┬─────────────┘
                │
                ├───────────────────────────────────────┐
                │                                       │
                │ 1:many                                │ 1:many
                ↓                                       ↓
    ┌─────────────────────────┐         ┌─────────────────────────┐
    │ user_permissions        │         │ user_activity_logs      │
    │─────────────────────────│         │─────────────────────────│
    │ • permission_id (PK)    │         │ • id (PK)               │
    │ • user_id (FK)          │         │ • user_id (FK)          │
    │ • permission_name       │         │ • action                │
    │ • is_allowed            │         │ • entity_type           │
    └─────────────────────────┘         │ • entity_id             │
                                        │ • details (JSON)        │
                                        │ • created_at            │
                                        └─────────────────────────┘
                                                  ↑
                                                  │
                                        Logs maintenance updates
                                        (cobject.maintenance.update)

                ↓ 1:many
    ┌─────────────────────────┐
    │   reports               │
    │─────────────────────────│
    │ • id (PK)               │
    │ • user_id (FK)          │
    │ • title                 │
    │ • report_type           │
    │ • start_date, end_date  │
    │ • content               │
    │ • data (JSON)           │
    └───────────┬─────────────┘
                │
                │ 1:many
                ↓
    ┌─────────────────────────┐
    │   ai_insights           │
    │─────────────────────────│
    │ • id (PK)               │
    │ • report_id (FK)        │
    │ • insights (JSON)       │
    └─────────────────────────┘
```

**Connection to Maintenance:**
- `system_user.user_ID` can be referenced by `maintenance_contact`
- Activity logs track maintenance updates
- Reports can include maintenance analysis

---

## 🎟️ VISITOR MANAGEMENT MODULE

```
┌─────────────────────────────────────────────────────────────────┐
│                    VISITOR MANAGEMENT                            │
│                  (Not related to maintenance)                    │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────┐
    │   bookings              │ ◄── Parent table
    │─────────────────────────│
    │ • booking_id (PK)       │
    │ • first_name, last_name │
    │ • type (individual/group)│
    │ • status                │
    │ • date, time_slot       │
    │ • total_visitors        │
    │ • checkin_time          │
    └───────────┬─────────────┘
                │
                ├───────────────────────────────────┐
                │                                   │
                │ 1:many                            │ 1:many
                ↓                                   ↓
    ┌─────────────────────────┐     ┌─────────────────────────────┐
    │   visitors              │     │   additional_visitors       │
    │─────────────────────────│     │─────────────────────────────│
    │ • visitor_id (PK)       │     │ • token_id (PK)             │
    │ • booking_id (FK)       │     │ • booking_id (FK)           │
    │ • first_name, last_name │     │ • email                     │
    │ • gender, address       │     │ • status                    │
    │ • email, nationality    │     │ • details (JSON)            │
    │ • purpose               │     │ • qr_generated_at           │
    │ • status                │     │ • checkin_time              │
    │ • is_main_visitor       │     └─────────────────────────────┘
    └─────────────────────────┘
```

---

## 🎭 ACTIVITIES & EVENTS MODULE

```
┌─────────────────────────────────────────────────────────────────┐
│                    ACTIVITIES & EVENTS                           │
│                  (Not related to maintenance)                    │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────┐
    │   activities            │ ◄── Parent table (polymorphic)
    │─────────────────────────│
    │ • id (PK)               │
    │ • title                 │
    │ • description           │
    │ • type (event/exhibit)  │
    └───────────┬─────────────┘
                │
                ├──────────────────────┬────────────────────┐
                │                      │                    │
                │ 1:1 (if event)       │ 1:1 (if exhibit)   │ 1:many
                ↓                      ↓                    ↓
    ┌───────────────────────┐ ┌──────────────────┐ ┌─────────────────┐
    │   event_details       │ │ exhibit_details  │ │ event_registrations│
    │───────────────────────│ │──────────────────│ │─────────────────│
    │ • id (PK)             │ │ • id (PK)        │ │ • id (PK)       │
    │ • activity_id (FK)    │ │ • activity_id(FK)│ │ • event_id (FK) │
    │ • start_date, time    │ │ • start_date     │ │ • full_name     │
    │ • location, organizer │ │ • end_date       │ │ • email         │
    │ • max_capacity        │ │ • location       │ │ • status        │
    │ • current_registrations│ │ • curator        │ │ • qr_code       │
    └───────────────────────┘ │ • category       │ │ • checkin_time  │
                               └──────────────────┘ └─────────────────┘
                │
                │ 1:many
                ↓
    ┌─────────────────────────┐
    │   images                │
    │─────────────────────────│
    │ • id (PK)               │
    │ • activity_id (FK)      │ ──► Links to events/exhibits
    │ • cultural_object_id    │
    │ • url                   │
    └─────────────────────────┘
```

---

## 💝 DONATIONS MODULE (Complex)

```
┌─────────────────────────────────────────────────────────────────┐
│                      DONATIONS SYSTEM                            │
│               (Largest module - 7 tables!)                       │
│                  (Not related to maintenance)                    │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────────┐
    │   donations (EXTENSIVE FIELDS!)                           │
    │───────────────────────────────────────────────────────────│
    │ • id (PK)                                                 │
    │ • donor_name, donor_email, donor_contact                  │
    │ • type (monetary/artifact/document/loan)                  │
    │ • status (pending/approved/rejected)                      │
    │ • processing_stage (request_received → completed)         │
    │ • priority (low/medium/high/urgent)                       │
    │ • acknowledgment_sent, city_acknowledgment_sent           │
    │ • meeting_scheduled, meeting_completed                    │
    │ • handover_completed, city_hall_submitted                 │
    │ • assigned_to, source, notes                              │
    │ • ... and many more fields!                               │
    └─────────────────────┬────────────────────────────────────┘
                          │
          ┌───────────────┼────────────────┬──────────────────┐
          │               │                │                  │
          │ 1:1           │ 1:many         │ 1:many           │ 1:many
          ↓               ↓                ↓                  ↓
┌─────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐
│donation_details │ │donation_docs │ │donation_workflow│donation_meeting│
│─────────────────│ │──────────────│ │_log          │ │_schedule       │
│• id (PK)        │ │• id (PK)     │ │──────────────│ │─────────────────│
│• donation_id(FK)│ │• donation_id │ │• id (PK)     │ │• id (PK)       │
│• amount         │ │• document_type│ │• donation_id │ │• donation_id   │
│• method         │ │• file_path   │ │• action      │ │• scheduled_date│
│• item_descr     │ │• file_name   │ │• stage_from  │ │• location      │
│• estimated_value│ │• uploaded_by │ │• stage_to    │ │• staff_member  │
│• condition      │ │• uploaded_at │ │• performed_by│ │• status        │
│• loan dates     │ └──────────────┘ │• notes       │ │• meeting_notes │
│• appraisal info │                  └──────────────┘ └─────────────────┘
│• insurance info │
│• storage_loc    │          │ 1:many                │ 1:many
└─────────────────┘          ↓                       ↓
                   ┌──────────────────────┐ ┌──────────────────────┐
                   │donation_city_hall    │ │donation_visitor      │
                   │_submission           │ │_submissions          │
                   │──────────────────────│ │──────────────────────│
                   │• id (PK)             │ │• id (PK)             │
                   │• donation_id (FK)    │ │• donation_id (FK)    │
                   │• submission_date     │ │• visitor_name        │
                   │• submitted_by        │ │• visitor_email       │
                   │• city_hall_reference │ │• submission_date     │
                   │• status              │ │• submission_status   │
                   │• approval_date       │ │• admin_notes         │
                   │• notes               │ │• contact_attempts    │
                   └──────────────────────┘ └──────────────────────┘
```

---

## 📁 OTHER MODULES

```
┌─────────────────────────────────────────────────────────────────┐
│                    STANDALONE TABLES                             │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────┐
    │   archives              │ ◄── Digital Archive
    │─────────────────────────│
    │ • id (PK)               │
    │ • title, description    │
    │ • date, type, category  │
    │ • tags                  │
    │ • file_url              │
    │ • visibility            │
    │ • uploaded_by           │
    └─────────────────────────┘

    ┌─────────────────────────┐
    │   promotional_items     │ ◄── Homepage Marketing
    │─────────────────────────│
    │ • id (PK)               │
    │ • title, subtitle       │
    │ • description           │
    │ • image, cta_text       │
    │ • badge                 │
    │ • is_active, order      │
    └─────────────────────────┘
```

---

## 🔗 FOREIGN KEY CASCADE RULES

### **ON DELETE CASCADE** (Auto-delete children):

```
cultural_objects [DELETE] → Deletes:
    ├── object_details
    └── images (where cultural_object_id matches)

bookings [DELETE] → Deletes:
    ├── visitors
    └── additional_visitors

activities [DELETE] → Deletes:
    ├── event_details
    ├── exhibit_details
    ├── event_registrations
    └── images (where activity_id matches)

donations [DELETE] → Deletes:
    ├── donation_details
    ├── donation_documents
    ├── donation_workflow_log
    ├── donation_meeting_schedule
    ├── donation_city_hall_submission
    └── donation_visitor_submissions (REMOVED - Donations are donor-only)

system_user [DELETE] → Deletes:
    ├── user_permissions
    ├── user_activity_logs
    └── reports

reports [DELETE] → Deletes:
    └── ai_insights
```

---

## 📊 TABLE USAGE MATRIX

### Maintenance System Dependencies:

| Table | Used by Maintenance? | How? |
|-------|---------------------|------|
| `cultural_objects` | ✅ CRITICAL | Parent table for objects |
| `object_details` | ✅ CRITICAL | Stores all 9 maintenance fields |
| `maintenance_overview` | ✅ CRITICAL | View for dashboard queries |
| `images` | ✅ INDIRECT | Before/after maintenance photos |
| `system_user` | ✅ INDIRECT | maintenance_contact references users |
| `user_permissions` | ✅ INDIRECT | Controls access to maintenance features |
| `user_activity_logs` | ✅ INDIRECT | Logs maintenance updates |
| `reports` | ⚠️ POTENTIAL | Could generate maintenance reports |
| `ai_insights` | ⚠️ POTENTIAL | Could analyze maintenance data |
| All others | ❌ NO | No direct relationship |

---

## 🎯 DATA FLOW: Maintenance Alert System

```
1. User creates/updates cultural object
   ↓
2. Maintenance fields saved in object_details
   ↓
3. Backend calculates alert status:
   - next_maintenance_date vs CURDATE()
   ↓
4. maintenance_overview VIEW provides dashboard data
   ↓
5. API endpoint serves alerts:
   - GET /api/cultural-objects/maintenance/alerts
   ↓
6. Frontend displays overdue/due-soon items
   ↓
7. User updates maintenance (marks complete)
   ↓
8. Activity logged in user_activity_logs
   ↓
9. Loop back to step 2
```

---

## 🔍 QUERY FLOW: Get Maintenance Alerts

```sql
Frontend Request:
  GET /api/cultural-objects/maintenance/alerts

        ↓

Backend Query:
  SELECT 
    co.id, co.name, co.category,
    od.next_maintenance_date,
    od.maintenance_priority,
    CASE 
      WHEN od.next_maintenance_date < CURDATE() 
        THEN 'Overdue'
      WHEN od.next_maintenance_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) 
        THEN 'Due Soon'
    END as alert_type
  FROM cultural_objects co
  LEFT JOIN object_details od ON co.id = od.cultural_object_id
  WHERE od.maintenance_reminder_enabled = TRUE
    AND (od.next_maintenance_date < CURDATE() 
         OR od.next_maintenance_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY))
  ORDER BY od.next_maintenance_date ASC

        ↓

Response JSON:
  [
    {
      object_id: 1,
      object_name: "Ancient Vase",
      category: "Pottery",
      next_maintenance_date: "2024-10-01",
      maintenance_priority: "high",
      alert_type: "Overdue",
      days_until_maintenance: -11
    },
    ...
  ]
```

---

## 📈 TABLE SIZE ESTIMATES (by complexity)

| Module | Tables | Complexity | Notes |
|--------|--------|------------|-------|
| Donations | 7 | ⭐⭐⭐⭐⭐ | Most complex module |
| Activities/Events | 4 | ⭐⭐⭐ | Medium complexity |
| User Management | 3 | ⭐⭐ | Standard auth system |
| Visitor Management | 3 | ⭐⭐ | QR code system |
| Cultural Objects | 2+1 | ⭐⭐⭐⭐ | Extended with maintenance |
| Reports & AI | 2 | ⭐⭐ | JSON-heavy |
| Standalone | 2 | ⭐ | Simple tables |

**Total: 25 tables + 1 view**

---

## 🎨 VISUAL LEGEND

```
┌─────────────┐
│  TABLE      │  ◄── Description
│─────────────│
│ • field1    │
│ • field2    │
└─────┬───────┘
      │ 1:many      Relationship type
      ↓
┌─────────────┐
│  TABLE      │  ◄── Child table
└─────────────┘

✅ CRITICAL     - Essential for maintenance
⚠️ POTENTIAL    - Could be used for maintenance
❌ NO           - Not related to maintenance
```

---

## 💡 KEY INSIGHTS

1. **Maintenance is Self-Contained**
   - Only uses 2 tables: `cultural_objects` + `object_details`
   - All 9 maintenance fields in `object_details`
   - No dependencies on donations, events, or visitors

2. **Foreign Keys Are Properly Set**
   - All child tables have CASCADE delete
   - Deleting a cultural object removes all related data

3. **Donations Module is Largest**
   - 7 tables with complex workflow
   - Most extensive field set
   - Multiple approval stages

4. **Good Separation of Concerns**
   - Each module is independent
   - No circular dependencies
   - Clear parent-child relationships

---

**For detailed analysis, see:** `DATABASE_ANALYSIS_REPORT.md`  
**For quick reference, see:** `DATABASE_QUICK_REFERENCE.md`

---

*Generated from database structure analysis*  
*Date: October 12, 2025*


