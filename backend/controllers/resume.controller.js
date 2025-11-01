import { uploadFileToS3, scheduleFileDeletion } from '../services/s3.service.js';
import { parseResume } from '../services/parser.service.js';
import atsScoringService from '../services/ats-scoring.service.js';
import recommendationService from '../services/recommendation.service.js';
import jdMatchingService from '../services/jd-matching.service.js';
import AnalysisResult from '../models/AnalysisResult.js';
import User from '../models/User.js';
import { USAGE_LIMITS } from '../middleware/usage.middleware.js';

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

    // Increment usage count for authenticated users
    let usageInfo = null;
    if (userId !== 'anonymous') {
      const user = await User.findById(userId);
      if (user) {
        user.usageCount += 1;
        await user.save();
        
        usageInfo = {
          usageCount: user.usageCount,
          usageLimit: USAGE_LIMITS[user.userTier] || USAGE_LIMITS.free,
          resetAt: user.dailyUsageResetAt
        };
      }
    }

    // Return response
    res.status(200).json({
      success: true,
      data: {
        analysisId: analysisResult._id,
        s3Key: key,
        parsedResume: parsedResume,
        atsScore: atsScore,
        recommendations: recommendations,
        usageInfo: usageInfo,
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


/**
 * Get user's recent analyses
 * GET /api/resume/my-analyses
 */
export const getUserAnalyses = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 10;
    
    // Fetch user's analyses from database, sorted by most recent
    const analyses = await AnalysisResult.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('_id resumeS3Key atsScore createdAt parsedData')
      .lean();
    
    // Format the response
    const formattedAnalyses = analyses.map(analysis => {
      const sections = analysis.parsedData?.sections || {};
      const skills = sections.skills || [];
      const experience = sections.experience || [];
      
      return {
        id: analysis._id,
        fileName: analysis.parsedData?.fileName || analysis.parsedData?.metadata?.fileName || 'Resume.pdf',
        atsScore: analysis.atsScore?.totalScore || 0,
        date: analysis.createdAt,
        matchedKeywords: skills.length, // Actual number of skills/keywords
        sections: Object.keys(sections).length,
        pages: analysis.parsedData?.pages || 1,
        wordCount: analysis.parsedData?.metadata?.wordCount || 0,
        experienceCount: experience.length
      };
    });
    
    res.json({
      success: true,
      data: formattedAnalyses,
      count: formattedAnalyses.length
    });
    
  } catch (error) {
    console.error('Error fetching user analyses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analyses'
    });
  }
};


/**
 * Download analysis report as PDF
 * GET /api/resume/report/:id
 */
export const downloadReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Fetch analysis result
    const analysisResult = await AnalysisResult.findById(id);
    
    if (!analysisResult) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }
    
    // Check if user has access
    if (analysisResult.userId && analysisResult.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this analysis'
      });
    }
    
    // Import report service dynamically
    const reportService = await import('../services/report.service.js');
    
    // Generate PDF report
    const pdfBuffer = await reportService.default.generatePDFReport(analysisResult);
    
    // Set response headers for PDF download
    const fileName = `Resume_Analysis_${analysisResult._id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF buffer
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
};


/**
 * Generate shareable link for analysis
 * POST /api/resume/share/:id
 */
export const generateShareLink = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { expiresInDays = 7 } = req.body;
    
    const analysisResult = await AnalysisResult.findById(id);
    
    if (!analysisResult) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }
    
    // Check ownership
    if (analysisResult.userId && analysisResult.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this analysis'
      });
    }
    
    // Generate unique share token
    const crypto = await import('crypto');
    const shareToken = crypto.randomBytes(32).toString('hex');
    
    // Set expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    
    // Update analysis with share info
    analysisResult.shareToken = shareToken;
    analysisResult.isPublic = true;
    analysisResult.shareExpiresAt = expiresAt;
    await analysisResult.save();
    
    // Generate share URL
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/shared/${shareToken}`;
    
    res.json({
      success: true,
      data: {
        shareToken,
        shareUrl,
        expiresAt
      }
    });
    
  } catch (error) {
    console.error('Generate share link error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate share link'
    });
  }
};

/**
 * Get shared analysis (public access)
 * GET /api/resume/shared/:shareToken
 */
export const getSharedAnalysis = async (req, res) => {
  try {
    const { shareToken } = req.params;
    
    const analysisResult = await AnalysisResult.findOne({
      shareToken,
      isPublic: true
    });
    
    if (!analysisResult) {
      return res.status(404).json({
        success: false,
        error: 'Shared analysis not found or expired'
      });
    }
    
    // Check if share link has expired
    if (analysisResult.shareExpiresAt && analysisResult.shareExpiresAt < new Date()) {
      return res.status(410).json({
        success: false,
        error: 'This share link has expired'
      });
    }
    
    // Increment share count
    analysisResult.shareCount = (analysisResult.shareCount || 0) + 1;
    await analysisResult.save();
    
    // Return analysis data (without sensitive info)
    res.json({
      success: true,
      data: {
        atsScore: analysisResult.atsScore,
        recommendations: analysisResult.recommendations,
        createdAt: analysisResult.createdAt,
        fileName: analysisResult.parsedData?.fileName || 'Resume',
        sections: Object.keys(analysisResult.parsedData?.sections || {}).length,
        skills: analysisResult.parsedData?.sections?.skills?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Get shared analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shared analysis'
    });
  }
};
