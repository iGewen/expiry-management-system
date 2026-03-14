import prisma from '../config/database.js';
import logger from '../utils/logger.js';

class CategoryService {
  /**
   * 获取用户的所有分类
   */
  async getCategories(userId) {
    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { products: { where: { isDeleted: false } } }
        }
      }
    });
    
    return categories.map(cat => ({
      ...cat,
      productCount: cat._count.products
    }));
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
