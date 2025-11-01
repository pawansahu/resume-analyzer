# Resume Upload API Documentation

## Overview

The Resume Upload API allows users to upload PDF or DOCX resume files for analysis. Files are validated, uploaded to AWS S3, and scheduled for automatic deletion after 24 hours.

## Endpoint

```
POST /api/resume/upload
```

## Authentication

- **Optional**: This endpoint supports both authenticated and anonymous users
- Authenticated users: Include JWT token in Authorization header
- Anonymous users: Can upload without authentication (limited to 1 free scan)

## Request

### Headers

```
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token> (optional)
```

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| resume | File | Yes | Resume file (PDF or DOCX) |

### File Requirements

- **Supported formats**: PDF (.pdf), DOCX (.docx)
- **Maximum size**: 5MB
- **Content-Type**: 
  - `application/pdf` for PDF files
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` for DOCX files

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "analysisId": "507f1f77bcf86cd799439011",
    "s3Key": "resumes/user123/1699564800000-a1b2c3d4.pdf",
    "parsedResume": {
      "text": "Full resume text...",
      "sections": {
        "contact": {
          "email": "john@example.com",
          "phone": "+1234567890"
        },
        "summary": "Experienced software engineer...",
        "experience": [],
        "education": [],
        "skills": ["JavaScript", "Python", "AWS"]
      },
      "metadata": {
        "fileType": "pdf",
        "parsedAt": "2024-11-01T12:00:00.000Z"
      }
    },
    "message": "Resume uploaded and parsed successfully"
  }
}
```

### Error Responses

#### 400 Bad Request - No File

```json
{
  "success": false,
  "error": {
    "code": "NO_FILE",
    "message": "No file uploaded"
  }
}
```

#### 400 Bad Request - Invalid File Type

```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE",
    "message": "Invalid file type. Only PDF and DOCX files are allowed."
  }
}
```

#### 400 Bad Request - File Too Large

```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds 5MB limit"
  }
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "UPLOAD_FAILED",
    "message": "Failed to upload and parse resume"
  }
}
```

## Example Usage

### cURL

```bash
# Anonymous upload
curl -X POST http://localhost:3000/api/resume/upload \
  -F "resume=@/path/to/resume.pdf"

# Authenticated upload
curl -X POST http://localhost:3000/api/resume/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "resume=@/path/to/resume.pdf"
```

### JavaScript (Fetch API)

```javascript
const formData = new FormData();
formData.append('resume', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/resume/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}` // Optional
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

### JavaScript (Axios)

```javascript
const formData = new FormData();
formData.append('resume', file);

const response = await axios.post(
  'http://localhost:3000/api/resume/upload',
  formData,
  {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${token}` // Optional
    }
  }
);

console.log(response.data);
```

### Angular

```typescript
uploadResume(file: File): Observable<any> {
  const formData = new FormData();
  formData.append('resume', file);

  return this.http.post(
    `${this.apiUrl}/resume/upload`,
    formData
  );
}
```

## File Storage

- Files are uploaded to AWS S3 with server-side encryption (AES256)
- File keys follow the pattern: `resumes/{userId}/{timestamp}-{random}.{extension}`
- Files are automatically deleted after 24 hours via S3 lifecycle policy
- Signed URLs are generated for secure file access (1-hour expiry)

## Security Features

1. **File Type Validation**: Only PDF and DOCX files are accepted
2. **Size Limits**: Maximum 5MB per file
3. **Secure Storage**: Files stored in private S3 bucket with encryption
4. **Automatic Deletion**: Files deleted after 24 hours for privacy
5. **Signed URLs**: Time-limited access to uploaded files
6. **Rate Limiting**: API rate limits apply based on user tier

## Rate Limits

| User Tier | Requests per Hour |
|-----------|-------------------|
| Anonymous | 10 |
| Free | 50 |
| Premium | 500 |
| Admin | 1000 |

## Related Endpoints

- `GET /api/resume/analysis/:id` - Retrieve analysis results
- `POST /api/resume/analyze-ats` - Get ATS score (coming soon)
- `POST /api/resume/match-jd` - Match with job description (coming soon)

## Notes

1. The parsing functionality in this implementation is a placeholder. Full parsing will be implemented in task 3.2.
2. For production use, ensure AWS credentials are properly configured in environment variables.
3. Set up S3 lifecycle policy as documented in `S3_LIFECYCLE_SETUP.md`.
4. Consider implementing retry logic on the client side for failed uploads.
