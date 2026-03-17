import { Router } from 'express';
import { FeishuController } from '../controllers/feishuController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const feishuController = new FeishuController();

/**
 * 飞书登录路由
 */

// 获取飞书登录状态
router.get('/status', feishuController.getStatus.bind(feishuController));

// 获取飞书登录授权 URL
router.get('/authorize', feishuController.getAuthorizeUrl.bind(feishuController));

// 飞书登录回调
router.get('/callback', feishuController.callback.bind(feishuController));

// 绑定已有账号
router.post('/bind', feishuController.bindExistingAccount.bind(feishuController));

// 创建新账号
router.post('/create', feishuController.createNewAccount.bind(feishuController));

// 解绑飞书账号（需登录）
router.post('/unbind', authenticate, feishuController.unbindFeishuAccount.bind(feishuController));

export default router;
