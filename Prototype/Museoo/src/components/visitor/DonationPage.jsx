import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/logo.png';
import citymus from '../../assets/citymus.jpg';

const DonationPage = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    donor_email: '',
    donor_contact: '',
    country_code: '+63',
    preferred_visit_date: '',
    preferred_visit_time: '',
    notes: '',
    // Donation details
    type: 'monetary',
    amount: '',
    item_description: '',
    estimated_value: '',
    condition: '',
    loan_start_date: '',
    loan_end_date: '',
    // File uploads
    artifact_images: [],
    loan_images: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      alert('Please upload only images (JPG, PNG, GIF) or PDF files under 10MB each.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], ...validFiles]
    }));
  };

  const removeFile = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Prepare FormData for file uploads
      const formDataToSend = new FormData();
      
      // Add basic information
      formDataToSend.append('donor_name', `${formData.first_name} ${formData.last_name}`.trim());
      formDataToSend.append('donor_email', formData.donor_email);
      formDataToSend.append('donor_contact', `${formData.country_code}${formData.donor_contact}`);
      formDataToSend.append('preferred_visit_date', formData.preferred_visit_date);
      formDataToSend.append('preferred_visit_time', formData.preferred_visit_time);
      formDataToSend.append('notes', formData.notes);
      
      // Add donation details
      formDataToSend.append('type', formData.type);
      formDataToSend.append('amount', formData.amount || '');
      formDataToSend.append('item_description', formData.item_description || '');
      formDataToSend.append('estimated_value', formData.estimated_value || '');
      formDataToSend.append('condition', formData.condition || '');
      formDataToSend.append('loan_start_date', formData.loan_start_date || '');
      formDataToSend.append('loan_end_date', formData.loan_end_date || '');
      
      // Add files based on donation type
      if (formData.type === 'artifact' && formData.artifact_images.length > 0) {
        formData.artifact_images.forEach((file, index) => {
          formDataToSend.append('artifact_images', file);
        });
      }
      
      if (formData.type === 'loan' && formData.loan_images.length > 0) {
        formData.loan_images.forEach((file, index) => {
          formDataToSend.append('loan_images', file);
        });
      }
      
      const response = await axios.post('http://localhost:3000/api/donations/request', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        setSubmitStatus({
          type: 'success',
          message: 'Thank you for your interest in donating to the City Museum of Cagayan de Oro! We truly appreciate your generosity and commitment to preserving our cultural heritage. Our team will review your donation request and contact you soon.',
          donationId: response.data.donationId
        });
        
        // Keep form visible below success message (don't reset)
      }
    } catch (error) {
      console.error('Meeting request submission error:', error);
      setSubmitStatus({
        type: 'error',
        message: 'There was an error submitting your meeting request. Please try again or contact us directly.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return formData.first_name && formData.last_name && formData.donor_email && formData.donor_contact;
      case 2:
        return formData.type && (
          (formData.type === 'monetary' && formData.amount) ||
          (formData.type === 'artifact' && formData.item_description && formData.artifact_images.length > 0) ||
          (formData.type === 'loan' && formData.item_description && formData.loan_start_date && formData.loan_end_date && formData.loan_images.length > 0)
        );
      case 3:
        return formData.preferred_visit_date && formData.preferred_visit_time;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-2 sm:py-3 md:py-4">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              <img src={logo} className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16" alt="Logo" />
              <div className="min-w-0 flex-1">
                <h1 className="text-xs sm:text-sm md:text-lg lg:text-2xl font-bold text-gray-800 truncate">City Museum of Cagayan de Oro</h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Donation Meeting Request</p>
              </div>
            </Link>
            <Link
              to="/"
              className="bg-gradient-to-r from-[#AB8841] to-[#8B6B21] hover:from-[#8B6B21] hover:to-[#6B5B00] text-white px-2 sm:px-3 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg md:rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm md:text-base flex-shrink-0 ml-2"
            >
              <i className="fa-solid fa-home mr-1 sm:mr-2"></i>
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Home</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="max-w-2xl mx-auto">
          {/* Page Header - Only show if no success status */}
          {!submitStatus && (
          <div className="text-center mb-3 sm:mb-4">
            <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-[#AB8841] rounded-full mb-2">
              <i className="fa-solid fa-gift text-white text-sm sm:text-lg"></i>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#2e2b41] mb-1">Schedule a Donation Meeting</h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto px-2">
              Interested in making a donation? Schedule a meeting with our staff to discuss your contribution and how it can help preserve our cultural heritage.
            </p>
          </div>
          )}

          {/* Progress Steps - Only show if no success status */}
          {!submitStatus && (
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    currentStep >= step 
                      ? 'bg-[#AB8841] text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`w-6 sm:w-8 h-1 mx-0.5 sm:mx-1 ${
                      currentStep > step ? 'bg-[#AB8841]' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-1 space-x-2 sm:space-x-4 md:space-x-6">
              <span className={`text-xs font-medium ${currentStep >= 1 ? 'text-[#AB8841]' : 'text-gray-500'}`}>
                Contact
              </span>
              <span className={`text-xs font-medium ${currentStep >= 2 ? 'text-[#AB8841]' : 'text-gray-500'}`}>
                Details
              </span>
              <span className={`text-xs font-medium ${currentStep >= 3 ? 'text-[#AB8841]' : 'text-gray-500'}`}>
                Meeting
              </span>
              <span className={`text-xs font-medium ${currentStep >= 4 ? 'text-[#AB8841]' : 'text-gray-500'}`}>
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
                    {submitStatus.type === 'success' ? 'Thank You for Your Generosity!' : 'Submission Error'}
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
              {/* Step 1: Contact Information */}
              {currentStep === 1 && (
                <div className="p-3 sm:p-4">
                  <div className="text-center mb-3 sm:mb-4">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-[#AB8841] rounded-full mb-2">
                      <i className="fa-solid fa-user text-white text-sm"></i>
                    </div>
                    <h3 className="text-lg font-bold text-[#2e2b41] mb-1">Contact Information</h3>
                    <p className="text-xs text-gray-600">Please provide your basic contact details</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#2e2b41] font-semibold mb-1 text-sm">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
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
                        name="last_name"
                        value={formData.last_name}
                      onChange={handleChange}
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
                      name="donor_email"
                      value={formData.donor_email}
                      onChange={handleChange}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                        placeholder="Enter your email address"
                      required
                    />
                  </div>
                  <div>
                      <label className="block text-[#2e2b41] font-semibold mb-1 text-sm">
                        Contact Number *
                    </label>
                      <div className="flex">
                        <select
                          name="country_code"
                          value={formData.country_code || '+63'}
                          onChange={handleChange}
                          className="w-16 sm:w-20 p-2 text-xs sm:text-sm border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all bg-gray-50"
                          required
                        >
                        <option value="+63">🇵🇭 +63</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+81">🇯🇵 +81</option>
                        <option value="+82">🇰🇷 +82</option>
                        <option value="+86">🇨🇳 +86</option>
                        <option value="+65">🇸🇬 +65</option>
                        <option value="+60">🇲🇾 +60</option>
                        <option value="+66">🇹🇭 +66</option>
                        <option value="+84">🇻🇳 +84</option>
                      </select>
                      <input
                        type="tel"
                        name="donor_contact"
                        value={formData.donor_contact}
                        onChange={handleChange}
                        className="flex-1 p-2 text-sm border border-l-0 border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!isStepValid(1)}
                      className="px-4 py-2 bg-[#AB8841] text-white text-sm rounded-lg font-semibold hover:bg-[#8B6B21] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next Step
                      <i className="fa-solid fa-arrow-right ml-1 text-xs"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Donation Details */}
              {currentStep === 2 && (
                <div className="p-4">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-[#AB8841] rounded-full mb-2">
                      <i className="fa-solid fa-gift text-white text-sm"></i>
                    </div>
                    <h3 className="text-lg font-bold text-[#2e2b41] mb-1">Donation Details</h3>
                    <p className="text-xs text-gray-600">What would you like to donate to the museum?</p>
                  </div>

                  <div className="space-y-4">
                    {/* Donation Type */}
                    <div>
                      <label className="block text-[#2e2b41] font-semibold mb-1 text-sm">
                        Donation Type *
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                        required
                      >
                        <option value="monetary">💰 Monetary Donation</option>
                        <option value="artifact">🏺 Artifact/Historical Item</option>
                        <option value="loan">📋 Loan (Temporary)</option>
                      </select>
                    </div>

                    {/* Conditional Fields Based on Type */}
                    {formData.type === 'monetary' && (
                      <div>
                        <label className="block text-[#2e2b41] font-semibold mb-1 text-sm">
                          Donation Amount (₱) *
                        </label>
                        <input
                          type="number"
                          name="amount"
                          value={formData.amount}
                          onChange={handleChange}
                          className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                          placeholder="Enter donation amount"
                          min="1"
                          required
                        />
                      </div>
                    )}

                    {formData.type === 'artifact' && (
                      <>
                        <div>
                          <label className="block text-[#2e2b41] font-semibold mb-1 text-sm">
                            Item Description *
                          </label>
                          <textarea
                            name="item_description"
                            value={formData.item_description}
                            onChange={handleChange}
                            className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                            rows="3"
                            placeholder="Describe the artifact in detail (e.g., historical significance, age, condition, etc.)"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[#2e2b41] font-semibold mb-1 text-sm">
                              Estimated Value (₱)
                            </label>
                            <input
                              type="number"
                              name="estimated_value"
                              value={formData.estimated_value}
                              onChange={handleChange}
                              className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                              placeholder="Estimated value"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-[#2e2b41] font-semibold mb-1 text-sm">
                              Condition
                            </label>
                            <select
                              name="condition"
                              value={formData.condition}
                              onChange={handleChange}
                              className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                            >
                              <option value="">Select condition</option>
                              <option value="excellent">Excellent</option>
                              <option value="good">Good</option>
                              <option value="fair">Fair</option>
                              <option value="poor">Poor</option>
                            </select>
                          </div>
                        </div>
                        
                        {/* File Upload for Artifacts */}
                        <div>
                          <label className="block text-[#2e2b41] font-semibold mb-1 text-sm">
                            Upload Photos/Documents *
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#AB8841] transition-colors">
                            <input
                              type="file"
                              multiple
                              accept="image/*,.pdf"
                              onChange={(e) => handleFileUpload(e, 'artifact_images')}
                              className="hidden"
                              id="artifact-upload"
                            />
                            <label
                              htmlFor="artifact-upload"
                              className="cursor-pointer flex flex-col items-center"
                            >
                              <i className="fa-solid fa-cloud-upload-alt text-2xl text-gray-400 mb-2"></i>
                              <span className="text-gray-600 font-medium text-sm">Click to upload photos or documents</span>
                              <span className="text-xs text-gray-500 mt-1">JPG, PNG, GIF, PDF (max 10MB each)</span>
                            </label>
                          </div>
                          
                          {/* Display uploaded files with previews */}
                          {formData.artifact_images.length > 0 && (
                            <div className="mt-4">
                              <h5 className="font-medium text-[#2e2b41] mb-2">Uploaded Files:</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {formData.artifact_images.map((file, index) => (
                                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center">
                                        <i className="fa-solid fa-file-image text-[#AB8841] mr-2"></i>
                                        <span className="text-sm font-medium truncate">{file.name}</span>
                                        <span className="text-xs text-gray-500 ml-2">
                                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeFile('artifact_images', index)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <i className="fa-solid fa-times"></i>
                                      </button>
                                    </div>
                                    {/* Image Preview */}
                                    {file.type.startsWith('image/') && (
                                      <div className="mt-2">
                                        <img
                                          src={URL.createObjectURL(file)}
                                          alt={`Preview ${file.name}`}
                                          className="w-full h-48 object-contain rounded border bg-white"
                                          onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                                        />
                                      </div>
                                    )}
                                    {/* PDF Preview */}
                                    {file.type === 'application/pdf' && (
                                      <div className="mt-2 flex items-center justify-center bg-red-50 border border-red-200 rounded p-4">
                                        <div className="text-center">
                                          <i className="fa-solid fa-file-pdf text-red-500 text-2xl mb-1"></i>
                                          <p className="text-xs text-red-600 font-medium">PDF Document</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {formData.type === 'loan' && (
                      <>
                        <div>
                          <label className="block text-[#2e2b41] font-semibold mb-2">
                            Item Description *
                          </label>
                          <textarea
                            name="item_description"
                            value={formData.item_description}
                            onChange={handleChange}
                            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                            rows="3"
                            placeholder="Describe the item you want to loan to the museum"
                            required
                          />
                        </div>
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
                              className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                              min={new Date().toISOString().split('T')[0]}
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
                              className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                              min={formData.loan_start_date || new Date().toISOString().split('T')[0]}
                              required
                            />
                          </div>
                        </div>
                        
                        {/* File Upload for Loans */}
                        <div>
                          <label className="block text-[#2e2b41] font-semibold mb-2">
                            Upload Photos/Documents *
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#AB8841] transition-colors">
                            <input
                              type="file"
                              multiple
                              accept="image/*,.pdf"
                              onChange={(e) => handleFileUpload(e, 'loan_images')}
                              className="hidden"
                              id="loan-upload"
                            />
                            <label
                              htmlFor="loan-upload"
                              className="cursor-pointer flex flex-col items-center"
                            >
                              <i className="fa-solid fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                              <span className="text-gray-600 font-medium">Click to upload photos or documents</span>
                              <span className="text-sm text-gray-500 mt-1">JPG, PNG, GIF, PDF (max 10MB each)</span>
                            </label>
                          </div>
                          
                          {/* Display uploaded files with previews */}
                          {formData.loan_images.length > 0 && (
                            <div className="mt-4">
                              <h5 className="font-medium text-[#2e2b41] mb-2">Uploaded Files:</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {formData.loan_images.map((file, index) => (
                                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center">
                                        <i className="fa-solid fa-file-image text-[#AB8841] mr-2"></i>
                                        <span className="text-sm font-medium truncate">{file.name}</span>
                                        <span className="text-xs text-gray-500 ml-2">
                                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeFile('loan_images', index)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <i className="fa-solid fa-times"></i>
                                      </button>
                                    </div>
                                    {/* Image Preview */}
                                    {file.type.startsWith('image/') && (
                                      <div className="mt-2">
                                        <img
                                          src={URL.createObjectURL(file)}
                                          alt={`Preview ${file.name}`}
                                          className="w-full h-48 object-contain rounded border bg-white"
                                          onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                                        />
                                      </div>
                                    )}
                                    {/* PDF Preview */}
                                    {file.type === 'application/pdf' && (
                                      <div className="mt-2 flex items-center justify-center bg-red-50 border border-red-200 rounded p-4">
                                        <div className="text-center">
                                          <i className="fa-solid fa-file-pdf text-red-500 text-2xl mb-1"></i>
                                          <p className="text-xs text-red-600 font-medium">PDF Document</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
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
                      type="button"
                      onClick={nextStep}
                      disabled={!isStepValid(2)}
                      className="px-4 py-2 bg-[#AB8841] text-white text-sm rounded-lg font-semibold hover:bg-[#8B6B21] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next Step
                      <i className="fa-solid fa-arrow-right ml-1 text-xs"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Meeting Preferences */}
              {currentStep === 3 && (
                <div className="p-4">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-[#AB8841] rounded-full mb-2">
                      <i className="fa-solid fa-calendar text-white text-sm"></i>
                    </div>
                    <h3 className="text-lg font-bold text-[#2e2b41] mb-1">Meeting Preferences</h3>
                    <p className="text-xs text-gray-600">When would you prefer to meet with our staff?</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                      <label className="block text-[#2e2b41] font-semibold mb-1 text-sm">
                        Preferred Date *
                    </label>
                    <input
                      type="date"
                      name="preferred_visit_date"
                      value={formData.preferred_visit_date}
                      onChange={handleChange}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                        min={new Date().toISOString().split('T')[0]}
                        required
                    />
                  </div>
                  <div>
                      <label className="block text-[#2e2b41] font-semibold mb-1 text-sm">
                        Preferred Time *
                    </label>
                      <select
                      name="preferred_visit_time"
                      value={formData.preferred_visit_time}
                      onChange={handleChange}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                    required
                  >
                        <option value="">Select preferred time</option>
                        <option value="09:00">9:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="13:00">1:00 PM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="15:00">3:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                  </select>
                </div>
              </div>

                  <div className="mt-4">
                    <label className="block text-[#2e2b41] font-semibold mb-1 text-sm">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all"
                      rows="3"
                      placeholder="Please provide any additional information about your donation interest or special requirements for the meeting..."
                />
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
                      type="button"
                      onClick={nextStep}
                      disabled={!isStepValid(3)}
                      className="px-4 py-2 bg-[#AB8841] text-white text-sm rounded-lg font-semibold hover:bg-[#8B6B21] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next Step
                      <i className="fa-solid fa-arrow-right ml-1 text-xs"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Review & Submit */}
              {currentStep === 4 && (
                <div className="p-4">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-[#AB8841] rounded-full mb-2">
                      <i className="fa-solid fa-eye text-white text-sm"></i>
                    </div>
                    <h3 className="text-lg font-bold text-[#2e2b41] mb-1">Review & Submit</h3>
                    <p className="text-xs text-gray-600">Please review your information before submitting</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      <div className="w-5 h-5 bg-[#AB8841] rounded-full flex items-center justify-center mr-2">
                        <i className="fa-solid fa-user text-white text-xs"></i>
                      </div>
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs font-medium text-gray-600">Name:</span>
                        <p className="text-gray-800 font-semibold text-sm">{formData.first_name} {formData.last_name}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-600">Email:</span>
                        <p className="text-gray-800 font-semibold text-sm">{formData.donor_email}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-600">Contact:</span>
                        <p className="text-gray-800 font-semibold text-sm">{formData.country_code}{formData.donor_contact}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      <div className="w-5 h-5 bg-[#AB8841] rounded-full flex items-center justify-center mr-2">
                        <i className="fa-solid fa-gift text-white text-xs"></i>
                      </div>
                      Donation Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs font-medium text-gray-600">Type:</span>
                        <p className="text-gray-800 font-semibold text-sm">
                          {formData.type === 'monetary' && '💰 Monetary Donation'}
                          {formData.type === 'artifact' && '🏺 Artifact/Historical Item'}
                          {formData.type === 'loan' && '📋 Loan (Temporary)'}
                        </p>
                      </div>
                      {formData.type === 'monetary' && formData.amount && (
                        <div>
                          <span className="text-gray-600">Amount:</span>
                          <span className="ml-2 font-medium">₱{parseFloat(formData.amount).toLocaleString()}</span>
                        </div>
                      )}
                      {formData.type === 'artifact' && formData.estimated_value && (
                        <div>
                          <span className="text-gray-600">Estimated Value:</span>
                          <span className="ml-2 font-medium">₱{parseFloat(formData.estimated_value).toLocaleString()}</span>
                        </div>
                      )}
                      {formData.type === 'artifact' && formData.condition && (
                        <div>
                          <span className="text-gray-600">Condition:</span>
                          <span className="ml-2 font-medium capitalize">{formData.condition}</span>
                        </div>
                      )}
                      {formData.type === 'loan' && formData.loan_start_date && (
                        <div>
                          <span className="text-gray-600">Loan Period:</span>
                          <span className="ml-2 font-medium">
                            {new Date(formData.loan_start_date).toLocaleDateString()} - {new Date(formData.loan_end_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    {(formData.item_description || formData.notes) && (
                      <div className="mt-4">
                        <span className="text-gray-600">Description:</span>
                        <p className="mt-1 text-sm font-medium">{formData.item_description || formData.notes}</p>
                      </div>
                    )}
                    
                    {/* Show uploaded files with previews */}
                    {formData.type === 'artifact' && formData.artifact_images.length > 0 && (
                      <div className="mt-4">
                        <span className="text-gray-600">Uploaded Files:</span>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                          {formData.artifact_images.map((file, index) => (
                            <div key={index} className="bg-white border rounded-lg p-2">
                              <div className="text-xs font-medium truncate mb-1">{file.name}</div>
                              {file.type.startsWith('image/') ? (
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${file.name}`}
                                  className="w-full h-32 object-contain rounded bg-white"
                                  onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                                />
                              ) : (
                                <div className="w-full h-32 bg-red-50 border border-red-200 rounded flex items-center justify-center">
                                  <i className="fa-solid fa-file-pdf text-red-500 text-xl"></i>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {formData.type === 'loan' && formData.loan_images.length > 0 && (
                      <div className="mt-4">
                        <span className="text-gray-600">Uploaded Files:</span>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                          {formData.loan_images.map((file, index) => (
                            <div key={index} className="bg-white border rounded-lg p-2">
                              <div className="text-xs font-medium truncate mb-1">{file.name}</div>
                              {file.type.startsWith('image/') ? (
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${file.name}`}
                                  className="w-full h-32 object-contain rounded bg-white"
                                  onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                                />
                              ) : (
                                <div className="w-full h-32 bg-red-50 border border-red-200 rounded flex items-center justify-center">
                                  <i className="fa-solid fa-file-pdf text-red-500 text-xl"></i>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 mb-8">
                    <h4 className="font-semibold text-[#2e2b41] mb-4">Meeting Preferences</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Preferred Date:</span>
                        <span className={`ml-2 font-medium ${!formData.preferred_visit_date ? 'text-red-500' : 'text-gray-800'}`}>
                          {formData.preferred_visit_date ? new Date(formData.preferred_visit_date).toLocaleDateString() : '⚠️ Required - Please go back to step 3'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Preferred Time:</span>
                        <span className={`ml-2 font-medium ${!formData.preferred_visit_time ? 'text-red-500' : 'text-gray-800'}`}>
                          {formData.preferred_visit_time ? 
                            new Date(`2000-01-01T${formData.preferred_visit_time}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                            '⚠️ Required - Please go back to step 3'
                          }
                        </span>
                      </div>
                    </div>
                    {formData.notes && (
                      <div className="mt-4">
                        <span className="text-gray-600">Notes:</span>
                        <p className="mt-1 text-sm font-medium">{formData.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Validation Warning */}
                  {!isStepValid(3) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center">
                        <i className="fa-solid fa-exclamation-triangle text-red-500 mr-2"></i>
                        <span className="text-red-700 text-sm font-medium">
                          Please complete all required fields in Step 3 (Meeting Preferences) before submitting.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between mt-8">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="bg-gray-200 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                    >
                      <i className="fa-solid fa-arrow-left mr-2"></i>
                      Previous
                    </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isStepValid(3)}
                      className="bg-[#AB8841] text-white px-8 py-3 rounded-xl hover:bg-[#8B6B21] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                        <span className="flex items-center">
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                      Submitting...
                        </span>
                  ) : (
                        <span className="flex items-center">
                      <i className="fa-solid fa-paper-plane mr-2"></i>
                          Submit Request
                        </span>
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
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 border border-gray-100">
              <div className="w-8 h-8 bg-[#AB8841] rounded-lg flex items-center justify-center mb-3">
                <i className="fa-solid fa-info-circle text-white text-sm"></i>
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">What to Expect</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-start">
                  <i className="fa-solid fa-check text-[#AB8841] mr-2 mt-0.5 text-xs"></i>
                  Our staff will contact you within 2-3 business days
                </li>
                <li className="flex items-start">
                  <i className="fa-solid fa-check text-[#AB8841] mr-2 mt-0.5 text-xs"></i>
                  We'll confirm your meeting date and time
                </li>
                <li className="flex items-start">
                  <i className="fa-solid fa-check text-[#AB8841] mr-2 mt-0.5 text-xs"></i>
                  During the meeting, we'll discuss your donation in detail
                </li>
                <li className="flex items-start">
                  <i className="fa-solid fa-check text-[#AB8841] mr-2 mt-0.5 text-xs"></i>
                  We'll provide guidance on the donation process
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 border border-gray-100">
              <div className="w-8 h-8 bg-[#AB8841] rounded-lg flex items-center justify-center mb-3">
                <i className="fa-solid fa-info-circle text-white text-sm"></i>
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Important Notes</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-start">
                  <i className="fa-solid fa-exclamation-triangle text-[#AB8841] mr-2 mt-0.5 text-xs"></i>
                  All donations are subject to museum approval
                </li>
                <li className="flex items-start">
                  <i className="fa-solid fa-exclamation-triangle text-[#AB8841] mr-2 mt-0.5 text-xs"></i>
                  Please bring valid identification to the meeting
                </li>
                <li className="flex items-start">
                  <i className="fa-solid fa-exclamation-triangle text-[#AB8841] mr-2 mt-0.5 text-xs"></i>
                  Meeting duration is typically 30-60 minutes
                </li>
                <li className="flex items-start">
                  <i className="fa-solid fa-exclamation-triangle text-[#AB8841] mr-2 mt-0.5 text-xs"></i>
                  We appreciate your interest in preserving our heritage
                </li>
              </ul>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonationPage; 