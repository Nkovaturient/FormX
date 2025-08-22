const { FormAnalyzerAgent } = require('./agents/FormAnalyzerAgent');
const { DataExtractorAgent } = require('./agents/DataExtractorAgent');
const { RecommendationEngine } = require('./agents/RecommendationEngine');
const { FormGeneratorAgent } = require('./agents/FormGeneratorAgent');
const { SecurityService } = require('./SecurityService');
const { DatabaseService, DatabaseServices } = require('./DatabaseService');
const { CacheService, CacheServices } = require('./CacheService');
const Tesseract = require('tesseract.js');
const ApiError = require('../utils/ApiError');
const userUsageModel = require('../models/userUsageModel');
const analysisModel = require('../models/analysisModel');
const genFormModel = require('../models/genFormModel');

class FormAnalysisService {
  constructor() {
    this.analyzer = new FormAnalyzerAgent();
    this.extractor = new DataExtractorAgent();
    this.recommendationEngine = new RecommendationEngine();
    this.generator = new FormGeneratorAgent();
    this.securityService = new SecurityService();
  }

  async analyzeFormFiles(files, userId, metadata = {}, options = {}) {
    try {
      const startTime = Date.now();
      
      // Check user quota before processing
      // await this.checkUserQuota(userId);
      
      // Validate and sanitize files
      const sanitizedFiles = await this.validateAndSanitizeFiles(files);
      
      // Convert files to documents
      const documents = await Promise.all(
        sanitizedFiles.map(file => this.fileToDocument(file, userId))
      );

      // Extract data from all documents using real extractor
      const extractionResults = await Promise.all(
        documents.map(doc => this.extractor.extractFormData(doc))
      );

      // Analyze form structure and performance using real analyzer
      const analysisResults = await Promise.all(
        documents.map(doc => this.analyzer.analyzeForm(doc))
      );

      // Generate recommendations if requested using real recommendation engine
      let recommendations = [];
      if (options.includeRecommendations !== false) {
        const context = this.buildRecommendationContext(metadata);
        recommendations = await Promise.all(
          analysisResults.map(analysis => 
            this.recommendationEngine.generateContextualRecommendations(analysis, context)
          )
        );
      }

      // Combine results
      const combinedResults = {
        id: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        documents: documents.length,
        extractedData: this.combineExtractionResults(extractionResults),
        analysis: this.combineAnalysisResults(analysisResults),
        recommendations: recommendations.flat(),
        metadata,
        confidence: this.calculateOverallConfidence(analysisResults)
      };

      // Store results in database
      await this.storeAnalysisResults(combinedResults);

      // Update user usage statistics
      await this.updateUserUsage(userId, 'analysis', documents.length);

      return combinedResults;

    } catch (error) {
      console.error('Form analysis failed:', error);
      throw new ApiError(500, 'Form analysis failed', error.message);
    }
  }

  async generateOptimizedForm(request, userId) {
    try {
      const startTime = Date.now();

      // Validate generation request
      this.validateGenerationRequest(request);

      // Generate form using real AI generator
      const generatedForm = await this.generator.generateOptimizedForm(request);

      // Add user context
      generatedForm.userId = userId;
      generatedForm.createdAt = new Date().toISOString();
      generatedForm.processingTime = Date.now() - startTime;

      // Store generated form
      await this.storeGeneratedForm(generatedForm);

      // Update user usage statistics
      await this.updateUserUsage(userId, 'generation', 1);

      return generatedForm;

    } catch (error) {
      console.error('Form generation failed:', error);
      throw new ApiError(500, 'Form generation failed', error.message);
    }
  }

  async getAnalysisResults(analysisId, userId) {
    try {
      const results = await analysisModel.findOne({ 
        _id: analysisId, 
        userId: userId 
      }).populate('userId', 'email profile');
      
      if (!results) {
        throw new ApiError(404, 'Analysis results not found');
      }
      
      return results;
    } catch (error) {
      console.error('Failed to retrieve analysis results:', error);
      throw error;
    }
  }

  async deleteAnalysis(analysisId, userId) {
    try {
      const result = await analysisModel.findOneAndDelete({ 
        _id: analysisId, 
        userId: userId 
      });

      if (!result) {
        throw new ApiError(404, 'Analysis not found or access denied');
      }

      return true;

    } catch (error) {
      console.error('Failed to delete analysis:', error);
      throw error;
    }
  }

  async getFormTemplates(filters = {}) {
    try {
      const cacheKey = `templates:${JSON.stringify(filters)}`;
      let templates = await CacheServices.get(cacheKey);

      if (!templates) {
        // Build query based on filters
        const query = {};
        if (filters.industry) query.industry = filters.industry;
        if (filters.useCase) query.useCase = filters.useCase;
        if (filters.complexity) query.complexity = filters.complexity;

        templates = await templateModel.find(query)
          .limit(filters.limit || 20)
          .skip(((filters.page || 1) - 1) * (filters.limit || 20))
          .sort({ performance: -1 });

        // Cache for 1 hour
        await CacheServices.set(cacheKey, templates, 3600);
      }

      return {
        templates,
        total: templates.length,
        page: filters.page || 1,
        limit: filters.limit || 20
      };

    } catch (error) {
      console.error('Failed to retrieve templates:', error);
      throw new ApiError(500, 'Failed to retrieve templates');
    }
  }

  async getBestPractices(filters = {}) {
    try {
      // Use real recommendation engine to get best practices
      return await this.recommendationEngine.findBestPractices(
        filters.formType || 'general',
        filters.industry || 'general',
        filters.useCase || 'general'
      );

    } catch (error) {
      console.error('Failed to retrieve best practices:', error);
      throw new ApiError(500, 'Failed to retrieve best practices');
    }
  }

  async generateOptimizationRoadmap(analysisId, targetGoals, timeframe, userId) {
    try {
      // Get analysis results
      const analysis = await this.getAnalysisResults(analysisId, userId);

      // Generate roadmap
      const roadmap = await this.recommendationEngine.generateOptimizationRoadmap(
        analysis,
        targetGoals,
        timeframe
      );

      // Store roadmap
      await this.storeOptimizationRoadmap(roadmap, analysisId, userId);

      return roadmap;

    } catch (error) {
      console.error('Failed to generate optimization roadmap:', error);
      throw error;
    }
  }

  async checkUserQuota(userId) {
    try {
      const userLimits = await this.getUserLimits(userId);
      
      // Check if user has remaining quota for analysis
      if (userLimits.remaining.analysis === 0) {
        throw new ApiError(429, 'Analysis quota exceeded. Please upgrade your plan.');
      }

      return {
        allowed: true,
        remaining: userLimits.remaining.analysis,
        plan: userLimits.plan
      };

    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Failed to check user quota:', error);
      throw new ApiError(500, 'Failed to check user quota');
    }
  }

  async checkGenerationQuota(userId) {
    try {
      const userLimits = await this.getUserLimits(userId);
      
      // Check if user has remaining quota for generation
      if (userLimits.remaining.generation === 0) {
        throw new ApiError(429, 'Form generation quota exceeded. Please upgrade your plan.');
      }

      return {
        allowed: true,
        remaining: userLimits.remaining.generation,
        plan: userLimits.plan
      };

    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Failed to check generation quota:', error);
      throw new ApiError(500, 'Failed to check generation quota');
    }
  }

  // Private helper methods

  async validateAndSanitizeFiles(files) {
    const sanitizedFiles = [];

    for (const file of files) {
      console.log(`Processing file: ${file.originalname}, size: ${file.size}, mimetype: ${file.mimetype}`);
      
      try {
        // Security validation
        await this.securityService.validateFile(file);
        console.log(`File validation passed: ${file.originalname}`);

        // Sanitize file
        const sanitizedFile = await this.securityService.sanitizeFile(file);
        sanitizedFiles.push(sanitizedFile);
        console.log(`File sanitization completed: ${file.originalname}`);
      } catch (error) {
        console.error(`File validation/sanitization failed for ${file.originalname}:`, error.message);
        throw error;
      }
    }

    return sanitizedFiles;
  }

  async fileToDocument(file, userId) {
    const content = await this.extractFileContent(file);
    
    return {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.originalname,
      content: content,
      type: this.getDocumentType(file.mimetype),
      userId: userId,
      metadata: {
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date().toISOString(),
        processingStatus: 'pending'
      }
    };
  }

  async extractFileContent(file) {
    try {
      // Extract content based on file type
      switch (file.mimetype) {
        case 'application/pdf':
          return await this.extractPDFContent(file);
        case 'image/jpeg':
        case 'image/png':
        case 'image/tiff':
          return await this.extractImageContent(file);
        default:
          return await this.extractTextContent(file);
      }
    } catch (error) {
      console.error('Error extracting file content:', error);
      
      // Return a fallback content instead of throwing error
      // This allows the analysis to continue with basic information
      return `File Content: ${file.originalname} (Size: ${file.size} bytes, Type: ${file.mimetype}) - Content extraction failed: ${error.message}. Analysis will proceed with available metadata.`;
    }
  }

  async extractPDFContent(file) {
    const dataBuffer = file.buffer;
    
    try {
      // Try pdf-parse first
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('pdf-parse failed:', error.message);
      
      // Fallback: Try to extract basic text using regex patterns
      const bufferString = dataBuffer.toString('utf8', 0, Math.min(dataBuffer.length, 10000));
      
      // Look for common text patterns in PDFs
      const textPatterns = [
        /\/Text\s*\[([^\]]+)\]/g,
        /\/Contents\s*\[([^\]]+)\]/g,
        /\(([^)]+)\)/g,
        /\/Font\s+([^\s]+)/g,
        /\/Type\s+\/Page/g
      ];
      
      let extractedText = '';
      for (const pattern of textPatterns) {
        const matches = bufferString.match(pattern);
        if (matches) {
          extractedText += matches.join(' ') + ' ';
        }
      }
      
      if (extractedText.trim()) {
        console.log('Extracted text using regex fallback');
        return extractedText.trim();
      }
      
      // If all methods fail, return a placeholder with file info
      console.warn('All PDF parsing methods failed, returning placeholder content');
      return `PDF Content: ${file.originalname} (Size: ${file.size} bytes, Type: PDF-1.3) - Content extraction failed due to PDF format incompatibility. Please ensure the PDF is not corrupted and try again.`;
    }
  }

  async extractImageContent(file) {
    try {
      const result = await Tesseract.recognize(
        file.buffer,
        'eng',
        { logger: m => console.log(m) }
      );
      return result.data.text;
    } catch (error) {
      console.error('OCR processing failed:', error);
      
      // Fallback: Return image metadata instead of throwing error
      return `Image Content: ${file.originalname} (Size: ${file.size} bytes, Type: ${file.mimetype}) - OCR processing failed: ${error.message}. Analysis will proceed with available metadata.`;
    }
  }

  async extractTextContent(file) {
    // For text-based files, convert buffer to string
    try {
      return file.buffer.toString('utf8');
    } catch (error) {
      console.error('Text extraction failed:', error);
      throw new Error('Failed to extract text content');
    }
  }

  getDocumentType(mimeType) {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
    return 'text';
  }

  buildRecommendationContext(metadata) {
    return {
      industry: metadata.industry || 'General',
      useCase: metadata.purpose || 'Form Processing',
      targetAudience: metadata.targetAudience || 'General Users',
      complianceRequirements: metadata.complianceRequirements || ['GDPR'],
      performanceGoals: {
        targetCompletionRate: 85,
        maxCompletionTime: 10,
        minUserSatisfaction: 8,
        maxErrorRate: 5
      }
    };
  }

  combineExtractionResults(results) {
    const combined = {
      totalFields: 0,
      totalSections: 0,
      averageConfidence: 0,
      fields: [],
      sections: [],
      errors: []
    };

    results.forEach(result => {
      combined.totalFields += result.fields.length;
      combined.totalSections += result.sections.length;
      combined.fields.push(...result.fields);
      combined.sections.push(...result.sections);
      combined.errors.push(...result.metadata.errors);
    });

    if (combined.fields.length > 0) {
      combined.averageConfidence = combined.fields.reduce((sum, field) => sum + field.confidence, 0) / combined.fields.length;
    }

    return combined;
  }

  combineAnalysisResults(results) {
    if (results.length === 1) return results[0];

    // Combine multiple analysis results
    const combined = {
      structure: this.combineStructureAnalysis(results.map(r => r.structure)),
      usabilityAnalysis: this.combineUsabilityAnalysis(results.map(r => r.usabilityAnalysis)),
      performancePrediction: this.combinePerformancePrediction(results.map(r => r.performancePrediction)),
      complianceCheck: this.combineComplianceCheck(results.map(r => r.complianceCheck))
    };

    return combined;
  }

  combineStructureAnalysis(structures) {
    // Simplified combination logic
    return structures[0]; // For now, return first structure
  }

  combineUsabilityAnalysis(analyses) {
    // Simplified combination logic
    return analyses[0]; // For now, return first analysis
  }

  combinePerformancePrediction(predictions) {
    // Simplified combination logic
    return predictions[0]; // For now, return first prediction
  }

  combineComplianceCheck(checks) {
    // Simplified combination logic
    return checks[0]; // For now, return first check
  }

  calculateOverallConfidence(results) {
    if (results.length === 0) return 0;
    
    const totalConfidence = results.reduce((sum, result) => sum + result.confidence, 0);
    return Math.round(totalConfidence / results.length);
  }

  validateGenerationRequest(request) {
    const required = ['purpose', 'targetAudience', 'industry', 'useCase', 'requiredFields'];
    
    for (const field of required) {
      if (!request[field]) {
        throw new ApiError(400, `Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(request.requiredFields) || request.requiredFields.length === 0) {
      throw new ApiError(400, 'At least one required field must be specified');
    }
  }

  async storeAnalysisResults(results) {
    try {
      // Store analysis results in database using the analysis model
      const analysisRecord = new analysisModel({
        userId: results.userId,
        timestamp: results.timestamp,
        processingTime: results.processingTime,
        documents: results.documents,
        extractedData: results.extractedData,
        analysis: results.analysis,
        recommendations: results.recommendations,
        metadata: results.metadata,
        confidence: results.confidence,
        status: 'completed',
        files: results.files || []
      });
      
      await analysisRecord.save();
      console.log(`Analysis results stored with ID: ${analysisRecord._id}`);
      
      return analysisRecord;
    } catch (error) {
      console.error('Failed to store analysis results:', error);
    }
  }

  async storeGeneratedForm(form) {
    try {
      console.log('Storing generated form:', {
        userId: form.userId,
        status: form.status,
        hasStructure: !!form.structure,
        hasImplementation: !!form.implementation
      });
      
      // Store generated form in database using the genForm model
      const generatedFormRecord = new genFormModel({
        userId: form.userId,
        createdAt: form.createdAt,
        processingTime: form.processingTime,
        metadata: form.metadata,
        structure: form.structure,
        configuration: form.configuration,
        implementation: form.implementation,
        validation: form.validation,
        analytics: form.analytics,
        deployment: form.deployment,
        status: form.status || 'completed'
      });
      
      console.log('Generated form record created, attempting to save...');
      await generatedFormRecord.save();
      console.log(`Generated form stored successfully with ID: ${generatedFormRecord._id}`);
      
      return generatedFormRecord;
    } catch (error) {
      console.error('Failed to store generated form:', error);
      console.error('Form data that failed to save:', {
        userId: form.userId,
        status: form.status,
        metadataKeys: form.metadata ? Object.keys(form.metadata) : 'no metadata',
        structureKeys: form.structure ? Object.keys(form.structure) : 'no structure',
        implementationKeys: form.implementation ? Object.keys(form.implementation) : 'no implementation'
      });
      return null;
    }
  }

  async storeOptimizationRoadmap(roadmap, analysisId, userId) {
    try {
      // Store optimization roadmap in database using the optimize model
      const roadmapRecord = new optimizeModel({
        analysisId: analysisId,
        userId: userId,
        phases: roadmap.phases,
        totalDuration: roadmap.totalDuration,
        expectedOutcome: roadmap.expectedOutcome,
        riskAssessment: roadmap.riskAssessment,
        createdAt: new Date()
      });
      
      await roadmapRecord.save();
      console.log(`Optimization roadmap stored with ID: ${roadmapRecord._id}`);
      
      return roadmapRecord;
    } catch (error) {
      console.error('Failed to store optimization roadmap:', error);
    }
  }

  async getUserUsage(userId) {
    try {
      // Find or create user usage record
      let userUsage = await userUsageModel.findOne({ userId });
      
      if (!userUsage) {
        // Create new usage record for user
        userUsage = new userUsageModel({
          userId,
          plan: 'free',
          monthlyLimits: {
            analysis: 5,
            generation: 2,
            ocr: 10
          }
        });
        await userUsage.save();
      }
      
      // Check if we need to reset monthly usage (new month)
      const currentMonth = new Date().toISOString().slice(0, 7);
      if (userUsage.currentMonth !== currentMonth) {
        userUsage.resetMonthlyUsage();
        await userUsage.save();
      }
      
      return {
        analysis: userUsage.analysis,
        generation: userUsage.generation,
        ocr: userUsage.ocr,
        plan: userUsage.plan,
        monthlyLimits: userUsage.monthlyLimits,
        currentMonth: userUsage.currentMonth,
        lastReset: userUsage.lastReset
      };
    } catch (error) {
      console.error('Failed to get user usage:', error);
      return { 
        analysis: 0, 
        generation: 0, 
        ocr: 0,
        plan: 'free',
        monthlyLimits: { analysis: 5, generation: 2, ocr: 10 }
      };
    }
  }

  async getUserLimits(userId) {
    try {
      // Get user usage which includes plan and limits
      const userUsage = await this.getUserUsage(userId);
      
      return {
        plan: userUsage.plan,
        limits: userUsage.monthlyLimits,
        currentUsage: {
          analysis: userUsage.analysis,
          generation: userUsage.generation,
          ocr: userUsage.ocr
        },
        remaining: {
          analysis: userUsage.monthlyLimits.analysis === -1 ? -1 : Math.max(0, userUsage.monthlyLimits.analysis - userUsage.analysis),
          generation: userUsage.monthlyLimits.generation === -1 ? -1 : Math.max(0, userUsage.monthlyLimits.generation - userUsage.generation),
          ocr: userUsage.monthlyLimits.ocr === -1 ? -1 : Math.max(0, userUsage.monthlyLimits.ocr - userUsage.ocr)
        }
      };
    } catch (error) {
      console.error('Failed to get user limits:', error);
      return {
        plan: 'free',
        limits: { analysis: 5, generation: 2, ocr: 10 },
        currentUsage: { analysis: 0, generation: 0, ocr: 0 },
        remaining: { analysis: 5, generation: 2, ocr: 10 }
      };
    }
  }

  async updateUserUsage(userId, type, count = 1) {
    try {
      // Find or create user usage record
      let userUsage = await userUsageModel.findOne({ userId });
      
      if (!userUsage) {
        // Create new usage record for user
        userUsage = new userUsageModel({
          userId,
          plan: 'free',
          monthlyLimits: {
            analysis: 5,
            generation: 2,
            ocr: 10
          }
        });
      }
      
      // Check if we need to reset monthly usage (new month)
      const currentMonth = new Date().toISOString().slice(0, 7);
      if (userUsage.currentMonth !== currentMonth) {
        userUsage.resetMonthlyUsage();
      }
      
      // Check quota before incrementing
      const quota = userUsage.checkQuota(type);
      if (!quota.allowed) {
        throw new Error(`Quota exceeded for ${type}. Limit: ${quota.limit}, Used: ${quota.used}`);
      }
      
      // Increment usage
      userUsage.incrementUsage(type, count);
      await userUsage.save();
      
      return {
        success: true,
        newUsage: {
          analysis: userUsage.analysis,
          generation: userUsage.generation,
          ocr: userUsage.ocr
        },
        remaining: {
          analysis: userUsage.checkQuota('analysis'),
          generation: userUsage.checkQuota('generation'),
          ocr: userUsage.checkQuota('ocr')
        }
      };
    } catch (error) {
      console.error('Failed to update user usage:', error);
      throw error; // Re-throw to handle quota exceeded errors
    }
  }

  async updateUserPlan(userId, newPlan, reason = 'plan_change') {
    try {
      let userUsage = await userUsageModel.findOne({ userId });
      
      if (!userUsage) {
        // Create new usage record for user
        userUsage = new userUsageModel({
          userId,
          plan: newPlan
        });
      } else {
        // Update existing user's plan
        const planChange = userUsage.updatePlan(newPlan, reason);
        console.log(`Plan changed for user ${userId}: ${planChange.oldPlan} -> ${planChange.newPlan}`);
      }
      
      await userUsage.save();
      
      return {
        success: true,
        newPlan: userUsage.plan,
        monthlyLimits: userUsage.monthlyLimits,
        planHistory: userUsage.planHistory
      };
    } catch (error) {
      console.error('Failed to update user plan:', error);
      throw error;
    }
  }

  async getUserUsageHistory(userId, months = 6) {
    try {
      const userUsage = await userUsageModel.findOne({ userId });
      
      if (!userUsage) {
        return [];
      }
      
      // Return recent usage history
      return userUsage.usageHistory
        .sort((a, b) => b.month.localeCompare(a.month))
        .slice(0, months);
    } catch (error) {
      console.error('Failed to get user usage history:', error);
      return [];
    }
  }

  async resetUserUsage(userId) {
    try {
      const userUsage = await userUsageModel.findOne({ userId });
      
      if (!userUsage) {
        throw new Error('User usage record not found');
      }
      
      userUsage.resetMonthlyUsage();
      await userUsage.save();
      
      return {
        success: true,
        message: 'User usage reset successfully',
        newUsage: {
          analysis: userUsage.analysis,
          generation: userUsage.generation,
          ocr: userUsage.ocr
        }
      };
    } catch (error) {
      console.error('Failed to reset user usage:', error);
      throw error;
    }
  }
}

module.exports = { FormAnalysisService };