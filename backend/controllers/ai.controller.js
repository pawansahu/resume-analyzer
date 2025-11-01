import aiService from '../services/ai.service.js';

/**
 * Rewrite bullet points with AI suggestions
 */
export const rewriteBulletPoints = async (req, res) => {
  try {
    const { bulletPoints } = req.body;

    if (!bulletPoints || !Array.isArray(bulletPoints) || bulletPoints.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Bullet points array is required'
        }
      });
    }

    // Check if user has premium access
    if (req.user.userTier !== 'premium' && req.user.userTier !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PREMIUM_FEATURE',
          message: 'AI rewrite is a premium feature. Please upgrade your account.'
        }
      });
    }

    const rewrites = await aiService.rewriteBulletPoints(bulletPoints);

    res.json({
      success: true,
      data: {
        rewrites
      }
    });
  } catch (error) {
    console.error('Error in rewriteBulletPoints:', error);
    
    if (error.message.includes('timeout')) {
      return res.status(504).json({
        success: false,
        error: {
          code: 'AI_TIMEOUT',
          message: 'AI service is taking longer than expected. Please try again.',
          details: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'AI_SERVICE_ERROR',
        message: error.message || 'Failed to generate rewrites'
      }
    });
  }
};

/**
 * Rewrite summary with AI suggestions
 */
export const rewriteSummary = async (req, res) => {
  try {
    const { summary } = req.body;

    if (!summary || typeof summary !== 'string' || summary.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Summary text is required'
        }
      });
    }

    // Check if user has premium access
    if (req.user.userTier !== 'premium' && req.user.userTier !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PREMIUM_FEATURE',
          message: 'AI rewrite is a premium feature. Please upgrade your account.'
        }
      });
    }

    const summaries = await aiService.rewriteSummary(summary);

    res.json({
      success: true,
      data: {
        summaries
      }
    });
  } catch (error) {
    console.error('Error in rewriteSummary:', error);
    
    if (error.message.includes('timeout')) {
      return res.status(504).json({
        success: false,
        error: {
          code: 'AI_TIMEOUT',
          message: 'AI service is taking longer than expected. Please try again.',
          details: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'AI_SERVICE_ERROR',
        message: error.message || 'Failed to generate summary rewrites'
      }
    });
  }
};

/**
 * Generate cover letter based on resume and job description
 */
export const generateCoverLetter = async (req, res) => {
  try {
    const { resume, jobDescription } = req.body;

    if (!resume || !jobDescription) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Resume and job description are required'
        }
      });
    }

    // Check if user has premium access
    if (req.user.userTier !== 'premium' && req.user.userTier !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PREMIUM_FEATURE',
          message: 'Cover letter generation is a premium feature. Please upgrade your account.'
        }
      });
    }

    const coverLetter = await aiService.generateCoverLetter(resume, jobDescription);

    res.json({
      success: true,
      data: {
        coverLetter
      }
    });
  } catch (error) {
    console.error('Error in generateCoverLetter:', error);
    
    if (error.message.includes('timeout')) {
      return res.status(504).json({
        success: false,
        error: {
          code: 'AI_TIMEOUT',
          message: 'AI service is taking longer than expected. Please try again.',
          details: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'AI_SERVICE_ERROR',
        message: error.message || 'Failed to generate cover letter'
      }
    });
  }
};

/**
 * Improve a specific resume section
 */
export const improveSection = async (req, res) => {
  try {
    const { sectionText, sectionType } = req.body;

    if (!sectionText || !sectionType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Section text and type are required'
        }
      });
    }

    // Check if user has premium access
    if (req.user.userTier !== 'premium' && req.user.userTier !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PREMIUM_FEATURE',
          message: 'Section improvement is a premium feature. Please upgrade your account.'
        }
      });
    }

    const improvements = await aiService.improveSection(sectionText, sectionType);

    res.json({
      success: true,
      data: {
        improvements
      }
    });
  } catch (error) {
    console.error('Error in improveSection:', error);
    
    if (error.message.includes('timeout')) {
      return res.status(504).json({
        success: false,
        error: {
          code: 'AI_TIMEOUT',
          message: 'AI service is taking longer than expected. Please try again.',
          details: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'AI_SERVICE_ERROR',
        message: error.message || 'Failed to generate section improvements'
      }
    });
  }
};

/**
 * Check AI service health
 */
export const healthCheck = async (req, res) => {
  try {
    const health = await aiService.healthCheck();
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error in AI health check:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Failed to check AI service health'
      }
    });
  }
};
