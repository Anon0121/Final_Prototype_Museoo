import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../config/api";
import citymus from "../../assets/citymus.jpg";
import logo from "../../assets/logo.png";

const WalkInVisitorForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const visitorId = searchParams.get('visitorId');
  
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

  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!token && !visitorId) {
        setError("No token or visitor ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Determine which API endpoint to use based on available parameters
        let response;
        if (visitorId) {
          // Individual walk-in visitor - use visitor ID
          response = await api.get(`/api/individual-walkin/${visitorId}`);
          if (response.data.success) {
            const visitorData = response.data.visitorInfo;
            setTokenInfo(visitorData);
            // For individual walk-in, only pre-fill email and other fields, but NOT first name and last name
            setVisitorInfo(prev => ({
              ...prev,
              email: visitorData.email,
              firstName: "", // Don't pre-fill for individual walk-in
              lastName: "", // Don't pre-fill for individual walk-in
              gender: visitorData.gender || "",
              address: visitorData.address || "",
              visitorType: visitorData.visitorType || "",
              institution: visitorData.institution || "",
              purpose: visitorData.purpose || "educational"
            }));
          } else {
            setError("Invalid or expired visitor ID");
          }
        } else {
          // Additional visitor - use token
          response = await api.get(`/api/walkin-visitors/${token}`);
          if (response.data.success) {
            const tokenData = response.data.tokenInfo;
            
            // Check if link is expired
            if (tokenData.linkExpired) {
              setError("This link has expired. Please contact the museum for assistance.");
              setLoading(false);
              return;
            }
            
            setTokenInfo(tokenData);
            // Pre-fill email from token info
            setVisitorInfo(prev => ({
              ...prev,
              email: tokenData.email
            }));
          } else {
            setError("Invalid or expired token");
          }
        }
      } catch (err) {
        console.error("Error fetching visitor info:", err);
        setError("Failed to load visitor information");
      } finally {
        setLoading(false);
      }
    };

    fetchTokenInfo();
  }, [token, visitorId]);

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
      // Determine which API endpoint to use based on available parameters
      let response;
      if (visitorId) {
        // Individual walk-in visitor - use visitor ID
        response = await api.put(`/api/individual-walkin/${visitorId}`, {
          firstName: visitorInfo.firstName,
          lastName: visitorInfo.lastName,
          gender: visitorInfo.gender,
          address: visitorInfo.address,
          visitorType: visitorInfo.visitorType,
          institution: visitorInfo.institution,
          purpose: visitorInfo.purpose
        });
      } else {
        // Additional visitor - use token
        response = await api.put(`/api/walkin-visitors/${token}`, {
          firstName: visitorInfo.firstName,
          lastName: visitorInfo.lastName,
          gender: visitorInfo.gender,
          address: visitorInfo.address,
          visitorType: visitorInfo.visitorType,
          institution: visitorInfo.institution,
          purpose: visitorInfo.purpose
        });
      }

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

  if (loading && !success) {
    return (
      <div className="min-h-screen bg-cover bg-center" style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${citymus})`
      }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your walk-in visit information...</p>
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
          <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Walk-In Registration Complete!</h2>
            <p className="text-gray-600 mb-4">
              Your walk-in visit details have been successfully saved. Your QR code has been sent to your email. Please check your inbox and keep the QR code safe for check-in on your visit day.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to homepage in 3 seconds...
            </p>
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
                  <strong>Note:</strong> Your walk-in visit link has expired. Please contact the museum for assistance.
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
    <div className="min-h-screen bg-cover bg-center" style={{
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${citymus})`
    }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={logo} alt="MuseoSmart Logo" className="h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Walk-in Visit</h1>
          <p className="text-white/80">Please fill out your details to complete your museum walk-in visit</p>
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

              {/* Institution and Purpose */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">Institution/Organization</label>
                  <input
                    type="text"
                    name="institution"
                    value={visitorInfo.institution}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                    placeholder="Enter your institution (optional)"
                  />
                </div>
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">Purpose of Visit</label>
                  <select
                    name="purpose"
                    value={visitorInfo.purpose}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  >
                    <option value="educational">Educational</option>
                    <option value="research">Research</option>
                    <option value="tourism">Tourism</option>
                    <option value="other">Other</option>
                  </select>
                </div>
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
                    "Complete Registration"
                  )}
                </button>
              </div>
            </form>

            {/* What happens next section */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-[#2e2b41] mb-2">What happens next?</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Your QR code will be generated immediately and sent to your email</li>
                <li>• Check your email inbox for the QR code attachment</li>
                <li>• Present the QR code at the museum entrance for check-in</li>
                <li>• Enjoy your museum visit!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalkInVisitorForm;
