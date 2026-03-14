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
 */
export const errorHandler = (err, req, res, next) => {
  // 记录错误
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body ? Object.keys(req.body) : null
  });

  // 已知错误类型处理
  if (err.name === 'PrismaClientKnownRequestError') {
    // Prisma 数据库错误
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
    
    return res.status(400).json({
      success: false,
      message: '数据库操作失败',
      code: 'DATABASE_ERROR'
    });
  }

  // Multer 错误
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
    return res.status(err.status).json({
      success: false,
      message: err.message,
      code: err.code || 'BUSINESS_ERROR'
    });
  }

  // 默认 500 错误
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : err.message,
    code: 'INTERNAL_ERROR'
  });
};

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
