import rateLimit from 'express-rate-limit';
import { store } from '../config/redis.js';
import logger from '../utils/logger.js';

// 通用API限流 - 每分钟100次
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, message: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 登录限流 - 每分钟5次
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: '登录尝试过多，请1分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 短信限流 - 每小时5次
export const smsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: '短信发送次数超限，请1小时后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 创建操作限流 - 每分钟20次
export const createLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: '操作过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

logger.info('Rate limiters initialized');
