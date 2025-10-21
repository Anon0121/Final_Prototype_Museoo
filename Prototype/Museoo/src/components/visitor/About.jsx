import React from 'react';
import oldMuseumImage from '../../assets/oldmuseo.png';

const About = () => {
  return (
    <section id="about" className="min-h-screen bg-gradient-to-br from-gray-50 to-[#8B6B21]/5 py-12 sm:py-16 md:py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 sm:mb-6">
            About Our Museum
          </h2>
          <div className="w-16 sm:w-20 md:w-24 h-1 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] mx-auto rounded-full mb-6 sm:mb-8"></div>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-2">
            Discover the rich history and cultural heritage of Cagayan de Oro through our carefully curated exhibits. 
            From the historic water reservoir built in 1922 to today's modern museum, experience the journey of our city's evolution.
          </p>
        </div>

        {/* Vision & Mission Section - Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mb-16 sm:mb-20">
          {/* Vision Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#8B6B21] to-[#D4AF37] rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Our Vision</h3>
            </div>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
              To be the premier cultural institution in Northern Mindanao, preserving and showcasing the rich heritage of Cagayan de Oro while inspiring future generations through education and cultural appreciation.
            </p>
          </div>

          {/* Mission Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#8B6B21] to-[#D4AF37] rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Our Mission</h3>
            </div>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
              To collect, preserve, and exhibit historical artifacts and cultural materials that tell the story of Cagayan de Oro, fostering community engagement and promoting cultural understanding.
            </p>
          </div>
        </div>

                 {/* History & Image Section - Responsive Grid Layout */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-stretch">
          {/* History Text */}
                     <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 order-2 lg:order-1 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#8B6B21] to-[#D4AF37] rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Our History</h3>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
                The City Museum of Cagayan de Oro, originally built as a water reservoir in 1922, stands as the oldest public structure in the city. Located beside the historic Gaston Park, this architectural gem was transformed into a museum in 2008 to preserve and showcase the city's rich cultural and historical heritage.
              </p>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
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
            <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 bg-black/70 text-white p-3 sm:p-4 rounded-lg sm:rounded-xl backdrop-blur-sm">
              <p className="text-xs sm:text-sm font-medium">Historic Water Reservoir (1922)</p>
              <p className="text-xs opacity-90">Transformed into Museum in 2008</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
