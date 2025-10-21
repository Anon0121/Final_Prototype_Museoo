import React, { useEffect, useState } from "react";
import api from "../../config/api";

const Visitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("newest"); // newest, oldest
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [visitorsPerPage] = useState(10);
  
  // Dropdown state for mobile view
  const [expandedVisitors, setExpandedVisitors] = useState(new Set());

  const fetchVisitors = async () => {
    try {
      // Add cache-busting parameter to force fresh data
      const timestamp = new Date().getTime();
      const response = await api.get(`/api/visitors/all?t=${timestamp}`);
      
      // Debug: Log the response data
      console.log('🔍 Frontend received visitors data:', response.data.visitors?.length || 0, 'visitors');
      
      // All visitors in the list have been checked in
      console.log('📅 Visitors who have visited:', response.data.visitors?.length || 0);
      
      // Log unique visit times
      const checkinTimes = response.data.visitors?.map(v => v.checkin_time) || [];
      const uniqueTimes = [...new Set(checkinTimes)];
      console.log('🕐 Unique visit times:', uniqueTimes.length);
      uniqueTimes.forEach((time, index) => {
        console.log(`   ${index + 1}. ${time}`);
      });
      
      setVisitors(response.data.visitors || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching visitors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
    
    // Set up real-time updates every 10 seconds
    const interval = setInterval(fetchVisitors, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not visited yet';
    
    // Handle different date formats
    let date;
    if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      return 'Not visited yet';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Not visited yet';
    }
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not visited yet';
    
    // Handle different date formats
    let date;
    if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      return 'Not visited yet';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Not visited yet';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filter visitors based on search and filters
  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = searchTerm === "" || 
      `${visitor.first_name} ${visitor.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              visitor.visitor_type_display?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || visitor.visitor_type_display === typeFilter;
    
    const matchesDate = dateFilter === "" || 
      (visitor.checkin_time && new Date(visitor.checkin_time).toISOString().split('T')[0] === dateFilter);
    
    return matchesSearch && matchesType && matchesDate;
  }).sort((a, b) => {
    // Sort by check-in time
    const timeA = a.checkin_time ? new Date(a.checkin_time).getTime() : 0;
    const timeB = b.checkin_time ? new Date(b.checkin_time).getTime() : 0;
    
    if (sortOrder === "newest") {
      return timeB - timeA; // Newest first
    } else {
      return timeA - timeB; // Oldest first
    }
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredVisitors.length / visitorsPerPage);
  const indexOfLastVisitor = currentPage * visitorsPerPage;
  const indexOfFirstVisitor = indexOfLastVisitor - visitorsPerPage;
  const currentVisitors = filteredVisitors.slice(indexOfFirstVisitor, indexOfLastVisitor);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, dateFilter, sortOrder]);

  // Toggle visitor details dropdown
  const toggleVisitorDetails = (visitorId) => {
    setExpandedVisitors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(visitorId)) {
        newSet.delete(visitorId);
      } else {
        newSet.add(visitorId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
          Loading visitor records...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 font-telegraf text-[#351E10]">
              <i className="fa-solid fa-users mr-2 sm:mr-3 text-[#E5B80B]"></i>
              Visitor Records
            </h1>
            <p className="text-gray-600 text-sm sm:text-base font-lora">Real-time visitor tracking and records</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm text-gray-500 font-telegraf">Total Visitors</p>
            <p className="text-xl sm:text-2xl font-bold text-[#351E10] font-telegraf">{visitors.length}</p>
            <p className="text-xs text-gray-400 mt-1 font-telegraf">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Status */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm font-semibold text-green-600 font-telegraf">Live Tracking Active</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 font-telegraf">
            Auto-refresh every 10 seconds
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-telegraf">Search</label>
            <input
              type="text"
              placeholder="Search by name, email, visitor type, purpose, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] focus:border-transparent font-telegraf"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" style={{fontFamily: 'Telegraf, sans-serif'}}>Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
              style={{fontFamily: 'Telegraf, sans-serif', focusRingColor: '#E5B80B'}}
            >
              <option value="all">All Types</option>
              <option value="Primary Visitor">Primary Visitor</option>
              <option value="Additional Visitor">Additional Visitor</option>
              <option value="Walk-in Visitor">Walk-in Visitor</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" style={{fontFamily: 'Telegraf, sans-serif'}}>Visit Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
              style={{fontFamily: 'Telegraf, sans-serif', focusRingColor: '#E5B80B'}}
            />
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" style={{fontFamily: 'Telegraf, sans-serif'}}>Sort By</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
              style={{fontFamily: 'Telegraf, sans-serif', focusRingColor: '#E5B80B'}}
            >
              <option value="newest">Newest Scanned First</option>
              <option value="oldest">Oldest Scanned First</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <div className="text-white px-4 py-2 rounded-lg font-medium" style={{backgroundColor: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
              {filteredVisitors.length} visitors
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200" style={{background: 'linear-gradient(to right, #351E10, #2A1A0D)'}}>
            <h3 className="text-lg sm:text-xl font-bold text-white" style={{fontFamily: 'Telegraf, sans-serif'}}>
              <i className="fa-solid fa-list mr-2"></i>
              All Visitors ({visitors.length})
            </h3>
          </div>
          <div className="p-4 sm:p-6">
            {currentVisitors.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="text-gray-500">
                  <i className="fa-solid fa-users text-3xl sm:text-4xl mb-4 text-gray-300"></i>
                  <p className="text-base sm:text-lg" style={{fontFamily: 'Telegraf, sans-serif'}}>No visitor records found</p>
                  <p className="text-sm" style={{fontFamily: 'Telegraf, sans-serif'}}>Try adjusting your search or filters</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {currentVisitors.map((visitor, index) => (
                  <div key={visitor.visitor_id || index} className="bg-gray-50 rounded-lg border border-gray-200">
                    {/* Main Card Header */}
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold truncate" style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}>
                            {visitor.first_name} {visitor.last_name}
                          </h4>
                          <p className="text-xs text-gray-600" style={{fontFamily: 'Telegraf, sans-serif'}}>{visitor.email}</p>
                        </div>
                        <div className="ml-2 flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800" style={{fontFamily: 'Telegraf, sans-serif'}}>
                            Visited
                          </span>
                          <button
                            onClick={() => toggleVisitorDetails(visitor.visitor_id || index)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              expandedVisitors.has(visitor.visitor_id || index)
                                ? 'text-white'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                            style={{
                              fontFamily: 'Telegraf, sans-serif',
                              backgroundColor: expandedVisitors.has(visitor.visitor_id || index) ? '#351E10' : 'transparent'
                            }}
                          >
                            <i className={`fa-solid ${expandedVisitors.has(visitor.visitor_id || index) ? 'fa-chevron-up' : 'fa-chevron-down'} mr-1`}></i>
                            {expandedVisitors.has(visitor.visitor_id || index) ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>
                      
                      {/* Basic Info - Always Visible */}
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>Visit Time:</span>
                          <span className="text-right" style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}>
                            {formatDateTime(visitor.checkin_time)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    {expandedVisitors.has(visitor.visitor_id || index) && (
                      <div className="px-3 pb-3 border-t border-gray-200 pt-3">
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>Gender:</span>
                            <span className="capitalize" style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}>{visitor.gender}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>Purpose:</span>
                            <span className="capitalize" style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}>{visitor.purpose}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>Type:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              visitor.visitor_type_display === 'Primary Visitor' 
                                ? 'bg-blue-100 text-blue-800' 
                                : visitor.visitor_type_display === 'Additional Visitor'
                                ? 'bg-purple-100 text-purple-800'
                                : visitor.visitor_type_display === 'Walk-in Visitor'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }`} style={{fontFamily: 'Telegraf, sans-serif'}}>
                              {visitor.visitor_type_display || 'Unknown'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>Booking:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              visitor.booking_type === 'individual' 
                                ? 'bg-blue-100 text-blue-800' 
                                : visitor.booking_type === 'group'
                                ? 'bg-purple-100 text-purple-800'
                                : visitor.booking_type === 'ind-walkin'
                                ? 'bg-orange-100 text-orange-800'
                                : visitor.booking_type === 'group-walkin'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`} style={{fontFamily: 'Telegraf, sans-serif'}}>
                              {visitor.booking_type || 'Unknown'}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-gray-200">
                            <span className="text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>Address:</span>
                            <span className="ml-1 block truncate" style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}>{visitor.address}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Mobile Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{fontFamily: 'Telegraf, sans-serif'}}
                >
                  <i className="fa-solid fa-chevron-left mr-1"></i>
                  Prev
                </button>
                
                <span className="text-xs text-gray-600" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{fontFamily: 'Telegraf, sans-serif'}}
                >
                  Next
                  <i className="fa-solid fa-chevron-right ml-1"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200" style={{background: 'linear-gradient(to right, #351E10, #2A1A0D)'}}>
            <h3 className="text-xl font-bold text-white" style={{fontFamily: 'Telegraf, sans-serif'}}>
              <i className="fa-solid fa-list mr-2"></i>
              All Visitors ({filteredVisitors.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#000000', fontFamily: 'Telegraf, sans-serif'}}>
                    Visitor Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#000000', fontFamily: 'Telegraf, sans-serif'}}>
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#000000', fontFamily: 'Telegraf, sans-serif'}}>
                    Booking Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#000000', fontFamily: 'Telegraf, sans-serif'}}>
                    Visit Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#000000', fontFamily: 'Telegraf, sans-serif'}}>
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentVisitors.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <i className="fa-solid fa-users text-4xl mb-4 text-gray-300"></i>
                        <p className="text-lg" style={{fontFamily: 'Telegraf, sans-serif'}}>No visitor records found</p>
                        <p className="text-sm" style={{fontFamily: 'Telegraf, sans-serif'}}>Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentVisitors.map((visitor, index) => (
                    <React.Fragment key={visitor.visitor_id || index}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold" style={{color: '#000000', fontFamily: 'Telegraf, sans-serif'}}>
                            {visitor.first_name} {visitor.last_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm" style={{color: '#000000', fontFamily: 'Telegraf, sans-serif'}}>
                            {visitor.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              visitor.booking_type === 'individual' 
                                ? 'bg-blue-100 text-blue-800' 
                                : visitor.booking_type === 'group'
                                ? 'bg-purple-100 text-purple-800'
                                : visitor.booking_type === 'ind-walkin'
                                ? 'bg-orange-100 text-orange-800'
                                : visitor.booking_type === 'group-walkin'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`} style={{fontFamily: 'Telegraf, sans-serif'}}>
                              {visitor.booking_type || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm" style={{color: '#000000', fontFamily: 'Telegraf, sans-serif'}}>
                            {formatDateTime(visitor.checkin_time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              const detailsRow = document.getElementById(`details-${visitor.visitor_id || index}`);
                              if (detailsRow) {
                                detailsRow.style.display = detailsRow.style.display === 'none' ? 'table-row' : 'none';
                              }
                            }}
                            className="text-sm px-3 py-1 rounded-lg border transition-all duration-200 hover:shadow-md"
                            style={{color: '#351E10', borderColor: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
                          >
                            <i className="fa-solid fa-chevron-down mr-1"></i>
                            Details
                          </button>
                        </td>
                      </tr>
                      {/* Expanded Details Row */}
                      <tr id={`details-${visitor.visitor_id || index}`} style={{display: 'none'}} className="bg-gray-50">
                        <td colSpan="5" className="px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div>
                              <span className="text-xs font-medium text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>Gender:</span>
                              <div className="text-sm capitalize" style={{color: '#000000', fontFamily: 'Telegraf, sans-serif'}}>
                                {visitor.gender}
                              </div>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>Visitor Type:</span>
                              <div className="text-sm capitalize" style={{color: '#000000', fontFamily: 'Telegraf, sans-serif'}}>
                                {visitor.visitor_type}
                              </div>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>Purpose:</span>
                              <div className="text-sm capitalize" style={{color: '#000000', fontFamily: 'Telegraf, sans-serif'}}>
                                {visitor.purpose}
                              </div>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>Type:</span>
                              <div className="text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  visitor.visitor_type_display === 'Primary Visitor' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : visitor.visitor_type_display === 'Additional Visitor'
                                    ? 'bg-purple-100 text-purple-800'
                                    : visitor.visitor_type_display === 'Walk-in Visitor'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`} style={{fontFamily: 'Telegraf, sans-serif'}}>
                                  {visitor.visitor_type_display || 'Unknown'}
                                </span>
                              </div>
                            </div>
                            <div className="md:col-span-2 lg:col-span-3">
                              <span className="text-xs font-medium text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>Address:</span>
                              <div className="text-sm" style={{color: '#000000', fontFamily: 'Telegraf, sans-serif'}}>
                                {visitor.address}
                              </div>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>Status:</span>
                              <div className="text-sm">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800" style={{fontFamily: 'Telegraf, sans-serif'}}>
                                  Visited
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Summary and Pagination */}
          {filteredVisitors.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  Showing <span className="font-medium" style={{color: '#E5B80B'}}>{indexOfFirstVisitor + 1}</span> to <span className="font-medium" style={{color: '#E5B80B'}}>{Math.min(indexOfLastVisitor, filteredVisitors.length)}</span> of <span className="font-medium" style={{color: '#351E10'}}>{filteredVisitors.length}</span> visitors
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{fontFamily: 'Telegraf, sans-serif'}}
                  >
                    <i className="fa-solid fa-chevron-left mr-1"></i>
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 text-sm rounded-lg ${
                          currentPage === page
                            ? 'text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                        style={{
                          fontFamily: 'Telegraf, sans-serif',
                          backgroundColor: currentPage === page ? '#E5B80B' : 'transparent'
                        }}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{fontFamily: 'Telegraf, sans-serif'}}
                  >
                    Next
                    <i className="fa-solid fa-chevron-right ml-1"></i>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Visitors;
