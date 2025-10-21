import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SearchBar = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    const searchArchives = async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        setSelectedIndex(-1);
        return;
      }

      setIsLoading(true);
      try {
        const response = await axios.get(`http://localhost:3000/api/archives?search=${encodeURIComponent(searchTerm)}`);
        setSearchResults(response.data);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        setSelectedIndex(-1);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchArchives, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleResultClick(searchResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleResultClick = (result) => {
    if (result.file_url) {
      window.open(`http://localhost:3000${result.file_url}`, '_blank');
    }
    setShowResults(false);
    setSearchTerm('');
    onClose();
  };

  const getResultIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'document':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'artifact':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'photo':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-auto overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#8B6B21]/10 to-[#D4AF37]/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Digital Archive Search</h3>
              <p className="text-sm text-gray-600">Search through our collection of historical documents and artifacts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search archives, documents, artifacts, photos..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowResults(true);
              }}
              onKeyDown={handleKeyDown}
              className="w-full p-4 pl-12 pr-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B6B21] focus:border-transparent transition-all duration-300 text-lg"
              autoFocus
            />
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        {showResults && (
          <div className="max-h-96 overflow-y-auto border-t border-gray-200">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8B6B21]"></div>
                  <span className="text-gray-600 font-medium">Searching archives...</span>
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {searchResults.map((result, index) => (
                  <div
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={`p-4 cursor-pointer transition-all duration-200 ${
                      selectedIndex === index 
                        ? 'bg-[#8B6B21]/10 border-l-4 border-[#8B6B21]' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        selectedIndex === index ? 'bg-[#8B6B21]/20' : 'bg-gray-100'
                      }`}>
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 mb-1 truncate">
                          {result.title}
                        </h4>
                        {result.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {result.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            result.type?.toLowerCase() === 'document' ? 'bg-[#8B6B21]/20 text-[#8B6B21]' :
                            result.type?.toLowerCase() === 'artifact' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' :
                            result.type?.toLowerCase() === 'photo' ? 'bg-[#8B6B21]/20 text-[#8B6B21]' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {result.type || 'Document'}
                          </span>
                          {result.date && (
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(result.date).toLocaleDateString()}
                            </span>
                          )}
                          {result.tags && (
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              {result.tags}
                            </span>
                          )}
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchTerm.trim().length >= 2 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No results found</h3>
                <p className="text-gray-500">Try different keywords or check your spelling</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Search Tips */}
        <div className="p-6 bg-gradient-to-r from-gray-50 to-[#8B6B21]/5 border-t border-gray-200">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-[#8B6B21]/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Search Tips</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Use specific keywords for better results</li>
                <li>• Search by title, description, or tags</li>
                <li>• Use arrow keys to navigate results</li>
                <li>• Press Enter to open selected document</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar; 