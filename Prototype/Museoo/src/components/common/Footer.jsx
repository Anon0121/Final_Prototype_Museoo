import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Museum Info */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="Logo" className="w-10 h-10" />
              <div>
                <h3 className="text-lg font-bold">City Museum of Cagayan de Oro</h3>
                <p className="text-xs text-gray-300">Heritage Studies Center</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-tight">
              Preserving and showcasing the rich cultural heritage of Cagayan de Oro through 
              carefully curated exhibits and educational programs.
            </p>
            <div className="flex space-x-3">
              <a 
                href="#" 
                className="w-8 h-8 bg-[#8B6B21] hover:bg-[#D4AF37] rounded-lg flex items-center justify-center transition-colors duration-300"
                title="Facebook"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="w-8 h-8 bg-[#8B6B21] hover:bg-[#D4AF37] rounded-lg flex items-center justify-center transition-colors duration-300"
                title="Email"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
              <a 
                href="#" 
                className="w-8 h-8 bg-[#8B6B21] hover:bg-[#D4AF37] rounded-lg flex items-center justify-center transition-colors duration-300"
                title="Phone"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 lg:col-span-1">
            <h4 className="text-base font-semibold border-b border-gray-600 pb-1">Quick Links</h4>
            <ul className="space-y-1.5">
              <li>
                <a 
                  href="#about" 
                  className="text-gray-300 hover:text-[#8B6B21] transition-colors duration-300 flex items-center"
                >
                  <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  About Us
                </a>
              </li>
              <li>
                <a 
                  href="#exhibit" 
                  className="text-gray-300 hover:text-[#8B6B21] transition-colors duration-300 flex items-center"
                >
                  <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Exhibits
                </a>
              </li>
              <li>
                <a 
                  href="#event" 
                  className="text-gray-300 hover:text-[#8B6B21] transition-colors duration-300 flex items-center"
                >
                  <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Events
                </a>
              </li>
              <li>
                <Link 
                  to="/schedule" 
                  className="text-gray-300 hover:text-[#8B6B21] transition-colors duration-300 flex items-center"
                >
                  <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Schedule Visit
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 lg:col-span-1">
            <h4 className="text-base font-semibold border-b border-gray-600 pb-1">Contact Info</h4>
            <div className="space-y-2">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-[#8B6B21] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-300 text-xs">Gaston Park, Cagayan de Oro City</p>
                  <p className="text-gray-400 text-xs">Misamis Oriental, Philippines</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-[#8B6B21] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-300 text-xs">+63 88 123 4567</p>
                  <p className="text-gray-400 text-xs">Mon-Fri: 8:00 AM - 5:00 PM</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-[#8B6B21] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-300 text-xs">info@cdocitymuseum.gov.ph</p>
                  <p className="text-gray-400 text-xs">We'll respond within 24 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-6 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <p className="text-gray-300 text-xs text-center sm:text-left">
                © 2025 City Museum of Cagayan de Oro. All rights reserved.
              </p>
              <span className="hidden sm:block text-gray-500">|</span>
              <p className="text-gray-300 text-xs text-center sm:text-left">
                Built with ❤️ for our community
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="flex items-center space-x-2 text-gray-300 hover:text-[#8B6B21] transition-colors duration-300 group"
                title="Staff Login"
              >
                <div className="w-6 h-6 bg-gray-700 group-hover:bg-[#8B6B21] rounded-lg flex items-center justify-center transition-colors duration-300">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-xs font-medium">Staff Login</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
