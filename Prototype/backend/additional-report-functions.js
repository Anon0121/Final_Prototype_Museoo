// Additional list-based report functions for detailed item lists
const db = require('./db');

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
    
    // For cultural objects, we should show all objects regardless of date range
    // since they are permanent museum inventory items
    // But we can filter by acquisition_date if it exists in object_details
    let [objects] = await db.query(`
      SELECT 
        co.id,
        co.name,
        co.category,
        co.description,
        co.created_at,
        od.period,
        od.origin,
        od.material,
        od.dimensions,
        od.condition_status,
        od.acquisition_date,
        od.acquisition_method,
        od.current_location,
        od.estimated_value,
        od.conservation_notes
      FROM cultural_objects co
      LEFT JOIN object_details od ON co.id = od.cultural_object_id
      WHERE (
        od.acquisition_date IS NULL 
        OR od.acquisition_date BETWEEN ? AND ?
        OR co.created_at BETWEEN ? AND ?
      )
      ORDER BY COALESCE(od.acquisition_date, co.created_at) DESC
    `, [startDate, endDate, startDate, endDate]);

    console.log(`📊 Found ${objects.length} cultural objects (filtered by acquisition/creation date)`);

    // If still no objects found, get all objects (no date filtering)
    if (objects.length === 0) {
      console.log(`📊 No objects found in date range, getting all cultural objects...`);
      [objects] = await db.query(`
        SELECT 
          co.id,
          co.name,
          co.category,
          co.description,
          co.created_at,
          od.period,
          od.origin,
          od.material,
          od.dimensions,
          od.condition_status,
          od.acquisition_date,
          od.acquisition_method,
          od.current_location,
          od.estimated_value,
          od.conservation_notes
        FROM cultural_objects co
        LEFT JOIN object_details od ON co.id = od.cultural_object_id
        ORDER BY COALESCE(od.acquisition_date, co.created_at) DESC
      `);
      console.log(`📊 Found ${objects.length} cultural objects (all objects)`);
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

    // Get images for each object
    console.log(`🖼️ Fetching images for ${objects.length} cultural objects`);
    for (let object of objects) {
      const [images] = await db.query(`
        SELECT 
          i.id,
          i.url as image_url,
          i.created_at as uploaded_at
        FROM images i
        WHERE i.cultural_object_id = ?
        ORDER BY i.created_at ASC
      `, [object.id]);
      
      object.images = images;
      object.primaryImage = images[0]; // Use first image as primary since there's no is_primary field
      
      console.log(`📸 Object "${object.name}" has ${images.length} images`);
    }

    const [categories] = await db.query(`
      SELECT 
        co.category,
        COUNT(*) as count,
        SUM(od.estimated_value) as total_value
      FROM cultural_objects co
      LEFT JOIN object_details od ON co.id = od.cultural_object_id
      GROUP BY co.category
      ORDER BY count DESC
    `);

    const result = {
      totalObjects: objects.length,
      objects: objects,
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
      categories: categories.map(c => `${c.category}: ${c.count}`)
    });
    
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
      WHERE (a.created_at BETWEEN ? AND ? OR a.date BETWEEN ? AND ?)
      ORDER BY a.created_at DESC
    `, [startDate, endDate, startDate, endDate]);

    // If no archives in date range, get all archives
    if (archives.length === 0) {
      [archives] = await db.query(`
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
        ORDER BY a.created_at DESC
        LIMIT 100
      `);
    }

    // Get comprehensive file type statistics
    const [fileTypes] = await db.query(`
      SELECT 
        type as file_type,
        COUNT(*) as count
      FROM archives
      GROUP BY type
      ORDER BY count DESC
    `);

    // Get category statistics
    const [categories] = await db.query(`
      SELECT 
        COALESCE(category, 'Other') as category,
        COUNT(*) as count,
        COUNT(CASE WHEN is_visible = 1 THEN 1 END) as visible_count,
        COUNT(CASE WHEN is_visible = 0 THEN 1 END) as hidden_count
      FROM archives
      GROUP BY category
      ORDER BY count DESC
    `);

    // Get visibility statistics
    const [visibilityStats] = await db.query(`
      SELECT 
        COUNT(*) as total_archives,
        COUNT(CASE WHEN is_visible = 1 THEN 1 END) as visible_archives,
        COUNT(CASE WHEN is_visible = 0 THEN 1 END) as hidden_archives
      FROM archives
    `);

    // Get upload statistics by month
    const [monthlyStats] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as uploads,
        COUNT(CASE WHEN is_visible = 1 THEN 1 END) as visible_uploads
      FROM archives
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `);

    // Get top uploaders
    const [topUploaders] = await db.query(`
      SELECT 
        uploaded_by,
        COUNT(*) as upload_count,
        COUNT(CASE WHEN is_visible = 1 THEN 1 END) as visible_uploads
      FROM archives
      WHERE uploaded_by IS NOT NULL AND uploaded_by != ''
      GROUP BY uploaded_by
      ORDER BY upload_count DESC
      LIMIT 10
    `);

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
  
  let [donations] = await db.query(`
    SELECT 
      d.id,
      d.donor_name,
      d.donor_email,
      d.donor_contact,
      d.type,
      d.date_received,
      d.notes,
      d.status,
      d.created_at,
      dd.amount,
      dd.method,
      dd.item_description,
      dd.estimated_value,
      dd.condition,
      dd.loan_start_date,
      dd.loan_end_date
    FROM donations d
    LEFT JOIN donation_details dd ON d.id = dd.donation_id
    WHERE (COALESCE(d.date_received, d.created_at) BETWEEN ? AND ?)
    ORDER BY d.created_at DESC
  `, [startDate, endDate]);

  if (donations.length === 0) {
    [donations] = await db.query(`
      SELECT 
        d.id,
        d.donor_name,
        d.donor_email,
        d.donor_contact,
        d.type,
        d.date_received,
        d.notes,
        d.status,
        d.created_at,
        dd.amount,
        dd.method,
        dd.item_description,
        dd.estimated_value,
        dd.condition,
        dd.loan_start_date,
        dd.loan_end_date
      FROM donations d
      LEFT JOIN donation_details dd ON d.id = dd.donation_id
      ORDER BY d.created_at DESC
    `);
  }

  return {
    totalDonations: donations.length,
    donations: donations,
    summary: {
      totalMonetaryValue: donations.filter(d => d.type === 'monetary').reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0),
      pendingDonations: donations.filter(d => d.status === 'pending').length,
      approvedDonations: donations.filter(d => d.status === 'approved').length
    }
  };
}

async function generateDonationListByType(startDate, endDate, donationType) {
  console.log(`💰 Generating ${donationType} donation list report from ${startDate} to ${endDate}`);
  
  let [donations] = await db.query(`
    SELECT 
      d.id,
      d.donor_name,
      d.donor_email,
      d.donor_contact,
      d.type,
      d.date_received,
      d.notes,
      d.status,
      d.created_at,
      dd.amount,
      dd.method,
      dd.item_description,
      dd.estimated_value,
      dd.condition,
      dd.loan_start_date,
      dd.loan_end_date
    FROM donations d
    LEFT JOIN donation_details dd ON d.id = dd.donation_id
    WHERE (COALESCE(d.date_received, d.created_at) BETWEEN ? AND ?)
      AND d.type = ?
    ORDER BY d.created_at DESC
  `, [startDate, endDate, donationType]);

  if (donations.length === 0) {
    [donations] = await db.query(`
      SELECT 
        d.id,
        d.donor_name,
        d.donor_email,
        d.donor_contact,
        d.type,
        d.date_received,
        d.notes,
        d.status,
        d.created_at,
        dd.amount,
        dd.method,
        dd.item_description,
        dd.estimated_value,
        dd.condition,
        dd.loan_start_date,
        dd.loan_end_date
      FROM donations d
      LEFT JOIN donation_details dd ON d.id = dd.donation_id
      WHERE d.type = ?
      ORDER BY d.created_at DESC
    `, [donationType]);
  }

  return {
    totalDonations: donations.length,
    donations: donations,
    donationType: donationType,
    summary: {
      totalMonetaryValue: donations.filter(d => d.type === 'monetary').reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0),
      pendingDonations: donations.filter(d => d.status === 'pending').length,
      approvedDonations: donations.filter(d => d.status === 'approved').length
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
