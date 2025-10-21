import React, { useState, useEffect } from "react";
import api from "../../config/api";

const Event = ({ userPermissions }) => {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_date: "",
    time: "",
    location: "",
    organizer: "",
    image: null,
    maxCapacity: 50,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalEvent, setModalEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showRegistrations, setShowRegistrations] = useState(false);
  const [selectedEventRegistrations, setSelectedEventRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [participantFilter, setParticipantFilter] = useState('all');
  const [participantSearch, setParticipantSearch] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    title: "",
    description: "",
    start_date: "",
    time: "",
    location: "",
    organizer: "",
    maxCapacity: 50,
  });
  const [notification, setNotification] = useState({
    show: false,
    type: 'success',
    title: '',
    message: '',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setForm((prev) => ({
        ...prev,
        image: files[0],
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setForm({
      title: "",
      description: "",
      start_date: "",
      time: "",
      location: "",
      organizer: "",
      image: null,
      maxCapacity: 50,
    });
  };

  const fetchEvents = async () => {
    try {
      const res = await api.get("/api/activities/events");
      console.log('📅 Events received from API:', res.data);
      const mapped = res.data.map(event => ({
        ...event,
        maxCapacity: event.max_capacity || 50,
        currentRegistrations: event.current_registrations || 0,
      }));
      setEvents(mapped);
    } catch (err) {
      console.error("Error fetching events:", err);
      setEvents([]);
    }
  };

  useEffect(() => {
    fetchEvents();
    
    // Set up periodic refresh every 30 seconds to keep slot availability current
    const interval = setInterval(() => {
      fetchEvents();
    }, 30000); // 30 seconds
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("type", "event");
      formData.append("start_date", form.start_date);
      formData.append("time", form.time);
      formData.append("location", form.location);
      formData.append("organizer", form.organizer);
      formData.append("max_capacity", form.maxCapacity);
      if (form.image) {
        formData.append("images", form.image);
      }

      const res = await api.post("/api/activities", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setShowAddModal(false);
        setForm({
          title: "",
          description: "",
          start_date: "",
          time: "",
          location: "",
          organizer: "",
          image: null,
          maxCapacity: 50,
        });
        e.target.reset();
        fetchEvents();
        setNotification({
          show: true,
          type: 'success',
          title: 'Event Added Successfully!',
          message: 'Your event has been created and is now available for registration.',
          description: ''
        });
      } else {
        setNotification({
          show: true,
          type: 'error',
          title: 'Failed to Add Event',
          message: 'There was an error creating your event. Please try again.',
          description: ''
        });
      }
    } catch (err) {
      console.error("Error adding event:", err);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error Adding Event',
        message: 'An unexpected error occurred. Please try again.',
        description: ''
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    
    try {
      const res = await api.delete(`/api/activities/${id}`);
      
      if (res.data.success) {
        setEvents(events.filter(event => event.id !== id));
        setNotification({
          show: true,
          type: 'success',
          title: 'Event Deleted Successfully!',
          message: 'The event has been permanently removed from the system.',
          description: ''
        });
      } else {
        setNotification({
          show: true,
          type: 'error',
          title: 'Failed to Delete Event',
          message: 'There was an error deleting the event. Please try again.',
          description: ''
        });
      }
    } catch (err) {
      console.error("Error deleting event:", err);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error Deleting Event',
        message: 'An unexpected error occurred. Please try again.',
        description: ''
      });
    }
  };

  const handleViewEvent = (event) => {
    setModalEvent(event);
    setShowModal(true);
  };

  const fetchEventRegistrations = async (eventId) => {
    setLoadingRegistrations(true);
    try {
      const response = await fetch(`http://localhost:3000/api/event-registrations/event/${eventId}`);
      const data = await response.json();
      setSelectedEventRegistrations(data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setSelectedEventRegistrations([]);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleViewRegistrations = (event) => {
    fetchEventRegistrations(event.id);
    setShowRegistrations(true);
    // Reset filters when opening modal
    setParticipantFilter('all');
    setParticipantSearch('');
  };

  // Filter participants based on search and filter criteria
  const getFilteredParticipants = () => {
    let filtered = selectedEventRegistrations;

    // Apply search filter
    if (participantSearch) {
      filtered = filtered.filter(participant => 
        `${participant.firstname} ${participant.lastname}`.toLowerCase().includes(participantSearch.toLowerCase()) ||
        participant.email.toLowerCase().includes(participantSearch.toLowerCase())
      );
    }

    // Apply status filter
    if (participantFilter !== 'all') {
      if (participantFilter === 'approval') {
        filtered = filtered.filter(participant => participant.approval_status === 'pending');
      } else if (participantFilter === 'status') {
        filtered = filtered.filter(participant => participant.status === 'pending');
      } else if (participantFilter === 'checked_in') {
        filtered = filtered.filter(participant => participant.status === 'checked_in');
      } else if (participantFilter === 'approved') {
        filtered = filtered.filter(participant => participant.approval_status === 'approved');
      } else if (participantFilter === 'rejected') {
        filtered = filtered.filter(participant => participant.approval_status === 'rejected');
      } else if (participantFilter === 'local') {
        filtered = filtered.filter(participant => participant.visitor_type === 'local');
      } else if (participantFilter === 'tourist') {
        filtered = filtered.filter(participant => participant.visitor_type === 'tourist');
      }
    }

    // Sort by priority: 1) Pending approval, 2) Approved, 3) Checked in, then alphabetically
    filtered.sort((a, b) => {
      // Priority 1: Pending approval participants come first
      if (a.approval_status === 'pending' && b.approval_status !== 'pending') return -1;
      if (a.approval_status !== 'pending' && b.approval_status === 'pending') return 1;
      
      // Priority 2: Approved (but not checked in) come second
      if (a.approval_status === 'approved' && a.status !== 'checked_in' && 
          b.approval_status === 'approved' && b.status === 'checked_in') return -1;
      if (a.approval_status === 'approved' && a.status === 'checked_in' && 
          b.approval_status === 'approved' && b.status !== 'checked_in') return 1;
      
      // Priority 3: Checked in participants come third
      if (a.status === 'checked_in' && b.status !== 'checked_in') return 1;
      if (a.status !== 'checked_in' && b.status === 'checked_in') return -1;
      
      // Within each priority group, sort alphabetically by name
      const nameA = `${a.firstname} ${a.lastname}`.toLowerCase();
      const nameB = `${b.firstname} ${b.lastname}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return filtered;
  };

  // Get participant statistics
  const getParticipantStats = () => {
    const total = selectedEventRegistrations.length;
    const pendingApproval = selectedEventRegistrations.filter(p => p.approval_status === 'pending').length;
    const approved = selectedEventRegistrations.filter(p => p.approval_status === 'approved').length;
    const checkedIn = selectedEventRegistrations.filter(p => p.status === 'checked_in').length;
    const local = selectedEventRegistrations.filter(p => p.visitor_type === 'local').length;
    const tourist = selectedEventRegistrations.filter(p => p.visitor_type === 'tourist').length;

    return { total, pendingApproval, approved, checkedIn, local, tourist };
  };

  const handleApproveRegistration = async (registrationId) => {
    if (!window.confirm("Are you sure you want to approve this registration?")) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/event-registrations/${registrationId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved_by: 'Admin'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotification({
          show: true,
          type: 'success',
          title: 'Registration Approved!',
          message: 'The participant has been approved and QR code has been generated.',
          description: ''
        });
        // Refresh both registrations and events data for real-time updates
        if (selectedEventRegistrations.length > 0) {
          fetchEventRegistrations(selectedEventRegistrations[0].event_id);
        }
        fetchEvents(); // Refresh events to update slot availability
      } else {
        setNotification({
          show: true,
          type: 'error',
          title: 'Failed to Approve Registration',
          message: data.error || 'There was an error approving the registration.',
          description: ''
        });
      }
    } catch (error) {
      console.error('Error approving registration:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error Approving Registration',
        message: 'An unexpected error occurred. Please try again.',
        description: ''
      });
    }
  };

  const handleRejectRegistration = async (registrationId) => {
    const rejectionReason = prompt("Please provide a reason for rejection (optional):");
    if (rejectionReason === null) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/event-registrations/${registrationId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejected_by: 'Admin',
          rejection_reason: rejectionReason || 'Registration rejected by admin'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotification({
          show: true,
          type: 'success',
          title: 'Registration Rejected',
          message: 'The participant registration has been rejected.',
          description: ''
        });
        // Refresh both registrations and events data for real-time updates
        if (selectedEventRegistrations.length > 0) {
          fetchEventRegistrations(selectedEventRegistrations[0].event_id);
        }
        fetchEvents(); // Refresh events to update slot availability
      } else {
        setNotification({
          show: true,
          type: 'error',
          title: 'Failed to Reject Registration',
          message: data.error || 'There was an error rejecting the registration.',
          description: ''
        });
      }
    } catch (error) {
      console.error('Error rejecting registration:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error Rejecting Registration',
        message: 'An unexpected error occurred. Please try again.',
        description: ''
      });
    }
  };

  const handleDeleteRegistration = async (registrationId) => {
    if (!window.confirm("Are you sure you want to delete this participant? This action cannot be undone.")) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/event-registrations/${registrationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotification({
          show: true,
          type: 'success',
          title: 'Participant Deleted!',
          message: 'The participant has been permanently removed from the event.',
          description: ''
        });
        // Refresh both registrations and events data for real-time updates
        if (selectedEventRegistrations.length > 0) {
          fetchEventRegistrations(selectedEventRegistrations[0].event_id);
        }
        fetchEvents(); // Refresh events to update slot availability
      } else {
        setNotification({
          show: true,
          type: 'error',
          title: 'Failed to Delete Participant',
          message: data.error || 'There was an error deleting the participant.',
          description: ''
        });
      }
    } catch (error) {
      console.error('Error deleting registration:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error Deleting Participant',
        message: 'An unexpected error occurred. Please try again.',
        description: ''
      });
    }
  };

  const handleEditCapacity = (event) => {
    setEditingEvent(event);
    setShowEditModal(true);
  };

  const handleEditEvent = (event) => {
    setEditForm({
      id: event.id,
      title: event.title,
      description: event.description,
      start_date: event.start_date.split('T')[0], // Format date for input
      time: event.time,
      location: event.location,
      organizer: event.organizer,
      maxCapacity: event.maxCapacity || 50,
    });
    setShowEditEventModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Update activity (title, description)
      await api.put(`/api/activities/${editForm.id}`, {
        title: editForm.title,
        description: editForm.description,
        type: 'event',
        start_date: editForm.start_date,
        time: editForm.time,
        location: editForm.location,
        organizer: editForm.organizer,
        max_capacity: editForm.maxCapacity
      });

      setNotification({
        show: true,
        type: 'success',
        title: 'Event Updated Successfully!',
        message: 'All event details have been updated.',
        description: ''
      });

      setShowEditEventModal(false);
      fetchEvents(); // Refresh events list
    } catch (err) {
      console.error("Error updating event:", err);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error Updating Event',
        message: 'There was an error updating the event. Please try again.',
        description: ''
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCapacity = async (newCapacity) => {
    if (!editingEvent) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/event-registrations/event/${editingEvent.id}/capacity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          max_capacity: newCapacity
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotification({
          show: true,
          type: 'success',
          title: 'Capacity Updated!',
          message: `Event capacity has been updated to ${newCapacity} participants.`,
          description: ''
        });
        setShowEditModal(false);
        setEditingEvent(null);
        fetchEvents(); // Refresh events to update capacity display
      } else {
        setNotification({
          show: true,
          type: 'error',
          title: 'Failed to Update Capacity',
          message: data.error || 'There was an error updating the capacity.',
          description: ''
        });
      }
    } catch (error) {
      console.error('Error updating capacity:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error Updating Capacity',
        message: 'An unexpected error occurred. Please try again.',
        description: ''
      });
    }
  };

  const now = new Date();
  const upcoming = events.filter(event => {
    let eventDateTime;
    if (event.start_date) {
      const startDate = new Date(event.start_date);
      if (event.time) {
        const [hours, minutes] = event.time.split(':');
        startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        eventDateTime = startDate;
      } else {
        startDate.setHours(23, 59, 59, 999);
        eventDateTime = startDate;
      }
    } else {
      eventDateTime = new Date();
    }
    return eventDateTime > now;
  });
  
  const history = events.filter(event => {
    let eventDateTime;
    if (event.start_date) {
      const startDate = new Date(event.start_date);
      if (event.time) {
        const [hours, minutes] = event.time.split(':');
        startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        eventDateTime = startDate;
      } else {
        startDate.setHours(23, 59, 59, 999);
        eventDateTime = startDate;
      }
    } else {
      eventDateTime = new Date();
    }
    return eventDateTime <= now;
  });

  const totalEvents = events.length;
  const upcomingCount = upcoming.length;
  const pastCount = history.length;

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 font-telegraf text-[#351E10]">
              <i className="fa-solid fa-calendar-day mr-3 text-[#E5B80B]"></i>
              Event Management
            </h1>
            <p className="text-sm md:text-base font-lora text-[#351E10]">Manage museum events and activities</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 md:px-6 py-2 md:py-3 rounded-lg transition-colors font-semibold shadow-md text-sm md:text-base bg-[#E5B80B] text-[#351E10] font-telegraf hover:bg-[#D4AF37]"
            onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
          >
            <i className="fa-solid fa-plus mr-2"></i>
            Add Event
          </button>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col">
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
                      Create New Event
                    </h2>
                    <p className="text-[#E5B80B] text-sm mt-1" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      Add a new event to your museum's calendar
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
                <form id="event-form" onSubmit={handleSubmit} className="space-y-8">
                  {/* Basic Information Section */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                        <i className="fa-solid fa-info text-white text-lg"></i>
                      </div>
                      <h3 className="text-xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Basic Information</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-heading mr-2" style={{color: '#E5B80B'}}></i>
                          Event Title *
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={form.title}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                          placeholder="Enter event title"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-align-left mr-2" style={{color: '#E5B80B'}}></i>
                          Description *
                        </label>
                        <textarea
                          name="description"
                          value={form.description}
                          onChange={handleChange}
                          required
                          rows={4}
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white resize-none"
                          placeholder="Enter event description"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Event Details Section */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                        <i className="fa-solid fa-calendar text-white text-lg"></i>
                      </div>
                      <h3 className="text-xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Event Details</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-calendar-plus mr-2" style={{color: '#E5B80B'}}></i>
                          Start Date *
                        </label>
                        <input
                          type="date"
                          name="start_date"
                          value={form.start_date}
                          onChange={handleChange}
                          required
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-clock mr-2" style={{color: '#E5B80B'}}></i>
                          Time *
                        </label>
                        <input
                          type="time"
                          name="time"
                          value={form.time}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-map-marker-alt mr-2" style={{color: '#E5B80B'}}></i>
                          Location *
                        </label>
                        <input
                          type="text"
                          name="location"
                          value={form.location}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                          placeholder="Enter event location"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-user-tie mr-2" style={{color: '#E5B80B'}}></i>
                          Organizer *
                        </label>
                        <input
                          type="text"
                          name="organizer"
                          value={form.organizer}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                          placeholder="Enter organizer name"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Capacity & Media Section */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                        <i className="fa-solid fa-users text-white text-lg"></i>
                      </div>
                      <h3 className="text-xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Capacity & Media</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-users mr-2" style={{color: '#E5B80B'}}></i>
                          Max Capacity *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            name="maxCapacity"
                            value={form.maxCapacity}
                            onChange={handleChange}
                            min="1"
                            max="5000"
                            required
                            className="w-full px-4 py-4 pr-16 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                            placeholder="50"
                            style={{fontFamily: 'Telegraf, sans-serif'}}
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-semibold">
                            participants
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <p className="text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>
                            <i className="fa-solid fa-info-circle mr-1"></i>
                            Maximum number of participants
                          </p>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, maxCapacity: Math.max(1, prev.maxCapacity - 5) }))}
                              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center transition-colors"
                              title="Decrease by 5"
                            >
                              <i className="fa-solid fa-minus text-xs"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, maxCapacity: Math.min(5000, prev.maxCapacity + 5) }))}
                              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center transition-colors"
                              title="Increase by 5"
                            >
                              <i className="fa-solid fa-plus text-xs"></i>
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, maxCapacity: 25 }))}
                              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                                form.maxCapacity === 25 
                                  ? 'bg-[#E5B80B] text-white' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              Small (25)
                            </button>
                            <button
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, maxCapacity: 50 }))}
                              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                                form.maxCapacity === 50 
                                  ? 'bg-[#E5B80B] text-white' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              Medium (50)
                            </button>
                            <button
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, maxCapacity: 100 }))}
                              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                                form.maxCapacity === 100 
                                  ? 'bg-[#E5B80B] text-white' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              Large (100)
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, maxCapacity: 500 }))}
                              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                                form.maxCapacity === 500 
                                  ? 'bg-[#E5B80B] text-white' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              Hall (500)
                            </button>
                            <button
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, maxCapacity: 1000 }))}
                              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                                form.maxCapacity === 1000 
                                  ? 'bg-[#E5B80B] text-white' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              Arena (1000)
                            </button>
                            <button
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, maxCapacity: 5000 }))}
                              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                                form.maxCapacity === 5000 
                                  ? 'bg-[#E5B80B] text-white' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              Stadium (5000)
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-upload mr-2" style={{color: '#E5B80B'}}></i>
                          Event Image (Optional)
                        </label>
                        <input
                          type="file"
                          name="image"
                          onChange={handleChange}
                          accept="image/*"
                          className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#E5B80B] file:text-white hover:file:bg-[#D4AF37]"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                        <p className="text-sm text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-info-circle mr-1"></i>
                          Supported formats: JPG, PNG, GIF
                        </p>
                      </div>
                    </div>
                  </div>
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
                    form="event-form"
                    disabled={submitting}
                    className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2 sm:py-2 md:py-3 rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-sm md:text-base order-2 sm:order-2"
                    style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
                  >
                    {submitting ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                        Creating Event...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-plus mr-2"></i>
                        Create Event
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
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Total Events</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}>{totalEvents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#351E10'}}>
              <i className="fa-solid fa-clock text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Upcoming</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>{upcomingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#E5B80B'}}>
              <i className="fa-solid fa-play text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Past</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}>{pastCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#351E10'}}>
              <i className="fa-solid fa-calendar-day text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>This Month</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>{events.filter(e => {
                const eventDate = new Date(e.start_date);
                const now = new Date();
                return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
              }).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-2 sm:space-x-4 md:space-x-8 px-2 sm:px-4 md:px-6">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-2 sm:py-3 md:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm md:text-base transition-colors ${
                activeTab === 'upcoming'
                  ? 'border-[#AB8841] text-[#AB8841]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fa-solid fa-calendar-plus mr-1 sm:mr-2"></i>
              <span style={{fontFamily: 'Telegraf, sans-serif'}}>Upcoming ({upcomingCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 sm:py-3 md:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm md:text-base transition-colors ${
                activeTab === 'history'
                  ? 'border-[#AB8841] text-[#AB8841]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fa-solid fa-history mr-1 sm:mr-2"></i>
              <span style={{fontFamily: 'Telegraf, sans-serif'}}>History ({pastCount})</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-2 sm:p-4 md:p-6">
          {activeTab === 'upcoming' && (
            <div>
              {upcoming.length > 0 ? (
                <EventSection
                  title=""
                  events={upcoming}
                  icon="fa-solid fa-calendar-plus"
                  color="green"
                  onView={handleViewEvent}
                  onDelete={handleDelete}
                  onViewRegistrations={handleViewRegistrations}
                  onEditCapacity={handleEditCapacity}
                  onEditEvent={handleEditEvent}
                  formatTime={formatTime}
                  showHeader={false}
                />
              ) : (
                <div className="text-center py-8 md:py-12">
                  <i className="fa-solid fa-calendar-plus text-4xl md:text-6xl mb-4 text-gray-300"></i>
                  <h3 className="text-lg md:text-xl font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>No Upcoming Events</h3>
                  <p className="text-sm md:text-base" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>No events are scheduled for the future</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {history.length > 0 ? (
                <EventSection
                  title=""
                  events={history}
                  icon="fa-solid fa-history"
                  color="gray"
                  onView={handleViewEvent}
                  onDelete={handleDelete}
                  onViewRegistrations={handleViewRegistrations}
                  onEditCapacity={handleEditCapacity}
                  onEditEvent={handleEditEvent}
                  formatTime={formatTime}
                  showHeader={false}
                />
              ) : (
                <div className="text-center py-8 md:py-12">
                  <i className="fa-solid fa-history text-4xl md:text-6xl mb-4 text-gray-300"></i>
                  <h3 className="text-lg md:text-xl font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>No Past Events</h3>
                  <p className="text-sm md:text-base" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>No events have been completed yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Show this only when there are no events at all */}
      {events.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
          <div className="text-center py-8 md:py-12">
            <i className="fa-solid fa-calendar-times text-4xl md:text-6xl mb-4 text-gray-300"></i>
            <h3 className="text-lg md:text-xl font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>No Events Found</h3>
            <p className="text-sm md:text-base" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Start by adding your first event using the "Add Event" button above</p>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegistrations && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden">
            {/* Modern Header with Museum Branding */}
            <div className="relative bg-gradient-to-r from-[#E5B80B] to-[#351E10] p-4 sm:p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-users text-white text-xl sm:text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-2xl font-bold text-white break-words" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      Event Participants
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full text-white bg-white/20 backdrop-blur-sm">
                        {selectedEventRegistrations.length} Participants
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full text-white bg-white/20 backdrop-blur-sm">
                        Event Registrations
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRegistrations(false)}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0"
                >
                  <i className="fa-solid fa-times text-sm sm:text-base"></i>
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(98vh-120px)] sm:max-h-[calc(95vh-120px)]">
              <div className="p-4 sm:p-6">
              {loadingRegistrations ? (
                  <div className="text-center py-12">
                  <div className="inline-flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E5B80B]"></div>
                      <span className="text-gray-600 font-medium" style={{fontFamily: 'Telegraf, sans-serif'}}>Loading participants...</span>
                  </div>
                </div>
              ) : selectedEventRegistrations.length > 0 ? (
                  <>
                    {/* Search and Filter Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {/* Search */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <i className="fa-solid fa-search text-gray-400"></i>
                        </div>
                        <input
                          type="text"
                          placeholder="Search participants..."
                          value={participantSearch}
                          onChange={(e) => setParticipantSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E5B80B] focus:border-transparent"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                      </div>

                      {/* Filter Dropdown */}
                      <div className="relative">
                        <select
                          value={participantFilter}
                          onChange={(e) => setParticipantFilter(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E5B80B] focus:border-transparent appearance-none bg-white"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        >
                          <option value="all">All Participants ({selectedEventRegistrations.length})</option>
                          <option value="approval">Pending Approval</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="status">Pending Check-in</option>
                          <option value="checked_in">Checked In</option>
                          <option value="local">Local Visitors</option>
                          <option value="tourist">Tourist Visitors</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <i className="fa-solid fa-chevron-down text-gray-400"></i>
                        </div>
                      </div>
                    </div>

                    {/* Filtered Results Count */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600" style={{fontFamily: 'Telegraf, sans-serif'}}>
                        Showing {getFilteredParticipants().length} of {selectedEventRegistrations.length} participants
                        {participantFilter !== 'all' && ` (filtered by ${participantFilter.replace('_', ' ')})`}
                        {participantSearch && ` matching "${participantSearch}"`}
                      </p>
                    </div>

                    {/* Participants Table */}
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                      {/* Table Header */}
                      <div className="bg-[#351E10] px-4 py-3">
                        <div className="flex items-center">
                          <i className="fa-solid fa-list text-white mr-3"></i>
                          <h3 className="text-white font-bold text-lg" style={{fontFamily: 'Telegraf, sans-serif'}}>
                            All Participants ({getFilteredParticipants().length})
                          </h3>
                        </div>
                      </div>

                      {/* Table Content */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Participant Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Email</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Booking Type</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Visit Date & Time</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Status</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Details</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {getFilteredParticipants().map((registration) => (
                              <tr key={registration.id} className="hover:bg-gray-50 transition-all duration-200">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-bold text-[#351E10]" style={{fontFamily: 'Telegraf, sans-serif'}}>
                                      {registration.firstname} {registration.lastname}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      {registration.gender}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{registration.email}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    registration.visitor_type === 'local' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-orange-100 text-orange-800'
                                  }`}>
                                    {registration.visitor_type}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {registration.checkin_time ? 
                                      new Date(registration.checkin_time).toLocaleString() : 
                                      'Not checked in'
                                    }
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    registration.status === 'checked_in' 
                                      ? 'bg-green-100 text-green-800'
                                      : registration.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800'
                                      : registration.approval_status === 'approved'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {registration.status === 'checked_in' ? 'Checked' :
                                     registration.status === 'cancelled' ? 'Cancelled' :
                                     registration.approval_status === 'approved' ? 'Approved' :
                                     'Pending'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    {registration.approval_status === 'pending' && (
                                      <>
                                        <button
                                          onClick={() => handleApproveRegistration(registration.id)}
                                          className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center"
                                        >
                                          <i className="fa-solid fa-check mr-1"></i>
                                          Approve
                                        </button>
                                        <button
                                          onClick={() => handleRejectRegistration(registration.id)}
                                          className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center"
                                        >
                                          <i className="fa-solid fa-times mr-1"></i>
                                          Reject
                                        </button>
                                      </>
                                    )}
                                    <button
                                      onClick={() => handleDeleteRegistration(registration.id)}
                                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center"
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
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <i className="fa-solid fa-users text-4xl text-gray-400"></i>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>No Participants Yet</h3>
                    <p className="text-sm sm:text-base text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>No participants have registered for this event yet</p>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Capacity Modal */}
      {showEditModal && editingEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[#E5B80B] rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-users text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#351E10]" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      Edit Event Capacity
                    </h3>
                    <p className="text-sm text-gray-600" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      {editingEvent.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <i className="fa-solid fa-times text-sm"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Current Capacity:</span>
                      <span className="font-semibold text-[#351E10] ml-2">{editingEvent.maxCapacity || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Registered:</span>
                      <span className="font-semibold text-[#E5B80B] ml-2">{editingEvent.currentRegistrations || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    New Capacity
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleUpdateCapacity(25)}
                      className={`px-4 py-3 text-sm font-semibold rounded-lg transition-colors ${
                        editingEvent.maxCapacity === 25 
                          ? 'bg-[#E5B80B] text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Small (25)
                    </button>
                    <button
                      onClick={() => handleUpdateCapacity(50)}
                      className={`px-4 py-3 text-sm font-semibold rounded-lg transition-colors ${
                        editingEvent.maxCapacity === 50 
                          ? 'bg-[#E5B80B] text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Medium (50)
                    </button>
                    <button
                      onClick={() => handleUpdateCapacity(100)}
                      className={`px-4 py-3 text-sm font-semibold rounded-lg transition-colors ${
                        editingEvent.maxCapacity === 100 
                          ? 'bg-[#E5B80B] text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Large (100)
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingEvent(prev => ({ ...prev, maxCapacity: Math.max(1, prev.maxCapacity - 5) }))}
                      className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center transition-colors"
                      title="Decrease by 5"
                    >
                      <i className="fa-solid fa-minus text-sm"></i>
                    </button>
                    <input
                      type="number"
                      value={editingEvent.maxCapacity}
                      onChange={(e) => setEditingEvent(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) || 1 }))}
                      min="1"
                      max="5000"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] text-center"
                    />
                    <button
                      onClick={() => setEditingEvent(prev => ({ ...prev, maxCapacity: Math.min(5000, prev.maxCapacity + 5) }))}
                      className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center transition-colors"
                      title="Increase by 5"
                    >
                      <i className="fa-solid fa-plus text-sm"></i>
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3 mt-6">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                    style={{fontFamily: 'Telegraf, sans-serif'}}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateCapacity(editingEvent.maxCapacity)}
                    className="flex-1 px-4 py-3 bg-[#E5B80B] hover:bg-[#D4AF37] text-white font-semibold rounded-lg transition-colors"
                    style={{fontFamily: 'Telegraf, sans-serif'}}
                  >
                    <i className="fa-solid fa-check mr-2"></i>
                    Update Capacity
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditEventModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="relative p-8" style={{background: 'linear-gradient(135deg, #351E10 0%, #2A1A0D 50%, #1A0F08 100%)'}}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E5B80B]/10 to-transparent"></div>
              <div className="relative flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                    <i className="fa-solid fa-edit text-2xl text-white"></i>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      Edit Event
                    </h2>
                    <p className="text-[#E5B80B] text-sm mt-1" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      Update event information
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditEventModal(false)}
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
                <form id="edit-event-form" onSubmit={handleUpdateEvent} className="space-y-8">
                  {/* Basic Information Section */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                        <i className="fa-solid fa-info text-white text-lg"></i>
                      </div>
                      <h3 className="text-xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Basic Information</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-heading mr-2" style={{color: '#E5B80B'}}></i>
                          Event Title *
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={editForm.title}
                          onChange={handleEditFormChange}
                          required
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                          placeholder="Enter event title"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-align-left mr-2" style={{color: '#E5B80B'}}></i>
                          Description *
                        </label>
                        <textarea
                          name="description"
                          value={editForm.description}
                          onChange={handleEditFormChange}
                          required
                          rows={4}
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white resize-none"
                          placeholder="Enter event description"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Event Details Section */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                        <i className="fa-solid fa-calendar text-white text-lg"></i>
                      </div>
                      <h3 className="text-xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Event Details</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-calendar-plus mr-2" style={{color: '#E5B80B'}}></i>
                          Start Date *
                        </label>
                        <input
                          type="date"
                          name="start_date"
                          value={editForm.start_date}
                          onChange={handleEditFormChange}
                          required
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-clock mr-2" style={{color: '#E5B80B'}}></i>
                          Time *
                        </label>
                        <input
                          type="time"
                          name="time"
                          value={editForm.time}
                          onChange={handleEditFormChange}
                          required
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-map-marker-alt mr-2" style={{color: '#E5B80B'}}></i>
                          Location *
                        </label>
                        <input
                          type="text"
                          name="location"
                          value={editForm.location}
                          onChange={handleEditFormChange}
                          required
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                          placeholder="Enter event location"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-user-tie mr-2" style={{color: '#E5B80B'}}></i>
                          Organizer *
                        </label>
                        <input
                          type="text"
                          name="organizer"
                          value={editForm.organizer}
                          onChange={handleEditFormChange}
                          required
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                          placeholder="Enter organizer name"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Capacity Section */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                        <i className="fa-solid fa-users text-white text-lg"></i>
                      </div>
                      <h3 className="text-xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Capacity</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                        <i className="fa-solid fa-users mr-2" style={{color: '#E5B80B'}}></i>
                        Max Capacity *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="maxCapacity"
                          value={editForm.maxCapacity}
                          onChange={handleEditFormChange}
                          min="1"
                          max="5000"
                          required
                          className="w-full px-4 py-4 pr-16 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                          placeholder="50"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-semibold">
                          participants
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, maxCapacity: 25 }))}
                            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                              editForm.maxCapacity === 25 
                                ? 'bg-[#E5B80B] text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            Small (25)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, maxCapacity: 50 }))}
                            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                              editForm.maxCapacity === 50 
                                ? 'bg-[#E5B80B] text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            Medium (50)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, maxCapacity: 100 }))}
                            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                              editForm.maxCapacity === 100 
                                ? 'bg-[#E5B80B] text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            Large (100)
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, maxCapacity: 500 }))}
                            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                              editForm.maxCapacity === 500 
                                ? 'bg-[#E5B80B] text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            Hall (500)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, maxCapacity: 1000 }))}
                            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                              editForm.maxCapacity === 1000 
                                ? 'bg-[#E5B80B] text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            Arena (1000)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, maxCapacity: 5000 }))}
                            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                              editForm.maxCapacity === 5000 
                                ? 'bg-[#E5B80B] text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            Stadium (5000)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditEventModal(false)}
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
                    form="edit-event-form"
                    disabled={submitting}
                    className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2 sm:py-2 md:py-3 rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-sm md:text-base order-2 sm:order-2"
                    style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
                  >
                    {submitting ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                        Updating Event...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-save mr-2"></i>
                        Update Event
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showModal && modalEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
         <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-5xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden">
           {/* Modern Header with Museum Branding */}
           <div className="relative bg-gradient-to-r from-[#E5B80B] to-[#351E10] p-4 sm:p-6 rounded-t-2xl">
             <div className="flex items-start justify-between">
               <div className="flex items-center space-x-4">
                 <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                   <i className="fa-solid fa-calendar-day text-white text-xl sm:text-2xl"></i>
                 </div>
                 <div>
                   <h3 className="text-lg sm:text-2xl font-bold text-white break-words" style={{fontFamily: 'Telegraf, sans-serif'}}>
                 Event Details
               </h3>
                   <div className="flex flex-wrap items-center gap-2 mt-2">
                     <span className="px-2 py-1 text-xs font-semibold rounded-full text-white bg-white/20 backdrop-blur-sm">
                       {new Date(modalEvent.start_date) >= new Date() ? 'Upcoming' : 'Past Event'}
                     </span>
                     <span className="px-2 py-1 text-xs font-semibold rounded-full text-white bg-white/20 backdrop-blur-sm">
                       Event
                     </span>
                   </div>
                 </div>
               </div>
               <div className="flex items-center space-x-2">
                 <button
                   onClick={() => { setShowModal(false); handleEditEvent(modalEvent); }}
                   className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0"
                   title="Edit Event"
                 >
                   <i className="fa-solid fa-pen text-sm sm:text-base"></i>
                 </button>
                 <button
                   onClick={() => setShowModal(false)}
                   className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0"
                 >
                   <i className="fa-solid fa-times text-sm sm:text-base"></i>
                 </button>
               </div>
             </div>
           </div>

           <div className="overflow-y-auto max-h-[calc(98vh-120px)] sm:max-h-[calc(95vh-120px)]">
             <div className="p-4 sm:p-6">
               {/* Main Content Grid - Horizontally Aligned Sections */}
               <div className="space-y-6 sm:space-y-8">
                 {/* Row 1: Centered Image and Title */}
                 <div className="text-center">
             {/* Event Image */}
                   <div className="mb-4 sm:mb-6">
                     {modalEvent.images && modalEvent.images.length > 0 ? (
                       <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-100 mx-auto max-w-md">
                 <img
                   src={`${api.defaults.baseURL}${modalEvent.images[0]}`}
                   alt={modalEvent.title}
                           className="w-full h-64 sm:h-80 object-contain"
                 />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                       </div>
                     ) : (
                       <div className="w-full max-w-md h-64 sm:h-80 bg-gray-200 rounded-xl flex items-center justify-center mx-auto">
                         <i className="fa-solid fa-image text-6xl text-gray-400"></i>
               </div>
             )}
                   </div>

                   {/* Event Title */}
                   <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                     {modalEvent.title}
                   </h1>
                 </div>

                 {/* Row 2: Event Information and Capacity Status */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                   {/* Left: Event Information Card */}
                   <div className="bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-xl p-4 sm:p-6 border border-gray-200 h-full">
                     <h4 className="text-base sm:text-lg font-bold mb-4" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                       <i className="fa-solid fa-info-circle mr-2" style={{color: '#E5B80B'}}></i>
                       Event Information
                     </h4>
                     
                     <div className="space-y-3">
                       <div className="flex items-start space-x-3">
                         <div className="w-8 h-8 bg-[#E5B80B] rounded-lg flex items-center justify-center flex-shrink-0">
                           <i className="fa-solid fa-calendar text-white text-sm"></i>
                 </div>
                 <div>
                           <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</p>
                           <p className="text-sm sm:text-base font-semibold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                     {new Date(modalEvent.start_date).toLocaleDateString('en-US', {
                       weekday: 'long',
                       year: 'numeric',
                       month: 'long',
                       day: 'numeric'
                     })}
                   </p>
                 </div>
                       </div>

                       <div className="flex items-start space-x-3">
                         <div className="w-8 h-8 bg-[#E5B80B] rounded-lg flex items-center justify-center flex-shrink-0">
                           <i className="fa-solid fa-clock text-white text-sm"></i>
                 </div>
                 <div>
                           <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</p>
                           <p className="text-sm sm:text-base font-semibold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                             {formatTime(modalEvent.time)}
                           </p>
                         </div>
                       </div>

                       <div className="flex items-start space-x-3">
                         <div className="w-8 h-8 bg-[#E5B80B] rounded-lg flex items-center justify-center flex-shrink-0">
                           <i className="fa-solid fa-map-marker-alt text-white text-sm"></i>
                 </div>
                 <div>
                           <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</p>
                           <p className="text-sm sm:text-base font-semibold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                             {modalEvent.location}
                           </p>
                         </div>
                       </div>

                       <div className="flex items-start space-x-3">
                         <div className="w-8 h-8 bg-[#E5B80B] rounded-lg flex items-center justify-center flex-shrink-0">
                           <i className="fa-solid fa-user-tie text-white text-sm"></i>
                         </div>
                         <div>
                           <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Organizer</p>
                           <p className="text-sm sm:text-base font-semibold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                             {modalEvent.organizer}
                           </p>
                         </div>
                 </div>
               </div>
             </div>

                   {/* Right: Capacity & Status Card */}
                  <div className="bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-xl p-4 sm:p-6 border border-gray-200 h-full">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base sm:text-lg font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                        <i className="fa-solid fa-users mr-2" style={{color: '#E5B80B'}}></i>
                        Capacity & Status
                      </h4>
                      <button
                        onClick={() => handleEditCapacity(modalEvent)}
                        className="px-3 py-1 bg-[#E5B80B] hover:bg-[#D4AF37] text-white text-xs font-semibold rounded-lg transition-colors"
                        title="Edit Capacity"
                      >
                        <i className="fa-solid fa-edit mr-1"></i>
                        Edit
                      </button>
                    </div>
                     
                     <div className="space-y-4">
                       <div className="bg-white rounded-lg p-4 border border-gray-200">
                         <div className="flex items-center justify-between mb-2">
                           <span className="text-sm font-semibold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Available Slots</span>
                           <span className="text-lg font-bold" style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}>
                             {(modalEvent.maxCapacity || 0) - (modalEvent.currentRegistrations || 0)}
                           </span>
             </div>
                         <div className="w-full bg-gray-200 rounded-full h-2">
                           <div 
                             className="bg-gradient-to-r from-[#E5B80B] to-[#351E10] h-2 rounded-full transition-all duration-300"
                             style={{width: `${((modalEvent.currentRegistrations || 0) / (modalEvent.maxCapacity || 1)) * 100}%`}}
                           ></div>
           </div>
                         <p className="text-xs text-gray-600 mt-2" style={{fontFamily: 'Telegraf, sans-serif'}}>
                           {modalEvent.currentRegistrations || 0} of {modalEvent.maxCapacity || 0} slots filled
                         </p>
                       </div>

                       <div className="grid grid-cols-2 gap-3">
                         <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                           <div className="text-2xl font-bold" style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}>
                             {modalEvent.currentRegistrations || 0}
                           </div>
                           <div className="text-xs text-gray-600" style={{fontFamily: 'Telegraf, sans-serif'}}>Registered</div>
                         </div>
                         <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                           <div className="text-2xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                             {modalEvent.maxCapacity || 0}
                           </div>
                           <div className="text-xs text-gray-600" style={{fontFamily: 'Telegraf, sans-serif'}}>Max Capacity</div>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Row 3: Description - Full Width */}
                 <div className="bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-xl p-4 sm:p-6 border border-gray-200">
                   <h4 className="text-base sm:text-lg font-bold mb-4" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                     <i className="fa-solid fa-align-left mr-2" style={{color: '#E5B80B'}}></i>
                     Description
                   </h4>
                   <div className="bg-white rounded-lg p-4 border border-gray-200">
                     <p className="text-sm sm:text-base leading-relaxed" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                       {modalEvent.description}
                     </p>
                   </div>
                 </div>
               </div>
             </div>
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
    </div>
  );
};

// Event Section Component
const EventSection = ({ title, events, icon, color, onView, onDelete, onViewRegistrations, onEditCapacity, onEditEvent, formatTime, showHeader = true }) => {
  const colorClasses = {
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    gray: "from-gray-500 to-gray-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {showHeader && (
        <div className={`px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gradient-to-r ${colorClasses[color]}`}>
          <h3 className="text-lg md:text-xl font-bold text-white">
            <i className={`${icon} mr-2`}></i>
            {title} ({events.length})
          </h3>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            {events.map((event) => (
          <div key={event.id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
            {/* Image Section */}
            <div className="relative">
                      {event.images && event.images.length > 0 ? (
                        <img
                          src={`${api.defaults.baseURL}${event.images[0]}`}
                          alt={event.title}
                  className="w-full aspect-square object-cover rounded-t-lg"
                        />
                      ) : (
                <div className="w-full aspect-square bg-gray-200 rounded-t-lg flex items-center justify-center">
                  <i className="fa-solid fa-image text-2xl text-gray-400"></i>
                        </div>
                      )}
              
              {/* Status Badges */}
              <div className="absolute top-1 left-1 flex flex-col gap-1">
                <span className={`px-1 py-0.5 text-xs font-semibold rounded-full text-white ${
                  new Date(event.start_date) >= new Date() ? 'bg-green-500' : 'bg-orange-500'
                }`}>
                  {new Date(event.start_date) >= new Date() ? 'Up' : 'Past'}
                </span>
                <span className="px-1 py-0.5 text-xs font-semibold rounded-full text-white bg-blue-500">
                  #{event.id}
                </span>
                    </div>
                    </div>

            {/* Content Section */}
            <div className="p-1.5 sm:p-2">
              {/* Category Badge */}
              <div className="mb-1">
                <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Event
                </span>
                  </div>

              {/* Title */}
              <h4 className="text-xs sm:text-sm font-bold mb-0.5 line-clamp-1" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                {event.title}
              </h4>

              {/* Date & Time */}
              <p className="text-xs mb-0.5" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                {new Date(event.start_date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-xs mb-0.5" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                    {formatTime(event.time)}
              </p>

              {/* Available Slots */}
              <p className="text-xs mb-1" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                <span className="font-semibold">{(event.maxCapacity || 0) - (event.currentRegistrations || 0)} slots</span>
                <br />
                <span className="text-xs">{event.currentRegistrations || 0} / {event.maxCapacity || 0}</span>
              </p>

              {/* Action Buttons */}
              <div className="flex justify-end gap-1">
                    <button
                      onClick={() => onView(event)}
                  className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 hover:bg-green-200 text-green-600 rounded flex items-center justify-center transition-colors"
                  title="View Event"
                    >
                  <i className="fa-solid fa-eye text-xs"></i>
                    </button>
                    <button
                      onClick={() => onEditEvent(event)}
                  className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded flex items-center justify-center transition-colors"
                  title="Edit Event"
                    >
                  <i className="fa-solid fa-pen-to-square text-xs"></i>
                    </button>
                    <button
                      onClick={() => onViewRegistrations(event)}
                  className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded flex items-center justify-center transition-colors"
                  title="View Registrations"
                    >
                  <i className="fa-solid fa-users text-xs"></i>
                    </button>
                    <button
                      onClick={() => onDelete(event.id)}
                  className="w-5 h-5 sm:w-6 sm:h-6 bg-red-100 hover:bg-red-200 text-red-600 rounded flex items-center justify-center transition-colors"
                  title="Delete Event"
                    >
                  <i className="fa-solid fa-trash text-xs"></i>
                    </button>
                  </div>
            </div>
          </div>
            ))}
      </div>
    </div>
  );
};

export default Event;
