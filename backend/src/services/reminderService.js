import prisma from '../config/database.js';
import smsService from './smsService.js';
import logger from '../utils/logger.js';
import { startOfDay, addDays, differenceInDays } from 'date-fns';

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

    // 解析 phones JSON
    let phones = [];
    try {
      phones = JSON.parse(setting.phones || '[]');
    } catch (e) {
      phones = [];
    }

    return {
      ...setting,
      phones
    };
  }

  /**
   * 更新提醒设置
   */
  async updateReminderSetting(userId, data) {
    // 将 phones 数组转为 JSON 字符串存储
    const phonesJson = JSON.stringify(data.phones || []);
    
    const setting = await prisma.reminderSetting.upsert({
      where: { userId },
      update: {
        enabled: data.enabled,
        reminderTime: data.reminderTime,
        phones: phonesJson,
        remindBySms: data.remindBySms,
        remindByEmail: data.remindByEmail
      },
      create: {
        userId,
        enabled: data.enabled ?? true,
        reminderTime: data.reminderTime || '09:00',
        phones: phonesJson,
        remindBySms: data.remindBySms ?? true,
        remindByEmail: data.remindByEmail ?? false
      }
    });

    return {
      ...setting,
      phones: data.phones || []
    };
  }

  /**
   * 获取需要提醒的商品 - 根据每个商品的 reminderDays 判断
   */
  async getProductsToRemind(userId) {
    const today = startOfDay(new Date());
    
    // 获取所有未删除、未过期或即将过期的商品
    const products = await prisma.product.findMany({
      where: {
        userId,
        isDeleted: false,
        status: { in: ['NORMAL', 'WARNING'] },
        expiryDate: {
          gte: today
        },
        reminderDays: { gt: 0 }  // 只获取设置了提醒天数的商品
      },
      orderBy: { expiryDate: 'asc' }
    });

    // 根据每个商品自己的 reminderDays 筛选出需要提醒的
    const productsToRemind = products.filter(product => {
      const expiryDate = startOfDay(new Date(product.expiryDate));
      const remindBeforeDate = addDays(today, product.reminderDays);
      
      // 如果过期日期在提醒日期之前（包含等于），则需要提醒
      return expiryDate <= remindBeforeDate;
    });

    return productsToRemind;
  }

  /**
   * 获取即将过期的商品预览（用于前端展示）
   */
  async getUpcomingProducts(userId) {
    const today = startOfDay(new Date());
    
    const products = await prisma.product.findMany({
      where: {
        userId,
        isDeleted: false,
        status: { in: ['NORMAL', 'WARNING'] },
        expiryDate: {
          gte: today
        }
      },
      orderBy: { expiryDate: 'asc' },
      take: 50  // 最多显示50个
    });

    return products.map(product => {
      const daysLeft = differenceInDays(
        startOfDay(new Date(product.expiryDate)),
        today
      );
      return {
        ...product,
        remainingDays: daysLeft
      };
    });
  }

  /**
   * 发送提醒 - 根据每个商品自己的 reminderDays，发送到配置的手机号列表
   */
  async sendReminder(userId) {
    const setting = await this.getReminderSetting(userId);

    // 检查是否启用提醒
    if (!setting.enabled) {
      logger.info(`Reminder disabled for user ${userId}`);
      return { sent: false, reason: 'reminder_disabled' };
    }

    // 检查是否配置了手机号
    const phones = setting.phones || [];
    if (phones.length === 0) {
      logger.info(`No reminder phones configured for user ${userId}`);
      return { sent: false, reason: 'no_phones' };
    }

    const products = await this.getProductsToRemind(userId);

    if (products.length === 0) {
      logger.info(`No products to remind for user ${userId}`);
      return { sent: false, reason: 'no_products' };
    }

    const results = [];
    const today = startOfDay(new Date());

    // 发送短信提醒到所有配置的手机号
    if (setting.remindBySms && smsService.isEnabled()) {
      for (const product of products) {
        try {
          const daysLeft = differenceInDays(
            startOfDay(new Date(product.expiryDate)),
            today
          );

          // 发送到所有配置的手机号
          for (const phone of phones) {
            const result = await smsService.sendExpiryReminder(
              phone,
              product.name,
              daysLeft
            );

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

            results.push({ 
              productId: product.id, 
              phone, 
              success: result.success, 
              daysLeft 
            });
          }
        } catch (error) {
          logger.error(`Failed to send reminder for product ${product.id}:`, error);
          results.push({ productId: product.id, success: false, error: error.message });
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    logger.info(`Reminder sent to user ${userId}: ${successCount}/${results.length} messages`);
    return { sent: true, results, totalProducts: products.length, totalMessages: results.length };
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
