# Cultural Objects Maintenance Reminder System

## Overview

The Cultural Objects Maintenance Reminder System is a comprehensive feature that allows museum staff to track, schedule, and manage maintenance for cultural objects and artifacts. This system helps ensure proper care and preservation of valuable museum items.

## Features

### 1. Maintenance Tracking
- **Last Maintenance Date**: Record when maintenance was last performed
- **Next Maintenance Date**: Schedule upcoming maintenance
- **Maintenance Frequency**: Set how often maintenance should be performed (in months)
- **Maintenance Priority**: Assign priority levels (Low, Medium, High, Urgent)
- **Maintenance Contact**: Assign responsible person or department
- **Estimated Cost**: Track expected maintenance costs
- **Maintenance Notes**: Add specific requirements and procedures

### 2. Maintenance Alerts
- **Overdue Alerts**: Objects that are past their maintenance due date
- **Due Soon Alerts**: Objects requiring maintenance within 30 days
- **Visual Indicators**: Color-coded alerts in the dashboard
- **Alert Counter**: Shows number of pending maintenance items

### 3. Maintenance Overview Dashboard
- **Maintenance Status Cards**: Quick overview of maintenance needs
- **Alert Management**: View and manage all maintenance alerts
- **Priority-based Organization**: Alerts sorted by priority and urgency
- **Quick Edit Access**: Direct links to edit object maintenance information

## Database Schema

### New Fields Added to `object_details` Table

| Field | Type | Description |
|-------|------|-------------|
| `last_maintenance_date` | DATE | Date of last maintenance performed |
| `next_maintenance_date` | DATE | Scheduled date for next maintenance |
| `maintenance_frequency_months` | INT | Maintenance frequency in months (default: 12) |
| `maintenance_notes` | TEXT | Notes about maintenance requirements |
| `maintenance_priority` | ENUM | Priority level (low, medium, high, urgent) |
| `maintenance_status` | ENUM | Current status (up_to_date, due_soon, overdue, in_progress) |
| `maintenance_reminder_enabled` | BOOLEAN | Whether reminders are enabled (default: true) |
| `maintenance_contact` | VARCHAR(255) | Contact person responsible for maintenance |
| `maintenance_cost` | DECIMAL(10,2) | Estimated cost for maintenance |

### Database Views

#### `maintenance_overview`
A comprehensive view that provides:
- Object information with maintenance status
- Alert status calculation
- Days until maintenance
- All maintenance-related fields

## API Endpoints

### New Maintenance Endpoints

#### GET `/api/cultural-objects/maintenance/overview`
Returns all objects with maintenance information and alert status.

#### GET `/api/cultural-objects/maintenance/alerts`
Returns only objects with overdue or due-soon maintenance.

#### PUT `/api/cultural-objects/:id/maintenance`
Updates maintenance information for a specific object.

#### GET `/api/cultural-objects/:id/maintenance/history`
Returns maintenance history for a specific object.

## Frontend Features

### 1. Maintenance Form Section
- **Location**: Added to the cultural object creation/editing form
- **Fields**: All maintenance-related fields with proper validation
- **Toggle**: Enable/disable maintenance reminders per object

### 2. Maintenance Overview Panel
- **Access**: "Maintenance Overview" button in the header
- **Alert Counter**: Shows number of pending maintenance items
- **Alert Cards**: Visual cards showing maintenance alerts
- **Quick Actions**: Direct edit access for each object

### 3. Enhanced Stats Dashboard
- **New Card**: Maintenance Alerts counter
- **Visual Indicators**: Color-coded alert status
- **Real-time Updates**: Alerts update when objects are modified

### 4. Object Details Modal
- **Maintenance Section**: Shows all maintenance information
- **Priority Badges**: Color-coded priority indicators
- **Status Display**: Clear maintenance status and dates

## Usage Instructions

### Setting Up Maintenance for New Objects

1. **Create/Edit Object**: Go to Cultural Objects page
2. **Fill Basic Information**: Complete name, description, category
3. **Navigate to Maintenance Section**: Scroll to "Maintenance Information"
4. **Set Maintenance Schedule**:
   - Enter last maintenance date (if applicable)
   - Set next maintenance date
   - Choose maintenance frequency (default: 12 months)
   - Select priority level
   - Add maintenance contact
   - Enter estimated cost
   - Add maintenance notes
5. **Enable Reminders**: Check "Enable maintenance reminders"
6. **Save Object**: Submit the form

### Managing Maintenance Alerts

1. **View Alerts**: Click "Maintenance Overview" button
2. **Review Alert Cards**: Check overdue and due-soon items
3. **Edit Objects**: Click "Edit" on alert cards to update maintenance
4. **Update Status**: Modify maintenance dates and notes as needed
5. **Mark Complete**: Update last maintenance date when work is done

### Maintenance Workflow

1. **Daily Check**: Review maintenance alerts dashboard
2. **Prioritize Work**: Focus on overdue and high-priority items
3. **Schedule Maintenance**: Plan work based on priority and availability
4. **Perform Maintenance**: Complete required maintenance tasks
5. **Update Records**: Mark maintenance as complete and schedule next session
6. **Document Work**: Add notes about work performed and any issues found

## Alert System

### Alert Types

#### Overdue Alerts (Red)
- Objects past their maintenance due date
- Highest priority for immediate attention
- Shows days overdue

#### Due Soon Alerts (Yellow)
- Objects requiring maintenance within 30 days
- Medium priority for scheduling
- Shows days remaining

### Alert Calculation
- **Overdue**: `next_maintenance_date < current_date`
- **Due Soon**: `next_maintenance_date <= current_date + 30 days`
- **Up to Date**: `next_maintenance_date > current_date + 30 days`

## Best Practices

### 1. Maintenance Scheduling
- Set realistic maintenance frequencies based on object type
- Consider environmental factors and usage patterns
- Plan maintenance during low-visitor periods when possible

### 2. Priority Assignment
- **Urgent**: Objects with active deterioration or damage
- **High**: Objects in poor condition or high-value items
- **Medium**: Regular maintenance items
- **Low**: Preventive maintenance for stable objects

### 3. Contact Management
- Assign specific staff members or departments
- Include backup contacts for critical objects
- Update contact information when staff changes

### 4. Cost Tracking
- Estimate realistic maintenance costs
- Include labor, materials, and external services
- Track actual costs for future planning

### 5. Documentation
- Record detailed maintenance notes
- Include before/after photos when possible
- Document any issues or concerns discovered

## Installation

### 1. Run Database Migration
```bash
# Run the migration script
node backend/scripts/add_maintenance_reminders.js

# Or use the batch file
add-maintenance-reminders.bat
```

### 2. Verify Installation
- Check that new database fields are created
- Verify API endpoints are accessible
- Test frontend maintenance features

### 3. Configure Initial Settings
- Set up maintenance contacts
- Configure default maintenance frequencies
- Enable maintenance reminders for existing objects

## Troubleshooting

### Common Issues

#### Database Migration Fails
- Check database connection
- Verify user permissions
- Review error messages in console

#### Maintenance Alerts Not Showing
- Verify maintenance_reminder_enabled is true
- Check next_maintenance_date is set
- Ensure API endpoints are working

#### Frontend Form Issues
- Check browser console for JavaScript errors
- Verify API endpoints are accessible
- Test form validation

### Support
- Check server logs for detailed error messages
- Verify database schema matches expected structure
- Test API endpoints independently

## Future Enhancements

### Planned Features
- Email notifications for maintenance alerts
- Maintenance calendar integration
- Maintenance history reports
- Automated maintenance scheduling
- Integration with external maintenance systems
- Mobile app for maintenance tracking

### Customization Options
- Configurable alert thresholds
- Custom maintenance categories
- Integration with museum management systems
- Advanced reporting and analytics

## Conclusion

The Cultural Objects Maintenance Reminder System provides a comprehensive solution for managing museum object maintenance. By implementing this system, museums can:

- Ensure proper care and preservation of cultural objects
- Prevent deterioration through proactive maintenance
- Track maintenance costs and resources
- Maintain detailed maintenance records
- Improve staff efficiency and organization

This system helps museums fulfill their responsibility to preserve cultural heritage for future generations while maintaining operational efficiency.
