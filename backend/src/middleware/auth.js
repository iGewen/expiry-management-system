import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * 认证中间件 - 验证 JWT Token
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌',
        code: 'AUTH_TOKEN_MISSING'
      });
    }

    // 验证 Bearer 格式
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: '认证令牌格式错误',
        code: 'AUTH_TOKEN_INVALID_FORMAT'
      });
    }
    
    const token = parts[1];

    // 验证 Token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // 查询用户（使用缓存优化）
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        phone: true,
        email: true,
        avatar: true,
        feishuOpenId: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true
        lastLoginIp: true,
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在',
        code: 'AUTH_USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: '账号已禁用，请联系管理员',
        code: 'AUTH_ACCOUNT_DISABLED'
      });
    }

    // 将用户信息附加到请求对象
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '令牌已过期',
        code: 'AUTH_TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的令牌',
        code: 'AUTH_TOKEN_INVALID'
      });
    }
    
    logger.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: '认证失败',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * 授权中间件 - 验证用户角色
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt: User ${req.user.id} (${req.user.role}) tried to access resource requiring ${roles.join(', ')}`);
      
      return res.status(403).json({
        success: false,
        message: '权限不足',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};

/**
 * 可选认证中间件 - 如果有 token 则解析，没有也继续
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }
    
    const token = parts[1];
    const decoded = jwt.verify(token, config.jwt.secret);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        phone: true,
        email: true,
        avatar: true,
        feishuOpenId: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true
        lastLoginIp: true,
      }
    });

    if (user && user.isActive) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // 可选认证失败不阻止请求
    next();
  }
};
