const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userDataSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Personal Information
  personalInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    middleName: { type: String },
    dateOfBirth: { type: Date, default: Date.now },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    nationality: { type: String},
    maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed'] }
  },
  
  // Contact Information
  contactInfo: {
    email: { type: String, required: true },
    phone: String,
    mobile: String,
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: '' }
    },
    alternateAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: '' }
    }
  },
  
  // Professional Information
  professionalInfo: {
    occupation: String,
    employer: String,
    workAddress: String,
    workPhone: String,
    workEmail: String,
    experience: Number, // years
    education: [{
      degree: String,
      institution: String,
      year: Number,
      field: String
    }]
  },
  
  // Documents
  documents: [{
    type: { type: String, enum: ['id_proof', 'address_proof', 'photo', 'signature', 'certificate', 'other'] },
    name: String,
    fileName: String,
    filePath: String,
    mimeType: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    verificationNotes: String
  }],
  
  // Form-specific data
  formData: [{
    formId: String,
    formType: String,
    fieldData: mongoose.Schema.Types.Mixed,
    completedAt: Date,
    status: { type: String, enum: ['draft', 'completed', 'submitted'], default: 'draft' }
  }],
  
  // Security
  dataHash: String,
  encryptionKey: String,
  lastUpdated: { type: Date, default: Date.now },
  
  // Sensitive fields encrypted at rest
  sensitive: { type: mongoose.Schema.Types.Mixed, default: {} },
  
  // Privacy settings
  dataSharing: {
    allowFormFilling: { type: Boolean, default: true },
    allowAnalytics: { type: Boolean, default: false },
    retentionPeriod: { type: Number, default: 365 } // days
  }
}, {
  timestamps: true
});

// Indexes for performance
userDataSchema.index({ 'personalInfo.firstName': 1, 'personalInfo.lastName': 1 });
userDataSchema.index({ 'contactInfo.email': 1 });

// Pre-save middleware to hash sensitive data
userDataSchema.pre('save', async function(next) {
  if (this.isModified('personalInfo') || this.isModified('contactInfo')) {
    this.dataHash = await bcrypt.hash(JSON.stringify(this.personalInfo) + JSON.stringify(this.contactInfo), 10);
  }
  next();
});

// Instance methods
userDataSchema.methods.updatePersonalInfo = function(newInfo) {
  this.personalInfo = { ...this.personalInfo, ...newInfo };
  this.lastUpdated = new Date();
  return this.save();
};

userDataSchema.methods.addDocument = function(document) {
  this.documents.push(document);
  return this.save();
};

userDataSchema.methods.getFormData = function(formId) {
  return this.formData.find(data => data.formId === formId);
};

userDataSchema.methods.updateFormData = function(formId, fieldData) {
  const existingData = this.formData.find(data => data.formId === formId);
  if (existingData) {
    existingData.fieldData = { ...existingData.fieldData, ...fieldData };
    existingData.lastUpdated = new Date();
  } else {
    this.formData.push({
      formId,
      fieldData,
      completedAt: new Date()
    });
  }
  return this.save();
};

const userDataModel = mongoose.model('UserData', userDataSchema);
module.exports = userDataModel; 