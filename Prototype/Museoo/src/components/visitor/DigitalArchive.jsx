import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const DigitalArchive = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);

  const archiveTypes = [
    { value: '', label: 'All Types' },
    { value: 'Document', label: 'Documents' },
    { value: 'Image', label: 'Images' },
    { value: 'Audio', label: 'Audio Files' },
    { value: 'Video', label: 'Video Files' },
    { value: 'Other', label: 'Other Files' }
  ];

  const predefinedCategories = [
    { value: '', label: 'All Categories' },
    { value: 'History of Cdeo', label: 'History of Cdeo' },
    { value: 'Local Heroes', label: 'Local Heroes' },
    { value: 'History of Baragnays', label: 'History of Baragnays' },
    { value: 'Fathers of City Charter', label: 'Fathers of City Charter' },
    { value: 'Mayor Of Cagayan De oro City', label: 'Mayor Of Cagayan De oro City' },
    { value: 'Other', label: 'Other' }
  ];

  // Load all visible documents
  const loadAllArchives = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/api/archives');
      setSearchResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Error loading archives:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchArchives = async () => {
    if (searchTerm.trim().length < 2 && !selectedType && !selectedCategory) {
      // If no search criteria, load all documents
      await loadAllArchives();
      return;
    }

    setIsLoading(true);
    try {
      let url = 'http://localhost:3000/api/archives?';
      const params = new URLSearchParams();
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      if (selectedType) {
        params.append('type', selectedType);
      }

      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      
      const response = await axios.get(`http://localhost:3000/api/archives?${params.toString()}`);
      setSearchResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load all documents and categories on component mount
  useEffect(() => {
    loadAllArchives();
    
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/archives/categories');
        setAvailableCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Handle search and filter changes
  useEffect(() => {
    const debounceTimer = setTimeout(searchArchives, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedType, selectedCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    searchArchives();
  };

  const handleResultClick = (archive) => {
    setSelectedArchive(archive);
  };

  const handleDownload = (archive) => {
    if (archive.file_url) {
      window.open(`http://localhost:3000${archive.file_url}`, '_blank');
    }
  };

  const getFileIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'document':
        return (
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'image':
        return (
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'audio':
        return (
          <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        );
      case 'video':
        return (
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-white hover:text-[#D4AF37] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">Digital Archive</h1>
                <p className="text-gray-400">Search through our collection of historical documents and artifacts</p>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="bg-black/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Search Input */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Archives
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title, description, or tags..."
                    className="w-full px-4 py-3 pl-12 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all duration-300"
                  />
                  <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  File Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all duration-300"
                >
                  {archiveTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all duration-300"
                >
                  {predefinedCategories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#8B6B21] text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Searching...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Search Archives</span>
                  </div>
                )}
              </button>
              
              <button
                type="button"
                onClick={loadAllArchives}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <span>Show All</span>
                </div>
              </button>

              <div className="text-sm text-gray-400">
                {searchResults.length > 0 && (
                  <span>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found</span>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Search Results */}
        {showResults && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div>
                  <span className="text-white text-lg">Searching archives...</span>
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((archive) => (
                  <div
                    key={archive.id}
                    className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-700/50 transition-all duration-300 cursor-pointer group"
                    onClick={() => handleResultClick(archive)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getFileIcon(archive.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white group-hover:text-[#D4AF37] transition-colors truncate">
                          {archive.title}
                        </h3>
                        {archive.description && (
                          <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                            {archive.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            archive.type?.toLowerCase() === 'document' ? 'bg-blue-500/20 text-blue-400' :
                            archive.type?.toLowerCase() === 'image' ? 'bg-green-500/20 text-green-400' :
                            archive.type?.toLowerCase() === 'audio' ? 'bg-purple-500/20 text-purple-400' :
                            archive.type?.toLowerCase() === 'video' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {archive.type || 'Document'}
                          </span>
                          {archive.category && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#D4AF37]/20 text-[#D4AF37]">
                              {archive.category}
                            </span>
                          )}
                          {archive.date && (
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(archive.date)}
                            </span>
                          )}
                        </div>
                        {archive.tags && (
                          <div className="mt-3">
                            <div className="flex flex-wrap gap-1">
                              {archive.tags.split(',').map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
                                >
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(archive);
                        }}
                        className="px-4 py-2 bg-[#8B6B21] hover:bg-[#D4AF37] text-white text-sm font-medium rounded-lg transition-colors duration-300"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Archives Found</h3>
                <p className="text-gray-400 mb-4">Try adjusting your search terms or filters</p>
                <button
                  onClick={loadAllArchives}
                  className="px-6 py-2 bg-[#8B6B21] hover:bg-[#D4AF37] text-white font-medium rounded-lg transition-colors duration-300"
                >
                  Show All Documents
                </button>
              </div>
            )}
          </div>
        )}

        {/* Archive Detail Modal */}
        {selectedArchive && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    {getFileIcon(selectedArchive.type)}
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedArchive.title}</h2>
                      <p className="text-gray-400">{selectedArchive.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedArchive(null)}
                    className="p-2 rounded-full hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {selectedArchive.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                    <p className="text-gray-300 leading-relaxed">{selectedArchive.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Details</h3>
                    <div className="space-y-2 text-gray-300">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="text-white">{selectedArchive.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Category:</span>
                        <span className="text-white">{selectedArchive.category || 'Other'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span className="text-white">{formatDate(selectedArchive.date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Uploaded:</span>
                        <span className="text-white">{formatDate(selectedArchive.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedArchive.tags && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedArchive.tags.split(',').map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-full"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setSelectedArchive(null)}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-300"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleDownload(selectedArchive)}
                    className="px-6 py-2 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#8B6B21] text-white font-medium rounded-lg transition-all duration-300"
                  >
                    Download File
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalArchive; 