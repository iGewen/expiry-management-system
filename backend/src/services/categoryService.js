import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import dayjs from 'dayjs';

class CategoryService {
  /**
   * 获取用户的所有分类（带详细统计）
   */
  async getCategories(userId, userRole = 'USER') {
    // SUPER_ADMIN 可以看到所有用户的分类，按名称合并
    const where = userRole === 'SUPER_ADMIN' ? {} : { userId };
    
    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ userId: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: {
          select: { products: { where: { isDeleted: false } } }
        }
      }
    });
    
    // 一次性查询所有相关商品（优化 N+1 问题）
    const categoryIds = categories.map(c => c.id);
    const allProducts = await prisma.product.findMany({
      where: { 
        categoryId: { in: categoryIds },
        isDeleted: false 
      },
      select: {
        categoryId: true,
        expiryDate: true,
        productionDate: true,
        shelfLife: true,
        reminderDays: true
      }
    });
    
    // 按分类 ID 分组商品
    const productsByCategory = new Map();
    for (const p of allProducts) {
      if (!productsByCategory.has(p.categoryId)) {
        productsByCategory.set(p.categoryId, []);
      }
      productsByCategory.get(p.categoryId).push(p);
    }
    
    // 计算每个分类的统计
    const today = dayjs().startOf("day");
    const categoriesWithStats = categories.map(cat => {
      const products = productsByCategory.get(cat.id) || [];
      
      let normalCount = 0;
      let warningCount = 0;
      let expiredCount = 0;

      products.forEach(p => {
        let expiryDate = p.expiryDate;
        if (!expiryDate) {
          expiryDate = dayjs(p.productionDate).add(p.shelfLife - 1, "day").toDate();
        }
        const remainingDays = dayjs(expiryDate).startOf("day").diff(today, "day");
        
        if (remainingDays <= 0) expiredCount++;
        else if (remainingDays <= p.reminderDays) warningCount++;
        else normalCount++;
      });

      return {
        ...cat,
        productCount: cat._count.products,
        stats: {
          normal: normalCount,
          warning: warningCount,
          expired: expiredCount
        }
      };
    });
    
    // SUPER_ADMIN 按名称合并分类
    if (userRole === 'SUPER_ADMIN') {
      const mergedMap = new Map();
      for (const cat of categoriesWithStats) {
        const existing = mergedMap.get(cat.name);
        if (existing) {
          existing.productCount += cat.productCount;
          existing.stats.normal += cat.stats.normal;
          existing.stats.warning += cat.stats.warning;
          existing.stats.expired += cat.stats.expired;
          existing.categoryIds.push(cat.id);
        } else {
          mergedMap.set(cat.name, {
            ...cat,
            categoryIds: [cat.id]
          });
        }
      }
      return Array.from(mergedMap.values());
    }
    
    return categoriesWithStats;
  }

  /**
   * 获取分类详情（包含商品列表）
   */
  async getCategoryDetail(userId, categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId }
    });

    if (!category) {
      throw new Error('分类不存在');
    }

    const products = await prisma.product.findMany({
      where: { 
        categoryId, 
        isDeleted: false,
        userId
      },
      orderBy: { expiryDate: 'asc' }
    });

    const today = dayjs().startOf('day');
    let normalCount = 0;
    let warningCount = 0;
    let expiredCount = 0;

    const formattedProducts = products.map(p => {
      let expiryDate = p.expiryDate;
      if (!expiryDate) {
        expiryDate = dayjs(p.productionDate).add(p.shelfLife - 1, "day").toDate();
      }
      const remainingDays = dayjs(expiryDate).diff(today, 'day');
      let status;

      if (remainingDays <= 0) {
        status = 'EXPIRED';
        expiredCount++;
      } else if (remainingDays <= p.reminderDays) {
        status = 'WARNING';
        warningCount++;
      } else {
        status = 'NORMAL';
        normalCount++;
      }

      return {
        ...p,
        remainingDays,
        status
      };
    });

    return {
      ...category,
      products: formattedProducts,
      stats: {
        normal: normalCount,
        warning: warningCount,
        expired: expiredCount
      }
    };
  }

  /**
   * 创建分类
   */
  async createCategory(userId, data) {
    // 检查是否已存在同名分类
    const existing = await prisma.category.findFirst({
      where: { userId, name: data.name }
    });

    if (existing) {
      throw new Error('分类名称已存在');
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        color: data.color || '#409EFF',
        userId
      }
    });

    logger.info(`Category created: ${category.name} by user ${userId}`);
    return category;
  }

  /**
   * 更新分类
   */
  async updateCategory(userId, categoryId, data) {
    // 检查分类是否属于该用户
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId }
    });

    if (!category) {
      throw new Error('分类不存在');
    }

    // 如果修改了名称，检查是否重名
    if (data.name && data.name !== category.name) {
      const existing = await prisma.category.findFirst({
        where: { userId, name: data.name }
      });

      if (existing) {
        throw new Error('分类名称已存在');
      }
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: data.name,
        color: data.color
      }
    });

    logger.info(`Category updated: ${updated.name} by user ${userId}`);
    return updated;
  }

  /**
   * 删除分类
   */
  async deleteCategory(userId, categoryId) {
    // 检查分类是否属于该用户
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId }
    });

    if (!category) {
      throw new Error('分类不存在');
    }

    // 检查是否有商品使用该分类
    const productCount = await prisma.product.count({
      where: { categoryId, isDeleted: false }
    });

    if (productCount > 0) {
      throw new Error('该分类下有商品，无法删除');
    }

    await prisma.category.delete({
      where: { id: categoryId }
    });

    logger.info(`Category deleted: ${category.name} by user ${userId}`);
    return { message: '分类已删除' };
  }

  /**
   * 初始化用户默认分类
   */
  async initDefaultCategories(userId) {
    const defaultCategories = [
      { name: '食品', color: '#FF6B6B' },
      { name: '药品', color: '#4ECDC4' },
      { name: '化妆品', color: '#45B7D1' },
      { name: '其他', color: '#96CEB4' }
    ];

    for (const cat of defaultCategories) {
      await prisma.category.upsert({
        where: {
          userId_name: {
            userId,
            name: cat.name
          }
        },
        update: {},
        create: {
          userId,
          name: cat.name,
          color: cat.color
        }
      });
    }

    logger.info(`Default categories initialized for user ${userId}`);
  }
}

export default new CategoryService();
