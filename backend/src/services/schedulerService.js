import { calculateRemainingDays } from "../utils/dateUtils.js";
import cron from 'node-cron';
import reminderService from './reminderService.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);


class SchedulerService {
  constructor() {
    this.jobs = [];
  }

  /**
   * 启动所有定时任务
   */
  start() {
    // 每小时整点检查提醒，根据用户设置的提醒时间发送
    const reminderJob = cron.schedule('0 * * * *', async () => {
      // 使用上海时区获取当前时间
      const now = dayjs().tz('Asia/Shanghai');
      const currentHour = now.hour();
      const currentTimeStr = `${String(currentHour).padStart(2, '0')}:00`;
      
      logger.info(`Running scheduled reminder check at ${currentTimeStr}...`);
      
      try {
        // 查找设置了当前时间提醒的用户
        const settings = await prisma.reminderSetting.findMany({
          where: {
            enabled: true,
            reminderTime: currentTimeStr
          },
          include: {
            user: true
          }
        });

        if (settings.length === 0) {
          logger.info(`No users configured for ${currentTimeStr} reminder`);
          return;
        }

        logger.info(`Found ${settings.length} users for ${currentTimeStr} reminder`);
        
        // 为每个用户发送提醒
        for (const setting of settings) {
          try {
            await reminderService.sendReminder(setting.userId, setting.user.role);
          } catch (error) {
            logger.error(`Failed to send reminder to user ${setting.userId}:`, error);
          }
        }
      } catch (error) {
        logger.error('Scheduled reminder job failed:', error);
      }
    }, {
      timezone: 'Asia/Shanghai'
    });

    this.jobs.push({ name: 'reminder', job: reminderJob });
    logger.info('Scheduler started: reminder job runs hourly at :00');

    // 每天凌晨 00:05 更新商品状态
    const statusUpdateJob = cron.schedule('5 0 * * *', async () => {
      logger.info('Running scheduled status update job...');
      try {

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

        // 获取所有未过期的商品（NORMAL 和 WARNING 都需要检查）
        const products = await prisma.product.findMany({
          where: {
            expiryDate: { gte: today },
            status: { in: ['NORMAL', 'WARNING'] },
            isDeleted: false,
            reminderDays: { gt: 0 }
          },
          select: {
            id: true,
            expiryDate: true,
            reminderDays: true,
            status: true
          }
        });

        // 筛选出需要标记为 WARNING 的商品
        const warningIds = [];
        const normalIds = [];

        for (const p of products) {
          const expiryDate = new Date(p.expiryDate);
          expiryDate.setHours(0, 0, 0, 0);
          const diffDays = calculateRemainingDays(expiryDate, today);
          
          if (diffDays <= p.reminderDays && p.status !== 'WARNING') {
            warningIds.push(p.id);
          } else if (diffDays > p.reminderDays && p.status !== 'NORMAL') {
            normalIds.push(p.id);
          }
        }

        // 批量更新 WARNING 状态
        let warningCount = 0;
        if (warningIds.length > 0) {
          const warningResult = await prisma.product.updateMany({
            where: { id: { in: warningIds } },
            data: { status: 'WARNING' }
          });
          warningCount = warningResult.count;
        }

        // 批量更新 NORMAL 状态（回滚）
        let normalCount = 0;
        if (normalIds.length > 0) {
          const normalResult = await prisma.product.updateMany({
            where: { id: { in: normalIds } },
            data: { status: 'NORMAL' }
          });
          normalCount = normalResult.count;
        }

        logger.info(`Status update completed: ${expired.count} expired, ${warningCount} warning, ${normalCount} normal (rollback)`);
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
