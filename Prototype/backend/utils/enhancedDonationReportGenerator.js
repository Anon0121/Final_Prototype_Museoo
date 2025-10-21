const { GraphReportGenerator } = require('./graphReportGenerator');
const fs = require('fs');
const path = require('path');

class EnhancedDonationReportGenerator {
  constructor() {
    this.graphGenerator = new GraphReportGenerator();
  }

  // Generate donation report with charts and analytics
  async generateDonationReportWithCharts(report) {
    try {
      console.log('💰 Generating enhanced donation report with charts...');
      
      let reportData = {};
      if (report.data) {
        try {
          reportData = JSON.parse(report.data);
        } catch (e) {
          console.error('Error parsing donation report data:', e);
        }
      }

      // Create temporary directory for charts
      const tempDir = path.join(__dirname, '../temp/donation-charts');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Generate charts
      const charts = await this.generateDonationCharts(reportData, tempDir);
      
      // Generate HTML with charts
      const htmlContent = this.generateEnhancedHTML(report, reportData, charts);
      
      return htmlContent;
    } catch (error) {
      console.error('Error generating enhanced donation report:', error);
      throw error;
    }
  }

  // Generate donation-specific charts
  async generateDonationCharts(donationData, outputDir) {
    const charts = {};
    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate monthly donation trends chart
      const monthlyData = this.processMonthlyDonationData(donationData);
      if (monthlyData.length > 0) {
        const monthlyPath = path.join(outputDir, 'monthly-donations.png');
        await this.generateMonthlyDonationChart(monthlyData, monthlyPath);
        charts.monthlyDonations = monthlyPath;
      }

      // Generate donation type pie chart
      const typeData = this.processDonationTypeData(donationData);
      if (typeData.length > 0) {
        const typePath = path.join(outputDir, 'donation-types.png');
        await this.generateDonationTypeChart(typeData, typePath);
        charts.donationTypes = typePath;
      }

      // Generate donor status chart
      const statusData = this.processDonorStatusData(donationData);
      if (statusData.length > 0) {
        const statusPath = path.join(outputDir, 'donor-status.png');
        await this.generateDonorStatusChart(statusData, statusPath);
        charts.donorStatus = statusPath;
      }

      return charts;
    } catch (error) {
      console.error('Error generating donation charts:', error);
      throw error;
    }
  }

  // Process monthly donation data for charts
  processMonthlyDonationData(donationData) {
    const donations = donationData.donations || [];
    const monthlyStats = {};

    donations.forEach(donation => {
      const date = new Date(donation.date_received || donation.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          month: monthKey,
          count: 0,
          amount: 0
        };
      }
      
      monthlyStats[monthKey].count++;
      monthlyStats[monthKey].amount += parseFloat(donation.amount || 0);
    });

    return Object.values(monthlyStats).sort((a, b) => a.month.localeCompare(b.month));
  }

  // Process donation type data for pie chart
  processDonationTypeData(donationData) {
    const donations = donationData.donations || [];
    const typeStats = {};

    donations.forEach(donation => {
      const type = donation.type || 'Other';
      if (!typeStats[type]) {
        typeStats[type] = { type, count: 0, amount: 0 };
      }
      typeStats[type].count++;
      typeStats[type].amount += parseFloat(donation.amount || 0);
    });

    return Object.values(typeStats);
  }

  // Process donor status data for chart
  processDonorStatusData(donationData) {
    const donations = donationData.donations || [];
    const statusStats = {};

    donations.forEach(donation => {
      const status = donation.status || 'Unknown';
      if (!statusStats[status]) {
        statusStats[status] = { status, count: 0 };
      }
      statusStats[status].count++;
    });

    return Object.values(statusStats);
  }

  // Generate monthly donation trend chart
  async generateMonthlyDonationChart(monthlyData, outputPath) {
    const chartConfig = {
      type: 'line',
      data: {
        labels: monthlyData.map(d => d.month),
        datasets: [{
          label: 'Donation Count',
          data: monthlyData.map(d => d.count),
          borderColor: '#E5B80B',
          backgroundColor: 'rgba(229, 184, 11, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }, {
          label: 'Total Amount (₱)',
          data: monthlyData.map(d => d.amount),
          borderColor: '#2c5aa0',
          backgroundColor: 'rgba(44, 90, 160, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          yAxisID: 'y1'
        }]
      },
      options: {
        responsive: true,
        width: 600,
        height: 400,
        plugins: {
          title: {
            display: false
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: { size: 12 }
            }
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Number of Donations',
              font: { size: 11 }
            },
            grid: {
              drawBorder: false
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Amount (₱)',
              font: { size: 11 }
            },
            grid: {
              drawOnChartArea: false,
              drawBorder: false
            }
          },
          x: {
            title: {
              display: true,
              text: 'Month',
              font: { size: 11 }
            },
            grid: {
              drawBorder: false
            }
          }
        }
      }
    };

    await this.graphGenerator.generateChart(chartConfig, outputPath);
  }

  // Generate donation type pie chart
  async generateDonationTypeChart(typeData, outputPath) {
    const colors = ['#E5B80B', '#2c5aa0', '#28a745', '#dc3545', '#6f42c1', '#fd7e14'];
    
    const chartConfig = {
      type: 'doughnut',
      data: {
        labels: typeData.map(d => d.type),
        datasets: [{
          data: typeData.map(d => d.count),
          backgroundColor: colors.slice(0, typeData.length),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        width: 400,
        height: 400,
        plugins: {
          title: {
            display: false
          },
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              font: { size: 11 },
              padding: 15
            }
          }
        }
      }
    };

    await this.graphGenerator.generateChart(chartConfig, outputPath);
  }

  // Generate donor status chart
  async generateDonorStatusChart(statusData, outputPath) {
    const colors = ['#28a745', '#ffc107', '#dc3545', '#6c757d'];
    
    const chartConfig = {
      type: 'bar',
      data: {
        labels: statusData.map(d => d.status),
        datasets: [{
          label: 'Number of Donors',
          data: statusData.map(d => d.count),
          backgroundColor: colors.slice(0, statusData.length),
          borderColor: colors.slice(0, statusData.length),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        width: 400,
        height: 300,
        plugins: {
          title: {
            display: false
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Donors',
              font: { size: 11 }
            },
            grid: {
              drawBorder: false
            }
          },
          x: {
            title: {
              display: true,
              text: 'Status',
              font: { size: 11 }
            },
            grid: {
              drawBorder: false
            }
          }
        }
      }
    };

    await this.graphGenerator.generateChart(chartConfig, outputPath);
  }

  // Generate enhanced HTML with charts
  generateEnhancedHTML(report, reportData, charts) {
    const getBase64Logo = (filename) => {
      try {
        const logoPath = path.join(__dirname, '../../Museoo/src/assets', filename);
        if (fs.existsSync(logoPath)) {
          const imageBuffer = fs.readFileSync(logoPath);
          return imageBuffer.toString('base64');
        }
      } catch (e) {
        console.error(`Error reading logo ${filename}:`, e);
      }
      return '';
    };

    const donations = reportData.donations || [];
    const summary = reportData.summary || {};
    
    // Generate chart HTML
    let chartHTML = '';
    if (charts.monthlyDonations) {
      try {
        const imageBuffer = fs.readFileSync(charts.monthlyDonations);
        const base64Image = imageBuffer.toString('base64');
        chartHTML = `<img src="data:image/png;base64,${base64Image}" alt="Monthly Donation Trends" style="max-width: 100%; height: auto; max-height: 300px;" />`;
      } catch (e) {
        console.error('Error reading monthly donations chart:', e);
        chartHTML = '<div style="text-align: center; padding: 50px; color: #666;">Monthly donation trends chart will be generated here</div>';
      }
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Donation Report - City Museum of Cagayan de Oro</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: white;
            color: black;
            line-height: 1.6;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #333;
        }
        
        .seal {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2c5aa0 0%, #1e3a8a 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 10px;
            text-align: center;
            line-height: 1.2;
        }
        
        .museum-info {
            flex: 1;
            margin: 0 20px;
        }
        
        .museum-name {
            font-size: 24px;
            font-weight: bold;
            color: black;
            margin-bottom: 5px;
        }
        
        .museum-address {
            font-size: 12px;
            color: #666;
            line-height: 1.4;
        }
        
        .city-logo {
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .report-title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin: 30px 0;
            color: black;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: bold;
            margin: 20px 0 15px 0;
            color: #2c5aa0;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .summary-card {
            background: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }
        
        .summary-number {
            font-size: 24px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 5px;
        }
        
        .summary-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
        }
        
        .charts-container {
            margin: 30px 0;
        }
        
        .main-chart {
            border: 1px solid #000;
            padding: 15px;
            margin-bottom: 30px;
            background: #fff;
        }
        
        .chart-row {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .chart-item {
            flex: 1;
            border: 1px solid #000;
            padding: 15px;
            background: #fff;
        }
        
        .chart-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            text-align: center;
            color: #2c5aa0;
        }
        
        .donations-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .donations-table th,
        .donations-table td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
            font-size: 11px;
        }
        
        .donations-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }
        
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="seal">
            <img src="data:image/png;base64,${getBase64Logo('logo.png')}" alt="City Seal" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>
        <div class="museum-info">
            <div class="museum-name">City Museum of Cagayan de Oro</div>
            <div class="museum-address">
                Fernandez-Rizal Streets, Barangay 1, Old Water Tower/Tank,<br>
                near Gaston Park, Cagayan de Oro, Philippines
            </div>
        </div>
        <div class="city-logo">
            <img src="data:image/png;base64,${getBase64Logo('Logo_cagayan_de oro_city.png')}" alt="City Logo" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>
    </div>

    <div class="report-title">Donation Report</div>

    <div class="section-title">Donation Summary</div>
    
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

    <div class="section-title">Donation Analytics</div>

    <div class="charts-container">
        <div class="main-chart">
            <div class="chart-title">Monthly Donation Trends</div>
            ${chartHTML ? chartHTML : '<div style="text-align: center; padding: 50px; color: #666;">Monthly donation trends chart will be generated here</div>'}
        </div>
        
        <div class="chart-row">
            <div class="chart-item">
                <div class="chart-title">Donation Types</div>
                ${(() => {
                    if (charts.donationTypes) {
                        try {
                            const imageBuffer = fs.readFileSync(charts.donationTypes);
                            const base64Image = imageBuffer.toString('base64');
                            return `<img src="data:image/png;base64,${base64Image}" alt="Donation Types" style="max-width: 100%; height: auto; max-height: 200px;" />`;
                        } catch (e) {
                            console.error('Error reading donation types chart:', e);
                            return '<div style="text-align: center; padding: 20px; color: #666;">Error loading donation types chart</div>';
                        }
                    }
                    return '<div style="text-align: center; padding: 20px; color: #666;">Donation types chart will be displayed here</div>';
                })()}
            </div>
            <div class="chart-item">
                <div class="chart-title">Donor Status</div>
                ${(() => {
                    if (charts.donorStatus) {
                        try {
                            const imageBuffer = fs.readFileSync(charts.donorStatus);
                            const base64Image = imageBuffer.toString('base64');
                            return `<img src="data:image/png;base64,${base64Image}" alt="Donor Status" style="max-width: 100%; height: auto; max-height: 200px;" />`;
                        } catch (e) {
                            console.error('Error reading donor status chart:', e);
                            return '<div style="text-align: center; padding: 20px; color: #666;">Error loading donor status chart</div>';
                        }
                    }
                    return '<div style="text-align: center; padding: 20px; color: #666;">Donor status chart will be displayed here</div>';
                })()}
            </div>
        </div>
    </div>

    <div class="section-title">Donation Details</div>

    <table class="donations-table">
        <thead>
            <tr>
                <th>Donor Name</th>
                <th>Type</th>
                <th>Amount/Value</th>
                <th>Date Received</th>
                <th>Status</th>
                <th>Contact</th>
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
                </tr>
            `).join('') : `
                <tr>
                    <td colspan="6" style="text-align: center;">No donations found for the selected period.</td>
                </tr>
            `}
        </tbody>
    </table>

    <div class="footer">
        <p>Generated on ${new Date().toLocaleDateString()} | Donation Report - City Museum of Cagayan de Oro</p>
    </div>
</body>
</html>`;
  }
}

module.exports = { EnhancedDonationReportGenerator };
