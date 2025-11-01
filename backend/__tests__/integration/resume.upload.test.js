import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../../server.js';
import * as s3Service from '../../services/s3.service.js';
import * as parserService from '../../services/parser.service.js';

// Mock S3 and parser services
jest.mock('../../services/s3.service.js');
jest.mock('../../services/parser.service.js');

describe('Resume Upload Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/resume/upload', () => {
    it('should successfully upload a PDF file', async () => {
      // Mock S3 upload
      s3Service.uploadFileToS3.mockResolvedValue({
        key: 'resumes/test-user/123456-abc.pdf',
        bucket: 'resume-analyzer-uploads'
      });

      // Mock file deletion scheduling
      s3Service.scheduleFileDeletion.mockResolvedValue();

      // Mock parser
      parserService.parseResume.mockResolvedValue({
        text: 'Sample resume text',
        sections: {
          contact: { email: 'test@example.com' },
          summary: 'Experienced developer',
          experience: [],
          education: [],
          skills: ['JavaScript', 'Node.js']
        },
        metadata: {
          fileType: 'pdf',
          parsedAt: new Date().toISOString()
        }
      });

      const response = await request(app)
        .post('/api/resume/upload')
        .attach('resume', Buffer.from('fake pdf content'), 'test-resume.pdf')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analysisId');
      expect(response.body.data).toHaveProperty('s3Key');
      expect(response.body.data).toHaveProperty('parsedResume');
      expect(s3Service.uploadFileToS3).toHaveBeenCalled();
      expect(s3Service.scheduleFileDeletion).toHaveBeenCalledWith(
        'resumes/test-user/123456-abc.pdf',
        24
      );
    });

    it('should successfully upload a DOCX file', async () => {
      s3Service.uploadFileToS3.mockResolvedValue({
        key: 'resumes/test-user/123456-def.docx',
        bucket: 'resume-analyzer-uploads'
      });

      s3Service.scheduleFileDeletion.mockResolvedValue();

      parserService.parseResume.mockResolvedValue({
        text: 'Sample resume text',
        sections: {},
        metadata: { fileType: 'docx' }
      });

      const response = await request(app)
        .post('/api/resume/upload')
        .attach('resume', Buffer.from('fake docx content'), 'test-resume.docx')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject file larger than 5MB', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

      const response = await request(app)
        .post('/api/resume/upload')
        .attach('resume', largeBuffer, 'large-resume.pdf')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_TOO_LARGE');
    });

    it('should reject invalid file type', async () => {
      const response = await request(app)
        .post('/api/resume/upload')
        .attach('resume', Buffer.from('fake content'), 'test-resume.txt')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_FILE');
    });

    it('should reject request with no file', async () => {
      const response = await request(app)
        .post('/api/resume/upload')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_FILE');
    });

    it('should handle S3 upload failure', async () => {
      s3Service.uploadFileToS3.mockRejectedValue(
        new Error('S3 upload failed')
      );

      const response = await request(app)
        .post('/api/resume/upload')
        .attach('resume', Buffer.from('fake pdf content'), 'test-resume.pdf')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UPLOAD_FAILED');
    });

    it('should handle parsing failure', async () => {
      s3Service.uploadFileToS3.mockResolvedValue({
        key: 'resumes/test-user/123456-abc.pdf',
        bucket: 'resume-analyzer-uploads'
      });

      parserService.parseResume.mockRejectedValue(
        new Error('Failed to parse resume')
      );

      const response = await request(app)
        .post('/api/resume/upload')
        .attach('resume', Buffer.from('fake pdf content'), 'test-resume.pdf')
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should validate file extension case-insensitively', async () => {
      s3Service.uploadFileToS3.mockResolvedValue({
        key: 'resumes/test-user/123456-abc.pdf',
        bucket: 'resume-analyzer-uploads'
      });

      s3Service.scheduleFileDeletion.mockResolvedValue();

      parserService.parseResume.mockResolvedValue({
        text: 'Sample resume text',
        sections: {},
        metadata: { fileType: 'pdf' }
      });

      const response = await request(app)
        .post('/api/resume/upload')
        .attach('resume', Buffer.from('fake pdf content'), 'test-resume.PDF')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should extract all resume sections', async () => {
      s3Service.uploadFileToS3.mockResolvedValue({
        key: 'resumes/test-user/123456-abc.pdf',
        bucket: 'resume-analyzer-uploads'
      });

      s3Service.scheduleFileDeletion.mockResolvedValue();

      parserService.parseResume.mockResolvedValue({
        text: 'Full resume text',
        sections: {
          contact: {
            email: 'john@example.com',
            phone: '(555) 123-4567',
            location: 'San Francisco, CA'
          },
          summary: 'Experienced software engineer',
          experience: [
            { title: 'Senior Developer', description: ['Built apps'] }
          ],
          education: [
            { degree: 'BS Computer Science', details: ['GPA: 3.8'] }
          ],
          skills: ['JavaScript', 'Python', 'React']
        },
        metadata: {
          fileType: 'pdf',
          parsedAt: new Date().toISOString(),
          textLength: 100,
          wordCount: 20
        }
      });

      const response = await request(app)
        .post('/api/resume/upload')
        .attach('resume', Buffer.from('fake pdf content'), 'test-resume.pdf')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parsedResume.sections.contact).toHaveProperty('email');
      expect(response.body.data.parsedResume.sections).toHaveProperty('summary');
      expect(response.body.data.parsedResume.sections.experience).toHaveLength(1);
      expect(response.body.data.parsedResume.sections.education).toHaveLength(1);
      expect(response.body.data.parsedResume.sections.skills.length).toBeGreaterThan(0);
    });

    it('should schedule file deletion after 24 hours', async () => {
      s3Service.uploadFileToS3.mockResolvedValue({
        key: 'resumes/test-user/123456-abc.pdf',
        bucket: 'resume-analyzer-uploads'
      });

      s3Service.scheduleFileDeletion.mockResolvedValue();

      parserService.parseResume.mockResolvedValue({
        text: 'Sample resume text',
        sections: {},
        metadata: { fileType: 'pdf' }
      });

      await request(app)
        .post('/api/resume/upload')
        .attach('resume', Buffer.from('fake pdf content'), 'test-resume.pdf')
        .expect(200);

      expect(s3Service.scheduleFileDeletion).toHaveBeenCalledWith(
        expect.any(String),
        24
      );
    });

    it('should handle concurrent uploads', async () => {
      s3Service.uploadFileToS3.mockResolvedValue({
        key: 'resumes/test-user/123456-abc.pdf',
        bucket: 'resume-analyzer-uploads'
      });

      s3Service.scheduleFileDeletion.mockResolvedValue();

      parserService.parseResume.mockResolvedValue({
        text: 'Sample resume text',
        sections: {},
        metadata: { fileType: 'pdf' }
      });

      const uploads = [
        request(app)
          .post('/api/resume/upload')
          .attach('resume', Buffer.from('content1'), 'resume1.pdf'),
        request(app)
          .post('/api/resume/upload')
          .attach('resume', Buffer.from('content2'), 'resume2.pdf')
      ];

      const responses = await Promise.all(uploads);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should return metadata in response', async () => {
      s3Service.uploadFileToS3.mockResolvedValue({
        key: 'resumes/test-user/123456-abc.pdf',
        bucket: 'resume-analyzer-uploads'
      });

      s3Service.scheduleFileDeletion.mockResolvedValue();

      parserService.parseResume.mockResolvedValue({
        text: 'Sample resume text',
        sections: {},
        metadata: {
          fileType: 'pdf',
          parsedAt: new Date().toISOString(),
          textLength: 100,
          wordCount: 20
        }
      });

      const response = await request(app)
        .post('/api/resume/upload')
        .attach('resume', Buffer.from('fake pdf content'), 'test-resume.pdf')
        .expect(200);

      expect(response.body.data.parsedResume.metadata).toHaveProperty('fileType');
      expect(response.body.data.parsedResume.metadata).toHaveProperty('parsedAt');
      expect(response.body.data.parsedResume.metadata).toHaveProperty('textLength');
      expect(response.body.data.parsedResume.metadata).toHaveProperty('wordCount');
    });
  });
});
