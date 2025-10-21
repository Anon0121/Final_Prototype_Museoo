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
      
      // If no promotional items, use sample data for demonstration
      if (activeItems.length === 0) {
        const sampleItems = [
          {
            id: 1,
            title: "Cultural Heritage Exhibition",
            subtitle: "Discover the Rich History of Cagayan de Oro",
            description: "Explore our extensive collection of cultural artifacts, historical documents, and traditional artworks that showcase the vibrant heritage of Cagayan de Oro City.",
            badge: "Featured",
            ctaText: "Explore Now",
            image: null,
            isActive: true,
            order: 1
          },
          {
            id: 2,
            title: "Interactive Learning Center",
            subtitle: "Educational Programs for All Ages",
            description: "Join our interactive workshops, guided tours, and educational programs designed to bring history and culture to life for visitors of all ages.",
            badge: "New",
            ctaText: "Learn More",
            image: null,
            isActive: true,
            order: 2
          }
        ];
        setPromotionalItems(sampleItems);
      } else {
        setPromotionalItems(activeItems);
      }
    } catch (error) {
      console.error('Error fetching promotional items:', error);
      // Fallback to sample data if API fails
      const sampleItems = [
        {
          id: 1,
          title: "Cultural Heritage Exhibition",
          subtitle: "Discover the Rich History of Cagayan de Oro",
          description: "Explore our extensive collection of cultural artifacts, historical documents, and traditional artworks that showcase the vibrant heritage of Cagayan de Oro City.",
          badge: "Featured",
          ctaText: "Explore Now",
          image: null,
          isActive: true,
          order: 1
        }
      ];
      setPromotionalItems(sampleItems);
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

  return (
    <section id="promotional" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-20 px-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
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
            <div className="relative h-[250px] sm:h-[350px] md:h-[450px] lg:h-[550px] xl:h-[600px] rounded-3xl overflow-hidden shadow-2xl group">
            {promotionalItems.map((item, index) => (
              <div
                key={item.id}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
                }`}
              >
                {/* Background Image with Neutral Overlay */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage: item.image 
                      ? `linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.2) 100%), url(${api.defaults.baseURL}${item.image})`
                      : 'linear-gradient(135deg, rgba(53,30,16,0.8) 0%, rgba(139,107,33,0.6) 50%, rgba(212,175,55,0.4) 100%)'
                  }}
                />
                
                {/* Content Overlay - Text on Image */}
                <div className="absolute inset-0 flex items-center">
                  <div className="max-w-6xl mx-auto px-6 sm:px-8 md:px-10 lg:px-12 text-white w-full">
                    <div className="space-y-0.5 sm:space-y-1 md:space-y-2 lg:space-y-3 xl:space-y-4">
                      {/* Badge */}
                      <div className="inline-block">
                        <span className="px-3 py-1.5 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] text-white rounded-full text-xs font-semibold">
                          {item.badge}
                        </span>
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold leading-tight" style={{fontFamily: 'Telegraf, sans-serif'}}>
                        {item.title}
                      </h3>
                      
                      {/* Subtitle */}
                      <p className="text-xs sm:text-sm md:text-sm lg:text-base text-gray-200 font-medium" style={{fontFamily: 'Lora, serif'}}>
                        {item.subtitle}
                      </p>
                      
                      {/* Description */}
                      <p className="text-xs sm:text-sm md:text-sm lg:text-base text-gray-300 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl leading-tight sm:leading-relaxed" style={{fontFamily: 'Lora, serif'}}>
                        {item.description}
                      </p>
                      
                      {/* CTA Button */}
                      {item.ctaText && (
                        <div className="pt-0.5 sm:pt-1 md:pt-2">
                          <span className="inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 lg:px-6 lg:py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm md:text-sm border border-white/30">
                            {item.ctaText}
                          </span>
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
            className="absolute left-2 sm:left-3 md:left-6 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-md text-white p-2 sm:p-2.5 md:p-4 rounded-full hover:bg-white/30 hover:scale-110 transition-all duration-300 shadow-xl border border-white/20 touch-manipulation z-10"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-3 md:right-6 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-md text-white p-2 sm:p-2.5 md:p-4 rounded-full hover:bg-white/30 hover:scale-110 transition-all duration-300 shadow-xl border border-white/20 touch-manipulation z-10"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Modern Dots Indicator */}
          <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 lg:bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-3 md:space-x-4">
            {promotionalItems.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 touch-manipulation ${
                  index === currentSlide 
                    ? 'w-5 h-1.5 sm:w-6 sm:h-2 md:w-8 md:h-3 bg-white rounded-full shadow-lg' 
                    : 'w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-white/50 hover:bg-white/75 rounded-full hover:scale-125'
                }`}
              />
            ))}
          </div>
         </div>
       ) : (
         <div className="text-center py-16">
           <div className="w-24 h-24 bg-gradient-to-br from-[#8B6B21]/10 to-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6">
             <svg className="w-12 h-12 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
             </svg>
           </div>
           <h3 className="text-xl font-semibold text-[#351E10] mb-2" style={{fontFamily: 'Telegraf, sans-serif'}}>
             No Highlights Available
           </h3>
           <p className="text-gray-600" style={{fontFamily: 'Lora, serif'}}>
             Check back soon for exciting highlights and special exhibitions.
           </p>
         </div>
       )}

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
