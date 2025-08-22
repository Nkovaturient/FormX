const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { dirname, join } = require('path');

const formRoutes = require('./routes/form');
const formProcessingRoutes = require('./routes/formProcessing');
const ocrRoutes = require('./routes/ocr');
const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');

// middleware
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');
const { authMiddleware } = require('./middleware/auth');

// Import services
const { DatabaseServices } = require('./services/DatabaseService');
const { CacheServices } = require('./services/CacheService');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;


// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.groq.com"],
    },
  },
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:5173',
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'multipart/form-data'],
// }));

app.use(cors({}));

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs
//   message: {
//     error: 'Too many requests from this IP, please try again later.',
//     retryAfter: '15 minutes'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use('/api/', limiter);

// Stricter rate limiting for AI endpoints
// const aiLimiter = rateLimit({
//   windowMs: 60 * 1000, // 1 minute
//   max: 10, // Limit each IP to 10 AI requests per minute
//   message: {
//     error: 'AI processing rate limit exceeded. Please wait before making another request.',
//     retryAfter: '1 minute'
//   },
// });

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/form', authMiddleware, formRoutes);
app.use('/api/form-processing', authMiddleware, formProcessingRoutes);
app.use('/api/ocr', authMiddleware, ocrRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);



async function startServer() {
  try {
    await DatabaseServices.connect();
    console.log('Database connected successfully');

    await CacheServices.connect();

    app.listen(PORT, () => {
      console.log(`Server running on port http://localhost:${PORT}/health`);
      console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}
startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.info('SIGTERM received, shutting down gracefully');
  await DatabaseServices.disconnect();
  await CacheServices.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.info('SIGINT received, shutting down gracefully');
  await DatabaseServices.disconnect();
  await CacheServices.disconnect();
  process.exit(0);
});

// Error handling middleware (must be last)
app.use(errorHandler);