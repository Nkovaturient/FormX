const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const { OCRService } = require('../services/OCRService');
const { SecurityService } = require('../services/SecurityService');
// const { console } = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const router = express.Router();

// Configure multer for OCR file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit for OCR
    files: 10 // Maximum 10 files for batch processing
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
      'image/bmp',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid file type for OCR. Only PDF and image files are supported.'));
    }
  }
});

const ocrService = new OCRService();

/**
 * POST /api/ocr/extract
 * Process document images using OCR
 */
router.post('/extract',
  upload.array('documents', 10),
  [
    body('options.language').optional().isString().trim(),
    body('options.enhanceImage').optional().isBoolean(),
    body('options.detectTables').optional().isBoolean(),
    body('options.extractSignatures').optional().isBoolean(),
    body('options.confidenceThreshold').optional().isFloat({ min: 0, max: 1 }),
    body('metadata.documentType').optional().isString().trim(),
    body('metadata.expectedFields').optional().isArray(),
  ],
  async (req, res, next) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
      }

      if (!req.files || req.files.length === 0) {
        throw new ApiError(400, 'No documents provided for OCR processing');
      }

      const userId = req.user.id;
      const files = req.files;
      const options = req.body.options || {};
      const metadata = req.body.metadata || {};

      console.info(`OCR processing requested by user ${userId} for ${files.length} documents`);

      // Check user quota for OCR processing
      await ocrService.checkUserQuota(userId, files.length);

      // Process documents with OCR
      const ocrResults = await ocrService.processDocuments(
        files,
        userId,
        {
          language: options.language || 'eng',
          enhanceImage: options.enhanceImage !== false,
          detectTables: options.detectTables === true,
          extractSignatures: options.extractSignatures === true,
          confidenceThreshold: options.confidenceThreshold || 0.7,
          ...metadata
        }
      );

      console.info(`OCR processing completed for user ${userId}, job ID: ${ocrResults.jobId}`);

      res.status(200).json({
        success: true,
        data: {
          jobId: ocrResults.jobId,
          status: ocrResults.status,
          documentsProcessed: files.length,
          totalFields: ocrResults.extractedData?.totalFields || 0,
          averageConfidence: ocrResults.extractedData?.averageConfidence || 0,
          processingTime: ocrResults.processingTime,
          results: ocrResults.extractedData
        },
        message: 'OCR processing completed successfully'
      });

    } catch (error) {
      console.error('OCR processing failed:', error);
      next(error);
    }
  }
);

/**
 * GET /api/ocr/status/:jobId
 * Get OCR processing status
 */
router.get('/status/:jobId',
  async (req, res, next) => {
    try {
      const jobId = req.params.jobId;
      const userId = req.user.id;

      if (!jobId) {
        throw new ApiError(400, 'Job ID is required');
      }

      console.info(`OCR status requested for job ${jobId} by user ${userId}`);

      const status = await ocrService.getProcessingStatus(jobId, userId);

      if (!status) {
        throw new ApiError(404, 'OCR job not found');
      }

      res.status(200).json({
        success: true,
        data: status,
        message: 'OCR status retrieved successfully'
      });

    } catch (error) {
      console.error('Failed to retrieve OCR status:', error);
      next(error);
    }
  }
);

/**
 * GET /api/ocr/results/:jobId
 * Get OCR processing results
 */
router.get('/results/:jobId',
  async (req, res, next) => {
    try {
      const jobId = req.params.jobId;
      const userId = req.user.id;

      if (!jobId) {
        throw new ApiError(400, 'Job ID is required');
      }

      console.info(`OCR results requested for job ${jobId} by user ${userId}`);

      const results = await ocrService.getProcessingResults(jobId, userId);

      if (!results) {
        throw new ApiError(404, 'OCR results not found');
      }

      res.status(200).json({
        success: true,
        data: results,
        message: 'OCR results retrieved successfully'
      });

    } catch (error) {
      console.error('Failed to retrieve OCR results:', error);
      next(error);
    }
  }
);

/**
 * POST /api/ocr/batch
 * Process multiple documents in batch
 */
router.post('/batch',
  upload.array('documents', 50),
  [
    body('batchName').isString().trim().isLength({ min: 1, max: 100 }),
    body('options.language').optional().isString().trim(),
    body('options.priority').optional().isIn(['low', 'normal', 'high']),
    body('options.notifyOnComplete').optional().isBoolean(),
    body('options.webhookUrl').optional().isURL(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
      }

      if (!req.files || req.files.length === 0) {
        throw new ApiError(400, 'No documents provided for batch processing');
      }

      const userId = req.user.id;
      const files = req.files;
      const { batchName, options = {} } = req.body;

      console.info(`Batch OCR processing requested by user ${userId} for ${files.length} documents`);

      // Check batch processing quota
      await ocrService.checkBatchQuota(userId, files.length);

      // Start batch processing
      const batchJob = await ocrService.processBatch(
        files,
        userId,
        batchName,
        options
      );

      console.info(`Batch OCR processing started for user ${userId}, batch ID: ${batchJob.batchId}`);

      res.status(202).json({
        success: true,
        data: {
          batchId: batchJob.batchId,
          status: 'processing',
          documentsQueued: files.length,
          estimatedCompletionTime: batchJob.estimatedCompletionTime,
          priority: options.priority || 'normal'
        },
        message: 'Batch OCR processing started successfully'
      });

    } catch (error) {
      console.error('Batch OCR processing failed:', error);
      next(error);
    }
  }
);

/**
 * GET /api/ocr/batch/:batchId
 * Get batch processing status and results
 */
router.get('/batch/:batchId',
  async (req, res, next) => {
    try {
      const batchId = req.params.batchId;
      const userId = req.user.id;

      if (!batchId) {
        throw new ApiError(400, 'Batch ID is required');
      }

      const batchStatus = await ocrService.getBatchStatus(batchId, userId);

      if (!batchStatus) {
        throw new ApiError(404, 'Batch not found');
      }

      res.status(200).json({
        success: true,
        data: batchStatus,
        message: 'Batch status retrieved successfully'
      });

    } catch (error) {
      console.error('Failed to retrieve batch status:', error);
      next(error);
    }
  }
);

/**
 * POST /api/ocr/enhance
 * Enhance image quality before OCR processing
 */
router.post('/enhance',
  upload.single('image'),
  [
    body('options.denoise').optional().isBoolean(),
    body('options.sharpen').optional().isBoolean(),
    body('options.contrast').optional().isFloat({ min: 0, max: 2 }),
    body('options.brightness').optional().isFloat({ min: 0, max: 2 }),
    body('options.deskew').optional().isBoolean(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
      }

      if (!req.file) {
        throw new ApiError(400, 'No image provided for enhancement');
      }

      const userId = req.user.id;
      const imageFile = req.file;
      const options = req.body.options || {};

      console.info(`Image enhancement requested by user ${userId}`);

      const enhancedImage = await ocrService.enhanceImage(imageFile, options);

      res.status(200).json({
        success: true,
        data: {
          originalSize: imageFile.size,
          enhancedSize: enhancedImage.size,
          format: enhancedImage.format,
          quality: enhancedImage.quality,
          enhancedImage: enhancedImage.data // Base64 encoded
        },
        message: 'Image enhanced successfully'
      });

    } catch (error) {
      console.error('Image enhancement failed:', error);
      next(error);
    }
  }
);

/**
 * GET /api/ocr/supported-languages
 * Get list of supported OCR languages
 */
router.get('/supported-languages',
  async (req, res, next) => {
    try {
      const languages = await ocrService.getSupportedLanguages();

      res.status(200).json({
        success: true,
        data: languages,
        message: 'Supported languages retrieved successfully'
      });

    } catch (error) {
      console.error('Failed to retrieve supported languages:', error);
      next(error);
    }
  }
);

module.exports = router;