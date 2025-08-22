const express = require('express');
const { body, param, validationResult } = require('express-validator');
const multer = require('multer');
const { FormAnalysisService } = require('../services/FormAnalysisService');
const { SecurityService } = require('../services/SecurityService');
const { CacheService, CacheServices } = require('../services/CacheService');
// const { logger } = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    console.log('Processing file:', file.originalname, 'with mimetype:', file.mimetype);
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff',
      'text/html',
      'application/json'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid file type. Only PDF, images, HTML, and JSON files are allowed.'));
    }
  }
});

const formAnalysisService = new FormAnalysisService();

/**
 * POST /api/form/analyze
 * Submit form data for AI analysis
 */
router.post('/analyze',
  upload.array('files', 1),
  async (req, res, next) => {
    try {
      console.log('=== Form Analysis Request Debug ===');
      console.log('Request body keys:', Object.keys(req.body));
      console.log('Request files:', req.files ? req.files.length : 'no files');
      console.log('Request headers content-type:', req.headers['content-type']);
      console.log('Request method:', req.method);
      console.log('Request URL:', req.url);
      if (req.files && req.files.length > 0) {
        console.log('First file details:', {
          fieldname: req.files[0].fieldname,
          originalname: req.files[0].originalname,
          mimetype: req.files[0].mimetype,
          size: req.files[0].size
        });
      }
      console.log('=== End Debug ===');

      if (!req.files || req.files.length === 0) {
        throw new ApiError(400, 'No files provided for analysis');
      }

      const userId = req.user.id;
      const files = req.files;
      
      // Parse metadata and options from JSON strings if they exist
      let metadata = {};
      let options = {};
      
      try {
        if (req.body.metadata) {
          metadata = typeof req.body.metadata === 'string' ? JSON.parse(req.body.metadata) : req.body.metadata;
        }
        if (req.body.options) {
          options = typeof req.body.options === 'string' ? JSON.parse(req.body.options) : req.body.options;
        }
      } catch (parseError) {
        console.warn('Failed to parse metadata or options:', parseError);
        // Continue with empty objects if parsing fails
      }

      console.info(`Form analysis requested by user ${userId} for ${files.length} files`);

      // Check rate limits and quotas
      // await formAnalysisService.checkUserQuota(userId);

      // Process files and perform analysis
      const analysisResults = await formAnalysisService.analyzeFormFiles(
        files,
        userId,
        metadata,
        options
      );

      // Cache results for quick retrieval
      const cacheKey = `analysis:${analysisResults.id}`;
      await CacheServices.set(cacheKey, analysisResults, 3600); // Cache for 1 hour

      // Log successful analysis
      console.info(`Form analysis completed for user ${userId}, analysis ID: ${analysisResults.id}`);

      res.status(200).json({
        success: true,
        data: {
          analysisId: analysisResults.id,
          status: 'completed',
          summary: {
            filesProcessed: files.length,
            totalFields: analysisResults.structure?.totalFields || 0,
            confidence: analysisResults.confidence,
            processingTime: analysisResults.processingTime
          },
          results: analysisResults
        },
        message: 'Form analysis completed successfully'
      });

    } catch (error) {
      console.error('Form analysis failed:', error);
      
      // Handle multer errors specifically
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 10MB.'
        });
      }
      
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum is 5 files.'
        });
      }
      
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field. Please use the correct field name.'
        });
      }
      
      next(error);
    }
  }
);

/**
 * GET /api/form/results/:id
 * Retrieve analysis results by ID
 */
router.get('/results/:id',
  [
    param('id').isString().trim().isLength({ min: 1 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Invalid analysis ID');
      }

      const analysisId = req.params.id;
      const userId = req.user.id;

      console.info(`Analysis results requested for ID: ${analysisId} by user: ${userId}`);

      // Try to get from cache first
      const cacheKey = `analysis:${analysisId}`;
      let results = await CacheServices.get(cacheKey);

      if (!results) {
        // Get from database if not in cache
        results = await formAnalysisService.getAnalysisResults(analysisId, userId);
        
        if (results) {
          // Cache for future requests
          await CacheServices.set(cacheKey, results, 3600);
        }
      }

      if (!results) {
        throw new ApiError(404, 'Analysis results not found');
      }

      // Verify user has access to these results
      if (results.userId !== userId) {
        throw new ApiError(403, 'Access denied to analysis results');
      }

      res.status(200).json({
        success: true,
        data: results,
        message: 'Analysis results retrieved successfully'
      });

    } catch (error) {
      console.error('Failed to retrieve analysis results:', error);
      next(error);
    }
  }
);

/**
 * POST /api/form/generate
 * Generate optimized form based on requirements
 */
router.post('/generate',
  [
    body('purpose').isString().trim().isLength({ min: 1, max: 200 }),
    body('targetAudience').isString().trim().isLength({ min: 1, max: 100 }),
    body('industry').isString().trim().isLength({ min: 1, max: 50 }),
    body('useCase').isString().trim().isLength({ min: 1, max: 100 }),
    body('requiredFields').isArray().isLength({ min: 1, max: 50 }),
    body('optionalFields').optional().isArray().isLength({ max: 30 }),
    body('complianceRequirements').optional().isArray(),
    body('designPreferences').optional().isObject(),
    body('performanceTargets').optional().isObject(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
      }

      const userId = req.user.id;
      const generationRequest = req.body;

      console.info(`Form generation requested by user ${userId} for: ${generationRequest.purpose}`);

      // Check user quota for form generation
      // await formAnalysisService.checkGenerationQuota(userId);

      // Generate optimized form
      const generatedForm = await formAnalysisService.generateOptimizedForm(
        generationRequest,
        userId
      );

      // Cache generated form
      const cacheKey = `generated:${generatedForm.id}`;
      await CacheServices.set(cacheKey, generatedForm, 7200); // Cache for 2 hours

      console.info(`Form generation completed for user ${userId}, form ID: ${generatedForm.id}`);

      res.status(201).json({
        success: true,
        data: {
          formId: generatedForm.id,
          status: 'generated',
          deploymentUrl: generatedForm.implementation?.deployment?.url,
          embedCode: generatedForm.implementation?.deployment?.embedCode,
          form: generatedForm
        },
        message: 'Form generated successfully'
      });

    } catch (error) {
      console.error('Form generation failed:', error);
      next(error);
    }
  }
);

/**
 * GET /api/form/templates
 * Get available form templates
 */
router.get('/templates',
  async (req, res, next) => {
    try {
      const { industry, useCase, page = 1, limit = 20 } = req.query;
      
      const templates = await formAnalysisService.getFormTemplates({
        industry,
        useCase,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.status(200).json({
        success: true,
        data: templates,
        message: 'Templates retrieved successfully'
      });

    } catch (error) {
      console.error('Failed to retrieve templates:', error);
      next(error);
    }
  }
);

/**
 * GET /api/form/best-practices
 * Get best practices for form optimization
 */
router.get('/best-practices',
  async (req, res, next) => {
    try {
      const { industry, formType, useCase } = req.query;
      
      const bestPractices = await formAnalysisService.getBestPractices({
        industry,
        formType,
        useCase
      });

      res.status(200).json({
        success: true,
        data: bestPractices,
        message: 'Best practices retrieved successfully'
      });

    } catch (error) {
      console.error('Failed to retrieve best practices:', error);
      next(error);
    }
  }
);

/**
 * POST /api/form/optimize
 * Generate optimization roadmap for existing form
 */
router.post('/optimize',
  [
    body('analysisId').isString().trim(),
    body('targetGoals').isObject(),
    body('timeframe').optional().isString().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
      }

      const userId = req.user.id;
      const { analysisId, targetGoals, timeframe = '3 months' } = req.body;

      console.info(`Optimization roadmap requested by user ${userId} for analysis: ${analysisId}`);

      const roadmap = await formAnalysisService.generateOptimizationRoadmap(
        analysisId,
        targetGoals,
        timeframe,
        userId
      );

      res.status(200).json({
        success: true,
        data: roadmap,
        message: 'Optimization roadmap generated successfully'
      });

    } catch (error) {
      console.error('Failed to generate optimization roadmap:', error);
      next(error);
    }
  }
);

/**
 * DELETE /api/form/analysis/:id
 * Delete analysis results
 */
router.delete('/analysis/:id',
  [
    param('id').isString().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Invalid analysis ID');
      }

      const analysisId = req.params.id;
      const userId = req.user.id;

      await formAnalysisService.deleteAnalysis(analysisId, userId);

      // Remove from cache
      const cacheKey = `analysis:${analysisId}`;
      await CacheServices.delete(cacheKey);

      console.info(`Analysis ${analysisId} deleted by user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Analysis deleted successfully'
      });

    } catch (error) {
      console.error('Failed to delete analysis:', error);
      next(error);
    }
  }
);

module.exports = router;