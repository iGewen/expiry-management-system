import prisma from '../config/database.js';
import smsService from './smsService.js';
import logger from '../config/logger.js';
import { subDays, format, isAfter, isBefore, startOfDay, addDays } from 'date-fns';

class ReminderService {
  /**
   * 获取用户提醒设置
   */
  async getReminderSetting(userId) {
    let setting = await prisma.reminderSetting.findUnique({
      where: { userId }
    });

    if (!setting) {
      // 创建默认设置
      setting = await prisma.reminderSetting.create({
        data: { userId }
      });
    }

    return setting;
  }

  /**
   * 更新提醒设置
   */
  async updateReminderSetting(userId, data) {
    const setting = await prisma.reminderSetting.upsert({
      where: { userId },
      update: {
        enabled: data.enabled,
        reminderTime: data.reminderTime,
        advanceDays: data.advanceDays,
        remindBySms: data.remindBySms,
        remindByEmail: data.remindByEmail
      },
      create: {
        userId,
        enabled: data.enabled ?? true,
        reminderTime: data.reminderTime || '09:00',
        advanceDays: data.advanceDays || 3,
        remindBySms: data.remindBySms ?? true,
        remindByEmail: data.remindByEmail ?? false
      }
    });

    return setting;
  }

  /**
   * 获取需要提醒的商品
   */
  async getProductsToRemind(userId, advanceDays) {
    const today = startOfDay(new Date());
    const remindBeforeDate = addDays(today, advanceDays);

    const products = await prisma.product.findMany({
      where: {
        userId,
        isDeleted: false,
        status: { in: ['NORMAL', 'WARNING'] },
        expiryDate: {
          gte: today,
          lte: remindBeforeDate
        }
      },
      orderBy: { expiryDate: 'asc' }
    });

    return products;
  }

  /**
   * 发送提醒
   */
  async sendReminder(userId) {
    const setting = await this.getReminderSetting(userId);

    if (!setting.enabled) {
      logger.info(`Reminder disabled for user ${userId}`);
      return { sent: false, reason: 'reminder_disabled' };
    }

    const products = await this.getProductsToRemind(userId, setting.advanceDays);

    if (products.length === 0) {
      logger.info(`No products to remind for user ${userId}`);
      return { sent: false, reason: 'no_products' };
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.phone) {
      logger.warn(`User ${userId} has no phone number`);
      return { sent: false, reason: 'no_phone' };
    }

    const results = [];

    // 发送短信提醒
    if (setting.remindBySms && smsService.isEnabled()) {
      for (const product of products) {
        try {
          const daysLeft = Math.ceil(
            (new Date(product.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
          );

          const message = `【过期提醒】您有商品"${product.name}"将在${daysLeft}天后过期（${format(new Date(product.expiryDate), 'yyyy-MM-dd')}），请及时处理。`;

          // 使用提醒专用模板（如果没有，使用重置密码模板）
          const result = await smsService.sendCustomMessage(user.phone, message);

          // 记录提醒日志
          await prisma.reminderLog.create({
            data: {
              userId,
              productId: product.id,
              productName: product.name,
              expiryDate: product.expiryDate,
              channel: 'sms',
              status: result.success ? 'success' : 'failed',
              errorMsg: result.error
            }
          });

          results.push({ productId: product.id, success: result.success });
        } catch (error) {
          logger.error(`Failed to send reminder for product ${product.id}:`, error);
          results.push({ productId: product.id, success: false, error: error.message });
        }
      }
    }

    logger.info(`Reminder sent to user ${userId}: ${results.filter(r => r.success).length}/${products.length} products`);
    return { sent: true, results, totalProducts: products.length };
  }

  /**
   * 发送所有用户的提醒（定时任务调用）
   */
  async sendAllReminders() {
    logger.info('Starting scheduled reminder job...');

    // 获取所有启用了提醒的用户
    const settings = await prisma.reminderSetting.findMany({
      where: { enabled: true },
      include: { user: true }
    });

    const results = {
      total: settings.length,
      success: 0,
      failed: 0,
      skipped: 0
    };

    for (const setting of settings) {
      try {
        const result = await this.sendReminder(setting.userId);
        if (result.sent) {
          results.success++;
        } else {
          results.skipped++;
        }
      } catch (error) {
        logger.error(`Failed to send reminder to user ${setting.userId}:`, error);
        results.failed++;
      }
    }

    logger.info(`Reminder job completed: ${JSON.stringify(results)}`);
    return results;
  }

  /**
   * 获取提醒历史
   */
  async getReminderLogs(userId, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      prisma.reminderLog.findMany({
        where: { userId },
        orderBy: { sentAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.reminderLog.count({ where: { userId } })
    ]);

    return {
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }
}

export default new ReminderService();
