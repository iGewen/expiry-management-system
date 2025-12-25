import prisma from '../config/database.js';
import bcrypt from 'bcrypt';

export class UserService {
  async getUsers(filters = {}) {
    const { page = 1, pageSize = 20, role, isActive, search } = filters;
    // 确保 page 和 pageSize 是数字类型
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const skip = (pageNum - 1) * pageSizeNum;

    const where = {};

    if (role) {
      where.role = role;
    }

    if (typeof isActive !== 'undefined') {
      where.isActive = isActive === 'true' || isActive === true;
    }

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { phone: { contains: search } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              products: true,
              logs: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        productCount: user._count.products,
        logCount: user._count.logs
      })),
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum)
    };
  }

  async getUserById(id) {
    // 确保 id 是数字类型
    const userId = typeof id === 'string' ? parseInt(id) : id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            products: true,
            logs: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return {
      ...user,
      productCount: user._count.products,
      logCount: user._count.logs
    };
  }

  async updateUser(id, userData) {
    const { phone, role, isActive } = userData;
    
    // 确保 id 是数字类型
    const userId = typeof id === 'string' ? parseInt(id) : id;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 如果更新手机号，验证格式和唯一性
    if (phone !== undefined) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        throw new Error('手机号格式不正确');
      }

      // 检查手机号是否被其他用户使用
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone,
          id: { not: userId }
        }
      });

      if (existingPhone) {
        throw new Error('手机号已被其他用户使用');
      }
    }

    // 不能禁用超级管理员
    if (user.role === 'SUPER_ADMIN' && isActive === false) {
      throw new Error('不能禁用超级管理员账号');
    }

    // 不能修改超级管理员的角色
    if (user.role === 'SUPER_ADMIN' && role && role !== 'SUPER_ADMIN') {
      throw new Error('不能修改超级管理员的角色');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        phone: phone !== undefined ? phone : undefined,
        role: role !== undefined ? role : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      },
      select: {
        id: true,
        username: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    return updated;
  }

  async resetUserPassword(id, newPassword) {
    // 确保 id 是数字类型
    const userId = typeof id === 'string' ? parseInt(id) : id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return true;
  }

  async deleteUser(id) {
    // 确保 id 是数字类型
    const userId = typeof id === 'string' ? parseInt(id) : id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    if (user.role === 'SUPER_ADMIN') {
      throw new Error('不能删除超级管理员');
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    return true;
  }

  async getStatistics() {
    const [totalUsers, activeUsers, usersByRole] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      })
    ]);

    const roleDistribution = usersByRole.map(item => ({
      role: item.role,
      count: item._count
    }));

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      roleDistribution
    };
  }
}
