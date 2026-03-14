import express from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { logAction } from '../middleware/logger.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();
const authController = new AuthController();

// 验证规则
const sendSmsCodeValidation = [
  body('phone')
    .notEmpty().withMessage('手机号不能为空')
    .matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确')
];

const registerValidation = [
  body('username').trim()
    .notEmpty().withMessage('用户名不能为空')
    .isLength({ min: 4, max: 20 }).withMessage('用户名长度为4-20个字符')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('用户名只能包含字母、数字和下划线'),
  body('password')
    .notEmpty().withMessage('密码不能为空')
    .isLength({ min: 6, max: 20 }).withMessage('密码长度为6-20个字符')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('密码必须包含字母和数字'),
  body('phone')
    .notEmpty().withMessage('手机号不能为空')
    .matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
  body('verifyCode')
    .notEmpty().withMessage('验证码不能为空')
    .isLength({ min: 6, max: 6 }).withMessage('验证码为6位数字')
];

const loginValidation = [
  body('username').trim().notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空')
];

const changePasswordValidation = [
  body('oldPassword').notEmpty().withMessage('原密码不能为空'),
  body('newPassword')
    .notEmpty().withMessage('新密码不能为空')
    .isLength({ min: 6, max: 20 }).withMessage('新密码长度为6-20个字符')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('新密码必须包含字母和数字')
];

const resetPasswordValidation = [
  body('phone').matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
  body('newPassword')
    .notEmpty().withMessage('新密码不能为空')
    .isLength({ min: 6, max: 20 }).withMessage('新密码长度为6-20个字符')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('新密码必须包含字母和数字'),
  body('verifyCode')
    .notEmpty().withMessage('验证码不能为空')
    .isLength({ min: 6, max: 6 }).withMessage('验证码为6位数字')
];

// 公开路由
router.post('/sms/register', sendSmsCodeValidation, handleValidationErrors, authController.sendRegisterSmsCode.bind(authController));
router.post('/sms/reset', sendSmsCodeValidation, handleValidationErrors, authController.sendResetSmsCode.bind(authController));
router.post('/register', registerValidation, handleValidationErrors, authController.register.bind(authController));
router.post('/login', loginValidation, handleValidationErrors, authController.login.bind(authController));
router.post('/reset-password', resetPasswordValidation, handleValidationErrors, authController.resetPassword.bind(authController));

// 需要认证的路由
router.post('/logout', authenticate, logAction, authController.logout.bind(authController));
router.put('/change-password', authenticate, changePasswordValidation, handleValidationErrors, logAction, authController.changePassword.bind(authController));
router.get('/me', authenticate, authController.getCurrentUser.bind(authController));

export default router;
