import express from 'express';
import { ProductController } from '../controllers/productController.js';
import { authenticate } from '../middleware/auth.js';
import { logAction } from '../middleware/logger.js';
import { upload } from '../utils/upload.js';

const router = express.Router();
const productController = new ProductController();

// 所有路由都需要认证
router.use(authenticate);

// 商品CRUD
router.post('/', logAction, productController.create.bind(productController));
router.get('/', productController.getList.bind(productController));
router.get('/stats', productController.getStatistics.bind(productController));
router.get('/:id', productController.getById.bind(productController));
router.put('/:id', logAction, productController.update.bind(productController));
router.delete('/:id', logAction, productController.delete.bind(productController));

// 批量操作
router.post('/batch/delete', logAction, productController.batchDelete.bind(productController));
router.post('/batch/import', logAction, upload.single('file'), productController.batchImport.bind(productController));

// 导出模板
router.get('/template/export', productController.exportTemplate.bind(productController));

export default router;
