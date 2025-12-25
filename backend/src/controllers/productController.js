import { ProductService } from '../services/productService.js';
import { ImportHistoryService } from '../services/importHistoryService.js';
import logger from '../utils/logger.js';
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const productService = new ProductService();
const importHistoryService = new ImportHistoryService();

export class ProductController {
  async create(req, res) {
    try {
      const userId = req.user.id;
      const productData = req.body;

      const product = await productService.createProduct(userId, productData);

      res.status(201).json({
        success: true,
        message: '商品添加成功',
        data: product
      });
    } catch (error) {
      logger.error('Create product error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getList(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const filters = req.query;

      const result = await productService.getProducts(userId, userRole, filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Get products error:', error);
      res.status(500).json({
        success: false,
        message: '获取商品列表失败'
      });
    }
  }

  async getById(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const id = parseInt(req.params.id);

      const product = await productService.getProductById(id, userId, userRole);

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      logger.error('Get product error:', error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  async update(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const id = parseInt(req.params.id);
      const productData = req.body;

      const product = await productService.updateProduct(id, userId, userRole, productData);

      res.json({
        success: true,
        message: '商品更新成功',
        data: product
      });
    } catch (error) {
      logger.error('Update product error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async delete(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const id = parseInt(req.params.id);

      await productService.deleteProduct(id, userId, userRole);

      res.json({
        success: true,
        message: '商品删除成功'
      });
    } catch (error) {
      logger.error('Delete product error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async batchDelete(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供要删除的商品ID列表'
        });
      }

      const count = await productService.batchDelete(ids, userId, userRole);

      res.json({
        success: true,
        message: `成功删除 ${count} 个商品`
      });
    } catch (error) {
      logger.error('Batch delete error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async batchImport(req, res) {
    try {
      const userId = req.user.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '请上传文件'
        });
      }

      const filePath = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();

      logger.info(`Starting batch import for user ${userId}, file: ${req.file.originalname}`);

      let productsData = [];

      // 解析 Excel 文件
      if (ext === '.xlsx' || ext === '.xls') {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        logger.info(`Parsed ${data.length} rows from Excel`);
        logger.info('Sample row:', data[0]); // 调试日志

        productsData = data.map((row, index) => {
          const shelfLife = row['保质期天数'] || row['保质期(天)'] || row['shelfLife'] || row['保质期'] || 0;
          const result = {
            name: row['商品名称'] || row['name'],
            productionDate: this.parseDate(row['生产日期'] || row['productionDate']),
            shelfLife: typeof shelfLife === 'number' ? shelfLife : parseInt(shelfLife) || 0,
            reminderDays: row['提醒天数'] || row['reminderDays'] || 3
          };
          if (index === 0) {
            logger.info('Parsed first product:', result); // 调试日志
          }
          return result;
        });
      } else {
        // 删除文件
        fs.unlinkSync(filePath);
        return res.status(400).json({
          success: false,
          message: '不支持的文件格式'
        });
      }

      const results = await productService.batchImport(userId, productsData);

      logger.info(`Batch import completed: success=${results.success}, failed=${results.failed}`);

      // 保存导入历史
      // 修复中文文件名编码问题
      const originalFilename = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      
      await importHistoryService.createHistory(userId, {
        filename: originalFilename,
        totalCount: results.success + results.failed,
        successCount: results.success,
        failCount: results.failed,
        errors: results.errors
      });

      // 删除上传的文件
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: '导入完成',
        data: results
      });
    } catch (error) {
      // 清理文件
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      logger.error('Batch import error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async exportTemplate(req, res) {
    try {
      const data = [
        {
          '商品名称': '示例商品',
          '生产日期': '2024-01-01',
          '保质期(天)': 180,
          '提醒天数': 3
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '商品列表');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=product-template.xlsx');
      res.send(buffer);
    } catch (error) {
      logger.error('Export template error:', error);
      res.status(500).json({
        success: false,
        message: '导出模板失败'
      });
    }
  }

  async getStatistics(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      const stats = await productService.getStatistics(userId, userRole);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Get statistics error:', error);
      res.status(500).json({
        success: false,
        message: '获取统计数据失败'
      });
    }
  }

  parseDate(dateStr) {
    if (!dateStr) return new Date();
    
    // 处理 Excel 日期数字
    if (typeof dateStr === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      return new Date(excelEpoch.getTime() + dateStr * 86400000);
    }
    
    return new Date(dateStr);
  }
}
