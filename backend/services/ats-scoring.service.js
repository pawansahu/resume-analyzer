/**
 * ATS Scoring Service
 * Analyzes resumes and calculates ATS compatibility scores
 */

class ATSScoringService {
  /**
   * Calculate complete ATS score for a parsed resume
   * @param {Object} parsedResume - Parsed resume data
   * @returns {Object} Complete ATS score with breakdown
   */
  calculateScore(parsedResume) {
    const structureScore = this.analyzeStructure(parsedResume);
    const keywordScore = this.analyzeKeywords(parsedResume);
    const readabilityScore = this.analyzeReadability(parsedResume);
    const formattingScore = this.analyzeFormatting(parsedResume);

    const totalScore = Math.round(
      structureScore.score + 
      keywordScore.score + 
      readabilityScore.score + 
      formattingScore.score
    );

    return {
      totalScore,
      structureScore: structureScore.score,
      keywordScore: keywordScore.score,
      readabilityScore: readabilityScore.score,
      formattingScore: formattingScore.score,
      breakdown: {
        structure: structureScore.details,
        keywords: keywordScore.details,
        readability: readabilityScore.details,
        formatting: formattingScore.details
      }
    };
  }

  /**
   * Analyze resume structure (25% of total score)
   * @param {Object} parsedResume - Parsed resume data
   * @returns {Object} Structure score and details
   */
  analyzeStructure(parsedResume) {
    const { sections = {} } = parsedResume;
    const details = {
      hasContact: false,
      hasSummary: false,
      hasExperience: false,
      hasEducation: false,
      hasSkills: false,
      properHeadings: false,
      logicalOrder: false
    };

    let score = 0;
    const maxScore = 25;

    // Check for contact information (4 points)
    if (sections.contact && sections.contact.length > 0) {
      details.hasContact = true;
      score += 4;
    }

    // Check for summary/objective (3 points)
    if (sections.summary && sections.summary.length > 0) {
      details.hasSummary = true;
      score += 3;
    }

    // Check for experience section (6 points - most important)
    if (sections.experience && sections.experience.length > 0) {
      details.hasExperience = true;
      score += 6;
    }

    // Check for education section (4 points)
    if (sections.education && sections.education.length > 0) {
      details.hasEducation = true;
      score += 4;
    }

    // Check for skills section (4 points)
    if (sections.skills && sections.skills.length > 0) {
      details.hasSkills = true;
      score += 4;
    }

    // Check for proper headings (2 points)
    const headingPatterns = /^(contact|summary|objective|experience|work history|education|skills|certifications)/i;
    const text = parsedResume.rawText || '';
    const lines = text.split('\n');
    const hasProperHeadings = lines.some(line => headingPatterns.test(line.trim()));
    if (hasProperHeadings) {
      details.properHeadings = true;
      score += 2;
    }

    // Check for logical section order (2 points)
    const sectionOrder = Object.keys(sections);
    const idealOrder = ['contact', 'summary', 'experience', 'education', 'skills'];
    let orderScore = 0;
    for (let i = 0; i < sectionOrder.length - 1; i++) {
      const currentIdx = idealOrder.indexOf(sectionOrder[i]);
      const nextIdx = idealOrder.indexOf(sectionOrder[i + 1]);
      if (currentIdx !== -1 && nextIdx !== -1 && currentIdx < nextIdx) {
        orderScore++;
      }
    }
    if (orderScore >= 2) {
      details.logicalOrder = true;
      score += 2;
    }

    return {
      score: Math.min(score, maxScore),
      details
    };
  }

  /**
   * Analyze keywords and action verbs (30% of total score)
   * @param {Object} parsedResume - Parsed resume data
   * @returns {Object} Keyword score and details
   */
  analyzeKeywords(parsedResume) {
    const text = (parsedResume.rawText || '').toLowerCase();
    const details = {
      actionVerbCount: 0,
      industryKeywordCount: 0,
      technicalSkillCount: 0,
      quantifiableAchievements: 0,
      keywordDensity: 0
    };

    let score = 0;
    const maxScore = 30;

    // Action verbs (8 points)
    const actionVerbs = [
      'achieved', 'improved', 'trained', 'managed', 'created', 'designed',
      'developed', 'implemented', 'increased', 'decreased', 'reduced',
      'led', 'coordinated', 'executed', 'launched', 'established',
      'streamlined', 'optimized', 'resolved', 'generated', 'delivered',
      'built', 'initiated', 'spearheaded', 'transformed', 'accelerated'
    ];
    
    details.actionVerbCount = actionVerbs.filter(verb => 
      text.includes(verb)
    ).length;
    
    score += Math.min((details.actionVerbCount / 10) * 8, 8);

    // Industry keywords (8 points)
    const industryKeywords = [
      'project management', 'agile', 'scrum', 'leadership', 'strategy',
      'analysis', 'collaboration', 'communication', 'problem solving',
      'innovation', 'customer service', 'sales', 'marketing', 'finance',
      'operations', 'quality assurance', 'compliance', 'budget', 'roi'
    ];
    
    details.industryKeywordCount = industryKeywords.filter(keyword => 
      text.includes(keyword)
    ).length;
    
    score += Math.min((details.industryKeywordCount / 8) * 8, 8);

    // Technical skills (7 points)
    const technicalSkills = [
      'python', 'java', 'javascript', 'sql', 'aws', 'azure', 'docker',
      'kubernetes', 'react', 'angular', 'node', 'api', 'database',
      'cloud', 'devops', 'ci/cd', 'git', 'linux', 'excel', 'tableau',
      'powerbi', 'salesforce', 'sap', 'erp', 'crm'
    ];
    
    details.technicalSkillCount = technicalSkills.filter(skill => 
      text.includes(skill)
    ).length;
    
    score += Math.min((details.technicalSkillCount / 8) * 7, 7);

    // Quantifiable achievements (5 points)
    const numberPattern = /\d+%|\$\d+|\d+\+|increased by \d+|reduced by \d+|saved \d+/gi;
    const matches = text.match(numberPattern) || [];
    details.quantifiableAchievements = matches.length;
    score += Math.min((details.quantifiableAchievements / 5) * 5, 5);

    // Keyword density (2 points)
    const words = text.split(/\s+/).length;
    const totalKeywords = details.actionVerbCount + details.industryKeywordCount + details.technicalSkillCount;
    details.keywordDensity = words > 0 ? (totalKeywords / words) * 100 : 0;
    
    if (details.keywordDensity >= 2 && details.keywordDensity <= 5) {
      score += 2; // Optimal density
    } else if (details.keywordDensity > 1 && details.keywordDensity < 6) {
      score += 1; // Acceptable density
    }

    return {
      score: Math.min(Math.round(score), maxScore),
      details
    };
  }

  /**
   * Analyze readability (25% of total score)
   * @param {Object} parsedResume - Parsed resume data
   * @returns {Object} Readability score and details
   */
  analyzeReadability(parsedResume) {
    const text = parsedResume.rawText || '';
    const details = {
      fleschScore: 0,
      avgSentenceLength: 0,
      avgWordLength: 0,
      complexWordPercentage: 0,
      readabilityLevel: ''
    };

    let score = 0;
    const maxScore = 25;

    // Calculate Flesch Reading Ease (15 points)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = this._countSyllables(text);

    if (sentences.length > 0 && words.length > 0) {
      details.avgSentenceLength = words.length / sentences.length;
      details.avgWordLength = text.replace(/\s/g, '').length / words.length;
      
      const avgSyllablesPerWord = syllables / words.length;
      details.fleschScore = 206.835 - 1.015 * details.avgSentenceLength - 84.6 * avgSyllablesPerWord;
      details.fleschScore = Math.max(0, Math.min(100, details.fleschScore));

      // Score based on Flesch score (60-70 is ideal for resumes)
      if (details.fleschScore >= 60 && details.fleschScore <= 70) {
        score += 15;
        details.readabilityLevel = 'Excellent';
      } else if (details.fleschScore >= 50 && details.fleschScore < 80) {
        score += 12;
        details.readabilityLevel = 'Good';
      } else if (details.fleschScore >= 40 && details.fleschScore < 90) {
        score += 9;
        details.readabilityLevel = 'Fair';
      } else {
        score += 5;
        details.readabilityLevel = 'Needs Improvement';
      }
    }

    // Sentence length check (5 points)
    if (details.avgSentenceLength >= 15 && details.avgSentenceLength <= 20) {
      score += 5; // Ideal length
    } else if (details.avgSentenceLength >= 12 && details.avgSentenceLength <= 25) {
      score += 3; // Acceptable
    } else {
      score += 1; // Too short or too long
    }

    // Complex word percentage (5 points)
    const complexWords = words.filter(word => this._countWordSyllables(word) >= 3);
    details.complexWordPercentage = words.length > 0 ? (complexWords.length / words.length) * 100 : 0;
    
    if (details.complexWordPercentage <= 15) {
      score += 5; // Good balance
    } else if (details.complexWordPercentage <= 25) {
      score += 3; // Acceptable
    } else {
      score += 1; // Too complex
    }

    return {
      score: Math.min(Math.round(score), maxScore),
      details
    };
  }

  /**
   * Analyze formatting (20% of total score)
   * @param {Object} parsedResume - Parsed resume data
   * @returns {Object} Formatting score and details
   */
  analyzeFormatting(parsedResume) {
    const text = parsedResume.rawText || '';
    const details = {
      hasBulletPoints: false,
      hasConsistentDates: false,
      hasConsistentFormatting: false,
      properLength: false,
      noSpecialCharacters: false
    };

    let score = 0;
    const maxScore = 20;

    // Check for bullet points (5 points)
    const bulletPatterns = /^[\s]*[•\-\*◦▪][\s]/m;
    if (bulletPatterns.test(text)) {
      details.hasBulletPoints = true;
      score += 5;
    }

    // Check for consistent date formatting (5 points)
    const datePatterns = [
      /\d{4}\s*-\s*\d{4}/g,  // 2020 - 2023
      /\d{4}\s*–\s*\d{4}/g,  // 2020 – 2023
      /\w+\s+\d{4}/g,        // January 2020
      /\d{1,2}\/\d{4}/g      // 01/2020
    ];
    
    let dateMatches = [];
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      dateMatches = dateMatches.concat(matches);
    });
    
    if (dateMatches.length >= 2) {
      // Check if dates follow similar pattern
      const firstDateFormat = this._getDateFormat(dateMatches[0]);
      const consistentDates = dateMatches.slice(1).every(date => 
        this._getDateFormat(date) === firstDateFormat
      );
      
      if (consistentDates) {
        details.hasConsistentDates = true;
        score += 5;
      } else {
        score += 2; // Has dates but inconsistent
      }
    }

    // Check for consistent formatting (4 points)
    const lines = text.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    
    // Check for consistent capitalization in headings
    const headingLines = nonEmptyLines.filter(line => 
      /^[A-Z\s]+$/.test(line.trim()) || /^[A-Z][a-z\s]+$/.test(line.trim())
    );
    
    if (headingLines.length >= 3) {
      details.hasConsistentFormatting = true;
      score += 4;
    } else if (headingLines.length >= 1) {
      score += 2;
    }

    // Check for proper length (3 points)
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount >= 300 && wordCount <= 800) {
      details.properLength = true;
      score += 3;
    } else if (wordCount >= 200 && wordCount <= 1000) {
      score += 2;
    } else {
      score += 1;
    }

    // Check for minimal special characters (3 points)
    const specialChars = text.match(/[^\w\s\-.,;:()\[\]\/]/g) || [];
    const specialCharRatio = specialChars.length / text.length;
    
    if (specialCharRatio < 0.01) {
      details.noSpecialCharacters = true;
      score += 3;
    } else if (specialCharRatio < 0.02) {
      score += 2;
    } else {
      score += 1;
    }

    return {
      score: Math.min(Math.round(score), maxScore),
      details
    };
  }

  /**
   * Count total syllables in text
   * @private
   */
  _countSyllables(text) {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    return words.reduce((total, word) => total + this._countWordSyllables(word), 0);
  }

  /**
   * Count syllables in a single word
   * @private
   */
  _countWordSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    
    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
  }

  /**
   * Determine date format type
   * @private
   */
  _getDateFormat(dateString) {
    if (/\d{4}\s*[-–]\s*\d{4}/.test(dateString)) return 'year-range';
    if (/\w+\s+\d{4}/.test(dateString)) return 'month-year';
    if (/\d{1,2}\/\d{4}/.test(dateString)) return 'numeric';
    return 'unknown';
  }
}

const atsScoringServiceInstance = new ATSScoringService();

export const calculateScore = (parsedResume) => atsScoringServiceInstance.calculateScore(parsedResume);
export const analyzeStructure = (parsedResume) => atsScoringServiceInstance.analyzeStructure(parsedResume);
export const analyzeKeywords = (parsedResume) => atsScoringServiceInstance.analyzeKeywords(parsedResume);
export const analyzeReadability = (parsedResume) => atsScoringServiceInstance.analyzeReadability(parsedResume);
export const analyzeFormatting = (parsedResume) => atsScoringServiceInstance.analyzeFormatting(parsedResume);

export default atsScoringServiceInstance;
