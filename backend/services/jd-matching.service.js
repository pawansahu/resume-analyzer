/**
 * Job Description Matching Service
 * Compares resume content with job descriptions to calculate match percentage
 * and identify missing/matched keywords
 */

class JDMatchingService {
  constructor() {
    // Common stop words to filter out
    this.stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have',
      'had', 'what', 'when', 'where', 'who', 'which', 'why', 'how'
    ]);

    // Technical skills and keywords patterns
    this.skillPatterns = [
      // Programming languages
      /\b(javascript|typescript|python|java|c\+\+|c#|ruby|php|swift|kotlin|go|rust|scala)\b/gi,
      // Frameworks
      /\b(react|angular|vue|node\.?js|express|django|flask|spring|\.net|laravel)\b/gi,
      // Databases
      /\b(mongodb|mysql|postgresql|redis|elasticsearch|dynamodb|sql|nosql)\b/gi,
      // Cloud platforms
      /\b(aws|azure|gcp|google cloud|amazon web services|kubernetes|docker)\b/gi,
      // Tools
      /\b(git|jenkins|jira|confluence|slack|figma|sketch|photoshop)\b/gi,
      // Methodologies
      /\b(agile|scrum|kanban|devops|ci\/cd|tdd|bdd)\b/gi
    ];
  }

  /**
   * Compare resume with job description
   * @param {Object} resume - Parsed resume object
   * @param {string} jobDescription - Job description text
   * @returns {Promise<Object>} Match result with percentage and keywords
   */
  async compareResumeToJD(resume, jobDescription) {
    if (!resume || !jobDescription) {
      throw new Error('Resume and job description are required');
    }

    if (jobDescription.length > 10000) {
      throw new Error('Job description exceeds maximum length of 10,000 characters');
    }

    // Extract requirements from job description
    const jdRequirements = await this.extractJDRequirements(jobDescription);
    
    // Extract keywords from resume
    const resumeText = this.getResumeText(resume);
    const resumeKeywords = this.extractKeywords(resumeText);
    
    // Calculate match percentage
    const matchPercentage = await this.calculateMatchPercentage(
      resumeKeywords,
      jdRequirements
    );
    
    // Identify missing and matched keywords
    const missingKeywords = await this.identifyMissingKeywords(
      resumeKeywords,
      jdRequirements
    );
    
    const matchedKeywords = await this.identifyMatchedKeywords(
      resumeKeywords,
      jdRequirements
    );

    // Generate improvement suggestions
    const suggestions = this.generateSuggestions(matchPercentage, missingKeywords);

    return {
      matchPercentage,
      matchedKeywords,
      missingKeywords,
      suggestions,
      jdRequirements: {
        totalKeywords: jdRequirements.keywords.length,
        skills: jdRequirements.skills,
        experience: jdRequirements.experience
      }
    };
  }

  /**
   * Extract requirements and skills from job description
   * @param {string} jobDescription - Job description text
   * @returns {Promise<Object>} Extracted requirements
   */
  async extractJDRequirements(jobDescription) {
    const keywords = this.extractKeywords(jobDescription);
    const skills = this.extractSkills(jobDescription);
    const experience = this.extractExperience(jobDescription);
    const education = this.extractEducation(jobDescription);

    return {
      keywords,
      skills,
      experience,
      education,
      rawText: jobDescription
    };
  }

  /**
   * Extract keywords using NLP techniques
   * @param {string} text - Text to extract keywords from
   * @returns {Array<Object>} Array of keywords with frequency
   */
  extractKeywords(text) {
    if (!text) return [];

    // Normalize text
    const normalized = text.toLowerCase();
    
    // Extract words (alphanumeric and some special chars for tech terms)
    const words = normalized.match(/\b[\w\+\#\.]+\b/g) || [];
    
    // Count frequency
    const frequency = {};
    words.forEach(word => {
      // Skip stop words and very short words
      if (!this.stopWords.has(word) && word.length > 2) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });

    // Convert to array and sort by frequency
    const keywords = Object.entries(frequency)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);

    return keywords;
  }

  /**
   * Extract technical skills from text
   * @param {string} text - Text to extract skills from
   * @returns {Array<string>} Array of identified skills
   */
  extractSkills(text) {
    const skills = new Set();

    this.skillPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        skills.add(match.toLowerCase().trim());
      });
    });

    return Array.from(skills);
  }

  /**
   * Extract experience requirements from job description
   * @param {string} text - Job description text
   * @returns {Object} Experience requirements
   */
  extractExperience(text) {
    const experiencePatterns = [
      /(\d+)\+?\s*years?\s+(?:of\s+)?experience/gi,
      /experience\s+of\s+(\d+)\+?\s*years?/gi,
      /minimum\s+(\d+)\s*years?/gi
    ];

    let minYears = null;
    
    for (const pattern of experiencePatterns) {
      const match = text.match(pattern);
      if (match) {
        const years = parseInt(match[0].match(/\d+/)[0]);
        if (!minYears || years < minYears) {
          minYears = years;
        }
      }
    }

    return {
      minYears,
      found: minYears !== null
    };
  }

  /**
   * Extract education requirements from job description
   * @param {string} text - Job description text
   * @returns {Array<string>} Education requirements
   */
  extractEducation(text) {
    const educationKeywords = [
      'bachelor', 'master', 'phd', 'doctorate', 'degree',
      'diploma', 'certification', 'certified'
    ];

    const found = [];
    const normalized = text.toLowerCase();

    educationKeywords.forEach(keyword => {
      if (normalized.includes(keyword)) {
        found.push(keyword);
      }
    });

    return found;
  }

  /**
   * Calculate match percentage between resume and JD
   * @param {Array<Object>} resumeKeywords - Resume keywords with frequency
   * @param {Object} jdRequirements - JD requirements
   * @returns {Promise<number>} Match percentage (0-100)
   */
  async calculateMatchPercentage(resumeKeywords, jdRequirements) {
    const jdKeywords = jdRequirements.keywords;
    
    if (jdKeywords.length === 0) {
      return 0;
    }

    // Create a map of resume keywords for quick lookup
    const resumeKeywordMap = new Map(
      resumeKeywords.map(k => [k.word, k.count])
    );

    // Calculate matches with weighted scoring
    let totalWeight = 0;
    let matchedWeight = 0;

    jdKeywords.forEach(jdKeyword => {
      // Weight by frequency in JD (more important keywords appear more often)
      const weight = Math.min(jdKeyword.count, 5); // Cap at 5 to avoid over-weighting
      totalWeight += weight;

      if (resumeKeywordMap.has(jdKeyword.word)) {
        // Bonus for higher frequency in resume
        const resumeFreq = resumeKeywordMap.get(jdKeyword.word);
        const matchScore = Math.min(resumeFreq / jdKeyword.count, 1);
        matchedWeight += weight * matchScore;
      }
    });

    // Calculate percentage
    const percentage = totalWeight > 0 
      ? Math.round((matchedWeight / totalWeight) * 100)
      : 0;

    return Math.min(percentage, 100);
  }

  /**
   * Identify missing keywords from JD
   * @param {Array<Object>} resumeKeywords - Resume keywords
   * @param {Object} jdRequirements - JD requirements
   * @returns {Promise<Array<Object>>} Missing keywords with importance
   */
  async identifyMissingKeywords(resumeKeywords, jdRequirements) {
    const resumeKeywordSet = new Set(resumeKeywords.map(k => k.word));
    const jdKeywords = jdRequirements.keywords;

    // Find keywords in JD but not in resume
    const missing = jdKeywords
      .filter(jdKeyword => !resumeKeywordSet.has(jdKeyword.word))
      .map(jdKeyword => ({
        word: jdKeyword.word,
        frequency: jdKeyword.count,
        importance: this.calculateImportance(jdKeyword, jdRequirements)
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 20); // Top 20 missing keywords

    return missing;
  }

  /**
   * Identify matched keywords between resume and JD
   * @param {Array<Object>} resumeKeywords - Resume keywords
   * @param {Object} jdRequirements - JD requirements
   * @returns {Promise<Array<Object>>} Matched keywords with frequencies
   */
  async identifyMatchedKeywords(resumeKeywords, jdRequirements) {
    const resumeKeywordMap = new Map(
      resumeKeywords.map(k => [k.word, k.count])
    );
    const jdKeywords = jdRequirements.keywords;

    // Find keywords present in both
    const matched = jdKeywords
      .filter(jdKeyword => resumeKeywordMap.has(jdKeyword.word))
      .map(jdKeyword => ({
        word: jdKeyword.word,
        resumeFrequency: resumeKeywordMap.get(jdKeyword.word),
        jdFrequency: jdKeyword.count,
        importance: this.calculateImportance(jdKeyword, jdRequirements)
      }))
      .sort((a, b) => b.importance - a.importance);

    return matched;
  }

  /**
   * Calculate importance score for a keyword
   * @param {Object} keyword - Keyword object
   * @param {Object} jdRequirements - JD requirements
   * @returns {number} Importance score
   */
  calculateImportance(keyword, jdRequirements) {
    let score = keyword.count;

    // Boost if it's a technical skill
    if (jdRequirements.skills.includes(keyword.word)) {
      score *= 2;
    }

    // Boost if it appears in multiple contexts
    if (keyword.count > 3) {
      score *= 1.5;
    }

    return Math.round(score * 10) / 10;
  }

  /**
   * Generate improvement suggestions based on match results
   * @param {number} matchPercentage - Match percentage
   * @param {Array<Object>} missingKeywords - Missing keywords
   * @returns {Array<Object>} Improvement suggestions
   */
  generateSuggestions(matchPercentage, missingKeywords) {
    const suggestions = [];

    if (matchPercentage < 70) {
      suggestions.push({
        priority: 'critical',
        category: 'keywords',
        message: 'Your resume match is below 70%. Consider adding more relevant keywords from the job description.',
        action: 'Review the missing keywords list and incorporate relevant ones into your resume.'
      });
    }

    if (missingKeywords.length > 10) {
      const topMissing = missingKeywords.slice(0, 5).map(k => k.word).join(', ');
      suggestions.push({
        priority: 'important',
        category: 'keywords',
        message: `You're missing several important keywords: ${topMissing}`,
        action: 'Add these keywords naturally in your experience and skills sections.'
      });
    }

    if (matchPercentage >= 70 && matchPercentage < 85) {
      suggestions.push({
        priority: 'suggested',
        category: 'optimization',
        message: 'Good match! You can improve further by emphasizing matched keywords.',
        action: 'Increase the frequency of matched keywords in your resume where relevant.'
      });
    }

    if (matchPercentage >= 85) {
      suggestions.push({
        priority: 'suggested',
        category: 'optimization',
        message: 'Excellent match! Your resume aligns well with the job description.',
        action: 'Review the formatting and ensure your resume is ATS-friendly.'
      });
    }

    return suggestions;
  }

  /**
   * Get full text from parsed resume
   * @param {Object} resume - Parsed resume object
   * @returns {string} Full resume text
   */
  getResumeText(resume) {
    let text = '';

    if (resume.sections) {
      Object.values(resume.sections).forEach(section => {
        if (typeof section === 'string') {
          text += section + ' ';
        } else if (Array.isArray(section)) {
          text += section.join(' ') + ' ';
        }
      });
    }

    if (resume.rawText) {
      text += resume.rawText;
    }

    return text;
  }
}

export default new JDMatchingService();
