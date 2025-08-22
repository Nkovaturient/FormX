const { SecurityService } = require('../services/SecurityService');
const { DatabaseService } = require('../services/DatabaseService');
const { CacheService, CacheServices } = require('../services/CacheService');
const ApiError = require('../utils/ApiError');
const userModel = require('../models/userModel');

const securityService = new SecurityService();

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Access token required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = securityService.verifyToken(token);
    
    // Check if token is blacklisted
    const isBlacklisted = await CacheServices.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new ApiError(401, 'Token has been revoked');
    }

    // Get user from database
    const userId = req.headers.user;
    const user = await userModel.findById(userId);
    console.info(`User auth middleware: ${user}`);
    
    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    if (!user.isActive) {
      throw new ApiError(401, 'User account is deactivated');
    }

    // Add user to request object
    req.user = {
      id: user._id,
      email: user.email,
      plan: user.plan,
      isAdmin: user.isAdmin || false,
      profile: user.profile
    };

    // Update last activity
    await updateLastActivity(userId);

    next();

  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Authentication middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  
  next();
};

const planMiddleware = (requiredPlan) => {
  const planHierarchy = {
    'free': 0,
    'personal': 1,
    'pro': 2,
    'enterprise': 3
  };

  return (req, res, next) => {
    const userPlanLevel = planHierarchy[req.user.plan] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan] || 0;

    if (userPlanLevel < requiredPlanLevel) {
      return res.status(403).json({
        success: false,
        error: `${requiredPlan} plan or higher required`,
        currentPlan: req.user.plan,
        requiredPlan
      });
    }

    next();
  };
};

const rateLimitByUser = (maxRequests, windowMs) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const key = `rate_limit:user:${userId}`;
      
      const current = await CacheServices.get(key) || 0;
      
      if (current >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      await CacheServices.increment(key);
      await CacheServices.expire(key, Math.ceil(windowMs / 1000));

      next();

    } catch (error) {
      console.error('Rate limiting error:', error);
      next(); // Continue on error
    }
  };
};


const checkPermission = (permission) => {
  return (req, res, next) => {
    // For JWT auth, check user plan
    if (req.user && !req.apiKey) {
      const planPermissions = {
        'free': ['form:analyze:basic', 'ocr:process:basic'],
        'personal': ['form:analyze', 'form:generate:basic', 'ocr:process'],
        'pro': ['form:analyze', 'form:generate', 'ocr:process', 'ocr:batch'],
        'enterprise': ['*'] // All permissions
      };

      const userPermissions = planPermissions[req.user.plan] || [];
      
      if (!userPermissions.includes('*') && !userPermissions.includes(permission)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          required: permission,
          userPlan: req.user.plan
        });
      }
    }

    // For API key auth, check key permissions
    if (req.apiKey) {
      const keyPermissions = req.apiKey.permissions || [];
      
      if (!keyPermissions.includes('*') && !keyPermissions.includes(permission)) {
        return res.status(403).json({
          success: false,
          error: 'API key lacks required permission',
          required: permission,
          available: keyPermissions
        });
      }
    }

    next();
  };
};

const auditLog = (action) => {
  return async (req, res, next) => {
    // Store original res.json to capture response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log the action
      setImmediate(async () => {
        try {
          await logAuditEvent({
            action,
            userId: req.user?.id,
            apiKeyId: req.apiKey?.id,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            timestamp: new Date().toISOString(),
            requestBody: req.body,
            responseData: data
          });
        } catch (error) {
          console.error('Audit logging failed:', error);
        }
      });

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

async function updateLastActivity(userId) {
  try {
    const getUser= await userModel.findById(userId)
    await getUser.updateOne(
      { lastLoginAt: new Date() }
    );
  } catch (error) {
    console.error('Failed to update last activity:', error);
  }
}


module.exports = {
  authMiddleware,
  adminMiddleware,
  planMiddleware,
  rateLimitByUser,
  checkPermission,
  auditLog,
  updateLastActivity
};