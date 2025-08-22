const express = require('express');
const { body, validationResult } = require('express-validator');
const userDataModel = require('../models/userDataModel');
const { SecurityService } = require('../services/SecurityService');
const ApiError = require('../utils/ApiError');

const router = express.Router();
const securityService = new SecurityService();

function pickNonSensitive(userDataDoc) {
  if (!userDataDoc) return null;
  const obj = userDataDoc.toObject({ versionKey: false });
  // Exclude sensitive store
  delete obj.sensitive;
  delete obj.encryptionKey;
  delete obj.dataHash;
  return obj;
}

function applySensitiveEncryption(doc, payload) {
  // Define which fields to treat as sensitive. Extend as needed.
  const sensitivePayload = payload.sensitive || {};
  // Encrypt each string value
  const encrypted = {};
  for (const [key, value] of Object.entries(sensitivePayload)) {
    if (typeof value === 'string' && value.trim() !== '') {
      encrypted[key] = securityService.encrypt(value);
    }
  }
  if (Object.keys(encrypted).length > 0) {
    doc.sensitive = { ...doc.sensitive, ...encrypted };
  }
}

function decryptSensitive(sensitive) {
  const result = {};
  if (!sensitive) return result;
  for (const [key, encryptedVal] of Object.entries(sensitive)) {
    try {
      result[key] = securityService.decrypt(encryptedVal);
    } catch (e) {
      result[key] = null;
    }
  }
  return result;
}

// GET /api/user-data -> returns non-sensitive data and flags for presence of sensitive
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const existing = await userDataModel.findOne({ userId });

    if (!existing) {
      return res.status(200).json({ success: true, data: null });
    }

    const nonSensitive = pickNonSensitive(existing);
    const sensitivePresence = existing.sensitive ? Object.keys(existing.sensitive).length : 0;

    res.status(200).json({
      success: true,
      data: {
        ...nonSensitive,
        sensitiveMeta: { count: sensitivePresence }
      }
    });
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to fetch user data', error.message));
  }
});

// PUT /api/user-data -> upsert user profile (non-sensitive + optional sensitive bag)
router.put('/',
  [
    body('personalInfo.email').optional().isEmail().withMessage('Email must be valid'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
      }

      const userId = req.user.id;
      const payload = req.body || {};

      let doc = await userDataModel.findOne({ userId });
      if (!doc) {
        doc = new userDataModel({ userId });
      }

      // Merge non-sensitive fields
      if (payload.personalInfo) {
        doc.personalInfo = { ...doc.personalInfo, ...payload.personalInfo };
      }
      if (payload.contactInfo) {
        doc.contactInfo = { ...doc.contactInfo, ...payload.contactInfo };
      }
      if (payload.professionalInfo) {
        doc.professionalInfo = { ...doc.professionalInfo, ...payload.professionalInfo };
      }

      // Apply sensitive encryption if provided
      applySensitiveEncryption(doc, payload);

      doc.lastUpdated = new Date();
      await doc.save();

      const nonSensitive = pickNonSensitive(doc);
      res.status(200).json({ success: true, data: nonSensitive });
    } catch (error) {
      next(error instanceof ApiError ? error : new ApiError(500, 'Failed to update user data', error.message));
    }
  }
);

module.exports = router;