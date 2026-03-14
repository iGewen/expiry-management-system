import categoryService from '../services/categoryService.js';
import logger from '../config/logger.js';

class CategoryController {
  /**
   * 获取分类列表
   */
  async getCategories(req, res) {
    try {
      const userId = req.user.id;
      const categories = await categoryService.getCategories(userId);
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      logger.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取分类列表失败'
      });
    }
  }

  /**
   * 创建分类
   */
  async createCategory(req, res) {
    try {
      const userId = req.user.id;
      const { name, color } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: '分类名称不能为空'
        });
      }

      const category = await categoryService.createCategory(userId, {
        name: name.trim(),
        color
      });

      res.json({
        success: true,
        data: category,
        message: '分类创建成功'
      });
    } catch (error) {
      logger.error('Create category error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '创建分类失败'
      });
    }
  }

  /**
   * 更新分类
   */
  async updateCategory(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { name, color } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: '分类名称不能为空'
        });
      }

      const category = await categoryService.updateCategory(userId, parseInt(id), {
        name: name.trim(),
        color
      });

      res.json({
        success: true,
        data: category,
        message: '分类更新成功'
      });
    } catch (error) {
      logger.error('Update category error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '更新分类失败'
      });
    }
  }

  /**
   * 删除分类
   */
  async deleteCategory(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      await categoryService.deleteCategory(userId, parseInt(id));

      res.json({
        success: true,
        message: '分类删除成功'
      });
    } catch (error) {
      logger.error('Delete category error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '删除分类失败'
      });
    }
  }

  /**
   * 获取默认分类
   */
  async getDefaultCategories(req, res) {
    try {
      const categories = categoryService.getDefaultCategories();
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      logger.error('Get default categories error:', error);
      res.status(500).json({
        success: false,
        message: '获取默认分类失败'
      });
    }
  }
}

export default new CategoryController();
