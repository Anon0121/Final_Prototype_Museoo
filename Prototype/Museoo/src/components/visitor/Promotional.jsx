import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';

const Promotional = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [promotionalItems, setPromotionalItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotionalItems();
  }, []);

  const fetchPromotionalItems = async () => {
    try {
      const response = await api.get('/api/promotional');
      console.log('Promotional API response:', response.data); // Debug log
      
      // Filter only active items and sort by order
      const activeItems = response.data
        .filter(item => item.isActive)
        .sort((a, b) => a.order - b.order);
      
      console.log('Active promotional items:', activeItems); // Debug log
      
      setPromotionalItems(activeItems);
    } catch (error) {
      console.error('Error fetching promotional items:', error);
      setPromotionalItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (promotionalItems.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % promotionalItems.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [promotionalItems.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % promotionalItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + promotionalItems.length) % promotionalItems.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Don't render the section if there are no promotional items
  if (!loading && promotionalItems.length === 0) {
    return null;
  }

  return (
    <section id="promotional" className="min-h-screen bg-gradient-to-br from-[#F5F1E8] via-[#F9F7F3] to-[#FDFCF9] py-20 px-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#8B6B21] rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-[#D4AF37] rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-[#E5B80B] rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Promotional Carousel */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6B21]"></div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-[#351E10] mb-2" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  Loading Highlights
                </h3>
                <p className="text-gray-600" style={{fontFamily: 'Lora, serif'}}>
                  Discovering amazing experiences...
                </p>
              </div>
            </div>
          </div>
        ) : promotionalItems.length > 0 ? (
          <div className="relative">
            {/* Main Carousel */}
            <div className="relative min-h-[500px] rounded-3xl overflow-hidden shadow-2xl group">
            {promotionalItems.map((item, index) => (
              <div
                key={item.id}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                  {/* Left Side - Image */}
                  <div 
                    className="bg-cover bg-center transition-transform duration-700 group-hover:scale-105 min-h-[300px] md:min-h-full"
                    style={{
                      backgroundImage: item.image 
                        ? `url(${api.defaults.baseURL}${item.image})`
                        : 'linear-gradient(135deg, rgba(53,30,16,0.8) 0%, rgba(139,107,33,0.6) 50%, rgba(212,175,55,0.4) 100%)'
                    }}
                  />
                  
                  {/* Right Side - Content with Museum Theme Background */}
                  <div className="bg-gradient-to-br from-[#351E10] via-[#8B6B21] to-[#D4AF37] p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col overflow-y-auto max-h-full">
                    <div className="space-y-2 sm:space-y-3 md:space-y-4">
                      {/* Badge */}
                      {item.badge && (
                        <div className="inline-block flex-shrink-0">
                          <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-semibold border border-white/30">
                            {item.badge}
                          </span>
                        </div>
                      )}
                      
                      {/* Title */}
                      <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight text-white flex-shrink-0" style={{fontFamily: 'Telegraf, sans-serif'}}>
                        {item.title}
                      </h3>
                      
                      {/* Subtitle */}
                      {item.subtitle && (
                        <p className="text-sm sm:text-base text-white/90 font-medium flex-shrink-0" style={{fontFamily: 'Lora, serif'}}>
                          {item.subtitle}
                        </p>
                      )}
                      
                      {/* Description - Scrollable area */}
                      {item.description && (
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                          <p className="text-xs sm:text-sm md:text-base text-white/80 leading-relaxed whitespace-pre-wrap break-words" style={{fontFamily: 'Lora, serif'}}>
                            {item.description}
                          </p>
                        </div>
                      )}
                      
                      {/* CTA Button - Only show if both ctaText and ctaLink are provided */}
                      {item.ctaText && item.ctaLink && (
                        <div className="pt-2 sm:pt-3 flex-shrink-0">
                          {item.ctaLink.startsWith('http://') || item.ctaLink.startsWith('https://') ? (
                            <a 
                              href={item.ctaLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-5 py-2.5 sm:px-6 sm:py-3 bg-white text-[#351E10] rounded-lg font-semibold text-sm sm:text-base hover:bg-white/90 transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                              {item.ctaText}
                              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                            </a>
                          ) : (
                            <Link 
                              to={item.ctaLink}
                              className="inline-flex items-center px-5 py-2.5 sm:px-6 sm:py-3 bg-white text-[#351E10] rounded-lg font-semibold text-sm sm:text-base hover:bg-white/90 transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                              {item.ctaText}
                              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modern Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-md text-[#351E10] p-3 sm:p-4 rounded-full hover:bg-white hover:scale-110 transition-all duration-300 shadow-xl border-2 border-[#8B6B21]/20 touch-manipulation z-10"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 sm:right-6 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-md text-[#351E10] p-3 sm:p-4 rounded-full hover:bg-white hover:scale-110 transition-all duration-300 shadow-xl border-2 border-[#8B6B21]/20 touch-manipulation z-10"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Modern Dots Indicator */}
          <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-3 md:space-x-4 z-10">
            {promotionalItems.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 touch-manipulation ${
                  index === currentSlide 
                    ? 'w-8 h-3 sm:w-10 sm:h-3 md:w-12 md:h-3 bg-white rounded-full shadow-lg' 
                    : 'w-3 h-3 sm:w-3 sm:h-3 md:w-3 md:h-3 bg-white/60 hover:bg-white/80 rounded-full hover:scale-125'
                }`}
              />
            ))}
          </div>
         </div>
       ) : null}

        {/* Additional Promotional Cards */}
        <div className="mt-8 sm:mt-12">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Digital Archive Card */}
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 border border-[#E5B80B]/10">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#8B6B21] to-[#D4AF37] rounded-lg flex items-center justify-center mb-3 sm:mb-4 shadow-sm">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#351E10] mb-2 sm:mb-3" style={{fontFamily: 'Telegraf, sans-serif'}}>
                Digital Archive Library
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 leading-tight" style={{fontFamily: 'Lora, serif'}}>
                Explore our extensive digital archive library featuring historical documents, photographs, and cultural artifacts from Cagayan de Oro's rich heritage.
              </p>
              <Link
                to="/archive"
                className="inline-flex items-center text-[#8B6B21] font-semibold hover:text-[#D4AF37] transition-colors group text-xs sm:text-sm"
                style={{fontFamily: 'Telegraf, sans-serif'}}
              >
                Explore Archive
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-1.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {/* Plan Your Visit Card */}
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 border border-[#E5B80B]/10">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#8B6B21] to-[#D4AF37] rounded-lg flex items-center justify-center mb-3 sm:mb-4 shadow-sm">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#351E10] mb-2 sm:mb-3" style={{fontFamily: 'Telegraf, sans-serif'}}>
                Plan Your Visit
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 leading-tight" style={{fontFamily: 'Lora, serif'}}>
                Schedule your visit to the museum and ensure you have the best experience with our guided tours and special programs.
              </p>
              <Link
                to="/schedule"
                className="inline-flex items-center text-[#8B6B21] font-semibold hover:text-[#D4AF37] transition-colors group text-xs sm:text-sm"
                style={{fontFamily: 'Telegraf, sans-serif'}}
              >
                Schedule Visit
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-1.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Promotional;
