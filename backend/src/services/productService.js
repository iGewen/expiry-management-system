import prisma from '../config/database.js';
import dayjs from 'dayjs';

export class ProductService {
  async createProduct(userId, productData) {
    const { name, productionDate, shelfLife, reminderDays } = productData;

    const product = await prisma.product.create({
      data: {
        name,
        productionDate: new Date(productionDate),
        shelfLife,
        reminderDays: reminderDays || 3,
        userId
      }
    });

    return this.formatProduct(product);
  }

  async getProducts(userId, userRole, filters = {}) {
    const { page = 1, pageSize = 20, name, status, startDate, endDate, searchUserId } = filters;
    // 确保 page 和 pageSize 是数字类型
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const skip = (pageNum - 1) * pageSizeNum;
  
    const where = {
      isDeleted: false
    };
  
    // 超级管理员可以查看所有用户的商品
    if (userRole === 'SUPER_ADMIN') {
      // 如果有 searchUserId 参数，过滤特定用户的商品
      if (searchUserId) {
        where.userId = parseInt(searchUserId);
      }
      // 否则查看所有商品
    } else {
      // 普通用户和管理员只能查看自己的商品
      where.userId = userId;
    }
  
    // 名称搜索
    if (name) {
      where.name = { contains: name };
    }
  
    // 日期范围筛选
    if (startDate || endDate) {
      where.productionDate = {};
      if (startDate) where.productionDate.gte = new Date(startDate);
      if (endDate) where.productionDate.lte = new Date(endDate);
    }
  
    // 如果有状态筛选，需要先获取所有数据再过滤和分页
    if (status) {
      // 超级管理员需要包含用户信息
      const includeUser = userRole === 'SUPER_ADMIN' ? {
        user: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      } : {};
  
      const allProducts = await prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: includeUser
      });
  
      let formattedProducts = allProducts.map(p => this.formatProduct(p, userRole));
        
      // 状态筛选
      const statusArray = status.split(',').map(s => s.trim());
      formattedProducts = formattedProducts.filter(p => statusArray.includes(p.status));
        
      // 分页
      const total = formattedProducts.length;
      const paginatedProducts = formattedProducts.slice(skip, skip + pageSizeNum);
  
      return {
        products: paginatedProducts,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum)
      };
    }
  
    // 没有状态筛选，直接分页查询
    // 超级管理员需要包含用户信息
    const includeUser = userRole === 'SUPER_ADMIN' ? {
      user: {
        select: {
          id: true,
          username: true,
          role: true
        }
      }
    } : {};
  
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { createdAt: 'desc' },
        include: includeUser
      }),
      prisma.product.count({ where })
    ]);
  
    const formattedProducts = products.map(p => this.formatProduct(p, userRole));
  
    return {
      products: formattedProducts,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum)
    };
  }

  async getProductById(id, userId, userRole) {
    const where = {
      id,
      isDeleted: false
    };

    // 超级管理员可以查看任何商品
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

  async updateProduct(id, userId, userRole, productData) {
    const { name, productionDate, shelfLife, reminderDays } = productData;

    const where = {
      id,
      isDeleted: false
    };

    // 超级管理员可以修改任何商品
    if (userRole !== 'SUPER_ADMIN') {
      where.userId = userId;
    }

    const product = await prisma.product.findFirst({
      where
    });

    if (!product) {
      throw new Error('商品不存在');
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        productionDate: productionDate ? new Date(productionDate) : undefined,
        shelfLife,
        reminderDays
      }
    });

    return this.formatProduct(updated, userRole);
  }

  async deleteProduct(id, userId, userRole) {
    const where = {
      id,
      isDeleted: false
    };

    // 超级管理员可以删除任何商品
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

    return true;
  }

  async batchDelete(ids, userId, userRole) {
    const where = {
      id: { in: ids },
      isDeleted: false
    };

    // 超级管理员可以删除任何商品
    if (userRole !== 'SUPER_ADMIN') {
      where.userId = userId;
    }

    const result = await prisma.product.updateMany({
      where,
      data: { isDeleted: true }
    });

    return result.count;
  }

  async batchImport(userId, productsData) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < productsData.length; i++) {
      try {
        const { name, productionDate, shelfLife, reminderDays } = productsData[i];

        await prisma.product.create({
          data: {
            name,
            productionDate: new Date(productionDate),
            shelfLife: parseInt(shelfLife),
            reminderDays: reminderDays ? parseInt(reminderDays) : 3,
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

    return results;
  }

  async getStatistics(userId, userRole = 'USER') {
    const where = {
      isDeleted: false
    };
    
    // 超级管理员可以查看所有用户的商品统计
    if (userRole !== 'SUPER_ADMIN') {
      where.userId = userId;
    }
    
    const products = await prisma.product.findMany({
      where
    });

    const formattedProducts = products.map(p => this.formatProduct(p));

    const stats = {
      total: formattedProducts.length,
      normal: 0,
      warning: 0,
      expired: 0,
      todayAdded: 0
    };

    const today = dayjs().startOf('day');

    formattedProducts.forEach(p => {
      if (p.status === 'NORMAL') stats.normal++;
      else if (p.status === 'WARNING') stats.warning++;
      else if (p.status === 'EXPIRED') stats.expired++;

      if (dayjs(p.createdAt).isSame(today, 'day')) {
        stats.todayAdded++;
      }
    });

    // 状态分布
    stats.statusDistribution = [
      { name: '正常', value: stats.normal },
      { name: '即将过期', value: stats.warning },
      { name: '已过期', value: stats.expired }
    ];

    // 月度新增趋势（最近6个月）
    stats.monthlyTrend = this.getMonthlyTrend(products);

    // 即将过期的商品列表（7天内）
    stats.upcomingExpiry = formattedProducts
      .filter(p => p.remainingDays <= 7 && p.remainingDays > 0)
      .sort((a, b) => a.remainingDays - b.remainingDays)
      .slice(0, 10);

    return stats;
  }

  formatProduct(product, userRole = 'USER') {
    const expiryDate = dayjs(product.productionDate).add(product.shelfLife, 'day');
    const remainingDays = expiryDate.diff(dayjs(), 'day');

    let status = 'NORMAL';
    if (remainingDays <= 0) {
      status = 'EXPIRED';
    } else if (remainingDays <= product.reminderDays) {
      status = 'WARNING';
    }

    const result = {
      id: product.id,
      name: product.name,
      productionDate: product.productionDate,
      shelfLife: product.shelfLife,
      reminderDays: product.reminderDays,
      expiryDate: expiryDate.toDate(),
      remainingDays,
      status,
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

  getMonthlyTrend(products) {
    const months = [];
    const now = dayjs();

    for (let i = 5; i >= 0; i--) {
      const month = now.subtract(i, 'month');
      const monthStart = month.startOf('month');
      const monthEnd = month.endOf('month');

      const count = products.filter(p => {
        const created = dayjs(p.createdAt);
        return created.isAfter(monthStart) && created.isBefore(monthEnd);
      }).length;

      months.push({
        month: month.format('YYYY-MM'),
        count
      });
    }

    return months;
  }
}

