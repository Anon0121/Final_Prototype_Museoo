const express = require('express');
const pool = require('../db');
const router = express.Router();

// Note: We no longer need the /generate endpoint since we use existing visitor IDs as backup codes

// Validate a backup code (using visitor ID) - Updated for unified visitors table
router.post('/validate', async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ 
      success: false, 
      error: 'Backup code is required' 
    });
  }
  
  try {
    console.log('🔍 === BACKUP CODE VALIDATION DEBUG START ===');
    console.log('🎫 Backup Code:', code);
    
    // First, try to find in the unified visitors table
    // Check for direct visitor_id, backup_code, or extract visitorId from QR code data
    // Convert code to string for consistent matching (handles both number and string inputs)
    const codeStr = String(code).trim();
    
    // Search with case-insensitive comparison and trim whitespace
    // Check visitor_id (exact match), backup_code (case-insensitive), and QR code (contains)
    let [visitorRows] = await pool.query(
      `SELECT v.*, b.date, b.time_slot, b.type as booking_type, b.status as booking_status
       FROM visitors v
       JOIN bookings b ON v.booking_id = b.booking_id
       WHERE v.visitor_id = ? 
          OR UPPER(TRIM(v.backup_code)) = UPPER(?)
          OR v.qr_code LIKE ?`,
      [codeStr, codeStr, `%${codeStr}%`]
    );
    
    console.log(`🔍 Direct query found ${visitorRows.length} visitors`);
    console.log(`🔍 Searching for code: "${codeStr}" (type: ${typeof codeStr})`);
    console.log(`🔍 Code normalized (uppercase, trimmed): "${codeStr.toUpperCase().trim()}"`);
    if (visitorRows.length > 0) {
      const foundVisitor = visitorRows[0];
      console.log(`✅ Found visitor with backup_code: "${foundVisitor.backup_code}" (type: ${typeof foundVisitor.backup_code})`);
      console.log(`🔍 visitor_id: ${foundVisitor.visitor_id} (type: ${typeof foundVisitor.visitor_id})`);
      console.log(`🔍 Email: ${foundVisitor.email}, Booking ID: ${foundVisitor.booking_id}`);
      console.log(`🔍 Code match check: visitor_id=${foundVisitor.visitor_id}==="${codeStr}"? ${String(foundVisitor.visitor_id) === codeStr}`);
      if (foundVisitor.backup_code) {
        const backupCodeUpper = foundVisitor.backup_code.trim().toUpperCase();
        const codeStrUpper = codeStr.toUpperCase();
        console.log(`🔍 Code match check: backup_code="${backupCodeUpper}"==="${codeStrUpper}"? ${backupCodeUpper === codeStrUpper}`);
      } else {
        console.log(`⚠️ backup_code is NULL or empty for visitor ${foundVisitor.visitor_id}`);
      }
    } else {
      console.log(`❌ No visitors found with direct query. Checking all visitors with backup codes...`);
      // Debug: Show all backup codes in database for this booking type
      const [debugVisitors] = await pool.query(
        `SELECT visitor_id, email, backup_code, booking_id, is_main_visitor 
         FROM visitors 
         WHERE backup_code IS NOT NULL AND backup_code != '' 
         ORDER BY visitor_id DESC LIMIT 10`
      );
      console.log(`🔍 Recent visitors with backup codes:`, debugVisitors.map(v => ({
        visitor_id: v.visitor_id,
        email: v.email,
        backup_code: v.backup_code,
        is_main: v.is_main_visitor
      })));
    }
    
    // If no direct match, try to extract backup code from QR code data
    // Note: QR codes are stored as base64-encoded PNG images, but we need to extract the JSON data
    // The QR code image contains JSON data that was encoded when creating the QR code
    if (visitorRows.length === 0) {
      console.log('🔍 No direct match found, checking QR code data for backup code...');
      
      // Get all visitors and check their QR code data
      const [allVisitors] = await pool.query(
        `SELECT v.*, b.date, b.time_slot, b.type as booking_type, b.status as booking_status
         FROM visitors v
         JOIN bookings b ON v.booking_id = b.booking_id
         WHERE v.qr_code IS NOT NULL`
      );
      
      // Try to decode QR code images using qrcode-reader library
      // Since we can't decode PNG images directly, we'll search by checking if backup_code matches
      // But first, let's also check if the code matches any visitor_id that we haven't checked yet
      for (const visitor of allVisitors) {
        try {
          // Check backup_code with case-insensitive comparison
          if (visitor.backup_code && visitor.backup_code.trim().toUpperCase() === codeStr.toUpperCase()) {
            console.log('✅ Found match by backup_code in database:', visitor.backup_code);
            visitorRows = [visitor];
            break;
          }
          
          // Also check if the code matches the visitor_id (as string, case-insensitive)
          if (String(visitor.visitor_id).trim().toUpperCase() === codeStr.toUpperCase()) {
            console.log('✅ Found match by visitor_id:', visitor.visitor_id);
            visitorRows = [visitor];
            break;
          }
        } catch (err) {
          // Skip if error
          console.log('⚠️ Error checking visitor QR code:', err.message);
          continue;
        }
      }
    }
    
    // If still no match and code looks like a tokenId (contains 'GROUP-' or 'WALKIN-' or 'INDWALKIN-')
    // Try to find the visitor by looking up the QR code that contains this tokenId
    // Since QR codes are premade and stored, the visitor_id should already be in the database
    if (visitorRows.length === 0) {
      console.log('🔍 Searching all QR codes for tokenId match...');
      
      // Note: We can't easily decode PNG QR code images to extract JSON data
      // Instead, we'll rely on the backup_code stored in the database
      // If code looks like a tokenId, we'll check additional_visitors table instead
      console.log('⚠️ Skipping QR code image decoding (requires QR decoder library)');
      
      // Check additional_visitors table for tokenId (skip backup_code check since it may not exist in DB)
      // The backup code should be stored in visitors.backup_code, so we primarily check there
      if (visitorRows.length === 0) {
        console.log('🔍 Checking additional_visitors table for tokenId match...');
        
        // If code looks like a tokenId, try additional_visitors table by tokenId
        // Skip checking additional_visitors.backup_code since column may not exist
        // The backup code should be stored in visitors.backup_code, which we already checked above
        if (visitorRows.length === 0 && (code.includes('GROUP-') || code.includes('WALKIN-') || code.includes('INDWALKIN-'))) {
          console.log('🔍 Code looks like a tokenId, checking additional_visitors table by tokenId...');
          
          try {
            // Search additional_visitors table for the tokenId
            const [tokenRecords] = await pool.query(
              `SELECT av.*, b.date, b.time_slot, b.type as booking_type, b.status as booking_status
               FROM additional_visitors av
               JOIN bookings b ON av.booking_id = b.booking_id
               WHERE av.token_id = ?`,
              [code]
            );
            
            if (tokenRecords.length > 0) {
              const tokenRecord = tokenRecords[0];
              console.log('✅ Found token record:', tokenRecord);
              
              // Try to find visitor by booking_id and email
              const [visitorsByToken] = await pool.query(
                `SELECT v.*, b.date, b.time_slot, b.type as booking_type, b.status as booking_status
                 FROM visitors v
                 JOIN bookings b ON v.booking_id = b.booking_id
                 WHERE v.booking_id = ? AND v.email = ? AND v.is_main_visitor = 0`,
                [tokenRecord.booking_id, tokenRecord.email]
              );
              
              if (visitorsByToken.length > 0) {
                console.log('✅ Found visitor record by token email/booking:', visitorsByToken[0].visitor_id);
                visitorRows = visitorsByToken;
              } else if (tokenRecord.visitor_id) {
                // Visitor record exists and is linked
                const [visitorById] = await pool.query(
                  `SELECT v.*, b.date, b.time_slot, b.type as booking_type, b.status as booking_status
                   FROM visitors v
                   JOIN bookings b ON v.booking_id = b.booking_id
                   WHERE v.visitor_id = ?`,
                  [tokenRecord.visitor_id]
                );
                
                if (visitorById.length > 0) {
                  console.log('✅ Found visitor by linked visitor_id from token:', visitorById[0].visitor_id);
                  visitorRows = visitorById;
                }
              }
            }
          } catch (err) {
            console.log('⚠️ Error checking additional_visitors table:', err.message);
            // Continue with other checks
          }
        }
      }
    }
    
    // If we still haven't found a visitor, check if backup code exists in additional_visitors
    // but visitor record doesn't exist yet (form not completed)
    if (visitorRows.length === 0) {
      console.log('🔍 No visitor found, checking if backup code exists in additional_visitors...');
      
      // Only check by token_id (skip backup_code check since column may not exist)
      // The backup code should be in visitors.backup_code, which we already checked above
      let additionalVisitorCheck = [];
      try {
        [additionalVisitorCheck] = await pool.query(
          `SELECT av.*, b.date, b.time_slot, b.type as booking_type, b.status as booking_status
           FROM additional_visitors av
           JOIN bookings b ON av.booking_id = b.booking_id
           WHERE av.token_id = ?`,
          [code]
        );
      } catch (err) {
        console.log('⚠️ Error checking additional_visitors table:', err.message);
        // Continue without throwing
      }
      
      if (additionalVisitorCheck.length > 0) {
        const additionalRecord = additionalVisitorCheck[0];
        console.log('⚠️ Found backup code in additional_visitors but no visitor record yet');
        
        // Check if form is completed (has visitor_id linked)
        if (!additionalRecord.visitor_id) {
          return res.status(400).json({
            success: false,
            error: 'Please complete your visitor registration form first before using the backup code.',
            status: 'form-incomplete',
            message: 'You need to fill out your visitor information form before you can check in with your backup code.',
            tokenId: additionalRecord.token_id,
            email: additionalRecord.email
          });
        }
      }
      
      // Before returning error, check if it's a tokenId that exists but hasn't been linked to visitor yet
      if (code.includes('GROUP-') || code.includes('WALKIN-') || code.includes('INDWALKIN-')) {
        console.log('🔍 Code looks like tokenId, checking additional_visitors...');
        try {
          const [tokenCheck] = await pool.query(
            `SELECT av.*, b.date, b.time_slot, b.type as booking_type, b.status as booking_status
             FROM additional_visitors av
             JOIN bookings b ON av.booking_id = b.booking_id
             WHERE av.token_id = ?`,
            [code]
          );
          
          if (tokenCheck.length > 0) {
            const tokenRecord = tokenCheck[0];
            console.log('✅ Found token record, but no visitor linked yet');
            
            // Check if visitor record exists but not linked
            const [unlinkedVisitor] = await pool.query(
              `SELECT v.*, b.date, b.time_slot, b.type as booking_type, b.status as booking_status
               FROM visitors v
               JOIN bookings b ON v.booking_id = b.booking_id
               WHERE v.email = ? AND v.booking_id = ? AND v.is_main_visitor = false`,
              [tokenRecord.email, tokenRecord.booking_id]
            );
            
            if (unlinkedVisitor.length > 0) {
              // Found visitor record but backup code didn't match - return incomplete message
              const visitor = unlinkedVisitor[0];
              const hasRequiredFields = visitor.first_name && 
                                      visitor.last_name && 
                                      visitor.first_name.trim() !== '' && 
                                      visitor.last_name.trim() !== '';
              const hasAllRequiredInfo = hasRequiredFields && visitor.gender && visitor.gender.trim() !== '';
              
              if (!hasAllRequiredInfo) {
                return res.status(400).json({
                  success: false,
                  error: 'Please complete your visitor information first before you can use the backup code to check in.',
                  status: 'incomplete',
                  message: 'You must fill out all required fields in your visitor form before checking in.'
                });
              }
            }
          }
        } catch (err) {
          console.log('⚠️ Error checking token:', err.message);
        }
      }
      
      console.log('❌ No visitor found with code:', code);
      return res.status(400).json({
        success: false,
        error: 'Invalid backup code. Please check the code and try again.',
        details: 'The backup code you entered was not found in our system.'
      });
    }
    
    const visitor = visitorRows[0];
    console.log('👤 Visitor data:', visitor);
    console.log('🔍 Is additional visitor:', visitor.is_additional_visitor);
    console.log('🔍 Visitor status:', visitor.status);
    console.log('🔍 Booking status:', visitor.booking_status);
    
    // STEP 1: Check if booking is valid
    if (visitor.booking_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'This booking has been cancelled and cannot be checked in.',
        status: visitor.booking_status
      });
    }
    
    // STEP 2: Check if visitor has completed their details - REQUIRED before backup code can be used
    console.log('📋 Checking visitor completion status...');
    console.log('📋 Visitor fields:', {
      first_name: visitor.first_name,
      last_name: visitor.last_name,
      email: visitor.email,
      gender: visitor.gender,
      is_main_visitor: visitor.is_main_visitor,
      status: visitor.status
    });
    
    // Check for placeholder/default values that indicate incomplete information
    const firstName = (visitor.first_name || '').trim();
    const lastName = (visitor.last_name || '').trim();
    const email = (visitor.email || '').trim();
    const gender = (visitor.gender || '').trim();
    
    // Check if name is a placeholder (like "Walk-in Visitor", "Visitor", etc.)
    // Handle cases where it might be "Walk-in" + "Visitor" or "Walk-in Visitor" + ""
    const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
    const isPlaceholderName = fullName === 'walk-in visitor' || 
                              fullName === 'visitor' ||
                              firstName.toLowerCase() === 'walk-in visitor' ||
                              firstName.toLowerCase() === 'visitor' ||
                              firstName.toLowerCase() === 'walk-in' ||
                              lastName.toLowerCase() === 'visitor' ||
                              (firstName === '' && lastName === '') ||
                              (firstName.toLowerCase() === 'walk-in' && lastName.toLowerCase() === 'visitor');
    
    const hasRequiredFields = firstName !== '' && 
                              lastName !== '' && 
                              email !== '' &&
                              !isPlaceholderName;
    
    console.log('📋 Has required fields (name + email):', hasRequiredFields);
    console.log('📋 Is placeholder name:', isPlaceholderName);
    
    // For additional visitors (not main visitors), also check gender
    // For individual walk-in visitors (main visitor with ind-walkin type), also require gender
    // For group walk-in leaders (main visitor with group-walkin type), also require gender
    // Handle both 0/false/null as "not main visitor" (MySQL returns 0/1 as numbers)
    const isMainVisitor = visitor.is_main_visitor === 1 || visitor.is_main_visitor === true;
    const isIndividualWalkIn = isMainVisitor && (visitor.booking_type === 'ind-walkin' || visitor.booking_type === 'individual walk-in');
    const isGroupWalkIn = isMainVisitor && (visitor.booking_type === 'group-walkin' || visitor.booking_type === 'group walk-in');
    
    console.log('📋 Is main visitor:', isMainVisitor);
    console.log('📋 Is individual walk-in:', isIndividualWalkIn);
    console.log('📋 Is group walk-in:', isGroupWalkIn);
    
    // Individual walk-in visitors need all fields including gender
    // Group walk-in leaders need all fields including gender
    // Additional visitors also need all fields including gender
    // Regular main visitors (non-walk-in) only need name and email
    const hasAllRequiredInfo = isIndividualWalkIn || isGroupWalkIn || !isMainVisitor
      ? hasRequiredFields && gender !== ''
      : hasRequiredFields;
    
    console.log('📋 Has all required info:', hasAllRequiredInfo);
    
    if (!hasAllRequiredInfo) {
      const missingFields = [];
      if (!firstName || isPlaceholderName) missingFields.push('first_name');
      if (!lastName || isPlaceholderName) missingFields.push('last_name');
      if (!email) missingFields.push('email');
      if ((isIndividualWalkIn || isGroupWalkIn || !isMainVisitor) && !gender) missingFields.push('gender');
      
      console.log('❌ Missing required fields:', missingFields);
      
      return res.status(400).json({
        success: false,
        error: 'Please complete your visitor information first before you can use the backup code to check in.',
        status: 'incomplete',
        message: 'You must fill out all required fields in your visitor form before checking in.',
        missingFields: missingFields
      });
    }
    
    // STEP 3: Check if already checked in - backup code can only be used ONCE
    if (visitor.status === 'visited' || visitor.checkin_time) {
      return res.status(400).json({
        success: false,
        error: 'This backup code has already been used. Each backup code can only be used once for check-in.',
        status: 'already-checked-in',
        checkin_time: visitor.checkin_time
      });
    }
    
    // Determine visitor type and create visitor info
    let visitorInfo = {
      ...visitor,
      firstName: visitor.first_name || '',
      lastName: visitor.last_name || '',
      email: visitor.email || '',
      gender: visitor.gender || 'Not specified',
      address: visitor.address || 'Not provided',
      institution: visitor.institution || 'Not specified',
      purpose: visitor.purpose || 'educational',
      visitDate: visitor.date,
      visitTime: visitor.time_slot,
      bookingType: visitor.booking_type,
      isPrimary: visitor.is_main_visitor === 1,
      checkin_time: new Date().toISOString()
    };
    
    // Set appropriate visitor type
    if (visitor.is_main_visitor === 1) {
      if (visitor.booking_type === 'ind-walkin' || visitor.booking_type === 'group-walkin') {
        visitorInfo.visitorType = 'walkin_visitor';
        visitorInfo.displayType = 'Walk-in Visitor';
      } else {
        visitorInfo.visitorType = 'primary_visitor';
        visitorInfo.displayType = 'Primary Visitor';
      }
    } else {
      visitorInfo.visitorType = 'group_walkin_member';
      visitorInfo.displayType = 'Group Walk-in Member';
    }
    
    console.log('👤 Final visitor info:', visitorInfo);
    
    // Update check-in status in visitors table
    await pool.query(
      `UPDATE visitors SET status = 'visited', checkin_time = NOW() WHERE visitor_id = ?`,
      [visitor.visitor_id]
    );
    
    console.log('✅ Updated visitor check-in status');
    
    res.json({
      success: true,
      visitor: visitorInfo,
      message: 'Visitor ID validated successfully'
    });
    
  } catch (err) {
    console.error('❌ === BACKUP CODE VALIDATION ERROR ===');
    console.error('❌ Error details:', err);
    console.error('❌ Error message:', err.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to validate visitor ID: ' + err.message
    });
  }
});

module.exports = router;
