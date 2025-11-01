# Report Generation Service

## Overview

The Report Generation Service provides PDF report generation and download functionality for resume analysis results. It supports both on-screen report previews and downloadable PDF reports with watermarking for free tier users.

## Features

- PDF report generation with professional formatting
- Watermark application for free tier users
- S3 upload with signed URLs (7-day expiry)
- On-screen report preview (structured JSON)
- Report caching to avoid regeneration
- Download link regeneration for expired URLs

## API Endpoints

### 1. Generate PDF Report

**Endpoint:** `POST /api/reports/generate/:analysisId`

**Authentication:** Required

**Description:** Generates a PDF report for the specified analysis result and uploads it to S3.

**Request:**
```bash
curl -X POST http://localhost:3000/api/reports/generate/65abc123def456789 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportUrl": "https://s3.amazonaws.com/...",
    "expiresAt": "2024-01-15T10:30:00.000Z",
    "cached": false
  }
}
```

**Features:**
- Checks for existing valid reports (caching)
- Generates PDF with ATS score, recommendations, JD match, and AI suggestions
- Applies watermark for free/anonymous users
- Uploads to S3 and generates 7-day signed URL
- Updates analysis result with report metadata

### 2. Get Report Preview

**Endpoint:** `GET /api/reports/preview/:analysisId`

**Authentication:** Required

**Description:** Returns structured JSON data for on-screen report display.

**Request:**
```bash
curl -X GET http://localhost:3000/api/reports/preview/65abc123def456789 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalScore": 75,
      "matchPercentage": 68,
      "criticalIssues": 2,
      "generatedAt": "2024-01-08T10:30:00.000Z"
    },
    "atsScore": {
      "total": 75,
      "breakdown": {
        "structure": 20,
        "keywords": 22,
        "readability": 18,
        "formatting": 15
      },
      "details": {}
    },
    "recommendations": [...],
    "jdMatch": {...},
    "aiSuggestions": [...],
    "coverLetter": "..."
  }
}
```

### 3. Regenerate Download Link

**Endpoint:** `POST /api/reports/regenerate-link/:analysisId`

**Authentication:** Required

**Description:** Regenerates a signed URL for an existing report (useful when link expires).

**Request:**
```bash
curl -X POST http://localhost:3000/api/reports/regenerate-link/65abc123def456789 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportUrl": "https://s3.amazonaws.com/...",
    "expiresAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Report Structure

### PDF Report Sections

1. **Header**
   - Title: "Resume Analysis Report"
   - Generation date
   - Divider line

2. **ATS Compatibility Score**
   - Overall score (0-100) with color coding
   - Score breakdown by category
   - Critical and important recommendations

3. **Job Description Match Analysis** (if available)
   - Match percentage
   - Matched keywords (top 15)
   - Missing keywords (top 15)
   - Improvement suggestions

4. **AI-Powered Suggestions** (if available)
   - Original vs improved content
   - Up to 5 suggestions displayed

5. **Footer**
   - Report type (Premium/Free)
   - Page numbers

### Watermark

Free and anonymous users receive reports with a diagonal "FREE VERSION" watermark at 10% opacity on all pages.

## Service Methods

### `generatePDFReport(analysisData, userTier)`

Generates a PDF buffer from analysis data.

**Parameters:**
- `analysisData` (Object): Analysis result from database
- `userTier` (string): User tier (anonymous, free, premium, admin)

**Returns:** Promise<Buffer>

### `generateOnScreenReport(analysisData)`

Generates structured JSON for on-screen display.

**Parameters:**
- `analysisData` (Object): Analysis result from database

**Returns:** Promise<Object>

### `uploadReportToS3(pdfBuffer, userId)`

Uploads PDF to S3 and generates signed URL.

**Parameters:**
- `pdfBuffer` (Buffer): PDF file buffer
- `userId` (string): User ID for S3 path

**Returns:** Promise<Object> - { s3Key, downloadUrl, expiresAt }

### `generateDownloadLink(s3Key, expiryDays)`

Generates a signed URL for an existing S3 object.

**Parameters:**
- `s3Key` (string): S3 object key
- `expiryDays` (number): Days until expiry (default: 7)

**Returns:** Promise<string>

## Error Handling

### Common Errors

1. **ANALYSIS_NOT_FOUND** (404)
   - Analysis result doesn't exist or doesn't belong to user

2. **REPORT_GENERATION_FAILED** (500)
   - PDF generation failed
   - S3 upload failed

3. **REPORT_NOT_GENERATED** (404)
   - Attempting to regenerate link for non-existent report

4. **LINK_REGENERATION_FAILED** (500)
   - Failed to generate new signed URL

### Retry Strategy

The service implements automatic retry for:
- S3 upload failures (3 retries with exponential backoff)
- PDF generation errors (handled by controller)

## Configuration

Required environment variables:

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

## Usage Example

```javascript
import reportService from './services/report.service.js';

// Generate PDF report
const pdfBuffer = await reportService.generatePDFReport(
  analysisResult,
  'premium'
);

// Upload to S3
const { s3Key, downloadUrl, expiresAt } = await reportService.uploadReportToS3(
  pdfBuffer,
  userId
);

// Generate on-screen report
const reportData = await reportService.generateOnScreenReport(analysisResult);
```

## Testing

Run tests with:
```bash
npm test -- report.service.test.js
```

## Performance Considerations

- PDF generation typically takes 1-3 seconds
- Reports are cached to avoid regeneration
- S3 signed URLs are valid for 7 days
- Large reports (with many recommendations) may take longer

## Future Enhancements

- [ ] Support for multiple report formats (DOCX, HTML)
- [ ] Custom branding for premium users
- [ ] Report templates selection
- [ ] Email delivery of reports
- [ ] Report analytics and tracking
