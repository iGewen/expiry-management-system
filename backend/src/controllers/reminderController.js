import reminderService from '../services/reminderService.js';
import feishuService from '../services/feishuService.js';
import logger from '../utils/logger.js';

class ReminderController {
  /**
   * 获取提醒设置
   */
  async getSetting(req, res) {
    try {
      const userId = req.user.id;
      const setting = await reminderService.getReminderSetting(userId);
      
      res.json({
        success: true,
        data: setting
      });
    } catch (error) {
      logger.error('Get reminder setting error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取提醒设置失败'
      });
    }
  }

  /**
   * 更新提醒设置
   */
  async updateSetting(req, res) {
    try {
      const userId = req.user.id;
      const { enabled, reminderTime, phones, remindBySms, remindByEmail, feishuEnabled, feishuWebhook } = req.body;
      
      const setting = await reminderService.updateReminderSetting(userId, {
        enabled,
        reminderTime,
        phones,
        remindBySms,
        remindByEmail,
        feishuEnabled,
        feishuWebhook
      });

      res.json({
        success: true,
        data: setting,
        message: '提醒设置更新成功'
      });
    } catch (error) {
      logger.error('Update reminder setting error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '更新提醒设置失败'
      });
    }
  }

  /**
   * 手动触发提醒（测试用）
   */
  async triggerReminder(req, res) {
    try {
      const userId = req.user.id;
      const result = await reminderService.sendReminder(userId);
      
      res.json({
        success: true,
        data: result,
        message: result.sent ? '提醒发送成功' : '无需发送提醒'
      });
    } catch (error) {
      logger.error('Trigger reminder error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '发送提醒失败'
      });
    }
  }

  /**
   * 获取提醒历史
   */
  async getLogs(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, pageSize = 20 } = req.query;
      
      const result = await reminderService.getReminderLogs(userId, parseInt(page), parseInt(pageSize));
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Get reminder logs error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取提醒历史失败'
      });
    }
  }

  /**
   * 获取即将过期商品（提醒预览）
   */
  async getUpcomingProducts(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      // 使用 getUpcomingProducts 获取即将过期的商品预览
      const products = await reminderService.getUpcomingProducts(userId, userRole);
      
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      logger.error('Get upcoming products error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取即将过期商品失败'
      });
    }
  }

  /**
   * 测试飞书 webhook
   */
  async testFeishuWebhook(req, res) {
    try {
      const { webhookUrl } = req.body;
      
      if (!webhookUrl) {
        return res.status(400).json({
          success: false,
          message: '请提供飞书 webhook 地址'
        });
      }

      const isValid = await feishuService.validateWebhook(webhookUrl);
      
      if (isValid) {
        res.json({
          success: true,
          message: '飞书机器人配置成功，测试消息已发送'
        });
      } else {
        res.status(400).json({
          success: false,
          message: '飞书 webhook 验证失败，请检查地址是否正确'
        });
      }
    } catch (error) {
      logger.error('Test Feishu webhook error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '测试飞书 webhook 失败'
      });
    }
  }
}

export default new ReminderController();
