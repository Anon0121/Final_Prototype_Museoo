import React, { useState, useEffect } from "react";
import api from "../../config/api";
const SLOT_CAPACITY = 30;
const SLOT_API = "/api/slots";

const Schedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    visitorType: "",
    gender: "",
    address: "",
    purpose: "",
    institution: "",
    visitType: "indwalkin", // indwalkin or groupwalkin
    visitDate: "",
    selectedSlot: "",
    status: "Pending",
  });
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
    onCancel: null
  });
  
  // New state for filtering and search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showArchive, setShowArchive] = useState(false);
  const [additionalVisitors, setAdditionalVisitors] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [modalVisitors, setModalVisitors] = useState([]);
  const [expandedBookings, setExpandedBookings] = useState(new Set());
  const [additionalVisitorsData, setAdditionalVisitorsData] = useState({});
  const [visitorsPerPage, setVisitorsPerPage] = useState(6); // Show 6 visitors per page
  const [visitorPages, setVisitorPages] = useState({}); // Track current page for each booking

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("visitors");
    if (saved) setSchedules(JSON.parse(saved));
  }, []);

  // Save to localStorage whenever schedules change
  useEffect(() => {
    localStorage.setItem("visitors", JSON.stringify(schedules));
  }, [schedules]);

  // Fetch slots when date changes
  useEffect(() => {
    if (!form.visitDate) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    api.get(`${SLOT_API}?date=${form.visitDate}`)
      .then(response => {
        setSlots(Array.isArray(response.data) ? response.data : []);
        setLoadingSlots(false);
      })
      .catch(() => {
        setSlots([]);
        setLoadingSlots(false);
      });
  }, [form.visitDate]);

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const response = await api.get('/api/slots/all');
      setBookings(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      visitorType: "",
      gender: "",
      address: "",
      purpose: "",
      institution: "",
      visitType: "indwalkin",
      visitDate: "",
      selectedSlot: "",
      status: "Pending",
    });
    setAdditionalVisitors([]);
  };

  const handleSlotSelect = (slotTime) => {
    // Toggle selection - if clicking the same slot, unselect it
    setForm({ ...form, selectedSlot: form.selectedSlot === slotTime ? "" : slotTime });
  };

  const addSchedule = async (e) => {
    e.preventDefault();
    if (!form.selectedSlot) return;
    
    setSubmitting(true);

    // Determine the booking type based on visit type
    let bookingType;
    if (form.visitType === "indwalkin") {
      bookingType = "ind-walkin";
    } else if (form.visitType === "groupwalkin") {
      bookingType = "group-walkin";
    }
    
    // Prepare the payload based on booking type
    let payload;
    
    if (form.visitType === "indwalkin") {
      // Ind-Walkin - Individual walk-in (email + date only, 24h expiration)
      payload = {
        type: bookingType,
        mainVisitor: {
          firstName: "Walk-in",
          lastName: "Visitor",
          email: form.email,
          gender: "",
          address: "",
          visitorType: "",
          purpose: "",
          institution: ""
        },
        groupMembers: [],
        totalVisitors: 1,
        date: form.visitDate,
        time: form.selectedSlot,
      };
    } else if (form.visitType === "groupwalkin") {
      // Group-Walkin - Group walk-in (primary + additional emails, 24h expiration)
      payload = {
        type: bookingType,
        mainVisitor: {
          firstName: "Group",
          lastName: "Leader",
          email: form.email,
          gender: "",
          address: "",
          visitorType: "",
          purpose: "",
          institution: ""
        },
        groupMembers: additionalVisitors.map(visitor => ({
          firstName: "",
          lastName: "",
          email: visitor.email
        })),
        totalVisitors: 1 + additionalVisitors.length,
        date: form.visitDate,
        time: form.selectedSlot,
      };
    }

    try {
      console.log('Sending booking payload:', payload);
      const response = await api.post("/api/slots/book", payload);
      
      if (response.data) {
        const result = response.data;
        
        // Show success message with booking details
        let successTitle = 'Schedule Created Successfully!';
        let successMessage = `Booking ID: ${result.booking_id}\nType: ${bookingType}\nTotal Visitors: ${payload.totalVisitors}`;
        let successDescription = '';
        
        if (form.visitType === "indwalkin") {
          successDescription = 'Ind-Walkin booking created successfully! It is now pending approval. Once approved, the visitor will receive an email with QR code and link to complete their profile (24-hour expiration).';
        } else if (form.visitType === "groupwalkin") {
          successDescription = 'Group-Walkin booking created successfully! It is now pending approval. Once approved, all visitors will receive emails with QR codes and profile completion links (24-hour expiration).';
        }
        
        setNotification({
          show: true,
          type: 'success',
          title: successTitle,
          message: successMessage,
          description: successDescription
        });
        
        // Reset form
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          visitorType: "",
          gender: "",
          address: "",
          purpose: "",
          institution: "",
          visitType: "indwalkin",
          visitDate: "",
          selectedSlot: "",
          status: "Pending",
        });
        setAdditionalVisitors([]);
        setShowAddModal(false);
        fetchBookings();
      } else {
        setNotification({
          show: true,
          type: 'error',
          title: 'Failed to Create Schedule',
          message: response.data.message || 'Unknown error occurred',
          description: ''
        });
      }
    } catch (err) {
      console.error("Error adding booking:", err);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error Creating Schedule',
        message: 'An unexpected error occurred. Please try again.',
        description: ''
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = (id, status) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  const deleteSchedule = async (bookingId) => {
    setConfirmationModal({
      show: true,
      title: 'Delete Schedule',
      message: 'Are you sure you want to delete this schedule? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmationModal({ show: false, title: '', message: '', onConfirm: null, onCancel: null });
        try {
          const response = await api.delete(`/api/slots/bookings/${bookingId}`);
          if (response.data.success) {
            setNotification({
              show: true,
              type: 'success',
              title: 'Schedule Deleted Successfully!',
              message: 'The booking has been permanently removed from the system.',
              description: ''
            });
            fetchBookings(); // Refresh the list
          } else {
            setNotification({
              show: true,
              type: 'error',
              title: 'Failed to Delete Schedule',
              message: response.data.message || 'There was an error deleting the booking. Please try again.',
              description: ''
            });
          }
        } catch (error) {
          console.error('Error deleting booking:', error);
          setNotification({
            show: true,
            type: 'error',
            title: 'Error Deleting Schedule',
            message: error.response?.data?.message || 'An unexpected error occurred. Please try again.',
            description: ''
          });
        }
      },
      onCancel: () => {
        setConfirmationModal({ show: false, title: '', message: '', onConfirm: null, onCancel: null });
      }
    });
  };

  // New action handlers for booking management
  const handleViewBooking = async (booking) => {
    try {
      setSelectedBooking(booking);
      setShowBookingModal(true);
      
      // Set basic booking details from the booking object
      setBookingDetails({
        first_name: booking.first_name,
        last_name: booking.last_name,
        email: booking.email,
        institution: booking.institution
      });

      // Fetch ALL visitors for this booking
      console.log('🔍 Booking type:', booking.type);
      console.log('🔍 Booking ID:', booking.booking_id);
      console.log('🔍 Total visitors:', booking.total_visitors);
      
      console.log('🔍 Fetching all visitors for booking...');
      try {
        const visitorsResponse = await api.get(`/api/additional-visitors/booking/${booking.booking_id}`);
        console.log('🔍 Visitors response status:', visitorsResponse.status);
        console.log('🔍 Visitors response URL:', `/api/additional-visitors/booking/${booking.booking_id}`);
        
        if (visitorsResponse.data) {
          const visitorsData = visitorsResponse.data;
          console.log('🔍 All visitors data:', visitorsData);
          console.log('🔍 Visitors array length:', visitorsData.visitors?.length || 0);
          setModalVisitors(visitorsData.visitors || []);
        } else {
          const errorText = await visitorsResponse.text();
          console.log('🔍 Visitors response error:', errorText);
          setModalVisitors([]);
        }
      } catch (error) {
        console.error('Error fetching visitors:', error);
        setModalVisitors([]);
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      setBookingDetails(null);
      setModalVisitors([]);
    }
  };

  const handleApproveBooking = async (booking) => {
    setConfirmationModal({
      show: true,
      title: 'Approve Booking',
      message: `Are you sure you want to approve the booking for ${booking.first_name} ${booking.last_name}?`,
      onConfirm: async () => {
        setConfirmationModal({ show: false, title: '', message: '', onConfirm: null, onCancel: null });
        try {
        const response = await api.put(`/api/slots/bookings/${booking.booking_id}/approve`, { status: 'approved' });

        if (response.data.success) {
          setNotification({
            show: true,
            type: 'success',
            title: 'Schedule Approved Successfully!',
            message: 'The booking has been approved and notifications have been sent.',
            description: ''
          });
          fetchBookings(); // Only refresh if success
        } else {
          setNotification({
            show: true,
            type: 'error',
            title: 'Failed to Approve Schedule',
            message: response.data.message || 'Unknown error occurred',
            description: ''
          });
          // Do NOT refresh bookings, so status/button stays as pending
        }
      } catch (error) {
        console.error('Error approving booking:', error);
        setNotification({
          show: true,
          type: 'error',
          title: 'Error Approving Schedule',
          message: 'An unexpected error occurred. Please try again.',
          description: ''
        });
        // Do NOT refresh bookings, so status/button stays as pending
      }
      },
      onCancel: () => {
        setConfirmationModal({ show: false, title: '', message: '', onConfirm: null, onCancel: null });
      }
    });
  };

  const handleCancelBooking = async (booking) => {
    setConfirmationModal({
      show: true,
      title: 'Cancel Booking',
      message: `Are you sure you want to cancel the booking for ${booking.first_name} ${booking.last_name}?`,
      onConfirm: async () => {
        setConfirmationModal({ show: false, title: '', message: '', onConfirm: null, onCancel: null });
        try {
        const response = await api.put(`/api/slots/bookings/${booking.booking_id}/cancel`, { status: 'cancelled' });
        if (response.data.success) {
          setNotification({
            show: true,
            type: 'success',
            title: 'Schedule Cancelled Successfully!',
            message: 'The booking has been cancelled and notifications have been sent.',
            description: ''
          });
          fetchBookings(); // Refresh the list
        } else {
          setNotification({
            show: true,
            type: 'error',
            title: 'Failed to Cancel Schedule',
            message: response.data.message || 'There was an error cancelling the booking. Please try again.',
            description: ''
          });
        }
      } catch (error) {
        console.error('Error cancelling booking:', error);
        setNotification({
          show: true,
          type: 'error',
          title: 'Error Cancelling Schedule',
          message: 'An unexpected error occurred. Please try again.',
          description: ''
        });
      }
      },
      onCancel: () => {
        setConfirmationModal({ show: false, title: '', message: '', onConfirm: null, onCancel: null });
      }
    });
  };

  // Separate current and archived bookings
  const currentBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    return bookingDate >= fiveDaysAgo;
  });

  const archivedBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    return bookingDate < fiveDaysAgo;
  });

  // Filter bookings based on search and filters
  const filteredBookings = (showArchive ? archivedBookings : currentBookings).filter(booking => {
    const matchesSearch = searchTerm === "" || 
      `${booking.first_name} ${booking.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const matchesDate = dateFilter === "" || booking.date === dateFilter;
    const matchesType = typeFilter === "all" || booking.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesDate && matchesType;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Sort by creation date (latest first)

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      'checked-in': "bg-blue-100 text-blue-800 border-blue-200",
      cancelled: "bg-red-100 text-red-800 border-red-200"
    };
    
    return `px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[status?.toLowerCase()] || statusStyles.pending}`;
  };

  // Map database status to display status
  const getDisplayStatus = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'approved': 'Approved',
      'checked-in': 'Visited',
      'cancelled': 'Cancelled'
    };
    
    return statusMap[status?.toLowerCase()] || status;
  };

  // Handle visitor pagination
  const goToVisitorPage = (bookingId, page) => {
    setVisitorPages(prev => ({
      ...prev,
      [bookingId]: page
    }));
  };

  // Get paginated visitors for a booking
  const getPaginatedVisitors = (bookingId, allVisitors) => {
    // Sort visitors alphabetically by last name, then first name
    const sortedVisitors = [...allVisitors].sort((a, b) => {
      const aLastName = (a.lastName || '').toLowerCase();
      const bLastName = (b.lastName || '').toLowerCase();
      const aFirstName = (a.firstName || '').toLowerCase();
      const bFirstName = (b.firstName || '').toLowerCase();
      
      // First sort by last name
      if (aLastName !== bLastName) {
        return aLastName.localeCompare(bLastName);
      }
      // If last names are the same, sort by first name
      return aFirstName.localeCompare(bFirstName);
    });
    
    const currentPage = visitorPages[bookingId] || 0;
    const startIndex = currentPage * visitorsPerPage;
    const endIndex = startIndex + visitorsPerPage;
    return sortedVisitors.slice(startIndex, endIndex);
  };

  // Get total pages for a booking
  const getTotalPages = (bookingId, allVisitors) => {
    return Math.ceil(allVisitors.length / visitorsPerPage);
  };

  // Toggle expanded booking details
  const toggleBookingDetails = async (bookingId, booking) => {
    const newExpanded = new Set(expandedBookings);
    
    if (newExpanded.has(bookingId)) {
      newExpanded.delete(bookingId);
    } else {
      newExpanded.add(bookingId);
      
      // Fetch additional visitors if they exist and we don't have them yet
      if (booking.total_visitors > 1 && !additionalVisitorsData[bookingId]) {
        try {
          const visitorsResponse = await api.get(`/api/additional-visitors/booking/${bookingId}`);
          if (visitorsResponse.data) {
            const visitorsData = visitorsResponse.data;
            
            // Filter to only show additional visitors (not main visitors) and remove duplicates
            const allVisitors = visitorsData.visitors || [];
            
            // Remove duplicates based on visitorId
            const uniqueVisitors = allVisitors.filter((visitor, index, self) => 
              index === self.findIndex(v => v.visitorId === visitor.visitorId)
            );
            
            // Filter to only show additional visitors (not main visitors)
            const additionalVisitorsOnly = uniqueVisitors.filter(visitor => 
              !visitor.isMainVisitor
            );
            
            setAdditionalVisitorsData(prev => ({
              ...prev,
              [bookingId]: additionalVisitorsOnly
            }));
          }
        } catch (error) {
          console.error('Error fetching additional visitors:', error);
        }
      }
    }
    
    setExpandedBookings(newExpanded);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
              <i className="fa-solid fa-calendar mr-3" style={{color: '#E5B80B'}}></i>
              {showArchive ? 'Schedule Archive' : 'Schedule Management'}
            </h1>
            <p className="text-sm md:text-base" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
              {showArchive 
                ? `Archived schedules (older than 5 days) - ${archivedBookings.length} records` 
                : 'Manage museum visit schedules and bookings'
              }
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-0">
            <button
              onClick={() => setShowArchive(!showArchive)}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-lg transition-colors font-semibold shadow-md text-sm md:text-base ${
                showArchive 
                  ? 'text-white hover:bg-gray-700' 
                  : 'text-white hover:bg-blue-700'
              }`}
              style={{
                backgroundColor: showArchive ? '#351E10' : '#351E10',
                fontFamily: 'Telegraph, sans-serif'
              }}
            >
              <i className={`fa-solid ${showArchive ? 'fa-calendar' : 'fa-archive'} mr-2`}></i>
              {showArchive ? 'Current Schedules' : 'View Archive'}
            </button>
            {!showArchive && (
              <button
                onClick={() => setShowAddModal(true)}
                className="text-black px-4 md:px-6 py-2 md:py-3 rounded-lg hover:opacity-90 transition-colors font-semibold shadow-md text-sm md:text-base"
                style={{backgroundColor: '#E5B80B', fontFamily: 'Telegraph, sans-serif'}}
              >
                <i className="fa-solid fa-plus mr-2"></i>
                Add Schedule
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[98vh] sm:max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="relative p-8" style={{background: 'linear-gradient(135deg, #351E10 0%, #2A1A0D 50%, #1A0F08 100%)'}}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E5B80B]/10 to-transparent"></div>
              <div className="relative flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                    <i className="fa-solid fa-calendar-plus text-2xl text-white"></i>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      Create New Schedule
                    </h2>
                    <p className="text-[#E5B80B] text-sm mt-1" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      Add a new booking to your museum's schedule
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeAddModal}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center justify-center group"
                >
                  <svg className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-8 bg-gradient-to-br from-gray-50 to-white">
          <form id="schedule-form" onSubmit={addSchedule} className="space-y-6">
            {/* Visit Type Selection */}
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                <i className="fa-solid fa-users mr-2"></i>
                Visit Type
              </h4>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visitType"
                    value="indwalkin"
                    checked={form.visitType === "indwalkin"}
                    onChange={handleInputChange}
                    className="mr-2"
                    style={{accentColor: '#E5B80B'}}
                  />
                  <span className="text-sm font-medium" style={{fontFamily: 'Telegraph, sans-serif'}}>Ind-Walkin</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visitType"
                    value="groupwalkin"
                    checked={form.visitType === "groupwalkin"}
                    onChange={handleInputChange}
                    className="mr-2"
                    style={{accentColor: '#E5B80B'}}
                  />
                  <span className="text-sm font-medium" style={{fontFamily: 'Telegraph, sans-serif'}}>Group-Walkin</span>
                </label>
              </div>
            </div>

            {/* Primary Visitor Information */}
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                <i className="fa-solid fa-user mr-2"></i>
                Primary Visitor Information
              </h4>
              
              {form.visitType === "indwalkin" ? (
                // Ind-Walkin - Individual walk-in (email + date only, 24h expiration)
                <div>
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center">
                      <i className="fa-solid fa-clock text-orange-600 mr-2"></i>
                      <span className="text-sm text-orange-800" style={{fontFamily: 'Telegraph, sans-serif'}}>
                        <strong>Ind-Walkin:</strong> Individual walk-in booking. Only email and date required. 
                        Link expires in 24 hours. Requires approval before email is sent.
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <Input label="Email" type="email" name="email" value={form.email} onChange={handleInputChange} required />
                    <Input 
                      label="Visit Date" 
                      type="date" 
                      name="visitDate" 
                      value={form.visitDate} 
                      onChange={handleInputChange} 
                      required 
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              ) : (
                // Group-Walkin - Group walk-in (primary + additional emails, 24h expiration)
                <div>
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <i className="fa-solid fa-users text-red-600 mr-2"></i>
                      <span className="text-sm text-red-800" style={{fontFamily: 'Telegraph, sans-serif'}}>
                        <strong>Group-Walkin:</strong> Group walk-in booking. Primary visitor info + additional emails. 
                        Links expire in 24 hours. Requires approval before emails are sent.
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <Input label="Primary Visitor Email" type="email" name="email" value={form.email} onChange={handleInputChange} required />
                  </div>
                  
                  {/* Additional Visitors Section */}
                  <div className="mt-6 bg-green-50 p-4 rounded-lg">
                    <h5 className="text-md font-semibold mb-3" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                      <i className="fa-solid fa-users mr-2"></i>
                      Additional Visitors
                    </h5>
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <i className="fa-solid fa-exclamation-triangle text-yellow-600 mr-2"></i>
                        <span className="text-sm text-yellow-800" style={{fontFamily: 'Telegraph, sans-serif'}}>
                          <strong>Note:</strong> Each additional visitor will receive an individual email with QR code and form link. 
                          All links expire in 24 hours. Maximum 29 additional visitors allowed.
                        </span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-2" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                        Number of Additional Visitors
                      </label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number"
                          min="0"
                          max="29"
                          maxLength="2"
                          value={additionalVisitors.length === 0 ? "" : additionalVisitors.length} 
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            // Only allow 2 digits maximum
                            if (inputValue.length > 2) return;
                            
                            const count = Math.min(29, Math.max(0, parseInt(inputValue) || 0));
                            setAdditionalVisitors(Array(count).fill().map((_, i) => ({
                              id: i,
                              email: ''
                            })));
                          }}
                          onKeyPress={(e) => {
                            // Only allow numbers and prevent more than 2 digits
                            if (!/[0-9]/.test(e.key) || e.target.value.length >= 2) {
                              e.preventDefault();
                            }
                          }}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                          style={{fontFamily: 'Telegraph, sans-serif', focusRingColor: '#E5B80B'}}
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-600" style={{fontFamily: 'Telegraph, sans-serif'}}>
                          additional visitors (Total: {additionalVisitors.length + 1})
                        </span>
                        {additionalVisitors.length >= 29 && (
                          <span className="text-xs text-red-600 font-medium" style={{fontFamily: 'Telegraph, sans-serif'}}>
                            Maximum limit reached
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {additionalVisitors.map((visitor, index) => (
                      <div key={visitor.id} className="bg-white p-4 rounded-lg border border-gray-200 mb-3">
                        <h6 className="text-sm font-semibold mb-3" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                          Additional Visitor {index + 1}
                        </h6>
                        <div className="w-full">
                          <Input 
                            label="Email" 
                            type="email"
                            value={visitor.email}
                            onChange={(e) => {
                              const updated = [...additionalVisitors];
                              updated[index].email = e.target.value;
                              setAdditionalVisitors(updated);
                            }}
                            required
                            placeholder="Enter email address"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Visit Date Section */}
                  <div className="mt-6 bg-purple-50 p-4 rounded-lg">
                    <h5 className="text-md font-semibold mb-3" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                      <i className="fa-solid fa-calendar mr-2"></i>
                      Visit Date
                    </h5>
                    <Input 
                      label="Visit Date" 
                      type="date" 
                      name="visitDate" 
                      value={form.visitDate} 
                      onChange={handleInputChange} 
                      required 
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Time Slot Table */}
            {form.visitDate && (
              <div className="mt-8">
                <h4 className="text-lg font-semibold mb-4" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                  <i className="fa-solid fa-clock mr-2"></i>
                  Select a Time Slot
                </h4>
                {loadingSlots ? (
                  <div className="text-center py-8">
                    <i className="fa-solid fa-spinner fa-spin text-2xl mb-2" style={{color: '#E5B80B'}}></i>
                    <p className="text-gray-600" style={{fontFamily: 'Telegraph, sans-serif'}}>Loading available slots...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.isArray(slots) && slots.map(slot => {
                      if (slot.time === "12:00 - 13:00") return null; // Skip lunch break
                      const availableSlots = slot.capacity - slot.booked;
                      const isSelected = form.selectedSlot === slot.time;
                      const isFull = slot.booked >= slot.capacity;
                      
                      return (
                        <div
                          key={slot.time}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                            isSelected 
                              ? 'text-white shadow-lg' 
                              : isFull
                                ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                                : 'border-gray-200 bg-white hover:shadow-md'
                          }`}
                          style={{
                            borderColor: isSelected ? '#E5B80B' : isFull ? '#d1d5db' : '#e5e7eb',
                            backgroundColor: isSelected ? '#E5B80B' : isFull ? '#f3f4f6' : 'white',
                            '--hover-border-color': '#E5B80B'
                          }}
                          onClick={() => !isFull && handleSlotSelect(slot.time)}
                        >
                          <div className="text-center">
                            <div className={`text-lg font-bold mb-2 ${
                              isSelected ? 'text-white' :
                              isFull ? 'text-gray-500' :
                              availableSlots === 0 ? 'text-red-600' : 
                              availableSlots <= 5 ? 'text-orange-600' : 'text-green-600'
                            }`} style={{fontFamily: 'Telegraph, sans-serif'}}>
                              {availableSlots}
                            </div>
                            <div className={`text-xs font-medium mb-1 ${
                              isSelected ? 'text-white' : 'text-gray-500'
                            }`} style={{fontFamily: 'Telegraph, sans-serif'}}>
                              slots available
                            </div>
                            <div className={`text-sm font-semibold ${
                              isSelected ? 'text-white' : ''
                            }`} style={{color: isSelected ? 'white' : '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                              {slot.time}
                            </div>
                            {isFull && (
                              <div className="text-xs text-red-600 font-medium mt-1" style={{fontFamily: 'Telegraph, sans-serif'}}>
                                FULL
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
          </form>
          
          {/* Action Buttons - Directly below form content */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
            <button
              type="button"
              onClick={closeAddModal}
              className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2 sm:py-2 md:py-3 rounded-lg font-semibold transition-colors shadow-md text-sm sm:text-sm md:text-base order-1 sm:order-1"
              style={{backgroundColor: '#6B7280', color: 'white', fontFamily: 'Telegraf, sans-serif'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#4B5563'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#6B7280'}
            >
              <i className="fa-solid fa-times mr-2"></i>
              Cancel
            </button>
            <button
              type="submit"
              form="schedule-form"
              disabled={submitting}
              className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2 sm:py-2 md:py-3 rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-sm md:text-base order-2 sm:order-2"
              style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
            >
              {submitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  Creating Schedule...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-plus mr-2"></i>
                  Create Schedule
                </>
              )}
            </button>
          </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#E5B80B'}}>
              <i className="fa-solid fa-calendar text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>Total Bookings</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#E5B80B', fontFamily: 'Telegraph, sans-serif'}}>{bookings.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#351E10'}}>
              <i className="fa-solid fa-clock text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>Pending</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                {bookings.filter(b => b.status?.toLowerCase() === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#E5B80B'}}>
              <i className="fa-solid fa-check text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>Approved</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#E5B80B', fontFamily: 'Telegraph, sans-serif'}}>
                {bookings.filter(b => b.status?.toLowerCase() === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#351E10'}}>
              <i className="fa-solid fa-times text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>Cancelled</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                {bookings.filter(b => b.status?.toLowerCase() === 'cancelled').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
              <i className="fa-solid fa-list mr-3" style={{color: '#E5B80B'}}></i>
                All Bookings
            </h1>
            <p className="text-sm md:text-base" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>Manage and view all museum visit bookings</p>
            </div>
            <button
                  onClick={fetchBookings}
            className="px-4 md:px-6 py-2 md:py-3 rounded-lg transition-colors font-semibold shadow-md text-sm md:text-base"
            style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
          >
                  <i className="fa-solid fa-sync-alt mr-2"></i>
                  Refresh
            </button>
          </div>
        </div>

      {/* Bookings Display */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">

        {/* Filters Section */}
        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b">
          <div className="space-y-3">
            {/* Mobile: 2x2 grid, Desktop: 1x4 grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {/* Search */}
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>Search</label>
              <input
                type="text"
                placeholder="Search by visitor name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                  style={{fontFamily: 'Telegraph, sans-serif', focusRingColor: '#E5B80B'}}
              />
            </div>

              {/* Status */}
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                  style={{fontFamily: 'Telegraph, sans-serif', focusRingColor: '#E5B80B'}}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="checked-in">Visited</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date Filter */}
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                  style={{fontFamily: 'Telegraph, sans-serif', focusRingColor: '#E5B80B'}}
              />
            </div>

            {/* Type Filter */}
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                  style={{fontFamily: 'Telegraph, sans-serif', focusRingColor: '#E5B80B'}}
              >
                <option value="all">All Types</option>
                <option value="individual">Individual</option>
                <option value="group">Group</option>
                <option value="ind-walkin">Ind-Walkin</option>
                <option value="group-walkin">Group-Walkin</option>
              </select>
            </div>

            {/* Results Count */}
              <div className="col-span-2 sm:col-span-1 flex items-end">
                <div className="text-white px-4 py-2 rounded-lg font-medium w-full text-center" style={{backgroundColor: '#E5B80B', fontFamily: 'Telegraph, sans-serif'}}>
                {filteredBookings.length} bookings
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto bg-white rounded-lg shadow-lg border border-gray-200">
          {loadingBookings ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <i className="fa-solid fa-spinner fa-spin text-[#AB8841] text-3xl mb-4"></i>
                <p className="text-gray-600 font-['Telegraph']">Loading bookings...</p>
              </div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <i className="fa-solid fa-calendar text-6xl mb-4 text-gray-300"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2 font-['Lora']">No bookings found</h3>
              <p className="text-gray-500 font-['Telegraph']">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
               
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">Created</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">Visitor</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">Date & Time</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">Visitors</th>
                      {!showArchive && (
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBookings.map((booking, index) => (
                      <React.Fragment key={booking.booking_id || index}>
                        <tr className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700 font-medium" style={{fontFamily: 'Telegraph, sans-serif'}}>
                            {formatDate(booking.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                            {booking.first_name} {booking.last_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            booking.type === 'group' 
                              ? 'bg-purple-100 text-purple-800' 
                              : booking.type === 'individual'
                              ? 'bg-blue-100 text-blue-800'
                              : booking.type === 'ind-walkin'
                              ? 'bg-orange-100 text-orange-800'
                              : booking.type === 'group-walkin'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                            }`} style={{fontFamily: 'Telegraph, sans-serif'}}>
                            {booking.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>{formatDate(booking.date)}</div>
                            <div className="text-sm text-gray-500" style={{fontFamily: 'Telegraph, sans-serif'}}>{booking.time_slot}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadge(booking.status)}>
                            {getDisplayStatus(booking.status)}
                          </span>
                        </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                              <i className="fa-solid fa-users mr-2" style={{color: '#E5B80B'}}></i>
                            {booking.total_visitors}
                          </div>
                        </td>
                        {!showArchive && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => toggleBookingDetails(booking.booking_id || index, booking)}
                                  className={`px-3 py-1 rounded-lg border transition-all duration-200 hover:shadow-md ${
                                    expandedBookings.has(booking.booking_id || index) 
                                      ? 'shadow-md' 
                                      : 'hover:shadow-sm'
                                  }`}
                                  style={{
                                    color: expandedBookings.has(booking.booking_id || index) ? '#FFFFFF' : '#351E10',
                                    backgroundColor: expandedBookings.has(booking.booking_id || index) ? '#351E10' : 'transparent',
                                    borderColor: '#351E10', 
                                    fontFamily: 'Telegraph, sans-serif'
                                  }}
                                >
                                  <i className={`fa-solid fa-chevron-${expandedBookings.has(booking.booking_id || index) ? 'up' : 'down'} mr-1`}></i>
                                  {expandedBookings.has(booking.booking_id || index) ? 'Hide Details' : 'Show Details'}
                              </button>
                              {booking.status !== 'cancelled' && (
                                  <button 
                                    className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                                    style={{backgroundColor: '#F59E0B', color: '#FFFFFF', fontFamily: 'Telegraph, sans-serif'}}
                                    onClick={() => handleCancelBooking(booking)}
                                  >
                                    <i className="fa-solid fa-ban mr-1"></i>
                                  Cancel
                                </button>
                              )}
                              {booking.status === 'pending' && (
                                <button
                                    className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                                    style={{backgroundColor: '#10B981', color: '#FFFFFF', fontFamily: 'Telegraph, sans-serif'}}
                                  onClick={() => handleApproveBooking(booking)}
                                >
                                  <i className="fa-solid fa-check mr-1"></i>
                                  Approve
                                </button>
                              )}
                                <button 
                                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                                  style={{backgroundColor: '#EF4444', color: '#FFFFFF', fontFamily: 'Telegraph, sans-serif'}}
                                  onClick={() => deleteSchedule(booking.booking_id)}
                                >
                                <i className="fa-solid fa-trash mr-1"></i>
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                        {/* Expanded Details Row */}
                        {expandedBookings.has(booking.booking_id || index) && (
                          <tr className="bg-gray-50">
                            <td colSpan={showArchive ? "6" : "7"} className="px-6 py-4">
                              <div className="space-y-4">
                                {/* Booking Visitors Section */}
                                <div>
                                  <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-semibold" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                      <i className="fa-solid fa-users mr-2" style={{color: '#E5B80B'}}></i>
                                      Booking Visitors
                                    </h4>
                                    <div className="text-sm font-mono px-3 py-1 rounded-lg" style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                      #{booking.booking_id}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Primary Visitor */}
                                    <div className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                      <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-semibold text-lg" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                          {booking.first_name} {booking.last_name}
                                        </h5>
                                        <span className="inline-flex px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200" style={{fontFamily: 'Telegraph, sans-serif'}}>
                                          <i className="fa-solid fa-crown mr-1"></i>
                                          Primary
                                        </span>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex items-center">
                                          <i className="fa-solid fa-envelope w-4 text-gray-400 mr-2"></i>
                                          <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Email:</span>
                                          <span className="text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                            {booking.email || 'Not provided'}
                                          </span>
                                        </div>
                                        <div className="flex items-center">
                                          <i className="fa-solid fa-user w-4 text-gray-400 mr-2"></i>
                                          <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Gender:</span>
                                          <span className="text-sm capitalize" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                            {booking.gender || 'Not specified'}
                                          </span>
                                        </div>
                                        <div className="flex items-center">
                                          <i className="fa-solid fa-tag w-4 text-gray-400 mr-2"></i>
                                          <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Type:</span>
                                          <span className="text-sm font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700" style={{fontFamily: 'Telegraph, sans-serif'}}>
                                            {booking.type}
                                          </span>
                                        </div>
                                        {booking.institution && (
                                          <div className="flex items-center">
                                            <i className="fa-solid fa-building w-4 text-gray-400 mr-2"></i>
                                            <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Institution:</span>
                                            <span className="text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                              {booking.institution}
                                            </span>
                                          </div>
                                        )}
                                        {booking.address && (
                                          <div className="flex items-center">
                                            <i className="fa-solid fa-map-marker-alt w-4 text-gray-400 mr-2"></i>
                                            <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Address:</span>
                                            <span className="text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                              {booking.address}
                                            </span>
                                          </div>
                                        )}
                                        {booking.purpose_of_visit && (
                                          <div className="flex items-center">
                                            <i className="fa-solid fa-bullseye w-4 text-gray-400 mr-2"></i>
                                            <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Purpose:</span>
                                            <span className="text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                              {booking.purpose_of_visit}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Additional Visitors if any */}
                                    {booking.total_visitors > 1 && (
                                      additionalVisitorsData[booking.booking_id || index] ? (
                                        <>
                                          {getPaginatedVisitors(booking.booking_id || index, additionalVisitorsData[booking.booking_id || index]).map((visitor, visitorIndex) => (
                                          <div key={visitorIndex} className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between mb-3">
                                              <h5 className="font-semibold text-lg" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                                {visitor.firstName} {visitor.lastName}
                                              </h5>
                                              <span className="inline-flex px-3 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200" style={{fontFamily: 'Telegraph, sans-serif'}}>
                                                <i className="fa-solid fa-user-plus mr-1"></i>
                                                Additional
                                              </span>
                                            </div>
                                            <div className="space-y-2">
                                              <div className="flex items-center">
                                                <i className="fa-solid fa-envelope w-4 text-gray-400 mr-2"></i>
                                                <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Email:</span>
                                                <span className="text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                                  {visitor.email || 'Not provided'}
                                                </span>
                                              </div>
                                              <div className="flex items-center">
                                                <i className="fa-solid fa-user w-4 text-gray-400 mr-2"></i>
                                                <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Gender:</span>
                                                <span className="text-sm capitalize" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                                  {visitor.gender || 'Not specified'}
                                                </span>
                                              </div>
                                              {visitor.visitorType && visitor.visitorType !== 'Visitor' && (
                                                <div className="flex items-center">
                                                  <i className="fa-solid fa-tag w-4 text-gray-400 mr-2"></i>
                                                  <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Type:</span>
                                                  <span className="text-sm font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700" style={{fontFamily: 'Telegraph, sans-serif'}}>
                                                    {visitor.visitorType}
                                                  </span>
                                                </div>
                                              )}
                                              {visitor.institution && (
                                                <div className="flex items-center">
                                                  <i className="fa-solid fa-building w-4 text-gray-400 mr-2"></i>
                                                  <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Institution:</span>
                                                  <span className="text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                                    {visitor.institution}
                                                  </span>
                                                </div>
                                              )}
                                              {visitor.address && (
                                                <div className="flex items-center">
                                                  <i className="fa-solid fa-map-marker-alt w-4 text-gray-400 mr-2"></i>
                                                  <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Address:</span>
                                                  <span className="text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                                    {visitor.address}
                                                  </span>
                                                </div>
                                              )}
                                              {visitor.purposeOfVisit && (
                                                <div className="flex items-center">
                                                  <i className="fa-solid fa-bullseye w-4 text-gray-400 mr-2"></i>
                                                  <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Purpose:</span>
                                                  <span className="text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                                    {visitor.purposeOfVisit}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          ))}
                                          
                                          {/* Pagination Controls */}
                                          {additionalVisitorsData[booking.booking_id || index].length > visitorsPerPage && (
                                            <div className="col-span-full flex items-center justify-between mt-4 p-3 bg-gray-50 rounded-lg">
                                              <div className="text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                                Showing {((visitorPages[booking.booking_id || index] || 0) * visitorsPerPage) + 1} to {Math.min(((visitorPages[booking.booking_id || index] || 0) + 1) * visitorsPerPage, additionalVisitorsData[booking.booking_id || index].length)} of {additionalVisitorsData[booking.booking_id || index].length} additional visitors
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <button
                                                  onClick={() => goToVisitorPage(booking.booking_id || index, (visitorPages[booking.booking_id || index] || 0) - 1)}
                                                  disabled={(visitorPages[booking.booking_id || index] || 0) === 0}
                                                  className="px-3 py-1 rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                  style={{color: '#351E10', borderColor: '#351E10', fontFamily: 'Telegraph, sans-serif'}}
                                                >
                                                  <i className="fa-solid fa-chevron-left mr-1"></i>
                                                  Previous
                                                </button>
                                                <span className="text-sm px-2" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                                  Page {(visitorPages[booking.booking_id || index] || 0) + 1} of {getTotalPages(booking.booking_id || index, additionalVisitorsData[booking.booking_id || index])}
                                                </span>
                                                <button
                                                  onClick={() => goToVisitorPage(booking.booking_id || index, (visitorPages[booking.booking_id || index] || 0) + 1)}
                                                  disabled={(visitorPages[booking.booking_id || index] || 0) >= getTotalPages(booking.booking_id || index, additionalVisitorsData[booking.booking_id || index]) - 1}
                                                  className="px-3 py-1 rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                  style={{color: '#351E10', borderColor: '#351E10', fontFamily: 'Telegraph, sans-serif'}}
                                                >
                                                  Next
                                                  <i className="fa-solid fa-chevron-right ml-1"></i>
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <div className="text-sm text-gray-500" style={{fontFamily: 'Telegraph, sans-serif'}}>
                                          Loading additional visitors...
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3 p-2">
                <div className="text-xs text-gray-500 mb-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Mobile View Active (425px detected)</div>
                {filteredBookings.map((booking, index) => (
                  <div key={booking.booking_id || index} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                    {/* Header - Compact */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          booking.type === 'group' 
                            ? 'bg-purple-100 text-purple-800' 
                            : booking.type === 'individual'
                            ? 'bg-blue-100 text-blue-800'
                            : booking.type === 'ind-walkin'
                            ? 'bg-orange-100 text-orange-800'
                            : booking.type === 'group-walkin'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`} style={{fontFamily: 'Telegraph, sans-serif'}}>
                          {booking.type}
                        </span>
                        <span className={getStatusBadge(booking.status)}>
                          {getDisplayStatus(booking.status)}
                        </span>
                      </div>
                      <div className="flex items-center text-xs" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                        <i className="fa-solid fa-users mr-1" style={{color: '#E5B80B'}}></i>
                        {booking.total_visitors}
                      </div>
                    </div>

                    {/* Visitor Info - Compact */}
                    <div className="mb-2">
                      <h3 className="text-base font-semibold" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                        {booking.first_name} {booking.last_name}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-gray-600" style={{fontFamily: 'Telegraph, sans-serif'}}>
                        <span>Created: {formatDate(booking.created_at)}</span>
                        <div className="flex items-center">
                          <i className="fa-solid fa-calendar mr-1" style={{color: '#E5B80B'}}></i>
                          {formatDate(booking.date)} at {booking.time_slot}
                        </div>
                      </div>
                    </div>


                    {/* Expandable Details */}
                    {expandedBookings.has(booking.booking_id || index) && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="space-y-4">
                          {/* Booking Visitors Section */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-semibold" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                <i className="fa-solid fa-users mr-2" style={{color: '#E5B80B'}}></i>
                                Booking Visitors
                              </h4>
                              <div className="text-sm font-mono px-3 py-1 rounded-lg" style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                #{booking.booking_id}
                              </div>
                            </div>
                            <div className="space-y-3">
                              {/* Primary Visitor */}
                              <div className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl border-2 border-gray-200 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="font-semibold text-lg" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                    {booking.first_name} {booking.last_name}
                                  </h5>
                                  <span className="inline-flex px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200" style={{fontFamily: 'Telegraph, sans-serif'}}>
                                    <i className="fa-solid fa-crown mr-1"></i>
                                    Primary
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <i className="fa-solid fa-envelope w-4 text-gray-400 mr-2"></i>
                                    <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Email:</span>
                                    <span className="text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                      {booking.email || 'Not provided'}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <i className="fa-solid fa-user w-4 text-gray-400 mr-2"></i>
                                    <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Gender:</span>
                                    <span className="text-sm capitalize" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                      {booking.gender || 'Not specified'}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <i className="fa-solid fa-tag w-4 text-gray-400 mr-2"></i>
                                    <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Type:</span>
                                    <span className="text-sm font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700" style={{fontFamily: 'Telegraph, sans-serif'}}>
                                      {booking.type}
                                    </span>
                                  </div>
                                  {booking.institution && (
                                    <div className="flex items-center">
                                      <i className="fa-solid fa-building w-4 text-gray-400 mr-2"></i>
                                      <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Institution:</span>
                                      <span className="text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                        {booking.institution}
                                      </span>
                                    </div>
                                  )}
                                  {booking.address && (
                                    <div className="flex items-center">
                                      <i className="fa-solid fa-map-marker-alt w-4 text-gray-400 mr-2"></i>
                                      <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Address:</span>
                                      <span className="text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                        {booking.address}
                                      </span>
                                    </div>
                                  )}
                                  {booking.purpose_of_visit && (
                                    <div className="flex items-center">
                                      <i className="fa-solid fa-bullseye w-4 text-gray-400 mr-2"></i>
                                      <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Purpose:</span>
                                      <span className="text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                        {booking.purpose_of_visit}
                                      </span>
                                    </div>
                                  )}
                                </div>
                    </div>

                              {/* Additional Visitors if any */}
                              {booking.total_visitors > 1 && (
                                additionalVisitorsData[booking.booking_id || index] ? (
                                  <>
                                    {getPaginatedVisitors(booking.booking_id || index, additionalVisitorsData[booking.booking_id || index]).map((visitor, visitorIndex) => (
                                    <div key={visitorIndex} className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl border-2 border-gray-200 shadow-sm">
                                      <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-semibold text-lg" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                          {visitor.firstName} {visitor.lastName}
                                        </h5>
                                        <span className="inline-flex px-3 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200" style={{fontFamily: 'Telegraph, sans-serif'}}>
                                          <i className="fa-solid fa-user-plus mr-1"></i>
                                          Additional
                                        </span>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex items-center">
                                          <i className="fa-solid fa-envelope w-4 text-gray-400 mr-2"></i>
                                          <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Email:</span>
                                          <span className="text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                            {visitor.email || 'Not provided'}
                                          </span>
                                        </div>
                                        <div className="flex items-center">
                                          <i className="fa-solid fa-user w-4 text-gray-400 mr-2"></i>
                                          <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Gender:</span>
                                          <span className="text-sm capitalize" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                            {visitor.gender || 'Not specified'}
                                          </span>
                                        </div>
                                        {visitor.visitorType && visitor.visitorType !== 'Visitor' && (
                                          <div className="flex items-center">
                                            <i className="fa-solid fa-tag w-4 text-gray-400 mr-2"></i>
                                            <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Type:</span>
                                            <span className="text-sm font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700" style={{fontFamily: 'Telegraph, sans-serif'}}>
                                              {visitor.visitorType}
                                            </span>
                                          </div>
                                        )}
                                        {visitor.institution && (
                                          <div className="flex items-center">
                                            <i className="fa-solid fa-building w-4 text-gray-400 mr-2"></i>
                                            <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Institution:</span>
                                            <span className="text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                              {visitor.institution}
                                            </span>
                                          </div>
                                        )}
                                        {visitor.address && (
                                          <div className="flex items-center">
                                            <i className="fa-solid fa-map-marker-alt w-4 text-gray-400 mr-2"></i>
                                            <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Address:</span>
                                            <span className="text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                              {visitor.address}
                                            </span>
                                          </div>
                                        )}
                                        {visitor.purposeOfVisit && (
                                          <div className="flex items-center">
                                            <i className="fa-solid fa-bullseye w-4 text-gray-400 mr-2"></i>
                                            <span className="text-sm font-medium text-gray-600 mr-2" style={{fontFamily: 'Telegraph, sans-serif'}}>Purpose:</span>
                                            <span className="text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                              {visitor.purposeOfVisit}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    ))}
                                    
                                    {/* Pagination Controls - Mobile */}
                                    {additionalVisitorsData[booking.booking_id || index].length > visitorsPerPage && (
                                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                        <div className="text-sm mb-3 text-center" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                          Showing {((visitorPages[booking.booking_id || index] || 0) * visitorsPerPage) + 1} to {Math.min(((visitorPages[booking.booking_id || index] || 0) + 1) * visitorsPerPage, additionalVisitorsData[booking.booking_id || index].length)} of {additionalVisitorsData[booking.booking_id || index].length} additional visitors
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <button
                                            onClick={() => goToVisitorPage(booking.booking_id || index, (visitorPages[booking.booking_id || index] || 0) - 1)}
                                            disabled={(visitorPages[booking.booking_id || index] || 0) === 0}
                                            className="px-3 py-1 rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                            style={{color: '#351E10', borderColor: '#351E10', fontFamily: 'Telegraph, sans-serif'}}
                                          >
                                            <i className="fa-solid fa-chevron-left mr-1"></i>
                                            Previous
                                          </button>
                                          <span className="text-sm px-2" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                            Page {(visitorPages[booking.booking_id || index] || 0) + 1} of {getTotalPages(booking.booking_id || index, additionalVisitorsData[booking.booking_id || index])}
                                          </span>
                                          <button
                                            onClick={() => goToVisitorPage(booking.booking_id || index, (visitorPages[booking.booking_id || index] || 0) + 1)}
                                            disabled={(visitorPages[booking.booking_id || index] || 0) >= getTotalPages(booking.booking_id || index, additionalVisitorsData[booking.booking_id || index]) - 1}
                                            className="px-3 py-1 rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                            style={{color: '#351E10', borderColor: '#351E10', fontFamily: 'Telegraph, sans-serif'}}
                                          >
                                            Next
                                            <i className="fa-solid fa-chevron-right ml-1"></i>
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-sm text-gray-500" style={{fontFamily: 'Telegraph, sans-serif'}}>
                                    Loading additional visitors...
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions - Compact */}
                    {!showArchive && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                        <button 
                          onClick={() => toggleBookingDetails(booking.booking_id || index, booking)}
                          className={`px-2 py-1 rounded border transition-all duration-200 hover:shadow-md text-xs flex items-center ${
                            expandedBookings.has(booking.booking_id || index) 
                              ? 'shadow-md' 
                              : 'hover:shadow-sm'
                          }`}
                          style={{
                            color: expandedBookings.has(booking.booking_id || index) ? '#FFFFFF' : '#351E10',
                            backgroundColor: expandedBookings.has(booking.booking_id || index) ? '#351E10' : 'transparent',
                            borderColor: '#351E10', 
                            fontFamily: 'Telegraph, sans-serif'
                          }}
                        >
                          <i className={`fa-solid fa-chevron-${expandedBookings.has(booking.booking_id || index) ? 'up' : 'down'} mr-1`}></i>
                          {expandedBookings.has(booking.booking_id || index) ? 'Hide' : 'Show'}
                        </button>
                        {booking.status !== 'cancelled' && (
                          <button 
                            className="px-2 py-1 rounded font-medium transition-all duration-200 hover:shadow-md text-xs flex items-center"
                            style={{backgroundColor: '#F59E0B', color: '#FFFFFF', fontFamily: 'Telegraph, sans-serif'}}
                            onClick={() => handleCancelBooking(booking)}
                          >
                            <i className="fa-solid fa-ban mr-1"></i>
                            Cancel
                          </button>
                        )}
                        {booking.status === 'pending' && (
                          <button
                            className="px-2 py-1 rounded font-medium transition-all duration-200 hover:shadow-md text-xs flex items-center"
                            style={{backgroundColor: '#10B981', color: '#FFFFFF', fontFamily: 'Telegraph, sans-serif'}}
                            onClick={() => handleApproveBooking(booking)}
                          >
                            <i className="fa-solid fa-check mr-1"></i>
                            Approve
                          </button>
                        )}
                        <button 
                          className="px-2 py-1 rounded font-medium transition-all duration-200 hover:shadow-md text-xs flex items-center"
                          style={{backgroundColor: '#EF4444', color: '#FFFFFF', fontFamily: 'Telegraph, sans-serif'}}
                          onClick={() => deleteSchedule(booking.booking_id)}
                        >
                          <i className="fa-solid fa-trash mr-1"></i>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination or Summary */}
        {filteredBookings.length > 0 && (
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-sm text-gray-700 font-['Telegraph']">
                Showing <span className="font-medium">{filteredBookings.length}</span> of <span className="font-medium">{bookings.length}</span> bookings
              </div>
              <div className="text-sm text-gray-500 font-['Telegraph']">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showBookingModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold" style={{color: '#E5B80B', fontFamily: 'Telegraph, sans-serif'}}>
                  <i className="fa-solid fa-calendar-check mr-3" style={{color: '#E5B80B'}}></i>
                  Booking Details
                </h2>
                <p className="mt-1" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                  {selectedBooking.first_name} {selectedBooking.last_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedBooking(null);
                  setBookingDetails(null);
                  setModalVisitors([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    selectedBooking.type === 'group' 
                      ? 'bg-purple-100 text-purple-800' 
                      : selectedBooking.type === 'individual'
                      ? 'bg-blue-100 text-blue-800'
                      : selectedBooking.type === 'ind-walkin'
                      ? 'bg-orange-100 text-orange-800'
                      : selectedBooking.type === 'group-walkin'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`} style={{fontFamily: 'Telegraph, sans-serif'}}>
                    {selectedBooking.type}
                  </span>
                  <span className={getStatusBadge(selectedBooking.status)}>
                    {getDisplayStatus(selectedBooking.status)}
                  </span>
                </div>
                <div className="flex items-center text-sm" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                  <i className="fa-solid fa-users mr-2" style={{color: '#E5B80B'}}></i>
                  {selectedBooking.total_visitors} {selectedBooking.total_visitors === 1 ? 'visitor' : 'visitors'}
                </div>
              </div>

              {/* Visitor Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                  <i className="fa-solid fa-user mr-2" style={{color: '#E5B80B'}}></i>
                  Visitor Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>Full Name</label>
                    <p style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>{selectedBooking.first_name} {selectedBooking.last_name}</p>
                  </div>
                  {bookingDetails && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>Gender</label>
                        <p style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>{bookingDetails.gender || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>Email</label>
                        <p style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>{bookingDetails.email || 'Not provided'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>Address</label>
                        <p style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>{bookingDetails.address || 'Not provided'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Booking Information */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                  <i className="fa-solid fa-calendar-alt mr-2" style={{color: '#E5B80B'}}></i>
                  Booking Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>Booking ID</label>
                    <p className="font-mono" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>#{selectedBooking.booking_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>Visit Date</label>
                    <p style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>{formatDate(selectedBooking.date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>Time Slot</label>
                    <p style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>{selectedBooking.time_slot}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>Created On</label>
                    <p style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>{formatDate(selectedBooking.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {bookingDetails && (
                <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                  <i className="fa-solid fa-info-circle mr-2" style={{color: '#E5B80B'}}></i>
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>Visitor Type</label>
                      <p style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>{bookingDetails.visitorType || 'Not specified'}</p>
                    </div>
                    {selectedBooking.institution && (
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>Institution</label>
                        <p style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>{selectedBooking.institution}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* All Visitors Information */}
              {console.log('🔍 Modal visitors length:', modalVisitors.length)}
              {console.log('🔍 Modal visitors data:', modalVisitors)}
              {console.log('🔍 Selected booking:', selectedBooking)}
              {(modalVisitors.length > 0 || (selectedBooking?.total_visitors && selectedBooking.total_visitors > 1)) && (
                <div className="bg-purple-50 rounded-lg p-4">
                                      <h3 className="text-lg font-semibold mb-3" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                      <i className="fa-solid fa-users mr-2" style={{color: '#E5B80B'}}></i>
                      All Visitors ({modalVisitors.length})
                    </h3>
                    {modalVisitors.length === 0 && (
                      <div className="space-y-2 mb-4">
                        <p className="text-gray-600" style={{fontFamily: 'Telegraph, sans-serif'}}>No visitors found in database.</p>
                        <p className="text-sm text-gray-500" style={{fontFamily: 'Telegraph, sans-serif'}}>
                          Expected: {selectedBooking?.total_visitors || 'Unknown'} total visitors
                        </p>
                        <p className="text-xs text-gray-400" style={{fontFamily: 'Telegraph, sans-serif'}}>
                          Booking ID: {selectedBooking?.booking_id} | Type: {selectedBooking?.type}
                        </p>
                      </div>
                    )}
                                      <div className="space-y-3">
                      {modalVisitors.map((visitor, index) => (
                                              <div key={visitor.visitorId || visitor.tokenId || index} className="bg-white rounded-lg p-3 border border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                                {visitor.firstName} {visitor.lastName}
                              </h4>
                              {visitor.isMainVisitor && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800" style={{fontFamily: 'Telegraph, sans-serif'}}>
                                  Primary
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                visitor.status === 'checked-in' || visitor.status === 'visited'
                                  ? 'bg-green-100 text-green-800' 
                                  : visitor.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`} style={{fontFamily: 'Telegraph, sans-serif'}}>
                                {visitor.status === 'checked-in' || visitor.status === 'visited' ? 'Checked In' : visitor.status === 'pending' ? 'Pending' : visitor.status}
                              </span>
                              {visitor.checkinTime && (
                                <span className="text-xs text-gray-500" style={{fontFamily: 'Telegraph, sans-serif'}}>
                                  <i className="fa-solid fa-clock mr-1"></i>
                                  {new Date(visitor.checkinTime).toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600" style={{fontFamily: 'Telegraph, sans-serif'}}>Email:</span>
                              <span className="ml-1" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>{visitor.email || 'Not provided'}</span>
                            </div>
                            {visitor.gender && visitor.gender !== 'Not specified' && (
                              <div>
                                <span className="text-gray-600" style={{fontFamily: 'Telegraph, sans-serif'}}>Gender:</span>
                                <span className="ml-1" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>{visitor.gender}</span>
                              </div>
                            )}
                            {visitor.visitorType && visitor.visitorType !== 'Visitor' && (
                              <div>
                                <span className="text-gray-600" style={{fontFamily: 'Telegraph, sans-serif'}}>Type:</span>
                                <span className="ml-1" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>{visitor.visitorType}</span>
                              </div>
                            )}
                            {visitor.institution && visitor.institution !== 'Not specified' && (
                              <div>
                                <span className="text-gray-600" style={{fontFamily: 'Telegraph, sans-serif'}}>Institution:</span>
                                <span className="ml-1" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>{visitor.institution}</span>
                              </div>
                            )}
                            {visitor.address && visitor.address !== 'Not provided' && (
                              <div className="sm:col-span-2">
                                <span className="text-gray-600" style={{fontFamily: 'Telegraph, sans-serif'}}>Address:</span>
                                <span className="ml-1" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>{visitor.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                                          ))}
                    </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedBooking(null);
                  setBookingDetails(null);
                  setModalVisitors([]);
                }}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                style={{fontFamily: 'Telegraph, sans-serif'}}
              >
                Close
              </button>
              {selectedBooking.status === 'pending' && (
                <button
                  onClick={() => {
                    handleApproveBooking(selectedBooking);
                    setShowBookingModal(false);
                    setSelectedBooking(null);
                    setBookingDetails(null);
                    setModalVisitors([]);
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  style={{fontFamily: 'Telegraph, sans-serif'}}
                >
                  <i className="fa-solid fa-check mr-2"></i>
                  Approve Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
                style={{background: 'linear-gradient(135deg, #8B6B21 0%, #D4AF37 100%)', color: 'white', fontFamily: 'Telegraf, sans-serif'}}
              >
                <i className="fa-solid fa-check mr-2"></i>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmationModal.show && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100 opacity-100 border-l-4 border-orange-500">
            {/* Confirmation Icon */}
            <div className="flex justify-center pt-8 pb-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600">
                <i className="fa-solid fa-question text-3xl text-white"></i>
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
            <div className="px-8 pb-8 flex gap-4">
              <button
                onClick={confirmationModal.onCancel}
                className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                style={{fontFamily: 'Telegraf, sans-serif'}}
              >
                <i className="fa-solid fa-times mr-2"></i>
                Cancel
              </button>
              <button
                onClick={confirmationModal.onConfirm}
                className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                style={{background: 'linear-gradient(135deg, #8B6B21 0%, #D4AF37 100%)', color: 'white', fontFamily: 'Telegraf, sans-serif'}}
              >
                <i className="fa-solid fa-check mr-2"></i>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Input
const Input = ({ label, className = "", ...props }) => (
  <div className={className}>
    <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>{label}</label>
    <input {...props} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent" style={{fontFamily: 'Telegraph, sans-serif', focusRingColor: '#E5B80B'}} />
  </div>
);

// Reusable Select
const Select = ({ label, options, className = "", placeholder, ...props }) => (
  <div className={className}>
    <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>{label}</label>
    <select {...props} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent" style={{fontFamily: 'Telegraph, sans-serif', focusRingColor: '#E5B80B'}}>
      <option value="">{placeholder || `Select ${label}`}</option>
      {options.map((opt, idx) => (
        <option key={idx} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

export default Schedule;
