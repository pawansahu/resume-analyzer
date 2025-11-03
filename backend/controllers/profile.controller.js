import User from '../models/User.js';
import AnalysisResult from '../models/AnalysisResult.js';
import Payment from '../models/Payment.js';
import Contact from '../models/Contact.js';
import AuditLog from '../models/AuditLog.js';
import bcrypt from 'bcryptjs';
import s3Service from '../services/s3.service.js';

/**
 * Get user profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');

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
          phone: user.phone,
          bio: user.bio,
          profileImage: user.profileImage,
          userTier: user.userTier,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          cancelledAt: user.cancelledAt,
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
    const { firstName, lastName, phone, bio } = req.body;

    // Validate input
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'First name and last name are required'
        }
      });
    }

    // Update user (email cannot be changed)
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        firstName,
        lastName,
        phone: phone || null,
        bio: bio || null
      },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          bio: user.bio,
          profileImage: user.profileImage,
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
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
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
    user.passwordHash = await bcrypt.hash(newPassword, salt);
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
    console.log('=== DELETE ACCOUNT REQUEST ===');
    console.log('User ID:', req.user?.userId);
    console.log('Request body:', req.body);
    
    const { password } = req.body;

    // Validate password
    if (!password) {
      console.log('ERROR: No password provided');
      return res.status(400).json({
        success: false,
        error: {
          message: 'Password is required to delete account'
        }
      });
    }

    // Get user with password
    const user = await User.findById(req.user.userId);
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('ERROR: User not found in database');
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found'
        }
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('ERROR: Password incorrect');
      return res.status(400).json({
        success: false,
        error: {
          message: 'Password is incorrect'
        }
      });
    }

    console.log(`✓ Starting account deletion for user: ${req.user.userId}`);

    // 1. Get all analysis results to delete S3 files
    const analyses = await AnalysisResult.find({ userId: req.user.userId });
    console.log(`Found ${analyses.length} analyses to delete`);

    // 2. Delete all resume files from S3
    for (const analysis of analyses) {
      if (analysis.resumeUrl) {
        try {
          // Extract S3 key from URL
          const urlParts = analysis.resumeUrl.split('/');
          const s3Key = urlParts[urlParts.length - 1];
          await s3Service.deleteFileFromS3(s3Key);
          console.log(`Deleted S3 file: ${s3Key}`);
        } catch (s3Error) {
          console.error(`Failed to delete S3 file for analysis ${analysis._id}:`, s3Error);
          // Continue with deletion even if S3 deletion fails
        }
      }
    }

    // 3. Delete all analysis results
    const deletedAnalyses = await AnalysisResult.deleteMany({ userId: req.user.userId });
    console.log(`Deleted ${deletedAnalyses.deletedCount} analysis results`);

    // 4. Delete all payment records
    const deletedPayments = await Payment.deleteMany({ userId: req.user.userId });
    console.log(`Deleted ${deletedPayments.deletedCount} payment records`);

    // 5. Delete all contact messages (if any)
    const deletedContacts = await Contact.deleteMany({ userId: req.user.userId });
    console.log(`Deleted ${deletedContacts.deletedCount} contact messages`);

    // 6. Delete all audit logs
    const deletedAuditLogs = await AuditLog.deleteMany({ userId: req.user.userId });
    console.log(`Deleted ${deletedAuditLogs.deletedCount} audit logs`);

    // 7. Finally, delete the user account
    const deletedUser = await User.findByIdAndDelete(req.user.userId);
    console.log(`✓ Deleted user account: ${req.user.userId}`);
    console.log('User deletion result:', deletedUser ? 'Success' : 'Failed');

    const responseData = {
      success: true,
      message: 'Account and all associated data deleted successfully',
      deletedData: {
        analyses: deletedAnalyses.deletedCount,
        payments: deletedPayments.deletedCount,
        contacts: deletedContacts.deletedCount,
        auditLogs: deletedAuditLogs.deletedCount
      }
    };
    
    console.log('=== DELETION COMPLETE ===');
    console.log('Response:', JSON.stringify(responseData, null, 2));
    
    res.json(responseData);
  } catch (error) {
    console.error('=== DELETE ACCOUNT ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    
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
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No file uploaded'
        }
      });
    }

    // Convert image to base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Update user profile image
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { profileImage: base64Image },
      { new: true }
    ).select('-passwordHash');

    res.json({
      success: true,
      data: {
        profileImage: user.profileImage
      },
      message: 'Profile picture uploaded successfully'
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
