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
    
    // 获取每个分类的详细统计
    const categoriesWithStats = await Promise.all(
      categories.map(async (cat) => {
        const products = await prisma.product.findMany({
          where: { 
            categoryId: cat.id, 
            isDeleted: false 
          },
          select: {
            expiryDate: true,
            productionDate: true,
            shelfLife: true,
            reminderDays: true
          }
        });

        let normalCount = 0;
        let warningCount = 0;
        let expiredCount = 0;
        const today = dayjs().startOf('day');

        products.forEach(p => {
          let expiryDate = p.expiryDate;
          if (!expiryDate) {
            expiryDate = dayjs(p.productionDate).add(p.shelfLife, 'day').toDate();
          }
          const remainingDays = dayjs(expiryDate).diff(today, 'day');
          
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
      })
    );
    
    if (userRole === 'SUPER_ADMIN') {
      for (const cat of categoriesWithStats) {
        if (existing) {
          existing.productCount += cat.productCount;
          existing.stats.normal += cat.stats.normal;
          existing.stats.warning += cat.stats.warning;
          existing.stats.expired += cat.stats.expired;
        } else {
        }
      }
    }
    
    if (userRole === 'SUPER_ADMIN') {
      for (const cat of categoriesWithStats) {
        if (existing) {
          existing.productCount += cat.productCount;
          existing.stats.normal += cat.stats.normal;
          existing.stats.warning += cat.stats.warning;
          existing.stats.expired += cat.stats.expired;
        } else {
            ...cat,
          });
        }
      }
    }
    
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
        expiryDate = dayjs(p.productionDate).add(p.shelfLife, 'day').toDate();
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
        expiryDate,
        remainingDays,
        status
      };
    });

    return {
      ...category,
      productCount: products.length,
      stats: {
        normal: normalCount,
        warning: warningCount,
        expired: expiredCount
      },
      products: formattedProducts
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
      throw new Error(`该分类下有 ${productCount} 个商品，无法删除`);
    }

    await prisma.category.delete({
      where: { id: categoryId }
    });

    logger.info(`Category deleted: ${category.name} by user ${userId}`);
    return true;
  }

  /**
   * 获取默认分类列表
   */
  getDefaultCategories() {
    return [
      { name: '食品', color: '#67C23A' },
      { name: '饮料', color: '#409EFF' },
      { name: '日用品', color: '#E6A23C' },
      { name: '化妆品', color: '#F56C6C' },
      { name: '药品', color: '#909399' },
      { name: '其他', color: '#C0C4CC' }
    ];
  }

  /**
   * 为新用户初始化默认分类
   */
  async initDefaultCategories(userId) {
    const defaultCategories = this.getDefaultCategories();
    
    for (const cat of defaultCategories) {
      await prisma.category.create({
        data: {
          name: cat.name,
          color: cat.color,
          userId
        }
      });
    }

    logger.info(`Default categories initialized for user ${userId}`);
  }
}

export default new CategoryService();
