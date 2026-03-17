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
      
      // 构建详细的日志内容
      const logDetails = buildLogDetails(req, data);

      prisma.log.create({
        data: {
          userId: req.user.id,
          action,
          details: JSON.stringify(logDetails),
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

function buildLogDetails(req, responseData) {
  const fullPath = req.originalUrl || req.url;
  const details = {
    method: req.method,
    path: fullPath
  };
  
  // 根据不同的操作类型记录不同的详情（使用脱敏后的请求体）
  const sanitizedBody = sanitizeBody(req.body);
  
  if (req.method === 'POST') {
    // 创建操作
    if (fullPath.includes('/products')) {
      details.message = `创建商品: ${sanitizedBody?.name || '未知'}`;
      details.created = sanitizedBody;
    } else if (fullPath.includes('/categories')) {
      details.message = `创建分类: ${sanitizedBody?.name || '未知'}`;
      details.created = sanitizedBody;
    }
  } else if (req.method === 'PUT') {
    // 更新操作 - 记录修改的字段
    const updateDetails = {};
    const body = sanitizedBody;
    
    if (fullPath.includes('/products')) {
      if (body.name) updateDetails.name = body.name;
      if (body.categoryId !== undefined) updateDetails.categoryId = body.categoryId;
      if (body.reminderDays !== undefined) updateDetails.reminderDays = body.reminderDays;
      if (body.shelfLife !== undefined) updateDetails.shelfLife = body.shelfLife;
      if (body.productionDate) updateDetails.productionDate = body.productionDate;
      
      details.message = `更新商品 ID: ${req.params?.id}`;
      details.updates = updateDetails;
    } else if (fullPath.includes('/categories')) {
      if (body.name) updateDetails.name = body.name;
      if (body.color) updateDetails.color = body.color;
      
      details.message = `更新分类 ID: ${req.params?.id}`;
      details.updates = updateDetails;
    } else if (fullPath.includes('/users')) {
      details.message = `更新用户 ID: ${req.params?.id}`;
      details.updates = body;
    }
  } else if (req.method === 'DELETE') {
    // 删除操作
    if (fullPath.includes('/products')) {
      details.message = `删除商品 ID: ${req.params?.id}`;
    } else if (fullPath.includes('/categories')) {
      details.message = `删除分类 ID: ${req.params?.id}`;
    } else if (fullPath.includes('/users')) {
      details.message = `删除用户 ID: ${req.params?.id}`;
    }
  }
  
  // 添加响应信息
  if (responseData?.message) {
    details.responseMessage = responseData.message;
  }
  
  return details;
}

function getActionType(req) {
  // 使用 originalUrl 获取完整路径（包含挂载路径）
  const fullPath = req.originalUrl || req.url;
  const { method } = req;
  
  if (fullPath.includes('/auth/login')) return 'LOGIN';
  if (fullPath.includes('/auth/logout')) return 'LOGOUT';
  if (fullPath.includes('/auth/register')) return 'REGISTER';
  
  if (fullPath.includes('/products')) {
    if (method === 'POST' && fullPath.includes('/batch/delete')) return 'DELETE_PRODUCTS';
    if (method === 'POST' && fullPath.includes('/batch/update')) return 'UPDATE_PRODUCTS';
    if (method === 'POST' && fullPath.includes('/batch/import')) return 'IMPORT_PRODUCTS';
    if (method === 'POST') return 'CREATE_PRODUCT';
    if (method === 'PUT') return 'UPDATE_PRODUCT';
    if (method === 'DELETE') return 'DELETE_PRODUCT';
    if (method === 'GET') return 'VIEW_PRODUCTS';
  }
  
  if (fullPath.includes('/categories')) {
    if (method === 'POST') return 'CREATE_CATEGORY';
    if (method === 'PUT') return 'UPDATE_CATEGORY';
    if (method === 'DELETE') return 'DELETE_CATEGORY';
    if (method === 'GET') return 'VIEW_CATEGORIES';
  }
  
  if (fullPath.includes('/users')) {
    if (method === 'PUT') return 'UPDATE_USER';
    if (method === 'DELETE') return 'DELETE_USER';
  }
  
  if (fullPath.includes('/reminders')) {
    if (method === 'POST' && fullPath.includes('/trigger')) return 'TRIGGER_REMINDER';
    if (method === 'PUT') return 'UPDATE_REMINDER_SETTING';
    if (method === 'GET') return 'VIEW_REMINDERS';
  }
  
  if (fullPath.includes('/backup')) {
    if (method === 'POST' && fullPath.includes('/restore')) return 'RESTORE_BACKUP';
    if (method === 'POST') return 'CREATE_BACKUP';
    if (method === 'DELETE') return 'DELETE_BACKUP';
    if (method === 'GET') return 'VIEW_BACKUPS';
  }
  
  return `${method}_ACTION`;
}

/**
 * 对请求体进行脱敏处理，移除敏感字段
 * @param {Object} body - 原始请求体
 * @returns {Object} 脱敏后的请求体
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return {};
  
  const sanitized = { ...body };
  
  // 移除所有敏感字段
  const sensitiveFields = [
    'password',
    'oldPassword',
    'newPassword',
    'confirmPassword',
    'token',
    'refreshToken',
    'authorization',
    'secret',
    'apiKey',
    'api_key',
    'accessToken',
    'access_token',
    'accessKeyId',
    'accessKeySecret',
    'appSecret',
    'app_secret'
  ];
  
  for (const field of sensitiveFields) {
    if (sanitized[field] !== undefined) {
      sanitized[field] = '***REDACTED***';
    }
  }
  
  return sanitized;
}
