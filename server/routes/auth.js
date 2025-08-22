const express = require('express');
const { body, validationResult } = require('express-validator');
const { SecurityService } = require('../services/SecurityService');
const { DatabaseService, DatabaseServices} = require('../services/DatabaseService');
const { CacheService, CacheServices } = require('../services/CacheService');
const ApiError = require('../utils/ApiError');
const userModel = require('../models/userModel');

const router = express.Router();
const securityService = new SecurityService();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    body('firstName').trim().isLength({ min: 1, max: 50 }),
    body('lastName').trim().isLength({ min: 1, max: 50 }),
    body('company').optional().trim().isLength({ max: 100 }),
    body('industry').optional().trim().isLength({ max: 50 }),
  ],
  async (req, res, next) => {
    try {
      // const errors = validationResult(req);
      // if (!errors.isEmpty()) {
      //   throw new ApiError(400, 'Validation failed', errors.array());
      // }

      const { email, password, firstName, lastName, company, industry } = req.body;

      // Check if user already exists
      const existingUser = await userModel.findOne({ email: email });
      if (existingUser) {
        throw new ApiError(409, 'User already exists with this email');
      }

      // Hash password
      const passwordHash = await securityService.hashPassword(password);

      // Create user object
      const userData = {
        email,
        passwordHash,
        plan: 'free',
        isActive: true,
        profile: {
          firstName,
          lastName,
          company: company || null,
          industry: industry || null
        },
        preferences: {
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            sms: false
          }
        }
      };

      // Create and save user
      const newUser = await userModel.create(userData);
      const savedUser = await newUser.save();

      // Generate JWT token
      const token = securityService.generateToken({
        userId: savedUser._id.toString(),
        email: savedUser.email,
        plan: savedUser.plan
      });

      console.info(`New user registered: ${savedUser.email}`);
      console.info(`User ID: ${savedUser._id}`);

      // Return user data without password hash
      const userResponse = {
        _id: savedUser._id,
        email: savedUser.email,
        plan: savedUser.plan,
        isActive: savedUser.isActive,
        profile: savedUser.profile,
        preferences: savedUser.preferences,
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt
      };

      res.status(201).json({
        success: true,
        data: {
          user: userResponse,
          token
        },
        message: 'User registered successfully'
      });

    } catch (error) {
      console.error('User registration failed:', error);
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 * Authenticate user
 */
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 1 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
      }

      const { email, password } = req.body;

      // Find user
      const user = await userModel.findOne({ email });
      if (!user) {
        throw new ApiError(401, 'Invalid email or password');
      }

      if (!user.isActive) {
        throw new ApiError(401, 'Account is deactivated');
      }

      // Verify password
      const isValidPassword = await securityService.verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        throw new ApiError(401, 'Invalid email or password');
      }

      // Generate JWT token
      const token = securityService.generateToken({
        userId: user._id.toString(),
        email: user.email,
        plan: user.plan
      });

      // Update last login
      await userModel.updateOne(
        { _id: user._id },
        { lastLoginAt: new Date() }
      );

      console.info(`User logged in: ${user.email}`);

      // Return user data without password hash
      const userResponse = {
        _id: user._id,
        email: user.email,
        plan: user.plan,
        isActive: user.isActive,
        profile: user.profile,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt
      };

      res.status(200).json({
        success: true,
        data: {
          user: userResponse,
          token
        },
        message: 'Login successful'
      });

    } catch (error) {
      console.error('User login failed:', error);
      next(error);
    }
  }
);

/**
 * POST /api/auth/logout
 * Logout user (blacklist token)
 */
router.post('/logout',
  async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        // Add token to blacklist
        await CacheServices.set(`blacklist:${token}`, true, 24 * 60 * 60); // 24 hours
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('User logout failed:', error);
      next(error);
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh',
  async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(401, 'Access token required');
      }

      const token = authHeader.substring(7);
      
      // Verify current token
      const decoded = securityService.verifyToken(token);
      
      // Get user
      const user = await userModel.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new ApiError(401, 'User not found or inactive');
      }

      // Generate new token
      const newToken = securityService.generateToken({
        userId: user._id.toString(),
        email: user.email,
        plan: user.plan
      });

      // Blacklist old token
      await CacheServices.set(`blacklist:${token}`, true, 24 * 60 * 60);

      // Return user data without password hash
      const userResponse = {
        _id: user._id,
        email: user.email,
        plan: user.plan,
        isActive: user.isActive,
        profile: user.profile,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt
      };

      res.status(200).json({
        success: true,
        data: {
          user: userResponse,
          token: newToken
        },
        message: 'Token refreshed successfully'
      });

    } catch (error) {
      console.error('Token refresh failed:', error);
      next(error);
    }
  }
);

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password',
  [
    body('email').isEmail().normalizeEmail(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
      }

      const { email } = req.body;

      // Find user
      const user = await userModel.findOne({ email });
      if (!user) {
        // Don't reveal if email exists
        return res.status(200).json({
          success: true,
          message: 'If the email exists, a password reset link has been sent'
        });
      }

      // Generate reset token
      const resetToken = securityService.generateToken(
        { userId: user._id.toString(), type: 'password_reset' },
        '1h'
      );

      // Store reset token
      await CacheServices.set(`reset:${resetToken}`, user._id.toString(), 3600); // 1 hour

      // In a real app, send email here
      console.info(`Password reset requested for: ${email}`);

      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
        // In development, include the token
        ...(process.env.NODE_ENV === 'development' && { resetToken })
      });

    } catch (error) {
      console.error('Password reset request failed:', error);
      next(error);
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password',
  [
    body('token').isString().trim(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
      }

      const { token, password } = req.body;

      // Verify reset token
      const decoded = securityService.verifyToken(token);
      if (decoded.type !== 'password_reset') {
        throw new ApiError(401, 'Invalid reset token');
      }

      // Check if token is still valid in cache
      const userId = await CacheServices.get(`reset:${token}`);
      if (!userId) {
        throw new ApiError(401, 'Reset token has expired');
      }

      // Hash new password
      const passwordHash = await securityService.hashPassword(password);

      // Update user password
      const getUser = await userModel.findById(userId)
      await getUser.updateOne(
        { passwordHash, updatedAt: new Date() }
      );

      // Remove reset token
      await CacheServices.delete(`reset:${token}`);

      console.info(`Password reset completed for user: ${userId} with handle ${getUser.profile}`);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      console.error('Password reset failed:', error);
      next(error);
    }
  }
);

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile',
  async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(401, 'Access token required');
      }

      const token = authHeader.substring(7);
      
      // Verify JWT token
      const decoded = securityService.verifyToken(token);
      const userId = req.headers.user;
      
      // Get user from database
      const user = await userModel.findById(userId);
      
      if (!user) {
        throw new ApiError(401, 'User not found');
      }

      if (!user.isActive) {
        throw new ApiError(401, 'User account is deactivated');
      }

      // Return user data without password hash
      const userResponse = {
        _id: user._id,
        email: user.email,
        plan: user.plan,
        isActive: user.isActive,
        profile: user.profile,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt
      };

      res.status(200).json({
        success: true,
        data: userResponse,
        message: 'Profile retrieved successfully'
      });

    } catch (error) {
      console.error('Profile retrieval failed:', error);
      next(error);
    }
  }
);

/**
 * PUT /api/auth/profile
 * Update current user profile
 */
router.put('/profile',
  [
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
    body('company').optional().trim().isLength({ max: 100 }),
    body('industry').optional().trim().isLength({ max: 50 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
      }

      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(401, 'Access token required');
      }

      const token = authHeader.substring(7);
      
      // Verify JWT token
      const decoded = securityService.verifyToken(token);
      const userId = req.headers.user;
      const user = await userModel.findById(userId);
      
      if (!user) {
        throw new ApiError(401, 'User not found');
      }

      if (!user.isActive) {
        throw new ApiError(401, 'User account is deactivated');
      }

      // Update profile fields
      const { firstName, lastName, company, industry } = req.body;
      
      if (firstName) user.profile.firstName = firstName;
      if (lastName) user.profile.lastName = lastName;
      if (company !== undefined) user.profile.company = company;
      if (industry !== undefined) user.profile.industry = industry;
      
      user.updatedAt = new Date();
      
      await user.save();

      // Return updated user data
      const userResponse = {
        _id: user._id,
        email: user.email,
        plan: user.plan,
        isActive: user.isActive,
        profile: user.profile,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt
      };

      res.status(200).json({
        success: true,
        data: userResponse,
        message: 'Profile updated successfully'
      });

    } catch (error) {
      console.error('Profile update failed:', error);
      next(error);
    }
  }
);

module.exports = router;