import React, { useState, useEffect } from "react";
import axios from "axios";
import api from "../../config/api";

const Settings = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [profileForm, setProfileForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
  });

  const [message, setMessage] = useState({ type: "", text: "" });
  const [notification, setNotification] = useState({
    show: false,
    type: 'success',
    title: '',
    message: '',
    description: ''
  });

  // Fetch user data
  const fetchUser = async () => {
    try {
      console.log("🔄 Fetching user data...");
      const res = await api.get("/api/user");
      console.log("📋 User data received:", res.data);
      
      if (res.data.success) {
        setUser(res.data.user);
        setProfileForm({
          firstname: res.data.user.firstname,
          lastname: res.data.user.lastname,
          email: res.data.user.email || "",
        });
        if (res.data.user.profile_photo) {
          setPreviewUrl(`http://localhost:3000/uploads/profiles/${res.data.user.profile_photo}`);
        } else {
          setPreviewUrl(""); // Clear any previous preview
        }
        
        console.log("✅ User status:", res.data.user.status);
        console.log("✅ User role:", res.data.user.role);
      }
    } catch (err) {
      console.error("❌ Fetch user error:", err);
      setMessage({ type: "error", text: "Failed to load user data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMessage({ type: "", text: "" });
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMessage({ type: "", text: "" });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setNotification({
          show: true,
          type: 'error',
          title: 'Invalid File Type',
          message: '❌ Please select an image file',
          description: 'Only image files (JPG, PNG, GIF, etc.) are allowed for profile photos.'
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setNotification({
          show: true,
          type: 'error',
          title: 'File Too Large',
          message: '❌ File size must be less than 5MB',
          description: 'Please choose a smaller image file to upload as your profile photo.'
        });
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile) {
      setNotification({
        show: true,
        type: 'error',
        title: 'No File Selected',
        message: '❌ Please select a file to upload',
        description: 'Choose an image file before clicking the upload button.'
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('profile_photo', selectedFile);

      const res = await api.post("/api/upload-profile-photo", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setNotification({
          show: true,
          type: 'success',
          title: 'Profile Photo Updated!',
          message: '✅ Your profile photo has been updated successfully!',
          description: 'The changes will be visible immediately.'
        });
        setSelectedFile(null);
        fetchUser(); // Refresh user data
      } else {
        setNotification({
          show: true,
          type: 'error',
          title: 'Photo Upload Failed',
          message: '❌ Failed to upload profile photo',
          description: res.data.message || "Please try again with a different image."
        });
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
      setNotification({
        show: true,
        type: 'error',
        title: 'Photo Upload Error',
        message: '❌ Failed to upload profile photo',
        description: err.response?.data?.message || err.message || "Network error. Please check your connection."
      });
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!profileForm.firstname || !profileForm.lastname) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Validation Error',
        message: '❌ Please fill in all required fields',
        description: 'First name and last name are required to update your profile.'
      });
      return;
    }

    try {
      const res = await api.put("/api/update-profile", {
        firstname: profileForm.firstname,
        lastname: profileForm.lastname,
        email: profileForm.email,
      });

      if (res.data.success) {
        setNotification({
          show: true,
          type: 'success',
          title: 'Profile Updated Successfully!',
          message: '✅ Your profile information has been updated!',
          description: 'The changes have been saved and will be visible immediately.'
        });
        setIsEditing(false);
        fetchUser(); // Refresh user data
        
      } else {
        setNotification({
          show: true,
          type: 'error',
          title: 'Profile Update Failed',
          message: '❌ Failed to update profile',
          description: res.data.message || "Please check your information and try again."
        });
        
      }
    } catch (err) {
      console.error("❌ Update error:", err);
      setNotification({
        show: true,
        type: 'error',
        title: 'Profile Update Error',
        message: '❌ Failed to update profile',
        description: err.response?.data?.message || err.message || "Network error. Please check your connection."
      });
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
    }
  };

  const validatePasswordStrength = (password) => {
    const errors = [];
    if (password.length < 8) errors.push("Be at least 8 characters long");
    if (!/[A-Z]/.test(password)) errors.push("Include at least one uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("Include at least one lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("Include at least one number");
    if (!/[!@#$%^&*]/.test(password)) errors.push("Include at least one special character");
    return errors;
  };

  const getPasswordRequirements = (password) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password)
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" }); // Clear any previous messages

    const { oldPassword, newPassword, confirmPassword } = form;

    console.log("🔐 Password change attempt started");
    console.log("📋 Form data:", { oldPassword: oldPassword ? "***" : "empty", newPassword: newPassword ? "***" : "empty", confirmPassword: confirmPassword ? "***" : "empty" });

    if (!oldPassword || !newPassword || !confirmPassword) {
      console.log("❌ Validation failed: Missing fields");
      setNotification({
        show: true,
        type: 'error',
        title: 'Validation Error',
        message: '❌ All fields are required',
        description: 'Please fill in all password fields before submitting.'
      });
      setLoading(false);
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
      return;
    }

    if (newPassword !== confirmPassword) {
      console.log("❌ Validation failed: Passwords don't match");
      setNotification({
        show: true,
        type: 'error',
        title: 'Password Mismatch',
        message: '❌ New passwords do not match',
        description: 'Please make sure both new password fields contain the same password.'
      });
      setLoading(false);
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
      return;
    }

    const passwordErrors = validatePasswordStrength(newPassword);
    if (passwordErrors.length > 0) {
      console.log("❌ Validation failed: Password strength issues", passwordErrors);
      setNotification({
        show: true,
        type: 'error',
        title: 'Password Requirements Not Met',
        message: '❌ Password must meet the following requirements:',
        description: passwordErrors.map((e) => `• ${e}`).join('\n')
      });
      setLoading(false);
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
      return;
    }

    try {
      console.log("🌐 Making API call to /api/change-password");
      const res = await api.post("/api/change-password", {
        currentPassword: oldPassword,
        newPassword: newPassword,
      });

      console.log("📡 API Response:", res.data);

      if (res.data.success) {
        console.log("✅ Password updated successfully");
        setNotification({
          show: true,
          type: 'success',
          title: 'Password Updated Successfully!',
          message: '✅ Your password has been changed successfully!',
          description: 'Please log in again with your new password to ensure security.'
        });
        setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        
      } else {
        console.log("❌ API returned success: false", res.data.message);
        setNotification({
          show: true,
          type: 'error',
          title: 'Password Update Failed',
          message: '❌ Failed to update password',
          description: res.data.message || "Please check your current password and try again."
        });
        
      }
    } catch (err) {
      console.error("❌ Change password error:", err);
      console.error("❌ Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      
      const errorMessage = err.response?.data?.message || err.message || "Failed to update password";
      setNotification({
        show: true,
        type: 'error',
        title: 'Password Update Error',
        message: '❌ Failed to update password',
        description: errorMessage
      });
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-[#2e2b41]">
          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
            <i className="fa-solid fa-gear text-white text-lg sm:text-xl"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
              Account Settings
            </h1>
            <p className="text-gray-600 text-sm sm:text-base" style={{fontFamily: 'Telegraf, sans-serif'}}>
              Manage your account security and preferences
            </p>
          </div>
        </div>
      </div>

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
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Photo Section */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200">
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
            <i className="fa-solid fa-camera mr-2" style={{color: '#E5B80B'}}></i>
            Profile Photo
          </h3>
          
          <div className="text-center">
            {/* Current Photo */}
            <div className="mb-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-full overflow-hidden border-4 bg-gray-100" style={{borderColor: '#E5B80B'}}>
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log("Profile photo failed to load, showing default");
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center ${previewUrl ? 'hidden' : ''}`}>
                  <i className="fa-solid fa-user text-4xl text-gray-400"></i>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="mb-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="profile-photo"
              />
              <label
                htmlFor="profile-photo"
                className="bg-[#AB8841] hover:bg-[#8B6B21] text-white px-4 py-2 rounded-lg cursor-pointer transition-colors font-semibold"
              >
                <i className="fa-solid fa-upload mr-2"></i>
                Choose Photo
              </label>
            </div>

            {selectedFile && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Selected: {selectedFile.name}
                </p>
                <button
                  onClick={handlePhotoUpload}
                  className="px-4 py-2 rounded-lg transition-colors font-semibold text-sm sm:text-base"
                  style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
                >
                  <i className="fa-solid fa-save mr-2"></i>
                  Upload Photo
                </button>
              </div>
            )}

            <p className="text-xs text-gray-500">
              Supported formats: JPG, PNG, GIF (max 5MB)
            </p>
          </div>
        </div>

        {/* Account Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 sm:gap-0">
              <h3 className="text-lg sm:text-xl font-bold flex items-center" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                <i className="fa-solid fa-user mr-2" style={{color: '#E5B80B'}}></i>
                Account Information
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchUser()}
                  className="px-3 py-1 rounded-lg transition-colors text-sm font-semibold"
                  style={{backgroundColor: '#6B7280', color: 'white', fontFamily: 'Telegraf, sans-serif'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#4B5563'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#6B7280'}
                  title="Refresh user data"
                >
                  <i className="fa-solid fa-refresh mr-1"></i>
                  Refresh
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-3 py-1 rounded-lg transition-colors text-sm font-semibold"
                  style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
                >
                  <i className={`fa-solid ${isEditing ? 'fa-times' : 'fa-edit'} mr-1`}></i>
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={user?.username || ""}
                    disabled
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-sm sm:text-base"
                    style={{fontFamily: 'Telegraf, sans-serif'}}
                  />
                  <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstname"
                      value={profileForm.firstname}
                      onChange={handleProfileChange}
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] text-sm sm:text-base"
                      style={{fontFamily: 'Telegraf, sans-serif'}}
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastname"
                      value={profileForm.lastname}
                      onChange={handleProfileChange}
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] text-sm sm:text-base"
                      style={{fontFamily: 'Telegraf, sans-serif'}}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] text-sm sm:text-base"
                    style={{fontFamily: 'Telegraf, sans-serif'}}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                    Role
                  </label>
                  <input
                    type="text"
                    value={user?.role === 'admin' ? 'Administrator' : 'Staff Member'}
                    disabled
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-sm sm:text-base"
                    style={{fontFamily: 'Telegraf, sans-serif'}}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="px-4 sm:px-6 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                    style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
                  >
                    <i className="fa-solid fa-save mr-2"></i>
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 sm:px-6 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                    style={{backgroundColor: '#6B7280', color: 'white', fontFamily: 'Telegraf, sans-serif'}}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#4B5563'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#6B7280'}
                  >
                    <i className="fa-solid fa-times mr-2"></i>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Username</p>
                  <p className="font-semibold text-[#2e2b41]">{user?.username || "N/A"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">First Name</p>
                  <p className="font-semibold text-[#2e2b41]">{user?.firstname || "N/A"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Last Name</p>
                  <p className="font-semibold text-[#2e2b41]">{user?.lastname || "N/A"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-semibold text-[#2e2b41]">{user?.email || "Not set"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Role</p>
                  <p className="font-semibold text-[#2e2b41]">
                    {user?.role === 'admin' ? 'Administrator' : 'Staff Member'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Account Status</p>
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    user?.status === 'active' 
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                  }`}>
                    <i className={`fa-solid ${
                      user?.status === 'active' ? 'fa-check' : 'fa-times'
                    } mr-1`}></i>
                    {user?.status === 'active' ? 'Active' : 'Deactivated'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Password Change Section */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8 border border-gray-200">
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 flex items-center" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
          <i className="fa-solid fa-lock mr-2 sm:mr-3" style={{color: '#E5B80B'}}></i>
          Change Password
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showPasswords.oldPassword ? "text" : "password"}
                name="oldPassword"
                value={form.oldPassword}
                onChange={handleChange}
                className="w-full p-2 sm:p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] text-sm sm:text-base"
                style={{fontFamily: 'Telegraf, sans-serif'}}
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('oldPassword')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <i className={`fa-solid ${showPasswords.oldPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.newPassword ? "text" : "password"}
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] text-sm sm:text-base"
                  style={{fontFamily: 'Telegraf, sans-serif'}}
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('newPassword')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <i className={`fa-solid ${showPasswords.newPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
              </div>
              
              {/* Password Requirements Indicator */}
              {form.newPassword && (
                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    Password Requirements:
                  </h4>
                  <div className="space-y-1">
                    <div className="flex items-center text-xs">
                      <i className={`fa-solid fa-${getPasswordRequirements(form.newPassword).length ? 'check' : 'times'} mr-2 ${
                        getPasswordRequirements(form.newPassword).length ? 'text-green-600' : 'text-red-600'
                      }`}></i>
                      <span className={getPasswordRequirements(form.newPassword).length ? 'text-green-700' : 'text-red-700'}>
                        At least 8 characters long
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <i className={`fa-solid fa-${getPasswordRequirements(form.newPassword).uppercase ? 'check' : 'times'} mr-2 ${
                        getPasswordRequirements(form.newPassword).uppercase ? 'text-green-600' : 'text-red-600'
                      }`}></i>
                      <span className={getPasswordRequirements(form.newPassword).uppercase ? 'text-green-700' : 'text-red-700'}>
                        At least one uppercase letter (A-Z)
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <i className={`fa-solid fa-${getPasswordRequirements(form.newPassword).lowercase ? 'check' : 'times'} mr-2 ${
                        getPasswordRequirements(form.newPassword).lowercase ? 'text-green-600' : 'text-red-600'
                      }`}></i>
                      <span className={getPasswordRequirements(form.newPassword).lowercase ? 'text-green-700' : 'text-red-700'}>
                        At least one lowercase letter (a-z)
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <i className={`fa-solid fa-${getPasswordRequirements(form.newPassword).number ? 'check' : 'times'} mr-2 ${
                        getPasswordRequirements(form.newPassword).number ? 'text-green-600' : 'text-red-600'
                      }`}></i>
                      <span className={getPasswordRequirements(form.newPassword).number ? 'text-green-700' : 'text-red-700'}>
                        At least one number (0-9)
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <i className={`fa-solid fa-${getPasswordRequirements(form.newPassword).special ? 'check' : 'times'} mr-2 ${
                        getPasswordRequirements(form.newPassword).special ? 'text-green-600' : 'text-red-600'
                      }`}></i>
                      <span className={getPasswordRequirements(form.newPassword).special ? 'text-green-700' : 'text-red-700'}>
                        At least one special character (!@#$%^&*)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] text-sm sm:text-base"
                  style={{fontFamily: 'Telegraf, sans-serif'}}
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <i className={`fa-solid ${showPasswords.confirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  Updating...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-save mr-2"></i>
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-[#2e2b41] mb-4">
            <i className="fa-solid fa-shield-alt mr-2"></i>
            Password Requirements
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <i className="fa-solid fa-check text-green-500 mr-2"></i>
              At least 8 characters
            </li>
            <li className="flex items-center">
              <i className="fa-solid fa-check text-green-500 mr-2"></i>
              One uppercase letter
            </li>
            <li className="flex items-center">
              <i className="fa-solid fa-check text-green-500 mr-2"></i>
              One lowercase letter
            </li>
            <li className="flex items-center">
              <i className="fa-solid fa-check text-green-500 mr-2"></i>
              One number
            </li>
            <li className="flex items-center">
              <i className="fa-solid fa-check text-green-500 mr-2"></i>
              One special character
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-[#2e2b41] mb-4">
            <i className="fa-solid fa-info-circle mr-2"></i>
            Security Tips
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <i className="fa-solid fa-lightbulb text-yellow-500 mr-2 mt-1"></i>
              Use a unique password for each account
            </li>
            <li className="flex items-start">
              <i className="fa-solid fa-lightbulb text-yellow-500 mr-2 mt-1"></i>
              Avoid using personal information
            </li>
            <li className="flex items-start">
              <i className="fa-solid fa-lightbulb text-yellow-500 mr-2 mt-1"></i>
              Consider using a password manager
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;
