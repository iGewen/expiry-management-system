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
  body('phones').optional().isArray().withMessage('phones 必须是数组'),
  body('phones.*').optional().isMobilePhone('zh-CN').withMessage('手机号格式不正确'),
  body('remindBySms').optional().isBoolean().withMessage('remindBySms 必须是布尔值'),
  body('remindByEmail').optional().isBoolean().withMessage('remindByEmail 必须是布尔值'),
  body('feishuEnabled').optional().isBoolean().withMessage('feishuEnabled 必须是布尔值'),
  body('feishuWebhook').optional().isString().withMessage('feishuWebhook 必须是字符串'),
  handleValidationErrors
], reminderController.updateSetting.bind(reminderController));

// 测试飞书 webhook
router.post('/test-feishu', [
  body('webhookUrl').notEmpty().withMessage('webhook 地址不能为空').isURL().withMessage('webhook 地址格式不正确'),
  handleValidationErrors
], reminderController.testFeishuWebhook.bind(reminderController));

// 手动触发提醒
router.post('/trigger', reminderController.triggerReminder.bind(reminderController));

// 获取提醒历史
router.get('/logs', reminderController.getLogs.bind(reminderController));

// 获取即将过期商品
router.get('/upcoming', reminderController.getUpcomingProducts.bind(reminderController));

export default router;
