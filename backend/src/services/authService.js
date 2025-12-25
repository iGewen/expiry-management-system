import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { config } from '../config/index.js';

export class AuthService {
  async register(userData) {
    const { username, password, phone } = userData;

    // 验证手机号是否提供
    if (!phone) {
      throw new Error('请提供手机号');
    }

    // 验证手机号格式（中国大陆11位手机号）
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error('手机号格式不正确');
    }

    // 检查手机号是否已存在
    const existingPhone = await prisma.user.findFirst({
      where: { phone }
    });

    if (existingPhone) {
      throw new Error('手机号已被注册');
    }

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      throw new Error('用户名已存在');
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        phone,
        role: 'USER'
      },
      select: {
        id: true,
        username: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    // 生成 token
    const token = this.generateToken(user.id);

    return { user, token };
  }

  async login(username, password) {
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      throw new Error('用户名或密码错误');
    }

    if (!user.isActive) {
      throw new Error('账号已禁用，请联系管理员');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('用户名或密码错误');
    }

    // 生成 token
    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        role: user.role
      },
      token
    };
  }

  async changePassword(userId, oldPassword, newPassword) {
    // 确保 userId 是数字类型
    const userIdInt = typeof userId === 'string' ? parseInt(userId) : userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userIdInt }
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      throw new Error('原密码错误');
    }

    // 哈希新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await prisma.user.update({
      where: { id: userIdInt },
      data: { password: hashedPassword }
    });

    return true;
  }

  async resetPassword(phone, newPassword) {
    // 查找用户
    const user = await prisma.user.findFirst({
      where: { phone }
    });

    if (!user) {
      throw new Error('手机号未注册');
    }

    // 验证密码强度：6-20位，必须包含字母和数字
    if (!newPassword || newPassword.length < 6 || newPassword.length > 20) {
      throw new Error('密码长度必须在 6-20 个字符之间');
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/;
    if (!passwordRegex.test(newPassword)) {
      throw new Error('密码必须包含字母和数字');
    }

    // 哈希新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    return true;
  }

  generateToken(userId) {
    return jwt.sign(
      { userId },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }
}
