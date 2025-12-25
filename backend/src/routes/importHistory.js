import express from 'express';
import { ImportHistoryController } from '../controllers/importHistoryController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const importHistoryController = new ImportHistoryController();

// 所有路由都需要认证
router.use(authenticate);

// 获取导入历史列表
router.get('/', importHistoryController.getList.bind(importHistoryController));

// 删除导入历史
router.delete('/:id', importHistoryController.delete.bind(importHistoryController));

export default router;
