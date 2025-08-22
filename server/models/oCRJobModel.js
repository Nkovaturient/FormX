const mongoose= require('mongoose')

const ocrJobSchema = new mongoose.Schema({
    jobId: { type: String, required: true, unique: true },
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    documentsTotal: Number,
    documentsProcessed: { type: Number, default: 0 },
    startTime: Date,
    completedAt: Date,
    options: mongoose.Schema.Types.Mixed,
    results: [mongoose.Schema.Types.Mixed],
    error: String
}, {
    timestamps: true
});

// Add indexes for better query performance
ocrJobSchema.index({ status: 1 });
ocrJobSchema.index({ jobId: 1 });


const oCRJobModel = mongoose.model('OCRJob', ocrJobSchema);
module.exports = oCRJobModel