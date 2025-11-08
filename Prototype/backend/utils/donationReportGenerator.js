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

// Generate Donation Report HTML WITHOUT base64 images (for database storage)
async function generateDonationReportPDFSimple(report) {
  // Parse the report data
  let reportData = {};
  if (report.data) {
    try {
      reportData = JSON.parse(report.data);
    } catch (e) {
      console.error('Error parsing donation report data:', e);
    }
  }

  let donations = reportData.donations || [];
  
  // Determine report type based on donation type or report title
  const isAllTypesReport = reportData.donationType === 'all' || 
                          report.title?.toLowerCase().includes('all') ||
                          (reportData.donationType !== 'artifact' && reportData.donationType !== 'monetary' && reportData.donationType !== 'loan' && !report.title?.toLowerCase().includes('monetary') && !report.title?.toLowerCase().includes('artifact') && !report.title?.toLowerCase().includes('loan'));
  
  const isArtifactReport = report.title?.toLowerCase().includes('artifact') || 
                          reportData.donationType === 'artifact' ||
                          donations.some(d => d.type === 'artifact' || d.type === 'donated');
  
  const isMonetaryReport = report.title?.toLowerCase().includes('monetary') || 
                          reportData.donationType === 'monetary' ||
                          donations.some(d => d.type === 'monetary');
  
  const isLoanReport = report.title?.toLowerCase().includes('loan') || 
                      reportData.donationType === 'loan' ||
                      donations.some(d => d.type === 'loan');
  
  const isSingleTypeReport = !isAllTypesReport;

  // Filter donations for single-type reports
  if (isSingleTypeReport) {
    if (isArtifactReport) {
      donations = donations.filter(d => d.type === 'artifact' || d.type === 'donated');
    } else if (isMonetaryReport) {
      donations = donations.filter(d => d.type === 'monetary');
    } else if (isLoanReport) {
      donations = donations.filter(d => d.type === 'loan');
    }
  }

  // Separate donations by type for all types report
  let monetaryDonations = [];
  let artifactDonations = [];
  let loanDonations = [];
  let totalAmount = 0;
  let totalCount = donations.length;

  if (isAllTypesReport) {
    monetaryDonations = donations.filter(d => d.type === 'monetary');
    artifactDonations = donations.filter(d => d.type === 'artifact' || d.type === 'donated');
    loanDonations = donations.filter(d => d.type === 'loan');
    
    totalAmount = monetaryDonations.reduce((sum, donation) => {
      const amount = parseFloat(donation.amount) || 0;
      return sum + amount;
    }, 0);
  } else {
    if (isMonetaryReport) {
      totalAmount = donations.reduce((sum, donation) => {
        const amount = parseFloat(donation.amount) || 0;
        return sum + amount;
      }, 0);
    }
  }

  // Generate appropriate title based on report type
  let reportTitle = 'Donation List';
  if (isArtifactReport && isSingleTypeReport) {
    reportTitle = 'Donation Artifact List';
  } else if (isMonetaryReport && isSingleTypeReport) {
    reportTitle = 'Donation Monetary List';
  } else if (isLoanReport && isSingleTypeReport) {
    reportTitle = 'Donation Loan Artifact List';
  }

  // Generate total section
  let totalSection = '';
  if (isArtifactReport && isSingleTypeReport) {
    totalSection = `<div class="total-monetary">Total Artifact: ${donations.length}</div>`;
  } else if (isMonetaryReport && isSingleTypeReport) {
    totalSection = `<div class="total-monetary">Total Monetary: ${donations.length}</div>`;
  } else if (isLoanReport && isSingleTypeReport) {
    totalSection = `<div class="total-monetary">Total Artifact: ${donations.length}</div>`;
  } else {
    totalSection = `<div class="total-monetary">Total Donation: ${donations.length}</div>`;
  }

  // Generate table content (simplified - no base64 images)
  let tableContent = '';
  
  if (isAllTypesReport) {
    tableContent = `
      <div class="donation-section">
        <h3 class="section-title">Monetary</h3>
        <table class="donation-table">
          <thead>
            <tr>
              <th>Donor Name</th>
              <th>Email</th>
              <th>Donation (Cash)</th>
              <th>Date Donated</th>
            </tr>
          </thead>
          <tbody>
            ${monetaryDonations && monetaryDonations.length > 0 ? 
              monetaryDonations.map(donation => `
                <tr>
                  <td>${donation.donor_name || donation.name || 'N/A'}</td>
                  <td>${donation.email || 'N/A'}</td>
                  <td>₱${donation.amount ? parseFloat(donation.amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                  <td>${donation.completion_date ? new Date(donation.completion_date).toLocaleDateString() : donation.date_received ? new Date(donation.date_received).toLocaleDateString() : 'N/A'}</td>
                </tr>
              `).join('') : 
              '<tr><td colspan="4" style="text-align: center; font-style: italic;">No monetary donations found.</td></tr>'
            }
          </tbody>
        </table>
        <div class="total-monetary-summary">
          <strong>Total Monetary: ₱${totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </div>
      </div>
      <div class="donation-section">
        <h3 class="section-title">Artifact</h3>
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
            ${artifactDonations && artifactDonations.length > 0 ? 
              artifactDonations.map(donation => `
                <tr>
                  <td>${donation.donor_name || donation.name || 'N/A'}</td>
                  <td>${donation.email || 'N/A'}</td>
                  <td class="artifact-cell">[IMAGE]</td>
                  <td>${donation.completion_date ? new Date(donation.completion_date).toLocaleDateString() : donation.date_received ? new Date(donation.date_received).toLocaleDateString() : 'N/A'}</td>
                </tr>
              `).join('') : 
              '<tr><td colspan="4" style="text-align: center; font-style: italic;">No artifact donations found.</td></tr>'
            }
          </tbody>
        </table>
      </div>
      <div class="donation-section">
        <h3 class="section-title">Loan Artifact</h3>
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
            ${loanDonations && loanDonations.length > 0 ? 
              loanDonations.map(donation => `
                <tr>
                  <td>${donation.donor_name || donation.name || 'N/A'}</td>
                  <td>${donation.email || 'N/A'}</td>
                  <td class="artifact-cell">[IMAGE]</td>
                  <td>${donation.completion_date ? new Date(donation.completion_date).toLocaleDateString() : donation.date_received ? new Date(donation.date_received).toLocaleDateString() : 'N/A'}</td>
                </tr>
              `).join('') : 
              '<tr><td colspan="4" style="text-align: center; font-style: italic;">No loan artifact donations found.</td></tr>'
            }
          </tbody>
        </table>
      </div>
    `;
  } else {
    // Single type report
    const hasImages = isArtifactReport || isLoanReport;
    tableContent = `
      <table class="donation-table">
        <thead>
          <tr>
            <th>Donor Name</th>
            <th>Email</th>
            <th>${hasImages ? 'Donation (IMAGE)' : 'Donation (Cash)'}</th>
            <th>Date Donated</th>
          </tr>
        </thead>
        <tbody>
          ${donations && donations.length > 0 ? 
            donations.map(donation => `
              <tr>
                <td>${donation.donor_name || donation.name || 'N/A'}</td>
                <td>${donation.email || 'N/A'}</td>
                <td class="${hasImages ? 'artifact-cell' : ''}">${hasImages ? '[IMAGE]' : (donation.amount ? '₱' + parseFloat(donation.amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A')}</td>
                <td>${donation.completion_date ? new Date(donation.completion_date).toLocaleDateString() : donation.date_received ? new Date(donation.date_received).toLocaleDateString() : 'N/A'}</td>
              </tr>
            `).join('') : 
            '<tr><td colspan="4" style="text-align: center; font-style: italic;">No donations found for the selected period.</td></tr>'
          }
        </tbody>
      </table>
    `;
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${reportTitle} - Cagayan de Oro City Museum</title>
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
        .total-monetary { text-align: right; font-size: 14px; font-weight: bold; margin-bottom: 40px; color: #666; padding-right: 20px; }
        .total-monetary-summary { text-align: right; font-size: 14px; font-weight: bold; margin-top: 15px; margin-bottom: 30px; color: #333; padding-right: 20px; }
        .total-monetary-summary .donation-count { font-weight: normal; color: #666; margin-left: 10px; }
        .donation-section { margin-bottom: 40px; }
        .section-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #000; }
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

    <div class="report-title">${reportTitle}</div>
    ${totalSection}
    ${tableContent}
</body>
</html>`;

  return htmlContent;
}

// Generate Donation Report PDF (WITH base64 images for PDF)
async function generateDonationReportPDF(report) {
  // Parse the report data
  let reportData = {};
  if (report.data) {
    try {
      reportData = JSON.parse(report.data);
      console.log('📊 Donation report data keys:', Object.keys(reportData));
    } catch (e) {
      console.error('Error parsing donation report data:', e);
    }
  }

  let donations = reportData.donations || [];
  
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
  
  // Determine report type based on donation type or report title
  const isAllTypesReport = reportData.donationType === 'all' || 
                          report.title?.toLowerCase().includes('all') ||
                          (reportData.donationType !== 'artifact' && reportData.donationType !== 'monetary' && reportData.donationType !== 'loan' && !report.title?.toLowerCase().includes('monetary') && !report.title?.toLowerCase().includes('artifact') && !report.title?.toLowerCase().includes('loan'));
  
  const isArtifactReport = report.title?.toLowerCase().includes('artifact') || 
                          reportData.donationType === 'artifact' ||
                          donations.some(d => d.type === 'artifact' || d.type === 'donated');
  
  const isMonetaryReport = report.title?.toLowerCase().includes('monetary') || 
                          reportData.donationType === 'monetary' ||
                          donations.some(d => d.type === 'monetary');
  
  const isLoanReport = report.title?.toLowerCase().includes('loan') || 
                      reportData.donationType === 'loan' ||
                      donations.some(d => d.type === 'loan');
  
  // Check if this is a single-type report (not all types)
  const isSingleTypeReport = !isAllTypesReport;

  // Filter donations for single-type reports
  if (isSingleTypeReport) {
    if (isArtifactReport) {
      donations = donations.filter(d => d.type === 'artifact' || d.type === 'donated');
      console.log('🎯 Filtered donations for artifact report:', donations.length);
    } else if (isMonetaryReport) {
      donations = donations.filter(d => d.type === 'monetary');
      console.log('💰 Filtered donations for monetary report:', donations.length);
    } else if (isLoanReport) {
      donations = donations.filter(d => d.type === 'loan');
      console.log('📦 Filtered donations for loan report:', donations.length);
    }
  }

  // Debug logging
  console.log('🔍 Report type detection:', {
    reportTitle: report.title,
    donationType: reportData.donationType,
    isAllTypesReport,
    isArtifactReport,
    isMonetaryReport,
    isLoanReport,
    isSingleTypeReport,
    donationsCount: donations.length
  });

  // Separate donations by type for all types report
  let monetaryDonations = [];
  let artifactDonations = [];
  let loanDonations = [];
  let totalAmount = 0;
  let totalCount = donations.length;

  if (isAllTypesReport) {
    monetaryDonations = donations.filter(d => d.type === 'monetary');
    artifactDonations = donations.filter(d => d.type === 'artifact' || d.type === 'donated');
    loanDonations = donations.filter(d => d.type === 'loan');
    
    totalAmount = monetaryDonations.reduce((sum, donation) => {
      const amount = parseFloat(donation.amount) || 0;
      return sum + amount;
    }, 0);
  } else {
    if (isMonetaryReport) {
      totalAmount = donations.reduce((sum, donation) => {
        const amount = parseFloat(donation.amount) || 0;
        return sum + amount;
      }, 0);
    }
  }

  // Generate appropriate title based on report type
  let reportTitle = 'Donation List';
  if (isArtifactReport && isSingleTypeReport) {
    reportTitle = 'Donation Artifact List';
  } else if (isMonetaryReport && isSingleTypeReport) {
    reportTitle = 'Donation Monetary List';
  } else if (isLoanReport && isSingleTypeReport) {
    reportTitle = 'Donation Loan Artifact List';
  }

  // Generate total section based on report type
  let totalSection = '';
  if (isArtifactReport && isSingleTypeReport) {
    totalSection = `<div class="total-monetary">Total Artifact: ${donations.length}</div>`;
    console.log('🎯 Generated Total Artifact section for single-type artifact report');
  } else if (isMonetaryReport && isSingleTypeReport) {
    totalSection = `<div class="total-monetary">Total Monetary: ${donations.length}</div>`;
    console.log('💰 Generated Total Monetary section for single-type monetary report');
  } else if (isLoanReport && isSingleTypeReport) {
    totalSection = `<div class="total-monetary">Total Artifact: ${donations.length}</div>`;
    console.log('📦 Generated Total Artifact section for single-type loan report');
  } else {
    totalSection = `<div class="total-monetary">Total Donation: ${donations.length}</div>`;
    console.log('📊 Generated Total Donation section for all-types report');
  }

  // Generate table content based on report type
  let tableContent = '';
  
  if (isAllTypesReport) {
    // All types report with multiple sections
    tableContent = `
      <!-- Monetary Section -->
      <div class="donation-section">
        <h3 class="section-title">Monetary</h3>
        <table class="donation-table">
          <thead>
            <tr>
              <th>Donor Name</th>
              <th>Email</th>
              <th>Donation (Cash)</th>
              <th>Date Donated</th>
            </tr>
          </thead>
          <tbody>
            ${monetaryDonations && monetaryDonations.length > 0 ? 
              monetaryDonations.map(donation => `
                <tr>
                  <td>${donation.donor_name || donation.name || 'N/A'}</td>
                  <td>${donation.email || 'N/A'}</td>
                  <td class="amount-cell">₱${(parseFloat(donation.amount) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>${donation.completion_date ? new Date(donation.completion_date).toLocaleDateString() : 
                      donation.date_received ? new Date(donation.date_received).toLocaleDateString() : 'N/A'}</td>
                </tr>
              `).join('') : 
              '<tr><td colspan="4" style="text-align: center; font-style: italic;">No monetary donations found.</td></tr>'
            }
          </tbody>
        </table>
        <div class="total-monetary-summary">
          <strong>Total Monetary: ₱${totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </div>
      </div>

      <!-- Artifact Section -->
      <div class="donation-section">
        <h3 class="section-title">Artifact</h3>
        <table class="donation-table">
          <thead>
            <tr>
              <th>Donor Name</th>
              <th>Email</th>
              <th>Artifact (Image)</th>
              <th>Date Donated</th>
            </tr>
          </thead>
          <tbody>
            ${artifactDonations && artifactDonations.length > 0 ? 
              artifactDonations.map(donation => `
                <tr>
                  <td>${donation.donor_name || donation.name || 'N/A'}</td>
                  <td>${donation.email || 'N/A'}</td>
                  <td class="artifact-cell">
                    ${donation.image_url ? 
                      `<img src="${donation.image_url}" alt="Artifact" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" />` : 
                      'No Image'
                    }
                  </td>
                  <td>${donation.completion_date ? new Date(donation.completion_date).toLocaleDateString() : 
                      donation.date_received ? new Date(donation.date_received).toLocaleDateString() : 'N/A'}</td>
                </tr>
              `).join('') : 
              '<tr><td colspan="4" style="text-align: center; font-style: italic;">No artifact donations found.</td></tr>'
            }
          </tbody>
        </table>
      </div>

      <!-- Loan Artifact Section -->
      <div class="donation-section">
        <h3 class="section-title">Loaned Artifact</h3>
        <table class="donation-table">
          <thead>
            <tr>
              <th>Donor Name</th>
              <th>Email</th>
              <th>Date Loaned</th>
              <th>Artifact (Image)</th>
              <th>Date Donated</th>
            </tr>
          </thead>
          <tbody>
            ${loanDonations && loanDonations.length > 0 ? 
              loanDonations.map(donation => `
                <tr>
                  <td>${donation.donor_name || donation.name || 'N/A'}</td>
                  <td>${donation.email || 'N/A'}</td>
                  <td>${donation.loan_start_date && donation.loan_end_date ? 
                      `${new Date(donation.loan_start_date).toLocaleDateString()} - ${new Date(donation.loan_end_date).toLocaleDateString()}` :
                      donation.loan_start_date ? new Date(donation.loan_start_date).toLocaleDateString() :
                      donation.loan_date ? new Date(donation.loan_date).toLocaleDateString() : 'N/A'}</td>
                  <td class="artifact-cell">
                    ${donation.image_url ? 
                      `<img src="${donation.image_url}" alt="Artifact" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" />` : 
                      'No Image'
                    }
                  </td>
                  <td>${donation.completion_date ? new Date(donation.completion_date).toLocaleDateString() : 
                      donation.date_received ? new Date(donation.date_received).toLocaleDateString() : 'N/A'}</td>
                </tr>
              `).join('') : 
              '<tr><td colspan="5" style="text-align: center; font-style: italic;">No loaned artifacts found.</td></tr>'
            }
          </tbody>
        </table>
      </div>
    `;
  } else {
    // Single type report
    tableContent = `
      <table class="donation-table">
        <thead>
          <tr>
            <th>Donor Name</th>
            <th>Email</th>
            <th>${isArtifactReport ? 'Donation (IMAGE)' : isLoanReport ? 'Donation (IMAGE)' : 'Donation (Cash)'}</th>
            <th>Date Donated</th>
          </tr>
        </thead>
        <tbody>
          ${donations && donations.length > 0 ? 
            donations.map(donation => `
              <tr>
                <td>${donation.donor_name || donation.name || 'N/A'}</td>
                <td>${donation.email || 'N/A'}</td>
                <td class="${isArtifactReport || isLoanReport ? 'artifact-cell' : 'amount-cell'}">
                  ${isArtifactReport || isLoanReport ? 
                    (donation.image_url ? 
                      `<img src="${donation.image_url}" alt="Artifact" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" />` : 
                      'No Image') : 
                    `₱${(parseFloat(donation.amount) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  }
                </td>
                <td>${donation.completion_date ? new Date(donation.completion_date).toLocaleDateString() : 
                    donation.date_received ? new Date(donation.date_received).toLocaleDateString() : 'N/A'}</td>
              </tr>
            `).join('') : 
            `<tr><td colspan="4" style="text-align: center; font-style: italic;">No ${isArtifactReport ? 'artifact' : isLoanReport ? 'loan' : 'monetary'} donations found for the selected period.</td></tr>`
          }
        </tbody>
      </table>
    `;
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${reportTitle} - Cagayan de Oro City Museum</title>
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
        
        .total-monetary {
            text-align: right;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 40px;
            color: #666;
            padding-right: 20px;
        }
        
        .total-monetary-summary {
            text-align: right;
            font-size: 14px;
            font-weight: bold;
            margin-top: 15px;
            margin-bottom: 30px;
            color: #333;
            padding-right: 20px;
        }
        
        .total-monetary-summary .donation-count {
            font-weight: normal;
            color: #666;
            margin-left: 10px;
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
        
        .amount-cell {
            text-align: right;
        }
        
        .artifact-cell {
            text-align: center;
        }
        
        .donation-section {
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #000;
            margin-bottom: 10px;
            text-align: left;
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

    <div class="report-title">${reportTitle}</div>
    ${totalSection}
    ${tableContent}
</body>
</html>`;

  return htmlContent;
}

module.exports = {
  generateDonationReportPDF, // Full version with base64 images for PDF
  generateDonationReportPDFSimple // Simple version without base64 for database
};