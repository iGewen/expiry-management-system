import express from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAction } from '../middleware/logger.js';

const router = express.Router();
const userController = new UserController();

// 所有路由都需要认证
router.use(authenticate);

// 普通用户可以访问的路由
router.put('/profile', logAction, userController.updateProfile.bind(userController));

// 管理员路由
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), userController.getUsers.bind(userController));
router.get('/stats', authorize('ADMIN', 'SUPER_ADMIN'), userController.getStatistics.bind(userController));
router.get('/:id', authorize('ADMIN', 'SUPER_ADMIN'), userController.getUserById.bind(userController));
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), logAction, userController.updateUser.bind(userController));
router.put('/:id/password', authorize('ADMIN', 'SUPER_ADMIN'), logAction, userController.resetPassword.bind(userController));
router.delete('/:id', authorize('SUPER_ADMIN'), logAction, userController.deleteUser.bind(userController));

export default router;
