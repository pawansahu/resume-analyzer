import express from 'express';
import * as resumeController from '../controllers/resume.controller.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.middleware.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { checkUsageLimit, getUserUsage } from '../middleware/usage.middleware.js';
import { checkPremiumFeature, getUserFeatures } from '../middleware/premium.middleware.js';

const router = express.Router();

// Resume upload endpoint - supports both authenticated and anonymous users
// Check usage limit before upload
router.post('/upload', optionalAuth, checkUsageLimit, uploadSingle, handleUploadError, resumeController.uploadResume);

// Get user's current usage info
router.get('/usage', authenticate, getUserUsage);

// Get user's accessible features
router.get('/features', authenticate, getUserFeatures);

// Get analysis result - requires authentication
router.get('/analysis/:id', authenticate, resumeController.getAnalysisResult);

// Job description matching endpoint - PREMIUM FEATURE
router.post('/match-jd', authenticate, checkPremiumFeature('Job Description Matching'), resumeController.matchJobDescription);

// Get user's recent analyses - requires authentication
router.get('/my-analyses', authenticate, resumeController.getUserAnalyses);

// Download analysis report as PDF - requires authentication
router.get('/report/:id', authenticate, resumeController.downloadReport);

// Generate shareable link - requires authentication
router.post('/share/:id', authenticate, resumeController.generateShareLink);

// Get shared analysis (public, no auth required)
router.get('/shared/:shareToken', resumeController.getSharedAnalysis);

export default router;
