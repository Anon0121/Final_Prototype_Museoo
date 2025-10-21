const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI client lazily
let openai = null;

class AIService {
  constructor() {
    this.isAvailable = !!process.env.OPENAI_API_KEY;
  }

  // Initialize OpenAI client if not already initialized
  initializeOpenAI() {
    if (!openai && this.isAvailable) {
      try {
        openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
      } catch (error) {
        console.error('Error initializing OpenAI client:', error);
        this.isAvailable = false;
      }
    }
  }

  // Generate AI insights for reports
  async generateInsights(data, reportType, includeRecommendations = true, includePredictions = false, includeComparisons = false) {
    if (!this.isAvailable) {
      console.warn('OpenAI API key not configured. Using fallback insights.');
      return this.generateFallbackInsights(data, reportType, includeRecommendations);
    }

    try {
      // Initialize OpenAI client if needed
      this.initializeOpenAI();
      
      if (!openai) {
        console.warn('Failed to initialize OpenAI client. Using fallback insights.');
        return this.generateFallbackInsights(data, reportType, includeRecommendations);
      }

      const prompt = this.buildPrompt(data, reportType, includeRecommendations, includePredictions, includeComparisons);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert museum analytics consultant with deep knowledge of visitor behavior, event management, financial analysis, and museum operations. Provide clear, actionable insights and recommendations based on the data provided."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const response = completion.choices[0].message.content;
      return this.parseAIResponse(response, reportType, includePredictions, includeComparisons);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      console.warn('Falling back to mock insights due to API error.');
      return this.generateFallbackInsights(data, reportType, includeRecommendations, includePredictions, includeComparisons);
    }
  }

  // Build a comprehensive prompt for the AI
  buildPrompt(data, reportType, includeRecommendations, includePredictions = false, includeComparisons = false) {
    const reportTypeDescriptions = {
      visitor_analytics: "visitor analytics including visitor counts, demographics, time patterns, and trends",
      monthly_summary: "monthly summary of museum activities including visitors, events, donations, and exhibits",
      event_performance: "event performance analysis including attendance, success metrics, and event effectiveness",
      financial_report: "financial analysis including donations, revenue trends, and financial insights",
      exhibit_analytics: "exhibit analytics including popularity, visitor engagement, and exhibit performance",
      staff_performance: "staff performance metrics including productivity, visitor processing, and efficiency"
    };

    // Build the JSON structure as a JavaScript object first
    const jsonStructure = {
      summary: "executive summary here",
      trends: ["trend 1", "trend 2", "trend 3"],
      recommendations: ["recommendation 1", "recommendation 2", "recommendation 3"]
    };

    // Conditionally add predictions and comparisons
    if (includePredictions) {
      jsonStructure.predictions = ["prediction 1", "prediction 2"];
    }
    if (includeComparisons) {
      jsonStructure.comparisons = ["comparison 1", "comparison 2"];
    }

    let prompt = `Analyze the following ${reportTypeDescriptions[reportType]} data and provide insights:

Data: ${JSON.stringify(data, null, 2)}

Please provide:
1. A concise executive summary (2-3 sentences)
2. 3-5 key trends or patterns you've identified
3. ${includeRecommendations ? '3-5 actionable recommendations for improvement' : 'No recommendations needed'}
${includePredictions ? '4. 2-3 predictions for future trends based on current data' : ''}
${includeComparisons ? '5. 2-3 period comparisons (if historical data available)' : ''}

Format your response as JSON with the following structure:
${JSON.stringify(jsonStructure, null, 2)}

Focus on practical insights that would be valuable for museum management and operations.`;

    return prompt;
  }

  // Parse the AI response and extract structured data
  parseAIResponse(response, reportType, includePredictions = false, includeComparisons = false) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || 'AI analysis completed successfully.',
          trends: parsed.trends || [],
          recommendations: parsed.recommendations || [],
          predictions: includePredictions ? (parsed.predictions || []) : [],
          comparisons: includeComparisons ? (parsed.comparisons || []) : [],
          source: 'OpenAI GPT-3.5'
        };
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
    }

    // Fallback: extract insights from text response
    return {
      summary: response.split('\n')[0] || 'AI analysis completed successfully.',
      trends: this.extractTrendsFromText(response),
      recommendations: this.extractRecommendationsFromText(response),
      predictions: includePredictions ? this.extractPredictionsFromText(response) : [],
      comparisons: includeComparisons ? this.extractComparisonsFromText(response) : [],
      source: 'OpenAI GPT-3.5 (Parsed)'
    };
  }

  // Extract trends from text response
  extractTrendsFromText(text) {
    const trends = [];
    const lines = text.split('\n');
    let inTrendsSection = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('trend') || line.toLowerCase().includes('pattern')) {
        inTrendsSection = true;
        continue;
      }
      if (line.toLowerCase().includes('recommendation') || line.toLowerCase().includes('suggestion')) {
        break;
      }
      if (inTrendsSection && line.trim() && line.trim().length > 10) {
        trends.push(line.trim().replace(/^[-•*]\s*/, ''));
      }
    }
    
    return trends.slice(0, 5);
  }

  // Extract recommendations from text response
  extractRecommendationsFromText(text) {
    const recommendations = [];
    const lines = text.split('\n');
    let inRecommendationsSection = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('recommendation') || line.toLowerCase().includes('suggestion')) {
        inRecommendationsSection = true;
        continue;
      }
      if (inRecommendationsSection && line.trim() && line.trim().length > 10) {
        recommendations.push(line.trim().replace(/^[-•*]\s*/, ''));
      }
    }
    
    return recommendations.slice(0, 5);
  }

  // Extract predictions from text response
  extractPredictionsFromText(text) {
    const predictions = [];
    const lines = text.split('\n');
    let inPredictionsSection = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('prediction') || line.toLowerCase().includes('forecast') || line.toLowerCase().includes('future')) {
        inPredictionsSection = true;
        continue;
      }
      if (inPredictionsSection && line.trim() && line.trim().length > 10) {
        predictions.push(line.trim().replace(/^[-•*]\s*/, ''));
      }
    }
    
    return predictions.slice(0, 3);
  }

  // Extract comparisons from text response
  extractComparisonsFromText(text) {
    const comparisons = [];
    const lines = text.split('\n');
    let inComparisonsSection = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('comparison') || line.toLowerCase().includes('vs') || line.toLowerCase().includes('previous')) {
        inComparisonsSection = true;
        continue;
      }
      if (inComparisonsSection && line.trim() && line.trim().length > 10) {
        comparisons.push(line.trim().replace(/^[-•*]\s*/, ''));
      }
    }
    
    return comparisons.slice(0, 3);
  }

  // Fallback insights when AI is not available
  generateFallbackInsights(data, reportType, includeRecommendations, includePredictions = false, includeComparisons = false) {
          const insights = {
        summary: '',
        trends: [],
        recommendations: [],
        predictions: includePredictions ? [] : [],
        comparisons: includeComparisons ? [] : [],
        source: 'Fallback Analysis'
      };

    switch (reportType) {
      case 'visitor_analytics':
        insights.summary = `Analysis shows ${data.totalVisitors} visitors who actually entered the museum over ${data.uniqueDays} days, averaging ${data.avgVisitorsPerBooking?.toFixed(1) || 0} visitors per booking. Complete visitor information including demographics, purpose, and registration details is available in the comprehensive report.`;
        
        if (data.dailyData?.length > 0) {
          const peakDay = data.dailyData.reduce((max, day) => day.daily_visitors > max.daily_visitors ? day : max);
          insights.trends.push(`Peak visitor day: ${peakDay.date} with ${peakDay.daily_visitors} visitors`);
        }
        
        if (data.demographics?.length > 0) {
          insights.trends.push(`Top visitor type: ${data.demographics[0].visitor_type} with ${data.demographics[0].count} visitors`);
        }

        if (data.chartData?.timeSlots?.length > 0) {
          const mostPopularSlot = data.chartData.timeSlots[0];
          insights.trends.push(`Most popular time slot: ${mostPopularSlot.timeSlot} with ${mostPopularSlot.count} visitors`);
        }

        if (data.chartData?.genderDistribution?.length > 0) {
          const genderData = data.chartData.genderDistribution;
          const totalGender = genderData.reduce((sum, g) => sum + g.count, 0);
          if (totalGender > 0) {
            const dominantGender = genderData[0];
            const percentage = ((dominantGender.count / totalGender) * 100).toFixed(1);
            insights.trends.push(`Gender distribution: ${dominantGender.gender} visitors dominate at ${percentage}%`);
          }
        }

        if (data.visitorDetails?.length > 0) {
          const recentVisitors = data.visitorDetails.slice(0, 3);
          insights.trends.push(`Recent visitors include: ${recentVisitors.map(v => `${v.first_name} ${v.last_name}`).join(', ')}`);
        }
        
        if (includeRecommendations) {
          insights.recommendations = [
            'Consider extending hours on peak days',
            'Implement online booking system to reduce wait times',
            'Add more staff during busy periods',
            'Target marketing campaigns based on visitor demographics',
            'Optimize time slot availability based on popular hours'
          ];
        }
        break;

      case 'monthly_summary':
        insights.summary = `Monthly overview: ${data.visitors} visitors, ${data.events} events, ${data.donations?.count || 0} donations totaling $${data.donations?.amount?.toFixed(2) || 0}.`;
        
        if (data.donations?.amount > 0) {
          insights.trends.push(`Average donation: $${(data.donations.amount / data.donations.count).toFixed(2)}`);
        }
        
        if (includeRecommendations) {
          insights.recommendations = [
            'Focus on increasing event attendance',
            'Develop donation campaigns',
            'Create more engaging exhibits'
          ];
        }
        break;

      case 'event_performance':
        insights.summary = `Event analysis: ${data.totalEvents} events with average ${data.avgVisitorsPerEvent?.toFixed(1) || 0} visitors per event.`;
        
        if (data.events?.length > 0) {
          const topEvent = data.events[0];
          insights.trends.push(`Top performing event: ${topEvent.title} with ${topEvent.visitor_count} visitors`);
        }
        
        if (includeRecommendations) {
          insights.recommendations = [
            'Replicate successful event formats',
            'Improve marketing for low-attendance events',
            'Consider event timing optimization'
          ];
        }
        break;

      case 'financial_report':
        insights.summary = `Financial overview: Total donations $${data.totalDonations?.toFixed(2) || 0} from ${data.donationTypes?.reduce((sum, d) => sum + d.count, 0) || 0} contributions.`;
        
        if (data.donationTypes?.length > 0) {
          const topType = data.donationTypes[0];
          insights.trends.push(`Most popular donation type: ${topType.type} with ${topType.count} contributions`);
        }
        
        if (includeRecommendations) {
          insights.recommendations = [
            'Diversify donation types',
            'Implement recurring donation programs',
            'Create donor recognition programs'
          ];
        }
        break;

      case 'exhibit_analytics':
        insights.summary = `Exhibit analysis: ${data.totalExhibits} exhibits with average ${data.avgVisitorsPerExhibit?.toFixed(1) || 0} visitors per exhibit.`;
        
        if (data.exhibits?.length > 0) {
          const topExhibit = data.exhibits[0];
          insights.trends.push(`Most popular exhibit: ${topExhibit.title} with ${topExhibit.visitor_count} visitors`);
        }
        
        if (includeRecommendations) {
          insights.recommendations = [
            'Extend popular exhibit durations',
            'Improve signage for less popular exhibits',
            'Consider interactive elements for low-engagement exhibits'
          ];
        }
        break;

      case 'staff_performance':
        insights.summary = `Staff performance: ${data.totalStaff} staff members processed ${data.staffActivities?.reduce((sum, s) => sum + s.visitors_processed, 0) || 0} visitors.`;
        
        if (data.staffActivities?.length > 0) {
          const topStaff = data.staffActivities[0];
          insights.trends.push(`Top performer: ${topStaff.firstname} ${topStaff.lastname} with ${topStaff.visitors_processed} visitors processed`);
        }
        
        if (includeRecommendations) {
          insights.recommendations = [
            'Provide training for low-performing staff',
            'Implement performance incentives',
            'Share best practices among staff'
          ];
        }
        break;
    }

    return insights;
  }

  // Check if AI service is available
  isAIAvailable() {
    return this.isAvailable;
  }

  // Get AI service status
  getStatus() {
    return {
      available: this.isAvailable,
      provider: this.isAvailable ? 'OpenAI GPT-3.5' : 'Fallback Analysis',
      message: this.isAvailable ? 'AI service is ready' : 'OpenAI API key not configured'
    };
  }

  // Generate chat response
  async generateChatResponse(message, conversationHistory, currentData) {
    if (!this.isAvailable) {
      return this.generateFallbackChatResponse(message, conversationHistory, currentData);
    }

    try {
      this.initializeOpenAI();
      
      if (!openai) {
        return this.generateFallbackChatResponse(message, conversationHistory, currentData);
      }

      const prompt = this.buildChatPrompt(message, conversationHistory, currentData);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert museum analytics assistant. You help users understand their museum data, generate reports, and provide insights. Be conversational, helpful, and suggest relevant actions when appropriate."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const response = completion.choices[0].message.content;
      return this.parseChatResponse(response, message);
    } catch (error) {
      console.error('Error calling OpenAI API for chat:', error);
      return this.generateFallbackChatResponse(message, conversationHistory, currentData);
    }
  }

  // Build chat prompt
  buildChatPrompt(message, conversationHistory, currentData) {
    const context = `
Current Museum Data (Last 30 Days):
- Visitors: ${currentData.recentVisitors}
- Events: ${currentData.recentEvents}
- Donations: ${currentData.recentDonations.count} ($${currentData.recentDonations.amount.toFixed(2)})

Available Report Types:
- visitor_analytics: Visitor behavior and trends
- monthly_summary: Monthly overview
- event_performance: Event success metrics
- financial_report: Revenue and donations
- exhibit_analytics: Exhibit popularity
- staff_performance: Staff productivity

User Message: ${message}

Previous Conversation Context: ${conversationHistory.map(msg => `${msg.type}: ${msg.content}`).join('\n')}

Please provide a helpful response and suggest relevant actions if the user wants to generate reports or see specific data.`;
    
    return context;
  }

  // Parse chat response and extract actions
  parseChatResponse(response, originalMessage) {
    const actions = [];
    
    // Check if user wants to generate a report
    if (originalMessage.toLowerCase().includes('generate') || originalMessage.toLowerCase().includes('report')) {
      if (originalMessage.toLowerCase().includes('visitor')) {
        actions.push({
          type: 'generate_report',
          label: 'Generate Museum Entry Analytics Report',
          icon: 'fa-users',
          params: { reportType: 'visitor_analytics' }
        });
      } else if (originalMessage.toLowerCase().includes('financial') || originalMessage.toLowerCase().includes('donation')) {
        actions.push({
          type: 'generate_report',
          label: 'Generate Financial Report',
          icon: 'fa-chart-line',
          params: { reportType: 'financial_report' }
        });
      } else if (originalMessage.toLowerCase().includes('event')) {
        actions.push({
          type: 'generate_report',
          label: 'Generate Event Performance Report',
          icon: 'fa-calendar-week',
          params: { reportType: 'event_performance' }
        });
      } else if (originalMessage.toLowerCase().includes('exhibit')) {
        actions.push({
          type: 'generate_report',
          label: 'Generate Exhibit Analytics Report',
          icon: 'fa-eye',
          params: { reportType: 'exhibit_analytics' }
        });
      } else if (originalMessage.toLowerCase().includes('staff')) {
        actions.push({
          type: 'generate_report',
          label: 'Generate Staff Performance Report',
          icon: 'fa-user-tie',
          params: { reportType: 'staff_performance' }
        });
      } else {
        actions.push({
          type: 'generate_report',
          label: 'Generate Monthly Summary Report',
          icon: 'fa-calendar-alt',
          params: { reportType: 'monthly_summary' }
        });
      }
    }

    return {
      response: response,
      actions: actions
    };
  }

  // Fallback chat response
  generateFallbackChatResponse(message, conversationHistory, currentData) {
    const lowerMessage = message.toLowerCase();
    let response = '';
    const actions = [];

    // Analyze conversation context
    const recentMessages = conversationHistory.slice(-5).map(msg => msg.content.toLowerCase());
    const hasRecentGreeting = recentMessages.some(msg => 
      msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('how are you')
    );
    
    // Check if we're in an ongoing conversation about a specific topic
    const isDiscussingVisitors = recentMessages.some(msg => 
      msg.includes('visitor') || msg.includes('people') || msg.includes('guest') || msg.includes('attendance')
    );
    const isDiscussingReports = recentMessages.some(msg => 
      msg.includes('report') || msg.includes('generate') || msg.includes('create') || msg.includes('analytics')
    );
    const isDiscussingEvents = recentMessages.some(msg => 
      msg.includes('event') || msg.includes('exhibit') || msg.includes('activity')
    );
    const isDiscussingFinancial = recentMessages.some(msg => 
      msg.includes('financial') || msg.includes('donation') || msg.includes('money') || msg.includes('revenue')
    );

    // Handle general greetings and casual conversation
    if ((lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) && !hasRecentGreeting) {
      const greetings = [
        "Hello! I'm your museum AI assistant. How can I help you today?",
        "Hi there! I'm here to help you with your museum data and analytics.",
        "Hey! I'm ready to assist you with reports, insights, and museum analytics."
      ];
      response = greetings[Math.floor(Math.random() * greetings.length)];
    } else if (lowerMessage.includes('how are you') || lowerMessage.includes('how do you do')) {
      const wellbeing = [
        "I'm doing great, thank you for asking! I'm ready to help you analyze your museum data.",
        "I'm functioning perfectly! How can I assist you with your museum reports today?",
        "I'm excellent! Ready to dive into your museum analytics and generate insights."
      ];
      response = wellbeing[Math.floor(Math.random() * wellbeing.length)];
    } else if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      const thanks = [
        "You're welcome! Is there anything else I can help you with?",
        "My pleasure! Let me know if you need more assistance with your museum data.",
        "Glad I could help! Feel free to ask about reports, analytics, or any museum insights."
      ];
      response = thanks[Math.floor(Math.random() * thanks.length)];
    } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      response = `I'm your museum AI assistant! I can help you with:

📊 **Reports**: Generate visitor analytics, financial reports, event performance, and more
📈 **Analytics**: Analyze trends, patterns, and insights from your museum data
💡 **Recommendations**: Provide actionable suggestions for improvement
🔍 **Data Analysis**: Deep dive into visitor behavior, exhibit popularity, and staff performance

What would you like to explore?`;
    } else if (lowerMessage.includes('visitor') || lowerMessage.includes('trend') || lowerMessage.includes('people') || lowerMessage.includes('guest')) {
      const visitorResponses = [
        `I can see you have ${currentData.recentVisitors} visitors in the last 30 days. Would you like me to generate a detailed complete museum entry analytics report with full visitor information to show trends and patterns?`,
        `Great question! Your museum has welcomed ${currentData.recentVisitors} visitors recently. I can analyze visitor demographics, peak times, and engagement patterns. Should I generate a comprehensive visitor report?`,
        `Excellent! I can help you understand your ${currentData.recentVisitors} visitors better. I can show you visitor trends, demographics, and behavior patterns. Would you like a detailed visitor analytics report?`
      ];
      response = visitorResponses[Math.floor(Math.random() * visitorResponses.length)];
      actions.push({
        type: 'generate_report',
        label: 'Generate Complete Museum Entry Analytics Report',
        icon: 'fa-users',
        params: { reportType: 'visitor_analytics' }
      });
    } else if (lowerMessage.includes('financial') || lowerMessage.includes('donation') || lowerMessage.includes('money') || lowerMessage.includes('revenue')) {
      const financialResponses = [
        `Your museum has received ${currentData.recentDonations.count} donations totaling $${currentData.recentDonations.amount.toFixed(2)} in the last 30 days. I can generate a comprehensive financial report for you.`,
        `Great! I can see ${currentData.recentDonations.count} donations totaling $${currentData.recentDonations.amount.toFixed(2)} recently. Would you like me to analyze donation trends and financial insights?`,
        `Excellent! Your museum has received $${currentData.recentDonations.amount.toFixed(2)} from ${currentData.recentDonations.count} donations. I can provide detailed financial analysis and recommendations.`
      ];
      response = financialResponses[Math.floor(Math.random() * financialResponses.length)];
      actions.push({
        type: 'generate_report',
        label: 'Generate Financial Report',
        icon: 'fa-chart-line',
        params: { reportType: 'financial_report' }
      });
    } else if (lowerMessage.includes('event') || lowerMessage.includes('exhibit') || lowerMessage.includes('activity')) {
      const eventResponses = [
        `You've had ${currentData.recentEvents} events in the last 30 days. Would you like me to analyze the performance of these events?`,
        `Great! I can see ${currentData.recentEvents} events recently. I can analyze event attendance, success metrics, and provide recommendations for future events.`,
        `Excellent! Your museum has hosted ${currentData.recentEvents} events. I can show you which events were most successful and suggest improvements for future planning.`
      ];
      response = eventResponses[Math.floor(Math.random() * eventResponses.length)];
      actions.push({
        type: 'generate_report',
        label: 'Generate Event Performance Report',
        icon: 'fa-calendar-week',
        params: { reportType: 'event_performance' }
      });
    } else if (lowerMessage.includes('exhibit')) {
      response = `I can help you analyze which exhibits are most popular with visitors. Would you like me to generate an exhibit analytics report?`;
      actions.push({
        type: 'generate_report',
        label: 'Generate Exhibit Analytics Report',
        icon: 'fa-eye',
        params: { reportType: 'exhibit_analytics' }
      });
    } else if (lowerMessage.includes('staff')) {
      response = `I can analyze staff performance and productivity metrics. Would you like me to generate a staff performance report?`;
      actions.push({
        type: 'generate_report',
        label: 'Generate Staff Performance Report',
        icon: 'fa-user-tie',
        params: { reportType: 'staff_performance' }
      });
    } else {
      // Context-aware default responses based on conversation history
      if (isDiscussingVisitors) {
        const visitorResponses = [
          `Great! I can help you dive deeper into visitor analytics. Would you like me to generate a detailed visitor report showing demographics, trends, and patterns?`,
          `Perfect! Let's explore your visitor data further. I can analyze visitor behavior, peak times, and engagement patterns. What specific aspect would you like to focus on?`,
          `Excellent! I'm ready to help you with visitor insights. Should I generate a comprehensive visitor analytics report or focus on a specific visitor trend?`
        ];
        response = visitorResponses[Math.floor(Math.random() * visitorResponses.length)];
        actions.push({
          type: 'generate_report',
          label: 'Generate Visitor Analytics Report',
          icon: 'fa-users',
          params: { reportType: 'visitor_analytics' }
        });
      } else if (isDiscussingReports) {
        const reportResponses = [
          `I'm ready to generate that report for you! What specific data would you like me to include in the analysis?`,
          `Perfect! I can create a comprehensive report with insights and recommendations. What time period should I focus on?`,
          `Great! Let me prepare a detailed report for you. Would you like me to include trends, comparisons, and actionable recommendations?`
        ];
        response = reportResponses[Math.floor(Math.random() * reportResponses.length)];
      } else if (isDiscussingEvents) {
        const eventResponses = [
          `I can help you analyze your events and exhibits! Would you like me to generate an event performance report?`,
          `Perfect! Let's look at your event data. I can show you which events are most successful and suggest improvements.`,
          `Great! I'm ready to analyze your events. Should I focus on attendance, engagement, or overall performance metrics?`
        ];
        response = eventResponses[Math.floor(Math.random() * eventResponses.length)];
        actions.push({
          type: 'generate_report',
          label: 'Generate Event Performance Report',
          icon: 'fa-calendar-week',
          params: { reportType: 'event_performance' }
        });
      } else if (isDiscussingFinancial) {
        const financialResponses = [
          `I can help you with financial analysis! Would you like me to generate a comprehensive financial report?`,
          `Perfect! Let's examine your financial data. I can analyze donations, revenue trends, and financial insights.`,
          `Great! I'm ready to help with financial analytics. Should I focus on donations, revenue, or overall financial health?`
        ];
        response = financialResponses[Math.floor(Math.random() * financialResponses.length)];
        actions.push({
          type: 'generate_report',
          label: 'Generate Financial Report',
          icon: 'fa-chart-line',
          params: { reportType: 'financial_report' }
        });
      } else {
        // General default response with variety
        const defaultResponses = [
          "I'm here to help you with your museum data! You can ask me about visitors, events, donations, exhibits, staff performance, or request any type of report.",
          "Hello! I'm your museum assistant. I can generate reports, analyze trends, and provide insights about your museum operations.",
          "Hi there! I'm ready to help you explore your museum data. What would you like to know about visitors, events, or analytics?",
          "Greetings! I'm here to assist you with museum reports and analytics. How can I help you today?"
        ];
        response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
      }
    }

    return {
      response: response,
      actions: actions
    };
  }
}

module.exports = new AIService(); 