import { LogService } from '../services/logService.js';
import logger from '../utils/logger.js';

const logService = new LogService();

export class LogController {
  async getLogs(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const filters = req.query;

      const result = await logService.getLogs(userId, userRole, filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Get logs error:', error);
      res.status(500).json({
        success: false,
        message: '获取日志失败'
      });
    }
  }

  async clearLogs(req, res) {
    try {
      const { beforeDate } = req.body;

      if (!beforeDate) {
        return res.status(400).json({
          success: false,
          message: '请提供截止日期'
        });
      }

      const count = await logService.clearLogs(beforeDate);

      logger.info(`Cleared ${count} logs before ${beforeDate}`);

      res.json({
        success: true,
        message: `成功清除 ${count} 条日志`
      });
    } catch (error) {
      logger.error('Clear logs error:', error);
      res.status(500).json({
        success: false,
        message: '清除日志失败'
      });
    }
  }

  async getActionTypes(req, res) {
    try {
      const actionTypes = await logService.getActionTypes();

      res.json({
        success: true,
        data: actionTypes
      });
    } catch (error) {
      logger.error('Get action types error:', error);
      res.status(500).json({
        success: false,
        message: '获取操作类型失败'
      });
    }
  }
}
