import express from 'express';
import reportController from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All report routes require authentication
router.use(authenticate);

// Generate PDF report
router.post('/generate/:analysisId', reportController.generateReport);

// Get on-screen report preview
router.get('/preview/:analysisId', reportController.getReportPreview);

// Regenerate expired download link
router.post('/regenerate-link/:analysisId', reportController.regenerateDownloadLink);

export default router;
