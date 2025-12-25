import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' }
  ]
});

// 记录查询日志
prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`Query: ${e.query} - Params: ${e.params} - Duration: ${e.duration}ms`);
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

export default prisma;
