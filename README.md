# Nationwide Movers API

A Node.js/Express API for managing real estate agents and analyzing Excel files.

## Features

- **Agent Management**: CRUD operations for real estate agents
- **Excel File Analysis**: Upload and analyze Excel files with detailed column analysis
- **Search & Filtering**: Advanced search capabilities for agents
- **Statistics**: Comprehensive agent statistics and analytics

## Excel File Upload & Analysis API

### Endpoint
```
POST /api/upload-excel
```

### Description
This API endpoint allows you to upload Excel files (.xlsx or .xls) and get a comprehensive analysis of all data columns and sheets.

### Features
- **File Validation**: Only accepts Excel files (.xlsx, .xls)
- **Size Limit**: Maximum file size of 10MB
- **Multi-sheet Support**: Analyzes all sheets in the Excel file
- **Column Analysis**: Provides detailed statistics for each column
- **Data Types**: Identifies data types in each column
- **Sample Data**: Shows sample values from each column
- **Null Value Analysis**: Counts null/empty values vs. populated values
- **Unique Value Count**: Tracks unique values in each column

### Request
- **Method**: POST
- **Content-Type**: multipart/form-data
- **Body**: Form data with field name `excelFile`

### Response Format
```json
{
  "success": true,
  "message": "Excel file analyzed successfully",
  "data": {
    "fileName": "example.xlsx",
    "fileSize": 12345,
    "totalSheets": 2,
    "sheets": [
      {
        "sheetName": "Sheet1",
        "totalRows": 100,
        "totalColumns": 5,
        "columns": [
          {
            "columnName": "Name",
            "totalRows": 100,
            "nonNullValues": 95,
            "nullValues": 5,
            "dataTypes": ["string"],
            "sampleValues": ["John Doe", "Jane Smith", "Bob Johnson"],
            "uniqueValues": 90
          }
        ],
        "sampleData": [
          // First 3 rows of data
        ]
      }
    ]
  }
}
```

### Column Analysis Details
Each column analysis includes:
- **columnName**: Name of the column
- **totalRows**: Total number of rows in the sheet
- **nonNullValues**: Count of non-null/non-empty values
- **nullValues**: Count of null/empty values
- **dataTypes**: Array of data types found in the column
- **sampleValues**: First 5 non-null values as examples
- **uniqueValues**: Count of unique values in the column

## Testing the API

### 1. Using the Web Interface
Visit `/test-upload` in your browser to access a user-friendly web interface for testing file uploads.

### 2. Using cURL
```bash
curl -X POST \
  -F "excelFile=@your-file.xlsx" \
  http://localhost:5000/api/upload-excel
```

### 3. Using Postman
1. Set method to POST
2. Set URL to `http://localhost:5000/api/upload-excel`
3. In Body tab, select "form-data"
4. Add key `excelFile` with type "File"
5. Select your Excel file
6. Send request

## Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm run dev
   ```

3. **Access the API**:
   - API Base URL: `http://localhost:5000/api`
   - Test Upload Page: `http://localhost:5000/test-upload`

## API Endpoints

### Agent Management
- `GET /api/agents` - Get all agents with pagination and filtering
- `GET /api/agents/:id` - Get agent by ID
- `GET /api/agents/search` - Search agents
- `GET /api/agents/stats` - Get agent statistics

### File Analysis
- `POST /api/upload-excel` - Upload and analyze Excel file

## Error Handling

The API provides comprehensive error handling:
- **File Type Validation**: Only Excel files accepted
- **File Size Limits**: 10MB maximum file size
- **Upload Errors**: Detailed error messages for upload failures
- **Analysis Errors**: Graceful handling of file parsing errors
- **File Cleanup**: Automatic cleanup of uploaded files after analysis

## Security Features

- **File Type Restriction**: Only allows Excel file extensions
- **File Size Limits**: Prevents large file uploads
- **Temporary Storage**: Files are stored temporarily and cleaned up after analysis
- **Input Validation**: Comprehensive validation of uploaded files

## Dependencies

- **Express**: Web framework
- **Multer**: File upload middleware
- **XLSX**: Excel file parsing library
- **MongoDB**: Database (for agent management)
- **TypeScript**: Type safety and development experience
