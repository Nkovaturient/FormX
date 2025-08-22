const { v4: uuidv4 } = require('uuid');

const requestLogger = (req, res, next) => {
  // Generate unique request ID
  req.id = uuidv4();
  
  // Start timer
  const startTime = Date.now();
  
  // Log request
  console.info('Incoming request', {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    timestamp: new Date().toISOString()
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    // Log response
    console.info('Request completed', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      timestamp: new Date().toISOString()
    });

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = { requestLogger };