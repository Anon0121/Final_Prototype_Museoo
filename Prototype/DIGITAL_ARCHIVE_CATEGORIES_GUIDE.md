# Digital Archive Categories Guide

## Overview
The digital archive system now supports categorization to better organize historical documents and artifacts related to Cagayan de Oro City. This guide explains the implementation and usage of the new category system.

## Categories Available

### 1. History of Cdeo
- Historical documents about Cagayan de Oro City's founding and development
- Maps, photographs, and records from the city's early days
- Important historical events and milestones

### 2. Local Heroes
- Biographies and documents about notable local figures
- Heroes and influential people from Cagayan de Oro's history
- Personal stories and contributions to the city

### 3. History of Baragnays
- Historical records of barangays (neighborhoods) in Cagayan de Oro
- Development and evolution of local communities
- Barangay-specific historical events and traditions

### 4. Fathers of City Charter
- Documents related to the city charter creation
- Information about the people who drafted and established the city charter
- Legal and administrative history of the city's governance

### 5. Mayor Of Cagayan De oro City
- Historical records of past mayors
- Administrative documents and policies from different mayoral terms
- City governance history and achievements

### 6. Other
- Miscellaneous documents that don't fit into the above categories
- General historical artifacts and records

## Implementation Details

### Database Changes
- Added `category` field to the `archives` table
- Created index for better search performance
- Default category is set to 'Other'

### Backend API Updates
- Modified `/api/archives` POST endpoint to accept category parameter
- Updated GET endpoint to support category filtering
- Added `/api/archives/categories` endpoint to get available categories

### Frontend Updates
- Added category filter dropdown in visitor interface
- Updated admin upload form to include category selection
- Enhanced archive display to show category information
- Added category badges in search results

## Usage Instructions

### For Visitors
1. Navigate to the Digital Archive page
2. Use the category dropdown to filter by specific categories
3. Combine category filter with search terms and file type filters
4. View category information in archive details

### For Administrators
1. When uploading new archives, select the appropriate category
2. Category is a required field in the upload form
3. View category information in the admin archive list
4. Categories help organize and manage the archive collection

## Migration Instructions

### Running the Database Migration
1. Ensure your database is running
2. Run the migration script:
   ```bash
   # Option 1: Using the batch file
   add-archive-categories.bat
   
   # Option 2: Manual execution
   cd backend
   node scripts/add_archive_categories.js
   ```

### Verification
After running the migration, verify that:
1. The `archives` table has a new `category` column
2. Existing archives have 'Other' as their default category
3. The category index has been created

## Technical Notes

### Database Schema
```sql
ALTER TABLE archives ADD COLUMN category VARCHAR(100) DEFAULT 'Other' AFTER type;
CREATE INDEX idx_archives_category ON archives(category);
```

### API Endpoints
- `GET /api/archives?category=History of Cdeo` - Filter by category
- `GET /api/archives/categories` - Get all available categories
- `POST /api/archives` - Upload with category (new field)

### Frontend Components
- `DigitalArchive.jsx` - Visitor interface with category filtering
- `Archive.jsx` - Admin interface with category selection

## Benefits
1. **Better Organization**: Archives are now properly categorized
2. **Improved Search**: Users can filter by specific historical themes
3. **Enhanced Navigation**: Clear categories help users find relevant content
4. **Scalable Structure**: Easy to add new categories in the future
5. **Historical Context**: Categories provide context about the content's significance

## Future Enhancements
- Add subcategories for more detailed organization
- Implement category-based statistics and analytics
- Add category-specific search suggestions
- Create category-based featured content sections
