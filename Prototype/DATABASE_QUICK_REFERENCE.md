# 📚 DATABASE QUICK REFERENCE GUIDE
## Museum Management System - Table Overview

---

## 🚀 QUICK START

### Run Database Verification:
```bash
# Windows
verify-database.bat

# Linux/Mac
node verify-database-structure.js
```

---

## 📊 YOUR 25 TABLES AT A GLANCE

### ⭐ **CULTURAL OBJECTS & MAINTENANCE** (2 tables)
Main focus of the maintenance guide

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `cultural_objects` | Basic object info | id, name, category, description |
| `object_details` | Details + **9 maintenance fields** | last_maintenance_date, next_maintenance_date, maintenance_priority, etc. |

**⚠️ Note:** You listed `oobject_details` - verify if this is a typo!

---

### 👤 **USER MANAGEMENT** (3 tables)

| Table | Purpose |
|-------|---------|
| `system_user` | Staff/admin accounts |
| `user_permissions` | Granular permissions |
| `user_activity_logs` | Activity audit trail |

---

### 🎟️ **VISITOR MANAGEMENT** (3 tables)

| Table | Purpose |
|-------|---------|
| `bookings` | Visitor booking requests |
| `visitors` | Visitor details |
| `additional_visitors` | Companion tokens/QR codes |

---

### 🎭 **ACTIVITIES & EVENTS** (4 tables)

| Table | Purpose |
|-------|---------|
| `activities` | Parent table (events & exhibits) |
| `event_details` | Event-specific info |
| `event_registrations` | Event registration system |
| `exhibit_details` | Exhibit-specific info |

---

### 💝 **DONATIONS SYSTEM** (7 tables)
*Largest module in your database!*

| Table | Purpose |
|-------|---------|
| `donations` | Main donations table |
| `donation_details` | Detailed donation info |
| `donation_documents` | File uploads |
| `donation_workflow_log` | Processing history |
| `donation_meeting_schedule` | Meeting scheduling |
| `donation_city_hall_submission` | City hall approval tracking |
| `donation_visitor_submissions (REMOVED - Donations are donor-only)` | Visitor submissions |

---

### 📁 **OTHER MODULES** (6 tables)

| Table | Purpose | Module |
|-------|---------|--------|
| `archives` | Digital archive/documents | Archive |
| `images` | Images for objects/events/exhibits | Media |
| `reports` | AI-powered reports | Reporting |
| `ai_insights` | AI-generated insights | AI |
| `promotional_items` | Homepage banners | Marketing |

---

## 🔧 MAINTENANCE SYSTEM DETAILS

### **9 New Fields in `object_details`:**

1. `last_maintenance_date` (DATE) - When was it last serviced?
2. `next_maintenance_date` (DATE) - When is it due?
3. `maintenance_frequency_months` (INT) - How often? (default: 12)
4. `maintenance_notes` (TEXT) - Special requirements
5. `maintenance_priority` (ENUM) - low / medium / high / urgent
6. `maintenance_status` (ENUM) - up_to_date / due_soon / overdue / in_progress
7. `maintenance_reminder_enabled` (BOOLEAN) - On/off toggle
8. `maintenance_contact` (VARCHAR) - Who's responsible?
9. `maintenance_cost` (DECIMAL) - Estimated cost

### **Alert Logic:**
- **Overdue:** `next_maintenance_date < today`
- **Due Soon:** `next_maintenance_date <= today + 30 days`
- **Up to Date:** `next_maintenance_date > today + 30 days`

---

## 🌐 API ENDPOINTS (Maintenance)

### CRUD Operations:
```
POST   /api/cultural-objects              Create object with maintenance
GET    /api/cultural-objects              Get all objects
GET    /api/cultural-objects/:id          Get specific object
PUT    /api/cultural-objects/:id          Update object & maintenance
DELETE /api/cultural-objects/:id          Delete object
```

### Maintenance-Specific:
```
GET    /api/cultural-objects/maintenance/overview         Full dashboard
GET    /api/cultural-objects/maintenance/alerts           Overdue & due soon
PUT    /api/cultural-objects/:id/maintenance              Update maintenance
GET    /api/cultural-objects/:id/maintenance/history      Maintenance history
```

---

## 🔍 USEFUL SQL QUERIES

### Check if maintenance fields exist:
```sql
DESCRIBE object_details;
-- OR if you have the typo version:
DESCRIBE oobject_details;
```

### See all overdue maintenance:
```sql
SELECT co.name, od.next_maintenance_date, od.maintenance_priority
FROM cultural_objects co
LEFT JOIN object_details od ON co.id = od.cultural_object_id
WHERE od.maintenance_reminder_enabled = TRUE
  AND od.next_maintenance_date < CURDATE()
ORDER BY od.maintenance_priority DESC, od.next_maintenance_date ASC;
```

### See maintenance due in next 30 days:
```sql
SELECT co.name, od.next_maintenance_date, 
       DATEDIFF(od.next_maintenance_date, CURDATE()) as days_until
FROM cultural_objects co
LEFT JOIN object_details od ON co.id = od.cultural_object_id
WHERE od.maintenance_reminder_enabled = TRUE
  AND od.next_maintenance_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
ORDER BY od.next_maintenance_date ASC;
```

### Count objects by maintenance status:
```sql
SELECT maintenance_status, COUNT(*) as count
FROM object_details
WHERE maintenance_reminder_enabled = TRUE
GROUP BY maintenance_status;
```

---

## ⚠️ ISSUES FOUND

### 1. Table Name Typo?
- **Your list:** `oobject_details` (double-o)
- **Code uses:** `object_details` (single-o)
- **Action:** Verify with `SHOW TABLES LIKE '%object%';`

### 2. Missing Table Definition
- **Table:** `user_activity_logs`
- **Status:** In your list but no CREATE statement found
- **Action:** Verify table exists

### 3. Singular vs Plural
- **Your list:** `ai_insight`, `promotional_item`
- **SQL creates:** `ai_insights`, `promotional_items`
- **Action:** Verify actual names

---

## ✅ VERIFICATION CHECKLIST

Run these commands in MySQL:

```sql
-- 1. List all tables
SHOW TABLES;

-- 2. Check object_details vs oobject_details
SHOW TABLES LIKE '%object%';

-- 3. Verify maintenance fields exist
DESCRIBE object_details;

-- 4. Check for maintenance view
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- 5. Test maintenance query
SELECT * FROM maintenance_overview LIMIT 5;

-- 6. Verify indexes
SHOW INDEX FROM object_details WHERE Key_name LIKE '%maintenance%';

-- 7. Count your tables
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'museosmart';
```

---

## 🚀 MIGRATION COMMANDS

### If maintenance fields are missing:
```bash
# Windows
add-maintenance-reminders.bat

# Or directly
node backend/scripts/add_maintenance_reminders.js
```

### Database setup (if needed):
```bash
node backend/run-create-tables.js
```

---

## 📁 KEY FILES

### Backend:
- `backend/routes/cultural-objects.js` - API endpoints
- `backend/database/add_maintenance_reminders.sql` - Maintenance migration
- `backend/database/setup_database.sql` - Initial setup
- `backend/database/complete_database_setup.sql` - Full setup

### Documentation:
- `CULTURAL_OBJECTS_MAINTENANCE_GUIDE.md` - User guide
- `DATABASE_ANALYSIS_REPORT.md` - Detailed analysis (this report)
- `DATABASE_QUICK_REFERENCE.md` - Quick reference (this doc)

### Verification:
- `verify-database-structure.js` - Verification script
- `verify-database.bat` - Run verification (Windows)

---

## 🔗 TABLE RELATIONSHIPS

### Cultural Objects Module:
```
cultural_objects (1)
    ├── object_details (1) ← Contains all 9 maintenance fields
    └── images (many)
```

### User Module:
```
system_user (1)
    ├── user_permissions (many)
    ├── user_activity_logs (many)
    └── reports (many)
```

### Visitor Module:
```
bookings (1)
    ├── visitors (many)
    └── additional_visitors (many)
```

### Events Module:
```
activities (1)
    ├── event_details (1)
    ├── event_registrations (many)
    ├── exhibit_details (1)
    └── images (many)
```

### Donations Module (Complex):
```
donations (1)
    ├── donation_details (1)
    ├── donation_documents (many)
    ├── donation_workflow_log (many)
    ├── donation_meeting_schedule (many)
    ├── donation_city_hall_submission (many)
    └── donation_visitor_submissions (REMOVED - Donations are donor-only) (many)
```

---

## 💡 QUICK TIPS

1. **Run verification first:** `verify-database.bat`
2. **Check table name:** Is it `object_details` or `oobject_details`?
3. **Verify maintenance fields:** Use `DESCRIBE object_details`
4. **Test the view:** `SELECT * FROM maintenance_overview LIMIT 5;`
5. **Check for alerts:** Look for objects with `next_maintenance_date < CURDATE()`

---

## 📊 DATABASE STATS

- **Total Tables:** 25
- **Total Views:** 1 (maintenance_overview)
- **Largest Module:** Donations (7 tables)
- **Foreign Keys:** 20+ relationships
- **Maintenance Fields:** 9 new fields in object_details
- **Indexes:** 2 maintenance-specific indexes

---

## 🎯 NEXT STEPS

1. **Verify Structure:**
   ```bash
   verify-database.bat
   ```

2. **Fix Table Name** (if needed):
   ```sql
   RENAME TABLE oobject_details TO object_details;
   ```

3. **Run Maintenance Migration** (if fields missing):
   ```bash
   add-maintenance-reminders.bat
   ```

4. **Test API Endpoints:**
   ```bash
   GET http://localhost:3000/api/cultural-objects/maintenance/alerts
   ```

5. **Check Frontend Integration** (not covered in this analysis)

---

**For full details, see:** `DATABASE_ANALYSIS_REPORT.md`

**Need help?** Check the verification output or run SQL queries above!


