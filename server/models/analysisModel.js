const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    timestamp: { type: Date, default: Date.now },
    processingTime: Number,
    documents: Number,
    extractedData: mongoose.Schema.Types.Mixed,
    analysis: mongoose.Schema.Types.Mixed,
    recommendations: [mongoose.Schema.Types.Mixed],
    metadata: mongoose.Schema.Types.Mixed,
    confidence: Number,
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    files: [{
      originalName: String,
      mimeType: String,
      size: Number,
      processingStatus: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }, {
    timestamps: true
  });

  // Add indexes for better query performance
  // analysisSchema.index({ userId: 1, timestamp: -1 });
  analysisSchema.index({ status: 1 });
  analysisSchema.index({ createdAt: -1 });

const analysisModel = mongoose.model('Analysis', analysisSchema);
module.exports = analysisModel