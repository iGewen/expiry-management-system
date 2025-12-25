import { UserService } from '../services/userService.js';
import logger from '../utils/logger.js';

const userService = new UserService();

export class UserController {
  async getUsers(req, res) {
    try {
      const filters = req.query;
      const result = await userService.getUsers(filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: '获取用户列表失败'
      });
    }
  }

  async getUserById(req, res) {
    try {
      const id = parseInt(req.params.id);
      const user = await userService.getUserById(id);

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Get user error:', error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateUser(req, res) {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;

      // 不能禁用自己的账号
      if (id === req.user.id && userData.isActive === false) {
        return res.status(400).json({
          success: false,
          message: '不能禁用自己的账号'
        });
      }

      // 不能修改自己的角色
      if (id === req.user.id && userData.role && userData.role !== req.user.role) {
        return res.status(400).json({
          success: false,
          message: '不能修改自己的角色'
        });
      }

      const user = await userService.updateUser(id, userData);

      logger.info(`User updated: ${user.username} by ${req.user.username}`);

      res.json({
        success: true,
        message: '用户更新成功',
        data: user
      });
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const id = parseInt(req.params.id);
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: '请提供新密码'
        });
      }

      await userService.resetUserPassword(id, newPassword);

      logger.info(`Password reset for user ID: ${id} by ${req.user.username}`);

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

  async deleteUser(req, res) {
    try {
      const id = parseInt(req.params.id);

      // 不能删除自己
      if (id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: '不能删除自己的账号'
        });
      }

      await userService.deleteUser(id);

      logger.info(`User deleted: ID ${id} by ${req.user.username}`);

      res.json({
        success: true,
        message: '用户删除成功'
      });
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getStatistics(req, res) {
    try {
      const stats = await userService.getStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Get user statistics error:', error);
      res.status(500).json({
        success: false,
        message: '获取用户统计失败'
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { phone } = req.body;

      const user = await userService.updateUser(userId, { phone });

      res.json({
        success: true,
        message: '个人信息更新成功',
        data: user
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}
