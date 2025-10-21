import React, { useState, useEffect } from 'react';
import api from '../../config/api';

// Add custom animations
const styles = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out forwards;
  }
  
  .animate-fade-in {
    animation: fade-in 0.3s ease-out forwards;
  }
  
  .animate-scale-in {
    animation: scale-in 0.3s ease-out forwards;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

const Exhibits = ({ onModalStateChange }) => {
  const [exhibits, setExhibits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExhibit, setSelectedExhibit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);


  useEffect(() => {
    fetchExhibits();
  }, []);

  // Notify parent component when modal state changes
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(isModalOpen);
    }
  }, [isModalOpen, onModalStateChange]);

  // Keyboard navigation for carousel
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isModalOpen || !selectedExhibit) return;
      
      if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'Escape') {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isModalOpen, selectedExhibit]);


  const fetchExhibits = async () => {
    try {
      const response = await api.get('/api/activities/exhibits');
      // Map the data to handle both single image and multiple images
      const mappedExhibits = response.data.map(exhibit => ({
        ...exhibit,
        image: exhibit.images && exhibit.images.length > 0 ? exhibit.images[0] : exhibit.image,
        allImages: exhibit.images && exhibit.images.length > 0 ? exhibit.images : (exhibit.image ? [exhibit.image] : [])
      }));
      setExhibits(mappedExhibits);
    } catch (error) {
      console.error('Error fetching exhibits:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Helper function to determine exhibit status
  const getExhibitStatus = (exhibit) => {
    const now = new Date();
    const startDate = new Date(exhibit.start_date);
    const endDate = exhibit.end_date ? new Date(exhibit.end_date) : null;
    
    if (startDate > now) {
      return { status: 'upcoming', label: 'Coming Soon', color: 'blue' };
    } else if (startDate <= now && (!endDate || endDate >= now)) {
      return { status: 'ongoing', label: 'Now Showing', color: 'emerald' };
    } else {
      return { status: 'ended', label: 'Ended', color: 'gray' };
    }
  };

  // Filter out ended exhibits and sort by start date
  const activeExhibits = exhibits
    .filter(exhibit => {
      const status = getExhibitStatus(exhibit);
      return status.status !== 'ended';
    })
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  // Carousel navigation functions
  const nextImage = () => {
    if (selectedExhibit && selectedExhibit.allImages) {
      setCurrentImageIndex((prev) => 
        prev === selectedExhibit.allImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (selectedExhibit && selectedExhibit.allImages) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedExhibit.allImages.length - 1 : prev - 1
      );
    }
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  // Reset carousel when modal opens
  const openModal = (exhibit) => {
    if (isModalOpen) return; // Prevent opening if modal is already open
    setSelectedExhibit(exhibit);
    setCurrentImageIndex(0);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedExhibit(null);
    onModalStateChange(false);
    
    // Scroll to the Exhibits section after closing modal
    setTimeout(() => {
      const exhibitsSection = document.getElementById('exhibit');
      if (exhibitsSection) {
        exhibitsSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  const ExhibitCard = ({ exhibit }) => {
    const exhibitStatus = getExhibitStatus(exhibit);
    
    return (
      <div 
        className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl border border-gray-100/50 cursor-pointer overflow-hidden transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] backdrop-blur-sm"
        onClick={() => openModal(exhibit)}
      >
        {/* Bigger and Wider Image Section */}
        <div className="relative h-80 overflow-hidden">
        {exhibit.image ? (
          <img
            src={`${api.defaults.baseURL}${exhibit.image}`}
            alt={exhibit.title}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
          <div className="w-full h-full bg-gradient-to-br from-slate-100 via-gray-50 to-slate-200 flex items-center justify-center" style={{ display: exhibit.image ? 'none' : 'flex' }}>
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#8B6B21]/20 to-[#D4AF37]/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
              <p className="text-base text-gray-500 font-medium">Exhibit Image</p>
            </div>
          </div>
          
          {/* Dynamic Status Badge */}
        <div className="absolute top-4 left-4 z-10">
            <span className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide shadow-lg backdrop-blur-sm ${
              exhibitStatus.color === 'blue'
                ? 'bg-[#E5B80B] text-[#351E10]'
                : exhibitStatus.color === 'emerald'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-gray-100 text-gray-800'
            }`} style={{fontFamily: 'Telegraf, sans-serif'}}>
              {exhibitStatus.label}
          </span>
        </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center justify-between text-white">
                <span className="text-sm font-medium">View Details</span>
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </div>
      </div>
      
      {/* Simplified Content Section - Only Title, Dates, Location */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-[#351E10] mb-4 line-clamp-2 group-hover:text-[#8B6B21] transition-colors duration-300 leading-tight" style={{fontFamily: 'Telegraf, sans-serif'}}>
          {exhibit.title}
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center text-gray-600">
            <div className="w-8 h-8 bg-[#8B6B21]/10 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            </div>
            <span className="font-semibold text-sm" style={{fontFamily: 'Lora, serif'}}>{formatDate(exhibit.start_date)}</span>
          </div>
          
          {exhibit.end_date && (
            <div className="flex items-center text-gray-600">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              </div>
              <span className="text-sm" style={{fontFamily: 'Lora, serif'}}>Until {formatDate(exhibit.end_date)}</span>
            </div>
          )}
          
          {exhibit.location && (
            <div className="flex items-center text-gray-600">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              </div>
              <span className="text-sm line-clamp-1" style={{fontFamily: 'Lora, serif'}}>{exhibit.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  };

  const EmptyState = () => (
    <div className="text-center py-20">
      <div className="w-32 h-32 bg-gradient-to-br from-[#8B6B21]/10 to-[#D4AF37]/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
        <svg className="w-16 h-16 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-[#351E10] mb-4" style={{fontFamily: 'Telegraf, sans-serif'}}>
        No Exhibits Available
      </h3>
      <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed" style={{fontFamily: 'Lora, serif'}}>
        We're currently preparing exciting new exhibits. Check back soon for amazing collections and cultural experiences!
      </p>
    </div>
  );

  return (
    <section id="exhibit" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-20 px-4 relative overflow-hidden z-10">
      {/* Background Pattern - Hidden when modal is open */}
      {!isModalOpen && (
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#8B6B21] rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-[#D4AF37] rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Enhanced Header with Museum Branding - Hidden when modal is open */}
        {!isModalOpen && (
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#8B6B21] to-[#D4AF37] rounded-lg flex items-center justify-center shadow-lg mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#351E10] to-[#8B6B21] bg-clip-text text-transparent" style={{fontFamily: 'Telegraf, sans-serif'}}>
                Exhibits
              </h2>
            </div>

            <div className="w-20 h-1 mx-auto rounded-full mb-4 bg-gradient-to-r from-[#E5B80B] to-[#351E10]"></div>

            <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed text-gray-700" style={{fontFamily: 'Lora, serif'}}>
              Discover our carefully curated collection of exhibits that showcase the rich cultural heritage, artistic traditions, and historical narratives of Cagayan de Oro.
            </p>
          </div>
        )}

        {/* Modern Exhibits Grid - Hidden when modal is open */}
        {!isModalOpen && (
          <div className="space-y-12">
          {loading ? (
              <div className="text-center py-20">
                <div className="inline-flex flex-col items-center space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-spin border-t-[#8B6B21]"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-[#D4AF37] opacity-20"></div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-[#351E10] mb-2" style={{fontFamily: 'Telegraf, sans-serif'}}>Loading Exhibits</h3>
                    <p className="text-gray-500" style={{fontFamily: 'Lora, serif'}}>Discovering amazing collections...</p>
                  </div>
                </div>
              </div>
            ) : activeExhibits.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-10">
                {activeExhibits.map((exhibit, index) => (
                  <div 
                    key={exhibit.id} 
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <ExhibitCard exhibit={exhibit} />
            </div>
                  ))}
                </div>
            ) : (
              <EmptyState />
            )}
                </div>
              )}
              
        {/* Smaller Cultural Objects Style Modal */}
        {selectedExhibit && isModalOpen && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-[99999] p-2 sm:p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeModal();
              }
            }}
          >
            {/* Blurred Background */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('/src/assets/citymus.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'blur(8px)',
                transform: 'scale(1.1)'
              }}
            ></div>
            
            {/* Content overlay */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
            
            {/* Modal Content - Sharp and Clear */}
            <div 
              className="relative z-10 bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden mx-2 sm:mx-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                {/* Beautiful Header with Museum Branding - Mobile Optimized */}
                <div className="p-3 sm:p-4 border-b border-[#E5B80B]/20 bg-gradient-to-r from-[#351E10] to-[#2A1A0D]">
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 break-words leading-tight text-white" style={{fontFamily: 'Telegraf, sans-serif'}}>
                        {selectedExhibit.title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold shadow-sm" style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                          {selectedExhibit.category || 'Exhibit'}
                        </span>
                        <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                          getExhibitStatus(selectedExhibit).color === 'blue' ? 'bg-[#E5B80B] text-[#351E10]' : 'bg-emerald-100 text-emerald-800'
                        }`} style={{fontFamily: 'Telegraf, sans-serif'}}>
                          {getExhibitStatus(selectedExhibit).label}
                      </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                    <button
                          onClick={closeModal}
                          className="p-2 sm:p-2.5 rounded-full hover:bg-white/20 transition-all duration-200 hover:scale-105 shadow-sm"
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-100px)]">
                  <div className="p-2 sm:p-3 md:p-4">
                    {/* Main Content - New Layout */}
                    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 mb-4 sm:mb-6">
                      {/* Image Section - Mobile Optimized */}
                      <div className="bg-gradient-to-br from-[#f8f9fa] to-[#f1f3f4] rounded-lg sm:rounded-xl p-2 sm:p-4 border border-[#E5B80B]/10">
                        <div className="flex justify-center">
                          {selectedExhibit.allImages && selectedExhibit.allImages.length > 0 ? (
                            <div className="group relative overflow-hidden rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 max-w-full sm:max-w-3xl w-full">
                              <img 
                                src={`${api.defaults.baseURL}${selectedExhibit.allImages[currentImageIndex]}?t=${Date.now()}`} 
                                alt={`${selectedExhibit.title} - Image ${currentImageIndex + 1}`}
                                className="w-full h-64 sm:h-80 md:h-96 lg:h-[28rem] object-cover transition-all duration-500 ease-in-out"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="w-full h-64 sm:h-80 md:h-96 lg:h-[28rem] bg-gray-200 flex items-center justify-center" style={{ display: 'none' }}>
                                <div className="text-center">
                                  <i className="fa-solid fa-image text-4xl text-gray-400 mb-2"></i>
                                  <p className="text-gray-500">Image not available</p>
                                </div>
                              </div>

                              {/* Navigation Arrows - Only show if multiple images */}
                              {selectedExhibit.allImages.length > 1 && (
                                <>
                                  <button
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
                                  >
                                    <i className="fa-solid fa-chevron-left"></i>
                                  </button>
                                  <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
                                  >
                                    <i className="fa-solid fa-chevron-right"></i>
                                  </button>
                                </>
                              )}

                              {/* Image Counter */}
                              {selectedExhibit.allImages.length > 1 && (
                                <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                                  {currentImageIndex + 1} / {selectedExhibit.allImages.length}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-full max-w-full sm:max-w-3xl h-64 sm:h-80 md:h-96 lg:h-[28rem] bg-gray-200 rounded-lg sm:rounded-xl flex items-center justify-center">
                              <div className="text-center">
                                <i className="fa-solid fa-image text-4xl text-gray-400 mb-2"></i>
                                <p className="text-gray-500">No images available</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Thumbnail Navigation - Only show if multiple images */}
                        {selectedExhibit.allImages && selectedExhibit.allImages.length > 1 && (
                          <div className="flex justify-center space-x-2 sm:space-x-3 mt-3 sm:mt-4 overflow-x-auto pb-2">
                            {selectedExhibit.allImages.map((image, index) => (
                              <button
                                key={index}
                                onClick={() => goToImage(index)}
                                className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                  index === currentImageIndex
                                    ? 'border-[#AB8841] shadow-lg scale-105'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <img
                                  src={`${api.defaults.baseURL}${image}`}
                                  alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center" style={{ display: 'none' }}>
                                  <i className="fa-solid fa-image text-gray-400 text-xs"></i>
                        </div>
                              </button>
                            ))}
                    </div>
                  )}
                      </div>
                      
                      {/* Basic Information Section */}
                      <div className="bg-gradient-to-br from-[#f8f9fa] to-[#f1f3f4] rounded-lg sm:rounded-xl p-3 sm:p-4 border border-[#E5B80B]/10">
                        <h4 className="text-base sm:text-lg font-bold text-black mb-3 sm:mb-4 flex items-center justify-center" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-info-circle mr-2 sm:mr-3 text-[#AB8841]"></i>
                          Basic Information
                        </h4>
                        <div className="max-w-2xl mx-auto space-y-4">
                          <div className="py-3 border-b border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                              <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide" style={{fontFamily: 'Telegraf, sans-serif'}}>Exhibit Date</span>
                              <span className="text-gray-900 font-medium text-sm sm:text-base leading-relaxed sm:col-span-2" style={{fontFamily: 'Telegraf, sans-serif'}}>
                                {formatDate(selectedExhibit.start_date)}
                                {selectedExhibit.end_date && ` - ${formatDate(selectedExhibit.end_date)}`}
                              </span>
                            </div>
                          </div>
                          {selectedExhibit.location && (
                            <div className="py-3 border-b border-gray-200">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                                <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide" style={{fontFamily: 'Telegraf, sans-serif'}}>Location</span>
                                <span className="text-gray-900 font-medium text-sm sm:text-base leading-relaxed sm:col-span-2" style={{fontFamily: 'Telegraf, sans-serif'}}>{selectedExhibit.location}</span>
                              </div>
                            </div>
                          )}
                          {selectedExhibit.curator && (
                            <div className="py-3">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                                <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide" style={{fontFamily: 'Telegraf, sans-serif'}}>Curator</span>
                                <span className="text-gray-900 font-medium text-sm sm:text-base leading-relaxed sm:col-span-2" style={{fontFamily: 'Telegraf, sans-serif'}}>{selectedExhibit.curator}</span>
                              </div>
                        </div>
                      )}
                    </div>
                      </div>

                      {/* Description Section */}
                      <div className="bg-gradient-to-br from-[#f8f9fa] to-[#f1f3f4] rounded-lg sm:rounded-xl p-3 sm:p-4 border border-[#E5B80B]/10">
                        <h4 className="text-base sm:text-lg font-bold text-black mb-3 sm:mb-4 flex items-center justify-center" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-align-left mr-2 sm:mr-3 text-[#AB8841]"></i>
                          Description
                        </h4>
                        <div className="max-w-4xl mx-auto">
                          <p className="text-black leading-relaxed text-sm sm:text-base text-justify sm:text-center px-2 sm:px-0">{selectedExhibit.description || 'No description available'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}


      </div>
    </section>
  );
};

export default Exhibits;
