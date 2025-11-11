const express = require('express');
const pool = require('../db');
const router = express.Router();
const { logActivity } = require('../utils/activityLogger');
const { isFieldMissing, hasPlaceholderName, normalize } = require('../utils/visitorHelpers');

// Get group walk-in member token info
router.get('/:tokenId', async (req, res) => {
  const { tokenId } = req.params;
  
  try {
    // Get token information with booking details and group leader info
    const [tokenRows] = await pool.query(
      `SELECT av.*, b.date as visit_date, b.time_slot, b.status as booking_status, b.booking_id, b.type as booking_type,
              v.first_name as group_leader_first_name, v.last_name as group_leader_last_name, 
              v.institution as group_leader_institution, v.purpose as group_leader_purpose
       FROM additional_visitors av
       JOIN bookings b ON av.booking_id = b.booking_id
       LEFT JOIN visitors v ON v.booking_id = b.booking_id AND v.is_main_visitor = true
       WHERE av.token_id = ?`,
      [tokenId]
    );
    
    if (tokenRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Token not found or expired'
      });
    }
    
    const tokenInfo = tokenRows[0];
    
    // Check if booking is still valid
    if (tokenInfo.booking_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'This booking has been cancelled'
      });
    }
    
    // Check if token has expired (for walk-in types)
    if (tokenInfo.expires_at && new Date() > new Date(tokenInfo.expires_at)) {
      return res.status(400).json({
        success: false,
        error: 'This link has expired. Please contact the museum for assistance.',
        linkExpired: true
      });
    }
    
    res.json({
      success: true,
      tokenInfo: {
        tokenId: tokenInfo.token_id,
        email: tokenInfo.email,
        status: tokenInfo.status,
        visitDate: tokenInfo.visit_date,
        visitTime: tokenInfo.time_slot,
        bookingId: tokenInfo.booking_id,
        bookingType: tokenInfo.booking_type,
        groupLeader: `${tokenInfo.group_leader_first_name || ''} ${tokenInfo.group_leader_last_name || ''}`.trim(),
        institution: tokenInfo.group_leader_institution || 'Not specified',
        purpose: tokenInfo.group_leader_purpose || 'Educational',
        linkExpired: tokenInfo.expires_at ? (new Date() > new Date(tokenInfo.expires_at)) : false,
        details: tokenInfo.details ? JSON.parse(tokenInfo.details) : null
      }
    });
    
  } catch (err) {
    console.error('Error fetching token info:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token information'
    });
  }
});

// Update group walk-in member details
router.put('/:tokenId', async (req, res) => {
  const { tokenId } = req.params;
  const { firstName, lastName, gender, address, visitorType } = req.body;
  
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // First, get token information
    const [tokenRows] = await connection.query(
      `SELECT av.*, b.status as booking_status, b.booking_id, b.type as booking_type, b.date as visit_date, b.time_slot,
              v.institution as group_leader_institution, v.purpose as group_leader_purpose
       FROM additional_visitors av
       JOIN bookings b ON av.booking_id = b.booking_id
       LEFT JOIN visitors v ON v.booking_id = b.booking_id AND v.is_main_visitor = true
       WHERE av.token_id = ?`,
      [tokenId]
    );
    
    if (tokenRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Token not found or expired'
      });
    }
    
    const tokenInfo = tokenRows[0];
    
    // Check if booking is still valid
    if (tokenInfo.booking_status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'This booking has been cancelled'
      });
    }
    
         // Check if already completed
     if (tokenInfo.status === 'completed') {
       await connection.rollback();
       return res.status(400).json({
         success: false,
         error: 'This form has already been submitted and cannot be submitted again.',
         linkExpired: true
       });
     }
    
    // Check if link has expired
    if (tokenInfo.expires_at && new Date() > new Date(tokenInfo.expires_at)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'This link has expired. Please contact the museum for assistance.',
        linkExpired: true
      });
    }
    
    // Prepare details object (inheriting institution and purpose from group leader)
    const details = {
      firstName,
      lastName,
      gender,
      address,
      visitorType,
      institution: tokenInfo.group_leader_institution || '',
      purpose: tokenInfo.group_leader_purpose || 'educational'
    };
    
    // Update the additional visitor record
    await connection.query(
      `UPDATE additional_visitors 
       SET first_name = ?, 
           last_name = ?, 
           gender = ?, 
           visitor_type = ?, 
           address = ?, 
           institution = ?, 
           purpose = ?, 
           details = ?, 
           status = 'completed', 
           details_completed_at = NOW()
       WHERE token_id = ?`,
      [
        firstName,
        lastName,
        gender,
        visitorType,
        address,
        tokenInfo.group_leader_institution || '',
        tokenInfo.group_leader_purpose || 'educational',
        JSON.stringify(details),
        tokenId
      ]
    );
    
    // Create visitor record in visitors table
    const [visitorResult] = await connection.query(
      `INSERT INTO visitors (
        booking_id, first_name, last_name, gender, address, email, 
        visitor_type, purpose, institution, status, is_main_visitor
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', false)`,
      [
        tokenInfo.booking_id,
        firstName,
        lastName,
        gender,
        address,
        tokenInfo.email,
        visitorType,
        tokenInfo.group_leader_purpose || 'educational',
        tokenInfo.group_leader_institution || '',
      ]
    );
    
    const visitorId = visitorResult.insertId;
    
    await connection.commit();
    
    try { await logActivity(req, 'group_walkin_member.registration.complete', { visitorId, bookingId: tokenInfo.booking_id }); } catch {}
    
    res.json({
      success: true,
      message: 'Group member registration completed successfully!',
      visitorId: visitorId
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Error updating group walk-in member info:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update information. Please try again.'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Check-in group walk-in member (for QR scanning)
router.post('/:visitorId/checkin', async (req, res) => {
  const { visitorId } = req.params;
  
  try {
    // First try to find the visitor by visitor_id (if they've completed their form)
    let [visitorRows] = await pool.query(
      `SELECT v.*, b.date as visit_date, b.time_slot, b.status as booking_status, b.type as booking_type
       FROM visitors v
       JOIN bookings b ON v.booking_id = b.booking_id
       WHERE v.visitor_id = ?`,
      [visitorId]
    );
    
         // If not found by visitor_id, try to find by token_id in additional_visitors
     if (visitorRows.length === 0) {
       console.log(`🔍 Visitor not found by visitor_id ${visitorId}, checking additional_visitors table...`);
       
       const [additionalVisitorRows] = await pool.query(
         `SELECT av.*, b.date as visit_date, b.time_slot, b.status as booking_status, b.type as booking_type
          FROM additional_visitors av
          JOIN bookings b ON av.booking_id = b.booking_id
          WHERE av.token_id = ?`,
         [visitorId]
       );
       
       if (additionalVisitorRows.length === 0) {
         return res.status(404).json({
           success: false,
           error: 'Group walk-in member not found'
         });
       }
       
       const additionalVisitor = additionalVisitorRows[0];
       
       // Check if they've completed their form
       if (additionalVisitor.status !== 'completed') {
         return res.status(400).json({
           success: false,
           status: 'incomplete',
           error: 'Group walk-in member has not completed their registration form yet. Please complete the form first.'
         });
       }
       
       const details = JSON.parse(additionalVisitor.details || '{}');
       const firstName = normalize(details.firstName || '');
       const lastName = normalize(details.lastName || '');
       const gender = normalize(details.gender || '');
       const missingFields = [];

       if (isFieldMissing(firstName) || hasPlaceholderName(firstName, '')) missingFields.push('first_name');
       if (isFieldMissing(lastName) || hasPlaceholderName('', lastName) || hasPlaceholderName(firstName, lastName)) missingFields.push('last_name');
       if (isFieldMissing(gender)) missingFields.push('gender');

       if (missingFields.length > 0) {
         return res.status(400).json({
           success: false,
           status: 'incomplete',
           error: 'Group walk-in member has not completed their registration form yet. Please complete the form first.',
           missingFields
         });
       }
       
       // Check if there's already a visitor record for this person
       const [existingVisitorRows] = await pool.query(
         `SELECT visitor_id FROM visitors WHERE booking_id = ? AND email = ? AND is_main_visitor = false`,
         [additionalVisitor.booking_id, additionalVisitor.email]
       );
       
       let visitorIdToUse;
       
       if (existingVisitorRows.length > 0) {
         // Update existing visitor record
         visitorIdToUse = existingVisitorRows[0].visitor_id;
         await pool.query(
           `UPDATE visitors SET status = 'visited', checkin_time = NOW() WHERE visitor_id = ?`,
           [visitorIdToUse]
         );
         console.log(`✅ Updated existing visitor record ${visitorIdToUse} to visited status`);
       } else {
         // Create a new visitor record for check-in
         const [newVisitorResult] = await pool.query(
           `INSERT INTO visitors (
             booking_id, first_name, last_name, gender, address, email, 
             visitor_type, purpose, institution, status, is_main_visitor, checkin_time
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'visited', false, NOW())`,
           [
             additionalVisitor.booking_id,
             firstName,
             lastName,
             gender,
             normalize(details.address || ''),
             additionalVisitor.email,
             normalize(details.visitorType || ''),
             normalize(details.purpose || 'educational'),
             normalize(details.institution || ''),
           ]
         );
         
         visitorIdToUse = newVisitorResult.insertId;
         console.log(`✅ Created new visitor record ${visitorIdToUse} with visited status`);
       }
       
       // Update the additional visitor status
       await pool.query(
         `UPDATE additional_visitors SET status = 'checked_in' WHERE token_id = ?`,
         [visitorId]
       );
       
       try { await logActivity(req, 'group_walkin_member.checkin', { visitorId: visitorIdToUse, bookingId: additionalVisitor.booking_id }); } catch {}
       
       res.json({
         success: true,
         message: 'Group walk-in member checked in successfully!',
         visitor: {
           first_name: firstName,
           last_name: lastName,
           email: additionalVisitor.email,
           gender,
           visitorType: normalize(details.visitorType || ''),
           address: normalize(details.address || ''),
           institution: normalize(details.institution || ''),
           purpose: normalize(details.purpose || 'educational'),
           visit_date: additionalVisitor.visit_date,
           visit_time: additionalVisitor.time_slot,
           checkin_time: new Date().toISOString(),
           visitorType: 'group_walkin_member'
         }
       });
       
       return;
     }
    
    const visitor = visitorRows[0];
    
    console.log('🔍 Existing group companion record', {
      visitorId,
      first_name: visitor.first_name,
      last_name: visitor.last_name,
      gender: visitor.gender,
      status: visitor.status
    });
    
    // Check if booking is valid
    if (visitor.booking_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'This booking has been cancelled and cannot be checked in.',
        status: visitor.booking_status
      });
    }

    const existingFirstName = normalize(visitor.first_name || '');
    const existingLastName = normalize(visitor.last_name || '');
    const existingGender = normalize(visitor.gender || '');
    const existingMissing = [];
    if (isFieldMissing(existingFirstName) || hasPlaceholderName(existingFirstName, existingLastName)) existingMissing.push('first_name');
    if (isFieldMissing(existingLastName) || hasPlaceholderName(existingFirstName, existingLastName)) existingMissing.push('last_name');
    if (isFieldMissing(existingGender)) existingMissing.push('gender');

    if (existingMissing.length > 0) {
      console.log('🚫 Companion incomplete (visitors table)', existingMissing);
      return res.status(400).json({
        success: false,
        status: 'incomplete',
        error: 'Group walk-in member has not completed their registration form yet. Please complete the form first.',
        missingFields: existingMissing
      });
    }
    
    if (visitor.status === 'visited') {
      return res.status(400).json({
        success: false,
        error: 'This visitor has already been checked in.',
        status: visitor.status
      });
    }
    
    // Update visitor status to visited and set check-in time
    await pool.query(
      `UPDATE visitors SET status = 'visited', checkin_time = NOW() WHERE visitor_id = ?`,
      [visitorId]
    );
    
    try { await logActivity(req, 'group_walkin_member.checkin', { visitorId, bookingId: visitor.booking_id }); } catch {}
    
    // Get the actual check-in time from the database
    const [checkinTimeResult] = await pool.query(
      `SELECT checkin_time FROM visitors WHERE visitor_id = ?`,
      [visitorId]
    );
    
    const actualCheckinTime = checkinTimeResult[0].checkin_time;
    
    res.json({
      success: true,
      message: 'Group walk-in member checked in successfully!',
      visitor: {
        first_name: existingFirstName,
        last_name: existingLastName,
        email: visitor.email,
        gender: existingGender,
        visitorType: visitor.visitor_type,
        address: visitor.address,
        institution: visitor.institution,
        purpose: visitor.purpose,
        visit_date: visitor.visit_date,
        visit_time: visitor.time_slot,
        checkin_time: actualCheckinTime ? actualCheckinTime.toISOString() : new Date().toISOString(),
        visitorType: 'group_walkin_member'
      }
    });
    
  } catch (err) {
    console.error('Error during group walk-in member check-in:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
