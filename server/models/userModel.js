const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true},
    passwordHash: { type: String, required: true },
    plan: { type: String, enum: ['free', 'personal', 'pro', 'enterprise'], default: 'free' },
    isActive: { type: Boolean, default: true },
    profile: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      company: { type: String, default: null },
      industry: { type: String, default: null }
    },
    preferences: {
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'UTC' },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false }
      }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date, default: null }
  }, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });

// Add virtual populate for related data
userSchema.virtual('analyses', {
  ref: 'Analysis',
  localField: '_id',
  foreignField: 'userId'
});

userSchema.virtual('usage', {
  ref: 'UserUsage',
  localField: '_id',
  foreignField: 'userId'
});

userSchema.virtual('generatedForms', {
  ref: 'GeneratedForm',
  localField: '_id',
  foreignField: 'userId'
});

userSchema.virtual('ocrJobs', {
  ref: 'OCRJob',
  localField: '_id',
  foreignField: 'userId'
});

// Pre-save middleware to ensure updatedAt is set
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Ensure virtuals are included when converting to JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const userModel = mongoose.model('User', userSchema);
module.exports = userModel;