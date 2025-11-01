import express from 'express';
import {
  rewriteBulletPoints,
  rewriteSummary,
  generateCoverLetter,
  improveSection,
  healthCheck
} from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All AI routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/ai/rewrite/bullet-points
 * @desc    Rewrite bullet points with AI suggestions
 * @access  Premium users only
 */
router.post('/rewrite/bullet-points', rewriteBulletPoints);

/**
 * @route   POST /api/ai/rewrite/summary
 * @desc    Rewrite summary with AI suggestions
 * @access  Premium users only
 */
router.post('/rewrite/summary', rewriteSummary);

/**
 * @route   POST /api/ai/cover-letter
 * @desc    Generate cover letter based on resume and job description
 * @access  Premium users only
 */
router.post('/cover-letter', generateCoverLetter);

/**
 * @route   POST /api/ai/improve/section
 * @desc    Improve a specific resume section
 * @access  Premium users only
 */
router.post('/improve/section', improveSection);

/**
 * @route   GET /api/ai/health
 * @desc    Check AI service health
 * @access  Authenticated users
 */
router.get('/health', healthCheck);

export default router;
