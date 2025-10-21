const express = require('express');
const router = express.Router();
const db = require('../db');
const QRCode = require('qrcode');
const { sendEventApprovalEmail } = require('../services/emailService');

// Helper function to update current_registrations count for an event
const updateEventRegistrationCount = async (eventId) => {
  try {
    const [result] = await db.query(`
      UPDATE event_details 
      SET current_registrations = (
        SELECT COUNT(*) 
        FROM event_registrations 
        WHERE event_id = ? AND approval_status = 'approved'
      )
      WHERE activity_id = ?
    `, [eventId, eventId]);
    
    console.log(`✅ Updated registration count for event ${eventId}`);
    return result;
  } catch (error) {
    console.error('❌ Error updating registration count:', error);
    throw error;
  }
};

// ========================================
// GET ALL EVENTS
// ========================================
router.get('/events', async (req, res) => {
  try {
    // First, let's try a simple query to see what's in the activities table
    const [activities] = await db.query(`
      SELECT 
        id,
        title,
        description,
        type,
        created_at
      FROM activities 
      WHERE type = 'event'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log('Found activities:', activities.length);
    
    // If we have activities, try to get event details
    let events = [];
    if (activities.length > 0) {
      try {
        const activityIds = activities.map(a => a.id);
        const [eventDetails] = await db.query(`
          SELECT 
            ed.activity_id,
            ed.start_date,
            ed.location
          FROM event_details ed
          WHERE ed.activity_id IN (${activityIds.map(() => '?').join(',')})
        `, activityIds);
        
        // Combine activities with their details
        events = activities.map(activity => {
          const details = eventDetails.find(ed => ed.activity_id === activity.id);
          return {
            id: activity.id,
            name: activity.title,
            description: activity.description,
            date: details ? details.start_date : null,
            location: details ? details.location : null
          };
        });
      } catch (detailsError) {
        console.error('Error fetching event details:', detailsError);
        // If event_details query fails, just return activities without details
        events = activities.map(activity => ({
          id: activity.id,
          name: activity.title,
          description: activity.description,
          date: null,
          location: null
        }));
      }
    }
    
    console.log('Returning events:', events.length);
    
    res.json({
      success: true,
      events: events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch events',
      details: error.message
    });
  }
});

// ========================================
// GET ALL EVENT REGISTRATIONS
// ========================================
router.get('/', async (req, res) => {
  try {
    const [registrations] = await db.query(`
      SELECT 
        er.*,
        a.title as event_title,
        ed.start_date,
        ed.time,
        ed.location
      FROM event_registrations er
      JOIN activities a ON er.event_id = a.id
      JOIN event_details ed ON a.id = ed.activity_id
      ORDER BY er.registration_date DESC
    `);
    
    res.json(registrations);
  } catch (error) {
    console.error('Error fetching event registrations:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// ========================================
// GET REGISTRATIONS BY EVENT ID
// ========================================
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const [registrations] = await db.query(`
      SELECT 
        er.*,
        a.title as event_title,
        ed.max_capacity,
        ed.current_registrations
      FROM event_registrations er
      JOIN activities a ON er.event_id = a.id
      JOIN event_details ed ON a.id = ed.activity_id
      WHERE er.event_id = ?
      ORDER BY er.registration_date ASC
    `, [eventId]);
    
    res.json(registrations);
  } catch (error) {
    console.error('Error fetching event registrations:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// ========================================
// REGISTER FOR AN EVENT
// ========================================
router.post('/register', async (req, res) => {
  try {
    const { 
      event_id, 
      firstname, 
      lastname, 
      gender, 
      email, 
      visitor_type 
    } = req.body;

    console.log('🔄 Registration request received:', { event_id, firstname, lastname, email, gender, visitor_type });

    // Validate required fields
    if (!event_id || !firstname || !lastname || !gender || !email || !visitor_type) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }

    // Check if event exists and has capacity
    const [event] = await db.query(`
      SELECT a.id, a.title, ed.max_capacity, ed.current_registrations, ed.start_date, ed.time
      FROM activities a
      JOIN event_details ed ON a.id = ed.activity_id
      WHERE a.id = ? AND a.type = 'event'
    `, [event_id]);

    if (event.length === 0) {
      console.log('❌ Event not found:', event_id);
      return res.status(404).json({ 
        error: 'Event not found' 
      });
    }

    const eventData = event[0];
    console.log('✅ Event found:', eventData.title);

    // Check if event is still accepting registrations (not ended)
    const now = new Date();
    const eventDate = new Date(eventData.start_date);
    if (eventData.time) {
      const [hours, minutes] = eventData.time.split(':');
      eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    if (eventDate < now) {
      console.log('❌ Event has already ended');
      return res.status(400).json({ 
        error: 'Event has already ended' 
      });
    }

    // Check capacity
    if (eventData.current_registrations >= eventData.max_capacity) {
      console.log('❌ Event is at full capacity');
      return res.status(400).json({ 
        error: 'Event is at full capacity' 
      });
    }

    // Check if user is already registered
    const [existingRegistration] = await db.query(`
      SELECT er.*, a.title as event_title, ed.start_date, ed.time, ed.location
      FROM event_registrations er
      JOIN activities a ON er.event_id = a.id
      JOIN event_details ed ON a.id = ed.activity_id
      WHERE er.event_id = ? AND er.email = ? AND er.status != 'cancelled'
    `, [event_id, email]);

    if (existingRegistration.length > 0) {
      console.log('❌ User already registered for this event');
      return res.status(400).json({
        success: false,
        error: 'Email already registered!',
        message: `This email (${email}) is already registered for "${existingRegistration[0].event_title}". Please use a different email address to register another participant.`,
        details: {
          registeredEmail: email,
          eventTitle: existingRegistration[0].event_title,
          registrationDate: existingRegistration[0].registration_date,
          status: existingRegistration[0].approval_status
        }
      });
    }

    console.log('✅ Creating new registration...');

    // Insert registration with pending approval status (no QR code yet)
    const [result] = await db.query(`
      INSERT INTO event_registrations 
      (event_id, firstname, lastname, gender, email, visitor_type, status, approval_status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', 'pending')
    `, [event_id, firstname, lastname, gender, email, visitor_type]);

    console.log('✅ Registration inserted with ID:', result.insertId);

    // Get the created registration
    const [newRegistration] = await db.query(`
      SELECT 
        er.*,
        a.title as event_title,
        ed.start_date,
        ed.time,
        ed.location
      FROM event_registrations er
      JOIN activities a ON er.event_id = a.id
      JOIN event_details ed ON a.id = ed.activity_id
      WHERE er.id = ?
    `, [result.insertId]);

    console.log('✅ Sending success response');
    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully! Your registration is pending approval. You will receive an email with your QR code once approved.',
      registration: newRegistration[0]
    });

  } catch (error) {
    console.error('❌ Error registering for event:', error);
    res.status(500).json({ 
      error: 'Failed to register for event' 
    });
  }
});

// ========================================
// APPROVE REGISTRATION
// ========================================
router.put('/:registrationId/approve', async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { approved_by } = req.body;

    // Get the registration with event details
    const [registration] = await db.query(`
      SELECT er.*, a.title as event_title, ed.start_date, ed.time, ed.location
      FROM event_registrations er
      JOIN activities a ON er.event_id = a.id
      JOIN event_details ed ON a.id = ed.activity_id
      WHERE er.id = ?
    `, [registrationId]);

    if (registration.length === 0) {
      return res.status(404).json({ 
        error: 'Registration not found' 
      });
    }

    const regData = registration[0];

    // Generate QR code for approved registration (using JSON format like visitors)
    const qrData = {
      type: 'event_participant',
      registration_id: regData.id,
      firstname: regData.firstname,
      lastname: regData.lastname,
      email: regData.email,
      event_title: regData.event_title,
      event_id: regData.event_id
    };
    
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
    
    console.log('🔍 QR Code generated successfully for registration:', regData.id);
    console.log('📱 QR Data:', qrData);
    console.log('🔍 QR Code length:', qrCode.length);
    console.log('🔍 QR Code starts with:', qrCode.substring(0, 50) + '...');
    console.log('🔍 QR Code is data URL:', qrCode.startsWith('data:image/'));

    // Update registration to approved status
    const [result] = await db.query(`
      UPDATE event_registrations 
      SET status = 'pending',
          approval_status = 'approved',
          approval_date = NOW(),
          approved_by = ?,
          qr_code = ?
      WHERE id = ?
    `, [approved_by || 'Admin', qrCode, registrationId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Registration not found' 
      });
    }

    // Update the event's current_registrations count
    try {
      await updateEventRegistrationCount(regData.event_id);
    } catch (countError) {
      console.error('❌ Error updating registration count:', countError);
      // Don't fail the approval if count update fails
    }

    // Send approval email with QR code and participant ID
    try {
      console.log('📧 Sending approval email to:', regData.email);
      console.log('🔍 QR Code generated, length:', qrCode.length);
      
      const emailData = {
        firstname: regData.firstname,
        lastname: regData.lastname,
        email: regData.email,
        event_title: regData.event_title,
        start_date: regData.start_date,
        time: regData.time,
        location: regData.location,
        qr_code: qrCode,
        registration_id: regData.id,
      };

      await sendEventApprovalEmail(emailData);
      console.log('✅ Approval email sent successfully to:', regData.email);
    } catch (emailError) {
      console.error('❌ Error sending approval email:', emailError);
      console.error('❌ Email error details:', emailError.message);
      // Don't fail the approval if email fails
    }

    res.json({ 
      success: true, 
      message: 'Registration approved successfully! QR code generated and approval email sent.',
      qr_code: qrCode
    });

  } catch (error) {
    console.error('Error approving registration:', error);
    res.status(500).json({ 
      error: 'Failed to approve registration' 
    });
  }
});

// ========================================
// REJECT REGISTRATION
// ========================================
router.put('/:registrationId/reject', async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { rejected_by, rejection_reason } = req.body;

    // Update registration to rejected status
    const [result] = await db.query(`
      UPDATE event_registrations 
      SET status = 'cancelled',
          approval_status = 'rejected',
          approval_date = NOW(),
          approved_by = ?,
          rejection_reason = ?
      WHERE id = ?
    `, [rejected_by || 'Admin', rejection_reason || 'Registration rejected by admin', registrationId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Registration not found' 
      });
    }

    // Get the event_id before updating count
    const [registration] = await db.query(`
      SELECT event_id FROM event_registrations WHERE id = ?
    `, [registrationId]);

    if (registration.length > 0) {
      // Update the event's current_registrations count
      try {
        await updateEventRegistrationCount(registration[0].event_id);
      } catch (countError) {
        console.error('❌ Error updating registration count:', countError);
        // Don't fail the rejection if count update fails
      }
    }

    res.json({ 
      success: true, 
      message: 'Registration rejected successfully!' 
    });

  } catch (error) {
    console.error('Error rejecting registration:', error);
    res.status(500).json({ 
      error: 'Failed to reject registration' 
    });
  }
});

// ========================================
// UPDATE REGISTRATION STATUS
// ========================================
router.put('/:registrationId/status', async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { status } = req.body;

    if (!['registered', 'checked_in', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status' 
      });
    }

    const [result] = await db.query(`
      UPDATE event_registrations 
      SET status = ?, checkin_time = ?
      WHERE id = ?
    `, [status, status === 'checked_in' ? new Date() : null, registrationId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Registration not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Registration status updated' 
    });

  } catch (error) {
    console.error('Error updating registration status:', error);
    res.status(500).json({ 
      error: 'Failed to update registration status' 
    });
  }
});

// ========================================
// DELETE REGISTRATION
// ========================================
router.delete('/:registrationId', async (req, res) => {
  try {
    const { registrationId } = req.params;

    const [result] = await db.query(`
      DELETE FROM event_registrations 
      WHERE id = ?
    `, [registrationId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Registration not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Registration deleted' 
    });

  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ 
      error: 'Failed to delete registration' 
    });
  }
});

// ========================================
// GET EVENT CAPACITY INFO
// ========================================
router.get('/event/:eventId/capacity', async (req, res) => {
  try {
    const { eventId } = req.params;

    const [event] = await db.query(`
      SELECT 
        a.id,
        a.title,
        ed.max_capacity,
        ed.current_registrations,
        (ed.max_capacity - ed.current_registrations) as available_slots
      FROM activities a
      JOIN event_details ed ON a.id = ed.activity_id
      WHERE a.id = ?
    `, [eventId]);

    if (event.length === 0) {
      return res.status(404).json({ 
        error: 'Event not found' 
      });
    }

    res.json(event[0]);

  } catch (error) {
    console.error('Error fetching event capacity:', error);
    res.status(500).json({ 
      error: 'Failed to fetch event capacity' 
    });
  }
});

// ========================================
// UPDATE EVENT CAPACITY
// ========================================
router.put('/event/:eventId/capacity', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { max_capacity } = req.body;

    if (!max_capacity || max_capacity < 1) {
      return res.status(400).json({ 
        error: 'Valid capacity is required' 
      });
    }

    const [result] = await db.query(`
      UPDATE event_details 
      SET max_capacity = ?
      WHERE activity_id = ?
    `, [max_capacity, eventId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Event not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Event capacity updated' 
    });

  } catch (error) {
    console.error('Error updating event capacity:', error);
    res.status(500).json({ 
      error: 'Failed to update event capacity' 
    });
  }
});

// ========================================
// CHECK-IN EVENT PARTICIPANT
// ========================================
router.post('/checkin', async (req, res) => {
  try {
    const { registration_id, event_id, email, manual_checkin } = req.body;

    if (!registration_id) {
      return res.status(400).json({ 
        error: 'Registration ID is required' 
      });
    }

    // Find the registration
    let query, params;
    
    if (manual_checkin) {
      // For manual check-in, try to find by registration_id
      query = `
        SELECT er.*, a.title as event_title, ed.start_date, ed.time, ed.location
        FROM event_registrations er
        JOIN activities a ON er.event_id = a.id
        JOIN event_details ed ON a.id = ed.activity_id
        WHERE er.id = ? AND er.approval_status = 'approved'
      `;
      params = [registration_id];
    } else {
      // For QR code check-in, handle both old and new QR code formats
      if (email) {
        // New QR code format with email
        query = `
          SELECT er.*, a.title as event_title, ed.start_date, ed.time, ed.location
          FROM event_registrations er
          JOIN activities a ON er.event_id = a.id
          JOIN event_details ed ON a.id = ed.activity_id
          WHERE er.id = ? AND er.event_id = ? AND er.email = ? AND er.approval_status = 'approved'
        `;
        params = [registration_id, event_id, email];
      } else {
        // Old QR code format without email - just check registration_id and event_id
        query = `
          SELECT er.*, a.title as event_title, ed.start_date, ed.time, ed.location
          FROM event_registrations er
          JOIN activities a ON er.event_id = a.id
          JOIN event_details ed ON a.id = ed.activity_id
          WHERE er.id = ? AND er.event_id = ? AND er.approval_status = 'approved'
        `;
        params = [registration_id, event_id];
      }
    }

    const [registrations] = await db.query(query, params);

    if (registrations.length === 0) {
      return res.status(404).json({ 
        error: 'Registration not found or not approved' 
      });
    }

    const registration = registrations[0];

    // Check if already checked in
    if (registration.status === 'checked_in') {
      return res.status(400).json({ 
        error: 'Participant has already been checked in',
        participant: registration
      });
    }

    // Check if registration is cancelled
    if (registration.status === 'cancelled') {
      return res.status(400).json({ 
        error: 'Registration has been cancelled and cannot be checked in' 
      });
    }

    // Check event timing to determine status
    const now = new Date();
    const eventDate = new Date(registration.start_date);
    
    // Set event time if available
    if (registration.time) {
      const [hours, minutes] = registration.time.split(':');
      eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      // If no specific time, assume end of day
      eventDate.setHours(23, 59, 59, 999);
    }

    // Calculate event end time (assume 2-hour event duration)
    const eventEndTime = new Date(eventDate);
    eventEndTime.setHours(eventEndTime.getHours() + 2);

    let statusToSet = 'checked_in';
    let statusMessage = 'Participant checked in successfully!';

    // Check if event has already ended
    if (now > eventEndTime) {
      statusToSet = 'cancelled';
      statusMessage = 'Event has already ended. Registration cancelled.';
      console.log(`❌ Event ended: ${registration.firstname} ${registration.lastname} - Event finished at ${eventEndTime.toISOString()}, current time: ${now.toISOString()}`);
    } else if (now > eventDate) {
      // Event is in progress or just started
      statusToSet = 'checked_in';
      statusMessage = 'Participant checked in successfully!';
      console.log(`✅ Event in progress: ${registration.firstname} ${registration.lastname} - Event started at ${eventDate.toISOString()}, current time: ${now.toISOString()}`);
    } else {
      // Event hasn't started yet
      statusToSet = 'checked_in';
      statusMessage = 'Participant checked in successfully! (Early arrival)';
      console.log(`✅ Early arrival: ${registration.firstname} ${registration.lastname} - Event starts at ${eventDate.toISOString()}, current time: ${now.toISOString()}`);
    }

    // Update status based on event timing
    const [result] = await db.query(`
      UPDATE event_registrations 
      SET status = ?, checkin_time = NOW()
      WHERE id = ?
    `, [statusToSet, registration.id]);

    if (result.affectedRows === 0) {
      return res.status(500).json({ 
        error: 'Failed to update check-in status' 
      });
    }

    // Get updated registration data
    const [updatedRegistration] = await db.query(`
      SELECT er.*, a.title as event_title, ed.start_date, ed.time, ed.location
      FROM event_registrations er
      JOIN activities a ON er.event_id = a.id
      JOIN event_details ed ON a.id = ed.activity_id
      WHERE er.id = ?
    `, [registration.id]);

    const updatedParticipant = updatedRegistration[0];

    console.log(`✅ Event participant ${statusToSet}: ${registration.firstname} ${registration.lastname} (${registration.email}) - ${statusMessage}`);

    res.json({
      success: true,
      message: statusMessage,
      participant: {
        ...updatedParticipant,
        status: statusToSet,
        event_status: now > eventEndTime ? 'ended' : now > eventDate ? 'in_progress' : 'not_started',
        checkin_time: updatedParticipant.checkin_time
      }
    });

  } catch (error) {
    console.error('Error checking in event participant:', error);
    res.status(500).json({ 
      error: 'Failed to check in participant' 
    });
  }
});

// ========================================
// UPDATE REGISTRATION STATUSES BASED ON EVENT TIMING
// ========================================
router.post('/update-statuses', async (req, res) => {
  try {
    console.log('🔄 Updating registration statuses based on event timing...');
    
    // Get all approved registrations with event details
    const [registrations] = await db.query(`
      SELECT 
        er.id,
        er.status,
        er.approval_status,
        ed.start_date,
        ed.time,
        er.firstname,
        er.lastname
      FROM event_registrations er
      JOIN activities a ON er.event_id = a.id
      JOIN event_details ed ON a.id = ed.activity_id
      WHERE er.approval_status = 'approved'
    `);

    const now = new Date();
    let updatedCount = 0;
    let cancelledCount = 0;

    for (const registration of registrations) {
      // Skip if already checked in or cancelled
      if (registration.status === 'checked_in' || registration.status === 'cancelled') {
        continue;
      }

      // Calculate event end time
      let eventEndTime = new Date(registration.start_date);
      if (registration.time) {
        const [hours, minutes] = registration.time.split(':');
        eventEndTime.setHours(parseInt(hours) + 2, parseInt(minutes), 0, 0); // Assume 2-hour event
      } else {
        eventEndTime.setHours(23, 59, 59, 999);
      }

      // If event has ended and participant hasn't checked in, mark as cancelled
      if (now > eventEndTime && registration.status !== 'checked_in') {
        await db.query(`
          UPDATE event_registrations 
          SET status = 'cancelled'
          WHERE id = ?
        `, [registration.id]);
        
        console.log(`❌ Auto-cancelled: ${registration.firstname} ${registration.lastname} - Event ended without check-in`);
        cancelledCount++;
      }
      // If event hasn't ended and status is not pending, update to pending
      else if (now <= eventEndTime && registration.status !== 'pending') {
        await db.query(`
          UPDATE event_registrations 
          SET status = 'pending'
          WHERE id = ?
        `, [registration.id]);
        
        console.log(`⏳ Auto-pending: ${registration.firstname} ${registration.lastname} - Event not ended yet`);
        updatedCount++;
      }
    }

    console.log(`✅ Status update complete: ${updatedCount} set to pending, ${cancelledCount} cancelled`);

    res.json({
      success: true,
      message: `Registration statuses updated: ${updatedCount} pending, ${cancelledCount} cancelled`,
      updated: updatedCount,
      cancelled: cancelledCount
    });

  } catch (error) {
    console.error('Error updating registration statuses:', error);
    res.status(500).json({ 
      error: 'Failed to update registration statuses' 
    });
  }
});

// ========================================
// GET REGISTRATION WITH AUTO-STATUS
// ========================================
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // First, update statuses for this event
    const [eventRegistrations] = await db.query(`
      SELECT 
        er.id,
        er.status,
        er.approval_status,
        ed.start_date,
        ed.time
      FROM event_registrations er
      JOIN activities a ON er.event_id = a.id
      JOIN event_details ed ON a.id = ed.activity_id
      WHERE er.event_id = ? AND er.approval_status = 'approved'
    `, [eventId]);

    const now = new Date();
    
    // Update statuses for this event's registrations
    for (const registration of eventRegistrations) {
      if (registration.status === 'checked_in' || registration.status === 'cancelled') {
        continue;
      }

      let eventEndTime = new Date(registration.start_date);
      if (registration.time) {
        const [hours, minutes] = registration.time.split(':');
        eventEndTime.setHours(parseInt(hours) + 2, parseInt(minutes), 0, 0);
      } else {
        eventEndTime.setHours(23, 59, 59, 999);
      }

      if (now > eventEndTime) {
        await db.query(`
          UPDATE event_registrations 
          SET status = 'cancelled'
          WHERE id = ?
        `, [registration.id]);
      } else if (registration.status !== 'pending') {
        await db.query(`
          UPDATE event_registrations 
          SET status = 'pending'
          WHERE id = ?
        `, [registration.id]);
      }
    }
    
    // Now fetch the updated registrations
    const [registrations] = await db.query(`
      SELECT 
        er.*,
        a.title as event_title,
        ed.max_capacity,
        ed.current_registrations
      FROM event_registrations er
      JOIN activities a ON er.event_id = a.id
      JOIN event_details ed ON a.id = ed.activity_id
      WHERE er.event_id = ?
      ORDER BY er.registration_date ASC
    `, [eventId]);
    
    res.json(registrations);
  } catch (error) {
    console.error('Error fetching event registrations:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// ========================================
// DELETE EVENT REGISTRATION
// ========================================
router.delete('/:registrationId', async (req, res) => {
  try {
    const { registrationId } = req.params;

    // First, get the event_id and approval_status before deleting
    const [registration] = await db.query(`
      SELECT event_id, approval_status 
      FROM event_registrations 
      WHERE id = ?
    `, [registrationId]);

    if (registration.length === 0) {
      return res.status(404).json({ 
        error: 'Registration not found' 
      });
    }

    const eventId = registration[0].event_id;
    const wasApproved = registration[0].approval_status === 'approved';

    // Delete the registration
    const [result] = await db.query(`
      DELETE FROM event_registrations 
      WHERE id = ?
    `, [registrationId]);

    if (result.affectedRows === 0) {
      return res.status(500).json({ 
        error: 'Failed to delete registration' 
      });
    }

    // Always update the event's current_registrations count when a registration is deleted
    try {
      await updateEventRegistrationCount(eventId);
      console.log(`✅ Updated registration count for event ${eventId} after deletion`);
    } catch (countError) {
      console.error('❌ Error updating registration count after deletion:', countError);
      // Don't fail the deletion if count update fails
    }

    console.log(`✅ Event registration deleted: ID ${registrationId}`);

    res.json({
      success: true,
      message: 'Registration deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting event registration:', error);
    res.status(500).json({ 
      error: 'Failed to delete registration' 
    });
  }
});

// ========================================
// GET REGISTRATION STATISTICS
// ========================================
router.get('/stats', async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_registrations,
        COUNT(CASE WHEN status = 'registered' THEN 1 END) as pending_checkin,
        COUNT(CASE WHEN status = 'checked_in' THEN 1 END) as checked_in,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN visitor_type = 'local' THEN 1 END) as local_visitors,
        COUNT(CASE WHEN visitor_type = 'foreign' THEN 1 END) as foreign_visitors
      FROM event_registrations
    `);

    res.json(stats[0]);

  } catch (error) {
    console.error('Error fetching registration stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch registration statistics' 
    });
  }
});

module.exports = router;

