import React from 'react';
import oldMuseumImage from '../../assets/oldmuseo.png';

const About = () => {
  return (
    <section id="about" className="min-h-screen bg-gradient-to-br from-gray-50 to-[#8B6B21]/5 py-12 sm:py-16 md:py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#351E10] to-[#8B6B21] bg-clip-text text-transparent mb-4 sm:mb-6" style={{fontFamily: 'Telegraf, sans-serif'}}>
            About Our Museum
          </h2>
          <div className="w-20 sm:w-24 md:w-28 lg:w-32 h-1 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] mx-auto rounded-full mb-6 sm:mb-8"></div>
          <div className="max-w-4xl mx-auto leading-tight px-2">
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              Discover the rich history and cultural heritage of Cagayan de Oro through our carefully curated exhibits, from the historic water reservoir built in 1922 to today's modern museum, and experience the journey of our city's evolution.
            </p>
          </div>
        </div>

        {/* Vision & Mission Section - Side by Side Layout */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-12">
          {/* Vision Card */}
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
            <div className="flex items-center mb-2 sm:mb-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-[#8B6B21] to-[#D4AF37] rounded-lg flex items-center justify-center mr-2 flex-shrink-0">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-800">Our Vision</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-tight">
              To be the premier cultural institution in Northern Mindanao, preserving and showcasing the rich heritage of Cagayan de Oro while inspiring future generations through education and cultural appreciation.
            </p>
          </div>

          {/* Mission Card */}
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
            <div className="flex items-center mb-2 sm:mb-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-[#8B6B21] to-[#D4AF37] rounded-lg flex items-center justify-center mr-2 flex-shrink-0">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-800">Our Mission</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-tight">
              To collect, preserve, and exhibit historical artifacts and cultural materials that tell the story of Cagayan de Oro, fostering community engagement and promoting cultural understanding.
            </p>
          </div>
        </div>

                 {/* History & Image Section - Responsive Grid Layout */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-stretch">
          {/* History Text */}
                     <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-100 order-2 lg:order-1 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#8B6B21] to-[#D4AF37] rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">Our History</h3>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">
                The City Museum of Cagayan de Oro, originally built as a water reservoir in 1922, stands as the oldest public structure in the city. Located beside the historic Gaston Park, this architectural gem was transformed into a museum in 2008 to preserve and showcase the city's rich cultural and historical heritage.
              </p>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">
                Today, our museum features carefully curated photographs, artifacts, and exhibits that reflect the diverse history and unique identity of Cagayan de Oro, serving as a bridge between the past and present for visitors of all ages.
              </p>
            </div>
          </div>

                     {/* Museum Image */}
           <div className="relative group order-1 lg:order-2 h-full">
             <div className="absolute inset-0 bg-gradient-to-r from-[#8B6B21]/20 to-[#D4AF37]/20 rounded-xl sm:rounded-2xl transform group-hover:scale-105 transition-transform duration-300"></div>
                           <img
                src={oldMuseumImage}
                alt="City Museum of Cagayan de Oro"
                className="w-full h-full object-cover rounded-xl sm:rounded-2xl shadow-2xl transform group-hover:scale-105 transition-transform duration-300"
                style={{ objectPosition: 'center -70%' }}
              />
            <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 bg-black/70 text-white p-2 sm:p-3 rounded-lg backdrop-blur-sm">
              <p className="text-xs font-medium">Historic Water Reservoir (1922)</p>
              <p className="text-xs opacity-90">Transformed into Museum in 2008</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
