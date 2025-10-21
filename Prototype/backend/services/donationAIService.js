class DonationAIService {
  constructor() {
    // Using hardcoded templates instead of AI
    console.log('📊 Donation Analytics Service initialized with hardcoded templates');
  }

  // Generate donation insights using hardcoded templates
  async generateDonationInsights(donationData, timeRange = '30 days') {
    try {
      console.log('📊 Generating donation insights using hardcoded templates...');
      
      // Generate hardcoded insights based on donation data
      const insights = this.generateHardcodedInsights(donationData, timeRange);

      // Enhance with donation-specific insights
      const enhancedInsights = {
        ...insights,
        donationSpecific: await this.generateDonationSpecificInsights(donationData),
        recommendations: this.enhanceDonationRecommendations(insights.recommendations, donationData),
        trends: this.analyzeDonationTrends(donationData)
      };

      return enhancedInsights;
    } catch (error) {
      console.error('Error generating donation insights:', error);
      return this.generateFallbackDonationInsights(donationData);
    }
  }

  // Generate hardcoded insights based on donation data
  generateHardcodedInsights(donationData, timeRange) {
    const totalDonations = donationData.totalDonations || 0;
    const totalAmount = donationData.totalAmount || 0;
    const avgDonation = totalDonations > 0 ? totalAmount / totalDonations : 0;

    let summary = '';
    let trends = [];
    let recommendations = [];
    let predictions = [];
    let comparisons = [];

    if (totalDonations === 0) {
      summary = 'No donation data available for the selected time period.';
      trends = ['No donation trends identified due to lack of data'];
      recommendations = [
        'Implement donation campaigns to encourage contributions',
        'Create awareness about donation opportunities',
        'Develop donor engagement strategies'
      ];
    } else {
      // Generate insights based on data
      summary = `Donation analysis shows ${totalDonations} donations totaling $${totalAmount.toFixed(2)} over ${timeRange}, with an average donation of $${avgDonation.toFixed(2)}.`;

      // Generate trends based on data patterns
      if (avgDonation > 500) {
        trends.push('High-value donation pattern detected');
        trends.push('Donors are contributing significant amounts');
      } else if (avgDonation < 100) {
        trends.push('Small donation pattern - opportunity for growth');
        trends.push('Focus on increasing donation amounts');
      } else {
        trends.push('Moderate donation pattern');
        trends.push('Balanced donation amounts');
      }

      if (totalDonations > 10) {
        trends.push('Active donation period');
      } else if (totalDonations < 5) {
        trends.push('Low donation activity - needs attention');
      }

      // Generate recommendations
      recommendations = [
        'Implement donor recognition programs',
        'Create targeted donation campaigns',
        'Improve donation processing efficiency',
        'Develop recurring donation options',
        'Enhance donor communication'
      ];

      // Add specific recommendations based on data
      if (avgDonation < 100) {
        recommendations.push('Consider implementing donation tiers or suggested amounts');
      }

      // Generate predictions
      predictions = [
        'Donation volume likely to increase with improved donor engagement',
        'Seasonal patterns may emerge with more data collection',
        'Donor retention can be improved with better follow-up'
      ];

      // Generate comparisons
      comparisons = [
        'Current donation trends compared to previous periods',
        'Donation type distribution analysis',
        'Donor engagement level assessment'
      ];
    }

    return {
      summary,
      trends,
      recommendations,
      predictions,
      comparisons,
      source: 'Hardcoded Template Analysis'
    };
  }

  // Generate donation-specific insights
  async generateDonationSpecificInsights(data) {
    const insights = {
      donorAnalysis: this.analyzeDonorPatterns(data),
      seasonalTrends: this.analyzeSeasonalTrends(data),
      donationTypes: this.analyzeDonationTypes(data),
      processingEfficiency: this.analyzeProcessingEfficiency(data),
      growthOpportunities: this.identifyGrowthOpportunities(data)
    };

    return insights;
  }

  // Analyze donor patterns
  analyzeDonorPatterns(data) {
    if (!data.donations || data.donations.length === 0) {
      return { message: 'No donation data available for analysis' };
    }

    const donations = data.donations;
    const totalDonations = donations.length;
    const totalAmount = donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    const avgDonation = totalAmount / totalDonations;

    // Analyze donor frequency
    const donorFrequency = {};
    donations.forEach(d => {
      const email = d.donor_email;
      donorFrequency[email] = (donorFrequency[email] || 0) + 1;
    });

    const repeatDonors = Object.values(donorFrequency).filter(count => count > 1).length;
    const repeatDonorPercentage = (repeatDonors / Object.keys(donorFrequency).length) * 100;

    // Analyze donation amounts
    const donationRanges = {
      small: donations.filter(d => (parseFloat(d.amount) || 0) < 100).length,
      medium: donations.filter(d => {
        const amount = parseFloat(d.amount) || 0;
        return amount >= 100 && amount < 1000;
      }).length,
      large: donations.filter(d => (parseFloat(d.amount) || 0) >= 1000).length
    };

    return {
      totalDonors: Object.keys(donorFrequency).length,
      repeatDonors: repeatDonors,
      repeatDonorPercentage: repeatDonorPercentage.toFixed(1),
      averageDonation: avgDonation.toFixed(2),
      donationRanges: donationRanges,
      topDonorType: donationRanges.medium > donationRanges.large ? 'Medium ($100-999)' : 'Large ($1000+)'
    };
  }

  // Analyze seasonal trends
  analyzeSeasonalTrends(data) {
    if (!data.donations || data.donations.length === 0) {
      return { message: 'No donation data available for seasonal analysis' };
    }

    const donations = data.donations;
    const monthlyData = {};
    const quarterlyData = {};

    donations.forEach(d => {
      const date = new Date(d.created_at || d.request_date);
      const month = date.getMonth();
      const quarter = Math.floor(month / 3);

      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, amount: 0 };
      }
      if (!quarterlyData[quarter]) {
        quarterlyData[quarter] = { count: 0, amount: 0 };
      }

      monthlyData[month].count++;
      monthlyData[month].amount += parseFloat(d.amount) || 0;
      quarterlyData[quarter].count++;
      quarterlyData[quarter].amount += parseFloat(d.amount) || 0;
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];

    // Find peak months and quarters
    const peakMonth = Object.keys(monthlyData).reduce((a, b) => 
      monthlyData[a].count > monthlyData[b].count ? a : b
    );
    const peakQuarter = Object.keys(quarterlyData).reduce((a, b) => 
      quarterlyData[a].count > quarterlyData[b].count ? a : b
    );

    return {
      peakMonth: monthNames[peakMonth],
      peakQuarter: quarterNames[peakQuarter],
      monthlyDistribution: monthlyData,
      quarterlyDistribution: quarterlyData,
      hasSeasonalPattern: Object.keys(monthlyData).length > 3
    };
  }

  // Analyze donation types
  analyzeDonationTypes(data) {
    if (!data.donations || data.donations.length === 0) {
      return { message: 'No donation data available for type analysis' };
    }

    const donations = data.donations;
    const typeAnalysis = {};

    donations.forEach(d => {
      const type = d.type || 'unknown';
      if (!typeAnalysis[type]) {
        typeAnalysis[type] = { count: 0, amount: 0, avgAmount: 0 };
      }
      typeAnalysis[type].count++;
      typeAnalysis[type].amount += parseFloat(d.amount) || 0;
    });

    // Calculate averages
    Object.keys(typeAnalysis).forEach(type => {
      typeAnalysis[type].avgAmount = typeAnalysis[type].amount / typeAnalysis[type].count;
    });

    const mostPopularType = Object.keys(typeAnalysis).reduce((a, b) => 
      typeAnalysis[a].count > typeAnalysis[b].count ? a : b
    );

    const highestValueType = Object.keys(typeAnalysis).reduce((a, b) => 
      typeAnalysis[a].amount > typeAnalysis[b].amount ? a : b
    );

    return {
      typeBreakdown: typeAnalysis,
      mostPopularType: mostPopularType,
      highestValueType: highestValueType,
      totalTypes: Object.keys(typeAnalysis).length
    };
  }

  // Analyze processing efficiency
  analyzeProcessingEfficiency(data) {
    if (!data.donations || data.donations.length === 0) {
      return { message: 'No donation data available for efficiency analysis' };
    }

    const donations = data.donations;
    const processingStages = {};
    let totalProcessingTime = 0;
    let processedDonations = 0;

    donations.forEach(d => {
      const stage = d.processing_stage || 'unknown';
      processingStages[stage] = (processingStages[stage] || 0) + 1;

      // Calculate processing time if we have the dates
      if (d.created_at && d.final_approval_date) {
        const startDate = new Date(d.created_at);
        const endDate = new Date(d.final_approval_date);
        const processingTime = (endDate - startDate) / (1000 * 60 * 60 * 24); // days
        totalProcessingTime += processingTime;
        processedDonations++;
      }
    });

    const avgProcessingTime = processedDonations > 0 ? totalProcessingTime / processedDonations : 0;

    return {
      stageDistribution: processingStages,
      averageProcessingTime: avgProcessingTime.toFixed(1),
      totalProcessed: processedDonations,
      efficiency: this.calculateEfficiency(processingStages)
    };
  }

  // Calculate processing efficiency
  calculateEfficiency(stages) {
    const completed = stages.completed || stages.final_approved || 0;
    const pending = stages.pending || stages.under_review || stages.request_received || 0;
    const total = Object.values(stages).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) return 'N/A';
    
    const efficiency = (completed / total) * 100;
    return {
      percentage: efficiency.toFixed(1),
      rating: efficiency >= 80 ? 'Excellent' : efficiency >= 60 ? 'Good' : efficiency >= 40 ? 'Fair' : 'Needs Improvement'
    };
  }

  // Identify growth opportunities
  identifyGrowthOpportunities(data) {
    const opportunities = [];
    
    if (data.donorAnalysis) {
      if (data.donorAnalysis.repeatDonorPercentage < 30) {
        opportunities.push({
          type: 'donor_retention',
          title: 'Improve Donor Retention',
          description: 'Focus on building relationships with existing donors to increase repeat donations',
          impact: 'High',
          effort: 'Medium'
        });
      }

      if (data.donorAnalysis.donationRanges.small > data.donorAnalysis.donationRanges.large * 2) {
        opportunities.push({
          type: 'donation_upgrade',
          title: 'Upgrade Small Donations',
          description: 'Develop strategies to encourage small donors to increase their contribution amounts',
          impact: 'Medium',
          effort: 'Low'
        });
      }
    }

    if (data.seasonalTrends && data.seasonalTrends.hasSeasonalPattern) {
      opportunities.push({
        type: 'seasonal_optimization',
        title: 'Optimize Seasonal Campaigns',
        description: `Leverage peak periods (${data.seasonalTrends.peakMonth}) for targeted donation campaigns`,
        impact: 'High',
        effort: 'Medium'
      });
    }

    return opportunities;
  }

  // Enhance donation recommendations
  enhanceDonationRecommendations(baseRecommendations, data) {
    const enhanced = [...baseRecommendations];

    // Add specific recommendations based on data analysis
    if (data.donations && data.donations.length > 0) {
      const avgDonation = data.donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0) / data.donations.length;
      
      if (avgDonation < 100) {
        enhanced.push('Consider implementing donation tiers or suggested amounts to increase average donation size');
      }

      const monetaryDonations = data.donations.filter(d => d.type === 'monetary');
      if (monetaryDonations.length < data.donations.length * 0.5) {
        enhanced.push('Develop strategies to encourage more monetary donations alongside artifact donations');
      }
    }

    return enhanced;
  }

  // Analyze donation trends
  analyzeDonationTrends(data) {
    const trends = [];

    if (data.donations && data.donations.length > 0) {
      const recentDonations = data.donations.slice(0, 5);
      const olderDonations = data.donations.slice(-5);

      if (recentDonations.length > 0 && olderDonations.length > 0) {
        const recentAvg = recentDonations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0) / recentDonations.length;
        const olderAvg = olderDonations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0) / olderDonations.length;

        if (recentAvg > olderAvg * 1.1) {
          trends.push('Donation amounts are increasing over time');
        } else if (recentAvg < olderAvg * 0.9) {
          trends.push('Donation amounts are decreasing over time');
        }
      }

      const monthlyGrowth = this.calculateMonthlyGrowth(data.donations);
      if (monthlyGrowth > 0) {
        trends.push(`Monthly donation growth of ${monthlyGrowth.toFixed(1)}%`);
      }
    }

    return trends;
  }

  // Calculate monthly growth rate
  calculateMonthlyGrowth(donations) {
    if (donations.length < 2) return 0;

    const monthlyTotals = {};
    donations.forEach(d => {
      const month = new Date(d.created_at || d.request_date).toISOString().substring(0, 7);
      monthlyTotals[month] = (monthlyTotals[month] || 0) + (parseFloat(d.amount) || 0);
    });

    const months = Object.keys(monthlyTotals).sort();
    if (months.length < 2) return 0;

    const recent = monthlyTotals[months[months.length - 1]];
    const previous = monthlyTotals[months[months.length - 2]];

    return ((recent - previous) / previous) * 100;
  }

  // Fallback insights when AI is not available
  generateFallbackDonationInsights(data) {
    return {
      summary: 'Donation analysis completed using local analytics engine.',
      trends: this.analyzeDonationTrends(data),
      recommendations: [
        'Implement donor recognition programs',
        'Create targeted donation campaigns',
        'Improve donation processing efficiency',
        'Develop recurring donation options',
        'Enhance donor communication'
      ],
      predictions: [
        'Donation volume likely to increase with improved donor engagement',
        'Seasonal patterns may emerge with more data collection'
      ],
      comparisons: [
        'Current donation trends compared to previous periods',
        'Donation type distribution analysis'
      ],
      donationSpecific: this.generateDonationSpecificInsights(data),
      source: 'Fallback Analysis'
    };
  }

  // Generate donor recommendations using hardcoded templates
  async generateDonorRecommendations(donorEmail, donationHistory) {
    try {
      console.log(`📊 Generating donor recommendations for: ${donorEmail}`);
      
      // Generate hardcoded insights based on donor history
      const donorAnalysis = this.analyzeDonorHistory(donationHistory);
      const totalDonated = donorAnalysis.totalDonated || 0;
      const donationCount = donorAnalysis.donationFrequency || 0;
      const donorLevel = donorAnalysis.donorLevel || 'New Donor';

      // Generate personalized recommendations based on donor level
      let personalized = [];
      let nextSteps = [];

      if (donorLevel === 'Major Donor') {
        personalized = [
          'Thank you for being a major donor to our museum',
          'Consider joining our exclusive donor appreciation program',
          'Explore opportunities to sponsor special exhibitions',
          'Connect with other major donors in our community'
        ];
        nextSteps = [
          'Attend exclusive donor events',
          'Consider artifact donations',
          'Share your museum story with others',
          'Explore naming opportunities'
        ];
      } else if (donorLevel === 'Sustaining Donor') {
        personalized = [
          'Your consistent support is greatly appreciated',
          'Consider setting up a recurring monthly donation',
          'Explore our donor recognition programs',
          'Join our museum membership program'
        ];
        nextSteps = [
          'Attend donor appreciation events',
          'Visit our latest exhibitions',
          'Connect with museum staff',
          'Share our mission with friends'
        ];
      } else if (donorLevel === 'Regular Donor') {
        personalized = [
          'Thank you for your regular contributions',
          'Consider increasing your donation amount',
          'Explore different donation types',
          'Join our donor newsletter'
        ];
        nextSteps = [
          'Schedule a museum visit',
          'Attend public events',
          'Learn about our upcoming exhibitions',
          'Follow us on social media'
        ];
      } else {
        personalized = [
          'Welcome to our donation program!',
          'Consider making a recurring donation',
          'Explore our different donation opportunities',
          'Learn about our museum mission'
        ];
        nextSteps = [
          'Visit our museum',
          'Learn about our collections',
          'Attend public programs',
          'Connect with our team'
        ];
      }

      const recommendations = {
        personalized,
        basedOnHistory: donorAnalysis,
        suggestedAmount: this.suggestOptimalAmount(donationHistory),
        nextSteps
      };

      return {
        summary: `Donor analysis completed for ${donorEmail}. ${donorLevel} with ${donationCount} donations totaling $${totalDonated}.`,
        trends: [`Donor level: ${donorLevel}`, `Total contributions: $${totalDonated}`, `Donation frequency: ${donationCount} donations`],
        recommendations: personalized,
        donorRecommendations: recommendations,
        source: 'Hardcoded Template Analysis'
      };
    } catch (error) {
      console.error('Error generating donor recommendations:', error);
      return this.generateFallbackDonorRecommendations(donationHistory);
    }
  }

  // Analyze donor history for recommendations
  analyzeDonorHistory(history) {
    if (!history || history.length === 0) {
      return { message: 'No donation history available' };
    }

    const totalDonated = history.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    const avgDonation = totalDonated / history.length;
    const lastDonation = new Date(history[0].created_at);
    const daysSinceLastDonation = (new Date() - lastDonation) / (1000 * 60 * 60 * 24);

    return {
      totalDonated: totalDonated.toFixed(2),
      averageDonation: avgDonation.toFixed(2),
      donationFrequency: history.length,
      daysSinceLastDonation: Math.floor(daysSinceLastDonation),
      donorLevel: this.calculateDonorLevel(totalDonated, history.length)
    };
  }

  // Calculate donor level
  calculateDonorLevel(totalAmount, frequency) {
    if (totalAmount >= 10000) return 'Major Donor';
    if (totalAmount >= 5000) return 'Sustaining Donor';
    if (totalAmount >= 1000) return 'Regular Donor';
    if (frequency >= 5) return 'Frequent Donor';
    return 'New Donor';
  }

  // Suggest optimal donation amount
  suggestOptimalAmount(history) {
    if (!history || history.length === 0) return 100;

    const amounts = history.map(d => parseFloat(d.amount) || 0);
    const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const maxAmount = Math.max(...amounts);

    // Suggest 20% increase from average, but not more than 150% of max
    const suggested = Math.min(avgAmount * 1.2, maxAmount * 1.5);
    return Math.round(suggested / 10) * 10; // Round to nearest 10
  }

  // Fallback donor recommendations
  generateFallbackDonorRecommendations(history) {
    return {
      summary: 'Donor analysis completed using local analytics.',
      donorRecommendations: {
        personalized: [
          'Thank you for your continued support',
          'Consider increasing your donation amount',
          'Explore our new donation opportunities'
        ],
        basedOnHistory: this.analyzeDonorHistory(history),
        suggestedAmount: this.suggestOptimalAmount(history),
        nextSteps: [
          'Stay updated with museum news',
          'Consider artifact donations',
          'Share our mission with others'
        ]
      },
      source: 'Fallback Analysis'
    };
  }
}

module.exports = new DonationAIService();
