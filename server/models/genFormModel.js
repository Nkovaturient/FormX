const mongoose = require('mongoose')

const generatedFormSchema = new mongoose.Schema({
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    createdAt: { type: Date, default: Date.now },
    processingTime: Number,
    metadata: mongoose.Schema.Types.Mixed,
    structure: mongoose.Schema.Types.Mixed,
    configuration: mongoose.Schema.Types.Mixed,
    implementation: mongoose.Schema.Types.Mixed,
    validation: mongoose.Schema.Types.Mixed,
    analytics: mongoose.Schema.Types.Mixed,
    deployment: mongoose.Schema.Types.Mixed,
    status: { type: String, enum: ['generating', 'completed', 'deployed', 'failed'], default: 'generating' }
}, {
    timestamps: true
});

// Add indexes for better query performance
// generatedFormSchema.index({ userId: 1, createdAt: -1 });
generatedFormSchema.index({ status: 1 });

const genFormModel = mongoose.model('GeneratedForm', generatedFormSchema);
module.exports = genFormModel