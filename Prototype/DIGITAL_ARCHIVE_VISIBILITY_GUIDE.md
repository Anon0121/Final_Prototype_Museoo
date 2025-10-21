# Digital Archive Visibility Control Guide

## Overview
The digital archive system now includes visibility control functionality that allows administrators and staff to show or hide specific documents from public visitors. This feature provides better content management and allows for controlled release of sensitive or draft materials.

## Key Features

### 1. **Admin Visibility Control**
- **Show/Hide Toggle**: Admins can easily toggle document visibility with a single click
- **Visual Indicators**: Clear status badges show whether documents are visible or hidden
- **Bulk Management**: Individual control over each archive item
- **Real-time Updates**: Changes take effect immediately

### 2. **Upload Form Enhancement**
- **Visibility Option**: Choose document visibility during upload
- **Default Settings**: New documents are visible by default
- **Radio Button Selection**: Clear visual choice between visible and hidden

### 3. **Visitor Experience**
- **Filtered Content**: Visitors only see documents marked as visible
- **Seamless Experience**: Hidden documents are completely filtered out
- **No Performance Impact**: Efficient database queries ensure fast loading

## Implementation Details

### Database Changes
- Added `is_visible` BOOLEAN column to `archives` table
- Default value: `TRUE` (visible by default)
- Created index for performance optimization
- Positioned after `category` column for logical grouping

### Backend API Updates
- **GET /api/archives**: Now only returns visible documents (public endpoint)
- **GET /api/archives/admin**: Returns all documents including hidden ones (admin endpoint)
- **PATCH /api/archives/:id/visibility**: Toggle document visibility
- **POST /api/archives**: Accepts `is_visible` parameter during upload

### Frontend Updates
- **Admin Interface**: Added visibility toggle buttons and status indicators
- **Upload Form**: Added visibility selection radio buttons
- **Visual Feedback**: Color-coded status badges and icons

## Usage Instructions

### For Administrators

#### Uploading New Documents
1. Navigate to Admin Dashboard → Archive
2. Click "Upload Archive"
3. Fill in document details
4. **Select Visibility**:
   - ✅ **Visible to visitors**: Document will appear in public search
   - ❌ **Hidden from visitors**: Document will be admin-only
5. Upload the document

#### Managing Existing Documents
1. View the archive list in admin interface
2. Each document shows a status badge:
   - 🟢 **Visible**: Green badge with eye icon
   - ⚫ **Hidden**: Gray badge with eye-slash icon
3. Click the **Show/Hide** button to toggle visibility
4. Confirm the change when prompted

#### Visibility Indicators
- **Green Badge + Eye Icon**: Document is visible to visitors
- **Gray Badge + Eye-slash Icon**: Document is hidden from visitors
- **Orange "Hide" Button**: Click to hide a visible document
- **Blue "Show" Button**: Click to show a hidden document

### For Visitors
- **No Changes Required**: Visitors automatically see only visible documents
- **Search Results**: All search and filter operations respect visibility settings
- **Category Filtering**: Hidden documents are excluded from category views
- **Type Filtering**: Hidden documents are excluded from type-specific searches

## Technical Implementation

### Database Schema
```sql
ALTER TABLE archives ADD COLUMN is_visible BOOLEAN DEFAULT TRUE AFTER category;
CREATE INDEX idx_archives_visibility ON archives(is_visible);
```

### API Endpoints
```javascript
// Public endpoint - only visible documents
GET /api/archives?search=term&type=Document&category=History

// Admin endpoint - all documents including hidden
GET /api/archives/admin?search=term&type=Document&category=History

// Toggle visibility
PATCH /api/archives/:id/visibility
Body: { "is_visible": true/false }

// Upload with visibility
POST /api/archives
Body: FormData with is_visible field
```

### Frontend Components
- **Archive.jsx**: Admin interface with visibility controls
- **DigitalArchive.jsx**: Visitor interface (automatically filtered)
- **Visibility Toggle**: Button component with status feedback
- **Status Badge**: Visual indicator component

## Migration Instructions

### Running the Migration
1. Ensure your database is running
2. Run the migration script:
   ```bash
   # Option 1: Using the batch file
   add-archive-visibility.bat
   
   # Option 2: Manual execution
   cd backend
   node scripts/add_archive_visibility.js
   ```

### Verification
After running the migration, verify that:
1. The `archives` table has a new `is_visible` column
2. Existing archives have `TRUE` as their default visibility
3. The visibility index has been created
4. Admin interface shows visibility controls
5. Visitor interface only shows visible documents

## Benefits

### 1. **Content Management**
- **Draft Control**: Upload documents as drafts and publish when ready
- **Sensitive Content**: Hide sensitive materials from public view
- **Temporary Hiding**: Quickly hide documents without deletion

### 2. **User Experience**
- **Clean Interface**: Visitors see only relevant, approved content
- **Admin Control**: Full control over what content is publicly available
- **Flexible Workflow**: Easy toggling for content management

### 3. **Data Integrity**
- **No Data Loss**: Hidden documents remain in the system
- **Audit Trail**: Visibility changes are logged for tracking
- **Reversible Actions**: Easy to show/hide without permanent changes

## Best Practices

### 1. **Content Organization**
- Use visibility to manage content lifecycle
- Hide draft documents until they're ready for public viewing
- Consider using hidden status for sensitive historical materials

### 2. **Workflow Management**
- Establish clear guidelines for when to hide documents
- Train staff on visibility controls
- Regular review of hidden documents

### 3. **Performance Considerations**
- The visibility index ensures fast queries
- Public searches are automatically optimized
- No impact on visitor experience

## Troubleshooting

### Common Issues
1. **Migration Fails**: Ensure database exists and is accessible
2. **Visibility Not Updating**: Check admin permissions
3. **Documents Still Visible**: Clear browser cache and refresh

### Support
- Check database connection settings
- Verify migration script execution
- Review admin permissions and access levels

## Future Enhancements
- **Bulk Visibility Operations**: Select multiple documents for batch visibility changes
- **Scheduled Visibility**: Automatically show/hide documents based on dates
- **Visibility History**: Track when and who changed document visibility
- **Advanced Filtering**: Filter admin view by visibility status
