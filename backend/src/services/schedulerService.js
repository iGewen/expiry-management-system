import cron from 'node-cron';
import reminderService from './reminderService.js';
import logger from '../utils/logger.js';

class SchedulerService {
  constructor() {
    this.jobs = [];
  }

  /**
   * 启动所有定时任务
   */
  start() {
    // 每天早上 9:00 发送过期提醒
    const reminderJob = cron.schedule('0 9 * * *', async () => {
      logger.info('Running scheduled reminder job...');
      try {
        await reminderService.sendAllReminders();
      } catch (error) {
        logger.error('Scheduled reminder job failed:', error);
      }
    }, {
      timezone: 'Asia/Shanghai'
    });

    this.jobs.push({ name: 'reminder', job: reminderJob });
    logger.info('Scheduler started: reminder job at 09:00 daily');

    // 每天凌晨 00:05 更新商品状态
    const statusUpdateJob = cron.schedule('5 0 * * *', async () => {
      logger.info('Running scheduled status update job...');
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 更新已过期的商品
        const expired = await prisma.product.updateMany({
          where: {
            expiryDate: { lt: today },
            status: { not: 'EXPIRED' },
            isDeleted: false
          },
          data: { status: 'EXPIRED' }
        });

        // 获取所有正常状态的商品，根据各自的 reminderDays 判断是否设置为 WARNING
        const products = await prisma.product.findMany({
          where: {
            expiryDate: { gte: today },
            status: 'NORMAL',
            isDeleted: false,
            reminderDays: { gt: 0 }
          },
          select: {
            id: true,
            expiryDate: true,
            reminderDays: true
          }
        });

        // 筛选出需要标记为 WARNING 的商品（根据各自 reminderDays）
        const warningIds = products.filter(p => {
          const expiryDate = new Date(p.expiryDate);
          expiryDate.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
          return diffDays <= p.reminderDays;
        }).map(p => p.id);

        // 批量更新 WARNING 状态
        let warningCount = 0;
        if (warningIds.length > 0) {
          const warningResult = await prisma.product.updateMany({
            where: {
              id: { in: warningIds }
            },
            data: { status: 'WARNING' }
          });
          warningCount = warningResult.count;
        }

        logger.info(`Status update completed: ${expired.count} expired, ${warningCount} warning`);
        await prisma.$disconnect();
      } catch (error) {
        logger.error('Scheduled status update job failed:', error);
      }
    }, {
      timezone: 'Asia/Shanghai'
    });

    this.jobs.push({ name: 'statusUpdate', job: statusUpdateJob });
    logger.info('Scheduler started: status update job at 00:05 daily');
  }

  /**
   * 停止所有定时任务
   */
  stop() {
    for (const { name, job } of this.jobs) {
      job.stop();
      logger.info(`Scheduler stopped: ${name}`);
    }
    this.jobs = [];
  }

  /**
   * 获取任务状态
   */
  getStatus() {
    return this.jobs.map(({ name }) => ({ name, running: true }));
  }
}

export default new SchedulerService();
