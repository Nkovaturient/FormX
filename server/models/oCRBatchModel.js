const mongoose = require('mongoose');

const ocrBatchSchema = new mongoose.Schema({
    batchId: { type: String, required: true, unique: true },
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    batchName: String,
    status: { type: String, enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued' },
    documentsTotal: Number,
    documentsProcessed: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    completedAt: Date,
    options: mongoose.Schema.Types.Mixed,
    priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
    estimatedCompletionTime: Date,
    results: [mongoose.Schema.Types.Mixed],
    error: String
}, {
    timestamps: true
});

// Add indexes for better query performance
ocrBatchSchema.index({ status: 1 });
ocrBatchSchema.index({ batchId: 1 });

const oCRBatchModel = mongoose.model('OCRBatch', ocrBatchSchema);
module.exports = oCRBatchModel