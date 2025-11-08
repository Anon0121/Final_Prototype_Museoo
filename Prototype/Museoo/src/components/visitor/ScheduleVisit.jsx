import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../config/api";
import citymus from "../../assets/citymus.jpg";
import logo from "../../assets/logo.png";

const TIME_SLOTS = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00"
];
const SLOT_CAPACITY = 30;

const ScheduleVisit = () => {
  const navigate = useNavigate();
  const [isGroup, setIsGroup] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [mainVisitor, setMainVisitor] = useState({
    firstName: "",
    lastName: "",
    gender: "", // Remove default - force user to choose
    address: "",
    email: "",
    visitorType: "",
    purpose: "educational",
    institution: "",
  });
  const [companions, setCompanions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [showConsentModal, setShowConsentModal] = useState(true);

  // Fetch real-time slots from database
  useEffect(() => {
    if (!visitDate) {
      setSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setLoading(true);
      try {
        console.log('🔄 Fetching slots for date:', visitDate);
        const response = await api.get(`/api/slots?date=${visitDate}`);
        console.log('✅ Slots received:', response.data);
        
        if (Array.isArray(response.data)) {
          setSlots(response.data);
        } else {
          // If no slots returned, create default slots for the date
          const defaultSlots = TIME_SLOTS.map(time => ({
            time,
            booked: 0,
            capacity: SLOT_CAPACITY
          }));
          setSlots(defaultSlots);
        }
      } catch (error) {
        console.error('❌ Error fetching slots:', error);
        // Fallback to default slots if API fails
        const fallbackSlots = TIME_SLOTS.map(time => ({
          time,
          booked: 0,
          capacity: SLOT_CAPACITY
        }));
        setSlots(fallbackSlots);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [visitDate]);

  const handleMainChange = (e) => {
    const { name, value } = e.target;
    setMainVisitor((prev) => ({ ...prev, [name]: value }));
  };

  const handleCompanionChange = (id, e) => {
    const { name, value } = e.target;
    setCompanions((prev) =>
      prev.map((companion) =>
        companion.id === id ? { ...companion, [name]: value } : companion
      )
    );
  };

  const addCompanion = () => {
    setCompanions((prev) => [
      ...prev,
      {
        id: Date.now(),
        email: "",
      },
    ]);
  };

  const removeCompanion = (id) => {
    setCompanions((prev) => prev.filter((companion) => companion.id !== id));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConsentConfirm = () => {
    setShowConsentModal(false);
  };

  const handleConsentDecline = () => {
    navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    const payload = {
      type: isGroup ? "group" : "individual",
      mainVisitor,
      companions: isGroup ? companions : [],
      totalVisitors: isGroup ? 1 + companions.length : 1,
      date: visitDate,
      time: selectedSlot,
    };

    try {
      console.log('📤 Submitting booking:', payload);
      const response = await api.post('/api/slots/book', payload);
      console.log('✅ Booking response:', response.data);
      
      if (response.data.success) {
        setSubmitStatus({
          type: 'success',
          message: 'Thank you for scheduling your visit to the City Museum of Cagayan de Oro! We truly appreciate your interest in exploring our cultural heritage. You will receive a confirmation email shortly with your booking details.'
        });
        // Reset form
        setMainVisitor({
          firstName: "",
          lastName: "",
          gender: "male",
          address: "",
          email: "",
          visitorType: "",
          purpose: "educational",
          institution: "",
        });
        setCompanions([]);
        setVisitDate("");
        setSelectedSlot("");
        setSlots([]);
      } else {
        setSubmitStatus({
          type: 'error',
          message: response.data.error || 'Booking submission failed. Please try again later.'
        });
      }
    } catch (error) {
      console.error('❌ Booking error:', error);
      setSubmitStatus({
        type: 'error',
        message: error.response?.data?.error || 'Booking submission failed. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/60 backdrop-blur-sm">
          <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-[#351E10] via-[#5C3A18] to-[#8B6B21] px-6 py-5 sm:px-8 sm:py-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <i className="fa-solid fa-shield-halved text-xl sm:text-2xl"></i>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    Privacy & Data Consent
                  </h2>
                  <p className="text-white/80 text-sm sm:text-base" style={{fontFamily: 'Lora, serif'}}>
                    We value your privacy. Please review and accept our terms before booking your visit.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 sm:px-8 sm:py-6 space-y-4 text-sm sm:text-base text-gray-700" style={{fontFamily: 'Lora, serif'}}>
              <p>
                By proceeding with the scheduling form, you acknowledge and agree that the City Museum of Cagayan de Oro may collect, store, and process the personal information you provide. This information is used solely for managing your visit, coordinating with your group, and documenting museum attendance.
              </p>
              <p>
                The museum commits to handling your data in accordance with the Data Privacy Act of 2012 and applicable local regulations. We will not share your information with third parties without your explicit consent, except as required by law.
              </p>
              <p className="font-semibold text-[#351E10]" style={{fontFamily: 'Telegraf, sans-serif'}}>
                Do you agree to these terms and allow us to collect and process your information for scheduling purposes?
              </p>
            </div>

            <div className="px-6 py-5 sm:px-8 sm:py-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleConsentDecline}
                className="w-full sm:w-1/2 px-4 py-3 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-all duration-200"
                style={{fontFamily: 'Telegraf, sans-serif'}}
              >
                I Decline
              </button>
              <button
                onClick={handleConsentConfirm}
                className="w-full sm:w-1/2 px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl"
                style={{background: 'linear-gradient(135deg, #8B6B21 0%, #D4AF37 100%)', fontFamily: 'Telegraf, sans-serif'}}
              >
                I Agree & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={showConsentModal ? "pointer-events-none select-none opacity-40" : "opacity-100 transition-opacity duration-300"}>
      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-2 sm:py-3 md:py-4">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              <img src={logo} className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16" alt="Logo" />
              <div className="min-w-0 flex-1">
                <h1 className="text-xs sm:text-sm md:text-lg lg:text-2xl font-bold text-gray-800 truncate">City Museum of Cagayan de Oro</h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Schedule Your Visit</p>
              </div>
            </Link>
            <Link
              to="/"
              className="bg-gradient-to-r from-[#AB8841] to-[#8B6B21] hover:from-[#8B6B21] hover:to-[#6B5B00] text-white px-2 sm:px-3 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg md:rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm md:text-base flex-shrink-0 ml-2"
            >
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="max-w-2xl mx-auto">
          {/* Page Header - Only show if no success status */}
          {!submitStatus && (
          <div className="text-center mb-3 sm:mb-4">
            <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-[#AB8841] rounded-full mb-2">
              <i className="fa-solid fa-calendar-days text-white text-sm sm:text-lg"></i>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#2e2b41] mb-1">Schedule Your Visit</h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto px-2">
            Plan your museum experience by booking a time slot. We offer guided tours and educational programs for visitors of all ages.
          </p>
        </div>
          )}

          {/* Progress Steps - Only show if no success status */}
          {!submitStatus && (
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    currentStep >= step 
                      ? 'bg-[#AB8841] text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-6 sm:w-8 h-1 mx-0.5 sm:mx-1 ${
                      currentStep > step ? 'bg-[#AB8841]' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-1 space-x-2 sm:space-x-4 md:space-x-6">
              <span className={`text-xs font-medium ${currentStep >= 1 ? 'text-[#AB8841]' : 'text-gray-500'}`}>
                Visitor
              </span>
              <span className={`text-xs font-medium ${currentStep >= 2 ? 'text-[#AB8841]' : 'text-gray-500'}`}>
                Schedule
              </span>
              <span className={`text-xs font-medium ${currentStep >= 3 ? 'text-[#AB8841]' : 'text-gray-500'}`}>
                Review
              </span>
            </div>
          </div>
          )}

          {/* Status Message */}
          {submitStatus && (
            <div className={`relative overflow-hidden rounded-2xl mb-6 shadow-xl ${
              submitStatus.type === 'success' 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200' 
                : 'bg-gradient-to-br from-red-50 to-pink-50 border border-red-200'
            }`}>
              {/* Decorative background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-4 right-4 w-20 h-20 bg-current rounded-full"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 bg-current rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-current rounded-full"></div>
              </div>
              
              <div className="relative p-8">
                <div className="text-center">
                  {/* Success Icon */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 shadow-lg ${
                    submitStatus.type === 'success' 
                      ? 'bg-gradient-to-br from-green-400 to-green-600' 
                      : 'bg-gradient-to-br from-red-400 to-red-600'
                  }`}>
                    <i className={`fa-solid text-2xl text-white ${
                      submitStatus.type === 'success' ? 'fa-check' : 'fa-exclamation-triangle'
                    }`}></i>
                </div>
                  
                  {/* Title */}
                  <h3 className={`text-2xl font-bold mb-4 ${
                  submitStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {submitStatus.type === 'success' ? 'Thank You for Your Interest!' : 'Scheduling Error'}
                  </h3>
                  
                  {/* Message */}
                  <p className={`text-lg leading-relaxed max-w-2xl mx-auto mb-8 ${
                    submitStatus.type === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {submitStatus.message}
                </p>
                  
                  {/* Action Button */}
                  {submitStatus.type === 'success' && (
                    <div className="flex justify-center">
                      <Link
                        to="/"
                        className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#AB8841] to-[#8B6B21] text-white text-lg font-semibold rounded-xl hover:from-[#8B6B21] hover:to-[#6B5B00] transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 border-2 border-transparent hover:border-[#AB8841]"
                      >
                        <i className="fa-solid fa-home mr-3 text-xl"></i>
                        Back to Home
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

              {/* Form Card - Only show if no success status */}
              {!submitStatus && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

            <form onSubmit={handleSubmit}>
              {/* Step 1: Visitor Information */}
              {currentStep === 1 && (
                <div className="p-3 sm:p-4">
                  <div className="text-center mb-3 sm:mb-4">
                <div className="inline-flex items-center justify-center w-8 h-8 bg-[#AB8841] rounded-full mb-2">
                  <i className="fa-solid fa-user text-white text-sm"></i>
                </div>
                    <h3 className="text-lg font-bold text-[#2e2b41] mb-1">Visitor Information</h3>
                    <p className="text-xs text-gray-600">Please provide your basic contact details</p>
                  </div>

            {/* Booking Type Toggle */}
                  <div className="text-center mb-4">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Booking Type</label>
                    <div className="inline-flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                        className={`px-3 py-1 rounded-md text-sm font-semibold transition-all duration-300 ${
                    !isGroup 
                            ? 'bg-white text-[#AB8841] shadow-lg transform scale-105' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setIsGroup(false)}
                >
                  <div className="flex items-center">
                          <i className="fa-solid fa-user mr-1 text-xs"></i>
                          Individual
                  </div>
                </button>
                <button
                  type="button"
                        className={`px-3 py-1 rounded-md text-sm font-semibold transition-all duration-300 ${
                    isGroup 
                            ? 'bg-white text-[#AB8841] shadow-lg transform scale-105' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setIsGroup(true)}
                >
                  <div className="flex items-center">
                          <i className="fa-solid fa-users mr-1 text-xs"></i>
                          Group
                  </div>
                </button>
              </div>
            </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#2e2b41] font-semibold mb-1 text-sm">
                        First Name *
                  </label>
                        <input
                        type="text"
                        name="firstName"
                        value={mainVisitor.firstName}
                          onChange={handleMainChange}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                        placeholder="Enter your first name"
                          required
                        />
                        </div>
                    <div>
                      <label className="block text-[#2e2b41] font-semibold mb-1 text-sm">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={mainVisitor.lastName}
                        onChange={handleMainChange}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                        placeholder="Enter your last name"
                        required
                      />
                  </div>
                    <div>
                      <label className="block text-[#2e2b41] font-semibold mb-1 text-sm">
                        Email Address *
                  </label>
                        <input
                        type="email"
                        name="email"
                        value={mainVisitor.email}
                          onChange={handleMainChange}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                        placeholder="Enter your email address"
                          required
                        />
                        </div>
                    <div>
                      <label className="block text-[#2e2b41] font-semibold mb-1 text-sm">
                        Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={mainVisitor.address}
                        onChange={handleMainChange}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                        placeholder="Enter your address (optional)"
                      />
                  </div>
                    <div>
                      <label className="block text-[#2e2b41] font-semibold mb-1 text-sm">
                        Gender *
                      </label>
                      <select
                        name="gender"
                        value={mainVisitor.gender}
                        onChange={handleMainChange}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                        required
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="LGBTQ+">LGBTQ+</option>
                      </select>
                </div>
                    <div>
                      <label className="block text-[#2e2b41] font-semibold mb-1 text-sm">
                        Visitor Type *
                      </label>
                      <select
                        name="visitorType"
                        value={mainVisitor.visitorType}
                        onChange={handleMainChange}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                        required
                      >
                        <option value="">Select visitor type</option>
                        <option value="Local">Local</option>
                        <option value="Foreign">Foreign</option>
                      </select>
              </div>
                    <div>
                      <label className="block text-[#2e2b41] font-semibold mb-1 text-sm">
                        Purpose of Visit *
                      </label>
                      <select
                        name="purpose"
                        value={mainVisitor.purpose}
                        onChange={handleMainChange}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                        required
                      >
                        <option value="educational">Educational</option>
                        <option value="research">Research</option>
                        <option value="leisure">Leisure</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#2e2b41] font-semibold mb-1 text-sm">
                        Institution/Organization
                      </label>
                      <input
                        type="text"
                        name="institution"
                        value={mainVisitor.institution}
                        onChange={handleMainChange}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                        placeholder="e.g., University, Company, School (optional)"
                      />
                    </div>
                  </div>
                
                  <div className="flex justify-end mt-4">
                <button
                  type="button"
                      onClick={nextStep}
                      className="px-4 py-2 bg-[#AB8841] text-white text-sm rounded-lg font-semibold hover:bg-[#8B6B21] transition-colors"
                    >
                      Next Step
                      <i className="fa-solid fa-arrow-right ml-1 text-xs"></i>
                    </button>
                  </div>
              </div>
            )}

              {/* Step 2: Schedule Details */}
              {currentStep === 2 && (
                <div className="p-4">
                  <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-8 h-8 bg-[#AB8841] rounded-full mb-2">
                  <i className="fa-solid fa-calendar text-white text-sm"></i>
                </div>
                    <h3 className="text-lg font-bold text-[#2e2b41] mb-1">Schedule Details</h3>
                    <p className="text-xs text-gray-600">Choose your preferred date and time for the visit</p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-[#2e2b41] font-semibold mb-1 text-sm">
                      Visit Date *
                    </label>
                    <input
                  type="date" 
                  value={visitDate} 
                  onChange={e => setVisitDate(e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                  min={new Date().toISOString().split('T')[0]}
                      required
                />
              </div>

              {/* Time Slot Selection */}
              {visitDate && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-[#2e2b41] mb-2">
                    Select a Time Slot {slots.length > 0 && `(${slots.length} available)`}
                      </h4>
                  
                  {/* Loading state */}
                  {loading && (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#AB8841]"></div>
                            <span className="text-sm text-gray-600">Loading available slots...</span>
                      </div>
                    </div>
                  )}
                  
                      {/* Time slots grid */}
                  {!loading && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      {Array.isArray(slots) && slots.length > 0 ? slots.map(slot => {
                        const isAvailable = slot.capacity > slot.booked;
                        const isSelected = selectedSlot === slot.time;
                        const occupancyPercentage = Math.round((slot.booked / slot.capacity) * 100);
                        
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => isAvailable && setSelectedSlot(slot.time)}
                            disabled={!isAvailable}
                                className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                              isSelected
                                    ? 'border-[#AB8841] bg-[#AB8841] text-white shadow-lg'
                                : isAvailable
                                    ? 'border-gray-200 bg-white hover:border-[#AB8841] hover:shadow-md'
                                : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                            }`}
                          >
                                <div className="text-center">
                                  <div className={`font-semibold text-sm mb-1 ${isSelected ? 'text-white' : 'text-gray-800'}`}>{slot.time}</div>
                                  <div className={`text-xs mb-1 ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                                    {slot.capacity - slot.booked} / {slot.capacity} available
                                  </div>
                                  <div className={`w-full rounded-full h-1 ${isSelected ? 'bg-white' : 'bg-gray-200'}`}>
                                    <div 
                                      className={`h-1 rounded-full transition-all duration-300 ${
                                        isSelected ? 'bg-white' :
                                        occupancyPercentage > 80 ? 'bg-red-500' : 
                                        occupancyPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                      }`}
                                      style={{ width: `${occupancyPercentage}%` }}
                                    ></div>
                                  </div>
                                  <div className={`text-xs mt-1 ${isSelected ? 'text-white' : 'text-gray-500'}`}>{occupancyPercentage}% full</div>
                                </div>
                              </button>
                            );
                          }) : (
                            <div className="col-span-full text-center py-6">
                              <div className="text-gray-500">
                                <i className="fa-solid fa-clock text-3xl mx-auto mb-3 text-gray-300"></i>
                                <p className="text-sm">No time slots available for this date</p>
                                <p className="text-xs text-gray-400 mt-1">Please try a different date</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Group Members Section */}
                  {isGroup && (
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-[#2e2b41] mb-4">
                        Group Members ({companions.length + 1} total)
                      </h4>
                      
                      {companions.map((companion, idx) => (
                        <div key={companion.id} className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                          <div className="flex justify-between items-center mb-4">
                            <h5 className="font-semibold text-gray-800">Companion {idx + 2}</h5>
                            <button
                              type="button"
                              onClick={() => removeCompanion(companion.id)}
                              className="text-red-600 hover:text-red-800 transition-colors p-1"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                          <div>
                            <label className="block text-[#2e2b41] font-semibold mb-1 text-sm">
                              Email Address *
                            </label>
                            <input
                              type="email"
                              name="email"
                              value={companion.email}
                              onChange={e => handleCompanionChange(companion.id, e)}
                              className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                              placeholder="companion@example.com"
                              required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Companion will receive a link to complete their details after booking approval.
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={addCompanion}
                        className="w-full bg-[#AB8841] hover:bg-[#8B6B21] text-white py-3 px-6 rounded-xl font-semibold transition-colors"
                      >
                        <i className="fa-solid fa-plus mr-2"></i>
                        Add Companion
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between mt-8">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
                    >
                      <i className="fa-solid fa-arrow-left mr-2"></i>
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!selectedSlot}
                      className="px-6 py-3 bg-[#AB8841] text-white rounded-xl font-semibold hover:bg-[#8B6B21] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Next Step
                      <i className="fa-solid fa-arrow-right ml-2"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Review & Submit */}
              {currentStep === 3 && (
                <div className="p-4">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-[#AB8841] rounded-full mb-2">
                      <i className="fa-solid fa-eye text-white text-sm"></i>
                    </div>
                    <h3 className="text-lg font-bold text-[#2e2b41] mb-1">Review & Submit</h3>
                    <p className="text-xs text-gray-600">Please review your information before submitting</p>
                  </div>

                  {/* Review Information */}
                  <div className="space-y-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                        <div className="w-5 h-5 bg-[#AB8841] rounded-full flex items-center justify-center mr-2">
                          <i className="fa-solid fa-user text-white text-xs"></i>
                        </div>
                        Visitor Information
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs font-medium text-gray-600">Name:</span>
                          <p className="text-gray-800 font-semibold text-sm">{mainVisitor.firstName} {mainVisitor.lastName}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-600">Email:</span>
                          <p className="text-gray-800 font-semibold text-sm">{mainVisitor.email}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-600">Address:</span>
                          <p className="text-gray-800 font-semibold text-sm">{mainVisitor.address || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-600">Gender:</span>
                          <p className="text-gray-800 font-semibold text-sm">{mainVisitor.gender}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-600">Visitor Type:</span>
                          <p className="text-gray-800 font-semibold text-sm">{mainVisitor.visitorType}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-600">Purpose:</span>
                          <p className="text-gray-800 font-semibold text-sm capitalize">{mainVisitor.purpose}</p>
                        </div>
                        {mainVisitor.institution && (
                          <div className="md:col-span-2">
                            <span className="text-xs font-medium text-gray-600">Institution:</span>
                            <p className="text-gray-800 font-semibold text-sm">{mainVisitor.institution}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                        <div className="w-5 h-5 bg-[#AB8841] rounded-full flex items-center justify-center mr-2">
                          <i className="fa-solid fa-calendar text-white text-xs"></i>
                        </div>
                        Schedule Details
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs font-medium text-gray-600">Visit Date:</span>
                          <p className="text-gray-800 font-semibold text-sm">{new Date(visitDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-600">Time Slot:</span>
                          <p className="text-gray-800 font-semibold text-sm">{selectedSlot}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-600">Visit Type:</span>
                          <p className="text-gray-800 font-semibold text-sm">{isGroup ? 'Group Visit' : 'Individual Visit'}</p>
                        </div>
                        {isGroup && (
                          <div>
                            <span className="text-xs font-medium text-gray-600">Group Size:</span>
                            <p className="text-gray-800 font-semibold text-sm">{companions.length + 1} people</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {isGroup && companions.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                          <div className="w-5 h-5 bg-[#AB8841] rounded-full flex items-center justify-center mr-2">
                            <i className="fa-solid fa-users text-white text-xs"></i>
                          </div>
                          Group Members
                        </h4>
                        <div className="space-y-2">
                          {companions.map((companion, idx) => (
                            <div key={companion.id} className="flex justify-between items-center bg-white rounded-lg p-2">
                              <span className="text-gray-800 font-medium text-sm">Companion {idx + 2}</span>
                              <span className="text-gray-600 text-sm">{companion.email}</span>
                            </div>
                          ))}
                        </div>
                </div>
              )}
            </div>

                  <div className="flex justify-between mt-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                    >
                      <i className="fa-solid fa-arrow-left mr-1 text-xs"></i>
                      Previous
                    </button>
            <button
              type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-[#AB8841] text-white text-sm rounded-lg font-semibold hover:bg-[#8B6B21] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin mr-1 text-xs"></i>
                          Scheduling Visit...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-calendar-check mr-1 text-xs"></i>
                          Schedule My Visit
                        </>
                      )}
                    </button>
                </div>
                </div>
              )}
          </form>
        </div>
          )}

          {/* Information Cards - Only show if no success status */}
          {!submitStatus && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6">
                <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 border border-gray-100">
                  <div className="w-8 h-8 bg-[#AB8841] rounded-lg flex items-center justify-center mb-3">
                    <i className="fa-solid fa-clock text-white text-sm"></i>
                  </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Visit Duration</h3>
              <p className="text-xs text-gray-600">Each time slot is 1 hour long, perfect for exploring our exhibits.</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="w-8 h-8 bg-[#AB8841] rounded-lg flex items-center justify-center mb-3">
                <i className="fa-solid fa-gift text-white text-sm"></i>
          </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Free Admission</h3>
              <p className="text-xs text-gray-600">All visits are completely free. No admission fees required.</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="w-8 h-8 bg-[#AB8841] rounded-lg flex items-center justify-center mb-3">
                <i className="fa-solid fa-check-circle text-white text-sm"></i>
          </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Confirmation</h3>
              <p className="text-xs text-gray-600">You'll receive an email confirmation with your booking details.</p>
            </div>
          </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};


export default ScheduleVisit;
