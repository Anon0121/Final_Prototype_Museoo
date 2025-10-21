const { GraphReportGenerator } = require('./graphReportGenerator');
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

// Enhanced visitor report generator with graphs
class EnhancedVisitorReportGenerator {
  constructor() {
    this.graphGenerator = new GraphReportGenerator();
  }

  // Check if the report is for a specific month (daily view) or whole year (monthly view)
  isSpecificMonth(report) {
    try {
      // Parse the report data to get date range
      let reportData = {};
      if (report.data) {
        reportData = JSON.parse(report.data);
      }
      
      // Check if start and end dates indicate a single month
      if (report.start_date && report.end_date) {
        const startDate = new Date(report.start_date);
        const endDate = new Date(report.end_date);
        
        // If start and end are in the same month and year, it's a specific month
        const isSameMonth = startDate.getMonth() === endDate.getMonth() && 
                           startDate.getFullYear() === endDate.getFullYear();
        
        // Also check if it's not the full year (Jan 1 to Dec 31)
        const isFullYear = startDate.getMonth() === 0 && startDate.getDate() === 1 &&
                          endDate.getMonth() === 11 && endDate.getDate() === 31 &&
                          startDate.getFullYear() === endDate.getFullYear();
        
        return isSameMonth && !isFullYear;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking if specific month:', error);
      return false;
    }
  }

  // Generate comprehensive visitor report with charts
  async generateVisitorReportWithCharts(report) {
    console.log('📊 Generating enhanced visitor report with charts...');
    console.log('📊 Report data keys:', Object.keys(report));
    
    // Parse the report data
    let reportData = {};
    if (report.data) {
      try {
        reportData = JSON.parse(report.data);
        console.log('📊 Parsed report data keys:', Object.keys(reportData));
        console.log('📊 Chart data available:', !!reportData.chartData);
        if (reportData.chartData) {
          console.log('📊 Chart data keys:', Object.keys(reportData.chartData));
        }
      } catch (e) {
        console.error('Error parsing report data:', e);
      }
    }

    // Create temporary directory for charts
    const tempDir = path.join(__dirname, '../../temp/charts');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    let charts = {};
    let chartHTML = '';

    try {
      // Determine if this is a daily view (specific month) or monthly view (whole year)
      const isDailyView = this.isSpecificMonth(report);
      
      // Generate visitor graph charts (monthly/daily bar chart + pie charts)
      console.log('📊 Generating visitor graph charts with data:', reportData, 'isDailyView:', isDailyView);
      charts = await this.graphGenerator.generateVisitorGraphCharts(reportData, tempDir, isDailyView);
      console.log('📊 Generated charts:', Object.keys(charts));
      
      // Convert charts to base64 for HTML embedding
      const base64Charts = await this.graphGenerator.convertChartsToBase64(charts);
      console.log('📊 Base64 charts:', Object.keys(base64Charts));
      
      // Generate HTML for the main bar chart
      if (base64Charts.monthlyVisitors) {
        console.log('📊 Adding visitors chart to HTML');
        const chartTitle = isDailyView ? 'Daily Visitor Count' : 'Monthly Visitor Count';
        const chartDescription = isDailyView ? 
          'Visitor count by day for the selected month' : 
          'Visitor count by month for the selected year';
        
        chartHTML = this.graphGenerator.generateChartHTML(
          'monthlyVisitors',
          base64Charts.monthlyVisitors,
          chartTitle,
          chartDescription
        );
      }
    } catch (error) {
      console.error('Error generating charts:', error);
      // Continue without charts if generation fails
    }

    // Generate enhanced HTML content with charts
    console.log('📊 Chart HTML length:', chartHTML.length);
    console.log('📊 Chart HTML preview:', chartHTML.substring(0, 200) + '...');
    
    const htmlContent = this.generateEnhancedHTML(report, reportData, chartHTML, charts);
    console.log('📊 Final HTML length:', htmlContent.length);
    
    return htmlContent;
  }

  // Generate enhanced HTML content with charts
  generateEnhancedHTML(report, reportData, chartHTML, charts = {}) {
    // Convert pie charts to base64
    let genderPieBase64 = '';
    let visitorTypePieBase64 = '';
    
    try {
      if (charts.genderPie && fs.existsSync(charts.genderPie)) {
        const imageBuffer = fs.readFileSync(charts.genderPie);
        genderPieBase64 = imageBuffer.toString('base64');
      }
    } catch (error) {
      console.error('Error reading gender pie chart:', error);
    }
    
    try {
      if (charts.visitorTypePie && fs.existsSync(charts.visitorTypePie)) {
        const imageBuffer = fs.readFileSync(charts.visitorTypePie);
        visitorTypePieBase64 = imageBuffer.toString('base64');
      }
    } catch (error) {
      console.error('Error reading visitor type pie chart:', error);
    }
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Visitor Graph Report - City Museum of Cagayan de Oro</title>
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
            line-height: 1.4;
            background: #ffffff;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding: 0;
        }
        
        .seal {
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-right: 20px;
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
            font-size: 20px;
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
            font-size: 16px;
            font-weight: bold;
            color: #000;
            margin: 20px 0;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #000;
            margin: 20px 0 10px 0;
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
        
        .chart-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            color: #000;
            margin-bottom: 15px;
        }
        
        .chart-container {
            border: 1px solid #000;
            padding: 15px;
            margin-bottom: 20px;
            background: #fff;
        }
        
        .visitor-list-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }
        
        .visitor-list-table th {
            background: #f0f0f0;
            padding: 8px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #000;
        }
        
        .visitor-list-table td {
            padding: 8px;
            border: 1px solid #000;
            text-align: left;
        }
        
        .visitor-list-table tr:nth-child(even) {
            background: #f9f9f9;
        }
        
        .pie-charts {
            display: flex;
            gap: 20px;
            margin-top: 20px;
        }
        
        .pie-chart {
            flex: 1;
            border: 1px solid #000;
            padding: 15px;
            background: #fff;
        }
        
        .pie-chart-title {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            color: #000;
            margin-bottom: 10px;
        }
        
        @media print {
            body { margin: 0; padding: 15px; }
            .header { page-break-after: avoid; }
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

    <div class="report-title">Visitor Graph Report</div>
    
    <div class="section-title">List of Graph Reports of Visitors</div>

    <div class="charts-container">
        <div class="main-chart">
            ${chartHTML ? chartHTML : '<div style="text-align: center; padding: 50px; color: #666;">Monthly visitor bar chart will be generated here</div>'}
        </div>
        
        <div class="pie-charts">
            <div class="pie-chart">
                <div class="pie-chart-title">Gender</div>
                ${genderPieBase64 ? 
                    `<img src="data:image/png;base64,${genderPieBase64}" alt="Gender Distribution" style="max-width: 100%; height: auto; max-height: 200px;" />` :
                    '<div style="text-align: center; padding: 20px; color: #666;">Gender distribution chart will be displayed here</div>'
                }
            </div>
            <div class="pie-chart">
                <div class="pie-chart-title">Visitor Type</div>
                ${visitorTypePieBase64 ? 
                    `<img src="data:image/png;base64,${visitorTypePieBase64}" alt="Visitor Type Distribution" style="max-width: 100%; height: auto; max-height: 200px;" />` :
                    '<div style="text-align: center; padding: 20px; color: #666;">Visitor type distribution chart will be displayed here</div>'
                }
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }

  // Generate PDF from enhanced HTML content
  async generatePDFFromHTML(htmlContent, outputPath) {
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
}

module.exports = {
  EnhancedVisitorReportGenerator
};
