import atsScoringService from '../../services/ats-scoring.service.js';

describe('ATS Scoring Service', () => {
  describe('calculateScore', () => {
    it('should calculate a complete ATS score', () => {
      const parsedResume = {
        rawText: `John Doe
john.doe@email.com | (555) 123-4567 | New York, NY

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years developing web applications.

WORK EXPERIENCE
Senior Developer - Tech Company
January 2020 - Present
• Developed and implemented new features using React and Node.js
• Improved application performance by 30%
• Led team of 5 developers on major project
• Managed $500K budget for infrastructure improvements

Software Engineer - Another Company
June 2018 - December 2019
• Created RESTful APIs using Python and Django
• Increased code coverage to 85% through comprehensive testing
• Collaborated with cross-functional teams

EDUCATION
Bachelor of Science in Computer Science
University of Technology, 2018

SKILLS
JavaScript, Python, React, Node.js, AWS, Docker, Git, Agile, SQL`,
        sections: {
          contact: ['john.doe@email.com', '(555) 123-4567', 'New York, NY'],
          summary: ['Experienced software engineer with 5+ years developing web applications.'],
          experience: [
            'Senior Developer - Tech Company',
            'Software Engineer - Another Company'
          ],
          education: ['Bachelor of Science in Computer Science'],
          skills: ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker', 'Git', 'Agile', 'SQL']
        }
      };

      const result = atsScoringService.calculateScore(parsedResume);

      expect(result).toHaveProperty('totalScore');
      expect(result).toHaveProperty('structureScore');
      expect(result).toHaveProperty('keywordScore');
      expect(result).toHaveProperty('readabilityScore');
      expect(result).toHaveProperty('formattingScore');
      expect(result).toHaveProperty('breakdown');

      expect(result.totalScore).toBeGreaterThan(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
      expect(result.structureScore).toBeLessThanOrEqual(25);
      expect(result.keywordScore).toBeLessThanOrEqual(30);
      expect(result.readabilityScore).toBeLessThanOrEqual(25);
      expect(result.formattingScore).toBeLessThanOrEqual(20);
    });

    it('should give low score for minimal resume', () => {
      const parsedResume = {
        rawText: 'John Doe. I worked at a company.',
        sections: {}
      };

      const result = atsScoringService.calculateScore(parsedResume);

      expect(result.totalScore).toBeLessThan(40);
    });
  });

  describe('analyzeStructure', () => {
    it('should detect all standard sections', () => {
      const parsedResume = {
        sections: {
          contact: ['email@test.com'],
          summary: ['Professional summary'],
          experience: ['Work experience'],
          education: ['Degree'],
          skills: ['Skill 1', 'Skill 2']
        },
        rawText: 'CONTACT\nSUMMARY\nEXPERIENCE\nEDUCATION\nSKILLS'
      };

      const result = atsScoringService.analyzeStructure(parsedResume);

      expect(result.details.hasContact).toBe(true);
      expect(result.details.hasSummary).toBe(true);
      expect(result.details.hasExperience).toBe(true);
      expect(result.details.hasEducation).toBe(true);
      expect(result.details.hasSkills).toBe(true);
      expect(result.score).toBeGreaterThan(15);
    });

    it('should penalize missing sections', () => {
      const parsedResume = {
        sections: {},
        rawText: 'Just some text'
      };

      const result = atsScoringService.analyzeStructure(parsedResume);

      expect(result.details.hasContact).toBe(false);
      expect(result.details.hasExperience).toBe(false);
      expect(result.score).toBeLessThan(10);
    });
  });

  describe('analyzeKeywords', () => {
    it('should detect action verbs', () => {
      const parsedResume = {
        rawText: 'achieved improved developed implemented increased led managed created'
      };

      const result = atsScoringService.analyzeKeywords(parsedResume);

      expect(result.details.actionVerbCount).toBeGreaterThan(5);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should detect quantifiable achievements', () => {
      const parsedResume = {
        rawText: 'increased sales by 25% and saved $50000 and managed 10+ team members'
      };

      const result = atsScoringService.analyzeKeywords(parsedResume);

      expect(result.details.quantifiableAchievements).toBeGreaterThan(0);
    });
  });

  describe('analyzeReadability', () => {
    it('should calculate Flesch reading score', () => {
      const parsedResume = {
        rawText: 'This is a simple sentence. Another simple sentence here. And one more sentence.'
      };

      const result = atsScoringService.analyzeReadability(parsedResume);

      expect(result.details.fleschScore).toBeGreaterThan(0);
      expect(result.details.avgSentenceLength).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('analyzeFormatting', () => {
    it('should detect bullet points', () => {
      const parsedResume = {
        rawText: '• First bullet point\n• Second bullet point\n• Third bullet point'
      };

      const result = atsScoringService.analyzeFormatting(parsedResume);

      expect(result.details.hasBulletPoints).toBe(true);
    });

    it('should detect consistent dates', () => {
      const parsedResume = {
        rawText: 'January 2020 - December 2023\nFebruary 2018 - December 2019'
      };

      const result = atsScoringService.analyzeFormatting(parsedResume);

      expect(result.details.hasConsistentDates).toBe(true);
    });
  });
});
