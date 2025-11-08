import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import citymus from "../../assets/citymus.jpg";
import logo from "../../assets/logo.png";
import SearchBar from "./SearchBar";

const Header = ({ isModalOpen = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 200);
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when clicking outside or when modal opens
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.mobile-menu')) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Close mobile menu when modal opens
  useEffect(() => {
    if (isModalOpen && isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [isModalOpen, isMenuOpen]);

  return (
    <section
      id="home"
      className="relative w-full min-h-screen bg-cover bg-center text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(4,9,30,0.7), rgba(4,9,30,0.7)), url(${citymus})`,
      }}
    >
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isModalOpen 
          ? 'hidden' 
          : isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-lg' 
            : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            {/* Logo */}
            <Link to="/login" className="flex items-center space-x-2 sm:space-x-3">
              <img src={logo} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16" />
              <div className="hidden sm:block">
                <h1 className={`text-sm sm:text-lg font-bold transition-colors duration-300 ${
                  isModalOpen ? 'text-white drop-shadow-lg' : isScrolled ? 'text-gray-800' : 'text-white'
                }`}>
                  City Museum of Cagayan de Oro
                </h1>
                <p className={`text-xs transition-colors duration-300 ${
                  isModalOpen ? 'text-white/90 drop-shadow-lg' : isScrolled ? 'text-gray-600' : 'text-gray-300'
                }`}>
                  Heritage Studies Center
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              <a 
                href="#home" 
                className={`nav-link font-semibold transition-all duration-300 hover:text-[#8B6B21] ${
                  isModalOpen 
                    ? 'text-white drop-shadow-lg hover:text-[#8B6B21]' 
                    : isScrolled 
                      ? 'text-gray-700 hover:text-[#8B6B21]' 
                      : 'text-white hover:text-[#8B6B21]'
                }`}
              >
                HOME
              </a>
              <a 
                href="#about" 
                className={`nav-link font-semibold transition-all duration-300 hover:text-[#8B6B21] ${
                  isModalOpen 
                    ? 'text-white drop-shadow-lg hover:text-[#8B6B21]' 
                    : isScrolled 
                      ? 'text-gray-700 hover:text-[#8B6B21]' 
                      : 'text-white hover:text-[#8B6B21]'
                }`}
              >
                ABOUT
              </a>
              <a 
                href="#exhibit" 
                className={`nav-link font-semibold transition-all duration-300 hover:text-[#8B6B21] ${
                  isModalOpen 
                    ? 'text-white drop-shadow-lg hover:text-[#8B6B21]' 
                    : isScrolled 
                      ? 'text-gray-700 hover:text-[#8B6B21]' 
                      : 'text-white hover:text-[#8B6B21]'
                }`}
              >
                EXHIBITS
              </a>
              <a 
                href="#event" 
                className={`nav-link font-semibold transition-all duration-300 hover:text-[#8B6B21] ${
                  isModalOpen 
                    ? 'text-white drop-shadow-lg hover:text-[#8B6B21]' 
                    : isScrolled 
                      ? 'text-gray-700 hover:text-[#8B6B21]' 
                      : 'text-white hover:text-[#8B6B21]'
                }`}
              >
                EVENTS
              </a>
              <Link 
                to="/donate" 
                className={`nav-link font-semibold transition-all duration-300 hover:text-[#8B6B21] ${
                  isModalOpen 
                    ? 'text-white drop-shadow-lg hover:text-[#8B6B21]' 
                    : isScrolled 
                      ? 'text-gray-700 hover:text-[#8B6B21]' 
                      : 'text-white hover:text-[#8B6B21]'
                }`}
              >
                DONATE
              </Link>
              <a 
                href="#contact" 
                className={`nav-link font-semibold transition-all duration-300 hover:text-[#8B6B21] ${
                  isModalOpen 
                    ? 'text-white drop-shadow-lg hover:text-[#8B6B21]' 
                    : isScrolled 
                      ? 'text-gray-700 hover:text-[#8B6B21]' 
                      : 'text-white hover:text-[#8B6B21]'
                }`}
              >
                CONTACT
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <FontAwesomeIcon 
                icon={isMenuOpen ? faXmark : faBars} 
                className={`text-xl transition-colors duration-300 ${
                  isModalOpen 
                    ? 'text-white drop-shadow-lg' 
                    : isScrolled 
                      ? 'text-gray-700' 
                      : 'text-white'
                }`} 
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && !isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMenuOpen(false)} />
      )}

      {/* Mobile Menu */}
      <div
        className={`mobile-menu fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          isMenuOpen && !isModalOpen ? "translate-x-0" : "translate-x-full"
        } lg:hidden`}
      >
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Menu</h2>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="text-xl text-gray-600" />
          </button>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto h-full">
          <ul className="space-y-2 sm:space-y-4">
            <li>
              <a 
                href="#home" 
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center p-3 rounded-xl hover:bg-[#8B6B21]/10 text-gray-700 hover:text-[#8B6B21] transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-3 text-[#8B6B21] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-sm sm:text-base">HOME</span>
              </a>
            </li>
            <li>
              <a 
                href="#about" 
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center p-3 rounded-xl hover:bg-[#8B6B21]/10 text-gray-700 hover:text-[#8B6B21] transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-3 text-[#8B6B21] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm sm:text-base">ABOUT</span>
              </a>
            </li>
            <li>
              <a 
                href="#exhibit" 
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center p-3 rounded-xl hover:bg-[#8B6B21]/10 text-gray-700 hover:text-[#8B6B21] transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-3 text-[#8B6B21] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-sm sm:text-base">EXHIBITS</span>
              </a>
            </li>
            <li>
              <a 
                href="#event" 
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center p-3 rounded-xl hover:bg-[#8B6B21]/10 text-gray-700 hover:text-[#8B6B21] transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-3 text-[#8B6B21] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm sm:text-base">EVENTS</span>
              </a>
            </li>
            <li>
              <Link 
                to="/donate" 
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center p-3 rounded-xl hover:bg-[#8B6B21]/10 text-gray-700 hover:text-[#8B6B21] transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-3 text-[#8B6B21] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span className="text-sm sm:text-base">DONATE</span>
              </Link>
            </li>
            <li>
              <a 
                href="#contact" 
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center p-3 rounded-xl hover:bg-[#8B6B21]/10 text-gray-700 hover:text-[#8B6B21] transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-3 text-[#8B6B21] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm sm:text-base">CONTACT</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && !isModalOpen && <SearchBar onClose={() => setShowSearch(false)} />}

      {/* Hero Content */}
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center px-4 sm:px-6 text-white max-w-4xl w-full transition-all duration-300 ${
        isModalOpen ? 'hidden' : ''
      }`}>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
            <div className="inline-block">
              <span className="block text-[#8B6B21]">City Museum</span>
              <div className="w-full h-1 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] rounded-full mt-2"></div>
            </div>
            <span className="block text-white">of Cagayan de Oro City</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 leading-relaxed max-w-3xl mx-auto px-2">
            Discover the rich history and cultural heritage of Cagayan de Oro through our carefully curated exhibits. 
            From the historic water reservoir built in 1922 to today's modern museum, experience the journey of our city's evolution.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4">
          <Link
            to="/schedule"
            className="group bg-white/10 backdrop-blur-sm border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:bg-white hover:text-gray-800 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
          >
            <div className="flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule Your Visit
            </div>
          </Link>
          <Link
            to="/donate"
            className="group bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#8B6B21] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
          >
            <div className="flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Make a Donation
            </div>
          </Link>
          <Link
            to="/archive"
            className="group bg-white/10 backdrop-blur-sm border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:bg-white hover:text-gray-800 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
          >
            <div className="flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Digital Archive
            </div>
          </Link>
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && !isModalOpen && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#8B6B21] text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50"
        >
          <FontAwesomeIcon icon={faArrowUp} className="text-lg sm:text-xl" />
        </button>
      )}
    </section>
  );
};

export default Header;
