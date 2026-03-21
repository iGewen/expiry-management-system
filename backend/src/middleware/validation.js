import { validationResult } from 'express-validator';
import logger from '../utils/logger.js';

/**
 * 请求验证中间件 - 处理 express-validator 的结果
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value
    }));
    
    return res.status(400).json({
      success: false,
      message: '请求参数验证失败',
      code: 'VALIDATION_ERROR',
      errors: formattedErrors
    });
  }
  
  next();
};

/**
 * 分页参数验证和规范化
 */
export const validatePagination = (req, res, next) => {
  const { 
    page = 1, 
    pageSize = 20 
  } = req.query;
  
  // 解析并验证页码
  let pageNum = parseInt(page, 10);
  let pageSizeNum = parseInt(pageSize, 10);
  
  // 类型检查
  if (isNaN(pageNum) || pageNum < 1) {
    pageNum = 1;
  }
  
  if (isNaN(pageSizeNum) || pageSizeNum < 1) {
    pageSizeNum = 20;
  }
  
  // 限制最大分页大小
  if (pageSizeNum > 100) {
    pageSizeNum = 100;
  }
  
  // 将规范化后的参数附加到请求对象
  req.query.page = pageNum;
  req.query.pageSize = pageSizeNum;
  req.pagination = {
    page: pageNum,
    pageSize: pageSizeNum,
    skip: (pageNum - 1) * pageSizeNum
  };
  
  next();
};

/**
 * 参数 ID 验证中间件
 */
export const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    const idStr = req.params[paramName] || req.body[paramName];
    
    if (!idStr) {
      return res.status(400).json({
        success: false,
        message: `缺少必需的参数: ${paramName}`,
        code: 'MISSING_PARAM'
      });
    }
    
    const id = parseInt(idStr, 10);
    
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: `无效的 ${paramName}: ${idStr}`,
        code: 'INVALID_PARAM'
      });
    }
    
    // 将解析后的 ID 附加到请求对象
    req.params[paramName] = id;
    
    next();
  };
};

/**
 * 全局错误处理中间件
 * 生产环境不泄露敏感信息
 */
export const errorHandler = (err, req, res, next) => {
  // 记录错误（仅服务端日志）
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body ? Object.keys(req.body) : null,
    query: req.query ? Object.keys(req.query) : null
  });

  // 已知错误类型处理
  if (err.name === 'PrismaClientKnownRequestError') {
    // Prisma 数据库错误 - 不暴露具体的数据库错误信息
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: '数据已存在',
        code: 'DUPLICATE_ENTRY'
      });
    }
    
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: '记录不存在',
        code: 'RECORD_NOT_FOUND'
      });
    }
    
    // 其他数据库错误统一返回
    logger.error('Database error:', { code: err.code, meta: err.meta });
    return res.status(400).json({
      success: false,
      message: '数据库操作失败',
      code: 'DATABASE_ERROR'
    });
  }

  // JWT 错误 - 不暴露具体的认证错误信息
  if (err.name === 'JsonWebTokenError') {
    logger.error('JWT error:', err.message);
    return res.status(401).json({
      success: false,
      message: '认证失败',
      code: 'AUTH_ERROR'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '登录已过期，请重新登录',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Multer 文件上传错误
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超过限制（最大 10MB）',
        code: 'FILE_TOO_LARGE'
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: '文件字段名不正确',
        code: 'UNEXPECTED_FILE'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: '文件上传失败',
      code: 'UPLOAD_ERROR'
    });
  }

  // 业务逻辑错误
  if (err.status) {
    // 清理错误消息中的敏感信息
    const safeMessage = sanitizeErrorMessage(err.message);
    return res.status(err.status).json({
      success: false,
      message: safeMessage,
      code: err.code || 'BUSINESS_ERROR'
    });
  }

  // 默认 500 错误 - 生产环境不暴露错误详情
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    message: isProduction 
      ? '服务器内部错误，请稍后重试' 
      : err.message,
    code: 'INTERNAL_ERROR',
    // 开发环境可提供错误 ID 便于排查
    ...(isProduction ? {} : { 
      errorId: Date.now().toString(36),
      stack: err.stack 
    })
  });
};

/**
 * 清理错误消息中的敏感信息
 */
function sanitizeErrorMessage(message) {
  if (!message || typeof message !== 'string') {
    return '操作失败';
  }
  
  // 移除可能的敏感信息
  const sensitivePatterns = [
    /password[=:]\s*\S+/gi,
    /secret[=:]\s*\S+/gi,
    /token[=:]\s*\S+/gi,
    /key[=:]\s*\S+/gi,
    /mysql:\/\/[^\s]+/gi,
    /redis:\/\/[^\s]+/gi,
    /at\s+\S+:\d+:\d+/g // 移除堆栈信息
  ];
  
  let sanitized = message;
  for (const pattern of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  
  return sanitized;
}

/**
 * 404 处理中间件
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    code: 'NOT_FOUND',
    path: req.path,
    method: req.method
  });
};

/**
 * 请求日志中间件
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
};
