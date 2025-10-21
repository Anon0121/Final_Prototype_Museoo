import React, { useState, useEffect } from "react";
import api from "../../config/api";

const Donation = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddRequestModal, setShowAddRequestModal] = useState(false);
  const [approving, setApproving] = useState(null);
  const [previewLetter, setPreviewLetter] = useState(null);
  const [showEmailTest, setShowEmailTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  
  // Enhanced filtering and organization
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // all, request_meeting, scheduled_meeting, finished_meeting, city_hall, completed
  const [viewMode, setViewMode] = useState("table"); // table or cards
  const [sortBy, setSortBy] = useState("date"); // date, name, status
  const [sortOrder, setSortOrder] = useState("desc"); // asc or desc

  const [formData, setFormData] = useState({
    donor_name: "",
    donor_email: "",
    donor_contact: "",
    type: "monetary",
    preferred_visit_date: "",
    preferred_visit_time: "",
    notes: "",
    amount: "",
    payment_proof: null,
    item_description: "",
    estimated_value: "",
    condition: "",
    loan_start_date: "",
    loan_end_date: "",
    legal_documents: null,
  });

  const [formLoading, setFormLoading] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showCityHallModal, setShowCityHallModal] = useState(false);
  const [showFinalApproveModal, setShowFinalApproveModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStageAdvancementModal, setShowStageAdvancementModal] = useState(false);
  const [stageAdvancementNotes, setStageAdvancementNotes] = useState('');
  const [donationToAdvance, setDonationToAdvance] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    donor: true,
    donation: true,
    timeline: true,
    attachments: true,
    additional: true
  });
  const [internalNotes, setInternalNotes] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [meetingData, setMeetingData] = useState({
    scheduled_date: "",
    scheduled_time: "",
    location: "Museum",
    staff_member: "",
    meeting_notes: "",
    suggested_alternative_dates: []
  });
  const [cityHallData, setCityHallData] = useState({
    submission_documents: "",
    city_hall_reference: "",
    notes: "",
    submission_files: []
  });
  const [isSubmittingToCityHall, setIsSubmittingToCityHall] = useState(false);
  const [finalApproveData, setFinalApproveData] = useState({
    notes: "",
    museum_admin_name: ""
  });

  // Notification state
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
    donationId: null,
    donorName: ''
  });

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      console.log('🔄 Fetching donations...');
      const response = await api.get('/api/donations');
      console.log('📊 API Response:', response.data);
      setDonations(response.data.donations || []);
      console.log('✅ Donations loaded:', response.data.donations?.length || 0);
    } catch (error) {
      console.error('❌ Error fetching donations:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for enhanced details modal
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePrintDetails = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    try {
      // This would integrate with a PDF generation service
      console.log('Exporting PDF for donation:', selectedDonation.id);
      // Implementation would go here
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const handleAddInternalNote = async () => {
    if (!internalNotes.trim()) return;
    
    setAddingNote(true);
    try {
      // This would save the internal note to the database
      console.log('Adding internal note:', internalNotes);
      setInternalNotes('');
      // Implementation would go here
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setAddingNote(false);
    }
  };

  // Filter donations based on active tab and search
  const filteredDonations = donations.filter(donation => {
    const matchesSearch = searchTerm === "" || 
      donation.donor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.donor_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by active tab
    let matchesTab = false;
    switch (activeTab) {
      case "all":
        matchesTab = true;
        break;
      case "request_meeting":
        matchesTab = donation.processing_stage === "request_meeting";
        break;
      case "scheduled_meeting":
        matchesTab = donation.processing_stage === "schedule_meeting";
        break;
      case "finished_meeting":
        matchesTab = donation.processing_stage === "finished_meeting";
        break;
      case "city_hall":
        matchesTab = donation.processing_stage === "city_hall";
        break;
      case "completed":
        matchesTab = donation.processing_stage === "complete";
        break;
      default:
        matchesTab = true;
    }
    
    return matchesSearch && matchesTab;
  }).sort((a, b) => new Date(b.request_date || b.created_at) - new Date(a.request_date || a.created_at));

  const handleApprove = async (donationId) => {
    setApproving(donationId);
    try {
      const response = await api.post(`/api/donations/${donationId}/approve`);
      if (response.data.success) {
        if (response.data.emailError) {
          setNotification({
            show: true,
            type: 'success',
            title: 'Donation Approved Successfully!',
            message: 'Donation has been approved and is now in the workflow.',
            description: `Email notification issue: ${response.data.emailError}. Please check email configuration.`
          });
        } else {
          setNotification({
            show: true,
            type: 'success',
            title: 'Donation Approved Successfully!',
            message: 'Donation has been approved and appreciation letter sent to donor.',
            description: 'The donor has been notified via email with a beautiful appreciation letter.'
          });
        }
        fetchDonations(); // Refresh the list
      }
    } catch (error) {
      console.error('Error approving donation:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Approval Failed',
        message: 'There was an error approving the donation.',
        description: error.response?.data?.error || error.message || 'Unknown error occurred'
      });
    } finally {
      setApproving(null);
    }
  };

  const handleDelete = async (donationId, donorName) => {
    console.log('🔄 handleDelete called for donation ID:', donationId, 'from donor:', donorName);
    setConfirmationModal({
      show: true,
      title: 'Delete Donation',
      message: `Are you sure you want to delete the donation from "${donorName}"?`,
      description: 'This action cannot be undone and will permanently remove:\n• All donation details\n• Related documents\n• Workflow history\n• Acknowledgments\n• Requirements\n• Visitor submission data\n• Public display settings',
      donationId: donationId,
      donorName: donorName,
      onConfirm: () => executeDelete(donationId, donorName)
    });
  };

  const executeDelete = async (donationId, donorName) => {
    console.log('🔄 executeDelete called for donation ID:', donationId, 'from donor:', donorName);
    
    try {
      console.log('📤 Sending delete request...');
      const response = await api.delete(`/api/donations/${donationId}`);
      console.log('📥 Delete response:', response.data);
      if (response.data.success) {
        setNotification({
          show: true,
          type: 'success',
          title: 'Donation Deleted Successfully!',
          message: `Donation from ${donorName} has been permanently removed.`,
          description: 'All related data, documents, and workflow history have been deleted.'
        });
        fetchDonations(); // Refresh the list
      } else {
        setNotification({
          show: true,
          type: 'error',
          title: 'Deletion Failed',
          message: 'Failed to delete the donation.',
          description: response.data.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('❌ Error deleting donation:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Deletion Failed',
        message: 'There was an error deleting the donation.',
        description: error.response?.data?.error || error.message || 'Unknown error occurred'
      });
    }
  };

  const handleReject = async (donationId) => {
    console.log('🔄 handleReject called for donation ID:', donationId);
    const rejectionReason = window.prompt(
      'Please provide a reason for rejecting this donation request (optional):\n\nThis will be included in the email notification to the donor.',
      'Unable to schedule meeting at this time'
    );
    
    if (rejectionReason === null) return; // User cancelled
    
    setConfirmationModal({
      show: true,
      title: 'Reject Donation',
      message: 'Are you sure you want to reject this donation?',
      description: 'This will mark the donation as rejected and send an email notification to the donor.',
      donationId: donationId,
      donorName: 'donor',
      onConfirm: () => executeReject(donationId, rejectionReason)
    });
  };

  const executeReject = async (donationId, rejectionReason) => {
    
    try {
      console.log('📤 Sending reject request...');
      const response = await api.post(`/api/donations/${donationId}/reject`, {
        rejection_reason: rejectionReason
      });
      console.log('📥 Reject response:', response.data);
      if (response.data.success) {
        if (response.data.emailError) {
          setNotification({
            show: true,
            type: 'success',
            title: 'Donation Rejected Successfully!',
            message: 'Donation has been rejected and marked as declined.',
            description: `Email notification issue: ${response.data.emailError}. Please check email configuration.`
          });
        } else {
          setNotification({
            show: true,
            type: 'success',
            title: 'Donation Rejected Successfully!',
            message: 'Donation has been rejected and donor notified.',
            description: 'The donor has been notified via email about the rejection.'
          });
        }
        fetchDonations(); // Refresh the list
      }
    } catch (error) {
      console.error('❌ Error rejecting donation:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Rejection Failed',
        message: 'There was an error rejecting the donation.',
        description: error.response?.data?.error || error.message || 'Unknown error occurred'
      });
    }
  };

  const previewAppreciationLetter = (donation) => {
         const donationTypeLabels = {
       monetary: 'Monetary Donation',
       artifact: 'Artifact/Historical Item',
       loan: 'Loan (Temporary)'
     };

    const formatDonationDetails = () => {
      let details = [];
      
      if (donation.type === 'monetary' && donation.amount) {
        details.push(`Amount: ₱${parseFloat(donation.amount).toLocaleString()}`);
        details.push(`Payment Method: Cash (with proof of payment)`);
      }
      
      if (donation.item_description) {
        details.push(`Item Description: ${donation.item_description}`);
      }
      
          if (donation.estimated_value) {
      details.push(`Estimated Value: ₱${parseFloat(donation.estimated_value).toLocaleString()}`);
    }

         if (donation.type === 'artifact') {
       details.push(`Legal Documentation: Ownership certificates and provenance documents provided`);
     }
    
    return details;
    };

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: #ffffff; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; border-bottom: 3px solid #8B6B21; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="font-size: 24px; font-weight: bold; color: #8B6B21; margin-bottom: 10px;">🏛️ City Museum of Cagayan de Oro</div>
            <div style="color: #666; font-size: 14px;">Preserving Our Cultural Heritage</div>
          </div>
          
          <div style="text-align: right; color: #666; margin-bottom: 30px; font-size: 14px;">
            ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          
          <div style="font-size: 18px; margin-bottom: 20px; color: #2e2b41;">
            Dear ${donation.donor_name},
          </div>
          
          <div style="margin-bottom: 30px; text-align: justify;">
            <p>On behalf of the entire team at the City Museum of Cagayan de Oro, I am delighted to inform you that your generous donation has been approved and accepted with great appreciation.</p>
            
            <p>Your contribution plays a vital role in our mission to preserve and showcase the rich cultural heritage of Cagayan de Oro. Your support enables us to continue our work in educating the community and future generations about our city's history and cultural significance.</p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #8B6B21; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3 style="color: #8B6B21; margin-top: 0; margin-bottom: 15px;">📋 Donation Details</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Type:</strong> ${donationTypeLabels[donation.type]}</li>
                <li><strong>Date Submitted:</strong> ${new Date(donation.request_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</li>
                ${formatDonationDetails().map(detail => `<li><strong>${detail.split(':')[0]}:</strong> ${detail.split(':')[1]}</li>`).join('')}
              </ul>
            </div>
            
            <p>We are truly grateful for your generosity and commitment to preserving our cultural heritage. Your donation will be carefully documented and utilized to enhance our museum's collections and educational programs.</p>
            
            <p>Our team will contact you soon to arrange the collection or transfer of your donation, and to discuss any specific requirements or arrangements you may have.</p>
          </div>
          
          <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
            <p>Once again, thank you for your invaluable support.</p>
            <p style="font-weight: bold; color: #8B6B21;">Dr. Maria Santos</p>
            <p style="color: #666; font-size: 14px;">Museum Director</p>
            <p style="color: #666; font-size: 14px;">City Museum of Cagayan de Oro</p>
          </div>
          
          <div style="background-color: #8B6B21; color: white; padding: 15px; border-radius: 5px; margin-top: 20px; text-align: center;">
            <h4 style="margin: 0 0 10px 0;">📞 Contact Information</h4>
            <p style="margin: 5px 0; font-size: 14px;">📍 Address: City Hall Complex, Cagayan de Oro City</p>
            <p style="margin: 5px 0; font-size: 14px;">📧 Email: museum@cagayandeoro.gov.ph</p>
            <p style="margin: 5px 0; font-size: 14px;">📱 Phone: (088) 123-4567</p>
            <p style="margin: 5px 0; font-size: 14px;">🌐 Website: www.cagayandeoromuseum.gov.ph</p>
          </div>
        </div>
      </div>
    `;

    setPreviewLetter({
      donor: donation.donor_name,
      email: donation.donor_email,
      content: htmlContent
    });
  };

  const closePreview = () => {
    setPreviewLetter(null);
  };

  const downloadAppreciationLetter = async (donationId, donorName) => {
    try {
      const response = await api.get(`/api/donations/${donationId}/appreciation-letter`, {
        responseType: 'blob'
      });
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `appreciation-letter-${donorName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setNotification({
        show: true,
        type: 'success',
        title: 'Download Successful!',
        message: 'Appreciation letter downloaded successfully!',
        description: 'The appreciation letter has been saved to your downloads folder.'
      });
    } catch (error) {
      console.error('Error downloading appreciation letter:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Download Failed',
        message: 'Error downloading appreciation letter',
        description: 'There was an error generating or downloading the appreciation letter. Please try again.'
      });
    }
  };

  const testEmailFunction = async () => {
    if (!testEmail) {
      setNotification({
        show: true,
        type: 'warning',
        title: 'Email Required',
        message: 'Please enter a test email address',
        description: 'You need to provide an email address to send the test email.'
      });
      return;
    }

    setTestingEmail(true);
    try {
      const response = await api.post('/api/donations/test-email', {
        testEmail: testEmail
      });
      
      if (response.data.success) {
        setNotification({
          show: true,
          type: 'success',
          title: 'Test Email Sent!',
          message: 'Test email sent successfully!',
          description: 'Please check your inbox for the test email.'
        });
        setShowEmailTest(false);
        setTestEmail('');
      } else {
        setNotification({
          show: true,
          type: 'error',
          title: 'Test Email Failed',
          message: 'Test email failed to send',
          description: response.data.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Test email error:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Test Email Error',
        message: 'Error sending test email',
        description: 'There was an error sending the test email. Please check the console for details.'
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        payment_proof: file
      }));
    }
  };

  const handleLegalDocumentsChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        legal_documents: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'payment_proof' && formData[key]) {
          formDataToSend.append('payment_proof', formData[key]);
        } else if (key === 'legal_documents' && formData[key]) {
          formDataToSend.append('legal_documents', formData[key]);
        } else if (key !== 'payment_proof' && key !== 'legal_documents') {
          formDataToSend.append(key, formData[key]);
        }
      });

      const res = await api.post("/api/donations/request", formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (res.data.success) {
        setNotification({
          show: true,
          type: 'success',
          title: 'Donation Request Submitted!',
          message: 'Donation request submitted successfully!',
          description: 'Our staff will review your request and contact you to schedule a meeting.'
        });
                 setFormData({
           donor_name: "",
           donor_email: "",
           donor_contact: "",
           type: "monetary",
          preferred_visit_date: "",
          preferred_visit_time: "",
           notes: "",
           amount: "",
           payment_proof: null,
           item_description: "",
           estimated_value: "",
           condition: "",
           loan_start_date: "",
           loan_end_date: "",
           legal_documents: null,
         });
        setShowAddRequestModal(false);
        fetchDonations();
      } else {
        setNotification({
          show: true,
          type: 'error',
          title: 'Submission Failed',
          message: 'Failed to submit donation request',
          description: 'There was an error submitting your donation request. Please try again.'
        });
      }
    } catch (err) {
      console.error("Error saving donation request:", err);
      setNotification({
        show: true,
        type: 'error',
        title: 'Submission Error',
        message: 'Error saving donation request',
        description: 'There was an error saving your donation request. Please try again.'
      });
    }
    setFormLoading(false);
  };

  // New functions for donation process workflow
  const handleScheduleMeeting = async () => {
    try {
      // Validate required fields
      if (!meetingData.scheduled_date || !meetingData.scheduled_time || !meetingData.location) {
        setNotification({
          show: true,
          type: 'error',
          title: 'Missing Required Information',
          message: 'Please fill in all required fields (Date, Time, Location) before scheduling the meeting.',
          description: 'All required fields must be completed to schedule a meeting.'
        });
        return;
      }

      // Check authentication first
      console.log('🔐 Checking authentication...');
      const authCheck = await api.get('/api/user');
      console.log('🔐 Auth check result:', authCheck.data);
      
      if (!authCheck.data.success) {
        console.error('❌ User not authenticated');
        setNotification({
          show: true,
          type: 'error',
          title: 'Authentication Error',
          message: 'You are not logged in. Please refresh the page and try again.',
          description: 'Your session may have expired.'
        });
        return;
      }
      
      // Filter out empty alternative dates
      const filteredAlternativeDates = meetingData.suggested_alternative_dates.filter(date => date.trim() !== '');
      
      console.log('📤 Sending meeting schedule request...');
      console.log('📋 Meeting data:', meetingData);
      console.log('📋 Donation ID:', selectedDonation.id);
      
      const response = await api.post(`/api/donations/${selectedDonation.id}/schedule-meeting`, {
        ...meetingData,
        suggested_alternative_dates: filteredAlternativeDates
      });
      
      console.log('📥 Meeting schedule response:', response.data);
      
      if (response.data.success) {
        console.log('✅ Meeting scheduled successfully, setting notification...');
        if (response.data.emailError) {
          setNotification({
            show: true,
            type: 'success',
            title: 'Meeting Scheduled Successfully!',
            message: 'Meeting has been scheduled and donor will be contacted.',
            description: `Email notification issue: ${response.data.emailError}. Please check email configuration.`
          });
        } else {
          console.log('🔔 Setting success notification...');
          setNotification({
            show: true,
            type: 'success',
            title: 'Meeting Scheduled Successfully!',
            message: 'Meeting has been scheduled and donor notified via email.',
            description: 'The donor has been notified about the meeting details and alternative dates.'
          });
          console.log('✅ Success notification set');
        }
        console.log('✅ Notification set, closing modal...');
        setShowMeetingModal(false);
        setSelectedDonation(null);
        setMeetingData({
          scheduled_date: "",
          scheduled_time: "",
          location: "",
          staff_member: "",
          meeting_notes: "",
          suggested_alternative_dates: []
        });
        console.log('✅ Fetching donations...');
        fetchDonations();
        console.log('✅ All operations completed');
      }
    } catch (error) {
      console.error('❌ Error scheduling meeting:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      let errorMessage = 'Unknown error occurred';
      let errorDescription = 'Please try again later.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication Error';
        errorDescription = 'Your session has expired. Please refresh the page and log in again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Donation Not Found';
        errorDescription = 'The donation you are trying to schedule a meeting for no longer exists.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        errorDescription = error.response.data.message || 'Please check your input and try again.';
      } else if (error.message) {
        errorMessage = error.message;
        errorDescription = 'Please check your internet connection and try again.';
      }
      
      setNotification({
        show: true,
        type: 'error',
        title: 'Meeting Scheduling Failed',
        message: errorMessage,
        description: errorDescription
      });
    }
  };

  const handleCompleteMeeting = async (donationId) => {
    console.log('🔄 handleCompleteMeeting called for donation ID:', donationId);
    setConfirmationModal({
      show: true,
      title: 'Complete Meeting',
      message: 'Was the donation handover completed during this meeting?',
      description: 'Please confirm if the donation handover was completed successfully during the meeting.',
      donationId: donationId,
      donorName: 'donor',
      onConfirm: () => executeCompleteMeeting(donationId, true),
      onCancel: () => executeCompleteMeeting(donationId, false)
    });
  };

  // Open stage advancement modal
  const handleAdvanceStage = (donationId) => {
    setDonationToAdvance(donationId);
    setStageAdvancementNotes('');
    setShowStageAdvancementModal(true);
  };

  // Confirm stage advancement
  const confirmAdvanceStage = async () => {
    if (!donationToAdvance) return;
    
    try {
      console.log('🔄 Advancing donation stage for ID:', donationToAdvance);
      
      const response = await api.post(`/api/donations/${donationToAdvance}/advance-stage`, {
        notes: stageAdvancementNotes || ''
      });
      
      console.log('📥 Stage advancement response:', response.data);
      
      if (response.data.success) {
        setNotification({
          show: true,
          type: 'success',
          title: 'Stage Advanced Successfully!',
          message: `Donation has been advanced to ${response.data.newStage.replace('_', ' ')}`,
          description: 'The donor has been notified of the status update.'
        });
        
        // Refresh donations list
        fetchDonations();
        
        // Close modal
        setShowStageAdvancementModal(false);
        setDonationToAdvance(null);
        setStageAdvancementNotes('');
      }
    } catch (error) {
      console.error('❌ Error advancing stage:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Stage Advancement Failed',
        message: error.response?.data?.error || 'Failed to advance donation stage',
        description: 'Please try again or contact support if the issue persists.'
      });
    }
  };

  const executeCompleteMeeting = async (donationId, handoverCompleted) => {
    console.log('🔄 executeCompleteMeeting called for donation ID:', donationId);
    console.log('📋 Handover completed:', handoverCompleted);
    
    try {
      console.log('📤 Sending complete meeting request...');
      const response = await api.post(`/api/donations/${donationId}/complete-meeting`, {
        meeting_notes: 'Meeting completed'
      });
      console.log('📥 Complete meeting response:', response.data);
      
      if (response.data.success) {
        if (response.data.emailError) {
          setNotification({
            show: true,
            type: 'success',
            title: 'Meeting Completed Successfully!',
            message: 'Meeting has been marked as completed.',
            description: handoverCompleted 
              ? `Donation handover was completed during the meeting. The donation is now ready for city hall processing. However, there was an issue sending the update email to the donor: ${response.data.emailError}. Please check email configuration.`
              : `Meeting completed but donation handover is pending. Follow up may be required. However, there was an issue sending the update email to the donor: ${response.data.emailError}. Please check email configuration.`
          });
        } else {
          setNotification({
            show: true,
            type: 'success',
            title: 'Meeting Completed Successfully!',
            message: 'Meeting has been marked as completed and donor notified.',
            description: handoverCompleted 
              ? 'Donation handover was completed during the meeting. The donor has been notified via email about the handover completion and next steps. The donation is now ready for city hall processing.'
              : 'Meeting completed but donation handover is pending. The donor has been notified via email about the meeting completion. Follow up may be required.'
          });
        }
        fetchDonations();
      } else {
        setNotification({
          show: true,
          type: 'error',
          title: 'Meeting Completion Failed',
          message: 'Failed to mark the meeting as completed.',
          description: response.data.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('❌ Error completing meeting:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Meeting Completion Failed',
        message: 'There was an error completing the meeting.',
        description: error.response?.data?.error || error.message || 'Unknown error occurred'
      });
    }
  };

  const handleSubmitToCityHall = async () => {
    setIsSubmittingToCityHall(true);
    try {
      // Prepare FormData for file uploads
      const formDataToSend = new FormData();
      
      // Add basic data
      formDataToSend.append('submission_documents', cityHallData.submission_documents);
      formDataToSend.append('city_hall_reference', cityHallData.city_hall_reference);
      formDataToSend.append('notes', cityHallData.notes);
      
      // Add files
      cityHallData.submission_files.forEach((file, index) => {
        formDataToSend.append('submission_files', file);
      });

      const response = await api.post(`/api/donations/${selectedDonation.id}/submit-city-hall`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        setNotification({
          show: true,
          type: 'success',
          title: 'Donation Submitted to City Hall!',
          message: 'Donation has been successfully submitted to city hall for processing.',
          description: 'The donation is now in the city hall review process. You will be notified when approval is received.'
        });
        setShowCityHallModal(false);
        setSelectedDonation(null);
        // Reset form data
        setCityHallData({
          submission_documents: "",
          city_hall_reference: "",
          notes: "",
          submission_files: []
        });
        fetchDonations();
      }
    } catch (error) {
      console.error('Error submitting to city hall:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'City Hall Submission Failed',
        message: 'There was an error submitting the donation to city hall.',
        description: error.response?.data?.error || error.message || 'Unknown error occurred'
      });
    } finally {
      setIsSubmittingToCityHall(false);
    }
  };

  const handleCityHallApprove = async (donationId) => {
    try {
      const response = await api.post(`/api/donations/${donationId}/city-hall-approve`, {
        notes: 'City hall approval received'
      });
      if (response.data.success) {
        setNotification({
          show: true,
          type: 'success',
          title: 'City Hall Approval Recorded!',
          message: 'Donation has been marked as city hall approved.',
          description: 'The donation is now ready for final approval and completion.'
        });
        fetchDonations();
      }
    } catch (error) {
      console.error('Error recording city hall approval:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'City Hall Approval Failed',
        message: 'There was an error recording the city hall approval.',
        description: error.response?.data?.error || error.message || 'Unknown error occurred'
      });
    }
  };

  // File upload handlers for city hall submission
  const handleCityHallFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setNotification({
        show: true,
        type: 'warning',
        title: 'Invalid File Type',
        message: 'Please upload only valid files',
        description: 'Please upload only images (JPG, PNG, GIF) or PDF files under 10MB each.'
      });
      return;
    }

    setCityHallData(prev => ({
      ...prev,
      submission_files: [...prev.submission_files, ...validFiles]
    }));
  };

  const removeCityHallFile = (index) => {
    setCityHallData(prev => ({
      ...prev,
      submission_files: prev.submission_files.filter((_, i) => i !== index)
    }));
  };

  const handleFinalApprove = async () => {
    try {
      const response = await api.post(`/api/donations/${selectedDonation.id}/final-approve`, finalApproveData);
      if (response.data.success) {
        if (response.data.emailError) {
          setNotification({
            show: true,
            type: 'success',
            title: 'Donation Finally Approved!',
            message: 'Donation has been completed and marked as final approved.',
            description: `Email notification issue: ${response.data.emailError}. Please check email configuration.`
          });
        } else {
          setNotification({
            show: true,
            type: 'success',
            title: 'Donation Finally Approved!',
            message: 'Donation has been completed and gratitude email sent to donor.',
            description: 'The donor has been notified via email with a gratitude message.'
          });
        }
        setShowFinalApproveModal(false);
        setSelectedDonation(null);
        fetchDonations();
      }
    } catch (error) {
      console.error('Error in final approval:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Final Approval Failed',
        message: 'There was an error completing the final approval.',
        description: error.response?.data?.error || error.message || 'Unknown error occurred'
      });
    }
  };

  const renderMonetaryFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#2e2b41] font-semibold mb-2">
            Amount (₱) *
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
            placeholder="Enter amount"
            required
          />
        </div>
        <div>
          <label className="block text-[#2e2b41] font-semibold mb-2">
            Payment Proof (Image) *
          </label>
          <input
            type="file"
            name="payment_proof"
            onChange={handleFileChange}
            accept="image/*"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Upload a photo of the cash payment as proof
          </p>
          {formData.payment_proof && (
            <div className="mt-2">
              <p className="text-sm text-green-600">
                ✓ File selected: {formData.payment_proof.name}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderArtifactFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#2e2b41] font-semibold mb-2">
            Item Description *
          </label>
          <textarea
            name="item_description"
            value={formData.item_description}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
            rows="3"
            placeholder="Describe the artifact in detail"
            required
          />
        </div>
        <div>
          <label className="block text-[#2e2b41] font-semibold mb-2">
            Estimated Value (₱)
          </label>
          <input
            type="number"
            name="estimated_value"
            value={formData.estimated_value}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
            placeholder="Estimated value"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#2e2b41] font-semibold mb-2">
            Condition
          </label>
          <select
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
          >
            <option value="">Select condition</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
            <option value="needs_restoration">Needs Restoration</option>
          </select>
        </div>
        <div>
          <label className="block text-[#2e2b41] font-semibold mb-2">
            Legal Documents (PDF/Image) *
          </label>
          <input
            type="file"
            name="legal_documents"
            onChange={handleLegalDocumentsChange}
            accept=".pdf,image/*"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Upload ownership certificates, provenance documents, or legal papers
          </p>
          {formData.legal_documents && (
            <div className="mt-2">
              <p className="text-sm text-green-600">
                ✓ File selected: {formData.legal_documents.name}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderLoanFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#2e2b41] font-semibold mb-2">
            Loan Start Date *
          </label>
          <input
            type="date"
            name="loan_start_date"
            value={formData.loan_start_date}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
            required
          />
        </div>
        <div>
          <label className="block text-[#2e2b41] font-semibold mb-2">
            Loan End Date *
          </label>
          <input
            type="date"
            name="loan_end_date"
            value={formData.loan_end_date}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
            required
          />
        </div>
      </div>
      {renderArtifactFields()}
    </>
  );

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      approved: "bg-green-100 text-green-800 border border-green-200",
      rejected: "bg-red-100 text-red-800 border border-red-200"
    };
    return badges[status] || "bg-gray-100 text-gray-800 border border-gray-200";
  };

  const getProcessStatusBadge = (stage) => {
    const badges = {
      request_meeting: "bg-blue-100 text-blue-800 border border-blue-200",
      schedule_meeting: "bg-purple-100 text-purple-800 border border-purple-200",
      finished_meeting: "bg-indigo-100 text-indigo-800 border border-indigo-200",
      city_hall: "bg-orange-100 text-orange-800 border border-orange-200",
      complete: "bg-green-100 text-green-800 border border-green-200",
      rejected: "bg-red-100 text-red-800 border border-red-200"
    };
    return badges[stage] || "bg-gray-100 text-gray-800 border border-gray-200";
  };

     const getTypeBadge = (type) => {
     const badges = {
       monetary: "bg-blue-100 text-blue-800 border border-blue-200",
       artifact: "bg-purple-100 text-purple-800 border border-purple-200",
       loan: "bg-orange-100 text-orange-800 border border-orange-200"
     };
     return badges[type] || "bg-gray-100 text-gray-800 border border-gray-200";
   };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-[#2e2b41]">
          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
          Loading donations...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">

      {/* Add Donation Request Modal */}
      {showAddRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Modal Header - Museum Branding */}
            <div className="bg-gradient-to-r from-[#351E10] via-[#2A1A0D] to-[#1A0F08] px-8 py-6 text-white relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E5B80B]/10 to-transparent"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                    <i className="fa-solid fa-plus-circle text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      Submit Donation Request
                    </h3>
                    <p className="text-[#E5B80B] text-sm mt-1" style={{fontFamily: 'Lora, serif'}}>
                      Add a new donation request to the system
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddRequestModal(false);
                      setShowForm(false);
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2"
                    title="Close Modal"
                  >
                    <i className="fa-solid fa-times"></i>
                    <span>Close</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowAddRequestModal(false);
                  }}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-200"
                >
                  <i className="fa-solid fa-times text-white"></i>
                </button>
              </div>
            </div>
            
            {/* Form Content */}
            <div className="p-8 flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Donor Information */}
            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-xl font-semibold text-[#2e2b41] mb-4">
                <i className="fa-solid fa-user mr-2"></i>
                Donor Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="donor_name"
                    value={formData.donor_name}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                    placeholder="Enter donor's full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="donor_email"
                    value={formData.donor_email}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                    placeholder="Enter donor's email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="donor_contact"
                    value={formData.donor_contact}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                    placeholder="Enter contact number"
                  />
                </div>
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">
                    Preferred Visit Date
                  </label>
                  <input
                    type="date"
                    name="preferred_visit_date"
                    value={formData.preferred_visit_date}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  />
                </div>
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">
                    Preferred Visit Time
                  </label>
                  <input
                    type="time"
                    name="preferred_visit_time"
                    value={formData.preferred_visit_time}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  />
                </div>
              </div>
            </div>

            {/* Donation Type */}
            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-xl font-semibold text-[#2e2b41] mb-4">
                <i className="fa-solid fa-gift mr-2"></i>
                Donation Details
              </h4>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Donation Type *
                </label>
                                 <select
                   name="type"
                   value={formData.type}
                   onChange={handleChange}
                   className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                   required
                 >
                   <option value="monetary">Monetary Donation</option>
                   <option value="artifact">Artifact/Historical Item</option>
                   <option value="loan">Loan (Temporary)</option>
                 </select>
              </div>
                             {/* Conditional Fields Based on Type */}
               <div className="mt-6">
                 {formData.type === 'monetary' && renderMonetaryFields()}
                 {formData.type === 'artifact' && renderArtifactFields()}
                 {formData.type === 'loan' && renderLoanFields()}
               </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-[#2e2b41] font-semibold mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                rows="4"
                placeholder="Any additional information about the donation..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="bg-[#AB8841] hover:bg-[#8B6B21] text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-md"
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-save mr-2"></i>
                    Submit Request
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddRequestModal(false);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-md"
              >
                <i className="fa-solid fa-times mr-2"></i>
                Cancel
              </button>
            </div>
          </form>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <i className="fa-solid fa-info-circle mr-2"></i>
                  All fields marked with * are required
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setShowAddRequestModal(false);
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Section - Standard Admin Sizing */}
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 font-telegraf text-[#351E10]">
              <i className="fa-solid fa-hand-holding-heart mr-3 text-[#E5B80B]"></i>
              Donation Process Management
            </h1>
            <p className="text-gray-600 text-sm md:text-base font-lora">Manage the complete donation workflow from request to final approval</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setViewMode(viewMode === "table" ? "cards" : "table")}
              className="px-4 md:px-6 py-3 rounded-lg transition-colors font-semibold shadow-md text-sm md:text-base bg-gray-100 text-gray-700 hover:bg-gray-200"
              style={{fontFamily: 'Telegraf, sans-serif'}}
            >
              <i className="fa-solid fa-th-large mr-2"></i>
              {viewMode === "table" ? "Card View" : "Table View"}
            </button>
            <button
              onClick={() => setShowEmailTest(!showEmailTest)}
              className="px-4 md:px-6 py-3 rounded-lg transition-colors font-semibold shadow-md text-sm md:text-base bg-blue-500 text-white hover:bg-blue-600"
              style={{fontFamily: 'Telegraf, sans-serif'}}
            >
              <i className="fa-solid fa-envelope mr-2"></i>
              Test Email
            </button>
            <button
              onClick={() => window.open('/admin/donation-analytics', '_blank')}
              className="px-4 md:px-6 py-3 rounded-lg transition-colors font-semibold shadow-md text-sm md:text-base bg-blue-500 text-white hover:bg-blue-600"
              style={{fontFamily: 'Telegraf, sans-serif'}}
            >
              <i className="fa-solid fa-chart-line mr-2"></i>
              Analytics
            </button>
            <button
              onClick={() => {
                setShowAddRequestModal(true);
              }}
              className="px-4 md:px-6 py-3 rounded-lg transition-colors font-semibold shadow-md text-sm md:text-base"
              style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
            >
              <i className="fa-solid fa-plus mr-2"></i>
              Add Request
            </button>
          </div>
        </div>
      </div>

      {/* Summary Statistics Cards - Standard Admin Sizing */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#E5B80B'}}>
              <i className="fa-solid fa-hand-holding-heart text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Total Requests</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}>{donations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#351E10'}}>
              <i className="fa-solid fa-clock text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Pending</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                {donations.filter(d => d.processing_stage === "request_meeting").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#E5B80B'}}>
              <i className="fa-solid fa-check-circle text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Approved</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}>
                {donations.filter(d => d.processing_stage === "complete").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#351E10'}}>
              <i className="fa-solid fa-calendar text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Meetings</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                {donations.filter(d => d.processing_stage === "schedule_meeting" || d.processing_stage === "finished_meeting").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search donations by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B]"
            />
          </div>
          <button
            onClick={fetchDonations}
            className="px-4 py-2 bg-[#E5B80B] text-white rounded-lg hover:bg-[#d4a509] transition-colors font-semibold"
          >
            <i className="fa-solid fa-sync-alt mr-2"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Process Stage Filter Buttons - Compact */}
      <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm sm:text-base font-semibold text-[#2e2b41]">
            <i className="fa-solid fa-filter mr-2"></i>
            Filter by Process Stage
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 text-sm ${
              activeTab === "all"
                ? "bg-[#E5B80B] text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Stages ({donations.length})
          </button>
          <button
            onClick={() => setActiveTab("request_meeting")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 text-sm ${
              activeTab === "request_meeting"
                ? "bg-[#E5B80B] text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Request Meeting ({donations.filter(d => d.processing_stage === "request_meeting").length})
          </button>
          <button
            onClick={() => setActiveTab("scheduled_meeting")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 text-sm ${
              activeTab === "scheduled_meeting"
                ? "bg-[#E5B80B] text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Scheduled Meeting ({donations.filter(d => d.processing_stage === "schedule_meeting").length})
          </button>
          <button
            onClick={() => setActiveTab("finished_meeting")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 text-sm ${
              activeTab === "finished_meeting"
                ? "bg-[#E5B80B] text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Finished Meeting ({donations.filter(d => d.processing_stage === "finished_meeting").length})
          </button>
          <button
            onClick={() => setActiveTab("city_hall")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 text-sm ${
              activeTab === "city_hall"
                ? "bg-[#E5B80B] text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            City Hall ({donations.filter(d => d.processing_stage === "city_hall").length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 text-sm ${
              activeTab === "completed"
                ? "bg-[#E5B80B] text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Completed ({donations.filter(d => d.processing_stage === "complete").length})
          </button>
        </div>
      </div>

      {/* Donations List - Modern Design */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Standard Header with Museum Branding */}
        <div className="relative px-4 md:px-6 py-4 bg-gradient-to-r from-[#351E10] via-[#2A1A0D] to-[#1A0F08]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E5B80B]/10 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-md" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                <i className="fa-solid fa-hand-holding-heart text-white text-sm sm:text-lg md:text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  Donation Requests
                </h3>
                <p className="text-[#E5B80B] text-sm md:text-base" style={{fontFamily: 'Lora, serif'}}>
                  {filteredDonations.length} {filteredDonations.length === 1 ? 'request' : 'requests'} found
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/30">
                <span className="text-white text-sm font-semibold" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  {loading ? (
                    <div className="flex items-center">
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                      Loading...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <i className="fa-solid fa-check-circle mr-2 text-green-300"></i>
                      Ready
                    </div>
                  )}
                </span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/30">
                <span className="text-white text-sm font-semibold" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  <i className="fa-solid fa-filter mr-2"></i>
                  {activeTab === 'all' ? 'All Stages' : activeTab.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            </div>
          </div>
        </div>
        {viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gradient-to-r from-[#351E10] to-[#2A1A0D]">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Donor
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Details
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Meeting
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDonations.map((donation) => (
                    <tr key={donation.id} className="hover:bg-gray-50 transition-all duration-200 group">
                  <td className="px-3 py-3 whitespace-nowrap">
                        <div>
                      <div className="text-sm font-bold text-[#351E10]" style={{fontFamily: 'Telegraf, sans-serif'}}>
                        {donation.donor_name}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {donation.donor_email}
                      </div>
                      {donation.donor_contact && (
<div className="text-xs text-gray-500 mt-1">
                                <i className="fa-solid fa-phone mr-1"></i>
                          {donation.donor_contact}
                        </div>
                      )}
                        </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          donation.type === 'monetary' ? 'bg-green-100 text-green-800' :
                          donation.type === 'artifact' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {donation.type}
                        </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm text-[#351E10]">
                      {donation.type === 'monetary' && donation.amount && (
                            <div className="font-bold text-green-600 bg-green-50 rounded px-2 py-1 text-xs">
                              ₱{parseFloat(donation.amount).toLocaleString()}
                            </div>
                      )}
                      {donation.item_description && (
                            <div className="text-gray-600 bg-blue-50 rounded px-2 py-1 text-xs">
                              {donation.item_description.length > 25 ? 
                                `${donation.item_description.substring(0, 25)}...` : 
                                donation.item_description
                              }
                            </div>
                          )}
                          {donation.estimated_value && (
                            <div className="text-xs text-gray-500 mt-1">
                              Est. Value: ₱{parseFloat(donation.estimated_value).toLocaleString()}
                            </div>
                          )}
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getProcessStatusBadge(donation.processing_stage)}`}>
                      {donation.processing_stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                        <div className="bg-gray-50 rounded px-2 py-1 text-xs">
                    {donation.request_date ? new Date(donation.request_date).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                        {donation.preferred_visit_date && donation.preferred_visit_time ? (
                          <div className="bg-blue-50 rounded px-2 py-1 text-xs">
                            <div className="font-medium">{new Date(donation.preferred_visit_date).toLocaleDateString()}</div>
                            <div className="text-gray-500">{donation.preferred_visit_time}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 bg-gray-50 rounded px-2 py-1 text-xs">-</span>
                        )}
                  </td>
                                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap gap-1">
                      {/* Contextual Action buttons based on process stage */}
                      {donation.processing_stage === 'request_meeting' && (
                        <>
                          <button
                            onClick={() => {
                              console.log('🔄 Schedule button clicked for donation:', donation.id);
                              setSelectedDonation(donation);
                              setShowMeetingModal(true);
                            }}
                            className="bg-gradient-to-r from-[#E5B80B] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#B8941F] text-white px-4 py-2 rounded-xl transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                            title="Schedule meeting with donor"
                            style={{fontFamily: 'Telegraf, sans-serif'}}
                          >
                            <i className="fa-solid fa-calendar mr-2"></i>
                            Schedule Meeting
                          </button>
                          <button
                            onClick={() => {
                              console.log('🔄 Reject button clicked for donation:', donation.id);
                              handleReject(donation.id);
                            }}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                            title="Reject donation request"
                            style={{fontFamily: 'Telegraf, sans-serif'}}
                          >
                            <i className="fa-solid fa-times mr-2"></i>
                            Reject
                          </button>
                        </>
                      )}
                      
                      {donation.processing_stage === 'schedule_meeting' && (
                        <button
                          onClick={() => {
                            console.log('🔄 Finish Meeting button clicked for donation:', donation.id);
                            handleCompleteMeeting(donation.id);
                          }}
                          className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-4 py-2 rounded-xl transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                          title="Mark meeting as completed"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        >
                          <i className="fa-solid fa-handshake mr-2"></i>
                          Finish Meeting
                        </button>
                      )}
                      
                      {donation.processing_stage === 'finished_meeting' && (
                        <button
                          onClick={() => {
                            console.log('🔄 Submit to City Hall button clicked for donation:', donation.id);
                            setSelectedDonation(donation);
                            setShowCityHallModal(true);
                          }}
                          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-xl transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                          title="Submit to City Hall for processing"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        >
                          <i className="fa-solid fa-building mr-2"></i>
                          Submit City Hall
                        </button>
                      )}
                      
                      
                      {donation.processing_stage === 'city_hall' && (
                        <button
                          onClick={() => handleAdvanceStage(donation.id)}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                          title="Mark as complete"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        >
                          <i className="fa-solid fa-check-circle mr-2"></i>
                          Complete
                        </button>
                      )}
                      
                      {donation.processing_stage === 'complete' && (
                        <button
                          onClick={() => downloadAppreciationLetter(donation.id, donation.donor_name)}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                          title="Download appreciation letter"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        >
                          <i className="fa-solid fa-download mr-2"></i>
                          Download Letter
                        </button>
                      )}
                      
                      
                      {/* View Details Button */}
                        <button
                          onClick={() => {
                            console.log('🔍 Donation type:', donation.type);
                            console.log('🔍 Full donation data:', donation);
                            setSelectedDonation(donation);
                            setSelectedFileIndex(0); // Reset to first file
                            setShowDetailsModal(true);
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition-colors text-xs font-semibold"
                          title="View Details"
                        >
                          <i className="fa-solid fa-eye mr-1"></i>
                          Details
                        </button>
                      
                      <button
                        onClick={() => {
                          console.log('🔄 Delete button clicked for donation:', donation.id, 'from donor:', donation.donor_name);
                          handleDelete(donation.id, donation.donor_name);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors text-xs font-semibold"
                        title="Delete donation"
                      >
                        <i className="fa-solid fa-trash mr-1"></i>
                        Delete
                      </button>
                        </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          ) : (
            /* Card View - Museum Style Layout */
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDonations.map((donation) => (
                  <div key={donation.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                    
                    {/* Category and Status Labels */}
                    <div className="p-4 pb-2">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-[#E5B80B] to-[#D4AF37] text-white">
                          {donation.type === 'monetary' ? 'Monetary' : 'Object'}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${getProcessStatusBadge(donation.processing_stage)}`}>
                          {donation.processing_stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
                        </span>
                      </div>
                      
                      {/* Title */}
                      <h3 className="font-bold text-gray-900 text-lg mb-2" style={{fontFamily: 'Telegraf, sans-serif'}}>
                        {donation.donor_name}
                      </h3>
                      
                      {/* Details */}
                      <div className="space-y-1 mb-4">
                        <div className="text-sm text-gray-600">
                          {donation.donor_email}
                        </div>
                        
                        {/* Donation Type Specific Information */}
                        {donation.type === 'monetary' && donation.amount && (
                          <div className="text-sm font-semibold text-green-600">
                            ₱{parseFloat(donation.amount).toLocaleString()}
                          </div>
                        )}
                        
                        {donation.type === 'object' && donation.item_name && (
                          <div className="text-sm font-medium text-gray-900">
                            <span className="text-gray-600">Item:</span> {donation.item_name}
                          </div>
                        )}
                        
                        {donation.type === 'object' && donation.item_category && (
                          <div className="text-sm text-gray-600">
                            <span className="text-gray-500">Category:</span> {donation.item_category}
                          </div>
                        )}
                        
                        {donation.item_description && (
                          <div className="text-sm text-gray-600">
                            {donation.item_description.length > 50 ? 
                              `${donation.item_description.substring(0, 50)}...` : 
                              donation.item_description
                            }
                          </div>
                        )}
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          {donation.request_date ? new Date(donation.request_date).toLocaleDateString() : 'No date'}
                        </div>
                      </div>
                      
                      {/* Action Buttons - Museum Style */}
                      <div className="flex items-center justify-end gap-2">
                        {/* View Details Button */}
                        <button
                          onClick={() => {
                            setSelectedDonation(donation);
                            setSelectedFileIndex(0); // Reset to first file
                            setShowDetailsModal(true);
                          }}
                          className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg flex items-center justify-center transition-colors"
                          title="View Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        
                        {donation.processing_stage === 'request_received' && (
                          <>
                            <button
                              onClick={() => {
                                console.log('🔄 Schedule button clicked for donation:', donation.id);
                                setSelectedDonation(donation);
                                setShowMeetingModal(true);
                              }}
                              className="w-8 h-8 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg flex items-center justify-center transition-colors"
                              title="Schedule Meeting"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                console.log('🔄 Reject button clicked for donation:', donation.id);
                                handleReject(donation.id);
                              }}
                              className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-colors"
                              title="Reject"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        )}
                        
                        {donation.processing_stage === 'schedule_meeting' && (
                          <button
                            onClick={() => {
                              console.log('🔄 Complete button clicked for donation:', donation.id);
                              handleCompleteMeeting(donation.id);
                            }}
                            className="w-8 h-8 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-lg flex items-center justify-center transition-colors"
                            title="Complete Meeting"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        
                        {(donation.processing_stage === 'meeting_completed' || donation.processing_stage === 'handover_completed') && (
                          <button
                            onClick={() => {
                              console.log('🔄 Submit to City Hall button clicked for donation:', donation.id);
                              setSelectedDonation(donation);
                              setShowCityHallModal(true);
                            }}
                            className="w-8 h-8 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg flex items-center justify-center transition-colors"
                            title="Submit to City Hall"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </button>
                        )}
                        
                        {donation.processing_stage === 'city_hall' && (
                          <button
                            onClick={() => handleCityHallApprove(donation.id)}
                            className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg flex items-center justify-center transition-colors"
                            title="Approve"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        
                        {donation.processing_stage === 'complete' && (
                          <button
                            onClick={() => {
                              setSelectedDonation(donation);
                              setShowFinalApproveModal(true);
                            }}
                            className="w-8 h-8 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg flex items-center justify-center transition-colors"
                            title="Final Approve"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </button>
                        )}
                        
                        {donation.processing_stage === 'complete' && (
                          <button
                            onClick={() => downloadAppreciationLetter(donation.id, donation.donor_name)}
                            className="w-8 h-8 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg flex items-center justify-center transition-colors"
                            title="Download Letter"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            console.log('🔄 Delete button clicked for donation:', donation.id, 'from donor:', donation.donor_name);
                            handleDelete(donation.id, donation.donor_name);
                          }}
                          className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        {filteredDonations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-inbox text-3xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No donation requests found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {donations.length === 0 
                ? "Donation requests will appear here once submitted by visitors"
                : "Try adjusting your filters to see more results"
              }
            </p>
            {donations.length > 0 && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setProcessingStageFilter('all');
                }}
                className="bg-[#AB8841] text-white px-4 py-2 rounded-lg hover:bg-[#8B6B21] transition-colors text-sm font-medium"
              >
                <i className="fa-solid fa-refresh mr-2"></i>
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewLetter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-full overflow-y-auto">
            <h3 className="text-2xl font-bold text-[#2e2b41] mb-4">
              <i className="fa-solid fa-envelope mr-2"></i>
              Appreciation Letter Preview
            </h3>
            <div className="text-lg text-[#2e2b41] mb-4">
              <p>Dear {previewLetter.donor},</p>
              <p>This is a preview of the appreciation letter that will be sent to you upon approval of your donation.</p>
              <p>Please review the content and ensure it accurately reflects the details of your donation.</p>
            </div>
            <div className="overflow-hidden" dangerouslySetInnerHTML={{ __html: previewLetter.content }} />
            <div className="flex justify-end mt-6">
              <button
                onClick={closePreview}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-md"
              >
                <i className="fa-solid fa-times mr-2"></i>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Email Modal */}
      {showEmailTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-[#2e2b41] mb-4">
              <i className="fa-solid fa-envelope mr-2"></i>
              Test Email Configuration
            </h3>
            <p className="text-gray-600 mb-4">
              Send a test appreciation letter to verify your email configuration is working correctly.
            </p>
            <div className="mb-4">
              <label className="block text-[#2e2b41] font-semibold mb-2">
                Test Email Address
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                placeholder="Enter email address to test"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEmailTest(false);
                  setTestEmail('');
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={testEmailFunction}
                disabled={testingEmail}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {testingEmail ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane mr-1"></i>
                    Send Test Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donation Details Modal - Modern Museum Design */}
      {showDetailsModal && selectedDonation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden border border-amber-100">
            {/* Modern Museum Header - Matching Donation Section Colors */}
            <div className="relative bg-gradient-to-r from-[#351E10] via-[#2A1A0D] to-[#1A0F08] text-white overflow-hidden">
              {/* Decorative Museum Pattern */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E5B80B]/10 to-transparent"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#E5B80B]/5 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute top-4 right-4 w-8 h-8 border-2 border-[#E5B80B]/20 rounded-full"></div>
              <div className="absolute top-8 right-12 w-4 h-4 border border-[#E5B80B]/15 rounded-full"></div>
              
              <div className="relative p-6 flex items-center justify-between">
                <div className="flex items-center space-x-5">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#E5B80B] to-[#D4AF37] rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fa-solid fa-museum text-white text-xl"></i>
                  </div>
                  <div> 
                    
                    <h3 className="text-2xl font-bold mb-1" style={{fontFamily: 'Playfair Display, serif'}}>
                      Heritage Collection
                    </h3>
                    <p className="text-[#E5B80B] text-base" style={{fontFamily: 'Inter, sans-serif'}}>
                      Donation Archive • {selectedDonation.donor_name}
                    </p>
                  </div>
                </div>
                
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handlePrintDetails}
                    className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white px-5 py-2.5 rounded-lg transition-all duration-300 text-sm font-semibold flex items-center space-x-2 border border-white/20 hover:border-white/30"
                  >
                    <i className="fa-solid fa-print"></i>
                    <span>Print Record</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white px-5 py-2.5 rounded-lg transition-all duration-300 text-sm font-semibold flex items-center space-x-2 border border-white/20 hover:border-white/30"
                  >
                    <i className="fa-solid fa-file-pdf"></i>
                    <span>Export Archive</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedDonation(null);
                    }}
                    className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white p-2.5 rounded-lg transition-all duration-300 border border-white/20 hover:border-white/30"
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
            
            
            {/* Modern Museum Content Area - Clean Organized Layout */}
            <div className="bg-gray-50 p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column - Essential Information */}
                  <div className="lg:col-span-1 space-y-4">
                  {/* Donor Information Card - Modern Clean Design */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i className="fa-solid fa-user text-blue-600 text-sm"></i>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Donor Information</h4>
                            {!expandedSections.donor && (
                              <p className="text-gray-700 text-sm font-medium">{selectedDonation.donor_name}</p>
                            )}
                            {expandedSections.donor && (
                              <p className="text-gray-500 text-sm">Contact details</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleSection('donor')}
                          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <i className={`fa-solid fa-chevron-${expandedSections.donor ? 'up' : 'down'} text-gray-600 text-xs`}></i>
                        </button>
                      </div>
                    </div>
                    
                    {expandedSections.donor && (
                      <div className="p-4 space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                            <i className="fa-solid fa-user text-gray-600 text-sm"></i>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{selectedDonation.donor_name}</p>
                            <p className="text-gray-500 text-sm">Donor Name</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                            <i className="fa-solid fa-envelope text-gray-600 text-sm"></i>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{selectedDonation.donor_email}</p>
                            <p className="text-gray-500 text-sm">Email Address</p>
                          </div>
                        </div>
                        
                        {selectedDonation.donor_contact && (
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                              <i className="fa-solid fa-phone text-gray-600 text-sm"></i>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{selectedDonation.donor_contact}</p>
                              <p className="text-gray-500 text-sm">Phone Number</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Status & Request Info Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center mr-3">
                        <i className="fa-solid fa-info-circle text-white"></i>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800">Request Status</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status</span>
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${getProcessStatusBadge(selectedDonation.processing_stage)}`}>
                          {selectedDonation.processing_stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Request Date</span>
                        <span className="font-medium text-gray-900">
                          {selectedDonation.request_date ? new Date(selectedDonation.request_date).toLocaleDateString() : 'No date'}
                        </span>
                      </div>
                    </div>
                  </div>
                  </div>
                  
                  {/* Meeting Information */}
                  {(selectedDonation.preferred_visit_date || selectedDonation.preferred_visit_time || selectedDonation.scheduled_date || selectedDonation.scheduled_time) && (
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-100">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                          <i className="fa-solid fa-calendar text-white"></i>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800">Meeting Information</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(selectedDonation.preferred_visit_date || selectedDonation.preferred_visit_time) && (
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <p className="text-sm font-medium text-gray-600 mb-2">Preferred Meeting</p>
                            {selectedDonation.preferred_visit_date && (
                              <div className="flex items-center space-x-2 mb-1">
                                <i className="fa-solid fa-calendar-day text-orange-500"></i>
                                <span className="text-sm text-gray-900">{new Date(selectedDonation.preferred_visit_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            {selectedDonation.preferred_visit_time && (
                              <div className="flex items-center space-x-2">
                                <i className="fa-solid fa-clock text-orange-500"></i>
                                <span className="text-sm text-gray-900">{selectedDonation.preferred_visit_time}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {(selectedDonation.scheduled_date || selectedDonation.scheduled_time) && (
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <p className="text-sm font-medium text-gray-600 mb-2">Scheduled Meeting</p>
                            {selectedDonation.scheduled_date && (
                              <div className="flex items-center space-x-2 mb-1">
                                <i className="fa-solid fa-calendar-day text-green-500"></i>
                                <span className="text-sm text-gray-900">{new Date(selectedDonation.scheduled_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            {selectedDonation.scheduled_time && (
                              <div className="flex items-center space-x-2">
                                <i className="fa-solid fa-clock text-green-500"></i>
                                <span className="text-sm text-gray-900">{selectedDonation.scheduled_time}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                  {/* Right Column - Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Section Header */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <i className="fa-solid fa-gift text-blue-600 text-sm"></i>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Donation Information</h3>
                          <p className="text-gray-500 text-sm">Complete donation details and documentation</p>
                        </div>
                      </div>
                    </div>
                  
                    {/* Donation Type & Details Card */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <i className="fa-solid fa-gift text-green-600 text-sm"></i>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">Donation Details</h4>
                              <p className="text-gray-500 text-sm">Type, value, and specifications</p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleSection('donation')}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                          >
                            <i className={`fa-solid fa-chevron-${expandedSections.donation ? 'up' : 'down'} text-gray-600 text-xs`}></i>
                          </button>
                        </div>
                      </div>
                      {expandedSections.donation && (
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Donation Type */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Type</span>
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-[#E5B80B] to-[#D4AF37] text-white`}>
                            {selectedDonation.type === 'monetary' ? 'Monetary' : 
                             selectedDonation.type === 'loan' ? 'Loan' : 
                             selectedDonation.type === 'object' ? 'Object' : 
                             selectedDonation.type === 'artifact' ? 'Artifact' : 
                             selectedDonation.type}
                            {/* Debug: {selectedDonation.type} */}
                          </span>
                        </div>
                        {selectedDonation.type === 'monetary' && selectedDonation.amount && (
                          <div className="text-2xl font-bold text-green-600">
                            ₱{parseFloat(selectedDonation.amount).toLocaleString()}
                          </div>
                        )}
                        {selectedDonation.type === 'loan' && selectedDonation.estimated_value && (
                          <div className="text-2xl font-bold text-blue-600">
                            ₱{parseFloat(selectedDonation.estimated_value).toLocaleString()}
                          </div>
                        )}
                      </div>
                      
                      {/* Loan Details */}
                      {selectedDonation.type === 'loan' && (
                        <>
                          {selectedDonation.item_name && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <p className="text-sm text-gray-600 mb-1">Item Name</p>
                              <p className="font-semibold text-gray-900">{selectedDonation.item_name}</p>
                            </div>
                          )}
                          {selectedDonation.item_description && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <p className="text-sm text-gray-600 mb-1">Description</p>
                              <p className="font-semibold text-gray-900">{selectedDonation.item_description}</p>
                            </div>
                          )}
                          {selectedDonation.condition && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <p className="text-sm text-gray-600 mb-1">Condition</p>
                              <p className="font-semibold text-gray-900">{selectedDonation.condition}</p>
                            </div>
                          )}
                          {selectedDonation.loan_start_date && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <p className="text-sm text-gray-600 mb-1">Loan Start Date</p>
                              <p className="font-semibold text-gray-900">
                                {new Date(selectedDonation.loan_start_date).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {selectedDonation.loan_end_date && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <p className="text-sm text-gray-600 mb-1">Loan End Date</p>
                              <p className="font-semibold text-gray-900">
                                {new Date(selectedDonation.loan_end_date).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                     

                      {/* Object Details */}
                      {selectedDonation.type === 'object' && (
                        <>
                          {selectedDonation.item_name && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <p className="text-sm text-gray-600 mb-1">Item Name</p>
                              <p className="font-semibold text-gray-900">{selectedDonation.item_name}</p>
                            </div>
                          )}
                          {selectedDonation.item_category && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <p className="text-sm text-gray-600 mb-1">Category</p>
                              <p className="font-semibold text-gray-900">{selectedDonation.item_category}</p>
                            </div>
                          )}
                          {selectedDonation.item_condition && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <p className="text-sm text-gray-600 mb-1">Condition</p>
                              <p className="font-semibold text-gray-900">{selectedDonation.item_condition}</p>
                            </div>
                          )}
                          {selectedDonation.item_era && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <p className="text-sm text-gray-600 mb-1">Era/Period</p>
                              <p className="font-semibold text-gray-900">{selectedDonation.item_era}</p>
                            </div>
                          )}
                          {selectedDonation.item_material && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <p className="text-sm text-gray-600 mb-1">Material</p>
                              <p className="font-semibold text-gray-900">{selectedDonation.item_material}</p>
                            </div>
                          )}
                        </>
                      )}
                          </div>
                        </div>
                      )}
                    </div>
                  
                    {/* Description Card */}
                    {selectedDonation.item_description && (
                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <i className="fa-solid fa-file-text text-green-600 text-sm"></i>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">Description</h4>
                              <p className="text-gray-500 text-sm">Item details and specifications</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-gray-700 leading-relaxed">{selectedDonation.item_description}</p>
                        </div>
                      </div>
                    )}
                  
                  
                    {/* Workflow Timeline & Process History */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <i className="fa-solid fa-timeline text-indigo-600 text-sm"></i>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Process Timeline</h4>
                            <p className="text-gray-500 text-sm">Request processing history</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                    
                    <div className="space-y-4">
                      {/* Request Received */}
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <i className="fa-solid fa-check text-white text-sm"></i>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-semibold text-gray-900">Request Received</h5>
                            <span className="text-sm text-gray-500">
                              {selectedDonation.request_date ? new Date(selectedDonation.request_date).toLocaleDateString() : 'Unknown'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">Donation request submitted by {selectedDonation.donor_name}</p>
                        </div>
                      </div>
                      
                      {/* Meeting Scheduled */}
                      {selectedDonation.scheduled_date && (
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-calendar text-white text-sm"></i>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-gray-900">Meeting Scheduled</h5>
                              <span className="text-sm text-gray-500">
                                {new Date(selectedDonation.scheduled_date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Meeting scheduled for {selectedDonation.scheduled_time || 'TBD'}
                              {selectedDonation.location && ` at ${selectedDonation.location}`}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Meeting Completed */}
                      {selectedDonation.meeting_completed && (
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-handshake text-white text-sm"></i>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-gray-900">Meeting Completed</h5>
                              <span className="text-sm text-gray-500">
                                {selectedDonation.meeting_completed_date ? new Date(selectedDonation.meeting_completed_date).toLocaleDateString() : 'Unknown'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Initial meeting completed with donor
                              {selectedDonation.meeting_notes && (
                                <span className="block mt-1 text-xs text-gray-500 italic">
                                  Notes: {selectedDonation.meeting_notes}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* City Hall Submission */}
                      {selectedDonation.city_hall_submitted && (
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-building text-white text-sm"></i>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-gray-900">Submitted to City Hall</h5>
                              <span className="text-sm text-gray-500">
                                {selectedDonation.city_hall_submission_date ? new Date(selectedDonation.city_hall_submission_date).toLocaleDateString() : 'Unknown'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Donation submitted for city hall approval
                              {selectedDonation.city_hall_reference && (
                                <span className="block mt-1 text-xs text-gray-500">
                                  Reference: {selectedDonation.city_hall_reference}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* City Hall Approval */}
                      {selectedDonation.city_hall_approved && (
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-check-circle text-white text-sm"></i>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-gray-900">City Hall Approved</h5>
                              <span className="text-sm text-gray-500">
                                {selectedDonation.city_hall_approval_date ? new Date(selectedDonation.city_hall_approval_date).toLocaleDateString() : 'Unknown'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              City hall has approved the donation
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Final Approval */}
                      {selectedDonation.final_approval_date && (
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-star text-white text-sm"></i>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-gray-900">Final Approval</h5>
                              <span className="text-sm text-gray-500">
                                {new Date(selectedDonation.final_approval_date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Donation has been finally approved and gratitude email sent
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Current Status */}
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          selectedDonation.processing_stage === 'complete' ? 'bg-emerald-500' :
                          selectedDonation.processing_stage === 'city_hall' ? 'bg-orange-500' :
                          selectedDonation.processing_stage === 'finished_meeting' ? 'bg-purple-500' :
                          selectedDonation.processing_stage === 'schedule_meeting' ? 'bg-blue-500' :
                          selectedDonation.processing_stage === 'request_meeting' ? 'bg-indigo-500' :
                          'bg-gray-400'
                        }`}>
                          <i className={`text-white text-sm ${
                            selectedDonation.processing_stage === 'complete' ? 'fa-solid fa-star' :
                            selectedDonation.processing_stage === 'city_hall' ? 'fa-solid fa-building' :
                            selectedDonation.processing_stage === 'finished_meeting' ? 'fa-solid fa-handshake' :
                            selectedDonation.processing_stage === 'schedule_meeting' ? 'fa-solid fa-calendar' :
                            selectedDonation.processing_stage === 'request_meeting' ? 'fa-solid fa-clock' :
                            'fa-solid fa-clock'
                          }`}></i>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-semibold text-gray-900">Current Status</h5>
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${getProcessStatusBadge(selectedDonation.processing_stage)}`}>
                              {selectedDonation.processing_stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {selectedDonation.processing_stage === 'complete' ? 'Donation process completed successfully' :
                             selectedDonation.processing_stage === 'city_hall' ? 'Awaiting city hall decision' :
                             selectedDonation.processing_stage === 'finished_meeting' ? 'Ready for city hall submission' :
                             selectedDonation.processing_stage === 'schedule_meeting' ? 'Meeting scheduled with donor' :
                             selectedDonation.processing_stage === 'request_meeting' ? 'Initial request received' :
                             'Unknown status'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Information */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center mr-3">
                        <i className="fa-solid fa-info-circle text-white"></i>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800">Additional Information</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Notes */}
                      {selectedDonation.notes && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <p className="text-sm font-medium text-gray-600 mb-2">Notes</p>
                          <p className="text-sm text-gray-700">{selectedDonation.notes}</p>
                        </div>
                      )}
                      
                      {/* Estimated Value */}
                      {selectedDonation.estimated_value && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <p className="text-sm font-medium text-gray-600 mb-2">Estimated Value</p>
                          <p className="text-lg font-semibold text-green-600">
                            ₱{parseFloat(selectedDonation.estimated_value).toLocaleString()}
                          </p>
                        </div>
                      )}
                      
                      {/* Loan Information - Only show if not already displayed in main details */}
                      {selectedDonation.type === 'loan' && !selectedDonation.loan_start_date && !selectedDonation.loan_end_date && (
                        <>
                          {selectedDonation.loan_start_date && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <p className="text-sm font-medium text-gray-600 mb-2">Loan Start Date</p>
                              <p className="text-sm text-gray-700">
                                {new Date(selectedDonation.loan_start_date).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {selectedDonation.loan_end_date && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <p className="text-sm font-medium text-gray-600 mb-2">Loan End Date</p>
                              <p className="text-sm text-gray-700">
                                {new Date(selectedDonation.loan_end_date).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Dedicated Attached Files Section */}
              <div className="mt-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center mr-4">
                      <i className="fa-solid fa-folder-open text-white text-xl"></i>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-800">Attached Files</h4>
                      <p className="text-gray-600 text-sm">All documents and images related to this donation</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSection('attachments')}
                    className="w-10 h-10 bg-indigo-100 hover:bg-indigo-200 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <i className={`fa-solid fa-chevron-${expandedSections.attachments ? 'up' : 'down'} text-indigo-600 text-sm`}></i>
                  </button>
                </div>
                
                {expandedSections.attachments && (
                  <div className="space-y-4">
                    {selectedDonation.attachment_paths && selectedDonation.attachment_paths.split(',').length > 0 ? (
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="flex h-[800px]">
                          {/* Left Side - Document Preview */}
                          <div className="flex-1 bg-gray-50 border-r border-gray-200">
                            <div className="h-full flex flex-col">
                              {/* Preview Header */}
                              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <i className="fa-solid fa-folder text-yellow-600"></i>
                                  </div>
                                  <h4 className="font-semibold text-gray-800">Document Preview</h4>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button 
                                    onClick={() => {
                                      const currentPath = selectedDonation.attachment_paths.split(',')[selectedFileIndex];
                                      let filePath;
                                      if (currentPath.startsWith('http')) {
                                        filePath = currentPath;
                                      } else if (currentPath.includes('\\') || currentPath.includes('C:')) {
                                        const fileName = currentPath.split('\\').pop();
                                        filePath = `http://localhost:3000/uploads/donations/${fileName}`;
                                      } else if (currentPath.startsWith('/uploads/')) {
                                        filePath = `http://localhost:3000${currentPath}`;
                                      } else {
                                        filePath = `http://localhost:3000/uploads/donations/${currentPath}`;
                                      }
                                      window.open(filePath, '_blank');
                                    }}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center space-x-1"
                                  >
                                    <i className="fa-solid fa-external-link-alt"></i>
                                    <span>Open</span>
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const currentPath = selectedDonation.attachment_paths.split(',')[selectedFileIndex];
                                      let filePath;
                                      if (currentPath.startsWith('http')) {
                                        filePath = currentPath;
                                      } else if (currentPath.includes('\\') || currentPath.includes('C:')) {
                                        const fileName = currentPath.split('\\').pop();
                                        filePath = `http://localhost:3000/uploads/donations/${fileName}`;
                                      } else if (currentPath.startsWith('/uploads/')) {
                                        filePath = `http://localhost:3000${currentPath}`;
                                      } else {
                                        filePath = `http://localhost:3000/uploads/donations/${currentPath}`;
                                      }
                                      const link = document.createElement('a');
                                      link.href = filePath;
                                      link.download = selectedDonation.attachment_names?.split(',')[selectedFileIndex] || 'file';
                                      link.target = '_blank';
                                      link.rel = 'noopener noreferrer';
                                      link.click();
                                    }}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center space-x-1"
                                  >
                                    <i className="fa-solid fa-download"></i>
                                    <span>Download</span>
                                  </button>
                                </div>
                              </div>
                              
                              {/* Preview Toolbar */}
                              <div className="flex items-center justify-between p-3 bg-gray-100 border-b border-gray-200">
                                <div className="flex items-center space-x-3">
                                  <button className="p-1.5 hover:bg-gray-200 rounded">
                                    <i className="fa-solid fa-list text-gray-600"></i>
                                  </button>
                                  <button className="p-1.5 hover:bg-gray-200 rounded">
                                    <i className="fa-solid fa-file-alt text-gray-600"></i>
                                  </button>
                                  <button className="p-1.5 hover:bg-gray-200 rounded">
                                    <i className="fa-solid fa-ellipsis-h text-gray-600"></i>
                                  </button>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <button className="p-1.5 hover:bg-gray-200 rounded">
                                    <i className="fa-solid fa-search-minus text-gray-600"></i>
                                  </button>
                                  <button className="p-1.5 hover:bg-gray-200 rounded">
                                    <i className="fa-solid fa-search-plus text-gray-600"></i>
                                  </button>
                                  <button className="p-1.5 hover:bg-gray-200 rounded">
                                    <i className="fa-solid fa-expand-arrows-alt text-gray-600"></i>
                                  </button>
                                  <span className="text-sm text-gray-600 px-2">
                                    {selectedFileIndex + 1} of {selectedDonation.attachment_paths.split(',').length}
                                  </span>
                                  <button className="p-1.5 hover:bg-gray-200 rounded">
                                    <i className="fa-solid fa-sync-alt text-gray-600"></i>
                                  </button>
                                  <button className="p-1.5 hover:bg-gray-200 rounded">
                                    <i className="fa-solid fa-print text-gray-600"></i>
                                  </button>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button className="p-1.5 hover:bg-gray-200 rounded">
                                    <i className="fa-solid fa-search text-gray-600"></i>
                                  </button>
                                  <button className="p-1.5 hover:bg-gray-200 rounded">
                                    <i className="fa-solid fa-file text-gray-600"></i>
                                  </button>
                                  <button className="p-1.5 hover:bg-gray-200 rounded">
                                    <i className="fa-solid fa-ellipsis-h text-gray-600"></i>
                                  </button>
                                </div>
                              </div>
                              
                              {/* Document Content */}
                              <div className="flex-1 bg-white overflow-auto">
                                {(() => {
                                  // Create a proper file mapping to avoid array misalignment issues
                                  const allPaths = selectedDonation.attachment_paths.split(',');
                                  const allNames = selectedDonation.attachment_names?.split(',') || [];
                                  const allTypes = selectedDonation.attachment_types?.split(',') || [];
                                  
                                  console.log('🔍 File Selection Debug:');
                                  console.log('🔍 Selected File Index:', selectedFileIndex);
                                  console.log('🔍 All paths:', allPaths);
                                  console.log('🔍 All names:', allNames);
                                  console.log('🔍 All types:', allTypes);
                                  
                                  // Create a file mapping object to avoid index mismatches
                                  const fileMapping = {};
                                  for (let i = 0; i < allPaths.length; i++) {
                                    const path = allPaths[i];
                                    const name = allNames[i] || 'Unknown';
                                    const type = allTypes[i] || 'other';
                                    const pathFileName = path.split('\\').pop() || path.split('/').pop() || '';
                                    
                                    // Use the display name as the key
                                    fileMapping[name] = {
                                      path: path,
                                      name: name,
                                      type: type,
                                      pathFileName: pathFileName,
                                      index: i
                                    };
                                    
                                    console.log(`🔍 Mapped file ${i}: ${name} -> ${pathFileName}`);
                                  }
                                  
                                  // Get the selected file name from the file list
                                  const selectedFileName = allNames[selectedFileIndex];
                                  console.log('🔍 Selected file name:', selectedFileName);
                                  
                                  // Get the file data from the mapping
                                  const selectedFile = fileMapping[selectedFileName];
                                  if (!selectedFile) {
                                    console.error('❌ Selected file not found in mapping:', selectedFileName);
                                    return <div className="h-full flex items-center justify-center bg-gray-50">
                                      <div className="text-center text-gray-500">
                                        <i className="fa-solid fa-exclamation-triangle text-4xl mb-2"></i>
                                        <p className="text-lg font-medium">File not found</p>
                                        <p className="text-sm text-gray-400">Selected file: {selectedFileName}</p>
                                      </div>
                                    </div>;
                                  }
                                  
                                  console.log('🔍 Using mapped file:');
                                  console.log('🔍   Path:', selectedFile.path);
                                  console.log('🔍   Name:', selectedFile.name);
                                  console.log('🔍   Type:', selectedFile.type);
                                  console.log('🔍   Path filename:', selectedFile.pathFileName);
                                  
                                  // Determine file type based on actual file extension
                                  const fileExtension = selectedFile.pathFileName.toLowerCase().split('.').pop() || '';
                                  console.log('🔍 File extension:', fileExtension);
                                  
                                  const isImage = (fileExtension === 'jpg' || fileExtension === 'jpeg' || 
                                               fileExtension === 'png' || fileExtension === 'gif' || 
                                               fileExtension === 'webp' || fileExtension === 'bmp') &&
                                               fileExtension !== 'pdf';
                                  const isPDF = fileExtension === 'pdf';
                                  
                                  console.log('🔍 File type detection:');
                                  console.log('🔍   Is Image:', isImage);
                                  console.log('🔍   Is PDF:', isPDF);
                                  
                                  if (isImage) {
                                    const imageUrl = (() => {
                                      if (selectedFile.path.startsWith('http')) {
                                        return selectedFile.path;
                                      } else if (selectedFile.path.includes('\\') || selectedFile.path.includes('C:')) {
                                        const fileName = selectedFile.path.split('\\').pop();
                                        return `http://localhost:3000/uploads/donations/${fileName}?t=${Date.now()}`;
                                      } else if (selectedFile.path.startsWith('/uploads/')) {
                                        return `http://localhost:3000${selectedFile.path}?t=${Date.now()}`;
                                      } else {
                                        return `http://localhost:3000/uploads/donations/${selectedFile.path}?t=${Date.now()}`;
                                      }
                                    })();
                                    
                                    console.log('🖼️ Image preview URL:', imageUrl);
                                    console.log('🖼️ Current path:', selectedFile.path);
                                    console.log('🖼️ Current name:', selectedFile.name);
                                    console.log('🖼️ Detected file name:', selectedFile.pathFileName);
                                    console.log('🖼️ Is Image:', isImage);
                                    console.log('🖼️ Is PDF:', isPDF);
                                    
                                    // Test if the image URL is accessible
                                    const testImage = new Image();
                                    testImage.onload = () => {
                                      console.log('✅ Test image loaded successfully:', imageUrl);
                                    };
                                    testImage.onerror = () => {
                                      console.error('❌ Test image failed to load:', imageUrl);
                                    };
                                    testImage.src = imageUrl;
                                    
                                    return (
                                      <div className="h-full bg-gray-50 relative">
                                        <img 
                                          src={imageUrl} 
                                          alt={selectedFile.name}
                                          className="w-full h-full object-contain"
                                          onLoad={(e) => {
                                            console.log('✅ Image loaded successfully in preview:', imageUrl);
                                            e.target.style.display = 'block';
                                            e.target.style.opacity = '1';
                                            // Hide the fallback
                                            const fallback = e.target.nextSibling;
                                            if (fallback) fallback.style.display = 'none';
                                          }}
                                          onError={(e) => {
                                            console.error('❌ Image failed to load in preview:', imageUrl);
                                            console.error('❌ Error details:', e);
                                            e.target.style.display = 'none';
                                            // Show the fallback
                                            const fallback = e.target.nextSibling;
                                            if (fallback) fallback.style.display = 'flex';
                                          }}
                                          style={{opacity: 0, transition: 'opacity 0.3s ease'}}
                                        />
                                        <div className="hidden absolute inset-0 bg-gray-100 flex items-center justify-center">
                                          <div className="text-center text-gray-500">
                                            <i className="fa-solid fa-image text-6xl mb-4"></i>
                                            <p className="text-lg font-medium">Preview not available</p>
                                            <p className="text-sm text-gray-400 mt-2">Click Open to view file</p>
                                            <p className="text-xs text-gray-300 mt-1">URL: {imageUrl}</p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  } else if (isPDF) {
                                    const pdfUrl = (() => {
                                      if (selectedFile.path.startsWith('http')) {
                                        return selectedFile.path;
                                      } else if (selectedFile.path.includes('\\') || selectedFile.path.includes('C:')) {
                                        const fileName = selectedFile.path.split('\\').pop();
                                        return `http://localhost:3000/uploads/donations/${fileName}`;
                                      } else if (selectedFile.path.startsWith('/uploads/')) {
                                        return `http://localhost:3000${selectedFile.path}`;
                                      } else {
                                        return `http://localhost:3000/uploads/donations/${selectedFile.path}`;
                                      }
                                    })();
                                    
                                    console.log('📄 PDF URL:', pdfUrl);
                                    
                                    return (
                                      <div className="h-full bg-gray-50">
                                        <iframe 
                                          src={pdfUrl}
                                          className="w-full h-full border-0"
                                          title={`PDF Preview: ${selectedFile.name}`}
                                          onError={(e) => {
                                            console.error('❌ PDF failed to load:', pdfUrl);
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                          }}
                                        />
                                        <div className="hidden h-full w-full items-center justify-center bg-gray-100">
                                          <div className="text-center">
                                            <i className="fa-solid fa-file-pdf text-red-500 text-8xl mb-4"></i>
                                            <p className="text-xl font-semibold text-gray-700 mb-2">{selectedFile.name}</p>
                                            <p className="text-gray-500 mb-4">PDF Document</p>
                                            <button 
                                              onClick={() => {
                                                window.open(pdfUrl, '_blank');
                                              }}
                                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                            >
                                              Open PDF
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div className="h-full flex items-center justify-center bg-gray-50">
                                        <div className="text-center">
                                          <i className="fa-solid fa-file text-gray-400 text-8xl mb-4"></i>
                                          <p className="text-xl font-semibold text-gray-700 mb-2">{selectedFile.name}</p>
                                          <p className="text-gray-500 mb-4 capitalize">{selectedFile.type.replace('_', ' ')}</p>
                                          <button 
                                            onClick={() => {
                                              let filePath;
                                              if (selectedFile.path.startsWith('http')) {
                                                filePath = selectedFile.path;
                                              } else if (selectedFile.path.includes('\\') || selectedFile.path.includes('C:')) {
                                                const fileName = selectedFile.path.split('\\').pop();
                                                filePath = `http://localhost:3000/uploads/donations/${fileName}`;
                                              } else if (selectedFile.path.startsWith('/uploads/')) {
                                                filePath = `http://localhost:3000${selectedFile.path}`;
                                              } else {
                                                filePath = `http://localhost:3000/uploads/donations/${selectedFile.path}`;
                                              }
                                              window.open(filePath, '_blank');
                                            }}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                          >
                                            Open File
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                            </div>
                          </div>
                          
                          {/* Right Side - File List */}
                          <div className="w-80 bg-white">
                            <div className="h-full flex flex-col">
                              {/* File List Header */}
                              <div className="p-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-gray-800">Attached Files</h4>
                                  <span className="text-sm text-gray-500">
                                    {selectedDonation.attachment_paths.split(',').length} files
                                  </span>
                                </div>
                              </div>
                              
                              {/* File List */}
                              <div className="flex-1 overflow-y-auto">
                                {selectedDonation.attachment_paths.split(',').map((path, index) => {
                                  const fileName = selectedDonation.attachment_names?.split(',')[index] || 'Unknown';
                                  const fileType = selectedDonation.attachment_types?.split(',')[index] || 'other';
                                  const isImage = fileType.includes('image') || fileType.includes('photo') || 
                                               fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
                                  const isPDF = fileName.toLowerCase().endsWith('.pdf');
                                  const isDocument = fileType.includes('receipt') || fileType.includes('certificate') || 
                                                   fileType.includes('agreement') || isPDF;
                                  
                                  return (
                                    <div 
                                      key={index} 
                                      onClick={() => {
                                        console.log('🖱️ Clicked file index:', index);
                                        console.log('🖱️ File path:', path);
                                        console.log('🖱️ File name:', fileName);
                                        console.log('🖱️ File type:', fileType);
                                        setSelectedFileIndex(index);
                                      }}
                                      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                                        selectedFileIndex === index ? 'bg-indigo-50 border-indigo-200' : ''
                                      }`}
                                    >
                                      <div className="flex items-start space-x-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                          isPDF ? 'bg-red-100' : 
                                          isDocument ? 'bg-blue-100' : 
                                          isImage ? 'bg-green-100' : 'bg-gray-100'
                                        }`}>
                                          <i className={`fa-solid ${
                                            isPDF ? 'fa-file-pdf' : 
                                            isDocument ? 'fa-file-alt' : 
                                            isImage ? 'fa-image' : 'fa-file'
                                          } ${
                                            isPDF ? 'text-red-600' : 
                                            isDocument ? 'text-blue-600' : 
                                            isImage ? 'text-green-600' : 'text-gray-600'
                                          } text-lg`}></i>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-gray-900 truncate" title={fileName}>
                                            {fileName}
                                          </p>
                                          <p className="text-sm text-gray-500 capitalize">
                                            {fileType.replace('_', ' ')}
                                          </p>
                                          {selectedFileIndex === index && (
                                            <div className="mt-1">
                                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                                Currently viewing
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              
                              {/* File Actions */}
                              <div className="p-4 border-t border-gray-200 bg-gray-50">
                                <div className="space-y-2">
                                  <button 
                                    onClick={() => {
                                      // Download all files
                                      selectedDonation.attachment_paths.split(',').forEach((path, index) => {
                                        const fileName = selectedDonation.attachment_names?.split(',')[index] || 'file';
                                        let filePath;
                                        if (path.startsWith('http')) {
                                          filePath = path;
                                        } else if (path.includes('\\') || path.includes('C:')) {
                                          const fileName = path.split('\\').pop();
                                          filePath = `http://localhost:3000/uploads/donations/${fileName}`;
                                        } else if (path.startsWith('/uploads/')) {
                                          filePath = `http://localhost:3000${path}`;
                                        } else {
                                          filePath = `http://localhost:3000/uploads/donations/${path}`;
                                        }
                                        const link = document.createElement('a');
                                        link.href = filePath;
                                        link.download = fileName;
                                        link.target = '_blank';
                                        link.rel = 'noopener noreferrer';
                                        link.click();
                                      });
                                    }}
                                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                                  >
                                    <i className="fa-solid fa-download"></i>
                                    <span>Download All Files</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg p-8 border border-gray-200 text-center">
                        <div className="text-gray-400 mb-4">
                          <i className="fa-solid fa-folder-open text-4xl"></i>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Files Attached</h3>
                        <p className="text-gray-500 text-sm">This donation doesn't have any attached files or documents yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Internal Notes Section */}
              <div className="mt-6 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center mr-3">
                      <i className="fa-solid fa-sticky-note text-white"></i>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800">Internal Notes</h4>
                  </div>
                  <button
                    onClick={() => toggleSection('additional')}
                    className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <i className={`fa-solid fa-chevron-${expandedSections.additional ? 'up' : 'down'} text-slate-600 text-sm`}></i>
                  </button>
                </div>
                {expandedSections.additional && (
                  <div className="space-y-4">
                    {/* Add New Note */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex space-x-3">
                        <textarea
                          value={internalNotes}
                          onChange={(e) => setInternalNotes(e.target.value)}
                          placeholder="Add internal note about this donation..."
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
                          rows="3"
                        />
                        <button
                          onClick={handleAddInternalNote}
                          disabled={addingNote || !internalNotes.trim()}
                          className="bg-slate-600 hover:bg-slate-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          {addingNote ? (
                            <i className="fa-solid fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fa-solid fa-plus"></i>
                          )}
                          <span>Add Note</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Existing Notes */}
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">Previous notes will appear here...</p>
                      {/* This would be populated with actual notes from the database */}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Modern Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Donation ID: #{selectedDonation.id}
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedDonation(null);
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Schedule Modal - Museum Branded */}
      {showMeetingModal && selectedDonation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[98vh] sm:max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="relative p-4" style={{background: 'linear-gradient(135deg, #351E10 0%, #2A1A0D 50%, #1A0F08 100%)'}}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E5B80B]/10 to-transparent"></div>
              <div className="relative flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                    <i className="fa-solid fa-calendar-days text-lg text-white"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      Schedule Meeting
                    </h2>
                    <p className="text-[#E5B80B] text-xs mt-1" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      Schedule a meeting with {selectedDonation.donor_name} to discuss their donation
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMeetingModal(false);
                    setShowDetailsModal(true);
                  }}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center justify-center group"
                  title="View Full Donation Details"
                >
                  <i className="fa-solid fa-eye text-white group-hover:scale-110 transition-transform duration-300 text-sm"></i>
                </button>
              </div>
            </div>

            {/* Form Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 bg-gradient-to-br from-gray-50 to-white">

                <form className="space-y-4">
                  {/* Meeting Date */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2 text-gray-800" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      <i className="fa-solid fa-calendar-days mr-2"></i>
                      Schedule Meeting Date
                    </h4>
                    
                    {/* Donor's Preferred Date - Compact */}
                    {selectedDonation.preferred_visit_date && (
                      <div className="mb-2 p-2 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <i className="fa-solid fa-star mr-1 text-amber-600 text-xs"></i>
                            <span className="text-xs font-medium text-amber-800">Donor's Preferred:</span>
                          </div>
                          <div className="text-xs text-amber-700 font-medium">
                            {new Date(selectedDonation.preferred_visit_date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                            {selectedDonation.preferred_visit_time && (
                              <span className="ml-1">
                                at {selectedDonation.preferred_visit_time.includes(':') 
                                  ? selectedDonation.preferred_visit_time.substring(0, 5)
                                  : selectedDonation.preferred_visit_time
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1">
                        <input
                          type="date"
                          value={meetingData.scheduled_date}
                          onChange={(e) => setMeetingData({...meetingData, scheduled_date: e.target.value})}
                          className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                          style={{fontFamily: 'Telegraf, sans-serif', focusRingColor: '#E5B80B'}}
                          required
                        />
                      </div>
                      {selectedDonation.preferred_visit_date && (
                        <button
                          type="button"
                          onClick={() => {
                            console.log('🔄 Use Preferred clicked');
                            console.log('📅 Preferred date:', selectedDonation.preferred_visit_date);
                            console.log('⏰ Preferred time:', selectedDonation.preferred_visit_time);
                            
                            // Handle different date formats
                            let formattedDate = '';
                            if (selectedDonation.preferred_visit_date) {
                              // If it's already in YYYY-MM-DD format, use it directly
                              if (selectedDonation.preferred_visit_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                formattedDate = selectedDonation.preferred_visit_date;
                              } else {
                                // Convert other date formats to YYYY-MM-DD
                                const preferredDate = new Date(selectedDonation.preferred_visit_date);
                                if (!isNaN(preferredDate.getTime())) {
                                  formattedDate = preferredDate.toISOString().split('T')[0];
                                }
                              }
                            }
                            
                            console.log('📅 Formatted date:', formattedDate);
                            
                            // Handle time format
                            let formattedTime = '';
                            if (selectedDonation.preferred_visit_time) {
                              // If time is in HH:MM:SS format, convert to HH:MM
                              if (selectedDonation.preferred_visit_time.includes(':')) {
                                formattedTime = selectedDonation.preferred_visit_time.substring(0, 5);
                              } else {
                                formattedTime = selectedDonation.preferred_visit_time;
                              }
                            }
                            
                            console.log('⏰ Formatted time:', formattedTime);
                            
                            setMeetingData({
                              ...meetingData, 
                              scheduled_date: formattedDate || '',
                              scheduled_time: formattedTime || ''
                            });
                            
                            console.log('✅ Updated meetingData:', {
                              scheduled_date: formattedDate || '',
                              scheduled_time: formattedTime || ''
                            });
                          }}
                          className="bg-gradient-to-r from-[#E5B80B] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#B8941F] text-white px-3 py-2 rounded-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl whitespace-nowrap text-sm"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                          title="Use donor's preferred date and time"
                        >
                          <i className="fa-solid fa-calendar-check mr-1 text-xs"></i>
                          Use Preferred
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Time and Location */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold mb-3 text-gray-800" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      <i className="fa-solid fa-clock mr-2"></i>
                      Meeting Time & Location
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>Meeting Time *</label>
                        <input
                          type="time"
                          value={meetingData.scheduled_time}
                          onChange={(e) => setMeetingData({...meetingData, scheduled_time: e.target.value})}
                          className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                          style={{fontFamily: 'Telegraf, sans-serif', focusRingColor: '#E5B80B'}}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>Location *</label>
                        <input
                          type="text"
                          value={meetingData.location}
                          onChange={(e) => setMeetingData({...meetingData, location: e.target.value})}
                          className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                          style={{fontFamily: 'Telegraf, sans-serif', focusRingColor: '#E5B80B'}}
                          placeholder="e.g., Museum Conference Room"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Staff Member */}
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold mb-3 text-gray-800" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      <i className="fa-solid fa-user mr-2"></i>
                      Staff Member
                    </h4>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>Staff Member *</label>
                      <input
                        type="text"
                        value={meetingData.staff_member}
                        onChange={(e) => setMeetingData({...meetingData, staff_member: e.target.value})}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{fontFamily: 'Telegraf, sans-serif', focusRingColor: '#E5B80B'}}
                        placeholder="Staff member name"
                        required
                      />
                    </div>
                  </div>

                  {/* Meeting Notes */}
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold mb-3 text-gray-800" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      <i className="fa-solid fa-sticky-note mr-2"></i>
                      Meeting Notes
                    </h4>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>Additional Notes</label>
                      <textarea
                        value={meetingData.meeting_notes}
                        onChange={(e) => setMeetingData({...meetingData, meeting_notes: e.target.value})}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                        style={{fontFamily: 'Telegraf, sans-serif', focusRingColor: '#E5B80B'}}
                        rows="2"
                        placeholder="Additional notes for the meeting..."
                      />
                    </div>
                  </div>

                  {/* Alternative Dates */}
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold mb-3 text-gray-800" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      <i className="fa-solid fa-calendar-days mr-2"></i>
                      Alternative Dates (Optional)
                    </h4>
                    <div className="space-y-2">
                      {meetingData.suggested_alternative_dates.map((date, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="flex-1">
                            <input
                              type="date"
                              value={date}
                              onChange={(e) => {
                                const newDates = [...meetingData.suggested_alternative_dates];
                                newDates[index] = e.target.value;
                                setMeetingData({...meetingData, suggested_alternative_dates: newDates});
                              }}
                              className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                              style={{fontFamily: 'Telegraf, sans-serif', focusRingColor: '#E5B80B'}}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newDates = meetingData.suggested_alternative_dates.filter((_, i) => i !== index);
                              setMeetingData({...meetingData, suggested_alternative_dates: newDates});
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-2 rounded-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl text-sm"
                            style={{fontFamily: 'Telegraf, sans-serif'}}
                            title="Remove this date"
                          >
                            <i className="fa-solid fa-times text-xs"></i>
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setMeetingData({
                            ...meetingData, 
                            suggested_alternative_dates: [...meetingData.suggested_alternative_dates, ""]
                          });
                        }}
                        className="bg-gradient-to-r from-[#E5B80B] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#B8941F] text-white px-3 py-2 rounded-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl text-sm"
                        style={{fontFamily: 'Telegraf, sans-serif'}}
                      >
                        <i className="fa-solid fa-plus mr-1 text-xs"></i>
                        Add Alternative Date
                      </button>
                    </div>
                    <p className="text-xs text-yellow-800 mt-2" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      These dates will be included in the email to the donor as alternatives if the main date doesn't work.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        console.log('🔄 Cancel button clicked - closing meeting modal');
                        setShowMeetingModal(false);
                        setSelectedDonation(null);
                        // Reset form data
                        setMeetingData({
                          scheduled_date: "",
                          scheduled_time: "",
                          location: "Museum",
                          staff_member: "",
                          meeting_notes: "",
                          suggested_alternative_dates: []
                        });
                        console.log('✅ Meeting modal closed and form reset');
                      }}
                      className="flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-300 shadow-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
                      style={{fontFamily: 'Telegraf, sans-serif'}}
                    >
                      <i className="fa-solid fa-times mr-1 text-xs"></i>
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleScheduleMeeting();
                      }}
                      className="flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-300 shadow-lg text-sm"
                      style={{background: 'linear-gradient(135deg, #8B6B21 0%, #D4AF37 100%)', color: 'white', fontFamily: 'Telegraf, sans-serif'}}
                    >
                      <i className="fa-solid fa-calendar mr-1 text-xs"></i>
                      Schedule Meeting
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* City Hall Submission Modal - Simple & Clean */}
      {showCityHallModal && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            {/* Simple Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-building text-amber-600"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Submit to City Hall</h3>
                  <p className="text-sm text-gray-500">Processing donation from {selectedDonation.donor_name}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCityHallModal(false);
                  setSelectedDonation(null);
                  setCityHallData({
                    submission_documents: "",
                    city_hall_reference: "",
                    notes: "",
                    submission_files: []
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            {/* Simple Form Content */}
            <div className="p-6 space-y-4">
              {/* Submission Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fa-solid fa-file-text mr-2 text-amber-600"></i>
                  Submission Documents
                </label>
                <textarea
                  value={cityHallData.submission_documents}
                  onChange={(e) => setCityHallData({...cityHallData, submission_documents: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  rows="3"
                  placeholder="List all documents submitted to city hall..."
                />
              </div>

              {/* City Hall Reference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fa-solid fa-hashtag mr-2 text-amber-600"></i>
                  City Hall Reference
                </label>
                <input
                  type="text"
                  value={cityHallData.city_hall_reference}
                  onChange={(e) => setCityHallData({...cityHallData, city_hall_reference: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter reference number or ID..."
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fa-solid fa-cloud-upload-alt mr-2 text-amber-600"></i>
                  Upload Document Photos
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-400 hover:bg-amber-50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleCityHallFileUpload}
                    className="hidden"
                    id="city-hall-upload"
                  />
                  <label
                    htmlFor="city-hall-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <i className="fa-solid fa-cloud-upload-alt text-3xl text-gray-400"></i>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Click to upload files</p>
                      <p className="text-xs text-gray-500">JPG, PNG, GIF, PDF (max 10MB each)</p>
                    </div>
                  </label>
                </div>
                
                {/* Uploaded Files */}
                {cityHallData.submission_files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Uploaded Files</span>
                      <span className="text-xs text-gray-500">{cityHallData.submission_files.length} file(s)</span>
                    </div>
                    <div className="space-y-2">
                      {cityHallData.submission_files.map((file, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-10 h-10 object-cover rounded border"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                              <i className="fa-solid fa-file-pdf text-red-600"></i>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <button
                            onClick={() => removeCityHallFile(index)}
                            className="text-red-500 hover:text-red-700 p-1 rounded"
                          >
                            <i className="fa-solid fa-trash text-sm"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fa-solid fa-sticky-note mr-2 text-amber-600"></i>
                  Additional Notes
                </label>
                <textarea
                  value={cityHallData.notes}
                  onChange={(e) => setCityHallData({...cityHallData, notes: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  rows="3"
                  placeholder="Add any additional notes or comments..."
                />
              </div>
            </div>

            {/* Simple Action Buttons */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCityHallModal(false);
                  setSelectedDonation(null);
                  setCityHallData({
                    submission_documents: "",
                    city_hall_reference: "",
                    notes: "",
                    submission_files: []
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitToCityHall}
                disabled={isSubmittingToCityHall}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isSubmittingToCityHall 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {isSubmittingToCityHall ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-building mr-2"></i>
                    Submit to City Hall
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Approval Modal */}
      {showFinalApproveModal && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-[#2e2b41]">
                <i className="fa-solid fa-star mr-2"></i>
                Final Approval
              </h3>
              <button
                onClick={() => {
                  setShowFinalApproveModal(false);
                  setShowDetailsModal(true);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                title="View Full Donation Details"
              >
                <i className="fa-solid fa-eye"></i>
                <span>View Details</span>
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Give final approval for {selectedDonation.donor_name}'s donation and send gratitude email.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">Museum Admin Name</label>
                <input
                  type="text"
                  value={finalApproveData.museum_admin_name}
                  onChange={(e) => setFinalApproveData({...finalApproveData, museum_admin_name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  placeholder="Enter museum admin or director name..."
                />
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">Approval Notes</label>
                <textarea
                  value={finalApproveData.notes}
                  onChange={(e) => setFinalApproveData({...finalApproveData, notes: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  rows="3"
                  placeholder="Final approval notes..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  console.log('🔄 Final Approve modal cancel button clicked');
                  setShowFinalApproveModal(false);
                  setSelectedDonation(null);
                  // Reset form data
                  setFinalApproveData({
                    notes: "",
                    museum_admin_name: ""
                  });
                  console.log('✅ Final Approve modal closed and form reset');
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalApprove}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                <i className="fa-solid fa-star mr-1"></i>
                Final Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Notification */}
      {notification.show && (
        console.log('🔔 Rendering notification:', notification) ||
        console.log('🔔 Notification state:', {show: notification.show, type: notification.type, title: notification.title}) ||
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 transform transition-all duration-300 scale-100 opacity-100 border-l-4 border-red-500">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <i className="fa-solid fa-exclamation-triangle text-red-600 text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    {confirmationModal.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    Please confirm your action
                  </p>
                </div>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-700 text-lg mb-4" style={{fontFamily: 'Telegraf, sans-serif'}}>
                {confirmationModal.message}
              </p>
              {confirmationModal.description && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-800 whitespace-pre-line" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    {confirmationModal.description}
                  </p>
                </div>
              )}
            </div>
            
            {/* Modal Actions */}
            <div className="flex gap-3 p-6 pt-0">
              {confirmationModal.onCancel ? (
                // Meeting completion modal with Yes/No buttons
                <>
                  <button
                    onClick={() => {
                      setConfirmationModal({...confirmationModal, show: false});
                      if (confirmationModal.onCancel) {
                        confirmationModal.onCancel();
                      }
                    }}
                    className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 shadow-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                    style={{fontFamily: 'Telegraf, sans-serif'}}
                  >
                    <i className="fa-solid fa-times mr-2"></i>
                    No
                  </button>
                  <button
                    onClick={() => {
                      setConfirmationModal({...confirmationModal, show: false});
                      if (confirmationModal.onConfirm) {
                        confirmationModal.onConfirm();
                      }
                    }}
                    className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 shadow-lg bg-green-600 hover:bg-green-700 text-white"
                    style={{fontFamily: 'Telegraf, sans-serif'}}
                  >
                    <i className="fa-solid fa-check mr-2"></i>
                    Yes
                  </button>
                </>
              ) : (
                // Standard confirmation modal with Cancel/Delete buttons
                <>
                  <button
                    onClick={() => setConfirmationModal({...confirmationModal, show: false})}
                    className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 shadow-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                    style={{fontFamily: 'Telegraf, sans-serif'}}
                  >
                    <i className="fa-solid fa-times mr-2"></i>
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setConfirmationModal({...confirmationModal, show: false});
                      if (confirmationModal.onConfirm) {
                        confirmationModal.onConfirm();
                      }
                    }}
                    className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 shadow-lg bg-red-600 hover:bg-red-700 text-white"
                    style={{fontFamily: 'Telegraf, sans-serif'}}
                  >
                    <i className="fa-solid fa-trash mr-2"></i>
                    {confirmationModal.title === 'Reject Donation' ? 'Reject' : 'Delete'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stage Advancement Modal */}
      {showStageAdvancementModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="relative p-6" style={{background: 'linear-gradient(135deg, #351E10 0%, #2A1A0D 50%, #1A0F08 100%)'}}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E5B80B]/10 to-transparent"></div>
              <div className="relative flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                  <i className="fa-solid fa-arrow-up text-lg text-white"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    Advance Stage
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Add notes for this stage advancement (optional)
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  Notes (Optional)
                </label>
                <textarea
                  value={stageAdvancementNotes}
                  onChange={(e) => setStageAdvancementNotes(e.target.value)}
                  placeholder="Enter any notes for this stage advancement..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E5B80B] focus:border-transparent resize-none"
                  rows="4"
                  style={{fontFamily: 'Telegraf, sans-serif'}}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => {
                  setShowStageAdvancementModal(false);
                  setDonationToAdvance(null);
                  setStageAdvancementNotes('');
                }}
                className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 shadow-lg bg-gray-500 hover:bg-gray-600 text-white"
                style={{fontFamily: 'Telegraf, sans-serif'}}
              >
                Cancel
              </button>
              <button
                onClick={confirmAdvanceStage}
                className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 shadow-lg"
                style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
              >
                <i className="fa-solid fa-arrow-up mr-2"></i>
                Advance Stage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donation;
