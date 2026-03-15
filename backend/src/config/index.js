import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载 .env 文件
dotenv.config({ path: join(__dirname, '.env') });

// JWT Secret 安全验证
function validateJwtSecret() {
  const secret = process.env.JWT_SECRET;
  
  // 生产环境强制要求设置 JWT_SECRET
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === 'default-secret-change-me') {
      logger.error('FATAL: JWT_SECRET must be set in production environment');
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    
    // 检查密钥强度（至少 32 个字符）
    if (secret.length < 32) {
      logger.error('FATAL: JWT_SECRET must be at least 32 characters long');
      throw new Error('JWT_SECRET is too weak (minimum 32 characters required)');
    }
  }
  
  return secret || 'default-secret-change-me';
}

// CORS 配置验证
function getCorsOrigin() {
  const origin = process.env.CORS_ORIGIN;
  
  if (process.env.NODE_ENV === 'production') {
    // 生产环境不允许使用默认的 localhost
    if (!origin || origin.includes('localhost')) {
      logger.warn('WARNING: CORS_ORIGIN is set to localhost in production');
    }
  }
  
  return origin || 'http://localhost:5173';
}

// 短信配置验证
function getSmsConfig() {
  const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
  const signName = process.env.ALIYUN_SMS_SIGN_NAME;
  const registerTemplateCode = process.env.ALIYUN_SMS_TEMPLATE_CODE_REGISTER;
  const resetTemplateCode = process.env.ALIYUN_SMS_TEMPLATE_CODE_RESET;
  const reminderTemplateCode = process.env.ALIYUN_SMS_TEMPLATE_CODE_REMINDER;
  
  // 检查是否配置了短信服务（需要两个模板都配置）
  if (accessKeyId && accessKeySecret && signName && registerTemplateCode && resetTemplateCode) {
    return {
      enabled: true,
      accessKeyId,
      accessKeySecret,
      signName,
      registerTemplateCode,
      resetTemplateCode,
      reminderTemplateCode,
      region: process.env.ALIYUN_SMS_REGION || 'cn-hangzhou'
    };
  }
  
  // 未配置短信服务
  logger.warn('SMS is not configured. SMS verification will be disabled.');
  return {
    enabled: false
  };
}

// Redis 配置
function getRedisConfig() {
  if (process.env.REDIS_HOST) {
    return {
      enabled: true,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10)
    };
  }
  
  logger.info('Redis is not configured, using in-memory fallback');
  return {
    enabled: false
  };
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  database: {
    url: process.env.DATABASE_URL
  },
  
  jwt: {
    secret: validateJwtSecret(),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  
  log: {
    level: process.env.LOG_LEVEL || 'info',
    retentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '180', 10)
  },
  
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10), // 10MB
    path: process.env.UPLOAD_PATH || './uploads',
    allowedMimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ]
  },
  
  cors: {
    origin: getCorsOrigin(),
    credentials: true
  },
  
  // 分页配置
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100 // 防止过大分页导致性能问题
  },
  
  // 速率限制配置
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 200, // 200 请求
    loginMax: 10, // 登录接口 10 次
    smsMax: 5 // 短信接口 5 次
  },
  
  // 安全配置
  security: {
    bcryptRounds: 12, // 密码哈希轮数
    maxLoginAttempts: 5, // 最大登录尝试次数
    lockoutMinutes: 30, // 锁定时间
    smsCodeExpireMinutes: 5, // 验证码有效期 5 分钟
    smsCodeLength: 6, // 验证码长度
    smsCodeMaxAttempts: 5 // 验证码验证最大尝试次数
  },
  
  // Redis 配置
  redis: getRedisConfig(),
  
  // 短信配置
  sms: getSmsConfig()
};
