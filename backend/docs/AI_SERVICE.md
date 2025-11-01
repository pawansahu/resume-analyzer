# AI Service Documentation

## Overview

The AI Service provides intelligent resume improvement features including bullet point rewrites, summary enhancements, and cover letter generation. It uses OpenAI's GPT-4 API with retry logic and timeout handling.

## Features

- **Bullet Point Rewrite**: Generate 3 alternative versions of resume bullet points
- **Summary Rewrite**: Create 3 improved versions of professional summaries
- **Cover Letter Generation**: Generate tailored cover letters based on resume and job description
- **Section Improvement**: Enhance specific resume sections with AI suggestions

## Configuration

### Environment Variables

```env
# AI Service Configuration
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key (optional)
AI_PROVIDER=openai
```

### Supported Providers

- **OpenAI** (default): Uses GPT-4o-mini model
- **Gemini**: Placeholder for future implementation

## API Endpoints

### 1. Rewrite Bullet Points

**Endpoint**: `POST /api/ai/rewrite/bullet-points`

**Authentication**: Required (Premium users only)

**Request Body**:
```json
{
  "bulletPoints": [
    "Managed team of developers",
    "Improved system performance",
    "Created documentation"
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "rewrites": [
      {
        "original": "Managed team of developers",
        "suggestions": [
          "Led cross-functional team of 5 developers to deliver 3 major product releases",
          "Managed and mentored team of developers, improving code quality by 40%",
          "Directed development team of 5 engineers, achieving 95% on-time delivery rate"
        ]
      }
    ]
  }
}
```

### 2. Rewrite Summary

**Endpoint**: `POST /api/ai/rewrite/summary`

**Authentication**: Required (Premium users only)

**Request Body**:
```json
{
  "summary": "Experienced software developer with knowledge of multiple programming languages."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "summaries": [
      "Full-stack software engineer with 5+ years building scalable web applications...",
      "Results-driven developer specializing in modern JavaScript frameworks...",
      "Versatile software engineer with proven track record in delivering..."
    ]
  }
}
```

### 3. Generate Cover Letter

**Endpoint**: `POST /api/ai/cover-letter`

**Authentication**: Required (Premium users only)

**Request Body**:
```json
{
  "resume": {
    "contactInfo": {
      "name": "John Doe"
    },
    "sections": {
      "summary": "Experienced developer...",
      "experience": "Senior Developer at Tech Corp...",
      "education": "BS Computer Science...",
      "skills": "JavaScript, React, Node.js..."
    }
  },
  "jobDescription": "We are seeking a Senior Full-Stack Developer..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "coverLetter": "Dear Hiring Manager,\n\nI am writing to express my strong interest..."
  }
}
```

### 4. Improve Section

**Endpoint**: `POST /api/ai/improve/section`

**Authentication**: Required (Premium users only)

**Request Body**:
```json
{
  "sectionText": "Proficient in JavaScript, Python, and Java. Familiar with React and Node.js.",
  "sectionType": "skills"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "improvements": [
      "Technical Skills: JavaScript (ES6+), Python, Java | Frameworks: React.js, Node.js, Express",
      "Core Technologies: JavaScript, Python, Java | Frontend: React.js | Backend: Node.js, Express",
      "Programming Languages: JavaScript (Advanced), Python (Intermediate), Java | Web Development: React.js, Node.js"
    ]
  }
}
```

### 5. Health Check

**Endpoint**: `GET /api/ai/health`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "provider": "openai"
  }
}
```

## Error Handling

### Error Codes

- `INVALID_INPUT`: Missing or invalid request parameters
- `PREMIUM_FEATURE`: User doesn't have premium access
- `AI_TIMEOUT`: Request exceeded 30-second timeout
- `AI_SERVICE_ERROR`: General AI service error

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "AI_TIMEOUT",
    "message": "AI service is taking longer than expected. Please try again.",
    "details": "Additional error details"
  }
}
```

## Retry Logic

The service implements automatic retry with the following strategy:

- **Max Retries**: 2 attempts
- **Retry Delay**: 5 seconds between attempts
- **Timeout**: 30 seconds per request
- **Backoff**: Fixed delay (not exponential)

## Usage Examples

### Using curl

```bash
# Rewrite bullet points
curl -X POST http://localhost:3000/api/ai/rewrite/bullet-points \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "bulletPoints": [
      "Managed team of developers",
      "Improved system performance"
    ]
  }'

# Generate cover letter
curl -X POST http://localhost:3000/api/ai/cover-letter \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "resume": {
      "contactInfo": {"name": "John Doe"},
      "sections": {
        "summary": "Experienced developer...",
        "experience": "Senior Developer..."
      }
    },
    "jobDescription": "We are seeking..."
  }'
```

### Using JavaScript/Fetch

```javascript
// Rewrite summary
const response = await fetch('http://localhost:3000/api/ai/rewrite/summary', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    summary: 'Experienced software developer with knowledge of multiple programming languages.'
  })
});

const data = await response.json();
console.log(data.data.summaries);
```

## Best Practices

1. **Input Validation**: Always validate input on the client side before sending to API
2. **Error Handling**: Implement proper error handling for timeout and service unavailability
3. **User Feedback**: Show loading indicators during AI processing (can take up to 30 seconds)
4. **Rate Limiting**: Respect rate limits to avoid service disruption
5. **Cost Management**: Monitor AI API usage to control costs

## Performance Considerations

- **Response Time**: Typically 5-15 seconds, max 30 seconds
- **Concurrent Requests**: Service can handle multiple concurrent requests
- **Token Usage**: Each request consumes OpenAI tokens (cost consideration)
- **Caching**: Consider caching results for identical inputs

## Security

- All endpoints require JWT authentication
- Premium features restricted to premium/admin users
- API keys stored securely in environment variables
- No sensitive data logged in production

## Monitoring

Monitor the following metrics:

- Request success/failure rates
- Average response times
- Timeout occurrences
- API cost per request
- User tier distribution of requests

## Future Enhancements

- [ ] Add Gemini API support
- [ ] Implement response caching
- [ ] Add batch processing for multiple sections
- [ ] Support for custom prompts
- [ ] Multi-language support
- [ ] Fine-tuned models for resume writing
