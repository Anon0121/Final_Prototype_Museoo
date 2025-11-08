import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../config/api";
import citymus from "../../assets/citymus.jpg";
import logo from "../../assets/logo.png";

const GroupWalkInMemberForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [visitorInfo, setVisitorInfo] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    address: "",
    visitorType: "",
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
        const response = await api.get(`/api/group-walkin-members/${token}`);
        
        if (response.data.success) {
          const tokenData = response.data.tokenInfo;
          
          // Check if link is expired
          if (tokenData.linkExpired) {
            setError("This link has expired. Please contact the museum for assistance.");
            setLoading(false);
            return;
          }
          
          setTokenInfo(tokenData);
          // Pre-fill email and group leader info from token info
          setVisitorInfo(prev => ({
            ...prev,
            email: tokenData.email,
            // Pre-fill with group leader's information
            institution: tokenData.institution || "",
            purpose: tokenData.purpose || ""
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
      const response = await api.put(`/api/group-walkin-members/${token}`, {
        firstName: visitorInfo.firstName,
        lastName: visitorInfo.lastName,
        gender: visitorInfo.gender,
        address: visitorInfo.address,
        visitorType: visitorInfo.visitorType,
        institution: visitorInfo.institution,
        purpose: visitorInfo.purpose
      });

      if (response.data.success) {
        setSuccess(true);
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate("/");
        }, 3000);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center" style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${citymus})`
      }}>
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading...</h2>
          <p className="text-gray-600">Please wait while we load your information.</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isExpired = error.includes('expired') || error.includes('cancelled');
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
                  <strong>Note:</strong> Your group walk-in member link has expired. Please contact the museum for assistance.
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

  if (success) {
    return (
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center" style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${citymus})`
      }}>
        <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
          <div className="text-6xl mb-4 text-green-500">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Member Registration Completed!</h2>
          <p className="text-gray-600 mb-4">
            Your group walk-in member registration has been completed successfully! 
            Your QR code has been generated and sent to your email.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                          <p className="text-green-700 text-sm">
                <strong>What You Inherited:</strong> Institution and purpose from your group leader<br />
                <strong>Next Steps:</strong> Check your email for your QR code and bring it for check-in
              </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Return to Homepage
          </button>
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
          <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#351E10] via-[#5C3A18] to-[#8B6B21] px-6 py-5 sm:px-8 sm:py-6">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/15 border border-white/25 shadow-lg shadow-black/30 flex items-center justify-center text-white">
                  <i className="fa-solid fa-file-signature text-xl sm:text-2xl"></i>
                </div>
                <div className="space-y-1">
                  <p className="text-sm sm:text-base uppercase tracking-[0.2em] text-white/70" style={{fontFamily: 'Telegraf, sans-serif'}}>Group Member Consent</p>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{fontFamily: 'Telegraf, sans-serif'}}>Before Completing Your Details</h2>
                  <p className="text-white/80 text-sm sm:text-base leading-relaxed" style={{fontFamily: 'Lora, serif'}}>
                    Please review how the museum handles your data and what’s expected from everyone in your group before you enter your information.
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
                  The museum collects your information to verify group attendance, coordinate crowd management, and comply with the Data Privacy Act of 2012. Your data stays secure and is used only for museum purposes.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#E5B80B]/20 flex items-center justify-center text-[#8B6B21]">
                  <i className="fa-solid fa-people-group text-sm"></i>
                </div>
                <p>
                  You commit to observing museum etiquette, staying with your group leader’s guidance, and informing staff if you cannot attend so we can adjust group counts.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#E5B80B]/20 flex items-center justify-center text-[#8B6B21]">
                  <i className="fa-solid fa-envelope-circle-check text-sm"></i>
                </div>
                <p>
                  By continuing, you agree to receive email notifications related to this group visit, including QR codes or schedule updates.
                </p>
              </div>
              <p className="font-semibold text-[#351E10]" style={{fontFamily: 'Telegraf, sans-serif'}}>
                Do you agree to these terms and to the collection and processing of your personal information for this group walk-in visit?
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
          <h1 className="text-3xl font-bold text-white mb-2">Group Member Registration</h1>
          <p className="text-white/80">Complete your personal details</p>
          {tokenInfo && (
            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <p className="text-white text-sm">
                <strong>Group Leader:</strong> {tokenInfo.groupLeaderName || 'Group Leader'}
              </p>
              <p className="text-white text-sm">
                <strong>Visit Date:</strong> {tokenInfo.visitDate} | <strong>Time:</strong> {tokenInfo.visitTime}
              </p>
              <p className="text-white text-sm">
                <strong>Institution:</strong> {tokenInfo.groupLeaderInstitution || 'Not specified'} (inherited)
              </p>
              <p className="text-white text-sm">
                <strong>Purpose:</strong> {tokenInfo.groupLeaderPurpose || 'Not specified'} (inherited)
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={visitorInfo.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={visitorInfo.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              {/* Gender and Visitor Type */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-3">Gender *</label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={visitorInfo.gender === "male"}
                        onChange={handleInputChange}
                        required
                        className="mr-2 text-[#AB8841] focus:ring-[#AB8841]"
                      />
                      <span className="text-sm font-medium">Male</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={visitorInfo.gender === "female"}
                        onChange={handleInputChange}
                        required
                        className="mr-2 text-[#AB8841] focus:ring-[#AB8841]"
                      />
                      <span className="text-sm font-medium">Female</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value="lgbtq"
                        checked={visitorInfo.gender === "lgbtq"}
                        onChange={handleInputChange}
                        required
                        className="mr-2 text-[#AB8841] focus:ring-[#AB8841]"
                      />
                      <span className="text-sm font-medium">LGBTQ+</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-3">Visitor Type *</label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="visitorType"
                        value="Local"
                        checked={visitorInfo.visitorType === "Local"}
                        onChange={handleInputChange}
                        required
                        className="mr-2 text-[#AB8841] focus:ring-[#AB8841]"
                      />
                      <span className="text-sm font-medium">Local</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="visitorType"
                        value="Foreign"
                        checked={visitorInfo.visitorType === "Foreign"}
                        onChange={handleInputChange}
                        required
                        className="mr-2 text-[#AB8841] focus:ring-[#AB8841]"
                      />
                      <span className="text-sm font-medium">Foreign</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Email Field (Read-only) */}
              <div className="mb-6">
                <label className="block text-[#2e2b41] font-semibold mb-2">Email Address</label>
                <input
                  type="email"
                  value={visitorInfo.email || ""}
                  disabled
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
                <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              {/* Address */}
              <div className="mb-6">
                <label className="block text-[#2e2b41] font-semibold mb-2">Address *</label>
                <input
                  type="text"
                  name="address"
                  value={visitorInfo.address}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  placeholder="Enter your complete address"
                />
              </div>

              {/* Inherited Information Display */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-[#2e2b41] mb-2">Inherited from Group Leader</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#2e2b41] font-medium mb-1">Institution/Organization</label>
                    <p className="text-gray-700 font-semibold">{visitorInfo.institution || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-[#2e2b41] font-medium mb-1">Purpose of Visit</label>
                    <p className="text-gray-700 font-semibold">{visitorInfo.purpose || 'Not specified'}</p>
                  </div>
                </div>
                <p className="text-sm text-blue-600 mt-2">
                  <strong>Note:</strong> These details are inherited from your group leader and cannot be changed.
                </p>
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#AB8841] hover:bg-[#8B6B21] text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? (
                    <span>
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                      Completing Registration...
                    </span>
                  ) : (
                    "Complete Member Registration"
                  )}
                </button>
              </div>
            </form>

            {/* What happens next section */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-[#2e2b41] mb-2">What happens next?</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Your QR code will be generated immediately and sent to your email</li>
                <li>• Institution and purpose are inherited from your group leader</li>
                <li>• Check your email inbox for the QR code attachment</li>
                <li>• Present the QR code at the museum entrance for check-in</li>
                <li>• Enjoy your group museum visit!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default GroupWalkInMemberForm;
