import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

// 数据库连接池配置
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' }
  ],
  // 连接池配置
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// 记录查询日志（仅在开发环境）
prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`Query: ${e.query} - Params: ${e.params} - Duration: ${e.duration}ms`);
  }
  
  // 慢查询警告（超过 1 秒）
  if (e.duration > 1000) {
    logger.warn(`Slow query detected (${e.duration}ms): ${e.query}`);
  }
});

// 记录错误日志
prisma.$on('error', (e) => {
  logger.error(`Database error: ${e.message}`);
});

// 记录警告日志
prisma.$on('warn', (e) => {
  logger.warn(`Database warning: ${e.message}`);
});

// 连接健康检查
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
}

// 优雅关闭连接
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

export default prisma;
