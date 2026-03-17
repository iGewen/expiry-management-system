import { FeishuService } from '../services/feishuService.js';
import { AuthService } from '../services/authService.js';
import logger from '../utils/logger.js';
import prisma from '../config/database.js';

const feishuService = new FeishuService();
const authService = new AuthService();

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
      // 检查是否配置了飞书登录
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
   * 处理完成后重定向到前端页面
   */
  async callback(req, res) {
    try {
      const { code, state } = req.query;

      if (!code) {
        // 授权失败，重定向到登录页
        const frontendUrl = process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/login?error=feishu_auth_failed&message=授权失败`);
      }

      const ipAddress = req.ip || req.connection.remoteAddress;
      
      // 执行飞书登录
      const result = await feishuService.loginWithFeishu(code, ipAddress);

      // 生成 JWT token
      const accessToken = authService.generateToken(result.user.id);
      const refreshToken = authService.generateRefreshToken(result.user.id);

      logger.info(`User ${result.user.username} logged in via Feishu, isNewUser: ${result.isNewUser}`);

      // 重定向到前端回调页面，携带 token
      const frontendUrl = process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5173';
      const redirectUrl = `${frontendUrl}/auth/feishu/callback?token=${accessToken}&refreshToken=${refreshToken}&isNewUser=${result.isNewUser}&userId=${result.user.id}&username=${encodeURIComponent(result.user.username)}${state ? `&state=${state}` : ''}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Feishu callback error:', error);
      const frontendUrl = process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=feishu_auth_failed&message=${encodeURIComponent(error.message || '飞书登录失败')}`);
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
   * 绑定飞书账号到现有用户
   * POST /api/auth/feishu/bind
   */
  async bindFeishuAccount(req, res) {
    try {
      const { code } = req.body;
      const userId = req.user.id;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: '缺少授权码'
        });
      }

      if (!feishuService.isConfigured()) {
        return res.status(503).json({
          success: false,
          message: '飞书登录未配置'
        });
      }

      // 获取飞书用户信息
      const tokenData = await feishuService.getUserAccessToken(code);
      const userAccessToken = tokenData.access_token;
      const feishuUser = await feishuService.getUserInfo(userAccessToken);
      const { open_id, avatar_url } = feishuUser;

      // 检查该飞书账号是否已被其他用户绑定
      const existingBinding = await prisma.user.findFirst({
        where: {
          feishuOpenId: open_id,
          id: {
            not: userId
          }
        }
      });

      if (existingBinding) {
        return res.status(409).json({
          success: false,
          message: '该飞书账号已被其他用户绑定'
        });
      }

      // 绑定到当前用户
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          feishuOpenId: open_id,
          avatar: avatar_url || undefined
        }
      });

      logger.info(`User ${updatedUser.username} bound Feishu account`);

      res.json({
        success: true,
        message: '飞书账号绑定成功',
        data: {
          user: feishuService.sanitizeUser(updatedUser)
        }
      });
    } catch (error) {
      logger.error('Bind Feishu account error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '绑定飞书账号失败'
      });
    }
  }

  /**
   * 解绑飞书账号
   * POST /api/auth/feishu/unbind
   */
  async unbindFeishuAccount(req, res) {
    try {
      const userId = req.user.id;

      // 检查用户是否有密码登录方式
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user.phone) {
        return res.status(400).json({
          success: false,
          message: '无法解绑：请先设置手机号或邮箱登录方式'
        });
      }

      // 解绑
      await prisma.user.update({
        where: { id: userId },
        data: {
          feishuOpenId: null
        }
      });

      logger.info(`User ${user.username} unbound Feishu account`);

      res.json({
        success: true,
        message: '飞书账号解绑成功'
      });
    } catch (error) {
      logger.error('Unbind Feishu account error:', error);
      res.status(500).json({
        success: false,
        message: '解绑飞书账号失败'
      });
    }
  }
}
