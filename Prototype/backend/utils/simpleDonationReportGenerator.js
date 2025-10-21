const { getBase64Logo } = require('./pdfGenerator');
const path = require('path');

function generateSimpleDonationListReport(report) {
  let reportData = {};
  if (report.data) {
    try {
      reportData = JSON.parse(report.data);
    } catch (e) {
      console.error('Error parsing donation list report data:', e);
    }
  }

  const donations = reportData.donations || [];
  const summary = reportData.summary || {};

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Donation List Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: white; color: black; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333; }
        .logo-section { display: flex; align-items: center; gap: 20px; }
        .logo { width: 80px; height: 80px; background: linear-gradient(135deg, #2c5aa0 0%, #1e3a8a 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; text-align: center; line-height: 1.2; }
        .museum-info h1 { margin: 0; font-size: 24px; font-weight: bold; color: black; }
        .museum-info p { margin: 5px 0 0 0; font-size: 14px; color: #666; }
        .right-logo { text-align: right; }
        .right-logo h2 { margin: 0; font-size: 18px; color: #2c5aa0; font-weight: bold; }
        .right-logo p { margin: 5px 0 0 0; font-size: 12px; color: #ff6b35; }
        .report-title { text-align: center; font-size: 20px; font-weight: bold; margin: 30px 0; color: black; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .summary-card { background: #f8f9fa; border: 1px solid #ddd; border-radius: 8px; padding: 15px; text-align: center; }
        .summary-number { font-size: 24px; font-weight: bold; color: #2c5aa0; margin-bottom: 5px; }
        .summary-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .donations-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .donations-table th, .donations-table td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; }
        .donations-table th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
        .donations-table td { text-align: center; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-section">
            <div class="logo">
                CITY OF<br>CAGAYAN DE ORO<br>PHILIPPINES
            </div>
            <div class="museum-info">
                <h1>City Museum of Cagayan de Oro</h1>
                <p>Fernandez-Rizal Streets, Barangay 1, Old Water Tower/Tank, near Gaston Park, Cagayan de Oro, Philippines</p>
            </div>
        </div>
        <div class="right-logo">
            <h2>cagayan de oro</h2>
            <p>city of golden friendship</p>
        </div>
    </div>

    <div class="report-title">Donation List Report</div>

    <div class="summary-grid">
        <div class="summary-card">
            <div class="summary-number">${summary.totalDonations || donations.length}</div>
            <div class="summary-label">Total Donations</div>
        </div>
        <div class="summary-card">
            <div class="summary-number">₱${(summary.totalMonetaryValue || 0).toLocaleString()}</div>
            <div class="summary-label">Total Value</div>
        </div>
        <div class="summary-card">
            <div class="summary-number">${summary.pendingDonations || 0}</div>
            <div class="summary-label">Pending</div>
        </div>
        <div class="summary-card">
            <div class="summary-number">${summary.approvedDonations || 0}</div>
            <div class="summary-label">Approved</div>
        </div>
    </div>

    <table class="donations-table">
        <thead>
            <tr>
                <th>Donor Name</th>
                <th>Type</th>
                <th>Amount/Value</th>
                <th>Date Received</th>
                <th>Status</th>
                <th>Contact</th>
                <th>Notes</th>
            </tr>
        </thead>
        <tbody>
            ${donations.length > 0 ? donations.map(donation => `
                <tr>
                    <td>${donation.donor_name || 'N/A'}</td>
                    <td>${donation.type || 'N/A'}</td>
                    <td>${donation.type === 'monetary' ? `₱${parseFloat(donation.amount || 0).toLocaleString()}` : donation.item_description || 'N/A'}</td>
                    <td>${donation.date_received ? new Date(donation.date_received).toLocaleDateString() : 'N/A'}</td>
                    <td>${donation.status || 'N/A'}</td>
                    <td>${donation.donor_email || donation.donor_contact || 'N/A'}</td>
                    <td>${donation.notes || 'N/A'}</td>
                </tr>
            `).join('') : `
                <tr>
                    <td colspan="7" style="text-align: center;">No donations found for the selected period.</td>
                </tr>
            `}
        </tbody>
    </table>

    <div class="footer">
        <p>Generated on ${new Date().toLocaleDateString()} | Donation List Report - City Museum of Cagayan de Oro</p>
    </div>
</body>
</html>`;

  return htmlContent;
}

module.exports = {
  generateSimpleDonationListReport
};
