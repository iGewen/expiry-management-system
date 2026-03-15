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
  const details = {
    method: req.method,
    path: req.path
  };
  
  // 根据不同的操作类型记录不同的详情
  if (req.method === 'POST') {
    // 创建操作
    if (req.path.includes('/products')) {
      details.message = `创建商品: ${req.body?.name || '未知'}`;
      details.created = req.body;
    } else if (req.path.includes('/categories')) {
      details.message = `创建分类: ${req.body?.name || '未知'}`;
      details.created = req.body;
    }
  } else if (req.method === 'PUT') {
    // 更新操作 - 记录修改的字段
    const updateDetails = {};
    const body = req.body;
    
    if (req.path.includes('/products')) {
      if (body.name) updateDetails.name = body.name;
      if (body.categoryId !== undefined) updateDetails.categoryId = body.categoryId;
      if (body.reminderDays !== undefined) updateDetails.reminderDays = body.reminderDays;
      if (body.shelfLife !== undefined) updateDetails.shelfLife = body.shelfLife;
      if (body.productionDate) updateDetails.productionDate = body.productionDate;
      
      details.message = `更新商品 ID: ${req.params?.id}`;
      details.updates = updateDetails;
    } else if (req.path.includes('/categories')) {
      if (body.name) updateDetails.name = body.name;
      if (body.color) updateDetails.color = body.color;
      
      details.message = `更新分类 ID: ${req.params?.id}`;
      details.updates = updateDetails;
    } else if (req.path.includes('/users')) {
      details.message = `更新用户 ID: ${req.params?.id}`;
      details.updates = body;
    }
  } else if (req.method === 'DELETE') {
    // 删除操作
    if (req.path.includes('/products')) {
      details.message = `删除商品 ID: ${req.params?.id}`;
    } else if (req.path.includes('/categories')) {
      details.message = `删除分类 ID: ${req.params?.id}`;
    } else if (req.path.includes('/users')) {
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
    'access_token'
  ];
  
  for (const field of sensitiveFields) {
    if (sanitized[field] !== undefined) {
      sanitized[field] = '***REDACTED***';
    }
  }
  
  return sanitized;
}
