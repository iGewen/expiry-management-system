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
import { apiLimiter, loginLimiter, smsLimiter, createLimiter } from './middleware/rateLimiter.js';

// 创建 Express 应用
const app = express();

// 信任代理（Docker/Nginx 环境）
app.set('trust proxy', 1);

// 数据库迁移（生产环境自动执行）
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

const runMigrations = async () => {
  // 仅在生产环境且非调试模式时自动迁移
  if (process.env.NODE_ENV === 'production' && process.env.SKIP_MIGRATION !== 'true') {
    try {
      logger.info('Running database migrations...');
      
      // 使用异步执行，设置超时时间
      const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
        cwd: path.join(process.cwd()),
        timeout: 30000, // 30秒超时
        env: { ...process.env }
      });
      
      if (stdout) logger.info(stdout);
      if (stderr) logger.warn(stderr);
      
      logger.info('Database migrations completed successfully');
    } catch (error) {
      logger.error('Database migration failed:', error.message);
      
      // 记录详细错误信息
      if (error.stdout) logger.error('Migration stdout:', error.stdout);
      if (error.stderr) logger.error('Migration stderr:', error.stderr);
      
      // 迁移失败但不阻塞启动（改为警告）
      // 允许应用启动，但记录错误供运维排查
      logger.warn('⚠️  Database migration failed, but application will continue to start.');
      logger.warn('⚠️  Please check database connection and migration status manually.');
      
      // 如果是超时错误，提供更明确的提示
      if (error.killed) {
        logger.error('Migration process timed out after 30 seconds');
      }
    }
  }
};

// 启动时运行迁移（异步）
runMigrations().catch(err => {
  logger.error('Migration startup error:', err);
});

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

// 安全中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS 配置
app.use(apiLimiter);
app.use(cors({
  origin: (origin, callback) => {
    // 允许无 origin 的请求（如移动应用、Postman）
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = config.cors.origin.split(',').map(o => o.trim());
    
    // 如果配置了 '*'，动态返回请求的origin（支持credentials）
    if (allowedOrigins.includes('*')) {
      return callback(null, origin);
    }
    
    if (allowedOrigins.includes(origin)) {
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
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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
