import User from '../models/User.js';
import bcrypt from 'bcryptjs';

/**
 * Get user profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found'
        }
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userTier: user.userTier,
          usageCount: user.usageCount,
          dailyUsageResetAt: user.dailyUsageResetAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch profile',
        details: error.message
      }
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;

    // Validate input
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'First name, last name, and email are required'
        }
      });
    }

    // Check if email is already taken by another user
    if (email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Email is already in use'
          }
        });
      }
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        firstName,
        lastName,
        email
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userTier: user.userTier,
          usageCount: user.usageCount,
          dailyUsageResetAt: user.dailyUsageResetAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update profile',
        details: error.message
      }
    });
  }
};

/**
 * Change password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Current password and new password are required'
        }
      });
    }

    // Validate new password length
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'New password must be at least 8 characters long'
        }
      });
    }

    // Get user with password
    const user = await User.findById(req.user.userId);

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Current password is incorrect'
        }
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to change password',
        details: error.message
      }
    });
  }
};

/**
 * Delete account
 */
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    // Validate password
    if (!password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Password is required to delete account'
        }
      });
    }

    // Get user with password
    const user = await User.findById(req.user.userId);

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Password is incorrect'
        }
      });
    }

    // Delete user
    await User.findByIdAndDelete(req.user.userId);

    // TODO: Delete all user's analyses and related data

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete account',
        details: error.message
      }
    });
  }
};

/**
 * Upload profile picture
 */
export const uploadProfilePicture = async (req, res) => {
  try {
    // TODO: Implement file upload logic
    // This would typically use multer or similar middleware
    
    res.json({
      success: true,
      message: 'Profile picture upload feature coming soon'
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to upload profile picture',
        details: error.message
      }
    });
  }
};
