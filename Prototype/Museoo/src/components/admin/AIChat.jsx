import React, { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
  const [donationStartDate, setDonationStartDate] = useState(null);
  const [donationEndDate, setDonationEndDate] = useState(null);
  const [showEndDateBanner, setShowEndDateBanner] = useState(false);
  const [selectedDonationType, setSelectedDonationType] = useState(null);
  const [waitingForCulturalObjectDateRange, setWaitingForCulturalObjectDateRange] = useState(false);
  const [culturalObjectStartDate, setCulturalObjectStartDate] = useState(null);
  const [culturalObjectEndDate, setCulturalObjectEndDate] = useState(null);
  const [waitingForArchiveDateRange, setWaitingForArchiveDateRange] = useState(false);
  const [archiveStartDate, setArchiveStartDate] = useState(null);
  const [archiveEndDate, setArchiveEndDate] = useState(null);
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

  const generateReportWithDateRange = async (userRequest, donationType = null, customStartDate = null, customEndDate = null, explicitReportType = null) => {
    try {
      let dateRange = '';
      let actualStartDate = null;
      let actualEndDate = null;
      
      // Use explicit reportType if provided (to avoid state timing issues), otherwise use state
      const effectiveReportType = explicitReportType || reportType;
      
      // Use custom dates if provided, otherwise use state
      const effectiveStartDate = customStartDate || startDate;
      const effectiveEndDate = customEndDate || endDate;
      
      // Check if dates are actual date strings (not 'all', 'custom', '1month', etc.)
      const isActualDateString = (dateStr) => {
        if (!dateStr || dateStr === 'all' || dateStr === 'custom' || dateStr === '1month' || dateStr === 'null') {
          return false;
        }
        // Check if it's a valid date string (YYYY-MM-DD format)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        return dateRegex.test(dateStr);
      };
      
      if (effectiveReportType === 'all' || (!effectiveStartDate && !effectiveEndDate)) {
        // No date range - include all data
        dateRange = 'for all available data';
        actualStartDate = null;
        actualEndDate = null;
      } else if (effectiveReportType === '1month' || (effectiveStartDate === '1month' && effectiveEndDate === 'all')) {
        // Use this month (from 1st of current month to end of current month)
        // If dates are already calculated (from handleDonationDateRangeSelection), use them
        if (isActualDateString(effectiveStartDate) && isActualDateString(effectiveEndDate)) {
          actualStartDate = effectiveStartDate;
          actualEndDate = effectiveEndDate;
          dateRange = `from ${actualStartDate} to ${actualEndDate}`;
          console.log('📅 Using pre-calculated this month dates:', actualStartDate, 'to', actualEndDate);
        } else {
          // Otherwise calculate them here
          const today = new Date();
          const start = new Date(today.getFullYear(), today.getMonth(), 1);
          const end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month
          actualStartDate = start.toISOString().split('T')[0];
          actualEndDate = end.toISOString().split('T')[0];
          dateRange = `from ${actualStartDate} to ${actualEndDate}`;
          console.log('📅 Calculated this month dates:', actualStartDate, 'to', actualEndDate);
        }
      } else if (isActualDateString(effectiveStartDate) && isActualDateString(effectiveEndDate)) {
        // Custom date range with actual dates
        actualStartDate = effectiveStartDate;
        actualEndDate = effectiveEndDate;
        dateRange = `from ${actualStartDate} to ${actualEndDate}`;
        console.log('📅 Using custom date range:', actualStartDate, 'to', actualEndDate);
      } else if (effectiveStartDate && effectiveEndDate && effectiveStartDate !== 'custom' && effectiveEndDate !== 'custom') {
        // Fallback: treat as custom dates if they exist and aren't special strings
        actualStartDate = effectiveStartDate;
        actualEndDate = effectiveEndDate;
        dateRange = `from ${actualStartDate} to ${actualEndDate}`;
      }
      
      // Include donation type in the request text for proper detection
      let requestWithDate = `${userRequest} ${dateRange}`;
      if (donationType) {
        requestWithDate = `${userRequest} ${donationType} ${dateRange}`;
      }
      console.log('📅 Generating report with date range:', dateRange, 'Donation type:', donationType, 'Actual dates:', actualStartDate, 'to', actualEndDate);
      
      // Call generateReport with explicit dates
      return await generateReport(requestWithDate, donationType, actualStartDate, actualEndDate);
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
    
    // Add user message to show what they selected
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: reportType === 'graph' ? 'Graph Report - Visual analytics with charts and graphs' : 'Visitor List Report - Simple list of all visitors',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
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
      
      // Calculate actual dates based on selection
      let actualStartDate, actualEndDate, displayText;
      
      if (startDate === 'all' && endDate === 'all') {
        // All data - use a very wide date range
        actualStartDate = '2020-01-01';
        actualEndDate = new Date().toISOString().split('T')[0]; // Today
        displayText = 'All Data - Complete visitor history';
      } else if (startDate === 'this_month' && endDate === 'this_month') {
        // This month - calculate current month's start and end
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        actualStartDate = firstDay.toISOString().split('T')[0];
        actualEndDate = lastDay.toISOString().split('T')[0];
        const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        displayText = `This Month - ${monthName} (${actualStartDate} to ${actualEndDate})`;
      } else {
        // Use the provided dates as-is (custom range)
        actualStartDate = startDate;
        actualEndDate = endDate;
        displayText = `Custom Range - ${actualStartDate} to ${actualEndDate}`;
      }
      
      // Add user message to show what they selected
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: displayText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      
      console.log('Date range selection:', { startDate, endDate, actualStartDate, actualEndDate });
      generateVisitorReport('visitor_list', actualStartDate, actualEndDate);
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
      
      // Use a longer timeout for report generation requests
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
      }, {
        timeout: 120000 // 2 minutes for report generation
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
    // Add user message to show what they selected
    const reportTypeNames = {
      'list': 'Event List Report - Simple list of all events',
      'participants': 'Event Participants Report - List of event participants'
    };
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: reportTypeNames[reportType],
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    if (reportType === 'list') {
      // For event list, ask for date range first (like visitor list)
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "Perfect! For the Event List Report, please specify the date range. You can choose from the options below or type a custom date range:",
        timestamp: new Date(),
        showEventListDateOptions: true
      };
      setMessages(prev => [...prev, aiMessage]);
      setWaitingForEventListDateRange(true);
    } else {
      // For participants, fetch available events first
    try {
      console.log('Fetching events for report type:', reportType);
      const response = await api.get('/api/event-registrations/events');
      console.log('Events response:', response.data);
      const events = response.data.events || [];
      setAvailableEvents(events);
      
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
      
      // Calculate actual dates based on selection
      let actualStartDate, actualEndDate, displayText;
      
      if (startDate === 'all' && endDate === 'all') {
        // All data - use a very wide date range
        actualStartDate = '2020-01-01';
        actualEndDate = new Date().toISOString().split('T')[0]; // Today
        displayText = 'All Data - Complete event history';
      } else if (startDate === 'this_month' && endDate === 'this_month') {
        // This month - calculate current month's start and end
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        actualStartDate = firstDay.toISOString().split('T')[0];
        actualEndDate = lastDay.toISOString().split('T')[0];
        const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        displayText = `This Month - ${monthName} (${actualStartDate} to ${actualEndDate})`;
      } else {
        // Use the provided dates as-is (custom range)
        actualStartDate = startDate;
        actualEndDate = endDate;
        displayText = `Custom Range - ${actualStartDate} to ${actualEndDate}`;
      }
      
      // Add user message to show what they selected
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: displayText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      
      console.log('Event list date range selection:', { startDate, endDate, actualStartDate, actualEndDate });
      generateEventParticipantsReport('event_list', actualStartDate, actualEndDate);
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

  const handleDonationTypeSelection = async (donationType) => {
    console.log('🖱️ Donation type clicked:', donationType);
    // Store the selected donation type
    setSelectedDonationType(donationType);
    
    // Show specific date range message for all donation types
    let message = '';
    if (donationType === 'all') {
      message = "Great! You've selected All Types donations. Now please select your preferred date range:";
    } else if (donationType === 'monetary') {
      message = "Great! You've selected Monetary donations. Now please select your preferred date range:";
    } else if (donationType === 'artifact') {
      message = "Great! You've selected Artifact donations. Now please select your preferred date range:";
    } else if (donationType === 'loan') {
      message = "Great! You've selected Loan Artifact donations. Now please select your preferred date range:";
    }
    
    const aiMessage = {
      id: Date.now() + 1,
      type: 'ai',
      content: message,
      timestamp: new Date(),
      showDonationDateOptions: true
    };
    setMessages(prev => [...prev, aiMessage]);
    setWaitingForDonationDateRange(true);
  };

  const handleDonationDateRangeSelection = async (startDate, endDate) => {
    if (startDate === 'custom' && endDate === 'custom') {
      // Show custom date picker
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "Perfect! Please select your custom date range for the donation report:",
        timestamp: new Date(),
        showDonationCustomDatePicker: true
      };
      setMessages(prev => [...prev, aiMessage]);
      setWaitingForDonationDateRange(true);
    } else {
      setWaitingForDonationDateRange(false);
      console.log('🎯 Generating donation report with type:', selectedDonationType, 'Date range:', startDate, 'to', endDate);
      
      // Calculate actual dates based on the selection
      let actualStartDate = startDate;
      let actualEndDate = endDate;
      let reportTypeValue = 'custom'; // Default to custom for actual date strings
      
      // Handle "this month" selection
      if (startDate === '1month' && endDate === 'all') {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month
        actualStartDate = start.toISOString().split('T')[0];
        actualEndDate = end.toISOString().split('T')[0];
        reportTypeValue = '1month';
        console.log('📅 This month calculated:', actualStartDate, 'to', actualEndDate);
        console.log('📅 Current month:', today.getMonth() + 1, 'Year:', today.getFullYear());
      } else if (startDate === 'all' && endDate === 'all') {
        reportTypeValue = 'all';
      } else if (startDate && endDate && startDate !== 'custom' && endDate !== 'custom' && startDate !== 'all' && endDate !== 'all') {
        // These are actual date strings (custom date range)
        reportTypeValue = 'custom';
        console.log('📅 Custom date range detected:', actualStartDate, 'to', actualEndDate);
      }
      
      // Set reportType based on selection
      setReportType(reportTypeValue);
      setStartDate(actualStartDate);
      setEndDate(actualEndDate);
      
      // Generate report with the actual date range - pass reportTypeValue directly to avoid state timing issues
      const reportResponse = await generateReportWithDateRange('donation report', selectedDonationType, actualStartDate, actualEndDate, reportTypeValue);
      if (reportResponse) {
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
          console.log('Passing donation report to parent component:', reportResponse.report);
          onGenerateReport(reportResponse.report);
        }
      }
      
      // Clear the date states after generation
      setDonationStartDate(null);
      setDonationEndDate(null);
    }
  };

  const handleCulturalObjectDateRangeSelection = async (startDate, endDate) => {
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
      // Reset date picker state
      setCulturalObjectStartDate(null);
      setCulturalObjectEndDate(null);
      console.log('🎯 Generating cultural objects report. Date range:', startDate, 'to', endDate);
      
      // Calculate actual dates based on the selection
      let actualStartDate = startDate;
      let actualEndDate = endDate;
      let reportTypeValue = 'custom'; // Default to custom for actual date strings
      
      // Handle "this month" selection
      if (startDate === '1month' && endDate === 'all') {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month
        // Format dates in local timezone to avoid timezone conversion issues
        const formatLocalDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        actualStartDate = formatLocalDate(start);
        actualEndDate = formatLocalDate(end);
        reportTypeValue = '1month';
        console.log('📅 This month calculated for cultural objects:', actualStartDate, 'to', actualEndDate);
        console.log('📅 Current month:', today.getMonth() + 1, 'Year:', today.getFullYear());
      } else if (startDate === 'all' && endDate === 'all') {
        reportTypeValue = 'all';
        actualStartDate = null;
        actualEndDate = null;
      } else if (startDate && endDate && startDate !== 'custom' && endDate !== 'custom' && startDate !== 'all' && endDate !== 'all') {
        // These are actual date strings (custom date range)
        reportTypeValue = 'custom';
        console.log('📅 Custom date range detected for cultural objects:', actualStartDate, 'to', actualEndDate);
        console.log('📅 Original input dates:', startDate, 'to', endDate);
      }
      
      console.log('📅 Final dates being passed to generateReportWithDateRange:', actualStartDate, 'to', actualEndDate, 'reportType:', reportTypeValue);
      const reportResponse = await generateReportWithDateRange('cultural objects report', null, actualStartDate, actualEndDate, reportTypeValue);
      if (reportResponse) {
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
          console.log('Passing cultural object report to parent component:', reportResponse.report);
          onGenerateReport(reportResponse.report);
        }
      }
    }
  };

  const handleArchiveDateRangeSelection = async (startDate, endDate) => {
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
      // Reset date picker state
      setArchiveStartDate(null);
      setArchiveEndDate(null);
      
      console.log('🎯 Generating archive report. Date range:', startDate, 'to', endDate);
      
      // Calculate actual dates based on the selection
      let actualStartDate = startDate;
      let actualEndDate = endDate;
      let reportTypeValue = 'custom'; // Default to custom for actual date strings
      
      // Handle "this month" selection
      if (startDate === '1month' && endDate === 'all') {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month
        // Format dates in local timezone to avoid timezone conversion issues
        const formatLocalDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        actualStartDate = formatLocalDate(start);
        actualEndDate = formatLocalDate(end);
        reportTypeValue = '1month';
        console.log('📅 This month calculated for archive:', actualStartDate, 'to', actualEndDate);
        console.log('📅 Current month:', today.getMonth() + 1, 'Year:', today.getFullYear());
      } else if (startDate === 'all' && endDate === 'all') {
        reportTypeValue = 'all';
        actualStartDate = null;
        actualEndDate = null;
      } else if (startDate && endDate && startDate !== 'custom' && endDate !== 'custom' && startDate !== 'all' && endDate !== 'all') {
        // These are actual date strings (custom date range)
        reportTypeValue = 'custom';
        console.log('📅 Custom date range detected for archive:', actualStartDate, 'to', actualEndDate);
        console.log('📅 Original input dates:', startDate, 'to', endDate);
      }
      
      console.log('📅 Final dates being passed to generateReportWithDateRange:', actualStartDate, 'to', actualEndDate, 'reportType:', reportTypeValue);
      const reportResponse = await generateReportWithDateRange('archive analysis', null, actualStartDate, actualEndDate, reportTypeValue);
      if (reportResponse) {
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
          console.log('Passing archive report to parent component:', reportResponse.report);
          onGenerateReport(reportResponse.report);
        }
      }
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
      // For participants reports, generate immediately with the selected event
      generateEventParticipantsReport('event_participants', null, null, selectedEvent.id);
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
      }, {
        timeout: 120000 // 2 minutes for report generation
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

  const generateReport = async (userRequest, donationType = null, explicitStartDate = null, explicitEndDate = null) => {
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
      
      // More specific detection to avoid confusion between report types
      if (lowerRequest.includes('event') && (lowerRequest.includes('participant') || lowerRequest.includes('attendee') || lowerRequest.includes('participants'))) {
        reportType = 'event_participants';
        console.log('🔍 Debug: Selected event_participants (specific event participants)');
      } else if (lowerRequest.includes('event') && (lowerRequest.includes('list') || lowerRequest.includes('events list'))) {
        reportType = 'event_list';
        console.log('🔍 Debug: Selected event_list (specific event list)');
      } else if (lowerRequest.includes('visitor') && (lowerRequest.includes('list') || lowerRequest.includes('visitor list'))) {
        reportType = 'visitor_list';
        console.log('🔍 Debug: Selected visitor_list (specific visitor list)');
      } else if (lowerRequest.includes('visitor') && (lowerRequest.includes('graph') || lowerRequest.includes('chart') || lowerRequest.includes('analytics'))) {
        reportType = 'visitor_analytics';
        console.log('🔍 Debug: Selected visitor_analytics (specific visitor graph)');
      } else if (lowerRequest.includes('visitor') || lowerRequest.includes('visitors')) {
        // Default visitor request - ask for clarification
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "I can create two types of visitor reports for you:",
          timestamp: new Date(),
          showVisitorOptions: true
        };
        setMessages(prev => [...prev, aiMessage]);
        return;
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
      } else if (lowerRequest.includes('event')) {
        // Default event request - ask for clarification
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "I can create two types of event reports for you:",
          timestamp: new Date(),
          showEventParticipantsOptions: true
        };
        setMessages(prev => [...prev, aiMessage]);
        return;
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
      
      // Use explicit dates if provided (from custom date picker), otherwise use parsed dates
      const effectiveStartDate = explicitStartDate || parsed?.startDate;
      const effectiveEndDate = explicitEndDate || parsed?.endDate;
      
      if (isAllDataRequest || (!effectiveStartDate && !effectiveEndDate)) {
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
        // Use explicit dates if provided, otherwise parsed dates, otherwise default
        const now = new Date();
        const defaultStart = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
        const defaultEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

        reportParams = {
          reportType: reportType,
          startDate: effectiveStartDate || defaultStart.toISOString().split('T')[0],
          endDate: effectiveEndDate || defaultEnd.toISOString().split('T')[0],
          aiAssisted: true,
          includeCharts: true,
          includeRecommendations: true,
          includePredictions: true,
          includeComparisons: true,
          userRequest: userRequest
        };
      }
      
      console.log('📅 Report date parameters:', { 
        explicitStartDate, 
        explicitEndDate, 
        parsedStartDate: parsed?.startDate, 
        parsedEndDate: parsed?.endDate,
        finalStartDate: reportParams.startDate,
        finalEndDate: reportParams.endDate
      });

      // Add donation type if it's a donation report
      console.log('🔍 Checking donation type logic:', { reportType, donationType, userRequest });
      if (reportType === 'donation_type_report' || reportType === 'donation_report' || userRequest.toLowerCase().includes('donation')) {
        if (donationType) {
          // Use the passed donation type parameter
          reportParams.donationType = donationType;
          console.log('🎯 Using passed donation type:', donationType);
        } else if (userRequest.toLowerCase().includes('monetary')) {
          reportParams.donationType = 'monetary';
          console.log('💰 Detected monetary from request text');
        } else if (userRequest.toLowerCase().includes('loan')) {
          reportParams.donationType = 'loan';
          console.log('📦 Detected loan from request text');
        } else if (userRequest.toLowerCase().includes('donated')) {
          reportParams.donationType = 'donated';
          console.log('🎁 Detected donated from request text');
        } else if (userRequest.toLowerCase().includes('artifact')) {
          reportParams.donationType = 'artifact';
          console.log('🎯 Detected artifact from request text');
        } else {
          reportParams.donationType = 'all';
          console.log('📊 Defaulting to all types');
        }
      }

      console.log('Report parameters:', reportParams);

      // Generate the report
      const response = await api.post("/api/reports/generate", reportParams, {
        timeout: 120000 // 2 minutes for report generation
      });

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
      label: "Archive",
      icon: "fa-box-archive",
      action: () => {
        // Set up archive analysis report request
        setPendingReportRequest("Analyze our digital archive usage and provide insights on popular content");
        setWaitingForArchiveDateRange(true);
        
        // Add conversational message
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "Excellent! I can generate an Archive Report for you. Please select your preferred date range:",
          timestamp: new Date(),
          showArchiveDateOptions: true
        };
        setMessages(prev => [...prev, aiMessage]);
      },
      category: "analysis"
    },
    {
      label: "Donation",
      icon: "fa-hand-holding-dollar",
      action: () => {
        // Show donation type options first
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "Great! I can generate a Donation Report for you. First, please select what type of donation you want to analyze:",
          timestamp: new Date(),
          showDonationTypeOptions: true
        };
        setMessages(prev => [...prev, aiMessage]);
      },
      category: "report"
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
                        📅 For the {selectedDonationType === 'all' ? 'Donation Report' : 
                                   selectedDonationType === 'monetary' ? 'Donation Monetary Report' :
                                   selectedDonationType === 'artifact' ? 'Donation Artifact Report' :
                                   selectedDonationType === 'loan' ? 'Donation Loan Artifact Report' : 'Donation Report'}, what time period would you like to include?
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
                              📊 <strong>All Data</strong> - Complete {selectedDonationType === 'all' ? 'donation' : selectedDonationType === 'monetary' ? 'monetary donation' : selectedDonationType === 'artifact' ? 'artifact donation' : selectedDonationType === 'loan' ? 'loan artifact' : 'donation'} history
                            </p>
                            <p className="text-xs text-gray-600">
                              Shows all {selectedDonationType === 'all' ? 'donations' : selectedDonationType === 'monetary' ? 'monetary donations' : selectedDonationType === 'artifact' ? 'artifact donations' : selectedDonationType === 'loan' ? 'loan artifacts' : 'donations'} that have ever been received by the museum.
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
                              Shows {selectedDonationType === 'all' ? 'donations' : selectedDonationType === 'monetary' ? 'monetary donations' : selectedDonationType === 'artifact' ? 'artifact donations' : selectedDonationType === 'loan' ? 'loan artifacts' : 'donations'} from the 1st to the last day of the current month.
                            </p>
                          </div>
                        </div>
                        
                        <div 
                          className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleDonationDateRangeSelection('custom', 'custom')}
                        >
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-calendar-days text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📆 <strong>Custom Range</strong> - Specific date period
                            </p>
                            <p className="text-xs text-gray-600">
                              Choose your own start and end dates for precise {selectedDonationType === 'all' ? 'donation' : selectedDonationType === 'monetary' ? 'monetary donation' : selectedDonationType === 'artifact' ? 'artifact donation' : selectedDonationType === 'loan' ? 'loan artifact' : 'donation'} analysis.
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
                        
                        <div 
                          className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleCulturalObjectDateRangeSelection('custom', 'custom')}
                        >
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

                {/* Custom date picker for cultural objects reports */}
                {message.showCulturalObjectCustomDatePicker && waitingForCulturalObjectDateRange && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        📅 Select your custom date range for the cultural objects report:
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            <i className="fa-solid fa-play mr-1 text-green-600"></i>
                            Start Date
                            {culturalObjectStartDate && (
                              <span className="ml-2 text-xs text-green-600 font-normal">
                                ({culturalObjectStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                              </span>
                            )}
                          </label>
                          <DatePicker
                            selected={culturalObjectStartDate}
                            onChange={(date) => {
                              setCulturalObjectStartDate(date);
                              // If end date is before new start date, clear it
                              if (culturalObjectEndDate && date && date > culturalObjectEndDate) {
                                setCulturalObjectEndDate(null);
                              }
                            }}
                            maxDate={culturalObjectEndDate || undefined}
                            dateFormat="dd/MM/yyyy"
                            className="w-full p-3 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all"
                            placeholderText="Select start date"
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="scroll"
                            scrollableYearDropdown
                            scrollableMonthDropdown
                            yearDropdownItemNumber={15}
                          />
                          {culturalObjectStartDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              Selected: {culturalObjectStartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            <i className="fa-solid fa-stop mr-1 text-red-600"></i>
                            End Date
                            {culturalObjectEndDate && (
                              <span className="ml-2 text-xs text-red-600 font-normal">
                                ({culturalObjectEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                              </span>
                            )}
                            {culturalObjectStartDate && !culturalObjectEndDate && (
                              <span className="ml-2 text-xs text-blue-600 font-normal">
                                (Start: {culturalObjectStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                              </span>
                            )}
                          </label>
                          <div className="relative">
                            <DatePicker
                              selected={culturalObjectEndDate}
                              onChange={(date) => setCulturalObjectEndDate(date)}
                              minDate={culturalObjectStartDate || undefined}
                              startDate={culturalObjectStartDate || undefined}
                              highlightDates={culturalObjectStartDate ? [culturalObjectStartDate] : []}
                              openToDate={culturalObjectStartDate || new Date()}
                              dateFormat="dd/MM/yyyy"
                              className="w-full p-3 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all"
                              placeholderText="Select end date"
                              showMonthDropdown
                              showYearDropdown
                              dropdownMode="scroll"
                              scrollableYearDropdown
                              scrollableMonthDropdown
                              yearDropdownItemNumber={15}
                              title={culturalObjectStartDate ? `Select end date. Start date is ${culturalObjectStartDate.toLocaleDateString()} - dates before this are disabled in the calendar.` : 'Select end date'}
                              popperModifiers={[
                                {
                                  name: "offset",
                                  options: {
                                    offset: [0, 8]
                                  }
                                }
                              ]}
                            />
                          </div>
                          {culturalObjectEndDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              Selected: {culturalObjectEndDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                          {culturalObjectStartDate && !culturalObjectEndDate && (
                            <p className="text-xs text-blue-600 mt-1 font-medium">
                              💡 Start date selected: {culturalObjectStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {culturalObjectStartDate && culturalObjectEndDate && (
                        <div className="mt-3 p-3 bg-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-lg">
                          <p className="text-xs font-medium text-gray-700">
                            📊 Date Range: <span className="text-[#E5B80B] font-bold">
                              {new Date(culturalObjectStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} 
                              {' → '}
                              {new Date(culturalObjectEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {Math.ceil((new Date(culturalObjectEndDate) - new Date(culturalObjectStartDate)) / (1000 * 60 * 60 * 24)) + 1} days selected
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E5B80B]/20">
                        <div className="text-xs text-gray-600 flex items-center">
                          <div className="w-4 h-4 bg-[#E5B80B]/20 rounded-full flex items-center justify-center mr-2">
                            <i className="fa-solid fa-info text-[#E5B80B] text-xs"></i>
                          </div>
                          {culturalObjectStartDate && culturalObjectEndDate ? 'Ready to generate report!' : 'Select both dates to continue'}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setWaitingForCulturalObjectDateRange(false);
                              setCulturalObjectStartDate(null);
                              setCulturalObjectEndDate(null);
                            }}
                            className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <i className="fa-solid fa-times mr-1"></i>
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (culturalObjectStartDate && culturalObjectEndDate) {
                                // Format dates in local timezone to avoid timezone conversion issues
                                const formatLocalDate = (date) => {
                                  const year = date.getFullYear();
                                  const month = String(date.getMonth() + 1).padStart(2, '0');
                                  const day = String(date.getDate()).padStart(2, '0');
                                  return `${year}-${month}-${day}`;
                                };
                                const startDateStr = formatLocalDate(culturalObjectStartDate);
                                const endDateStr = formatLocalDate(culturalObjectEndDate);
                                console.log('📅 Cultural objects custom date range selected:', startDateStr, 'to', endDateStr);
                                handleCulturalObjectDateRangeSelection(startDateStr, endDateStr);
                              }
                            }}
                            disabled={!culturalObjectStartDate || !culturalObjectEndDate}
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
                        
                        <div 
                          className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleArchiveDateRangeSelection('custom', 'custom')}
                        >
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

                {/* Custom date picker for archive reports */}
                {message.showArchiveCustomDatePicker && waitingForArchiveDateRange && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        📅 Select your custom date range for the archive analysis report:
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            <i className="fa-solid fa-play mr-1 text-green-600"></i>
                            Start Date
                            {archiveStartDate && (
                              <span className="ml-2 text-xs text-green-600 font-normal">
                                ({archiveStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                              </span>
                            )}
                          </label>
                          <DatePicker
                            selected={archiveStartDate}
                            onChange={(date) => {
                              setArchiveStartDate(date);
                              // If end date is before new start date, clear it
                              if (archiveEndDate && date && date > archiveEndDate) {
                                setArchiveEndDate(null);
                              }
                            }}
                            maxDate={archiveEndDate || undefined}
                            dateFormat="dd/MM/yyyy"
                            className="w-full p-3 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all"
                            placeholderText="Select start date"
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="scroll"
                            scrollableYearDropdown
                            scrollableMonthDropdown
                            yearDropdownItemNumber={15}
                          />
                          {archiveStartDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              Selected: {archiveStartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            <i className="fa-solid fa-stop mr-1 text-red-600"></i>
                            End Date
                            {archiveEndDate && (
                              <span className="ml-2 text-xs text-red-600 font-normal">
                                ({archiveEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                              </span>
                            )}
                            {archiveStartDate && !archiveEndDate && (
                              <span className="ml-2 text-xs text-blue-600 font-normal">
                                (Start: {archiveStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                              </span>
                            )}
                          </label>
                          <div className="relative">
                            <DatePicker
                              selected={archiveEndDate}
                              onChange={(date) => setArchiveEndDate(date)}
                              minDate={archiveStartDate || undefined}
                              startDate={archiveStartDate || undefined}
                              highlightDates={archiveStartDate ? [archiveStartDate] : []}
                              openToDate={archiveStartDate || new Date()}
                              dateFormat="dd/MM/yyyy"
                              className="w-full p-3 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all"
                              placeholderText="Select end date"
                              showMonthDropdown
                              showYearDropdown
                              dropdownMode="scroll"
                              scrollableYearDropdown
                              scrollableMonthDropdown
                              yearDropdownItemNumber={15}
                              title={archiveStartDate ? `Select end date. Start date is ${archiveStartDate.toLocaleDateString()} - dates before this are disabled in the calendar.` : 'Select end date'}
                              popperModifiers={[
                                {
                                  name: "offset",
                                  options: {
                                    offset: [0, 8]
                                  }
                                }
                              ]}
                            />
                          </div>
                          {archiveEndDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              Selected: {archiveEndDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                          {archiveStartDate && !archiveEndDate && (
                            <p className="text-xs text-blue-600 mt-1 font-medium">
                              💡 Start date selected: {archiveStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {archiveStartDate && archiveEndDate && (
                        <div className="mt-3 p-3 bg-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-lg">
                          <p className="text-xs font-medium text-gray-700">
                            📊 Date Range: <span className="text-[#E5B80B] font-bold">
                              {new Date(archiveStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} 
                              {' → '}
                              {new Date(archiveEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {Math.ceil((new Date(archiveEndDate) - new Date(archiveStartDate)) / (1000 * 60 * 60 * 24)) + 1} days selected
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E5B80B]/20">
                        <div className="text-xs text-gray-600 flex items-center">
                          <div className="w-4 h-4 bg-[#E5B80B]/20 rounded-full flex items-center justify-center mr-2">
                            <i className="fa-solid fa-info text-[#E5B80B] text-xs"></i>
                          </div>
                          {archiveStartDate && archiveEndDate ? 'Ready to generate report!' : 'Select both dates to continue'}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setWaitingForArchiveDateRange(false);
                              setArchiveStartDate(null);
                              setArchiveEndDate(null);
                            }}
                            className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <i className="fa-solid fa-times mr-1"></i>
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (archiveStartDate && archiveEndDate) {
                                // Format dates in local timezone to avoid timezone conversion issues
                                const formatLocalDate = (date) => {
                                  const year = date.getFullYear();
                                  const month = String(date.getMonth() + 1).padStart(2, '0');
                                  const day = String(date.getDate()).padStart(2, '0');
                                  return `${year}-${month}-${day}`;
                                };
                                const startDateStr = formatLocalDate(archiveStartDate);
                                const endDateStr = formatLocalDate(archiveEndDate);
                                console.log('📅 Archive custom date range selected:', startDateStr, 'to', endDateStr);
                                handleArchiveDateRangeSelection(startDateStr, endDateStr);
                              }
                            }}
                            disabled={!archiveStartDate || !archiveEndDate}
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

                {/* Donation date options - conversational */}
                {message.showDonationDateOptions && waitingForDonationDateRange && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        📅 For the {selectedDonationType === 'all' ? 'Donation Report' : 
                                   selectedDonationType === 'monetary' ? 'Donation Monetary Report' :
                                   selectedDonationType === 'artifact' ? 'Donation Artifact Report' :
                                   selectedDonationType === 'loan' ? 'Donation Loan Artifact Report' : 'Donation Report'}, what time period would you like to include?
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
                              📊 <strong>All Data</strong> - Complete {selectedDonationType === 'all' ? 'donation' : selectedDonationType === 'monetary' ? 'monetary donation' : selectedDonationType === 'artifact' ? 'artifact donation' : selectedDonationType === 'loan' ? 'loan artifact' : 'donation'} history
                            </p>
                            <p className="text-xs text-gray-600">
                              Shows all {selectedDonationType === 'all' ? 'donations' : selectedDonationType === 'monetary' ? 'monetary donations' : selectedDonationType === 'artifact' ? 'artifact donations' : selectedDonationType === 'loan' ? 'loan artifacts' : 'donations'} that have ever been received by the museum.
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
                              Shows {selectedDonationType === 'all' ? 'donations' : selectedDonationType === 'monetary' ? 'monetary donations' : selectedDonationType === 'artifact' ? 'artifact donations' : selectedDonationType === 'loan' ? 'loan artifacts' : 'donations'} from the 1st to the last day of the current month.
                            </p>
                          </div>
                        </div>
                        
                        <div 
                          className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleDonationDateRangeSelection('custom', 'custom')}
                        >
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-calendar-days text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              📆 <strong>Custom Range</strong> - Specific date period
                            </p>
                            <p className="text-xs text-gray-600">
                              Choose your own start and end dates for precise {selectedDonationType === 'all' ? 'donation' : selectedDonationType === 'monetary' ? 'monetary donation' : selectedDonationType === 'artifact' ? 'artifact donation' : selectedDonationType === 'loan' ? 'loan artifact' : 'donation'} analysis.
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
                        Please select the specific donation type you want to analyze:
                      </p>
                      
                      <div className="space-y-2">
                        <button 
                          onClick={() => handleDonationTypeSelection('all')}
                          className="w-full flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-[#E5B80B] hover:bg-[#E5B80B]/5 transition-all duration-200 cursor-pointer group"
                        >
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#E5B80B]/30 transition-colors">
                            <i className="fa-solid fa-list text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-800 mb-1 group-hover:text-[#E5B80B]">
                              📊 <strong>All Types</strong> - Complete donation overview
                            </p>
                            <p className="text-xs text-gray-600 group-hover:text-[#E5B80B]/80">
                              Shows all donation types including monetary, artifacts, and loans.
                            </p>
                          </div>
                          <div className="flex items-center">
                            <i className="fa-solid fa-arrow-right text-gray-400 group-hover:text-[#E5B80B] transition-colors"></i>
                          </div>
                        </button>
                        
                        <button 
                          onClick={() => handleDonationTypeSelection('monetary')}
                          className="w-full flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 cursor-pointer group"
                        >
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-green-200 transition-colors">
                            <i className="fa-solid fa-money-bill text-green-600 text-xs"></i>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-800 mb-1 group-hover:text-green-800">
                              💰 <strong>Monetary</strong> - Cash and financial contributions
                            </p>
                            <p className="text-xs text-gray-600 group-hover:text-green-600">
                              All cash donations and financial contributions to the museum.
                            </p>
                          </div>
                          <div className="flex items-center">
                            <i className="fa-solid fa-arrow-right text-gray-400 group-hover:text-green-500 transition-colors"></i>
                          </div>
                        </button>
                        
                        <button 
                          onClick={() => handleDonationTypeSelection('artifact')}
                          className="w-full flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 cursor-pointer group"
                        >
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-purple-200 transition-colors">
                            <i className="fa-solid fa-gift text-purple-600 text-xs"></i>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-800 mb-1 group-hover:text-purple-800">
                              🎁 <strong>Artifact</strong> - Permanent donations
                            </p>
                            <p className="text-xs text-gray-600 group-hover:text-purple-600">
                              Historical items and artifacts permanently donated to the museum.
                            </p>
                          </div>
                          <div className="flex items-center">
                            <i className="fa-solid fa-arrow-right text-gray-400 group-hover:text-purple-500 transition-colors"></i>
                        </div>
                        </button>
                        
                        <button 
                          onClick={() => handleDonationTypeSelection('loan')}
                          className="w-full flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 cursor-pointer group"
                        >
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-blue-200 transition-colors">
                            <i className="fa-solid fa-handshake text-blue-600 text-xs"></i>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-800 mb-1 group-hover:text-blue-800">
                              🤝 <strong>Loan Artifact</strong> - Temporary loans for display
                            </p>
                            <p className="text-xs text-gray-600 group-hover:text-blue-600">
                              Artifacts and items loaned to the museum for temporary display.
                            </p>
                          </div>
                          <div className="flex items-center">
                            <i className="fa-solid fa-arrow-right text-gray-400 group-hover:text-blue-500 transition-colors"></i>
                          </div>
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        Click on any option above to get started, or type <strong>"all"</strong>, <strong>"monetary"</strong>, <strong>"artifact"</strong>, or <strong>"loan"</strong> to choose.
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
                        <button 
                          onClick={() => handleVisitorReportTypeSelection('graph')}
                          className="w-full flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 cursor-pointer group"
                        >
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-purple-200 transition-colors">
                            <i className="fa-solid fa-chart-line text-purple-600 text-xs"></i>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-800 mb-1 group-hover:text-purple-800">
                              📊 <strong>Graph Report</strong> - Visual analytics with charts and graphs
                            </p>
                            <p className="text-xs text-gray-600 group-hover:text-purple-600">
                              Perfect for presentations and analysis. Shows visitor trends, demographics, and patterns.
                            </p>
                          </div>
                          <div className="flex items-center">
                            <i className="fa-solid fa-arrow-right text-gray-400 group-hover:text-purple-500 transition-colors"></i>
                        </div>
                        </button>
                        
                        <button 
                          onClick={() => handleVisitorReportTypeSelection('list')}
                          className="w-full flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 cursor-pointer group"
                        >
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-blue-200 transition-colors">
                            <i className="fa-solid fa-list text-blue-600 text-xs"></i>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-800 mb-1 group-hover:text-blue-800">
                              📋 <strong>Visitor List Report</strong> - Simple list of all visitors
                            </p>
                            <p className="text-xs text-gray-600 group-hover:text-blue-600">
                              Great for detailed records. Shows individual visitor information and contact details.
                            </p>
                          </div>
                          <div className="flex items-center">
                            <i className="fa-solid fa-arrow-right text-gray-400 group-hover:text-blue-500 transition-colors"></i>
                        </div>
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        Click on either option above to get started, or type <strong>"graph"</strong> for visual analytics or <strong>"visitor list"</strong> for a simple list.
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
                        <button 
                          onClick={() => handleVisitorDateRangeSelection('all', 'all')}
                          className="w-full flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-[#E5B80B] hover:bg-[#E5B80B]/5 transition-all duration-200 cursor-pointer group"
                        >
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#E5B80B]/30 transition-colors">
                            <i className="fa-solid fa-database text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-800 mb-1 group-hover:text-[#E5B80B]">
                              📊 <strong>All Data</strong> - Complete visitor history
                            </p>
                            <p className="text-xs text-gray-600 group-hover:text-[#E5B80B]/80">
                              Shows all visitors who have ever checked in to the museum.
                            </p>
                          </div>
                          <div className="flex items-center">
                            <i className="fa-solid fa-arrow-right text-gray-400 group-hover:text-[#E5B80B] transition-colors"></i>
                        </div>
                        </button>
                        
                        <button 
                          onClick={() => handleVisitorDateRangeSelection('this_month', 'this_month')}
                          className="w-full flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-[#E5B80B] hover:bg-[#E5B80B]/5 transition-all duration-200 cursor-pointer group"
                        >
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#E5B80B]/30 transition-colors">
                            <i className="fa-solid fa-calendar text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-800 mb-1 group-hover:text-[#E5B80B]">
         📅 <strong>This Month</strong> - Full current month
       </p>
                            <p className="text-xs text-gray-600 group-hover:text-[#E5B80B]/80">
         Shows visitors from the 1st to the last day of the current month.
       </p>
                          </div>
                          <div className="flex items-center">
                            <i className="fa-solid fa-arrow-right text-gray-400 group-hover:text-[#E5B80B] transition-colors"></i>
                        </div>
                        </button>
                        
                        <button 
                          onClick={() => handleVisitorDateRangeSelection('custom', 'custom')}
                          className="w-full flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-[#E5B80B] hover:bg-[#E5B80B]/5 transition-all duration-200 cursor-pointer group"
                        >
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#E5B80B]/30 transition-colors">
                            <i className="fa-solid fa-calendar-days text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-800 mb-1 group-hover:text-[#E5B80B]">
                              📅 <strong>Custom Range</strong> - Specific date period
                            </p>
                            <p className="text-xs text-gray-600 group-hover:text-[#E5B80B]/80">
                              Choose your own start and end dates for precise analysis.
                            </p>
                          </div>
                          <div className="flex items-center">
                            <i className="fa-solid fa-arrow-right text-gray-400 group-hover:text-[#E5B80B] transition-colors"></i>
                        </div>
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        Click on any option above to get started, or type <strong>"all"</strong>, <strong>"this month"</strong>, or <strong>"custom"</strong> to choose.
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
                {message.showEventListDateOptions && waitingForEventListDateRange && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        📅 For the Event List Report, what time period would you like to include?
                      </p>
                      
                      <div className="space-y-2">
                        <button 
                          onClick={() => handleEventListDateRangeSelection('all', 'all')}
                          className="w-full flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-[#E5B80B] hover:bg-[#E5B80B]/5 transition-all duration-200 cursor-pointer group"
                        >
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#E5B80B]/30 transition-colors">
                            <i className="fa-solid fa-database text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-800 mb-1 group-hover:text-[#E5B80B]">
                              📊 <strong>All Data</strong> - Complete event history
                            </p>
                            <p className="text-xs text-gray-600 group-hover:text-[#E5B80B]/80">
                              Shows all events that have ever been organized by the museum.
                            </p>
                          </div>
                          <div className="flex items-center">
                            <i className="fa-solid fa-arrow-right text-gray-400 group-hover:text-[#E5B80B] transition-colors"></i>
                        </div>
                        </button>
                        
                        <button 
                          onClick={() => handleEventListDateRangeSelection('this_month', 'this_month')}
                          className="w-full flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-[#E5B80B] hover:bg-[#E5B80B]/5 transition-all duration-200 cursor-pointer group"
                        >
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#E5B80B]/30 transition-colors">
                            <i className="fa-solid fa-calendar text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-800 mb-1 group-hover:text-[#E5B80B]">
                              📅 <strong>This Month</strong> - Full current month
                            </p>
                            <p className="text-xs text-gray-600 group-hover:text-[#E5B80B]/80">
                              Shows events from the 1st to the last day of the current month.
                            </p>
                          </div>
                          <div className="flex items-center">
                            <i className="fa-solid fa-arrow-right text-gray-400 group-hover:text-[#E5B80B] transition-colors"></i>
                        </div>
                        </button>
                        
                        <button 
                          onClick={() => handleEventListDateRangeSelection('custom', 'custom')}
                          className="w-full flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-[#E5B80B] hover:bg-[#E5B80B]/5 transition-all duration-200 cursor-pointer group"
                        >
                          <div className="w-6 h-6 bg-[#E5B80B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#E5B80B]/30 transition-colors">
                            <i className="fa-solid fa-calendar-days text-[#E5B80B] text-xs"></i>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-800 mb-1 group-hover:text-[#E5B80B]">
                              📆 <strong>Custom Range</strong> - Specific date period
                            </p>
                            <p className="text-xs text-gray-600 group-hover:text-[#E5B80B]/80">
                              Choose your own start and end dates for precise analysis.
                            </p>
                          </div>
                          <div className="flex items-center">
                            <i className="fa-solid fa-arrow-right text-gray-400 group-hover:text-[#E5B80B] transition-colors"></i>
                        </div>
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        Click on any option above to get started, or type <strong>"all"</strong>, <strong>"this month"</strong>, or <strong>"custom"</strong> to choose.
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
                        <button 
                          onClick={() => handleEventParticipantsReportTypeSelection('list')}
                          className="w-full flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 cursor-pointer group"
                        >
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-blue-200 transition-colors">
                            <i className="fa-solid fa-list text-blue-600 text-xs"></i>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-800 mb-1 group-hover:text-blue-800">
                              📋 <strong>Event List</strong> - Simple list of all events
                            </p>
                            <p className="text-xs text-gray-600 group-hover:text-blue-600">
                              Perfect for getting a quick overview. Shows event titles, dates, locations, and participant counts.
                            </p>
                          </div>
                          <div className="flex items-center">
                            <i className="fa-solid fa-arrow-right text-gray-400 group-hover:text-blue-500 transition-colors"></i>
                        </div>
                        </button>
                        
                        <button 
                          onClick={() => handleEventParticipantsReportTypeSelection('participants')}
                          className="w-full flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 cursor-pointer group"
                        >
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-green-200 transition-colors">
                            <i className="fa-solid fa-users text-green-600 text-xs"></i>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-800 mb-1 group-hover:text-green-800">
                              👥 <strong>Event Participants</strong> - List of event participants
                            </p>
                            <p className="text-xs text-gray-600 group-hover:text-green-600">
                              Perfect for detailed records. Shows individual participant information, event details, and attendance data.
                            </p>
                          </div>
                          <div className="flex items-center">
                            <i className="fa-solid fa-arrow-right text-gray-400 group-hover:text-green-500 transition-colors"></i>
                        </div>
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        Click on either option above to get started, or type <strong>"event list"</strong> or <strong>"participants"</strong> to choose.
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
                
                {/* Event participants date options - REMOVED - not needed for participants report */}
                
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
                
                {/* Custom date picker for donation reports */}
                {message.showDonationCustomDatePicker && waitingForDonationDateRange && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E5B80B]/5 to-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-xl">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-3">
                        📅 Select your custom date range for the donation report:
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            <i className="fa-solid fa-play mr-1 text-green-600"></i>
                            Start Date
                            {donationStartDate && (
                              <span className="ml-2 text-xs text-green-600 font-normal">
                                ({donationStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                              </span>
                            )}
                          </label>
                          <DatePicker
                            selected={donationStartDate}
                            onChange={(date) => {
                              setDonationStartDate(date);
                              // If end date is before new start date, clear it
                              if (donationEndDate && date && date > donationEndDate) {
                                setDonationEndDate(null);
                              }
                            }}
                            maxDate={donationEndDate || undefined}
                            dateFormat="dd/MM/yyyy"
                            className="w-full p-3 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all"
                            placeholderText="Select start date"
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="scroll"
                            scrollableYearDropdown
                            scrollableMonthDropdown
                            yearDropdownItemNumber={15}
                          />
                          {donationStartDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              Selected: {donationStartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            <i className="fa-solid fa-stop mr-1 text-red-600"></i>
                            End Date
                            {donationEndDate && (
                              <span className="ml-2 text-xs text-red-600 font-normal">
                                ({donationEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                              </span>
                            )}
                            {donationStartDate && !donationEndDate && (
                              <span className="ml-2 text-xs text-blue-600 font-normal">
                                (Start: {donationStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                              </span>
                            )}
                          </label>
                          <div className="relative">
                            <DatePicker
                              selected={donationEndDate}
                              onChange={(date) => setDonationEndDate(date)}
                              minDate={donationStartDate || undefined}
                              startDate={donationStartDate || undefined}
                              highlightDates={donationStartDate ? [donationStartDate] : []}
                              openToDate={donationStartDate || new Date()}
                              dateFormat="dd/MM/yyyy"
                              className="w-full p-3 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all"
                              placeholderText="Select end date"
                              showMonthDropdown
                              showYearDropdown
                              dropdownMode="scroll"
                              scrollableYearDropdown
                              scrollableMonthDropdown
                              yearDropdownItemNumber={15}
                              title={donationStartDate ? `Select end date. Start date is ${donationStartDate.toLocaleDateString()} - dates before this are disabled in the calendar.` : 'Select end date'}
                              popperModifiers={[
                                {
                                  name: "offset",
                                  options: {
                                    offset: [0, 8]
                                  }
                                }
                              ]}
                            />
                          </div>
                          {donationEndDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              Selected: {donationEndDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                          {donationStartDate && !donationEndDate && (
                            <p className="text-xs text-blue-600 mt-1 font-medium">
                              💡 Start date selected: {donationStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {donationStartDate && donationEndDate && (
                        <div className="mt-3 p-3 bg-[#E5B80B]/10 border border-[#E5B80B]/30 rounded-lg">
                          <p className="text-xs font-medium text-gray-700">
                            📊 Date Range: <span className="text-[#E5B80B] font-bold">
                              {new Date(donationStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} 
                              {' → '}
                              {new Date(donationEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {Math.ceil((new Date(donationEndDate) - new Date(donationStartDate)) / (1000 * 60 * 60 * 24)) + 1} days selected
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E5B80B]/20">
                        <div className="text-xs text-gray-600 flex items-center">
                          <div className="w-4 h-4 bg-[#E5B80B]/20 rounded-full flex items-center justify-center mr-2">
                            <i className="fa-solid fa-info text-[#E5B80B] text-xs"></i>
                          </div>
                          {donationStartDate && donationEndDate ? 'Ready to generate report!' : 'Select both dates to continue'}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setWaitingForDonationDateRange(false);
                              setDonationStartDate('');
                              setDonationEndDate('');
                            }}
                            className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <i className="fa-solid fa-times mr-1"></i>
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (donationStartDate && donationEndDate) {
                                const startDateStr = donationStartDate.toISOString().split('T')[0];
                                const endDateStr = donationEndDate.toISOString().split('T')[0];
                                handleDonationDateRangeSelection(startDateStr, endDateStr);
                              }
                            }}
                            disabled={!donationStartDate || !donationEndDate}
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
          {getFilteredQuickActions().slice(0, 5).map((action, index) => (
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