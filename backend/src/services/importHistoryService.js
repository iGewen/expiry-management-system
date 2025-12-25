import prisma from '../config/database.js';

export class ImportHistoryService {
  async createHistory(userId, data) {
    const { filename, totalCount, successCount, failCount, errors } = data;
    
    let status = 'SUCCESS';
    if (failCount === totalCount) {
      status = 'FAILED';
    } else if (failCount > 0) {
      status = 'PARTIAL';
    }

    const history = await prisma.importHistory.create({
      data: {
        userId,
        filename,
        totalCount,
        successCount,
        failCount,
        status,
        errors: errors ? JSON.stringify(errors) : null
      }
    });

    return history;
  }

  async getHistories(userId, filters = {}) {
    const { page = 1, pageSize = 20 } = filters;
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const skip = (pageNum - 1) * pageSizeNum;

    const where = { userId };

    const [histories, total] = await Promise.all([
      prisma.importHistory.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.importHistory.count({ where })
    ]);

    return {
      histories: histories.map(h => ({
        ...h,
        errors: h.errors ? JSON.parse(h.errors) : null
      })),
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum)
    };
  }

  async deleteHistory(id, userId) {
    const history = await prisma.importHistory.findFirst({
      where: { id, userId }
    });

    if (!history) {
      throw new Error('导入记录不存在');
    }

    await prisma.importHistory.delete({
      where: { id }
    });

    return true;
  }
}
