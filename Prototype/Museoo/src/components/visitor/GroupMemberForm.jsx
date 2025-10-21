import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../config/api";
import citymus from "../../assets/citymus.jpg";
import logo from "../../assets/logo.png";

const GroupMemberForm = () => {
  const { memberId, bookingId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [memberInfo, setMemberInfo] = useState({
    firstName: "",
    lastName: "",
    gender: "", // Remove default - force user to choose
    address: "",
    email: "",
    visitorType: "", // Remove default - force user to choose
    institution: "",
    purpose: "educational"
  });

  useEffect(() => {
    const fetchMemberInfo = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/visitors/${memberId}`);
        
        if (response.data.success) {
          const visitor = response.data.visitor;
          setMemberInfo({
            firstName: visitor.first_name || "",
            lastName: visitor.last_name || "",
            gender: visitor.gender || "male",
            address: visitor.address || "",
            email: visitor.email || "",
            visitorType: visitor.visitorType || "",
            institution: "",
            purpose: visitor.purpose || "educational"
          });
        } else {
          setError("Visitor information not found");
        }
      } catch (err) {
        console.error("Error fetching member info:", err);
        setError("Failed to load visitor information");
      } finally {
        setLoading(false);
      }
    };

    if (memberId) {
      fetchMemberInfo();
    }
  }, [memberId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMemberInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.put(`/api/visitors/${memberId}`, {
        firstName: memberInfo.firstName,
        lastName: memberInfo.lastName,
        gender: memberInfo.gender,
        address: memberInfo.address,
        email: memberInfo.email,
        visitorType: memberInfo.visitorType,
        institution: memberInfo.institution,
        purpose: memberInfo.purpose
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
      console.error("Error updating member info:", err);
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
          <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Information Updated!</h2>
            <p className="text-gray-600 mb-4">
              Your details have been successfully updated. You will receive your QR code shortly.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to homepage in 3 seconds...
            </p>
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
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Information</h1>
          <p className="text-white/80">Please fill out your details to complete your group booking</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={memberInfo.firstName}
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
                    value={memberInfo.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <div className="flex flex-wrap gap-4">
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
                          checked={memberInfo.gender === option.value}
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

                {/* Visitor Type */}
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
                           checked={memberInfo.visitorType === option.value}
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

                {/* Email */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={memberInfo.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <textarea
                    name="address"
                    value={memberInfo.address}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Institution */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institution/Organization
                  </label>
                  <input
                    type="text"
                    name="institution"
                    value={memberInfo.institution}
                    onChange={handleInputChange}
                    placeholder="e.g., University, Company, School"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Purpose */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose of Visit *
                  </label>
                  <select
                    name="purpose"
                    value={memberInfo.purpose}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="educational">Educational</option>
                    <option value="research">Research</option>
                    <option value="tourism">Tourism</option>
                    <option value="cultural">Cultural Interest</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
                >
                  {loading ? "Updating..." : "Complete Registration"}
                </button>
              </div>
            </form>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Your information will be updated in our system</li>
                <li>• You'll receive a QR code for check-in on your visit day</li>
                <li>• Present your QR code at the museum entrance</li>
                <li>• Enjoy your museum visit!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupMemberForm;
