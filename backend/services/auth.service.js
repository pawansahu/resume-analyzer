import User from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util.js';
import { isValidEmail, validatePassword } from '../utils/validation.util.js';

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} User and tokens
 */
export const register = async ({ email, password, firstName, lastName }) => {
  // Validate email
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.message);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    firstName,
    lastName,
    userTier: 'free'
  });

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user._id,
    email: user.email,
    userTier: user.userTier
  });

  const refreshToken = generateRefreshToken({
    userId: user._id
  });

  // Return user data (without password) and tokens
  return {
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userTier: user.userTier,
      usageCount: user.usageCount
    },
    accessToken,
    refreshToken
  };
};

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @returns {Promise<Object>} User and tokens
 */
export const login = async ({ email, password }) => {
  // Validate input
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user._id,
    email: user.email,
    userTier: user.userTier
  });

  const refreshToken = generateRefreshToken({
    userId: user._id
  });

  // Return user data and tokens
  return {
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userTier: user.userTier,
      usageCount: user.usageCount,
      dailyUsageResetAt: user.dailyUsageResetAt
    },
    accessToken,
    refreshToken
  };
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User data
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId).select('-passwordHash');
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};
