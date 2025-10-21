import React, { useState, useEffect } from "react";
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

const CATEGORY_OPTIONS = [
  "Artifact",
  "Painting",
  "Sculpture",
  "Manuscript",
  "Jewelry",
  "Textile",
  "Tool",
  "Weapon",
  "Other"
];

const CulturalObjects = () => {
  const [objects, setObjects] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    period: "",
    origin: "",
    material: "",
    condition_status: "good",
    acquisition_date: "",
    acquisition_method: "donation",
    current_location: "",
    estimated_value: "",
    conservation_notes: "",
    exhibition_history: "",
    images: [],
    // Dimension fields
    height: "",
    width: "",
    length: "",
    weight: "",
    dimension_unit: "cm",
    // Maintenance fields
    last_maintenance_date: "",
    next_maintenance_date: "",
    maintenance_frequency_months: "12",
    maintenance_notes: "",
    maintenance_priority: "medium",
    maintenance_cost: "",
    maintenance_reminder_enabled: true
  });
  const [modalObject, setModalObject] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [editingObject, setEditingObject] = useState(null);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    type: 'success',
    title: '',
    message: '',
    description: ''
  });
  const [confirmationModal, setConfirmationModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null
  });
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  const [showMaintenanceOverview, setShowMaintenanceOverview] = useState(false);
  

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
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
        
        console.log('📁 Valid files selected:', validFiles.length);
        console.log('📁 File details:', validFiles.map(f => ({ 
          name: f.name, 
          type: f.type, 
          size: f.size,
          isFile: f instanceof File,
          constructor: f.constructor.name
        })));
        
        // Ensure we have valid File objects
        const validFileObjects = validFiles.filter(file => file instanceof File);
        console.log('📁 Valid File objects:', validFileObjects.length);
        
        setForm((prev) => ({
          ...prev,
          images: validFileObjects,
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          images: [],
        }));
      }
    } else if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };


  const fetchObjects = async () => {
    try {
      console.log('🔄 Fetching objects from API...');
      const response = await api.get('/api/cultural-objects');
      console.log('📊 API response:', response.data);
      console.log('📊 Number of objects received:', response.data.length);
      console.log('📊 Current objects state before update:', objects.length);
      setObjects(response.data);
      console.log('✅ Objects state updated');
    } catch (err) {
      console.error('❌ Error fetching cultural objects:', err);
      setObjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenanceAlerts = async () => {
    try {
      const response = await api.get('/api/cultural-objects/maintenance/alerts');
      setMaintenanceAlerts(response.data);
    } catch (err) {
      console.error('Error fetching maintenance alerts:', err);
      setMaintenanceAlerts([]);
    }
  };

  const handleMaintenanceDone = async (objectId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Update maintenance status
      await api.put(`/api/cultural-objects/${objectId}/maintenance`, {
        last_maintenance_date: today,
        next_maintenance_date: null, // Will be calculated based on frequency
        maintenance_notes: 'Maintenance completed',
        maintenance_cost: null
      });

      setNotification({
        show: true,
        type: 'success',
        title: 'Maintenance Completed!',
        message: 'The maintenance has been marked as completed and the schedule has been reset.',
        description: ''
      });

      // Refresh the maintenance alerts
      fetchMaintenanceAlerts();
    } catch (err) {
      console.error('Error completing maintenance:', err);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error Completing Maintenance',
        message: 'There was an error marking the maintenance as completed. Please try again.',
        description: ''
      });
    }
  };

  useEffect(() => {
    fetchObjects();
    fetchMaintenanceAlerts();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      category: "",
      period: "",
      origin: "",
      material: "",
      condition_status: "good",
      acquisition_date: "",
      acquisition_method: "donation",
      current_location: "",
      estimated_value: "",
      conservation_notes: "",
      exhibition_history: "",
      images: [],
      // Dimension fields
      height: "",
      width: "",
      length: "",
      weight: "",
      dimension_unit: "cm",
      // Maintenance fields
      last_maintenance_date: "",
      next_maintenance_date: "",
      maintenance_frequency_months: "12",
      maintenance_notes: "",
      maintenance_priority: "medium",
      maintenance_cost: "",
      maintenance_reminder_enabled: true
    });
    setEditingObject(null);
    setShowAddModal(false);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setForm({
      name: "",
      description: "",
      category: "",
      period: "",
      origin: "",
      material: "",
      condition_status: "good",
      acquisition_date: "",
      acquisition_method: "donation",
      current_location: "",
      estimated_value: "",
      conservation_notes: "",
      exhibition_history: "",
      images: [],
      // Dimension fields
      height: "",
      width: "",
      length: "",
      weight: "",
      dimension_unit: "cm",
      // Maintenance fields
      last_maintenance_date: "",
      next_maintenance_date: "",
      maintenance_frequency_months: "12",
      maintenance_notes: "",
      maintenance_priority: "medium",
      maintenance_cost: "",
      maintenance_reminder_enabled: true
    });
    setEditingObject(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.description.trim() || !form.category.trim()) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Missing Required Fields',
        message: 'Please fill in all required fields (Name, Description, Category).',
        description: ''
      });
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    Object.keys(form).forEach(key => {
      if (key === 'images') {
        for (const file of form.images) {
          formData.append('images', file);
        }
      } else {
        formData.append(key, form[key]);
      }
    });
    
    // When editing, include information about existing images to keep
    if (editingObject && editingObject.images) {
      formData.append('existing_images', JSON.stringify(editingObject.images));
    }

    try {
      const url = editingObject 
        ? `/api/cultural-objects/${editingObject.id}`
        : '/api/cultural-objects';
      
      const method = editingObject ? 'PUT' : 'POST';
      
      const response = await api({
        method,
        url,
        data: formData,
      });
      
      if (response.data.success) {
        setNotification({
          show: true,
          type: 'success',
          title: editingObject ? 'Cultural Object Updated Successfully!' : 'Cultural Object Added Successfully!',
          message: editingObject ? 'Your cultural object has been updated and saved.' : 'Your cultural object has been added to the collection.',
          description: ''
        });
        resetForm();
        e.target.reset();
        fetchObjects();
        fetchMaintenanceAlerts();
      } else {
        setNotification({
          show: true,
          type: 'error',
          title: 'Failed to Save Cultural Object',
          message: 'There was an error saving the cultural object. Please try again.',
          description: ''
        });
      }
    } catch (err) {
      console.error('Error saving cultural object:', err);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error Saving Cultural Object',
        message: 'An unexpected error occurred. Please try again.',
        description: ''
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (object) => {
    console.log('✏️ Edit button clicked for object:', object);
    setEditingObject(object);
    setForm({
      name: object.name,
      description: object.description,
      category: object.category,
      period: object.period || "",
      origin: object.origin || "",
      material: object.material || "",
      condition_status: object.condition_status,
      acquisition_date: object.acquisition_date || "",
      acquisition_method: object.acquisition_method,
      current_location: object.current_location || "",
      estimated_value: object.estimated_value || "",
      conservation_notes: object.conservation_notes || "",
      exhibition_history: object.exhibition_history || "",
      images: [],
      // Dimension fields
      height: object.height || "",
      width: object.width || "",
      length: object.length || "",
      depth: object.depth || "",
      weight: object.weight || "",
      dimension_unit: object.dimension_unit || "cm",
      // Maintenance fields
      last_maintenance_date: object.last_maintenance_date || "",
      next_maintenance_date: object.next_maintenance_date || "",
      maintenance_frequency_months: object.maintenance_frequency_months || "12",
      maintenance_notes: object.maintenance_notes || "",
      maintenance_priority: object.maintenance_priority || "medium",
      maintenance_cost: object.maintenance_cost || "",
      maintenance_reminder_enabled: object.maintenance_reminder_enabled !== false
    });
    console.log('📝 Opening edit modal for object ID:', object.id);
    setShowAddModal(true);
  };

  const handleEditFromModal = (object) => {
    setEditingObject(object);
    setForm({
      name: object.name,
      description: object.description,
      category: object.category,
      period: object.period || "",
      origin: object.origin || "",
      material: object.material || "",
      condition_status: object.condition_status,
      acquisition_date: object.acquisition_date || "",
      acquisition_method: object.acquisition_method,
      current_location: object.current_location || "",
      estimated_value: object.estimated_value || "",
      conservation_notes: object.conservation_notes || "",
      exhibition_history: object.exhibition_history || "",
      images: object.images || [],
      // Dimension fields
      height: object.height || "",
      width: object.width || "",
      length: object.length || "",
      depth: object.depth || "",
      weight: object.weight || "",
      dimension_unit: object.dimension_unit || "cm",
      // Maintenance fields
      last_maintenance_date: object.last_maintenance_date || "",
      next_maintenance_date: object.next_maintenance_date || "",
      maintenance_frequency_months: object.maintenance_frequency_months || "12",
      maintenance_notes: object.maintenance_notes || "",
      maintenance_priority: object.maintenance_priority || "medium",
      maintenance_cost: object.maintenance_cost || "",
      maintenance_reminder_enabled: object.maintenance_reminder_enabled !== false
    });
    setIsEditingModal(true);
  };

  const handleCancelEditModal = () => {
    setIsEditingModal(false);
    setEditingObject(null);
    setForm({
      name: "",
      description: "",
      category: "",
      period: "",
      origin: "",
      material: "",
      condition_status: "good",
      acquisition_date: "",
      acquisition_method: "donation",
      current_location: "",
      estimated_value: "",
      conservation_notes: "",
      exhibition_history: "",
      images: [],
      // Dimension fields
      height: "",
      width: "",
      length: "",
      weight: "",
      dimension_unit: "cm",
      // Maintenance fields
      last_maintenance_date: "",
      next_maintenance_date: "",
      maintenance_frequency_months: "12",
      maintenance_notes: "",
      maintenance_priority: "medium",
      maintenance_cost: "",
      maintenance_reminder_enabled: true
    });
  };

  const handleImageChange = (e) => {
    const { name, files } = e.target;
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
        
        console.log('📁 Valid files selected:', validFiles.length);
        console.log('📁 File details:', validFiles.map(f => ({ 
          name: f.name, 
          type: f.type, 
          size: f.size,
          isFile: f instanceof File,
          constructor: f.constructor.name
        })));
        
        // Ensure we have valid File objects
        const validFileObjects = validFiles.filter(file => file instanceof File);
        console.log('📁 Valid File objects:', validFileObjects.length);
        
        setForm(prev => ({
          ...prev,
          images: validFileObjects,
        }));
      } else {
        setForm(prev => ({
          ...prev,
          images: [],
        }));
      }
    }
  };

  const handleEditImageChange = (e) => {
    const { name, files } = e.target;
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
        
        // Ensure we have valid File objects
        const validFileObjects = validFiles.filter(file => file instanceof File);
        
        // For editing, replace the current images with new ones
        setForm(prev => ({
          ...prev,
          images: validFileObjects,
        }));
      } else {
        setForm(prev => ({
          ...prev,
          images: [],
        }));
      }
    }
  };

  const removeImage = (index) => {
    console.log('🗑️ Removing image at index:', index);
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };


  // Carousel functions for the existing modal
  const nextModalImage = () => {
    if (modalObject && modalObject.images && modalObject.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % modalObject.images.length);
    }
  };

  const prevModalImage = () => {
    if (modalObject && modalObject.images && modalObject.images.length > 1) {
      setCurrentImageIndex((prev) => prev === 0 ? modalObject.images.length - 1 : prev - 1);
    }
  };

  const goToModalImage = (index) => {
    setCurrentImageIndex(index);
  };

  const handleDelete = async (id) => {
    console.log('🗑️ Delete button clicked for object ID:', id);
    setConfirmationModal({
      show: true,
      title: 'Delete Cultural Object',
      message: 'Are you sure you want to delete this cultural object? This action cannot be undone.',
      onConfirm: async () => {
        console.log('✅ Confirm button clicked - starting deletion process');
        setConfirmationModal({ show: false, title: '', message: '', onConfirm: null, onCancel: null });
        try {
          console.log('🗑️ Attempting to delete cultural object with ID:', id);
          console.log('🌐 Making API call to:', `/api/cultural-objects/${id}`);
          const response = await api.delete(`/api/cultural-objects/${id}`);
          console.log('✅ Delete response received:', response);
          console.log('📊 Response status:', response.status);
          console.log('📊 Response data:', response.data);
          console.log('📊 Response headers:', response.headers);
          
          if (response.status === 200 && response.data.success) {
            console.log('🎉 Deletion successful, updating UI...');
            // Directly update the state instead of refetching
            setObjects(objects.filter(obj => obj.cultural_object_id !== id));
            setNotification({
              show: true,
              type: 'success',
              title: 'Cultural Object Deleted Successfully!',
              message: 'The cultural object has been permanently removed from the collection.',
              description: ''
            });
            console.log('✅ Objects state updated directly');
          } else {
            console.log('❌ Deletion failed - unexpected response:', response);
            setNotification({
              show: true,
              type: 'error',
              title: 'Failed to Delete Cultural Object',
              message: 'There was an error deleting the cultural object. Please try again.',
              description: ''
            });
          }
        } catch (err) {
          console.error('❌ Error deleting cultural object:', err);
          console.error('❌ Error message:', err.message);
          console.error('❌ Error response:', err.response);
          console.error('❌ Error response data:', err.response?.data);
          console.error('❌ Error response status:', err.response?.status);
          console.error('❌ Error response headers:', err.response?.headers);
          console.error('❌ Full error object:', JSON.stringify(err, null, 2));
          
          // Handle 404 error specifically (object not found)
          if (err.response?.status === 404) {
            console.log('🔄 Object not found (404), refreshing data...');
            // Remove from local state and refresh data
            setObjects(objects.filter(obj => obj.id !== id));
            await fetchObjects(); // Refresh the data from server
            setNotification({
              show: true,
              type: 'warning',
              title: 'Object Already Deleted',
              message: 'This cultural object was already deleted. The list has been refreshed.',
              description: ''
            });
          } else {
            setNotification({
              show: true,
              type: 'error',
              title: 'Error Deleting Cultural Object',
              message: `There was an error deleting the cultural object: ${err.response?.data?.error || err.message}`,
              description: ''
            });
          }
        }
      },
      onCancel: () => {
        setConfirmationModal({ show: false, title: '', message: '', onConfirm: null, onCancel: null });
      }
    });
  };

  // Filter objects based on search term and category
  const filteredObjects = objects.filter(obj => {
    const matchesSearch = obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         obj.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         obj.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || obj.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = [...new Set(objects.map(obj => obj.category))];

  const getConditionBadge = (condition) => {
    const badges = {
      'excellent': 'bg-green-100 text-green-800 border border-green-200',
      'good': 'bg-blue-100 text-blue-800 border border-blue-200',
      'fair': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'poor': 'bg-red-100 text-red-800 border border-red-200',
      'under_restoration': 'bg-orange-100 text-orange-800 border border-orange-200'
    };
    return badges[condition] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-[#2e2b41]">
          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
          Loading cultural objects...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 font-telegraf text-[#351E10]">
              <i className="fa-solid fa-landmark mr-3 text-[#E5B80B]"></i>
              Cultural Objects
            </h1>
            <p className="text-gray-600 text-sm md:text-base font-lora">Manage museum artifacts and cultural items</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowMaintenanceOverview(!showMaintenanceOverview)}
              className="px-4 md:px-6 py-3 rounded-lg transition-colors font-semibold shadow-md text-sm md:text-base"
              style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
            >
              <i className="fa-solid fa-tools mr-2"></i>
              <span className="hidden sm:inline">{showMaintenanceOverview ? "Hide Maintenance" : "Maintenance Overview"}</span>
              <span className="sm:hidden">{showMaintenanceOverview ? "Hide" : "Maintenance"}</span>
              {maintenanceAlerts.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {maintenanceAlerts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 md:px-6 py-3 rounded-lg transition-colors font-semibold shadow-md text-sm md:text-base"
              style={{backgroundColor: '#351E10', color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2a170c'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#351E10'}
            >
              <i className="fa-solid fa-plus mr-2"></i>
              <span className="hidden sm:inline">Add Object</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Cultural Object Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[98vh] sm:max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="relative p-3 sm:p-4 md:p-8" style={{background: 'linear-gradient(135deg, #351E10 0%, #2A1A0D 50%, #1A0F08 100%)'}}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E5B80B]/10 to-transparent"></div>
              <div className="relative flex justify-between items-center">
                <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg sm:rounded-2xl flex items-center justify-center flex-shrink-0" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                    <i className="fa-solid fa-museum text-lg sm:text-xl md:text-2xl text-white"></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg md:text-3xl font-bold text-white truncate" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      {editingObject ? 'Edit Cultural Object' : 'Create New Object'}
                    </h2>
                    <p className="text-[#E5B80B] text-xs sm:text-sm mt-1 hidden sm:block" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      {editingObject ? 'Update object information' : 'Add a new cultural object to your collection'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeAddModal}
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center justify-center group flex-shrink-0 ml-2"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-8 bg-gradient-to-br from-gray-50 to-white">

          <form id="cultural-object-form" onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  placeholder="Enter object name"
                  required
                />
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  required
                >
                  <option value="">Select Category</option>
                  {CATEGORY_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[#2e2b41] font-semibold mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                rows="3"
                placeholder="Enter detailed description"
                required
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Period
                </label>
                <input
                  type="text"
                  name="period"
                  value={form.period}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  placeholder="e.g., Renaissance, Ancient Rome"
                />
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Origin
                </label>
                <input
                  type="text"
                  name="origin"
                  value={form.origin}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  placeholder="e.g., Italy, Egypt"
                />
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Material
                </label>
                <input
                  type="text"
                  name="material"
                  value={form.material}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  placeholder="e.g., Marble, Oil on Canvas"
                />
              </div>
            </div>

            {/* Dimensions Section */}
            <div className="border-t pt-6 mt-6">
              <h4 className="text-xl font-bold mb-4" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                <i className="fa-solid fa-ruler-combined mr-2" style={{color: '#E5B80B'}}></i>
                Dimensions
              </h4>
              
              <div className="grid md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">
                    Height ({form.dimension_unit || 'cm'})
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={form.height}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                    placeholder="e.g., 50"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">
                    Width ({form.dimension_unit || 'cm'})
                  </label>
                  <input
                    type="number"
                    name="width"
                    value={form.width}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                    placeholder="e.g., 30"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">
                    Length ({form.dimension_unit || 'cm'})
                  </label>
                  <input
                    type="number"
                    name="length"
                    value={form.length}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                    placeholder="e.g., 80"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">
                    Unit
                  </label>
                  <select
                    name="dimension_unit"
                    value={form.dimension_unit}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  >
                    <option value="cm">Centimeters (cm)</option>
                    <option value="in">Inches (in)</option>
                    <option value="m">Meters (m)</option>
                    <option value="ft">Feet (ft)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Condition Status
                </label>
                <select
                  name="condition_status"
                  value={form.condition_status}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                >
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={form.weight}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  placeholder="e.g., 5.5"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Acquisition Date
                </label>
                <input
                  type="date"
                  name="acquisition_date"
                  value={form.acquisition_date}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                />
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Acquisition Method
                </label>
                <select
                  name="acquisition_method"
                  value={form.acquisition_method}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  required
                >
                  <option value="purchase">Purchase</option>
                  <option value="donation">Donation</option>
                  <option value="loan">Loan</option>
                  <option value="excavation">Excavation</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Current Location
                </label>
                <input
                  type="text"
                  name="current_location"
                  value={form.current_location}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  placeholder="e.g., Gallery A, Storage Room 3"
                />
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Estimated Value ($)
                </label>
                <input
                  type="number"
                  name="estimated_value"
                  value={form.estimated_value}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  placeholder="e.g., 50000"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>


            <div>
              <label className="block text-[#2e2b41] font-semibold mb-2">
                Exhibition History
              </label>
              <textarea
                name="exhibition_history"
                value={form.exhibition_history}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                rows="2"
                placeholder="Previous exhibitions where this object was displayed..."
              />
            </div>

            {/* Simple Maintenance Section */}
            <div className="border-t pt-6 mt-6">
              <h4 className="text-xl font-bold mb-4" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                <i className="fa-solid fa-tools mr-2" style={{color: '#E5B80B'}}></i>
                Maintenance Reminder
              </h4>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">
                    Next Maintenance Date
                  </label>
                  <input
                    type="date"
                    name="next_maintenance_date"
                    value={form.next_maintenance_date}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  />
                </div>
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">
                    How Often? (months)
                  </label>
                  <select
                    name="maintenance_frequency_months"
                    value={form.maintenance_frequency_months}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  >
                    <option value="3">Every 3 months</option>
                    <option value="6">Every 6 months</option>
                    <option value="12">Every 12 months</option>
                    <option value="24">Every 24 months</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Conservation Notes
                </label>
                <textarea
                  name="conservation_notes"
                  value={form.conservation_notes}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  rows="2"
                  placeholder="Any conservation or restoration notes..."
                />
              </div>

              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="maintenance_reminder_enabled"
                    checked={form.maintenance_reminder_enabled}
                    onChange={handleChange}
                    className="mr-2 h-4 w-4 text-[#AB8841] focus:ring-[#AB8841] border-gray-300 rounded"
                  />
                  <span className="text-[#2e2b41] font-semibold">
                    Send me reminders for this object
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[#2e2b41] font-semibold mb-2">
                Images {editingObject ? '(Update existing images)' : '(optional, you can select multiple)'}
              </label>
              
              {/* Show current images when editing */}
              {editingObject && editingObject.images && editingObject.images.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Current Images:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {editingObject.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={`http://localhost:3000${image}`}
                          alt={`Current image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-300"
                        />
                        <div className="absolute inset-0 pointer-events-none group-hover:pointer-events-auto">
                          <button
                            type="button"
                            onClick={() => {
                              // Remove image from current images
                              const updatedImages = [...editingObject.images];
                              updatedImages.splice(index, 1);
                              setEditingObject(prev => ({ ...prev, images: updatedImages }));
                            }}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-all duration-200 pointer-events-auto"
                            title="Remove this image"
                          >
                            <i className="fa-solid fa-times"></i>
                          </button>
                        </div>
                        <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* File input for new images */}
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  {editingObject ? 'Add new images:' : 'Select images:'}
                </p>
                <input
                  type="file"
                  name="images"
                  accept="image/*"
                  multiple
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] bg-white text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: JPG, PNG, GIF, WebP. You can select multiple images.
                </p>
              </div>
              
              {/* Show preview of new images */}
              {form.images && form.images.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">New Images Preview:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {form.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="w-full h-24 bg-gray-100 rounded-lg border border-gray-300 overflow-hidden">
                          {(() => {
                            
                            try {
                              if (!(image instanceof File)) {
                                console.error('❌ Image is not a File object:', image);
                                return (
                                  <div className="w-full h-full bg-red-200 flex items-center justify-center">
                                    <i className="fa-solid fa-exclamation-triangle text-red-500"></i>
                                    <span className="text-xs ml-1">Not a File</span>
                                  </div>
                                );
                              }
                              
                              const imageUrl = URL.createObjectURL(image);
                              console.log('🖼️ Creating image preview with URL:', imageUrl);
                              console.log('🖼️ File details:', {
                                name: image.name,
                                type: image.type,
                                size: image.size
                              });
                              
                              // Test if the URL is valid by creating a test image
                              const testImg = new Image();
                              testImg.onload = () => {
                                console.log('✅ Test image loaded successfully, dimensions:', testImg.naturalWidth, 'x', testImg.naturalHeight);
                              };
                              testImg.onerror = () => {
                                console.error('❌ Test image failed to load');
                              };
                              testImg.src = imageUrl;
                              
                              return (
                                <img
                                  src={imageUrl}
                                  alt={`New image preview ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onLoad={(e) => {
                                    console.log('✅ Image loaded successfully!');
                                  }}
                                  onError={(e) => {
                                    console.error('❌ Image failed to load:', image.name);
                                  }}
                                />
                              );
                            } catch (error) {
                              console.error('❌ Error creating object URL:', error);
                              return (
                                <div className="w-full h-full bg-red-200 flex items-center justify-center">
                                  <i className="fa-solid fa-exclamation-triangle text-red-500"></i>
                                  <span className="text-xs ml-1">Error</span>
                                </div>
                              );
                            }
                          })()}
                          <div className="absolute bottom-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                            New
                          </div>
                        </div>
                        <div className="absolute inset-0 pointer-events-none group-hover:pointer-events-auto">
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-all duration-200 pointer-events-auto"
                            title="Remove this image"
                          >
                            <i className="fa-solid fa-times"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons - Directly below form content */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
              <button
                type="button"
                onClick={closeAddModal}
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
                form="cultural-object-form"
                disabled={submitting}
                className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2 sm:py-2 md:py-3 rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-sm md:text-base order-2 sm:order-2"
                style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
              >
                {submitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    {editingObject ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-plus mr-2"></i>
                    {editingObject ? 'Update Object' : 'Create Object'}
                  </>
                )}
              </button>
            </div>
          </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Overview */}
      {showMaintenanceOverview && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h3 className="text-2xl font-bold mb-6" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
            <i className="fa-solid fa-tools mr-3" style={{color: '#E5B80B'}}></i>
            Maintenance Overview
          </h3>
          
          {maintenanceAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fa-solid fa-check-circle text-4xl mb-4 text-green-500"></i>
              <p className="text-lg">No maintenance alerts at this time</p>
              <p className="text-sm">All objects are up to date with their maintenance schedule</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {maintenanceAlerts.map((alert) => (
                  <div key={alert.object_id} className={`p-4 rounded-lg border-l-4 ${
                    alert.alert_type === 'Overdue' 
                      ? 'bg-red-50 border-red-500' 
                      : 'bg-yellow-50 border-yellow-500'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#2e2b41]">{alert.object_name}</h4>
                        <p className="text-sm text-gray-600">{alert.category}</p>
                        <p className="text-sm font-medium mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            alert.alert_type === 'Overdue' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {alert.alert_type}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Due: {formatDate(alert.next_maintenance_date)}
                        </p>
                        {alert.days_until_maintenance < 0 && (
                          <p className="text-sm text-red-600 font-medium">
                            {Math.abs(alert.days_until_maintenance)} days overdue
                          </p>
                        )}
                        {alert.days_until_maintenance >= 0 && (
                          <p className="text-sm text-yellow-600 font-medium">
                            {alert.days_until_maintenance} days remaining
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMaintenanceDone(alert.object_id)}
                          className="text-green-600 hover:text-green-700 text-sm font-medium bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg transition-colors"
                        >
                          <i className="fa-solid fa-check mr-1"></i>
                          Done
                        </button>
                        <button
                          onClick={() => handleEdit(objects.find(obj => obj.id === alert.object_id))}
                          className="text-[#AB8841] hover:text-[#8B6B21] text-sm font-medium"
                        >
                          <i className="fa-solid fa-edit mr-1"></i>
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#E5B80B'}}>
              <i className="fa-solid fa-landmark text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Total Objects</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}>{objects.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#351E10'}}>
              <i className="fa-solid fa-exclamation-triangle text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Maintenance Alerts</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                {maintenanceAlerts.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#E5B80B'}}>
              <i className="fa-solid fa-check-circle text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Good Condition</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}>
                {objects.filter(obj => obj.condition_status === 'good').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#351E10'}}>
              <i className="fa-solid fa-tools text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Needs Maintenance</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                {objects.filter(obj => obj.condition_status === 'needs_maintenance').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200">
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          <div>
            <label className="block font-semibold mb-1 sm:mb-2 text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
              <i className="fa-solid fa-search mr-1 sm:mr-2" style={{color: '#E5B80B'}}></i>
              <span className="hidden sm:inline">Search Objects</span>
              <span className="sm:hidden">Search</span>
            </label>
            <input
              type="text"
              placeholder="Search by name, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-sm sm:text-base"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1 sm:mb-2 text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
              <i className="fa-solid fa-filter mr-1 sm:mr-2" style={{color: '#E5B80B'}}></i>
              <span className="hidden sm:inline">Filter by Category</span>
              <span className="sm:hidden">Filter</span>
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-sm sm:text-base"
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cultural Objects List */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#E5B80B] to-[#D4AF37]">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white font-telegraf">
            <i className="fa-solid fa-list mr-2"></i>
            Cultural Objects ({filteredObjects.length})
          </h3>
        </div>
        
        {filteredObjects.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <i className="fa-solid fa-landmark text-4xl mb-4 text-gray-300"></i>
            <p className="text-lg">No cultural objects found</p>
            <p className="text-sm">Add your first cultural object to get started</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
              {filteredObjects.map((object) => (
                <div key={object.id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => {
                  setModalObject(object);
                  setCurrentImageIndex(0);
                }}>
                  {/* Image Section */}
                  <div className="relative">
                    {object.images && object.images.length > 0 ? (
                      <img 
                        src={`http://localhost:3000${object.images[0]}`} 
                        alt={object.name} 
                        className="w-full aspect-[4/3] sm:aspect-square object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full aspect-[4/3] sm:aspect-square bg-gray-200 rounded-t-lg flex items-center justify-center">
                        <i className="fa-solid fa-image text-gray-400 text-4xl"></i>
                      </div>
                    )}
                    
                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${
                        object.condition_status === 'good' ? 'bg-blue-500' :
                        object.condition_status === 'fair' ? 'bg-yellow-500' :
                        object.condition_status === 'poor' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`}>
                        {object.condition_status === 'good' ? 'Good' :
                         object.condition_status === 'fair' ? 'Fair' :
                         object.condition_status === 'poor' ? 'Poor' :
                         'Unknown'}
                      </span>
                      {object.maintenance_reminder_enabled && object.next_maintenance_date && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${
                          new Date(object.next_maintenance_date) < new Date() ? 'bg-red-500' :
                          new Date(object.next_maintenance_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}>
                          {new Date(object.next_maintenance_date) < new Date() ? 'Overdue' :
                           new Date(object.next_maintenance_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'Due Soon' :
                           'Up to Date'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-1.5 sm:p-2 md:p-3">
                    {/* Category Badge */}
                    <div className="mb-1">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        {object.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm sm:text-base font-bold text-[#2e2b41] mb-1 line-clamp-1">
                      {object.name}
                    </h4>

                    {/* Period/Origin */}
                    <p className="text-xs sm:text-sm text-gray-600 mb-0.5">
                      {object.period && object.origin ? `${object.period}, ${object.origin}` :
                       object.period || object.origin || 'No period/origin specified'}
                    </p>

                    {/* Material */}
                    <p className="text-xs sm:text-sm text-gray-500 mb-0.5">
                      {object.material || 'Material not specified'}
                    </p>

                    {/* Location */}
                    <p className="text-xs text-gray-500 mb-2">
                      <i className="fa-solid fa-map-marker-alt mr-1"></i>
                      {object.current_location || 'Location not specified'}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalObject(object);
                          setCurrentImageIndex(0);
                        }}
                        className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg flex items-center justify-center transition-colors"
                        title="View Details"
                      >
                        <i className="fa-solid fa-eye text-sm"></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(object);
                        }}
                        className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg flex items-center justify-center transition-colors"
                        title="Edit Object"
                      >
                        <i className="fa-solid fa-edit text-sm"></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(object.cultural_object_id);
                        }}
                        className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-colors"
                        title="Delete Object"
                      >
                        <i className="fa-solid fa-trash text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modern Modal for viewing details */}
      {modalObject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden relative">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200" style={{backgroundColor: '#f8f9fa'}}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-3xl font-bold mb-2 break-words" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>{modalObject.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <span className="px-3 py-1 rounded-full text-sm font-medium" style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      {modalObject.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      modalObject.condition_status === 'excellent' ? 'bg-green-100 text-green-800' :
                      modalObject.condition_status === 'good' ? 'bg-blue-100 text-blue-800' :
                      modalObject.condition_status === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                      modalObject.condition_status === 'poor' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800'
                    }`} style={{fontFamily: 'Telegraf, sans-serif'}}>
                      {modalObject.condition_status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-blue-100" 
                    style={{backgroundColor: '#f1f3f4', color: '#351E10'}}
                    onClick={() => handleEditFromModal(modalObject)}
                    title="Edit Object"
                  >
                    <i className="fa-solid fa-edit text-lg"></i>
                  </button>
                  <button 
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-gray-200" 
                    style={{backgroundColor: '#f1f3f4', color: '#351E10'}}
                    onClick={() => setModalObject(null)}
                  >
                    <i className="fa-solid fa-times text-xl"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(98vh-120px)] sm:max-h-[calc(95vh-120px)]">
              <div className="p-4 sm:p-6">
                {/* Main Content Grid - Image Left, Info Right */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
                  {/* Left Column - Large Image */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-black mb-4 flex items-center">
                    <i className="fa-solid fa-images mr-3 text-[#AB8841]"></i>
                        Image
                      </h4>
                  {modalObject.images && modalObject.images.length > 0 ? (
                        <div className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                          <img 
                            src={`http://localhost:3000${modalObject.images[currentImageIndex]}?t=${Date.now()}`} 
                            alt={`${modalObject.name}`} 
                            className="w-full h-64 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              console.error('❌ Image failed to load:', modalObject.images[currentImageIndex], 'Full URL:', `http://localhost:3000${modalObject.images[currentImageIndex]}`);
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                            onLoad={(e) => {
                              console.log('✅ Image loaded successfully:', modalObject.images[currentImageIndex]);
                              e.target.style.display = 'block';
                              e.target.style.visibility = 'visible';
                              e.target.style.opacity = '1';
                              
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'none';
                                e.target.nextSibling.style.visibility = 'hidden';
                              }
                            }}
                            style={{backgroundColor: '#f3f4f6'}}
                          />
                          <div className="w-full h-64 sm:h-96 bg-gray-200 rounded-xl flex items-center justify-center" style={{display: 'none'}}>
                            <div className="text-center">
                              <i className="fa-solid fa-image text-gray-400 text-6xl mb-4"></i>
                              <p className="text-black text-lg">Image not found</p>
                            </div>
                          </div>
                          
                          {/* Navigation Arrows */}
                          {modalObject.images.length > 1 && (
                            <>
                              <button
                                onClick={prevModalImage}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                              >
                                <i className="fa-solid fa-chevron-left text-lg"></i>
                              </button>
                              <button
                                onClick={nextModalImage}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                              >
                                <i className="fa-solid fa-chevron-right text-lg"></i>
                              </button>
                            </>
                          )}
                          
                          {/* Image Counter */}
                          {modalObject.images.length > 1 && (
                            <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                              {currentImageIndex + 1} / {modalObject.images.length}
                            </div>
                          )}
                          
                          {/* Thumbnail Navigation */}
                          {modalObject.images.length > 1 && (
                            <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto">
                              {modalObject.images.map((image, index) => (
                                <button
                                  key={index}
                                  onClick={() => goToModalImage(index)}
                                  className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                    index === currentImageIndex
                                      ? 'border-white ring-2 ring-white/50'
                                      : 'border-white/50 hover:border-white'
                                  }`}
                                >
                                  <img
                                    src={`http://localhost:3000${image}`}
                                    alt={`Thumbnail ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                          
                    </div>
                  ) : (
                        <div className="w-full h-64 sm:h-96 bg-gray-200 rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        <i className="fa-solid fa-image text-gray-400 text-6xl mb-4"></i>
                            <p className="text-black font-medium text-lg">No images available</p>
                      </div>
                    </div>
                  )}
                    </div>
                </div>

                  {/* Right Column - Basic Information */}
                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                      <h4 className="text-base sm:text-lg font-bold text-black mb-4 flex items-center">
                        <i className="fa-solid fa-info-circle mr-3 text-[#AB8841]"></i>
                        Basic Information
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                          <span className="font-medium text-black">Period</span>
                          <span className="text-black font-semibold">{modalObject.period || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                          <span className="font-medium text-black">Origin</span>
                          <span className="text-black font-semibold">{modalObject.origin || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                          <span className="font-medium text-black">Material</span>
                          <span className="text-black font-semibold">{modalObject.material || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                          <span className="font-medium text-black">Acquisition Method</span>
                          <span className="text-black font-semibold capitalize">{modalObject.acquisition_method}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                          <span className="font-medium text-black">Current Location</span>
                          <span className="text-black font-semibold">{modalObject.current_location || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                          <span className="font-medium text-black">Acquisition Date</span>
                          <span className="text-black font-semibold">{formatDate(modalObject.acquisition_date)}</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="font-medium text-black">Estimated Value</span>
                          <span className="text-green-600 font-bold text-lg">{modalObject.estimated_value ? `$${modalObject.estimated_value}` : 'Not specified'}</span>
                        </div>
                        </div>
                      </div>

                    </div>
                  </div>

                {/* Description and Dimensions - Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
                  {/* Left Column - Description */}
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                    <h4 className="text-base sm:text-lg font-bold text-black mb-4 flex items-center">
                      <i className="fa-solid fa-align-left mr-3 text-[#AB8841]"></i>
                      Description
                    </h4>
                    <p className="text-black leading-relaxed text-base sm:text-lg">{modalObject.description || 'No description available'}</p>
                  </div>

                  {/* Right Column - Dimensions */}
                  {(modalObject.height || modalObject.width || modalObject.length || modalObject.weight) && (
                    <div className="bg-amber-50 rounded-xl p-4 sm:p-6">
                      <h4 className="text-base sm:text-lg font-bold text-black mb-4 flex items-center">
                        <i className="fa-solid fa-ruler-combined mr-3 text-amber-600"></i>
                        Dimensions & Measurements
                      </h4>
                      <div className="space-y-3">
                        {modalObject.height && (
                          <div className="flex justify-between items-center py-2 border-b border-amber-200">
                            <span className="font-medium text-black">Height</span>
                            <span className="text-black font-semibold">{modalObject.height} {modalObject.dimension_unit || 'cm'}</span>
                          </div>
                        )}
                        {modalObject.width && (
                          <div className="flex justify-between items-center py-2 border-b border-amber-200">
                            <span className="font-medium text-black">Width</span>
                            <span className="text-black font-semibold">{modalObject.width} {modalObject.dimension_unit || 'cm'}</span>
                          </div>
                        )}
                        {modalObject.length && (
                          <div className="flex justify-between items-center py-2 border-b border-amber-200">
                            <span className="font-medium text-black">Length</span>
                            <span className="text-black font-semibold">{modalObject.length} {modalObject.dimension_unit || 'cm'}</span>
                          </div>
                        )}
                        {modalObject.weight && (
                          <div className="flex justify-between items-center py-2">
                            <span className="font-medium text-black">Weight</span>
                            <span className="text-black font-semibold">{modalObject.weight} kg</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Conservation Notes and Exhibition History - Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {/* Left Column - Conservation Notes */}
                  <div className="bg-blue-50 rounded-xl p-4 sm:p-6">
                    <h4 className="text-base sm:text-lg font-bold text-black mb-4 flex items-center">
                        <i className="fa-solid fa-shield-halved mr-3 text-blue-600"></i>
                        Conservation Notes
                      </h4>
                      <p className="text-black leading-relaxed">{modalObject.conservation_notes || 'No conservation notes available'}</p>
                    </div>

                  {/* Right Column - Exhibition History */}
                  <div className="bg-purple-50 rounded-xl p-4 sm:p-6">
                    <h4 className="text-base sm:text-lg font-bold text-black mb-4 flex items-center">
                        <i className="fa-solid fa-calendar-days mr-3 text-purple-600"></i>
                        Exhibition History
                      </h4>
                      <p className="text-black leading-relaxed">{modalObject.exhibition_history || 'No exhibition history available'}</p>
                  </div>
                </div>

                {/* Maintenance Information - Only show if maintenance is enabled and scheduled */}
                {modalObject.maintenance_reminder_enabled && modalObject.next_maintenance_date && (
                  <div className="mt-6 sm:mt-8 rounded-xl p-4 sm:p-6" style={{backgroundColor: '#f8f9fa'}}>
                    <h4 className="text-base sm:text-xl font-bold mb-4 sm:mb-6 flex items-center" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      <i className="fa-solid fa-tools mr-3" style={{color: '#E5B80B'}}></i>
                      Maintenance Reminder
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                          <div className="flex items-center mb-2">
                          <i className="fa-solid fa-calendar-plus mr-2" style={{color: '#E5B80B'}}></i>
                          <span className="font-semibold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Next Maintenance</span>
                          </div>
                        <p className="font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>{formatDate(modalObject.next_maintenance_date)}</p>
                        </div>
                      {modalObject.maintenance_frequency_months && (
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                          <div className="flex items-center mb-2">
                            <i className="fa-solid fa-clock mr-2" style={{color: '#E5B80B'}}></i>
                            <span className="font-semibold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Frequency</span>
                          </div>
                          <p className="font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Every {modalObject.maintenance_frequency_months} months</p>
                        </div>
                      )}
                          </div>
                        </div>
                      )}
                          </div>
                        </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="relative p-8" style={{background: 'linear-gradient(135deg, #351E10 0%, #2A1A0D 50%, #1A0F08 100%)'}}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E5B80B]/10 to-transparent"></div>
              <div className="relative flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <i className="fa-solid fa-building text-2xl text-white"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      Edit Cultural Object
                    </h2>
                    <p className="text-white/80 text-sm mt-1" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      Update object information
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancelEditModal}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center justify-center group"
                >
                  <svg className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <form id="edit-cultural-object-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      Name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({...form, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      Category *
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({...form, category: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] bg-white"
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="Artifact">Artifact</option>
                      <option value="Weapon">Weapon</option>
                      <option value="Document">Document</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Tool">Tool</option>
                      <option value="Jewelry">Jewelry</option>
                      <option value="Ceramic">Ceramic</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                    Description *
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] bg-white"
                    required
                  />
                </div>

                {/* Additional Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      Period
                    </label>
                    <input
                      type="text"
                      value={form.period}
                      onChange={(e) => setForm({...form, period: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      Origin
                    </label>
                    <input
                      type="text"
                      value={form.origin}
                      onChange={(e) => setForm({...form, origin: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      Material
                    </label>
                    <input
                      type="text"
                      value={form.material}
                      onChange={(e) => setForm({...form, material: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      Condition Status
                    </label>
                    <select
                      value={form.condition_status}
                      onChange={(e) => setForm({...form, condition_status: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] bg-white"
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                      <option value="needs_restoration">Needs Restoration</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      Estimated Value
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.estimated_value}
                      onChange={(e) => setForm({...form, estimated_value: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] bg-white"
                    />
                  </div>
                </div>

                {/* Images Section */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                    Images (optional, you can select multiple)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] bg-white"
                  />
                  {form.images && form.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      {form.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={typeof image === 'string' ? `http://localhost:3000${image}` : URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                          >
                            <i className="fa-solid fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>
              
              {/* Action Buttons - Directly below form content */}
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={handleCancelEditModal}
                  className="px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold transition-colors shadow-md text-sm md:text-base"
                  style={{backgroundColor: '#6B7280', color: 'white', fontFamily: 'Telegraf, sans-serif'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#4B5563'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#6B7280'}
                >
                  <i className="fa-solid fa-times mr-2"></i>
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-cultural-object-form"
                  disabled={submitting}
                  className="px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                  style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
                >
                  {submitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-save mr-2"></i>
                      Update Object
                    </>
                  )}
                </button>
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

      {/* Custom Confirmation Modal */}
      {confirmationModal.show && (
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
                {confirmationModal.title}
              </h3>
              <p className="text-gray-600 text-lg mb-2" style={{fontFamily: 'Telegraf, sans-serif'}}>
                {confirmationModal.message}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="px-8 pb-8 flex gap-4">
              <button
                onClick={confirmationModal.onCancel}
                className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                style={{fontFamily: 'Telegraf, sans-serif'}}
              >
                <i className="fa-solid fa-times mr-2"></i>
                Cancel
              </button>
              <button
                onClick={confirmationModal.onConfirm}
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

export default CulturalObjects; 