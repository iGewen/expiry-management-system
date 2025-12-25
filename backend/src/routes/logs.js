import express from 'express';
import { LogController } from '../controllers/logController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const logController = new LogController();

// 所有路由都需要认证
router.use(authenticate);

// 获取日志列表（普通用户只能看自己的，管理员可以看所有）
router.get('/', logController.getLogs.bind(logController));

// 获取操作类型列表
router.get('/actions', logController.getActionTypes.bind(logController));

// 清空日志（仅管理员）
router.delete('/', authorize('ADMIN', 'SUPER_ADMIN'), logController.clearLogs.bind(logController));

export default router;
