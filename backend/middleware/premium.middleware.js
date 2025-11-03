import User from '../models/User.js';

/**
 * Premium features that require premium tier
 */
const PREMIUM_FEATURES = {
  JOB_DESCRIPTION_MATCHING: 'job_description_matching',
  AI_REWRITE: 'ai_rewrite',
  UNLIMITED_ANALYSES: 'unlimited_analyses',
  PRIORITY_SUPPORT: 'priority_support',
  ADVANCED_REPORTS: 'advanced_reports',
  EXPORT_FORMATS: 'export_formats'
};

/**
 * Check if user has premium access
 */
export const requirePremium = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Please login to access this feature'
        }
      });
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

    // Check if user has premium tier
    if (user.userTier !== 'premium' && user.userTier !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PREMIUM_REQUIRED',
          message: 'This feature requires a premium subscription',
          feature: 'premium_feature',
          currentTier: user.userTier,
          upgradeUrl: '/pricing'
        }
      });
    }

    // Check if subscription is active (not cancelled)
    if (user.subscriptionStatus === 'cancelled' || user.subscriptionStatus === 'expired') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_INACTIVE',
          message: 'Your subscription is not active. Please renew to access premium features.',
          subscriptionStatus: user.subscriptionStatus,
          upgradeUrl: '/pricing'
        }
      });
    }

    // Attach user to request
    req.userData = { user };
    next();
  } catch (error) {
    console.error('Premium check error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PREMIUM_CHECK_FAILED',
        message: 'Failed to verify premium access'
      }
    });
  }
};

/**
 * Check if user can access a specific premium feature
 */
export const checkPremiumFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Please login to access this feature'
          }
        });
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

      // Admin always has access
      if (user.userTier === 'admin') {
        req.userData = { user };
        return next();
      }

      // Check if user has premium tier and active subscription
      const hasPremium = user.userTier === 'premium' && 
                        user.subscriptionStatus === 'active';

      if (!hasPremium) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PREMIUM_FEATURE_LOCKED',
            message: `${featureName} is a premium feature. Upgrade to access it.`,
            feature: featureName,
            currentTier: user.userTier,
            subscriptionStatus: user.subscriptionStatus,
            upgradeUrl: '/pricing'
          }
        });
      }

      req.userData = { user };
      next();
    } catch (error) {
      console.error('Feature check error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FEATURE_CHECK_FAILED',
          message: 'Failed to verify feature access'
        }
      });
    }
  };
};

/**
 * Get user's accessible features
 */
export const getUserFeatures = async (req, res) => {
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

    const isPremium = user.userTier === 'premium' && 
                     user.subscriptionStatus === 'active';
    const isAdmin = user.userTier === 'admin';

    const features = {
      // Basic features (available to all)
      basic_analysis: true,
      pdf_reports: true,
      email_support: true,
      
      // Premium features
      job_description_matching: isPremium || isAdmin,
      ai_rewrite: isPremium || isAdmin,
      unlimited_analyses: isPremium || isAdmin,
      priority_support: isPremium || isAdmin,
      advanced_reports: isPremium || isAdmin,
      export_formats: isPremium || isAdmin,
      
      // User info
      tier: user.userTier,
      subscriptionStatus: user.subscriptionStatus,
      usageLimit: isPremium || isAdmin ? 999 : 3
    };

    res.json({
      success: true,
      data: features
    });
  } catch (error) {
    console.error('Get features error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user features'
    });
  }
};

export { PREMIUM_FEATURES };
