import express from 'express';
import { body, query } from 'express-validator';
import { ProductController } from '../controllers/productController.js';
import { authenticate } from '../middleware/auth.js';
import { logAction } from '../middleware/logger.js';
import { handleValidationErrors, validatePagination, validateId } from '../middleware/validation.js';
import { upload } from '../utils/upload.js';

const router = express.Router();
const productController = new ProductController();

// 所有路由都需要认证
router.use(authenticate);

// 验证规则
const createValidation = [
  body('name').trim().notEmpty().withMessage('商品名称不能为空').isLength({ max: 100 }),
  body('productionDate').notEmpty().withMessage('生产日期不能为空').isISO8601(),
  body('shelfLife').notEmpty().withMessage('保质期不能为空').isInt({ min: 1, max: 3650 }).withMessage('保质期应为1-3650天'),
  body('reminderDays').optional().isInt({ min: 1, max: 90 }).withMessage('提醒天数应为1-90天')
];

const updateValidation = [
  body('name').optional().trim().notEmpty().withMessage('商品名称不能为空').isLength({ max: 100 }),
  body('productionDate').optional().isISO8601(),
  body('shelfLife').optional().isInt({ min: 1, max: 3650 }).withMessage('保质期应为1-3650天'),
  body('reminderDays').optional().isInt({ min: 1, max: 90 }).withMessage('提醒天数应为1-90天')
];

const listValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('name').optional().trim().isLength({ max: 100 }),
  query('status').optional().isIn(['NORMAL', 'WARNING', 'EXPIRED', 'NORMAL,WARNING', 'NORMAL,EXPIRED', 'WARNING,EXPIRED', 'NORMAL,WARNING,EXPIRED']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
];

const batchDeleteValidation = [
  body('ids').isArray({ min: 1, max: 100 }).withMessage('批量删除数量应为1-100'),
  body('ids.*').isInt({ min: 1 }).withMessage('商品ID必须为正整数')
];

// 商品 CRUD
router.post('/', createValidation, handleValidationErrors, logAction, productController.create.bind(productController));
router.get('/', listValidation, handleValidationErrors, validatePagination, productController.getList.bind(productController));
router.get('/stats', productController.getStatistics.bind(productController));
router.get('/:id', validateId('id'), handleValidationErrors, productController.getById.bind(productController));
router.put('/:id', validateId('id'), updateValidation, handleValidationErrors, logAction, productController.update.bind(productController));
router.delete('/:id', validateId('id'), handleValidationErrors, logAction, productController.delete.bind(productController));

// 批量操作
router.post('/batch/delete', batchDeleteValidation, handleValidationErrors, logAction, productController.batchDelete.bind(productController));
router.post('/batch/import', logAction, upload.single('file'), productController.batchImport.bind(productController));

// 导出模板
router.get('/template/export', productController.exportTemplate.bind(productController));

export default router;
