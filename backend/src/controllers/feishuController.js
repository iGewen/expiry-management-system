import feishuService from '../services/feishuService.js';
import { AuthService } from '../services/authService.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

const authService = new AuthService();

// 临时 token 存储飞书用户信息（过期时间5分钟）
const tempTokenStore = new Map();

/**
 * 生成临时 token
 */
function generateTempToken(feishuInfo) {
  const token = jwt.sign(
    { 
      type: 'feishu_temp',
      openId: feishuInfo.openId,
      iat: Date.now()
    },
    config.jwt.secret,
    { expiresIn: '5m' }
  );
  
  tempTokenStore.set(token, feishuInfo);
  
  // 5分钟后自动清理
  setTimeout(() => {
    tempTokenStore.delete(token);
  }, 5 * 60 * 1000);
  
  return token;
}

/**
 * 获取临时 token 对应的飞书信息
 */
function getTempFeishuInfo(token) {
  return tempTokenStore.get(token);
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
      const frontendUrl = process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5173';

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
        
        const redirectUrl = `${frontendUrl}/auth/feishu/callback?token=${accessToken}&refreshToken=${refreshToken}&isNewUser=false&userId=${result.user.id}&username=${encodeURIComponent(result.user.username)}${state ? `&state=${state}` : ''}`;
        return res.redirect(redirectUrl);
      }

      // 未绑定，生成临时 token，跳转到注册页面
      const tempToken = generateTempToken(result.feishuInfo);
      
      logger.info(`Redirecting to register page, feishu user: ${result.feishuInfo.name}`);
      
      // 生成随机用户名建议
      const suggestedUsername = feishuService.generateRandomUsername();
      
      const redirectUrl = `${frontendUrl}/register?tempToken=${tempToken}&phone=${encodeURIComponent(result.feishuInfo.mobile || '')}&username=${encodeURIComponent(suggestedUsername)}&feishuName=${encodeURIComponent(result.feishuInfo.name || '')}${state ? `&state=${state}` : ''}`;
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Feishu callback error:', error);
      const frontendUrl = process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=feishu_auth_failed&message=${encodeURIComponent(error.message || '飞书登录失败')}`);
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
      const feishuInfo = getTempFeishuInfo(tempToken);
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
      tempTokenStore.delete(tempToken);

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
      const feishuInfo = getTempFeishuInfo(tempToken);
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
      tempTokenStore.delete(tempToken);

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
      const feishuInfo = getTempFeishuInfo(tempToken);
      if (!feishuInfo) {
        return res.status(400).json({
          success: false,
          message: '授权已过期，请重新授权'
        });
      }

      // 验证手机号验证码
      const { default: AuthService } = await import('../services/authService.js');
      const authService = new AuthService();
      
      try {
        await authService.verifyPhoneCode(phone, verifyCode, 'register');
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message || '验证码错误'
        });
      }

      // 检查用户名是否已存在
      const { default: prisma } = await import('../config/database.js');
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
          isActive: true
        }
      });

      // 生成 token
      const accessToken = authService.generateToken(user.id);
      const refreshToken = authService.generateRefreshToken(user.id);

      // 清理临时 token
      tempTokenStore.delete(tempToken);

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
