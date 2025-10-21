const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Function to convert logo images to base64
function getBase64Logo(filename) {
  try {
    const logoPath = path.join(__dirname, '../../Museoo/src/assets', filename);
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      return logoBuffer.toString('base64');
    }
  } catch (error) {
    console.error(`Error reading logo ${filename}:`, error);
  }
  return '';
}

// Generate clean visitor report PDF with professional layout
function generateCleanVisitorReportPDF(report) {
  // Parse the report data
  let reportData = {};
  if (report.data) {
    try {
      reportData = JSON.parse(report.data);
      console.log('📊 Visitor report data keys:', Object.keys(reportData));
      if (reportData.visitorDetails && reportData.visitorDetails.length > 0) {
        console.log('📊 Sample visitor data:', reportData.visitorDetails[0]);
        console.log('📊 Available fields:', Object.keys(reportData.visitorDetails[0]));
      }
    } catch (e) {
      console.error('Error parsing report data:', e);
    }
  }

  // Create simple, clean HTML content matching the first image layout
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Visitor Report - City Museum of Cagayan de Oro</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #000;
            line-height: 1.2;
            background: #ffffff;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        
        .seal {
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        
        .seal img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .museum-info {
            text-align: center;
            flex: 1;
            margin: 0 20px;
        }
        
        .museum-name {
            font-size: 24px;
            font-weight: bold;
            color: #000;
            margin-bottom: 5px;
        }
        
        .museum-address {
            font-size: 10px;
            color: #000;
            line-height: 1.2;
        }
        
        .city-logo {
            width: 120px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        
        .city-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .report-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            color: #000;
            margin: 20px 0;
        }
        
        .visitor-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            margin-top: 10px;
            font-size: 11px;
        }
        
        .visitor-table th {
            background: #fff;
            padding: 8px 6px;
            text-align: left;
            font-weight: bold;
            color: #000;
            border: 1px solid #000;
            font-size: 10px;
        }
        
        .visitor-table td {
            padding: 6px;
            border: 1px solid #000;
            color: #000;
            vertical-align: top;
        }
        
        .visitor-table tr:nth-child(even) {
            background: #fff;
        }
        
        .visitor-table tr:nth-child(odd) {
            background: #fff;
        }
        
        @media print {
            body { 
                margin: 0; 
                padding: 15px;
            }
            .header { 
                page-break-after: avoid; 
            }
            .visitor-table { 
                page-break-inside: avoid; 
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="seal">
            <img src="data:image/png;base64,${getBase64Logo('logo.png')}" alt="City Seal" />
        </div>
        
        <div class="museum-info">
            <div class="museum-name">City Museum of Cagayan de Oro</div>
            <div class="museum-address">
                Fernandez-Rizal Streets, Barangay 1, Old Water Tower/Tank,<br>
                near Gaston Park, Cagayan de Oro, Philippines
            </div>
        </div>
        
        <div class="city-logo">
            <img src="data:image/png;base64,${getBase64Logo('Logo_cagayan_de oro_city.png')}" alt="City Logo" />
        </div>
    </div>

    <div class="report-title">Visitor Report</div>

    ${reportData.visitorDetails && reportData.visitorDetails.length > 0 ? `
    <table class="visitor-table">
        <thead>
            <tr>
                <th>Name</th>
                <th>Gender</th>
                <th>Visitor Type</th>
                <th>Email</th>
                <th>Address</th>
                <th>Purpose of Visit</th>
                <th>Date of Visit</th>
            </tr>
        </thead>
        <tbody>
            ${reportData.visitorDetails.map(visitor => `
                <tr>
                    <td>${visitor.first_name} ${visitor.last_name}</td>
                    <td>${visitor.gender || ''}</td>
                    <td>${visitor.visitor_type || ''}</td>
                    <td>${visitor.email || ''}</td>
                    <td>${visitor.address || ''}</td>
                    <td>${visitor.purpose || ''}</td>
                    <td>${visitor.checkin_time ? new Date(visitor.checkin_time).toLocaleDateString() : (visitor.scan_time ? new Date(visitor.scan_time).toLocaleDateString() : (visitor.visit_date ? new Date(visitor.visit_date).toLocaleDateString() : 'No date'))}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    ` : `
    <table class="visitor-table">
        <thead>
            <tr>
                <th>Name</th>
                <th>Gender</th>
                <th>Visitor Type</th>
                <th>Email</th>
                <th>Address</th>
                <th>Purpose of Visit</th>
                <th>Date of Visit</th>
            </tr>
        </thead>
        <tbody>
            <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
            <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
            <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
        </tbody>
    </table>
    `}
</body>
</html>
`;

  return htmlContent;
}

// Generate PDF from HTML content
async function generatePDFFromHTML(htmlContent, outputPath) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    });
    
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  generateCleanVisitorReportPDF,
  generatePDFFromHTML
};
