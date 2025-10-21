# Event Capacity Customization Guide

## Overview
The event management system now has a **fully customizable participant capacity system** that allows you to set and modify the number of participants for each event.

## ✨ What's Been Fixed

### 1. **Backend Fix - Capacity Now Saves Correctly**
   - **Problem**: The backend wasn't saving the `max_capacity` when creating events
   - **Solution**: Updated `Prototype/backend/routes/activities.js` to properly save the capacity to the database
   - **File**: `Prototype/backend/routes/activities.js` (line 36-39)

### 2. **Enhanced UI for Capacity Selection**
   - **Quick Select Buttons**: Choose from preset capacities (Small: 25, Medium: 50, Large: 100)
   - **Manual Input**: Type any number from 1 to 1000
   - **+/- Controls**: Fine-tune capacity with increment/decrement buttons (+5 or -5)
   - **Visual Feedback**: Active preset buttons highlight in gold

### 3. **Edit Capacity After Creation**
   - **New Feature**: Edit event capacity even after the event is created
   - **Access**: Click the edit icon (📝) on any event card or the "Edit" button in event details
   - **Modal Interface**: Clean, user-friendly modal to update capacity

## 🎯 How to Use

### Creating a New Event with Custom Capacity

1. **Click "Add Event"** button
2. **Fill in event details** (title, description, date, etc.)
3. **Set Capacity** using any of these methods:
   
   **Option A: Quick Presets**
   - Click "Small (25)", "Medium (50)", or "Large (100)"
   
   **Option B: Manual Entry**
   - Type the exact number you want in the input field
   
   **Option C: Fine-tuning**
   - Use the `-` and `+` buttons to adjust by 5 participants at a time
   
4. **Submit** the form - your custom capacity will be saved!

### Editing Capacity for Existing Events

1. **Find your event** in the Upcoming or History tab
2. **Click the edit icon** (📝 amber/yellow button) on the event card
   - OR open the event details and click "Edit" next to "Capacity & Status"
3. **Choose new capacity** using presets, manual input, or +/- buttons
4. **Click "Update Capacity"** to save

## 📊 Features

### Visual Indicators
- **Slot Counter**: Shows "X slots available" on each event card
- **Progress Bar**: Visual representation of registration vs capacity
- **Real-time Updates**: Automatically refreshes when registrations change
- **Color Coding**: Green for available, amber for nearly full

### Capacity Display
- **Event Cards**: Shows current registrations / max capacity
- **Event Details**: Detailed breakdown with available slots
- **Registration Modal**: Shows capacity stats when viewing participants

### Validation
- **Minimum**: 1 participant
- **Maximum**: 1000 participants
- **Smart Limits**: Can't set capacity below current registrations

## 🔧 Technical Details

### Files Modified

1. **Frontend - Event Component**
   - File: `Prototype/Museoo/src/components/admin/Event.jsx`
   - Added: Enhanced capacity input UI with presets and controls
   - Added: Edit capacity modal
   - Added: Edit capacity button in event cards and details

2. **Backend - Activities Route**
   - File: `Prototype/backend/routes/activities.js`
   - Fixed: Now saves `max_capacity` to `event_details` table
   - Query: `INSERT INTO event_details (..., max_capacity, current_registrations)`

### Database Schema
```sql
event_details table:
- max_capacity: INT DEFAULT 50
- current_registrations: INT DEFAULT 0
```

### API Endpoints Used
- `POST /api/activities` - Creates event with custom capacity
- `PUT /api/event-registrations/event/:eventId/capacity` - Updates capacity

## 🚀 Quick Start Guide

1. **Restart your backend server** to apply the changes:
   ```bash
   cd Prototype/backend
   npm start
   ```

2. **Refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)

3. **Create a test event**:
   - Click "Add Event"
   - Try the capacity presets (Small/Medium/Large)
   - Or enter a custom number like 75
   - Submit and verify it saves correctly

4. **Edit capacity**:
   - Click the edit icon (📝) on any event
   - Change the capacity
   - Click "Update Capacity"
   - Verify the change is reflected

## 💡 Tips

1. **For Small Workshops**: Use 10-25 participants
2. **For Medium Events**: Use 30-75 participants
3. **For Large Gatherings**: Use 100+ participants
4. **For Exclusive Events**: Set capacity to match exact VIP count

## 🎨 UI Enhancements

### In Add Event Modal
- Number input shows "participants" label
- Quick preset buttons for common capacities
- +/- buttons for precise adjustments
- Grid layout for better organization

### In Edit Capacity Modal
- Shows current capacity and registrations
- Same preset and manual controls
- Cancel and Update buttons
- Clean, focused interface

### In Event Cards
- Edit capacity icon (📝) in amber/yellow
- Located between "View Registrations" and "Delete"
- Tooltip: "Edit Capacity"

### In Event Details
- "Edit" button next to "Capacity & Status" header
- Shows real-time available slots
- Progress bar visualization
- Breakdown of registered vs total capacity

## 🐛 Troubleshooting

### Capacity Not Saving?
1. Check browser console for errors
2. Verify backend is running
3. Check database connection
4. Ensure `event_details` table has `max_capacity` column

### Can't Edit Capacity?
1. Refresh the page
2. Check if edit capacity modal appears
3. Verify API endpoint is accessible
4. Check browser console for errors

### Preset Buttons Not Working?
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check if form state is updating

## ✅ Testing Checklist

- [ ] Create event with default capacity (50)
- [ ] Create event with Small preset (25)
- [ ] Create event with Medium preset (50)
- [ ] Create event with Large preset (100)
- [ ] Create event with custom number (e.g., 75)
- [ ] Use +/- buttons to adjust capacity
- [ ] Edit capacity of existing event
- [ ] Verify capacity displays correctly in event card
- [ ] Verify capacity displays correctly in event details
- [ ] Register participants and check capacity updates

## 📝 Summary

Your event capacity system is now **fully customizable**! You can:
- ✅ Set any capacity from 1 to 1000 when creating events
- ✅ Use quick presets or manual entry
- ✅ Edit capacity after event creation
- ✅ View real-time capacity status
- ✅ Get visual feedback on available slots

The fix was simple but crucial: the backend now **properly saves** your chosen capacity to the database, so it will persist and work exactly as you expect!


