import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { logAction } from '../middleware/logger.js';

const router = express.Router();
const authController = new AuthController();

// 公开路由
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/forgot-password', authController.forgotPassword.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));

// 需要认证的路由
router.post('/logout', authenticate, logAction, authController.logout.bind(authController));
router.put('/change-password', authenticate, logAction, authController.changePassword.bind(authController));
router.get('/me', authenticate, authController.getCurrentUser.bind(authController));

export default router;
