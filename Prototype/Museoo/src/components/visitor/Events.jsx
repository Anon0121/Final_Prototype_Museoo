import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import EventRegistration from './EventRegistration';



const Events = ({ isModalOpen = false, onModalStateChange, onEventRegistrationModalChange }) => {

  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectedEventForRegistration, setSelectedEventForRegistration] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    type: 'success',
    title: '',
    message: '',
    description: ''
  });



  useEffect(() => {

    fetchEvents();

  }, []);




  const fetchEvents = async () => {

    try {

      const response = await api.get('/api/activities/events');

      // Filter for upcoming events only (today and future dates)

      const today = new Date();

      today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

      const upcomingEvents = response.data.filter(event => {

        const eventDate = new Date(event.start_date);

        eventDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

        return eventDate >= today; // Only include today and future events

      });

      setEvents(upcomingEvents);

    } catch (error) {

      console.error('Error fetching events:', error);

    } finally {

      setLoading(false);

    }

  };



  // Function to determine event status and label

  const getEventStatus = (eventDate) => {

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const eventDateObj = new Date(eventDate);

    eventDateObj.setHours(0, 0, 0, 0);

    if (eventDateObj.getTime() === today.getTime()) {

      return { label: 'Event Now', className: 'bg-green-500 text-white' };

    } else if (eventDateObj > today) {

      return { label: 'Coming Soon', className: 'bg-blue-500 text-white' };

    }

    return null; // This shouldn't happen due to filtering, but just in case

  };

  const formatTime = (timeString) => {

    if (!timeString) return '';

    const time = new Date(`2000-01-01T${timeString}`);

    return time.toLocaleTimeString('en-US', { 

      hour: 'numeric', 

      minute: '2-digit',

      hour12: true 

    });

  };



  // Handle modal state changes
  const openEventModal = (event) => {
    setSelectedEvent(event);
    if (onModalStateChange) {
      onModalStateChange(true);
    }
  };

  const closeEventModal = () => {
    setSelectedEvent(null);
    if (onModalStateChange) {
      onModalStateChange(false);
    }
    
    // Scroll to the Events section after closing modal
    setTimeout(() => {
      const eventsSection = document.getElementById('event');
      if (eventsSection) {
        eventsSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  // Success Notification Component (Reference Image 2 Style)
  const SuccessNotification = () => {
    if (!notification.show) return null;

    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100 opacity-100">
          {/* Notification Icon */}
          <div className="flex justify-center pt-8 pb-4">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-check text-3xl text-white"></i>
            </div>
          </div>
          
          {/* Notification Message */}
          <div className="px-8 pb-8 text-center">
            <h3 className="text-2xl font-bold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
              {notification.title}
            </h3>
            <p className="text-gray-600 text-lg mb-6" style={{fontFamily: 'Telegraf, sans-serif'}}>
              {notification.message}
            </p>
          </div>
          
          {/* Close Button */}
          <div className="px-8 pb-8">
            <button
              onClick={() => setNotification({...notification, show: false})}
              className="w-full bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#8B6B21] text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
              style={{fontFamily: 'Telegraf, sans-serif'}}
            >
              <i className="fa-solid fa-check mr-2"></i>
              Got it!
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EventCard = ({ event }) => {

    const eventStatus = getEventStatus(event.start_date);

    return (

      <div 

        className="bg-white rounded-2xl shadow-xl p-6 border border-[#E5B80B]/10 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"

        onClick={() => openEventModal(event)}

      >

        {/* Event status badge at the top */}

        {eventStatus && (

          <div className="flex justify-start mb-4">

            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
              eventStatus.label === 'Event Now' 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-[#E5B80B] text-[#351E10]'
            }`} style={{fontFamily: 'Telegraf, sans-serif'}}>

              {eventStatus.label}

            </span>

          </div>

        )}

        <div className="flex items-start justify-between mb-6">

          <div className="flex-1">

            <h3 className="text-xl font-bold mb-3 text-[#351E10] group-hover:text-[#8B6B21] transition-colors duration-300" style={{fontFamily: 'Telegraf, sans-serif'}}>{event.title}</h3>

            {/* Event Description Preview */}
            {event.description && (
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-4" style={{fontFamily: 'Lora, serif'}}>
                {event.description}
              </p>
            )}

          </div>

          <div className="w-14 h-14 rounded-xl flex items-center justify-center ml-4 flex-shrink-0 bg-gradient-to-br from-[#8B6B21] to-[#D4AF37] shadow-lg group-hover:shadow-xl transition-all duration-300">

            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />

            </svg>

          </div>

        </div>

        {/* Event Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-8 h-8 bg-[#E5B80B]/10 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-medium" style={{fontFamily: 'Telegraf, sans-serif'}}>
              {new Date(event.start_date).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <div className="w-8 h-8 bg-[#E5B80B]/10 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="font-medium" style={{fontFamily: 'Telegraf, sans-serif'}}>
              {(event.max_capacity || 50) - (event.current_registrations || 0)} slots available
            </span>
          </div>
        </div>
      
      {/* Registration Button */}
      <div className="mt-6">
        {(event.current_registrations || 0) >= (event.max_capacity || 50) ? (
          <button
            disabled
            className="w-full bg-gray-300 text-gray-500 py-3 px-4 rounded-xl font-semibold cursor-not-allowed"
            style={{fontFamily: 'Telegraf, sans-serif'}}
          >
            Event Full
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEventForRegistration(event);
              setShowRegistration(true);
              if (onEventRegistrationModalChange) {
                onEventRegistrationModalChange(true);
              }
            }}
            className="w-full bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#8B6B21] text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            style={{fontFamily: 'Telegraf, sans-serif'}}
          >
            Register Now
          </button>
        )}
      </div>

    </div>

  );

  };



  const EmptyState = () => (

    <div className="text-center py-20">

      <div className="w-32 h-32 bg-gradient-to-br from-[#8B6B21]/10 to-[#D4AF37]/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">

        <svg className="w-16 h-16 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">

          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />

        </svg>

      </div>

      <h3 className="text-2xl font-bold text-[#351E10] mb-4" style={{fontFamily: 'Telegraf, sans-serif'}}>
        No Upcoming Events
      </h3>

      <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed" style={{fontFamily: 'Lora, serif'}}>
        We're currently preparing exciting new events and activities. Check back soon for amazing cultural experiences and educational programs!
      </p>

    </div>

  );



  return (
    <>
      {/* Success Notification */}
      <SuccessNotification />
      
      <section id="event" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-20 px-4 relative overflow-hidden z-10">

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#8B6B21] rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-[#D4AF37] rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-[#351E10] rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Enhanced Header with Museum Branding */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#8B6B21] to-[#D4AF37] rounded-lg flex items-center justify-center shadow-lg mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#351E10] to-[#8B6B21] bg-clip-text text-transparent" style={{fontFamily: 'Telegraf, sans-serif'}}>
              Events
            </h2>
          </div>

          <div className="w-20 h-1 mx-auto rounded-full mb-4 bg-gradient-to-r from-[#E5B80B] to-[#351E10]"></div>

          <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed text-gray-700" style={{fontFamily: 'Lora, serif'}}>
            Join us for exciting events, educational programs, and cultural activities that celebrate the rich heritage of Cagayan de Oro.
          </p>
        </div>



        {/* Events Grid */}

        <div className="space-y-8">

          {loading ? (

            <div className="text-center py-20">

              <div className="inline-flex flex-col items-center space-y-6">

                <div className="relative">

                  <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-spin border-t-[#8B6B21]"></div>

                  <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-[#D4AF37] opacity-20"></div>

                </div>

                <div className="text-center">

                  <h3 className="text-xl font-semibold text-[#351E10] mb-2" style={{fontFamily: 'Telegraf, sans-serif'}}>Loading Events</h3>

                  <p className="text-gray-500" style={{fontFamily: 'Lora, serif'}}>Discovering amazing activities...</p>

                </div>

              </div>

            </div>

          ) : events.length > 0 ? (

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

              {events.map((event) => (

                <EventCard key={event.id} event={event} />

              ))}

            </div>

          ) : (

            <EmptyState />

          )}

        </div>



        {/* Event Details Modal with Museum Branding */}

        {selectedEvent && (

          <div 
            className="fixed inset-0 flex items-center justify-center z-[99998] p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeEventModal();
              }
            }}
          >
            {/* Blurred Background */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('/src/assets/citymus.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'blur(8px)',
                transform: 'scale(1.1)'
              }}
            ></div>
            
            {/* Content overlay */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>

            {/* Modal Content - Sharp and Clear */}
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">

              {/* Beautiful Header with Museum Branding */}
              <div className="p-6 border-b border-[#E5B80B]/20 bg-gradient-to-r from-[#351E10] to-[#2A1A0D]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#8B6B21] to-[#D4AF37] rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2" style={{fontFamily: 'Telegraf, sans-serif'}}>{selectedEvent.title}</h3>
                      <div className="flex items-center space-x-2">
                        {/* Event status badge */}
                        {getEventStatus(selectedEvent.start_date) && (
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                            getEventStatus(selectedEvent.start_date).label === 'Event Now' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-[#E5B80B] text-[#351E10]'
                          }`} style={{fontFamily: 'Telegraf, sans-serif'}}>
                            {getEventStatus(selectedEvent.start_date).label}
                          </span>
                        )}
                        {/* Event type badge */}
                        <span className="px-3 py-1.5 bg-[#E5B80B] text-[#351E10] rounded-full text-xs font-semibold shadow-sm" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          Event
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closeEventModal}
                    className="p-2.5 rounded-full hover:bg-white/20 transition-all duration-200 hover:scale-105 shadow-sm"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">



                <div className="space-y-6">

                  {/* Description Section */}
                  <div className="bg-gradient-to-br from-[#f8f9fa] to-[#f1f3f4] rounded-xl p-4 border border-[#E5B80B]/10">
                    <h4 className="text-lg font-bold text-[#351E10] mb-3 flex items-center" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      <i className="fa-solid fa-align-left mr-3 text-[#AB8841]"></i>
                      Description
                    </h4>
                    <p className="leading-relaxed text-gray-700" style={{fontFamily: 'Lora, serif'}}>{selectedEvent.description}</p>
                  </div>

                  {/* Event Details Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-[#f8f9fa] to-[#f1f3f4] rounded-xl p-4 border border-[#E5B80B]/10">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-[#E5B80B]/10 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="font-semibold text-[#351E10]" style={{fontFamily: 'Telegraf, sans-serif'}}>Date</span>
                      </div>
                      <p className="text-gray-700" style={{fontFamily: 'Lora, serif'}}>{new Date(selectedEvent.start_date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>

                    <div className="bg-gradient-to-br from-[#f8f9fa] to-[#f1f3f4] rounded-xl p-4 border border-[#E5B80B]/10">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-[#E5B80B]/10 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="font-semibold text-[#351E10]" style={{fontFamily: 'Telegraf, sans-serif'}}>Time</span>
                      </div>
                      <p className="text-gray-700" style={{fontFamily: 'Lora, serif'}}>{formatTime(selectedEvent.time)}</p>
                    </div>
                  </div>



                  {/* Additional Event Information */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {selectedEvent.location && (
                      <div className="bg-gradient-to-br from-[#f8f9fa] to-[#f1f3f4] rounded-xl p-4 border border-[#E5B80B]/10">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 bg-[#E5B80B]/10 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <span className="font-semibold text-[#351E10]" style={{fontFamily: 'Telegraf, sans-serif'}}>Location</span>
                        </div>
                        <p className="text-gray-700" style={{fontFamily: 'Lora, serif'}}>{selectedEvent.location}</p>
                      </div>
                    )}

                    <div className="bg-gradient-to-br from-[#f8f9fa] to-[#f1f3f4] rounded-xl p-4 border border-[#E5B80B]/10">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-[#E5B80B]/10 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <span className="font-semibold text-[#351E10]" style={{fontFamily: 'Telegraf, sans-serif'}}>Capacity</span>
                      </div>
                      <p className="text-gray-700" style={{fontFamily: 'Lora, serif'}}>{(selectedEvent.max_capacity || 50) - (selectedEvent.current_registrations || 0)} slots remaining</p>
                    </div>
                  </div>

                  {selectedEvent.organizer && (
                    <div className="bg-gradient-to-br from-[#f8f9fa] to-[#f1f3f4] rounded-xl p-4 border border-[#E5B80B]/10">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-[#E5B80B]/10 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="font-semibold text-[#351E10]" style={{fontFamily: 'Telegraf, sans-serif'}}>Organizer</span>
                      </div>
                      <p className="text-gray-700" style={{fontFamily: 'Lora, serif'}}>{selectedEvent.organizer}</p>
                    </div>
                  )}



                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">

                    {(selectedEvent.current_registrations || 0) >= (selectedEvent.max_capacity || 50) ? (
                      <button
                        disabled
                        className="px-6 py-3 bg-gray-400 text-white rounded-xl font-semibold cursor-not-allowed"
                      >
                        Event Full
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedEventForRegistration(selectedEvent);
                          setShowRegistration(true);
                          if (onEventRegistrationModalChange) {
                            onEventRegistrationModalChange(true);
                          }
                          closeEventModal();
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                      >
                        Register Now
                      </button>
                    )}

                    <button
                      onClick={closeEventModal}
                      className="px-6 py-3 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#8B6B21] text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                    >
                      Close
                    </button>

                  </div>

                </div>

              </div>

            </div>

          </div>

        )}

        {/* Event Registration Modal */}
        {showRegistration && selectedEventForRegistration && (
          <EventRegistration
            exhibit={selectedEventForRegistration}
            onClose={() => {
              setShowRegistration(false);
              setSelectedEventForRegistration(null);
              if (onEventRegistrationModalChange) {
                onEventRegistrationModalChange(false);
              }
            }}
            onRegistrationSuccess={(registration) => {
              console.log('Registration successful:', registration);
              setShowRegistration(false);
              setSelectedEventForRegistration(null);
              // Optionally refresh the events to update capacity
              fetchEvents();
            }}
            onShowNotification={(title, message) => {
              setNotification({
                show: true,
                type: 'success',
                title: title,
                message: message,
                description: ''
              });
            }}
          />
        )}

      </div>

    </section>
    </>
  );

};



export default Events;



