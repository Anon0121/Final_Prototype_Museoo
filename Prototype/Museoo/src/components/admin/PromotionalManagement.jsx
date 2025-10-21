import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faTrash, faEye, faEyeSlash, faSearch, faFilter, 
  faSort, faGripVertical, faImage, faCalendar, faTag, faLink,
  faCheck, faTimes, faUpload, faDownload, faCopy, faShare
} from '@fortawesome/free-solid-svg-icons';
import api from '../../config/api';

const PromotionalManagement = () => {
  const [promotionalItems, setPromotionalItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('order');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const fileInputRef = useRef(null);
  
  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    type: 'success', // 'success', 'error', 'info'
    title: '',
    message: '',
    description: ''
  });
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    image: null,
    ctaText: '',
    ctaLink: '',
    badge: '',
    isActive: true,
    order: 0
  });

  useEffect(() => {
    fetchPromotionalItems();
  }, []);

  useEffect(() => {
    filterAndSortItems();
  }, [promotionalItems, searchTerm, filterStatus, sortBy, sortOrder]);

  const fetchPromotionalItems = async () => {
    try {
      const response = await api.get('/api/promotional');
      setPromotionalItems(response.data);
    } catch (error) {
      console.error('Error fetching promotional items:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Failed to Load Promotional Items',
        message: 'There was an error loading the promotional items. Please refresh the page.',
        description: 'Please check your internet connection and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortItems = () => {
    let filtered = [...promotionalItems];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.badge.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => 
        filterStatus === 'active' ? item.isActive : !item.isActive
      );
    }

    // Sort items
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'title' || sortBy === 'subtitle' || sortBy === 'badge') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredItems(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file' && files[0]) {
      const file = files[0];
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      if (editingItem) {
        await api.put(`/api/promotional/${editingItem.id}`, formDataToSend);
        setNotification({
          show: true,
          type: 'success',
          title: 'Promotional Item Updated Successfully!',
          message: 'Your promotional item has been updated and is now live.',
          description: `"${formData.title}" has been successfully updated.`
        });
      } else {
        await api.post('/api/promotional', formDataToSend);
        setNotification({
          show: true,
          type: 'success',
          title: 'Promotional Item Added Successfully!',
          message: 'Your new promotional item has been created and is now available.',
          description: `"${formData.title}" has been successfully added to the promotional items.`
        });
      }

      setShowModal(false);
      setEditingItem(null);
      resetForm();
      fetchPromotionalItems();
    } catch (error) {
      console.error('Error saving promotional item:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Failed to Save Promotional Item',
        message: 'There was an error saving your promotional item. Please try again.',
        description: 'Please check your internet connection and try again.'
      });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      image: null,
      ctaText: item.ctaText,
      ctaLink: item.ctaLink,
      badge: item.badge,
      isActive: item.isActive,
      order: item.order
    });
    setImagePreview(item.image ? `${api.defaults.baseURL}${item.image}` : null);
    setShowModal(true);
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  const handleBulkToggle = async (status) => {
    try {
      const promises = selectedItems.map(id => 
        api.patch(`/api/promotional/${id}`, { isActive: status })
      );
      await Promise.all(promises);
      setNotification({
        show: true,
        type: 'success',
        title: 'Bulk Update Successful!',
        message: `${selectedItems.length} promotional items have been ${status ? 'activated' : 'deactivated'}.`,
        description: `All selected items are now ${status ? 'visible' : 'hidden'} to visitors.`
      });
      setSelectedItems([]);
      fetchPromotionalItems();
    } catch (error) {
      console.error('Error bulk updating items:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Bulk Update Failed',
        message: 'There was an error updating some promotional items. Please try again.',
        description: 'Please check your internet connection and try again.'
      });
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} promotional items?`)) {
      try {
        const promises = selectedItems.map(id => 
          api.delete(`/api/promotional/${id}`)
        );
        await Promise.all(promises);
        setNotification({
          show: true,
          type: 'success',
          title: 'Bulk Delete Successful!',
          message: `${selectedItems.length} promotional items have been permanently removed.`,
          description: 'All selected items have been successfully deleted.'
        });
        setSelectedItems([]);
        fetchPromotionalItems();
      } catch (error) {
        console.error('Error bulk deleting items:', error);
        setNotification({
          show: true,
          type: 'error',
          title: 'Bulk Delete Failed',
          message: 'There was an error deleting some promotional items. Please try again.',
          description: 'Please check your internet connection and try again.'
        });
      }
    }
  };

  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) return;

    const newItems = [...filteredItems];
    const draggedItem = newItems[dragIndex];
    newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);

    // Update order values
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order: index
    }));

    try {
      const promises = updatedItems.map(item => 
        api.patch(`/api/promotional/${item.id}`, { order: item.order })
      );
      await Promise.all(promises);
      setNotification({
        show: true,
        type: 'success',
        title: 'Order Updated Successfully!',
        message: 'The promotional items have been reordered.',
        description: 'The new order has been saved and will be reflected immediately.'
      });
      fetchPromotionalItems();
    } catch (error) {
      console.error('Error reordering items:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Failed to Reorder Items',
        message: 'There was an error updating the order. Please try again.',
        description: 'Please check your internet connection and try again.'
      });
    }

    setDragIndex(null);
  };

  const handleDelete = async (id) => {
    const itemToDelete = promotionalItems.find(item => item.id === id);
    if (window.confirm('Are you sure you want to delete this promotional item?')) {
      try {
        await api.delete(`/api/promotional/${id}`);
        setNotification({
          show: true,
          type: 'success',
          title: 'Promotional Item Deleted Successfully!',
          message: 'The promotional item has been permanently removed.',
          description: `"${itemToDelete?.title || 'Item'}" has been successfully deleted.`
        });
        fetchPromotionalItems();
      } catch (error) {
        console.error('Error deleting promotional item:', error);
        setNotification({
          show: true,
          type: 'error',
          title: 'Failed to Delete Promotional Item',
          message: 'There was an error deleting the promotional item. Please try again.',
          description: 'Please check your internet connection and try again.'
        });
      }
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    const itemToToggle = promotionalItems.find(item => item.id === id);
    try {
      console.log('Toggling promotional item:', id, 'from', currentStatus, 'to', !currentStatus);
      const response = await api.patch(`/api/promotional/${id}`, { isActive: !currentStatus });
      console.log('Toggle response:', response.data);
      setNotification({
        show: true,
        type: 'success',
        title: 'Status Updated Successfully!',
        message: `"${itemToToggle?.title || 'Item'}" has been ${!currentStatus ? 'activated' : 'deactivated'}.`,
        description: `The item is now ${!currentStatus ? 'visible' : 'hidden'} to visitors.`
      });
      fetchPromotionalItems();
    } catch (error) {
      console.error('Error toggling promotional item status:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Failed to Update Status',
        message: 'There was an error updating the item status. Please try again.',
        description: 'Please check your internet connection and try again.'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      image: null,
      ctaText: '',
      ctaLink: '',
      badge: '',
      isActive: true,
      order: 0
    });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    resetForm();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 font-telegraf text-[#351E10]">
              <i className="fa-solid fa-bullhorn mr-3 text-[#E5B80B]"></i>
              Promotional
            </h1>
            <p className="text-gray-600 text-sm md:text-base font-lora">Create and manage promotional content for your museum highlights</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={openAddModal}
              className="px-4 md:px-6 py-3 rounded-lg transition-colors font-semibold shadow-md text-sm md:text-base"
              style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
            >
              <i className="fa-solid fa-plus mr-2"></i>
              <span className="hidden sm:inline">Add New Item</span>
              <span className="sm:hidden">Add Item</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#E5B80B'}}>
              <i className="fa-solid fa-bullhorn text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Total Items</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}>{promotionalItems.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#E5B80B'}}>
              <i className="fa-solid fa-eye text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Active Items</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}>
                {promotionalItems.filter(item => item.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#351E10'}}>
              <i className="fa-solid fa-eye-slash text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Inactive Items</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                {promotionalItems.filter(item => !item.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4" style={{backgroundColor: '#351E10'}}>
              <i className="fa-solid fa-star text-white text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Featured Items</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                {promotionalItems.filter(item => item.badge === 'Featured').length}
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
              <span className="hidden sm:inline">Search Items</span>
              <span className="sm:hidden">Search</span>
            </label>
            <input
              type="text"
              placeholder="Search by title, subtitle, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-sm sm:text-base"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1 sm:mb-2 text-xs sm:text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
              <i className="fa-solid fa-filter mr-1 sm:mr-2" style={{color: '#E5B80B'}}></i>
              <span className="hidden sm:inline">Filter by Status</span>
              <span className="sm:hidden">Filter</span>
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-sm sm:text-base"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Promotional Items List */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#E5B80B] to-[#D4AF37]">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white font-telegraf">
            <i className="fa-solid fa-list mr-2"></i>
            Promotional Items ({filteredItems.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-[#2e2b41]">
              <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              Loading promotional items...
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <i className="fa-solid fa-bullhorn text-4xl mb-4 text-gray-300"></i>
            <p className="text-lg">No promotional items found</p>
            <p className="text-sm">Add your first promotional item to get started</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => handleEdit(item)}>
                  {/* Image Section */}
                  <div className="relative">
                    {item.image ? (
                      <img 
                        src={`${api.defaults.baseURL}${item.image}`} 
                        alt={item.title} 
                        className="w-full aspect-[4/3] sm:aspect-square object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full aspect-[4/3] sm:aspect-square bg-gradient-to-br from-[#8B6B21]/20 to-[#D4AF37]/20 flex items-center justify-center rounded-t-lg">
                        <svg className="w-16 h-16" style={{color: '#8B6B21'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-1 left-1">
                      <span className={`px-1 py-0.5 rounded-full text-xs font-semibold ${
                        item.isActive 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-500 text-white'
                      }`} style={{fontFamily: 'Telegraf, sans-serif'}}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Order Badge */}
                    <div className="absolute top-1 right-1">
                      <span className="px-1 py-0.5 text-white rounded-full text-xs font-semibold" style={{backgroundColor: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                        #{item.order}
                      </span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-2 sm:p-3">
                    <div className="mb-1">
                      <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        {item.badge}
                      </span>
                    </div>
                    
                    <h3 className="text-xs sm:text-sm font-bold mb-1 line-clamp-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      {item.title}
                    </h3>
                    
                    <p className="text-xs mb-1 line-clamp-1" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      {item.subtitle}
                    </p>
                    
                    <p className="text-xs mb-2 line-clamp-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>
                        {item.ctaText || 'No tag'}
                      </span>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActive(item.id, item.isActive);
                          }}
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center transition-colors ${
                            item.isActive 
                              ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={item.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <FontAwesomeIcon icon={item.isActive ? faEyeSlash : faEye} className="text-xs" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(item);
                          }}
                          className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded flex items-center justify-center hover:bg-blue-200 transition-colors"
                          title="Edit"
                        >
                          <FontAwesomeIcon icon={faEdit} className="text-xs" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className="w-5 h-5 sm:w-6 sm:h-6 bg-red-100 text-red-600 rounded flex items-center justify-center hover:bg-red-200 transition-colors"
                          title="Delete"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[98vh] sm:max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="relative p-3 sm:p-4 md:p-8" style={{background: 'linear-gradient(135deg, #351E10 0%, #2A1A0D 50%, #1A0F08 100%)'}}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E5B80B]/10 to-transparent"></div>
              <div className="relative flex justify-between items-center">
                <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg sm:rounded-2xl flex items-center justify-center flex-shrink-0" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                    <i className="fa-solid fa-bullhorn text-lg sm:text-xl md:text-2xl text-white"></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg md:text-3xl font-bold text-white truncate" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      {editingItem ? 'Edit Promotional Item' : 'Create New Promotion'}
                    </h2>
                    <p className="text-[#E5B80B] text-xs sm:text-sm mt-1 hidden sm:block" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      {editingItem ? 'Update your promotional content' : 'Add a new promotional item to showcase'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
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
              <div className="p-3 sm:p-4 md:p-8 bg-gradient-to-br from-gray-50 to-white">
                <form id="promotional-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 md:space-y-8">
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
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                        placeholder="Enter promotional title"
                        style={{fontFamily: 'Telegraf, sans-serif'}}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                        <i className="fa-solid fa-tag mr-2" style={{color: '#E5B80B'}}></i>
                        Badge *
                      </label>
                      <input
                        type="text"
                        name="badge"
                        value={formData.badge}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                        placeholder="e.g., Featured, New, Popular"
                        style={{fontFamily: 'Telegraf, sans-serif'}}
                      />
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
                        <i className="fa-solid fa-subscript mr-2" style={{color: '#E5B80B'}}></i>
                        Subtitle *
                      </label>
                      <input
                        type="text"
                        name="subtitle"
                        value={formData.subtitle}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                        placeholder="Enter subtitle"
                        style={{fontFamily: 'Telegraf, sans-serif'}}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                        <i className="fa-solid fa-align-left mr-2" style={{color: '#E5B80B'}}></i>
                        Description *
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white resize-none"
                        placeholder="Enter detailed description"
                        style={{fontFamily: 'Telegraf, sans-serif'}}
                      />
                    </div>
                  </div>
                </div>

                {/* Settings & Media Section */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                      <i className="fa-solid fa-cog text-white text-lg"></i>
                    </div>
                    <h3 className="text-xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Settings & Media</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                        <i className="fa-solid fa-tag mr-2" style={{color: '#E5B80B'}}></i>
                        Promotional Tag
                      </label>
                      <input
                        type="text"
                        name="ctaText"
                        value={formData.ctaText}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                        placeholder="e.g., Now Showing, Coming Soon, Special Event"
                        style={{fontFamily: 'Telegraf, sans-serif'}}
                      />
                      <p className="text-sm text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>This will appear as a decorative tag on the promotional item</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-sort-numeric-up mr-2" style={{color: '#E5B80B'}}></i>
                          Display Order
                        </label>
                        <input
                          type="number"
                          name="order"
                          value={formData.order}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white"
                          placeholder="0"
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <i className="fa-solid fa-image mr-2" style={{color: '#E5B80B'}}></i>
                          Upload Image
                        </label>
                        <div className="relative">
                          <input
                            ref={fileInputRef}
                            type="file"
                            name="image"
                            onChange={handleInputChange}
                            accept="image/*"
                            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B] transition-all duration-300 bg-gray-50 focus:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#E5B80B] file:text-white hover:file:bg-[#D4AF37]"
                            style={{fontFamily: 'Telegraf, sans-serif'}}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Image Preview Section */}
                {imagePreview && (
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                        <i className="fa-solid fa-eye text-white text-lg"></i>
                      </div>
                      <h3 className="text-xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Image Preview</h3>
                    </div>
                    <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  </div>
                )}

                {/* Status Section */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E5B80B, #D4AF37)'}}>
                      <i className="fa-solid fa-toggle-on text-white text-lg"></i>
                    </div>
                    <h3 className="text-xl font-bold" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Status Settings</h3>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 rounded-xl" style={{backgroundColor: '#F8F9FA'}}>
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="w-6 h-6 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-[#E5B80B] focus:border-[#E5B80B]"
                        style={{accentColor: '#E5B80B'}}
                      />
                    </div>
                    <div>
                      <label className="text-lg font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                        Active Status
                      </label>
                      <p className="text-sm text-gray-500" style={{fontFamily: 'Telegraf, sans-serif'}}>
                        {formData.isActive ? 'This item will be visible on the website' : 'This item will be hidden from the website'}
                      </p>
                    </div>
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
                    form="promotional-form"
                    className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2 sm:py-2 md:py-3 rounded-lg font-semibold transition-colors shadow-md text-sm sm:text-sm md:text-base order-2 sm:order-2"
                    style={{backgroundColor: '#E5B80B', color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a509'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#E5B80B'}
                  >
                    <i className="fa-solid fa-check mr-2"></i>
                    {editingItem ? 'Update Item' : 'Create Item'}
                  </button>
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

export default PromotionalManagement;
