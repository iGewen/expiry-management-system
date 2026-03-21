import rateLimit from 'express-rate-limit';
import { store } from '../config/redis.js';
import logger from '../utils/logger.js';

// 自定义 keyGenerator，正确处理 Docker/Nginx 环境下的真实 IP
const keyGenerator = (req) => {
  // 1. 优先使用 X-Forwarded-For 头（Nginx/反向代理设置）
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For 格式: client, proxy1, proxy2
    // 第一个是客户端真实 IP
    const clientIp = forwarded.split(',')[0].trim();
    if (clientIp && clientIp !== 'unknown') {
      return clientIp;
    }
  }
  
  // 2. 使用 X-Real-IP 头（Nginx 设置）
  const realIp = req.headers['x-real-ip'];
  if (realIp && realIp !== 'unknown') {
    return realIp;
  }
  
  // 3. 使用 Express trust proxy 设置后的 req.ip
  // 注意：需要在 app.js 中设置 app.set('trust proxy', 1)
  if (req.ip && req.ip !== '::1' && req.ip !== '::ffff:127.0.0.1') {
    // 如果是 IPv6 映射的 IPv4 地址，提取 IPv4 部分
    if (req.ip.startsWith('::ffff:')) {
      return req.ip.substring(7);
    }
    return req.ip;
  }
  
  // 4. 最后回退：使用连接的远程地址
  const remoteAddress = req.connection?.remoteAddress || req.socket?.remoteAddress;
  if (remoteAddress) {
    // 处理 IPv6 映射的 IPv4 地址
    if (remoteAddress.startsWith('::ffff:')) {
      return remoteAddress.substring(7);
    }
    return remoteAddress;
  }
  
  // 5. 无法获取 IP 时的最后手段（记录警告）
  logger.warn('Unable to determine client IP for rate limiting, using fallback key');
  return 'unknown-ip-' + (req.headers['user-agent'] || 'no-ua').substring(0, 20);
};

// 通用API限流 - 每分钟100次
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, message: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

// 登录限流 - 每分钟5次
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: '登录尝试过多，请1分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

// 短信限流 - 每小时5次
export const smsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: '短信发送次数超限，请1小时后再试' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

// 创建操作限流 - 每分钟20次
export const createLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: '操作过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

logger.info('Rate limiters initialized');
