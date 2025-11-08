const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');
const path = require('path');

class GraphReportGenerator {
  constructor() {
    // Chart configuration
    this.chartConfig = {
      width: 600,
      height: 400,
      backgroundColour: 'white',
      chartCallback: (ChartJS) => {
        ChartJS.defaults.font.size = 10;
        ChartJS.defaults.font.family = 'Arial, sans-serif';
      }
    };
  }

  // Generate visitor graph charts (monthly/daily bar + pie charts)
  async generateVisitorGraphCharts(visitorData, outputDir, isDailyView = false) {
    const charts = {};
    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const chartData = this.processMonthlyVisitorData(visitorData, isDailyView);
      const genderData = this.processGenderData(visitorData);
      const visitorTypeData = this.processVisitorTypeData(visitorData);
      
      if (chartData.length > 0) {
        const chartPath = path.join(outputDir, 'monthly-visitors.png');
        await this.generateMonthlyBarChart(chartData, chartPath, isDailyView);
        charts.monthlyVisitors = chartPath;
      }
      
      if (genderData.length > 0) {
        const genderPath = path.join(outputDir, 'gender-pie.png');
        await this.generateGenderPieChart(genderData, genderPath);
        charts.genderPie = genderPath;
      }
      
      if (visitorTypeData.length > 0) {
        const visitorTypePath = path.join(outputDir, 'visitor-type-pie.png');
        await this.generateVisitorTypePieChart(visitorTypeData, visitorTypePath);
        charts.visitorTypePie = visitorTypePath;
      }
      
      return charts;
    } catch (error) {
      console.error('Error generating visitor graph charts:', error);
      throw error;
    }
  }

  // Process visitor data - can be monthly or daily based on date range
  processMonthlyVisitorData(visitorData, isDailyView = false) {
    if (isDailyView) {
      // For daily view, show individual days
      const dailyStats = {};
      
      if (visitorData.visitorDetails && Array.isArray(visitorData.visitorDetails)) {
        visitorData.visitorDetails.forEach(visitor => {
          // Use scan_time or checkin_time (whichever is available)
          const checkinTime = visitor.scan_time || visitor.checkin_time;
          if (checkinTime) {
            const date = new Date(checkinTime);
            const dayKey = `${date.getMonth() + 1}/${date.getDate()}`;
            dailyStats[dayKey] = (dailyStats[dayKey] || 0) + 1;
          }
        });
      }
      
      // Convert to array and sort by date
      return Object.entries(dailyStats)
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => {
          const [monthA, dayA] = a.day.split('/').map(Number);
          const [monthB, dayB] = b.day.split('/').map(Number);
          return monthA - monthB || dayA - dayB;
        });
    } else {
      // For monthly view, show months
      const monthlyStats = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Initialize all months with 0
      months.forEach(month => {
        monthlyStats[month] = 0;
      });
      
      // Count visitors by month
      if (visitorData.visitorDetails && Array.isArray(visitorData.visitorDetails)) {
        visitorData.visitorDetails.forEach(visitor => {
          // Use scan_time or checkin_time (whichever is available)
          const checkinTime = visitor.scan_time || visitor.checkin_time;
          if (checkinTime) {
            const date = new Date(checkinTime);
            const month = months[date.getMonth()];
            if (month) {
              monthlyStats[month]++;
            }
          }
        });
      }
      
      return months.map(month => ({
        month,
        count: monthlyStats[month]
      }));
    }
  }

  // Process gender data
  processGenderData(visitorData) {
    const genderStats = { 'male': 0, 'female': 0, 'other': 0 };
    
    if (visitorData.visitorDetails && Array.isArray(visitorData.visitorDetails)) {
      visitorData.visitorDetails.forEach(visitor => {
        const gender = (visitor.gender || 'other').toLowerCase();
        if (genderStats.hasOwnProperty(gender)) {
          genderStats[gender]++;
        } else {
          genderStats['other']++;
        }
      });
    }
    
    return Object.entries(genderStats).map(([gender, count]) => ({
      gender,
      count
    }));
  }

  // Process visitor type data
  processVisitorTypeData(visitorData) {
    const typeStats = { 'Local': 0, 'Foreign': 0, 'Student': 0, 'Other': 0 };
    
    if (visitorData.visitorDetails && Array.isArray(visitorData.visitorDetails)) {
      visitorData.visitorDetails.forEach(visitor => {
        const type = visitor.visitor_type || 'Other';
        // Handle both capitalized and lowercase versions
        const normalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
        if (typeStats.hasOwnProperty(normalizedType)) {
          typeStats[normalizedType]++;
        } else {
          typeStats['Other']++;
        }
      });
    }
    
    return Object.entries(typeStats).map(([type, count]) => ({
      type,
      count
    }));
  }

  // Generate monthly/daily bar chart
  async generateMonthlyBarChart(data, outputPath, isDailyView = false) {
    const canvasRenderService = new ChartJSNodeCanvas(this.chartConfig);
    
    const configuration = {
      type: 'bar',
      data: {
        labels: data.map(d => isDailyView ? d.day : d.month),
        datasets: [{
          label: 'Visitors',
          data: data.map(d => d.count),
          backgroundColor: '#E5B80B',
          borderColor: '#AB8841',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 10
              },
              // Force whole numbers on Y-axis
              callback: function(value) {
                return Number.isInteger(value) ? value : null;
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 10
              }
            }
          }
        }
      }
    };

    const imageBuffer = await canvasRenderService.renderToBuffer(configuration);
    fs.writeFileSync(outputPath, imageBuffer);
  }

  // Generate gender pie chart
  async generateGenderPieChart(data, outputPath) {
    const canvasRenderService = new ChartJSNodeCanvas(this.chartConfig);
    
    const configuration = {
      type: 'pie',
      data: {
        labels: data.map(d => d.gender),
      datasets: [{
          data: data.map(d => d.count),
          backgroundColor: ['#E5B80B', '#AB8841', '#8B6B21'],
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false
          },
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 23
              },
              padding: 15
            }
          }
        }
      }
    };

    const imageBuffer = await canvasRenderService.renderToBuffer(configuration);
    fs.writeFileSync(outputPath, imageBuffer);
  }

  // Generate visitor type pie chart
  async generateVisitorTypePieChart(data, outputPath) {
    const canvasRenderService = new ChartJSNodeCanvas(this.chartConfig);
    
    const configuration = {
      type: 'pie',
      data: {
        labels: data.map(d => d.type),
      datasets: [{
          data: data.map(d => d.count),
          backgroundColor: ['#E5B80B', '#AB8841', '#8B6B21', '#6B4E16'],
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false
          },
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 23
              },
              padding: 15
            }
          }
        }
      }
    };

    const imageBuffer = await canvasRenderService.renderToBuffer(configuration);
    fs.writeFileSync(outputPath, imageBuffer);
  }

  // Convert charts to base64
  async convertChartsToBase64(charts) {
    const base64Charts = {};
    
    for (const [key, filePath] of Object.entries(charts)) {
      try {
        if (fs.existsSync(filePath)) {
          const imageBuffer = fs.readFileSync(filePath);
          base64Charts[key] = imageBuffer.toString('base64');
        }
      } catch (error) {
        console.error(`Error converting chart ${key} to base64:`, error);
      }
    }
    
    return base64Charts;
  }

  // Generate chart HTML
  generateChartHTML(chartType, base64Image, title, description) {
    return `
      <div class="main-chart">
        <img src="data:image/png;base64,${base64Image}" alt="${title}" style="max-width: 100%; height: auto; max-height: 300px;" />
      </div>
    `;
  }
}

module.exports = { GraphReportGenerator };
