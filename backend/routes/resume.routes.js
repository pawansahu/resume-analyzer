import express from 'express';
import * as resumeController from '../controllers/resume.controller.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.middleware.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Resume upload endpoint - supports both authenticated and anonymous users
router.post('/upload', optionalAuth, uploadSingle, handleUploadError, resumeController.uploadResume);

// Get analysis result - requires authentication
router.get('/analysis/:id', authenticate, resumeController.getAnalysisResult);

// Job description matching endpoint - supports both authenticated and anonymous users
router.post('/match-jd', optionalAuth, resumeController.matchJobDescription);

export default router;
