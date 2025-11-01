/**
 * Resume Parser Service
 * Extracts text and structured data from PDF and DOCX files
 */

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Parse resume from buffer
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileExtension - File extension (pdf or docx)
 * @returns {Promise<Object>} Parsed resume data
 */
export const parseResume = async (fileBuffer, fileExtension) => {
  try {
    // Extract text based on file type
    let text = '';
    
    if (fileExtension === 'pdf') {
      text = await extractTextFromPDF(fileBuffer);
    } else if (fileExtension === 'docx') {
      text = await extractTextFromDOCX(fileBuffer);
    } else {
      throw new Error('Unsupported file type');
    }

    // Extract structured sections
    const sections = extractSections(text);
    
    // Extract contact information
    const contact = extractContactInfo(text);

    return {
      text,
      sections: {
        contact,
        summary: sections.summary,
        experience: sections.experience,
        education: sections.education,
        skills: sections.skills
      },
      metadata: {
        fileType: fileExtension,
        parsedAt: new Date().toISOString(),
        textLength: text.length,
        wordCount: text.split(/\s+/).length
      }
    };
  } catch (error) {
    console.error('Parse error:', error);
    throw new Error(`Failed to parse resume: ${error.message}`);
  }
};

/**
 * Extract text from PDF file
 * @param {Buffer} fileBuffer - PDF file buffer
 * @returns {Promise<string>} Extracted text
 */
const extractTextFromPDF = async (fileBuffer) => {
  try {
    const data = await pdfParse(fileBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

/**
 * Extract text from DOCX file
 * @param {Buffer} fileBuffer - DOCX file buffer
 * @returns {Promise<string>} Extracted text
 */
const extractTextFromDOCX = async (fileBuffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value;
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error('Failed to extract text from DOCX');
  }
};

/**
 * Extract structured sections from resume text
 * @param {string} text - Resume text
 * @returns {Object} Structured sections
 */
const extractSections = (text) => {
  const sections = {
    summary: '',
    experience: [],
    education: [],
    skills: []
  };

  // Normalize text for processing
  const normalizedText = text.replace(/\r\n/g, '\n');
  const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line);

  // Section headers patterns
  const summaryPatterns = /^(summary|professional summary|profile|objective|about me|career objective)/i;
  const experiencePatterns = /^(experience|work experience|employment history|professional experience|work history)/i;
  const educationPatterns = /^(education|academic background|qualifications|academic qualifications)/i;
  const skillsPatterns = /^(skills|technical skills|core competencies|expertise|proficiencies)/i;

  let currentSection = null;
  let sectionContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is a section header
    if (summaryPatterns.test(line)) {
      if (currentSection) {
        saveSectionContent(sections, currentSection, sectionContent);
      }
      currentSection = 'summary';
      sectionContent = [];
    } else if (experiencePatterns.test(line)) {
      if (currentSection) {
        saveSectionContent(sections, currentSection, sectionContent);
      }
      currentSection = 'experience';
      sectionContent = [];
    } else if (educationPatterns.test(line)) {
      if (currentSection) {
        saveSectionContent(sections, currentSection, sectionContent);
      }
      currentSection = 'education';
      sectionContent = [];
    } else if (skillsPatterns.test(line)) {
      if (currentSection) {
        saveSectionContent(sections, currentSection, sectionContent);
      }
      currentSection = 'skills';
      sectionContent = [];
    } else if (currentSection) {
      // Add content to current section
      sectionContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    saveSectionContent(sections, currentSection, sectionContent);
  }

  return sections;
};

/**
 * Save section content to sections object
 * @param {Object} sections - Sections object
 * @param {string} sectionName - Section name
 * @param {Array<string>} content - Section content lines
 */
const saveSectionContent = (sections, sectionName, content) => {
  if (content.length === 0) return;

  if (sectionName === 'summary') {
    sections.summary = content.join(' ');
  } else if (sectionName === 'experience') {
    sections.experience = parseExperienceSection(content);
  } else if (sectionName === 'education') {
    sections.education = parseEducationSection(content);
  } else if (sectionName === 'skills') {
    sections.skills = parseSkillsSection(content);
  }
};

/**
 * Parse experience section into structured entries
 * @param {Array<string>} lines - Experience section lines
 * @returns {Array<Object>} Structured experience entries
 */
const parseExperienceSection = (lines) => {
  const experiences = [];
  let currentEntry = null;

  for (const line of lines) {
    // Check if line looks like a job title or company (heuristic)
    if (line.length > 0 && !line.startsWith('•') && !line.startsWith('-')) {
      // Potential new entry
      if (currentEntry) {
        experiences.push(currentEntry);
      }
      currentEntry = {
        title: line,
        description: []
      };
    } else if (currentEntry && line.length > 0) {
      // Add to description
      currentEntry.description.push(line.replace(/^[•\-]\s*/, ''));
    }
  }

  if (currentEntry) {
    experiences.push(currentEntry);
  }

  return experiences;
};

/**
 * Parse education section into structured entries
 * @param {Array<string>} lines - Education section lines
 * @returns {Array<Object>} Structured education entries
 */
const parseEducationSection = (lines) => {
  const education = [];
  let currentEntry = null;

  for (const line of lines) {
    // Check if line looks like a degree or institution
    if (line.length > 0 && !line.startsWith('•') && !line.startsWith('-')) {
      if (currentEntry) {
        education.push(currentEntry);
      }
      currentEntry = {
        degree: line,
        details: []
      };
    } else if (currentEntry && line.length > 0) {
      currentEntry.details.push(line.replace(/^[•\-]\s*/, ''));
    }
  }

  if (currentEntry) {
    education.push(currentEntry);
  }

  return education;
};

/**
 * Parse skills section into array
 * @param {Array<string>} lines - Skills section lines
 * @returns {Array<string>} Skills array
 */
const parseSkillsSection = (lines) => {
  const skills = [];

  for (const line of lines) {
    // Split by common delimiters
    const lineSkills = line
      .split(/[,;|•\-]/)
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);
    
    skills.push(...lineSkills);
  }

  return skills;
};

/**
 * Extract contact information from resume text
 * @param {string} text - Resume text
 * @returns {Object} Contact information
 */
const extractContactInfo = (text) => {
  const contact = {};

  // Email pattern
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const emailMatch = text.match(emailPattern);
  if (emailMatch) {
    contact.email = emailMatch[0];
  }

  // Phone pattern (various formats)
  const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const phoneMatch = text.match(phonePattern);
  if (phoneMatch) {
    contact.phone = phoneMatch[0];
  }

  // LinkedIn pattern
  const linkedinPattern = /(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)([a-zA-Z0-9-]+)/i;
  const linkedinMatch = text.match(linkedinPattern);
  if (linkedinMatch) {
    contact.linkedin = linkedinMatch[0];
  }

  // GitHub pattern
  const githubPattern = /(?:github\.com\/)([a-zA-Z0-9-]+)/i;
  const githubMatch = text.match(githubPattern);
  if (githubMatch) {
    contact.github = githubMatch[0];
  }

  // Website/Portfolio pattern
  const websitePattern = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(?:\/[^\s]*)?/g;
  const websiteMatches = text.match(websitePattern);
  if (websiteMatches) {
    // Filter out email domains and social media
    const websites = websiteMatches.filter(url => 
      !url.includes('linkedin.com') && 
      !url.includes('github.com') &&
      !url.includes('@')
    );
    if (websites.length > 0) {
      contact.website = websites[0];
    }
  }

  // Location pattern (City, State or City, Country)
  const locationPattern = /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2}|[A-Z][a-z]+)/;
  const locationMatch = text.match(locationPattern);
  if (locationMatch) {
    contact.location = locationMatch[0];
  }

  return contact;
};

export default {
  parseResume,
  extractTextFromPDF,
  extractTextFromDOCX,
  extractSections,
  extractContactInfo
};
