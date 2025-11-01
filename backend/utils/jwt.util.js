import jwt from 'jsonwebtoken';

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload (userId, email, userTier)
 * @returns {string} JWT token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '24h'
  });
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - Token payload (userId)
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '30d'
  });
};

/**
 * Verify JWT access token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Verify JWT refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};
