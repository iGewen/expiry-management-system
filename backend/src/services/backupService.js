import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import dayjs from "dayjs";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_DIR = path.join(__dirname, '../../backups');

// 备份文件名正则：backup-YYYY-MM-DDTHH-MM-SS-mmmZ.json
const BACKUP_FILENAME_PATTERN = /^backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.json$/;

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * 验证并安全获取备份文件路径
 * @param {string} filename - 备份文件名
 * @returns {string|null} - 安全的文件路径，验证失败返回 null
 */
function getSafeBackupPath(filename) {
  // 1. 检查文件名格式
  if (!BACKUP_FILENAME_PATTERN.test(filename)) {
    logger.warn(`Invalid backup filename format: ${filename}`);
    return null;
  }
  
  // 2. 使用 path.basename 确保文件名不包含路径分隔符
  const safeName = path.basename(filename);
  if (safeName !== filename) {
    logger.warn(`Path traversal attempt detected: ${filename}`);
    return null;
  }
  
  // 3. 构建完整路径
  const filepath = path.join(BACKUP_DIR, safeName);
  
  // 4. 解析真实路径并验证
  const resolvedPath = path.resolve(filepath);
  if (!resolvedPath.startsWith(BACKUP_DIR + path.sep)) {
    logger.warn(`Path escape attempt detected: ${filename}`);
    return null;
  }
  
  // 5. 检查文件是否存在
  if (!fs.existsSync(resolvedPath)) {
    return null;
  }
  
  return resolvedPath;
}

class BackupService {
  /**
   * 创建备份
   */
  async createBackup(userId, userRole) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    // 获取用户数据
    const where = userRole === 'SUPER_ADMIN' ? {} : { userId };
    const productWhere = userRole === 'SUPER_ADMIN' ? { isDeleted: false } : { userId, isDeleted: false };

    const [products, categories, reminderSettings, importHistory] = await Promise.all([
      prisma.product.findMany({
        where: productWhere,
        include: { category: true }
      }),
      prisma.category.findMany({ where }),
      prisma.reminderSetting.findMany({ where }),
      prisma.importHistory.findMany({ where })
    ]);

    const backup = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      createdBy: userId,
      data: {
        products: products.map(p => ({
          name: p.name,
          barcode: p.barcode,
          productionDate: p.productionDate,
          shelfLife: p.shelfLife,
          expiryDate: p.expiryDate,
          reminderDays: p.reminderDays,
          categoryId: p.categoryId,
          categoryName: p.category?.name
        })),
        categories: categories.map(c => ({
          name: c.name,
          description: c.description
        })),
        reminderSettings: reminderSettings.map(r => ({
          enabled: r.enabled,
          reminderTime: r.reminderTime,
          phones: r.phones,
          remindBySms: r.remindBySms,
          feishuEnabled: r.feishuEnabled,
          feishuWebhook: r.feishuWebhook
        })),
        importHistory: importHistory.map(h => ({
          filename: h.filename,
          totalCount: h.totalCount,
          successCount: h.successCount,
          failedCount: h.failedCount,
          createdAt: h.createdAt
        }))
      },
      stats: {
        products: products.length,
        categories: categories.length
      }
    };

    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

    logger.info(`Backup created: ${filename} by user ${userId}`);

    return {
      filename,
      filepath,
      size: fs.statSync(filepath).size,
      stats: backup.stats
    };
  }

  /**
   * 获取备份列表
   */
  async getBackupList() {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => BACKUP_FILENAME_PATTERN.test(f))
      .map(f => {
        const filepath = path.join(BACKUP_DIR, f);
        const stats = fs.statSync(filepath);
        return {
          filename: f,
          size: stats.size,
          createdAt: stats.birthtime
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return files;
  }

  /**
   * 恢复备份
   */
  async restoreBackup(userId, filename) {
    const filepath = getSafeBackupPath(filename);
    
    if (!filepath) {
      throw new Error('备份文件不存在或文件名非法');
    }

    const backup = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    if (!backup.data) {
      throw new Error('无效的备份文件格式');
    }

    // 使用事务恢复数据
    const result = await prisma.$transaction(async (tx) => {
      let productsRestored = 0;
      let categoriesRestored = 0;

      // 恢复分类（先检查是否已存在）
      for (const cat of backup.data.categories || []) {
        const existing = await tx.category.findFirst({
          where: { userId, name: cat.name }
        });

        if (!existing) {
          await tx.category.create({
            data: {
              name: cat.name,
              description: cat.description,
              userId
            }
          });
          categoriesRestored++;
        }
      }

      // 获取当前用户的分类映射
      const userCategories = await tx.category.findMany({ where: { userId } });
      const categoryMap = new Map(userCategories.map(c => [c.name, c.id]));

      // 恢复商品
      for (const product of backup.data.products || []) {
        // 检查是否已存在相同商品
        const existing = await tx.product.findFirst({
          where: {
            userId,
            name: product.name,
            productionDate: new Date(product.productionDate)
          }
        });

        if (!existing) {
          await tx.product.create({
            data: {
              name: product.name,
              barcode: product.barcode,
              productionDate: new Date(product.productionDate),
              shelfLife: product.shelfLife,
              expiryDate: new Date(product.expiryDate),
              reminderDays: product.reminderDays,
              categoryId: categoryMap.get(product.categoryName) || null,
              userId,
              status: this.calculateStatus(new Date(product.productionDate), product.shelfLife, product.reminderDays)
            }
          });
          productsRestored++;
        }
      }

      // 恢复提醒设置
      if (backup.data.reminderSettings?.length > 0) {
        const setting = backup.data.reminderSettings[0];
        await tx.reminderSetting.upsert({
          where: { userId },
          update: {
            enabled: setting.enabled,
            reminderTime: setting.reminderTime,
            phones: setting.phones,
            remindBySms: setting.remindBySms,
            feishuEnabled: setting.feishuEnabled,
            feishuWebhook: setting.feishuWebhook
          },
          create: {
            userId,
            enabled: setting.enabled,
            reminderTime: setting.reminderTime,
            phones: setting.phones,
            remindBySms: setting.remindBySms,
            feishuEnabled: setting.feishuEnabled,
            feishuWebhook: setting.feishuWebhook
          }
        });
      }

      return { productsRestored, categoriesRestored };
    });

    logger.info(`Backup restored: ${filename} by user ${userId}`);

    return result;
  }

  /**
   * 删除备份
   */
  async deleteBackup(filename) {
    const filepath = getSafeBackupPath(filename);
    
    if (!filepath) {
      throw new Error('备份文件不存在或文件名非法');
    }

    fs.unlinkSync(filepath);
    logger.info(`Backup deleted: ${filename}`);

    return true;
  }

  /**
   * 下载备份文件
   */
  getBackupFilePath(filename) {
    return getSafeBackupPath(filename);
  }

  /**
   * 从上传的JSON内容恢复备份
   */
  async restoreFromJson(userId, jsonData) {
    let backup;
    
    try {
      backup = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    } catch (_e) { // eslint-disable-line no-unused-vars
      throw new Error('无效的JSON格式');
    }

    if (!backup.data) {
      throw new Error('无效的备份文件格式');
    }

    // 使用事务恢复数据
    const result = await prisma.$transaction(async (tx) => {
      let productsRestored = 0;
      let categoriesRestored = 0;

      // 恢复分类（先检查是否已存在）
      for (const cat of backup.data.categories || []) {
        const existing = await tx.category.findFirst({
          where: { userId, name: cat.name }
        });

        if (!existing) {
          await tx.category.create({
            data: {
              name: cat.name,
              description: cat.description,
              userId
            }
          });
          categoriesRestored++;
        }
      }

      // 获取当前用户的分类映射
      const userCategories = await tx.category.findMany({ where: { userId } });
      const categoryMap = new Map(userCategories.map(c => [c.name, c.id]));

      // 恢复商品
      for (const product of backup.data.products || []) {
        // 检查是否已存在相同商品
        const existing = await tx.product.findFirst({
          where: {
            userId,
            name: product.name,
            productionDate: new Date(product.productionDate)
          }
        });

        if (!existing) {
          await tx.product.create({
            data: {
              name: product.name,
              barcode: product.barcode,
              productionDate: new Date(product.productionDate),
              shelfLife: product.shelfLife,
              expiryDate: new Date(product.expiryDate),
              reminderDays: product.reminderDays,
              categoryId: categoryMap.get(product.categoryName) || null,
              userId,
              status: this.calculateStatus(new Date(product.productionDate), product.shelfLife, product.reminderDays)
            }
          });
          productsRestored++;
        }
      }

      // 恢复提醒设置
      if (backup.data.reminderSettings?.length > 0) {
        const setting = backup.data.reminderSettings[0];
        await tx.reminderSetting.upsert({
          where: { userId },
          update: {
            enabled: setting.enabled,
            reminderTime: setting.reminderTime,
            phones: setting.phones,
            remindBySms: setting.remindBySms,
            feishuEnabled: setting.feishuEnabled,
            feishuWebhook: setting.feishuWebhook
          },
          create: {
            userId,
            enabled: setting.enabled,
            reminderTime: setting.reminderTime,
            phones: setting.phones,
            remindBySms: setting.remindBySms,
            feishuEnabled: setting.feishuEnabled,
            feishuWebhook: setting.feishuWebhook
          }
        });
      }

      return { productsRestored, categoriesRestored };
    });

    logger.info(`Backup restored from upload by user ${userId}`);

    return result;
  }

  /**
   * 计算商品状态
   */
  calculateStatus(productionDate, shelfLife, reminderDays) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiryDate = new Date(productionDate);
    expiryDate.setDate(expiryDate.getDate() + shelfLife - 1);
    expiryDate.setHours(0, 0, 0, 0);
    
    const daysLeft = dayjs(expiryDate).startOf("day").diff(dayjs(today).startOf("day"), "day");
    
    if (daysLeft < 0) return 'EXPIRED';
    if (daysLeft <= (reminderDays || 3)) return 'WARNING';
    return 'NORMAL';
  }
}

export default new BackupService();
