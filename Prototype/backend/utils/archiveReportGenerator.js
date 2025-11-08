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

// Helper function to format dates nicely
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    // Format as: Month Day, Year (e.g., "October 27, 2025")
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (e) {
    return dateString;
  }
}

// Generate Archive Report PDF
function generateArchiveReportPDF(report) {
  // Parse the report data
  let reportData = {};
  if (report.data) {
    try {
      reportData = JSON.parse(report.data);
      console.log('📊 Archive report data keys:', Object.keys(reportData));
    } catch (e) {
      console.error('Error parsing archive report data:', e);
    }
  }

  const archives = reportData.archives || [];
  const totalArchives = archives.length;
  const categories = reportData.categories || [];

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Archive List - Cagayan de Oro City Museum</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 20px;
        }
        
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        
        .seal {
            width: 80px;
            height: 80px;
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
            margin-bottom: 8px;
        }
        
        .museum-address {
            font-size: 14px;
            color: #000;
        }
        
        .city-logo {
            width: 80px;
            height: 80px;
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
            margin-bottom: 20px;
            color: #000;
        }
        
        .total-archives {
            text-align: right;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 40px;
            color: #666;
            padding-right: 20px;
        }
        
        .archive-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .archive-table th {
            background-color: #f8f9fa;
            border: 1px solid #000;
            padding: 12px 8px;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            color: #000;
        }
        
        .archive-table td {
            border: 1px solid #000;
            padding: 10px 8px;
            text-align: left;
            font-size: 13px;
            color: #000;
        }
        
        .archive-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .archive-table tr:nth-child(odd) {
            background-color: #fff;
        }
        
        @media print {
            body { margin: 0; padding: 15px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="seal">
            <img src="data:image/png;base64,${getBase64Logo('logo.png')}" alt="City Seal" />
        </div>
        <div class="museum-info">
            <div class="museum-name">Cagayan de Oro City Museum</div>
            <div class="museum-address">
                Fernandez-Rizal Streets, Barangay 1, Old Water Tower/Tank, near Gaston Park, Cagayan de Oro, Philippines
            </div>
        </div>
        <div class="city-logo">
            <img src="data:image/png;base64,${getBase64Logo('Logo_cagayan_de oro_city.png')}" alt="City Logo" />
        </div>
    </div>

    <div class="report-title">Archive List</div>
    <div class="total-archives">Total Archive: ${totalArchives}</div>

    <table class="archive-table">
        <thead>
            <tr>
                <th>Archive File Name</th>
                <th>Type File</th>
                <th>Category</th>
                <th>Acquisition Date</th>
                <th>Date Uploaded</th>
            </tr>
        </thead>
        <tbody>
            ${archives && archives.length > 0 ? 
              archives.map(archive => `
                <tr>
                    <td>${archive.title || archive.filename || 'Archive File'}</td>
                    <td>${archive.type || archive.file_type || 'File Type'}</td>
                    <td>${archive.category || 'Archive Category'}</td>
                    <td>${formatDate(archive.date || archive.archive_date)}</td>
                    <td>${formatDate(archive.created_at)}</td>
                </tr>
              `).join('') : 
              '<tr><td colspan="5" style="text-align: center; font-style: italic;">No archive items found for the selected period.</td></tr>'
            }
        </tbody>
    </table>
</body>
</html>`;

  return htmlContent;
}

module.exports = {
  generateArchiveReportPDF
};