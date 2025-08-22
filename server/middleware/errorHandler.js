const ApiError = require('../utils/ApiError');

const errorHandler = (error, req, res, next) => {
  // Log the error
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Handle known API errors
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      details: error.details,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: Object.values(error.errors).map(err => err.message),
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }

  // Handle MongoDB duplicate key errors
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'Resource already exists',
      details: 'A record with this information already exists',
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }

  // Handle multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File too large',
      details: 'File size exceeds the maximum allowed limit',
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      error: 'Too many files',
      details: 'Number of files exceeds the maximum allowed limit',
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }

  // Handle GROQ API errors
  if (error.message && error.message.includes('GROQ')) {
    return res.status(503).json({
      success: false,
      error: 'AI service temporarily unavailable',
      details: 'Please try again in a few moments',
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }

  // Handle database connection errors
  if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
    return res.status(503).json({
      success: false,
      error: 'Database temporarily unavailable',
      details: 'Please try again in a few moments',
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }

  // Handle Redis connection errors
  if (error.code === 'ECONNREFUSED' && error.port === 6379) {
    console.warn('Redis connection failed, continuing without cache');
    // Don't return error for Redis failures - app should work without cache
    return next();
  }

  // Handle rate limiting errors
  if (error.status === 429) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      details: 'Too many requests, please try again later',
      retryAfter: error.retryAfter || 60,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }

  // Handle syntax errors in JSON
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON',
      details: 'Request body contains invalid JSON',
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }

  // Handle CORS errors
  if (error.message && error.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: 'CORS policy violation',
      details: 'Request blocked by CORS policy',
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }

  // Default error response
  const statusCode = error.statusCode || error.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && {
      stack: error.stack,
      details: error.details
    }),
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    details: `${req.method} ${req.originalUrl} is not a valid endpoint`,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'POST /api/form/analyze',
      'GET /api/form/results/:id',
      'POST /api/form/generate',
      'POST /api/ocr/extract',
      'GET /api/ocr/status/:jobId'
    ]
  });
};

module.exports = { errorHandler, notFoundHandler };