import OpenAI from 'openai';

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai';
    this.timeout = 30000; // 30 seconds
    this.maxRetries = 2;
    
    if (this.provider === 'openai') {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️  OPENAI_API_KEY not configured. AI features will not work.');
        this.client = null;
      } else {
        this.client = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          timeout: this.timeout,
        });
      }
    }
  }

  /**
   * Rewrite bullet points with improved clarity and impact
   * @param {string[]} bulletPoints - Array of bullet points to rewrite
   * @returns {Promise<Array<{original: string, suggestions: string[]}>>}
   */
  async rewriteBulletPoints(bulletPoints) {
    if (!this.client) {
      throw new Error('AI service not configured. Please set OPENAI_API_KEY.');
    }
    
    if (!bulletPoints || bulletPoints.length === 0) {
      throw new Error('Bullet points array is required');
    }

    const prompt = `You are an expert resume writer. Rewrite the following bullet points to be more impactful, clear, and ATS-friendly. For each bullet point, provide 3 alternative versions that:
- Start with strong action verbs
- Include quantifiable achievements where possible
- Are concise and clear
- Use industry-standard terminology
- Maintain factual accuracy

Bullet points to rewrite:
${bulletPoints.map((bp, idx) => `${idx + 1}. ${bp}`).join('\n')}

Respond in JSON format:
{
  "rewrites": [
    {
      "original": "original bullet point",
      "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
    }
  ]
}`;

    try {
      const result = await this._callAIWithRetry(prompt);
      return result.rewrites;
    } catch (error) {
      console.error('Error rewriting bullet points:', error);
      throw new Error('Failed to generate bullet point rewrites. Please try again.');
    }
  }

  /**
   * Rewrite resume summary with multiple alternatives
   * @param {string} summary - Original summary text
   * @returns {Promise<string[]>} Array of 3 alternative summaries
   */
  async rewriteSummary(summary) {
    if (!this.client) {
      throw new Error('AI service not configured. Please set OPENAI_API_KEY.');
    }
    
    if (!summary || summary.trim().length === 0) {
      throw new Error('Summary text is required');
    }

    const prompt = `You are an expert resume writer. Rewrite the following professional summary to be more compelling and ATS-friendly. Provide 3 different versions that:
- Highlight key strengths and achievements
- Use industry-relevant keywords
- Are concise (2-3 sentences)
- Maintain a professional tone
- Emphasize unique value proposition

Original summary:
${summary}

Respond in JSON format:
{
  "summaries": ["version 1", "version 2", "version 3"]
}`;

    try {
      const result = await this._callAIWithRetry(prompt);
      return result.summaries;
    } catch (error) {
      console.error('Error rewriting summary:', error);
      throw new Error('Failed to generate summary rewrites. Please try again.');
    }
  }

  /**
   * Generate a tailored cover letter based on resume and job description
   * @param {Object} resume - Parsed resume data
   * @param {string} jobDescription - Job description text
   * @returns {Promise<string>} Generated cover letter
   */
  async generateCoverLetter(resume, jobDescription) {
    if (!this.client) {
      throw new Error('AI service not configured. Please set OPENAI_API_KEY.');
    }
    
    if (!resume || !jobDescription) {
      throw new Error('Resume and job description are required');
    }

    const resumeContext = this._buildResumeContext(resume);

    const prompt = `You are an expert career coach. Generate a professional cover letter based on the candidate's resume and the job description provided.

Resume Summary:
${resumeContext}

Job Description:
${jobDescription}

Create a compelling cover letter that:
- Has a strong opening that captures attention
- Highlights 2-3 most relevant experiences from the resume that match the job requirements
- Demonstrates understanding of the company/role
- Shows enthusiasm and cultural fit
- Has a clear call-to-action in the closing
- Is 3-4 paragraphs long
- Uses a professional but personable tone

Respond in JSON format:
{
  "coverLetter": "the complete cover letter text"
}`;

    try {
      const result = await this._callAIWithRetry(prompt);
      return result.coverLetter;
    } catch (error) {
      console.error('Error generating cover letter:', error);
      throw new Error('Failed to generate cover letter. Please try again.');
    }
  }

  /**
   * Improve a specific resume section
   * @param {string} sectionText - Text of the section to improve
   * @param {string} sectionType - Type of section (experience, education, skills, etc.)
   * @returns {Promise<string[]>} Array of 3 improved versions
   */
  async improveSection(sectionText, sectionType) {
    if (!this.client) {
      throw new Error('AI service not configured. Please set OPENAI_API_KEY.');
    }
    
    if (!sectionText || !sectionType) {
      throw new Error('Section text and type are required');
    }

    const prompt = `You are an expert resume writer. Improve the following ${sectionType} section to be more effective and ATS-friendly. Provide 3 different improved versions that:
- Use strong, relevant keywords
- Are well-structured and easy to scan
- Highlight achievements and impact
- Follow best practices for ${sectionType} sections

Original ${sectionType} section:
${sectionText}

Respond in JSON format:
{
  "improvements": ["version 1", "version 2", "version 3"]
}`;

    try {
      const result = await this._callAIWithRetry(prompt);
      return result.improvements;
    } catch (error) {
      console.error('Error improving section:', error);
      throw new Error('Failed to generate section improvements. Please try again.');
    }
  }

  /**
   * Call AI API with retry logic and timeout handling
   * @private
   */
  async _callAIWithRetry(prompt, retryCount = 0) {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI request timeout')), this.timeout);
      });

      const apiPromise = this._callAI(prompt);

      const response = await Promise.race([apiPromise, timeoutPromise]);
      return response;
    } catch (error) {
      if (retryCount < this.maxRetries) {
        console.log(`Retrying AI request (attempt ${retryCount + 1}/${this.maxRetries})...`);
        await this._delay(5000); // 5 second delay before retry
        return this._callAIWithRetry(prompt, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Call the AI API based on provider
   * @private
   */
  async _callAI(prompt) {
    if (this.provider === 'openai') {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume writer and career coach. Always respond with valid JSON format as requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const content = completion.choices[0].message.content;
      return JSON.parse(content);
    } else if (this.provider === 'gemini') {
      // Placeholder for Gemini implementation
      throw new Error('Gemini provider not yet implemented');
    } else {
      throw new Error(`Unsupported AI provider: ${this.provider}`);
    }
  }

  /**
   * Build resume context for AI prompts
   * @private
   */
  _buildResumeContext(resume) {
    const parts = [];

    if (resume.contactInfo) {
      parts.push(`Name: ${resume.contactInfo.name || 'Not provided'}`);
    }

    if (resume.sections?.summary) {
      parts.push(`\nSummary:\n${resume.sections.summary}`);
    }

    if (resume.sections?.experience) {
      parts.push(`\nExperience:\n${resume.sections.experience}`);
    }

    if (resume.sections?.education) {
      parts.push(`\nEducation:\n${resume.sections.education}`);
    }

    if (resume.sections?.skills) {
      parts.push(`\nSkills:\n${resume.sections.skills}`);
    }

    return parts.join('\n');
  }

  /**
   * Delay helper for retry logic
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if AI service is available
   */
  async healthCheck() {
    try {
      if (!this.client) {
        return { status: 'not_configured', provider: this.provider, message: 'API key not set' };
      }
      
      if (this.provider === 'openai') {
        // Simple test call
        await this.client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5
        });
        return { status: 'healthy', provider: this.provider };
      }
      return { status: 'unknown', provider: this.provider };
    } catch (error) {
      return { status: 'unhealthy', provider: this.provider, error: error.message };
    }
  }
}

export default new AIService();
