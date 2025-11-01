# Resume Upload Component Documentation

## Overview

The Resume Upload Component provides a user-friendly interface for uploading resume files with drag-and-drop support, client-side validation, progress tracking, and retry logic.

## Features

- ✅ Drag-and-drop file upload
- ✅ File browser selection
- ✅ Client-side validation (file type and size)
- ✅ Upload progress indicator
- ✅ Automatic retry on network failures
- ✅ Error handling with user-friendly messages
- ✅ Responsive design for mobile devices
- ✅ Material Design UI components

## Components

### UploadComponent

Main component for resume upload functionality.

**Location:** `frontend/src/app/pages/upload/upload.component.ts`

**Features:**
- Drag-and-drop zone
- File selection via browse button
- Real-time upload progress
- Success/error states
- Retry functionality

### ResumeService

Service for handling resume upload API calls.

**Location:** `frontend/src/app/services/resume.service.ts`

**Methods:**

```typescript
// Upload resume with progress tracking
uploadResume(file: File): Observable<UploadProgress>

// Validate file before upload
validateFile(file: File): { valid: boolean; error?: string }

// Get analysis result by ID
getAnalysisResult(analysisId: string): Observable<any>
```

## Usage

### Navigation

Add a link to the upload page in your navigation:

```html
<a routerLink="/upload">Upload Resume</a>
```

### Programmatic Navigation

```typescript
import { Router } from '@angular/router';

constructor(private router: Router) {}

navigateToUpload() {
  this.router.navigate(['/upload']);
}
```

## File Validation

### Client-Side Validation

The component validates files before upload:

**Allowed File Types:**
- PDF (`.pdf`)
- DOCX (`.docx`)

**Maximum File Size:** 5MB

**Validation Example:**

```typescript
const validation = this.resumeService.validateFile(file);

if (!validation.valid) {
  // Show error message
  console.error(validation.error);
}
```

## Upload Flow

1. **File Selection**
   - User drags file or clicks browse button
   - File is validated client-side
   - If valid, file details are displayed

2. **Upload Initiation**
   - User clicks "Upload & Analyze" button
   - Progress indicator appears
   - Upload begins with progress tracking

3. **Progress Tracking**
   - Upload progress shown as percentage
   - Status messages displayed
   - Progress bar updates in real-time

4. **Completion**
   - Success: Show success message and "View Results" button
   - Error: Show error message and "Retry" button

## Retry Logic

The service automatically retries failed uploads:

- **Max Retries:** 3 attempts
- **Retry Delay:** 2 seconds (increases with each retry)
- **Retry Conditions:**
  - Network errors (status 0)
  - Server errors (status 5xx)

**Manual Retry:**

Users can manually retry by clicking the "Retry Upload" button after an error.

## Error Handling

### Error Messages

The service provides user-friendly error messages:

| Error Code | Message |
|------------|---------|
| 0 | Network error. Please check your connection and try again. |
| 400 | Invalid file. Please check the file type and size. |
| 401 | Authentication required. Please log in. |
| 403 | You have reached your upload limit. Please upgrade your plan. |
| 413 | File is too large. Maximum size is 5MB. |
| 429 | Too many requests. Please try again later. |
| 5xx | Server error. Please try again later. |

### Error Display

Errors are displayed using:
- Material Snackbar notifications
- In-component error messages
- Retry button for failed uploads

## Styling

### Theme Customization

The component uses Material Design theming. Customize colors in your theme:

```scss
// In your theme file
$primary: mat.define-palette(mat.$indigo-palette);
$accent: mat.define-palette(mat.$pink-palette);
$warn: mat.define-palette(mat.$red-palette);
```

### Custom Styles

Override component styles:

```scss
// In your global styles or component styles
.upload-card {
  max-width: 900px; // Adjust card width
}

.drop-zone {
  border-color: #your-color; // Custom border color
}
```

## Responsive Design

The component is fully responsive:

**Desktop (>768px):**
- Two-column feature grid
- Larger icons and text
- Spacious layout

**Mobile (≤768px):**
- Single-column layout
- Smaller icons
- Compact spacing
- Touch-friendly buttons

## Accessibility

The component follows accessibility best practices:

- ✅ ARIA labels for buttons
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ High contrast colors
- ✅ Focus indicators

## Integration with Backend

### API Endpoint

```
POST /api/resume/upload
```

### Request Format

```typescript
const formData = new FormData();
formData.append('resume', file);

// Headers automatically set by Angular HttpClient
// Content-Type: multipart/form-data
// Authorization: Bearer <token> (if authenticated)
```

### Response Format

```typescript
{
  success: true,
  data: {
    analysisId: "507f1f77bcf86cd799439011",
    s3Key: "resumes/user123/1699564800000-a1b2c3d4.pdf",
    parsedResume: {
      text: "...",
      sections: { ... },
      metadata: { ... }
    },
    message: "Resume uploaded and parsed successfully"
  }
}
```

## Testing

### Unit Tests

Test the component and service:

```typescript
describe('UploadComponent', () => {
  it('should validate file type', () => {
    const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    const validation = service.validateFile(file);
    expect(validation.valid).toBe(true);
  });

  it('should reject large files', () => {
    const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.pdf');
    const validation = service.validateFile(largeFile);
    expect(validation.valid).toBe(false);
  });
});
```

### E2E Tests

Test the complete upload flow:

```typescript
describe('Resume Upload Flow', () => {
  it('should upload resume successfully', () => {
    cy.visit('/upload');
    cy.get('input[type="file"]').attachFile('sample-resume.pdf');
    cy.contains('Upload & Analyze').click();
    cy.contains('Resume uploaded successfully', { timeout: 10000 });
  });
});
```

## Performance Optimization

### Lazy Loading

The component is lazy-loaded for better initial load performance:

```typescript
{
  path: 'upload',
  loadComponent: () => import('./pages/upload/upload.component')
    .then(m => m.UploadComponent)
}
```

### File Size Optimization

- Client-side validation prevents large file uploads
- Progress tracking provides feedback during upload
- Chunked uploads (future enhancement)

## Future Enhancements

1. **Chunked Uploads**
   - Split large files into chunks
   - Resume interrupted uploads
   - Better progress tracking

2. **Multiple File Upload**
   - Upload multiple resumes at once
   - Batch processing
   - Queue management

3. **Preview Before Upload**
   - Show file preview
   - Basic text extraction
   - Quick validation

4. **Advanced Validation**
   - Content validation
   - Format checking
   - Malware scanning

5. **Upload History**
   - Show recent uploads
   - Quick re-analysis
   - Download previous results

## Troubleshooting

### Common Issues

**Issue:** File not uploading

**Solutions:**
- Check file size (must be < 5MB)
- Verify file type (PDF or DOCX only)
- Check network connection
- Try manual retry

**Issue:** Progress stuck at 0%

**Solutions:**
- Check backend server is running
- Verify API endpoint URL
- Check CORS configuration
- Review browser console for errors

**Issue:** Upload succeeds but no results

**Solutions:**
- Check backend parsing service
- Verify database connection
- Review server logs
- Check analysis ID in response

## Related Files

- `frontend/src/app/pages/upload/upload.component.ts` - Component logic
- `frontend/src/app/pages/upload/upload.component.html` - Template
- `frontend/src/app/pages/upload/upload.component.scss` - Styles
- `frontend/src/app/services/resume.service.ts` - Upload service
- `frontend/src/environments/environment.ts` - API configuration
- `backend/routes/resume.routes.js` - Backend routes
- `backend/controllers/resume.controller.js` - Upload handler
