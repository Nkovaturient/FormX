const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const pdf = require('pdf-parse');
const { SecurityService } = require('./SecurityService');
const { DatabaseService } = require('./DatabaseService');
const { CacheService } = require('./CacheService');
// const { console } = require('../utils/logger');
const ApiError = require('../utils/ApiError');

class OCRService {
  constructor() {
    this.securityService = new SecurityService();
    this.supportedLanguages = [
      { code: 'eng', name: 'English' },
      { code: 'spa', name: 'Spanish' },
      { code: 'fra', name: 'French' },
      { code: 'deu', name: 'German' },
      { code: 'ita', name: 'Italian' },
      { code: 'por', name: 'Portuguese' },
      { code: 'rus', name: 'Russian' },
      { code: 'chi_sim', name: 'Chinese (Simplified)' },
      { code: 'jpn', name: 'Japanese' },
      { code: 'kor', name: 'Korean' }
    ];
  }

  async processDocuments(files, userId, options = {}) {
    try {
      const startTime = Date.now();
      const jobId = `ocr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      console.info(`Starting OCR processing for job ${jobId}, ${files.length} documents`);

      // Validate and sanitize files
      const sanitizedFiles = await this.validateAndSanitizeFiles(files);

      // Create job record
      const job = {
        jobId,
        userId,
        status: 'processing',
        documentsTotal: files.length,
        documentsProcessed: 0,
        startTime: new Date().toISOString(),
        options,
        results: []
      };

      await this.storeJobRecord(job);

      // Process each document
      const results = [];
      for (let i = 0; i < sanitizedFiles.length; i++) {
        const file = sanitizedFiles[i];
        
        try {
          console.info(`Processing document ${i + 1}/${files.length} for job ${jobId}`);
          
          const result = await this.processDocument(file, options);
          results.push(result);

          // Update job progress
          await this.updateJobProgress(jobId, i + 1, results);

        } catch (error) {
          console.error(`Failed to process document ${i + 1} in job ${jobId}:`, error);
          results.push({
            documentIndex: i,
            fileName: file.originalname,
            status: 'error',
            error: error.message,
            extractedData: null
          });
        }
      }

      // Finalize job
      const finalResults = {
        jobId,
        status: 'completed',
        documentsTotal: files.length,
        documentsProcessed: results.length,
        processingTime: Date.now() - startTime,
        extractedData: this.combineExtractionResults(results),
        results
      };

      await this.finalizeJob(jobId, finalResults);

      // Update user usage
      await this.updateUserUsage(userId, 'ocr', files.length);

      return finalResults;

    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new ApiError(500, 'OCR processing failed', error.message);
    }
  }

  async processDocument(file, options = {}) {
    try {
      const startTime = Date.now();
      
      let extractedData;
      
      if (file.mimetype === 'application/pdf') {
        extractedData = await this.processPDF(file, options);
      } else if (file.mimetype.startsWith('image/')) {
        extractedData = await this.processImage(file, options);
      } else {
        throw new ApiError(400, `Unsupported file type: ${file.mimetype}`);
      }

      return {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: 'completed',
        processingTime: Date.now() - startTime,
        extractedData
      };

    } catch (error) {
      console.error(`Document processing failed for ${file.originalname}:`, error);
      throw error;
    }
  }

  async processPDF(file, options = {}) {
    try {
      console.info(`Processing PDF: ${file.originalname}`);

      // Extract text from PDF
      const pdfData = await pdf(file.buffer);
      
      // If PDF has text, use it directly
      if (pdfData.text && pdfData.text.trim().length > 0) {
        return await this.extractFieldsFromText(pdfData.text, options);
      }

      // If PDF is image-based, convert to images and use OCR
      // This would require additional libraries like pdf2pic
      throw new ApiError(400, 'Image-based PDF processing not yet implemented');

    } catch (error) {
      console.error('PDF processing failed:', error);
      throw error;
    }
  }

  async processImage(file, options = {}) {
    try {
      console.info(`Processing image: ${file.originalname}`);

      // Enhance image if requested
      let imageBuffer = file.buffer;
      if (options.enhanceImage) {
        imageBuffer = await this.enhanceImageBuffer(imageBuffer, options);
      }

      // Perform OCR
      const ocrResult = await Tesseract.recognize(
        imageBuffer,
        options.language || 'eng',
        {
          console: (m) => {
            if (m.status === 'recognizing text') {
              console.debug(`OCR progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      // Extract structured data from OCR text
      const extractedData = await this.extractFieldsFromText(ocrResult.data.text, options);

      // Add OCR-specific metadata
      extractedData.ocrConfidence = ocrResult.data.confidence;
      extractedData.ocrText = ocrResult.data.text;
      extractedData.words = ocrResult.data.words;
      extractedData.lines = ocrResult.data.lines;

      return extractedData;

    } catch (error) {
      console.error('Image OCR processing failed:', error);
      throw error;
    }
  }

  async extractFieldsFromText(text, options = {}) {
    try {
      // This would use AI/ML to extract structured fields from text
      // For now, implement basic field detection
      
      const fields = [];
      const lines = text.split('\n').filter(line => line.trim());

      // Basic field detection patterns
      const patterns = {
        email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
        date: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g,
        ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
        zipCode: /\b\d{5}(-\d{4})?\b/g
      };

      let fieldIndex = 0;

      // Extract known field types
      for (const [type, pattern] of Object.entries(patterns)) {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(match => {
            fields.push({
              id: `field-${fieldIndex++}`,
              type,
              value: match,
              confidence: 0.8,
              position: this.findTextPosition(text, match)
            });
          });
        }
      }

      // Extract potential form labels and values
      lines.forEach((line, lineIndex) => {
        // Look for label: value patterns
        const labelValueMatch = line.match(/^([^:]+):\s*(.+)$/);
        if (labelValueMatch) {
          const [, label, value] = labelValueMatch;
          fields.push({
            id: `field-${fieldIndex++}`,
            type: 'text',
            label: label.trim(),
            value: value.trim(),
            confidence: 0.7,
            position: { line: lineIndex, column: 0 }
          });
        }
      });

      return {
        totalFields: fields.length,
        fields,
        extractedText: text,
        confidence: this.calculateAverageConfidence(fields),
        metadata: {
          processingMethod: 'text_extraction',
          linesProcessed: lines.length,
          patternsMatched: Object.keys(patterns).length
        }
      };

    } catch (error) {
      console.error('Field extraction failed:', error);
      throw error;
    }
  }

  async enhanceImage(file, options = {}) {
    try {
      const enhancedBuffer = await this.enhanceImageBuffer(file.buffer, options);
      
      return {
        data: enhancedBuffer.toString('base64'),
        size: enhancedBuffer.length,
        format: 'png',
        quality: 'enhanced'
      };

    } catch (error) {
      console.error('Image enhancement failed:', error);
      throw error;
    }
  }

  async enhanceImageBuffer(buffer, options = {}) {
    try {
      let image = sharp(buffer);

      // Get image metadata
      const metadata = await image.metadata();
      console.info(`Enhancing image: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

      // Apply enhancements
      if (options.denoise !== false) {
        image = image.median(3); // Noise reduction
      }

      if (options.sharpen !== false) {
        image = image.sharpen();
      }

      if (options.contrast && options.contrast !== 1) {
        image = image.modulate({ 
          brightness: options.brightness || 1,
          saturation: 1,
          hue: 0
        });
      }

      if (options.deskew !== false) {
        // Basic deskew - would need more sophisticated algorithm for better results
        image = image.rotate(0); // Placeholder
      }

      // Convert to grayscale for better OCR
      image = image.greyscale();

      // Increase contrast for better text recognition
      image = image.normalize();

      // Resize if image is too small
      if (metadata.width < 1000) {
        image = image.resize(null, 1000, { 
          kernel: sharp.kernel.lanczos3,
          withoutEnlargement: false 
        });
      }

      return await image.png().toBuffer();

    } catch (error) {
      console.error('Image enhancement failed:', error);
      throw error;
    }
  }

  async processBatch(files, userId, batchName, options = {}) {
    try {
      const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const batchJob = {
        batchId,
        userId,
        batchName,
        status: 'queued',
        documentsTotal: files.length,
        documentsProcessed: 0,
        createdAt: new Date().toISOString(),
        options,
        priority: options.priority || 'normal',
        estimatedCompletionTime: this.estimateCompletionTime(files.length, options.priority)
      };

      await this.storeBatchJob(batchJob);

      // Queue batch for processing (in a real implementation, this would use a job queue)
      setImmediate(() => this.processBatchAsync(batchId, files, options));

      return batchJob;

    } catch (error) {
      console.error('Batch processing setup failed:', error);
      throw error;
    }
  }

  async processBatchAsync(batchId, files, options) {
    try {
      console.info(`Starting async batch processing for ${batchId}`);

      await this.updateBatchStatus(batchId, 'processing');

      const results = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          const result = await this.processDocument(file, options);
          results.push(result);
          
          await this.updateBatchProgress(batchId, i + 1, results);
          
        } catch (error) {
          console.error(`Batch document processing failed:`, error);
          results.push({
            fileName: file.originalname,
            status: 'error',
            error: error.message
          });
        }
      }

      await this.finalizeBatch(batchId, results);

    } catch (error) {
      console.error(`Batch processing failed for ${batchId}:`, error);
      await this.updateBatchStatus(batchId, 'failed', error.message);
    }
  }

  async getProcessingStatus(jobId, userId) {
    try {
      const job = await DatabaseService.findOne('ocr_jobs', { jobId, userId });
      return job;
    } catch (error) {
      console.error('Failed to get processing status:', error);
      throw error;
    }
  }

  async getProcessingResults(jobId, userId) {
    try {
      const job = await DatabaseService.findOne('ocr_jobs', { jobId, userId });
      
      if (!job) {
        throw new ApiError(404, 'OCR job not found');
      }

      return job.results || job;
    } catch (error) {
      console.error('Failed to get processing results:', error);
      throw error;
    }
  }

  async getBatchStatus(batchId, userId) {
    try {
      const batch = await DatabaseService.findOne('ocr_batches', { batchId, userId });
      return batch;
    } catch (error) {
      console.error('Failed to get batch status:', error);
      throw error;
    }
  }

  async getSupportedLanguages() {
    return this.supportedLanguages;
  }

  async checkUserQuota(userId, documentCount) {
    try {
      const usage = await this.getUserUsage(userId);
      const limits = await this.getUserLimits(userId);

      if (usage.ocr + documentCount > limits.ocr && limits.ocr !== -1) {
        throw new ApiError(429, 'OCR quota exceeded. Please upgrade your plan.');
      }

      return true;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Failed to check OCR quota:', error);
      throw new ApiError(500, 'Failed to check OCR quota');
    }
  }

  async checkBatchQuota(userId, documentCount) {
    // Additional checks for batch processing
    await this.checkUserQuota(userId, documentCount);

    if (documentCount > 50) {
      throw new ApiError(400, 'Batch size exceeds maximum limit of 50 documents');
    }

    return true;
  }

  // Private helper methods

  async validateAndSanitizeFiles(files) {
    const sanitizedFiles = [];

    for (const file of files) {
      await this.securityService.validateFile(file);
      const sanitizedFile = await this.securityService.sanitizeFile(file);
      sanitizedFiles.push(sanitizedFile);
    }

    return sanitizedFiles;
  }

  findTextPosition(text, searchText) {
    const index = text.indexOf(searchText);
    if (index === -1) return { line: 0, column: 0 };

    const beforeText = text.substring(0, index);
    const lines = beforeText.split('\n');
    
    return {
      line: lines.length - 1,
      column: lines[lines.length - 1].length
    };
  }

  calculateAverageConfidence(fields) {
    if (fields.length === 0) return 0;
    
    const totalConfidence = fields.reduce((sum, field) => sum + (field.confidence || 0), 0);
    return Math.round(totalConfidence / fields.length * 100) / 100;
  }

  combineExtractionResults(results) {
    const combined = {
      totalFields: 0,
      averageConfidence: 0,
      documentsProcessed: results.length,
      documentsSuccessful: results.filter(r => r.status === 'completed').length,
      fields: [],
      errors: []
    };

    results.forEach(result => {
      if (result.extractedData) {
        combined.totalFields += result.extractedData.totalFields || 0;
        if (result.extractedData.fields) {
          combined.fields.push(...result.extractedData.fields);
        }
      }
      
      if (result.status === 'error') {
        combined.errors.push({
          fileName: result.fileName,
          error: result.error
        });
      }
    });

    if (combined.fields.length > 0) {
      combined.averageConfidence = this.calculateAverageConfidence(combined.fields);
    }

    return combined;
  }

  estimateCompletionTime(documentCount, priority = 'normal') {
    const baseTimePerDoc = 30; // seconds
    const priorityMultiplier = {
      low: 1.5,
      normal: 1.0,
      high: 0.7
    };

    const estimatedSeconds = documentCount * baseTimePerDoc * (priorityMultiplier[priority] || 1.0);
    return new Date(Date.now() + estimatedSeconds * 1000).toISOString();
  }

  async storeJobRecord(job) {
    try {
      await DatabaseService.insertOne('ocr_jobs', job);
    } catch (error) {
      console.error('Failed to store job record:', error);
    }
  }

  async updateJobProgress(jobId, processed, results) {
    try {
      await DatabaseService.updateOne(
        'ocr_jobs',
        { jobId },
        { 
          documentsProcessed: processed,
          results: results,
          updatedAt: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Failed to update job progress:', error);
    }
  }

  async finalizeJob(jobId, finalResults) {
    try {
      await DatabaseService.updateOne(
        'ocr_jobs',
        { jobId },
        { 
          ...finalResults,
          completedAt: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Failed to finalize job:', error);
    }
  }

  async storeBatchJob(batch) {
    try {
      await DatabaseService.insertOne('ocr_batches', batch);
    } catch (error) {
      console.error('Failed to store batch job:', error);
    }
  }

  async updateBatchStatus(batchId, status, error = null) {
    try {
      const update = { 
        status,
        updatedAt: new Date().toISOString()
      };
      
      if (error) {
        update.error = error;
      }

      await DatabaseService.updateOne('ocr_batches', { batchId }, update);
    } catch (err) {
      console.error('Failed to update batch status:', err);
    }
  }

  async updateBatchProgress(batchId, processed, results) {
    try {
      await DatabaseService.updateOne(
        'ocr_batches',
        { batchId },
        { 
          documentsProcessed: processed,
          results: results,
          updatedAt: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Failed to update batch progress:', error);
    }
  }

  async finalizeBatch(batchId, results) {
    try {
      await DatabaseService.updateOne(
        'ocr_batches',
        { batchId },
        { 
          status: 'completed',
          results: results,
          completedAt: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Failed to finalize batch:', error);
    }
  }

  async getUserUsage(userId) {
    try {
      const usage = await DatabaseService.findOne('user_usage', { userId });
      return usage || { analysis: 0, generation: 0, ocr: 0 };
    } catch (error) {
      console.error('Failed to get user usage:', error);
      return { analysis: 0, generation: 0, ocr: 0 };
    }
  }

  async getUserLimits(userId) {
    try {
      const user = await DatabaseService.findOne('users', { id: userId });
      const plan = user?.plan || 'free';
      
      const limits = {
        free: { analysis: 5, generation: 2, ocr: 10 },
        personal: { analysis: 50, generation: 20, ocr: 100 },
        pro: { analysis: 200, generation: 100, ocr: 500 },
        enterprise: { analysis: -1, generation: -1, ocr: -1 }
      };

      return limits[plan] || limits.free;
    } catch (error) {
      console.error('Failed to get user limits:', error);
      return { analysis: 5, generation: 2, ocr: 10 };
    }
  }

  async updateUserUsage(userId, type, count = 1) {
    try {
      await DatabaseService.updateOne(
        'user_usage',
        { userId },
        { $inc: { [type]: count } },
        { upsert: true }
      );
    } catch (error) {
      console.error('Failed to update user usage:', error);
    }
  }
}

module.exports = { OCRService };