import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAction } from '../middleware/logger.js';
import backupService from '../services/backupService.js';
import logger from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const router = express.Router();

// 配置文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制10MB
  },
  fileFilter: (req, file, cb) => {
    // 只接受 .json 文件
    if (path.extname(file.originalname).toLowerCase() === '.json') {
      cb(null, true);
    } else {
      cb(new Error('只支持 .json 格式的备份文件'));
    }
  }
});

// 获取备份列表
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // 只有管理员可以查看备份列表
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    const files = await backupService.getBackupList();
    
    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    logger.error('Get backup list error:', error);
    res.status(500).json({
      success: false,
      message: '获取备份列表失败'
    });
  }
});

// 创建备份
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await backupService.createBackup(userId, userRole);
    
    logger.info(`Backup created: ${result.filename} by user ${userId}`);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Create backup error:', error);
    res.status(500).json({
      success: false,
      message: '创建备份失败'
    });
  }
});

// 下载备份
router.get('/download/:filename', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { filename } = req.params;
    
    const filepath = backupService.getBackupFilePath(filename);
    
    if (!filepath) {
      return res.status(404).json({
        success: false,
        message: '备份文件不存在'
      });
    }

    res.download(filepath, filename);
  } catch (error) {
    logger.error('Download backup error:', error);
    res.status(500).json({
      success: false,
      message: '下载备份失败'
    });
  }
});

// 恢复备份
router.post('/restore', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: '请提供备份文件名'
      });
    }

    const result = await backupService.restoreBackup(userId, filename);
    
    logger.info(`Backup restored: ${filename} by user ${userId}`);
    
    res.json({
      success: true,
      data: result,
      message: `恢复成功：${result.productsRestored} 个商品，${result.categoriesRestored} 个分类`
    });
  } catch (error) {
    logger.error('Restore backup error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '恢复备份失败'
    });
  }
});

// 删除备份
router.delete('/:filename', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { filename } = req.params;
    
    await backupService.deleteBackup(filename);
    
    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    logger.error('Delete backup error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '删除备份失败'
    });
  }
});

// 上传备份文件并恢复
router.post('/upload', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), upload.single('backupFile'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择备份文件'
      });
    }

    const jsonContent = req.file.buffer.toString('utf-8');
    const result = await backupService.restoreFromJson(userId, jsonContent);
    
    logger.info(`Backup uploaded and restored by user ${userId}`);
    
    res.json({
      success: true,
      data: result,
      message: `恢复成功：${result.productsRestored} 个商品，${result.categoriesRestored} 个分类`
    });
  } catch (error) {
    logger.error('Upload backup error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '上传恢复失败'
    });
  }
});

export default router;
