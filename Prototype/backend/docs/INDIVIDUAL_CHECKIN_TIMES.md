# Individual Check-in Times for Group Visits

## Overview

This document describes the changes made to implement individual check-in times for each visitor in group visits, replacing the previous shared booking-level check-in time system.

## Changes Made

### 1. Backend API Changes

#### Modified Endpoints:
- **`/api/slots/visit/checkin/:id`** - Primary visitor check-in
- **`/api/slots/visit/qr-scan`** - Unified QR scanning endpoint
- **`/api/additional-visitors/:tokenId/checkin`** - Additional visitor check-in
- **`/api/visitors/checkin/:visitorId`** - Individual visitor check-in

#### Key Changes:
- Removed automatic setting of `bookings.checkin_time` when first visitor checks in
- Each visitor now gets their own `checkin_time` in their respective table
- Booking status is still updated to 'checked-in' when all visitors are checked in
- Individual check-in times are preserved and returned in API responses

### 2. Database Schema Changes

#### New Columns:
- `visitors.checkin_time` - Individual check-in time for main visitors
- `additional_visitors.checkin_time` - Individual check-in time for group members

#### Indexes Added:
- `idx_visitors_checkin_time` - For better query performance
- `idx_additional_visitors_checkin_time` - For better query performance

### 3. Utility Functions

New utility functions in `utils/groupCheckinUtils.js`:
- `calculateGroupArrivalTime()` - Calculate group arrival based on earliest individual check-in
- `getGroupCheckinDetails()` - Get detailed check-in information for a group
- `getCheckinStatistics()` - Get check-in statistics for date ranges
- `exportGroupCheckinData()` - Export check-in data for reporting

## Migration Process

### Running the Migration

1. **Backup your database** before running the migration
2. **Run the migration script**:
   ```bash
   cd museoo-backend
   node scripts/migrate_to_individual_checkin_times.js
   ```

### What the Migration Does:
- Adds `checkin_time` columns to both `visitors` and `additional_visitors` tables
- Migrates existing data by copying `bookings.checkin_time` to individual visitor records
- Creates database indexes for better performance
- Verifies the migration was successful

## New Check-in Flow

### For Primary Visitors:
1. Visitor scans QR code (URL format)
2. System updates `visitors.status = 'visited'` and sets `visitors.checkin_time = NOW()`
3. System checks if all visitors are checked in
4. If all checked in, updates `bookings.status = 'checked-in'`

### For Additional Visitors (Group Members):
1. Visitor scans QR code (JSON format)
2. System updates `additional_visitors.status = 'checked-in'` and sets `additional_visitors.checkin_time = NOW()`
3. System also inserts record into `visitors` table for admin dashboard visibility
4. System checks if all visitors are checked in
5. If all checked in, updates `bookings.status = 'checked-in'`

## Benefits of Individual Check-in Times

### 1. Accurate Tracking
- Each visitor's exact check-in time is recorded
- No more shared timestamps that don't reflect reality
- Better audit trail for compliance and reporting

### 2. Flexible Group Management
- Groups can arrive and check in at different times
- Individual visitor tracking for large groups
- Better handling of late arrivals or early departures

### 3. Enhanced Reporting
- Detailed check-in analytics per visitor
- Group arrival time calculated as earliest individual check-in
- Individual visitor behavior analysis

### 4. Improved User Experience
- Real-time check-in status per visitor
- More accurate wait time calculations
- Better group coordination

## API Response Changes

### Before (Shared Check-in Time):
```json
{
  "success": true,
  "visitor": {
    "name": "John Doe",
    "checkin_time": "2025-01-15T10:00:00Z" // Shared booking time
  }
}
```

### After (Individual Check-in Time):
```json
{
  "success": true,
  "visitor": {
    "name": "John Doe",
    "checkin_time": "2025-01-15T10:05:30Z" // Individual check-in time
  }
}
```

## Calculating Group Arrival Time

### Using Utility Functions:
```javascript
const { calculateGroupArrivalTime } = require('./utils/groupCheckinUtils');

const arrivalInfo = await calculateGroupArrivalTime(bookingId, pool);
console.log('Group arrived at:', arrivalInfo.groupArrivalTime);
```

### Manual SQL Query:
```sql
SELECT MIN(checkin_time) as group_arrival_time
FROM (
  SELECT checkin_time FROM visitors 
  WHERE booking_id = ? AND status = 'visited' AND checkin_time IS NOT NULL
  UNION ALL
  SELECT checkin_time FROM additional_visitors 
  WHERE booking_id = ? AND status = 'checked-in' AND checkin_time IS NOT NULL
) all_checkins;
```

## Frontend Considerations

### Displaying Check-in Times:
- Show individual check-in times for each visitor
- Calculate and display group arrival time as earliest check-in
- Update real-time as visitors check in

### Admin Dashboard:
- Display individual visitor check-in times
- Show group arrival time separately
- Provide detailed check-in timeline

## Backward Compatibility

### Existing Data:
- Migration script preserves existing check-in times
- Old booking-level check-in times are copied to individual records
- No data loss during migration

### API Compatibility:
- All existing API endpoints continue to work
- New individual check-in times are returned in responses
- Booking-level check-in time is deprecated but still available

## Testing

### Test Scenarios:
1. **Single visitor check-in** - Verify individual time is set
2. **Group check-in** - Verify each visitor gets their own time
3. **Mixed group check-in** - Verify both main and additional visitors
4. **Late arrivals** - Verify individual times for staggered arrivals
5. **Migration verification** - Ensure existing data is preserved

### Test Commands:
```bash
# Test individual check-in
curl -X POST http://localhost:3000/api/slots/visit/qr-scan \
  -H "Content-Type: application/json" \
  -d '{"qrData":"{\"type\":\"additional_visitor\",\"tokenId\":\"TEST-123\"}"}'

# Test group arrival calculation
node -e "
const { calculateGroupArrivalTime } = require('./utils/groupCheckinUtils');
// Test with your booking ID
"
```

## Troubleshooting

### Common Issues:

1. **Migration fails**:
   - Check database permissions
   - Ensure database connection is working
   - Verify table structure before migration

2. **Check-in times not showing**:
   - Verify `checkin_time` columns exist
   - Check that individual times are being set
   - Ensure frontend is reading correct field

3. **Performance issues**:
   - Verify indexes are created
   - Check query performance with EXPLAIN
   - Consider query optimization for large datasets

### Debug Commands:
```sql
-- Check if columns exist
DESCRIBE visitors;
DESCRIBE additional_visitors;

-- Check migration status
SELECT COUNT(*) as visited_with_checkin 
FROM visitors 
WHERE status = 'visited' AND checkin_time IS NOT NULL;

-- Verify indexes
SHOW INDEX FROM visitors;
SHOW INDEX FROM additional_visitors;
```

## Future Enhancements

### Potential Improvements:
1. **Real-time notifications** - Notify when group members check in
2. **Check-in analytics** - Advanced reporting and insights
3. **Group coordination** - Tools for group leaders to track members
4. **Integration features** - Connect with external systems
5. **Mobile app support** - Enhanced mobile check-in experience

## Support

For questions or issues related to individual check-in times:
1. Check this documentation
2. Review the migration logs
3. Test with the provided utility functions
4. Contact the development team

---

**Last Updated**: January 2025
**Version**: 1.0
**Author**: Museoo Development Team
