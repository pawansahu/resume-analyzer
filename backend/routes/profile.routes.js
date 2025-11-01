import express from 'express';
import * as profileController from '../controllers/profile.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

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
router.post('/picture', authenticate, profileController.uploadProfilePicture);

export default router;
