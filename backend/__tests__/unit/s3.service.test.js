import { jest } from '@jest/globals';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as s3Service from '../../services/s3.service.js';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

/**
 * S3 Service Tests
 * Tests for S3 upload, signed URL generation, and file deletion
 * Requirements: 1.5, 1.6
 */

describe('S3 Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('File Upload to S3', () => {
    it('should upload PDF file to S3 successfully', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.prototype.send = mockSend;

      const fileBuffer = Buffer.from('fake pdf content');
      const userId = 'user123';
      const fileExtension = 'pdf';

      const result = await s3Service.uploadFileToS3(fileBuffer, userId, fileExtension);

      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('bucket');
      expect(result.key).toContain('resumes/user123/');
      expect(result.key).toMatch(/\.pdf$/);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should upload DOCX file to S3 successfully', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.prototype.send = mockSend;

      const fileBuffer = Buffer.from('fake docx content');
      const userId = 'user456';
      const fileExtension = 'docx';

      const result = await s3Service.uploadFileToS3(fileBuffer, userId, fileExtension);

      expect(result).toHaveProperty('key');
      expect(result.key).toContain('resumes/user456/');
      expect(result.key).toMatch(/\.docx$/);
    });

    it('should generate unique keys for multiple uploads', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.prototype.send = mockSend;

      const fileBuffer = Buffer.from('content');
      const userId = 'user789';

      const result1 = await s3Service.uploadFileToS3(fileBuffer, userId, 'pdf');
      const result2 = await s3Service.uploadFileToS3(fileBuffer, userId, 'pdf');

      expect(result1.key).not.toBe(result2.key);
    });

    it('should include timestamp in S3 key', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.prototype.send = mockSend;

      const fileBuffer = Buffer.from('content');
      const userId = 'user123';

      const result = await s3Service.uploadFileToS3(fileBuffer, userId, 'pdf');

      // Key should contain timestamp
      expect(result.key).toMatch(/resumes\/user123\/\d+-[a-f0-9]+\.pdf/);
    });

    it('should set correct content type for PDF', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.prototype.send = mockSend;

      const fileBuffer = Buffer.from('content');
      await s3Service.uploadFileToS3(fileBuffer, 'user123', 'pdf');

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.input.ContentType).toBe('application/pdf');
    });

    it('should set correct content type for DOCX', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.prototype.send = mockSend;

      const fileBuffer = Buffer.from('content');
      await s3Service.uploadFileToS3(fileBuffer, 'user123', 'docx');

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.input.ContentType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });

    it('should enable server-side encryption', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.prototype.send = mockSend;

      const fileBuffer = Buffer.from('content');
      await s3Service.uploadFileToS3(fileBuffer, 'user123', 'pdf');

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.input.ServerSideEncryption).toBe('AES256');
    });

    it('should include metadata in upload', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.prototype.send = mockSend;

      const fileBuffer = Buffer.from('content');
      const userId = 'user123';
      await s3Service.uploadFileToS3(fileBuffer, userId, 'pdf');

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.input.Metadata).toHaveProperty('uploadedAt');
      expect(callArgs.input.Metadata).toHaveProperty('userId');
      expect(callArgs.input.Metadata.userId).toBe(userId);
    });

    it('should handle S3 upload failure', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('S3 error'));
      S3Client.prototype.send = mockSend;

      const fileBuffer = Buffer.from('content');

      await expect(
        s3Service.uploadFileToS3(fileBuffer, 'user123', 'pdf')
      ).rejects.toThrow('Failed to upload file to S3');
    });

    it('should handle network timeout', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('Network timeout'));
      S3Client.prototype.send = mockSend;

      const fileBuffer = Buffer.from('content');

      await expect(
        s3Service.uploadFileToS3(fileBuffer, 'user123', 'pdf')
      ).rejects.toThrow();
    });

    it('should handle large file uploads', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.prototype.send = mockSend;

      const largeBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB
      const result = await s3Service.uploadFileToS3(largeBuffer, 'user123', 'pdf');

      expect(result).toHaveProperty('key');
      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('Signed URL Generation', () => {
    it('should generate signed URL successfully', async () => {
      const mockSignedUrl = 'https://s3.amazonaws.com/bucket/key?signature=abc123';
      getSignedUrl.mockResolvedValue(mockSignedUrl);

      const key = 'resumes/user123/file.pdf';
      const url = await s3Service.generateSignedUrl(key);

      expect(url).toBe(mockSignedUrl);
      expect(getSignedUrl).toHaveBeenCalled();
    });

    it('should use default expiry of 1 hour', async () => {
      const mockSignedUrl = 'https://s3.amazonaws.com/bucket/key?signature=abc123';
      getSignedUrl.mockResolvedValue(mockSignedUrl);

      const key = 'resumes/user123/file.pdf';
      await s3Service.generateSignedUrl(key);

      const callArgs = getSignedUrl.mock.calls[0];
      expect(callArgs[2]).toHaveProperty('expiresIn');
      expect(callArgs[2].expiresIn).toBe(3600); // 1 hour in seconds
    });

    it('should accept custom expiry time', async () => {
      const mockSignedUrl = 'https://s3.amazonaws.com/bucket/key?signature=abc123';
      getSignedUrl.mockResolvedValue(mockSignedUrl);

      const key = 'resumes/user123/file.pdf';
      const customExpiry = 7200; // 2 hours
      await s3Service.generateSignedUrl(key, customExpiry);

      const callArgs = getSignedUrl.mock.calls[0];
      expect(callArgs[2].expiresIn).toBe(customExpiry);
    });

    it('should handle signed URL generation failure', async () => {
      getSignedUrl.mockRejectedValue(new Error('AWS error'));

      const key = 'resumes/user123/file.pdf';

      await expect(
        s3Service.generateSignedUrl(key)
      ).rejects.toThrow('Failed to generate signed URL');
    });

    it('should generate different URLs for different keys', async () => {
      getSignedUrl
        .mockResolvedValueOnce('https://s3.amazonaws.com/bucket/key1?sig=abc')
        .mockResolvedValueOnce('https://s3.amazonaws.com/bucket/key2?sig=def');

      const url1 = await s3Service.generateSignedUrl('key1');
      const url2 = await s3Service.generateSignedUrl('key2');

      expect(url1).not.toBe(url2);
    });

    it('should handle special characters in key', async () => {
      const mockSignedUrl = 'https://s3.amazonaws.com/bucket/key?signature=abc123';
      getSignedUrl.mockResolvedValue(mockSignedUrl);

      const key = 'resumes/user 123/file name.pdf';
      const url = await s3Service.generateSignedUrl(key);

      expect(url).toBeTruthy();
    });
  });

  describe('File Deletion from S3', () => {
    it('should delete file from S3 successfully', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.prototype.send = mockSend;

      const key = 'resumes/user123/file.pdf';
      await s3Service.deleteFileFromS3(key);

      expect(mockSend).toHaveBeenCalled();
      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.input.Key).toBe(key);
    });

    it('should handle deletion of non-existent file', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.prototype.send = mockSend;

      const key = 'resumes/user123/nonexistent.pdf';
      await s3Service.deleteFileFromS3(key);

      expect(mockSend).toHaveBeenCalled();
    });

    it('should handle S3 deletion failure', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('S3 error'));
      S3Client.prototype.send = mockSend;

      const key = 'resumes/user123/file.pdf';

      await expect(
        s3Service.deleteFileFromS3(key)
      ).rejects.toThrow('Failed to delete file from S3');
    });

    it('should delete multiple files independently', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.prototype.send = mockSend;

      const keys = ['key1.pdf', 'key2.pdf', 'key3.pdf'];
      
      for (const key of keys) {
        await s3Service.deleteFileFromS3(key);
      }

      expect(mockSend).toHaveBeenCalledTimes(3);
    });
  });

  describe('Scheduled File Deletion', () => {
    it('should schedule file deletion for 24 hours', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const key = 'resumes/user123/file.pdf';
      await s3Service.scheduleFileDeletion(key, 24);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('scheduled for deletion after 24 hours')
      );

      consoleSpy.mockRestore();
    });

    it('should accept custom deletion time', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const key = 'resumes/user123/file.pdf';
      const hours = 48;
      await s3Service.scheduleFileDeletion(key, hours);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`scheduled for deletion after ${hours} hours`)
      );

      consoleSpy.mockRestore();
    });

    it('should use default 24 hours if not specified', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const key = 'resumes/user123/file.pdf';
      await s3Service.scheduleFileDeletion(key);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('24 hours')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('S3 Configuration', () => {
    it('should use correct bucket name', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.prototype.send = mockSend;

      const fileBuffer = Buffer.from('content');
      const result = await s3Service.uploadFileToS3(fileBuffer, 'user123', 'pdf');

      expect(result.bucket).toBeTruthy();
    });

    it('should use correct AWS region', () => {
      // This tests that S3Client is initialized with proper config
      expect(S3Client).toHaveBeenCalled();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle permission denied errors', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('Access Denied'));
      S3Client.prototype.send = mockSend;

      const fileBuffer = Buffer.from('content');

      await expect(
        s3Service.uploadFileToS3(fileBuffer, 'user123', 'pdf')
      ).rejects.toThrow();
    });

    it('should handle bucket not found errors', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('NoSuchBucket'));
      S3Client.prototype.send = mockSend;

      const fileBuffer = Buffer.from('content');

      await expect(
        s3Service.uploadFileToS3(fileBuffer, 'user123', 'pdf')
      ).rejects.toThrow();
    });

    it('should handle invalid credentials', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('InvalidAccessKeyId'));
      S3Client.prototype.send = mockSend;

      const fileBuffer = Buffer.from('content');

      await expect(
        s3Service.uploadFileToS3(fileBuffer, 'user123', 'pdf')
      ).rejects.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should complete full upload-sign-delete cycle', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.prototype.send = mockSend;
      getSignedUrl.mockResolvedValue('https://signed-url.com');

      const fileBuffer = Buffer.from('content');
      
      // Upload
      const uploadResult = await s3Service.uploadFileToS3(fileBuffer, 'user123', 'pdf');
      expect(uploadResult).toHaveProperty('key');

      // Generate signed URL
      const signedUrl = await s3Service.generateSignedUrl(uploadResult.key);
      expect(signedUrl).toBeTruthy();

      // Schedule deletion
      await s3Service.scheduleFileDeletion(uploadResult.key, 24);

      // Delete
      await s3Service.deleteFileFromS3(uploadResult.key);
      
      expect(mockSend).toHaveBeenCalled();
    });

    it('should handle concurrent uploads', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.prototype.send = mockSend;

      const fileBuffer = Buffer.from('content');
      const uploads = [
        s3Service.uploadFileToS3(fileBuffer, 'user1', 'pdf'),
        s3Service.uploadFileToS3(fileBuffer, 'user2', 'pdf'),
        s3Service.uploadFileToS3(fileBuffer, 'user3', 'pdf')
      ];

      const results = await Promise.all(uploads);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('key');
        expect(result).toHaveProperty('bucket');
      });
    });
  });

  describe('Performance', () => {
    it('should upload file within reasonable time', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.prototype.send = mockSend;

      const fileBuffer = Buffer.from('content');
      const startTime = Date.now();
      
      await s3Service.uploadFileToS3(fileBuffer, 'user123', 'pdf');
      
      const endTime = Date.now();
      const uploadTime = endTime - startTime;

      expect(uploadTime).toBeLessThan(1000); // Should complete within 1 second (mocked)
    });

    it('should generate signed URL quickly', async () => {
      getSignedUrl.mockResolvedValue('https://signed-url.com');

      const startTime = Date.now();
      await s3Service.generateSignedUrl('key');
      const endTime = Date.now();

      const generationTime = endTime - startTime;
      expect(generationTime).toBeLessThan(1000);
    });
  });
});
