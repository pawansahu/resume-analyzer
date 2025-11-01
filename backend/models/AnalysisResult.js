import mongoose from 'mongoose';

const analysisResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resumeS3Key: {
    type: String,
    required: true
  },
  atsScore: {
    totalScore: { type: Number, min: 0, max: 100 },
    structureScore: { type: Number, min: 0, max: 25 },
    keywordScore: { type: Number, min: 0, max: 30 },
    readabilityScore: { type: Number, min: 0, max: 25 },
    formattingScore: { type: Number, min: 0, max: 20 },
    breakdown: mongoose.Schema.Types.Mixed
  },
  recommendations: [mongoose.Schema.Types.Mixed],
  parsedData: mongoose.Schema.Types.Mixed,
  jobDescription: {
    type: String
  },
  jdMatchResult: {
    matchPercentage: Number,
    matchedKeywords: [mongoose.Schema.Types.Mixed],
    missingKeywords: [mongoose.Schema.Types.Mixed],
    suggestions: [mongoose.Schema.Types.Mixed],
    jdRequirements: mongoose.Schema.Types.Mixed
  },
  aiSuggestions: [mongoose.Schema.Types.Mixed],
  coverLetter: {
    type: String
  },
  reportS3Key: {
    type: String
  },
  reportDownloadUrl: {
    type: String
  },
  reportExpiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
analysisResultSchema.index({ userId: 1, createdAt: -1 });
analysisResultSchema.index({ resumeS3Key: 1 });

const AnalysisResult = mongoose.model('AnalysisResult', analysisResultSchema);

export default AnalysisResult;
