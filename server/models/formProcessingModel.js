const mongoose = require('mongoose');

const formProcessingSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Original form information
  originalForm: {
    fileName: String,
    filePath: String,
    mimeType: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  },
  
  // Processing workflow status
  workflow: {
    currentStep: { 
      type: String, 
      enum: ['analysis', 'data_collection', 'verification', 'filling', 'completed', 'failed'],
      default: 'analysis'
    },
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'failed', 'paused'],
      default: 'pending'
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    totalSteps: { type: Number, default: 4 }
  },
  
  // Step 1: Form Analysis Results
  analysis: {
    formType: String,
    totalFields: Number,
    requiredFields: [String],
    fieldMappings: mongoose.Schema.Types.Mixed,
    confidence: Number,
    completedAt: Date,
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' }
  },
  
  // Step 2: Data Collection Requirements
  dataCollection: {
    requiredInfo: [{
      field: String,
      type: String,
      required: Boolean,
      description: String,
      validation: mongoose.Schema.Types.Mixed
    }],
    requiredDocuments: [{
      type: String,
      description: String,
      required: Boolean,
      acceptedFormats: [String]
    }],
    userDataId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserData' },
    completedAt: Date,
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' }
  },
  
  // Step 3: Data Verification
  verification: {
    dataVerified: { type: Boolean, default: false },
    documentsVerified: { type: Boolean, default: false },
    verificationNotes: [String],
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    verifiedAt: Date,
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' }
  },
  
  // Step 4: Form Filling
  filling: {
    filledFormPath: String,
    filledFormFormat: String, // PDF, DOCX, etc.
    fieldMappingResults: mongoose.Schema.Types.Mixed,
    qualityScore: Number,
    completedAt: Date,
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' }
  },
  
  // Final output
  output: {
    downloadUrl: String,
    previewUrl: String,
    formats: [String], // Available formats for download
    generatedAt: Date
  },
  
  // Error tracking
  errors: [{
    step: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false }
  }],
  
  // Processing metadata
  processingTime: Number,
  agentVersions: {
    analyzer: String,
    verifier: String,
    filler: String
  },
  
  // User preferences
  preferences: {
    outputFormat: { type: String, default: 'PDF' },
    includePreview: { type: Boolean, default: true },
    autoDownload: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Indexes for performance
formProcessingSchema.index({ 'workflow.currentStep': 1 });
formProcessingSchema.index({ createdAt: -1 });

// Instance methods
formProcessingSchema.methods.updateStep = function(step, status, data = {}) {
  this.workflow.currentStep = step;
  this.workflow.status = status;
  
  if (data) {
    this[step] = { ...this[step], ...data };
  }
  
  if (status === 'completed') {
    this[step].completedAt = new Date();
  }
  
  if (step === 'filling' && status === 'completed') {
    this.workflow.completedAt = new Date();
    this.processingTime = this.workflow.completedAt - this.workflow.startedAt;
  }
  
  return this.save();
};

formProcessingSchema.methods.addError = function(step, message) {
  this.errors.push({ step, message });
  this.workflow.status = 'failed';
  return this.save();
};

formProcessingSchema.methods.getProgress = function() {
  const steps = ['analysis', 'data_collection', 'verification', 'filling'];
  const completedSteps = steps.filter(step => this[step].status === 'completed').length;
  return {
    currentStep: this.workflow.currentStep,
    completedSteps,
    totalSteps: this.workflow.totalSteps,
    percentage: Math.round((completedSteps / this.workflow.totalSteps) * 100)
  };
};

formProcessingSchema.methods.isComplete = function() {
  return this.workflow.status === 'completed' && this.output.downloadUrl;
};

const formProcessingModel = mongoose.model('FormProcessing', formProcessingSchema);
module.exports = formProcessingModel; 