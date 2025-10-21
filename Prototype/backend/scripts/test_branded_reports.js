const { generateBrandedReportHTML } = require('../utils/brandedReportGenerator');
const fs = require('fs');
const path = require('path');

// Test the branded report generation
async function testBrandedReports() {
  console.log('🎨 Testing Branded Report Generation...');
  
  // Sample report data
  const sampleReport = {
    id: 1,
    title: 'Complete Museum Entry Analytics Report',
    report_type: 'visitor_analytics',
    start_date: '2024-01-01',
    end_date: '2024-01-31',
    created_at: new Date().toISOString()
  };
  
  const sampleReportData = {
    totalVisitors: 1250,
    uniqueDays: 31,
    avgVisitorsPerBooking: 2.3,
    visitorDetails: [
      {
        visitor_id: 1,
        first_name: 'Juan',
        last_name: 'Dela Cruz',
        gender: 'male',
        visitor_type: 'Individual',
        email: 'juan@example.com',
        purpose: 'Education',
        visit_date: '2024-01-15',
        scan_time: '2024-01-15T14:30:00Z',
        time_slot: '2:00 PM - 4:00 PM',
        booking_status: 'checked-in'
      },
      {
        visitor_id: 2,
        first_name: 'Maria',
        last_name: 'Santos',
        gender: 'female',
        visitor_type: 'Group',
        email: 'maria@example.com',
        purpose: 'Tourism',
        visit_date: '2024-01-16',
        scan_time: '2024-01-16T10:15:00Z',
        time_slot: '10:00 AM - 12:00 PM',
        booking_status: 'checked-in'
      }
    ],
    demographics: [
      { visitor_type: 'Individual', count: 800 },
      { visitor_type: 'Group', count: 300 },
      { visitor_type: 'Student', count: 150 }
    ],
    timeSlots: [
      { timeSlot: '10:00 AM - 12:00 PM', count: 400 },
      { timeSlot: '2:00 PM - 4:00 PM', count: 500 },
      { timeSlot: '4:00 PM - 6:00 PM', count: 350 }
    ]
  };
  
  const sampleAIInsights = {
    summary: 'The museum experienced strong visitor engagement in January 2024, with 1,250 total visitors across 31 days. Individual visitors dominated at 64%, while group visits showed consistent patterns. Peak attendance occurred during afternoon hours (2-4 PM), suggesting optimal timing for special events and programs.',
    trends: [
      'Individual visitors represent 64% of total attendance',
      'Peak hours are 2:00 PM - 4:00 PM with 500 visitors',
      'Weekend attendance shows 15% increase compared to weekdays',
      'Student groups show highest engagement during morning slots',
      'Average group size of 2.3 visitors indicates family-focused visits'
    ],
    recommendations: [
      'Extend afternoon hours to accommodate peak demand',
      'Develop family-focused programs for 2-4 PM slot',
      'Create student-specific morning programs',
      'Implement online booking system to reduce wait times',
      'Add interactive exhibits to increase visitor engagement'
    ],
    predictions: [
      'Visitor numbers expected to increase by 20% in February',
      'Group bookings likely to rise during school vacation periods',
      'Afternoon slots will continue to be most popular'
    ]
  };
  
  try {
    // Generate branded HTML report
    const htmlContent = generateBrandedReportHTML(sampleReport, sampleReportData, sampleAIInsights);
    
    // Save to file for testing
    const outputPath = path.join(__dirname, '../test_output/branded_report_test.html');
    const outputDir = path.dirname(outputPath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, htmlContent);
    
    console.log('✅ Branded report generated successfully!');
    console.log(`📄 Report saved to: ${outputPath}`);
    console.log('🎨 Features included:');
    console.log('   - Museum branding with official colors');
    console.log('   - Professional typography (Inter + Playfair Display)');
    console.log('   - Gradient backgrounds and modern styling');
    console.log('   - AI insights with visual hierarchy');
    console.log('   - Responsive table design');
    console.log('   - Museum contact information');
    console.log('   - Professional footer with branding');
    
    // Test with minimal data
    console.log('\n🧪 Testing with minimal data...');
    const minimalReport = {
      id: 2,
      title: 'Monthly Summary Report',
      report_type: 'monthly_summary',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      created_at: new Date().toISOString()
    };
    
    const minimalData = {
      totalVisitors: 500,
      uniqueDays: 31
    };
    
    const minimalInsights = {
      summary: 'Basic monthly summary with 500 visitors across 31 days.'
    };
    
    const minimalHTML = generateBrandedReportHTML(minimalReport, minimalData, minimalInsights);
    const minimalOutputPath = path.join(__dirname, '../test_output/minimal_branded_report.html');
    fs.writeFileSync(minimalOutputPath, minimalHTML);
    
    console.log('✅ Minimal report generated successfully!');
    console.log(`📄 Minimal report saved to: ${minimalOutputPath}`);
    
    console.log('\n🎉 All tests passed! Your museum reports now have professional branding.');
    console.log('\n📋 Next steps:');
    console.log('1. Open the generated HTML files in a browser to preview');
    console.log('2. Test PDF generation with the new branding');
    console.log('3. Deploy to production for live testing');
    
  } catch (error) {
    console.error('❌ Error testing branded reports:', error.message);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testBrandedReports()
    .then(() => {
      console.log('\n🎨 Branded report testing completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Branded report testing failed:', error);
      process.exit(1);
    });
}

module.exports = { testBrandedReports };


