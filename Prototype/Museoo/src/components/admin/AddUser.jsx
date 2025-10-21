import React, { useState, useEffect } from "react";
import axios from "axios";
import api from "../../config/api";

const AddUser = () => {
  const [formData, setFormData] = useState({
    username: "",
    firstname: "",
    lastname: "",
    email: "",
    role: "",
  });

  const [permissions, setPermissions] = useState({
    dashboard: { allowed: true, access: 'edit' },
    schedule: { allowed: true, access: 'edit' },
    visitors: { allowed: true, access: 'edit' },
    scanner: { allowed: true, access: 'edit' },
    exhibit: { allowed: true, access: 'edit' },
    event: { allowed: true, access: 'edit' },
    cultural_objects: { allowed: true, access: 'edit' },
    archive: { allowed: true, access: 'edit' },
    donation: { allowed: true, access: 'edit' },
    reports: { allowed: true, access: 'edit' },
    settings: { allowed: true, access: 'edit' },
  });

  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    type: 'success',
    title: '',
    message: '',
    description: ''
  });
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState("");
  const [logsOffset, setLogsOffset] = useState(0);
  const logsLimit = 10;
  const [userPermissions, setUserPermissions] = useState({
    dashboard: { allowed: true },
    schedule: { allowed: false },
    visitors: { allowed: true },
    scanner: { allowed: true },
    exhibit: { allowed: false },
    event: { allowed: false },
    cultural_objects: { allowed: false },
    archive: { allowed: false },
    donation: { allowed: true },
    reports: { allowed: false },
    settings: { allowed: true },
  });

  const fetchUsers = async () => {
    try {
      const res = await api.get("/api/users");
      if (res.data.success && Array.isArray(res.data.users)) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);



  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setMessage("");
  };

  const handlePermissionChange = (permission, field, value) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: {
        ...prev[permission],
        [field]: value,
        // If setting allowed to false, also set access to 'none'
        // If setting allowed to true, set access to 'edit' if not already set
        access: field === 'allowed' 
          ? (value ? (prev[permission].access || 'edit') : 'none')
          : prev[permission].access
      }
    }));
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setFormData(prev => ({ ...prev, role }));
    
    // Reset permissions based on role
    if (role === 'admin') {
      setPermissions({
        dashboard: { allowed: true, access: 'edit' },
        schedule: { allowed: true, access: 'edit' },
        visitors: { allowed: true, access: 'edit' },
        scanner: { allowed: true, access: 'edit' },
        exhibit: { allowed: true, access: 'edit' },
        event: { allowed: true, access: 'edit' },
        cultural_objects: { allowed: true, access: 'edit' },
        archive: { allowed: true, access: 'edit' },
        donation: { allowed: true, access: 'edit' },
        reports: { allowed: true, access: 'edit' },
        settings: { allowed: true, access: 'edit' },
      });
    } else if (role === 'staff') {
      setPermissions({
        dashboard: { allowed: true, access: 'edit' },
        schedule: { allowed: true, access: 'edit' },
        visitors: { allowed: true, access: 'edit' },
        scanner: { allowed: true, access: 'edit' },
        exhibit: { allowed: false, access: 'none' },
        event: { allowed: false, access: 'none' },
        cultural_objects: { allowed: false, access: 'none' },
        archive: { allowed: false, access: 'none' },
        donation: { allowed: true, access: 'edit' },
        reports: { allowed: false, access: 'none' },
        settings: { allowed: true, access: 'edit' },
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, firstname, lastname, email, role } = formData;

    if (!username || !firstname || !lastname || !email || !role) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (!validateEmail(email)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    try {
      const res = await api.post("/api/create-user", {
        username,
        firstname,
        lastname,
        email,
        role: role,
        permissions: permissions,
      });

      if (res.data.success) {
        const emailStatus = res.data.emailSent ? "✅" : "⚠️";
        const emailMessage = res.data.emailSent 
          ? "Credentials have been sent to the user's email."
          : "User created but email sending failed. Please contact the user directly.";
        
        // Show notification
        setNotification({
          show: true,
          type: 'success',
          title: 'User Created Successfully!',
          message: `${emailStatus} User created successfully!`,
          description: emailMessage
        });
        
        setFormData({
          username: "",
          firstname: "",
          lastname: "",
          email: "",
          role: "",
        });
        setPermissions({
          dashboard: { allowed: true, access: 'edit' },
          schedule: { allowed: true, access: 'edit' },
          visitors: { allowed: true, access: 'edit' },
          scanner: { allowed: true, access: 'edit' },
          exhibit: { allowed: true, access: 'edit' },
          event: { allowed: true, access: 'edit' },
          cultural_objects: { allowed: true, access: 'edit' },
          archive: { allowed: true, access: 'edit' },
          donation: { allowed: true, access: 'edit' },
          reports: { allowed: true, access: 'edit' },
          settings: { allowed: true, access: 'edit' },
        });
        setShowForm(false);
        fetchUsers();
        
        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setNotification(prev => ({ ...prev, show: false }));
        }, 5000);
      } else {
        setNotification({
          show: true,
          type: 'error',
          title: 'User Creation Failed',
          message: '❌ ' + (res.data.message || "User creation failed."),
          description: 'Please check the form and try again.'
        });
        
        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setNotification(prev => ({ ...prev, show: false }));
        }, 5000);
      }
    } catch (err) {
      console.error("AddUser error:", err);
      setNotification({
        show: true,
        type: 'error',
        title: 'Network Error',
        message: '❌ Failed to create user',
        description: err.response?.data?.message || "Network error. Please check your connection."
      });
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
    }
  };

  const handleUserAction = async (id, action) => {
    try {
      const res = await api.post(`/api/users/${id}/${action}`);
      if (res.data.success) {
        // Find the user to get their name for the notification
        const user = users.find(u => u.user_ID === id);
        const userName = user ? `${user.firstname} ${user.lastname}` : 'User';
        
        if (action === 'deactivate') {
          setNotification({
            show: true,
            type: 'success',
            title: 'User Deactivated Successfully!',
            message: `✅ ${userName} has been deactivated`,
            description: 'The user can no longer log in to the system.'
          });
        } else if (action === 'activate') {
          setNotification({
            show: true,
            type: 'success',
            title: 'User Activated Successfully!',
            message: `✅ ${userName} has been activated`,
            description: 'The user can now log in to the system.'
          });
        }
        
        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setNotification(prev => ({ ...prev, show: false }));
        }, 5000);
        
        fetchUsers();
      } else {
        setNotification({
          show: true,
          type: 'error',
          title: 'Action Failed',
          message: `❌ Failed to ${action} user`,
          description: res.data.message || 'An error occurred while processing the request.'
        });
        
        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setNotification(prev => ({ ...prev, show: false }));
        }, 5000);
      }
    } catch (err) {
      console.error("Action error:", err);
      setNotification({
        show: true,
        type: 'error',
        title: 'Action Failed',
        message: `❌ Failed to ${action} user`,
        description: 'An error occurred while processing the request.'
      });
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const res = await api.delete(`/api/users/${id}`);
        if (res.data.success) {
          setNotification({
            show: true,
            type: 'success',
            title: 'User Deleted Successfully!',
            message: '✅ User has been permanently removed from the database',
            description: 'The user and all associated data have been deleted.'
          });
          
          fetchUsers();
          
          // Auto-hide notification after 5 seconds
          setTimeout(() => {
            setNotification(prev => ({ ...prev, show: false }));
          }, 5000);
        } else {
          setNotification({
            show: true,
            type: 'error',
            title: 'Delete Failed',
            message: '❌ Failed to delete user',
            description: res.data.message || 'Please try again.'
          });
          
          // Auto-hide notification after 5 seconds
          setTimeout(() => {
            setNotification(prev => ({ ...prev, show: false }));
          }, 5000);
        }
      } catch (err) {
        console.error("Delete error:", err);
        setNotification({
          show: true,
          type: 'error',
          title: 'Delete Error',
          message: '❌ Failed to delete user',
          description: 'Network error. Please check your connection.'
        });
        
        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setNotification(prev => ({ ...prev, show: false }));
        }, 5000);
      }
    }
  };

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      setLogsError("");
      const res = await axios.get(`http://localhost:3000/api/activity-logs?limit=${logsLimit}&offset=${logsOffset}`, { withCredentials: true });
      if (res.data.success) setLogs(res.data.logs || []);
    } catch (e) {
      setLogsError("Failed to load system logs");
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchLogsFiltered = async (mode) => {
    try {
      setLogsLoading(true);
      setLogsError("");
      const important = mode === 'important' ? '1' : '0';
      const res = await axios.get(`http://localhost:3000/api/activity-logs?limit=${logsLimit}&offset=${logsOffset}&important=${important}`, { withCredentials: true });
      if (res.data.success) setLogs(res.data.logs || []);
    } catch (e) {
      setLogsError("Failed to load system logs");
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchLogsPaged = async (dir) => {
    const nextOffset = Math.max(logsOffset + (dir === 'next' ? logsLimit : -logsLimit), 0);
    setLogsOffset(nextOffset);
    try {
      setLogsLoading(true);
      setLogsError("");
      const res = await axios.get(`http://localhost:3000/api/activity-logs?limit=${logsLimit}&offset=${nextOffset}`, { withCredentials: true });
      if (res.data.success) setLogs(res.data.logs || []);
    } catch (e) {
      setLogsError("Failed to load system logs");
    } finally {
      setLogsLoading(false);
    }
  };

  const handleClearLogs = async () => {
    const older = prompt('Clear logs older than date (YYYY-MM-DD). Leave blank to clear all. Type CONFIRM to proceed.');
    if (older === null) return;
    if (older !== 'CONFIRM' && !/^\d{4}-\d{2}-\d{2}$/.test(older)) {
      alert('Cancelled. To clear all, type CONFIRM. Or provide a date YYYY-MM-DD.');
      return;
    }
    const params = older === 'CONFIRM' ? '' : `?olderThanDate=${older}`;
    if (!confirm('This will permanently delete matching logs. Continue?')) return;
    try {
      await axios.delete(`http://localhost:3000/api/activity-logs${params}`, { withCredentials: true });
      setLogs([]);
      setLogsOffset(0);
      fetchLogs();
    } catch (e) {
      alert('Failed to clear logs');
    }
  };

  const renderLogDescription = (log) => {
    try {
      const d = typeof log.details === 'string' ? JSON.parse(log.details) : (log.details || {});
      switch (log.action) {
        case 'auth.login':
          return 'User logged in';
        case 'auth.logout':
          return 'User logged out';
        case 'activity.create':
          return `Created ${d.type} "${d.title || ''}"`.trim();
        case 'activity.delete':
          return `Deleted activity #${d.activityId}`;
        case 'booking.create':
          return `Created booking #${d.bookingId} (${d.totalVisitors || '?'} visitors)`;
        case 'booking.approve':
          return `Approved booking #${d.bookingId}`;
        case 'booking.cancel':
          return `Cancelled booking #${d.bookingId}`;
        case 'booking.reject':
          return `Rejected booking #${d.bookingId}`;
        case 'cobject.create':
          return `Added Cultural Object #${d.culturalObjectId}`;
        case 'cobject.update':
          return `Updated Cultural Object #${d.culturalObjectId}`;
        case 'cobject.delete':
          return `Deleted Cultural Object #${d.culturalObjectId}`;
        case 'archive.create':
          return `Added Digital Archive "${d.title || ''}"`;
        case 'archive.delete':
          return `Deleted Digital Archive #${d.id}`;
        case 'donation.create':
          return `Added donation from ${d.donor_name || 'donor'}`;
        case 'donation.update':
          return `Updated donation #${d.donationId}`;
        case 'donation.approve':
        case 'donation.approve.email_ok':
          return `Approved donation #${d.donationId}`;
        case 'donation.reject':
          return `Rejected donation #${d.donationId}`;
        case 'visitor.checkin':
          return `Visitor checked in #${d.visitorId}`;
        case 'report.generate':
          return `Generated report (${d.reportType})`;
        case 'report.download.pdf':
          return `Downloaded report #${d.reportId} (PDF)`;
        case 'report.download.csv':
          return `Downloaded report #${d.reportId} (CSV)`;
        default:
          return '';
      }
    } catch {
      return '';
    }
  };

  const handleManagePermissions = async (user) => {
    console.log("🔧 Opening permissions for user:", user);
    
    // Force set permissions first
    const defaultPermissions = {
      dashboard: { permission_level: 'view' },
      schedule: { permission_level: 'none' },
      visitors: { permission_level: 'view' },
      scanner: { permission_level: 'edit' },
      exhibit: { permission_level: 'none' },
      event: { permission_level: 'none' },
      cultural_objects: { permission_level: 'none' },
      archive: { permission_level: 'none' },
      donation: { permission_level: 'view' },
      settings: { permission_level: 'view' },
    };
    
    console.log("📋 Setting permissions:", defaultPermissions);
    setUserPermissions(defaultPermissions);
    
    // Then set user and open modal
    setSelectedUser(user);
    setShowPermissionsModal(true);
    
    console.log("✅ Modal opened with permissions set");
    
    try {
      // Fetch user's current permissions from database
      console.log("📡 Fetching saved permissions for user ID:", user.id);
      const res = await api.get(`/api/users/${user.id}/permissions`);
      console.log("📋 API response:", res.data);
      
      if (res.data.success && res.data.permissions && Object.keys(res.data.permissions).length > 0) {
        console.log("✅ Loading saved permissions from database:", res.data.permissions);
        setUserPermissions(res.data.permissions);
      } else {
        console.log("⚠️ No saved permissions found, using defaults");
      }
    } catch (err) {
      console.error("❌ Fetch permissions error:", err);
      console.log("⚠️ Using default permissions due to error");
    }
  };

  const handleUserPermissionChange = (permission, field, value) => {
    console.log("🔄 Changing permission:", permission, field, value);
    setUserPermissions(prev => {
      const newPermissions = {
        ...prev,
        [permission]: {
          ...prev[permission],
          [field]: value
        }
      };
      console.log("📋 New permissions state:", newPermissions);
      return newPermissions;
    });
  };

  const handleSavePermissions = async () => {
    try {
      console.log("💾 Saving permissions for user:", selectedUser.id);
      console.log("📋 Permissions to save:", userPermissions);
      console.log("🌐 Making request to:", `http://localhost:3000/api/users/${selectedUser.id}/permissions`);
      
      const res = await api.put(`/api/users/${selectedUser.id}/permissions`, {
        permissions: userPermissions
      });
      
      console.log("📡 Save response:", res.data);
      
      if (res.data.success) {
        setNotification({
          show: true,
          type: 'success',
          title: 'Permissions Updated Successfully!',
          message: '✅ Permissions have been updated for ' + selectedUser.username,
          description: 'The user will see the changes on their next login.'
        });
        
        setShowPermissionsModal(false);
        fetchUsers();
        
        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setNotification(prev => ({ ...prev, show: false }));
        }, 5000);
        
        // Also show what was saved
        console.log("✅ Permissions saved successfully for user:", selectedUser.username);
        console.log("📋 Saved permissions:", userPermissions);
      } else {
        setNotification({
          show: true,
          type: 'error',
          title: 'Permission Update Failed',
          message: '❌ Failed to update permissions',
          description: res.data.message || "Unknown error occurred."
        });
        
        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setNotification(prev => ({ ...prev, show: false }));
        }, 5000);
      }
    } catch (err) {
      console.error("❌ Update permissions error:", err);
      console.error("❌ Error details:", {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      
      setNotification({
        show: true,
        type: 'error',
        title: 'Permission Update Error',
        message: '❌ Failed to update permissions',
        description: err.message || "Network error. Please check your connection."
      });
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
    }
  };

  const activeUsers = users.filter((u) => u.status === "active");
  const deactivatedUsers = users.filter((u) => u.status === "deactivated");
  const otherUsers = users.filter((u) => u.status !== "active" && u.status !== "deactivated");
  
  // Debug: Log all users to see their status
  console.log("🔍 All users:", users);
  console.log("✅ Active users:", activeUsers);
  console.log("❌ Deactivated users:", deactivatedUsers);
  console.log("❓ Other users (different status):", otherUsers);
  console.log("📊 Total users:", users.length);
  console.log("📊 Active count:", activeUsers.length);
  console.log("📊 Deactivated count:", deactivatedUsers.length);
  console.log("📊 Other count:", otherUsers.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-[#2e2b41]">
          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
          Loading users...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
              <i className="fa-solid fa-user-plus text-white text-lg sm:text-xl"></i>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                User Management
              </h1>
              <p className="text-gray-600 text-sm sm:text-base" style={{fontFamily: 'Telegraf, sans-serif'}}>
                Create and manage system users
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-colors font-semibold shadow-md text-sm sm:text-base"
            style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
          >
            <i className="fa-solid fa-plus mr-2"></i>
            {showForm ? "Cancel" : "Add New User"}
          </button>
        </div>
      </div>

      {/* Add User Modal */}
      {showForm && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <div className="bg-white rounded-xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[98vh] sm:max-h-[95vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="relative p-3 sm:p-4 md:p-8" style={{background: 'linear-gradient(135deg, #351E10 0%, #2A1A0D 50%, #1A0F08 100%)'}}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E5B80B]/10 to-transparent"></div>
              <div className="relative flex justify-between items-center">
                <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg sm:rounded-2xl flex items-center justify-center flex-shrink-0" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                    <i className="fa-solid fa-user-plus text-lg sm:text-xl md:text-2xl text-white"></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      Add New Staff/Admin User
                    </h3>
                    <p className="text-white text-opacity-90 text-xs sm:text-sm truncate" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      Create a new user account with auto-generated credentials
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center justify-center group flex-shrink-0 ml-2"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto">
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start">
              <i className="fa-solid fa-info-circle text-blue-600 mt-1 mr-2 sm:mr-3 flex-shrink-0"></i>
              <div className="min-w-0">
                <h4 className="font-semibold text-blue-800 mb-1 sm:mb-2 text-sm sm:text-base" style={{fontFamily: 'Telegraf, sans-serif'}}>Auto-Generated Credentials</h4>
                <p className="text-blue-700 text-xs sm:text-sm leading-relaxed">
                  When you create a new user, the system will automatically generate a secure password 
                  and send the login credentials to the user's email address. The user can then log in 
                  and change their password.
                </p>
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 ${
              message.startsWith("✅") 
                ? "bg-green-100 text-green-800 border border-green-200" 
                : "bg-red-100 text-red-800 border border-red-200"
            }`}>
              <div className="flex items-start">
                <i className={`fa-solid ${
                  message.startsWith("✅") ? "fa-check-circle" : "fa-exclamation-circle"
                } mr-2 mt-0.5 flex-shrink-0`}></i>
                <span className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed" style={{fontFamily: 'Telegraf, sans-serif'}}>{message}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              <div>
                <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] text-sm sm:text-base"
                  style={{fontFamily: 'Telegraf, sans-serif'}}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleRoleChange}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] text-sm sm:text-base"
                  style={{fontFamily: 'Telegraf, sans-serif'}}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] text-sm sm:text-base"
                  style={{fontFamily: 'Telegraf, sans-serif'}}
                  placeholder="Enter first name"
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
                  value={formData.lastname}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] text-sm sm:text-base"
                  style={{fontFamily: 'Telegraf, sans-serif'}}
                  placeholder="Enter last name"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] text-sm sm:text-base"
                  style={{fontFamily: 'Telegraf, sans-serif'}}
                  placeholder="Enter email address"
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  <i className="fa-solid fa-info-circle mr-1"></i>
                  A secure password will be auto-generated and sent to this email address.
                </p>
              </div>
            </div>

            {/* User Permissions Section */}
            {formData.role === 'staff' && (
              <div className="mt-4 sm:mt-6">
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                  <i className="fa-solid fa-shield-alt mr-2" style={{color: '#E5B80B'}}></i>
                  User Permissions
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  Select which features this user can access in their dashboard:
                </p>
                
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {Object.entries(permissions).map(([permission, config], index) => (
                    <div key={permission}>
                      <div className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold capitalize text-sm sm:text-base" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                                {permission.replace('_', ' ')}
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed" style={{fontFamily: 'Telegraf, sans-serif'}}>
                                {permission === 'dashboard' && "Allows access to the main dashboard and statistics."}
                                {permission === 'schedule' && "Allows management of museum schedules and appointments."}
                                {permission === 'visitors' && "Allows viewing and managing visitor information and records."}
                                {permission === 'scanner' && "Allows scanning QR codes and managing visitor check-ins."}
                                {permission === 'exhibit' && "Allows management of museum exhibits and displays."}
                                {permission === 'event' && "Allows creation and management of museum events."}
                                {permission === 'cultural_objects' && "Allows management of cultural objects and artifacts."}
                                {permission === 'archive' && "Allows access to the digital archive and historical records."}
                                {permission === 'donation' && "Allows viewing and managing donation records."}
                                {permission === 'settings' && "Allows access to account settings and preferences."}
                              </p>
                            </div>
                            
                            {/* Access Level Buttons */}
                              <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handlePermissionChange(permission, 'allowed', true)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                                  config.allowed
                                    ? 'bg-green-100 text-green-700 border border-green-300'
                                    : 'bg-gray-100 text-gray-500 border border-gray-300 hover:bg-green-50 hover:text-green-600'
                                }`}
                                style={{fontFamily: 'Telegraf, sans-serif'}}
                              >
                                Have Access
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePermissionChange(permission, 'allowed', false)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                                  !config.allowed
                                    ? 'bg-gray-100 text-gray-700 border border-gray-400'
                                    : 'bg-gray-100 text-gray-500 border border-gray-300 hover:bg-gray-50 hover:text-gray-600'
                                }`}
                                style={{fontFamily: 'Telegraf, sans-serif'}}
                              >
                                Hide Access
                              </button>
                              </div>
                              </div>
                        </div>
                      </div>
                      {index < Object.keys(permissions).length - 1 && (
                        <div className="border-t border-gray-200"></div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 sm:mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-800 leading-relaxed" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    <i className="fa-solid fa-info-circle mr-1 flex-shrink-0"></i>
                    <strong>Access Levels:</strong> Have Access (user can access this feature), Hide Access (user cannot access this feature)
                  </p>
                </div>
              </div>
            )}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
                <button
                  type="submit"
                  className="px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold transition-colors shadow-md text-sm sm:text-base"
                  style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
                >
                  <i className="fa-solid fa-user-plus mr-2"></i>
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold transition-colors shadow-md text-sm sm:text-base"
                  style={{fontFamily: 'Telegraf, sans-serif'}}
                >
                  <i className="fa-solid fa-times mr-2"></i>
                  Cancel
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        <div className="bg-white rounded-lg shadow-lg p-2 sm:p-3 md:p-4 border border-gray-200">
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
              <i className="fa-solid fa-users text-yellow-600 text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Total Users</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-2 sm:p-3 md:p-4 border border-gray-200">
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <i className="fa-solid fa-user-shield text-green-600 text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Active Users</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{activeUsers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-2 sm:p-3 md:p-4 border border-gray-200">
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
              <i className="fa-solid fa-user-slash text-red-600 text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Deactivated</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">{deactivatedUsers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Users Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center" style={{fontFamily: 'Telegraf, sans-serif'}}>
            <i className="fa-solid fa-users mr-2"></i>
            Active Users ({activeUsers.length})
          </h3>
        </div>

        {/* Mobile View - Cards */}
        <div className="block md:hidden">
          {activeUsers.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-500">
                <i className="fa-solid fa-users text-4xl mb-4 text-gray-300"></i>
                <p className="text-lg">No active users found</p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {activeUsers.map((user) => (
                <div key={user.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <i className="fa-solid fa-user text-white text-sm"></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-[#2e2b41] truncate">
                            {user.username}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">
                            {user.firstname} {user.lastname}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-xs text-gray-600">
                          <i className="fa-solid fa-envelope mr-2 w-4"></i>
                          <span className="truncate">{user.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' 
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}>
                            <i className={`fa-solid ${
                              user.role === 'admin' ? 'fa-user-shield' : 'fa-user'
                            } mr-1`}></i>
                            {user.role === 'admin' ? "Admin" : "Staff"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    {user.role === 'staff' && (
                      <button
                        onClick={() => {
                          console.log("🔘 Permissions button clicked for user:", user);
                          handleManagePermissions(user);
                        }}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg transition-colors border"
                        style={{color: '#E5B80B', borderColor: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#E5B80B';
                          e.target.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#E5B80B';
                        }}
                      >
                        <i className="fa-solid fa-shield-alt mr-1"></i>
                        Manage Permissions
                      </button>
                    )}
                    <button
                      onClick={() => handleUserAction(user.id, "deactivate")}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg transition-colors border"
                      style={{color: '#f44336', borderColor: '#f44336', fontFamily: 'Telegraf, sans-serif'}}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f44336';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#f44336';
                      }}
                    >
                      <i className="fa-solid fa-user-slash mr-1"></i>
                      Deactivate User
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <i className="fa-solid fa-users text-4xl mb-4 text-gray-300"></i>
                      <p className="text-lg">No active users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                activeUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-[#2e2b41]">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.firstname} {user.lastname}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        <i className="fa-solid fa-envelope mr-1"></i>
                        {user.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? "bg-purple-100 text-purple-800 border border-purple-200"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}>
                        <i className={`fa-solid ${
                          user.role === 'admin' ? 'fa-user-shield' : 'fa-user'
                        } mr-1`}></i>
                        {user.role === 'admin' ? "Admin" : "Staff"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      {user.role === 'staff' && (
                        <button
                          onClick={() => {
                            console.log("🔘 Permissions button clicked for user:", user);
                            handleManagePermissions(user);
                          }}
                          className="text-sm font-semibold transition-colors"
                          style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}
                          onMouseEnter={(e) => e.target.style.color = '#d4a509'}
                          onMouseLeave={(e) => e.target.style.color = '#E5B80B'}
                        >
                          <i className="fa-solid fa-shield-alt mr-1"></i>
                          Permissions
                        </button>
                      )}
                      <button
                        onClick={() => handleUserAction(user.id, "deactivate")}
                        className="text-sm font-semibold transition-colors"
                        style={{color: '#f44336', fontFamily: 'Telegraf, sans-serif'}}
                        onMouseEnter={(e) => e.target.style.color = '#d32f2f'}
                        onMouseLeave={(e) => e.target.style.color = '#f44336'}
                      >
                        <i className="fa-solid fa-user-slash mr-1"></i>
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deactivated Users Table */}
      {deactivatedUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200" style={{background: 'linear-gradient(135deg, #dc2626, #b91c1c)'}}>
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center" style={{fontFamily: 'Telegraf, sans-serif'}}>
              <i className="fa-solid fa-user-slash mr-2"></i>
              Deactivated Users ({deactivatedUsers.length})
            </h3>
          </div>

          {/* Mobile View - Cards */}
          <div className="block md:hidden">
            <div className="p-4 space-y-4">
              {deactivatedUsers.map((user) => (
                <div key={user.id} className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <i className="fa-solid fa-user-slash text-white text-sm"></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-[#2e2b41] truncate">
                            {user.username}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">
                            {user.firstname} {user.lastname}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-xs text-gray-600">
                          <i className="fa-solid fa-envelope mr-2 w-4"></i>
                          <span className="truncate">{user.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' 
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}>
                            <i className={`fa-solid ${
                              user.role === 'admin' ? 'fa-user-shield' : 'fa-user'
                            } mr-1`}></i>
                            {user.role === 'admin' ? "Admin" : "Staff"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleUserAction(user.id, "activate")}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg transition-colors border"
                      style={{color: '#10B981', borderColor: '#10B981', fontFamily: 'Telegraf, sans-serif'}}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#10B981';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#10B981';
                      }}
                    >
                      <i className="fa-solid fa-user-check mr-1"></i>
                      Reactivate
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg transition-colors border"
                      style={{color: '#f44336', borderColor: '#f44336', fontFamily: 'Telegraf, sans-serif'}}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f44336';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#f44336';
                      }}
                    >
                      <i className="fa-solid fa-trash mr-1"></i>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop View - Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deactivatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-red-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mr-4">
                          <i className="fa-solid fa-user-slash text-white text-sm"></i>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900" style={{fontFamily: 'Telegraf, sans-serif'}}>
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>
                            {user.firstname} {user.lastname}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      {user.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? "bg-purple-100 text-purple-800 border border-purple-200"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}>
                        <i className={`fa-solid ${
                          user.role === 'admin' ? 'fa-user-shield' : 'fa-user'
                        } mr-1`}></i>
                        {user.role === 'admin' ? "Admin" : "Staff"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleUserAction(user.id, "activate")}
                        className="text-green-600 hover:text-green-900 transition-colors"
                        style={{color: '#10B981', fontFamily: 'Telegraf, sans-serif'}}
                        onMouseEnter={(e) => e.target.style.color = '#059669'}
                        onMouseLeave={(e) => e.target.style.color = '#10B981'}
                      >
                        <i className="fa-solid fa-user-check mr-1"></i>
                        Reactivate
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        style={{color: '#f44336', fontFamily: 'Telegraf, sans-serif'}}
                        onMouseEnter={(e) => e.target.style.color = '#d32f2f'}
                        onMouseLeave={(e) => e.target.style.color = '#f44336'}
                      >
                        <i className="fa-solid fa-trash mr-1"></i>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Other Users (Different Status) */}
      {otherUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200" style={{background: 'linear-gradient(135deg, #6b7280, #4b5563)'}}>
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center" style={{fontFamily: 'Telegraf, sans-serif'}}>
              <i className="fa-solid fa-question-circle mr-2"></i>
              Other Users ({otherUsers.length})
            </h3>
            <p className="text-white/80 text-sm mt-1">Users with different or unknown status</p>
          </div>

          {/* Mobile View - Cards */}
          <div className="block md:hidden">
            <div className="p-4 space-y-4">
              {otherUsers.map((user) => (
                <div key={user.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <i className="fa-solid fa-user-question text-white text-sm"></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-[#2e2b41] truncate">
                            {user.username}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">
                            {user.firstname} {user.lastname}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-xs text-gray-600">
                          <i className="fa-solid fa-envelope mr-2 w-4"></i>
                          <span className="truncate">{user.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' 
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}>
                            <i className={`fa-solid ${
                              user.role === 'admin' ? 'fa-user-shield' : 'fa-user'
                            } mr-1`}></i>
                            {user.role === 'admin' ? "Admin" : "Staff"}
                          </span>
                          <span className="text-xs text-gray-500">
                            Status: {user.status || 'undefined'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleUserAction(user.id, "activate")}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg transition-colors border"
                      style={{color: '#10B981', borderColor: '#10B981', fontFamily: 'Telegraf, sans-serif'}}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#10B981';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#10B981';
                      }}
                    >
                      <i className="fa-solid fa-user-check mr-1"></i>
                      Activate
                    </button>
                    <button
                      onClick={() => handleUserAction(user.id, "deactivate")}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg transition-colors border"
                      style={{color: '#f44336', borderColor: '#f44336', fontFamily: 'Telegraf, sans-serif'}}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f44336';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#f44336';
                      }}
                    >
                      <i className="fa-solid fa-user-slash mr-1"></i>
                      Deactivate
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg transition-colors border"
                      style={{color: '#dc2626', borderColor: '#dc2626', fontFamily: 'Telegraf, sans-serif'}}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#dc2626';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#dc2626';
                      }}
                    >
                      <i className="fa-solid fa-trash mr-1"></i>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop View - Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {otherUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center mr-4">
                          <i className="fa-solid fa-user-question text-white text-sm"></i>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900" style={{fontFamily: 'Telegraf, sans-serif'}}>
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>
                            {user.firstname} {user.lastname}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      {user.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? "bg-purple-100 text-purple-800 border border-purple-200"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}>
                        <i className={`fa-solid ${
                          user.role === 'admin' ? 'fa-user-shield' : 'fa-user'
                        } mr-1`}></i>
                        {user.role === 'admin' ? "Admin" : "Staff"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      <span className="text-orange-600 font-medium">
                        {user.status || 'undefined'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleUserAction(user.id, "activate")}
                        className="text-green-600 hover:text-green-900 transition-colors"
                        style={{color: '#10B981', fontFamily: 'Telegraf, sans-serif'}}
                        onMouseEnter={(e) => e.target.style.color = '#059669'}
                        onMouseLeave={(e) => e.target.style.color = '#10B981'}
                      >
                        <i className="fa-solid fa-user-check mr-1"></i>
                        Activate
                      </button>
                      <button
                        onClick={() => handleUserAction(user.id, "deactivate")}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        style={{color: '#f44336', fontFamily: 'Telegraf, sans-serif'}}
                        onMouseEnter={(e) => e.target.style.color = '#d32f2f'}
                        onMouseLeave={(e) => e.target.style.color = '#f44336'}
                      >
                        <i className="fa-solid fa-user-slash mr-1"></i>
                        Deactivate
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-800 hover:text-red-900 transition-colors"
                        style={{color: '#dc2626', fontFamily: 'Telegraf, sans-serif'}}
                        onMouseEnter={(e) => e.target.style.color = '#b91c1c'}
                        onMouseLeave={(e) => e.target.style.color = '#dc2626'}
                      >
                        <i className="fa-solid fa-trash mr-1"></i>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* System Activity Logs */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200" style={{background: 'linear-gradient(135deg, #351E10 0%, #2A1A0D 50%, #1A0F08 100%)'}}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center" style={{fontFamily: 'Telegraf, sans-serif'}}>
              <i className="fa-solid fa-clipboard-list mr-2"></i>
              System Activity Logs
            </h3>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <label className="text-white/80 text-xs sm:text-sm" style={{fontFamily: 'Telegraf, sans-serif'}}>Filter:</label>
              <select
                onChange={(e) => fetchLogsFiltered(e.target.value)}
                className="text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md text-xs sm:text-sm border-0 focus:ring-2 focus:ring-[#E5B80B]"
                style={{fontFamily: 'Telegraf, sans-serif'}}
              >
                <option value="all">All</option>
                <option value="important">Important only</option>
              </select>
              <button
                onClick={() => fetchLogsPaged('prev')}
                className="text-white bg-white/10 hover:bg-white/20 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm transition-colors"
                style={{fontFamily: 'Telegraf, sans-serif'}}
                title="Previous"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <button
                onClick={() => fetchLogsPaged('next')}
                className="text-white bg-white/10 hover:bg-white/20 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm transition-colors"
                style={{fontFamily: 'Telegraf, sans-serif'}}
                title="Next"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
              <button 
                onClick={fetchLogs} 
                className="text-white bg-white/10 hover:bg-white/20 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm transition-colors"
                style={{fontFamily: 'Telegraf, sans-serif'}}
              >
                <i className="fa-solid fa-rotate mr-1"></i>
                Refresh
              </button>
              <button
                onClick={handleClearLogs}
                className="text-white bg-red-600 hover:bg-red-700 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm transition-colors"
                style={{fontFamily: 'Telegraf, sans-serif'}}
                title="Clear logs"
              >
                <i className="fa-solid fa-trash"></i>
              </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {logsLoading ? (
            <div className="p-4 sm:p-6 text-center text-gray-600">
              <i className="fa-solid fa-spinner fa-spin mr-2" style={{color: '#E5B80B'}}></i>
              <span style={{fontFamily: 'Telegraf, sans-serif'}}>Loading logs...</span>
            </div>
          ) : logsError ? (
            <div className="p-4 sm:p-6 text-center text-red-600" style={{fontFamily: 'Telegraf, sans-serif'}}>{logsError}</div>
          ) : logs.length === 0 ? (
            <div className="p-4 sm:p-6 text-center text-gray-600" style={{fontFamily: 'Telegraf, sans-serif'}}>No logs found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Time</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>User</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Role</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Action</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>IP</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      {log.username ? (
                        <span className="font-medium">{log.username}</span>
                      ) : (
                        <span className="text-gray-500">System</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>{log.role || '—'}</td>
                    <td className="px-3 sm:px-6 py-3 text-xs sm:text-sm text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>{renderLogDescription(log) || log.action}</td>
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>{log.ip_address || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>


      {/* Permissions Management Modal */}
      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 border-b border-gray-200" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                    <i className="fa-solid fa-shield-alt text-white text-lg sm:text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      Manage Permissions
                    </h3>
                    <p className="text-white text-opacity-90 text-xs sm:text-sm" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      {selectedUser.firstname} {selectedUser.lastname} ({selectedUser.username})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="text-white hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
                >
                  <i className="fa-solid fa-times text-xl"></i>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(95vh-200px)]">
              {/* Info Banner */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <i className="fa-solid fa-info text-white text-sm"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Permission Guide</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-green-700">Have Access - User can access this feature</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                        <span className="text-gray-600">Hide Access - User cannot access this feature</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.keys(userPermissions).length === 0 ? (
                  <div className="col-span-2 text-center py-8">
                    <div className="text-gray-500">
                      <i className="fa-solid fa-spinner fa-spin text-4xl mb-4"></i>
                      <p className="text-lg">Loading permissions...</p>
                      <p className="text-sm mt-2">Debug: userPermissions is empty</p>
                    </div>
                  </div>
                ) : (
                  Object.entries(userPermissions).map(([permission, config]) => (
                  <div key={permission} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                            permission === 'dashboard' ? 'bg-blue-100 text-blue-600' :
                            permission === 'visitors' ? 'bg-green-100 text-green-600' :
                            permission === 'scanner' ? 'bg-purple-100 text-purple-600' :
                            permission === 'exhibit' ? 'bg-orange-100 text-orange-600' :
                            permission === 'archive' ? 'bg-indigo-100 text-indigo-600' :
                            permission === 'donation' ? 'bg-pink-100 text-pink-600' :
                            permission === 'reports' ? 'bg-teal-100 text-teal-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            <i className={`fa-solid ${
                              permission === 'dashboard' ? 'fa-chart-line' :
                              permission === 'visitors' ? 'fa-users' :
                              permission === 'scanner' ? 'fa-qrcode' :
                              permission === 'exhibit' ? 'fa-landmark' :
                              permission === 'archive' ? 'fa-archive' :
                              permission === 'donation' ? 'fa-hand-holding-heart' :
                              permission === 'reports' ? 'fa-chart-bar' :
                              permission === 'schedule' ? 'fa-calendar' :
                              permission === 'event' ? 'fa-calendar-day' :
                              permission === 'cultural_objects' ? 'fa-museum' :
                              permission === 'settings' ? 'fa-cog' :
                              'fa-cube'
                            } text-sm`}></i>
                          </div>
                          <h4 className="font-bold text-lg text-[#2e2b41] capitalize">
                            {permission.replace('_', ' ')}
                          </h4>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {permission === 'dashboard' && "Access to main dashboard, statistics, and overview data."}
                          {permission === 'schedule' && "Manage museum schedules, appointments, and time slots."}
                          {permission === 'visitors' && "View and manage visitor information, records, and history."}
                          {permission === 'scanner' && "Scan QR codes and manage visitor check-ins and check-outs."}
                          {permission === 'exhibit' && "Manage museum exhibits, displays, and exhibition content."}
                          {permission === 'event' && "Create, edit, and manage museum events and activities."}
                          {permission === 'cultural_objects' && "Manage cultural objects, artifacts, and collections."}
                          {permission === 'archive' && "Access digital archive, historical records, and documents."}
                          {permission === 'donation' && "View and manage donation records and donor information."}
                          {permission === 'reports' && "Generate and view reports, analytics, and data insights."}
                          {permission === 'settings' && "Access account settings, preferences, and profile management."}
                        </p>
                      </div>
                    </div>
                    
                    {/* Access Level Buttons */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleUserPermissionChange(permission, 'allowed', true)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                            config.allowed
                              ? 'border-green-500 bg-green-50 text-green-700 shadow-md'
                              : 'border-gray-300 bg-white text-gray-500 hover:border-green-400 hover:bg-green-50 hover:text-green-600'
                          }`}
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        >
                          <div className="text-center">
                            <div className={`w-5 h-5 rounded-full mx-auto mb-2 ${
                              config.allowed ? 'bg-green-500' : 'bg-gray-300'
                            }`}></div>
                            <span className="text-sm font-semibold">Have Access</span>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => handleUserPermissionChange(permission, 'allowed', false)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                            !config.allowed
                              ? 'border-gray-500 bg-gray-100 text-gray-700 shadow-md'
                              : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-600'
                          }`}
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        >
                          <div className="text-center">
                            <div className={`w-5 h-5 rounded-full mx-auto mb-2 ${
                              !config.allowed ? 'bg-gray-500' : 'bg-gray-300'
                            }`}></div>
                            <span className="text-sm font-semibold">Hide Access</span>
                          </div>
                        </button>
                      </div>
                      
                      {/* Current Status */}
                      <div className="text-center">
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                          !config.allowed ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                        }`} style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className={`fa-solid mr-2 ${
                            !config.allowed ? 'fa-ban' : 'fa-check'
                          }`}></i>
                          {!config.allowed ? 'Access Hidden' : 'Have Access'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
                )}
            </div>
            </div>
            
            {/* Footer */}
            <div className="px-8 py-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <i className="fa-solid fa-info-circle mr-1"></i>
                Changes will be applied immediately when saved
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3">
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="px-6 py-2 sm:py-3 text-gray-600 hover:text-gray-800 font-semibold transition-colors text-sm sm:text-base"
                  style={{fontFamily: 'Telegraf, sans-serif'}}
                >
                  <i className="fa-solid fa-times mr-2"></i>
                  Cancel
                </button>
                <button
                  onClick={handleSavePermissions}
                  className="px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl text-sm sm:text-base"
                  style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
                >
                  <i className="fa-solid fa-save mr-2"></i>
                  Save Permissions
                </button>
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
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default AddUser;
