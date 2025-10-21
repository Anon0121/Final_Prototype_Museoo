// Hardcoded report templates for fallback scenarios
const reportTemplates = {
  // Default visitor analytics template
  visitor_analytics: {
    title: "Monthly Visitor Analytics Report",
    description: "Comprehensive analysis of visitor behavior, demographics, and trends",
    template: (data) => ({
      summary: `Analysis shows ${data.totalVisitors || 0} visitors who actually entered the museum over ${data.uniqueDays || 0} days, averaging ${data.avgVisitorsPerBooking?.toFixed(1) || 0} visitors per booking. Complete visitor information including demographics, purpose, and registration details is available in the comprehensive report.`,
      trends: [
        data.dailyData?.length > 0 ? `Peak visitor day: ${data.dailyData[0]?.date} with ${data.dailyData[0]?.daily_visitors} visitors` : "No daily data available",
        data.demographics?.length > 0 ? `Top visitor type: ${data.demographics[0]?.visitor_type} with ${data.demographics[0]?.count} visitors` : "No demographic data available",
        data.chartData?.timeSlots?.length > 0 ? `Most popular time slot: ${data.chartData.timeSlots[0]?.timeSlot} with ${data.chartData.timeSlots[0]?.count} visitors` : "No time slot data available"
      ].filter(trend => !trend.includes("No")),
      recommendations: [
        "Consider extending hours on peak days",
        "Implement online booking system to reduce wait times",
        "Add more staff during busy periods",
        "Target marketing campaigns based on visitor demographics",
        "Optimize time slot availability based on popular hours"
      ],
      predictions: [
        "Visitor numbers are expected to increase during peak seasons",
        "Online booking adoption may reduce walk-in wait times",
        "Extended hours could capture additional visitor segments"
      ],
      comparisons: [
        "Current period shows consistent visitor patterns",
        "Peak hours remain stable across different days",
        "Visitor demographics show balanced distribution"
      ]
    })
  },

  // Default monthly summary template
  monthly_summary: {
    title: "Monthly Museum Summary Report",
    description: "Comprehensive overview of all museum activities and metrics",
    template: (data) => ({
      summary: `Monthly overview: ${data.visitors || 0} visitors, ${data.events || 0} events, ${data.donations?.count || 0} donations totaling $${data.donations?.amount?.toFixed(2) || 0}.`,
      trends: [
        data.donations?.amount > 0 ? `Average donation: $${(data.donations.amount / data.donations.count).toFixed(2)}` : "No donation data available",
        `Total cultural objects: ${data.culturalObjects || 0}`,
        `Archive files: ${data.archives || 0}`
      ].filter(trend => !trend.includes("No")),
      recommendations: [
        "Focus on increasing event attendance",
        "Develop donation campaigns",
        "Create more engaging exhibits",
        "Improve visitor experience",
        "Enhance digital presence"
      ],
      predictions: [
        "Event attendance may increase with better marketing",
        "Donation campaigns could boost revenue",
        "Digital engagement will become more important"
      ],
      comparisons: [
        "Monthly metrics show steady museum operations",
        "Visitor engagement remains consistent",
        "Cultural preservation efforts are ongoing"
      ]
    })
  },

  // Default event performance template
  event_performance: {
    title: "Event Performance Analysis Report",
    description: "Analysis of event success metrics and effectiveness",
    template: (data) => ({
      summary: `Event analysis: ${data.totalEvents || 0} events with average ${data.avgVisitorsPerEvent?.toFixed(1) || 0} visitors per event.`,
      trends: [
        data.events?.length > 0 ? `Top performing event: ${data.events[0]?.title} with ${data.events[0]?.visitor_count} visitors` : "No event data available",
        "Event attendance patterns show consistent engagement",
        "Cultural events attract diverse visitor demographics"
      ].filter(trend => !trend.includes("No")),
      recommendations: [
        "Replicate successful event formats",
        "Improve marketing for low-attendance events",
        "Consider event timing optimization",
        "Develop interactive event elements",
        "Create themed event series"
      ],
      predictions: [
        "Themed events may increase attendance",
        "Interactive elements will boost engagement",
        "Regular event series could build audience loyalty"
      ],
      comparisons: [
        "Event performance varies by type and timing",
        "Cultural events show strong community support",
        "Educational events attract consistent audiences"
      ]
    })
  },

  // Default financial report template
  financial_report: {
    title: "Financial Analysis Report",
    description: "Comprehensive analysis of donations, revenue, and financial trends",
    template: (data) => ({
      summary: `Financial overview: Total donations $${data.totalDonations?.toFixed(2) || 0} from ${data.donationTypes?.reduce((sum, d) => sum + d.count, 0) || 0} contributions.`,
      trends: [
        data.donationTypes?.length > 0 ? `Most popular donation type: ${data.donationTypes[0]?.type} with ${data.donationTypes[0]?.count} contributions` : "No donation type data available",
        "Donation patterns show community support",
        "Financial sustainability is maintained through diverse funding"
      ].filter(trend => !trend.includes("No")),
      recommendations: [
        "Diversify donation types",
        "Implement recurring donation programs",
        "Create donor recognition programs",
        "Develop corporate partnership opportunities",
        "Enhance fundraising campaigns"
      ],
      predictions: [
        "Recurring donations could provide stable revenue",
        "Corporate partnerships may increase funding",
        "Donor recognition programs will improve retention"
      ],
      comparisons: [
        "Donation patterns reflect community engagement",
        "Financial health shows positive trends",
        "Revenue diversification supports sustainability"
      ]
    })
  },

  // Default exhibit analytics template
  exhibit_analytics: {
    title: "Cultural Objects & Exhibit Analytics Report",
    description: "Analysis of exhibit popularity, visitor engagement, and cultural object performance",
    template: (data) => ({
      summary: `Exhibit analysis: ${data.totalExhibits || 0} exhibits with average ${data.avgVisitorsPerExhibit?.toFixed(1) || 0} visitors per exhibit.`,
      trends: [
        data.exhibits?.length > 0 ? `Most popular exhibit: ${data.exhibits[0]?.title} with ${data.exhibits[0]?.visitor_count} visitors` : "No exhibit data available",
        "Cultural objects show strong visitor interest",
        "Interactive exhibits demonstrate higher engagement"
      ].filter(trend => !trend.includes("No")),
      recommendations: [
        "Extend popular exhibit durations",
        "Improve signage for less popular exhibits",
        "Consider interactive elements for low-engagement exhibits",
        "Develop rotating exhibit programs",
        "Enhance cultural object presentations"
      ],
      predictions: [
        "Interactive elements will increase engagement",
        "Rotating exhibits may boost repeat visits",
        "Enhanced presentations will improve visitor experience"
      ],
      comparisons: [
        "Exhibit popularity varies by cultural significance",
        "Visitor engagement correlates with presentation quality",
        "Cultural objects maintain consistent interest"
      ]
    })
  },

  // Default staff performance template
  staff_performance: {
    title: "Staff Performance & Productivity Report",
    description: "Analysis of staff productivity, visitor processing, and efficiency metrics",
    template: (data) => ({
      summary: `Staff performance: ${data.totalStaff || 0} staff members processed ${data.staffActivities?.reduce((sum, s) => sum + s.visitors_processed, 0) || 0} visitors.`,
      trends: [
        data.staffActivities?.length > 0 ? `Top performer: ${data.staffActivities[0]?.firstname} ${data.staffActivities[0]?.lastname} with ${data.staffActivities[0]?.visitors_processed} visitors processed` : "No staff data available",
        "Staff productivity shows consistent performance",
        "Visitor processing efficiency is maintained"
      ].filter(trend => !trend.includes("No")),
      recommendations: [
        "Provide training for low-performing staff",
        "Implement performance incentives",
        "Share best practices among staff",
        "Develop staff development programs",
        "Create recognition programs for top performers"
      ],
      predictions: [
        "Training programs will improve overall performance",
        "Incentive programs may boost productivity",
        "Best practice sharing will enhance efficiency"
      ],
      comparisons: [
        "Staff performance shows individual variations",
        "Team collaboration improves overall efficiency",
        "Training investments yield positive results"
      ]
    })
  },

  // NEW LIST-BASED REPORT TEMPLATES

  // Default visitor list template
  visitor_list: {
    title: "Visitor List Report",
    description: "Complete list of all visitors with detailed information",
    template: (data) => ({
      summary: `Visitor list contains ${data.totalVisitors || 0} visitors with ${data.summary?.totalBookings || 0} unique bookings. ${data.summary?.checkedInVisitors || 0} visitors have checked in.`,
      trends: [
        data.summary?.mainVisitors > 0 ? `${data.summary.mainVisitors} main visitors and ${data.summary.additionalVisitors || 0} additional visitors` : "No visitor data available",
        "Visitor registration shows consistent patterns",
        "Booking system maintains good organization"
      ].filter(trend => !trend.includes("No")),
      recommendations: [
        "Continue efficient visitor registration process",
        "Monitor visitor check-in patterns",
        "Improve visitor data collection",
        "Enhance visitor experience",
        "Optimize booking system"
      ],
      predictions: [
        "Visitor registration will continue to grow",
        "Check-in efficiency will improve with system optimization",
        "Visitor satisfaction will remain high"
      ],
      comparisons: [
        "Current visitor patterns show stable growth",
        "Registration system operates efficiently",
        "Visitor data quality is maintained"
      ]
    })
  },

  // Default event list template
  event_list: {
    title: "Event List Report",
    description: "Complete list of all events with details",
    template: (data) => ({
      summary: `Event list contains ${data.totalEvents || 0} events with total capacity of ${data.summary?.totalCapacity || 0} and ${data.summary?.totalRegistrations || 0} current registrations.`,
      trends: [
        data.events?.length > 0 ? `Most recent event: ${data.events[0]?.title} on ${data.events[0]?.start_date}` : "No event data available",
        "Event scheduling shows good organization",
        "Event capacity management is effective"
      ].filter(trend => !trend.includes("No")),
      recommendations: [
        "Continue diverse event programming",
        "Optimize event capacity planning",
        "Improve event marketing",
        "Enhance event registration process",
        "Develop more interactive events"
      ],
      predictions: [
        "Event attendance will continue to grow",
        "Event diversity will increase",
        "Community engagement will strengthen"
      ],
      comparisons: [
        "Event programming shows consistent quality",
        "Event capacity utilization is optimal",
        "Event scheduling maintains good balance"
      ]
    })
  },

  // Default cultural objects inventory template
  cultural_objects_inventory: {
    title: "Cultural Objects Inventory Report",
    description: "Complete inventory of cultural objects and artifacts",
    template: (data) => ({
      summary: `Cultural objects inventory contains ${data.totalObjects || 0} items across ${data.summary?.totalCategories || 0} categories with estimated total value of $${(data.summary?.totalEstimatedValue || 0).toFixed(2)}.`,
      trends: [
        data.categories?.length > 0 ? `Most common category: ${data.categories[0]?.category} with ${data.categories[0]?.count} items` : "No cultural objects data available",
        "Collection shows diverse cultural representation",
        "Object preservation standards are maintained"
      ].filter(trend => !trend.includes("No")),
      recommendations: [
        "Continue expanding cultural collection",
        "Improve object documentation",
        "Enhance preservation methods",
        "Develop better categorization system",
        "Increase public access to collection"
      ],
      predictions: [
        "Collection will continue to grow",
        "Cultural diversity will increase",
        "Preservation standards will improve"
      ],
      comparisons: [
        "Collection shows steady growth",
        "Cultural representation is balanced",
        "Preservation efforts are effective"
      ]
    })
  },

  // Default archive list template
  archive_list: {
    title: "Archive List Report",
    description: "Complete list of digital archive items",
    template: (data) => ({
      summary: `Archive list contains ${data.totalArchives || 0} digital items across ${data.summary?.totalTypes || 0} types with ${data.summary?.mostCommonType || 'various'} being the most common.`,
      trends: [
        data.archives?.length > 0 ? `Most recent archive: ${data.archives[0]?.title} (${data.archives[0]?.type})` : "No archive data available",
        "Digital preservation shows good progress",
        "Archive organization is systematic"
      ].filter(trend => !trend.includes("No")),
      recommendations: [
        "Continue digital archiving efforts",
        "Improve archive categorization",
        "Enhance search functionality",
        "Develop better metadata standards",
        "Increase archive accessibility"
      ],
      predictions: [
        "Digital archives will continue to expand",
        "Archive quality will improve",
        "Accessibility will increase"
      ],
      comparisons: [
        "Archive collection shows steady growth",
        "Digital preservation is effective",
        "Archive organization is systematic"
      ]
    })
  },

  // Default donation list template
  donation_list: {
    title: "Donation List Report",
    description: "Complete list of all donations and contributions",
    template: (data) => ({
      summary: `Donation list contains ${data.totalDonations || 0} donations with monetary value of $${(data.summary?.totalMonetaryValue || 0).toFixed(2)}. ${data.summary?.approvedDonations || 0} approved and ${data.summary?.pendingDonations || 0} pending.`,
      trends: [
        data.donations?.length > 0 ? `Most recent donation: ${data.donations[0]?.donor_name} (${data.donations[0]?.type})` : "No donation data available",
        "Donation patterns show community support",
        "Donation processing is efficient"
      ].filter(trend => !trend.includes("No")),
      recommendations: [
        "Continue donor engagement efforts",
        "Improve donation processing",
        "Enhance donor recognition",
        "Develop recurring donation programs",
        "Increase donation transparency"
      ],
      predictions: [
        "Donation support will continue to grow",
        "Donor engagement will improve",
        "Community support will strengthen"
      ],
      comparisons: [
        "Donation patterns show consistent support",
        "Donor relationships are strong",
        "Community engagement is positive"
      ]
    })
  },

  // Default booking list template
  booking_list: {
    title: "Booking List Report",
    description: "Complete list of all bookings and reservations",
    template: (data) => ({
      summary: `Booking list contains ${data.totalBookings || 0} bookings with ${data.summary?.totalVisitors || 0} total visitors. ${data.summary?.individualBookings || 0} individual and ${data.summary?.groupBookings || 0} group bookings.`,
      trends: [
        data.bookings?.length > 0 ? `Most recent booking: ${data.bookings[0]?.first_name} ${data.bookings[0]?.last_name} (${data.bookings[0]?.type})` : "No booking data available",
        "Booking system operates efficiently",
        "Visitor scheduling is well-managed"
      ].filter(trend => !trend.includes("No")),
      recommendations: [
        "Continue efficient booking management",
        "Improve booking confirmation process",
        "Enhance visitor communication",
        "Optimize time slot allocation",
        "Develop better booking analytics"
      ],
      predictions: [
        "Booking efficiency will continue to improve",
        "Visitor satisfaction will increase",
        "System optimization will enhance experience"
      ],
      comparisons: [
        "Booking patterns show consistent usage",
        "System efficiency is maintained",
        "Visitor experience is positive"
      ]
    })
  }
};

// Function to get fallback report data
function getFallbackReport(reportType, data) {
  const template = reportTemplates[reportType];
  if (!template) {
    // Default fallback for unknown report types
    return {
      title: "Museum Analytics Report",
      description: "General museum data analysis and insights",
      summary: "Analysis of museum operations and visitor data.",
      trends: ["Museum operations are running smoothly", "Visitor engagement is consistent", "Data collection is comprehensive"],
      recommendations: ["Continue current operations", "Monitor visitor feedback", "Maintain data quality"],
      predictions: ["Operations will continue smoothly", "Visitor satisfaction will remain high"],
      comparisons: ["Current period shows stable operations", "Data quality is maintained"]
    };
  }

  return {
    title: template.title,
    description: template.description,
    ...template.template(data)
  };
}

// Function to detect vague prompts and suggest specific options
function handleVaguePrompt(message, currentData) {
  const lowerMessage = message.toLowerCase();
  
  // Check for vague requests
  const vagueKeywords = ['something', 'anything', 'nice', 'good', 'help', 'report', 'data', 'info'];
  const isVague = vagueKeywords.some(keyword => lowerMessage.includes(keyword)) && 
                  !lowerMessage.includes('visitor') && 
                  !lowerMessage.includes('event') && 
                  !lowerMessage.includes('donation') && 
                  !lowerMessage.includes('exhibit') && 
                  !lowerMessage.includes('staff');

  if (isVague) {
    return {
      isVague: true,
      suggestions: [
        {
          type: 'generate_report',
          label: 'Generate Visitor Analytics Report',
          icon: 'fa-users',
          params: { reportType: 'visitor_analytics' },
          description: 'Complete visitor behavior and demographics analysis'
        },
        {
          type: 'generate_report',
          label: 'Generate Financial Report',
          icon: 'fa-chart-line',
          params: { reportType: 'financial_report' },
          description: 'Donation trends and revenue analysis'
        },
        {
          type: 'generate_report',
          label: 'Generate Event Performance Report',
          icon: 'fa-calendar-week',
          params: { reportType: 'event_performance' },
          description: 'Event attendance and success metrics'
        },
        {
          type: 'generate_report',
          label: 'Generate Monthly Summary Report',
          icon: 'fa-calendar-alt',
          params: { reportType: 'monthly_summary' },
          description: 'Comprehensive monthly overview'
        }
      ],
      message: `I can help you with several types of reports based on your museum's data. Here are some specific options that might be useful:`
    };
  }

  return { isVague: false };
}

module.exports = {
  reportTemplates,
  getFallbackReport,
  handleVaguePrompt
};
