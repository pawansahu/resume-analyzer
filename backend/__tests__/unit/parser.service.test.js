import { jest } from '@jest/globals';
import * as parserService from '../../services/parser.service.js';

describe('Parser Service Unit Tests', () => {
  describe('extractContactInfo', () => {
    it('should extract email address', () => {
      const text = 'Contact me at john.doe@example.com for opportunities';
      const contact = parserService.default.extractContactInfo(text);
      
      expect(contact.email).toBe('john.doe@example.com');
    });

    it('should extract phone number', () => {
      const text = 'Phone: (555) 123-4567';
      const contact = parserService.default.extractContactInfo(text);
      
      expect(contact.phone).toBe('(555) 123-4567');
    });

    it('should extract LinkedIn profile', () => {
      const text = 'LinkedIn: linkedin.com/in/johndoe';
      const contact = parserService.default.extractContactInfo(text);
      
      expect(contact.linkedin).toBe('linkedin.com/in/johndoe');
    });

    it('should extract GitHub profile', () => {
      const text = 'GitHub: github.com/johndoe';
      const contact = parserService.default.extractContactInfo(text);
      
      expect(contact.github).toBe('github.com/johndoe');
    });

    it('should extract location', () => {
      const text = 'Based in San Francisco, CA';
      const contact = parserService.default.extractContactInfo(text);
      
      expect(contact.location).toBe('San Francisco, CA');
    });

    it('should handle multiple contact fields', () => {
      const text = `
        John Doe
        San Francisco, CA
        john.doe@example.com
        (555) 123-4567
        linkedin.com/in/johndoe
        github.com/johndoe
      `;
      const contact = parserService.default.extractContactInfo(text);
      
      expect(contact.email).toBe('john.doe@example.com');
      expect(contact.phone).toBe('(555) 123-4567');
      expect(contact.linkedin).toBe('linkedin.com/in/johndoe');
      expect(contact.github).toBe('github.com/johndoe');
      expect(contact.location).toBe('San Francisco, CA');
    });
  });

  describe('extractSections', () => {
    it('should identify summary section', () => {
      const text = `
        PROFESSIONAL SUMMARY
        Experienced software engineer with 5 years of experience
      `;
      const sections = parserService.default.extractSections(text);
      
      expect(sections.summary).toContain('Experienced software engineer');
    });

    it('should identify experience section', () => {
      const text = `
        WORK EXPERIENCE
        Senior Developer
        • Built scalable applications
        • Led team of 5 developers
      `;
      const sections = parserService.default.extractSections(text);
      
      expect(sections.experience).toHaveLength(1);
      expect(sections.experience[0].title).toBe('Senior Developer');
      expect(sections.experience[0].description).toContain('Built scalable applications');
    });

    it('should identify education section', () => {
      const text = `
        EDUCATION
        Bachelor of Science in Computer Science
        University of California
      `;
      const sections = parserService.default.extractSections(text);
      
      expect(sections.education).toHaveLength(1);
      expect(sections.education[0].degree).toBe('Bachelor of Science in Computer Science');
    });

    it('should identify skills section', () => {
      const text = `
        SKILLS
        JavaScript, Python, React, Node.js
        AWS, Docker, Kubernetes
      `;
      const sections = parserService.default.extractSections(text);
      
      expect(sections.skills).toContain('JavaScript');
      expect(sections.skills).toContain('Python');
      expect(sections.skills).toContain('React');
      expect(sections.skills).toContain('Node.js');
    });

    it('should handle multiple sections', () => {
      const text = `
        SUMMARY
        Experienced developer
        
        EXPERIENCE
        Senior Developer
        Built applications
        
        EDUCATION
        BS Computer Science
        
        SKILLS
        JavaScript, Python
      `;
      const sections = parserService.default.extractSections(text);
      
      expect(sections.summary).toContain('Experienced developer');
      expect(sections.experience).toHaveLength(1);
      expect(sections.education).toHaveLength(1);
      expect(sections.skills.length).toBeGreaterThan(0);
    });
  });

  describe('parseResume', () => {
    it('should parse PDF resume', async () => {
      // Create a minimal valid PDF buffer
      const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 <<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test Resume) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000317 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n410\n%%EOF');
      
      const result = await parserService.parseResume(pdfBuffer, 'pdf');
      
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('sections');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata.fileType).toBe('pdf');
      expect(result.metadata).toHaveProperty('parsedAt');
      expect(result.metadata).toHaveProperty('textLength');
      expect(result.metadata).toHaveProperty('wordCount');
    });

    it('should handle parsing errors gracefully', async () => {
      const invalidBuffer = Buffer.from('invalid data');
      
      await expect(
        parserService.parseResume(invalidBuffer, 'pdf')
      ).rejects.toThrow('Failed to parse resume');
    });

    it('should reject unsupported file types', async () => {
      const buffer = Buffer.from('test');
      
      await expect(
        parserService.parseResume(buffer, 'txt')
      ).rejects.toThrow('Unsupported file type');
    });
  });

  describe('Integration: Full Resume Parsing', () => {
    it('should parse a complete resume with all sections', async () => {
      const resumeText = `
        John Doe
        San Francisco, CA | john.doe@example.com | (555) 123-4567
        linkedin.com/in/johndoe | github.com/johndoe
        
        PROFESSIONAL SUMMARY
        Experienced software engineer with 5+ years of experience in full-stack development.
        
        WORK EXPERIENCE
        Senior Software Engineer
        Tech Company Inc. | 2020 - Present
        • Developed scalable microservices using Node.js and AWS
        • Led team of 5 developers
        • Improved system performance by 40%
        
        Software Engineer
        Startup Co. | 2018 - 2020
        • Built React applications
        • Implemented CI/CD pipelines
        
        EDUCATION
        Bachelor of Science in Computer Science
        University of California, Berkeley | 2014 - 2018
        GPA: 3.8/4.0
        
        SKILLS
        JavaScript, TypeScript, Python, React, Node.js, AWS, Docker, Kubernetes
      `;
      
      // Create a simple PDF with this text
      const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 <<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length ' + resumeText.length + '\n>>\nstream\nBT\n/F1 12 Tf\n50 700 Td\n(' + resumeText + ') Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000317 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n410\n%%EOF');
      
      const result = await parserService.parseResume(pdfBuffer, 'pdf');
      
      // Verify structure
      expect(result.sections).toHaveProperty('contact');
      expect(result.sections).toHaveProperty('summary');
      expect(result.sections).toHaveProperty('experience');
      expect(result.sections).toHaveProperty('education');
      expect(result.sections).toHaveProperty('skills');
      
      // Verify metadata
      expect(result.metadata.fileType).toBe('pdf');
      expect(result.metadata.textLength).toBeGreaterThan(0);
      expect(result.metadata.wordCount).toBeGreaterThan(0);
    });
  });
});
