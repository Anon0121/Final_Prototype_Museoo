import React from "react";
import { FaHouse, FaCalendar, FaUsers, FaEye, FaCalendarWeek, FaBoxArchive, FaHandHoldingDollar, FaGear, FaUserPlus, FaRightFromBracket, FaQrcode } from "react-icons/fa6";

const Sidebar = ({ isOpen, onNavigate, onLogout, activeTab }) => {
  const menuItems = [
    { name: "Dashboard", icon: <FaHouse />, key: "dashboard" },
    { name: "Schedule", icon: <FaCalendar />, key: "schedule" },
    { name: "Visitors", icon: <FaUsers />, key: "visitors" },
    { name: "Exhibit", icon: <FaEye />, key: "exhibit" },
    { name: "Events", icon: <FaCalendarWeek />, key: "events" },
    { name: "Event Scanner", icon: <FaQrcode />, key: "eventScanner" },
    { name: "Archive", icon: <FaBoxArchive />, key: "archive" },
    { name: "Donation", icon: <FaHandHoldingDollar />, key: "donation" },
    { name: "Settings", icon: <FaGear />, key: "settings" },
    { name: "Add User", icon: <FaUserPlus />, key: "addUser" },
  ];

  return (
    <aside className={`bg-white text-[#2e2b41] h-screen transition-all duration-300 shadow-xl border-r border-gray-200 ${isOpen ? "w-64" : "w-0 overflow-hidden"}`}>
      <div className="p-4 sm:p-6 h-full flex flex-col">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[#AB8841] mb-2 flex items-center">
            <i className="fa-solid fa-landmark mr-2 sm:mr-3 text-sm sm:text-base"></i>
            MuseoSmart
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm">Admin Dashboard</p>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1 sm:space-y-2 flex-1 overflow-y-auto">
          {menuItems.map(item => (
            <div
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 cursor-pointer rounded-lg transition-all duration-200 text-sm sm:text-base ${
                activeTab === item.key
                  ? "bg-[#AB8841] text-white shadow-lg"
                  : "text-[#2e2b41] hover:bg-gray-100 hover:text-[#AB8841]"
              }`}
            >
              <div className={`text-sm sm:text-lg flex-shrink-0 ${activeTab === item.key ? "text-white" : "text-[#AB8841]"}`}>
                {item.icon}
              </div>
              <span className="font-medium truncate">{item.name}</span>
            </div>
          ))}
        </nav>

        {/* Logout Section */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
          <div
            onClick={onLogout}
            className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 cursor-pointer rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 text-sm sm:text-base"
          >
            <FaRightFromBracket className="text-sm sm:text-lg flex-shrink-0" />
            <span className="font-medium truncate">Logout</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
          <div className="text-center text-gray-500 text-xs">
            <p>© 2024 MuseoSmart</p>
            <p className="mt-1">City Museum of Cagayan de Oro</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
