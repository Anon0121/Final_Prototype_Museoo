import React, { useState } from 'react';
import api from '../../config/api';

const EventRegistration = ({ exhibit, onClose, onRegistrationSuccess, onShowNotification }) => {
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    gender: '',
    email: '',
    visitor_type: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear email error when user types
    if (name === 'email' && emailError) {
      setEmailError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setEmailError('');

    try {
      console.log('🔄 Submitting registration for event:', exhibit.id);
      console.log('📝 Form data:', form);
      
      const response = await api.post('/api/event-registrations/register', {
        event_id: exhibit.id,
        ...form
      });

      console.log('📡 Registration response:', response.data);

      if (response.data.success) {
        console.log('✅ Registration successful, closing form and showing notification');
        
        // Close the form first
        onClose();
        
        // Scroll to Events section and show notification
        setTimeout(() => {
          const eventsSection = document.getElementById('event');
          if (eventsSection) {
            eventsSection.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
          
          // Show notification after scrolling
          setTimeout(() => {
            if (onShowNotification) {
              onShowNotification('Registration Successful!', 'You have successfully registered for the event.');
            }
          }, 500);
        }, 100);
        
        if (onRegistrationSuccess) {
          onRegistrationSuccess(response.data.registration);
        }
      } else {
        console.log('❌ Registration failed:', response.data.error);
        setError(response.data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('❌ Error response:', error.response?.data);
      
      // Check if it's an already registered case (which now returns success)
      if (error.response?.data?.success && error.response?.data?.alreadyRegistered) {
        console.log('✅ Already registered case, closing form and showing notification');
        
        // Close the form first
        onClose();
        
        // Scroll to Events section and show notification
        setTimeout(() => {
          const eventsSection = document.getElementById('event');
          if (eventsSection) {
            eventsSection.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
          
          // Show notification after scrolling
          setTimeout(() => {
            if (onShowNotification) {
              onShowNotification('Already Registered!', 'You are already registered for this event.');
            }
          }, 500);
        }, 100);
        
        if (onRegistrationSuccess) {
          onRegistrationSuccess(error.response.data.registration);
        }
      } else {
        console.log('❌ Setting error message:', error.response?.data?.error);
        
        // Check if it's a duplicate email error
        if (error.response?.data?.error === 'Email already registered!') {
          setEmailError('Email already registered! Please use a different email address.');
          // Scroll to email field
          setTimeout(() => {
            const emailField = document.querySelector('input[name="email"]');
            if (emailField) {
              emailField.scrollIntoView({ behavior: 'smooth', block: 'center' });
              emailField.focus();
            }
          }, 100);
        } else {
          setError(error.response?.data?.error || 'Failed to register for event');
          // Scroll to top of form to show error banner
          setTimeout(() => {
            const formContainer = document.querySelector('.overflow-y-auto');
            if (formContainer) {
              formContainer.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }, 100);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessPopup(false);
    onClose(); // Close the registration form as well
  };

  return (
    <>
      {/* Registration Form Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[99999] p-4">
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
        <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          {/* Fixed Header with Museum Branding */}
          <div className="p-6 border-b border-[#E5B80B]/20 bg-gradient-to-r from-[#351E10] to-[#2A1A0D] rounded-t-2xl flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-2" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  Event Registration
                </h2>
                <p className="text-white/90 text-sm leading-relaxed" style={{fontFamily: 'Lora, serif'}}>
                  {exhibit.title}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-full hover:bg-white/20 transition-all duration-200 hover:scale-105 shadow-sm"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                <div className="flex items-center">
                  <i className="fa-solid fa-exclamation-triangle text-red-500 mr-3"></i>
                  <p className="text-red-700 font-medium" style={{fontFamily: 'Telegraf, sans-serif'}}>{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[#351E10] font-semibold text-sm uppercase tracking-wide" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstname"
                    value={form.firstname}
                    onChange={handleChange}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter your first name"
                    style={{fontFamily: 'Lora, serif'}}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[#351E10] font-semibold text-sm uppercase tracking-wide" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastname"
                    value={form.lastname}
                    onChange={handleChange}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter your last name"
                    style={{fontFamily: 'Lora, serif'}}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[#351E10] font-semibold text-sm uppercase tracking-wide" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5B80B] transition-all duration-200 bg-gray-50 focus:bg-white ${
                    emailError 
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400' 
                      : 'border-gray-200 focus:border-[#E5B80B]'
                  }`}
                  placeholder="Enter your email address"
                  style={{fontFamily: 'Lora, serif'}}
                  required
                />
                {emailError && (
                  <p className="text-red-600 text-sm mt-1 flex items-center" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    <i className="fa-solid fa-exclamation-circle mr-2"></i>
                    {emailError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[#351E10] font-semibold text-sm uppercase tracking-wide" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-200 bg-gray-50 focus:bg-white"
                    style={{fontFamily: 'Lora, serif'}}
                    required
                  >
                    <option value="">Select your gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="lgbtq">LGBTQ+</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[#351E10] font-semibold text-sm uppercase tracking-wide" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    Visitor Type *
                  </label>
                  <select
                    name="visitor_type"
                    value={form.visitor_type}
                    onChange={handleChange}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-200 bg-gray-50 focus:bg-white"
                    style={{fontFamily: 'Lora, serif'}}
                    required
                  >
                    <option value="">Select visitor type</option>
                    <option value="local">Local Visitor</option>
                    <option value="foreign">Foreign Visitor</option>
                  </select>
                </div>
              </div>

              {/* Event Details Section */}
              <div className="bg-gradient-to-br from-[#f8f9fa] to-[#f1f3f4] p-6 rounded-xl border border-[#E5B80B]/10">
                <h3 className="text-lg font-bold text-[#351E10] mb-4 flex items-center" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  <i className="fa-solid fa-calendar-check mr-3 text-[#E5B80B]"></i>
                  Event Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#E5B80B]/10 rounded-lg flex items-center justify-center">
                      <i className="fa-solid fa-calendar text-[#8B6B21]"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium" style={{fontFamily: 'Telegraf, sans-serif'}}>Date</p>
                      <p className="text-[#351E10] font-semibold" style={{fontFamily: 'Lora, serif'}}>{new Date(exhibit.start_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#E5B80B]/10 rounded-lg flex items-center justify-center">
                      <i className="fa-solid fa-clock text-[#8B6B21]"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium" style={{fontFamily: 'Telegraf, sans-serif'}}>Time</p>
                      <p className="text-[#351E10] font-semibold" style={{fontFamily: 'Lora, serif'}}>{exhibit.time ? new Date(`2000-01-01T${exhibit.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'TBD'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#E5B80B]/10 rounded-lg flex items-center justify-center">
                      <i className="fa-solid fa-map-marker-alt text-[#8B6B21]"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium" style={{fontFamily: 'Telegraf, sans-serif'}}>Location</p>
                      <p className="text-[#351E10] font-semibold" style={{fontFamily: 'Lora, serif'}}>{exhibit.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#E5B80B]/10 rounded-lg flex items-center justify-center">
                      <i className="fa-solid fa-users text-[#8B6B21]"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium" style={{fontFamily: 'Telegraf, sans-serif'}}>Available Slots</p>
                      <p className="text-[#351E10] font-semibold" style={{fontFamily: 'Lora, serif'}}>{(exhibit.max_capacity || 0) - (exhibit.current_registrations || 0)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#8B6B21] text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{fontFamily: 'Telegraf, sans-serif'}}
                >
                  {submitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-3"></i>
                      Registering...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-user-plus mr-3"></i>
                      Register Now
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                  style={{fontFamily: 'Telegraf, sans-serif'}}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EventRegistration;
