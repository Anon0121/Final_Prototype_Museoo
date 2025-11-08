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

// Function to convert image file path to base64
async function getBase64Image(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return null;
    }
    
    const imageBuffer = fs.readFileSync(filePath);
    const mimeType = path.extname(filePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error reading image file:', filePath, error);
    return null;
  }
}

// Generate Loan Artifact Donation Report HTML WITHOUT base64 images (for database storage)
async function generateLoanArtifactDonationReportPDFSimple(report) {
  // Parse the report data
  let reportData = {};
  if (report.data) {
    try {
      reportData = JSON.parse(report.data);
    } catch (e) {
      console.error('Error parsing loan artifact donation report data:', e);
    }
  }

  // Filter to only loan artifact donations
  let donations = (reportData.donations || []).filter(d => d.type === 'loan');
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Donation Loan Artifact List - Cagayan de Oro City Museum</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: white; padding: 20px; }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; }
        .seal { width: 80px; height: 80px; flex-shrink: 0; }
        .seal img { width: 100%; height: 100%; object-fit: contain; }
        .museum-info { text-align: center; flex: 1; margin: 0 20px; }
        .museum-name { font-size: 24px; font-weight: bold; color: #000; margin-bottom: 8px; }
        .museum-address { font-size: 14px; color: #000; }
        .city-logo { width: 80px; height: 80px; flex-shrink: 0; }
        .city-logo img { width: 100%; height: 100%; object-fit: contain; }
        .report-title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #000; }
        .total-artifact { text-align: right; font-size: 14px; font-weight: bold; margin-bottom: 40px; color: #666; padding-right: 20px; }
        .donation-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .donation-table th { background-color: #f8f9fa; border: 1px solid #000; padding: 12px 8px; text-align: center; font-weight: bold; font-size: 14px; color: #000; }
        .donation-table td { border: 1px solid #000; padding: 10px 8px; text-align: left; font-size: 13px; color: #000; }
        .donation-table tr:nth-child(even) { background-color: #f9f9f9; }
        .donation-table tr:nth-child(odd) { background-color: #fff; }
        .artifact-cell { text-align: center; }
        @media print { body { margin: 0; padding: 15px; } .donation-table { page-break-inside: avoid; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="seal">
            <img src="/assets/logo.png" alt="City Seal" />
        </div>
        <div class="museum-info">
            <div class="museum-name">Cagayan de Oro City Museum</div>
            <div class="museum-address">Fernandez-Rizal Streets, Barangay 1, Old Water Tower/Tank, near Gaston Park, Cagayan de Oro, Philippines</div>
        </div>
        <div class="city-logo">
            <img src="/assets/Logo_cagayan_de oro_city.png" alt="City Logo" />
        </div>
    </div>

    <div class="report-title">Donation Loan Artifact List</div>
    <div class="total-artifact">Total Loan Artifact: ${donations.length} items</div>

    <table class="donation-table">
        <thead>
            <tr>
                <th>Donor Name</th>
                <th>Email</th>
                <th>Donation (IMAGE)</th>
                <th>Date Donated</th>
            </tr>
        </thead>
        <tbody>
            ${donations && donations.length > 0 ? 
              donations.map(donation => `
                <tr>
                    <td>${donation.donor_name || donation.name || 'N/A'}</td>
                    <td>${donation.email || 'N/A'}</td>
                    <td class="artifact-cell">[IMAGE]</td>
                    <td>${donation.completion_date ? new Date(donation.completion_date).toLocaleDateString() : 
                        donation.date_received ? new Date(donation.date_received).toLocaleDateString() : 'N/A'}</td>
                </tr>
              `).join('') : 
              '<tr><td colspan="4" style="text-align: center; font-style: italic;">No loan artifact donations found for the selected period.</td></tr>'
            }
        </tbody>
    </table>
</body>
</html>`;

  return htmlContent;
}

// Generate Loan Artifact Donation Report PDF (WITH base64 images for PDF)
async function generateLoanArtifactDonationReportPDF(report) {
  // Parse the report data
  let reportData = {};
  if (report.data) {
    try {
      reportData = JSON.parse(report.data);
      console.log('📊 Loan artifact donation report data keys:', Object.keys(reportData));
    } catch (e) {
      console.error('Error parsing loan artifact donation report data:', e);
    }
  }

  // Filter to only loan artifact donations
  let donations = (reportData.donations || []).filter(d => d.type === 'loan');
  
  console.log('📦 Processing loan artifact donations:', donations.length);
  
  // Process images for donations that have image paths
  for (let donation of donations) {
    if (donation.image_path) {
      try {
        donation.image_url = await getBase64Image(donation.image_path);
      } catch (error) {
        console.error('Error processing image for donation', donation.id, ':', error);
        donation.image_url = null;
      }
    }
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Donation Loan Artifact List - Cagayan de Oro City Museum</title>
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
        
        .total-artifact {
            text-align: right;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 40px;
            color: #666;
            padding-right: 20px;
        }
        
        .donation-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .donation-table th {
            background-color: #f8f9fa;
            border: 1px solid #000;
            padding: 12px 8px;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            color: #000;
        }
        
        .donation-table td {
            border: 1px solid #000;
            padding: 10px 8px;
            text-align: left;
            font-size: 13px;
            color: #000;
        }
        
        .donation-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .donation-table tr:nth-child(odd) {
            background-color: #fff;
        }
        
        .artifact-cell {
            text-align: center;
        }
        
        .artifact-image {
            width: 50px;
            height: 50px;
            object-fit: cover;
            border-radius: 4px;
        }
        
        @media print {
            body { margin: 0; padding: 15px; }
            .donation-table { page-break-inside: avoid; }
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
            <div class="museum-address">Fernandez-Rizal Streets, Barangay 1, Old Water Tower/Tank, near Gaston Park, Cagayan de Oro, Philippines</div>
        </div>
        <div class="city-logo">
            <img src="data:image/png;base64,${getBase64Logo('Logo_cagayan_de oro_city.png')}" alt="City Logo" />
        </div>
    </div>

    <div class="report-title">Donation Loan Artifact List</div>
    <div class="total-artifact">Total Artifact: ${donations.length}</div>

    <table class="donation-table">
        <thead>
            <tr>
                <th>Donor Name</th>
                <th>Email</th>
                <th>Date Loaned</th>
                <th>Donation (IMAGE)</th>
                <th>Date Donated</th>
            </tr>
        </thead>
        <tbody>
            ${donations && donations.length > 0 ? 
              donations.map(donation => `
                <tr>
                    <td>${donation.donor_name || donation.name || 'N/A'}</td>
                    <td>${donation.email || 'N/A'}</td>
                    <td>${donation.loan_start_date && donation.loan_end_date ? 
                        `${new Date(donation.loan_start_date).toLocaleDateString()} - ${new Date(donation.loan_end_date).toLocaleDateString()}` :
                        donation.loan_start_date ? new Date(donation.loan_start_date).toLocaleDateString() :
                        donation.loan_date ? new Date(donation.loan_date).toLocaleDateString() : 'N/A'}</td>
                    <td class="artifact-cell">
                        ${donation.image_url ? 
                          `<img src="${donation.image_url}" alt="Artifact" class="artifact-image" />` : 
                          'No Image'
                        }
                    </td>
                    <td>${donation.completion_date ? new Date(donation.completion_date).toLocaleDateString() : 
                        donation.date_received ? new Date(donation.date_received).toLocaleDateString() : 'N/A'}</td>
                </tr>
              `).join('') : 
              '<tr><td colspan="5" style="text-align: center; font-style: italic;">No loan artifact donations found for the selected period.</td></tr>'
            }
        </tbody>
    </table>
</body>
</html>`;

  return htmlContent;
}

module.exports = {
  generateLoanArtifactDonationReportPDF, // Full version with base64 images for PDF
  generateLoanArtifactDonationReportPDFSimple // Simple version without base64 for database
};
