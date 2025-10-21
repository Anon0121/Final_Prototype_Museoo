
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/api";

const Dashboard = ({ userPermissions, setActiveTab }) => {
  const [stats, setStats] = useState({
    visitors: 0,
    schedules: 0,
    events: 0,
    exhibits: 0,
    culturalObjects: 0,
    donations: 0,
    archives: 0,
    todayVisitors: 0,
    todayBookings: 0,
    pendingDonations: 0,
    recentBookings: [],
    recentDonations: [],
    recentActivities: [],
    todayScheduleVisits: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/stats/summary");
      setStats(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-[#2e2b41]">
          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
          Loading dashboard stats...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 md:p-6 text-red-700">
        <i className="fa-solid fa-exclamation-triangle mr-2"></i>
        Error: {error}
      </div>
    );
  }

  const mainStatCards = [
    {
      title: "Total Visitors",
      value: stats.visitors,
      icon: "fa-users",
      color: "from-[#E5B80B] to-[#D4AF37]",
      bgColor: "bg-gradient-to-br from-white to-yellow-50",
      textColor: "text-[#351E10]",
      fontFamily: "font-telegraf"
    },
    {
      title: "Scheduled Tours",
      value: stats.schedules,
      icon: "fa-calendar-check",
      color: "from-[#351E10] to-[#2A1A0D]",
      bgColor: "bg-gradient-to-br from-white to-gray-50",
      textColor: "text-[#E5B80B]",
      fontFamily: "font-telegraf"
    },
    {
      title: "Total Events",
      value: stats.events,
      icon: "fa-calendar-week",
      color: "from-[#E5B80B] to-[#D4AF37]",
      bgColor: "bg-gradient-to-br from-white to-yellow-50",
      textColor: "text-[#351E10]",
      fontFamily: "font-telegraf"
    },
    {
      title: "Total Exhibits",
      value: stats.exhibits,
      icon: "fa-eye",
      color: "from-[#351E10] to-[#2A1A0D]",
      bgColor: "bg-gradient-to-br from-white to-gray-50",
      textColor: "text-[#E5B80B]",
      fontFamily: "font-telegraf"
    }
  ];

  const todayStatCards = [
    {
      title: "Today's Visitors",
      value: stats.todayVisitors,
      icon: "fa-user-plus",
      color: "from-[#351E10] to-[#2A1A0D]",
      bgColor: "bg-gradient-to-br from-white to-gray-50",
      textColor: "text-[#E5B80B]",
      fontFamily: "font-telegraf"
    },
    {
      title: "Today's Bookings",
      value: stats.todayBookings,
      icon: "fa-calendar-day",
      color: "from-[#E5B80B] to-[#D4AF37]",
      bgColor: "bg-gradient-to-br from-white to-yellow-50",
      textColor: "text-[#351E10]",
      fontFamily: "font-telegraf"
    },
    {
      title: "Today's Schedule",
      value: stats.todayScheduleVisits?.length || 0,
      icon: "fa-calendar-check",
      color: "from-[#351E10] to-[#2A1A0D]",
      bgColor: "bg-gradient-to-br from-white to-gray-50",
      textColor: "text-[#E5B80B]",
      fontFamily: "font-telegraf"
    },
    {
      title: "Cultural Objects",
      value: stats.culturalObjects,
      icon: "fa-landmark",
      color: "from-[#E5B80B] to-[#D4AF37]",
      bgColor: "bg-gradient-to-br from-white to-yellow-50",
      textColor: "text-[#351E10]",
      fontFamily: "font-telegraf"
    }
  ];

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 font-telegraf text-[#351E10]">
              <i className="fa-solid fa-chart-line mr-3 text-[#E5B80B]"></i>
              Admin Dashboard
            </h1>
            <p className="text-sm md:text-base font-lora text-[#351E10]">Real-time overview of museum activities and statistics</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm font-telegraf text-[#351E10]">Last updated</p>
            <p className="text-xs sm:text-sm font-semibold font-telegraf text-[#351E10]">
              {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {mainStatCards.map((card, index) => (
          <div key={index} className={`${card.bgColor} rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-shadow`}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="text-gray-600 font-semibold text-xs sm:text-sm uppercase tracking-wide truncate font-telegraf">
                  {card.title}
                </h2>
                <p className={`text-xl sm:text-2xl md:text-4xl font-bold mt-1 sm:mt-2 ${card.textColor} font-telegraf`}>
                  {card.value.toLocaleString()}
                </p>
              </div>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r ${card.color} flex items-center justify-center flex-shrink-0 ml-2 sm:ml-3`}>
                <i className={`fa-solid ${card.icon} text-white text-sm sm:text-lg md:text-xl`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

             {/* Today's Stats Cards */}
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
         {todayStatCards.map((card, index) => (
           <div key={index} className={`${card.bgColor} rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-shadow`}>
             <div className="flex items-center justify-between">
               <div className="min-w-0 flex-1">
                 <h2 className="text-gray-600 font-semibold text-xs sm:text-sm uppercase tracking-wide truncate font-telegraf">
                   {card.title}
                 </h2>
                 <p className={`text-xl sm:text-2xl md:text-4xl font-bold mt-1 sm:mt-2 ${card.textColor} font-telegraf`}>
                   {card.value.toLocaleString()}
                 </p>
               </div>
               <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r ${card.color} flex items-center justify-center flex-shrink-0 ml-2 sm:ml-3`}>
                 <i className={`fa-solid ${card.icon} text-white text-sm sm:text-lg md:text-xl`}></i>
               </div>
             </div>
           </div>
         ))}
       </div>

             {/* Recent Activity Section */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
         {/* Recent Bookings */}
         <div className="bg-white rounded-lg shadow-lg border border-gray-200">
           <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200">
             <div className="flex items-center justify-between">
               <h3 className="text-base sm:text-lg md:text-xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                 <i className="fa-solid fa-calendar-check mr-2 sm:mr-3" style={{color: '#E5B80B'}}></i>
                 Recent Bookings
               </h3>
               <button
                 onClick={() => setActiveTab("Schedule")}
                 className="text-xs sm:text-sm md:text-base font-medium transition-colors"
                 style={{color: '#E5B80B', fontFamily: 'Telegraph, sans-serif'}}
                 onMouseEnter={(e) => e.target.style.color = '#d4a509'}
                 onMouseLeave={(e) => e.target.style.color = '#E5B80B'}
               >
                 View All
               </button>
             </div>
           </div>
           <div className="p-3 sm:p-4 md:p-6">
             {stats.recentBookings && stats.recentBookings.length > 0 ? (
               <div className="space-y-2 sm:space-y-3 md:space-y-4">
               {stats.recentBookings.slice(0, 3).map((booking, index) => (
                 <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                   <div className="min-w-0 flex-1">
                     <p className="font-medium text-xs sm:text-sm md:text-base truncate" style={{color: '#351E10', fontFamily: 'Telegraph, sans-serif'}}>
                       {booking.first_name && booking.last_name 
                         ? `${booking.first_name} ${booking.last_name}`
                         : booking.visitor_name || 'Unknown Visitor'
                       }
                     </p>
                     <p className="text-xs text-gray-600" style={{fontFamily: 'Telegraph, sans-serif'}}>
                       {new Date(booking.date).toLocaleDateString()} at {booking.time_slot}
                     </p>
                     <p className="text-xs text-gray-500" style={{fontFamily: 'Telegraph, sans-serif'}}>
                       {booking.type === 'group' ? 'Group Visit' : 'Individual Visit'}
                       {booking.institution && booking.type === 'group' && ` • ${booking.institution}`}
                     </p>
                   </div>
                   <div className="flex flex-col items-end gap-1">
                     <span className={`px-3 py-1.5 rounded-lg font-semibold text-xs ${
                       booking.status === 'approved' 
                         ? 'bg-green-100 text-green-800 border border-green-200' 
                         : booking.status === 'pending'
                         ? 'bg-yellow-100 text-yellow-700'
                         : booking.status === 'checked-in'
                         ? 'bg-blue-100 text-blue-700'
                         : booking.status === 'cancelled'
                         ? 'bg-red-100 text-red-700'
                         : 'bg-gray-100 text-gray-700'
                     }`} style={{fontFamily: 'Telegraph, sans-serif'}}>
                       {booking.status === 'approved' ? 'APPROVED' : (booking.status || 'pending')}
                     </span>
                     <span className="text-xs text-gray-500" style={{fontFamily: 'Telegraph, sans-serif'}}>
                       {formatTimeAgo(booking.created_at)}
                     </span>
                   </div>
                 </div>
               ))}
               </div>
             ) : (
                              <div className="text-center py-4 sm:py-6 md:py-8">
                  <i className="fa-solid fa-calendar-times text-2xl sm:text-3xl md:text-4xl text-gray-300 mb-2 sm:mb-3 md:mb-4"></i>
                  <p className="text-gray-500 text-xs sm:text-sm md:text-base font-['Telegraph']">No recent bookings</p>
                </div>
             )}
           </div>
         </div>

                  {/* Today's Schedule Visits */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                                <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#2e2b41] font-['Lora']">
                   <i className="fa-solid fa-calendar-day mr-2 sm:mr-3 text-[#AB8841]"></i>
                   Today's Schedule
                 </h3>
                <button
                  onClick={() => setActiveTab("Schedule")}
                  className="text-[#AB8841] hover:text-[#8B6B21] text-xs sm:text-sm md:text-base font-medium transition-colors"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="p-3 sm:p-4 md:p-6">
              {stats.todayScheduleVisits && stats.todayScheduleVisits.length > 0 ? (
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  {stats.todayScheduleVisits.slice(0, 3).map((visit, index) => (
                    <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <div className="min-w-0 flex-1">
                                                <p className="font-medium text-xs sm:text-sm md:text-base text-[#2e2b41] truncate font-['Telegraph']">
                           {visit.first_name && visit.last_name 
                             ? `${visit.first_name} ${visit.last_name}`
                             : 'Unknown Visitor'
                           }
                         </p>
                         <p className="text-xs text-gray-600 font-['Telegraph']">
                           {visit.time_slot} • {visit.total_visitors} visitor{visit.total_visitors > 1 ? 's' : ''}
                           {visit.additional_visitors > 0 && ` (+${visit.additional_visitors} additional)`}
                         </p>
                         <p className="text-xs text-gray-500 font-['Telegraph']">
                           {visit.type === 'group' ? 'Group Visit' : 'Individual Visit'}
                           {visit.institution && visit.type === 'group' && ` • ${visit.institution}`}
                         </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                                                <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium font-['Telegraph'] ${
                           visit.status === 'approved' 
                             ? 'bg-green-100 text-green-700' 
                             : visit.status === 'pending'
                             ? 'bg-yellow-100 text-yellow-700'
                             : visit.status === 'checked-in'
                             ? 'bg-blue-100 text-blue-700'
                             : 'bg-gray-100 text-gray-700'
                         }`}>
                           {visit.status || 'pending'}
                         </span>
                         <span className="text-xs text-gray-500 font-['Telegraph']">
                           {visit.visitor_type || 'Individual'}
                         </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                                <div className="text-center py-4 sm:py-6 md:py-8">
                   <i className="fa-solid fa-calendar-day text-2xl sm:text-3xl md:text-4xl text-gray-300 mb-2 sm:mb-3 md:mb-4"></i>
                   <p className="text-gray-500 text-xs sm:text-sm md:text-base font-['Telegraph']">No scheduled visits today</p>
                 </div>
              )}
            </div>
          </div>
       </div>

      
    </div>
  );
};

export default Dashboard;
