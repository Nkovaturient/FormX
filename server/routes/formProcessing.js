const express = require('express');
const { body, param, validationResult } = require('express-validator');
const multer = require('multer');
const { FormProcessingService } = require('../services/FormProcessingService');
const { SecurityService } = require('../services/SecurityService');
const { CacheService, CacheServices } = require('../services/CacheService');
const formProcessingModel = require('../models/formProcessingModel');
const ApiError = require('../utils/ApiError');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Single form file
  },
  fileFilter: (req, file, cb) => {
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

const formProcessingService = new FormProcessingService();

/**
 * POST /api/form-processing/start
 * Start the complete form processing workflow
 */
router.post('/start',
  upload.single('form'),
  [
    body('options.preferences.outputFormat').optional().isIn(['PDF', 'DOCX', 'HTML']),
    body('options.preferences.includePreview').optional().isBoolean(),
    body('options.preferences.autoDownload').optional().isBoolean(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
      }

      if (!req.file) {
        throw new ApiError(400, 'No form file provided');
      }

      const userId = req.user.id;
      const options = req.body.options || {};

      console.info(`Form processing started by user ${userId} for file: ${req.file.originalname}`);

      // Start the complete form processing workflow
      const result = await formProcessingService.processFormComplete(
        req.file,
        userId,
        options
      );

      // Cache the processing record
      const cacheKey = `processing:${result.processingId}`;
      await CacheServices.set(cacheKey, result, 3600); // Cache for 1 hour

      res.status(200).json({
        success: true,
        data: result,
        message: 'Form processing started successfully'
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/form-processing/:processingId/submit-data
 * Submit user data and documents for form filling
 */
router.post('/:processingId/submit-data',
  upload.array('documents', 10),
  [
    param('processingId').isMongoId().withMessage('Invalid processing ID'),
    body('personalInfo.firstName').isString().trim().isLength({ min: 1 }),
    body('personalInfo.lastName').isString().trim().isLength({ min: 1 }),
    body('personalInfo.dateOfBirth').isISO8601().toDate(),
    body('contactInfo.email').isEmail().normalizeEmail(),
    body('contactInfo.phone').optional().isString(),
    body('contactInfo.address.street').optional().isString(),
    body('contactInfo.address.city').optional().isString(),
    body('contactInfo.address.state').optional().isString(),
    body('contactInfo.address.zipCode').optional().isString(),
    body('contactInfo.address.country').optional().isString(),
    body('professionalInfo.occupation').optional().isString(),
    body('professionalInfo.employer').optional().isString(),
  ],
  async (req, res, next) => {
    try {
      // const errors = validationResult(req);
      // if (!errors.isEmpty()) {
      //   throw new ApiError(400, 'Validation failed', errors.array());
      // }

      const userId = req.user.id;
      const processingId = req.params.processingId;
      const documents = req.files || [];

      console.log('Received form data:', {
        body: req.body,
        files: documents.map(doc => ({ name: doc.originalname, size: doc.size }))
      });

      // Parse the form data properly
      const userData = {
        personalInfo: {},
        contactInfo: {},
        professionalInfo: {},
        documents: documents.map(doc => ({
          type: req.body[`documentTypes[${doc.fieldname}]`] || 'other',
          name: doc.originalname || 'Document',
          file: doc
        }))
      };

      // Parse personal info
      if (req.body.personalInfo) {
        try {
          userData.personalInfo = JSON.parse(req.body.personalInfo);
        } catch (e) {
          console.error('Failed to parse personalInfo:', e);
          userData.personalInfo = {};
        }
      }

      // Parse contact info
      if (req.body.contactInfo) {
        try {
          userData.contactInfo = JSON.parse(req.body.contactInfo);
        } catch (e) {
          console.error('Failed to parse contactInfo:', e);
          userData.contactInfo = {};
        }
      }

      // Parse professional info
      if (req.body.professionalInfo) {
        try {
          userData.professionalInfo = JSON.parse(req.body.professionalInfo);
        } catch (e) {
          console.error('Failed to parse professionalInfo:', e);
          userData.professionalInfo = {};
        }
      }

      // Parse dynamic fields if present
      const dynamicFields = {};
      for (const key in req.body) {
        if (key.startsWith('dynamicFields[') && key.endsWith(']')) {
          const fieldName = key.slice(13, -1); // Remove 'dynamicFields[' and ']'
          try {
            dynamicFields[fieldName] = JSON.parse(req.body[key]);
          } catch (e) {
            dynamicFields[fieldName] = req.body[key];
          }
        }
      }
      
      if (Object.keys(dynamicFields).length > 0) {
        userData.dynamicFields = dynamicFields;
        console.log('Parsed dynamic fields:', dynamicFields);
      }

      console.log('Processed userData:', userData);

      console.info(`User data submitted for processing ${processingId} by user ${userId}`);

      // Process user data and complete form filling
      const result = await formProcessingService.submitUserData(
        processingId,
        userData,
        documents,
        userId
      );

      res.status(200).json({
        success: true,
        data: result,
        message: result.status === 'completed' 
          ? 'Form filled successfully' 
          : 'Data submitted for verification'
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/form-processing/:processingId/status
 * Get processing status and progress
 */
router.get('/:processingId/status',
  [
    param('processingId').isMongoId().withMessage('Invalid processing ID')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
      }

      const userId = req.headers.user;
      const processingId = req.params.processingId;

      // Get processing status
      const status = await formProcessingService.getProcessingStatus(processingId, userId);

      res.status(200).json({
        success: true,
        data: status,
        message: 'Processing status retrieved successfully'
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/form-processing/:processingId/result
 * Get final processing result and download links
 */
router.get('/:processingId/result',
  [
    param('processingId').isMongoId().withMessage('Invalid processing ID')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
      }

      const userId = req.headers.user;
      const processingId = req.params.processingId;

      // Get processing record
      const processingRecord = await formProcessingModel.findOne({
        _id: processingId,
        userId: userId
      });

      if (!processingRecord) {
        throw new ApiError(404, 'Processing record not found');
      }

      if (processingRecord.workflow.status !== 'completed') {
        throw new ApiError(400, 'Processing not completed yet');
      }

      res.status(200).json({
        success: true,
        data: {
          processingId: processingRecord._id,
          status: processingRecord.workflow.status,
          result: processingRecord.output,
          metadata: {
            originalForm: processingRecord.originalForm.fileName,
            processingTime: processingRecord.processingTime,
            qualityScore: processingRecord.filling.qualityScore
          }
        },
        message: 'Processing result retrieved successfully'
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/form-processing/history
 * Get user's processing history
 */
router.get('/history',
  [
    body('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
      }

      const userId = req.headers.user;
      const limit = parseInt(req.query.limit) || 10;

      // Get processing history
      const history = await formProcessingService.getUserProcessingHistory(userId, limit);

      res.status(200).json({
        success: true,
        data: history,
        message: 'Processing history retrieved successfully'
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/form-processing/download/:filename
 * Download filled form file
 */
router.get('/download/:filename',
  async (req, res, next) => {
    try {
      const userId = req.headers.user;
      const filename = req.params.filename;

      // Security check - ensure user can only download their own files
      const processingRecord = await formProcessingModel.findOne({
        userId: userId,
        'output.downloadUrl': `/api/form-processing/download/${filename}`
      });

      if (!processingRecord) {
        throw new ApiError(404, 'File not found or access denied');
      }

      const filePath = path.join(__dirname, '../uploads/filled-forms', filename);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        throw new ApiError(404, 'File not found');
      }

      // Set headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/octet-stream');

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/form-processing/preview/:filename
 * Preview filled form file
 */
router.get('/preview/:filename',
  async (req, res, next) => {
    try {
      const userId = req.headers.user;
      const filename = req.params.filename;

      // Security check - ensure user can only preview their own files
      const processingRecord = await formProcessingModel.findOne({
        userId: userId,
        'output.previewUrl': `/api/form-processing/preview/${filename}`
      });

      if (!processingRecord) {
        throw new ApiError(404, 'File not found or access denied');
      }

      const filePath = path.join(__dirname, '../uploads/filled-forms', filename);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        throw new ApiError(404, 'File not found');
      }

      // Set appropriate content type for preview
      const ext = path.extname(filename).toLowerCase();
      const contentType = {
        '.pdf': 'application/pdf',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.html': 'text/html'
      }[ext] || 'application/octet-stream';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/form-processing/:processingId
 * Cancel or delete processing record
 */
router.delete('/:processingId',
  [
    param('processingId').isMongoId().withMessage('Invalid processing ID')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
      }

      const userId = req.headers.user;
      const processingId = req.params.processingId;

      // Delete processing record
      const result = await formProcessingModel.findOneAndDelete({
        _id: processingId,
        userId: userId
      });

      if (!result) {
        throw new ApiError(404, 'Processing record not found or access denied');
      }

      // Clean up cached data
      const cacheKey = `processing:${processingId}`;
      await CacheServices.del(cacheKey);

      res.status(200).json({
        success: true,
        message: 'Processing record deleted successfully'
      });

    } catch (error) {
      next(error);
    }
  }
);

module.exports = router; 