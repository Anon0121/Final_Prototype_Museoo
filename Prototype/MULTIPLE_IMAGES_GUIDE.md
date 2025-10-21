# Single Image for Exhibits - Implementation Guide

## Overview
This guide documents the single image functionality for museum exhibits, allowing administrators to upload one image per exhibit and visitors to view them in a clean, simple interface.

## Features Implemented

### 🎯 Admin Features
1. **Single Image Upload**: Upload one image when creating/editing exhibits
2. **Image Preview**: Real-time preview of selected image before upload
3. **Image Management**: 
   - Remove image with X button
   - Visual preview with proper aspect ratio
4. **Enhanced Table View**: Shows single image thumbnail in admin table

### 🎯 Visitor Features
1. **Clean Image Display**: Simple, elegant image presentation
2. **Responsive Design**: Images adapt to different screen sizes
3. **Error Handling**: Graceful fallback for missing or broken images
4. **Modal View**: Full-size image display in exhibit details modal

## Technical Implementation

### Backend (Already Supports Single Images)
The backend already supports single image uploads through the existing `/api/activities` endpoint.

### Frontend Changes

#### Admin Component (`Museoo/src/components/admin/Exhibit.jsx`)
```javascript
// Single image state
const [imagePreview, setImagePreview] = useState(null);

// Handle single image selection
const handleChange = (e) => {
  if (name === "image") {
    const file = files[0];
    if (file) {
      setForm(prev => ({
        ...prev,
        image: file
      }));
      setImagePreview(URL.createObjectURL(file));
    }
  }
};

// Clear single image
const clearImage = () => {
  if (imagePreview) {
    URL.revokeObjectURL(imagePreview);
  }
  setImagePreview(null);
  setForm(prev => ({
    ...prev,
    image: null
  }));
};
```

#### Visitor Component (`Museoo/src/components/visitor/exhibits.jsx`)
```javascript
// Map backend data to single image
const mappedExhibits = response.data.map(exhibit => ({
  ...exhibit,
  image: exhibit.images && exhibit.images.length > 0 ? exhibit.images[0] : null
}));

// Display single image
{exhibit.image ? (
  <img
    src={`${api.defaults.baseURL}${exhibit.image}`}
    alt={exhibit.title}
    className="w-full h-full object-cover"
  />
) : (
  <div className="placeholder-image">
    <svg>...</svg>
  </div>
)}
```

## Usage Instructions

### For Administrators
1. **Adding Single Image**:
   - Click "Add Exhibit"
   - Select one image using the file input
   - Preview appears below the file input
   - Remove image with the X button if needed
   - Fill in other required fields and submit

2. **Image Requirements**:
   - Supported formats: JPG, PNG, GIF, WebP
   - Recommended size: 800x600 pixels or larger
   - File size: Under 5MB recommended

### For Visitors
1. **Viewing Exhibits**:
   - Browse exhibits in the grid layout
   - Click on any exhibit card to view details
   - View full-size image in the modal
   - Navigate between upcoming and ongoing exhibits

## Benefits of Single Image Approach

### ✅ **Simplicity**
- Easier to manage and maintain
- Faster upload and processing
- Cleaner user interface

### ✅ **Performance**
- Reduced storage requirements
- Faster page loading
- Less bandwidth usage

### ✅ **Consistency**
- Uniform exhibit presentation
- Predictable layout across all exhibits
- Easier responsive design

## Error Handling

### Image Loading Errors
- Graceful fallback to placeholder icon
- Console logging for debugging
- User-friendly error states

### File Upload Errors
- Validation for file types
- Size limit enforcement
- Clear error messages

## Future Enhancements

If you want to add multiple image support in the future:

1. **Backend**: Already supports multiple images
2. **Frontend**: Would need to re-implement slideshow functionality
3. **Database**: Already stores multiple images per exhibit

## File Structure
```
Museoo/src/components/
├── admin/
│   └── Exhibit.jsx          # Single image admin interface
└── visitor/
    └── exhibits.jsx         # Single image visitor interface
```

## API Endpoints

### Upload Exhibit with Image
```
POST /api/activities
Content-Type: multipart/form-data

Fields:
- title: string
- description: string
- type: "exhibit"
- start_date: string
- end_date: string
- location: string
- curator: string
- category: string
- images: file (single image)
```

### Get Exhibits
```
GET /api/activities/exhibits

Response:
[
  {
    id: number,
    title: string,
    description: string,
    start_date: string,
    end_date: string,
    location: string,
    curator: string,
    category: string,
    images: string[]  // Array with single image path
  }
]
```

## Troubleshooting

### Common Issues

1. **Image Not Displaying**:
   - Check file format (JPG, PNG, GIF, WebP)
   - Verify file size (under 5MB)
   - Check browser console for errors

2. **Upload Failing**:
   - Ensure all required fields are filled
   - Check network connection
   - Verify backend server is running

3. **Preview Not Working**:
   - Check browser supports File API
   - Verify image file is valid
   - Clear browser cache if needed

### Debug Information
- Console logs show upload progress
- Network tab shows API requests
- Image paths are logged for debugging

## Conclusion

The single image implementation provides a clean, efficient, and user-friendly experience for both administrators and visitors. It maintains the core functionality while simplifying the interface and improving performance.
