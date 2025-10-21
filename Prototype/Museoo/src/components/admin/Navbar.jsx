import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import logo from "../../assets/logo.png";

const Navbar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const links = [
    { to: "/admin/dashboard", label: "Dashboard", icon: "fa-house" },
    { to: "/admin/schedule", label: "Schedule", icon: "fa-calendar" },
    { to: "/admin/visitors", label: "Visitors", icon: "fa-person-walking" },
    { to: "/admin/exhibit", label: "Exhibit", icon: "fa-eye" },
    { to: "/admin/events", label: "Events", icon: "fa-calendar-week" },
    { to: "/admin/archive", label: "Digital Archive", icon: "fa-box-archive" },
    { to: "/admin/donation", label: "Donations", icon: "fa-hand-holding-dollar" },
    { to: "/admin/settings", label: "Settings", icon: "fa-gear" },
    { to: "/admin/add-user", label: "Add User", icon: "fa-user-plus" },
  ];

  return (
    <aside
      className={`bg-white text-[#2e2b41] min-h-screen transition-all duration-300 shadow-xl border-r border-gray-200 ${
        collapsed ? "w-16 sm:w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-50 p-3 sm:p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 sm:gap-3">
          <img
            src={logo}
            alt="Logo"
            className={`${collapsed ? "w-6 h-6 sm:w-8 sm:h-8" : "w-10 h-10 sm:w-12 sm:h-12"} transition-all duration-200`}
          />
          {!collapsed && (
            <div className="min-w-0">
              <span className="text-lg sm:text-xl font-bold text-[#AB8841] truncate block">MuseoSmart</span>
              <p className="text-xs text-gray-600 truncate">Admin Panel</p>
            </div>
          )}
        </div>
        <button
          className="text-[#2e2b41] hover:text-[#AB8841] transition-colors p-1 sm:p-2 rounded-lg hover:bg-gray-100"
          onClick={() => setCollapsed(!collapsed)}
          title="Toggle sidebar"
        >
          <i className="fa-solid fa-bars text-sm sm:text-lg"></i>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="px-2 mt-4 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
        {links.map((item, i) => (
          <div key={i} title={collapsed ? item.label : ""}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all duration-200 text-sm sm:text-base ${
                  isActive 
                    ? "bg-[#AB8841] text-white shadow-lg" 
                    : "text-[#2e2b41] hover:bg-gray-100 hover:text-[#AB8841]"
                }`
              }
            >
              <i className={`fa-solid ${item.icon} text-sm sm:text-lg flex-shrink-0`}></i>
              {!collapsed && <span className="font-medium truncate">{item.label}</span>}
            </NavLink>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-center text-gray-500 text-xs p-3 border-t border-gray-200">
            <p>© 2024 MuseoSmart</p>
            <p className="mt-1">City Museum of Cagayan de Oro</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Navbar;
