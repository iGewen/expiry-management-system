import prisma from '../config/database.js';
import logger from '../utils/logger.js';

export const logAction = async (req, res, next) => {
  // 保存原始的 res.json 方法
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    // 只记录成功的操作
    if (data.success !== false && req.user) {
      const action = getActionType(req);
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');

      prisma.log.create({
        data: {
          userId: req.user.id,
          action,
          details: JSON.stringify({
            method: req.method,
            path: req.path,
            body: sanitizeBody(req.body)
          }),
          ipAddress,
          userAgent
        }
      }).catch(err => {
        logger.error('Failed to create log:', err);
      });
    }

    return originalJson(data);
  };

  next();
};

function getActionType(req) {
  const { method, path } = req;
  
  if (path.includes('/auth/login')) return 'LOGIN';
  if (path.includes('/auth/logout')) return 'LOGOUT';
  if (path.includes('/auth/register')) return 'REGISTER';
  
  if (path.includes('/products')) {
    if (method === 'POST' && path.includes('/batch')) return 'IMPORT_PRODUCTS';
    if (method === 'POST') return 'CREATE_PRODUCT';
    if (method === 'PUT') return 'UPDATE_PRODUCT';
    if (method === 'DELETE') return 'DELETE_PRODUCT';
    if (method === 'GET') return 'VIEW_PRODUCTS';
  }
  
  if (path.includes('/users')) {
    if (method === 'PUT') return 'UPDATE_USER';
    if (method === 'DELETE') return 'DELETE_USER';
  }
  
  return `${method}_${path.split('/')[2]?.toUpperCase() || 'UNKNOWN'}`;
}

function sanitizeBody(body) {
  if (!body) return {};
  
  const sanitized = { ...body };
  
  // 移除敏感信息
  if (sanitized.password) sanitized.password = '***';
  if (sanitized.oldPassword) sanitized.oldPassword = '***';
  if (sanitized.newPassword) sanitized.newPassword = '***';
  
  return sanitized;
}
