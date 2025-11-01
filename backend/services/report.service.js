import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import s3Service from './s3.service.js';

class ReportService {
  /**
   * Generate a PDF report from analysis data
   * @param {Object} analysisData - The analysis result data
   * @param {string} userTier - User tier (anonymous, free, premium, admin)
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generatePDFReport(analysisData, userTier) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });
        
        const buffers = [];
        const stream = new PassThrough();
        
        stream.on('data', (chunk) => buffers.push(chunk));
        stream.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        stream.on('error', reject);
        
        doc.pipe(stream);

        // Add watermark for free tier users
        if (userTier === 'free' || userTier === 'anonymous') {
          this._addWatermark(doc);
        }

        // Generate report content
        this._addHeader(doc);
        this._addResumeOverview(doc, analysisData.parsedData);
        this._addATSScoreSection(doc, analysisData.atsScore, analysisData.recommendations);
        
        if (analysisData.jdMatchResult) {
          this._addJDMatchSection(doc, analysisData.jdMatchResult);
        }
        
        if (analysisData.aiSuggestions && analysisData.aiSuggestions.length > 0) {
          this._addAISuggestionsSection(doc, analysisData.aiSuggestions);
        }
        
        this._addFooter(doc, userTier);
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate on-screen report data (structured JSON)
   * @param {Object} analysisData - The analysis result data
   * @returns {Promise<Object>} Structured report data
   */
  async generateOnScreenReport(analysisData) {
    return {
      summary: {
        totalScore: analysisData.atsScore?.totalScore || 0,
        matchPercentage: analysisData.jdMatchResult?.matchPercentage || null,
        criticalIssues: this._countCriticalIssues(analysisData.recommendations),
        generatedAt: new Date().toISOString()
      },
      atsScore: {
        total: analysisData.atsScore?.totalScore || 0,
        breakdown: {
          structure: analysisData.atsScore?.structureScore || 0,
          keywords: analysisData.atsScore?.keywordScore || 0,
          readability: analysisData.atsScore?.readabilityScore || 0,
          formatting: analysisData.atsScore?.formattingScore || 0
        },
        details: analysisData.atsScore?.breakdown || {}
      },
      recommendations: analysisData.recommendations || [],
      jdMatch: analysisData.jdMatchResult || null,
      aiSuggestions: analysisData.aiSuggestions || [],
      coverLetter: analysisData.coverLetter || null
    };
  }

  /**
   * Apply watermark to PDF for free tier users
   * @param {PDFDocument} doc - PDFKit document
   */
  _addWatermark(doc) {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.save();
      doc.opacity(0.1);
      doc.fontSize(60);
      doc.fillColor('gray');
      doc.rotate(-45, { origin: [300, 400] });
      doc.text('FREE VERSION', 150, 400, {
        width: 400,
        align: 'center'
      });
      doc.restore();
    }
  }

  /**
   * Add header to PDF
   * @param {PDFDocument} doc - PDFKit document
   */
  _addHeader(doc) {
    doc.fontSize(24)
       .fillColor('#2c3e50')
       .text('Resume Analysis Report', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(10)
       .fillColor('#7f8c8d')
       .text(`Generated on ${new Date().toLocaleDateString('en-US', { 
         year: 'numeric', 
         month: 'long', 
         day: 'numeric' 
       })}`, { align: 'center' });
    
    doc.moveDown(1);
    this._addDivider(doc);
  }

  /**
   * Add resume overview section to PDF
   * @param {PDFDocument} doc - PDFKit document
   * @param {Object} parsedData - Parsed resume data
   */
  _addResumeOverview(doc, parsedData) {
    doc.fontSize(18)
       .fillColor('#2c3e50')
       .text('Resume Overview', { underline: true });
    
    doc.moveDown(0.5);
    
    // Extract dynamic data
    const sections = parsedData?.sections || {};
    const sectionCount = Object.keys(sections).length;
    const skills = sections.skills || [];
    const experience = sections.experience || [];
    const education = sections.education || [];
    const wordCount = parsedData?.metadata?.wordCount || 0;
    const pages = parsedData?.pages || 1;
    
    // Create info grid
    const infoItems = [
      { label: 'Total Sections', value: sectionCount, icon: '📋' },
      { label: 'Skills Listed', value: skills.length, icon: '⭐' },
      { label: 'Work Experience', value: experience.length, icon: '💼' },
      { label: 'Education', value: education.length, icon: '🎓' },
      { label: 'Word Count', value: wordCount, icon: '📝' },
      { label: 'Pages', value: pages, icon: '📄' }
    ];
    
    // Display in 2 columns
    const startY = doc.y;
    const columnWidth = 250;
    const rowHeight = 40;
    
    infoItems.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 50 + (col * columnWidth);
      const y = startY + (row * rowHeight);
      
      doc.fontSize(10)
         .fillColor('#7f8c8d')
         .text(`${item.icon} ${item.label}:`, x, y);
      
      doc.fontSize(16)
         .fillColor('#2c3e50')
         .text(item.value.toString(), x, y + 15);
    });
    
    doc.y = startY + (Math.ceil(infoItems.length / 2) * rowHeight) + 10;
    
    // Sections detected
    if (sectionCount > 0) {
      doc.moveDown(1);
      doc.fontSize(12)
         .fillColor('#34495e')
         .text('Sections Detected:', { underline: true });
      
      doc.moveDown(0.3);
      doc.fontSize(10)
         .fillColor('#7f8c8d');
      
      const sectionNames = Object.keys(sections)
        .map(key => key.charAt(0).toUpperCase() + key.slice(1))
        .join(', ');
      
      doc.text(sectionNames);
    }
    
    // Top skills
    if (skills.length > 0) {
      doc.moveDown(1);
      doc.fontSize(12)
         .fillColor('#34495e')
         .text('Top Skills:', { underline: true });
      
      doc.moveDown(0.3);
      doc.fontSize(10)
         .fillColor('#7f8c8d');
      
      const topSkills = skills.slice(0, 15).join(', ');
      doc.text(topSkills);
    }
    
    doc.moveDown(1);
    this._addDivider(doc);
  }

  /**
   * Add ATS score section to PDF
   * @param {PDFDocument} doc - PDFKit document
   * @param {Object} atsScore - ATS score data
   * @param {Array} recommendations - Recommendations array
   */
  _addATSScoreSection(doc, atsScore, recommendations) {
    doc.fontSize(18)
       .fillColor('#2c3e50')
       .text('ATS Compatibility Score', { underline: true });
    
    doc.moveDown(0.5);
    
    // Overall score
    const score = atsScore?.totalScore || 0;
    const scoreColor = score >= 80 ? '#27ae60' : score >= 60 ? '#f39c12' : '#e74c3c';
    
    doc.fontSize(48)
       .fillColor(scoreColor)
       .text(`${score}/100`, { align: 'center' });
    
    doc.moveDown(1);
    
    // Score breakdown
    doc.fontSize(14)
       .fillColor('#2c3e50')
       .text('Score Breakdown:', { underline: true });
    
    doc.moveDown(0.5);
    doc.fontSize(11);
    
    const breakdown = [
      { label: 'Structure', score: atsScore?.structureScore || 0, max: 25 },
      { label: 'Keywords', score: atsScore?.keywordScore || 0, max: 30 },
      { label: 'Readability', score: atsScore?.readabilityScore || 0, max: 25 },
      { label: 'Formatting', score: atsScore?.formattingScore || 0, max: 20 }
    ];
    
    breakdown.forEach(item => {
      doc.fillColor('#34495e')
         .text(`${item.label}: ${item.score}/${item.max}`, { continued: false });
      doc.moveDown(0.3);
    });
    
    doc.moveDown(1);
    
    // Recommendations
    if (recommendations && recommendations.length > 0) {
      doc.fontSize(14)
         .fillColor('#2c3e50')
         .text('Recommendations:', { underline: true });
      
      doc.moveDown(0.5);
      doc.fontSize(10);
      
      const criticalRecs = recommendations.filter(r => r.priority === 'critical').slice(0, 5);
      const importantRecs = recommendations.filter(r => r.priority === 'important').slice(0, 5);
      
      if (criticalRecs.length > 0) {
        doc.fillColor('#e74c3c')
           .fontSize(11)
           .text('Critical Issues:', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(10);
        
        criticalRecs.forEach((rec, index) => {
          doc.fillColor('#34495e')
             .text(`${index + 1}. ${rec.title || rec.message || 'No title'}`, { indent: 10 });
          if (rec.description) {
            doc.fillColor('#7f8c8d')
               .fontSize(9)
               .text(rec.description, { indent: 20 });
          }
          doc.moveDown(0.5);
        });
        doc.moveDown(0.5);
      }
      
      if (importantRecs.length > 0) {
        doc.fillColor('#f39c12')
           .fontSize(11)
           .text('Important Improvements:', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(10);
        
        importantRecs.forEach((rec, index) => {
          doc.fillColor('#34495e')
             .text(`${index + 1}. ${rec.title || rec.message || 'No title'}`, { indent: 10 });
          if (rec.description) {
            doc.fillColor('#7f8c8d')
               .fontSize(9)
               .text(rec.description, { indent: 20 });
          }
          doc.moveDown(0.5);
        });
      }
    }
    
    doc.addPage();
  }

  /**
   * Add JD match section to PDF
   * @param {PDFDocument} doc - PDFKit document
   * @param {Object} jdMatchResult - Job description match result
   */
  _addJDMatchSection(doc, jdMatchResult) {
    doc.fontSize(18)
       .fillColor('#2c3e50')
       .text('Job Description Match Analysis', { underline: true });
    
    doc.moveDown(0.5);
    
    // Match percentage
    const matchPercentage = jdMatchResult.matchPercentage || 0;
    const matchColor = matchPercentage >= 80 ? '#27ae60' : matchPercentage >= 60 ? '#f39c12' : '#e74c3c';
    
    doc.fontSize(36)
       .fillColor(matchColor)
       .text(`${matchPercentage}% Match`, { align: 'center' });
    
    doc.moveDown(1);
    
    // Matched keywords
    if (jdMatchResult.matchedKeywords && jdMatchResult.matchedKeywords.length > 0) {
      doc.fontSize(14)
         .fillColor('#27ae60')
         .text('Matched Keywords:', { underline: true });
      
      doc.moveDown(0.5);
      doc.fontSize(10)
         .fillColor('#34495e');
      
      const topMatched = jdMatchResult.matchedKeywords.slice(0, 15);
      const matchedText = topMatched.map(k => k.keyword || k).join(', ');
      doc.text(matchedText, { align: 'left' });
      
      doc.moveDown(1);
    }
    
    // Missing keywords
    if (jdMatchResult.missingKeywords && jdMatchResult.missingKeywords.length > 0) {
      doc.fontSize(14)
         .fillColor('#e74c3c')
         .text('Missing Keywords:', { underline: true });
      
      doc.moveDown(0.5);
      doc.fontSize(10)
         .fillColor('#34495e');
      
      const topMissing = jdMatchResult.missingKeywords.slice(0, 15);
      const missingText = topMissing.map(k => k.keyword || k).join(', ');
      doc.text(missingText, { align: 'left' });
      
      doc.moveDown(1);
    }
    
    // Suggestions
    if (jdMatchResult.suggestions && jdMatchResult.suggestions.length > 0) {
      doc.fontSize(14)
         .fillColor('#2c3e50')
         .text('Improvement Suggestions:', { underline: true });
      
      doc.moveDown(0.5);
      doc.fontSize(10);
      
      jdMatchResult.suggestions.slice(0, 5).forEach((suggestion, index) => {
        doc.fillColor('#34495e')
           .text(`${index + 1}. ${suggestion}`, { indent: 10 });
        doc.moveDown(0.3);
      });
    }
    
    doc.addPage();
  }

  /**
   * Add AI suggestions section to PDF
   * @param {PDFDocument} doc - PDFKit document
   * @param {Array} aiSuggestions - AI suggestions array
   */
  _addAISuggestionsSection(doc, aiSuggestions) {
    doc.fontSize(18)
       .fillColor('#2c3e50')
       .text('AI-Powered Improvement Suggestions', { underline: true });
    
    doc.moveDown(0.5);
    doc.fontSize(10)
       .fillColor('#7f8c8d')
       .text('Premium Feature: AI-generated content improvements', { italics: true });
    
    doc.moveDown(1);
    
    aiSuggestions.slice(0, 5).forEach((suggestion, index) => {
      doc.fontSize(11)
         .fillColor('#3498db')
         .text(`Suggestion ${index + 1}:`, { underline: true });
      
      doc.moveDown(0.3);
      doc.fontSize(10)
         .fillColor('#34495e');
      
      if (suggestion.original) {
        doc.text('Original:', { continued: true, bold: true });
        doc.text(` ${suggestion.original}`);
        doc.moveDown(0.3);
      }
      
      if (suggestion.improved || suggestion.suggestion) {
        doc.text('Improved:', { continued: true, bold: true });
        doc.text(` ${suggestion.improved || suggestion.suggestion}`);
      }
      
      doc.moveDown(0.8);
    });
  }

  /**
   * Add footer to PDF
   * @param {PDFDocument} doc - PDFKit document
   * @param {string} userTier - User tier
   */
  _addFooter(doc, userTier) {
    const range = doc.bufferedPageRange();
    const pageCount = range.count;
    const startPage = range.start;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(startPage + i);
      
      doc.fontSize(8)
         .fillColor('#95a5a6')
         .text(
           `Resume Analyzer - ${userTier === 'premium' ? 'Premium' : 'Free'} Report | Page ${i + 1} of ${pageCount}`,
           50,
           doc.page.height - 50,
           { align: 'center' }
         );
    }
  }

  /**
   * Add divider line
   * @param {PDFDocument} doc - PDFKit document
   */
  _addDivider(doc) {
    doc.strokeColor('#bdc3c7')
       .lineWidth(1)
       .moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke();
    doc.moveDown(1);
  }

  /**
   * Count critical issues in recommendations
   * @param {Array} recommendations - Recommendations array
   * @returns {number} Count of critical issues
   */
  _countCriticalIssues(recommendations) {
    if (!recommendations) return 0;
    return recommendations.filter(r => r.priority === 'critical').length;
  }

  /**
   * Upload report to S3 and generate signed URL
   * @param {Buffer} pdfBuffer - PDF buffer
   * @param {string} userId - User ID
   * @returns {Promise<Object>} S3 key and signed URL
   */
  async uploadReportToS3(pdfBuffer, userId) {
    const timestamp = Date.now();
    const s3Key = `reports/${userId}/${timestamp}-report.pdf`;
    
    await s3Service.uploadFile(pdfBuffer, s3Key, 'application/pdf');
    
    const expiryDays = 7;
    const downloadUrl = await this.generateDownloadLink(s3Key, expiryDays);
    
    return {
      s3Key,
      downloadUrl,
      expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
    };
  }

  /**
   * Generate download link with expiry
   * @param {string} s3Key - S3 object key
   * @param {number} expiryDays - Number of days until expiry
   * @returns {Promise<string>} Signed URL
   */
  async generateDownloadLink(s3Key, expiryDays = 7) {
    const expirySeconds = expiryDays * 24 * 60 * 60;
    return await s3Service.getSignedUrl(s3Key, expirySeconds);
  }
}

export default new ReportService();
