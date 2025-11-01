import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../utils/jwt.util.js';

// Set up test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key';
process.env.JWT_EXPIRY = '24h';
process.env.JWT_REFRESH_EXPIRY = '30d';

describe('JWT Utility', () => {
  const mockPayload = {
    userId: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    userTier: 'free',
  };

  const mockRefreshPayload = {
    userId: '507f1f77bcf86cd799439011',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const token = generateAccessToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include payload data in token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = jwt.decode(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.userTier).toBe(mockPayload.userTier);
    });

    it('should set expiration time', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = jwt.decode(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    it('should generate different tokens for same payload', async () => {
      const token1 = generateAccessToken(mockPayload);
      // Wait a moment to ensure different iat timestamp
      await new Promise(resolve => setTimeout(resolve, 1100));
      const token2 = generateAccessToken(mockPayload);

      expect(token1).not.toBe(token2);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT refresh token', () => {
      const token = generateRefreshToken(mockRefreshPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include userId in token', () => {
      const token = generateRefreshToken(mockRefreshPayload);
      const decoded = jwt.decode(token);

      expect(decoded.userId).toBe(mockRefreshPayload.userId);
    });

    it('should set longer expiration than access token', () => {
      const accessToken = generateAccessToken(mockPayload);
      const refreshToken = generateRefreshToken(mockRefreshPayload);

      const decodedAccess = jwt.decode(accessToken);
      const decodedRefresh = jwt.decode(refreshToken);

      expect(decodedRefresh.exp).toBeGreaterThan(decodedAccess.exp);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode a valid access token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.userTier).toBe(mockPayload.userTier);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyAccessToken(invalidToken)).toThrow('Invalid or expired token');
    });

    it('should throw error for token with wrong secret', () => {
      const token = jwt.sign(mockPayload, 'wrong-secret', { expiresIn: '24h' });

      expect(() => verifyAccessToken(token)).toThrow('Invalid or expired token');
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(mockPayload, process.env.JWT_SECRET, {
        expiresIn: '0s',
      });

      // Wait a moment to ensure expiration
      setTimeout(() => {
        expect(() => verifyAccessToken(expiredToken)).toThrow('Invalid or expired token');
      }, 100);
    });

    it('should throw error for malformed token', () => {
      expect(() => verifyAccessToken('not-a-jwt')).toThrow('Invalid or expired token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and decode a valid refresh token', () => {
      const token = generateRefreshToken(mockRefreshPayload);
      const decoded = verifyRefreshToken(token);

      expect(decoded.userId).toBe(mockRefreshPayload.userId);
    });

    it('should throw error for invalid refresh token', () => {
      const invalidToken = 'invalid.refresh.token';

      expect(() => verifyRefreshToken(invalidToken)).toThrow(
        'Invalid or expired refresh token'
      );
    });

    it('should throw error for refresh token with wrong secret', () => {
      const token = jwt.sign(mockRefreshPayload, 'wrong-secret', { expiresIn: '30d' });

      expect(() => verifyRefreshToken(token)).toThrow('Invalid or expired refresh token');
    });

    it('should not verify access token as refresh token', () => {
      const accessToken = generateAccessToken(mockPayload);

      expect(() => verifyRefreshToken(accessToken)).toThrow(
        'Invalid or expired refresh token'
      );
    });
  });

  describe('Token expiration', () => {
    it('should create token with custom expiry', () => {
      process.env.JWT_EXPIRY = '1h';
      const token = generateAccessToken(mockPayload);
      const decoded = jwt.decode(token);

      const expiryDuration = decoded.exp - decoded.iat;
      expect(expiryDuration).toBe(3600); // 1 hour in seconds
    });
  });
});
