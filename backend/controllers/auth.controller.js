import * as authService from '../services/auth.service.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      });
    }

    const result = await authService.register({
      email,
      password,
      firstName,
      lastName
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'REGISTRATION_ERROR',
        message: error.message
      }
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      });
    }

    const result = await authService.login({ email, password });

    res.json({
      success: true,
      data: result,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: error.message
      }
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getProfile = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.userId);
    
    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userTier: user.userTier,
        usageCount: user.usageCount,
        dailyUsageResetAt: user.dailyUsageResetAt,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiresAt: user.subscriptionExpiresAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: error.message
      }
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // Here we can add token to blacklist if needed
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: error.message
      }
    });
  }
};
