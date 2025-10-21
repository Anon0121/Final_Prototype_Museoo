# Event Registration System - Complete Guide

## Overview
This guide documents the comprehensive event registration system for museum exhibits, allowing participants to register for events with capacity management and detailed participant tracking.

## 🎯 Features Implemented

### **Admin Features**
1. **Capacity Management**: Set maximum participants per event
2. **Registration Viewing**: View all registered participants for each event
3. **Participant Details**: See complete registration information
4. **Status Tracking**: Monitor registration, check-in, and cancellation status
5. **Real-time Updates**: Automatic capacity tracking

### **Visitor Features**
1. **Easy Registration**: Simple form with required fields
2. **Capacity Awareness**: See available slots before registering
3. **Validation**: Prevent duplicate registrations
4. **Confirmation**: Success feedback and email confirmation
5. **QR Code Generation**: Automatic QR code for check-in

## 🗄️ Database Structure

### **Updated Activities Table**
```sql
ALTER TABLE activities 
ADD COLUMN max_capacity INT DEFAULT 50,
ADD COLUMN current_registrations INT DEFAULT 0;
```

### **Event Registrations Table**
```sql
CREATE TABLE event_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    email VARCHAR(255) NOT NULL,
    visitor_type ENUM('local', 'foreign') NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('registered', 'checked_in', 'cancelled') DEFAULT 'registered',
    qr_code VARCHAR(255),
    checkin_time TIMESTAMP NULL,
    FOREIGN KEY (event_id) REFERENCES activities(id) ON DELETE CASCADE
);
```

## 🚀 Setup Instructions

### **1. Database Setup**
Run the setup script to create the necessary tables and fields:
```bash
cd backend/scripts
node setup_event_registration.js
```

### **2. Backend Routes**
The following API endpoints are available:

#### **Register for Event**
```
POST /api/event-registrations/register
Content-Type: application/json

{
  "event_id": 1,
  "firstname": "John",
  "lastname": "Doe",
  "gender": "male",
  "email": "john@example.com",
  "visitor_type": "local"
}
```

#### **Get Event Registrations**
```
GET /api/event-registrations/event/:eventId
```

#### **Get Event Capacity**
```
GET /api/event-registrations/event/:eventId/capacity
```

#### **Update Registration Status**
```
PUT /api/event-registrations/:registrationId/status
{
  "status": "checked_in"
}
```

## 📱 User Interface

### **Admin Interface (Exhibit Management)**
1. **Capacity Setting**: Add max capacity when creating exhibits
2. **Registration View**: Click "Registrations" button to view participants
3. **Capacity Display**: See current registrations vs max capacity
4. **Participant Details**: View all registration information in a table

### **Visitor Interface (Exhibit Registration)**
1. **Registration Button**: "Register Now" button on each exhibit card
2. **Registration Form**: Simple form with all required fields
3. **Capacity Display**: Shows available slots
4. **Success Confirmation**: Clear feedback on successful registration

## 🔧 Technical Implementation

### **Frontend Components**

#### **Admin Exhibit Component** (`Museoo/src/components/admin/Exhibit.jsx`)
- Capacity management in exhibit creation
- Registration viewing modal
- Real-time capacity display
- Participant table with all details

#### **Visitor Registration Component** (`Museoo/src/components/visitor/EventRegistration.jsx`)
- Registration form with validation
- Capacity checking
- Success/error handling
- QR code generation

#### **Visitor Exhibits Component** (`Museoo/src/components/visitor/exhibits.jsx`)
- Registration button integration
- Capacity display
- Modal integration

### **Backend Routes** (`backend/routes/event-registrations.js`)
- Complete CRUD operations for registrations
- Capacity management
- Status updates
- Statistics and reporting

## 📊 Registration Fields

### **Required Fields**
1. **First Name**: Participant's first name
2. **Last Name**: Participant's last name
3. **Email**: Contact email address
4. **Gender**: Male, Female, or Other
5. **Visitor Type**: Local or Foreign

### **Auto-Generated Fields**
1. **Registration Date**: Timestamp of registration
2. **QR Code**: Unique QR code for check-in
3. **Status**: Registration status (registered/checked_in/cancelled)
4. **Check-in Time**: Timestamp when participant checks in

## 🎨 User Experience Features

### **Admin Experience**
- **Visual Capacity Indicators**: Clear display of current vs max capacity
- **Registration Management**: Easy access to participant lists
- **Status Tracking**: Monitor participant check-ins
- **Responsive Design**: Works on all device sizes

### **Visitor Experience**
- **Simple Registration**: One-click registration process
- **Real-time Validation**: Immediate feedback on form errors
- **Capacity Awareness**: Know availability before registering
- **Success Confirmation**: Clear confirmation of successful registration

## 🔒 Validation & Security

### **Registration Validation**
- **Required Fields**: All fields must be completed
- **Email Format**: Valid email address required
- **Duplicate Prevention**: One registration per email per event
- **Capacity Limits**: Cannot exceed maximum capacity
- **Event Status**: Cannot register for ended events

### **Data Integrity**
- **Foreign Key Constraints**: Proper database relationships
- **Automatic Triggers**: Real-time capacity updates
- **Status Management**: Proper status transitions
- **QR Code Security**: Unique codes for each registration

## 📈 Statistics & Reporting

### **Available Statistics**
- Total registrations per event
- Registration status breakdown
- Visitor type distribution
- Check-in rates
- Capacity utilization

### **Admin Dashboard Features**
- Registration counts
- Capacity utilization
- Status overview
- Participant demographics

## 🚀 Future Enhancements

### **Planned Features**
1. **Email Notifications**: Automatic confirmation emails
2. **QR Code Scanning**: Mobile check-in app
3. **Waitlist Management**: Handle overflow registrations
4. **Bulk Operations**: Mass registration management
5. **Analytics Dashboard**: Detailed reporting interface
6. **Payment Integration**: Paid event registration
7. **Certificate Generation**: Automatic certificates for participants

### **Advanced Features**
1. **Group Registrations**: Register multiple participants
2. **Custom Fields**: Additional registration fields
3. **Registration Templates**: Predefined registration forms
4. **Multi-language Support**: International visitor support
5. **Integration APIs**: Third-party system integration

## 🛠️ Troubleshooting

### **Common Issues**

#### **Registration Fails**
- Check if event exists and is active
- Verify capacity limits
- Ensure all required fields are completed
- Check for duplicate email registrations

#### **Capacity Not Updating**
- Verify database triggers are working
- Check for proper foreign key relationships
- Ensure registration status is correct

#### **QR Code Issues**
- Verify QR code generation library is installed
- Check for proper data encoding
- Ensure unique registration IDs

### **Debug Information**
- Console logs show registration process
- Network tab shows API requests
- Database queries are logged
- Error messages provide specific feedback

## 📋 API Documentation

### **Complete API Reference**

#### **Registration Endpoints**
```
POST /api/event-registrations/register
GET /api/event-registrations/event/:eventId
PUT /api/event-registrations/:registrationId/status
DELETE /api/event-registrations/:registrationId
```

#### **Capacity Endpoints**
```
GET /api/event-registrations/event/:eventId/capacity
PUT /api/event-registrations/event/:eventId/capacity
```

#### **Statistics Endpoints**
```
GET /api/event-registrations/stats
GET /api/event-registrations/
```

## 🎯 Best Practices

### **Admin Best Practices**
1. **Set Realistic Capacities**: Consider venue and resource limitations
2. **Monitor Registrations**: Regularly check registration status
3. **Communicate Changes**: Inform participants of any updates
4. **Backup Data**: Regular database backups

### **Visitor Best Practices**
1. **Register Early**: Popular events fill quickly
2. **Provide Accurate Information**: Ensure contact details are correct
3. **Check Email**: Look for confirmation emails
4. **Arrive on Time**: Respect event schedules

## 🏁 Conclusion

The event registration system provides a comprehensive solution for managing museum exhibit registrations. It offers both administrators and visitors a smooth, efficient experience with robust capacity management and detailed participant tracking.

The system is designed to be scalable, secure, and user-friendly, with room for future enhancements and integrations.

