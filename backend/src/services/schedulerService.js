import cron from 'node-cron';
import reminderService from '../services/reminderService.js';
import logger from '../config/logger.js';

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

        // 更新即将过期的商品（默认3天内）
        const warning = await prisma.product.updateMany({
          where: {
            expiryDate: { gte: today },
            status: 'NORMAL',
            isDeleted: false,
            reminderDays: { gt: 0 }
          },
          data: { status: 'WARNING' }
        });

        logger.info(`Status update completed: ${expired.count} expired, ${warning.count} warning`);
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
