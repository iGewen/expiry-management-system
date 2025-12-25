import prisma from '../config/database.js';
import dayjs from 'dayjs';

export class LogService {
  async getLogs(userId, userRole, filters = {}) {
    const { page = 1, pageSize = 20, startDate, endDate, action, searchUserId } = filters;
    // 确保 page 和 pageSize 是数字类型
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const skip = (pageNum - 1) * pageSizeNum;

    const where = {};

    // 普通用户只能查看自己的日志
    if (userRole === 'USER') {
      where.userId = userId;
    } else if (searchUserId) {
      // 管理员可以筛选特定用户的日志
      where.userId = parseInt(searchUserId);
    }

    // 日期范围筛选
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // 操作类型筛选
    if (action) {
      where.action = action;
    }

    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true
            }
          }
        }
      }),
      prisma.log.count({ where })
    ]);

    return {
      logs: logs.map(log => ({
        id: log.id,
        userId: log.userId,
        username: log.user?.username || 'Unknown',
        userRole: log.user?.role || 'USER',
        action: log.action,
        details: log.details,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt
      })),
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum)
    };
  }

  async clearLogs(beforeDate) {
    const result = await prisma.log.deleteMany({
      where: {
        createdAt: {
          lt: new Date(beforeDate)
        }
      }
    });

    return result.count;
  }

  async getActionTypes() {
    const logs = await prisma.log.findMany({
      select: {
        action: true
      },
      distinct: ['action']
    });

    return logs.map(log => log.action);
  }
}
