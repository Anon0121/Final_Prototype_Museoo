import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../config/api";
import citymus from "../../assets/citymus.jpg";
import logo from "../../assets/logo.png";

const AdditionalVisitorForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [newQRCode, setNewQRCode] = useState(null);
  const [visitorInfo, setVisitorInfo] = useState({
    firstName: "",
    lastName: "",
    gender: "", // Remove default - force user to choose
    address: "",
    visitorType: "", // Remove default - force user to choose
    institution: "",
    purpose: "educational"
  });
  const [showConsentModal, setShowConsentModal] = useState(true);

  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!token) {
        setError("No token provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/api/additional-visitors/token/${token}`);
        
        if (response.data.success) {
          const tokenData = response.data.tokenInfo;
          
          // Check if link is expired
          if (tokenData.linkExpired) {
            setError("This link has expired. Please contact the museum for assistance.");
            setLoading(false);
            return;
          }
          
          // Check if form is already completed
          if (tokenData.status === 'completed') {
            setError("This form has already been completed and cannot be used again. Please use your QR code for check-in.");
            setLoading(false);
            return;
          }
          
          setTokenInfo(tokenData);
          // Pre-fill email from token info
          setVisitorInfo(prev => ({
            ...prev,
          email: tokenData.email,
          institution: tokenData.institution || "",
          purpose: tokenData.purpose || prev.purpose
          }));
        } else {
          setError("Invalid or expired token");
        }
      } catch (err) {
        console.error("Error fetching token info:", err);
        setError("Failed to load token information");
      } finally {
        setLoading(false);
      }
    };

    fetchTokenInfo();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVisitorInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.put(`/api/additional-visitors/${token}`, {
        firstName: visitorInfo.firstName,
        lastName: visitorInfo.lastName,
        gender: visitorInfo.gender,
        address: visitorInfo.address,
        visitorType: visitorInfo.visitorType,
        email: visitorInfo.email,
        institution: visitorInfo.institution,
        purpose: visitorInfo.purpose
      });

      if (response.data.success) {
        setNewQRCode(response.data.qrCodeDataUrl);
        setSuccess(true);
        // Don't redirect - show the new QR code
      } else {
        setError(response.data.error || "Failed to update information");
      }
    } catch (err) {
      console.error("Error updating visitor info:", err);
      setError("Failed to update information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConsentAgree = () => {
    setShowConsentModal(false);
  };

  const handleConsentDecline = () => {
    navigate("/");
  };

  if (loading && !success) {
    return (
      <div className="min-h-screen bg-cover bg-center" style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${citymus})`
      }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cover bg-center" style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${citymus})`
      }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-lg p-8 text-center max-w-2xl mx-4">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Form Completed Successfully!</h2>
            <p className="text-gray-600 mb-4">
              Your details have been saved and embedded in your existing QR code. This form link has been deactivated and cannot be used again.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> The form link you used is now permanently disabled. 
                Use your existing QR code (the one sent via email) for check-in.
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
              <h4 className="font-semibold text-yellow-800 mb-2">🔒 One-Time Use Form</h4>
              <p className="text-sm text-yellow-700">
                This form can only be submitted once. After submission, the link becomes inactive 
                and all visitor details are securely stored in the QR code.
              </p>
            </div>
            
            <button
              onClick={() => navigate("/")}
              className="bg-[#AB8841] hover:bg-[#8B6B21] text-white py-3 px-6 rounded-lg font-semibold transition-colors"
            >
              Return to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error && !tokenInfo) {
    const isExpired = error.includes('expired') || error.includes('already been completed');
    return (
      <div className="min-h-screen bg-cover bg-center" style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${citymus})`
      }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
            <div className={`text-6xl mb-4 ${isExpired ? 'text-orange-500' : 'text-red-500'}`}>
              {isExpired ? '⏰' : '❌'}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {isExpired ? 'Link Expired' : 'Invalid Link'}
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            {isExpired && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <p className="text-orange-700 text-sm">
                  <strong>Note:</strong> Your QR code will still work for check-in on your visit day, even though this form link has expired.
                </p>
              </div>
            )}
            <button
              onClick={() => navigate("/")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-cover bg-center" style={{
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${citymus})`
    }}>
      {showConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/60 backdrop-blur-sm">
          <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl border border-[#8B6B21]/40 overflow-hidden">
            <div className="bg-gradient-to-r from-[#351E10] via-[#5C3A18] to-[#8B6B21] px-6 py-5 sm:px-8 sm:py-6">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 border border-white/30 shadow-lg shadow-black/30 flex items-center justify-center text-white">
                  <i className="fa-solid fa-file-signature text-xl sm:text-2xl"></i>
                </div>
                <div className="space-y-1">
                  <p className="text-sm sm:text-base uppercase tracking-[0.2em] text-white/70" style={{fontFamily: 'Telegraf, sans-serif'}}>Additional Visitor Consent</p>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{fontFamily: 'Telegraf, sans-serif'}}>Before You Complete This Form</h2>
                  <p className="text-white/80 text-sm sm:text-base leading-relaxed" style={{fontFamily: 'Lora, serif'}}>
                    Please review how the museum handles your personal information and what is expected from every attendee in the group booking.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 sm:px-8 sm:py-6 space-y-4 text-sm sm:text-base text-gray-700" style={{fontFamily: 'Lora, serif'}}>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#E5B80B]/20 flex items-center justify-center text-[#8B6B21]">
                  <i className="fa-solid fa-database text-sm"></i>
                </div>
                <p>
                  The City Museum of Cagayan de Oro collects your information to update the QR code for your group visit, verify attendance, and comply with the Data Privacy Act of 2012. Your data is stored securely and only used for museum operations.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#E5B80B]/20 flex items-center justify-center text-[#8B6B21]">
                  <i className="fa-solid fa-people-group text-sm"></i>
                </div>
                <p>
                  You agree to follow museum guidelines, respect your scheduled visit time, and use the same QR code sent via email for check-in on the day of the visit.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#E5B80B]/20 flex items-center justify-center text-[#8B6B21]">
                  <i className="fa-solid fa-envelope-circle-check text-sm"></i>
                </div>
                <p>
                  By proceeding, you allow the museum to contact you using the email provided for confirmations or important advisories related to this group booking.
                </p>
              </div>
              <p className="font-semibold text-[#351E10]" style={{fontFamily: 'Telegraf, sans-serif'}}>
                Do you agree to these terms and to the collection and processing of your personal information for this group booking?
              </p>
            </div>

            <div className="px-6 py-5 sm:px-8 sm:py-6 bg-white border-t border-[#8B6B21]/30 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleConsentDecline}
                className="w-full sm:w-1/2 px-4 py-3 rounded-xl font-semibold border-2 border-gray-200 text-gray-700 hover:bg-gray-100 transition-all duration-200"
                style={{fontFamily: 'Telegraf, sans-serif'}}
              >
                I Decline
              </button>
              <button
                onClick={handleConsentAgree}
                className="w-full sm:w-1/2 px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl"
                style={{background: 'linear-gradient(135deg, #8B6B21 0%, #D4AF37 100%)', fontFamily: 'Telegraf, sans-serif'}}
              >
                I Agree & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={showConsentModal ? "pointer-events-none select-none opacity-40 transition-opacity duration-300" : "opacity-100 transition-opacity duration-300"}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={logo} alt="MuseoSmart Logo" className="h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Information</h1>
          <p className="text-white/80">Please fill out your details to complete your museum visit</p>
          {tokenInfo && (
            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <p className="text-white text-sm">
                <strong>Visit Date:</strong> {tokenInfo.visitDate} | <strong>Time:</strong> {tokenInfo.visitTime}
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Important Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <i className="fa-solid fa-info-circle text-blue-400 text-lg mt-0.5"></i>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Important Information</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>• Use the QR code that was sent to your email</p>
                      <p>• After completing this form, your QR code will be updated with your details</p>
                      <p>• Bring the same QR code (from email) for check-in on your visit day</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={visitorInfo.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={visitorInfo.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                                 {/* Gender Radio Buttons */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-3">
                     Gender *
                   </label>
                   <div className="grid grid-cols-2 gap-3">
                     {[
                       { value: "male", label: "Male" },
                       { value: "female", label: "Female" },
                       { value: "lgbtq", label: "LGBTQ+" }
                     ].map((option) => (
                       <label key={option.value} className="relative flex items-center cursor-pointer group">
                         <input
                           type="radio"
                           name="gender"
                           value={option.value}
                           checked={visitorInfo.gender === option.value}
                           onChange={handleInputChange}
                           required
                           className="sr-only peer"
                         />
                         <div className="w-5 h-5 border-2 border-gray-300 rounded-full peer-checked:border-blue-500 peer-checked:bg-blue-500 peer-focus:ring-2 peer-focus:ring-blue-200 transition-all duration-200 group-hover:border-blue-400">
                           <div className="w-2 h-2 bg-white rounded-full m-auto mt-1.5 peer-checked:opacity-100 opacity-0 transition-opacity duration-200"></div>
                         </div>
                         <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-200">
                           {option.label}
                         </span>
                       </label>
                     ))}
                   </div>
                 </div>

                 {/* Visitor Type Radio Buttons */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-3">
                     Visitor Type *
                   </label>
                   <div className="grid grid-cols-2 gap-4">
                     {[
                       { value: "local", label: "Local" },
                       { value: "foreign", label: "Foreign" }
                     ].map((option) => (
                       <label key={option.value} className="relative flex items-center cursor-pointer group">
                         <input
                           type="radio"
                           name="visitorType"
                           value={option.value}
                           checked={visitorInfo.visitorType === option.value}
                           onChange={handleInputChange}
                           required
                           className="sr-only peer"
                         />
                         <div className="w-5 h-5 border-2 border-gray-300 rounded-full peer-checked:border-blue-500 peer-checked:bg-blue-500 peer-focus:ring-2 peer-focus:ring-blue-200 transition-all duration-200 group-hover:border-blue-400">
                           <div className="w-2 h-2 bg-white rounded-full m-auto mt-1.5 peer-checked:opacity-100 opacity-0 transition-opacity duration-200"></div>
                         </div>
                         <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-200">
                           {option.label}
                         </span>
                       </label>
                     ))}
                   </div>
                 </div>

                {/* Email (read-only) */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={visitorInfo.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <textarea
                    name="address"
                    value={visitorInfo.address}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                                          {/* Institution (read-only, same as primary visitor) */}
         <div className="md:col-span-2">
           <label className="block text-sm font-medium text-gray-700 mb-2">
             Institution/Organization
           </label>
           <input
             type="text"
             value={tokenInfo?.primaryInstitution || 'Not specified'}
             disabled
             className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-blue-50 text-blue-700 font-medium"
           />
           <p className="text-xs text-blue-600 mt-1">✅ Inherited from primary visitor (group leader)</p>
         </div>

                                          {/* Purpose (read-only, same as primary visitor) */}
         <div className="md:col-span-2">
           <label className="block text-sm font-medium text-gray-700 mb-2">
             Purpose of Visit
           </label>
           <input
             type="text"
             value={tokenInfo?.primaryPurpose || 'Not specified'}
             disabled
             className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-blue-50 text-blue-700 font-medium"
           />
           <p className="text-xs text-blue-600 mt-1">✅ Inherited from primary visitor (group leader)</p>
         </div>
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
                >
                  {loading ? "Saving..." : "Complete Registration"}
                </button>
              </div>
            </form>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Your information will be saved in our system</li>
                <li>• Keep your QR code safe for check-in on your visit day</li>
                <li>• Present your QR code at the museum entrance</li>
                <li>• Enjoy your museum visit!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default AdditionalVisitorForm;
