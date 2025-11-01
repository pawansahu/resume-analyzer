# Resume Parser Service Documentation

## Overview

The Resume Parser Service extracts text and structured data from PDF and DOCX resume files. It identifies key sections (contact, summary, experience, education, skills) and extracts contact information using pattern matching.

## Features

- ✅ PDF text extraction using `pdf-parse`
- ✅ DOCX text extraction using `mammoth`
- ✅ Section identification (Summary, Experience, Education, Skills)
- ✅ Contact information extraction (email, phone, LinkedIn, GitHub, location)
- ✅ Structured data output
- ✅ Metadata tracking (file type, parse time, text statistics)

## API

### Main Function

```javascript
parseResume(fileBuffer, fileExtension)
```

**Parameters:**
- `fileBuffer` (Buffer): File content as buffer
- `fileExtension` (string): File extension ('pdf' or 'docx')

**Returns:** Promise<Object>

```javascript
{
  text: string,                    // Full extracted text
  sections: {
    contact: {
      email: string,
      phone: string,
      linkedin: string,
      github: string,
      website: string,
      location: string
    },
    summary: string,               // Professional summary
    experience: Array<{
      title: string,
      description: Array<string>
    }>,
    education: Array<{
      degree: string,
      details: Array<string>
    }>,
    skills: Array<string>
  },
  metadata: {
    fileType: string,
    parsedAt: string,
    textLength: number,
    wordCount: number
  }
}
```

## Usage Examples

### Basic Usage

```javascript
import { parseResume } from './services/parser.service.js';

// Parse PDF
const pdfBuffer = fs.readFileSync('resume.pdf');
const result = await parseResume(pdfBuffer, 'pdf');

console.log(result.sections.contact.email);
console.log(result.sections.summary);
console.log(result.sections.skills);
```

### With File Upload

```javascript
import multer from 'multer';
import { parseResume } from './services/parser.service.js';

const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload', upload.single('resume'), async (req, res) => {
  const fileExtension = req.file.originalname.split('.').pop();
  const parsed = await parseResume(req.file.buffer, fileExtension);
  
  res.json({ success: true, data: parsed });
});
```

## Section Identification

The parser identifies sections using common header patterns:

### Summary Section
Patterns: `summary`, `professional summary`, `profile`, `objective`, `about me`, `career objective`

### Experience Section
Patterns: `experience`, `work experience`, `employment history`, `professional experience`, `work history`

### Education Section
Patterns: `education`, `academic background`, `qualifications`, `academic qualifications`

### Skills Section
Patterns: `skills`, `technical skills`, `core competencies`, `expertise`, `proficiencies`

## Contact Information Extraction

The parser uses regex patterns to extract contact information:

### Email
Pattern: `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}`

Example: `john.doe@example.com`

### Phone
Pattern: `(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}`

Examples:
- `(555) 123-4567`
- `555-123-4567`
- `+1 555 123 4567`

### LinkedIn
Pattern: `linkedin\.com\/in\/[a-zA-Z0-9-]+`

Example: `linkedin.com/in/johndoe`

### GitHub
Pattern: `github\.com\/[a-zA-Z0-9-]+`

Example: `github.com/johndoe`

### Location
Pattern: `[A-Z][a-z]+(?:\s[A-Z][a-z]+)*, [A-Z]{2}|[A-Z][a-z]+`

Examples:
- `San Francisco, CA`
- `New York, NY`
- `London, UK`

## Parsing Strategies

### Experience Parsing

The parser identifies experience entries by:
1. Looking for lines that don't start with bullet points (•, -)
2. Treating them as job titles/companies
3. Collecting subsequent bullet points as descriptions

Example:
```
Senior Software Engineer
• Built scalable applications
• Led team of 5 developers
```

Parsed as:
```javascript
{
  title: "Senior Software Engineer",
  description: [
    "Built scalable applications",
    "Led team of 5 developers"
  ]
}
```

### Education Parsing

Similar to experience, but focused on degrees and institutions:

Example:
```
Bachelor of Science in Computer Science
University of California, Berkeley
GPA: 3.8/4.0
```

Parsed as:
```javascript
{
  degree: "Bachelor of Science in Computer Science",
  details: [
    "University of California, Berkeley",
    "GPA: 3.8/4.0"
  ]
}
```

### Skills Parsing

Skills are extracted by:
1. Splitting lines by common delimiters (`,`, `;`, `|`, `•`, `-`)
2. Trimming whitespace
3. Filtering empty strings

Example:
```
JavaScript, Python, React, Node.js
AWS, Docker, Kubernetes
```

Parsed as:
```javascript
["JavaScript", "Python", "React", "Node.js", "AWS", "Docker", "Kubernetes"]
```

## Error Handling

The parser handles errors gracefully:

```javascript
try {
  const result = await parseResume(buffer, 'pdf');
} catch (error) {
  // Error types:
  // - "Failed to extract text from PDF"
  // - "Failed to extract text from DOCX"
  // - "Unsupported file type"
  // - "Failed to parse resume: {specific error}"
}
```

## Limitations

1. **Layout Dependency**: Parser works best with standard resume layouts. Complex multi-column layouts may not parse correctly.

2. **Section Headers**: Relies on common section header patterns. Non-standard headers may not be recognized.

3. **Contact Info**: Regex patterns may not catch all variations of contact information.

4. **Language**: Optimized for English resumes. Other languages may require additional patterns.

5. **Formatting**: Heavy reliance on text extraction. Visual formatting (bold, italics) is not preserved.

## Improvements for Future

1. **Machine Learning**: Use NLP models for better section identification
2. **Multi-language Support**: Add patterns for other languages
3. **Layout Analysis**: Implement PDF layout analysis for better structure detection
4. **Entity Recognition**: Use NER (Named Entity Recognition) for contact extraction
5. **Date Parsing**: Extract and normalize dates from experience/education
6. **Company Recognition**: Identify company names and positions separately

## Testing

### Unit Tests

```bash
npm test -- parser.service.test.js
```

### Test Coverage

- ✅ Email extraction
- ✅ Phone extraction
- ✅ LinkedIn extraction
- ✅ GitHub extraction
- ✅ Location extraction
- ✅ Section identification
- ✅ Experience parsing
- ✅ Education parsing
- ✅ Skills parsing
- ✅ PDF parsing
- ✅ Error handling

### Sample Test

```javascript
import { parseResume } from './services/parser.service.js';

test('should extract email from resume', async () => {
  const buffer = createTestPDF('Contact: john@example.com');
  const result = await parseResume(buffer, 'pdf');
  
  expect(result.sections.contact.email).toBe('john@example.com');
});
```

## Performance

- **PDF Parsing**: ~100-500ms for typical resume (1-2 pages)
- **DOCX Parsing**: ~50-200ms for typical resume
- **Section Extraction**: ~10-50ms
- **Contact Extraction**: ~5-10ms

Total parsing time: **~200-800ms** per resume

## Dependencies

```json
{
  "pdf-parse": "^1.1.1",
  "mammoth": "^1.6.0"
}
```

## Related Files

- `backend/services/parser.service.js` - Main implementation
- `backend/__tests__/unit/parser.service.test.js` - Unit tests
- `backend/__tests__/fixtures/sample-resume.txt` - Sample resume for testing
- `backend/controllers/resume.controller.js` - Integration with upload endpoint
