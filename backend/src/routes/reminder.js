import express from 'express';
import { body } from 'express-validator';
import reminderController from '../controllers/reminderController.js';
import { authenticate } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// 所有提醒路由都需要认证
router.use(authenticate);

// 获取提醒设置
router.get('/setting', reminderController.getSetting.bind(reminderController));

// 更新提醒设置
router.put('/setting', [
  body('enabled').optional().isBoolean().withMessage('enabled 必须是布尔值'),
  body('reminderTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('时间格式不正确，应为 HH:mm'),
  body('advanceDays').optional().isInt({ min: 1, max: 30 }).withMessage('提前天数应在 1-30 之间'),
  body('remindBySms').optional().isBoolean().withMessage('remindBySms 必须是布尔值'),
  body('remindByEmail').optional().isBoolean().withMessage('remindByEmail 必须是布尔值'),
  handleValidationErrors
], reminderController.updateSetting.bind(reminderController));

// 手动触发提醒
router.post('/trigger', reminderController.triggerReminder.bind(reminderController));

// 获取提醒历史
router.get('/logs', reminderController.getLogs.bind(reminderController));

// 获取即将过期商品
router.get('/upcoming', reminderController.getUpcomingProducts.bind(reminderController));

export default router;
