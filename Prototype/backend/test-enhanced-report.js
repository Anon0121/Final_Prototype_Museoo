const { EnhancedVisitorReportGenerator } = require('./utils/enhancedVisitorReportGenerator');
const db = require('./db');

async function testEnhancedReport() {
  try {
    console.log('🧪 Testing enhanced visitor report generation...');
    
    // Create a test report object
    const testReport = {
      id: 1,
      title: 'Test Visitor Report',
      report_type: 'visitor_analytics',
      start_date: '1900-01-01',
      end_date: '2100-12-31',
      created_at: new Date().toISOString(),
      data: JSON.stringify({
        totalVisitors: 3,
        uniqueDays: 2,
        avgVisitorsPerBooking: 1.5,
        chartData: {
          dailyVisitors: [
            { date: '2025-09-17', visitors: 1 },
            { date: '2025-09-21', visitors: 1 },
            { date: '2025-10-03', visitors: 1 }
          ],
          demographics: [
            { visitor_type: 'Local', count: 2 },
            { visitor_type: 'Foreign', count: 1 }
          ],
          timeSlots: [
            { timeSlot: 'Morning', count: 1 },
            { timeSlot: 'Afternoon', count: 2 }
          ],
          genderDistribution: [
            { gender: 'female', count: 2 },
            { gender: 'male', count: 1 }
          ]
        },
        visitorDetails: [
          {
            first_name: 'Shesh',
            last_name: 'Dela Cruz',
            gender: 'female',
            visitor_type: 'Local',
            email: 'test@example.com',
            address: 'Test Address',
            purpose: 'Tourism',
            institution: 'N/A',
            checkin_time: '2025-09-17T18:54:35.000Z'
          }
        ]
      })
    };
    
    const enhancedGenerator = new EnhancedVisitorReportGenerator();
    const htmlContent = await enhancedGenerator.generateVisitorReportWithCharts(testReport);
    
    console.log('✅ Enhanced report generated successfully');
    console.log('📊 HTML content length:', htmlContent.length);
    
    // Check if charts are included
    const hasCharts = htmlContent.includes('chart-container') || htmlContent.includes('data:image/png;base64');
    console.log('📊 Charts included in HTML:', hasCharts);
    
    if (hasCharts) {
      console.log('✅ Charts are properly embedded in the HTML');
    } else {
      console.log('❌ No charts found in the HTML content');
    }
    
    // Save the HTML to a file for inspection
    const fs = require('fs');
    fs.writeFileSync('test-enhanced-report.html', htmlContent);
    console.log('📄 HTML saved to test-enhanced-report.html');
    
  } catch (error) {
    console.error('❌ Error testing enhanced report:', error);
  } finally {
    process.exit(0);
  }
}

testEnhancedReport();
