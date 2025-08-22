const { FormAnalyzerAgent } = require('./agents/FormAnalyzerAgent');
const { DataExtractorAgent } = require('./agents/DataExtractorAgent');
const { DataVerifierAgent } = require('./agents/DataVerifierAgent');
const { FormFillerAgent } = require('./agents/FormFillerAgent');
const { SecurityService } = require('./SecurityService');
const { DatabaseService, DatabaseServices } = require('./DatabaseService');
const { CacheService, CacheServices } = require('./CacheService');
const userDataModel = require('../models/userDataModel');
const formProcessingModel = require('../models/formProcessingModel');
const userUsageModel = require('../models/userUsageModel');
const ApiError = require('../utils/ApiError');
const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const tesseract = require('tesseract.js');
const sharp = require('sharp');

class FormProcessingService {
  constructor() {
    this.analyzer = new FormAnalyzerAgent();
    this.extractor = new DataExtractorAgent();
    this.verifier = new DataVerifierAgent();
    this.filler = new FormFillerAgent();
    this.securityService = new SecurityService();
    this.originalFormsDir = path.join(__dirname, '../uploads/original-forms');
  }

  async processFormComplete(file, userId, options = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`Starting complete form processing for user: ${userId}`);

      // Check user quota
      // await this.checkUserQuota(userId);

      // Validate and persist uploaded file if coming from memory storage
      await this.ensureDirectory(this.originalFormsDir);
      await this.securityService.validateFile(file);
      const storedFilePath = await this.saveUploadedFile(file);

      // Normalize options possibly coming as string from multipart
      let normalizedOptions = options;
      if (typeof normalizedOptions === 'string') {
        try { normalizedOptions = JSON.parse(normalizedOptions); } catch { normalizedOptions = {}; }
      }

      // Create processing record
      const processingRecord = await this.createProcessingRecord({ ...file, path: storedFilePath }, userId, normalizedOptions);

      // Step 1: Form Analysis
      const analysisResult = await this.performFormAnalysis({ ...file, path: storedFilePath }, processingRecord);
      await processingRecord.updateStep('analysis', 'completed', analysisResult);

      // Step 2: Data Collection Requirements
      const dataRequirements = await this.generateDataRequirements(analysisResult, processingRecord);
      await processingRecord.updateStep('data_collection', 'completed', dataRequirements);

      // Return initial results for user data collection
      return {
        processingId: processingRecord._id,
        status: 'data_collection_required',
        analysis: analysisResult,
        dataRequirements,
        nextStep: 'Provide your information and documents',
        estimatedTime: '2-3 minutes'
      };

    } catch (error) {
      console.error('Form processing failed:', error);
      throw new ApiError(500, 'Form processing failed', error.message);
    }
  }

  async submitUserData(processingId, userData, documents, userId) {
    try {
      console.log(`Processing user data submission for processing: ${processingId}`);

      // Get processing record
      const processingRecord = await formProcessingModel.findOne({
        _id: processingId,
        userId: userId
      });

      if (!processingRecord) {
        throw new ApiError(404, 'Processing record not found');
      }

      // Save user data
      const userDataRecord = await this.saveUserData(userId, userData, documents);

      // Update processing record with user data
      await processingRecord.updateStep('data_collection', 'completed', {
        userDataId: userDataRecord._id
      });

      // Step 3: Data Verification
      const verificationResult = await this.performDataVerification(userDataRecord, processingRecord);
      await processingRecord.updateStep('verification', 'completed', verificationResult);

      if (!verificationResult.verified) {
        return {
          processingId: processingRecord._id,
          status: 'verification_failed',
          verificationResult,
          nextStep: 'Please correct the issues and resubmit'
        };
      }

      // Step 4: Form Filling
      const fillingResult = await this.performFormFilling(processingRecord, userDataRecord);
      await processingRecord.updateStep('filling', 'completed', fillingResult);

      // Generate final output
      const finalOutput = await this.generateFinalOutput(processingRecord, fillingResult);

      return {
        processingId: processingRecord._id,
        status: 'completed',
        result: finalOutput,
        processingTime: Date.now() - processingRecord.workflow.startedAt
      };

    } catch (error) {
      console.error('User data processing failed:', error);
      throw new ApiError(500, 'User data processing failed', error.message);
    }
  }

  async performFormAnalysis(file, processingRecord) {
    try {
      console.log('Step 1: Performing form analysis');

      // Convert file to document format
      const document = await this.fileToDocument(file, processingRecord.userId);

      // Extract form data
      const extractionResult = await this.extractor.extractFormData(document);

      // Analyze form structure
      const analysisResult = await this.analyzer.analyzeForm(document);

      // Combine results
      const combinedResult = {
        formType: analysisResult.structure?.formType || 'unknown',
        totalFields: extractionResult.totalFields || 0,
        requiredFields: this.extractRequiredFields(extractionResult),
        fieldMappings: this.generateFieldMappings(extractionResult),
        confidence: analysisResult.confidence || 0,
        structure: analysisResult.structure,
        usability: analysisResult.usability,
        performance: analysisResult.performance,
        compliance: analysisResult.compliance,
        extractedData: extractionResult
      };

      return combinedResult;

    } catch (error) {
      console.error('Form analysis failed:', error);
      throw new Error(`Form analysis failed: ${error.message}`);
    }
  }

  async generateDataRequirements(analysisResult, processingRecord) {
    try {
      console.log('Step 2: Generating data requirements');

      // Extract form fields from the analysis result
      const extractedFields = analysisResult.extractedData || {};
      const textFields = extractedFields.textFields || [];
      const checkboxes = extractedFields.checkboxes || [];
      const radioButtons = extractedFields.radioButtons || [];
      const signatures = extractedFields.signatures || [];
      const tables = extractedFields.tables || [];

      // Generate dynamic requirements based on extracted fields
      const requirements = {
        requiredInfo: this.generateRequiredInfoFromFields(textFields, radioButtons),
        requiredDocuments: this.generateRequiredDocumentsFromFields(textFields, signatures),
        optionalInfo: this.generateOptionalInfoFromFields(textFields, checkboxes),
        validationRules: this.generateValidationRulesFromFields(textFields),
        formFields: {
          textFields: textFields.map(field => ({
            name: field.label,
            type: field.type,
            required: field.required,
            validation: field.validation,
            position: field.position
          })),
          checkboxes: checkboxes.map(field => ({
            name: field.label,
            options: field.options,
            required: field.required
          })),
          radioButtons: radioButtons.map(field => ({
            name: field.label,
            options: field.options,
            required: field.required
          })),
          signatures: signatures.map(field => ({
            name: field.label,
            type: field.signatureType,
            required: field.required
          })),
          tables: tables.map(field => ({
            name: field.label,
            columns: field.columns,
            rows: field.rows
          }))
        },
        formType: analysisResult.formType,
        totalFields: analysisResult.totalFields,
        confidence: analysisResult.confidence
      };

      return requirements;

    } catch (error) {
      console.error('Data requirements generation failed:', error);
      throw new Error(`Data requirements generation failed: ${error.message}`);
    }
  }

  async performDataVerification(userDataRecord, processingRecord) {
    try {
      console.log('Step 3: Performing data verification');

      const analysisResult = processingRecord.analysis;
      const dataRequirements = processingRecord.dataCollection;

      // Verify user data against requirements
      const verificationResult = await this.verifier.verifyUserData(
        userDataRecord,
        dataRequirements
      );

      return verificationResult;

    } catch (error) {
      console.error('Data verification failed:', error);
      throw new Error(`Data verification failed: ${error.message}`);
    }
  }

  async performFormFilling(processingRecord, userDataRecord) {
    try {
      console.log('Step 4: Performing form filling');

      const originalForm = processingRecord.originalForm;
      const analysisResult = processingRecord.analysis;
      const verificationResult = processingRecord.verification;

      // Fill the form
      const fillingResult = await this.filler.fillForm(
        originalForm,
        userDataRecord,
        analysisResult,
        verificationResult
      );

      return fillingResult;

    } catch (error) {
      console.error('Form filling failed:', error);
      throw new Error(`Form filling failed: ${error.message}`);
    }
  }

  async generateFinalOutput(processingRecord, fillingResult) {
    try {
      console.log('Generating final output');

      const output = {
        downloadUrl: `/api/form-processing/download/${path.basename(fillingResult.filledFormPath)}`,
        previewUrl: `/api/form-processing/preview/${path.basename(fillingResult.filledFormPath)}`,
        formats: fillingResult.outputFormats,
        generatedAt: new Date().toISOString(),
        qualityScore: fillingResult.qualityScore,
        metadata: {
          originalForm: processingRecord.originalForm.fileName,
          processingTime: processingRecord.processingTime,
          totalFields: fillingResult.metadata.totalFields,
          filledFields: fillingResult.metadata.filledFields
        }
      };

      // Update processing record with final output
      processingRecord.output = output;
      processingRecord.workflow.status = 'completed';
      await processingRecord.save();

      return output;

    } catch (error) {
      console.error('Final output generation failed:', error);
      throw new Error(`Final output generation failed: ${error.message}`);
    }
  }

  async saveUserData(userId, userData, documents) {
    try {
      console.log('saveUserData called with:', {
        userId,
        userDataKeys: Object.keys(userData),
        documentsCount: documents?.length || 0
      });

      // Check if user data already exists
      let userDataRecord = await userDataModel.findOne({ userId });

      if (!userDataRecord) {
        userDataRecord = new userDataModel({ userId });
        console.log('Created new user data record');
      } else {
        console.log('Found existing user data record');
      }

      // Extract dynamic fields if present
      const dynamicFields = userData.dynamicFields || {};
      console.log('Dynamic fields extracted:', Object.keys(dynamicFields));
      
      // Prepare personal information with proper defaults
      const personalInfo = {
        firstName: userData.personalInfo?.firstName || dynamicFields.name || dynamicFields.first_name || '',
        lastName: userData.personalInfo?.lastName || dynamicFields.last_name || '',
        middleName: userData.personalInfo?.middleName || '',
        dateOfBirth: this.parseDate(userData.personalInfo?.dateOfBirth || dynamicFields.date_of_birth || dynamicFields.dateofbirth) || new Date(),
        gender: userData.personalInfo?.gender || dynamicFields.gender || '',
        nationality: userData.personalInfo?.nationality || dynamicFields.nationality || '',
        maritalStatus: userData.personalInfo?.maritalStatus || ''
      };

      console.log('Prepared personal info:', personalInfo);

      // Prepare contact information with proper defaults
      const contactInfo = {
        email: userData.contactInfo?.email || dynamicFields.email || '',
        phone: userData.contactInfo?.phone || dynamicFields.phone || dynamicFields.mobile || '',
        mobile: userData.contactInfo?.mobile || dynamicFields.mobile || '',
        address: {
          street: userData.contactInfo?.address?.street || dynamicFields.address || '',
          city: userData.contactInfo?.address?.city || dynamicFields.city || '',
          state: userData.contactInfo?.address?.state || dynamicFields.state || '',
          zipCode: userData.contactInfo?.address?.zipCode || dynamicFields.zip_code || dynamicFields.zipcode || '',
          country: userData.contactInfo?.address?.country || dynamicFields.country || ''
        },
        alternateAddress: {
          street: userData.contactInfo?.alternateAddress?.street || '',
          city: userData.contactInfo?.alternateAddress?.city || '',
          state: userData.contactInfo?.alternateAddress?.state || '',
          zipCode: userData.contactInfo?.alternateAddress?.zipCode || '',
          country: userData.contactInfo?.alternateAddress?.country || ''
        }
      };

      console.log('Prepared contact info:', contactInfo);

      // Prepare professional information with proper defaults
      const professionalInfo = {
        occupation: userData.professionalInfo?.occupation || dynamicFields.occupation || '',
        employer: userData.professionalInfo?.employer || dynamicFields.employer || '',
        workAddress: userData.professionalInfo?.workAddress || '',
        workPhone: userData.professionalInfo?.workPhone || '',
        workEmail: userData.professionalInfo?.workEmail || '',
        experience: userData.professionalInfo?.experience || dynamicFields.experience || 0,
        education: userData.professionalInfo?.education || []
      };

      console.log('Prepared professional info:', professionalInfo);

      // Validate required fields before saving
      if (!personalInfo.firstName || !personalInfo.lastName) {
        throw new Error('First name and last name are required');
      }

      if (!contactInfo.email) {
        throw new Error('Email is required');
      }

      console.log('Validation passed, updating user data record');

      // Update the user data record with properly formatted data
      userDataRecord.personalInfo = personalInfo;
      userDataRecord.contactInfo = contactInfo;
      userDataRecord.professionalInfo = professionalInfo;

      // Add documents
      if (documents && documents.length > 0) {
        for (const doc of documents) {
          const documentData = {
            type: doc.type || 'other',
            name: doc.name || doc.originalname || 'Document',
            fileName: doc.filename || doc.originalname || 'document',
            filePath: doc.path || doc.filepath || '',
            mimeType: doc.mimetype || doc.mimeType || 'application/octet-stream',
            size: doc.size || 0,
            verified: false
          };
          userDataRecord.documents.push(documentData);
        }
      }

      // Add form-specific data from dynamic fields
      if (Object.keys(dynamicFields).length > 0) {
        const formData = {
          formId: `dynamic_${Date.now()}`,
          formType: 'dynamic',
          fieldData: dynamicFields,
          completedAt: new Date(),
          status: 'completed'
        };
        userDataRecord.formData.push(formData);
      }

      console.log('About to save user data record');
      await userDataRecord.save();
      console.log('User data record saved successfully');
      return userDataRecord;

    } catch (error) {
      console.error('User data save failed:', error);
      throw new Error(`User data save failed: ${error.message}`);
    }
  }

  async createProcessingRecord(file, userId, options) {
    try {
      const processingRecord = new formProcessingModel({
        userId,
        originalForm: {
          fileName: file.originalname,
          filePath: file.path,
          mimeType: file.mimetype,
          size: file.size
        },
        preferences: (options && options.preferences) || {}
      });

      await processingRecord.save();
      return processingRecord;

    } catch (error) {
      console.error('Processing record creation failed:', error);
      throw new Error(`Processing record creation failed: ${error.message}`);
    }
  }

  async fileToDocument(file, userId) {
    try {
      const content = await this.extractFileContent(file);
      return {
        name: file.originalname,
        content,
        type: this.getDocumentType(file.mimetype),
        size: file.size,
        userId
      };
    } catch (error) {
      console.error('File to document conversion failed:', error);
      throw new Error(`File to document conversion failed: ${error.message}`);
    }
  }

  async extractFileContent(file) {
    try {
      if (file.mimetype === 'application/pdf') {
        return await this.extractPDFContent(file);
      } else if (file.mimetype.includes('image/')) {
        return await this.extractImageContent(file);
      } else {
        return await this.extractTextContent(file);
      }
    } catch (error) {
      console.error('File content extraction failed:', error);
      throw new Error(`File content extraction failed: ${error.message}`);
    }
  }

  async extractPDFContent(file) {
    try {
      let buffer;
      
      // Handle both memory storage (file.buffer) and disk storage (file.path)
      if (file.buffer) {
        // File is in memory (multer.memoryStorage)
        buffer = file.buffer;
      } else if (file.path) {
        // File is on disk (multer.diskStorage)
        buffer = await fs.readFile(file.path);
      } else {
        throw new Error('No file buffer or path available');
      }
      
      const data = await pdfParse(buffer);
      return data.text || 'No text content found in PDF';
    } catch (error) {
      console.error('PDF content extraction failed:', error);
      // For invalid PDFs, return a placeholder content instead of throwing
      if (error.message.includes('Invalid PDF') || error.message.includes('Invalid PDF structure')) {
        console.warn('Invalid PDF detected, returning placeholder content');
        return 'PDF content could not be extracted - form analysis will proceed with available data';
      }
      throw new Error(`PDF content extraction failed: ${error.message}`);
    }
  }

  async extractImageContent(file) {
    try {
      let imageBuffer;
      
      // Handle both memory storage (file.buffer) and disk storage (file.path)
      if (file.buffer) {
        // File is in memory (multer.memoryStorage)
        imageBuffer = file.buffer;
      } else if (file.path) {
        // File is on disk (multer.diskStorage)
        imageBuffer = await fs.readFile(file.path);
      } else {
        throw new Error('No file buffer or path available');
      }
      
      // Use Tesseract.js with proper configuration
      const { createWorker } = require('tesseract.js');
      const worker = await createWorker('eng');
      
      const { data: { text } } = await worker.recognize(imageBuffer);
      await worker.terminate();
      
      return text;
    } catch (error) {
      console.error('Image content extraction failed:', error);
      // For OCR failures, return a placeholder content instead of throwing
      console.warn('OCR extraction failed, returning placeholder content');
      return 'Image content could not be extracted via OCR - form analysis will proceed with available data';
    }
  }

  async extractTextContent(file) {
    try {
      let content;
      
      // Handle both memory storage (file.buffer) and disk storage (file.path)
      if (file.buffer) {
        // File is in memory (multer.memoryStorage)
        content = file.buffer.toString('utf8');
      } else if (file.path) {
        // File is on disk (multer.diskStorage)
        content = await fs.readFile(file.path, 'utf8');
      } else {
        throw new Error('No file buffer or path available');
      }
      
      return content;
    } catch (error) {
      console.error('Text content extraction failed:', error);
      throw new Error(`Text content extraction failed: ${error.message}`);
    }
  }

  getDocumentType(mimeType) {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('image/')) return 'image';
    return 'text';
  }

  extractRequiredFields(extractionResult) {
    // Extract required fields from extraction result
    return extractionResult.fields?.filter(field => field.required)?.map(field => field.name) || [];
  }

  generateFieldMappings(extractionResult) {
    // Generate field mappings from extraction result
    const mappings = {};
    if (extractionResult.fields) {
      extractionResult.fields.forEach(field => {
        mappings[field.name] = {
          type: field.type,
          required: field.required,
          validation: field.validation
        };
      });
    }
    return mappings;
  }

  generateRequiredInfoFromFields(textFields, radioButtons) {
    const requiredInfo = [];
    
    // Process text fields
    textFields.forEach(field => {
      if (field.required) {
        requiredInfo.push({
          field: field.label.toLowerCase().replace(/\s+/g, '_'),
          type: field.type,
          required: true,
          description: field.label,
          validation: field.validation,
          originalField: field
        });
      }
    });

    // Process radio button fields
    radioButtons.forEach(field => {
      if (field.required) {
        requiredInfo.push({
          field: field.label.toLowerCase().replace(/\s+/g, '_'),
          type: 'radio',
          required: true,
          description: field.label,
          options: field.options,
          originalField: field
        });
      }
    });

    return requiredInfo;
  }

  generateRequiredDocumentsFromFields(textFields, signatures) {
    const requiredDocuments = [];
    
    // Check for signature fields
    signatures.forEach(field => {
      if (field.required) {
        requiredDocuments.push({
          type: 'signature',
          description: field.label,
          required: true,
          acceptedFormats: ['jpg', 'png', 'pdf'],
          originalField: field
        });
      }
    });

    // Check for document-related fields
    const documentKeywords = ['id', 'passport', 'license', 'certificate', 'document', 'proof'];
    textFields.forEach(field => {
      const fieldName = field.label.toLowerCase();
      if (field.required && documentKeywords.some(keyword => fieldName.includes(keyword))) {
        requiredDocuments.push({
          type: fieldName.replace(/\s+/g, '_'),
          description: field.label,
          required: true,
          acceptedFormats: ['pdf', 'jpg', 'png'],
          originalField: field
        });
      }
    });

    return requiredDocuments;
  }

  generateOptionalInfoFromFields(textFields, checkboxes) {
    const optionalInfo = [];
    
    // Process optional text fields
    textFields.forEach(field => {
      if (!field.required) {
        optionalInfo.push({
          field: field.label.toLowerCase().replace(/\s+/g, '_'),
          type: field.type,
          required: false,
          description: field.label,
          validation: field.validation,
          originalField: field
        });
      }
    });

    // Process checkbox fields
    checkboxes.forEach(field => {
      optionalInfo.push({
        field: field.label.toLowerCase().replace(/\s+/g, '_'),
        type: 'checkbox',
        required: false,
        description: field.label,
        options: field.options,
        originalField: field
      });
    });

    return optionalInfo;
  }

  generateValidationRulesFromFields(textFields) {
    const validationRules = {};
    
    textFields.forEach(field => {
      if (field.validation) {
        const fieldName = field.label.toLowerCase().replace(/\s+/g, '_');
        validationRules[fieldName] = {
          pattern: field.validation.pattern,
          message: field.validation.message || `Invalid ${field.label} format`,
          required: field.required
        };
      }
    });

    return validationRules;
  }

  // Legacy methods kept for backward compatibility
  extractRequiredDocuments(analysisResult) {
    return this.generateRequiredDocumentsFromFields([], []);
  }

  extractOptionalInfo(analysisResult) {
    return this.generateOptionalInfoFromFields([], []);
  }

  extractValidationRules(analysisResult) {
    return this.generateValidationRulesFromFields([]);
  }

  async checkUserQuota(userId) {
    try {
      const userUsage = await userUsageModel.findOne({ userId });
      if (!userUsage) {
        throw new ApiError(404, 'User usage record not found');
      }

      const quota = userUsage.checkQuota('analysis');
      if (!quota.allowed) {
        throw new ApiError(429, `Quota exceeded. Limit: ${quota.limit}, Used: ${quota.used}`);
      }

      return quota;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Quota check failed', error.message);
    }
  }

  async getProcessingStatus(processingId, userId) {
    try {
      const processingRecord = await formProcessingModel.findOne({
        _id: processingId,
        userId: userId
      });

      if (!processingRecord) {
        throw new ApiError(404, 'Processing record not found');
      }

      return {
        processingId: processingRecord._id,
        status: processingRecord.workflow.status,
        currentStep: processingRecord.workflow.currentStep,
        progress: processingRecord.getProgress(),
        startedAt: processingRecord.workflow.startedAt,
        completedAt: processingRecord.workflow.completedAt,
        errors: processingRecord.errors
      };

    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Status retrieval failed', error.message);
    }
  }

  async getUserProcessingHistory(userId, limit = 10) {
    try {
      const history = await formProcessingModel.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('originalForm workflow status createdAt');

      return history;

    } catch (error) {
      console.error('History retrieval failed:', error);
      throw new ApiError(500, 'History retrieval failed', error.message);
    }
  }

  parseDate(dateString) {
    if (!dateString) return null;
    
    console.log('Parsing date:', dateString);
    
    // Try direct Date constructor first
    let date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      console.log('Date parsed successfully:', date);
      return date;
    }
    
    // Try YYYY-MM-DD format
    if (typeof dateString === 'string' && dateString.includes('-')) {
      const [year, month, day] = dateString.split('-');
      if (year && month && day) {
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          console.log('Date parsed from YYYY-MM-DD format:', date);
          return date;
        }
      }
    }
    
    // Try MM/DD/YYYY format
    if (typeof dateString === 'string' && dateString.includes('/')) {
      const [month, day, year] = dateString.split('/');
      if (month && day && year) {
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          console.log('Date parsed from MM/DD/YYYY format:', date);
          return date;
        }
      }
    }
    
    console.warn(`Could not parse date string: ${dateString}`);
    return null;
  }

  async ensureDirectory(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async saveUploadedFile(file) {
    // If file already has a path (disk storage), return it
    if (file.path) return file.path;

    const sanitizedName = this.securityService.sanitizeFileName(file.originalname || 'uploaded_form');
    const storedFilePath = path.join(this.originalFormsDir, `${Date.now()}_${sanitizedName}`);
    await fs.writeFile(storedFilePath, file.buffer);
    return storedFilePath;
  }
}

module.exports = { FormProcessingService }; 