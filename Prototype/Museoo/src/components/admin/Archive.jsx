import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const [deleteArchiveModal, setDeleteArchiveModal] = useState({ 
    show: false, 
    id: null, 
    itemTitle: null 
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
  const handleDelete = (id) => {
    const itemToDelete = archives.find(a => a.id === id);
    setDeleteArchiveModal({ 
      show: true, 
      id: id, 
      itemTitle: itemToDelete?.title || 'Archive Item' 
    });
  };

  const confirmDeleteArchive = async () => {
    if (!deleteArchiveModal.id) return;
    try {
      const response = await api.delete(`/api/archives/${deleteArchiveModal.id}`);
      if (response.status === 200) {
        setArchives(archives.filter(a => a.id !== deleteArchiveModal.id));
        setNotification({
          show: true,
          type: 'success',
          title: 'Archive Deleted!',
          message: 'The archive has been deleted successfully.',
          description: `"${deleteArchiveModal.itemTitle}" has been permanently removed from the system.`
        });
        setDeleteArchiveModal({ show: false, id: null, itemTitle: null });
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
      setDeleteArchiveModal({ show: false, id: null, itemTitle: null });
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

  // Office Document Preview Component - Memoized to prevent re-renders
  const OfficeDocumentPreview = ({ url, item, fileUrlLower }) => {
    const containerRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const hasLoadedRef = useRef(false); // Track if we've already loaded to prevent re-loading
    const lastUrlRef = useRef(null); // Track the last URL we loaded

    useEffect(() => {
      // Normalize URL for comparison (remove trailing slashes, etc.)
      const normalizedUrl = url?.trim().replace(/\/+$/, '');
      
      // Prevent multiple loads of the same document
      if (hasLoadedRef.current && lastUrlRef.current === normalizedUrl) {
        console.log('⚠️ Already loaded this URL, skipping...', normalizedUrl);
        return; // Early return - no cleanup needed
      }
      
      // Reset state for new document
      setLoading(true);
      setError(null);
      
      // Update tracking BEFORE starting load
      hasLoadedRef.current = true;
      lastUrlRef.current = normalizedUrl;
      
      const isDocx = fileUrlLower.includes('.docx') || fileUrlLower.includes('.doc');
      const isPptx = fileUrlLower.includes('.pptx') || fileUrlLower.includes('.ppt');
      
      if (!isDocx && !isPptx) {
        setLoading(false);
        setError('Unsupported file type for preview');
        hasLoadedRef.current = true; // Mark as processed
        return () => {}; // Return empty cleanup
      }
      
      // Wait for container ref to be available
      const waitForContainer = () => {
        return new Promise((resolve) => {
          if (containerRef.current) {
            resolve();
          } else {
            let containerAttempts = 0;
            const checkInterval = setInterval(() => {
              containerAttempts++;
              if (containerRef.current) {
                clearInterval(checkInterval);
                resolve();
              } else if (containerAttempts > 50) {
                clearInterval(checkInterval);
                throw new Error('Container ref not available after 5 seconds');
              }
            }, 100);
          }
        });
      };
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.error('⏱️ Preview load timeout after 30 seconds');
        setError('Preview load timeout. Please try refreshing or download the file.');
        setLoading(false);
      }, 30000);
      
      if (isDocx) {
        // Load docx-preview from CDN and render DOCX
        const loadAndRender = async () => {
          try {
            setLoading(true);
            console.log('📄 Starting DOCX preview load for:', url);
            
            // Wait for container to be available
            await waitForContainer();
            console.log('✅ Container ref is now available');
            
            // Load JSZip first (required dependency for docx-preview)
            const loadScript = (src) => {
              return new Promise((resolve, reject) => {
                const existing = document.querySelector(`script[src="${src}"]`);
                if (existing) {
                  resolve();
                  return;
                }
                
                const script = document.createElement('script');
                script.src = src;
                const timeout = setTimeout(() => {
                  reject(new Error(`Library load timeout: ${src}`));
                }, 10000);
                
                script.onload = () => {
                  clearTimeout(timeout);
                  resolve();
                };
                script.onerror = (err) => {
                  clearTimeout(timeout);
                  reject(new Error(`Failed to load: ${src}`));
                };
                document.head.appendChild(script);
              });
            };
            
            // Load JSZip first (required dependency)
            console.log('📦 Loading JSZip library from CDN...');
            await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
            console.log('✅ JSZip library loaded');
            
            // Wait a bit for JSZip to initialize
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Load docx-preview library
            console.log('📦 Loading docx-preview library from CDN...');
            await loadScript('https://cdn.jsdelivr.net/npm/docx-preview@0.1.4/dist/docx-preview.min.js');
            console.log('✅ docx-preview library loaded');
            
            // Wait a bit for libraries to initialize
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Verify libraries are loaded
            if (!window.JSZip) {
              throw new Error('JSZip library not loaded');
            }
            
            console.log('🔍 Checking for library API:', {
              hasJSZip: !!window.JSZip,
              hasWindowDocx: !!window.docx,
              hasWindowDocxPreview: !!window.docxPreview,
              windowKeys: Object.keys(window).filter(k => k.toLowerCase().includes('docx') || k.toLowerCase().includes('zip'))
            });
            
            // Wait for docx library to be available (if not already)
            let libCheckAttempts = 0;
            while (libCheckAttempts < 50 && !window.docx && !window.docxPreview) {
              await new Promise(resolve => setTimeout(resolve, 100));
              libCheckAttempts++;
            }
            
            // Fetch the document - use fetch without credentials since archive files are public
            console.log('📥 Fetching document from:', url);
            
            let arrayBuffer;
            try {
              // Use fetch without credentials for public archive files
              // Explicitly set mode and credentials to ensure no credentials are sent
              const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit', // Explicitly omit credentials
                cache: 'no-cache', // Prevent caching issues
                headers: {
                  'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                },
                // Ensure no credentials are sent
                referrerPolicy: 'no-referrer'
              });
              
              console.log('📥 Response status:', response.status, response.statusText);
              
              if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}. ${errorText}`);
              }
              
              arrayBuffer = await response.arrayBuffer();
              console.log('✅ Document loaded successfully, size:', arrayBuffer.byteLength, 'bytes');
            } catch (fetchError) {
              console.error('❌ Fetch error details:', fetchError);
              throw new Error(`Failed to fetch document. ${fetchError.message}`);
            }
            
            // Check for different possible library exports
            const docxLib = window.docx || window.docxPreview || window.DocxPreview;
            
            if (docxLib && docxLib.renderAsync) {
              console.log('🎨 Rendering DOCX with renderAsync...');
              await docxLib.renderAsync(arrayBuffer, containerRef.current, null, {
                className: 'docx-preview',
                inWrapper: true,
                ignoreWidth: false,
                ignoreHeight: false,
                ignoreFonts: false,
                breakPages: true
              });
              console.log('✅ DOCX rendered successfully');
              setLoading(false);
            } else if (docxLib && typeof docxLib === 'function') {
              console.log('🎨 Rendering DOCX with function call...');
              docxLib(arrayBuffer, containerRef.current);
              setLoading(false);
            } else {
              const availableKeys = Object.keys(window).filter(k => k.toLowerCase().includes('docx') || k.toLowerCase().includes('preview') || k.toLowerCase().includes('zip'));
              throw new Error(`docx-preview library API not found. Available window keys: ${availableKeys.join(', ') || 'none'}`);
            }
          } catch (err) {
            console.error('❌ Error rendering DOCX:', err);
            console.error('Error details:', {
              message: err.message,
              stack: err.stack,
              url: url
            });
            setError(err.message || 'Failed to load document preview');
            setLoading(false);
            clearTimeout(timeoutId);
          }
        };
        
        loadAndRender().catch(err => {
          console.error('❌ Unhandled error in loadAndRender:', err);
          setError(err.message || 'Failed to load document preview');
          setLoading(false);
          clearTimeout(timeoutId);
        });
      } else if (isPptx) {
        setLoading(false);
        setError('PPTX preview requires conversion to PDF. Please download to view.');
        hasLoadedRef.current = true; // Mark as processed
      }
      
      // Cleanup timeout on unmount or URL change
      return () => {
        clearTimeout(timeoutId);
        // Don't reset hasLoadedRef here - React.memo will handle re-renders
      };
    }, [url, fileUrlLower]); // Depend on both to detect changes

    if (error) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-8 bg-white rounded">
          <i className={`fa-solid ${fileUrlLower.includes('.pptx') || fileUrlLower.includes('.ppt') ? 'fa-file-powerpoint' : 'fa-file-word'} text-6xl mb-4 text-[#E5B80B]`}></i>
          <h3 className="text-lg font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
            Preview Unavailable
          </h3>
          <p className="text-sm text-center mb-4 max-w-md">{error}</p>
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
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              style={{fontFamily: 'Telegraf, sans-serif'}}
            >
              <i className="fa-solid fa-download mr-2"></i>
              Download
            </a>
          </div>
        </div>
      );
    }

    // Always render the container div so ref is available, but show loading/error overlays
    return (
      <div className="w-full h-full bg-white rounded overflow-auto relative">
        {/* Loading overlay */}
        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-8 bg-white z-10">
            <i className="fa-solid fa-spinner fa-spin text-6xl mb-4 text-[#E5B80B]"></i>
            <h3 className="text-lg font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
              Loading Preview...
            </h3>
          </div>
        )}
        
        {/* Container for DOCX preview - always rendered so ref is available */}
        <div 
          ref={containerRef} 
          className="docx-wrapper" 
          style={{ 
            padding: '20px', 
            minHeight: '100%',
            visibility: loading || error ? 'hidden' : 'visible'
          }}
        ></div>
      </div>
    );
  };
  
  // Memoized version that only re-renders when URL or file type changes
  const MemoizedOfficePreview = React.memo(OfficeDocumentPreview, (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render), false if different (re-render)
    const urlEqual = prevProps.url === nextProps.url;
    const fileTypeEqual = prevProps.fileUrlLower === nextProps.fileUrlLower;
    const itemEqual = prevProps.item?.id === nextProps.item?.id;
    return urlEqual && fileTypeEqual && itemEqual; // true = skip re-render
  });

  // Render preview modal
  const renderPreview = (item) => {
    // Ensure file_url starts with /uploads
    let filePath = item.file_url.startsWith('/') ? item.file_url : `/${item.file_url}`;
    // Remove any double slashes
    filePath = filePath.replace(/\/+/g, '/');
    const url = `${api.defaults.baseURL}${filePath}`;
    const fileUrlLower = item.file_url?.toLowerCase() || '';
    
    console.log('📄 Rendering preview for:', item.title);
    console.log('📂 File URL from item:', item.file_url);
    console.log('🔗 Constructed URL:', url);
    console.log('🌐 Base URL:', api.defaults.baseURL);
    
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
      // Check file type - be more robust with detection
      const fileUrlLower = item.file_url.toLowerCase();
      const isPDF = fileUrlLower.endsWith('.pdf') || fileUrlLower.includes('.pdf');
      const isOfficeDoc = /\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(item.file_url);
      
      console.log('📋 File type detection:', {
        file_url: item.file_url,
        isPDF,
        isOfficeDoc,
        detectedType: isPDF ? 'PDF' : isOfficeDoc ? 'Office' : 'Other'
      });
      
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
          <div className="flex-1 p-2 relative bg-gray-50" style={{ minHeight: '500px' }}>
            {isPDF ? (
              <div className="w-full h-full relative bg-white rounded">
                <object
                  data={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
                  type="application/pdf"
                  className="w-full h-full rounded"
                  style={{ minHeight: '500px' }}
                  onLoad={() => {
                    console.log('✅ PDF object loaded successfully');
                  }}
                >
                  {/* Fallback iframe if object fails */}
                  <iframe
                    key={`pdf-${item.id}-${url}`}
                    src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="w-full h-full border-0 rounded"
                    title={item.title}
                    style={{ minHeight: '500px' }}
                    onLoad={() => {
                      console.log('✅ PDF iframe loaded (fallback)');
                    }}
                    onError={(e) => {
                      console.error('❌ PDF iframe failed to load:', e);
                    }}
                  />
                  {/* Final fallback message */}
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-8">
                    <i className="fa-solid fa-file-pdf text-6xl mb-4 text-red-500"></i>
                    <h3 className="text-lg font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      PDF Preview Unavailable
                    </h3>
                    <p className="text-sm text-center mb-4">
                      Unable to load PDF preview. Please use the buttons above.
                    </p>
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#E5B80B] text-white rounded-lg hover:bg-[#d4a509] transition-colors font-semibold"
                      style={{fontFamily: 'Telegraf, sans-serif'}}
                    >
                      <i className="fa-solid fa-external-link-alt mr-2"></i>
                      Open PDF
                    </a>
                  </div>
                </object>
              </div>
            ) : isOfficeDoc ? (
              <MemoizedOfficePreview 
                key={`office-preview-${item.id}-${url}`}
                url={url} 
                item={item} 
                fileUrlLower={fileUrlLower} 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-8">
                <i className="fa-solid fa-file-alt text-6xl mb-4 text-[#E5B80B]"></i>
                <h3 className="text-lg font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                  Document Preview
                </h3>
                <p className="text-sm text-center mb-4">
                  This document type cannot be previewed inline. Click the buttons above to view or download.
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
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                    style={{fontFamily: 'Telegraf, sans-serif'}}
                  >
                    <i className="fa-solid fa-download mr-2"></i>
                    Download
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      );
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
                            href={`${api.defaults.baseURL}${item.file_url}`} 
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
                href={`${api.defaults.baseURL}${preview.file_url}`} 
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

      {/* Delete Archive Modal */}
      {deleteArchiveModal.show && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100 opacity-100 border-l-4 border-orange-500">
            {/* Confirmation Icon */}
            <div className="flex justify-center pt-8 pb-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600">
                <i className="fa-solid fa-question text-3xl text-white"></i>
              </div>
            </div>
            
            {/* Confirmation Message */}
            <div className="px-8 pb-8 text-center">
              <h3 className="text-2xl font-bold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                Delete Archive Item
              </h3>
              <p className="text-gray-600 text-lg mb-2" style={{fontFamily: 'Telegraf, sans-serif'}}>
                Are you sure you want to delete "{deleteArchiveModal.itemTitle}"?
              </p>
              <p className="text-gray-600 text-lg mb-2" style={{fontFamily: 'Telegraf, sans-serif'}}>
                This action cannot be undone and will permanently remove:
              </p>
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <ul className="text-sm text-red-700 space-y-1" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  <li>• Archive item details</li>
                  <li>• Associated file</li>
                  <li>• All metadata</li>
                  <li>• Visitor access records</li>
                </ul>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="px-8 pb-8 flex gap-4">
              <button
                onClick={() => setDeleteArchiveModal({ show: false, id: null, itemTitle: null })}
                className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                style={{fontFamily: 'Telegraf, sans-serif'}}
              >
                <i className="fa-solid fa-times mr-2"></i>
                Cancel
              </button>
              <button
                onClick={confirmDeleteArchive}
                className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                style={{fontFamily: 'Telegraf, sans-serif'}}
              >
                <i className="fa-solid fa-trash mr-2"></i>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Archive;
