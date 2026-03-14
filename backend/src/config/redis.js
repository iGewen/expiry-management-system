import Redis from 'ioredis';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

let redis = null;
let isConnected = false;

/**
 * 初始化 Redis 连接
 */
export function initRedis() {
  if (!config.redis?.enabled) {
    logger.info('Redis is not configured, using in-memory storage');
    return null;
  }

  try {
    redis = new Redis({
      host: config.redis.host || 'localhost',
      port: config.redis.port || 6379,
      password: config.redis.password || undefined,
      db: config.redis.db || 0,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true
    });

    redis.on('connect', () => {
      isConnected = true;
      logger.info('Redis connected successfully');
    });

    redis.on('error', (err) => {
      logger.error('Redis connection error:', err);
      isConnected = false;
    });

    redis.on('close', () => {
      isConnected = false;
      logger.warn('Redis connection closed');
    });

    return redis;
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    return null;
  }
}

/**
 * 获取 Redis 客户端
 */
export function getRedis() {
  return isConnected ? redis : null;
}

/**
 * 检查 Redis 是否可用
 */
export function isRedisAvailable() {
  return isConnected && redis !== null;
}

/**
 * 关闭 Redis 连接
 */
export async function closeRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
    isConnected = false;
  }
}

// 内存存储降级（当 Redis 不可用时）
const memoryStore = new Map();

/**
 * 通用存储服务（自动降级）
 */
export const store = {
  async get(key) {
    if (isRedisAvailable()) {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    }
    return memoryStore.get(key) || null;
  },

  async set(key, value, ttlSeconds = 0) {
    if (isRedisAvailable()) {
      const serialized = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await redis.setex(key, ttlSeconds, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } else {
      memoryStore.set(key, {
        value,
        expireTime: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null
      });
    }
  },

  async del(key) {
    if (isRedisAvailable()) {
      await redis.del(key);
    } else {
      memoryStore.delete(key);
    }
  },

  async incr(key) {
    if (isRedisAvailable()) {
      return await redis.incr(key);
    } else {
      const current = memoryStore.get(key);
      const newValue = (current?.value || 0) + 1;
      memoryStore.set(key, { value: newValue, expireTime: current?.expireTime });
      return newValue;
    }
  },

  async expire(key, seconds) {
    if (isRedisAvailable()) {
      await redis.expire(key, seconds);
    } else {
      const current = memoryStore.get(key);
      if (current) {
        current.expireTime = Date.now() + seconds * 1000;
      }
    }
  },

  // 清理过期的内存存储
  cleanupExpired() {
    const now = Date.now();
    for (const [key, data] of memoryStore.entries()) {
      if (data.expireTime && now > data.expireTime) {
        memoryStore.delete(key);
      }
    }
  }
};

// 定期清理内存存储
setInterval(() => store.cleanupExpired(), 60000);

export default { initRedis, getRedis, isRedisAvailable, closeRedis, store };
