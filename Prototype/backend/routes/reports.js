const express = require('express');
const router = express.Router();
const db = require('../db');
const pool = require('../db');
// AI service removed - using hardcoded templates instead
const { logActivity } = require('../utils/activityLogger');
const { generateReportPDF } = require('../utils/pdfGenerator');
const { generateCleanVisitorReportPDF } = require('../utils/cleanVisitorReportGenerator');
const { generateCulturalObjectReportPDF } = require('../utils/culturalObjectReportGenerator');
const { generateArchiveReportPDF } = require('../utils/archiveReportGenerator');
const { generateBrandedReportHTML } = require('../utils/brandedReportGenerator');
const { htmlToPdfBuffer } = require('../utils/htmlToPdf');
const { getFallbackReport, handleVaguePrompt } = require('../utils/reportTemplates');
const { EnhancedVisitorReportGenerator } = require('../utils/enhancedVisitorReportGenerator');
const { EnhancedDonationReportGenerator } = require('../utils/enhancedDonationReportGenerator');
const { generateEventAnalyticsReport, generateEventPerformanceReport, generateEventAttendanceReport } = require('../utils/eventReportGenerator');
const { generateEventsReport, generateExhibitsReport, generateCulturalObjectsReport, generateArchiveReport, generateArchiveList, generateDonationList, generateDonationListByType, generateBookingList } = require('../additional-report-functions');

// Session-based authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    console.log('🔐 User authenticated:', { id: req.user.id, username: req.user.username });
    return next();
  }
  console.log('❌ Authentication failed - no session user');
  return res.status(401).json({ 
    success: false, 
    message: 'Not authenticated' 
  });
};

// Get all reports
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const [reports] = await db.query(`
      SELECT * FROM reports 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [req.user.id]);

    res.json({
      success: true,
      reports: reports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports'
    });
  }
});

// Generate AI-powered report
router.post('/generate', isAuthenticated, async (req, res) => {
  // Set a timeout for the response
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: 'Report generation timeout - please try again with a smaller date range'
      });
    }
  }, 30000); // 30 second timeout

  try {
    const { reportType, startDate, endDate, includeCharts, includeRecommendations, includePredictions, includeComparisons, prompt, year, month } = req.body;

    // Validate required fields
    if (!reportType) {
      return res.status(400).json({
        success: false,
        message: 'Report type is required'
      });
    }

    // Handle "all data" requests - no date filtering
    const isAllDataRequest = !startDate || !endDate || 
                           startDate === 'all' || endDate === 'all' ||
                           req.body.userRequest?.toLowerCase().includes('all available data') ||
                           req.body.userRequest?.toLowerCase().includes('for all');

    // Set date range for all data requests
    let effectiveStartDate = startDate;
    let effectiveEndDate = endDate;
    
    if (isAllDataRequest) {
      // Use a very wide date range to capture all data
      effectiveStartDate = '1900-01-01';
      effectiveEndDate = '2100-12-31';
      console.log('📅 All data request detected - using wide date range:', effectiveStartDate, 'to', effectiveEndDate);
    }

    // Generate report based on type
    let reportData = {};
    let reportTitle = '';
    let reportDescription = '';

    switch (reportType) {
      case 'visitor_analytics':
        console.log('📊 Generating visitor analytics data...');
        reportData = await generateVisitorAnalytics(effectiveStartDate, effectiveEndDate);
        console.log('📊 Visitor analytics data keys:', Object.keys(reportData));
        console.log('📊 Chart data available:', !!reportData.chartData);
        if (reportData.chartData) {
          console.log('📊 Chart data keys:', Object.keys(reportData.chartData));
        }
        // Generate title and description based on year and month
        if (year && month && month !== 'all') {
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'];
          const monthName = monthNames[month - 1];
          reportTitle = `Visitor Graph Report - ${monthName} ${year}`;
          reportDescription = `Monthly visitor statistics and analytics for ${monthName} ${year}`;
        } else if (year && month === 'all') {
          reportTitle = `Visitor Graph Report - ${year}`;
          reportDescription = `Monthly visitor statistics and analytics for the entire year ${year}`;
        } else {
          reportTitle = 'Visitor Graph Report';
          reportDescription = isAllDataRequest ? 
            `Comprehensive analysis with complete visitor information for all visitors who have ever entered the museum` : 
            `Comprehensive analysis with complete visitor information for those who actually entered the museum (based on QR scan check-in time) from ${effectiveStartDate} to ${effectiveEndDate}`;
        }
        break;
      
      case 'monthly_summary':
        reportData = await generateMonthlySummary(startDate, endDate);
        reportTitle = 'Monthly Summary Report';
        reportDescription = `Monthly overview of all museum activities from ${startDate} to ${endDate}`;
        break;
      
      case 'financial_report':
        reportData = await generateFinancialReport(startDate, endDate);
        reportTitle = 'Financial Report';
        reportDescription = `Revenue, donations, and financial insights from ${startDate} to ${endDate}`;
        break;
      
      case 'exhibit_analytics':
        reportData = await generateExhibitAnalytics(startDate, endDate);
        reportTitle = 'Cultural Object Report';
        reportDescription = `Popular exhibits and visitor engagement from ${startDate} to ${endDate}`;
        break;
      
      case 'cultural_objects':
        reportData = await generateCulturalObjectsReport(startDate, endDate);
        reportTitle = 'Cultural Object Report';
        reportDescription = `Complete inventory of cultural objects and artifacts from ${startDate} to ${endDate}`;
        break;
      
      case 'archive_analytics':
        reportData = await generateArchiveReport(effectiveStartDate, effectiveEndDate);
        reportTitle = 'Archive Analysis';
        reportDescription = isAllDataRequest ? 
          `Comprehensive analysis of all digital archives with categories, visibility, and storage insights` : 
          `Comprehensive analysis of digital archives with categories, visibility, and storage insights from ${effectiveStartDate} to ${effectiveEndDate}`;
        break;
      
      case 'event_analytics':
        const { eventId } = req.body;
        reportData = await generateEventAnalytics(effectiveStartDate, effectiveEndDate, eventId);
        reportTitle = 'Event Analytics Report';
        reportDescription = eventId ? 
          `Analytics report for specific event` : 
          `Comprehensive event analytics from ${effectiveStartDate} to ${effectiveEndDate}`;
        break;
      
      case 'event_performance':
        const { eventId: performanceEventId } = req.body;
        reportData = await generateEventPerformance(effectiveStartDate, effectiveEndDate, performanceEventId);
        reportTitle = 'Event Performance Report';
        reportDescription = performanceEventId ? 
          `Performance report for specific event` : 
          `Event performance analysis from ${effectiveStartDate} to ${effectiveEndDate}`;
        break;
      
      case 'event_attendance':
        const { eventId: attendanceEventId } = req.body;
        reportData = await generateEventAttendance(effectiveStartDate, effectiveEndDate, attendanceEventId);
        reportTitle = 'Event Attendance Report';
        reportDescription = attendanceEventId ? 
          `Attendance report for specific event` : 
          `Event attendance records from ${effectiveStartDate} to ${effectiveEndDate}`;
        break;
      
      case 'staff_performance':
        reportData = await generateStaffPerformance(startDate, endDate);
        reportTitle = 'Staff Performance Report';
        reportDescription = `Staff activities and productivity metrics from ${startDate} to ${endDate}`;
        break;
      
      case 'visitor_list':
        reportData = await generateVisitorList(startDate, endDate);
        reportTitle = 'Visitor List Report';
        reportDescription = `Complete list of all visitors with detailed information from ${startDate} to ${endDate}`;
        break;
      
      case 'event_list':
        reportData = await generateEventList(startDate, endDate);
        reportTitle = 'Event List Report';
        reportDescription = `Complete list of all events with details from ${startDate} to ${endDate}`;
        break;
      
      // cultural_objects_inventory case removed - now handled by cultural_objects case
      
      // archive_list case removed - now handled by archive_analytics case
      
      case 'donation_list':
        reportData = await generateDonationList(startDate, endDate);
        reportTitle = 'Donation List Report';
        reportDescription = `Complete list of all donations and contributions from ${startDate} to ${endDate}`;
        break;
      
      case 'donation_report':
        reportData = await generateDonationList(startDate, endDate);
        reportTitle = 'Donation Report';
        reportDescription = `Complete analysis of all donations and contributions from ${startDate} to ${endDate}`;
        break;
      
      case 'donation_type_report':
        const { donationType } = req.body;
        reportData = await generateDonationListByType(startDate, endDate, donationType);
        reportTitle = `${donationType.charAt(0).toUpperCase() + donationType.slice(1)} Donations Report`;
        reportDescription = `Complete list of ${donationType} donations from ${startDate} to ${endDate}`;
        break;
      
      case 'booking_list':
        reportData = await generateBookingList(startDate, endDate);
        reportTitle = 'Booking List Report';
        reportDescription = `Complete list of all bookings and reservations from ${startDate} to ${endDate}`;
        break;
      
      case 'events_report':
        reportData = await generateEventsReport(effectiveStartDate, effectiveEndDate);
        reportTitle = 'Events Report with Participants';
        reportDescription = isAllDataRequest ? 
          `Summary of all finished events with participant details` : 
          `Summary of all finished events with participant details from ${effectiveStartDate} to ${effectiveEndDate}`;
        break;
      
      case 'exhibits_report':
        reportData = await generateExhibitsReport(startDate, endDate);
        reportTitle = 'Exhibits Report with Duration';
        reportDescription = `Record of all exhibits and their display duration from ${startDate} to ${endDate}`;
        break;
      
      case 'cultural_objects_report':
        reportData = await generateCulturalObjectsReport(effectiveStartDate, effectiveEndDate);
        reportTitle = 'Cultural Object Report';
        reportDescription = isAllDataRequest ? 
          `Complete inventory of all museum artifacts with images and details` : 
          `Complete inventory of museum artifacts with images and details from ${effectiveStartDate} to ${effectiveEndDate}`;
        break;
      
      case 'archive_report':
        reportData = await generateArchiveReport(effectiveStartDate, effectiveEndDate);
        reportTitle = 'Archive Analysis';
        reportDescription = isAllDataRequest ? 
          `Complete reference of all digital archives with metadata` : 
          `Complete reference of all digital archives with metadata from ${effectiveStartDate} to ${effectiveEndDate}`;
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    // Use hardcoded report content (AI removed)
    console.log('📊 Using hardcoded report template');
    const fallbackData = getFallbackReport(reportType, reportData);
    const aiInsights = {
      summary: fallbackData.summary,
      trends: fallbackData.trends,
      recommendations: fallbackData.recommendations,
      predictions: includePredictions ? fallbackData.predictions : [],
      comparisons: includeComparisons ? fallbackData.comparisons : [],
      source: 'Hardcoded Template'
    };

    // Create report content using the proper HTML generator
    const reportObject = {
      id: null, // Will be set after insertion
      title: reportTitle,
      report_type: reportType,
      start_date: startDate,
      end_date: endDate,
      created_at: new Date().toISOString(),
      data: JSON.stringify(reportData)
    };
    // Use specific templates for different report types
    let reportContent;
    if (reportType === 'visitor_analytics' || (reportTitle?.toLowerCase().includes('visitor') && reportType !== 'visitor_list')) {
      // Use enhanced visitor report generator with charts for analytics
      console.log('📊 Using enhanced visitor report generator with charts');
      const enhancedGenerator = new EnhancedVisitorReportGenerator();
      reportContent = await enhancedGenerator.generateVisitorReportWithCharts(reportObject);
      console.log('📊 Enhanced report content length:', reportContent.length);
    } else if (reportType === 'visitor_list') {
      // Use clean visitor report generator for simple list
      reportContent = generateCleanVisitorReportPDF(reportObject);
    } else if (reportType === 'cultural_objects' || reportType === 'cultural_objects_report' || reportType === 'exhibit_analytics' || reportTitle?.toLowerCase().includes('cultural')) {
      reportContent = generateCulturalObjectReportPDF(reportObject);
    } else {
      reportContent = generateHTMLReport(reportObject);
    }

    // Save report to database
    console.log('💾 Saving report for user:', req.user.id);
    const [result] = await db.query(`
      INSERT INTO reports (user_id, title, description, report_type, start_date, end_date, content, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      req.user.id,
      reportTitle,
      reportDescription,
      reportType,
      startDate,
      endDate,
      reportContent,
      JSON.stringify(reportData)
    ]);

    const reportId = result.insertId;
    
    // Create a temporary report object for file generation
    const tempReport = {
      id: reportId,
      title: reportTitle,
      description: reportDescription,
      report_type: reportType,
      start_date: startDate,
      end_date: endDate,
      content: reportContent,
      data: JSON.stringify(reportData)
    };

    // Generate and save PDF file
    let pdfBuffer = null;
    try {
      console.log('📄 Generating PDF file...');
      // Use specific templates for different report types
      let htmlContent;
      if (reportType === 'visitor_analytics' || (reportTitle?.toLowerCase().includes('visitor') && reportType !== 'visitor_list')) {
        // Use enhanced visitor report generator with charts for analytics
        const enhancedGenerator = new EnhancedVisitorReportGenerator();
        htmlContent = await enhancedGenerator.generateVisitorReportWithCharts(tempReport);
      } else if (reportType === 'visitor_list') {
        // Use clean visitor report generator for simple list
        htmlContent = generateCleanVisitorReportPDF(tempReport);
      } else if (reportType === 'cultural_objects' || reportType === 'cultural_objects_report' || reportType === 'exhibit_analytics' || reportTitle?.toLowerCase().includes('cultural')) {
        console.log('🎨 Using Cultural Object Report PDF format for report type:', reportType);
        htmlContent = generateCulturalObjectReportPDF(tempReport);
      } else if (reportType === 'archive_analytics' || reportType === 'archive_report' || reportTitle?.toLowerCase().includes('archive')) {
        console.log('📁 Using Archive Report PDF format for report type:', reportType);
        htmlContent = generateArchiveReportPDF(tempReport);
      } else if (reportType === 'event_list') {
        console.log('📋 Using Simple Event List Report PDF format for report type:', reportType);
        const { generateEventListReport } = require('../utils/simpleEventReportGenerator');
        htmlContent = generateEventListReport(tempReport);
      } else if (reportType === 'event_participants') {
        console.log('👥 Using Event Participants Report PDF format for report type:', reportType);
        const { generateEventParticipantsReport } = require('../utils/simpleEventReportGenerator');
        htmlContent = generateEventParticipantsReport(tempReport);
      } else {
        htmlContent = generateBrandedReportHTML(tempReport, reportData, aiInsights);
      }
      console.log('📝 HTML content generated, length:', htmlContent.length);
      
      try {
        pdfBuffer = await htmlToPdfBuffer(htmlContent);
        console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes');
      } catch (puppeteerError) {
        console.error('❌ Puppeteer PDF generation failed:', puppeteerError.message);
        console.log('🔄 Falling back to HTML content...');
        // Fallback: store HTML content as PDF
        pdfBuffer = Buffer.from(htmlContent, 'utf8');
        console.log('✅ HTML fallback created, size:', pdfBuffer.length, 'bytes');
      }
    } catch (error) {
      console.error('❌ Error generating PDF:', error.message);
      console.error('❌ Full error:', error);
    }

    // Save files to filesystem instead of database (to avoid packet size limits)
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, 'uploads');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    let pdfPath = null;
    
    try {
      // Save PDF to filesystem if generated
      if (pdfBuffer) {
        const pdfFilename = `report-${reportId}.pdf`;
        pdfPath = path.join(uploadsDir, pdfFilename);
        fs.writeFileSync(pdfPath, pdfBuffer);
        console.log('✅ PDF saved to filesystem:', pdfPath);
      }
      
      // Update database with file paths instead of file contents
      await db.query(`
        UPDATE reports 
        SET pdf_file_path = ?, pdf_size = ?, pdf_filename = ?, pdf_generated_at = NOW()
        WHERE id = ?
      `, [
        pdfPath,
        pdfBuffer ? pdfBuffer.length : null,
        pdfBuffer ? `report-${reportId}.pdf` : null,
        reportId
      ]);
      console.log('✅ File paths saved to database');
    } catch (error) {
      console.error('❌ Error saving files to filesystem:', error.message);
      // Continue without failing - files can be regenerated
    }
    
    // Save AI insights to database (non-blocking)
    db.query(`
        INSERT INTO ai_insights (report_id, insights, created_at)
        VALUES (?, ?, NOW())
    `, [reportId, JSON.stringify(aiInsights)])
    .then(() => console.log('✅ AI insights saved to database'))
    .catch(error => console.error('❌ Error saving AI insights:', error.message));
    
    try { await logActivity(req, 'report.generate', { reportId, reportType, startDate, endDate }); } catch {}

    // Fetch the created report
    const [reports] = await db.query('SELECT * FROM reports WHERE id = ?', [reportId]);
    const report = reports[0];

    clearTimeout(timeout); // Clear the timeout
    res.json({
      success: true,
      message: 'Report generated successfully',
      report: report
    });

  } catch (error) {
    clearTimeout(timeout); // Clear the timeout
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report'
    });
  }
});

// Generate graph report for visitor analytics
router.post('/generate-graphs', isAuthenticated, async (req, res) => {
  try {
    const { reportId, chartTypes = ['all'] } = req.body;

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: 'Report ID is required'
      });
    }

    // Get the report from database
    const [reports] = await db.query('SELECT * FROM reports WHERE id = ?', [reportId]);
    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const report = reports[0];
    const enhancedGenerator = new EnhancedVisitorReportGenerator();
    
    // Generate enhanced report with charts
    const enhancedContent = await enhancedGenerator.generateVisitorReportWithCharts(report);
    
    // Update the report content in database
    await db.query(
      'UPDATE reports SET content = ? WHERE id = ?',
      [enhancedContent, reportId]
    );

    res.json({
      success: true,
      message: 'Graph report generated successfully',
      reportId: reportId,
      enhanced: true
    });

  } catch (error) {
    console.error('Error generating graph report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate graph report'
    });
  }
});

// Check AI service status (hardcoded - AI removed)
router.get('/ai-status', isAuthenticated, async (req, res) => {
  try {
    const status = {
      available: true,
      service: 'Hardcoded Template',
      message: 'Using hardcoded report templates instead of AI'
    };
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('Error checking AI status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check AI status'
    });
  }
});

// Get real-time AI insights
router.get('/real-time-insights', isAuthenticated, async (req, res) => {
  try {
    const insights = await generateRealTimeInsights();
    res.json({
      success: true,
      insights: insights
    });
  } catch (error) {
    console.error('Error generating real-time insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate real-time insights'
    });
  }
});

// AI Chat endpoint
router.post('/ai-chat', isAuthenticated, async (req, res) => {
  try {
    console.log('AI Chat request received:', req.body);
    
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Simple response without complex data fetching
    const lowerMessage = message.toLowerCase();
    
    // Handle simple greetings
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
      return res.json({
        success: true,
        response: "Hello! I'm IMMS, your museum management assistant. I can help you generate reports and analyze your museum data. What would you like to do today?",
        actions: [
          { type: 'generate_report', label: 'Generate Visitor Report', reportType: 'visitor_analytics' },
          { type: 'generate_report', label: 'Generate Event Report', reportType: 'event_performance' },
          { type: 'generate_report', label: 'Generate Cultural Objects Report', reportType: 'cultural_objects' },
          { type: 'generate_report', label: 'Generate Archive Report', reportType: 'archive_report' },
          { type: 'generate_report', label: 'Generate Donation Report', reportType: 'donation_report' }
        ]
      });
    }
    
    // Handle report requests
    if (lowerMessage.includes('report') || lowerMessage.includes('generate') || lowerMessage.includes('analytics')) {
      return res.json({
        success: true,
        response: "I can help you generate various reports for your museum. What type of report would you like to create?",
        actions: [
          { type: 'generate_report', label: 'Generate Visitor Report', reportType: 'visitor_analytics' },
          { type: 'generate_report', label: 'Generate Event Report', reportType: 'event_performance' },
          { type: 'generate_report', label: 'Generate Cultural Objects Report', reportType: 'cultural_objects' },
          { type: 'generate_report', label: 'Generate Archive Report', reportType: 'archive_report' },
          { type: 'generate_report', label: 'Generate Donation Report', reportType: 'donation_report' }
        ]
      });
    }
    
    // Default response
    return res.json({
      success: true,
      response: "I'm here to help you with your museum management needs. You can ask me to generate reports, analyze data, or help with any museum-related tasks. What would you like to do?",
      actions: [
        { type: 'generate_report', label: 'Generate Visitor Report', reportType: 'visitor_analytics' },
        { type: 'generate_report', label: 'Generate Event Report', reportType: 'event_performance' },
        { type: 'generate_report', label: 'Generate Archive Report', reportType: 'archive_report' },
        { type: 'generate_report', label: 'Generate Donation Report', reportType: 'donation_report' },
        { type: 'generate_report', label: 'Generate Cultural Objects Report', reportType: 'cultural_objects' }
      ]
    });

  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message'
    });
  }
});

// Download report
router.get('/:id/download', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'pdf' } = req.query;

    // Fetch report
    const [reports] = await db.query(`
      SELECT * FROM reports 
      WHERE id = ? AND user_id = ?
    `, [id, req.user.id]);

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const report = reports[0];

    console.log(`📥 Download request for report ${id}, format: ${format}`);

    // Serve file from filesystem if available
    const fs = require('fs');
    const path = require('path');
    
    if (format === 'pdf' && report.pdf_file_path && fs.existsSync(report.pdf_file_path)) {
      console.log('📄 Serving PDF from filesystem:', report.pdf_file_path);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${report.pdf_filename || `report-${id}.pdf`}"`);
      res.setHeader('Content-Length', report.pdf_size || 0);
      try { await logActivity(req, 'report.download.pdf', { reportId: id }); } catch {}
      return res.sendFile(path.resolve(report.pdf_file_path));
    } 
    
    // Legacy: Serve from database if filesystem path not available (for old reports)
    if (format === 'pdf' && report.pdf_file) {
      console.log('📄 Serving PDF from database (legacy), size:', report.pdf_size, 'bytes');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${report.pdf_filename || `report-${id}.pdf`}"`);
      res.setHeader('Content-Length', report.pdf_size);
      try { await logActivity(req, 'report.download.pdf', { reportId: id }); } catch {}
      return res.send(report.pdf_file);
    }

    // Fallback: Generate file on-the-fly if not stored in database
    console.log(`⚠️  File not found in database, generating ${format} on-the-fly...`);
    
    if (format === 'pdf') {
      // Generate branded HTML then render real PDF via Puppeteer
      let reportData = {};
      if (report.data) {
        try {
          reportData = JSON.parse(report.data);
        } catch (e) {
          console.error('Error parsing report data:', e);
        }
      }
      
      // Get AI insights if available
      let aiInsights = null;
      try {
        const [insights] = await db.query('SELECT insights FROM ai_insights WHERE report_id = ?', [id]);
        if (insights.length > 0) {
          aiInsights = JSON.parse(insights[0].insights);
        }
      } catch (e) {
        console.log('No AI insights found for report:', id);
      }
      
      // Use specific templates for different report types
      let htmlContent;
      if (report.report_type === 'visitor_analytics' || (report.title?.toLowerCase().includes('visitor') && report.report_type !== 'visitor_list')) {
        // Use enhanced visitor report generator with charts for analytics
        const enhancedGenerator = new EnhancedVisitorReportGenerator();
        htmlContent = await enhancedGenerator.generateVisitorReportWithCharts(report);
      } else if (report.report_type === 'visitor_list') {
        // Use clean visitor report generator for simple list
        htmlContent = generateCleanVisitorReportPDF(report);
      } else if (report.report_type === 'cultural_objects' || report.report_type === 'cultural_objects_report' || report.report_type === 'exhibit_analytics' || report.title?.toLowerCase().includes('cultural')) {
        console.log('🎨 Using Cultural Object Report PDF format for download, report type:', report.report_type);
        htmlContent = generateCulturalObjectReportPDF(report);
      } else if (report.report_type === 'archive_analytics' || report.report_type === 'archive_report' || report.title?.toLowerCase().includes('archive')) {
        console.log('📁 Using Archive Report PDF format for download, report type:', report.report_type);
        htmlContent = generateArchiveReportPDF(report);
      } else if (report.report_type === 'event_list') {
        console.log('📋 Using Simple Event List Report PDF format for download, report type:', report.report_type);
        const { generateEventListReport } = require('../utils/simpleEventReportGenerator');
        htmlContent = generateEventListReport(report);
      } else if (report.report_type === 'event_participants') {
        console.log('👥 Using Event Participants Report PDF format for download, report type:', report.report_type);
        const { generateEventParticipantsReport } = require('../utils/simpleEventReportGenerator');
        htmlContent = generateEventParticipantsReport(report);
      } else if (report.report_type === 'donation_report' || report.title?.toLowerCase().includes('donation')) {
        console.log('💰 Using Enhanced Donation Report PDF format for download, report type:', report.report_type);
        const enhancedGenerator = new EnhancedDonationReportGenerator();
        htmlContent = await enhancedGenerator.generateDonationReportWithCharts(report);
      } else if (report.report_type === 'donation_list') {
        console.log('📋 Using Simple Donation List Report PDF format for download, report type:', report.report_type);
        const { generateSimpleDonationListReport } = require('../utils/simpleDonationReportGenerator');
        htmlContent = generateSimpleDonationListReport(report);
      } else {
        htmlContent = generateBrandedReportHTML(report, reportData, aiInsights);
      }
      try {
        const pdfBuffer = await htmlToPdfBuffer(htmlContent);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="cdo-museum-report-${id}.pdf"`);
        try { await logActivity(req, 'report.download.pdf', { reportId: id }); } catch {}
        return res.send(pdfBuffer);
      } catch (err) {
        console.error('Puppeteer PDF generation failed, falling back to HTML:', err.message);
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="cdo-museum-report-${id}.html"`);
        try { await logActivity(req, 'report.download.html', { reportId: id }); } catch {}
        return res.send(htmlContent);
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported format'
      });
    }

  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download report'
    });
  }
});

// Helper function to generate dynamic report content based on report type
function generateReportContent(reportType, reportData) {
  switch (reportType) {
    case 'visitor_analytics':
      return `
        <div class="section">
          <h2>Key Statistics</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${reportData.totalVisitors || 0}</div>
              <div class="stat-label">Total Visitors</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${reportData.uniqueDays || 0}</div>
              <div class="stat-label">Unique Days</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${reportData.avgVisitorsPerBooking ? reportData.avgVisitorsPerBooking.toFixed(1) : 0}</div>
              <div class="stat-label">Avg Visitors/Booking</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${reportData.visitorDetails ? reportData.visitorDetails.length : 0}</div>
              <div class="stat-label">Individual Records</div>
            </div>
          </div>
        </div>
        
        ${reportData.visitorDetails && reportData.visitorDetails.length > 0 ? `
        <div class="section">
          <h2>Complete Visitor Information</h2>
          <p>Detailed information for all visitors who entered the museum (based on QR scan check-in time)</p>
          <table class="visitor-table">
            <thead>
              <tr>
                <th>Visitor ID</th>
                <th>Name</th>
                <th>Gender</th>
                <th>Visitor Type</th>
                <th>Email</th>
                <th>Purpose</th>
                <th>Entry Date</th>
                <th>QR Scan Time</th>
                <th>Time Slot</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.visitorDetails.map(visitor => `
                <tr>
                  <td>${visitor.visitor_id}</td>
                  <td><strong>${visitor.first_name} ${visitor.last_name}</strong></td>
                  <td>${visitor.gender}</td>
                  <td>${visitor.visitor_type}</td>
                  <td>${visitor.email}</td>
                  <td>${visitor.purpose}</td>
                  <td>${new Date(visitor.visit_date).toLocaleDateString()}</td>
                  <td>${new Date(visitor.scan_time).toLocaleTimeString()}</td>
                  <td>${visitor.time_slot || 'N/A'}</td>
                  <td>${visitor.booking_status || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
      `;
      
    case 'cultural_objects':
    case 'cultural_objects_report':
      return `
        <div class="section">
          <h2>Cultural Objects Summary</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${reportData.totalObjects || 0}</div>
              <div class="stat-label">Total Objects</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${reportData.summary ? reportData.summary.totalCategories : 0}</div>
              <div class="stat-label">Categories</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">₱${reportData.summary ? reportData.summary.totalEstimatedValue.toLocaleString() : 0}</div>
              <div class="stat-label">Total Value</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${reportData.categories ? reportData.categories.length : 0}</div>
              <div class="stat-label">Active Categories</div>
            </div>
          </div>
        </div>
        
        ${reportData.categories && reportData.categories.length > 0 ? `
        <div class="section">
          <h2>Category Breakdown</h2>
          <table class="visitor-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Count</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.categories.map(category => `
                <tr>
                  <td><strong>${category.category}</strong></td>
                  <td>${category.count}</td>
                  <td>₱${category.total_value ? parseFloat(category.total_value).toLocaleString() : '0'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        ${reportData.objects && reportData.objects.length > 0 ? `
        <div class="section">
          <h2>Cultural Objects Inventory</h2>
          <p>Complete list of cultural objects in the museum collection</p>
          <table class="visitor-table">
            <thead>
              <tr>
                <th>Object ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Period</th>
                <th>Origin</th>
                <th>Material</th>
                <th>Estimated Value</th>
                <th>Condition</th>
                <th>Images</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.objects.map(obj => `
                <tr>
                  <td>${obj.id}</td>
                  <td><strong>${obj.name}</strong></td>
                  <td>${obj.category}</td>
                  <td>${obj.period || 'N/A'}</td>
                  <td>${obj.origin || 'N/A'}</td>
                  <td>${obj.material || 'N/A'}</td>
                  <td>₱${obj.estimated_value ? parseFloat(obj.estimated_value).toLocaleString() : 'N/A'}</td>
                  <td>${obj.condition_status || 'N/A'}</td>
                  <td>${obj.images ? obj.images.length : 0} image(s)</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
      `;
      
    default:
      return `
        <div class="section">
          <h2>Report Data</h2>
          <p>Report type: ${reportType}</p>
          <p>Data available: ${reportData ? 'Yes' : 'No'}</p>
        </div>
      `;
  }
}

// Helper function to generate HTML report
function generateHTMLReport(report) {
  // Parse the report data
  let reportData = {};
  if (report.data) {
    try {
      reportData = JSON.parse(report.data);
    } catch (e) {
      console.error('Error parsing report data:', e);
    }
  }

  // Create comprehensive HTML content
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${report.title || 'Museum Report'}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            background: linear-gradient(135deg, #AB8841, #8B6B21);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #2e2b41;
            font-size: 22px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #AB8841;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-number {
            font-size: 32px;
            font-weight: bold;
            color: #AB8841;
            margin-bottom: 5px;
        }
        .visitor-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 12px;
        }
        .visitor-table th {
            background: #f8f9fa;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            color: #333;
            border-bottom: 2px solid #ddd;
        }
        .visitor-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #eee;
        }
        .visitor-table tr:nth-child(even) {
            background: #f9f9f9;
        }
        @media print {
            body { margin: 0; }
            .header { page-break-after: avoid; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Museo Smart</h1>
        <p>Museum Management System - Official Report</p>
        <p>${report.title || 'AI Generated Report'}</p>
    </div>

    <div class="section">
        <h2>Report Information</h2>
        <p><strong>Report Type:</strong> ${report.report_type || 'Analysis'}</p>
        <p><strong>Period:</strong> ${report.start_date} to ${report.end_date}</p>
        <p><strong>Generated:</strong> ${report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}</p>
        <p><strong>Report ID:</strong> #${report.id}</p>
    </div>

    ${generateReportContent(report.report_type, reportData)}


    <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px; color: #666; font-size: 12px;">
        <p><strong>City Museum of Cagayan de Oro</strong></p>
        <p><strong>Heritage Studies Center - AI-Powered Museum Management System</strong></p>
        <p>This report was generated automatically using AI analysis and contains comprehensive museum data.</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>
  `;

  return htmlContent;
}

// Helper functions for generating different types of reports
async function generateVisitorAnalytics(startDate, endDate) {
  console.log(`🔍 Generating visitor analytics from ${startDate} to ${endDate}`);
  
  // Get daily visitor statistics based on ACTUAL CHECK-IN TIME and VISITOR STATUS
  let [visitors] = await db.query(`
    SELECT 
      COUNT(*) as total_visitors,
      COUNT(DISTINCT DATE(v.checkin_time)) as unique_days,
      AVG(b.total_visitors) as avg_visitors_per_booking,
      DATE(v.checkin_time) as date,
      COUNT(*) as daily_visitors
    FROM visitors v
    LEFT JOIN bookings b ON v.booking_id = b.booking_id
    WHERE DATE(v.checkin_time) BETWEEN ? AND ? 
    AND v.checkin_time IS NOT NULL
    AND v.status = 'visited'
    GROUP BY DATE(v.checkin_time)
    ORDER BY date
  `, [startDate, endDate]);

  console.log(`📊 Found ${visitors.length} days with visitor data in specified range`);

  // If no data found in the specified range, get all available data
  if (visitors.length === 0) {
    console.log('⚠️ No data found in specified date range, fetching all available data');
    [visitors] = await db.query(`
      SELECT 
        COUNT(*) as total_visitors,
        COUNT(DISTINCT DATE(v.checkin_time)) as unique_days,
        AVG(b.total_visitors) as avg_visitors_per_booking,
        DATE(v.checkin_time) as date,
        COUNT(*) as daily_visitors
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE v.checkin_time IS NOT NULL
      AND v.status = 'visited'
      GROUP BY DATE(v.checkin_time)
      ORDER BY date
    `);
    console.log(`📊 Found ${visitors.length} days with visitor data in all available data`);
  }

  // Get actual visitor details based on ACTUAL CHECK-IN TIME and VISITOR STATUS
  let [visitorDetails] = await db.query(`
    SELECT 
      v.visitor_id,
      v.first_name,
      v.last_name,
      v.gender,
      v.visitor_type,
      v.email,
      v.address,
      v.purpose,
      v.institution,
      v.is_main_visitor,
      v.created_at as registration_date,
      v.checkin_time as scan_time,
      v.checkin_time as visit_date,
      b.time_slot,
      b.date as booking_date,
      b.status as booking_status,
      b.booking_id
    FROM visitors v
    LEFT JOIN bookings b ON v.booking_id = b.booking_id
    WHERE DATE(v.checkin_time) BETWEEN ? AND ? 
    AND v.checkin_time IS NOT NULL
    AND v.status = 'visited'
    ORDER BY v.checkin_time DESC
  `, [startDate, endDate]);

  // If no data found in the specified range, get all available data
  if (visitorDetails.length === 0) {
    [visitorDetails] = await db.query(`
      SELECT 
        v.visitor_id,
        v.first_name,
        v.last_name,
        v.gender,
        v.visitor_type,
        v.email,
        v.address,
        v.purpose,
        v.institution,
        v.is_main_visitor,
        v.created_at as registration_date,
        v.checkin_time as scan_time,
        v.checkin_time as visit_date,
        b.time_slot,
        b.date as booking_date,
        b.status as booking_status,
        b.booking_id
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE v.checkin_time IS NOT NULL
      AND v.status = 'visited'
      ORDER BY v.checkin_time DESC
    `);
  }

  // Get demographics based on ACTUAL CHECK-IN TIME and VISITOR STATUS
  let [demographics] = await db.query(`
    SELECT 
      v.visitor_type,
      COUNT(*) as count
    FROM visitors v
    LEFT JOIN bookings b ON v.booking_id = b.booking_id
    WHERE DATE(v.checkin_time) BETWEEN ? AND ? 
    AND v.checkin_time IS NOT NULL
    AND v.status = 'visited'
    GROUP BY v.visitor_type
    ORDER BY count DESC
    LIMIT 10
  `, [startDate, endDate]);

  // If no data found in the specified range, get all available data
  if (demographics.length === 0) {
    [demographics] = await db.query(`
      SELECT 
        v.visitor_type,
        COUNT(*) as count
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE v.checkin_time IS NOT NULL
      AND v.status = 'visited'
      GROUP BY v.visitor_type
      ORDER BY count DESC
      LIMIT 10
    `);
  }

  // Get time slots based on ACTUAL CHECK-IN TIME
  let [timeSlots] = await db.query(`
    SELECT 
      b.time_slot,
      COUNT(*) as count
    FROM visitors v
    LEFT JOIN bookings b ON v.booking_id = b.booking_id
    WHERE DATE(v.checkin_time) BETWEEN ? AND ? 
    AND v.checkin_time IS NOT NULL
    AND v.status = 'visited'
    GROUP BY b.time_slot
    ORDER BY count DESC
  `, [startDate, endDate]);

  // If no data found in the specified range, get all available data
  if (timeSlots.length === 0) {
    [timeSlots] = await db.query(`
      SELECT 
        b.time_slot,
        COUNT(*) as count
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE v.checkin_time IS NOT NULL
      AND v.status = 'visited'
      GROUP BY b.time_slot
      ORDER BY count DESC
    `);
  }

  // Get gender distribution based on ACTUAL CHECK-IN TIME
  let [genderDistribution] = await db.query(`
    SELECT 
      v.gender,
      COUNT(*) as count
    FROM visitors v
    LEFT JOIN bookings b ON v.booking_id = b.booking_id
    WHERE DATE(v.checkin_time) BETWEEN ? AND ?
    AND v.checkin_time IS NOT NULL
    AND v.status = 'visited'
    GROUP BY v.gender
    ORDER BY count DESC
  `, [startDate, endDate]);

  // If no data found in the specified range, get all available data
  if (genderDistribution.length === 0) {
    [genderDistribution] = await db.query(`
      SELECT 
        v.gender,
        COUNT(*) as count
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE v.checkin_time IS NOT NULL
      AND v.status = 'visited'
      GROUP BY v.gender
      ORDER BY count DESC
    `);
  }

  // Prepare chart data
  const chartData = {
    dailyVisitors: visitors.map(v => ({
      date: v.date,
      visitors: v.daily_visitors
    })),
    demographics: demographics.map(d => ({
              visitor_type: d.visitor_type,
      count: d.count
    })),
    timeSlots: timeSlots.map(t => ({
      timeSlot: t.time_slot,
      count: t.count
    })),
    genderDistribution: genderDistribution.map(g => ({
      gender: g.gender,
      count: g.count
    }))
  };

  return {
    totalVisitors: visitors.reduce((sum, v) => sum + (v.daily_visitors || 0), 0),
    uniqueDays: visitors.length,
    avgVisitorsPerBooking: visitors.length > 0 ? visitors.reduce((sum, v) => sum + (v.avg_visitors_per_booking || 0), 0) / visitors.length : 0,
    dailyData: visitors,
    demographics: demographics,
    timeSlots: timeSlots,
    visitorDetails: visitorDetails,
    chartData: chartData
  };
}

async function generateMonthlySummary(startDate, endDate) {
  const [visitors] = await db.query(`
    SELECT COUNT(*) as total_visitors
    FROM visitors v
    LEFT JOIN bookings b ON v.booking_id = b.booking_id
    WHERE b.date BETWEEN ? AND ?
  `, [startDate, endDate]);

  const [events] = await db.query(`
    SELECT COUNT(*) as total_events
    FROM activities a
    LEFT JOIN event_details ed ON a.id = ed.activity_id
    WHERE a.type = 'event' 
    AND ed.start_date BETWEEN ? AND ?
  `, [startDate, endDate]);

  const [donations] = await db.query(`
    SELECT COUNT(*) as total_donations, 
           COUNT(CASE WHEN type = 'monetary' THEN 1 END) as monetary_donations
    FROM donations 
    WHERE created_at BETWEEN ? AND ?
  `, [startDate, endDate]);

  const [exhibits] = await db.query(`
    SELECT COUNT(*) as total_exhibits
    FROM activities a
    LEFT JOIN exhibit_details ed ON a.id = ed.activity_id
    WHERE a.type = 'exhibit' 
    AND ed.start_date BETWEEN ? AND ?
  `, [startDate, endDate]);

  return {
    visitors: visitors[0].total_visitors,
    events: events[0].total_events,
    donations: {
      count: donations[0].total_donations,
      amount: donations[0].monetary_donations * 100 || 0 // Mock amount since no amount field
    },
    exhibits: exhibits[0].total_exhibits
  };
}

async function generateEventPerformance(startDate, endDate) {
  console.log(`🎉 Generating event performance report from ${startDate} to ${endDate}`);
  
  const [events] = await db.query(`
    SELECT 
      a.*,
      ed.start_date,
      ed.time,
      ed.location,
      ed.organizer,
      a.current_registrations as visitor_count
    FROM activities a
    LEFT JOIN event_details ed ON a.id = ed.activity_id
    WHERE a.type = 'event' 
    AND ed.start_date BETWEEN ? AND ?
    ORDER BY ed.start_date DESC
  `, [startDate, endDate]);
  
  let resultEvents = events;
  if (resultEvents.length === 0) {
    console.log('⚠️ No event data found in specified date range, fetching all available data');
    const [allEvents] = await db.query(`
      SELECT 
        a.*,
        ed.start_date,
        ed.time,
        ed.location,
        ed.organizer,
        a.current_registrations as visitor_count
      FROM activities a
      LEFT JOIN event_details ed ON a.id = ed.activity_id
      WHERE a.type = 'event'
      ORDER BY ed.start_date DESC
    `);
    resultEvents = allEvents;
    console.log(`📊 Found ${resultEvents.length} events in all available data`);
  }

  // Calculate average visitors per event
  const totalVisitors = resultEvents.reduce((sum, event) => sum + (event.visitor_count || 0), 0);
  const avgVisitorsPerEvent = resultEvents.length > 0 ? totalVisitors / resultEvents.length : 0;

  return {
    totalEvents: resultEvents.length,
    totalEventVisitors: totalVisitors,
    events: resultEvents,
    avgVisitorsPerEvent: avgVisitorsPerEvent
  };
}

async function generateFinancialReport(startDate, endDate) {
  console.log(`💰 Generating financial report from ${startDate} to ${endDate}`);
  
  // Use date_received if available; fallback to created_at
  const [donations] = await db.query(`
    SELECT 
      d.type,
      COUNT(*) as count,
      COUNT(CASE WHEN d.type = 'monetary' THEN 1 END) as monetary_count,
      SUM(dd.amount) as total_amount,
      AVG(dd.amount) as avg_amount
    FROM donations d
    LEFT JOIN donation_details dd ON d.id = dd.donation_id
    WHERE (COALESCE(d.date_received, d.created_at) BETWEEN ? AND ?)
    GROUP BY d.type
  `, [startDate, endDate]);

  console.log(`📊 Found ${donations.length} donation types in specified range`);

  // If no data found in the specified range, get all available data
  if (donations.length === 0) {
    console.log('⚠️ No donation data found in specified date range, fetching all available data');
    [donations] = await db.query(`
      SELECT 
        d.type,
        COUNT(*) as count,
        COUNT(CASE WHEN d.type = 'monetary' THEN 1 END) as monetary_count,
        SUM(dd.amount) as total_amount,
        AVG(dd.amount) as avg_amount
      FROM donations d
      LEFT JOIN donation_details dd ON d.id = dd.donation_id
      GROUP BY d.type
    `);
    console.log(`📊 Found ${donations.length} donation types in all available data`);
  }

  const [monthlyDonations] = await db.query(`
    SELECT 
      DATE_FORMAT(COALESCE(d.date_received, d.created_at), '%Y-%m') as month,
      COUNT(CASE WHEN d.type = 'monetary' THEN 1 END) as monetary_count,
      SUM(dd.amount) as total_amount
    FROM donations d
    LEFT JOIN donation_details dd ON d.id = dd.donation_id
    WHERE (COALESCE(d.date_received, d.created_at) BETWEEN ? AND ?)
    GROUP BY DATE_FORMAT(COALESCE(d.date_received, d.created_at), '%Y-%m')
    ORDER BY month
  `, [startDate, endDate]);

  // Calculate total monetary donations
  const totalMonetaryDonations = donations
    .filter(d => d.type === 'monetary')
    .reduce((sum, d) => sum + (parseFloat(d.total_amount) || 0), 0);

  return {
    totalDonations: totalMonetaryDonations,
    totalDonationCount: donations.reduce((sum, d) => sum + d.count, 0),
    donationTypes: donations,
    monthlyData: monthlyDonations,
    avgDonationAmount: donations.length > 0 ? 
      donations.reduce((sum, d) => sum + (parseFloat(d.avg_amount) || 0), 0) / donations.length : 0
  };
}

async function generateExhibitAnalytics(startDate, endDate) {
  console.log(`🎨 Generating exhibit analytics report from ${startDate} to ${endDate}`);
  
  const [exhibits] = await db.query(`
    SELECT 
      a.*,
      ed.start_date,
      ed.end_date,
      ed.location,
      ed.curator,
      ed.category,
      a.current_registrations as visitor_count
    FROM activities a
    LEFT JOIN exhibit_details ed ON a.id = ed.activity_id
    WHERE a.type = 'exhibit' 
    AND ed.start_date BETWEEN ? AND ?
    ORDER BY ed.start_date DESC
  `, [startDate, endDate]);
  
  let resultExhibits = exhibits;
  if (resultExhibits.length === 0) {
    console.log('⚠️ No exhibit data found in specified date range, fetching all available data');
    const [allExhibits] = await db.query(`
      SELECT 
        a.*,
        ed.start_date,
        ed.end_date,
        ed.location,
        ed.curator,
        ed.category,
        a.current_registrations as visitor_count
      FROM activities a
      LEFT JOIN exhibit_details ed ON a.id = ed.activity_id
      WHERE a.type = 'exhibit'
      ORDER BY ed.start_date DESC
    `);
    resultExhibits = allExhibits;
    console.log(`📊 Found ${resultExhibits.length} exhibits in all available data`);
  }

  // Calculate average visitors per exhibit
  const totalVisitors = resultExhibits.reduce((sum, exhibit) => sum + (exhibit.visitor_count || 0), 0);
  const avgVisitorsPerExhibit = resultExhibits.length > 0 ? totalVisitors / resultExhibits.length : 0;

  return {
    totalExhibits: resultExhibits.length,
    totalExhibitVisitors: totalVisitors,
    exhibits: resultExhibits,
    avgVisitorsPerExhibit: avgVisitorsPerExhibit
  };
}

// Removed duplicate function - using generateCulturalObjectsInventory from additional-report-functions.js

// Removed duplicate function - using generateArchiveList from additional-report-functions.js

async function generateStaffPerformance(startDate, endDate) {
  console.log(`👥 Generating staff performance report from ${startDate} to ${endDate}`);
  
  const [staffActivities] = await db.query(`
    SELECT 
      u.user_ID,
      u.firstname,
      u.lastname,
      u.email,
      u.role,
      COUNT(v.visitor_id) as visitors_processed,
      COUNT(DISTINCT DATE(b.date)) as days_worked,
      COUNT(DISTINCT DATE(b.checkin_time)) as days_with_checkins
    FROM system_user u
    LEFT JOIN visitors v ON u.user_ID = v.checked_in_by
    LEFT JOIN bookings b ON v.booking_id = b.booking_id
    WHERE (b.date BETWEEN ? AND ? OR b.checkin_time BETWEEN ? AND ?) 
    AND u.role IN ('admin', 'staff')
    GROUP BY u.user_ID
    ORDER BY visitors_processed DESC
  `, [startDate, endDate, startDate, endDate]);

  console.log(`📊 Found ${staffActivities.length} staff members with activity data`);

  // If no data found in the specified range, get all available data
  if (staffActivities.length === 0) {
    console.log('⚠️ No staff data found in specified date range, fetching all available data');
    [staffActivities] = await db.query(`
    SELECT 
        u.user_ID,
      u.firstname,
      u.lastname,
        u.email,
        u.role,
      COUNT(v.visitor_id) as visitors_processed,
        COUNT(DISTINCT DATE(b.date)) as days_worked,
        COUNT(DISTINCT DATE(b.checkin_time)) as days_with_checkins
    FROM system_user u
    LEFT JOIN visitors v ON u.user_ID = v.checked_in_by
    LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE u.role IN ('admin', 'staff')
    GROUP BY u.user_ID
    ORDER BY visitors_processed DESC
    `);
    console.log(`📊 Found ${staffActivities.length} staff members in all available data`);
  }

  const totalVisitorsProcessed = staffActivities.reduce((sum, s) => sum + s.visitors_processed, 0);
  const avgVisitorsPerStaff = staffActivities.length > 0 ? totalVisitorsProcessed / staffActivities.length : 0;

  return {
    totalStaff: staffActivities.length,
    staffActivities: staffActivities,
    totalVisitorsProcessed: totalVisitorsProcessed,
    avgVisitorsPerStaff: avgVisitorsPerStaff
  };
}

// NEW LIST-BASED REPORT FUNCTIONS

async function generateVisitorList(startDate, endDate) {
  console.log(`👥 Generating visitor list report from ${startDate} to ${endDate}`);
  
  // Get only visitors who have actually scanned/checked in
  let [visitors] = await db.query(`
    SELECT 
      v.visitor_id,
      v.first_name,
      v.last_name,
      v.gender,
      v.visitor_type,
      v.email,
      v.address,
      v.purpose,
      v.institution,
      v.is_main_visitor,
      v.created_at as registration_date,
      b.booking_id,
      b.type as booking_type,
      b.status as booking_status,
      b.date as visit_date,
      b.time_slot,
      b.total_visitors as booking_total,
      v.checkin_time,
      b.created_at as booking_created
    FROM visitors v
    LEFT JOIN bookings b ON v.booking_id = b.booking_id
    WHERE v.checkin_time IS NOT NULL 
    AND v.status = 'visited'
    AND DATE(v.checkin_time) BETWEEN ? AND ?
    ORDER BY v.checkin_time DESC
  `, [startDate, endDate]);

  console.log(`📊 Found ${visitors.length} visitors in specified range`);

  // If no data found in the specified range, get all available data
  if (visitors.length === 0) {
    console.log('⚠️ No visitor data found in specified date range, fetching all available data');
    [visitors] = await db.query(`
      SELECT 
        v.visitor_id,
        v.first_name,
        v.last_name,
        v.gender,
        v.visitor_type,
        v.email,
        v.address,
        v.purpose,
        v.institution,
        v.is_main_visitor,
        v.created_at as registration_date,
        b.booking_id,
        b.type as booking_type,
        b.status as booking_status,
        b.date as visit_date,
        b.time_slot,
        b.total_visitors as booking_total,
        v.checkin_time,
        b.created_at as booking_created
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE v.checkin_time IS NOT NULL 
      AND v.status = 'visited'
      ORDER BY v.checkin_time DESC
    `);
    console.log(`📊 Found ${visitors.length} visitors in all available data`);
  }

  return {
    totalVisitors: visitors.length,
    visitors: visitors,
    visitorDetails: visitors, // Add this for template compatibility
    summary: {
      totalBookings: new Set(visitors.map(v => v.booking_id)).size,
      checkedInVisitors: visitors.filter(v => v.booking_status === 'checked-in').length,
      mainVisitors: visitors.filter(v => v.is_main_visitor).length,
      additionalVisitors: visitors.filter(v => !v.is_main_visitor).length
    }
  };
}

async function generateEventList(startDate, endDate) {
  console.log(`🎉 Generating event list report from ${startDate} to ${endDate}`);
  
  let [events] = await db.query(`
    SELECT 
      a.id,
      a.title,
      a.description,
      a.type,
      a.max_capacity,
      a.current_registrations,
      a.created_at,
      ed.start_date,
      ed.time,
      ed.location,
      ed.organizer
    FROM activities a
    LEFT JOIN event_details ed ON a.id = ed.activity_id
    WHERE a.type = 'event' 
    AND (ed.start_date BETWEEN ? AND ? OR a.created_at BETWEEN ? AND ?)
    ORDER BY ed.start_date DESC
  `, [startDate, endDate, startDate, endDate]);

  if (events.length === 0) {
    [events] = await db.query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.type,
        a.max_capacity,
        a.current_registrations,
        a.created_at,
        ed.start_date,
        ed.time,
        ed.location,
        ed.organizer
      FROM activities a
      LEFT JOIN event_details ed ON a.id = ed.activity_id
      WHERE a.type = 'event'
      ORDER BY ed.start_date DESC
    `);
  }

  return {
    totalEvents: events.length,
    events: events,
    summary: {
      totalCapacity: events.reduce((sum, event) => sum + (event.max_capacity || 0), 0),
      totalRegistrations: events.reduce((sum, event) => sum + (event.current_registrations || 0), 0)
    }
  };
}



// Generate real-time AI insights
async function generateRealTimeInsights() {
  try {
    const currentData = await getCurrentMuseumData();
    const insights = [];

    // Visitor trend insights
    if (currentData.recentVisitors > 0) {
      const [lastWeekVisitors] = await db.query(`
        SELECT COUNT(*) as count
        FROM visitors v
        LEFT JOIN bookings b ON v.booking_id = b.booking_id
        WHERE b.date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);
      
      const weeklyGrowth = ((currentData.recentVisitors - lastWeekVisitors[0].count) / lastWeekVisitors[0].count * 100).toFixed(1);
      
      if (weeklyGrowth > 10) {
        insights.push({
          type: 'positive',
          icon: 'fa-arrow-up',
          title: 'Visitor Growth',
          description: `Visitor numbers increased by ${weeklyGrowth}% this week compared to last week.`,
          action: {
            label: 'View Analytics',
            reportType: 'visitor_analytics'
          }
        });
      } else if (weeklyGrowth < -10) {
        insights.push({
          type: 'warning',
          icon: 'fa-arrow-down',
          title: 'Visitor Decline',
          description: `Visitor numbers decreased by ${Math.abs(weeklyGrowth)}% this week. Consider promotional activities.`,
          action: {
            label: 'Analyze Trends',
            reportType: 'visitor_analytics'
          }
        });
      }
    }

    // Financial insights
    if (currentData.recentDonations.amount > 0) {
      const [lastMonthDonations] = await db.query(`
        SELECT SUM(dd.amount) as total
        FROM donations d
        LEFT JOIN donation_details dd ON d.id = dd.donation_id
        WHERE d.created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) 
        AND d.created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);
      
      const monthlyGrowth = ((currentData.recentDonations.amount - lastMonthDonations[0].total) / lastMonthDonations[0].total * 100).toFixed(1);
      
      if (monthlyGrowth > 20) {
        insights.push({
          type: 'positive',
          icon: 'fa-dollar-sign',
          title: 'Strong Donations',
          description: `Donations increased by ${monthlyGrowth}% this month. Excellent donor engagement!`,
          action: {
            label: 'Financial Report',
            reportType: 'financial_report'
          }
        });
      }
    }

    // Event insights
    if (currentData.recentEvents > 0) {
      insights.push({
        type: 'info',
        icon: 'fa-calendar',
        title: 'Active Events',
        description: `${currentData.recentEvents} events scheduled this month. Monitor their performance.`,
        action: {
          label: 'Event Analysis',
          reportType: 'event_performance'
        }
      });
    }

    // Staff productivity insights
    const [staffProductivity] = await db.query(`
      SELECT COUNT(DISTINCT u.user_ID) as active_staff
      FROM system_user u
      WHERE u.role = 'staff' AND u.status = 'active'
    `);
    
    if (staffProductivity[0].active_staff > 0) {
      insights.push({
        type: 'info',
        icon: 'fa-users',
        title: 'Staff Activity',
        description: `${staffProductivity[0].active_staff} active staff members. Track their performance.`,
        action: {
          label: 'Staff Report',
          reportType: 'staff_performance'
        }
      });
    }

    return insights.slice(0, 3); // Return top 3 insights
  } catch (error) {
    console.error('Error generating real-time insights:', error);
    return [];
  }
}

// Get current museum data for AI chat context
async function getCurrentMuseumData() {
  try {
    const [visitors] = await db.query(`
      SELECT COUNT(*) as total_visitors
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE b.date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    const [events] = await db.query(`
      SELECT COUNT(*) as total_events
      FROM activities a
      LEFT JOIN event_details ed ON a.id = ed.activity_id
      WHERE a.type = 'event' 
      AND ed.start_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    const [donations] = await db.query(`
      SELECT COUNT(*) as total_donations, 
             COUNT(CASE WHEN type = 'monetary' THEN 1 END) as monetary_donations
      FROM donations 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    return {
      recentVisitors: visitors[0].total_visitors,
      recentEvents: events[0].total_events,
      recentDonations: {
        count: donations[0].total_donations,
        amount: donations[0].monetary_donations * 100 || 0 // Mock amount since no amount field
      }
    };
  } catch (error) {
    console.error('Error getting current museum data:', error);
    return {
      recentVisitors: 0,
      recentEvents: 0,
      recentDonations: { count: 0, amount: 0 }
    };
  }
}

// Generate HTML report content (legacy function)
function generateLegacyReportContent(data, insights, includeCharts, includePredictions = false, includeComparisons = false) {
  let content = `
    <div class="report-content">
      <!-- Museum Header with Logo -->
      <div class="museum-header" style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #AB8841, #8B6B21); color: white; border-radius: 10px;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 15px;">
          <div style="width: 80px; height: 80px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
            <div style="width: 60px; height: 60px; background: #AB8841; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 24px; font-weight: bold; color: white;">M</span>
            </div>
          </div>
          <div>
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Museo Smart</h1>
            <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">Museum Management System</p>
          </div>
        </div>
        <div style="border-top: 1px solid rgba(255,255,255,0.3); padding-top: 15px;">
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">Official Museum Report</p>
        </div>
      </div>

      <div class="ai-source-info" style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #AB8841;">
        <p style="margin: 0; font-size: 14px; color: #666;">
          <strong>AI Analysis Source:</strong> ${insights.source || 'AI Service'}
        </p>
      </div>
      
      <div class="executive-summary">
        <h2>Executive Summary</h2>
        <p>${insights.summary}</p>
      </div>
      
      <div class="key-insights">
        <h2>Key Insights</h2>
        <ul>
          ${insights.trends.map(trend => `<li>${trend}</li>`).join('')}
        </ul>
      </div>
      
      ${includePredictions && insights.predictions && insights.predictions.length > 0 ? `
      <div class="predictions">
        <h2>AI Predictions</h2>
        <ul>
          ${insights.predictions.map(prediction => `<li>${prediction}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      
      ${includeComparisons && insights.comparisons && insights.comparisons.length > 0 ? `
      <div class="comparisons">
        <h2>Period Comparisons</h2>
        <ul>
          ${insights.comparisons.map(comparison => `<li>${comparison}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
  `;

  if (insights.recommendations.length > 0) {
    content += `
      <div class="recommendations">
        <h2>AI Recommendations</h2>
        <ul>
          ${insights.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Add visitor list if available
  if (data.visitorDetails && data.visitorDetails.length > 0) {
    content += `
      <div class="visitor-list" style="margin: 20px 0;">
        <h2>Complete Visitor Information</h2>
        <p style="color: #666; margin-bottom: 15px; font-style: italic;">Showing all visitor information recorded in the visitor section for those who actually entered the museum (based on QR scan check-in time)</p>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; font-size: 12px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Visitor ID</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Name</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Gender</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Visitor Type</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Email</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Address</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Purpose</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Main Visitor</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Registration Date</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Booking ID</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Entry Date</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">QR Scan Time</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Time Slot</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.visitorDetails.map(visitor => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.visitor_id}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${visitor.first_name} ${visitor.last_name}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.gender}</td>
                                          <td style="padding: 8px; border: 1px solid #ddd;">${visitor.visitor_type}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.email}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.address}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.purpose}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.is_main_visitor ? 'Yes' : 'No'}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.registration_date ? new Date(visitor.registration_date).toLocaleDateString() : 'N/A'}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.booking_id}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${new Date(visitor.visit_date).toLocaleDateString()}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.scan_time ? new Date(visitor.scan_time).toLocaleString() : 'N/A'}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.time_slot || 'N/A'}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.booking_status || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  if (includeCharts && data.chartData) {
    content += `
      <div class="charts-section">
        <h2>Data Visualization</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
          <!-- Daily Visitors Chart -->
          <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
            <h3 style="margin-top: 0; color: #333;">Daily Visitors Trend</h3>
            <div style="height: 200px; display: flex; align-items: end; justify-content: space-around; gap: 4px;">
              ${data.chartData.dailyVisitors.map(day => {
                const maxVisitors = Math.max(...data.chartData.dailyVisitors.map(d => d.visitors));
                const height = maxVisitors > 0 ? (day.visitors / maxVisitors) * 100 : 0;
                return `
                  <div style="display: flex; flex-direction: column; align-items: center;">
                    <div style="width: 20px; height: ${height}px; background: linear-gradient(to top, #AB8841, #8B6B21); border-radius: 2px;"></div>
                    <span style="font-size: 10px; margin-top: 5px;">${day.visitors}</span>
                  </div>
                `;
              }).join('')}
            </div>
            <p style="text-align: center; margin-top: 10px; font-size: 12px; color: #666;">Daily Visitor Count</p>
          </div>

          <!-- Demographics Chart -->
          <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
                                <h3 style="margin-top: 0; color: #333;">Visitor Type Distribution</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${data.chartData.demographics.map(demo => {
                const total = data.chartData.demographics.reduce((sum, d) => sum + d.count, 0);
                const percentage = total > 0 ? (demo.count / total) * 100 : 0;
                return `
                  <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="font-size: 12px;">${demo.visitor_type}</span>
                      <span style="font-size: 12px;">${demo.count} (${percentage.toFixed(1)}%)</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden;">
                      <div style="width: ${percentage}%; height: 100%; background: linear-gradient(to right, #AB8841, #8B6B21);"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
          <!-- Time Slots Chart -->
          <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
            <h3 style="margin-top: 0; color: #333;">Popular Time Slots</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${data.chartData.timeSlots.map(slot => {
                const maxCount = Math.max(...data.chartData.timeSlots.map(s => s.count));
                const width = maxCount > 0 ? (slot.count / maxCount) * 100 : 0;
                return `
                  <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="font-size: 12px;">${slot.timeSlot}</span>
                      <span style="font-size: 12px;">${slot.count}</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden;">
                      <div style="width: ${width}%; height: 100%; background: linear-gradient(to right, #4CAF50, #45a049);"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Gender Distribution Chart -->
          <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
            <h3 style="margin-top: 0; color: #333;">Gender Distribution</h3>
            <div style="display: flex; justify-content: center; align-items: center; height: 150px;">
              <div style="display: flex; gap: 20px; align-items: center;">
                ${data.chartData.genderDistribution.map(gender => {
                  const total = data.chartData.genderDistribution.reduce((sum, g) => sum + g.count, 0);
                  const percentage = total > 0 ? (gender.count / total) * 100 : 0;
                  const color = gender.gender === 'male' ? '#2196F3' : gender.gender === 'female' ? '#E91E63' : '#9C27B0';
                  return `
                    <div style="text-align: center;">
                      <div style="width: 60px; height: 60px; border-radius: 50%; background: ${color}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin: 0 auto 10px;">
                        ${percentage.toFixed(0)}%
                      </div>
                      <div style="font-size: 12px; font-weight: bold;">${gender.gender}</div>
                      <div style="font-size: 10px; color: #666;">${gender.count} visitors</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  content += `
      <div class="detailed-data">
        <h2>Report Summary</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Key Statistics</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            ${data.totalVisitors ? `<div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #ddd;">
              <div style="font-size: 24px; font-weight: bold; color: #AB8841;">${data.totalVisitors}</div>
              <div style="font-size: 12px; color: #666;">Total Visitors</div>
            </div>` : ''}
            ${data.uniqueDays ? `<div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #ddd;">
              <div style="font-size: 24px; font-weight: bold; color: #AB8841;">${data.uniqueDays}</div>
              <div style="font-size: 12px; color: #666;">Unique Days</div>
            </div>` : ''}
            ${data.avgVisitorsPerBooking ? `<div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #ddd;">
              <div style="font-size: 24px; font-weight: bold; color: #AB8841;">${data.avgVisitorsPerBooking.toFixed(1)}</div>
              <div style="font-size: 12px; color: #666;">Avg Visitors/Booking</div>
            </div>` : ''}
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 8px; border-left: 4px solid #4CAF50;">
          <h3 style="margin-top: 0; color: #2e7d32;">Report Generated Successfully</h3>
          <p style="margin: 0; color: #2e7d32; font-size: 14px;">
            This report was generated using AI-powered analysis and contains comprehensive insights about your museum's visitor data.
          </p>
        </div>
      </div>
    </div>
  `;

  return content;
}





// DELETE report
router.delete('/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ Attempting to delete report with ID: ${id}`);
  
  try {
    // First, check if the report exists
    const [checkResult] = await pool.query('SELECT id, title FROM reports WHERE id = ?', [id]);
    console.log(`🔍 Report to delete:`, checkResult);
    
    if (checkResult.length === 0) {
      console.log(`❌ Report with ID ${id} not found`);
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    
    const reportTitle = checkResult[0].title;
    console.log(`🗑️ Found report: ${reportTitle}`);
    
    // Delete from reports table
    const [result] = await pool.query('DELETE FROM reports WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      console.log(`❌ No report was deleted - report may not exist`);
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    
    console.log(`✅ Successfully deleted report ${id} (${reportTitle})`);
    try { await logActivity(req, 'report.delete', { reportId: id, reportTitle }); } catch {}
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting report:', err);
    console.error('❌ Error details:', err.message);
    res.status(500).json({ success: false, error: 'Database error: ' + err.message });
  }
});

// Event data generation functions
async function generateEventAnalytics(startDate, endDate, eventId = null) {
  try {
    // Use the correct table structure based on the database schema
    let query = `
      SELECT 
        a.id as event_id,
        a.title as event_name,
        a.description,
        ed.start_date as event_date,
        ed.location,
        COUNT(DISTINCT er.id) as total_participants,
        COUNT(DISTINCT CASE WHEN er.approval_status = 'approved' THEN er.id END) as attended_participants
      FROM activities a
      LEFT JOIN event_details ed ON a.id = ed.activity_id
      LEFT JOIN event_registrations er ON a.id = er.event_id
      WHERE a.type = 'event'
    `;
    
    const params = [];
    
    if (eventId) {
      query += ` AND a.id = ?`;
      params.push(eventId);
    } else {
      query += ` AND DATE(ed.start_date) BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    
    query += ` GROUP BY a.id, a.title, a.description, ed.start_date, ed.location`;
    
    const [events] = await db.query(query, params);
    
    return {
      events: events,
      totalEvents: events.length,
      totalParticipants: events.reduce((sum, event) => sum + (event.total_participants || 0), 0),
      averageAttendance: events.length > 0 ? 
        events.reduce((sum, event) => sum + (event.attended_participants || 0), 0) / events.length : 0,
      selectedEventId: eventId
    };
  } catch (error) {
    console.error('Error generating event analytics:', error);
    return { events: [], totalEvents: 0, totalParticipants: 0, averageAttendance: 0 };
  }
}

async function generateEventAttendance(startDate, endDate, eventId = null) {
  try {
    // Use the correct table structure based on the database schema
    let query = `
      SELECT 
        er.id as registration_id,
        er.first_name,
        er.last_name,
        er.email,
        er.phone,
        er.registration_type,
        er.approval_status as status,
        er.registration_date as attended_at,
        a.title as event_name,
        ed.start_date as event_date,
        ed.location
      FROM event_registrations er
      JOIN activities a ON er.event_id = a.id
      LEFT JOIN event_details ed ON a.id = ed.activity_id
      WHERE a.type = 'event'
    `;
    
    const params = [];
    
    if (eventId) {
      query += ` AND a.id = ?`;
      params.push(eventId);
    } else {
      query += ` AND DATE(ed.start_date) BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    
    query += ` ORDER BY ed.start_date DESC, er.registration_date DESC`;
    
    const [participants] = await db.query(query, params);
    
    return {
      participants: participants,
      totalParticipants: participants.length,
      attendedParticipants: participants.filter(p => p.status === 'approved').length,
      selectedEventId: eventId
    };
  } catch (error) {
    console.error('Error generating event attendance:', error);
    return { participants: [], totalParticipants: 0, attendedParticipants: 0 };
  }
}

// Export individual functions for testing and direct access
module.exports = {
  router,
  generateVisitorAnalytics,
  generateFinancialReport,
  generateExhibitAnalytics,
  generateEventPerformance,
  generateStaffPerformance,
  generateVisitorList,
  generateEventList,
  generateEventAnalytics,
  generateEventAttendance
}; 