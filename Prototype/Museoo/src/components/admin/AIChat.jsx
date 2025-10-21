import React, { useState, useRef, useEffect } from "react";
import api from "../../config/api";

const AIChat = ({ onGenerateReport }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hi! I'm your IMMS. I can help you generate reports and analyze your museum data. What would you like to explore?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState({ available: false, provider: 'Unknown' });
  const [conversationMode, setConversationMode] = useState('general'); // general, report, analysis
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reportType, setReportType] = useState('all'); // all, 1month, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [waitingForDateRange, setWaitingForDateRange] = useState(false);
  const [pendingReportRequest, setPendingReportRequest] = useState('');
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [visitorReportType, setVisitorReportType] = useState(null); // 'graph' or 'list'
  const [waitingForVisitorDateRange, setWaitingForVisitorDateRange] = useState(false);
  const [waitingForVisitorYearSelection, setWaitingForVisitorYearSelection] = useState(false);
  const [waitingForVisitorMonthSelection, setWaitingForVisitorMonthSelection] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [eventParticipantsReportType, setEventParticipantsReportType] = useState(null); // 'graph' or 'list'
  const [waitingForEventParticipantsDateRange, setWaitingForEventParticipantsDateRange] = useState(false);
  const [eventParticipantsStartDate, setEventParticipantsStartDate] = useState('');
  const [eventParticipantsEndDate, setEventParticipantsEndDate] = useState('');
  const [availableEvents, setAvailableEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [waitingForEventListDateRange, setWaitingForEventListDateRange] = useState(false);
  const [waitingForEventListDateSelection, setWaitingForEventListDateSelection] = useState(false);
  const [waitingForDonationDateRange, setWaitingForDonationDateRange] = useState(false);
  const [waitingForCulturalObjectDateRange, setWaitingForCulturalObjectDateRange] = useState(false);
  const [waitingForArchiveDateRange, setWaitingForArchiveDateRange] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Helper function to get month name
  const getMonthName = (monthNumber) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNumber - 1] || '';
  };

  // Auto-resize textarea based on content
  const autoResizeTextarea = (textarea) => {
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const minHeight = 44; // Minimum height in pixels
      const maxHeight = 120; // Maximum height in pixels
      textarea.style.height = Math.min(Math.max(scrollHeight, minHeight), maxHeight) + 'px';
    }
  };

  // Handle input change with auto-resize
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    autoResizeTextarea(e.target);
  };

  const handleReportTypeChange = async (type) => {
    setReportType(type);
    if (type === 'custom') {
      setShowDatePicker(true);
      // Start with blank dates for custom range
      setEndDate('');
      setStartDate('');
    } else if (type === 'all') {
      // Auto-generate report for all data
      setIsAutoGenerating(true);
      setShowDatePicker(false);
      setWaitingForDateRange(false);
      
      // Generate the report immediately
      try {
        const reportResponse = await generateReportWithDateRange(pendingReportRequest);
        if (reportResponse) {
          const aiMessage = {
            id: Date.now(),
            type: 'ai',
            content: reportResponse.message,
            timestamp: new Date(),
            report: reportResponse.report
          };
          setMessages(prev => [...prev, aiMessage]);
          
          // Pass the generated report to parent component
          if (reportResponse.report && onGenerateReport) {
            console.log('Passing report to parent component from auto-generation:', reportResponse.report);
            onGenerateReport(reportResponse.report);
          }
        }
      } catch (error) {
        console.error('Error auto-generating all data report:', error);
      } finally {
        setIsAutoGenerating(false);
      }
    } else if (type === '1month') {
      // Auto-generate report for 1 month
      setIsAutoGenerating(true);
      setShowDatePicker(false);
      setWaitingForDateRange(false);
      
      // Generate the report immediately
      try {
        const reportResponse = await generateReportWithDateRange(pendingReportRequest);
        if (reportResponse) {
          const aiMessage = {
            id: Date.now(),
            type: 'ai',
            content: reportResponse.message,
            timestamp: new Date(),
            report: reportResponse.report
          };
          setMessages(prev => [...prev, aiMessage]);
          
          // Pass the generated report to parent component
          if (reportResponse.report && onGenerateReport) {
            console.log('Passing report to parent component from auto-generation:', reportResponse.report);
            onGenerateReport(reportResponse.report);
          }
        }
      } catch (error) {
        console.error('Error auto-generating 1-month report:', error);
      } finally {
        setIsAutoGenerating(false);
      }
    } else {
      setShowDatePicker(false);
    }
  };

  const cancelReportGeneration = () => {
    setWaitingForDateRange(false);
    setPendingReportRequest('');
    setShowDatePicker(false);
    setReportType('all');
    
    const cancelMessage = {
      id: Date.now() + 1,
      type: 'ai',
      content: "No problem! Feel free to ask for a different report or any other assistance.",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, cancelMessage]);
  };

  const generateReportWithDateRange = async (userRequest) => {
    try {
      let dateRange = '';
      
      if (reportType === 'all') {
        // No date range - include all data
        dateRange = 'for all available data';
      } else if (reportType === '1month') {
        // Use this month (from 1st of current month to end of current month)
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month
        dateRange = `from ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`;
      } else if (reportType === 'custom' && startDate && endDate) {
        dateRange = `from ${startDate} to ${endDate}`;
      }
      
      const requestWithDate = `${userRequest} ${dateRange}`;
      console.log('📅 Generating report with date range:', dateRange);
      return await generateReport(requestWithDate);
    } catch (error) {
      console.error('Error generating report with date range:', error);
      return null;
    }
  };

  useEffect(() => {
    scrollToBottom();
    checkAIStatus();
  }, [messages]);

  // Auto-resize textarea when inputMessage changes programmatically
  useEffect(() => {
    if (textareaRef.current && inputMessage) {
      autoResizeTextarea(textareaRef.current);
    }
  }, [inputMessage]);

  // Auto-generate report when both custom dates are selected
  useEffect(() => {
    if (reportType === 'custom' && startDate && endDate && waitingForDateRange && pendingReportRequest && !isAutoGenerating) {
      // Small delay to ensure UI updates properly
      const timer = setTimeout(() => {
        handleManualGenerate();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [startDate, endDate, reportType, waitingForDateRange, pendingReportRequest, isAutoGenerating]);

  // Manual generate function for custom date ranges
  const handleManualGenerate = async () => {
    if (reportType === 'custom' && startDate && endDate && waitingForDateRange && pendingReportRequest) {
      try {
        setIsAutoGenerating(true);
        setWaitingForDateRange(false);
        setShowDatePicker(false);
        
        const reportResponse = await generateReportWithDateRange(pendingReportRequest);
        if (reportResponse) {
          const aiMessage = {
            id: Date.now(),
            type: 'ai',
            content: reportResponse.message,
            timestamp: new Date(),
            report: reportResponse.report
          };
          setMessages(prev => [...prev, aiMessage]);
          
          // Pass the generated report to parent component
          if (reportResponse.report && onGenerateReport) {
            console.log('Passing report to parent component from manual generation:', reportResponse.report);
            onGenerateReport(reportResponse.report);
          }
        }
      } catch (error) {
        console.error('Error generating custom date report:', error);
      } finally {
        setIsAutoGenerating(false);
      }
    }
  };

  const checkAIStatus = async () => {
    try {
      const response = await api.get('/api/reports/ai-status');
      if (response.data.success) {
        setAiStatus(response.data.status);
      }
    } catch (error) {
      console.error('Error checking AI status:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const message = inputMessage.trim();
    setInputMessage("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
    setIsLoading(true);

    try {
      // Handle simple acknowledgments first
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('thank') || lowerMessage.includes('thanks') || 
          lowerMessage.includes('ok') || lowerMessage.includes('okay') ||
          lowerMessage.includes('great') || lowerMessage.includes('good') ||
          lowerMessage.includes('perfect') || lowerMessage.includes('awesome')) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "You're welcome! Is there anything else I can help you with?",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        return;
      }

      // Handle simple "yes" responses
      if (lowerMessage === 'yes' || lowerMessage === 'yeah' || lowerMessage === 'yep' || 
          lowerMessage === 'sure' || lowerMessage === 'of course') {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "Great! What would you like me to help you with? You can ask me to generate reports, analyze data, or just tell me what you need.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        return;
      }

      // Handle simple "no" responses
      if (lowerMessage === 'no' || lowerMessage === 'nope' || lowerMessage === 'not really' || 
          lowerMessage === 'that\'s all' || lowerMessage === 'all good') {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "Perfect! Feel free to reach out anytime if you need help with reports or data analysis. Have a great day!",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        return;
      }

      // Handle visitor report type selection (if visitor is specified OR if we're in visitor context)
      const isInVisitorContext = messages.some(msg => 
        msg.type === 'ai' && msg.showVisitorOptions
      );
      
      if (visitorReportType === null && (message.toLowerCase().includes('graph') || message.toLowerCase().includes('list') || message.toLowerCase().includes('visitor list')) && (message.toLowerCase().includes('visitor') || isInVisitorContext)) {
        if (message.toLowerCase().includes('graph')) {
          handleVisitorReportTypeSelection('graph');
        } else if (message.toLowerCase().includes('list') || message.toLowerCase().includes('visitor list')) {
          handleVisitorReportTypeSelection('list');
        }
        return;
      }

      // Handle event participants report type selection
      if (eventParticipantsReportType === null && (message.toLowerCase().includes('analytics') || message.toLowerCase().includes('performance') || message.toLowerCase().includes('attendance') || message.toLowerCase().includes('event list') || message.toLowerCase().includes('participants'))) {
        if (message.toLowerCase().includes('analytics')) {
          handleEventParticipantsReportTypeSelection('analytics');
        } else if (message.toLowerCase().includes('performance')) {
          handleEventParticipantsReportTypeSelection('performance');
        } else if (message.toLowerCase().includes('attendance')) {
          handleEventParticipantsReportTypeSelection('attendance');
        } else if (message.toLowerCase().includes('event list')) {
          // For event list, ask for date range first
          const aiMessage = {
            id: Date.now() + 1,
            type: 'ai',
            content: `Perfect! For the Event List Report, please specify the date range. You can choose from the options below or type a custom date range:`,
            timestamp: new Date(),
            showEventListDateSelectionOptions: true
          };
          setMessages(prev => [...prev, aiMessage]);
          setWaitingForEventListDateSelection(true);
        } else if (message.toLowerCase().includes('list')) {
          handleEventParticipantsReportTypeSelection('list');
        } else if (message.toLowerCase().includes('participants')) {
          handleEventParticipantsReportTypeSelection('participants');
        }
        return;
      }

      // Handle visitor date range selection
      if (waitingForVisitorDateRange) {
        if (lowerMessage.includes('all') || lowerMessage.includes('complete') || lowerMessage.includes('everything')) {
          handleVisitorDateRangeSelection('all', 'all');
        } else if (lowerMessage.includes('month') || lowerMessage.includes('recent') || lowerMessage.includes('last')) {
          handleVisitorDateRangeSelection('1month', 'all');
        } else if (lowerMessage.includes('custom') || lowerMessage.includes('specific') || lowerMessage.includes('range')) {
          handleVisitorDateRangeSelection('custom', 'custom');
        } else {
          // Default to all data if unclear
          handleVisitorDateRangeSelection('all', 'all');
        }
        return;
      }

      // Handle event participants date range selection
      if (waitingForEventParticipantsDateRange) {
        if (lowerMessage.includes('all') || lowerMessage.includes('complete') || lowerMessage.includes('everything')) {
          handleEventParticipantsDateRangeSelection('all', 'all');
        } else if (lowerMessage.includes('month') || lowerMessage.includes('recent') || lowerMessage.includes('last')) {
          handleEventParticipantsDateRangeSelection('1month', 'all');
        } else if (lowerMessage.includes('custom') || lowerMessage.includes('specific') || lowerMessage.includes('range')) {
          handleEventParticipantsDateRangeSelection('custom', 'custom');
        } else {
          // Default to all data if unclear
          handleEventParticipantsDateRangeSelection('all', 'all');
        }
        return;
      }

      // Handle event list date range selection
      if (waitingForEventListDateRange) {
        if (lowerMessage.includes('all') || lowerMessage.includes('complete') || lowerMessage.includes('everything')) {
          handleEventListDateRangeSelection('all', 'all');
        } else if (lowerMessage.includes('month') || lowerMessage.includes('recent') || lowerMessage.includes('last')) {
          handleEventListDateRangeSelection('1month', 'all');
        } else if (lowerMessage.includes('custom') || lowerMessage.includes('specific') || lowerMessage.includes('range')) {
          handleEventListDateRangeSelection('custom', 'custom');
        } else {
          // Default to all data if unclear
          handleEventListDateRangeSelection('all', 'all');
        }
        return;
      }

      // Handle event list date selection (new dedicated handler)
      if (waitingForEventListDateSelection) {
        if (lowerMessage.includes('all') || lowerMessage.includes('complete') || lowerMessage.includes('everything')) {
          handleEventListDateSelection('all', 'all');
        } else if (lowerMessage.includes('month') || lowerMessage.includes('recent') || lowerMessage.includes('last')) {
          handleEventListDateSelection('1month', 'all');
        } else if (lowerMessage.includes('custom') || lowerMessage.includes('specific') || lowerMessage.includes('range')) {
          handleEventListDateSelection('custom', 'custom');
        } else {
          // Default to all data if unclear
          handleEventListDateSelection('all', 'all');
        }
        return;
      }

      // Handle donation date range selection
      if (waitingForDonationDateRange) {
        if (lowerMessage.includes('all') || lowerMessage.includes('complete') || lowerMessage.includes('everything')) {
          handleDonationDateRangeSelection('all', 'all');
        } else if (lowerMessage.includes('month') || lowerMessage.includes('recent') || lowerMessage.includes('last')) {
          handleDonationDateRangeSelection('1month', 'all');
        } else if (lowerMessage.includes('custom') || lowerMessage.includes('specific') || lowerMessage.includes('range')) {
          handleDonationDateRangeSelection('custom', 'custom');
        } else {
          // Default to all data if unclear
          handleDonationDateRangeSelection('all', 'all');
        }
        return;
      }

      // Handle cultural object date range selection
      if (waitingForCulturalObjectDateRange) {
        if (lowerMessage.includes('all') || lowerMessage.includes('complete') || lowerMessage.includes('everything')) {
          handleCulturalObjectDateRangeSelection('all', 'all');
        } else if (lowerMessage.includes('month') || lowerMessage.includes('recent') || lowerMessage.includes('last')) {
          handleCulturalObjectDateRangeSelection('1month', 'all');
        } else if (lowerMessage.includes('custom') || lowerMessage.includes('specific') || lowerMessage.includes('range')) {
          handleCulturalObjectDateRangeSelection('custom', 'custom');
        } else {
          // Default to all data if unclear
          handleCulturalObjectDateRangeSelection('all', 'all');
        }
        return;
      }

      // Handle archive date range selection
      if (waitingForArchiveDateRange) {
        if (lowerMessage.includes('all') || lowerMessage.includes('complete') || lowerMessage.includes('everything')) {
          handleArchiveDateRangeSelection('all', 'all');
        } else if (lowerMessage.includes('month') || lowerMessage.includes('recent') || lowerMessage.includes('last')) {
          handleArchiveDateRangeSelection('1month', 'all');
        } else if (lowerMessage.includes('custom') || lowerMessage.includes('specific') || lowerMessage.includes('range')) {
          handleArchiveDateRangeSelection('custom', 'custom');
        } else {
          // Default to all data if unclear
          handleArchiveDateRangeSelection('all', 'all');
        }
        return;
      }

      // Check if this is just "list" without specifying visitor, event, or donation
      const isJustListRequest = lowerMessage.includes('list') && 
                               !lowerMessage.includes('visitor') && 
                               !lowerMessage.includes('event') &&
                               !lowerMessage.includes('donation');

      if (isJustListRequest) {
        // Ask for clarification - which list do they want?
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "I can generate different types of list reports for you. Which list would you like?",
          timestamp: new Date(),
          showListTypeOptions: true
        };
        setMessages(prev => [...prev, aiMessage]);
        return;
      }

      // Check if this is an event report request (more specific)
      const isEventReportRequest = lowerMessage.includes('event') && 
                                 (lowerMessage.includes('report') || 
                                  lowerMessage.includes('generate') || 
                                  lowerMessage.includes('create') ||
                                  lowerMessage.includes('analytics') ||
                                  lowerMessage.includes('summary') ||
                                  lowerMessage.includes('list'));

      if (isEventReportRequest) {
        // Show event report type options
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "Great! I can generate an Event Report for you. Please choose the type of report you'd like:",
          timestamp: new Date(),
          showEventParticipantsOptions: true
        };
        setMessages(prev => [...prev, aiMessage]);
        return;
      }

      // Handle donation list request (check this first before generic donation)
      if (lowerMessage.includes('donation list')) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "Great! I'll generate a donation list report for you. Please select your preferred date range:",
          timestamp: new Date(),
          showDonationDateOptions: true
        };
        setMessages(prev => [...prev, aiMessage]);
        setWaitingForDonationDateRange(true);
        setPendingReportRequest('donation list'); // Store the specific request
        return;
      }

      // Handle donation type selection
      if (lowerMessage.includes('donation type')) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "Perfect! Please select the specific donation type you want to filter by:",
          timestamp: new Date(),
          showDonationTypeOptions: true
        };
        setMessages(prev => [...prev, aiMessage]);
        return;
      }

      // Check if this is a donation request (just "donation" is enough)
      const isDonationRequest = lowerMessage.includes('donation');

      if (isDonationRequest) {
        // Show donation report type options
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "Great! I can generate a Donation Report for you. Please choose the type of report you'd like:",
          timestamp: new Date(),
          showDonationOptions: true
        };
        setMessages(prev => [...prev, aiMessage]);
        return;
      }

      // Handle specific donation type selections
      if (lowerMessage.includes('monetary') || lowerMessage.includes('loan') || lowerMessage.includes('donated')) {
        let donationType = '';
        if (lowerMessage.includes('monetary')) {
          donationType = 'monetary';
        } else if (lowerMessage.includes('loan')) {
          donationType = 'loan';
        } else if (lowerMessage.includes('donated')) {
          donationType = 'donated';
        }
        
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: `Great! I'll generate a report for ${donationType} donations. Please select your preferred date range:`,
          timestamp: new Date(),
          showDatePicker: true,
          donationType: donationType
        };
        setMessages(prev => [...prev, aiMessage]);
        setWaitingForDateRange(true);
        setShowDatePicker(true);
        setReportType('all');
        return;
      }

      // Check if this is a visitor report request
      const isVisitorReportRequest = lowerMessage.includes('visitor') && 
                                   (lowerMessage.includes('report') || 
                                    lowerMessage.includes('generate') || 
                                    lowerMessage.includes('create') ||
                                    lowerMessage.includes('analytics') ||
                                    lowerMessage.includes('summary') ||
                                    lowerMessage.includes('list') ||
                                    lowerMessage.includes('graph'));

      console.log('Checking visitor report request:', {
        lowerMessage,
        includesVisitor: lowerMessage.includes('visitor'),
        includesReport: lowerMessage.includes('report'),
        isVisitorReportRequest
      });

      if (isVisitorReportRequest) {
        // Show visitor report type options
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "Great! I can generate a Visitor Report for you. Please choose the type of report you'd like:",
          timestamp: new Date(),
          showVisitorOptions: true
        };
        setMessages(prev => [...prev, aiMessage]);
        return;
      }

      // Check if this is an event participants report request
      const isEventParticipantsRequest = (lowerMessage.includes('event') && 
                                        (lowerMessage.includes('participant') || lowerMessage.includes('participants'))) ||
                                       (lowerMessage.includes('participant') && 
                                        (lowerMessage.includes('report') || lowerMessage.includes('generate') || 
                                         lowerMessage.includes('create') || lowerMessage.includes('analytics') ||
                                         lowerMessage.includes('summary') || lowerMessage.includes('list') ||
                                         lowerMessage.includes('graph')));

      if (isEventParticipantsRequest) {
        // Show event participants report type options
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "Great! I can generate an Event Participants Report for you. Please choose the type of report you'd like:",
          timestamp: new Date(),
          showEventParticipantsOptions: true
        };
        setMessages(prev => [...prev, aiMessage]);
        return;
      }

      // Check if this is an archive analysis report request
      const isArchiveAnalysisRequest = (lowerMessage.includes('archive') && 
                                      (lowerMessage.includes('analysis') || lowerMessage.includes('report') || 
                                       lowerMessage.includes('generate') || lowerMessage.includes('create') ||
                                       lowerMessage.includes('analytics') || lowerMessage.includes('summary'))) ||
                                     (lowerMessage.includes('analysis') && 
                                      (lowerMessage.includes('archive') || lowerMessage.includes('digital')));

      if (isArchiveAnalysisRequest) {
        // Show archive analysis report options
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "Excellent! I can generate an Archive Analysis Report for you. This will analyze your digital archive usage and provide insights on popular content. Please select your preferred date range:",
          timestamp: new Date(),
          showArchiveDateOptions: true
        };
        setMessages(prev => [...prev, aiMessage]);
        setPendingReportRequest("Analyze our digital archive usage and provide insights on popular content");
        setWaitingForArchiveDateRange(true);
        return;
      }

      // Check if this is a general report generation request
      const isReportRequest = lowerMessage.includes('report') || 
                             lowerMessage.includes('generate') || 
                             lowerMessage.includes('create') ||
                             lowerMessage.includes('analytics') ||
                             lowerMessage.includes('summary') ||
                             lowerMessage.includes('event') ||
                             lowerMessage.includes('exhibit') ||
                             lowerMessage.includes('cultural') ||
                             lowerMessage.includes('object') ||
                             lowerMessage.includes('archive') ||
                             lowerMessage.includes('financial');
      
      if (isReportRequest && !waitingForDateRange) {
        // Show date picker immediately with AI response
        setPendingReportRequest(inputMessage);
        setWaitingForDateRange(true);
        setShowDatePicker(true);
        setReportType('all'); // Default to all data
        
        // Determine the specific report type based on input
        let reportTypeName = 'report';
        if (lowerMessage.includes('cultural') || lowerMessage.includes('object')) {
          reportTypeName = 'Cultural Objects Report';
        } else if (lowerMessage.includes('visitor')) {
          reportTypeName = 'Visitor Analytics Report';
        } else if (lowerMessage.includes('donation')) {
          reportTypeName = 'Donation Report';
        } else if (lowerMessage.includes('event')) {
          reportTypeName = 'Events Report';
        } else if (lowerMessage.includes('exhibit')) {
          reportTypeName = 'Exhibits Report';
        } else if (lowerMessage.includes('archive')) {
          reportTypeName = 'Archive Report';
        } else if (lowerMessage.includes('financial')) {
          reportTypeName = 'Financial Report';
        }

        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: `Perfect! I can generate a ${reportTypeName} for you. Please select your preferred date range:`,
          timestamp: new Date(),
          needsDateRange: true,
          showDatePicker: true
        };
        setMessages(prev => [...prev, aiMessage]);
        
      } else if (waitingForDateRange && lowerMessage.includes('cancel')) {
        // Cancel report generation
        cancelReportGeneration();
      } else if (waitingForDateRange && (lowerMessage.includes('generate') || lowerMessage.includes('create') || lowerMessage.includes('yes') || lowerMessage.includes('ok') || lowerMessage.includes('start'))) {
        // Generate the report with the selected date range
        const reportResponse = await generateReportWithDateRange(pendingReportRequest);
        
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: reportResponse.message,
          timestamp: new Date(),
          report: reportResponse.report
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Pass the generated report to parent component
        if (reportResponse.report && onGenerateReport) {
          console.log('Passing report to parent component:', reportResponse.report);
          onGenerateReport(reportResponse.report);
        } else {
          console.log('No report to pass or no onGenerateReport function');
        }
        
        // Reset the conversational state
        setWaitingForDateRange(false);
        setPendingReportRequest('');
        setShowDatePicker(false);
        setConversationMode('report');
      } else {
        // Regular chat response
        const response = await api.post('/api/reports/ai-chat', {
          message: inputMessage,
          conversationHistory: messages.slice(-10) // Send last 10 messages for context
        });

        if (response.data.success) {
          const aiMessage = {
            id: Date.now() + 1,
            type: 'ai',
            content: response.data.response,
            timestamp: new Date(),
            actions: response.data.actions || [],
            isVaguePrompt: response.data.isVaguePrompt || false
          };
          setMessages(prev => [...prev, aiMessage]);
          
          // Update conversation mode based on user input
          if (response.data.isVaguePrompt) {
            setConversationMode('suggestions');
          } else if (lowerMessage.includes('analyze') || lowerMessage.includes('trend')) {
            setConversationMode('analysis');
          } else if (lowerMessage.includes('improve') || lowerMessage.includes('suggest') || lowerMessage.includes('recommend')) {
            setConversationMode('improvement');
          }
        } else {
          throw new Error(response.data.message || 'Failed to get AI response');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I'm sorry, I encountered an error. Please try again or check your connection.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisitorReportTypeSelection = (reportType) => {
    setVisitorReportType(reportType);
    
    if (reportType === 'graph') {
      // Ask for year selection for visitor graph
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "Perfect! For the Visitor Graph Report, please select which year you want to generate the visitor graph for:",
        timestamp: new Date(),
        showYearOptions: true
      };
      setMessages(prev => [...prev, aiMessage]);
      setWaitingForVisitorYearSelection(true);
    } else if (reportType === 'list') {
      // Ask for date range for list report
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "Perfect! For the List Report, please specify the date range. You can choose from the options below or type a custom date range:",
        timestamp: new Date(),
        showDateOptions: true
      };
      setMessages(prev => [...prev, aiMessage]);
      setWaitingForVisitorDateRange(true);
    }
  };

  const handleVisitorDateRangeSelection = (startDate, endDate) => {
    if (startDate === 'custom' && endDate === 'custom') {
      // Show custom date picker
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "Perfect! Please select your custom date range:",
        timestamp: new Date(),
        showCustomDatePicker: true
      };
      setMessages(prev => [...prev, aiMessage]);
      setWaitingForVisitorDateRange(true);
    } else {
      setWaitingForVisitorDateRange(false);
      generateVisitorReport('visitor_list', startDate, endDate);
    }
  };

  const handleVisitorYearSelection = (year) => {
    setWaitingForVisitorYearSelection(false);
    setSelectedYear(year);
    
    // Ask for month selection
    const aiMessage = {
      id: Date.now() + 1,
      type: 'ai',
      content: `Great! You selected ${year}. Now, would you like to generate the graph for the entire year or select a specific month?`,
      timestamp: new Date(),
      showMonthOptions: true
    };
    setMessages(prev => [...prev, aiMessage]);
    setWaitingForVisitorMonthSelection(true);
  };

  const handleVisitorMonthSelection = (month) => {
    setWaitingForVisitorMonthSelection(false);
    
    if (month === 'all') {
      // Generate for entire year
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;
      generateVisitorReport('visitor_analytics', startDate, endDate, selectedYear, 'all');
    } else {
      // Generate for specific month
      const startDate = `${selectedYear}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, month, 0).getDate();
      const endDate = `${selectedYear}-${month.toString().padStart(2, '0')}-${lastDay}`;
      generateVisitorReport('visitor_analytics', startDate, endDate, selectedYear, month);
    }
  };

  const generateVisitorReport = async (reportType, startDate, endDate, year = null, month = null) => {
    try {
      console.log('Generating visitor report:', reportType, startDate, endDate, 'Year:', year, 'Month:', month);
      
      const response = await api.post('/api/reports/generate', {
        reportType: reportType,
        startDate: startDate,
        endDate: endDate,
        year: year,
        month: month,
        includeCharts: reportType === 'visitor_analytics',
        includeRecommendations: true,
        includePredictions: false,
        includeComparisons: false,
        prompt: `Generate ${reportType === 'visitor_analytics' ? 'visitor analytics' : 'visitor list'} report${year ? ` for ${year}` : ''}${month && month !== 'all' ? ` - ${getMonthName(month)}` : ''}`
      });

      if (response.data.success) {
        const reportResponse = {
          success: true,
          report: response.data.report
        };
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: `Perfect! I've generated your ${reportType === 'visitor_analytics' ? 'Visitor Analytics Report with Charts' : 'Visitor List Report'}. The report includes comprehensive visitor data and is ready for viewing.`,
          timestamp: new Date(),
          report: reportResponse.report
        };
        setMessages(prev => [...prev, aiMessage]);
        if (reportResponse.report && onGenerateReport) {
          console.log('Passing visitor report to parent component:', reportResponse.report);
          onGenerateReport(reportResponse.report);
        }
        setVisitorReportType(null);
      } else {
        throw new Error(response.data.message || 'Failed to generate visitor report');
      }
    } catch (error) {
      console.error('Error generating visitor report:', error);
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: `I'm sorry, I encountered an error while generating your visitor report: ${error.message}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setVisitorReportType(null);
    }
  };

  const handleEventParticipantsReportTypeSelection = async (reportType) => {
    // First, fetch available events
    try {
      console.log('Fetching events for report type:', reportType);
      const response = await api.get('/api/event-registrations/events');
      console.log('Events response:', response.data);
      const events = response.data.events || [];
      setAvailableEvents(events);
      
      const reportTypeNames = {
        'list': 'Event List Report',
        'participants': 'Event Participants Report'
      };
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: `Great! For the ${reportTypeNames[reportType]}, please select which event you'd like to analyze:`,
        timestamp: new Date(),
        showEventSelection: true,
        events: events
      };
      setMessages(prev => [...prev, aiMessage]);
      setEventParticipantsReportType(reportType);
    } catch (error) {
      console.error('Error fetching events:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: `Sorry, I couldn't fetch the available events. Error: ${error.message}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleEventParticipantsDateRangeSelection = (startDate, endDate) => {
    if (startDate === 'custom' && endDate === 'custom') {
      // Show custom date picker
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "Perfect! Please select your custom date range for the event participants report:",
        timestamp: new Date(),
        showEventParticipantsCustomDatePicker: true
      };
      setMessages(prev => [...prev, aiMessage]);
      setWaitingForEventParticipantsDateRange(true);
    } else {
      setWaitingForEventParticipantsDateRange(false);
      // Use the correct report type and pass the selected event ID
      const reportType = eventParticipantsReportType === 'attendance' ? 'event_attendance' : 
                        eventParticipantsReportType === 'analytics' ? 'event_analytics' : 
                        eventParticipantsReportType === 'performance' ? 'event_performance' : 'event_attendance';
      generateEventParticipantsReport(reportType, startDate, endDate, selectedEventId);
    }
  };

  const handleEventListDateRangeSelection = (startDate, endDate) => {
    if (startDate === 'custom' && endDate === 'custom') {
      // Show custom date picker
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: `Perfect! Please select your custom date range:`,
        timestamp: new Date(),
        showEventListDateOptions: true
      };
      setMessages(prev => [...prev, aiMessage]);
      setWaitingForEventListDateRange(true);
    } else {
      setWaitingForEventListDateRange(false);
      generateEventParticipantsReport('event_list', startDate, endDate);
    }
  };

  const handleEventListDateSelection = (startDate, endDate) => {
    if (startDate === 'custom' && endDate === 'custom') {
      // Show custom date picker
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "Perfect! Please select your custom date range for the event list:",
        timestamp: new Date(),
        showEventListCustomDatePicker: true
      };
      setMessages(prev => [...prev, aiMessage]);
      setWaitingForEventListDateSelection(true);
    } else {
      setWaitingForEventListDateSelection(false);
      generateEventParticipantsReport('event_list', startDate, endDate);
    }
  };

  const handleDonationDateRangeSelection = (startDate, endDate) => {
    if (startDate === 'custom' && endDate === 'custom') {
      // Show custom date picker
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "Perfect! Please select your custom date range for the donation list:",
        timestamp: new Date(),
        showDonationCustomDatePicker: true
      };
      setMessages(prev => [...prev, aiMessage]);
      setWaitingForDonationDateRange(true);
    } else {
      setWaitingForDonationDateRange(false);
      generateReportWithDateRange('donation list');
    }
  };

  const handleCulturalObjectDateRangeSelection = (startDate, endDate) => {
    if (startDate === 'custom' && endDate === 'custom') {
      // Show custom date picker
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "Perfect! Please select your custom date range for the cultural objects report:",
        timestamp: new Date(),
        showCulturalObjectCustomDatePicker: true
      };
      setMessages(prev => [...prev, aiMessage]);
      setWaitingForCulturalObjectDateRange(true);
    } else {
      setWaitingForCulturalObjectDateRange(false);
      generateReportWithDateRange('cultural objects report');
    }
  };

  const handleArchiveDateRangeSelection = (startDate, endDate) => {
    if (startDate === 'custom' && endDate === 'custom') {
      // Show custom date picker
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "Perfect! Please select your custom date range for the archive analysis:",
        timestamp: new Date(),
        showArchiveCustomDatePicker: true
      };
      setMessages(prev => [...prev, aiMessage]);
      setWaitingForArchiveDateRange(true);
    } else {
      setWaitingForArchiveDateRange(false);
      generateReportWithDateRange('archive analysis');
    }
  };

  const handleEventSelection = (eventId) => {
    console.log('Event selected:', eventId);
    console.log('Available events:', availableEvents);
    console.log('Report type:', eventParticipantsReportType);
    
    setSelectedEventId(eventId);
    const selectedEvent = availableEvents.find(event => event.id === eventId);
    console.log('Selected event:', selectedEvent);
    
    if (eventParticipantsReportType === 'participants') {
      // For participants reports, ask for date range
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: `Perfect! You selected "${selectedEvent?.name || 'Event'}". For the Event Participants Report, please specify the date range. You can choose from the options below or type a custom date range:`,
        timestamp: new Date(),
        showEventParticipantsDateOptions: true
      };
      setMessages(prev => [...prev, aiMessage]);
      setWaitingForEventParticipantsDateRange(true);
    } else {
      // For list reports, generate immediately
      const confirmationMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: `Excellent! Generating Event List Report...`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmationMessage]);
      
      setTimeout(() => {
        generateEventParticipantsReport(eventParticipantsReportType, 'all', 'all', eventId);
      }, 1000);
    }
  };

  const generateEventParticipantsReport = async (reportType, startDate, endDate, eventId = null) => {
    try {
      console.log('Generating event report:', reportType, startDate, endDate);
      
      const response = await api.post('/api/reports/generate', {
        reportType: reportType,
        startDate: startDate,
        endDate: endDate,
        eventId: eventId, // Pass the selected event ID
        includeCharts: false,
        includeRecommendations: true,
        includePredictions: false,
        includeComparisons: false,
        prompt: `Generate ${reportType === 'event_list' ? 'event list' : 'event participants'} report`
      });

      if (response.data.success) {
        const reportResponse = {
          success: true,
          report: response.data.report
        };
        
        let reportName = '';
        if (reportType === 'event_list') {
          reportName = 'Event List Report';
        } else if (reportType === 'event_participants') {
          reportName = 'Event Participants Report';
        }
        
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: `Perfect! I've generated your ${reportName}. The report includes comprehensive event data and is ready for viewing.`,
          timestamp: new Date(),
          report: reportResponse.report
        };
        setMessages(prev => [...prev, aiMessage]);
        if (reportResponse.report && onGenerateReport) {
          console.log('Passing event report to parent component:', reportResponse.report);
          onGenerateReport(reportResponse.report);
        }
      } else {
        throw new Error(response.data.message || 'Failed to generate event report');
      }
    } catch (error) {
      console.error('Error generating event report:', error);
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: `I'm sorry, I encountered an error while generating your event report: ${error.message}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    }
  };

  const generateReport = async (userRequest) => {
    try {
      console.log('Generating report for request:', userRequest);
      
      // Check if this is just "list" without specifying visitor, event, or donation
      const lowerRequest = userRequest.toLowerCase();
      const isJustListRequest = lowerRequest.includes('list') && 
                               !lowerRequest.includes('visitor') && 
                               !lowerRequest.includes('event') &&
                               !lowerRequest.includes('donation');

      if (isJustListRequest) {
        // Ask for clarification - which list do they want?
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "I can generate different types of list reports for you. Which list would you like?",
          timestamp: new Date(),
          showListTypeOptions: true
        };
        setMessages(prev => [...prev, aiMessage]);
        return;
      }
      
      // Determine report type from user request
      let reportType = 'comprehensive_dashboard';
      
      console.log('🔍 Debug: Determining report type for request:', userRequest);
      console.log('🔍 Debug: Lower request:', lowerRequest);
      
      if (lowerRequest.includes('visitor') || lowerRequest.includes('visitors')) {
        reportType = 'visitor_analytics';
        console.log('🔍 Debug: Selected visitor_analytics');
      } else if (lowerRequest.includes('cultural') || lowerRequest.includes('object')) {
        reportType = 'cultural_objects';
        console.log('🔍 Debug: Selected cultural_objects');
      } else if (lowerRequest.includes('archive') || lowerRequest.includes('digital')) {
        reportType = 'archive_analytics';
        console.log('🔍 Debug: Selected archive_analytics');
      } else if (lowerRequest.includes('donation')) {
        // Check if it's a specific donation type
        if (lowerRequest.includes('monetary') || lowerRequest.includes('loan') || lowerRequest.includes('donated')) {
          reportType = 'donation_type_report';
          console.log('🔍 Debug: Selected donation_type_report');
        } else {
          reportType = 'donation_report';
          console.log('🔍 Debug: Selected donation_report');
        }
      } else if (lowerRequest.includes('financial') || lowerRequest.includes('revenue')) {
        reportType = 'financial_report';
        console.log('🔍 Debug: Selected financial_report');
      } else if (lowerRequest.includes('event') && (lowerRequest.includes('participant') || lowerRequest.includes('attendee'))) {
        reportType = 'event_participants';
        console.log('🔍 Debug: Selected event_participants');
      } else if (lowerRequest.includes('event')) {
        reportType = 'event_list';
        console.log('🔍 Debug: Selected event_list');
      } else if (lowerRequest.includes('exhibit') && lowerRequest.includes('duration')) {
        reportType = 'exhibits_report';
      } else if (lowerRequest.includes('exhibit')) {
        reportType = 'exhibit_analytics';
      } else if (lowerRequest.includes('staff') || lowerRequest.includes('performance')) {
        reportType = 'staff_performance';
      } else if (lowerRequest.includes('predict') || lowerRequest.includes('forecast')) {
        reportType = 'predictive_analytics';
      }

      console.log('Selected report type:', reportType);

      // Natural-language date parsing
      const parseDateRange = (text) => {
        const normalize = (d) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const format = (d) => d.toISOString().split('T')[0];

        const now = new Date();
        const today = normalize(now);

        const monthNames = [
          'january','february','march','april','may','june','july','august','september','october','november','december'
        ];

        // Helpers
        const firstDayOfMonth = (year, monthIdx) => new Date(Date.UTC(year, monthIdx, 1));
        const lastDayOfMonth = (year, monthIdx) => new Date(Date.UTC(year, monthIdx + 1, 0));
        const getQuarter = (d) => Math.floor(d.getMonth() / 3) + 1;
        const quarterRange = (q, year) => {
          const startMonth = (q - 1) * 3;
          return {
            start: firstDayOfMonth(year, startMonth),
            end: lastDayOfMonth(year, startMonth + 2)
          };
        };

        const m = text.toLowerCase();

        // Explicit range: from X to Y / between X and Y
        const rangeMatch = m.match(/\b(from|between)\s+([a-z0-9 ,\/-]+?)\s+(to|and)\s+([a-z0-9 ,\/-]+)\b/);
        if (rangeMatch) {
          const startRaw = rangeMatch[2].trim();
          const endRaw = rangeMatch[4].trim();
          const s = new Date(startRaw);
          const e = new Date(endRaw);
          if (!isNaN(s) && !isNaN(e)) {
            return { startDate: format(normalize(s)), endDate: format(normalize(e)) };
          }
        }

        // Last N days
        const lastNDays = m.match(/last\s+(\d{1,3})\s+days?/);
        if (lastNDays) {
          const n = parseInt(lastNDays[1], 10);
          const start = new Date(today);
          start.setUTCDate(start.getUTCDate() - (n - 1));
          return { startDate: format(start), endDate: format(today) };
        }

        // This/Last week
        if (m.includes('this week')) {
          const day = today.getUTCDay();
          const diff = (day + 6) % 7; // Monday=0
          const start = new Date(today);
          start.setUTCDate(start.getUTCDate() - diff);
          const end = new Date(start);
          end.setUTCDate(start.getUTCDate() + 6);
          return { startDate: format(start), endDate: format(end) };
        }
        if (m.includes('last week')) {
          const day = today.getUTCDay();
          const diff = (day + 6) % 7;
          const thisWeekStart = new Date(today);
          thisWeekStart.setUTCDate(thisWeekStart.getUTCDate() - diff);
          const start = new Date(thisWeekStart);
          start.setUTCDate(start.getUTCDate() - 7);
          const end = new Date(thisWeekStart);
          end.setUTCDate(end.getUTCDate() - 1);
          return { startDate: format(start), endDate: format(end) };
        }

        // This/Last month
        if (m.includes('this month')) {
          const start = firstDayOfMonth(today.getUTCFullYear(), today.getUTCMonth());
          const end = lastDayOfMonth(today.getUTCFullYear(), today.getUTCMonth());
          return { startDate: format(start), endDate: format(end) };
        }
        if (m.includes('last month')) {
          const year = today.getUTCMonth() === 0 ? today.getUTCFullYear() - 1 : today.getUTCFullYear();
          const month = (today.getUTCMonth() + 11) % 12;
          const start = firstDayOfMonth(year, month);
          const end = lastDayOfMonth(year, month);
          return { startDate: format(start), endDate: format(end) };
        }

        // This/Last quarter
        if (m.includes('this quarter')) {
          const q = getQuarter(today);
          const { start, end } = quarterRange(q, today.getUTCFullYear());
          return { startDate: format(start), endDate: format(end) };
        }
        if (m.includes('last quarter')) {
          let q = getQuarter(today) - 1;
          let year = today.getUTCFullYear();
          if (q === 0) { q = 4; year -= 1; }
          const { start, end } = quarterRange(q, year);
          return { startDate: format(start), endDate: format(end) };
        }

        // QN YYYY (e.g., Q2 2024)
        const qMatch = m.match(/\bq([1-4])\s*(\d{4})\b/);
        if (qMatch) {
          const q = parseInt(qMatch[1], 10);
          const year = parseInt(qMatch[2], 10);
          const { start, end } = quarterRange(q, year);
          return { startDate: format(start), endDate: format(end) };
        }

        // Month [YYYY] or "for March", "in July 2024"
        for (let i = 0; i < monthNames.length; i++) {
          if (m.includes(monthNames[i])) {
            const yearMatch = m.match(/\b(20\d{2})\b/);
            const year = yearMatch ? parseInt(yearMatch[1], 10) : today.getUTCFullYear();
            const start = firstDayOfMonth(year, i);
            const end = lastDayOfMonth(year, i);
            return { startDate: format(start), endDate: format(end) };
          }
        }

        // Today / Yesterday
        if (m.includes('today')) {
          return { startDate: format(today), endDate: format(today) };
        }
        if (m.includes('yesterday')) {
          const y = new Date(today);
          y.setUTCDate(y.getUTCDate() - 1);
          return { startDate: format(y), endDate: format(y) };
        }

        // Fallback: try to parse single date like "July 15, 2024" or ISO
        const singleDate = new Date(text);
        if (!isNaN(singleDate)) {
          const d = normalize(singleDate);
          return { startDate: format(d), endDate: format(d) };
        }

        return null;
      };

      // Enhance: support phrases like "1 week", "a week", "1 day", "daily/weekly/monthly report"
      const parsed = (() => {
        const m = userRequest.toLowerCase();
        const base = parseDateRange(userRequest);
        if (base) return base;

        const normalize = (d) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const format = (d) => d.toISOString().split('T')[0];
        const today = normalize(new Date());

        // N weeks (without 'last') => last N weeks including today
        const nWeeks = m.match(/(?:for\s+)?(\d{1,2})\s+weeks?/);
        if (nWeeks) {
          const n = parseInt(nWeeks[1], 10);
          const start = new Date(today);
          start.setUTCDate(start.getUTCDate() - (n * 7 - 1));
          return { startDate: format(start), endDate: format(today) };
        }

        // N days (without 'last')
        const nDays = m.match(/(?:for\s+)?(\d{1,3})\s+days?/);
        if (nDays) {
          const n = parseInt(nDays[1], 10);
          const start = new Date(today);
          start.setUTCDate(start.getUTCDate() - (n - 1));
          return { startDate: format(start), endDate: format(today) };
        }

        // A day / one day / day report -> today
        if (m.includes('a day') || m.includes('one day') || m.includes('day report') || m.includes('daily')) {
          return { startDate: format(today), endDate: format(today) };
        }

        // A week / one week / weekly
        if (m.includes('a week') || m.includes('one week') || m.includes('weekly')) {
          const start = new Date(today);
          start.setUTCDate(start.getUTCDate() - 6);
          return { startDate: format(start), endDate: format(today) };
        }

        // Monthly -> this month
        if (m.includes('monthly')) {
          const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
          const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
          return { startDate: format(start), endDate: format(end) };
        }

        // Past week
        if (m.includes('past week')) {
          const start = new Date(today);
          start.setUTCDate(start.getUTCDate() - 6);
          return { startDate: format(start), endDate: format(today) };
        }

        // Last year / This year / YTD
        if (m.includes('last year')) {
          const year = today.getUTCFullYear() - 1;
          const start = new Date(Date.UTC(year, 0, 1));
          const end = new Date(Date.UTC(year, 11, 31));
          return { startDate: format(start), endDate: format(end) };
        }
        if (m.includes('this year') || m.includes('year to date') || m.includes('ytd')) {
          const year = today.getUTCFullYear();
          const start = new Date(Date.UTC(year, 0, 1));
          return { startDate: format(start), endDate: format(today) };
        }

        return null;
      })();
      // Handle "all data" requests
      const isAllDataRequest = userRequest.toLowerCase().includes('all available data') || 
                              userRequest.toLowerCase().includes('for all');

      let reportParams;
      
      if (isAllDataRequest) {
        // For "all data" requests, don't send specific dates
        reportParams = {
          reportType: reportType,
          startDate: 'all',
          endDate: 'all',
          aiAssisted: true,
          includeCharts: true,
          includeRecommendations: true,
          includePredictions: true,
          includeComparisons: true,
          userRequest: userRequest
        };
      } else {
        // Default if no parseable range: broader window
        const now = new Date();
        const defaultStart = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
        const defaultEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

        reportParams = {
          reportType: reportType,
          startDate: (parsed?.startDate) || defaultStart.toISOString().split('T')[0],
          endDate: (parsed?.endDate) || defaultEnd.toISOString().split('T')[0],
          aiAssisted: true,
          includeCharts: true,
          includeRecommendations: true,
          includePredictions: true,
          includeComparisons: true,
          userRequest: userRequest
        };
      }

      // Add donation type if it's a donation type report
      if (reportType === 'donation_type_report') {
        if (userRequest.toLowerCase().includes('monetary')) {
          reportParams.donationType = 'monetary';
        } else if (userRequest.toLowerCase().includes('loan')) {
          reportParams.donationType = 'loan';
        } else if (userRequest.toLowerCase().includes('donated')) {
          reportParams.donationType = 'donated';
        }
      }

      console.log('Report parameters:', reportParams);

      // Generate the report
      const response = await api.post("/api/reports/generate", reportParams);

      console.log('API response:', response.data);

      if (response.data.success) {
        const report = response.data.report;
        console.log('Generated report:', report);
        
        // Create a friendly response message
        const reportNames = {
          'visitor_analytics': 'Visitor Analytics Report',
          'exhibit_analytics': 'Cultural Objects Report',
          'archive_analytics': 'Archive Analysis Report',
          'financial_report': 'Financial Report',
          'donation_report': 'Donation Report',
          'donation_type_report': 'Donation Type Report',
          'event_list': 'Event List Report',
          'event_participants': 'Event Participants Report',
          'staff_performance': 'Staff Performance Report',
          'cultural_objects': 'Cultural Objects Report',
          'predictive_analytics': 'Predictive Analytics Report',
          'comprehensive_dashboard': 'Comprehensive Museum Report'
        };

        const reportName = reportNames[reportType] || 'Custom Report';
        console.log('🔍 Debug: Final report type:', reportType);
        console.log('🔍 Debug: Final report name:', reportName);
        
        // Customize message based on whether it's all data or specific date range
        const periodInfo = isAllDataRequest ? 
          `• **Scope: All available data** (complete historical records)` : 
          `• **Period: ${report.start_date} to ${report.end_date}**`;
        
        return {
          message: `✅ I've generated your ${reportName}!\n\n📊 **Report Summary:**\n• ${report.description}\n${periodInfo}\n• Generated with AI insights and recommendations\n\n📄 The report is now displayed above with download options for PDF and Excel formats.`,
          report: report
        };
      } else {
        console.error('API returned error:', response.data);
        
        // Handle specific error cases
        if (response.data.message && response.data.message.includes('No data found')) {
          return {
            message: `📊 I tried to generate your report, but I couldn't find any data for the specified time period.\n\n💡 **Suggestions:**\n• Try a different date range\n• Check if there are any visitors or events in your database\n• Make sure your data is properly entered\n\nWould you like me to try generating a report with all available data instead?`,
            report: null
          };
        }
        
        throw new Error(response.data.message || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      
      // Handle different types of errors
      if (error.message.includes('No data found') || error.message.includes('No visitors found')) {
        return {
          message: `📊 I tried to generate your report, but I couldn't find any data for the specified time period.\n\n💡 **Suggestions:**\n• Try a different date range\n• Check if there are any visitors or events in your database\n• Make sure your data is properly entered\n\nWould you like me to try generating a report with all available data instead?`,
          report: null
        };
      } else if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        return {
          message: `🔌 I'm having trouble connecting to the server. Please check your internet connection and try again.\n\nIf the problem persists, please contact your system administrator.`,
          report: null
        };
      } else {
        return {
          message: `❌ I encountered an error while generating your report: ${error.message}\n\nPlease try again or contact support if the problem continues.`,
          report: null
        };
      }
    }
  };

  const handleAction = (action) => {
    if (action.type === 'generate_report') {
      // Simulate user typing the report request to trigger the conversational flow
      const simulatedMessage = action.label.replace('Generate ', '').toLowerCase();
      console.log('Simulating user input:', simulatedMessage);
      console.log('Action details:', action);
      
      // Set the input message and trigger sendMessage
      setInputMessage(simulatedMessage);
      
      // Trigger the conversational flow by calling sendMessage after state update
      setTimeout(() => {
        console.log('Calling sendMessage with input:', simulatedMessage);
        sendMessage();
      }, 100);
    } else if (action.type === 'show_data') {
      // Handle showing specific data
      console.log('Show data action:', action);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        type: 'ai',
        content: "Hi! I'm your IMMS. I can help you generate reports and analyze your museum data. What would you like to explore?",
        timestamp: new Date()
      }
    ]);
    setConversationMode('general');
  };

  const quickActions = [
    {
      label: "Visitor",
      icon: "fa-users",
      action: () => {
        // Show visitor report type options in chat
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "Great! I can generate a Visitor Report for you. Please choose the type of report you'd like:",
          timestamp: new Date(),
          showVisitorOptions: true
        };
        setMessages(prev => [...prev, aiMessage]);
      },
      category: "report"
    },
    {
      label: "Events",
      icon: "fa-calendar-alt",
      action: () => {
        // Show event participants report type options in chat
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "Great! I can generate an Event Participants Report for you. Please choose the type of report you'd like:",
          timestamp: new Date(),
          showEventParticipantsOptions: true
        };
        setMessages(prev => [...prev, aiMessage]);
      },
      category: "report"
    },
    {
      label: "Cultural Object",
      icon: "fa-landmark",
      action: () => {
        // Set up cultural objects report request
        setPendingReportRequest("Generate a comprehensive cultural objects report with collection details and artifacts");
        setWaitingForCulturalObjectDateRange(true);
        
        // Add conversational message
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "Great choice! I can generate a Cultural Objects Report for you. Please select your preferred date range:",
          timestamp: new Date(),
          showCulturalObjectDateOptions: true
        };
        setMessages(prev => [...prev, aiMessage]);
      },
      category: "report"
    },
    {
      label: "Archive Analysis",
      icon: "fa-box-archive",
      action: () => {
        // Set up archive analysis report request
        setPendingReportRequest("Analyze our digital archive usage and provide insights on popular content");
        setWaitingForArchiveDateRange(true);
        
        // Add conversational message
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "Excellent! I can generate an Archive Analysis Report for you. Please select your preferred date range:",
          timestamp: new Date(),
          showArchiveDateOptions: true
        };
        setMessages(prev => [...prev, aiMessage]);
      },
      category: "analysis"
    },
    {
      label: "Financial Summary",
      icon: "fa-chart-line",
      action: () => {
        setInputMessage("Generate a comprehensive financial report with donation analysis and revenue trends");
        setTimeout(() => sendMessage(), 100);
      },
      category: "report"
    },
    {
      label: "Event List",
      icon: "fa-list",
      action: () => {
        setInputMessage("Generate event list report");
        setTimeout(() => sendMessage(), 100);
      },
      category: "report"
    },
    {
      label: "Event Participants",
      icon: "fa-users",
      action: () => {
        setInputMessage("Generate event participants report");
        setTimeout(() => sendMessage(), 100);
      },
      category: "report"
    },
    {
      label: "Predictive Analytics",
      icon: "fa-crystal-ball",
      action: () => {
        setInputMessage("Provide AI-powered predictions for visitor trends, cultural object popularity, and resource planning");
        setTimeout(() => sendMessage(), 100);
      },
      category: "analysis"
    },
    {
      label: "Comprehensive Dashboard",
      icon: "fa-tachometer-alt",
      action: () => {
        setInputMessage("Generate a comprehensive museum dashboard report covering all aspects");
        setTimeout(() => sendMessage(), 100);
      },
      category: "report"
    },
    {
      label: "Staff Performance",
      icon: "fa-user-tie",
      action: () => {
        setInputMessage("Show staff performance analysis and productivity metrics");
        setTimeout(() => sendMessage(), 100);
      },
      category: "analysis"
    }
  ];

  const getFilteredQuickActions = () => {
    if (conversationMode === 'general') return quickActions;
    return quickActions.filter(action => action.category === conversationMode);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-[#E5B80B] to-[#D4AF37]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <i className="fa-solid fa-robot text-[#E5B80B] text-lg"></i>
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-telegraf">IMMS</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-white/90 font-telegraf">
                  {aiStatus.available ? aiStatus.provider : 'Ready'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={conversationMode}
              onChange={(e) => setConversationMode(e.target.value)}
              className="text-sm bg-white/20 text-white border border-white/30 rounded-lg px-3 py-1 focus:outline-none font-telegraf"
            >
              <option value="general">General</option>
              <option value="report">Reports</option>
              <option value="analysis">Analysis</option>
            </select>
            <button
              onClick={clearChat}
              className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              title="Clear chat"
            >
              <i className="fa-solid fa-trash text-sm"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-end gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar for AI messages */}
              {message.type === 'ai' && (
                <div className="w-8 h-8 bg-gradient-to-r from-[#E5B80B] to-[#D4AF37] rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-robot text-white text-xs"></i>
                </div>
              )}
              
              {/* Message bubble */}
              <div
                className={`px-4 py-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-[#E5B80B] text-white rounded-br-md'
                    : message.isError
                    ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed text-sm">{message.content}</p>
                
                {/* Donation report type options - conversational */}
                {message.showDonationOptions && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        I can create two types of donation reports for you:
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-list text-blue-600 text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📋 <strong>Donation List</strong> - All donations with date range
                            </p>
                            <p className="text-xs text-gray-600">
                              Complete list of all donations within your selected date range.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-filter text-green-600 text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              🎯 <strong>Donation Type</strong> - Filter by specific donation type
                            </p>
                            <p className="text-xs text-gray-600">
                              Choose a specific donation type: Monetary, Loan Artifacts, or Donated Artifacts.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        Just type <strong>"donation list"</strong> for all donations or <strong>"donation type"</strong> to filter by donation type. Or tell me which one you prefer!
                      </p>
                    </div>
                  </div>
                )}

                {/* Donation date options - conversational */}
                {message.showDonationDateOptions && waitingForDonationDateRange && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        📅 For the Donation Report, what time period would you like to include?
                      </p>
                      
                      <div className="space-y-2">
                        <div 
                          className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleDonationDateRangeSelection('all', 'all')}
                        >
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-database text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📊 <strong>All Data</strong> - Complete donation history
                            </p>
                            <p className="text-xs text-gray-600">
                              Shows all donations that have ever been received by the museum.
                            </p>
                          </div>
                        </div>
                        
                        <div 
                          className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleDonationDateRangeSelection('1month', 'all')}
                        >
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-calendar text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📅 <strong>This Month</strong> - Full current month
                            </p>
                            <p className="text-xs text-gray-600">
                              Shows donations from the 1st to the last day of the current month.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-calendar-days text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📆 <strong>Custom Range</strong> - Specific date period
                            </p>
                            <p className="text-xs text-gray-600">
                              Choose your own start and end dates for precise donation analysis.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        Just type <strong>"all"</strong>, <strong>"this month"</strong>, or <strong>"custom"</strong> to choose.
                      </p>
                    </div>
                  </div>
                )}

                {/* Cultural Object date options - conversational */}
                {message.showCulturalObjectDateOptions && waitingForCulturalObjectDateRange && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        📅 For the Cultural Objects Report, what time period would you like to include?
                      </p>
                      
                      <div className="space-y-2">
                        <div 
                          className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleCulturalObjectDateRangeSelection('all', 'all')}
                        >
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-database text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📊 <strong>All Data</strong> - Complete collection history
                            </p>
                            <p className="text-xs text-gray-600">
                              Shows all cultural objects and artifacts that have ever been catalogued.
                            </p>
                          </div>
                        </div>
                        
                        <div 
                          className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleCulturalObjectDateRangeSelection('1month', 'all')}
                        >
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-calendar text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📅 <strong>This Month</strong> - Full current month
                            </p>
                            <p className="text-xs text-gray-600">
                              Shows cultural objects catalogued from the 1st to the last day of the current month.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-calendar-days text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📆 <strong>Custom Range</strong> - Specific date period
                            </p>
                            <p className="text-xs text-gray-600">
                              Choose your own start and end dates for precise collection analysis.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        Just type <strong>"all"</strong>, <strong>"this month"</strong>, or <strong>"custom"</strong> to choose.
                      </p>
                    </div>
                  </div>
                )}

                {/* Archive Analysis date options - conversational */}
                {message.showArchiveDateOptions && waitingForArchiveDateRange && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        📅 For the Archive Analysis Report, what time period would you like to include?
                      </p>
                      
                      <div className="space-y-2">
                        <div 
                          className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleArchiveDateRangeSelection('all', 'all')}
                        >
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-database text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📊 <strong>All Data</strong> - Complete archive history
                            </p>
                            <p className="text-xs text-gray-600">
                              Shows all archived items that have ever been stored in the museum.
                            </p>
                          </div>
                        </div>
                        
                        <div 
                          className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleArchiveDateRangeSelection('1month', 'all')}
                        >
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-calendar text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📅 <strong>This Month</strong> - Full current month
                            </p>
                            <p className="text-xs text-gray-600">
                              Shows archived items from the 1st to the last day of the current month.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-calendar-days text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📆 <strong>Custom Range</strong> - Specific date period
                            </p>
                            <p className="text-xs text-gray-600">
                              Choose your own start and end dates for precise archive analysis.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        Just type <strong>"all"</strong>, <strong>"this month"</strong>, or <strong>"custom"</strong> to choose.
                      </p>
                    </div>
                  </div>
                )}

                {/* Donation type selection options */}
                {message.showDonationTypeOptions && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        Please select the specific donation type you want to filter by:
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-money-bill text-green-600 text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              💰 <strong>Monetary Donations</strong> - Cash and financial contributions
                            </p>
                            <p className="text-xs text-gray-600">
                              All cash donations and financial contributions to the museum.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-handshake text-blue-600 text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              🤝 <strong>Loan Artifacts</strong> - Temporary loans for display
                            </p>
                            <p className="text-xs text-gray-600">
                              Artifacts and items loaned to the museum for temporary display.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-gift text-purple-600 text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              🎁 <strong>Donated Artifacts</strong> - Permanent donations
                            </p>
                            <p className="text-xs text-gray-600">
                              Historical items and artifacts permanently donated to the museum.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        Just type <strong>"monetary"</strong>, <strong>"loan"</strong>, or <strong>"donated"</strong> to choose. Or tell me which type you prefer!
                      </p>
                    </div>
                  </div>
                )}

                {/* Visitor report type options - conversational */}
                {message.showVisitorOptions && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        I can create two types of visitor reports for you:
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-chart-line text-purple-600 text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📊 <strong>Graph Report</strong> - Visual analytics with charts and graphs
                            </p>
                            <p className="text-xs text-gray-600">
                              Perfect for presentations and analysis. Shows visitor trends, demographics, and patterns.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-list text-blue-600 text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📋 <strong>Visitor List Report</strong> - Simple list of all visitors
                            </p>
                            <p className="text-xs text-gray-600">
                              Great for detailed records. Shows individual visitor information and contact details.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        Just type <strong>"graph"</strong> for visual analytics or <strong>"visitor list"</strong> for a simple list. 
                        Or tell me which one you prefer!
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Date picker in conversation */}
                {message.showDatePicker && waitingForDateRange && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        For the {(() => {
                          // Determine report type name from the last user message
                          const lastUserMessage = messages.findLast(msg => msg.type === 'user');
                          if (lastUserMessage) {
                            const lowerMessage = lastUserMessage.content.toLowerCase();
                            if (lowerMessage.includes('donation')) return 'Donation Report';
                            if (lowerMessage.includes('cultural') || lowerMessage.includes('object')) return 'Cultural Objects Report';
                            if (lowerMessage.includes('visitor')) return 'Visitor Report';
                            if (lowerMessage.includes('event')) return 'Event Report';
                            if (lowerMessage.includes('archive')) return 'Archive Report';
                          }
                          return 'Report';
                        })()}, what time period would you like to include?
                      </p>
                      
                      <div className="space-y-2">
                        <div 
                          className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => {
                            setReportType('all');
                            setWaitingForDateRange(false);
                            setShowDatePicker(false);
                            // Auto-generate the report
                            setTimeout(async () => {
                              const reportResponse = await generateReportWithDateRange(pendingReportRequest);
                              const aiMessage = {
                                id: Date.now() + 1,
                                type: 'ai',
                                content: reportResponse.message,
                                timestamp: new Date(),
                                report: reportResponse.report
                              };
                              setMessages(prev => [...prev, aiMessage]);
                              
                              if (reportResponse.report && onGenerateReport) {
                                onGenerateReport(reportResponse.report);
                              }
                              setPendingReportRequest('');
                            }, 100);
                          }}
                        >
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-database text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📊 <strong>All Data</strong> - Complete {(() => {
                                const lastUserMessage = messages.findLast(msg => msg.type === 'user');
                                if (lastUserMessage) {
                                  const lowerMessage = lastUserMessage.content.toLowerCase();
                                  if (lowerMessage.includes('donation')) return 'donation history';
                                  if (lowerMessage.includes('cultural') || lowerMessage.includes('object')) return 'collection history';
                                  if (lowerMessage.includes('visitor')) return 'visitor history';
                                  if (lowerMessage.includes('event')) return 'event history';
                                  if (lowerMessage.includes('archive')) return 'archive history';
                                }
                                return 'records history';
                              })()}
                            </p>
                            <p className="text-xs text-gray-600">
                              Shows all {(() => {
                                const lastUserMessage = messages.findLast(msg => msg.type === 'user');
                                if (lastUserMessage) {
                                  const lowerMessage = lastUserMessage.content.toLowerCase();
                                  if (lowerMessage.includes('donation')) return 'donations that have ever been received by the museum';
                                  if (lowerMessage.includes('cultural') || lowerMessage.includes('object')) return 'cultural objects and artifacts that have ever been catalogued';
                                  if (lowerMessage.includes('visitor')) return 'visitors who have ever checked in to the museum';
                                  if (lowerMessage.includes('event')) return 'events that have ever been organized by the museum';
                                  if (lowerMessage.includes('archive')) return 'archived items that have ever been stored';
                                }
                                return 'records that have ever been catalogued in the museum';
                              })()}.
                            </p>
                          </div>
                        </div>
                        
                        <div 
                          className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => {
                            setReportType('1month');
                            setWaitingForDateRange(false);
                            setShowDatePicker(false);
                            // Auto-generate the report
                            setTimeout(async () => {
                              const reportResponse = await generateReportWithDateRange(pendingReportRequest);
                              const aiMessage = {
                                id: Date.now() + 1,
                                type: 'ai',
                                content: reportResponse.message,
                                timestamp: new Date(),
                                report: reportResponse.report
                              };
                              setMessages(prev => [...prev, aiMessage]);
                              
                              if (reportResponse.report && onGenerateReport) {
                                onGenerateReport(reportResponse.report);
                              }
                              setPendingReportRequest('');
                            }, 100);
                          }}
                        >
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-calendar text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📅 <strong>This Month</strong> - Full current month
                            </p>
                            <p className="text-xs text-gray-600">
                              Shows {(() => {
                                const lastUserMessage = messages.findLast(msg => msg.type === 'user');
                                if (lastUserMessage) {
                                  const lowerMessage = lastUserMessage.content.toLowerCase();
                                  if (lowerMessage.includes('donation')) return 'donations from the 1st to the last day of the current month';
                                  if (lowerMessage.includes('cultural') || lowerMessage.includes('object')) return 'cultural objects catalogued from the 1st to the last day of the current month';
                                  if (lowerMessage.includes('visitor')) return 'visitors from the 1st to the last day of the current month';
                                  if (lowerMessage.includes('event')) return 'events from the 1st to the last day of the current month';
                                  if (lowerMessage.includes('archive')) return 'archived items from the 1st to the last day of the current month';
                                }
                                return 'records from the 1st to the last day of the current month';
                              })()}.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-calendar-days text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📆 <strong>Custom Range</strong> - Specific date period
                            </p>
                            <p className="text-xs text-gray-600">
                              Choose your own start and end dates for precise analysis.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        Just type <strong>"all"</strong>, <strong>"this month"</strong>, or <strong>"custom"</strong> to choose. 
                        Or tell me what time period you'd like to see!
                      </p>
                    </div>
                    
                    {/* Date Picker */}
                    {reportType === 'custom' && (
                      <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            <i className="fa-solid fa-play mr-1"></i>
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[#E5B80B] focus:border-[#E5B80B]"
                            placeholder="Select start date"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            <i className="fa-solid fa-stop mr-1"></i>
                            End Date
                          </label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[#E5B80B] focus:border-[#E5B80B]"
                            placeholder="Select end date"
                            min={startDate || undefined}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#E5B80B]/20">
                      <div className="text-xs text-gray-600 flex items-center">
                        <div className="w-4 h-4 bg-[#E5B80B]/20 rounded-full flex items-center justify-center mr-2">
                          {isAutoGenerating ? (
                            <i className="fa-solid fa-spinner fa-spin text-[#E5B80B] text-xs"></i>
                          ) : (
                            <i className="fa-solid fa-play text-[#E5B80B] text-xs"></i>
                          )}
                        </div>
                        {isAutoGenerating ? 'Generating report...' :
                         reportType === '1month' ? 'Click "This Month" to auto-generate!' : 
                         reportType === 'custom' ? (startDate && endDate ? 'Auto-generating...' : 'Select your date range') : 
                         'Ready? Type "generate" below to start!'}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={cancelReportGeneration}
                          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <i className="fa-solid fa-times mr-1"></i>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Visitor date options - conversational */}
                {message.showDateOptions && waitingForVisitorDateRange && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        📅 For the List Report, what time period would you like to include?
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-database text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📊 <strong>All Data</strong> - Complete visitor history
                            </p>
                            <p className="text-xs text-gray-600">
                              Shows all visitors who have ever checked in to the museum.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-calendar text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
       <p className="text-sm font-medium text-gray-800 mb-1">
         📅 <strong>This Month</strong> - Full current month
       </p>
       <p className="text-xs text-gray-600">
         Shows visitors from the 1st to the last day of the current month.
       </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-calendar-days text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📅 <strong>Custom Range</strong> - Specific date period
                            </p>
                            <p className="text-xs text-gray-600">
                              Choose your own start and end dates for precise analysis.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        Just type <strong>"all"</strong>, <strong>"last month"</strong>, or <strong>"custom"</strong> to choose. 
                        Or tell me what time period you'd like to see!
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Visitor year selection for graph report */}
                {message.showYearOptions && waitingForVisitorYearSelection && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        📊 For the Visitor Graph Report, which year would you like to analyze?
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {(() => {
                          const currentYear = new Date().getFullYear();
                          const years = [];
                          for (let year = currentYear; year >= currentYear - 5; year--) {
                            years.push(year);
                          }
                          return years.map(year => (
                            <button
                              key={year}
                              onClick={() => handleVisitorYearSelection(year)}
                              className="p-3 bg-white rounded-lg border border-gray-200 hover:border-[#E5B80B] hover:bg-[#E5B80B]/5 transition-colors text-center"
                            >
                              <div className="text-lg font-bold text-gray-800">{year}</div>
                              <div className="text-xs text-gray-600">
                                {year === currentYear ? 'Current Year' : `${year} Data`}
                              </div>
                            </button>
                          ));
                        })()}
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        Select a year to generate the visitor graph report with monthly visitor statistics for that year.
                      </p>
                    </div>
                  </div>
                )}

                {/* Visitor month selection for graph report */}
                {message.showMonthOptions && waitingForVisitorMonthSelection && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        📅 For {selectedYear}, would you like to generate the graph for the entire year or a specific month?
                      </p>
                      
                      <div className="space-y-2">
                        <button
                          onClick={() => handleVisitorMonthSelection('all')}
                          className="w-full p-3 bg-white rounded-lg border border-gray-200 hover:border-[#E5B80B] hover:bg-[#E5B80B]/5 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <i className="fa-solid fa-calendar-alt text-[#E5B80B] text-xs"></i>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-800">📊 Entire Year ({selectedYear})</div>
                              <div className="text-xs text-gray-600">Generate monthly visitor statistics for all 12 months</div>
                            </div>
                          </div>
                        </button>
                        
                        <div className="text-xs text-gray-500 text-center my-2">OR select a specific month:</div>
                        
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {(() => {
                            const months = [
                              { num: 1, name: 'Jan' }, { num: 2, name: 'Feb' }, { num: 3, name: 'Mar' }, { num: 4, name: 'Apr' },
                              { num: 5, name: 'May' }, { num: 6, name: 'Jun' }, { num: 7, name: 'Jul' }, { num: 8, name: 'Aug' },
                              { num: 9, name: 'Sep' }, { num: 10, name: 'Oct' }, { num: 11, name: 'Nov' }, { num: 12, name: 'Dec' }
                            ];
                            return months.map(month => (
                              <button
                                key={month.num}
                                onClick={() => handleVisitorMonthSelection(month.num)}
                                className="p-2 bg-white rounded border border-gray-200 hover:border-[#E5B80B] hover:bg-[#E5B80B]/5 transition-colors text-center"
                              >
                                <div className="text-sm font-medium text-gray-800">{month.name}</div>
                              </button>
                            ));
                          })()}
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        Choose "Entire Year" for a comprehensive monthly overview, or select a specific month for detailed daily analysis.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* List type options - when user just says "list" */}
                {message.showListTypeOptions && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        I can generate different types of list reports for you. Which list would you like?
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-users text-blue-600 text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              👥 <strong>Visitor List</strong> - List of museum visitors
                            </p>
                            <p className="text-xs text-gray-600">
                              Shows all visitors who have checked in to the museum with their details and visit information.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-calendar text-green-600 text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📅 <strong>Event List</strong> - List of museum events
                            </p>
                            <p className="text-xs text-gray-600">
                              Shows all events organized by the museum with dates, locations, and participant information.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-gift text-purple-600 text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              💰 <strong>Donation List</strong> - List of museum donations
                            </p>
                            <p className="text-xs text-gray-600">
                              Shows all donations received by the museum with donor details, amounts, and dates.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        Just type <strong>"visitor list"</strong>, <strong>"event list"</strong>, or <strong>"donation list"</strong> to choose. 
                        Or tell me which one you prefer!
                      </p>
                    </div>
                  </div>
                )}

                {/* Event list date options - when user says "event list" */}
                {message.showEventListDateOptions && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        For the Event List Report, what time period would you like to include?
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-database text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📊 <strong>All Data</strong> - Complete event history
                            </p>
                            <p className="text-xs text-gray-600">
                              Shows all events that have ever been organized by the museum.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-calendar text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📅 <strong>This Month</strong> - Full current month
                            </p>
                            <p className="text-xs text-gray-600">
                              Shows events from the 1st to the last day of the current month.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-calendar-days text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📆 <strong>Custom Range</strong> - Specific date period
                            </p>
                            <p className="text-xs text-gray-600">
                              Choose your own start and end dates for precise analysis.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        Just type <strong>"all"</strong>, <strong>"this month"</strong>, or <strong>"custom"</strong> to choose. 
                        Or tell me what time period you'd like to see!
                      </p>
                    </div>
                  </div>
                )}

                {/* Event List date selection options - dedicated for event list */}
                {message.showEventListDateSelectionOptions && waitingForEventListDateSelection && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        📅 For the Event List Report, what time period would you like to include?
                      </p>
                      
                      <div className="space-y-2">
                        <div 
                          className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleEventListDateSelection('all', 'all')}
                        >
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-database text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📊 <strong>All Data</strong> - Complete event history
                            </p>
                            <p className="text-xs text-gray-600">
                              Shows all events that have ever been organized by the museum.
                            </p>
                          </div>
                        </div>
                        
                        <div 
                          className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleEventListDateSelection('1month', 'all')}
                        >
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-calendar text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📅 <strong>This Month</strong> - Full current month
                            </p>
                            <p className="text-xs text-gray-600">
                              Shows events from the 1st to the last day of the current month.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-calendar-days text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📆 <strong>Custom Range</strong> - Specific date period
                            </p>
                            <p className="text-xs text-gray-600">
                              Choose your own start and end dates for precise event analysis.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        Just type <strong>"all"</strong>, <strong>"this month"</strong>, or <strong>"custom"</strong> to choose.
                      </p>
                    </div>
                  </div>
                )}

                {/* Event participants report type options - conversational */}
                {message.showEventParticipantsOptions && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        I can create two types of event reports for you:
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-list text-blue-600 text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📋 <strong>Event List</strong> - Simple list of all events
                            </p>
                            <p className="text-xs text-gray-600">
                              Perfect for getting a quick overview. Shows event titles, dates, locations, and participant counts.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-users text-green-600 text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              👥 <strong>Event Participants</strong> - List of event participants
                            </p>
                            <p className="text-xs text-gray-600">
                              Perfect for detailed records. Shows individual participant information, event details, and attendance data.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        Just type <strong>"event list"</strong> or <strong>"participants"</strong> to choose. 
                        Or tell me which one you prefer!
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Event selection options */}
                {message.showEventSelection && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        Please select an event from the list below:
                      </p>
                      
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {message.events && message.events.length > 0 ? (
                          message.events.map((event) => (
                            <div 
                              key={event.id}
                              className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-[#E5B80B] cursor-pointer transition-colors"
                              onClick={() => handleEventSelection(event.id)}
                            >
                              <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <i className="fa-solid fa-calendar text-[#E5B80B] text-xs"></i>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800 mb-1">
                                  {event.name || 'Untitled Event'}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {event.description || 'No description available'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Date: {event.date ? new Date(event.date).toLocaleDateString() : 'TBD'}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            <i className="fa-solid fa-calendar-times text-2xl mb-2"></i>
                            <p>No events available</p>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        Click on an event to select it for the report.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Event participants date options */}
                {message.showEventParticipantsDateOptions && waitingForEventParticipantsDateRange && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        📅 For the Event Participants List Report, what time period would you like to include?
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-database text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📊 <strong>All Data</strong> - Complete event participants history
                            </p>
                            <p className="text-xs text-gray-600">
                              Shows all event participants who have ever registered for events.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-clock text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              ⏰ <strong>Last 1 Month</strong> - Recent event participants only
                            </p>
                            <p className="text-xs text-gray-600">
                              Shows event participants from the past 30 days for recent analysis.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-calendar-days text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📅 <strong>Custom Range</strong> - Specific date period
                            </p>
                            <p className="text-xs text-gray-600">
                              Choose your own start and end dates for precise analysis.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        Just type <strong>"all"</strong>, <strong>"last month"</strong>, or <strong>"custom"</strong> to choose. 
                        Or tell me what time period you'd like to see!
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Custom date picker for visitor reports */}
                {message.showCustomDatePicker && waitingForVisitorDateRange && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        📅 Select your custom date range for the visitor list report:
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            <i className="fa-solid fa-play mr-1"></i>
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B]"
                            placeholder="Select start date"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            <i className="fa-solid fa-stop mr-1"></i>
                            End Date
                          </label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B]"
                            placeholder="Select end date"
                            min={startDate || undefined}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E5B80B]/20">
                        <div className="text-xs text-gray-600 flex items-center">
                          <div className="w-4 h-4 bg-[#E5B80B]/20 rounded-full flex items-center justify-center mr-2">
                            <i className="fa-solid fa-info text-[#E5B80B] text-xs"></i>
                          </div>
                          {startDate && endDate ? 'Ready to generate report!' : 'Select both dates to continue'}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setWaitingForVisitorDateRange(false);
                              setStartDate('');
                              setEndDate('');
                            }}
                            className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <i className="fa-solid fa-times mr-1"></i>
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (startDate && endDate) {
                                handleVisitorDateRangeSelection(startDate, endDate);
                              }
                            }}
                            disabled={!startDate || !endDate}
                            className="px-4 py-2 bg-[#E5B80B] text-white rounded-lg text-xs font-medium hover:bg-[#D4AF37] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <i className="fa-solid fa-play text-xs"></i>
                            Generate Report
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Custom date picker for event participants reports */}
                {message.showEventParticipantsCustomDatePicker && waitingForEventParticipantsDateRange && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        📅 Select your custom date range for the event participants list report:
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            <i className="fa-solid fa-play mr-1"></i>
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={eventParticipantsStartDate}
                            onChange={(e) => setEventParticipantsStartDate(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B]"
                            placeholder="Select start date"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            <i className="fa-solid fa-stop mr-1"></i>
                            End Date
                          </label>
                          <input
                            type="date"
                            value={eventParticipantsEndDate}
                            onChange={(e) => setEventParticipantsEndDate(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B]"
                            placeholder="Select end date"
                            min={eventParticipantsStartDate || undefined}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E5B80B]/20">
                        <div className="text-xs text-gray-600 flex items-center">
                          <div className="w-4 h-4 bg-[#E5B80B]/20 rounded-full flex items-center justify-center mr-2">
                            <i className="fa-solid fa-info text-[#E5B80B] text-xs"></i>
                          </div>
                          {eventParticipantsStartDate && eventParticipantsEndDate ? 'Ready to generate report!' : 'Select both dates to continue'}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setWaitingForEventParticipantsDateRange(false);
                              setEventParticipantsStartDate('');
                              setEventParticipantsEndDate('');
                            }}
                            className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <i className="fa-solid fa-times mr-1"></i>
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (eventParticipantsStartDate && eventParticipantsEndDate) {
                                handleEventParticipantsDateRangeSelection(eventParticipantsStartDate, eventParticipantsEndDate);
                              }
                            }}
                            disabled={!eventParticipantsStartDate || !eventParticipantsEndDate}
                            className="px-4 py-2 bg-[#E5B80B] text-white rounded-lg text-xs font-medium hover:bg-[#D4AF37] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <i className="fa-solid fa-play text-xs"></i>
                            Generate Report
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Action buttons for AI messages */}
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.isVaguePrompt && (
                      <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-700 font-medium">
                          💡 I can help you with these specific options:
                        </p>
                      </div>
                    )}
                    {message.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleAction(action)}
                        className={`w-full text-left px-3 py-2 border rounded-lg text-sm transition-colors font-medium ${
                          message.isVaguePrompt
                            ? 'bg-gradient-to-r from-[#E5B80B] to-[#D4AF37] text-white border-[#E5B80B] hover:from-[#D4AF37] hover:to-[#B8941F]'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <i className={`fa-solid ${action.icon} mr-2`}></i>
                        {action.label}
                        {action.description && (
                          <div className="text-xs opacity-75 mt-1">
                            {action.description}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Timestamp */}
              <div className={`text-xs text-gray-500 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                {message.timestamp ? 
                  new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-end gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-[#E5B80B] to-[#D4AF37] rounded-full flex items-center justify-center">
                <i className="fa-solid fa-robot text-white text-xs"></i>
              </div>
              <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-sm font-medium">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-2">
          {getFilteredQuickActions().slice(0, 4).map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs hover:bg-gray-50 transition-colors flex items-center gap-1 font-medium"
            >
              <i className={`fa-solid ${action.icon}`}></i>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        
        
        {/* Input field */}
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full p-3 pr-12 border border-gray-300 rounded-2xl resize-none focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] text-sm placeholder-gray-500 overflow-hidden"
              rows="1"
              disabled={isLoading}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="w-11 h-11 bg-[#E5B80B] text-white rounded-full hover:bg-[#D4AF37] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <i className="fa-solid fa-paper-plane text-sm"></i>
          </button>
        </div>
      </div>

    </div>
  );
};

export default AIChat; 