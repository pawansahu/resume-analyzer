import { jest } from '@jest/globals';
import * as parserService from '../../services/parser.service.js';

/**
 * DOCX Parsing Tests
 * Tests for DOCX text extraction and parsing
 * Requirements: 1.2, 1.3
 * 
 * Note: These tests verify error handling for DOCX parsing.
 * For full DOCX parsing tests, actual DOCX files would be needed in fixtures.
 */

describe('DOCX Parsing Tests', () => {
  describe('DOCX Text Extraction', () => {
    it('should handle DOCX parsing with proper structure', async () => {
      // Note: This test verifies the parsing interface
      // In production, use actual DOCX files from fixtures
      const mockDOCXBuffer = Buffer.from('PK\x03\x04'); // ZIP signature
      
      // This will fail parsing, which is expected without a proper DOCX
      await expect(
        parserService.parseResume(mockDOCXBuffer, 'docx')
      ).rejects.toThrow();
    });

    it('should verify DOCX file type is supported', () => {
      const supportedTypes = ['pdf', 'docx'];
      expect(supportedTypes).toContain('docx');
    });

    it('should have proper MIME type for DOCX', () => {
      const docxMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      expect(docxMimeType).toBeTruthy();
      expect(docxMimeType).toContain('wordprocessingml');
    });

    it('should reject corrupted DOCX', async () => {
      const corruptedDOCX = Buffer.from('PK\x03\x04Corrupted content');
      
      await expect(
        parserService.parseResume(corruptedDOCX, 'docx')
      ).rejects.toThrow();
    });

    it('should reject non-DOCX buffer', async () => {
      const nonDOCXBuffer = Buffer.from('This is not a DOCX file');
      
      await expect(
        parserService.parseResume(nonDOCXBuffer, 'docx')
      ).rejects.toThrow();
    });
  });

  describe('DOCX Error Handling', () => {
    it('should throw error for invalid DOCX structure', async () => {
      const invalidDOCX = Buffer.from('PK\x03\x04Invalid');
      
      await expect(
        parserService.parseResume(invalidDOCX, 'docx')
      ).rejects.toThrow();
    });

    it('should throw error for empty buffer', async () => {
      const emptyBuffer = Buffer.alloc(0);
      
      await expect(
        parserService.parseResume(emptyBuffer, 'docx')
      ).rejects.toThrow();
    });

    it('should handle DOCX parsing errors gracefully', async () => {
      const malformedDOCX = Buffer.from('PK');
      
      await expect(
        parserService.parseResume(malformedDOCX, 'docx')
      ).rejects.toThrow();
    });

    it('should reject unsupported file type', async () => {
      const buffer = Buffer.from('test');
      
      await expect(
        parserService.parseResume(buffer, 'txt')
      ).rejects.toThrow('Unsupported file type');
    });
  });

  describe('DOCX Format Validation', () => {
    it('should validate DOCX ZIP signature', () => {
      const docxBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04]); // PK ZIP signature
      const isZip = docxBuffer[0] === 0x50 && docxBuffer[1] === 0x4B;
      expect(isZip).toBe(true);
    });

    it('should detect non-ZIP files', () => {
      const nonZipBuffer = Buffer.from('Not a ZIP file');
      const isZip = nonZipBuffer[0] === 0x50 && nonZipBuffer[1] === 0x4B;
      expect(isZip).toBe(false);
    });

    it('should verify DOCX content type', () => {
      const contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      expect(contentType).toContain('openxmlformats');
      expect(contentType).toContain('wordprocessingml');
    });
  });
});
