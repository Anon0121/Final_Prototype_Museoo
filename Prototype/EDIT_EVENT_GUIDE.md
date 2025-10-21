# Edit Event Details Guide

## Overview
You can now **edit all event details** including title, description, date, time, location, organizer, and capacity after the event has been created!

## ✅ What's Been Added

### 1. **Full Edit Event Modal**
   - Edit all event information in one place
   - Same beautiful design as the create event modal
   - Capacity presets included (Small, Medium, Large)
   - Form validation ensures all required fields are filled

### 2. **Multiple Edit Buttons**
   - **Event Card**: Purple edit button (✏️) on each event card
   - **Event Details Modal**: Edit button (pen icon) in the header next to close button
   - **Capacity Section**: Edit button still available for quick capacity changes

### 3. **Backend Support**
   - Updated PUT endpoint to save all event details including capacity
   - Proper handling of both `start_date` and `startDate` field names
   - Database updates for both `activities` and `event_details` tables

## 🎯 How to Edit an Event

### Method 1: From Event Card
1. Find the event in Upcoming or History tab
2. Look for the **purple edit button** (✏️) - it's the second button
3. Click it to open the edit modal
4. Make your changes
5. Click "Update Event"

### Method 2: From Event Details
1. Click the **green eye button** (👁️) to view event details
2. In the event details modal, look for the **edit button** (pen icon) in the top-right corner
3. Click it to open the edit modal
4. Make your changes
5. Click "Update Event"

### Method 3: Quick Capacity Edit
1. Click the event details or use the old method
2. Click "Edit" button next to "Capacity & Status"
3. Use presets or manual input to change capacity
4. Click "Update Capacity"

## 📝 What You Can Edit

### Event Information
- **Title**: Event name
- **Description**: Detailed event description
- **Date**: Start date of the event
- **Time**: Event start time
- **Location**: Where the event takes place
- **Organizer**: Who's organizing the event
- **Capacity**: Maximum number of participants (1-1000)

## 🎨 Button Locations

### Event Cards (Grid View)
Four buttons appear on each event card:
1. **Green** (👁️) - View Event Details
2. **Purple** (✏️) - **Edit Event** ← NEW!
3. **Blue** (👥) - View Registrations
4. **Red** (🗑️) - Delete Event

### Event Details Modal
Two buttons in the top-right:
1. **Edit** (pen icon) - Opens edit modal ← NEW!
2. **Close** (X icon) - Closes the modal

## 💡 Features

### Smart Form Pre-filling
- All current event details automatically populate in the edit form
- No need to re-enter information you don't want to change
- Just modify what needs updating

### Capacity Management
- Same convenient capacity controls as create event
- Quick presets: Small (25), Medium (50), Large (100)
- Manual input for custom capacity
- Visual "participants" label for clarity

### Validation
- All required fields must be filled
- Capacity must be between 1 and 1000
- Date format automatically handled
- Changes only save when form is valid

### Real-time Updates
- Event list automatically refreshes after editing
- Changes immediately visible in all views
- Capacity updates reflect in registration counts

## 🔧 Technical Details

### Files Modified

1. **Frontend Component**
   - File: `Prototype/Museoo/src/components/admin/Event.jsx`
   - Added: `showEditEventModal` state
   - Added: `editForm` state for managing edit form data
   - Added: `handleEditEvent()` function to open edit modal
   - Added: `handleEditFormChange()` for form input handling
   - Added: `handleUpdateEvent()` to submit changes to backend
   - Added: Full edit event modal with all fields
   - Added: Edit buttons in event cards and details modal

2. **Backend Route**
   - File: `Prototype/backend/routes/activities.js`
   - Updated: PUT endpoint to save `max_capacity` in event_details
   - Added: Support for both `start_date` and `startDate` field names
   - Fixed: Proper parameter order in UPDATE query

### API Endpoint
```
PUT /api/activities/:id
```

**Request Body:**
```json
{
  "title": "Updated Event Title",
  "description": "Updated description",
  "type": "event",
  "start_date": "2025-01-15",
  "time": "14:00",
  "location": "Main Hall",
  "organizer": "Museum Staff",
  "max_capacity": 75
}
```

**Response:**
```json
{
  "success": true
}
```

## 🚀 Quick Start

1. **Restart your backend** to apply changes:
   ```bash
   cd Prototype/backend
   npm start
   ```

2. **Hard refresh browser** (Ctrl+Shift+R or Cmd+Shift+R)

3. **Test editing an event**:
   - Go to Events page
   - Click the purple edit button (✏️) on any event
   - Change some details
   - Click "Update Event"
   - Verify changes are saved

## 🎨 Button Color Guide

- **Green** (👁️) - View/Preview actions
- **Purple** (✏️) - Edit actions
- **Blue** (👥) - Participants/People actions
- **Amber/Yellow** (📝) - Quick edit/capacity actions
- **Red** (🗑️) - Delete actions

## 📋 Edit vs Delete

### When to Edit
- Fix typos in title or description
- Change event date or time
- Update location details
- Adjust capacity based on venue changes
- Modify organizer information

### When to Delete
- Event is cancelled completely
- Duplicate event created by mistake
- Event is no longer relevant

## ✨ Pro Tips

1. **Quick Capacity Adjustment**: For small capacity changes, use the capacity-specific edit button for faster access
2. **Full Event Overhaul**: For multiple changes, use the main edit button to access all fields at once
3. **Preview Before Edit**: Click the view button first to review current details, then click edit from the modal
4. **Check Registrations First**: Before reducing capacity, check current registrations to avoid conflicts

## 🎉 Summary

You now have **three ways to edit events**:

1. **Purple edit button** on event cards → Full edit modal
2. **Edit icon** in event details modal → Full edit modal
3. **Edit button** in capacity section → Quick capacity edit

All event details are fully editable, and changes save immediately to the database!


