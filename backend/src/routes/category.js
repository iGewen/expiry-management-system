import express from 'express';
import { body } from 'express-validator';
import categoryController from '../controllers/categoryController.js';
import { authenticate } from '../middleware/auth.js';
import { logAction } from '../middleware/logger.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// 所有分类路由都需要认证
router.use(authenticate);

// 获取分类列表
router.get('/', categoryController.getCategories.bind(categoryController));

// 获取默认分类
router.get('/defaults', categoryController.getDefaultCategories.bind(categoryController));

// 创建分类
router.post('/', [
  body('name').notEmpty().withMessage('分类名称不能为空').trim(),
  body('color').optional().isHexColor().withMessage('颜色格式不正确'),
  handleValidationErrors
], logAction, categoryController.createCategory.bind(categoryController));

// 更新分类
router.put('/:id', [
  body('name').notEmpty().withMessage('分类名称不能为空').trim(),
  body('color').optional().isHexColor().withMessage('颜色格式不正确'),
  handleValidationErrors
], logAction, categoryController.updateCategory.bind(categoryController));

// 删除分类
router.delete('/:id', logAction, categoryController.deleteCategory.bind(categoryController));

export default router;
