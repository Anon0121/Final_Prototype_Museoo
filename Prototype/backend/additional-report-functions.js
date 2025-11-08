// Additional list-based report functions for detailed item lists
const db = require('./db');

// Images are now referenced by file path instead of base64

// 1. Events Report with Participants
async function generateEventsReport(startDate, endDate) {
  console.log(`🎉 Generating events report from ${startDate} to ${endDate}`);
  
  try {
    // Get finished events with participants
    let [events] = await db.query(`
      SELECT 
        e.id,
        e.title,
        e.description,
        e.start_date,
        e.end_date,
        e.status,
        e.created_at,
        COUNT(ep.id) as participant_count
      FROM activities e
      LEFT JOIN event_participants ep ON e.id = ep.event_id
      WHERE e.type = 'event' 
        AND e.status = 'completed'
        AND e.start_date BETWEEN ? AND ?
      GROUP BY e.id
      ORDER BY e.start_date DESC
    `, [startDate, endDate]);

    // If no events in date range, get recent completed events
    if (events.length === 0) {
      [events] = await db.query(`
        SELECT 
          e.id,
          e.title,
          e.description,
          e.start_date,
          e.end_date,
          e.status,
          e.created_at,
          COUNT(ep.id) as participant_count
        FROM activities e
        LEFT JOIN event_participants ep ON e.id = ep.event_id
        WHERE e.type = 'event' AND e.status = 'completed'
        GROUP BY e.id
        ORDER BY e.start_date DESC
        LIMIT 50
      `);
    }

    // Get participants for each event
    for (let event of events) {
      const [participants] = await db.query(`
        SELECT 
          ep.id,
          ep.participant_name,
          ep.participant_email,
          ep.participant_role,
          ep.registration_date,
          ep.attendance_status
        FROM event_participants ep
        WHERE ep.event_id = ?
        ORDER BY ep.participant_name
      `, [event.id]);
      
      event.participants = participants;
    }

    return {
      events: events,
      totalEvents: events.length,
      totalParticipants: events.reduce((sum, event) => sum + event.participant_count, 0)
    };
  } catch (error) {
    console.error('Error generating events report:', error);
    return { events: [], totalEvents: 0, totalParticipants: 0 };
  }
}

// 2. Exhibits Report with Duration
async function generateExhibitsReport(startDate, endDate) {
  console.log(`🎨 Generating exhibits report from ${startDate} to ${endDate}`);
  
  try {
    let [exhibits] = await db.query(`
      SELECT 
        e.id,
        e.title,
        e.description,
        e.start_date,
        e.end_date,
        e.status,
        e.created_at,
        DATEDIFF(COALESCE(e.end_date, CURDATE()), e.start_date) as duration_days
      FROM activities e
      WHERE e.type = 'exhibit'
        AND e.start_date BETWEEN ? AND ?
      ORDER BY e.start_date DESC
    `, [startDate, endDate]);

    // If no exhibits in date range, get all exhibits
    if (exhibits.length === 0) {
      [exhibits] = await db.query(`
        SELECT 
          e.id,
          e.title,
          e.description,
          e.start_date,
          e.end_date,
          e.status,
          e.created_at,
          DATEDIFF(COALESCE(e.end_date, CURDATE()), e.start_date) as duration_days
        FROM activities e
        WHERE e.type = 'exhibit'
        ORDER BY e.start_date DESC
        LIMIT 50
      `);
    }

    return {
      exhibits: exhibits,
      totalExhibits: exhibits.length,
      averageDuration: exhibits.length > 0 ? 
        (exhibits.reduce((sum, exhibit) => sum + exhibit.duration_days, 0) / exhibits.length).toFixed(1) : 0
    };
  } catch (error) {
    console.error('Error generating exhibits report:', error);
    return { exhibits: [], totalExhibits: 0, averageDuration: 0 };
  }
}

// 3. Cultural Objects Report with Images (Enhanced)
async function generateCulturalObjectsReport(startDate, endDate) {
  console.log(`🏛️ Generating cultural objects report from ${startDate} to ${endDate}`);
  console.log(`🔍 Date types - startDate: ${typeof startDate}, endDate: ${typeof endDate}`);
  
  try {
    // Check if this is an "all data" request
    const isAllDataRequest = !startDate || !endDate || 
                             startDate === 'all' || endDate === 'all' ||
                             startDate === 'null' || endDate === 'null' ||
                             (typeof startDate === 'string' && startDate.includes('1899')) || 
                             (typeof endDate === 'string' && endDate.includes('1899'));
    
    // Check if dates are valid (not too old or invalid)
    const isValidDate = (dateStr) => {
      if (!dateStr || dateStr === 'all' || dateStr === 'null') return false;
      const date = new Date(dateStr);
      // Check if date is before 1900 (invalid/too old) or invalid date
      return !isNaN(date.getTime()) && date.getFullYear() >= 1900;
    };
    
    const hasValidDateRange = !isAllDataRequest && isValidDate(startDate) && isValidDate(endDate);
    
    // Build query with optional date filter
    // For "all data" requests, skip date filtering entirely
    let dateFilter = '';
    let queryParams = [];
    
    if (hasValidDateRange && !isAllDataRequest) {
      // Filter by created_at (when the object was added to the system)
      dateFilter = 'WHERE (DATE(co.created_at) BETWEEN DATE(?) AND DATE(?))';
      queryParams = [startDate, endDate];
      console.log(`📅 Applying date filter by created_at: ${startDate} to ${endDate}`);
    }
    
    // For "all data" requests, fetch all cultural objects without date filter
    if (isAllDataRequest) {
      console.log('📅 All data request - fetching all cultural objects without date filter...');
    } else if (hasValidDateRange) {
      console.log(`📅 Date-filtered request - will only return objects added between ${startDate} and ${endDate}`);
    }
    
    // First, let's check if there are any cultural objects at all
    const [totalCount] = await db.query(`SELECT COUNT(*) as count FROM cultural_objects`);
    console.log(`📊 Total cultural objects in database: ${totalCount[0].count}`);
    
    // If no objects at all, return empty result
    if (totalCount[0].count === 0) {
      console.log(`❌ No cultural objects found in database`);
      return { 
        totalObjects: 0, 
        objects: [], 
        categories: [], 
        summary: { totalEstimatedValue: 0, totalCategories: 0 } 
      };
    }
    
    // Step 1: Get cultural objects (with optional date filtering)
    let [objects] = await db.query(`
      SELECT 
        co.id,
        co.name,
        co.category,
        co.description,
        co.created_at
      FROM cultural_objects co
      ${dateFilter}
      ORDER BY co.created_at DESC
    `, queryParams);
    
    // For date-filtered requests, don't fall back to all data - return empty results if no objects found in date range
    if (objects.length === 0 && hasValidDateRange && !isAllDataRequest) {
      console.log(`⚠️ No cultural objects found in date range ${startDate} to ${endDate} - returning empty results`);
    }
    
    console.log(`📊 Found ${objects.length} cultural objects from cultural_objects table`);
    
    // Step 2: Get all object_details at once
    const objectIds = objects.map(obj => obj.id);
    let allDetails = [];
    if (objectIds.length > 0) {
      const placeholders = objectIds.map(() => '?').join(',');
      [allDetails] = await db.query(`
        SELECT 
          cultural_object_id,
          period, origin, material, condition_status,
          acquisition_date, acquisition_method, current_location,
          estimated_value, conservation_notes
        FROM object_details
        WHERE cultural_object_id IN (${placeholders})
      `, objectIds);
    }
    
    // Step 3: Create a map of details by cultural_object_id
    const detailsMap = {};
    allDetails.forEach(detail => {
      detailsMap[detail.cultural_object_id] = detail;
    });
    
    // Step 4: Merge details into objects
    objects = objects.map(obj => {
      const details = detailsMap[obj.id];
      if (details) {
        return {
          ...obj,
          period: details.period,
          origin: details.origin,
          material: details.material,
          condition_status: details.condition_status,
          acquisition_date: details.acquisition_date,
          acquisition_method: details.acquisition_method,
          current_location: details.current_location,
          estimated_value: details.estimated_value,
          conservation_notes: details.conservation_notes
        };
      } else {
        // No details found, set defaults
        return {
          ...obj,
          period: null,
          origin: null,
          material: null,
          condition_status: null,
          acquisition_date: null,
          acquisition_method: null,
          current_location: null,
          estimated_value: null,
          conservation_notes: null
        };
      }
    });
    
    console.log(`📊 Found ${objects.length} cultural objects (all objects in database)`);
    console.log(`📊 Expected ${totalCount[0].count} objects, got ${objects.length} objects`);
    
    if (objects.length !== totalCount[0].count) {
      console.error(`⚠️ WARNING: Mismatch! Database has ${totalCount[0].count} objects but query returned ${objects.length}`);
    }
    
    // Debug: Log first few objects to see what we're getting
    if (objects.length > 0) {
      console.log(`🔍 Sample objects found:`);
      objects.slice(0, 3).forEach((obj, index) => {
        console.log(`  ${index + 1}. ID: ${obj.id}, Name: ${obj.name}, Category: ${obj.category}`);
        console.log(`     Created: ${obj.created_at}, Acquisition: ${obj.acquisition_date || 'N/A'}`);
      });
    } else {
      console.log(`❌ Still no objects found after fallback query!`);
    }

    // Get images for all objects at once (more efficient)
    console.log(`🖼️ Fetching images for ${objects.length} cultural objects`);
    // Recalculate objectIds after merging details (objects array was reassigned)
    const objectIdsForImages = objects.map(obj => obj.id);
    let allImages = [];
    
    if (objectIdsForImages.length > 0) {
      const placeholders = objectIdsForImages.map(() => '?').join(',');
      [allImages] = await db.query(`
        SELECT 
          i.id,
          i.cultural_object_id,
          i.url as image_url,
          i.created_at as uploaded_at
        FROM images i
        WHERE i.cultural_object_id IN (${placeholders})
        ORDER BY i.cultural_object_id, i.created_at ASC
      `, objectIdsForImages);
    }
    
    // Group images by cultural_object_id
    const imagesByObjectId = {};
    allImages.forEach(img => {
      if (!imagesByObjectId[img.cultural_object_id]) {
        imagesByObjectId[img.cultural_object_id] = [];
      }
      imagesByObjectId[img.cultural_object_id].push(img);
    });
    
    // Assign images to each object
    objects.forEach(object => {
      const images = imagesByObjectId[object.id] || [];
      object.images = images;
      object.primaryImage = images[0]; // Use first image as primary since there's no is_primary field
      console.log(`📸 Object "${object.name}" (ID: ${object.id}) has ${images.length} images`);
    });

    // Build date filter for categories query (same as main query)
    const categoriesDateFilter = hasValidDateRange && !isAllDataRequest 
      ? 'WHERE (DATE(co.created_at) BETWEEN DATE(?) AND DATE(?))'
      : '';
    const categoriesDateParams = hasValidDateRange && !isAllDataRequest ? [startDate, endDate] : [];
    
    const [categories] = await db.query(`
      SELECT 
        co.category,
        COUNT(*) as count,
        SUM(od.estimated_value) as total_value
      FROM cultural_objects co
      LEFT JOIN object_details od ON co.id = od.cultural_object_id
      ${categoriesDateFilter}
      GROUP BY co.category
      ORDER BY count DESC
    `, categoriesDateParams);

    // Verify all objects are included
    console.log(`🔍 Final verification: ${objects.length} objects in result`);
    console.log(`🔍 Object IDs:`, objects.map(obj => obj.id));
    
    const result = {
      totalObjects: objects.length,
      objects: objects, // Ensure all objects are included
      categories: categories,
      summary: {
        totalEstimatedValue: objects.reduce((sum, obj) => sum + (parseFloat(obj.estimated_value) || 0), 0),
        totalCategories: categories.length
      }
    };
    
    console.log(`✅ Cultural Objects Report Summary:`, {
      totalObjects: result.totalObjects,
      totalCategories: result.summary.totalCategories,
      totalEstimatedValue: result.summary.totalEstimatedValue,
      categories: categories.map(c => `${c.category}: ${c.count}`),
      objectIds: result.objects.map(obj => obj.id),
      objectNames: result.objects.map(obj => obj.name)
    });
    
    // Final check: ensure we're returning all objects
    if (result.objects.length === 0 && totalCount[0].count > 0) {
      console.error(`⚠️ WARNING: Found ${totalCount[0].count} objects in database but report has 0 objects!`);
    }
    
    return result;
  } catch (error) {
    console.error('Error generating cultural objects report:', error);
    return { totalObjects: 0, objects: [], categories: [], summary: { totalEstimatedValue: 0, totalCategories: 0 } };
  }
}

// 4. Enhanced Archive Report with Categories, Visibility, and Analytics
async function generateArchiveReport(startDate, endDate) {
  console.log(`📁 Generating enhanced archive report from ${startDate} to ${endDate}`);
  
  try {
    // Check if this is an "all data" request
    const isAllDataRequest = !startDate || !endDate || 
                             startDate === 'all' || endDate === 'all' ||
                             startDate === 'null' || endDate === 'null' ||
                             (typeof startDate === 'string' && startDate.includes('1899')) || 
                             (typeof endDate === 'string' && endDate.includes('1899'));
    
    // Check if dates are valid (not too old or invalid)
    const isValidDate = (dateStr) => {
      if (!dateStr || dateStr === 'all' || dateStr === 'null') return false;
      const date = new Date(dateStr);
      // Check if date is before 1900 (invalid/too old) or invalid date
      return !isNaN(date.getTime()) && date.getFullYear() >= 1900;
    };
    
    const hasValidDateRange = !isAllDataRequest && isValidDate(startDate) && isValidDate(endDate);
    
    // Build query with optional date filter
    // For "all data" requests, skip date filtering entirely
    let dateFilter = '';
    let queryParams = [];
    
    if (hasValidDateRange && !isAllDataRequest) {
      // Filter by created_at (upload date) since that's what "Date Uploaded" represents
      // The 'date' field is the original document date, not the upload date
      dateFilter = 'WHERE (DATE(a.created_at) BETWEEN DATE(?) AND DATE(?))';
      queryParams = [startDate, endDate];
      console.log(`📅 Applying date filter by upload date (created_at): ${startDate} to ${endDate}`);
    }
    
    // For "all data" requests, fetch all archives without date filter
    if (isAllDataRequest) {
      console.log('📅 All data request - fetching all archives without date filter...');
    } else if (hasValidDateRange) {
      console.log(`📅 Date-filtered request - will only return archives between ${startDate} and ${endDate}`);
    }
    
    // Get all archives with enhanced fields (including category and visibility)
    let [archives] = await db.query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.file_url,
        a.type as file_type,
        a.category,
        a.is_visible,
        a.date as archive_date,
        a.tags,
        a.uploaded_by,
        a.created_at
      FROM archives a
      ${dateFilter}
      ORDER BY a.created_at DESC
    `, queryParams);

    // For date-filtered requests, don't fall back to all data - return empty results if no archives found in date range
    // This ensures "this month" and "custom range" only show archives within the specified date range
    if (archives.length === 0 && hasValidDateRange && !isAllDataRequest) {
      console.log(`⚠️ No archives found in date range ${startDate} to ${endDate} - returning empty results`);
    }

    // Build date filter for statistics queries (filter by created_at - upload date)
    const statsDateFilter = hasValidDateRange && !isAllDataRequest 
      ? 'WHERE (DATE(created_at) BETWEEN DATE(?) AND DATE(?))'
      : '';
    const statsDateParams = hasValidDateRange && !isAllDataRequest ? [startDate, endDate] : [];
    
    // Get comprehensive file type statistics (filtered by date if applicable)
    const [fileTypes] = await db.query(`
      SELECT 
        type as file_type,
        COUNT(*) as count
      FROM archives
      ${statsDateFilter}
      GROUP BY type
      ORDER BY count DESC
    `, statsDateParams);

    // Get category statistics (filtered by date if applicable)
    const [categories] = await db.query(`
      SELECT 
        COALESCE(category, 'Other') as category,
        COUNT(*) as count,
        COUNT(CASE WHEN is_visible = 1 THEN 1 END) as visible_count,
        COUNT(CASE WHEN is_visible = 0 THEN 1 END) as hidden_count
      FROM archives
      ${statsDateFilter}
      GROUP BY category
      ORDER BY count DESC
    `, statsDateParams);

    // Get visibility statistics (filtered by date if applicable)
    const [visibilityStats] = await db.query(`
      SELECT 
        COUNT(*) as total_archives,
        COUNT(CASE WHEN is_visible = 1 THEN 1 END) as visible_archives,
        COUNT(CASE WHEN is_visible = 0 THEN 1 END) as hidden_archives
      FROM archives
      ${statsDateFilter}
    `, statsDateParams);

    // Get upload statistics by month (filtered by date if applicable)
    // For date-filtered requests, only show months within the date range
    let monthlyStatsFilter = '';
    let monthlyStatsParams = [];
    if (hasValidDateRange && !isAllDataRequest) {
      monthlyStatsFilter = 'WHERE (DATE(created_at) BETWEEN DATE(?) AND DATE(?))';
      monthlyStatsParams = [startDate, endDate];
    } else {
      // For "all data", show last 12 months
      monthlyStatsFilter = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)';
    }
    
    const [monthlyStats] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as uploads,
        COUNT(CASE WHEN is_visible = 1 THEN 1 END) as visible_uploads
      FROM archives
      ${monthlyStatsFilter}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `, monthlyStatsParams);

    // Get top uploaders (filtered by date if applicable)
    const topUploadersFilter = hasValidDateRange && !isAllDataRequest
      ? `WHERE uploaded_by IS NOT NULL AND uploaded_by != '' AND (DATE(created_at) BETWEEN DATE(?) AND DATE(?))`
      : `WHERE uploaded_by IS NOT NULL AND uploaded_by != ''`;
    const topUploadersParams = hasValidDateRange && !isAllDataRequest ? [startDate, endDate] : [];
    
    const [topUploaders] = await db.query(`
      SELECT 
        uploaded_by,
        COUNT(*) as upload_count,
        COUNT(CASE WHEN is_visible = 1 THEN 1 END) as visible_uploads
      FROM archives
      ${topUploadersFilter}
      GROUP BY uploaded_by
      ORDER BY upload_count DESC
      LIMIT 10
    `, topUploadersParams);

    // Calculate storage insights (no file_size column available)
    const totalSize = 0; // File size not available in current schema
    const avgFileSize = 0;
    
    return {
      archives: archives,
      totalArchives: archives.length,
      fileTypes: fileTypes,
      categories: categories,
      visibilityStats: visibilityStats[0],
      monthlyStats: monthlyStats,
      topUploaders: topUploaders,
      summary: {
        totalSize: totalSize,
        totalFileTypes: fileTypes.length,
        totalCategories: categories.length,
        avgFileSize: avgFileSize,
        visibilityPercentage: archives.length > 0 ? 
          Math.round((visibilityStats[0].visible_archives / archives.length) * 100) : 0,
        mostPopularCategory: categories.length > 0 ? categories[0].category : 'Other',
        mostCommonFileType: fileTypes.length > 0 ? fileTypes[0].file_type : 'Unknown'
      }
    };
  } catch (error) {
    console.error('Error generating enhanced archive report:', error);
    return { 
      archives: [], 
      totalArchives: 0, 
      fileTypes: [], 
      categories: [],
      visibilityStats: { total_archives: 0, visible_archives: 0, hidden_archives: 0 },
      monthlyStats: [],
      topUploaders: [],
      summary: { 
        totalSize: 0, 
        totalFileTypes: 0, 
        totalCategories: 0,
        avgFileSize: 0,
        visibilityPercentage: 0,
        mostPopularCategory: 'Other',
        mostCommonFileType: 'Unknown'
      } 
    };
  }
}

async function generateArchiveList(startDate, endDate) {
  console.log(`📁 Generating archive list report from ${startDate} to ${endDate}`);
  
  let [archives] = await db.query(`
    SELECT 
      id,
      title,
      description,
      date,
      type,
      tags,
      file_url,
      uploaded_by,
      created_at
    FROM archives
    WHERE (date BETWEEN ? AND ? OR created_at BETWEEN ? AND ?)
    ORDER BY created_at DESC
  `, [startDate, endDate, startDate, endDate]);

  if (archives.length === 0) {
    [archives] = await db.query(`
      SELECT 
        id,
        title,
        description,
        date,
        type,
        tags,
        file_url,
        uploaded_by,
        created_at
      FROM archives
      ORDER BY created_at DESC
    `);
  }

  const [types] = await db.query(`
    SELECT 
      type,
      COUNT(*) as count
    FROM archives
    GROUP BY type
    ORDER BY count DESC
  `);

  return {
    totalArchives: archives.length,
    archives: archives,
    types: types,
    summary: {
      totalTypes: types.length,
      mostCommonType: types.length > 0 ? types[0].type : null
    }
  };
}

async function generateDonationList(startDate, endDate) {
  console.log(`💰 Generating donation list report from ${startDate} to ${endDate}`);
  
  // Check if this is an "all data" request
  const isAllDataRequest = !startDate || !endDate || 
                           startDate === 'all' || endDate === 'all' ||
                           startDate === 'null' || endDate === 'null' ||
                           startDate.includes('1899') || endDate.includes('1899');
  
  // Check if dates are valid (not too old or invalid)
  const isValidDate = (dateStr) => {
    if (!dateStr || dateStr === 'all' || dateStr === 'null') return false;
    const date = new Date(dateStr);
    // Check if date is before 1900 (invalid/too old) or invalid date
    return !isNaN(date.getTime()) && date.getFullYear() >= 1900;
  };
  
  const hasValidDateRange = !isAllDataRequest && isValidDate(startDate) && isValidDate(endDate);
  
  // Build query with optional date filter
  // For "all data" requests, skip date filtering entirely
  let dateFilter = '';
  let queryParams = [];
  
  if (hasValidDateRange && !isAllDataRequest) {
    // Use DATE() function to ensure proper date comparison (ignoring time component)
    dateFilter = 'AND (DATE(COALESCE(da.sent_date, d.request_date, d.created_at)) BETWEEN DATE(?) AND DATE(?))';
    queryParams = [startDate, endDate];
    console.log(`📅 Applying date filter: ${startDate} to ${endDate}`);
  }
  
  // For "all data" requests, fetch all completed donations without date filter
  if (isAllDataRequest) {
    console.log('📅 All data request - fetching all completed donations without date filter...');
  } else if (hasValidDateRange) {
    console.log(`📅 Date-filtered request - will only return donations between ${startDate} and ${endDate}`);
  }
  
  let [donations] = await db.query(`
    SELECT 
      d.id,
      d.donor_name,
      d.donor_email,
      d.donor_contact,
      d.type,
      d.request_date,
      d.notes,
      d.status,
      d.processing_stage,
      d.created_at,
      da.sent_date as completion_date,
      dd.amount,
      dd.method,
      dd.item_description,
      dd.estimated_value,
      dd.condition,
      dd.loan_start_date,
      dd.loan_end_date,
      doc.file_path as image_path,
      doc.mime_type as image_mime_type
    FROM donations d
    LEFT JOIN donation_details dd ON d.id = dd.donation_id
    LEFT JOIN donation_acknowledgments da ON d.id = da.donation_id AND da.status = 'sent'
    LEFT JOIN donation_documents doc ON d.id = doc.donation_id AND doc.document_type IN ('artifact_image', 'loan_image')
    WHERE (
      d.processing_stage = 'completed'
      OR d.processing_stage = 'complete'
      OR d.status = 'complete'
      OR da.sent_date IS NOT NULL
    )
    AND d.status != 'rejected'
    ${dateFilter}
    ORDER BY da.sent_date DESC, d.created_at DESC
  `, queryParams);

  // For date-filtered requests, don't fall back to all data - return empty results if no donations found in date range
  // This ensures "this month" and "custom range" only show donations within the specified date range
  if (donations.length === 0 && hasValidDateRange && !isAllDataRequest) {
    console.log(`⚠️ No donations found in date range ${startDate} to ${endDate} - returning empty results`);
  }
  
  console.log(`✅ Found ${donations.length} completed donations`);

  // Map database fields to expected field names for the report generator
  const mappedDonations = donations.map(donation => ({
    id: donation.id,
    donor_name: donation.donor_name,
    name: donation.donor_name, // Alternative field name
    email: donation.donor_email, // Map donor_email to email
    donor_email: donation.donor_email,
    contact: donation.donor_contact,
    type: donation.type,
    amount: donation.amount,
    method: donation.method,
    item_description: donation.item_description,
    estimated_value: donation.estimated_value,
    condition: donation.condition,
    loan_date: donation.loan_start_date, // Map loan_start_date to loan_date
    loan_start_date: donation.loan_start_date,
    loan_end_date: donation.loan_end_date,
    date_received: donation.completion_date || donation.request_date, // Use completion date as date_received
    completion_date: donation.completion_date, // Add completion date field
    notes: donation.notes,
    status: donation.status,
    created_at: donation.created_at,
    image_path: donation.image_path, // Store the file path for later processing
    image_mime_type: donation.image_mime_type,
    image_url: null, // Will be processed later
  }));

  // Images will be referenced by file path instead of base64

  return {
    totalDonations: mappedDonations.length,
    donations: mappedDonations,
    summary: {
      totalMonetaryValue: mappedDonations.filter(d => d.type === 'monetary').reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0),
      pendingDonations: mappedDonations.filter(d => d.status === 'pending').length,
      approvedDonations: mappedDonations.filter(d => d.status === 'approved').length
    }
  };
}

async function generateDonationListByType(startDate, endDate, donationType) {
  console.log(`💰 Generating ${donationType} donation list report from ${startDate} to ${endDate}`);
  
  // Check if this is an "all data" request
  const isAllDataRequest = !startDate || !endDate || 
                           startDate === 'all' || endDate === 'all' ||
                           startDate === 'null' || endDate === 'null' ||
                           startDate.includes('1899') || endDate.includes('1899');
  
  // Check if dates are valid (not too old or invalid)
  const isValidDate = (dateStr) => {
    if (!dateStr || dateStr === 'all' || dateStr === 'null') return false;
    const date = new Date(dateStr);
    // Check if date is before 1900 (invalid/too old) or invalid date
    return !isNaN(date.getTime()) && date.getFullYear() >= 1900;
  };
  
  const hasValidDateRange = !isAllDataRequest && isValidDate(startDate) && isValidDate(endDate);
  
  // Build query with optional date filter
  // For "all data" requests, skip date filtering entirely
  let dateFilter = '';
  let queryParams = [donationType];
  
  if (hasValidDateRange && !isAllDataRequest) {
    // Use DATE() function to ensure proper date comparison (ignoring time component)
    // For date comparison, use sent_date (completion), request_date, or created_at
    dateFilter = 'AND (DATE(COALESCE(da.sent_date, d.request_date, d.created_at)) BETWEEN DATE(?) AND DATE(?))';
    // Parameter order: donationType first (for WHERE d.type = ?), then startDate, endDate (for BETWEEN)
    queryParams = [donationType, startDate, endDate];
    console.log(`📅 Applying date filter for ${donationType} donations: ${startDate} to ${endDate}`);
    console.log(`📅 Date filter will check: sent_date, request_date, created_at`);
  }
  
  // For "all data" requests, fetch all completed donations without date filter
  if (isAllDataRequest) {
    console.log(`📅 All data request - fetching all completed ${donationType} donations without date filter...`);
    console.log(`📅 Query params for all data:`, queryParams);
  } else if (hasValidDateRange) {
    console.log(`📅 Date-filtered request for ${donationType} - will only return donations between ${startDate} and ${endDate}`);
    console.log(`📅 Query params for date-filtered:`, queryParams);
  }
  
  // Handle artifact donations - they might be stored as 'artifact' or 'donated'
  let typeCondition = 'd.type = ?';
  if (donationType === 'artifact') {
    typeCondition = "(d.type = 'artifact' OR d.type = 'donated')";
    // Adjust queryParams - remove donationType from params since we're using literal values in WHERE clause
    // But keep the date params if we have a date filter
    if (hasValidDateRange && !isAllDataRequest) {
      // For artifact with date filter: only dates (typeCondition doesn't need a param)
      queryParams = [startDate, endDate]; // Only dates, no type param
      console.log(`📅 Artifact donation query with date filter - params: [${startDate}, ${endDate}]`);
    } else {
      // For artifact without date filter: no params needed
      queryParams = []; // No params needed for all data
      console.log(`📅 Artifact donation query without date filter - no params needed`);
    }
    console.log(`📅 Artifact donation query - will search for both 'artifact' and 'donated' types`);
  }
  
  console.log(`📅 Final SQL query will use typeCondition: "${typeCondition}" and dateFilter: "${dateFilter}" with params:`, queryParams);
  
  let [donations] = await db.query(`
    SELECT 
      d.id,
      d.donor_name,
      d.donor_email,
      d.donor_contact,
      d.type,
      d.request_date,
      d.notes,
      d.status,
      d.processing_stage,
      d.created_at,
      da.sent_date as completion_date,
      dd.amount,
      dd.method,
      dd.item_description,
      dd.estimated_value,
      dd.condition,
      dd.loan_start_date,
      dd.loan_end_date,
      doc.file_path as image_path,
      doc.mime_type as image_mime_type
    FROM donations d
    LEFT JOIN donation_details dd ON d.id = dd.donation_id
    LEFT JOIN donation_acknowledgments da ON d.id = da.donation_id AND da.status = 'sent'
    LEFT JOIN donation_documents doc ON d.id = doc.donation_id AND doc.document_type IN ('artifact_image', 'loan_image')
    WHERE ${typeCondition}
      AND (
        d.processing_stage = 'completed'
        OR d.processing_stage = 'complete'
        OR d.status = 'complete'
        OR da.sent_date IS NOT NULL
      )
      AND d.status != 'rejected'
      ${dateFilter}
    ORDER BY da.sent_date DESC, d.created_at DESC
  `, queryParams);

  // For date-filtered requests, don't fall back to all data - return empty results if no donations found in date range
  // This ensures "this month" and "custom range" only show donations within the specified date range
  if (donations.length === 0 && hasValidDateRange && !isAllDataRequest) {
    console.log(`⚠️ No ${donationType} donations found in date range ${startDate} to ${endDate} - returning empty results`);
  }
  
  console.log(`✅ Found ${donations.length} completed ${donationType} donations`);

  // Map database fields to expected field names for the report generator
  const mappedDonations = donations.map(donation => ({
    id: donation.id,
    donor_name: donation.donor_name,
    name: donation.donor_name, // Alternative field name
    email: donation.donor_email, // Map donor_email to email
    donor_email: donation.donor_email,
    contact: donation.donor_contact,
    type: donation.type,
    amount: donation.amount,
    method: donation.method,
    item_description: donation.item_description,
    estimated_value: donation.estimated_value,
    condition: donation.condition,
    loan_date: donation.loan_start_date, // Map loan_start_date to loan_date
    loan_start_date: donation.loan_start_date,
    loan_end_date: donation.loan_end_date,
    date_received: donation.completion_date || donation.request_date, // Use completion date as date_received
    completion_date: donation.completion_date, // Add completion date field
    notes: donation.notes,
    status: donation.status,
    created_at: donation.created_at,
    image_path: donation.image_path, // Store the file path for later processing
    image_mime_type: donation.image_mime_type,
    image_url: null, // Will be processed later
  }));

  // Images will be referenced by file path instead of base64

  return {
    totalDonations: mappedDonations.length,
    donations: mappedDonations,
    donationType: donationType,
    summary: {
      totalMonetaryValue: mappedDonations.filter(d => d.type === 'monetary').reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0),
      pendingDonations: mappedDonations.filter(d => d.status === 'pending').length,
      approvedDonations: mappedDonations.filter(d => d.status === 'approved').length
    }
  };
}

async function generateBookingList(startDate, endDate) {
  console.log(`📅 Generating booking list report from ${startDate} to ${endDate}`);
  
  let [bookings] = await db.query(`
    SELECT 
      b.booking_id,
      b.first_name,
      b.last_name,
      b.type,
      b.institution,
      b.group_leader_email,
      b.status,
      b.date,
      b.time_slot,
      b.total_visitors,
      b.created_at,
      b.checkin_time,
      COUNT(v.visitor_id) as actual_visitors,
      GROUP_CONCAT(CONCAT(v.first_name, ' ', v.last_name) SEPARATOR ', ') as visitor_names
    FROM bookings b
    LEFT JOIN visitors v ON b.booking_id = v.booking_id
    WHERE (b.date BETWEEN ? AND ? OR b.checkin_time BETWEEN ? AND ? OR b.created_at BETWEEN ? AND ?)
    GROUP BY b.booking_id
    ORDER BY b.created_at DESC
  `, [startDate, endDate, startDate, endDate, startDate, endDate]);

  if (bookings.length === 0) {
    [bookings] = await db.query(`
      SELECT 
        b.booking_id,
        b.first_name,
        b.last_name,
        b.type,
        b.institution,
        b.group_leader_email,
        b.status,
        b.date,
        b.time_slot,
        b.total_visitors,
        b.created_at,
        b.checkin_time,
        COUNT(v.visitor_id) as actual_visitors,
        GROUP_CONCAT(CONCAT(v.first_name, ' ', v.last_name) SEPARATOR ', ') as visitor_names
      FROM bookings b
      LEFT JOIN visitors v ON b.booking_id = v.booking_id
      GROUP BY b.booking_id
      ORDER BY b.created_at DESC
    `);
  }

  return {
    totalBookings: bookings.length,
    bookings: bookings,
    summary: {
      totalVisitors: bookings.reduce((sum, booking) => sum + (booking.total_visitors || 0), 0),
      checkedInBookings: bookings.filter(b => b.status === 'checked-in').length,
      individualBookings: bookings.filter(b => b.type === 'individual').length,
      groupBookings: bookings.filter(b => b.type === 'group').length
    }
  };
}

module.exports = {
  generateEventsReport,
  generateExhibitsReport,
  generateCulturalObjectsReport,
  generateArchiveReport,
  generateArchiveList,
  generateDonationList,
  generateDonationListByType,
  generateBookingList
};
