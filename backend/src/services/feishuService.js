import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * 飞书机器人服务
 * 用于发送群消息通知
 */
class FeishuService {
  /**
   * 发送文本消息到飞书群
   * @param webhookUrl 飞书群机器人 webhook 地址
   * @param content 消息内容
   * @returns {Promise<boolean>} 是否发送成功
   */
  async sendTextMessage(webhookUrl, content) {
    if (!webhookUrl) {
      logger.warn('Feishu webhook URL is empty');
      return false;
    }

    try {
      const response = await axios.post(webhookUrl, {
        msg_type: 'text',
        content: {
          text: content
        }
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.code === 0) {
        logger.info('Feishu message sent successfully');
        return true;
      } else {
        logger.error('Feishu API error:', response.data);
        return false;
      }
    } catch (error) {
      logger.error('Failed to send Feishu message:', error.message);
      return false;
    }
  }

  /**
   * 发送富文本消息（带格式的卡片消息）
   * @param webhookUrl 飞书群机器人 webhook 地址
   * @param products 商品列表 [{name, remainingDays, expiryDate, status}]
   * @returns {Promise<boolean>} 是否发送成功
   */
  async sendProductReminder(webhookUrl, products) {
    if (!webhookUrl || !products || products.length === 0) {
      logger.warn('Feishu webhook URL or products is empty');
      return false;
    }

    try {
      // 构建商品列表文本
      const productList = products.map((p, index) => {
        const statusEmoji = p.remainingDays <= 0 ? '🔴' : '🟡';
        const daysText = p.remainingDays <= 0 ? '已过期' : `还剩 ${p.remainingDays} 天`;
        const expiryDateStr = new Date(p.expiryDate).toLocaleDateString('zh-CN', { 
          month: '2-digit', 
          day: '2-digit' 
        });
        return `${index + 1}. ${p.name}\n   📅 过期日期：${expiryDateStr}（${daysText}）${statusEmoji}`;
      }).join('\n\n');

      const now = new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const content = `📦 商品过期提醒\n📅 ${now}\n\n您有以下 ${products.length} 件商品需要关注：\n\n${productList}\n\n💡 请及时处理，避免影响使用！`;

      return await this.sendTextMessage(webhookUrl, content);
    } catch (error) {
      logger.error('Failed to send Feishu product reminder:', error.message);
      return false;
    }
  }

  /**
   * 发送聚合提醒消息（只显示数量）
   * @param webhookUrl 飞书群机器人 webhook 地址
   * @param productCount 商品数量
   * @returns {Promise<boolean>} 是否发送成功
   */
  async sendAggregatedReminder(webhookUrl, productCount) {
    if (!webhookUrl) {
      logger.warn('Feishu webhook URL is empty');
      return false;
    }

    const content = `⚠️ 商品过期提醒\n\n您有 ${productCount} 件商品即将过期，请及时处理，避免影响使用哦~`;
    
    return await this.sendTextMessage(webhookUrl, content);
  }

  /**
   * 验证 webhook 地址是否有效
   * @param webhookUrl 飞书群机器人 webhook 地址
   * @returns {Promise<boolean>} 是否有效
   */
  async validateWebhook(webhookUrl) {
    if (!webhookUrl) return false;
    
    try {
      // 发送测试消息
      const response = await axios.post(webhookUrl, {
        msg_type: 'text',
        content: {
          text: '【测试消息】飞书机器人配置成功！✅'
        }
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data && response.data.code === 0;
    } catch (error) {
      logger.error('Feishu webhook validation failed:', error.message);
      return false;
    }
  }
}

export default new FeishuService();
