/**
 * Recommendation Service
 * Generates actionable recommendations based on ATS score analysis
 */

class RecommendationService {
  /**
   * Generate recommendations based on ATS score
   * @param {Object} atsScore - Complete ATS score with breakdown
   * @param {Object} parsedResume - Original parsed resume data
   * @returns {Array} Array of recommendations with priority
   */
  generateRecommendations(atsScore, parsedResume) {
    const recommendations = [];
    const { totalScore, breakdown } = atsScore;

    // Determine if score is critical (below 60)
    const isCritical = totalScore < 60;

    // Structure recommendations
    recommendations.push(...this._generateStructureRecommendations(
      atsScore.structureScore,
      breakdown.structure,
      isCritical
    ));

    // Keyword recommendations
    recommendations.push(...this._generateKeywordRecommendations(
      atsScore.keywordScore,
      breakdown.keywords,
      isCritical
    ));

    // Readability recommendations
    recommendations.push(...this._generateReadabilityRecommendations(
      atsScore.readabilityScore,
      breakdown.readability,
      isCritical
    ));

    // Formatting recommendations
    recommendations.push(...this._generateFormattingRecommendations(
      atsScore.formattingScore,
      breakdown.formatting,
      isCritical
    ));

    // Sort by priority: critical > important > suggested
    const priorityOrder = { critical: 0, important: 1, suggested: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
  }

  /**
   * Generate structure-related recommendations
   * @private
   */
  _generateStructureRecommendations(score, details, isCritical) {
    const recommendations = [];
    const maxScore = 25;
    const scorePercentage = (score / maxScore) * 100;

    // Missing contact information
    if (!details.hasContact) {
      recommendations.push({
        category: 'structure',
        priority: 'critical',
        title: 'Add Contact Information',
        description: 'Your resume is missing contact information. Include your name, phone number, email, and location.',
        impact: 'high',
        actionItems: [
          'Add your full name at the top of the resume',
          'Include a professional email address',
          'Add your phone number',
          'Include your city and state (or country for international applications)'
        ]
      });
    }

    // Missing experience section
    if (!details.hasExperience) {
      recommendations.push({
        category: 'structure',
        priority: isCritical ? 'critical' : 'important',
        title: 'Add Work Experience Section',
        description: 'Your resume lacks a clear work experience section, which is crucial for ATS systems.',
        impact: 'high',
        actionItems: [
          'Create a dedicated "Work Experience" or "Professional Experience" section',
          'List your positions in reverse chronological order',
          'Include company names, job titles, and dates',
          'Add 3-5 bullet points describing your responsibilities and achievements'
        ]
      });
    }

    // Missing education section
    if (!details.hasEducation) {
      recommendations.push({
        category: 'structure',
        priority: 'important',
        title: 'Add Education Section',
        description: 'Include your educational background to provide a complete professional profile.',
        impact: 'medium',
        actionItems: [
          'Add an "Education" section',
          'List your degrees with institution names',
          'Include graduation dates or expected graduation dates',
          'Add relevant coursework or honors if applicable'
        ]
      });
    }

    // Missing skills section
    if (!details.hasSkills) {
      recommendations.push({
        category: 'structure',
        priority: 'important',
        title: 'Add Skills Section',
        description: 'A dedicated skills section helps ATS systems identify your qualifications quickly.',
        impact: 'medium',
        actionItems: [
          'Create a "Skills" or "Technical Skills" section',
          'List relevant hard skills and software proficiencies',
          'Include industry-specific tools and technologies',
          'Organize skills by category if you have many'
        ]
      });
    }

    // Missing summary
    if (!details.hasSummary) {
      recommendations.push({
        category: 'structure',
        priority: 'suggested',
        title: 'Add Professional Summary',
        description: 'A brief summary at the top can help ATS systems and recruiters quickly understand your value.',
        impact: 'low',
        actionItems: [
          'Write a 2-3 sentence professional summary',
          'Highlight your years of experience and key expertise',
          'Include your most relevant accomplishments',
          'Tailor it to your target role'
        ]
      });
    }

    // Improper heading format
    if (!details.properHeadings) {
      recommendations.push({
        category: 'structure',
        priority: isCritical ? 'important' : 'suggested',
        title: 'Use Standard Section Headings',
        description: 'ATS systems look for standard section headings. Use clear, conventional labels.',
        impact: 'medium',
        actionItems: [
          'Use standard headings like "Work Experience", "Education", "Skills"',
          'Avoid creative or unusual section names',
          'Make headings visually distinct (bold or larger font)',
          'Keep heading format consistent throughout'
        ]
      });
    }

    // Illogical section order
    if (!details.logicalOrder) {
      recommendations.push({
        category: 'structure',
        priority: 'suggested',
        title: 'Reorganize Section Order',
        description: 'Follow a logical section order for better ATS parsing and readability.',
        impact: 'low',
        actionItems: [
          'Start with contact information',
          'Follow with professional summary (optional)',
          'Place work experience next',
          'Add education section',
          'End with skills and certifications'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Generate keyword-related recommendations
   * @private
   */
  _generateKeywordRecommendations(score, details, isCritical) {
    const recommendations = [];
    const maxScore = 30;
    const scorePercentage = (score / maxScore) * 100;

    // Low action verb count
    if (details.actionVerbCount < 8) {
      recommendations.push({
        category: 'keywords',
        priority: isCritical ? 'critical' : 'important',
        title: 'Use More Action Verbs',
        description: `Your resume contains only ${details.actionVerbCount} action verbs. Aim for at least 10-15 strong action verbs.`,
        impact: 'high',
        actionItems: [
          'Start bullet points with strong action verbs',
          'Use verbs like: achieved, developed, led, implemented, increased',
          'Avoid weak verbs like "responsible for" or "worked on"',
          'Vary your verb choices to avoid repetition'
        ]
      });
    }

    // Low industry keyword count
    if (details.industryKeywordCount < 5) {
      recommendations.push({
        category: 'keywords',
        priority: isCritical ? 'critical' : 'important',
        title: 'Include More Industry Keywords',
        description: `Only ${details.industryKeywordCount} industry keywords found. Add relevant terms from your field.`,
        impact: 'high',
        actionItems: [
          'Review job descriptions in your target role',
          'Identify common industry terms and methodologies',
          'Naturally incorporate these keywords into your experience',
          'Include relevant certifications and methodologies (e.g., Agile, Six Sigma)'
        ]
      });
    }

    // Low technical skill count
    if (details.technicalSkillCount < 5) {
      recommendations.push({
        category: 'keywords',
        priority: 'important',
        title: 'Add Technical Skills',
        description: `Only ${details.technicalSkillCount} technical skills identified. List more specific tools and technologies.`,
        impact: 'medium',
        actionItems: [
          'Create a dedicated technical skills section',
          'List programming languages, software, and tools you use',
          'Include version numbers or proficiency levels if relevant',
          'Add cloud platforms, databases, and frameworks'
        ]
      });
    }

    // Lack of quantifiable achievements
    if (details.quantifiableAchievements < 3) {
      recommendations.push({
        category: 'keywords',
        priority: isCritical ? 'important' : 'suggested',
        title: 'Add Quantifiable Achievements',
        description: `Only ${details.quantifiableAchievements} quantifiable achievements found. Numbers make your impact concrete.`,
        impact: 'medium',
        actionItems: [
          'Add percentages, dollar amounts, or time savings',
          'Quantify team sizes you managed or worked with',
          'Include metrics like "increased sales by 25%"',
          'Show scale: "managed $2M budget" or "served 500+ customers"'
        ]
      });
    }

    // Keyword density issues
    if (details.keywordDensity < 1.5) {
      recommendations.push({
        category: 'keywords',
        priority: 'suggested',
        title: 'Increase Keyword Density',
        description: 'Your resume has low keyword density. Add more relevant terms naturally.',
        impact: 'low',
        actionItems: [
          'Review job postings for commonly required skills',
          'Incorporate relevant keywords into your descriptions',
          'Avoid keyword stuffing - keep it natural',
          'Focus on skills you actually possess'
        ]
      });
    } else if (details.keywordDensity > 6) {
      recommendations.push({
        category: 'keywords',
        priority: 'suggested',
        title: 'Reduce Keyword Stuffing',
        description: 'Your keyword density is too high, which may appear unnatural to ATS systems.',
        impact: 'low',
        actionItems: [
          'Remove repetitive keywords',
          'Focus on natural, descriptive language',
          'Ensure each keyword adds value',
          'Prioritize quality over quantity'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Generate readability-related recommendations
   * @private
   */
  _generateReadabilityRecommendations(score, details, isCritical) {
    const recommendations = [];
    const maxScore = 25;

    // Poor Flesch score
    if (details.fleschScore < 50) {
      recommendations.push({
        category: 'readability',
        priority: isCritical ? 'important' : 'suggested',
        title: 'Improve Readability',
        description: `Your readability score is ${Math.round(details.fleschScore)}/100. Simplify your language for better ATS parsing.`,
        impact: 'medium',
        actionItems: [
          'Use shorter sentences (15-20 words average)',
          'Replace complex words with simpler alternatives',
          'Break long paragraphs into bullet points',
          'Avoid jargon unless industry-standard'
        ]
      });
    } else if (details.fleschScore > 80) {
      recommendations.push({
        category: 'readability',
        priority: 'suggested',
        title: 'Add More Professional Language',
        description: 'Your resume may be too simple. Add more professional terminology.',
        impact: 'low',
        actionItems: [
          'Use industry-appropriate terminology',
          'Expand on your accomplishments with more detail',
          'Include technical terms relevant to your field',
          'Balance simplicity with professionalism'
        ]
      });
    }

    // Sentence length issues
    if (details.avgSentenceLength > 25) {
      recommendations.push({
        category: 'readability',
        priority: 'important',
        title: 'Shorten Sentences',
        description: `Average sentence length is ${Math.round(details.avgSentenceLength)} words. Aim for 15-20 words.`,
        impact: 'medium',
        actionItems: [
          'Break long sentences into two shorter ones',
          'Use bullet points instead of paragraphs',
          'Remove unnecessary words and phrases',
          'Focus on one idea per sentence'
        ]
      });
    } else if (details.avgSentenceLength < 12) {
      recommendations.push({
        category: 'readability',
        priority: 'suggested',
        title: 'Expand Descriptions',
        description: 'Your sentences are very short. Add more detail to your accomplishments.',
        impact: 'low',
        actionItems: [
          'Provide more context for your achievements',
          'Explain the impact of your work',
          'Include relevant details about projects',
          'Combine related short sentences'
        ]
      });
    }

    // Too many complex words
    if (details.complexWordPercentage > 25) {
      recommendations.push({
        category: 'readability',
        priority: 'suggested',
        title: 'Simplify Vocabulary',
        description: `${Math.round(details.complexWordPercentage)}% of words are complex. Aim for under 20%.`,
        impact: 'low',
        actionItems: [
          'Replace complex words with simpler synonyms',
          'Avoid unnecessarily long words',
          'Use clear, direct language',
          'Keep technical terms only when necessary'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Generate formatting-related recommendations
   * @private
   */
  _generateFormattingRecommendations(score, details, isCritical) {
    const recommendations = [];
    const maxScore = 20;

    // No bullet points
    if (!details.hasBulletPoints) {
      recommendations.push({
        category: 'formatting',
        priority: isCritical ? 'critical' : 'important',
        title: 'Use Bullet Points',
        description: 'Your resume lacks bullet points. ATS systems parse bullet-pointed lists more effectively.',
        impact: 'high',
        actionItems: [
          'Convert paragraphs to bullet points',
          'Use simple bullet symbols (•, -, or *)',
          'Start each bullet with an action verb',
          'Keep bullets concise (1-2 lines each)'
        ]
      });
    }

    // Inconsistent dates
    if (!details.hasConsistentDates) {
      recommendations.push({
        category: 'formatting',
        priority: 'important',
        title: 'Standardize Date Formatting',
        description: 'Use consistent date formatting throughout your resume.',
        impact: 'medium',
        actionItems: [
          'Choose one date format and stick to it',
          'Recommended: "Month YYYY - Month YYYY" (e.g., "Jan 2020 - Dec 2023")',
          'Use "Present" for current positions',
          'Align dates consistently (left or right)'
        ]
      });
    }

    // Inconsistent formatting
    if (!details.hasConsistentFormatting) {
      recommendations.push({
        category: 'formatting',
        priority: 'important',
        title: 'Maintain Consistent Formatting',
        description: 'Inconsistent formatting can confuse ATS systems.',
        impact: 'medium',
        actionItems: [
          'Use the same font throughout',
          'Keep heading styles consistent',
          'Maintain uniform spacing between sections',
          'Use consistent capitalization for similar elements'
        ]
      });
    }

    // Length issues
    if (!details.properLength) {
      recommendations.push({
        category: 'formatting',
        priority: 'suggested',
        title: 'Adjust Resume Length',
        description: 'Your resume length may not be optimal for ATS parsing.',
        impact: 'low',
        actionItems: [
          'Aim for 400-600 words for optimal length',
          'Remove outdated or irrelevant experience',
          'Focus on recent and relevant positions',
          'Keep it to 1-2 pages maximum'
        ]
      });
    }

    // Special characters
    if (!details.noSpecialCharacters) {
      recommendations.push({
        category: 'formatting',
        priority: 'suggested',
        title: 'Remove Special Characters',
        description: 'Excessive special characters can interfere with ATS parsing.',
        impact: 'low',
        actionItems: [
          'Remove decorative symbols and graphics',
          'Avoid tables and text boxes',
          'Use standard punctuation only',
          'Stick to simple formatting'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Get critical issues (for scores below 60)
   * @param {Array} recommendations - All recommendations
   * @returns {Array} Only critical recommendations
   */
  getCriticalIssues(recommendations) {
    return recommendations.filter(rec => rec.priority === 'critical');
  }

  /**
   * Group recommendations by category
   * @param {Array} recommendations - All recommendations
   * @returns {Object} Recommendations grouped by category
   */
  groupByCategory(recommendations) {
    return recommendations.reduce((groups, rec) => {
      if (!groups[rec.category]) {
        groups[rec.category] = [];
      }
      groups[rec.category].push(rec);
      return groups;
    }, {});
  }
}

const recommendationServiceInstance = new RecommendationService();

export const generateRecommendations = (atsScore, parsedResume) => 
  recommendationServiceInstance.generateRecommendations(atsScore, parsedResume);
export const getCriticalIssues = (recommendations) => 
  recommendationServiceInstance.getCriticalIssues(recommendations);
export const groupByCategory = (recommendations) => 
  recommendationServiceInstance.groupByCategory(recommendations);

export default recommendationServiceInstance;
