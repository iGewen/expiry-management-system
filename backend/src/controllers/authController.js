import { AuthService } from '../services/authService.js';
import logger from '../utils/logger.js';
import prisma from '../config/database.js';

const authService = new AuthService();

export class AuthController {
  /**
   * 发送注册验证码
   */
  async sendRegisterSmsCode(req, res) {
    try {
      const { phone } = req.body;
      
      const result = await authService.sendRegisterSmsCode(phone);
      
      res.json({
        success: result.success,
        message: result.message
      });
    } catch (error) {
      logger.error('Send register SMS error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 发送密码重置验证码
   */
  async sendResetSmsCode(req, res) {
    try {
      const { phone } = req.body;
      
      const result = await authService.sendResetSmsCode(phone);
      
      // 为了安全，无论手机号是否注册都返回相同响应
      res.json({
        success: true,
        message: '验证码已发送'
      });
    } catch (error) {
      logger.error('Send reset SMS error:', error);
      // 为了安全，不暴露具体错误
      res.json({
        success: true,
        message: '验证码已发送'
      });
    }
  }

  async register(req, res) {
    try {
      const { username, password, confirmPassword, phone, verifyCode } = req.body;

      // 验证密码匹配
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: '两次输入的密码不一致'
        });
      }

      const result = await authService.register({
        username,
        password,
        phone,
        verifyCode
      });

      logger.info(`User registered: ${username}`);

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: result
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;

      const ipAddress = req.ip || req.connection.remoteAddress;
      const result = await authService.login(username, password, ipAddress);

      logger.info(`User logged in: ${username}`);

      res.json({
        success: true,
        message: '登录成功',
        data: result
      });
    } catch (error) {
      logger.error('Login error:', error);
      
      // 如果是账号被禁用，返回 403
      if (error.message === '账号已禁用，请联系管理员') {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }
      
      // 其他错误返回 401
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  async logout(req, res) {
    try {
      logger.info(`User logged out: ${req.user.username}`);

      res.json({
        success: true,
        message: '登出成功'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: '登出失败'
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.id;

      await authService.changePassword(userId, oldPassword, newPassword);

      logger.info(`Password changed for user: ${req.user.username}`);

      res.json({
        success: true,
        message: '密码修改成功'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { phone, newPassword, verifyCode } = req.body;

      await authService.resetPassword(phone, newPassword, verifyCode);

      logger.info(`Password reset for phone: ${phone}`);

      res.json({
        success: true,
        message: '密码重置成功'
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getCurrentUser(req, res) {
    try {
      res.json({
        success: true,
        data: req.user
      });
    } catch (error) {
      logger.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: '获取用户信息失败'
      });
    }
  }
}
