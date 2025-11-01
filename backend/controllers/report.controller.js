import reportService from '../services/report.service.js';
import AnalysisResult from '../models/AnalysisResult.js';

class ReportController {
  /**
   * Generate and download PDF report
   * @route POST /api/reports/generate/:analysisId
   */
  async generateReport(req, res) {
    try {
      const { analysisId } = req.params;
      const userId = req.user.id;
      const userTier = req.user.userTier || 'free';

      // Fetch analysis result
      const analysisResult = await AnalysisResult.findOne({
        _id: analysisId,
        userId: userId
      });

      if (!analysisResult) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ANALYSIS_NOT_FOUND',
            message: 'Analysis result not found'
          }
        });
      }

      // Check if report already exists and is still valid
      if (analysisResult.reportDownloadUrl && analysisResult.reportExpiresAt) {
        const now = new Date();
        if (analysisResult.reportExpiresAt > now) {
          return res.json({
            success: true,
            data: {
              reportUrl: analysisResult.reportDownloadUrl,
              expiresAt: analysisResult.reportExpiresAt,
              cached: true
            }
          });
        }
      }

      // Generate PDF report
      const pdfBuffer = await reportService.generatePDFReport(analysisResult, userTier);

      // Upload to S3 and get signed URL
      const { s3Key, downloadUrl, expiresAt } = await reportService.uploadReportToS3(
        pdfBuffer,
        userId
      );

      // Update analysis result with report info
      analysisResult.reportS3Key = s3Key;
      analysisResult.reportDownloadUrl = downloadUrl;
      analysisResult.reportExpiresAt = expiresAt;
      await analysisResult.save();

      res.json({
        success: true,
        data: {
          reportUrl: downloadUrl,
          expiresAt: expiresAt,
          cached: false
        }
      });
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'REPORT_GENERATION_FAILED',
          message: 'Failed to generate report. Please try again.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }

  /**
   * Get on-screen report data
   * @route GET /api/reports/preview/:analysisId
   */
  async getReportPreview(req, res) {
    try {
      const { analysisId } = req.params;
      const userId = req.user.id;

      // Fetch analysis result
      const analysisResult = await AnalysisResult.findOne({
        _id: analysisId,
        userId: userId
      });

      if (!analysisResult) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ANALYSIS_NOT_FOUND',
            message: 'Analysis result not found'
          }
        });
      }

      // Generate on-screen report data
      const reportData = await reportService.generateOnScreenReport(analysisResult);

      res.json({
        success: true,
        data: reportData
      });
    } catch (error) {
      console.error('Error generating report preview:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'REPORT_PREVIEW_FAILED',
          message: 'Failed to generate report preview',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }

  /**
   * Regenerate expired report download link
   * @route POST /api/reports/regenerate-link/:analysisId
   */
  async regenerateDownloadLink(req, res) {
    try {
      const { analysisId } = req.params;
      const userId = req.user.id;

      // Fetch analysis result
      const analysisResult = await AnalysisResult.findOne({
        _id: analysisId,
        userId: userId
      });

      if (!analysisResult) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ANALYSIS_NOT_FOUND',
            message: 'Analysis result not found'
          }
        });
      }

      if (!analysisResult.reportS3Key) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'REPORT_NOT_GENERATED',
            message: 'Report has not been generated yet'
          }
        });
      }

      // Generate new signed URL
      const expiryDays = 7;
      const downloadUrl = await reportService.generateDownloadLink(
        analysisResult.reportS3Key,
        expiryDays
      );
      const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

      // Update analysis result
      analysisResult.reportDownloadUrl = downloadUrl;
      analysisResult.reportExpiresAt = expiresAt;
      await analysisResult.save();

      res.json({
        success: true,
        data: {
          reportUrl: downloadUrl,
          expiresAt: expiresAt
        }
      });
    } catch (error) {
      console.error('Error regenerating download link:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'LINK_REGENERATION_FAILED',
          message: 'Failed to regenerate download link',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }
}

export default new ReportController();
