import { ProductService } from '../services/productService.js';
import { ImportHistoryService } from '../services/importHistoryService.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import dayjs from 'dayjs';
import iconv from 'iconv-lite';

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
      
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的商品ID',
          code: 'INVALID_PARAM'
        });
      }

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
      
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的商品ID',
          code: 'INVALID_PARAM'
        });
      }
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
      
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的商品ID',
          code: 'INVALID_PARAM'
        });
      }

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

      // 解析文件
      if (ext === '.xlsx' || ext === '.xls') {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        logger.info(`Parsed ${data.length} rows from Excel`);

        productsData = data.map((row, index) => {
          const shelfLife = row['保质期天数'] || row['保质期(天)'] || row['shelfLife'] || row['保质期'] || 0;
          const result = {
            name: row['商品名称'] || row['name'],
            productionDate: this.parseDate(row['生产日期'] || row['productionDate']),
            shelfLife: typeof shelfLife === 'number' ? shelfLife : parseInt(shelfLife) || 0,
            reminderDays: row['提醒天数'] || row['reminderDays'] || 3
          };
          return result;
        });
      } else if (ext === '.csv') {
        // 解析 CSV 文件 - 自动检测编码
        const buffer = fs.readFileSync(filePath);
        
        // 尝试多种编码
        const encodings = ['utf8', 'gbk', 'gb2312', 'latin1'];
        let content = '';
        let headers = [];
        
        for (const encoding of encodings) {
          content = iconv.decode(buffer, encoding);
          // 检测是否为UTF-8 BOM
          if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
          }
          headers = content.split('\n')[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          // 检查是否包含有效的中文字符
          const hasChinese = headers.some(h => /[\u4e00-\u9fa5]/.test(h));
          if (hasChinese) {
            logger.info(`CSV detected encoding: ${encoding}, headers: ${headers}`);
            break;
          }
        }
        
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          fs.unlinkSync(filePath);
          return res.status(400).json({
            success: false,
            message: 'CSV文件为空或格式不正确'
          });
        }

        // 重新解析表头
        headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        logger.info(`CSV headers final: ${headers}`);
        
        const nameIdx = headers.findIndex(h => ['商品名称', 'name'].includes(h));
        const productionDateIdx = headers.findIndex(h => ['生产日期', 'productionDate'].includes(h));
        const shelfLifeIdx = headers.findIndex(h => ['保质期天数', '保质期(天)', 'shelfLife', '保质期'].includes(h));
        const reminderDaysIdx = headers.findIndex(h => ['提醒天数', 'reminderDays'].includes(h));

        logger.info(`Parsed ${lines.length - 1} rows from CSV, indexes: name=${nameIdx}, date=${productionDateIdx}, shelfLife=${shelfLifeIdx}`);

        productsData = lines.slice(1).map((line, index) => {
          const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          const shelfLife = cols[shelfLifeIdx] || 0;
          return {
            name: cols[nameIdx],
            productionDate: this.parseDate(cols[productionDateIdx]),
            shelfLife: typeof shelfLife === 'number' ? shelfLife : parseInt(shelfLife) || 0,
            reminderDays: cols[reminderDaysIdx] || 3
          };
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

  /**
   * 批量更新商品
   */
  async batchUpdate(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { ids, categoryId, reminderDays } = req.body;

      if (!ids || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请选择要更新的商品'
        });
      }

      // 验证至少有一个更新字段
      if (categoryId === undefined && reminderDays === undefined) {
        return res.status(400).json({
          success: false,
          message: '请选择要更新的内容（分类或提醒天数）'
        });
      }

      const updateData = {};
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (reminderDays !== undefined) updateData.reminderDays = reminderDays;

      // 构建 where 条件 - SUPER_ADMIN 可以更新所有商品
      const where = {
        id: { in: ids },
        isDeleted: false
      };
      if (userRole !== 'SUPER_ADMIN') {
        where.userId = userId;
      }

      // 更新商品
      const result = await prisma.product.updateMany({
        where,
        data: updateData
      });

      // 记录修改详情
      let changeDetails = [];
      if (categoryId !== undefined) changeDetails.push(`分类: ${categoryId === null ? '取消分类' : '修改分类'}`);
      if (reminderDays !== undefined) changeDetails.push(`提醒天数: ${reminderDays}天`);

      logger.info(`Batch update products: ${ids.length} items, changes: ${changeDetails.join(', ')} by user ${userId}`);

      res.json({
        success: true,
        message: `成功更新 ${result.count} 个商品`,
        data: {
          updatedCount: result.count
        }
      });
    } catch (error) {
      logger.error('Batch update error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 导出即将过期商品
   */
  async exportExpiringProducts(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const days = parseInt(req.query.days) || 7; // 默认7天

      const products = await productService.getExpiringProducts(userId, userRole, days);

      // 生成Excel数据
      const data = products.map(p => ({
        '商品名称': p.name,
        '生产日期': dayjs(p.productionDate).format('YYYY-MM-DD'),
        '保质期(天)': p.shelfLife,
        '过期日期': dayjs(p.expiryDate).format('YYYY-MM-DD'),
        '剩余天数': p.remainingDays,
        '状态': p.status === 'EXPIRED' ? '已过期' : p.status === 'WARNING' ? '即将过期' : '正常',
        '提醒天数': p.reminderDays
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '即将过期商品');

      // 设置列宽
      worksheet['!cols'] = [
        { wch: 20 }, // 商品名称
        { wch: 12 }, // 生产日期
        { wch: 10 }, // 保质期
        { wch: 12 }, // 过期日期
        { wch: 10 }, // 剩余天数
        { wch: 10 }, // 状态
        { wch: 10 }  // 提醒天数
      ];

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const filename = `即将过期商品_${days}天_${dayjs().format('YYYYMMDD')}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
      res.send(buffer);
    } catch (error) {
      logger.error('Export expiring products error:', error);
      res.status(500).json({
        success: false,
        message: '导出失败'
      });
    }
  }

  async exportAllProducts(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { status, categoryId } = req.query;

      // 构建过滤条件
      const filters = { exportAll: 'true' };
      if (status) filters.status = status;
      if (categoryId) filters.categoryId = categoryId;

      // 获取商品
      const result = await productService.getProducts(userId, userRole, filters);
      const products = result.products || [];

      // 生成Excel数据
      const data = products.map(p => ({
        '商品名称': p.name,
        '分类': p.category?.name || '',
        '生产日期': dayjs(p.productionDate).format('YYYY-MM-DD'),
        '保质期(天)': p.shelfLife,
        '过期日期': dayjs(p.expiryDate).format('YYYY-MM-DD'),
        '剩余天数': p.remainingDays,
        '状态': p.status === 'EXPIRED' ? '已过期' : p.status === 'WARNING' ? '即将过期' : '正常',
        '提醒天数': p.reminderDays
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '商品列表');

      // 设置列宽
      worksheet['!cols'] = [
        { wch: 20 }, // 商品名称
        { wch: 10 }, // 分类
        { wch: 12 }, // 生产日期
        { wch: 10 }, // 保质期
        { wch: 12 }, // 过期日期
        { wch: 10 }, // 剩余天数
        { wch: 10 }, // 状态
        { wch: 10 }  // 提醒天数
      ];

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const filename = `商品列表_${dayjs().format('YYYYMMDD')}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
      res.send(buffer);
    } catch (error) {
      logger.error('Export all products error:', error);
      res.status(500).json({
        success: false,
        message: '导出失败'
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
