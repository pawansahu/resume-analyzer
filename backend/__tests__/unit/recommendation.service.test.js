import recommendationService from '../../services/recommendation.service.js';

describe('Recommendation Service', () => {
  describe('generateRecommendations', () => {
    it('should generate recommendations based on ATS score', () => {
      const atsScore = {
        totalScore: 55,
        structureScore: 15,
        keywordScore: 18,
        readabilityScore: 12,
        formattingScore: 10,
        breakdown: {
          structure: {
            hasContact: true,
            hasSummary: false,
            hasExperience: true,
            hasEducation: false,
            hasSkills: false,
            properHeadings: false,
            logicalOrder: false
          },
          keywords: {
            actionVerbCount: 3,
            industryKeywordCount: 2,
            technicalSkillCount: 1,
            quantifiableAchievements: 1,
            keywordDensity: 1.5
          },
          readability: {
            fleschScore: 45,
            avgSentenceLength: 28,
            avgWordLength: 5,
            complexWordPercentage: 30,
            readabilityLevel: 'Needs Improvement'
          },
          formatting: {
            hasBulletPoints: false,
            hasConsistentDates: false,
            hasConsistentFormatting: false,
            properLength: true,
            noSpecialCharacters: true
          }
        }
      };

      const parsedResume = {
        rawText: 'Sample resume text',
        sections: {}
      };

      const recommendations = recommendationService.generateRecommendations(atsScore, parsedResume);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Check that recommendations have required fields
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('category');
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('title');
        expect(rec).toHaveProperty('description');
        expect(rec).toHaveProperty('impact');
        expect(rec).toHaveProperty('actionItems');
        expect(Array.isArray(rec.actionItems)).toBe(true);
      });
    });

    it('should prioritize critical issues for low scores', () => {
      const atsScore = {
        totalScore: 45,
        structureScore: 10,
        keywordScore: 15,
        readabilityScore: 10,
        formattingScore: 10,
        breakdown: {
          structure: {
            hasContact: false,
            hasSummary: false,
            hasExperience: false,
            hasEducation: false,
            hasSkills: false,
            properHeadings: false,
            logicalOrder: false
          },
          keywords: {
            actionVerbCount: 2,
            industryKeywordCount: 1,
            technicalSkillCount: 1,
            quantifiableAchievements: 0,
            keywordDensity: 1.0
          },
          readability: {
            fleschScore: 40,
            avgSentenceLength: 30,
            avgWordLength: 6,
            complexWordPercentage: 35,
            readabilityLevel: 'Needs Improvement'
          },
          formatting: {
            hasBulletPoints: false,
            hasConsistentDates: false,
            hasConsistentFormatting: false,
            properLength: false,
            noSpecialCharacters: false
          }
        }
      };

      const parsedResume = {
        rawText: 'Sample resume text',
        sections: {}
      };

      const recommendations = recommendationService.generateRecommendations(atsScore, parsedResume);

      const criticalRecs = recommendations.filter(r => r.priority === 'critical');
      expect(criticalRecs.length).toBeGreaterThan(0);
      
      // Critical recommendations should be first
      expect(recommendations[0].priority).toBe('critical');
    });

    it('should generate fewer recommendations for high scores', () => {
      const atsScore = {
        totalScore: 85,
        structureScore: 22,
        keywordScore: 26,
        readabilityScore: 20,
        formattingScore: 17,
        breakdown: {
          structure: {
            hasContact: true,
            hasSummary: true,
            hasExperience: true,
            hasEducation: true,
            hasSkills: true,
            properHeadings: true,
            logicalOrder: true
          },
          keywords: {
            actionVerbCount: 12,
            industryKeywordCount: 8,
            technicalSkillCount: 7,
            quantifiableAchievements: 5,
            keywordDensity: 3.5
          },
          readability: {
            fleschScore: 65,
            avgSentenceLength: 18,
            avgWordLength: 4.5,
            complexWordPercentage: 15,
            readabilityLevel: 'Excellent'
          },
          formatting: {
            hasBulletPoints: true,
            hasConsistentDates: true,
            hasConsistentFormatting: true,
            properLength: true,
            noSpecialCharacters: true
          }
        }
      };

      const parsedResume = {
        rawText: 'Sample resume text',
        sections: {}
      };

      const recommendations = recommendationService.generateRecommendations(atsScore, parsedResume);

      // Should have few or no critical recommendations
      const criticalRecs = recommendations.filter(r => r.priority === 'critical');
      expect(criticalRecs.length).toBe(0);
    });
  });

  describe('getCriticalIssues', () => {
    it('should filter only critical recommendations', () => {
      const recommendations = [
        { priority: 'critical', title: 'Critical 1' },
        { priority: 'important', title: 'Important 1' },
        { priority: 'critical', title: 'Critical 2' },
        { priority: 'suggested', title: 'Suggested 1' }
      ];

      const critical = recommendationService.getCriticalIssues(recommendations);

      expect(critical.length).toBe(2);
      expect(critical.every(r => r.priority === 'critical')).toBe(true);
    });
  });

  describe('groupByCategory', () => {
    it('should group recommendations by category', () => {
      const recommendations = [
        { category: 'structure', title: 'Structure 1' },
        { category: 'keywords', title: 'Keywords 1' },
        { category: 'structure', title: 'Structure 2' },
        { category: 'formatting', title: 'Formatting 1' }
      ];

      const grouped = recommendationService.groupByCategory(recommendations);

      expect(grouped).toHaveProperty('structure');
      expect(grouped).toHaveProperty('keywords');
      expect(grouped).toHaveProperty('formatting');
      expect(grouped.structure.length).toBe(2);
      expect(grouped.keywords.length).toBe(1);
      expect(grouped.formatting.length).toBe(1);
    });
  });
});
