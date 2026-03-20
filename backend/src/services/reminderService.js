import prisma from '../config/database.js';
import smsService from './smsService.js';
import feishuService from './feishuService.js';
import logger from '../utils/logger.js';
import { dayjs, calculateRemainingDays } from '../utils/dateUtils.js';

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
        remindByEmail: data.remindByEmail,
        feishuEnabled: data.feishuEnabled,
        feishuWebhook: data.feishuWebhook
      },
      create: {
        userId,
        enabled: data.enabled ?? true,
        reminderTime: data.reminderTime || '09:00',
        phones: phonesJson,
        remindBySms: data.remindBySms ?? true,
        remindByEmail: data.remindByEmail ?? false,
        feishuEnabled: data.feishuEnabled ?? false,
        feishuWebhook: data.feishuWebhook
      }
    });

    return {
      ...setting,
      phones: data.phones || []
    };
  }

/**
   * 获取需要提醒的商品 - 获取所有在预警期内且今日未提醒的商品
   * 即：剩余天数 <= 提醒天数，且今天没有发送过提醒
   */
  async getProductsToRemind(userId) {
    const today = dayjs().startOf("day").toDate();
    const todayStart = dayjs().startOf("day").toDate();
    
    // 获取所有预警期内的商品（剩余天数 <= reminderDays）
    const products = await prisma.product.findMany({
      where: {
        userId,
        isDeleted: false,
        status: "WARNING",
        expiryDate: {
          gte: today
        },
        reminderDays: { gt: 0 }
      },
      orderBy: { expiryDate: "asc" }
    });

    if (products.length === 0) {
      return [];
    }

    // 获取今天已提醒的商品ID
    const todayLogs = await prisma.reminderLog.findMany({
      where: {
        userId,
        sentAt: {
          gte: todayStart
        },
        status: "success"
      },
      select: { productId: true }
    });

    const remindedProductIds = new Set(todayLogs.map(log => log.productId));

    // 过滤出今天未提醒的商品
    return products.filter(product => !remindedProductIds.has(product.id));
  }


  /**
   * 获取即将过期的商品预览（用于前端展示）
   */
  async getUpcomingProducts(userId, userRole = 'USER') {
    const today = dayjs().startOf('day').toDate();
    
    // SUPER_ADMIN 可以看到所有用户的商品
    const where = {
      isDeleted: false,
      status: 'WARNING',  // 只显示预警状态的商品
      expiryDate: {
        gte: today
      }
    };
    
    if (userRole !== 'SUPER_ADMIN') {
      where.userId = userId;
    }
    
    const products = await prisma.product.findMany({
      where,
      orderBy: { expiryDate: 'asc' },
      take: 50  // 最多显示50个
    });

    return products.map(product => {
      const remainingDays = calculateRemainingDays(product.expiryDate);
      return {
        ...product,
        remainingDays
      };
    });
  }

  /**
   * 发送提醒 - 统计商品数量，批量发送一条短信
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
    const today = dayjs().startOf('day').toDate();

    // 发送短信提醒到所有配置的手机号
    if (setting.remindBySms && smsService.isEnabled()) {
      // 统计商品数量
      const productCount = products.length;
      
      // 发送到所有配置的手机号
      for (const phone of phones) {
        try {
          const result = await smsService.sendExpiryReminder(phone, productCount);

          // 记录提醒日志（记录本次提醒的商品列表）
          for (const product of products) {
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
          }

          results.push({ 
            phone, 
            success: result.success, 
            productCount 
          });
        } catch (error) {
          logger.error(`Failed to send reminder to ${phone}:`, error);
          results.push({ phone, success: false, error: error.message });
        }
      }
    }

    // 发送飞书提醒
    if (setting.feishuEnabled && setting.feishuWebhook) {
      try {
        // 构建商品详情列表
        const productDetails = products.map(p => {
          const remainingDays = calculateRemainingDays(p.expiryDate);
          return {
            name: p.name,
            remainingDays,
            expiryDate: p.expiryDate
          };
        });

        const feishuResult = await feishuService.sendReminder(
          setting.feishuWebhook,
          productDetails
        );

        // 记录飞书提醒日志
        for (const product of products) {
          await prisma.reminderLog.create({
            data: {
              userId,
              productId: product.id,
              productName: product.name,
              expiryDate: product.expiryDate,
              channel: 'feishu',
              status: feishuResult ? 'success' : 'failed',
              errorMsg: feishuResult ? null : '飞书消息发送失败'
            }
          });
        }

        results.push({
          channel: 'feishu',
          success: feishuResult,
          productCount: products.length
        });

        logger.info(`Feishu reminder sent to user ${userId}: ${feishuResult ? 'success' : 'failed'}`);
      } catch (error) {
        logger.error(`Failed to send Feishu reminder for user ${userId}:`, error);
        results.push({ channel: 'feishu', success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    logger.info(`Reminder sent to user ${userId}: ${successCount}/${phones.length} phones, ${products.length} products`);
    return { 
      sent: true, 
      results, 
      totalProducts: products.length, 
      totalMessages: successCount 
    };
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
