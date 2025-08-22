const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const { console } = require('../utils/console');
const ApiError = require('../utils/ApiError');

class SecurityService {
  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
    this.jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret';
    this.algorithm = 'aes-256-gcm';
    
    // File type validation
    this.allowedMimeTypes = new Set([
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
      'image/bmp',
      'image/webp',
      'text/html',
      'application/json',
      'text/plain'
    ]);

    // Malicious file signatures
    this.maliciousSignatures = [
      Buffer.from([0x4D, 0x5A]), // PE executable
      Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF executable
      Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]), // Mach-O executable
      Buffer.from([0x50, 0x4B, 0x03, 0x04]), // ZIP (could contain malicious files)
    ];
  }

  // File Security Methods

  async validateFile(file) {
    try {
      // Check file size
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        throw new ApiError(400, 'File size exceeds maximum limit of 50MB');
      }

      // Check MIME type
      if (!this.allowedMimeTypes.has(file.mimetype)) {
        throw new ApiError(400, `File type ${file.mimetype} is not allowed`);
      }

      // Check file signature
      await this.validateFileSignature(file);

      // Scan for malicious content
      await this.scanForMaliciousContent(file);

      return true;

    } catch (error) {
      console.error('File validation failed:', error);
      throw error;
    }
  }

  async validateFileSignature(file) {
    const buffer = file.buffer;
    const signature = buffer.slice(0, 16); // Get more bytes for better debugging

    console.log(`Validating file: ${file.originalname}, mimetype: ${file.mimetype}`);
    console.log(`File size: ${file.size} bytes`);
    console.log(`Signature (hex): ${signature.toString('hex')}`);
    console.log(`Signature (ascii): ${signature.toString('ascii')}`);

    // Check for malicious signatures
    for (const maliciousSignature of this.maliciousSignatures) {
      if (signature.includes(maliciousSignature)) {
        throw new ApiError(400, 'File contains potentially malicious content');
      }
    }

    // Validate specific file type signatures
    switch (file.mimetype) {
      case 'application/pdf':
        // PDF files start with %PDF (25 50 44 46 in hex)
        // Check for various PDF signatures
        const pdfSignatures = [
          Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
          Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D]), // %PDF-
          Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E]), // %PDF-1.
          Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x30]), // %PDF-1.0
          Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x31]), // %PDF-1.1
          Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x32]), // %PDF-1.2
          Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x33]), // %PDF-1.3
          Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]), // %PDF-1.4
          Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x35]), // %PDF-1.5
          Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x36]), // %PDF-1.6
          Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x37]), // %PDF-1.7
        ];
        
        // Check if signature matches any of the valid PDF signatures
        const isValidPdf = pdfSignatures.some(sig => {
          return signature.slice(0, sig.length).equals(sig);
        });
        
        if (!isValidPdf) {
          console.log('PDF signature validation failed. Expected signatures:', pdfSignatures.map(sig => sig.toString('hex')).join(', '));
          console.log('Actual signature:', signature.slice(0, 16).toString('hex'));
          
          // Additional check: try to find %PDF anywhere in the first 1024 bytes
          const firstKB = buffer.slice(0, 1024);
          const pdfPattern = Buffer.from('%PDF');
          const pdfIndex = firstKB.indexOf(pdfPattern);
          
          if (pdfIndex !== -1) {
            console.log(`Found %PDF at position ${pdfIndex}, accepting file as valid PDF`);
            break; // Accept the file
          }
          
          throw new ApiError(400, 'Invalid PDF file signature');
        }
        break;
      
      case 'image/jpeg':
      case 'image/jpg':
        if (signature[0] !== 0xFF || signature[1] !== 0xD8) {
          throw new ApiError(400, 'Invalid JPEG file signature');
        }
        break;
      
      case 'image/png':
        const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
        if (!signature.equals(pngSignature)) {
          throw new ApiError(400, 'Invalid PNG file signature');
        }
        break;
    }

    return true;
  }

  async scanForMaliciousContent(file) {
    // Only scan text-based files for malicious content
    if (file.mimetype === 'application/pdf' || 
        file.mimetype.startsWith('image/')) {
      // Skip malicious content scanning for binary files
      return true;
    }

    try {
      const content = file.buffer.toString('utf8', 0, Math.min(file.size, 1024));
      
      // Check for suspicious patterns
      const suspiciousPatterns = [
        /<script[^>]*>.*<\/script>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /onload\s*=/gi,
        /onerror\s*=/gi,
        /eval\s*\(/gi,
        /document\.write/gi,
        /window\.location/gi
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(content)) {
          throw new ApiError(400, 'File contains potentially malicious script content');
        }
      }
    } catch (error) {
      // If UTF-8 conversion fails, skip malicious content scanning
      console.warn('Could not scan file for malicious content:', error.message);
    }

    return true;
  }

  async sanitizeFile(file) {
    try {
      // Create sanitized copy
      const sanitizedFile = {
        ...file,
        originalname: this.sanitizeFileName(file.originalname),
        buffer: await this.sanitizeFileContent(file.buffer, file.mimetype)
      };

      return sanitizedFile;

    } catch (error) {
      console.error('File sanitization failed:', error);
      throw new ApiError(500, 'File sanitization failed');
    }
  }

  sanitizeFileName(filename) {
    // Remove potentially dangerous characters
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }

  async sanitizeFileContent(buffer, mimeType) {
    // For now, return buffer as-is
    // In production, this would implement content sanitization
    // based on file type (e.g., remove metadata from images)
    return buffer;
  }

  // Data Encryption Methods

  encrypt(text) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
      cipher.setAAD(Buffer.from('FormFast'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };

    } catch (error) {
      console.error('Encryption failed:', error);
      throw new ApiError(500, 'Data encryption failed');
    }
  }

  decrypt(encryptedData) {
    try {
      const { encrypted, iv, authTag } = encryptedData;
      
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      decipher.setAAD(Buffer.from('FormFast'));
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;

    } catch (error) {
      console.error('Decryption failed:', error);
      throw new ApiError(500, 'Data decryption failed');
    }
  }

  // Password Security Methods

  async hashPassword(password) {
    try {
      const saltRounds = 12;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      console.error('Password hashing failed:', error);
      throw new ApiError(500, 'Password hashing failed');
    }
  }

  async verifyPassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Password verification failed:', error);
      throw new ApiError(500, 'Password verification failed');
    }
  }

  // JWT Token Methods

  generateToken(payload, expiresIn = '24h') {
    try {
      return jwt.sign(payload, this.jwtSecret, { 
        expiresIn,
        issuer: 'FormFast',
        audience: 'FormFast-Users'
      });
    } catch (error) {
      console.error('Token generation failed:', error);
      throw new ApiError(500, 'Token generation failed');
    }
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: 'FormFast',
        audience: 'FormFast-Users'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new ApiError(401, 'Invalid token');
      }
      
      console.error('Token verification failed:', error);
      throw new ApiError(401, 'Token verification failed');
    }
  }

  // Data Sanitization Methods

  sanitizeInput(input) {
    if (typeof input === 'string') {
      return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .substring(0, 1000); // Limit length
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeInput(key)] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  // Rate Limiting Helpers

  generateRateLimitKey(ip, endpoint) {
    return `rate_limit:${ip}:${endpoint}`;
  }

  // Security Headers

  getSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
  }

  // Audit Logging

  async logSecurityEvent(event, userId, details = {}) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        userId,
        details,
        ip: details.ip,
        userAgent: details.userAgent
      };

      console.warn('Security Event:', logEntry);
      
      // In production, this would also store to a security audit database
      
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Data Anonymization

  anonymizeData(data, fields = []) {
    const anonymized = { ...data };
    
    const defaultFields = ['email', 'phone', 'ssn', 'address'];
    const fieldsToAnonymize = fields.length > 0 ? fields : defaultFields;
    
    fieldsToAnonymize.forEach(field => {
      if (anonymized[field]) {
        anonymized[field] = this.anonymizeField(anonymized[field], field);
      }
    });
    
    return anonymized;
  }

  anonymizeField(value, fieldType) {
    switch (fieldType) {
      case 'email':
        const [local, domain] = value.split('@');
        return `${local.substring(0, 2)}***@${domain}`;
      
      case 'phone':
        return value.replace(/\d(?=\d{4})/g, '*');
      
      case 'ssn':
        return value.replace(/\d(?=\d{4})/g, '*');
      
      case 'address':
        return value.replace(/\d+/g, '***');
      
      default:
        return '***';
    }
  }

  // Compliance Helpers

  checkGDPRCompliance(data) {
    const issues = [];
    
    // Check for explicit consent
    if (!data.consent || !data.consent.gdpr) {
      issues.push('Missing GDPR consent');
    }
    
    // Check for data minimization
    if (data.fields && data.fields.length > 20) {
      issues.push('Potential data minimization violation - too many fields');
    }
    
    // Check for retention policy
    if (!data.retentionPolicy) {
      issues.push('Missing data retention policy');
    }
    
    return {
      compliant: issues.length === 0,
      issues
    };
  }

  checkHIPAACompliance(data) {
    const issues = [];
    
    // Check for PHI encryption
    if (data.containsPHI && !data.encrypted) {
      issues.push('PHI must be encrypted');
    }
    
    // Check for access controls
    if (!data.accessControls) {
      issues.push('Missing access controls for PHI');
    }
    
    // Check for audit logging
    if (!data.auditLogging) {
      issues.push('Missing audit logging for PHI access');
    }
    
    return {
      compliant: issues.length === 0,
      issues
    };
  }

  checkFERPACompliance(data) {
    const issues = [];
    
    // Check for educational record protection
    if (data.containsEducationalRecords && !data.parentalConsent) {
      issues.push('Missing parental consent for educational records');
    }
    
    // Check for directory information handling
    if (data.directoryInformation && !data.optOutProvision) {
      issues.push('Missing opt-out provision for directory information');
    }
    
    return {
      compliant: issues.length === 0,
      issues
    };
  }
}

module.exports = { SecurityService };