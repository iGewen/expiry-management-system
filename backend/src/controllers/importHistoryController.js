import { ImportHistoryService } from '../services/importHistoryService.js';
import logger from '../utils/logger.js';

const importHistoryService = new ImportHistoryService();

export class ImportHistoryController {
  async getList(req, res) {
    try {
      const userId = req.user.id;
      const filters = req.query;

      const result = await importHistoryService.getHistories(userId, filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Get import history error:', error);
      res.status(500).json({
        success: false,
        message: '获取导入历史失败'
      });
    }
  }

  async delete(req, res) {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的历史记录ID',
          code: 'INVALID_PARAM'
        });
      }

      await importHistoryService.deleteHistory(id, userId);

      res.json({
        success: true,
        message: '删除成功'
      });
    } catch (error) {
      logger.error('Delete import history error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '删除失败'
      });
    }
  }
}
