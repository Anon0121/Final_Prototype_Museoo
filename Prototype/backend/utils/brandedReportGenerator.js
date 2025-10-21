const fs = require('fs');
const path = require('path');

// Museum branding configuration
const MUSEUM_BRANDING = {
  name: 'Cagayan de Oro City Museum',
  subtitle: 'Heritage Studies Center',
  colors: {
    primary: '#351E10',      // Dark brown
    secondary: '#2A1A0D',    // Darker brown
    accent: '#E5B80B',       // Gold
    accentLight: '#D4AF37',  // Light gold
    text: '#351E10',         // Dark brown text
    background: '#f8f9fa',   // Light gray background
    white: '#ffffff'
  },
  fonts: {
    primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    heading: 'Playfair Display, serif'
  },
  contact: {
    address: 'Cagayan de Oro City, Philippines',
    email: 'info@cdomuseum.gov.ph',
    website: 'www.cdomuseum.gov.ph'
  }
};

// Generate branded HTML report with museum styling
function generateBrandedReportHTML(report, reportData, aiInsights) {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.title || 'Museum Report'} - ${MUSEUM_BRANDING.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        ${generateBrandedCSS()}
    </style>
</head>
<body>
    ${generateHeader(report)}
    ${generateReportInfo(report)}
    ${generateExecutiveSummary(aiInsights)}
    ${generateKeyStatistics(reportData)}
    ${generateDetailedSections(reportData, report.report_type)}
    ${generateAIInsights(aiInsights)}
    ${generateFooter()}
</body>
</html>
  `;
  
  return htmlContent;
}

// Generate museum-branded CSS
function generateBrandedCSS() {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ${MUSEUM_BRANDING.fonts.primary};
      margin: 0;
      padding: 20px;
      color: ${MUSEUM_BRANDING.colors.text};
      line-height: 1.6;
      background: ${MUSEUM_BRANDING.colors.background};
    }
    
    .header {
      text-align: center;
      background: linear-gradient(135deg, ${MUSEUM_BRANDING.colors.primary} 0%, ${MUSEUM_BRANDING.colors.secondary} 50%, #1A0F08 100%);
      color: white;
      padding: 50px 30px;
      border-radius: 20px;
      margin-bottom: 40px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(53, 30, 16, 0.3);
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, rgba(229, 184, 11, 0.1) 0%, rgba(212, 175, 55, 0.1) 100%);
      z-index: 1;
    }
    
    .header-content {
      position: relative;
      z-index: 2;
    }
    
    .header h1 {
      margin: 0;
      font-family: ${MUSEUM_BRANDING.fonts.heading};
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    
    .header .subtitle {
      font-size: 20px;
      font-weight: 500;
      margin-bottom: 15px;
      color: ${MUSEUM_BRANDING.colors.accent};
    }
    
    .header .tagline {
      font-size: 16px;
      opacity: 0.9;
      font-style: italic;
      margin-bottom: 20px;
    }
    
    .brand-accent {
      width: 80px;
      height: 4px;
      background: linear-gradient(90deg, ${MUSEUM_BRANDING.colors.accent} 0%, ${MUSEUM_BRANDING.colors.accentLight} 100%);
      margin: 20px auto;
      border-radius: 2px;
    }
    
    .report-info {
      background: linear-gradient(135deg, ${MUSEUM_BRANDING.colors.white} 0%, ${MUSEUM_BRANDING.colors.background} 100%);
      padding: 30px;
      border-radius: 15px;
      margin-bottom: 40px;
      border-left: 6px solid ${MUSEUM_BRANDING.colors.accent};
      box-shadow: 0 8px 25px rgba(0,0,0,0.08);
    }
    
    .report-info h2 {
      margin: 0 0 25px 0;
      color: ${MUSEUM_BRANDING.colors.primary};
      font-size: 24px;
      font-weight: 600;
      font-family: ${MUSEUM_BRANDING.fonts.heading};
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    }
    
    .info-label {
      font-weight: 600;
      color: #666;
    }
    
    .info-value {
      color: ${MUSEUM_BRANDING.colors.primary};
      font-weight: 500;
    }
    
    .section {
      margin-bottom: 40px;
    }
    
    .section h2 {
      color: ${MUSEUM_BRANDING.colors.primary};
      font-size: 26px;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 4px solid ${MUSEUM_BRANDING.colors.accent};
      font-family: ${MUSEUM_BRANDING.fonts.heading};
      font-weight: 600;
      position: relative;
    }
    
    .section h2::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 60px;
      height: 4px;
      background: linear-gradient(90deg, ${MUSEUM_BRANDING.colors.accent} 0%, ${MUSEUM_BRANDING.colors.accentLight} 100%);
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
      margin-bottom: 40px;
    }
    
    .stat-card {
      background: linear-gradient(135deg, ${MUSEUM_BRANDING.colors.white} 0%, ${MUSEUM_BRANDING.colors.background} 100%);
      border: 3px solid ${MUSEUM_BRANDING.colors.accent};
      border-radius: 20px;
      padding: 30px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(53, 30, 16, 0.15);
      transition: transform 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, ${MUSEUM_BRANDING.colors.accent} 0%, ${MUSEUM_BRANDING.colors.accentLight} 100%);
    }
    
    .stat-number {
      font-size: 42px;
      font-weight: 800;
      color: ${MUSEUM_BRANDING.colors.primary};
      margin-bottom: 10px;
      font-family: ${MUSEUM_BRANDING.fonts.primary};
      text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
    }
    
    .stat-label {
      color: #666;
      font-size: 16px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .visitor-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 25px;
      font-size: 14px;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 6px 20px rgba(0,0,0,0.1);
    }
    
    .visitor-table th {
      background: linear-gradient(135deg, ${MUSEUM_BRANDING.colors.primary} 0%, ${MUSEUM_BRANDING.colors.secondary} 100%);
      padding: 18px 15px;
      text-align: left;
      font-weight: 600;
      color: white;
      border-bottom: 4px solid ${MUSEUM_BRANDING.colors.accent};
      font-family: ${MUSEUM_BRANDING.fonts.primary};
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-size: 13px;
    }
    
    .visitor-table td {
      padding: 15px;
      border-bottom: 1px solid #f0f0f0;
      color: ${MUSEUM_BRANDING.colors.text};
      font-weight: 400;
    }
    
    .visitor-table tr:nth-child(even) {
      background: linear-gradient(135deg, ${MUSEUM_BRANDING.colors.background} 0%, ${MUSEUM_BRANDING.colors.white} 100%);
    }
    
    .visitor-table tr:nth-child(odd) {
      background: ${MUSEUM_BRANDING.colors.white};
    }
    
    .chart-section {
      background: linear-gradient(135deg, ${MUSEUM_BRANDING.colors.white} 0%, ${MUSEUM_BRANDING.colors.background} 100%);
      border: 3px solid ${MUSEUM_BRANDING.colors.accent};
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }
    
    .chart-title {
      font-size: 22px;
      font-weight: 600;
      color: ${MUSEUM_BRANDING.colors.primary};
      margin-bottom: 25px;
      font-family: ${MUSEUM_BRANDING.fonts.heading};
      border-bottom: 3px solid ${MUSEUM_BRANDING.colors.accent};
      padding-bottom: 12px;
    }
    
    .ai-insights {
      background: linear-gradient(135deg, ${MUSEUM_BRANDING.colors.white} 0%, ${MUSEUM_BRANDING.colors.background} 100%);
      border: 3px solid ${MUSEUM_BRANDING.colors.accent};
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }
    
    .ai-insights h3 {
      color: ${MUSEUM_BRANDING.colors.primary};
      font-family: ${MUSEUM_BRANDING.fonts.heading};
      font-size: 20px;
      margin-bottom: 20px;
      border-bottom: 2px solid ${MUSEUM_BRANDING.colors.accent};
      padding-bottom: 10px;
    }
    
    .insight-item {
      background: ${MUSEUM_BRANDING.colors.white};
      border-left: 4px solid ${MUSEUM_BRANDING.colors.accent};
      padding: 15px 20px;
      margin-bottom: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    
    .footer {
      text-align: center;
      margin-top: 60px;
      padding: 40px;
      background: linear-gradient(135deg, ${MUSEUM_BRANDING.colors.primary} 0%, ${MUSEUM_BRANDING.colors.secondary} 100%);
      border-radius: 20px;
      color: white;
      font-size: 14px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(53, 30, 16, 0.3);
    }
    
    .footer::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, rgba(229, 184, 11, 0.1) 0%, rgba(212, 175, 55, 0.1) 100%);
      z-index: 1;
    }
    
    .footer-content {
      position: relative;
      z-index: 2;
    }
    
    .footer h3 {
      color: ${MUSEUM_BRANDING.colors.accent};
      font-family: ${MUSEUM_BRANDING.fonts.heading};
      font-size: 22px;
      margin-bottom: 15px;
    }
    
    .footer .contact-info {
      margin-top: 20px;
      font-size: 12px;
      opacity: 0.9;
    }
    
    @media print {
      body { margin: 0; }
      .header { page-break-after: avoid; }
      .section { page-break-inside: avoid; }
    }
  `;
}

// Generate header section
function generateHeader(report) {
  return `
    <div class="header">
      <div class="header-content">
        <h1>${MUSEUM_BRANDING.name}</h1>
        <div class="subtitle">${MUSEUM_BRANDING.subtitle}</div>
        <div class="brand-accent"></div>
        <div class="tagline">Museum Management System - Official Report</div>
        <p style="margin-top: 20px; font-size: 18px; font-weight: 500;">${report.title || 'AI Generated Report'}</p>
      </div>
    </div>
  `;
}

// Generate report information section
function generateReportInfo(report) {
  return `
    <div class="report-info">
      <h2>Report Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Report Type:</span>
          <span class="info-value">${report.report_type || 'Analysis'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Period:</span>
          <span class="info-value">${formatDate(report.start_date)} to ${formatDate(report.end_date)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Generated:</span>
          <span class="info-value">${report.created_at ? new Date(report.created_at).toLocaleString() : new Date().toLocaleString()}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Report ID:</span>
          <span class="info-value">#${report.id}</span>
        </div>
      </div>
    </div>
  `;
}

// Generate executive summary
function generateExecutiveSummary(aiInsights) {
  if (!aiInsights || !aiInsights.summary) return '';
  
  return `
    <div class="section">
      <h2>Executive Summary</h2>
      <div class="ai-insights">
        <p style="font-size: 16px; line-height: 1.8; color: ${MUSEUM_BRANDING.colors.text};">
          ${aiInsights.summary}
        </p>
      </div>
    </div>
  `;
}

// Generate key statistics
function generateKeyStatistics(reportData) {
  if (!reportData) return '';
  
  const stats = [];
  
  if (reportData.totalVisitors) {
    stats.push({ number: reportData.totalVisitors, label: 'Total Visitors' });
  }
  if (reportData.uniqueDays) {
    stats.push({ number: reportData.uniqueDays, label: 'Unique Days' });
  }
  if (reportData.avgVisitorsPerBooking) {
    stats.push({ number: reportData.avgVisitorsPerBooking.toFixed(1), label: 'Avg Visitors/Booking' });
  }
  if (reportData.totalDonations) {
    stats.push({ number: `$${reportData.totalDonations.toFixed(2)}`, label: 'Total Donations' });
  }
  
  // Cultural objects statistics
  if (reportData.totalObjects) {
    stats.push({ number: reportData.totalObjects, label: 'Total Objects' });
  }
  if (reportData.summary && reportData.summary.totalCategories) {
    stats.push({ number: reportData.summary.totalCategories, label: 'Categories' });
  }
  if (reportData.summary && reportData.summary.totalEstimatedValue) {
    stats.push({ number: `₱${reportData.summary.totalEstimatedValue.toLocaleString()}`, label: 'Total Value' });
  }
  if (reportData.categories && reportData.categories.length > 0) {
    stats.push({ number: reportData.categories.length, label: 'Active Categories' });
  }
  
  if (stats.length === 0) return '';
  
  const statsHTML = stats.map(stat => `
    <div class="stat-card">
      <div class="stat-number">${stat.number}</div>
      <div class="stat-label">${stat.label}</div>
    </div>
  `).join('');
  
  return `
    <div class="section">
      <h2>Key Statistics</h2>
      <div class="stats-grid">
        ${statsHTML}
      </div>
    </div>
  `;
}

// Generate detailed sections based on report type
function generateDetailedSections(reportData, reportType) {
  let sections = '';
  
  // Visitor details section
  if (reportData.visitorDetails && reportData.visitorDetails.length > 0) {
    sections += generateVisitorDetailsSection(reportData.visitorDetails);
  }
  
  // Demographics section
  if (reportData.demographics && reportData.demographics.length > 0) {
    sections += generateDemographicsSection(reportData.demographics);
  }
  
  // Time slots section
  if (reportData.timeSlots && reportData.timeSlots.length > 0) {
    sections += generateTimeSlotsSection(reportData.timeSlots);
  }
  
  // Cultural objects section
  if (reportData.objects && reportData.objects.length > 0) {
    sections += generateCulturalObjectsSection(reportData);
  }
  
  // Categories section for cultural objects
  if (reportData.categories && reportData.categories.length > 0) {
    sections += generateCategoriesSection(reportData.categories);
  }
  
  return sections;
}

// Generate visitor details section
function generateVisitorDetailsSection(visitorDetails) {
  const tableRows = visitorDetails.map(visitor => `
    <tr>
      <td>${visitor.visitor_id}</td>
      <td><strong>${visitor.first_name} ${visitor.last_name}</strong></td>
      <td>${visitor.gender}</td>
      <td>${visitor.visitor_type}</td>
      <td>${visitor.email}</td>
      <td>${visitor.purpose}</td>
      <td>${formatDate(visitor.visit_date)}</td>
      <td>${formatTime(visitor.scan_time)}</td>
      <td>${visitor.time_slot || 'N/A'}</td>
      <td>${visitor.booking_status || 'N/A'}</td>
    </tr>
  `).join('');
  
  return `
    <div class="section">
      <h2>Complete Visitor Information</h2>
      <p style="color: #666; margin-bottom: 20px; font-style: italic;">
        Detailed information for all visitors who entered the museum (based on QR scan check-in time)
      </p>
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
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;
}

// Generate demographics section
function generateDemographicsSection(demographics) {
  const tableRows = demographics.map(demo => {
    const percentage = demographics.reduce((sum, d) => sum + d.count, 0) > 0 ? 
      ((demo.count / demographics.reduce((sum, d) => sum + d.count, 0)) * 100).toFixed(1) : 0;
    return `
      <tr>
        <td>${demo.visitor_type}</td>
        <td>${demo.count}</td>
        <td>${percentage}%</td>
      </tr>
    `;
  }).join('');
  
  return `
    <div class="section">
      <h2>Visitor Demographics</h2>
      <div class="chart-section">
        <div class="chart-title">Visitor Type Distribution</div>
        <table class="visitor-table">
          <thead>
            <tr>
              <th>Visitor Type</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Generate time slots section
function generateTimeSlotsSection(timeSlots) {
  const tableRows = timeSlots.map(slot => {
    const percentage = timeSlots.reduce((sum, s) => sum + s.count, 0) > 0 ? 
      ((slot.count / timeSlots.reduce((sum, s) => sum + s.count, 0)) * 100).toFixed(1) : 0;
    return `
      <tr>
        <td>${slot.timeSlot}</td>
        <td>${slot.count}</td>
        <td>${percentage}%</td>
      </tr>
    `;
  }).join('');
  
  return `
    <div class="section">
      <h2>Popular Time Slots</h2>
      <div class="chart-section">
        <div class="chart-title">Visitor Distribution by Time Slot</div>
        <table class="visitor-table">
          <thead>
            <tr>
              <th>Time Slot</th>
              <th>Visitor Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Generate AI insights section
function generateAIInsights(aiInsights) {
  if (!aiInsights) return '';
  
  let insightsHTML = '';
  
  if (aiInsights.trends && aiInsights.trends.length > 0) {
    insightsHTML += `
      <h3>Key Trends</h3>
      ${aiInsights.trends.map(trend => `<div class="insight-item">${trend}</div>`).join('')}
    `;
  }
  
  if (aiInsights.recommendations && aiInsights.recommendations.length > 0) {
    insightsHTML += `
      <h3>Recommendations</h3>
      ${aiInsights.recommendations.map(rec => `<div class="insight-item">${rec}</div>`).join('')}
    `;
  }
  
  if (aiInsights.predictions && aiInsights.predictions.length > 0) {
    insightsHTML += `
      <h3>Predictions</h3>
      ${aiInsights.predictions.map(pred => `<div class="insight-item">${pred}</div>`).join('')}
    `;
  }
  
  if (insightsHTML === '') return '';
  
  return `
    <div class="section">
      <h2>AI-Powered Insights</h2>
      <div class="ai-insights">
        ${insightsHTML}
      </div>
    </div>
  `;
}

// Generate footer
function generateFooter() {
  return `
    <div class="footer">
      <div class="footer-content">
        <h3>${MUSEUM_BRANDING.name}</h3>
        <p><strong>${MUSEUM_BRANDING.subtitle} - AI-Powered Museum Management System</strong></p>
        <p>This report was generated automatically using AI analysis and contains comprehensive visitor data.</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <div class="contact-info">
          <p>📍 ${MUSEUM_BRANDING.contact.address} | 📧 ${MUSEUM_BRANDING.contact.email} | 🌐 ${MUSEUM_BRANDING.contact.website}</p>
        </div>
      </div>
    </div>
  `;
}

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
}

// Helper function to format time
function formatTime(dateString) {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
}

// Generate cultural objects section
function generateCulturalObjectsSection(reportData) {
  if (!reportData.objects || reportData.objects.length === 0) return '';
  
  const tableRows = reportData.objects.map(obj => `
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
  `).join('');
  
  return `
    <div class="section">
      <h2>Cultural Objects Inventory</h2>
      <p style="color: ${MUSEUM_BRANDING.colors.text}; margin-bottom: 20px;">
        Complete list of cultural objects in the museum collection
      </p>
      <div class="table-container">
        <table class="data-table">
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
            ${tableRows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Generate categories section
function generateCategoriesSection(categories) {
  if (!categories || categories.length === 0) return '';
  
  const tableRows = categories.map(category => `
    <tr>
      <td><strong>${category.category}</strong></td>
      <td>${category.count}</td>
      <td>₱${category.total_value ? parseFloat(category.total_value).toLocaleString() : '0'}</td>
    </tr>
  `).join('');
  
  return `
    <div class="section">
      <h2>Category Breakdown</h2>
      <p style="color: ${MUSEUM_BRANDING.colors.text}; margin-bottom: 20px;">
        Distribution of cultural objects by category
      </p>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Count</th>
              <th>Total Value</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

module.exports = {
  generateBrandedReportHTML,
  MUSEUM_BRANDING
};


