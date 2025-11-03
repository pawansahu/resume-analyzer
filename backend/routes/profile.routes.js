import express from 'express';
import multer from 'multer';
import * as profileController from '../controllers/profile.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Configure multer for profile image upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  }
});

/**
 * @route   GET /api/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/', authenticate, profileController.getProfile);

/**
 * @route   PUT /api/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/', authenticate, profileController.updateProfile);

/**
 * @route   PUT /api/profile/password
 * @desc    Change password
 * @access  Private
 */
router.put('/password', authenticate, profileController.changePassword);

/**
 * @route   DELETE /api/profile
 * @desc    Delete account
 * @access  Private
 */
router.delete('/', authenticate, profileController.deleteAccount);

/**
 * @route   POST /api/profile/picture
 * @desc    Upload profile picture
 * @access  Private
 */
router.post('/picture', authenticate, upload.single('profileImage'), profileController.uploadProfilePicture);

export default router;
