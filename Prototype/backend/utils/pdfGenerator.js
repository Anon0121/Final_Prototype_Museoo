const fs = require('fs');
const path = require('path');
const { generateCleanVisitorReportPDF } = require('./cleanVisitorReportGenerator');

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

// Generate comprehensive PDF content from report data
function generateReportPDF(report) {
  // Check if this is a visitor report and use clean template
  if (report.type === 'visitor_analytics' || report.title?.toLowerCase().includes('visitor')) {
    return generateCleanVisitorReportPDF(report);
  }

  // Parse the report data
  let reportData = {};
  if (report.data) {
    try {
      reportData = JSON.parse(report.data);
    } catch (e) {
      console.error('Error parsing report data:', e);
    }
  }

  // Create comprehensive HTML content for PDF with Museum Branding
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${report.title || 'Museum Report'}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            color: #351E10;
            line-height: 1.6;
            background: #f8f9fa;
        }
        
        .header {
            text-align: center;
            background: linear-gradient(135deg, #351E10 0%, #2A1A0D 50%, #1A0F08 100%);
            color: white;
            padding: 40px 30px;
            border-radius: 15px;
            margin-bottom: 30px;
            position: relative;
            overflow: hidden;
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
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header .subtitle {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 12px;
            color: #E5B80B;
        }
        
        .header .tagline {
            font-size: 14px;
            opacity: 0.9;
            font-style: italic;
        }
        
        .brand-accent {
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, #E5B80B 0%, #D4AF37 100%);
            margin: 15px auto;
            border-radius: 2px;
        }
        .report-info {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
            border-left: 5px solid #E5B80B;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        
        .report-info h2 {
            margin: 0 0 20px 0;
            color: #351E10;
            font-size: 22px;
            font-weight: 600;
            font-family: 'Playfair Display', serif;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .info-label {
            font-weight: bold;
            color: #666;
        }
        .info-value {
            color: #333;
        }
        .section {
            margin-bottom: 35px;
        }
        
        .section h2 {
            color: #351E10;
            font-size: 24px;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 3px solid #E5B80B;
            font-family: 'Playfair Display', serif;
            font-weight: 600;
            position: relative;
        }
        
        .section h2::after {
            content: '';
            position: absolute;
            bottom: -3px;
            left: 0;
            width: 50px;
            height: 3px;
            background: linear-gradient(90deg, #E5B80B 0%, #D4AF37 100%);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 25px;
            margin-bottom: 35px;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border: 2px solid #E5B80B;
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            box-shadow: 0 8px 25px rgba(53, 30, 16, 0.1);
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
            height: 4px;
            background: linear-gradient(90deg, #E5B80B 0%, #D4AF37 100%);
        }
        
        .stat-number {
            font-size: 36px;
            font-weight: 800;
            color: #351E10;
            margin-bottom: 8px;
            font-family: 'Inter', sans-serif;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        
        .stat-label {
            color: #666;
            font-size: 14px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .visitor-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 13px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }
        
        .visitor-table th {
            background: linear-gradient(135deg, #351E10 0%, #2A1A0D 100%);
            padding: 15px 12px;
            text-align: left;
            font-weight: 600;
            color: white;
            border-bottom: 3px solid #E5B80B;
            font-family: 'Inter', sans-serif;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 12px;
        }
        
        .visitor-table td {
            padding: 12px;
            border-bottom: 1px solid #f0f0f0;
            color: #351E10;
            font-weight: 400;
        }
        
        .visitor-table tr:nth-child(even) {
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        }
        
        .visitor-table tr:nth-child(odd) {
            background: #ffffff;
        }
        
        .visitor-table tr:hover {
            background: linear-gradient(135deg, #E5B80B 0%, #D4AF37 100%);
            color: white;
        }
        .chart-section {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border: 2px solid #E5B80B;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.08);
        }
        
        .chart-title {
            font-size: 20px;
            font-weight: 600;
            color: #351E10;
            margin-bottom: 20px;
            font-family: 'Playfair Display', serif;
            border-bottom: 2px solid #E5B80B;
            padding-bottom: 10px;
        }
        
        .chart-placeholder {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border: 2px dashed #E5B80B;
            border-radius: 12px;
            padding: 50px;
            text-align: center;
            color: #666;
            font-style: italic;
        }
        
        .footer {
            text-align: center;
            margin-top: 50px;
            padding: 30px;
            background: linear-gradient(135deg, #351E10 0%, #2A1A0D 100%);
            border-radius: 15px;
            color: white;
            font-size: 13px;
            position: relative;
            overflow: hidden;
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
            color: #E5B80B;
            font-family: 'Playfair Display', serif;
            font-size: 18px;
            margin-bottom: 10px;
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
        <div class="header-content">
            <h1>City Museum of Cagayan de Oro</h1>
            <div class="subtitle">Heritage Studies Center</div>
            <div class="brand-accent"></div>
            <div class="tagline">Museum Management System - Official Report</div>
            <p style="margin-top: 15px; font-size: 16px; font-weight: 500;">${report.title || 'AI Generated Report'}</p>
        </div>
    </div>

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
                <span class="info-label">Total Visitors:</span>
                <span class="info-value">${reportData.totalVisitors || 0}</span>
            </div>
        </div>
    </div>

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

    ${reportData.demographics && reportData.demographics.length > 0 ? `
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
                    ${reportData.demographics.map(demo => {
                        const percentage = reportData.totalVisitors > 0 ? ((demo.count / reportData.totalVisitors) * 100).toFixed(1) : 0;
                        return `
                            <tr>
                                <td>${demo.visitor_type}</td>
                                <td>${demo.count}</td>
                                <td>${percentage}%</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    </div>
    ` : ''}

    ${reportData.timeSlots && reportData.timeSlots.length > 0 ? `
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
                    ${reportData.timeSlots.map(slot => {
                        const percentage = reportData.totalVisitors > 0 ? ((slot.count / reportData.totalVisitors) * 100).toFixed(1) : 0;
                        return `
                            <tr>
                                <td>${slot.timeSlot}</td>
                                <td>${slot.count}</td>
                                <td>${percentage}%</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    </div>
    ` : ''}

    ${reportData.visitorDetails && reportData.visitorDetails.length > 0 ? `
    <div class="section">
        <h2>Complete Visitor Information</h2>
        <p style="color: #666; margin-bottom: 15px; font-style: italic;">
            Detailed information for all visitors who entered the museum (based on QR scan check-in time)
        </p>
        <table class="visitor-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Gender</th>
                    <th>Visitor Type</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Purpose of Visit</th>
                    <th>Institution</th>
                    <th>Time & Date Visited</th>
                </tr>
            </thead>
            <tbody>
                ${reportData.visitorDetails.map(visitor => `
                    <tr>
                        <td><strong>${visitor.first_name} ${visitor.last_name}</strong></td>
                        <td>${visitor.gender}</td>
                        <td>${visitor.visitor_type}</td>
                        <td>${visitor.email}</td>
                        <td>${visitor.address || 'N/A'}</td>
                        <td>${visitor.purpose}</td>
                        <td>${visitor.institution || 'N/A'}</td>
                        <td>${new Date(visitor.checkin_time || visitor.scan_time).toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="footer">
        <div class="footer-content">
            <h3>City Museum of Cagayan de Oro</h3>
            <p><strong>Heritage Studies Center - AI-Powered Museum Management System</strong></p>
            <p>This report was generated automatically using AI analysis and contains comprehensive visitor data.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <div style="margin-top: 15px; font-size: 11px; opacity: 0.8;">
                <p>📍 Cagayan de Oro City, Philippines | 📧 info@cdomuseum.gov.ph | 🌐 www.cdomuseum.gov.ph</p>
            </div>
        </div>
    </div>
</body>
</html>
  `;

  // For now, return the HTML content as a buffer
  // In a production environment, you would convert this HTML to PDF using a library like puppeteer
  return Buffer.from(htmlContent, 'utf8');
}

module.exports = {
  generateReportPDF
}; 