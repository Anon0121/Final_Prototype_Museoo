import { useState, useEffect } from "react";
import api from "../../config/api";

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

const Exhibit = () => {
  const [exhibits, setExhibits] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    images: [],
    startDate: "",
    endDate: "",
    location: "",
    curator: "",
    category: "",
  });
  const [modalExhibit, setModalExhibit] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [notification, setNotification] = useState({
    show: false,
    type: 'success',
    title: '',
    message: '',
    description: ''
  });


  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "images") {
      const fileList = Array.from(files);
      if (fileList.length > 0) {
        // Validate file types
        const validFiles = fileList.filter(file => {
          const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
          return validTypes.includes(file.type);
        });
        
        if (validFiles.length !== fileList.length) {
          setNotification({
            show: true,
            type: 'error',
            title: 'Invalid File Type',
            message: 'Some files were skipped. Only JPG, PNG, GIF, and WebP images are supported.',
            description: ''
          });
        }
        
        if (validFiles.length > 0) {
          console.log('📁 Valid files selected:', validFiles.length);
          console.log('📁 File details:', validFiles.map(f => ({ name: f.name, type: f.type, size: f.size })));
          
          // Clear previous previews and images
          imagePreviews.forEach(preview => {
            URL.revokeObjectURL(preview);
          });
          
          // Set new images and create new previews
          setForm(prev => ({
            ...prev,
            images: validFiles
          }));
          
          // Create previews for new images
          const newPreviews = validFiles.map(file => {
            try {
              const url = URL.createObjectURL(file);
              console.log('🖼️ Created preview URL for:', file.name, 'URL:', url);
              return url;
            } catch (error) {
              console.error('❌ Error creating object URL for:', file.name, error);
              return null;
            }
          }).filter(Boolean);
          
          console.log('🖼️ Created previews:', newPreviews.length);
          setImagePreviews(newPreviews);
        }
      } else {
        // If no files selected, clear everything
        imagePreviews.forEach(preview => {
          URL.revokeObjectURL(preview);
        });
        setImagePreviews([]);
        setForm(prev => ({
          ...prev,
          images: []
        }));
      }
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleEditChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "images") {
      const fileList = Array.from(files);
      if (fileList.length > 0) {
        setEditForm(prev => ({
          ...prev,
          images: [...(prev.images || []), ...fileList]
        }));
      }
    } else {
      setEditForm(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleEditExhibit = (exhibit) => {
    // Format dates for HTML date input (YYYY-MM-DD)
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    setEditForm({
      title: exhibit.title,
      description: exhibit.description,
      startDate: formatDateForInput(exhibit.startDate),
      endDate: formatDateForInput(exhibit.endDate),
      location: exhibit.location,
      curator: exhibit.curator,
      category: exhibit.category,
      images: []
    });
    setIsEditing(true);
  };

  const handleViewExhibit = (exhibit) => {
    setCurrentImageIndex(0);
    setModalExhibit(exhibit);
  };

  const handleUpdateExhibit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("description", editForm.description);
      formData.append("type", "exhibit");
      formData.append("startDate", editForm.startDate);
      formData.append("endDate", editForm.endDate);
      formData.append("location", editForm.location);
      formData.append("curator", editForm.curator);
      formData.append("category", editForm.category);
      if (editForm.images && editForm.images.length > 0) {
        editForm.images.forEach((image, index) => {
          formData.append("images", image);
        });
      }

      const res = await api.put(`/api/activities/${modalExhibit.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setNotification({
          show: true,
          type: 'success',
          title: 'Exhibit Updated Successfully!',
          message: 'Your exhibit details have been updated and saved.',
          description: ''
        });
        fetchExhibits();
        setIsEditing(false);
        setModalExhibit(null);
      } else {
        setNotification({
          show: true,
          type: 'error',
          title: 'Failed to Update Exhibit',
          message: 'There was an error updating the exhibit. Please try again.',
          description: ''
        });
      }
    } catch (err) {
      console.error("Error updating exhibit:", err);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error Updating Exhibit',
        message: 'An unexpected error occurred. Please try again.',
        description: ''
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const removeEditImage = (index) => {
    const newImages = [...editForm.images];
    newImages.splice(index, 1);
    setEditForm(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const removeExistingImage = (index) => {
    const newImages = [...modalExhibit.images];
    newImages.splice(index, 1);
    setModalExhibit(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const nextImage = () => {
    const images = modalExhibit.images || (modalExhibit.image ? [modalExhibit.image] : []);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    const images = modalExhibit.images || (modalExhibit.image ? [modalExhibit.image] : []);
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      imagePreviews.forEach(preview => {
        URL.revokeObjectURL(preview);
      });
    };
  }, [imagePreviews]);

  // Keyboard navigation for image slider
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!modalExhibit) return;
      
      const images = modalExhibit.images || (modalExhibit.image ? [modalExhibit.image] : []);
      if (images.length <= 1) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevImage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextImage();
      }
    };

    if (modalExhibit) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [modalExhibit, currentImageIndex]);

  const clearImages = () => {
    imagePreviews.forEach(preview => {
      URL.revokeObjectURL(preview);
    });
    setImagePreviews([]);
    setForm(prev => ({
      ...prev,
      images: []
    }));
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({
      title: "",
      description: "",
      images: [],
      startDate: "",
      endDate: "",
      location: "",
      curator: "",
      category: "",
    });
    clearImages();
  };

  const removeImage = (index) => {
    const newPreviews = [...imagePreviews];
    const newImages = [...form.images];
    
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    newImages.splice(index, 1);
    
    setImagePreviews(newPreviews);
    setForm(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const fetchExhibits = () => {
    api.get('/api/activities/exhibits')
      .then(res => {
        const data = res.data;
        console.log('📊 Fetched exhibits data:', data);
        const mapped = data.map(ex => ({
          ...ex,
          startDate: ex.start_date,
          endDate: ex.end_date,
          images: ex.images || [],
          image: ex.images && ex.images.length > 0 ? ex.images[0] : null, // Keep for backward compatibility
          location: ex.location,
          curator: ex.curator,
          category: ex.category,
          maxCapacity: ex.max_capacity || 50,
          currentRegistrations: ex.current_registrations || 0,
        }));
        console.log('📊 Mapped exhibits data:', mapped);
        setExhibits(mapped);
      })
      .catch((error) => {
        console.error('❌ Error fetching exhibits:', error);
        setExhibits([]);
      });
  };



  useEffect(() => {
    fetchExhibits();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.startDate ||
      !form.endDate ||
      !form.location.trim() ||
      !form.curator.trim() ||
      !form.category.trim()
    ) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Missing Required Fields',
        message: 'Please fill in all required fields before submitting.',
        description: ''
      });
      return;
    }

    setSubmitting(true);

    // Build FormData
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('type', 'exhibit');
    formData.append('start_date', form.startDate);
    formData.append('end_date', form.endDate);
    formData.append('location', form.location);
         formData.append('curator', form.curator);
     formData.append('category', form.category);
    if (form.images && form.images.length > 0) {
      form.images.forEach((image, index) => {
        formData.append('images', image);
      });
    }

    // Send to backend
    try {
      const res = await api.post('/api/activities', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data.success) {
        // Close modal first
        setShowModal(false);
        
        // Reset form
        setForm({
          title: "",
          description: "",
          images: [],
          startDate: "",
          endDate: "",
          location: "",
          curator: "",
          category: "",
        });
        clearImages();
        e.target.reset();
        
        // Refresh exhibits list
        fetchExhibits();
        
        // Show success notification
        setTimeout(() => {
          setNotification({
            show: true,
            type: 'success',
            title: 'Success!',
            message: 'Exhibit added successfully!',
            description: 'Your new exhibit has been added to the collection.'
          });
        }, 100);
      } else {
        setNotification({
          show: true,
          type: 'error',
          title: 'Error!',
          message: 'Failed to add exhibit.',
          description: res.data.message || 'Please check your input and try again.'
        });
      }
    } catch (err) {
      console.error('Error adding exhibit:', err);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error!',
        message: 'Error adding exhibit.',
        description: err.response?.data?.message || err.message || 'Please try again later.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const [deleteExhibitModal, setDeleteExhibitModal] = useState({ show: false, id: null });
  const handleDelete = async (id) => {
    setDeleteExhibitModal({ show: true, id: id });
  };
  const confirmDeleteExhibit = async () => {
    if (!deleteExhibitModal.id) return;
    
    try {
      console.log(`🗑️ Attempting to delete exhibit with ID: ${deleteExhibitModal.id}`);
      
      const response = await api.delete(`/api/activities/${deleteExhibitModal.id}`);
      
      console.log('🗑️ Delete response:', response.data);
      
      if (response.data.success) {
        // Remove from local state
        setExhibits(exhibits.filter((item) => item.id !== deleteExhibitModal.id));
        
        // Show success notification
        setNotification({
          show: true,
          type: 'success',
          title: 'Success!',
          message: 'Exhibit deleted successfully!',
          description: 'The exhibit and all its associated data have been removed from the collection.'
        });
        
        console.log(`✅ Successfully deleted exhibit ${deleteExhibitModal.id}`);
      } else {
        console.error('❌ Delete failed:', response.data);
        setNotification({
          show: true,
          type: 'error',
          title: 'Error!',
          message: 'Failed to delete exhibit.',
          description: response.data.error || 'Please try again later.'
        });
      }
    } catch (error) {
      console.error('❌ Error deleting exhibit:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error!',
        message: 'Error deleting exhibit.',
        description: error.response?.data?.error || error.message || 'Network error. Please check your connection and try again.'
      });
    } finally {
      setDeleteExhibitModal({ show: false, id: null });
    }
  };

  // Categorize exhibits
  const now = new Date();
  const upcoming = exhibits.filter(
    (ex) => new Date(ex.startDate) > now
  );
  const ongoing = exhibits.filter(
    (ex) => new Date(ex.startDate) <= now && new Date(ex.endDate) >= now
  );
  const history = exhibits.filter(
    (ex) => new Date(ex.endDate) < now
  );
  
  // Calculate stats
  const totalExhibits = exhibits.length;
  const upcomingCount = upcoming.length;
  const ongoingCount = ongoing.length;
  const pastCount = history.length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 font-telegraf text-[#351E10]">
              <i className="fa-solid fa-eye mr-3 text-[#E5B80B]"></i>
              Exhibit Management
            </h1>
            <p className="text-sm md:text-base font-lora text-[#351E10]">Create and manage museum exhibits and collections</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 md:px-6 py-2 md:py-3 rounded-lg transition-colors font-semibold shadow-md text-sm md:text-base bg-[#E5B80B] text-[#351E10] font-telegraf hover:bg-[#D4AF37]"
            onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
          >
            <i className="fa-solid fa-plus mr-2"></i>
            Add Exhibit
          </button>
        </div>
      </div>


      {/* Add Exhibit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[98vh] sm:max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="relative p-8" style={{background: 'linear-gradient(135deg, #351E10 0%, #2A1A0D 50%, #1A0F08 100%)'}}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E5B80B]/10 to-transparent"></div>
              <div className="relative flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                    <i className="fa-solid fa-plus-circle text-2xl text-white"></i>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      Create New Exhibit
                    </h2>
                    <p className="text-[#E5B80B] text-sm mt-1" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      Add a new exhibit to showcase in your museum
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center justify-center group"
                >
                  <svg className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-8 bg-gradient-to-br from-gray-50 to-white">
                <form id="exhibit-form" onSubmit={handleSubmit} className="space-y-8">
                  {/* Basic Information Section */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                        <i className="fa-solid fa-info text-white text-lg"></i>
                      </div>
                      <h3 className="text-xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Basic Information</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-heading mr-2" style={{color: '#E5B80B'}}></i>
                          Title *
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={form.title}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                          placeholder="Enter exhibit title"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-tag mr-2" style={{color: '#E5B80B'}}></i>
                          Category *
                        </label>
                        <select
                          name="category"
                          value={form.category}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        >
                          <option value="">Select Category</option>
                          <option value="Cultural History">Cultural History</option>
                          <option value="Art">Art</option>
                          <option value="Archaeology">Archaeology</option>
                          <option value="Science">Science</option>
                          <option value="Natural History">Natural History</option>
                          <option value="Modern Art">Modern Art</option>
                          <option value="History">History</option>
                          <option value="Technology">Technology</option>
                          <option value="Photography">Photography</option>
                          <option value="Sculpture">Sculpture</option>
                          <option value="Textiles">Textiles</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                        <i className="fa-solid fa-align-left text-white text-lg"></i>
                      </div>
                      <h3 className="text-xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Content Details</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-align-left mr-2" style={{color: '#E5B80B'}}></i>
                          Description *
                        </label>
                        <textarea
                          name="description"
                          value={form.description}
                          onChange={handleChange}
                          required
                          rows={4}
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white resize-none"
                          placeholder="Enter exhibit description"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Schedule Section */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                        <i className="fa-solid fa-calendar text-white text-lg"></i>
                      </div>
                      <h3 className="text-xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Schedule & Location</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-calendar-plus mr-2" style={{color: '#E5B80B'}}></i>
                          Start Date *
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          value={form.startDate}
                          onChange={handleChange}
                          required
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-calendar-minus mr-2" style={{color: '#E5B80B'}}></i>
                          End Date *
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          value={form.endDate}
                          onChange={handleChange}
                          required
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-map-marker-alt mr-2" style={{color: '#E5B80B'}}></i>
                          Location *
                        </label>
                        <input
                          type="text"
                          name="location"
                          value={form.location}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                          placeholder="e.g., Gallery A, Main Hall"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-user-tie mr-2" style={{color: '#E5B80B'}}></i>
                          Curator *
                        </label>
                        <input
                          type="text"
                          name="curator"
                          value={form.curator}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                          placeholder="Enter curator name"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Media Section */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                        <i className="fa-solid fa-images text-white text-lg"></i>
                      </div>
                      <h3 className="text-xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Media & Images</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-upload mr-2" style={{color: '#E5B80B'}}></i>
                          Upload Images (Optional)
                        </label>
                        <input
                          type="file"
                          name="images"
                          accept="image/*"
                          multiple
                          onChange={handleChange}
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#E5B80B] file:text-white hover:file:bg-[#D4AF37]"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                        <p className="text-sm text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-info-circle mr-1"></i>
                          Supported formats: JPG, PNG, GIF, WebP. You can select multiple images.
                        </p>
                      </div>

                      {/* New Images Preview */}
                      {imagePreviews.length > 0 && (
                        <div className="space-y-4">
                          {console.log('🖼️ Rendering image previews:', imagePreviews.length, imagePreviews)}
                          <div className="flex justify-between items-center">
                            <h4 className="text-lg font-semibold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                              New Images Preview ({imagePreviews.length})
                            </h4>
                            <button
                              type="button"
                              onClick={clearImages}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                              style={{fontFamily: 'Telegraf, sans-serif'}}
                            >
                              <i className="fa-solid fa-times mr-2"></i>
                              Remove All
                            </button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {imagePreviews.map((preview, index) => (
                              <div key={index} className="relative group">
                                <div className="w-full h-32 bg-gray-100 rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden relative">
                                  <img
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onLoad={(e) => {
                                      console.log('✅ Image loaded successfully:', preview);
                                      e.target.style.display = 'block';
                                    }}
                                    onError={(e) => {
                                      console.error('❌ Image failed to load:', preview);
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center" style={{display: 'none'}}>
                                    <i className="fa-solid fa-image text-2xl text-gray-400"></i>
                                  </div>
                                  <div className="absolute bottom-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                                    New
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-lg"
                                >
                                  <i className="fa-solid fa-times"></i>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
                
                {/* Action Buttons - Directly below form content */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2 sm:py-2 md:py-3 rounded-lg font-semibold transition-colors shadow-md text-sm sm:text-sm md:text-base order-1 sm:order-1"
                    style={{backgroundColor: '#6B7280', color: 'white', fontFamily: 'Telegraf, sans-serif'}}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#4B5563'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#6B7280'}
                  >
                    <i className="fa-solid fa-times mr-2"></i>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="exhibit-form"
                    disabled={submitting}
                    className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2 sm:py-2 md:py-3 rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-sm md:text-base order-2 sm:order-2"
                    style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
                  >
                    {submitting ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                        Creating Exhibit...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-plus mr-2"></i>
                        Create Exhibit
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#E5B80B'}}>
              <i className="fa-solid fa-palette text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Total Exhibits</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}>{exhibits.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#351E10'}}>
              <i className="fa-solid fa-play text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Ongoing</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>{ongoingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#E5B80B'}}>
              <i className="fa-solid fa-history text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Past</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}>{pastCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#351E10'}}>
              <i className="fa-solid fa-clock text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Upcoming</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>{upcomingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-2 sm:space-x-4 md:space-x-8 px-2 sm:px-4 md:px-6">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-2 sm:py-3 md:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm md:text-base transition-colors ${
                activeTab === 'upcoming'
                  ? 'border-[#AB8841] text-[#AB8841]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fa-solid fa-calendar-plus mr-1 sm:mr-2"></i>
              <span style={{fontFamily: 'Telegraf, sans-serif'}}>Upcoming ({upcomingCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('ongoing')}
              className={`py-2 sm:py-3 md:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm md:text-base transition-colors ${
                activeTab === 'ongoing'
                  ? 'border-[#AB8841] text-[#AB8841]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fa-solid fa-play mr-1 sm:mr-2"></i>
              <span style={{fontFamily: 'Telegraf, sans-serif'}}>Ongoing ({ongoingCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 sm:py-3 md:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm md:text-base transition-colors ${
                activeTab === 'history'
                  ? 'border-[#AB8841] text-[#AB8841]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fa-solid fa-history mr-1 sm:mr-2"></i>
              <span style={{fontFamily: 'Telegraf, sans-serif'}}>History ({pastCount})</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-2 sm:p-4 md:p-6">
          {activeTab === 'upcoming' && (
            <div>
              {upcoming.length > 0 ? (
                                 <ExhibitSection data={upcoming} onDelete={handleDelete} onView={handleViewExhibit} onEdit={handleEditExhibit} />
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <i className="fa-solid fa-calendar-plus text-3xl text-emerald-500"></i>
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>No Upcoming Exhibits</h3>
                  <p className="text-gray-500 mb-6" style={{fontFamily: 'Telegraf, sans-serif'}}>No exhibits are scheduled for the future</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    style={{fontFamily: 'Telegraf, sans-serif'}}
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span>Add First Exhibit</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ongoing' && (
            <div>
              {ongoing.length > 0 ? (
                                 <ExhibitSection data={ongoing} onDelete={handleDelete} onView={handleViewExhibit} onEdit={handleEditExhibit} />
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <i className="fa-solid fa-play text-3xl text-blue-500"></i>
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>No Ongoing Exhibits</h3>
                  <p className="text-gray-500 mb-6" style={{fontFamily: 'Telegraf, sans-serif'}}>No exhibits are currently running</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    style={{fontFamily: 'Telegraf, sans-serif'}}
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span>Add New Exhibit</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {history.length > 0 ? (
                                 <ExhibitSection data={history} faded onDelete={handleDelete} onView={handleViewExhibit} onEdit={handleEditExhibit} />
              ) : (
                <div className="text-center py-8 md:py-12">
                  <i className="fa-solid fa-history text-4xl md:text-6xl mb-4 text-gray-300"></i>
                  <h3 className="text-lg md:text-xl font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>No Past Exhibits</h3>
                  <p className="text-sm md:text-base text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>No exhibits have been completed yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Show this only when there are no exhibits at all */}
      {exhibits.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
          <div className="text-center py-8 md:py-12">
            <i className="fa-solid fa-eye text-4xl md:text-6xl mb-4 text-gray-300"></i>
            <h3 className="text-lg md:text-xl font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>No Exhibits Found</h3>
            <p className="text-sm md:text-base text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>Start by adding your first exhibit using the "Add Exhibit" button above</p>
          </div>
        </div>
      )}

      {/* Modal for viewing details */}
      {modalExhibit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden">
            {/* Modern Header with Museum Branding */}
            <div className="relative bg-gradient-to-r from-[#E5B80B] to-[#351E10] p-4 sm:p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-image text-white text-xl sm:text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-2xl font-bold text-white break-words" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      Exhibit Details
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full text-white bg-white/20 backdrop-blur-sm">
                        {new Date(modalExhibit.startDate) > new Date() ? 'Upcoming' : new Date(modalExhibit.endDate) < new Date() ? 'Past' : 'Ongoing'}
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full text-white bg-white/20 backdrop-blur-sm">
                        Exhibit
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setModalExhibit(null)}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0"
                >
                  <i className="fa-solid fa-times text-sm sm:text-base"></i>
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(98vh-120px)] sm:max-h-[calc(95vh-120px)]">
              <div className="p-4 sm:p-6">
                {!isEditing ? (
                  /* View Mode */
                  <div className="space-y-6 sm:space-y-8">
                    {/* Row 1: Centered Image and Title */}
                    <div className="text-center">
                      {/* Exhibit Images Slider */}
                      <div className="mb-4 sm:mb-6">
                        {(() => {
                          const images = modalExhibit.images || (modalExhibit.image ? [modalExhibit.image] : []);
                          
                          if (images.length === 0) {
                            return (
                              <div className="w-full max-w-md h-64 sm:h-80 bg-gray-200 rounded-xl flex items-center justify-center mx-auto">
                                <i className="fa-solid fa-image text-6xl text-gray-400"></i>
                              </div>
                            );
                          }

                          return (
                            <div className="relative max-w-2xl mx-auto">
                              {/* Main Image Display */}
                              <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-100">
                                <img
                                  src={`http://localhost:3000${images[currentImageIndex]}`}
                                  alt={`${modalExhibit.title} - Image ${currentImageIndex + 1}`}
                                  className="w-full h-64 sm:h-80 object-contain"
                                  onError={(e) => {
                                    console.error('❌ Image failed to load:', images[currentImageIndex]);
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="w-full h-64 sm:h-80 bg-gray-200 flex items-center justify-center" style={{display: 'none'}}>
                                  <i className="fa-solid fa-image text-6xl text-gray-400"></i>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                
                                {/* Navigation Arrows */}
                                {images.length > 1 && (
                                  <>
                                    <button
                                      onClick={prevImage}
                                      className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200"
                                    >
                                      <i className="fa-solid fa-chevron-left"></i>
                                    </button>
                                    <button
                                      onClick={nextImage}
                                      className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200"
                                    >
                                      <i className="fa-solid fa-chevron-right"></i>
                                    </button>
                                  </>
                                )}
                                
                                {/* Image Counter */}
                                {images.length > 1 && (
                                  <div className="absolute top-4 right-4 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                                    {currentImageIndex + 1} / {images.length}
                </div>
              )}
                              </div>
                              
                              {/* Thumbnail Navigation */}
                              {images.length > 1 && (
                                <div className="flex justify-center mt-4 space-x-2">
                                  {images.map((image, index) => (
                                    <button
                                      key={index}
                                      onClick={() => goToImage(index)}
                                      className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                        index === currentImageIndex 
                                          ? 'border-[#E5B80B] shadow-lg' 
                                          : 'border-gray-300 hover:border-gray-400'
                                      }`}
                                    >
                                      <img
                                        src={`http://localhost:3000${image}`}
                                        alt={`Thumbnail ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          console.error('❌ Thumbnail failed to load:', image);
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                      <div className="w-full h-full bg-gray-200 flex items-center justify-center" style={{display: 'none'}}>
                                        <i className="fa-solid fa-image text-lg text-gray-400"></i>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Exhibit Title */}
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                        {modalExhibit.title}
                      </h1>

                    </div>

                    {/* Row 2: Exhibit Information and Description */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                      {/* Left: Exhibit Information Card */}
                      <div className="bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-xl p-4 sm:p-6 border border-gray-200 h-full">
                        <h4 className="text-base sm:text-lg font-bold mb-4" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-info-circle mr-2" style={{color: '#E5B80B'}}></i>
                          Exhibit Information
                        </h4>
                        
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-[#E5B80B] rounded-lg flex items-center justify-center flex-shrink-0">
                              <i className="fa-solid fa-calendar text-white text-sm"></i>
                            </div>
                  <div>
                              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Range</p>
                              <p className="text-sm sm:text-base font-semibold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                                {formatDate(modalExhibit.startDate)} - {formatDate(modalExhibit.endDate)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-[#E5B80B] rounded-lg flex items-center justify-center flex-shrink-0">
                              <i className="fa-solid fa-map-marker-alt text-white text-sm"></i>
                  </div>
                  <div>
                              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</p>
                              <p className="text-sm sm:text-base font-semibold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      {modalExhibit.location}
                    </p>
                  </div>
                          </div>

                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-[#E5B80B] rounded-lg flex items-center justify-center flex-shrink-0">
                              <i className="fa-solid fa-tag text-white text-sm"></i>
                  </div>
                  <div>
                              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</p>
                              <p className="text-sm sm:text-base font-semibold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                                {modalExhibit.category}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-[#E5B80B] rounded-lg flex items-center justify-center flex-shrink-0">
                              <i className="fa-solid fa-user text-white text-sm"></i>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Curator</p>
                              <p className="text-sm sm:text-base font-semibold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      {modalExhibit.curator}
                    </p>
                  </div>
                </div>
                        </div>
                      </div>

                      {/* Right: Description Card */}
                      <div className="bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-xl p-4 sm:p-6 border border-gray-200 h-full">
                        <h4 className="text-base sm:text-lg font-bold mb-4" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-align-left mr-2" style={{color: '#E5B80B'}}></i>
                          Description
                        </h4>
                        <p className="text-sm sm:text-base leading-relaxed text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          {modalExhibit.description}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => setModalExhibit(null)}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 hover:shadow-md"
                        style={{fontFamily: 'Telegraf, sans-serif'}}
                      >
                        <i className="fa-solid fa-times mr-2"></i>
                        Close
                      </button>
                      <button
                        onClick={() => handleEditExhibit(modalExhibit)}
                        className="px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                        style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
                      >
                        <i className="fa-solid fa-edit mr-2"></i>
                        Edit Exhibit
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Edit Mode */
                  <form onSubmit={handleUpdateExhibit} className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-xl sm:text-2xl font-bold mb-6" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                        Edit Exhibit
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div className="space-y-4">
                  <div>
                          <label className="block text-sm font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                            Title *
                          </label>
                          <input
                            type="text"
                            name="title"
                            value={editForm.title || ''}
                            onChange={handleEditChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B]"
                            required
                          />
                  </div>

                  <div>
                          <label className="block text-sm font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                            Start Date *
                          </label>
                          <input
                            type="date"
                            name="startDate"
                            value={editForm.startDate || ''}
                            onChange={handleEditChange}
                            min={modalExhibit && new Date(modalExhibit.startDate) < new Date() ? '' : new Date().toISOString().split('T')[0]}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B]"
                            required
                          />
                  </div>

                  <div>
                          <label className="block text-sm font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                            End Date *
                          </label>
                          <input
                            type="date"
                            name="endDate"
                            value={editForm.endDate || ''}
                            onChange={handleEditChange}
                            min={modalExhibit && new Date(modalExhibit.startDate) < new Date() ? '' : new Date().toISOString().split('T')[0]}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B]"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                            Location *
                          </label>
                          <input
                            type="text"
                            name="location"
                            value={editForm.location || ''}
                            onChange={handleEditChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B]"
                            required
                          />
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                            Curator *
                          </label>
                          <input
                            type="text"
                            name="curator"
                            value={editForm.curator || ''}
                            onChange={handleEditChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B]"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                            Category *
                          </label>
                          <select
                            name="category"
                            value={editForm.category || ''}
                            onChange={handleEditChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B]"
                            required
                          >
                            <option value="">Select Category</option>
                            <option value="Cultural History">Cultural History</option>
                            <option value="Art">Art</option>
                            <option value="Archaeology">Archaeology</option>
                            <option value="Natural History">Natural History</option>
                            <option value="Science">Science</option>
                            <option value="Technology">Technology</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                            Description *
                          </label>
                          <textarea
                            name="description"
                            value={editForm.description || ''}
                            onChange={handleEditChange}
                            rows="4"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B]"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                            Images
                          </label>
                          
                          {/* Current Images Preview */}
                          {modalExhibit.images && modalExhibit.images.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-600 mb-2" style={{fontFamily: 'Telegraf, sans-serif'}}>Current Images ({modalExhibit.images.length}):</p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {modalExhibit.images.map((image, index) => (
                                  <div key={index} className="relative">
                                    <img
                                      src={`http://localhost:3000${image}`}
                                      alt={`Current image ${index + 1}`}
                                      className="w-full h-24 object-cover rounded-lg border border-gray-300"
                                      onError={(e) => {
                                        console.error('❌ Edit form current image failed to load:', image);
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                    <div className="w-full h-24 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center" style={{display: 'none'}}>
                                      <i className="fa-solid fa-image text-lg text-gray-400"></i>
                                    </div>
                                    <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
                                      {index + 1}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeExistingImage(index)}
                                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                      title="Delete this image"
                                    >
                                      <i className="fa-solid fa-times"></i>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Fallback for single image */}
                          {(!modalExhibit.images || modalExhibit.images.length === 0) && modalExhibit.image && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-600 mb-2" style={{fontFamily: 'Telegraf, sans-serif'}}>Current Image:</p>
                              <div className="relative w-full max-w-xs">
                                <img
                                  src={`http://localhost:3000${modalExhibit.image}`}
                                  alt="Current exhibit image"
                                  className="w-full h-32 object-cover rounded-lg border border-gray-300"
                                  onError={(e) => {
                                    console.error('❌ Edit form single image failed to load:', modalExhibit.image);
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="w-full h-32 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center" style={{display: 'none'}}>
                                  <i className="fa-solid fa-image text-lg text-gray-400"></i>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setModalExhibit(prev => ({ ...prev, image: null }))}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                  title="Delete this image"
                                >
                                  <i className="fa-solid fa-times"></i>
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* New Images Upload */}
                          <div>
                            <p className="text-xs text-gray-600 mb-2" style={{fontFamily: 'Telegraf, sans-serif'}}>
                              Upload additional images:
                            </p>
                            <input
                              type="file"
                              name="images"
                              onChange={handleEditChange}
                              accept="image/*"
                              multiple
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5B80B]"
                            />
                  </div>
                          
                          {/* New Images Preview */}
                          {editForm.images && editForm.images.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-600 mb-2" style={{fontFamily: 'Telegraf, sans-serif'}}>New Images Preview ({editForm.images.length}):</p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {editForm.images.map((image, index) => (
                                  <div key={index} className="relative">
                                    <img
                                      src={URL.createObjectURL(image)}
                                      alt={`New image preview ${index + 1}`}
                                      className="w-full h-24 object-cover rounded-lg border border-gray-300"
                                    />
                                    <div className="absolute bottom-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                                      New
                </div>
                                    <button
                                      type="button"
                                      onClick={() => removeEditImage(index)}
                                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                    >
                                      <i className="fa-solid fa-times"></i>
                                    </button>
              </div>
                                ))}
            </div>
          </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 hover:shadow-md"
                        style={{fontFamily: 'Telegraf, sans-serif'}}
                      >
                        <i className="fa-solid fa-times mr-2"></i>
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50"
                        style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
                      >
                        <i className="fa-solid fa-save mr-2"></i>
                        {submitting ? 'Updating...' : 'Update Exhibit'}
                      </button>
                    </div>
                  </form>
                )}
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

      {/* Delete Exhibit Modal */}
      {deleteExhibitModal.show && (
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
                Delete Exhibit
              </h3>
              <p className="text-gray-600 text-lg mb-2" style={{fontFamily: 'Telegraf, sans-serif'}}>
                Are you sure you want to delete this exhibit?
              </p>
              <p className="text-gray-600 text-lg mb-2" style={{fontFamily: 'Telegraf, sans-serif'}}>
                This action cannot be undone.
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="px-8 pb-8 flex gap-4">
              <button
                onClick={()=>setDeleteExhibitModal({ show:false, id:null })}
                className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                style={{fontFamily: 'Telegraf, sans-serif'}}
              >
                <i className="fa-solid fa-times mr-2"></i>
                Cancel
              </button>
              <button
                onClick={confirmDeleteExhibit}
                className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                style={{background: 'linear-gradient(135deg, #8B6B21 0%, #D4AF37 100%)', color: 'white', fontFamily: 'Telegraf, sans-serif'}}
              >
                <i className="fa-solid fa-check mr-2"></i>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Section Component
const ExhibitSection = ({ data, onDelete, onView, faded }) => {
  const getExhibitStatus = (exhibit) => {
    const now = new Date();
    const startDate = new Date(exhibit.startDate);
    const endDate = new Date(exhibit.endDate);
    
    if (startDate > now) return { status: 'Up', color: 'bg-green-500' };
    if (endDate < now) return { status: 'Past', color: 'bg-orange-500' };
    return { status: 'Ongoing', color: 'bg-blue-500' };
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
      {data.map((exhibit) => {
        const exhibitStatus = getExhibitStatus(exhibit);
        return (
          <div key={exhibit.id} className={`bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200${faded ? " opacity-70" : ""}`}>
            {/* Image Section */}
            <div className="relative">
              {exhibit.images && exhibit.images.length > 0 ? (
                <img
                  src={`http://localhost:3000${exhibit.images[0]}`}
                  alt={exhibit.title}
                  className="w-full aspect-square object-cover rounded-t-lg"
                  onError={(e) => {
                    console.error('❌ Exhibit card image failed to load:', exhibit.images[0]);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : exhibit.image ? (
                <img 
                  src={`http://localhost:3000${exhibit.image}`} 
                  alt={exhibit.title}
                  className="w-full aspect-square object-cover rounded-t-lg"
                  onError={(e) => {
                    console.error('❌ Exhibit single image failed to load:', exhibit.image);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                ) : (
                <div className="w-full aspect-square bg-gray-200 rounded-t-lg flex items-center justify-center">
                  <i className="fa-solid fa-image text-2xl text-gray-400"></i>
                </div>
                )}
              
              {/* Status Badges */}
              <div className="absolute top-1 left-1 flex flex-col gap-1">
                <span className={`px-1 py-0.5 text-xs font-semibold rounded-full text-white ${exhibitStatus.color}`}>
                  {exhibitStatus.status}
                </span>
                <span className="px-1 py-0.5 text-xs font-semibold rounded-full text-white bg-blue-500">
                  #{exhibit.id}
                </span>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-1.5 sm:p-2">
              {/* Category Badge */}
              <div className="mb-1">
                <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Exhibit
                </span>
              </div>

              {/* Title */}
              <h4 className="text-xs sm:text-sm font-bold mb-0.5 line-clamp-1" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                {exhibit.title}
              </h4>

              {/* Date Range */}
              <p className="text-xs mb-0.5" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                {new Date(exhibit.startDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })} - {new Date(exhibit.endDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>

              {/* Location */}
              <p className="text-xs mb-1" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                <span className="font-semibold">{exhibit.location || 'Museum Gallery'}</span>
              </p>

              {/* Action Buttons */}
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => onView(exhibit)}
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg flex items-center justify-center transition-colors"
                  title="View Exhibit"
                >
                  <i className="fa-solid fa-eye text-sm"></i>
                </button>
                
                {/* Show delete button for all exhibits (including history) */}
                <button
                  onClick={() => onDelete(exhibit.id)}
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-colors"
                  title="Delete Exhibit"
                >
                  <i className="fa-solid fa-trash text-sm"></i>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Exhibit;










