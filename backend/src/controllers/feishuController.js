import feishuService from '../services/feishuService.js';
import { AuthService } from '../services/authService.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { store } from '../config/redis.js';
import logger from '../utils/logger.js';
import prisma from '../config/database.js';

const authService = new AuthService();

// Redis 键前缀
const TEMP_TOKEN_PREFIX = 'feishu:temp:';
const TEMP_TOKEN_TTL = 300; // 5分钟

/**
 * 生成临时 token（存储到 Redis）
 */
async function generateTempToken(feishuInfo) {
  const token = jwt.sign(
    { 
      type: 'feishu_temp',
      openId: feishuInfo.openId,
      iat: Date.now()
    },
    config.jwt.secret,
    { expiresIn: '5m' }
  );
  
  // 存储到 Redis，5分钟过期
  await store.set(`${TEMP_TOKEN_PREFIX}${token}`, JSON.stringify(feishuInfo), TEMP_TOKEN_TTL);
  
  return token;
}

/**
 * 获取临时 token 对应的飞书信息（从 Redis）
 */
async function getTempFeishuInfo(token) {
  const data = await store.get(`${TEMP_TOKEN_PREFIX}${token}`);
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * 删除临时 token
 */
async function deleteTempToken(token) {
  await store.del(`${TEMP_TOKEN_PREFIX}${token}`);
}

/**
 * 生成安全的会话 token（用于前端获取真实 token）
 */
async function generateSessionToken(userInfo) {
  const sessionToken = jwt.sign(
    { 
      type: 'session',
      userId: userInfo.userId,
      iat: Date.now()
    },
    config.jwt.secret,
    { expiresIn: '2m' }
  );
  
  // 存储到 Redis，2分钟过期
  await store.set(`session:${sessionToken}`, JSON.stringify(userInfo), 120);
  
  return sessionToken;
}

/**
 * 飞书登录控制器
 */
export class FeishuController {
  /**
   * 获取飞书登录授权 URL
   * GET /api/auth/feishu/authorize
   */
  async getAuthorizeUrl(req, res) {
    try {
      if (!feishuService.isConfigured()) {
        return res.status(503).json({
          success: false,
          message: '飞书登录未配置'
        });
      }

      const state = req.query.state || '';
      const url = feishuService.getAuthorizationUrl(state);

      res.json({
        success: true,
        data: { url }
      });
    } catch (error) {
      logger.error('Get Feishu authorize URL error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取飞书授权链接失败'
      });
    }
  }

  /**
   * 飞书登录回调处理
   * GET /api/auth/feishu/callback
   * 已绑定直接登录，未绑定跳转到绑定选择页面
   */
  async callback(req, res) {
    try {
      const { code, state } = req.query;
      
      // 从请求头自动获取前端URL（支持反向代理）
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const frontendUrl = `${protocol}://${host}`;

      if (!code) {
        return res.redirect(`${frontendUrl}/login?error=feishu_auth_failed&message=授权失败`);
      }

      // 获取飞书用户信息
      const result = await feishuService.getFeishuUserInfo(code);

      // 已绑定，直接登录
      if (result.isBound) {
        const accessToken = authService.generateToken(result.user.id);
        const refreshToken = authService.generateRefreshToken(result.user.id);
        
        logger.info(`User ${result.user.username} logged in via Feishu (bound)`);
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        await prisma.user.update({
          where: { id: result.user.id },
          data: { lastLoginAt: new Date(), lastLoginIp: ipAddress }
        });
        
        // 使用会话 token 方式，避免 token 暴露在 URL 中
        const sessionToken = await generateSessionToken({
          accessToken,
          refreshToken,
          userId: result.user.id,
          username: result.user.username,
          isNewUser: false
        });
        
        const redirectUrl = `${frontendUrl}/auth/feishu/callback?session=${sessionToken}${state ? `&state=${state}` : ''}`;
        return res.redirect(redirectUrl);
      }

      // 未绑定，生成临时 token，跳转到注册页面
      const tempToken = await generateTempToken(result.feishuInfo);
      
      logger.info(`Redirecting to register page, feishu user: ${result.feishuInfo.name}`);
      
      // 生成随机用户名建议
      const suggestedUsername = feishuService.generateRandomUsername();
      
      const redirectUrl = `${frontendUrl}/register?tempToken=${tempToken}&phone=${encodeURIComponent(result.feishuInfo.mobile || '')}&username=${encodeURIComponent(suggestedUsername)}&feishuName=${encodeURIComponent(result.feishuInfo.name || '')}${state ? `&state=${state}` : ''}`;
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Feishu callback error:', error);
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const frontendUrl = `${protocol}://${host}`;
      res.redirect(`${frontendUrl}/login?error=feishu_auth_failed&message=${encodeURIComponent(error.message || '飞书登录失败')}`);
    }
  }

  /**
   * 通过会话 token 获取真实 token
   * POST /api/auth/feishu/session
   */
  async getSessionToken(req, res) {
    try {
      const { session } = req.body;
      
      if (!session) {
        return res.status(400).json({
          success: false,
          message: '缺少会话凭证'
        });
      }
      
      const data = await store.get(`session:${session}`);
      if (!data) {
        return res.status(400).json({
          success: false,
          message: '会话已过期'
        });
      }
      
      // 删除会话 token（一次性使用）
      await store.del(`session:${session}`);
      
      const userInfo = JSON.parse(data);
      
      res.json({
        success: true,
        data: userInfo
      });
    } catch (error) {
      logger.error('Get session token error:', error);
      res.status(500).json({
        success: false,
        message: '获取登录信息失败'
      });
    }
  }

  /**
   * 绑定已有账号
   * POST /api/auth/feishu/bind
   */
  async bindExistingAccount(req, res) {
    try {
      const { tempToken, username, password } = req.body;

      if (!tempToken || !username || !password) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
      }

      // 获取临时 token 中的飞书信息
      const feishuInfo = await getTempFeishuInfo(tempToken);
      if (!feishuInfo) {
        return res.status(400).json({
          success: false,
          message: '授权已过期，请重新登录'
        });
      }

      // 绑定账号
      const user = await feishuService.bindExistingAccount(
        feishuInfo.openId,
        username,
        password
      );

      // 生成 token
      const accessToken = authService.generateToken(user.id);
      const refreshToken = authService.generateRefreshToken(user.id);

      // 清理临时 token
      await deleteTempToken(tempToken);

      logger.info(`User ${user.username} bound Feishu account`);

      res.json({
        success: true,
        message: '绑定成功',
        data: {
          user,
          token: accessToken,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Bind existing account error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '绑定失败'
      });
    }
  }

  /**
   * 创建新账号
   * POST /api/auth/feishu/create
   */
  async createNewAccount(req, res) {
    try {
      const { tempToken } = req.body;

      if (!tempToken) {
        return res.status(400).json({
          success: false,
          message: '缺少临时授权凭证'
        });
      }

      // 获取临时 token 中的飞书信息
      const feishuInfo = await getTempFeishuInfo(tempToken);
      if (!feishuInfo) {
        return res.status(400).json({
          success: false,
          message: '授权已过期，请重新登录'
        });
      }

      // 创建新账号
      const user = await feishuService.createNewAccount(feishuInfo);

      // 生成 token
      const accessToken = authService.generateToken(user.id);
      const refreshToken = authService.generateRefreshToken(user.id);

      // 清理临时 token
      await deleteTempToken(tempToken);

      logger.info(`Created new user via Feishu: ${user.username}`);

      res.json({
        success: true,
        message: '账号创建成功',
        data: {
          user,
          token: accessToken,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Create new account error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '创建账号失败'
      });
    }
  }

  /**
   * 创建新账号（带用户名密码）
   * POST /api/auth/feishu/create-with-register
   */
  async createWithRegister(req, res) {
    try {
      const { tempToken, username, password, phone, verifyCode } = req.body;

      if (!tempToken || !username || !password || !phone || !verifyCode) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
      }

      // 获取临时 token 中的飞书信息
      const feishuInfo = await getTempFeishuInfo(tempToken);
      if (!feishuInfo) {
        return res.status(400).json({
          success: false,
          message: '授权已过期，请重新授权'
        });
      }

      // 验证手机号验证码
      try {
        await authService.verifyCode(phone, verifyCode, 'register');
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message || '验证码错误'
        });
      }

      // 检查用户名是否已存在
      const existingUsername = await prisma.user.findUnique({
        where: { username }
      });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: '用户名已存在'
        });
      }

      // 检查手机号是否已存在
      const existingPhone = await prisma.user.findFirst({
        where: { phone }
      });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: '该手机号已注册'
        });
      }

      // 检查是否是第一个注册的用户（自动成为管理员）
      const userCount = await prisma.user.count();
      const userRole = userCount === 0 ? 'SUPER_ADMIN' : 'USER';

      // 创建用户
      const bcrypt = (await import('bcrypt')).default;
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          phone,
          feishuOpenId: feishuInfo.openId,
          avatar: feishuInfo.avatar || null,
          isActive: true,
          role: userRole
        }
      });

      // 生成 token
      const accessToken = authService.generateToken(user.id);
      const refreshToken = authService.generateRefreshToken(user.id);

      // 清理临时 token
      await deleteTempToken(tempToken);

      logger.info(`Created new user via Feishu register: ${user.username}`);

      res.json({
        success: true,
        message: '注册成功',
        data: {
          user: feishuService.sanitizeUser(user),
          token: accessToken,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Create with register error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '注册失败'
      });
    }
  }

  /**
   * 检查飞书登录是否可用
   * GET /api/auth/feishu/status
   */
  async getStatus(req, res) {
    try {
      const isConfigured = feishuService.isConfigured();
      
      res.json({
        success: true,
        data: {
          enabled: isConfigured
        }
      });
    } catch (error) {
      logger.error('Get Feishu status error:', error);
      res.status(500).json({
        success: false,
        message: '获取飞书登录状态失败'
      });
    }
  }

  /**
   * 解绑飞书账号（需登录）
   * POST /api/auth/feishu/unbind
   */
  async unbindFeishuAccount(req, res) {
    try {
      const userId = req.user.id;

      const user = await feishuService.unbindFeishuAccount(userId);

      logger.info(`User ${user.username} unbound Feishu account`);

      res.json({
        success: true,
        message: '飞书账号解绑成功'
      });
    } catch (error) {
      logger.error('Unbind Feishu account error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '解绑失败'
      });
    }
  }
}
