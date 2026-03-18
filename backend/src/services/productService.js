import { calculateExpiryDate, calculateRemainingDays, calculateStatus } from "../utils/dateUtils.js";
import prisma from '../config/database.js';
import dayjs from 'dayjs';

import { store } from '../config/redis.js';

const PRODUCT_LIST_CACHE_TTL = 30; // 商品列表缓存30秒
const STATS_CACHE_TTL = 60; // 统计数据缓存60秒

export class ProductService {
  /**
   * 计算商品状态
   */
  calculateStatus(productionDate, shelfLife, reminderDays) {
    const expiryDate = dayjs(productionDate).add(shelfLife, 'day');
    const remainingDays = expiryDate.diff(dayjs(), 'day');
    
    if (remainingDays <= 0) {
      return 'EXPIRED';
    } else if (remainingDays <= reminderDays) {
      return 'WARNING';
    }
    return 'NORMAL';
  }
  
  /**
   * 计算过期日期
   */
  calculateExpiryDate(productionDate, shelfLife) {
    return dayjs(productionDate).add(shelfLife, 'day').toDate();
  }

  /**
   * 清除商品列表缓存（通过增加版本号）
   */
  async invalidateProductsCache(userId) {
    const currentVersion = await store.get(`products:version:${userId}`) || 0;
    await store.set(`products:version:${userId}`, currentVersion + 1, 3600); // 版本号缓存1小时
  }

  /**
   * 创建商品
   */
  async createProduct(userId, productData) {
    const { name, productionDate, shelfLife, reminderDays, categoryId, barcode } = productData;
    
    // 验证数据
    if (!name || !productionDate || !shelfLife) {
      throw new Error('缺少必需的商品信息');
    }
    
    const productionDateObj = new Date(productionDate);
    const expiryDate = this.calculateExpiryDate(productionDateObj, shelfLife);
    const status = this.calculateStatus(productionDateObj, shelfLife, reminderDays || 3);
    
    const product = await prisma.product.create({
      data: {
        name,
        barcode: barcode || null,
        productionDate: productionDateObj,
        shelfLife,
        expiryDate,
        reminderDays: reminderDays || 3,
        status,
        userId,
        categoryId: categoryId || null
      },
      include: {
        category: true
      }
    });
    
    // 清除商品列表缓存
    await this.invalidateProductsCache(userId);

    return this.formatProduct(product);
  }

  /**
   * 获取商品列表 - 优化版本，使用数据库查询而非内存过滤
   */
  async getProducts(userId, userRole, filters = {}) {
    const { page = 1, pageSize = 20, name, status, categoryId, startDate, endDate, searchUserId, exportAll } = filters;
    
    // 参数验证和规范化
    let pageNum = parseInt(page, 10);
    let pageSizeNum = parseInt(pageSize, 10);
    
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    if (isNaN(pageSizeNum) || pageSizeNum < 1) pageSizeNum = 20;
    
    // 导出模式或 exportAll=true 时不限制数量，否则限制最大为 100
    const isExportAll = exportAll === 'true' || exportAll === true;
    if (!isExportAll && pageSizeNum > 100) pageSizeNum = 100;
    
    // 导出模式不使用缓存
    if (!isExportAll) {
      // 尝试从缓存获取（检查缓存版本）
      const cacheVersion = await store.get(`products:version:${userId}`) || 0;
      const cacheKey = `products:${userId}:${cacheVersion}:${pageNum}:${pageSizeNum}:${name || ''}:${status || ''}:${categoryId || ''}:${startDate || ''}:${endDate || ''}`;
      const cached = await store.get(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const skip = (pageNum - 1) * pageSizeNum;
  
    // 构建基础查询条件
    const where = {
      isDeleted: false
    };
  
    // 权限过滤
    if (userRole === 'SUPER_ADMIN') {
      if (searchUserId) {
        const parsedUserId = parseInt(searchUserId, 10);
        if (!isNaN(parsedUserId) && parsedUserId > 0) {
          where.userId = parsedUserId;
        }
      }
    } else {
      where.userId = userId;
    }
  
    // 名称搜索（模糊匹配）
    if (name) {
      where.name = { contains: name };
    }

    // 分类筛选
    if (categoryId) {
      const parsedCategoryId = parseInt(categoryId, 10);
      if (!isNaN(parsedCategoryId) && parsedCategoryId > 0) {
        // SUPER_ADMIN 按分类名称查询（查找所有同名分类的商品）
        if (userRole === 'SUPER_ADMIN') {
          const category = await prisma.category.findUnique({
            where: { id: parsedCategoryId },
            select: { name: true }
          });
          if (category) {
            const sameNameCategories = await prisma.category.findMany({
              where: { name: category.name },
              select: { id: true }
            });
            where.categoryId = { in: sameNameCategories.map(c => c.id) };
          }
        } else {
          where.categoryId = parsedCategoryId;
        }
      }
    }

    // 日期范围筛选
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59');
    }
  
    // 状态筛选 - 由于状态需要实时计算，改为内存筛选
    const includeOptions = {
      category: true,
      ...(userRole === 'SUPER_ADMIN' ? {
        user: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      } : {})
    };

    // 先获取所有符合条件的商品（优化查询，仅返回必要字段）
    const allProducts = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        barcode: true,
        productionDate: true,
        shelfLife: true,
        expiryDate: true,
        reminderDays: true,
        categoryId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        category: includeOptions.category ? {
          select: {
            id: true,
            name: true,
            color: true
          }
        } : false,
        ...(userRole === 'SUPER_ADMIN' ? {
          user: {
            select: {
              id: true,
              username: true,
              role: true
            }
          }
        } : {})
      }
    });

    // 格式化并计算状态
    let formattedProducts = allProducts.map(p => this.formatProduct(p, userRole));

    // 如果有状态筛选，在内存中过滤
    if (status) {
      const statusArray = status.split(',').map(s => s.trim().toUpperCase());
      const validStatuses = ['NORMAL', 'WARNING', 'EXPIRED'];
      const filteredStatuses = statusArray.filter(s => validStatuses.includes(s));
      
      if (filteredStatuses.length > 0) {
        formattedProducts = formattedProducts.filter(p => filteredStatuses.includes(p.status));
      }
    }

    // 计算总数
    const total = formattedProducts.length;

    // 分页 - 导出全部时返回所有数据
    let paginatedProducts;
    if (isExportAll) {
      paginatedProducts = formattedProducts;
    } else {
      paginatedProducts = formattedProducts.slice(skip, skip + pageSizeNum);
    }

    const result = {
      products: paginatedProducts,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum)
    };
    
    // 缓存结果（非导出模式）
    if (!isExportAll) {
      const cacheVersion = await store.get(`products:version:${userId}`) || 0;
      const cacheKey = `products:${userId}:${cacheVersion}:${pageNum}:${pageSizeNum}:${name || ''}:${status || ''}:${categoryId || ''}:${startDate || ''}:${endDate || ''}`;
      await store.set(cacheKey, result, PRODUCT_LIST_CACHE_TTL);
    }

    return result;
  }

  /**
   * 根据 ID 获取商品
   */
  async getProductById(id, userId, userRole) {
    const where = {
      id,
      isDeleted: false
    };

    if (userRole !== 'SUPER_ADMIN') {
      where.userId = userId;
    }

    const includeUser = userRole === 'SUPER_ADMIN' ? {
      user: {
        select: {
          id: true,
          username: true,
          role: true
        }
      }
    } : {};

    const product = await prisma.product.findFirst({
      where,
      include: includeUser
    });

    if (!product) {
      throw new Error('商品不存在');
    }

    return this.formatProduct(product, userRole);
  }

  /**
   * 更新商品
   */
  async updateProduct(id, userId, userRole, productData) {
    const { name, productionDate, shelfLife, reminderDays, categoryId, barcode } = productData;

    const where = {
      id,
      isDeleted: false
    };

    if (userRole !== 'SUPER_ADMIN') {
      where.userId = userId;
    }

    const product = await prisma.product.findFirst({
      where
    });

    if (!product) {
      throw new Error('商品不存在');
    }

    // 如果更新了日期或保质期，重新计算状态和过期日期
    let updateData = { name };
    
    if (productionDate || shelfLife) {
      const newProductionDate = productionDate ? new Date(productionDate) : product.productionDate;
      const newShelfLife = shelfLife || product.shelfLife;
      
      updateData.productionDate = newProductionDate;
      updateData.shelfLife = newShelfLife;
      updateData.expiryDate = this.calculateExpiryDate(newProductionDate, newShelfLife);
      updateData.status = this.calculateStatus(newProductionDate, newShelfLife, reminderDays || product.reminderDays);
    }
    
    if (reminderDays !== undefined) {
      updateData.reminderDays = reminderDays;
      // 重新计算状态（因为提醒天数可能影响状态）
      if (!productionDate && !shelfLife) {
        updateData.status = this.calculateStatus(product.productionDate, product.shelfLife, reminderDays);
      }
    }

    // 更新分类和条码
    if (categoryId !== undefined) {
      updateData.categoryId = categoryId || null;
    }
    if (barcode !== undefined) {
      updateData.barcode = barcode || null;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true
      }
    });
    
    // 清除商品列表缓存
    await this.invalidateProductsCache(product.userId);

    return this.formatProduct(updated, userRole);
  }

  /**
   * 删除商品（软删除）
   */
  async deleteProduct(id, userId, userRole) {
    const where = {
      id,
      isDeleted: false
    };

    if (userRole !== 'SUPER_ADMIN') {
      where.userId = userId;
    }

    const product = await prisma.product.findFirst({
      where
    });

    if (!product) {
      throw new Error('商品不存在');
    }

    await prisma.product.update({
      where: { id },
      data: { isDeleted: true }
    });
    
    // 清除商品列表缓存
    await this.invalidateProductsCache(product.userId);

    return true;
  }

  /**
   * 批量删除
   */
  async batchDelete(ids, userId, userRole) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('请提供要删除的商品ID列表');
    }
    
    // 限制单次删除数量
    const maxDeleteCount = 100;
    if (ids.length > maxDeleteCount) {
      throw new Error(`单次删除数量不能超过 ${maxDeleteCount} 条`);
    }
    
    // 验证所有 ID 都是有效的数字
    const validIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id) && id > 0);
    
    if (validIds.length === 0) {
      throw new Error('没有有效的商品ID');
    }

    const where = {
      id: { in: validIds },
      isDeleted: false
    };

    if (userRole !== 'SUPER_ADMIN') {
      where.userId = userId;
    }

    const result = await prisma.product.updateMany({
      where,
      data: { isDeleted: true }
    });

    return result.count;
  }

  /**
   * 批量导入 - 使用事务保证数据一致性
   */
  async batchImport(userId, productsData) {
    if (!Array.isArray(productsData) || productsData.length === 0) {
      throw new Error('导入数据不能为空');
    }
    
    // 限制单次导入数量
    const maxImport = 1000;
    if (productsData.length > maxImport) {
      throw new Error(`单次导入数量不能超过 ${maxImport} 条`);
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // 使用事务确保原子性
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < productsData.length; i++) {
        try {
          const { name, productionDate, shelfLife, reminderDays } = productsData[i];
          
          // 验证必填字段
          if (!name || !productionDate || !shelfLife) {
            throw new Error('缺少必需字段（商品名称、生产日期、保质期）');
          }
          
          const productionDateObj = new Date(productionDate);
          const expiryDate = this.calculateExpiryDate(productionDateObj, parseInt(shelfLife, 10));
          const status = this.calculateStatus(productionDateObj, parseInt(shelfLife, 10), parseInt(reminderDays, 10) || 3);

          await tx.product.create({
            data: {
              name,
              productionDate: productionDateObj,
              shelfLife: parseInt(shelfLife, 10),
              expiryDate,
              reminderDays: parseInt(reminderDays, 10) || 3,
              status,
              userId
            }
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            data: productsData[i],
            error: error.message
          });
        }
      }
    });
    
    // 清除商品列表缓存
    await this.invalidateProductsCache(userId);

    return results;
  }

  /**
   * 获取统计数据
   */
  async getStatistics(userId, userRole = 'USER') {
    const where = {
      isDeleted: false
    };
    
    if (userRole !== 'SUPER_ADMIN') {
      where.userId = userId;
    }
    
    // 获取所有商品并实时计算状态（优化查询，仅返回必要字段）
    const allProducts = await prisma.product.findMany({
      where,
      select: {
        id: true,
        productionDate: true,
        shelfLife: true,
        expiryDate: true,
        reminderDays: true
      }
    });

    // 实时计算状态统计
    const today = dayjs().startOf('day');
    let normalCount = 0;
    let warningCount = 0;
    let expiredCount = 0;

    const formattedProducts = allProducts.map(product => {
      let expiryDate = product.expiryDate;
      if (!expiryDate) {
        expiryDate = dayjs(product.productionDate).add(product.shelfLife, 'day').toDate();
      }
      
      const remainingDays = dayjs(expiryDate).startOf("day").diff(today, "day") - 1;
      let status;
      if (remainingDays <= 0) {
        status = 'EXPIRED';
        expiredCount++;
      } else if (remainingDays <= product.reminderDays) {
        status = 'WARNING';
        warningCount++;
      } else {
        status = 'NORMAL';
        normalCount++;
      }
      
      return { ...product, status, remainingDays, expiryDate };
    });

    // 今日新增
    const todayAdded = await prisma.product.count({
      where: {
        ...where,
        createdAt: {
          gte: dayjs().startOf('day').toDate(),
          lt: dayjs().endOf('day').toDate()
        }
      }
    });

    // 格式化状态统计
    const stats = {
      total: allProducts.length,
      normal: normalCount,
      warning: warningCount,
      expired: expiredCount,
      todayAdded
    };

    // 状态分布
    stats.statusDistribution = [
      { name: '正常', value: normalCount },
      { name: '即将过期', value: warningCount },
      { name: '已过期', value: expiredCount }
    ];

    // 月度新增趋势（最近6个月）
    stats.monthlyTrend = await this.getMonthlyTrend(where);

    // 即将过期的商品列表 - 使用 formattedProducts 中已计算的状态
    const upcomingExpiry = formattedProducts
      .filter(p => p.status === 'WARNING')
      .sort((a, b) => a.remainingDays - b.remainingDays)
      .slice(0, 10);

    stats.upcomingExpiry = upcomingExpiry;

    return stats;
  }

  /**
   * 获取即将过期商品（用于导出）
   * @param {number} userId - 用户ID
   * @param {string} userRole - 用户角色
   * @param {number} days - 天数（7天或30天）
   */
  async getExpiringProducts(userId, userRole, days = 7) {
    const today = dayjs().startOf('day');
    const endDate = today.add(days, 'day').toDate();
    
    // 构建查询条件 - SUPER_ADMIN 可以导出所有用户的商品
    const where = {
      isDeleted: false,
      expiryDate: {
        gte: today.toDate(),
        lte: endDate
      }
    };
    if (userRole !== 'SUPER_ADMIN') {
      where.userId = userId;
    }
    
    const products = await prisma.product.findMany({
      where,
      orderBy: { expiryDate: 'asc' }
    });

    return products.map(product => {
      let expiryDate = product.expiryDate;
      if (!expiryDate) {
        expiryDate = dayjs(product.productionDate).add(product.shelfLife, 'day').toDate();
      }
      const remainingDays = dayjs(expiryDate).startOf("day").diff(today, "day") - 1;
      
      let status;
      if (remainingDays <= 0) {
        status = 'EXPIRED';
      } else if (remainingDays <= product.reminderDays) {
        status = 'WARNING';
      } else {
        status = 'NORMAL';
      }

      return {
        ...product,
        expiryDate,
        remainingDays,
        status
      };
    });
  }

  /**
   * 获取月度趋势
   */
  async getMonthlyTrend(where) {
    const months = [];
    const now = dayjs();

    for (let i = 5; i >= 0; i--) {
      const month = now.subtract(i, 'month');
      const monthStart = month.startOf('month').toDate();
      const monthEnd = month.endOf('month').toDate();

      const count = await prisma.product.count({
        where: {
          ...where,
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      });

      months.push({
        month: month.format('YYYY-MM'),
        count
      });
    }

    return months;
  }

  /**
   * 格式化商品数据
   */
  formatProduct(product, userRole = 'USER') {
    // 始终根据当前时间动态计算状态，确保显示准确
    let expiryDate = product.expiryDate;
    
    // 如果没有冗余字段（从旧数据迁移），动态计算
    if (!expiryDate) {
      // 兼容旧数据
      expiryDate = dayjs(product.productionDate).add(product.shelfLife, 'day').toDate();
    }
    
    // 计算剩余天数
    const remainingDays = dayjs(expiryDate).startOf('day').diff(dayjs().startOf('day'), 'day') - 1;
    
    // 重新计算状态：根据当前时间判断
    let status;
    if (remainingDays <= 0) {
      status = 'EXPIRED';
    } else if (remainingDays <= product.reminderDays) {
      status = 'WARNING';
    } else {
      status = 'NORMAL';
    }

    const result = {
      id: product.id,
      name: product.name,
      barcode: product.barcode,
      productionDate: product.productionDate,
      shelfLife: product.shelfLife,
      expiryDate,
      reminderDays: product.reminderDays,
      remainingDays,
      status,
      categoryId: product.categoryId,
      category: product.category || null,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };

    // 超级管理员可以看到用户信息
    if (userRole === 'SUPER_ADMIN' && product.user) {
      result.user = {
        id: product.user.id,
        username: product.user.username,
        role: product.user.role
      };
    }

    return result;
  }
}
