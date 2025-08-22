const Redis = require('redis');
const ApiError = require('../utils/ApiError');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour default TTL
  }

  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = Redis.createClient({
        url: redisUrl,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('Redis server connection refused');
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.error('Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            console.error('Redis max retry attempts reached');
            return undefined;
          }
          // Reconnect after
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('error', (error) => {
        console.error('Redis client error:', error);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.warn('Redis client disconnected');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        console.info('Redis client reconnecting');
      });

      await this.client.connect();
      console.info('Cache service connected successfully');

    } catch (error) {
      console.error('Cache service connection failed:', error);
      // Don't throw error - app should work without cache
      this.isConnected = false;
    }
  }

  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        this.isConnected = false;
        console.info('Cache service disconnected successfully');
      }
    } catch (error) {
      console.error('Cache service disconnection failed:', error);
    }
  }

  async get(key) {
    try {
      if (!this.isConnected) {
        console.debug('Cache not available, skipping get operation');
        return null;
      }

      const value = await this.client.get(key);
      
      if (value) {
        try {
          return JSON.parse(value);
        } catch (parseError) {
          console.warn('Failed to parse cached value:', parseError);
          return value; // Return raw value if JSON parsing fails
        }
      }
      
      return null;

    } catch (error) {
      console.error('Cache get operation failed:', error);
      return null; // Fail gracefully
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) {
        console.debug('Cache not available, skipping set operation');
        return false;
      }

      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (ttl > 0) {
        await this.client.setEx(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      
      return true;

    } catch (error) {
      console.error('Cache set operation failed:', error);
      return false; // Fail gracefully
    }
  }

  async delete(key) {
    try {
      if (!this.isConnected) {
        console.debug('Cache not available, skipping delete operation');
        return false;
      }

      const result = await this.client.del(key);
      return result > 0;

    } catch (error) {
      console.error('Cache delete operation failed:', error);
      return false; // Fail gracefully
    }
  }

  async exists(key) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;

    } catch (error) {
      console.error('Cache exists operation failed:', error);
      return false;
    }
  }

  async expire(key, ttl) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.client.expire(key, ttl);
      return result === 1;

    } catch (error) {
      console.error('Cache expire operation failed:', error);
      return false;
    }
  }

  async increment(key, amount = 1) {
    try {
      if (!this.isConnected) {
        return null;
      }

      return await this.client.incrBy(key, amount);

    } catch (error) {
      console.error('Cache increment operation failed:', error);
      return null;
    }
  }

  async decrement(key, amount = 1) {
    try {
      if (!this.isConnected) {
        return null;
      }

      return await this.client.decrBy(key, amount);

    } catch (error) {
      console.error('Cache decrement operation failed:', error);
      return null;
    }
  }

  // Hash operations
  async hGet(key, field) {
    try {
      if (!this.isConnected) {
        return null;
      }

      const value = await this.client.hGet(key, field);
      
      if (value) {
        try {
          return JSON.parse(value);
        } catch (parseError) {
          return value;
        }
      }
      
      return null;

    } catch (error) {
      console.error('Cache hGet operation failed:', error);
      return null;
    }
  }

  async hSet(key, field, value, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      await this.client.hSet(key, field, serializedValue);
      
      if (ttl > 0) {
        await this.client.expire(key, ttl);
      }
      
      return true;

    } catch (error) {
      console.error('Cache hSet operation failed:', error);
      return false;
    }
  }

  async hGetAll(key) {
    try {
      if (!this.isConnected) {
        return {};
      }

      const hash = await this.client.hGetAll(key);
      const result = {};
      
      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value);
        } catch (parseError) {
          result[field] = value;
        }
      }
      
      return result;

    } catch (error) {
      console.error('Cache hGetAll operation failed:', error);
      return {};
    }
  }

  // List operations
  async lPush(key, ...values) {
    try {
      if (!this.isConnected) {
        return 0;
      }

      const serializedValues = values.map(v => 
        typeof v === 'string' ? v : JSON.stringify(v)
      );
      
      return await this.client.lPush(key, ...serializedValues);

    } catch (error) {
      console.error('Cache lPush operation failed:', error);
      return 0;
    }
  }

  async lPop(key) {
    try {
      if (!this.isConnected) {
        return null;
      }

      const value = await this.client.lPop(key);
      
      if (value) {
        try {
          return JSON.parse(value);
        } catch (parseError) {
          return value;
        }
      }
      
      return null;

    } catch (error) {
      console.error('Cache lPop operation failed:', error);
      return null;
    }
  }

  async lRange(key, start = 0, stop = -1) {
    try {
      if (!this.isConnected) {
        return [];
      }

      const values = await this.client.lRange(key, start, stop);
      
      return values.map(value => {
        try {
          return JSON.parse(value);
        } catch (parseError) {
          return value;
        }
      });

    } catch (error) {
      console.error('Cache lRange operation failed:', error);
      return [];
    }
  }

  // Set operations
  async sAdd(key, ...members) {
    try {
      if (!this.isConnected) {
        return 0;
      }

      const serializedMembers = members.map(m => 
        typeof m === 'string' ? m : JSON.stringify(m)
      );
      
      return await this.client.sAdd(key, ...serializedMembers);

    } catch (error) {
      console.error('Cache sAdd operation failed:', error);
      return 0;
    }
  }

  async sMembers(key) {
    try {
      if (!this.isConnected) {
        return [];
      }

      const members = await this.client.sMembers(key);
      
      return members.map(member => {
        try {
          return JSON.parse(member);
        } catch (parseError) {
          return member;
        }
      });

    } catch (error) {
      console.error('Cache sMembers operation failed:', error);
      return [];
    }
  }

  // Pattern-based operations
  async keys(pattern) {
    try {
      if (!this.isConnected) {
        return [];
      }

      return await this.client.keys(pattern);

    } catch (error) {
      console.error('Cache keys operation failed:', error);
      return [];
    }
  }

  async deletePattern(pattern) {
    try {
      if (!this.isConnected) {
        return 0;
      }

      const keys = await this.client.keys(pattern);
      
      if (keys.length > 0) {
        return await this.client.del(...keys);
      }
      
      return 0;

    } catch (error) {
      console.error('Cache deletePattern operation failed:', error);
      return 0;
    }
  }

  // Cache warming and management
  async warmCache(key, dataLoader, ttl = this.defaultTTL) {
    try {
      const cached = await this.get(key);
      
      if (cached !== null) {
        return cached;
      }
      
      const data = await dataLoader();
      await this.set(key, data, ttl);
      
      return data;

    } catch (error) {
      console.error('Cache warming failed:', error);
      // If cache warming fails, still return the data
      return await dataLoader();
    }
  }

  async invalidatePattern(pattern) {
    try {
      const deletedCount = await this.deletePattern(pattern);
      console.info(`Invalidated ${deletedCount} cache entries matching pattern: ${pattern}`);
      return deletedCount;
    } catch (error) {
      console.error('Cache invalidation failed:', error);
      return 0;
    }
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return {
          status: 'unhealthy',
          connected: false,
          error: 'Not connected to Redis'
        };
      }

      await this.client.ping();
      
      return {
        status: 'healthy',
        connected: true,
        info: await this.client.info()
      };

    } catch (error) {
      console.error('Cache health check failed:', error);
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message
      };
    }
  }

  // Statistics
  async getStats() {
    try {
      if (!this.isConnected) {
        return null;
      }

      const info = await this.client.info();
      const dbSize = await this.client.dbSize();
      
      return {
        connected: this.isConnected,
        dbSize,
        info: this.parseRedisInfo(info)
      };

    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return null;
    }
  }

  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const result = {};
    
    lines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    });
    
    return result;
  }
}

const CacheServices = new CacheService();

module.exports = { CacheService, CacheServices };