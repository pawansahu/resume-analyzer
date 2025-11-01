# Services Directory

This directory contains business logic services.

## Structure

- `auth.service.js` - Authentication business logic
- `resume-parser.service.js` - Resume parsing logic
- `ats-scoring.service.js` - ATS scoring algorithms
- `jd-matching.service.js` - Job description matching logic
- `ai.service.js` - AI integration (OpenAI/Gemini)
- `report.service.js` - Report generation logic
- `payment.service.js` - Payment processing logic
- `email.service.js` - Email sending logic
- `s3.service.js` - AWS S3 file operations
- `redis.service.js` - Redis cache operations

## Pattern

Services contain reusable business logic:

```javascript
export const calculateATSScore = async (parsedResume) => {
  const structureScore = analyzeStructure(parsedResume);
  const keywordScore = analyzeKeywords(parsedResume);
  const readabilityScore = analyzeReadability(parsedResume);
  const formattingScore = analyzeFormatting(parsedResume);
  
  return {
    totalScore: structureScore + keywordScore + readabilityScore + formattingScore,
    breakdown: { structureScore, keywordScore, readabilityScore, formattingScore }
  };
};
```
