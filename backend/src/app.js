import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { config } from './config/index.js';
import { initRedis, closeRedis } from './config/redis.js';
import logger, { requestLogger } from './utils/logger.js';
import prisma, { checkDatabaseHealth, disconnectDatabase } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/validation.js';

// 路由
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import userRoutes from './routes/users.js';
import logRoutes from './routes/logs.js';
import importHistoryRoutes from './routes/importHistory.js';
import categoryRoutes from './routes/category.js';
import reminderRoutes from './routes/reminder.js';
import backupRoutes from './routes/backup.js';
import feishuRoutes from './routes/feishu.js';
import schedulerService from './services/schedulerService.js';

const app = express();

// 安全中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS 配置
app.use(cors({
  origin: (origin, callback) => {
    // 允许无 origin 的请求（如移动应用、Postman）
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = config.cors.origin.split(',').map(o => o.trim());
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 响应压缩（仅生产环境）
if (config.env === 'production') {
  app.use(compression({
    level: 6, // 压缩级别 1-9，6是平衡点
    filter: (req, res) => {
      // 不压缩已经压缩的内容
      if (req.headers['x-no-compression']) {
        return false;
      }
      // 仅压缩响应体 > 1KB 的请求
      if (res.getHeader('Content-Length') && parseInt(res.getHeader('Content-Length')) < 1024) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024 // 只有超过1KB才压缩
  }));
}

// HTTP 请求日志
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(requestLogger);
}

// 速率限制
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
  // 使用 IP + 用户代理作为键（防止 IP 欺骗）
  keyGenerator: (req) => {
    return req.ip + req.headers['user-agent'];
  }
});

app.use('/api/', limiter);

// 登录速率限制（更严格）
const loginLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.loginMax,
  message: '登录尝试次数过多，请15分钟后再试',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false
});

// 短信发送速率限制
const smsLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.smsMax,
  message: '发送验证码过于频繁，请15分钟后再试',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/sms', smsLimiter);

// 健康检查（增强版）
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // 检查数据库连接
    const dbHealth = await checkDatabaseHealth();
    
    const response = {
      status: dbHealth.status === 'healthy' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: config.env,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: dbHealth,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        }
      },
      responseTime: `${Date.now() - startTime}ms`
    };
    
    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
      error: error.message
    });
  }
});

// API 文档端点
app.get('/api', (req, res) => {
  res.json({
    name: '商品保质期管理系统 API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': '用户注册',
        'POST /api/auth/login': '用户登录',
        'POST /api/auth/refresh': '刷新令牌',
        'POST /api/auth/change-password': '修改密码',
        'POST /api/auth/reset-password': '重置密码',
        'GET /api/auth/me': '获取当前用户信息'
      },
      products: {
        'GET /api/products': '获取商品列表',
        'GET /api/products/:id': '获取商品详情',
        'POST /api/products': '创建商品',
        'PUT /api/products/:id': '更新商品',
        'DELETE /api/products/:id': '删除商品',
        'POST /api/products/batch-delete': '批量删除',
        'POST /api/products/import': '批量导入',
        'GET /api/products/export': '导出数据',
        'GET /api/products/template': '下载导入模板',
        'GET /api/products/statistics': '获取统计数据'
      },
      users: {
        'GET /api/users': '获取用户列表（管理员）',
        'GET /api/users/:id': '获取用户详情',
        'PUT /api/users/:id': '更新用户信息',
        'PUT /api/users/:id/status': '更新用户状态',
        'PUT /api/users/:id/role': '更新用户角色',
        'PUT /api/users/:id/reset-password': '重置用户密码'
      },
      logs: {
        'GET /api/logs': '获取日志列表',
        'GET /api/logs/actions': '获取操作类型列表',
        'DELETE /api/logs': '清空日志'
      },
      importHistory: {
        'GET /api/import-history': '获取导入历史',
        'GET /api/import-history/:id': '获取导入详情'
      }
    }
  });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/auth/feishu', feishuRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/import-history', importHistoryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/backup', backupRoutes);

// 404 处理
app.use(notFoundHandler);

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
const PORT = config.port;

// 初始化 Redis
initRedis();

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${config.env} mode`);
  logger.info(`🚀 Server is running on http://localhost:${PORT}`);
  logger.info(`📝 API Documentation: http://localhost:${PORT}/api`);
  logger.info(`❤️ Health Check: http://localhost:${PORT}/health`);
  
  // 启动定时任务
  schedulerService.start();
});

// 优雅关闭
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, closing server gracefully`);
  
  server.close(async () => {
    logger.info('Server closed');
    await closeRedis();
    await disconnectDatabase();
    process.exit(0);
  });

  // 强制退出超时
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
