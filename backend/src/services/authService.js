import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { config } from '../config/index.js';
import { store } from '../config/redis.js';
import logger from '../utils/logger.js';
import smsService from './smsService.js';
import categoryService from './categoryService.js';

// 登录失败计数器键前缀
const LOGIN_FAIL_PREFIX = 'login:fail:';
const LOGIN_LOCK_PREFIX = 'login:lock:';
// 从配置读取锁定时长（分钟转秒）
const LOCKOUT_DURATION = (config.security.lockoutMinutes || 30) * 60;

export class AuthService {
  /**
   * 发送注册验证码
   */
  async sendRegisterSmsCode(phone) {
    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error('手机号格式不正确');
    }

    // 检查手机号是否已注册
    const existingPhone = await prisma.user.findFirst({
      where: { phone }
    });

    if (existingPhone) {
      throw new Error('该手机号已注册');
    }

    // 发送验证码
    return await smsService.sendVerificationCode(phone, 'register');
  }

  /**
   * 发送密码重置验证码
   */
  async sendResetSmsCode(phone) {
    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error('手机号格式不正确');
    }

    // 检查手机号是否已注册
    const existingPhone = await prisma.user.findFirst({
      where: { phone }
    });

    if (!existingPhone) {
      throw new Error('该手机号未注册');
    }

    // 发送验证码
    return await smsService.sendVerificationCode(phone, 'reset');
  }

  /**
   * 验证验证码
   */
  async verifyCode(phone, code, purpose = 'verify') {
    return await smsService.verifyCode(phone, code, purpose);
  }

  /**
   * 用户注册
   */
  async register(userData) {
    const { username, password, phone, verifyCode } = userData;

    // 验证必填字段
    if (!username || !password || !phone || !verifyCode) {
      throw new Error('请填写所有必填信息，包括验证码');
    }

    // 验证验证码
    const codeResult = await smsService.verifyCode(phone, verifyCode, 'register');
    if (!codeResult.valid) {
      throw new Error(codeResult.message);
    }

    // 验证用户名格式（4-20位字母数字下划线）
    const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
    if (!usernameRegex.test(username)) {
      throw new Error('用户名必须是4-20位字母、数字或下划线');
    }

    // 验证手机号格式（中国大陆11位手机号）
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error('手机号格式不正确');
    }

    // 验证密码强度（6-20位，必须包含字母和数字）
    if (password.length < 6 || password.length > 20) {
      throw new Error('密码长度必须在 6-20 个字符之间');
    }
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
    if (!passwordRegex.test(password)) {
      throw new Error('密码必须包含字母和数字');
    }

    // 检查手机号是否已存在（双重检查）
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

    // 哈希密码（使用配置的轮数）
    const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);

    // 检查是否是第一个注册的用户（自动成为管理员）
    const userCount = await prisma.user.count();
    const userRole = userCount === 0 ? 'SUPER_ADMIN' : 'USER';

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        phone,
        role: userRole
      },
      select: {
        id: true,
        username: true,
        phone: true,
        email: true,
        avatar: true,
        feishuOpenId: true,
        role: true,
        createdAt: true
      }
    });

    // 初始化默认分类
    await categoryService.initDefaultCategories(user.id);

    // 生成 token
    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    logger.info(`User registered: ${user.username} (${user.id})`);

    return { user, token, refreshToken };
  }

  /**
   * 用户登录
   */
  async login(username, password, ipAddress) {
    // 检查是否被锁定
    const lockKey = `${LOGIN_LOCK_PREFIX}${username}`;
    const lockedUntil = await store.get(lockKey);
    
    if (lockedUntil && new Date() < new Date(lockedUntil)) {
      const remainingMinutes = Math.ceil((new Date(lockedUntil) - new Date()) / 60000);
      throw new Error(`账号已锁定，请在 ${remainingMinutes} 分钟后重试`);
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username }
    });

    // 统一错误响应，防止用户枚举
    const authError = () => {
      throw new Error('用户名或密码错误');
    };

    if (!user) {
      await this.recordLoginFailure(username);
      authError();
    }

    if (!user.isActive) {
      // 同样记录失败次数，但返回统一错误
      await this.recordLoginFailure(username);
      authError();
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await this.recordLoginFailure(username);
      throw new Error('用户名或密码错误');
    }

    // 登录成功，清除失败计数
    await store.del(`${LOGIN_FAIL_PREFIX}${username}`);
    await store.del(lockKey);

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ipAddress }
    });

    // 生成 token
    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    logger.info(`User logged in: ${user.username} (${user.id}) from ${ipAddress}`);

    return {
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar,
        feishuOpenId: user.feishuOpenId,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        lastLoginIp: user.lastLoginIp
      },
      token,
      refreshToken
    };
  }

  /**
   * 记录登录失败
   */
  async recordLoginFailure(username) {
    const failKey = `${LOGIN_FAIL_PREFIX}${username}`;
    const lockKey = `${LOGIN_LOCK_PREFIX}${username}`;
    
    const attempts = await store.incr(failKey);
    
    // 设置失败计数过期时间（30分钟）
    if (attempts === 1) {
      await store.expire(failKey, LOCKOUT_DURATION);
    }
    
    if (attempts >= config.security.maxLoginAttempts) {
      // 锁定账号30分钟
      const lockedUntil = new Date(Date.now() + config.security.lockoutMinutes * 60000);
      await store.set(lockKey, lockedUntil.toISOString(), LOCKOUT_DURATION);
      logger.warn(`Account locked due to too many failed attempts: ${username}`);
    }
  }

  /**
   * 修改密码
   */
  async changePassword(userId, oldPassword, newPassword) {
    const userIdInt = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    if (isNaN(userIdInt)) {
      throw new Error('无效的用户ID');
    }
    
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

    // 验证新密码强度
    if (newPassword.length < 6 || newPassword.length > 20) {
      throw new Error('密码长度必须在 6-20 个字符之间');
    }
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
    if (!passwordRegex.test(newPassword)) {
      throw new Error('密码必须包含字母和数字');
    }

    // 不能与旧密码相同
    if (await bcrypt.compare(newPassword, user.password)) {
      throw new Error('新密码不能与原密码相同');
    }

    // 哈希新密码
    const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);

    // 更新密码
    await prisma.user.update({
      where: { id: userIdInt },
      data: { password: hashedPassword }
    });

    logger.info(`Password changed for user: ${userIdInt}`);

    return true;
  }

  /**
   * 重置密码
   */
  async resetPassword(phone, newPassword, verifyCode) {
    // 验证验证码
    const codeResult = await smsService.verifyCode(phone, verifyCode, 'reset');
    if (!codeResult.valid) {
      throw new Error(codeResult.message);
    }

    // 查找用户
    const user = await prisma.user.findFirst({
      where: { phone }
    });

    if (!user) {
      throw new Error('手机号未注册');
    }

    // 验证密码强度
    if (!newPassword || newPassword.length < 6 || newPassword.length > 20) {
      throw new Error('密码长度必须在 6-20 个字符之间');
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
    if (!passwordRegex.test(newPassword)) {
      throw new Error('密码必须包含字母和数字');
    }

    // 哈希新密码
    const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);

    // 更新密码
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    logger.info(`Password reset for user: ${user.username} (${user.id})`);

    return true;
  }

  /**
   * 刷新 Token
   */
  async refreshToken(refreshToken) {
    try {
      // 检查token是否在黑名单
      const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new Error('Token已失效，请重新登录');
      }
      const decoded = jwt.verify(refreshToken, config.jwt.secret);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          phone: true,
          email: true,
          avatar: true,
          feishuOpenId: true,
          role: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        throw new Error('用户不存在或已禁用');
      }

      const newToken = this.generateToken(user.id);
      const newRefreshToken = this.generateRefreshToken(user.id);

      return {
        token: newToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          email: user.email,
          avatar: user.avatar,
          feishuOpenId: user.feishuOpenId,
          role: user.role
        }
      };
    } catch (error) {
      throw new Error('无效的刷新令牌');
    }
  }

  /**
   * 生成访问令牌
   */
  generateToken(userId) {
    return jwt.sign(
      { userId },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  /**
   * 生成刷新令牌
   */
  generateRefreshToken(userId) {
    return jwt.sign(
      { userId, type: 'refresh' },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        phone: true,
        email: true,
        avatar: true,
        feishuOpenId: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return user;
  }
}

  /**
   * 登出 - 将refreshToken加入黑名单
   */
  async logout(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret);
      // 将token加入黑名单，过期时间与token有效期一致
      const ttl = config.jwt.refreshExpiresIn || '7d';
      const ttlSeconds = this.parseTTL(ttl);
      await store.set(`token:blacklist:${refreshToken}`, '1', ttlSeconds);
      logger.info(`User ${decoded.userId} logged out, token blacklisted`);
      return { success: true, message: '登出成功' };
    } catch (error) {
      // token无效也返回成功
      return { success: true, message: '登出成功' };
    }
  }

  /**
   * 检查token是否在黑名单中
   */
  async isTokenBlacklisted(refreshToken) {
    const blacklisted = await store.get(`token:blacklist:${refreshToken}`);
    return !!blacklisted;
  }

  /**
   * 解析TTL字符串为秒数
   */
  parseTTL(ttl) {
    const unit = ttl.slice(-1);
    const value = parseInt(ttl.slice(0, -1));
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 86400 * 7; // 默认7天
    }
  }
}
