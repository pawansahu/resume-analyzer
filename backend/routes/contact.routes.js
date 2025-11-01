import express from 'express';
import * as contactController from '../controllers/contact.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/contact/submit
 * @desc    Submit contact form
 * @access  Public
 */
router.post('/submit', contactController.submitContactForm);

/**
 * @route   GET /api/contact/all
 * @desc    Get all contact messages (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/all',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  contactController.getAllContacts
);

/**
 * @route   PUT /api/contact/:contactId/status
 * @desc    Update contact status (Admin only)
 * @access  Private (Admin)
 */
router.put(
  '/:contactId/status',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  contactController.updateContactStatus
);

/**
 * @route   GET /api/contact/stats
 * @desc    Get contact statistics (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/stats',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  contactController.getContactStats
);

export default router;
