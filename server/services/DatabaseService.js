const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

class DatabaseService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI;
      
      this.connection = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;
      
      // Setup connection event handlers
      mongoose.connection.on('error', (error) => {
        console.error('Database connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('Database disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.info('Database reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      console.error('Database connection failed:', error);
      throw new ApiError(500, 'Database connection failed');
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.isConnected = false;
        console.info('Database disconnected successfully');
      }
    } catch (error) {
      console.error('Database disconnection failed:', error);
    }
  }


  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  
  // Transaction support

  async withTransaction(callback) {
    const session = await mongoose.startSession();
    
    try {
      return await session.withTransaction(async () => {
        return await callback(session);
      });
    } catch (error) {
      console.error('Transaction failed:', error);
      throw new ApiError(500, 'Database transaction failed');
    } finally {
      await session.endSession();
    }
  }

  // Utility methods

  checkConnection() {
    if (!this.isConnected) {
      throw new ApiError(503, 'Database not connected');
    }
  }

  // Cleanup old records
  async cleanup() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Clean up old completed OCR jobs
      await this.deleteMany('ocrjobs', {
        status: 'completed',
        completedAt: { $lt: thirtyDaysAgo }
      });
      
      // Clean up old failed jobs
      await this.deleteMany('ocrjobs', {
        status: 'failed',
        startTime: { $lt: thirtyDaysAgo }
      });
      
      console.info('Database cleanup completed');
    } catch (error) {
      console.error('Database cleanup failed:', error);
    }
  }
}

const DatabaseServices = new DatabaseService();

module.exports = { DatabaseService, DatabaseServices };