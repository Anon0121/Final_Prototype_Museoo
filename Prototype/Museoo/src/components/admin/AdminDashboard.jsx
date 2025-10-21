import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/api";

import Dashboard from "./Dashboard";
import Schedule from "./Schedule";
import Visitors from "./Visitors";
import Exhibit from "./Exhibit";
import Event from "./Event";
import Archive from "./Archive";
import Donation from "./Donation";
import Settings from "./settings";
import AddUser from "./AddUser";
import CulturalObjects from "./CulturalObjects";
import VisitorScanner from "./VisitorScanner";
import EventParticipantScanner from "./EventParticipantScanner";
import Reports from "./Reports";
import PromotionalManagement from "./PromotionalManagement";


const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize from localStorage or default to Dashboard
    return localStorage.getItem('adminActiveTab') || "Dashboard";
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const navigate = useNavigate();

  // ✅ Auth check
  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("🔄 Fetching user data in AdminDashboard...");
        const res = await api.get("/api/user");
        console.log("📋 AdminDashboard user data:", res.data);

        if (res.data.success) {
          setUser(res.data.user);
          console.log("✅ User status in AdminDashboard:", res.data.user.status);
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error("🔐 Auth error:", err);
        
        // Check if user is deactivated
        if (err.response?.status === 401 && err.response?.data?.message?.includes('deactivated')) {
          alert("Your account has been deactivated. Please contact an administrator.");
        }
        
        navigate("/login");
      }
    };

    fetchUser();
    
    // Set up periodic refresh of user data to get updated permissions
    const interval = setInterval(fetchUser, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, [navigate]);

  // ✅ Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  // ✅ Keyboard shortcut to expand collapsed sidebar
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape' && isCollapsed) {
        setIsCollapsed(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isCollapsed]);

  // ✅ Logout handler
  const handleLogout = async () => {
    try {
      const res = await api.get("/api/logout");
      if (res.data.success) {
        navigate("/login");
      }
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/login");
    }
  };

  // ✅ Refresh user data handler
  const handleRefreshUser = async () => {
    try {
      console.log("🔄 Manually refreshing user data...");
      const res = await api.get("/api/user");
      if (res.data.success) {
        setUser(res.data.user);
        console.log("✅ User data refreshed:", res.data.user);
      }
    } catch (err) {
      console.error("Refresh error:", err);
      
      // Check if user is deactivated
      if (err.response?.status === 401 && err.response?.data?.message?.includes('deactivated')) {
        alert("Your account has been deactivated. Please contact an administrator.");
        navigate("/login");
      }
    }
  };

  // ✅ Get user permissions
  const getUserPermissions = () => {
    if (!user) return {};
    
    console.log("🔍 Getting permissions for user:", user.username);
    console.log("🔍 User permissions data:", user.permissions);
    
    // If user has permissions in session, use them
    if (user.permissions) {
      const perms = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
      console.log("🔍 Parsed permissions:", perms);
      
      // Convert to new format if needed
      const convertedPerms = {};
      Object.entries(perms).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          convertedPerms[key] = { allowed: value, access: value ? 'edit' : 'none' };
        } else if (typeof value === 'object') {
          convertedPerms[key] = value;
        }
      });
      console.log("🔍 Converted permissions:", convertedPerms);
      return convertedPerms;
    }
    
    console.log("🔍 No permissions found, using defaults for role:", user.role);
    
    // Default permissions based on role
    if (user.role === 'admin') {
      return {
        dashboard: { allowed: true, access: 'edit' },
        schedule: { allowed: true, access: 'edit' },
        visitors: { allowed: true, access: 'edit' },
        scanner: { allowed: true, access: 'edit' },
        exhibit: { allowed: true, access: 'edit' },
        event: { allowed: true, access: 'edit' },
        cultural_objects: { allowed: true, access: 'edit' },
        promotional: { allowed: true, access: 'edit' },
        archive: { allowed: true, access: 'edit' },
        donation: { allowed: true, access: 'edit' },
        reports: { allowed: true, access: 'edit' },
        settings: { allowed: true, access: 'edit' },
      };
    } else {
      return {
        dashboard: { allowed: true, access: 'view' },
        schedule: { allowed: false, access: 'none' },
        visitors: { allowed: true, access: 'view' },
        scanner: { allowed: true, access: 'edit' },
        exhibit: { allowed: false, access: 'none' },
        event: { allowed: false, access: 'none' },
        cultural_objects: { allowed: false, access: 'none' },
        promotional: { allowed: false, access: 'none' },
        archive: { allowed: false, access: 'none' },
        donation: { allowed: true, access: 'view' },
        reports: { allowed: true, access: 'view' },
        settings: { allowed: true, access: 'view' },
      };
    }
  };

  const userPermissions = getUserPermissions();
  
  console.log("🔍 Final user permissions:", userPermissions);

  // ✅ Tabs with permission filtering
  const allTabs = [
    { name: "Dashboard", icon: "fa-house", permission: "dashboard" },
    { name: "Schedule", icon: "fa-calendar", permission: "schedule" },
    { name: "Visitors", icon: "fa-person-walking", permission: "visitors" },
    { name: "Scanner", icon: "fa-qrcode", permission: "scanner" },
    { name: "Exhibit", icon: "fa-eye", permission: "exhibit" },
    { name: "Event", icon: "fa-calendar-week", permission: "event" },
    { name: "CulturalObjects", icon: "fa-landmark", permission: "cultural_objects" },
    { name: "Promotional", icon: "fa-star", permission: "promotional" },
    { name: "Archive", icon: "fa-box-archive", permission: "archive" },
    { name: "Donation", icon: "fa-hand-holding-dollar", permission: "donation" },
    { name: "Reports", icon: "fa-chart-bar", permission: "reports" },
    { name: "Settings", icon: "fa-gear", permission: "settings" },
  ];

  // Filter tabs based on permissions
  const tabs = allTabs.filter(tab => {
    const permission = userPermissions[tab.permission];
    console.log(`🔍 Checking tab "${tab.name}" with permission:`, permission);
    
    // If no permission found, show it (fallback)
    if (!permission) {
      console.log(`✅ Tab "${tab.name}" - no permission found, showing`);
      return true;
    }
    
    // If permission is explicitly not allowed (0 or false), hide it
    if (permission.allowed === false || permission.allowed === 0) {
      console.log(`❌ Tab "${tab.name}" - not allowed, hiding`);
      return false;
    }
    
    // If permission is allowed, show it
    console.log(`✅ Tab "${tab.name}" - allowed, showing`);
    return true;
  });

  // Add AddUser tab for admins
  if (user?.role === 'admin') {
    tabs.push({ name: "AddUser", icon: "fa-user-plus" });
  }

  // ✅ Show loading while user is being checked
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600 text-lg">
        Checking authentication...
      </div>
    );
  }

  const SidebarContent = (
    <div
      className={`fixed left-0 top-0 z-40 bg-gradient-to-b from-[#351E10] via-[#2A1A0D] to-[#1A0F08] text-white h-screen flex flex-col transition-all duration-300 shadow-2xl overflow-hidden ${
        isCollapsed ? "w-16 sm:w-20 cursor-pointer" : "w-64"
      }`}
      style={{ scrollBehavior: 'smooth' }}
      onClick={() => {
        if (isCollapsed) {
          setIsCollapsed(false);
        }
      }}
    >
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Expand hint for collapsed sidebar */}
      {isCollapsed && (
        <div className="absolute top-4 right-2 z-20">
          <div className="w-2 h-2 bg-[#E5B80B] rounded-full animate-pulse" title="Click to expand"></div>
        </div>
      )}

      {/* Header with Logo */}
      <div className="relative p-4 sm:p-6 border-b border-[#E5B80B]/20 bg-gradient-to-r from-[#351E10]/50 to-[#2A1A0D]/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-[#E5B80B] to-[#D4AF37] rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                <i className="fa-solid fa-landmark text-white text-xl"></i>
              </div>
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-xl font-bold text-white mb-1" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  MuseoSmart
                </h2>
                <p className="text-[#E5B80B] text-sm font-medium" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  {user?.role === 'admin' ? 'Admin Portal' : 'Staff Portal'}
                </p>
              </div>
            )}
          </div>
          <button
            className="text-gray-300 hover:text-[#E5B80B] transition-all duration-200 hidden md:block p-2 rounded-xl hover:bg-[#E5B80B]/10 hover:shadow-lg transform hover:scale-105"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <i className="fa-solid fa-bars text-lg"></i>
          </button>
        </div>
        {!isCollapsed && (
          <div className="flex items-center gap-2 text-sm text-gray-300 bg-[#E5B80B]/10 rounded-lg px-3 py-2 border border-[#E5B80B]/20">
            <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse shadow-lg"></div>
            <span style={{fontFamily: 'Telegraf, sans-serif'}}>System Online</span>
            <div className="ml-auto">
              <i className="fa-solid fa-shield-check text-[#10B981] text-xs"></i>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="relative flex-1 overflow-hidden">
        <ul className="sidebar-scroll relative h-full p-3 pb-6 space-y-2 overflow-y-auto" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#E5B80B30 transparent'
        }}>
        {tabs.map(({ name, icon }) => (
          <li
            key={name}
            title={isCollapsed ? name : ""}
            onClick={() => {
              setActiveTab(name);
              setShowMobileSidebar(false);
            }}
            className={`group relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-300 text-sm sm:text-base transform hover:scale-[1.02] ${
              activeTab === name
                ? "bg-gradient-to-r from-[#E5B80B] to-[#D4AF37] text-white shadow-lg shadow-[#E5B80B]/25"
                : "text-gray-300 hover:bg-[#E5B80B]/10 hover:text-white hover:shadow-lg"
            }`}
          >
            {/* Active indicator */}
            {activeTab === name && (
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-lg"></div>
            )}
            
            <div className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300 ${
              activeTab === name 
                ? "bg-white/20 shadow-lg" 
                : "bg-[#E5B80B]/10 group-hover:bg-[#E5B80B]/20"
            }`}>
              <i className={`fa-solid ${icon} text-lg ${
                activeTab === name ? "text-white" : "text-gray-400 group-hover:text-[#E5B80B]"
              } transition-colors duration-300`}></i>
            </div>
            
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <span className="font-semibold truncate" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  {name}
                </span>
                {activeTab === name && (
                  <div className="text-xs text-white/80 mt-0.5">
                    Active
                  </div>
                )}
              </div>
            )}
            
            {/* Hover effect */}
            {!isCollapsed && activeTab !== name && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <i className="fa-solid fa-chevron-right text-[#E5B80B] text-sm"></i>
              </div>
            )}
          </li>
        ))}

        {/* Logout Section */}
        <div className="mt-6 pt-6 border-t border-[#E5B80B]/20 mb-4">
          <li
            title={isCollapsed ? "Logout" : ""}
            onClick={() => {
              handleLogout();
              setShowMobileSidebar(false);
            }}
            className="group relative flex items-center gap-3 p-3 rounded-2xl text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer transition-all duration-300 text-sm sm:text-base transform hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-500/10 group-hover:bg-red-500/20 transition-all duration-300">
              <i className="fa-solid fa-right-from-bracket text-lg group-hover:text-red-300 transition-colors duration-300"></i>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <span className="font-semibold truncate" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  Logout
                </span>
                <div className="text-xs text-red-400/60 mt-0.5">
                  Sign out of system
                </div>
              </div>
            )}
            {!isCollapsed && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <i className="fa-solid fa-chevron-right text-red-400 text-sm"></i>
              </div>
            )}
          </li>
        </div>
        </ul>
        
        {/* Scroll fade indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#1A0F08] to-transparent pointer-events-none"></div>
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="relative p-2 border-t border-[#E5B80B]/20">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse"></div>
              <span className="text-[#E5B80B] text-xs font-medium" style={{fontFamily: 'Telegraf, sans-serif'}}>
                System Online
              </span>
            </div>
            <div className="text-gray-400 text-xs">
              <p>© 2024 MuseoSmart</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Custom Scrollbar Styles */}
      <style>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(229, 184, 11, 0.3);
          border-radius: 10px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(229, 184, 11, 0.5);
        }
        
        .slide-in-left {
          animation: slideInLeft 0.3s ease-out;
        }
        
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
      
      <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMobileSidebar(false)}
          ></div>
          <div className="relative z-50 w-64 h-full transform transition-transform duration-300 ease-in-out slide-in-left">
            <div className="relative h-full">
              {/* Mobile close button */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110"
                >
                  <i className="fa-solid fa-times text-sm"></i>
                </button>
              </div>
              {SidebarContent}
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex">{SidebarContent}</aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        isCollapsed ? "ml-0 md:ml-16 lg:ml-20" : "ml-0 md:ml-64"
      }`}>
        {/* Header */}
        <nav className="relative bg-gradient-to-r from-white to-gray-50 shadow-lg border-b border-[#E5B80B]/20 px-4 sm:px-6 md:px-8 py-4">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#E5B80B]/5 to-transparent"></div>
          
          <div className="relative flex items-center justify-between">
            {/* Mobile toggle */}
            <div className="flex items-center">
              <button
                className="md:hidden text-[#351E10] p-3 rounded-xl hover:bg-[#E5B80B]/10 transition-all duration-200 transform hover:scale-105 bg-white/50 shadow-lg border border-[#E5B80B]/20"
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              >
                <i className={`fa-solid ${showMobileSidebar ? 'fa-times' : 'fa-bars'} text-xl`}></i>
              </button>
            </div>
            
            {/* User info - Simple */}
            <div className="flex items-center gap-3">
              {/* Refresh button for staff users */}
              {user?.role === 'staff' && (
                <button
                  onClick={handleRefreshUser}
                  className="p-2 text-[#E5B80B] hover:bg-gray-100 rounded-lg transition-colors"
                  title="Refresh permissions"
                >
                  <i className="fa-solid fa-sync-alt text-lg"></i>
                </button>
              )}
              
              {/* Simple User Info */}
              <div className="flex items-center gap-3">
                {/* Profile Photo */}
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {user?.profile_photo ? (
                    <img 
                      src={`http://localhost:3000/uploads/profiles/${user.profile_photo}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center ${user?.profile_photo ? 'hidden' : ''}`}>
                    <i className="fa-solid fa-user text-gray-500 text-sm"></i>
                  </div>
                </div>
                
                {/* User Name */}
                <span className="font-medium text-[#351E10] text-sm">
                  {user ? `${user.firstname} ${user.lastname}` : "Admin User"}
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content area */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 bg-gray-50 overflow-auto">
          <div className="max-w-full">
                    {activeTab === "Dashboard" && <Dashboard userPermissions={userPermissions} setActiveTab={setActiveTab} />}
        {activeTab === "Schedule" && <Schedule userPermissions={userPermissions} />}
        {activeTab === "Visitors" && <Visitors userPermissions={userPermissions} />}
            {activeTab === "Scanner" && <VisitorScanner userPermissions={userPermissions} />}
            {activeTab === "Exhibit" && <Exhibit userPermissions={userPermissions} />}
            {activeTab === "Event" && <Event userPermissions={userPermissions} />}
            {activeTab === "CulturalObjects" && <CulturalObjects userPermissions={userPermissions} />}
            {activeTab === "Promotional" && <PromotionalManagement />}
            {activeTab === "Archive" && <Archive userPermissions={userPermissions} />}
            {activeTab === "Donation" && <Donation userPermissions={userPermissions} />}
            {activeTab === "Reports" && <Reports userPermissions={userPermissions} />}
            {activeTab === "Settings" && <Settings userPermissions={userPermissions} />}
            {activeTab === "AddUser" && <AddUser />}
          </div>
        </main>
      </div>
    </div>
    </>
  );
};

export default AdminDashboard;
