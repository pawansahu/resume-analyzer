import { uploadFileToS3, scheduleFileDeletion } from '../services/s3.service.js';
import { parseResume } from '../services/parser.service.js';
import atsScoringService from '../services/ats-scoring.service.js';
import recommendationService from '../services/recommendation.service.js';
import jdMatchingService from '../services/jd-matching.service.js';
import AnalysisResult from '../models/AnalysisResult.js';

/**
 * Upload and parse resume
 * POST /api/resume/upload
 */
export const uploadResume = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No file uploaded'
        }
      });
    }

    // Get user ID (from auth middleware or anonymous)
    const userId = req.user?.userId || 'anonymous';

    // Validate file type
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'Only PDF and DOCX files are supported'
        }
      });
    }

    // Upload to S3
    const { key, bucket } = await uploadFileToS3(
      req.file.buffer,
      userId,
      fileExtension
    );

    // Schedule file deletion after 24 hours
    await scheduleFileDeletion(key, 24);

    // Parse resume
    const parsedResume = await parseResume(req.file.buffer, fileExtension);

    // Calculate ATS score
    const atsScore = atsScoringService.calculateScore(parsedResume);

    // Generate recommendations
    const recommendations = recommendationService.generateRecommendations(
      atsScore,
      parsedResume
    );

    // Save analysis result to database
    const analysisResult = new AnalysisResult({
      userId: userId === 'anonymous' ? null : userId,
      resumeS3Key: key,
      parsedData: parsedResume,
      atsScore: atsScore,
      recommendations: recommendations,
      createdAt: new Date()
    });

    await analysisResult.save();

    // Return response
    res.status(200).json({
      success: true,
      data: {
        analysisId: analysisResult._id,
        s3Key: key,
        parsedResume: parsedResume,
        atsScore: atsScore,
        recommendations: recommendations,
        message: 'Resume uploaded and parsed successfully'
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: error.message || 'Failed to upload and parse resume'
      }
    });
  }
};

/**
 * Get analysis result by ID
 * GET /api/resume/analysis/:id
 */
export const getAnalysisResult = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const analysisResult = await AnalysisResult.findById(id);

    if (!analysisResult) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Analysis result not found'
        }
      });
    }

    // Check if user has access to this analysis
    if (analysisResult.userId && analysisResult.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this analysis'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: analysisResult
    });

  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch analysis result'
      }
    });
  }
};

/**
 * Compare resume with job description
 * POST /api/resume/match-jd
 */
export const matchJobDescription = async (req, res) => {
  try {
    const { analysisId, jobDescription } = req.body;

    // Validate inputs
    if (!analysisId || !jobDescription) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Analysis ID and job description are required'
        }
      });
    }

    if (jobDescription.length > 10000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'JD_TOO_LONG',
          message: 'Job description exceeds maximum length of 10,000 characters'
        }
      });
    }

    // Get analysis result
    const analysisResult = await AnalysisResult.findById(analysisId);

    if (!analysisResult) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Analysis result not found'
        }
      });
    }

    // Check if user has access to this analysis
    const userId = req.user?.userId;
    if (analysisResult.userId && analysisResult.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this analysis'
        }
      });
    }

    // Perform JD matching
    const matchResult = await jdMatchingService.compareResumeToJD(
      analysisResult.parsedData,
      jobDescription
    );

    // Update analysis result with JD match data
    analysisResult.jdMatchResult = matchResult;
    analysisResult.jobDescription = jobDescription;
    analysisResult.updatedAt = new Date();
    await analysisResult.save();

    res.status(200).json({
      success: true,
      data: matchResult
    });

  } catch (error) {
    console.error('JD matching error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'MATCHING_FAILED',
        message: error.message || 'Failed to match job description'
      }
    });
  }
};

export default {
  uploadResume,
  getAnalysisResult,
  matchJobDescription
};
