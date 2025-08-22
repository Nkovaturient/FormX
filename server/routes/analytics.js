const express = require('express');
const { DatabaseService } = require('../services/DatabaseService');
const { CacheService } = require('../services/CacheService');
// const { console } = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const router = express.Router();

/**
 * GET /api/analytics/dashboard
 * Get user dashboard analytics
 */
router.get('/dashboard',
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { timeframe = '30d' } = req.query;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get analytics data
      const [
        analysisStats,
        ocrStats,
        generationStats,
        usageStats
      ] = await Promise.all([
        getAnalysisStats(userId, startDate, endDate),
        getOCRStats(userId, startDate, endDate),
        getGenerationStats(userId, startDate, endDate),
        getUserUsageStats(userId)
      ]);

      const analytics = {
        timeframe,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        analysis: analysisStats,
        ocr: ocrStats,
        generation: generationStats,
        usage: usageStats,
        summary: {
          totalForms: analysisStats.totalForms + generationStats.totalForms,
          totalDocuments: ocrStats.totalDocuments,
          timeSaved: calculateTimeSaved(analysisStats, ocrStats, generationStats),
          accuracyRate: calculateAverageAccuracy(analysisStats, ocrStats)
        }
      };

      res.status(200).json({
        success: true,
        data: analytics,
        message: 'Analytics retrieved successfully'
      });

    } catch (error) {
      console.error('Failed to retrieve analytics:', error);
      next(error);
    }
  }
);

/**
 * GET /api/analytics/usage
 * Get detailed usage statistics
 */
router.get('/usage',
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      const usage = await getUserUsageStats(userId);
      const limits = await getUserLimits(userId);
      
      const usageData = {
        current: usage,
        limits,
        percentages: {
          analysis: limits.analysis > 0 ? (usage.analysis / limits.analysis) * 100 : 0,
          generation: limits.generation > 0 ? (usage.generation / limits.generation) * 100 : 0,
          ocr: limits.ocr > 0 ? (usage.ocr / limits.ocr) * 100 : 0
        },
        resetDate: getNextResetDate()
      };

      res.status(200).json({
        success: true,
        data: usageData,
        message: 'Usage statistics retrieved successfully'
      });

    } catch (error) {
      console.error('Failed to retrieve usage statistics:', error);
      next(error);
    }
  }
);

/**
 * GET /api/analytics/performance
 * Get performance metrics
 */
router.get('/performance',
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { timeframe = '30d' } = req.query;

      const cacheKey = `performance:${userId}:${timeframe}`;
      let performance = await CacheService.get(cacheKey);

      if (!performance) {
        performance = await calculatePerformanceMetrics(userId, timeframe);
        await CacheService.set(cacheKey, performance, 1800); // Cache for 30 minutes
      }

      res.status(200).json({
        success: true,
        data: performance,
        message: 'Performance metrics retrieved successfully'
      });

    } catch (error) {
      console.error('Failed to retrieve performance metrics:', error);
      next(error);
    }
  }
);

/**
 * GET /api/analytics/trends
 * Get usage trends over time
 */
router.get('/trends',
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { timeframe = '30d', granularity = 'day' } = req.query;

      const trends = await calculateUsageTrends(userId, timeframe, granularity);

      res.status(200).json({
        success: true,
        data: trends,
        message: 'Usage trends retrieved successfully'
      });

    } catch (error) {
      console.error('Failed to retrieve usage trends:', error);
      next(error);
    }
  }
);

// Helper functions

async function getAnalysisStats(userId, startDate, endDate) {
  try {
    const analyses = await DatabaseService.find('analyses', {
      userId,
      timestamp: { $gte: startDate, $lte: endDate }
    });

    const stats = {
      totalForms: analyses.length,
      averageConfidence: 0,
      averageProcessingTime: 0,
      totalFields: 0,
      successRate: 0
    };

    if (analyses.length > 0) {
      stats.averageConfidence = analyses.reduce((sum, a) => sum + (a.confidence || 0), 0) / analyses.length;
      stats.averageProcessingTime = analyses.reduce((sum, a) => sum + (a.processingTime || 0), 0) / analyses.length;
      stats.totalFields = analyses.reduce((sum, a) => sum + (a.extractedData?.totalFields || 0), 0);
      stats.successRate = (analyses.filter(a => a.status === 'completed').length / analyses.length) * 100;
    }

    return stats;
  } catch (error) {
    console.error('Failed to get analysis stats:', error);
    return { totalForms: 0, averageConfidence: 0, averageProcessingTime: 0, totalFields: 0, successRate: 0 };
  }
}

async function getOCRStats(userId, startDate, endDate) {
  try {
    const ocrJobs = await DatabaseService.find('ocrjobs', {
      userId,
      startTime: { $gte: startDate, $lte: endDate }
    });

    const stats = {
      totalDocuments: 0,
      averageConfidence: 0,
      averageProcessingTime: 0,
      successRate: 0,
      totalBatches: 0
    };

    if (ocrJobs.length > 0) {
      stats.totalDocuments = ocrJobs.reduce((sum, job) => sum + (job.documentsTotal || 0), 0);
      stats.averageProcessingTime = ocrJobs.reduce((sum, job) => sum + (job.processingTime || 0), 0) / ocrJobs.length;
      stats.successRate = (ocrJobs.filter(job => job.status === 'completed').length / ocrJobs.length) * 100;
    }

    // Get batch stats
    const batches = await DatabaseService.find('ocrbatches', {
      userId,
      createdAt: { $gte: startDate, $lte: endDate }
    });
    stats.totalBatches = batches.length;

    return stats;
  } catch (error) {
    console.error('Failed to get OCR stats:', error);
    return { totalDocuments: 0, averageConfidence: 0, averageProcessingTime: 0, successRate: 0, totalBatches: 0 };
  }
}

async function getGenerationStats(userId, startDate, endDate) {
  try {
    const generatedForms = await DatabaseService.find('generatedforms', {
      userId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const stats = {
      totalForms: generatedForms.length,
      averageProcessingTime: 0,
      successRate: 0,
      deployedForms: 0
    };

    if (generatedForms.length > 0) {
      stats.averageProcessingTime = generatedForms.reduce((sum, form) => sum + (form.processingTime || 0), 0) / generatedForms.length;
      stats.successRate = (generatedForms.filter(form => form.status === 'completed').length / generatedForms.length) * 100;
      stats.deployedForms = generatedForms.filter(form => form.status === 'deployed').length;
    }

    return stats;
  } catch (error) {
    console.error('Failed to get generation stats:', error);
    return { totalForms: 0, averageProcessingTime: 0, successRate: 0, deployedForms: 0 };
  }
}

async function getUserUsageStats(userId) {
  try {
    const usage = await DatabaseService.findOne('userusage', { userId });
    return usage || { analysis: 0, generation: 0, ocr: 0 };
  } catch (error) {
    console.error('Failed to get user usage stats:', error);
    return { analysis: 0, generation: 0, ocr: 0 };
  }
}

async function getUserLimits(userId) {
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

function calculateTimeSaved(analysisStats, ocrStats, generationStats) {
  // Estimate time saved based on automation
  const avgFormTime = 15; // minutes per form manually
  const avgOCRTime = 5; // minutes per document manually
  const avgGenerationTime = 60; // minutes to create form manually

  return (
    (analysisStats.totalForms * avgFormTime) +
    (ocrStats.totalDocuments * avgOCRTime) +
    (generationStats.totalForms * avgGenerationTime)
  );
}

function calculateAverageAccuracy(analysisStats, ocrStats) {
  const totalOperations = analysisStats.totalForms + ocrStats.totalDocuments;
  if (totalOperations === 0) return 0;

  const totalAccuracy = 
    (analysisStats.averageConfidence * analysisStats.totalForms) +
    (ocrStats.averageConfidence * ocrStats.totalDocuments);

  return totalAccuracy / totalOperations;
}

async function calculatePerformanceMetrics(userId, timeframe) {
  try {
    // This would implement more sophisticated performance calculations
    // For now, return mock data
    return {
      efficiency: 85.5,
      accuracy: 94.2,
      speed: 78.9,
      reliability: 96.1,
      trends: {
        efficiency: 5.2,
        accuracy: 2.1,
        speed: -1.3,
        reliability: 0.8
      }
    };
  } catch (error) {
    console.error('Failed to calculate performance metrics:', error);
    return {
      efficiency: 0,
      accuracy: 0,
      speed: 0,
      reliability: 0,
      trends: { efficiency: 0, accuracy: 0, speed: 0, reliability: 0 }
    };
  }
}

async function calculateUsageTrends(userId, timeframe, granularity) {
  try {
    // This would implement trend calculation based on historical data
    // For now, return mock trend data
    const dataPoints = granularity === 'day' ? 30 : granularity === 'week' ? 12 : 6;
    const trends = [];

    for (let i = 0; i < dataPoints; i++) {
      trends.push({
        date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        analysis: Math.floor(Math.random() * 10),
        ocr: Math.floor(Math.random() * 20),
        generation: Math.floor(Math.random() * 5)
      });
    }

    return trends.reverse();
  } catch (error) {
    console.error('Failed to calculate usage trends:', error);
    return [];
  }
}

function getNextResetDate() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString();
}

module.exports = router;