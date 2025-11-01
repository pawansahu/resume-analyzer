import User from '../models/User.js';

/**
 * Usage limits by tier
 */
const USAGE_LIMITS = {
  anonymous: 1,    // 1 analysis per day for anonymous users
  free: 3,         // 3 analyses per day for free users
  premium: 999,    // Unlimited (999 is effectively unlimited)
  admin: 999       // Unlimited for admins
};

/**
 * Check if user has exceeded daily usage limit
 */
export const checkUsageLimit = async (req, res, next) => {
  try {
    // Anonymous users - check by IP or allow limited access
    if (!req.user) {
      // For anonymous users, we'll allow 1 upload per session
      // In production, you might want to track by IP address
      return next();
    }

    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Check if we need to reset daily usage
    const now = new Date();
    if (now >= user.dailyUsageResetAt) {
      // Reset usage count
      user.usageCount = 0;
      
      // Set next reset time to tomorrow at midnight
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      user.dailyUsageResetAt = tomorrow;
      
      await user.save();
    }

    // Get usage limit for user's tier
    const limit = USAGE_LIMITS[user.userTier] || USAGE_LIMITS.free;

    // Check if user has exceeded limit
    if (user.usageCount >= limit) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'USAGE_LIMIT_EXCEEDED',
          message: `Daily usage limit exceeded. You have used ${user.usageCount}/${limit} analyses today.`,
          usageCount: user.usageCount,
          usageLimit: limit,
          resetAt: user.dailyUsageResetAt
        }
      });
    }

    // Attach user data to request for later use
    req.userData = {
      user,
      usageCount: user.usageCount,
      usageLimit: limit
    };

    next();
  } catch (error) {
    console.error('Usage check error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'USAGE_CHECK_FAILED',
        message: 'Failed to check usage limit'
      }
    });
  }
};

/**
 * Increment user's usage count after successful upload
 */
export const incrementUsage = async (req, res, next) => {
  try {
    // Skip for anonymous users
    if (!req.user) {
      return next();
    }

    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (user) {
      user.usageCount += 1;
      await user.save();
      
      // Attach updated usage info to response
      if (res.locals.responseData) {
        res.locals.responseData.usageInfo = {
          usageCount: user.usageCount,
          usageLimit: USAGE_LIMITS[user.userTier] || USAGE_LIMITS.free,
          resetAt: user.dailyUsageResetAt
        };
      }
    }

    next();
  } catch (error) {
    console.error('Usage increment error:', error);
    // Don't fail the request if usage increment fails
    next();
  }
};

/**
 * Get user's current usage info
 */
export const getUserUsage = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if we need to reset daily usage
    const now = new Date();
    if (now >= user.dailyUsageResetAt) {
      user.usageCount = 0;
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      user.dailyUsageResetAt = tomorrow;
      
      await user.save();
    }

    const limit = USAGE_LIMITS[user.userTier] || USAGE_LIMITS.free;

    res.json({
      success: true,
      data: {
        usageCount: user.usageCount,
        usageLimit: limit,
        resetAt: user.dailyUsageResetAt,
        tier: user.userTier
      }
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usage information'
    });
  }
};

export { USAGE_LIMITS };
