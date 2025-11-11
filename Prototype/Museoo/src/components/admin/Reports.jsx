import React, { useState, useEffect } from "react";
import api from "../../config/api";
import AIChat from "./AIChat";
import { canView, canEdit, canAdmin, getAccessLevel } from '../../utils/permissions';

const Reports = ({ userPermissions }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [error, setError] = useState("");
  const [aiStatus, setAiStatus] = useState({ available: false, provider: 'Unknown', message: 'Checking...' });
  const [realTimeInsights, setRealTimeInsights] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewFormat, setPreviewFormat] = useState('pdf');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    type: 'success',
    title: '',
    message: '',
    description: ''
  });
  const [confirmationModal, setConfirmationModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    reportId: null
  });
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsPerPage] = useState(8);

  // Check permissions
  const canViewReports = canView(userPermissions, 'reports');
  const canEditReports = canEdit(userPermissions, 'reports');
  const canAdminReports = canAdmin(userPermissions, 'reports');
  const accessLevel = getAccessLevel(userPermissions, 'reports');

  // Pagination logic for reports
  const totalReports = reports.length;
  const totalPages = Math.ceil(totalReports / reportsPerPage);
  const startIndex = (reportsPage - 1) * reportsPerPage;
  const endIndex = startIndex + reportsPerPage;
  const currentReports = reports.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (reportsPage < totalPages) {
      setReportsPage(reportsPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (reportsPage > 1) {
      setReportsPage(reportsPage - 1);
    }
  };

  const goToPage = (page) => {
    setReportsPage(page);
  };

  console.log("🔍 Reports permissions:", { canViewReports, canEditReports, canAdminReports, accessLevel });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/reports");
      console.log('📊 Fetched reports:', res.data);
      setReports(res.data.reports || []);
      // Reset to first page when new reports are fetched
      setReportsPage(1);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setAnalyticsLoading(true);
      const [statsRes, insightsRes] = await Promise.all([
        api.get('/api/stats/summary'),
        api.get('/api/reports/real-time-insights')
      ]);
      
      setAnalyticsData(statsRes.data);
      if (insightsRes.data.success) {
        setRealTimeInsights(insightsRes.data.insights);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setAnalyticsLoading(false);
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
      setAiStatus({ available: false, provider: 'Error', message: 'Failed to check AI status' });
    }
  };

  useEffect(() => {
    fetchReports();
    checkAIStatus();
    fetchAnalyticsData();
    
    // Refresh analytics data every 5 minutes
    const interval = setInterval(fetchAnalyticsData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const downloadReport = async (reportId, format = 'pdf') => {
    try {
      const res = await api.get(`/api/reports/${reportId}/download?format=${format}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${reportId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading report:", err);
      setError("Failed to download report");
    }
  };

  const generateGraphReport = async (reportId) => {
    try {
      console.log('📊 Generating graph report for:', reportId);
      setLoading(true);
      
      const response = await api.post('/api/reports/generate-graphs', {
        reportId: reportId,
        chartTypes: ['all']
      });
      
      if (response.data.success) {
        console.log('✅ Graph report generated successfully');
        
        // Refresh the reports list to show updated content
        await fetchReports();
        
        // Show success notification
        setNotification({
          show: true,
          type: 'success',
          title: 'Graph Report Generated!',
          message: 'Your visitor report now includes interactive charts and graphs.',
          description: 'The report has been enhanced with visual analytics and can be downloaded or previewed.'
        });
        
        setError(''); // Clear any errors
      } else {
        throw new Error(response.data.message || 'Failed to generate graph report');
      }
    } catch (error) {
      console.error('Error generating graph report:', error);
      
      // Show error notification
      setNotification({
        show: true,
        type: 'error',
        title: 'Graph Generation Failed',
        message: 'Failed to generate graph report. Please try again.',
        description: error.response?.data?.message || error.message
      });
      
      setError('Failed to generate graph report: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const showDeleteConfirmation = (reportId) => {
    setConfirmationModal({
      show: true,
      title: 'Delete Report',
      message: 'Are you sure you want to delete this report? This action cannot be undone.',
      onConfirm: () => deleteReport(reportId),
      reportId: reportId
    });
  };

  const deleteReport = async (reportId) => {
    try {
      console.log('Deleting report:', reportId);
      
      // Close confirmation modal first
      setConfirmationModal({
        show: false,
        title: '',
        message: '',
        onConfirm: null,
        reportId: null
      });
      
      const response = await api.delete(`/api/reports/${reportId}`);
      
      if (response.data.success) {
        console.log('Report deleted successfully');
        
        // Remove from local state
        setReports(prev => prev.filter(report => report.id !== reportId));
        
        // If the deleted report is currently being viewed, close the modal
        if (generatedReport && generatedReport.id === reportId) {
          setShowReportModal(false);
          setGeneratedReport(null);
          setPreviewData(null);
        }
        
        // Show success notification
        setNotification({
          show: true,
          type: 'success',
          title: 'Report Deleted Successfully!',
          message: 'The report and its associated files have been permanently removed.',
          description: 'This action cannot be undone.'
        });
        
        setError(''); // Clear any errors
      } else {
        throw new Error(response.data.message || 'Failed to delete report');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      
      // Show error notification
      setNotification({
        show: true,
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete the report. Please try again.',
        description: error.response?.data?.message || error.message
      });
      
      setError('Failed to delete report: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteAllReports = async () => {
    try {
      console.log('Deleting all reports...');
      
      // Close confirmation modal first
      setConfirmationModal({
        show: false,
        title: '',
        message: '',
        onConfirm: null,
        reportId: null
      });
      
      const response = await api.delete('/api/reports/delete-all');
      
      if (response.data.success) {
        console.log('All reports deleted successfully');
        
        // Clear all reports from local state
        setReports([]);
        
        // Close any open modals
        setShowReportModal(false);
        setGeneratedReport(null);
        setPreviewData(null);
        
        // Reset pagination
        setReportsPage(1);
        
        // Show success notification
        setNotification({
          show: true,
          type: 'success',
          title: 'All Reports Deleted Successfully!',
          message: `All ${totalReports} reports and their associated files have been permanently removed.`,
          description: 'This action cannot be undone. You can now generate new reports.'
        });
        
        setError(''); // Clear any errors
      } else {
        throw new Error(response.data.message || 'Failed to delete all reports');
      }
    } catch (error) {
      console.error('Error deleting all reports:', error);
      
      // Show error notification
      setNotification({
        show: true,
        type: 'error',
        title: 'Delete All Failed',
        message: 'Failed to delete all reports. Please try again.',
        description: error.response?.data?.message || error.message
      });
      
      setError('Failed to delete all reports: ' + (error.response?.data?.message || error.message));
    }
  };

  const previewReport = async (reportId, format = 'pdf') => {
    try {
      console.log('🔍 Preview button clicked:', { reportId, format });
      
      // Clear previous preview data and revoke old blob URL to prevent showing wrong report
      if (previewData) {
        console.log('🧹 Clearing previous preview data...');
        URL.revokeObjectURL(previewData);
        setPreviewData(null);
      }
      
      setPreviewLoading(true);
      setError(""); // Clear any previous errors
      // Don't open modal - load directly in report details view
      
      console.log('📡 Making API request to:', `/api/reports/${reportId}/download?format=${format}`);
      const res = await api.get(`/api/reports/${reportId}/download?format=${format}`, {
        responseType: 'blob',
        timeout: 120000 // 2 minutes for large PDF downloads
      });
      
      console.log('✅ API response received:', { 
        status: res.status, 
        headers: res.headers, 
        dataType: typeof res.data,
        dataSize: res.data?.size || 'unknown'
      });
      
      if (!res.data || res.data.size === 0) {
        throw new Error('No file data received from server');
      }
      
      // Create blob with proper MIME type
      const mimeType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const blob = new Blob([res.data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      console.log('🔗 Blob URL created:', url);
      console.log('📄 Blob details:', { 
        type: blob.type, 
        size: blob.size, 
        mimeType: mimeType 
      });
      
      setPreviewData(url);
      setPreviewFormat(format);
      
      console.log('✅ Preview modal should now be visible');
    } catch (err) {
      console.error("❌ Error previewing report:", err);
      console.error("❌ Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      let errorMessage = 'Failed to preview report';
      if (err.response?.status === 404) {
        errorMessage = 'Report not found or file not generated yet';
      } else if (err.response?.status === 401) {
        errorMessage = 'You are not authorized to view this report';
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage = 'Report download is taking longer than expected. The file may be large. Please try again or download directly.';
      } else if (err.message.includes('No file data')) {
        errorMessage = 'File is empty or not properly generated';
      } else {
        errorMessage = `Failed to preview report: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleAIGenerateReport = async (reportData) => {
    try {
      console.log('handleAIGenerateReport called with:', reportData);
      
      // If the AI returns a report object, display it in modal
      if (reportData) {
        console.log('Setting generated report:', reportData);
        setGeneratedReport(reportData);
        setReports(prev => [reportData, ...prev]);
        setShowReportModal(true);
        
        // Show success notification
        setNotification({
          show: true,
          type: 'success',
          title: 'Report Generated Successfully!',
          message: `Your ${reportData.report_type.replace('_', ' ')} report has been created and is ready to view.`,
          description: 'The report modal will open automatically with a preview.'
        });
        
        // Automatically load PDF preview in the report details view (not modal)
        setTimeout(() => {
          console.log('Auto-loading PDF preview for report:', reportData.id);
          previewReport(reportData.id, 'pdf');
        }, 500); // Reduced delay for faster loading
        
        console.log('Report set successfully');
      } else {
        console.log('No report data received');
      }
    } catch (error) {
      console.error('Error handling AI report:', error);
      
      // Show error notification
      setNotification({
        show: true,
        type: 'error',
        title: 'Report Generation Failed',
        message: 'Failed to process the generated report. Please try again.',
        description: error.message || 'An unexpected error occurred.'
      });
      
      setError("Failed to process AI report");
    }
  };

  const formatReportContent = (reportData) => {
    if (!reportData) return '';
    
    console.log('🔍 Formatting report data:', reportData);
    
    // If it's already HTML content, return as is
    if (typeof reportData === 'string' && reportData.includes('<')) {
      return reportData;
    }
    
    // If it's JSON data, format it into a readable report
    if (typeof reportData === 'object') {
      let html = '<div class="report-content">';
      
      // Check if this is a report from the database (has content field)
      if (reportData.content && typeof reportData.content === 'string') {
                 // This is a report from the database, use the pre-generated content
         html += `
           <div class="mb-6">
             <h3 class="text-lg font-bold text-[#2e2b41] mb-3">AI Generated Report</h3>
             <div class="bg-gray-50 p-4 rounded-lg">
               <div class="prose max-w-none">
                 ${reportData.content}
               </div>
             </div>
           </div>
         `;
      } else {
        // This is raw data from AI generation, format it manually
        
        // Executive Summary
        if (reportData.executiveSummary) {
          html += `
            <div class="mb-6">
              <h3 class="text-lg font-bold text-[#2e2b41] mb-3">Executive Summary</h3>
              <p class="text-gray-700">${reportData.executiveSummary}</p>
            </div>
          `;
        }
        
        // Key Insights
        if (reportData.keyInsights && Array.isArray(reportData.keyInsights)) {
          html += `
            <div class="mb-6">
              <h3 class="text-lg font-bold text-[#2e2b41] mb-3">Key Insights</h3>
              <ul class="list-disc list-inside space-y-2">
                ${reportData.keyInsights.map(insight => `<li class="text-gray-700">${insight}</li>`).join('')}
              </ul>
            </div>
          `;
        }
        
        // AI Recommendations
        if (reportData.aiRecommendations && Array.isArray(reportData.aiRecommendations)) {
          html += `
            <div class="mb-6">
              <h3 class="text-lg font-bold text-[#2e2b41] mb-3">AI Recommendations</h3>
              <ul class="list-disc list-inside space-y-2">
                ${reportData.aiRecommendations.map(rec => `<li class="text-gray-700">${rec}</li>`).join('')}
              </ul>
            </div>
          `;
        }
        
        // Visitor Information Table
        if (reportData.visitorDetails && Array.isArray(reportData.visitorDetails)) {
          html += `
            <div class="mb-6">
              <h3 class="text-lg font-bold text-[#2e2b41] mb-3">Complete Visitor Information</h3>
              <p class="text-sm text-gray-600 mb-4">Detailed information for all visitors who entered the museum (based on QR scan check-in time)</p>
              <div class="overflow-x-auto">
                <table class="min-w-full bg-white border border-gray-300">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Name</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Gender</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Visitor Type</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Email</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Address</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Purpose of Visit</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Institution</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Time & Date Visited</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    ${reportData.visitorDetails.map(visitor => `
                      <tr>
                        <td class="px-4 py-2 text-sm text-gray-900">${visitor.first_name} ${visitor.last_name}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${visitor.gender}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${visitor.visitor_type}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${visitor.email}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${visitor.address}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${visitor.purpose}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${visitor.institution || 'N/A'}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${new Date(visitor.checkin_time).toLocaleString()}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `;
        }
      }
      
      html += '</div>';
      return html;
    }
    
    return reportData;
  };

  // Check if user has permission to view reports
  if (!canViewReports) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-ban text-red-600 text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access the Reports section.</p>
          <div className="text-sm text-gray-500">
            <p>Required permission: <span className="font-semibold">Reports Access</span></p>
            <p>Your status: <span className="font-semibold">{accessLevel === 'access' ? 'Have Access' : 'Access Hidden'}</span></p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-[#2e2b41]">
          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
          Loading reports...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
        .text-shadow-lg {
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
      `}</style>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 font-telegraf text-[#351E10]">
              <i className="fa-solid fa-chart-bar mr-3 text-[#E5B80B]"></i>
              Reports & Analytics
            </h1>
            <p className="text-sm md:text-base font-lora text-[#351E10]">AI-powered insights and comprehensive reporting</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm font-telegraf text-[#351E10]">IMMS</p>
            <div className={`text-xs sm:text-sm font-semibold ${aiStatus.available ? 'text-green-600' : 'text-orange-600'}`}>
              <i className={`fa-solid ${aiStatus.available ? 'fa-robot' : 'fa-exclamation-triangle'} mr-1`}></i>
              {aiStatus.available ? 'Active' : 'Limited'}
            </div>
            <p className="text-xs text-gray-500 mt-1">{aiStatus.provider}</p>
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#E5B80B'}}>
              <i className="fa-solid fa-users text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Total Visitors</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}>
                {analyticsData?.visitors || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#351E10'}}>
              <i className="fa-solid fa-landmark text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Cultural Objects</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                {analyticsData?.culturalObjects || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#E5B80B'}}>
              <i className="fa-solid fa-box-archive text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Archive Files</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}>
                {analyticsData?.archives || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#351E10'}}>
              <i className="fa-solid fa-calendar-week text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Total Events</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                {analyticsData?.events || 0}
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Report Modal */}
      {showReportModal && generatedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0.5 xs:p-1 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-full sm:max-w-5xl lg:max-w-7xl h-screen sm:h-[95vh] flex flex-col animate-slideUp overflow-y-auto sm:overflow-visible">
            {/* Clean Modal Header */}
            <div className="bg-gradient-to-r from-[#351E10] via-[#2A1A0D] to-[#1A0F08] text-white p-3 sm:p-4 shadow-lg sticky top-0 sm:static z-20 border-b border-white/10 sm:border-b-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#E5B80B] to-[#D4AF37] rounded-2xl flex items-center justify-center shadow-xl shrink-0">
                    <i className="fa-solid fa-chart-line text-white text-lg sm:text-2xl"></i>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white font-playfair">
                      {generatedReport.title || 'AI Generated Report'}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[#F9E7B5] text-xs sm:text-sm font-semibold">
                      <span className="px-2 py-1 rounded-full bg-white/15 backdrop-blur-sm flex items-center gap-1.5">
                        <i className="fa-solid fa-tag text-[10px] sm:text-xs"></i>
                        {generatedReport.report_type || 'AI Analysis'}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-white/15 backdrop-blur-sm flex items-center gap-1.5">
                        <i className="fa-solid fa-calendar text-[10px] sm:text-xs"></i>
                        {new Date(generatedReport.created_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side - Close Button */}
                <button
                  onClick={() => setShowReportModal(false)}
                  className="self-end sm:self-auto text-white/70 hover:text-white transition-all duration-300 p-2 sm:p-3 rounded-2xl hover:bg-white/10 backdrop-blur-sm hover:scale-110"
                  title="Close Modal"
                >
                  <i className="fa-solid fa-times text-2xl"></i>
                </button>
              </div>
            </div>

            {/* Modern Split Layout */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
              {/* Left Side - Report Details (Smaller) */}
              <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200/60 bg-white/70 lg:bg-white/50 backdrop-blur-sm">
                <div className="p-3 sm:p-6 h-full space-y-3 sm:space-y-4">
                  {/* Report Information Card - Compact Design */}
                  <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-[#E5B80B] via-[#F4D03F] to-[#D4AF37] rounded-xl flex items-center justify-center shadow-lg">
                        <i className="fa-solid fa-chart-line text-white text-base sm:text-xl"></i>
                    </div>
                      <div>
                        <h2 className="text-base sm:text-xl font-bold text-[#351E10] font-playfair mb-1">Report Details</h2>
                        <p className="text-xs sm:text-sm text-gray-600 leading-snug">Generated report information</p>
                      </div>
                  </div>
                  
                    <div className="space-y-3 sm:space-y-4">
                      <div className="group hover:scale-[1.02] transition-all duration-200">
                        <div className="flex flex-wrap justify-between items-center gap-3 py-3 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                          <span className="font-semibold text-gray-700 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shrink-0">
                              <i className="fa-solid fa-file-alt text-white text-[10px] sm:text-xs"></i>
                            </div>
                          Report Type:
                        </span>
                          <span className="text-[#351E10] font-bold bg-gradient-to-r from-[#E5B80B]/20 to-[#F4D03F]/20 px-3 py-1.5 rounded-lg text-xs sm:text-sm border border-[#E5B80B]/30">
                          {generatedReport.report_type || 'AI Analysis'}
                        </span>
                      </div>
                      </div>
                      <div className="group hover:scale-[1.02] transition-all duration-200">
                        <div className="flex flex-wrap justify-between items-center gap-3 py-3 px-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50 hover:border-green-300 hover:shadow-md transition-all duration-200">
                          <span className="font-semibold text-gray-700 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shrink-0">
                              <i className="fa-solid fa-calendar-check text-white text-[10px] sm:text-xs"></i>
                            </div>
                            Generated Date:
                        </span>
                          <span className="text-[#351E10] font-bold text-xs sm:text-sm">
                            {new Date(generatedReport.created_at || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                      {generatedReport.start_date && (
                        <div className="group hover:scale-[1.02] transition-all duration-200">
                          <div className="flex flex-wrap justify-between items-center gap-3 py-3 px-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200/50 hover:border-purple-300 hover:shadow-md transition-all duration-200">
                            <span className="font-semibold text-gray-700 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
                                <i className="fa-solid fa-calendar-range text-white text-[10px] sm:text-xs"></i>
                              </div>
                              Report Period:
                          </span>
                            <span className="text-[#351E10] font-bold text-xs sm:text-sm">
                            {generatedReport.end_date && generatedReport.end_date !== generatedReport.start_date
                              ? `${new Date(generatedReport.start_date).toLocaleDateString()} - ${new Date(generatedReport.end_date).toLocaleDateString()}`
                              : new Date(generatedReport.start_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                    </div>
                  </div>
                  
              {/* Right Side - File Preview (Larger) */}
              <div className="w-full lg:w-2/3 bg-white/90 lg:bg-white/30 backdrop-blur-sm">
                <div className="h-full flex flex-col">
                  {/* Preview Header - Enhanced Design */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-gradient-to-r from-[#351E10] via-[#2A1A0D] to-[#1A0F08] text-white shadow-lg sticky top-0 sm:static z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-white/20 to-white/10 rounded-lg flex items-center justify-center shadow-lg border border-white/20">
                        <i className="fa-solid fa-file-pdf text-white text-base sm:text-lg"></i>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold font-playfair mb-1">Document Preview</h3>
                        <p className="text-[11px] sm:text-xs text-white/90 font-medium flex items-center gap-2">
                          <i className="fa-solid fa-eye text-xs"></i>
                          PDF Report Viewer
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 px-3 sm:px-4 pb-3 sm:pb-4 bg-gradient-to-r from-[#351E10] via-[#2A1A0D] to-[#1A0F08] text-white">
                    <button
                      onClick={() => previewReport(generatedReport.id, 'pdf')}
                      className="bg-white/20 hover:bg-white/30 text-white px-2.5 sm:px-3 py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 backdrop-blur-sm hover:scale-105 border border-white/20"
                      title="Refresh Preview"
                    >
                      <i className="fa-solid fa-refresh text-[10px] sm:text-xs"></i>
                      Refresh
                    </button>
                    <button
                      onClick={() => {
                        if (previewData) {
                          console.log('🔗 Opening blob URL in new tab:', previewData);
                          window.open(previewData, '_blank');
                        }
                      }}
                      className="bg-blue-500/90 hover:bg-blue-500 text-white px-2.5 sm:px-3 py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 hover:scale-105 border border-blue-400/30"
                      title="Test Blob URL"
                    >
                      <i className="fa-solid fa-external-link text-[10px] sm:text-xs"></i>
                      Test
                    </button>
                    <button
                      onClick={() => downloadReport(generatedReport.id, 'pdf')}
                      className="bg-gradient-to-r from-[#E5B80B] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#F4D03F] text-white px-2.5 sm:px-3 py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 hover:scale-105 shadow-lg border border-yellow-400/30"
                      title="Download PDF"
                    >
                      <i className="fa-solid fa-download text-[10px] sm:text-xs"></i>
                      Download
                    </button>
                  </div>

                  {/* Preview Content - Enhanced Design */}
                  <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-3 sm:py-4 pt-4 sm:pt-6 bg-gradient-to-br from-gray-50 via-white to-blue-50">
                    {/* Debug info */}
                    {console.log('🔍 Preview Debug:', { previewData: !!previewData, previewFormat, previewLoading })}
                    {previewData ? (
                      <div className="h-full min-h-[360px] sm:min-h-0 border-2 border-gray-300/50 rounded-2xl overflow-hidden shadow-2xl bg-white hover:shadow-3xl transition-all duration-300">
                        <iframe
                          src={`${previewData}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                          className="w-full h-full border-0"
                          title="PDF Preview"
                          onLoad={() => {
                            console.log('✅ PDF iframe loaded successfully');
                            setPreviewLoading(false);
                          }}
                          onError={(e) => {
                            console.error('❌ PDF preview failed to load:', e);
                            setPreviewLoading(false);
                          }}
                    />
                  </div>
                    ) : previewLoading ? (
                      <div className="h-full min-h-[280px] flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 rounded-2xl border-2 border-dashed border-blue-400/40 shadow-inner">
                        <div className="text-center p-4">
                          <div className="w-28 h-28 bg-gradient-to-br from-blue-500/30 to-blue-600/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border-4 border-white animate-pulse">
                            <i className="fa-solid fa-spinner fa-spin text-blue-600 text-5xl"></i>
                </div>
                          <h3 className="text-3xl font-bold text-blue-800 mb-4 font-playfair">Loading PDF Preview...</h3>
                          <p className="text-blue-600 mb-8 text-base leading-relaxed max-w-lg">
                            Please wait while we load your report preview.
                          </p>
              </div>
            </div>
                    ) : (
                      <div className="h-full min-h-[280px] flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-2xl border-2 border-dashed border-[#E5B80B]/40 shadow-inner hover:shadow-lg transition-all duration-300">
                        <div className="text-center p-4">
                          <div className="w-28 h-28 bg-gradient-to-br from-[#E5B80B]/30 to-[#D4AF37]/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border-4 border-white">
                            <i className="fa-solid fa-file-pdf text-[#E5B80B] text-5xl"></i>
                          </div>
                          <h3 className="text-xl sm:text-3xl font-bold text-gray-800 mb-4 font-playfair">PDF Preview Ready</h3>
                          <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed max-w-lg">
                            Click the "Load PDF Preview" button below to view your report, or use the "Refresh" button above.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center">
                            <button
                              onClick={() => previewReport(generatedReport.id, 'pdf')}
                              className="bg-gradient-to-r from-[#E5B80B] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#F4D03F] text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 flex items-center gap-3 justify-center hover:scale-105 sm:hover:scale-110 shadow-xl hover:shadow-2xl border-2 border-white/20"
                            >
                              <i className="fa-solid fa-eye text-lg"></i>
                              Load PDF Preview
                            </button>
                            <button
                              onClick={() => downloadReport(generatedReport.id, 'pdf')}
                              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 flex items-center gap-3 justify-center hover:scale-105 sm:hover:scale-110 shadow-xl hover:shadow-2xl border-2 border-white/20"
                            >
                              <i className="fa-solid fa-download text-lg"></i>
                              Download PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal - Removed: PDF now loads directly in report details view */}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-exclamation-triangle text-red-600"></i>
            </div>
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-600 hover:text-red-800 transition-colors"
            >
              <i className="fa-solid fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* IMMS and Recent Reports Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Chat Section */}
        <div className="h-[600px]">
          <AIChat onGenerateReport={handleAIGenerateReport} />
        </div>

        {/* Recent Reports */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-[600px] flex flex-col">
          <div className="px-3 py-2 border-b border-gray-200 bg-gradient-to-r from-gray-100 to-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-history text-[#E5B80B]"></i>
                <h3 className="text-sm font-bold text-[#351E10] font-telegraf">Recent Reports</h3>
              </div>
              {totalReports > 0 && (
                <div className="text-xs text-gray-600 font-telegraf">
                  {startIndex + 1}-{Math.min(endIndex, totalReports)} of {totalReports}
                </div>
              )}
            </div>
          </div>
          <div className="p-3 flex-1 overflow-y-auto">
            {reports.length > 0 ? (
              <div className="space-y-2">
                {currentReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#E5B80B] rounded-lg flex items-center justify-center">
                        <i className="fa-solid fa-file-alt text-white text-xs"></i>
                      </div>
                      <div>
                        <h4 className="font-medium font-telegraf text-[#351E10] text-xs">{report.title}</h4>
                        <p className="text-xs text-gray-500 font-lora">
                          {report.report_type} • {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          // Clear previous preview data when switching reports
                          if (previewData) {
                            URL.revokeObjectURL(previewData);
                            setPreviewData(null);
                          }
                          setGeneratedReport(report);
                          setShowReportModal(true);
                          // Automatically load PDF preview after modal opens
                          setTimeout(() => {
                            previewReport(report.id, 'pdf');
                          }, 1000);
                        }}
                        className="text-blue-600 hover:text-blue-700 transition-colors p-1 rounded hover:bg-blue-50"
                        title="View Report"
                      >
                        <i className="fa-solid fa-eye text-xs"></i>
                      </button>
                      <button
                        onClick={() => {
                          console.log('🔍 Preview button clicked for report:', report);
                          // Clear previous preview data when switching reports
                          if (previewData) {
                            URL.revokeObjectURL(previewData);
                            setPreviewData(null);
                          }
                          setGeneratedReport(report); // Set the report being previewed
                          setShowReportModal(true); // Open report details modal
                          // Automatically load PDF preview in report details view
                          setTimeout(() => {
                            previewReport(report.id, 'pdf');
                          }, 500);
                        }}
                        className="text-green-600 hover:text-green-700 transition-colors p-1 rounded hover:bg-green-50"
                        title="Preview PDF"
                      >
                        <i className="fa-solid fa-file-pdf text-xs"></i>
                      </button>
                      {report.report_type === 'visitor_analytics' && (
                        <button
                          onClick={() => generateGraphReport(report.id)}
                          className="text-purple-600 hover:text-purple-700 transition-colors p-1 rounded hover:bg-purple-50"
                          title="Generate Graph Report"
                        >
                          <i className="fa-solid fa-chart-line text-xs"></i>
                        </button>
                      )}
                      <button
                        onClick={() => downloadReport(report.id, 'pdf')}
                        className="text-[#E5B80B] hover:text-[#D4AF37] transition-colors p-1 rounded hover:bg-yellow-50"
                        title="Download PDF"
                      >
                        <i className="fa-solid fa-download text-xs"></i>
                      </button>
                      <button
                        onClick={() => showDeleteConfirmation(report.id)}
                        className="text-red-600 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
                        title="Delete Report"
                      >
                        <i className="fa-solid fa-trash text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              <i className="fa-solid fa-file-alt text-2xl mb-2 text-gray-300"></i>
              <p className="text-xs">No reports yet</p>
              <p className="text-xs">Use IMMS to generate reports</p>
            </div>
          )}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 bg-gray-50 px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={goToPrevPage}
                    disabled={reportsPage === 1}
                    className={`p-1 rounded text-xs transition-colors ${
                      reportsPage === 1 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-[#E5B80B] hover:text-[#D4AF37] hover:bg-yellow-50'
                    }`}
                    title="Previous Page"
                  >
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (reportsPage <= 3) {
                        pageNum = i + 1;
                      } else if (reportsPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = reportsPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            reportsPage === pageNum
                              ? 'bg-[#E5B80B] text-white font-semibold'
                              : 'text-gray-600 hover:text-[#E5B80B] hover:bg-yellow-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={goToNextPage}
                    disabled={reportsPage === totalPages}
                    className={`p-1 rounded text-xs transition-colors ${
                      reportsPage === totalPages 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-[#E5B80B] hover:text-[#D4AF37] hover:bg-yellow-50'
                    }`}
                    title="Next Page"
                  >
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </div>
                
                <div className="text-xs text-gray-500">
                  Page {reportsPage} of {totalPages}
                </div>
              </div>
            </div>
          )}

          {/* Delete All Reports Button */}
          {reports.length > 0 && (
            <div className="border-t border-gray-200 bg-red-50 px-3 py-3">
              <div className="flex items-center justify-center">
                <button
                  onClick={() => setConfirmationModal({
                    show: true,
                    title: 'Delete All Reports',
                    message: `Are you sure you want to delete ALL ${totalReports} reports? This action cannot be undone and will permanently remove all reports from the system.`,
                    onConfirm: () => deleteAllReports(),
                    reportId: 'all'
                  })}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 hover:scale-105 shadow-lg"
                  title="Delete All Reports"
                >
                  <i className="fa-solid fa-trash-can text-sm"></i>
                  Delete All Reports ({totalReports})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Custom Notification */}
      {notification.show && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100 opacity-100 border-l-4" style={{borderLeftColor: notification.type === 'success' ? '#10B981' : notification.type === 'error' ? '#EF4444' : '#3B82F6'}}>
            {/* Notification Icon */}
            <div className="flex justify-center pt-8 pb-4">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: notification.type === 'success' 
                    ? 'linear-gradient(135deg, #10B981, #059669)'
                    : notification.type === 'error'
                    ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                    : 'linear-gradient(135deg, #3B82F6, #2563EB)'
                }}
              >
                <i className={`fa-solid ${notification.type === 'success' ? 'fa-check' : notification.type === 'error' ? 'fa-times' : 'fa-info'} text-3xl text-white`}></i>
              </div>
            </div>
            
            {/* Notification Message */}
            <div className="px-8 pb-8 text-center">
              <h3 className="text-2xl font-bold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                {notification.title}
              </h3>
              <p className="text-gray-600 text-lg mb-2" style={{fontFamily: 'Telegraf, sans-serif'}}>
                {notification.message}
              </p>
              {notification.description && (
                <p className="text-sm text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  {notification.description}
                </p>
              )}
            </div>
            
            {/* Close Button */}
            <div className="px-8 pb-8">
              <button
                onClick={() => setNotification({...notification, show: false})}
                className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                style={{
                  background: notification.type === 'success' 
                    ? 'linear-gradient(135deg, #10B981, #059669)'
                    : notification.type === 'error'
                    ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                    : 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  color: 'white',
                  fontFamily: 'Telegraf, sans-serif'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Custom Confirmation Modal */}
      {confirmationModal.show && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100 opacity-100 border-l-4 border-l-red-500">
            {/* Confirmation Icon */}
            <div className="flex justify-center pt-8 pb-4">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)'
                }}
              >
                <i className="fa-solid fa-exclamation-triangle text-3xl text-white"></i>
              </div>
            </div>
            
            {/* Confirmation Message */}
            <div className="px-8 pb-8 text-center">
              <h3 className="text-2xl font-bold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                {confirmationModal.title}
              </h3>
              <p className="text-gray-600 text-lg mb-2" style={{fontFamily: 'Telegraf, sans-serif'}}>
                {confirmationModal.message}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="px-8 pb-8 flex gap-3">
              <button
                onClick={() => setConfirmationModal({
                  show: false,
                  title: '',
                  message: '',
                  onConfirm: null,
                  reportId: null
                })}
                className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                style={{fontFamily: 'Telegraf, sans-serif'}}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmationModal.onConfirm) {
                    confirmationModal.onConfirm();
                  }
                }}
                className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                  color: 'white',
                  fontFamily: 'Telegraf, sans-serif'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports; 