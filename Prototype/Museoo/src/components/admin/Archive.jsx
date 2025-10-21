import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import { canView, canEdit, canAdmin, getAccessLevel } from '../../utils/permissions';

const FILE_TYPES = [
  { label: 'Document', value: 'Document', icon: 'fa-file-alt' },
  { label: 'Image', value: 'Image', icon: 'fa-image' },
  { label: 'Audio', value: 'Audio', icon: 'fa-music' },
  { label: 'Video', value: 'Video', icon: 'fa-video' },
  { label: 'Other', value: 'Other', icon: 'fa-file' },
];

const ARCHIVE_CATEGORIES = [
  { label: 'History of Cdeo', value: 'History of Cdeo' },
  { label: 'Local Heroes', value: 'Local Heroes' },
  { label: 'History of Baragnays', value: 'History of Baragnays' },
  { label: 'Fathers of City Charter', value: 'Fathers of City Charter' },
  { label: 'Mayor Of Cagayan De oro City', value: 'Mayor Of Cagayan De oro City' },
  { label: 'Other', value: 'Other' },
];

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getFileIcon(type) {
  const fileType = FILE_TYPES.find(ft => ft.value === type);
  return fileType ? fileType.icon : 'fa-file';
}

const Archive = ({ userPermissions }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    type: 'Document',
    category: 'Other',
    tags: '',
    file: null,
    is_visible: true,
  });
  const [archives, setArchives] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    type: 'success',
    title: '',
    message: '',
    description: ''
  });

  // Fetch archives from backend
  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    try {
      const response = await api.get('/api/archives/admin');
      setArchives(response.data);
    } catch (error) {
      console.error('Error fetching archives:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Failed to Load Archives',
        message: 'Could not fetch archives from the server.',
        description: 'Please check your connection and try refreshing the page.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle form input
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  // Handle upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.file) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Missing Information',
        message: 'Title and file are required.',
        description: 'Please fill in all required fields before uploading.'
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'file') formData.append('file', v);
        else formData.append(k, v);
      });

      const response = await api.post('/api/archives', formData);
      if (response.status === 200) {
        setForm({ title: '', description: '', date: '', type: 'Document', category: 'Other', tags: '', file: null, is_visible: true });
        document.getElementById('archive-upload-form').reset();
        setShowForm(false);
        fetchArchives();
        setNotification({
          show: true,
          type: 'success',
          title: 'Archive Uploaded!',
          message: 'Your archive has been uploaded successfully.',
          description: 'The archive is now available in the system.'
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload the archive.',
        description: 'Please check your connection and try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle search/filter
  const filtered = archives.filter(a =>
    (!search || a.title.toLowerCase().includes(search.toLowerCase()) || (a.tags && a.tags.toLowerCase().includes(search.toLowerCase())))
    && (!typeFilter || a.type === typeFilter)
  );

  // Handle delete (admin only)
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this archive item?')) return;
    try {
      const response = await api.delete(`/api/archives/${id}`);
      if (response.status === 200) {
        setArchives(archives.filter(a => a.id !== id));
        setNotification({
          show: true,
          type: 'success',
          title: 'Archive Deleted!',
          message: 'The archive has been deleted successfully.',
          description: 'The archive has been permanently removed from the system.'
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete the archive.',
        description: 'Please check your connection and try again.'
      });
    }
  };

  // Handle visibility toggle (admin only)
  const handleVisibilityToggle = async (id, currentVisibility) => {
    try {
      const response = await api.patch(`/api/archives/${id}/visibility`, {
        is_visible: !currentVisibility
      });
      if (response.status === 200) {
        setArchives(archives.map(a => 
          a.id === id ? { ...a, is_visible: !currentVisibility } : a
        ));
        setNotification({
          show: true,
          type: 'success',
          title: 'Visibility Updated!',
          message: `Archive ${!currentVisibility ? 'shown' : 'hidden'} successfully.`,
          description: `The archive is now ${!currentVisibility ? 'visible' : 'hidden'} to visitors.`
        });
      }
    } catch (error) {
      console.error('Visibility toggle error:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update archive visibility.',
        description: 'Please check your connection and try again.'
      });
    }
  };

  // Render preview modal
  const renderPreview = (item) => {
    const url = `http://localhost:3000${item.file_url}`;
    
    if (item.type === 'Image') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
          <img 
            src={url} 
            alt={item.title} 
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="hidden flex-col items-center justify-center text-gray-500 p-8">
            <i className="fa-solid fa-image text-4xl mb-2"></i>
            <p className="text-sm">Image preview not available</p>
            <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 text-blue-500 hover:underline">
              Open in new tab
            </a>
          </div>
        </div>
      );
    }
    
    if (item.type === 'Document') {
      // Check if it's a PDF or other embeddable document
      const isPDF = item.file_url.toLowerCase().includes('.pdf');
      const isEmbeddable = isPDF || item.file_url.toLowerCase().match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/);
      
      if (isEmbeddable) {
      return (
          <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-lg">
            {/* Document Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-file-alt text-[#E5B80B]"></i>
                <span className="font-semibold text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                  Document Preview
                </span>
              </div>
              <div className="flex space-x-2">
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-[#E5B80B] text-white rounded text-xs hover:bg-[#d4a509] transition-colors font-semibold flex items-center justify-center"
                  style={{fontFamily: 'Telegraf, sans-serif'}}
                >
                  <i className="fa fa-external-link mr-1" style={{fontSize: '10px'}}></i>
                  Open
                </a>
                <a 
                  href={url} 
                  download
                  className="px-3 py-1 bg-[#E5B80B] text-[#351E10] rounded text-xs hover:bg-[#D4AF37] transition-colors font-semibold flex items-center justify-center font-telegraf"
                >
                  <i className="fa fa-download mr-1" style={{fontSize: '10px'}}></i>
                  Download
                </a>
              </div>
            </div>
            
            {/* Document Content */}
            <div className="flex-1 p-2">
              {isPDF ? (
        <iframe
                  src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
                  className="w-full h-full border-0 rounded"
          title={item.title}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
                  className="w-full h-full border-0 rounded"
                  title={item.title}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              )}
              
              {/* Fallback if iframe fails */}
              <div className="hidden w-full h-full flex-col items-center justify-center text-gray-500 p-8">
                <i className="fa-solid fa-file-alt text-6xl mb-4 text-[#E5B80B]"></i>
                <h3 className="text-lg font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                  Document Preview Not Available
                </h3>
                <p className="text-sm text-center mb-4">
                  The document cannot be displayed inline. Please use the buttons above to open or download.
                </p>
              </div>
            </div>
          </div>
        );
      } else {
        // For non-embeddable documents
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded-lg">
            <div className="flex flex-col items-center justify-center text-gray-500 p-8">
              <i className="fa-solid fa-file-alt text-6xl mb-4 text-[#E5B80B]"></i>
              <h3 className="text-lg font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                Document Preview
              </h3>
              <p className="text-sm text-center mb-4">
                This document type cannot be previewed inline. Click the button below to view or download.
              </p>
              <div className="flex space-x-3">
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#E5B80B] text-white rounded-lg hover:bg-[#d4a509] transition-colors font-semibold"
                  style={{fontFamily: 'Telegraf, sans-serif'}}
                >
                  <i className="fa-solid fa-external-link-alt mr-2"></i>
                  Open Document
                </a>
                <a 
                  href={url} 
                  download
                  className="px-4 py-2 bg-[#E5B80B] text-[#351E10] rounded-lg hover:bg-[#D4AF37] transition-colors font-semibold font-telegraf"
                >
                  <i className="fa-solid fa-download mr-2"></i>
                  Download
                </a>
              </div>
            </div>
          </div>
        );
      }
    }
    
    if (item.type === 'Audio') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded-lg">
          <div className="flex flex-col items-center justify-center text-gray-500 p-8">
            <i className="fa-solid fa-music text-6xl mb-4 text-[#E5B80B]"></i>
            <h3 className="text-lg font-semibold mb-4" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
              Audio File
            </h3>
            <audio 
              controls 
              src={url} 
              className="w-full max-w-md"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="hidden mt-4 text-center">
              <p className="text-sm mb-2">Audio preview not available</p>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                Open in new tab
              </a>
            </div>
          </div>
        </div>
      );
    }
    
    if (item.type === 'Video') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded-lg">
          <div className="flex flex-col items-center justify-center text-gray-500 p-8">
            <i className="fa-solid fa-video text-6xl mb-4 text-[#E5B80B]"></i>
            <h3 className="text-lg font-semibold mb-4" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
              Video File
            </h3>
            <video 
              controls 
              src={url} 
              className="w-full max-w-md max-h-64"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="hidden mt-4 text-center">
              <p className="text-sm mb-2">Video preview not available</p>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                Open in new tab
              </a>
            </div>
          </div>
        </div>
      );
    }
    
    // Default for other file types
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded-lg">
        <div className="flex flex-col items-center justify-center text-gray-500 p-8">
          <i className="fa-solid fa-file text-6xl mb-4 text-[#E5B80B]"></i>
          <h3 className="text-lg font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
            File Preview
          </h3>
          <p className="text-sm text-center mb-4">
            This file type cannot be previewed
          </p>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#E5B80B] text-white rounded-lg hover:bg-[#d4a509] transition-colors font-semibold"
            style={{fontFamily: 'Telegraf, sans-serif'}}
          >
            <i className="fa-solid fa-external-link-alt mr-2"></i>
            Open File
          </a>
        </div>
      </div>
    );
  };

  const getTypeIcon = (type) => {
    const fileType = FILE_TYPES.find(t => t.value === type);
    return fileType ? fileType.icon : 'fa-file';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-[#2e2b41]">
          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
          Loading archives...
        </div>
      </div>
    );
  }

  // Check permissions
  const canViewArchive = canView(userPermissions, 'archive');
  const canEditArchive = canEdit(userPermissions, 'archive');
  const canAdminArchive = canAdmin(userPermissions, 'archive');
  const accessLevel = getAccessLevel(userPermissions, 'archive');

  console.log("🔍 Archive permissions:", { canViewArchive, canEditArchive, canAdminArchive, accessLevel });

  // If no view permission, show access denied
  if (!canViewArchive) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="fa-solid fa-ban text-6xl text-red-500 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view the Archive.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 font-telegraf text-[#351E10]">
              <i className="fa-solid fa-box-archive mr-3 text-[#E5B80B]"></i>
              Digital Archives
            </h1>
            <p className="text-sm md:text-base font-lora text-[#351E10]">
              Manage and organize digital museum resources
              {accessLevel !== 'none' && (
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  accessLevel === 'view' ? 'bg-blue-100 text-blue-700' :
                  accessLevel === 'edit' ? 'bg-green-100 text-green-700' :
                  'bg-purple-100 text-purple-700'
                }`} style={{fontFamily: 'Telegraf, sans-serif'}}>
                  {accessLevel.toUpperCase()} ACCESS
                </span>
              )}
            </p>
          </div>
          {canEditArchive && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 md:px-6 py-2 md:py-3 rounded-lg transition-colors font-semibold shadow-md text-sm md:text-base"
              style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
            >
              <i className="fa-solid fa-plus mr-2"></i>
              Upload Archive
            </button>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showForm && canEditArchive && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden relative transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="relative p-3 sm:p-4 md:p-6 rounded-t-xl sm:rounded-t-2xl" style={{background: 'linear-gradient(135deg, #351E10 0%, #2A1A0D 50%, #1A0F08 100%)'}}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E5B80B]/10 to-transparent"></div>
              <div className="relative flex items-start justify-between">
                <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                    <i className="fa-solid fa-upload text-white text-lg sm:text-xl md:text-2xl"></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg md:text-2xl font-bold text-white truncate" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      Upload New Archive
                    </h3>
                    <p className="text-white/80 text-xs sm:text-sm hidden sm:block" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      Add a new digital archive to the museum collection
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ml-2"
                >
                  <i className="fa-solid fa-times text-sm sm:text-base"></i>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-3 sm:p-4 md:p-6 bg-white overflow-y-auto max-h-[calc(98vh-100px)] sm:max-h-[calc(95vh-120px)]">
              <form id="archive-upload-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      Title *
                    </label>
                    <input 
                      type="text" 
                      name="title" 
                      value={form.title}
                      onChange={handleChange} 
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] transition-all text-sm sm:text-base" 
                      placeholder="Enter archive title"
                      required 
                      style={{fontFamily: 'Telegraf, sans-serif'}}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      Type *
                    </label>
                    <select 
                      name="type" 
                      value={form.type}
                      onChange={handleChange} 
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] transition-all text-sm sm:text-base"
                      style={{fontFamily: 'Telegraf, sans-serif'}}
                    >
                      {FILE_TYPES.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      Category *
                    </label>
                    <select 
                      name="category" 
                      value={form.category}
                      onChange={handleChange} 
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] transition-all text-sm sm:text-base"
                      style={{fontFamily: 'Telegraf, sans-serif'}}
                    >
                      {ARCHIVE_CATEGORIES.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                    Description
                  </label>
                  <textarea 
                    name="description" 
                    value={form.description}
                    onChange={handleChange} 
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] transition-all text-sm sm:text-base"
                    rows="3"
                    placeholder="Enter archive description"
                    style={{fontFamily: 'Telegraf, sans-serif'}}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      Date
                    </label>
                    <input 
                      type="date" 
                      name="date" 
                      value={form.date}
                      onChange={handleChange} 
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] transition-all text-sm sm:text-base" 
                      style={{fontFamily: 'Telegraf, sans-serif'}}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      Tags
                    </label>
                    <input 
                      type="text" 
                      name="tags" 
                      value={form.tags}
                      onChange={handleChange} 
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] transition-all text-sm sm:text-base" 
                      placeholder="e.g. report, artifact, 2023" 
                      style={{fontFamily: 'Telegraf, sans-serif'}}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                    File *
                  </label>
                  <input 
                    type="file" 
                    name="file" 
                    onChange={handleChange} 
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] bg-white text-xs sm:text-sm transition-all" 
                    required 
                    style={{fontFamily: 'Telegraf, sans-serif'}}
                  />
                </div>
                
                <div>
                  <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                    Visibility
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <label className="flex items-center">
                      <input 
                        type="radio" 
                        name="is_visible" 
                        value="true"
                        checked={form.is_visible === true}
                        onChange={(e) => setForm(prev => ({ ...prev, is_visible: e.target.value === 'true' }))}
                        className="mr-2 text-[#E5B80B] focus:ring-[#E5B80B]"
                      />
                      <span className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                        <i className="fa-solid fa-eye mr-1 text-green-600"></i>
                        Visible to visitors
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="radio" 
                        name="is_visible" 
                        value="false"
                        checked={form.is_visible === false}
                        onChange={(e) => setForm(prev => ({ ...prev, is_visible: e.target.value === 'true' }))}
                        className="mr-2 text-[#E5B80B] focus:ring-[#E5B80B]"
                      />
                      <span className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                        <i className="fa-solid fa-eye-slash mr-1 text-gray-600"></i>
                        Hidden from visitors
                      </span>
                    </label>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
                  <button 
                    type="submit" 
                    disabled={uploading}
                    className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2 sm:py-2 md:py-3 rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-sm md:text-base order-2 sm:order-1"
                    style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
                  >
                    {uploading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-upload mr-2"></i>
                        Upload Archive
                      </>
                    )}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2 sm:py-2 md:py-3 rounded-lg font-semibold transition-colors shadow-md text-sm sm:text-sm md:text-base order-1 sm:order-2"
                    style={{backgroundColor: '#6B7280', color: 'white', fontFamily: 'Telegraf, sans-serif'}}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#4B5563'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#6B7280'}
                  >
                    <i className="fa-solid fa-times mr-2"></i>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Search/Filter */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200">
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          <div>
            <label className="block font-semibold mb-1 sm:mb-2 text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
              <i className="fa-solid fa-search mr-1 sm:mr-2" style={{color: '#E5B80B'}}></i>
              <span className="hidden sm:inline">Search Archives</span>
              <span className="sm:hidden">Search</span>
            </label>
            <input 
              type="text" 
              placeholder="Search by title or tags..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] text-sm sm:text-base" 
              style={{fontFamily: 'Telegraf, sans-serif'}}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1 sm:mb-2 text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
              <i className="fa-solid fa-filter mr-1 sm:mr-2" style={{color: '#E5B80B'}}></i>
              <span className="hidden sm:inline">Filter by Type</span>
              <span className="sm:hidden">Filter</span>
            </label>
            <select 
              value={typeFilter} 
              onChange={e => setTypeFilter(e.target.value)} 
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B] text-sm sm:text-base"
              style={{fontFamily: 'Telegraf, sans-serif'}}
            >
              <option value="">All Types</option>
              {FILE_TYPES.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#E5B80B'}}>
              <i className="fa-solid fa-file-alt text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Documents</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}>
                {archives.filter(a => a.type === 'Document').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#351E10'}}>
              <i className="fa-solid fa-image text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Images</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                {archives.filter(a => a.type === 'Image').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#E5B80B'}}>
              <i className="fa-solid fa-video text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Videos</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}>
                {archives.filter(a => a.type === 'Video').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#351E10'}}>
              <i className="fa-solid fa-music text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Audio</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                {archives.filter(a => a.type === 'Audio').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Archive List */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200" style={{background: 'linear-gradient(135deg, #E5B80B 0%, #351E10 100%)'}}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-bold text-white" style={{fontFamily: 'Telegraf, sans-serif'}}>
            <i className="fa-solid fa-list mr-2"></i>
            All Archives ({filtered.length})
          </h3>
            <div className="flex items-center space-x-2">
              <span className="text-white/80 text-sm" style={{fontFamily: 'Telegraf, sans-serif'}}>
                {filtered.filter(item => item.is_visible).length} visible
              </span>
              <span className="text-white/60 text-sm" style={{fontFamily: 'Telegraf, sans-serif'}}>
                {filtered.filter(item => !item.is_visible).length} hidden
              </span>
        </div>
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
          {filtered.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{backgroundColor: '#E5B80B', opacity: 0.1}}>
                <i className="fa-solid fa-box-archive text-3xl" style={{color: '#E5B80B'}}></i>
              </div>
              <h4 className="text-lg sm:text-xl font-bold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>No Archives Found</h4>
              <p className="text-sm sm:text-base mb-4" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                {search || typeFilter ? 'Try adjusting your search or filter criteria' : 'Upload your first archive to get started'}
              </p>
              {!search && !typeFilter && canEditArchive && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                  style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
                >
                  <i className="fa-solid fa-plus mr-2"></i>
                  Upload Archive
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(item => (
                <div key={item.id} className="group relative bg-white rounded-2xl shadow-lg border-2 border-black overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                  {/* Modern Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Header Section with Modern Styling */}
                  <div className="relative p-6 pb-4">
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{
                          background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'
                        }}>
                          <i className={`fa-solid ${getTypeIcon(item.type)} text-xl text-white`}></i>
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{
                          backgroundColor: item.is_visible ? '#10B981' : '#EF4444'
                        }}>
                          <i className={`fa-solid ${item.is_visible ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xl mb-1 truncate" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                          {item.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold text-white" style={{
                            backgroundColor: item.type === 'Image' ? '#10B981' : 
                                            item.type === 'Document' ? '#3B82F6' :
                                            item.type === 'Audio' ? '#F59E0B' :
                                            item.type === 'Video' ? '#8B5CF6' : '#6B7280'
                          }}>
                            {item.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Compact Information Section */}
                  <div className="relative px-6 pb-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <i className="fa-solid fa-folder text-xs" style={{color: '#E5B80B'}}></i>
                        <span className="text-xs font-medium text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>Category:</span>
                        <span className="text-xs text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          {item.category || 'Other'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <i className="fa-solid fa-calendar text-xs" style={{color: '#E5B80B'}}></i>
                        <span className="text-xs font-medium text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>Date:</span>
                        <span className="text-xs text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          {formatDate(item.date)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <i className="fa-solid fa-tags text-xs" style={{color: '#E5B80B'}}></i>
                        <span className="text-xs font-medium text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>Tags:</span>
                        <span className="text-xs text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          {item.tags || 'None'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Modern Action Buttons */}
                  <div className="relative px-6 pb-6">
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => setPreview(item)} 
                          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
                          style={{backgroundColor: '#E5B80B', color: 'white', fontFamily: 'Telegraf, sans-serif'}}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
                          title="View"
                        >
                          <i className="fa-solid fa-eye mr-2"></i>
                          View
                        </button>
                        
                        {canEditArchive && (
                          <a 
                            href={`http://localhost:3000${item.file_url}`} 
                            download 
                            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
                            style={{backgroundColor: '#351E10', color: 'white', fontFamily: 'Telegraf, sans-serif'}}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#2A1A0D'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#351E10'}
                            title="Download"
                          >
                            <i className="fa-solid fa-download mr-2"></i>
                            Download
                          </a>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        {canEditArchive && (
                          <button 
                            onClick={() => handleVisibilityToggle(item.id, item.is_visible)} 
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
                            style={{
                              backgroundColor: item.is_visible ? '#10B981' : '#EF4444',
                              color: 'white',
                              fontFamily: 'Telegraf, sans-serif'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = item.is_visible ? '#059669' : '#DC2626'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = item.is_visible ? '#10B981' : '#EF4444'}
                            title={item.is_visible ? 'Hide' : 'Show'}
                          >
                            <i className={`fa-solid ${item.is_visible ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                          </button>
                        )}
                        
                        {canAdminArchive && (
                          <button 
                            onClick={() => handleDelete(item.id)} 
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
                            style={{backgroundColor: '#EF4444', color: 'white', fontFamily: 'Telegraf, sans-serif'}}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#DC2626'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#EF4444'}
                            title="Delete"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden relative transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="relative p-4 sm:p-6 rounded-t-2xl" style={{background: 'linear-gradient(135deg, #351E10 0%, #2A1A0D 50%, #1A0F08 100%)'}}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E5B80B]/10 to-transparent"></div>
              <div className="relative flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                    <i className={`fa-solid ${getFileIcon(preview.type)} text-white text-xl sm:text-2xl`}></i>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-2xl font-bold text-white" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      {preview.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full text-white bg-white/20 backdrop-blur-sm">
                        {preview.type}
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full text-white bg-white/20 backdrop-blur-sm">
                        {formatDate(preview.date)}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${preview.is_visible ? 'bg-green-500/80' : 'bg-orange-500/80'}`}>
                        {preview.is_visible ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setPreview(null)}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0"
                >
                  <i className="fa-solid fa-times text-sm sm:text-base"></i>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col lg:flex-row h-full max-h-[calc(95vh-120px)]">
              {/* Preview Section */}
              <div className="lg:w-2/3 p-4 sm:p-6 bg-gray-50 flex items-center justify-center">
                <div className="w-full h-full max-h-[60vh] lg:max-h-full flex items-center justify-center">
                  {renderPreview(preview)}
                </div>
              </div>

              {/* Details Section */}
              <div className="lg:w-1/3 p-4 sm:p-6 bg-white overflow-y-auto">
                <div className="space-y-6">
                  {/* Description */}
                  {preview.description && (
                    <div>
                      <h3 className="text-lg font-bold mb-3 flex items-center" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                        <i className="fa-solid fa-align-left mr-2 text-[#E5B80B]"></i>
                        Description
                      </h3>
                      <p className="text-gray-700 leading-relaxed" style={{fontFamily: 'Telegraf, sans-serif'}}>
                        {preview.description}
                      </p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div>
                    <h3 className="text-lg font-bold mb-3 flex items-center" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      <i className="fa-solid fa-info-circle mr-2 text-[#E5B80B]"></i>
                      Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-[#E5B80B] rounded-full flex items-center justify-center mr-3">
                          <i className="fa-solid fa-folder text-white text-sm"></i>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-medium">Category</div>
                          <div className="font-semibold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                            {preview.category || 'Other'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                          <i className="fa-solid fa-tag text-white text-sm"></i>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-medium">Type</div>
                          <div className="font-semibold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                            {preview.type}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                          <i className="fa-solid fa-calendar text-white text-sm"></i>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-medium">Date Added</div>
                          <div className="font-semibold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                            {formatDate(preview.date)}
                          </div>
                        </div>
                      </div>

                      {preview.tags && (
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                            <i className="fa-solid fa-tags text-white text-sm"></i>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 font-medium">Tags</div>
                            <div className="font-semibold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                              {preview.tags}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-3">
              <a 
                href={`http://localhost:3000${preview.file_url}`} 
                download 
                        className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5 text-center"
                        style={{backgroundColor: '#E5B80B', color: 'white', fontFamily: 'Telegraf, sans-serif'}}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
              >
                <i className="fa-solid fa-download mr-2"></i>
                Download File
              </a>
                      
                      {canEditArchive && (
                        <button 
                          onClick={() => handleVisibilityToggle(preview.id, preview.is_visible)} 
                          className="px-4 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
                          style={{
                            backgroundColor: preview.is_visible ? '#F59E0B' : '#3B82F6',
                            color: 'white',
                            fontFamily: 'Telegraf, sans-serif'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = preview.is_visible ? '#D97706' : '#2563EB'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = preview.is_visible ? '#F59E0B' : '#3B82F6'}
                        >
                          <i className={`fa-solid ${preview.is_visible ? 'fa-eye-slash' : 'fa-eye'} mr-2`}></i>
                          {preview.is_visible ? 'Make Private' : 'Make Public'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Notification */}
      {notification.show && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100 opacity-100 border-l-4" style={{borderLeftColor: notification.type === 'success' ? '#10B981' : notification.type === 'error' ? '#EF4444' : '#3B82F6'}}>
            {/* Notification Icon */}
            <div className="flex justify-center pt-8 pb-4">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: notification.type === 'success' 
                    ? 'linear-gradient(135deg, #10B981, #059669)'
                    : notification.type === 'error'
                    ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                    : 'linear-gradient(135deg, #3B82F6, #2563EB)'
                }}
              >
                <i className={`fa-solid ${notification.type === 'success' ? 'fa-check' : notification.type === 'error' ? 'fa-times' : 'fa-info'} text-3xl text-white`}></i>
              </div>
            </div>
            
            {/* Notification Message */}
            <div className="px-8 pb-8 text-center">
              <h3 className="text-2xl font-bold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                {notification.title}
              </h3>
              <p className="text-gray-600 text-lg mb-2" style={{fontFamily: 'Telegraf, sans-serif'}}>
                {notification.message}
              </p>
              {notification.description && (
                <p className="text-sm text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  {notification.description}
                </p>
              )}
            </div>
            
            {/* Close Button */}
            <div className="px-8 pb-8">
              <button
                onClick={() => setNotification({...notification, show: false})}
                className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                style={{background: 'linear-gradient(135deg, #8B6B21 0%, #D4AF37 100%)', color: 'white', fontFamily: 'Telegraf, sans-serif'}}
              >
                <i className="fa-solid fa-check mr-2"></i>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Archive;
