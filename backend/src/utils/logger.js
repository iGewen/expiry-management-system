import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 日志目录
const logDir = path.join(__dirname, '../../logs');

// 确保日志目录存在
import fs from 'fs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 控制台格式
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...rest }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(rest).length > 0 && rest.stack) {
      log += `\n${rest.stack}`;
    }
    return log;
  })
);

const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'expiry-management-backend' },
  // 不使用 exitOnError，让程序可以优雅处理错误
  exitOnError: false,
  transports: [
    // 错误日志 - 带压缩归档
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 10,
      zippedArchive: true, // 启用压缩
      format: logFormat
    }),
    // 警告日志
    new winston.transports.File({
      filename: path.join(logDir, 'warn.log'),
      level: 'warn',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      zippedArchive: true,
      format: logFormat
    }),
    // 所有日志 - 带压缩归档
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 10,
      zippedArchive: true,
      format: logFormat
    }),
    // HTTP 请求日志
    new winston.transports.File({
      filename: path.join(logDir, 'http.log'),
      level: 'http',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      zippedArchive: true,
      format: logFormat
    })
  ]
});

// 始终输出到控制台（便于 docker logs 查看）
logger.add(new winston.transports.Console({
  format: consoleFormat
}));

// 异常处理
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // 给系统一点时间记录日志
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 请求日志中间件
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    
    if (res.statusCode >= 400) {
      logger.warn(message, {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration,
        ip: req.ip
      });
    } else {
      logger.http(message);
    }
  });
  
  next();
};

export default logger;
