import Core from '@alicloud/pop-core';
import { config } from '../config/index.js';
import { store } from '../config/redis.js';
import logger from '../utils/logger.js';

// Redis 存储键前缀
const SMS_CODE_PREFIX = 'sms:code:';
const SMS_LAST_SENT_PREFIX = 'sms:last_sent:';

export class SmsService {
  constructor() {
    this.client = null;
    this.initialized = false;
    
    if (config.sms.enabled) {
      this.initializeClient();
    }
  }

  initializeClient() {
    try {
      this.client = new Core({
        accessKeyId: config.sms.accessKeyId,
        accessKeySecret: config.sms.accessKeySecret,
        endpoint: `https://dysmsapi.aliyuncs.com`,
        apiVersion: '2017-05-25'
      });
      this.initialized = true;
      logger.info('SMS service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize SMS service:', error);
      this.initialized = false;
    }
  }

  /**
   * 生成验证码
   */
  generateCode() {
    const length = config.security.smsCodeLength || 6;
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return code;
  }

  /**
   * 获取模板代码
   */
  getTemplateCode(purpose) {
    switch (purpose) {
      case 'register':
        return config.sms.registerTemplateCode;
      case 'reset':
        return config.sms.resetTemplateCode;
      default:
        // 默认使用注册模板
        return config.sms.registerTemplateCode;
    }
  }

  /**
   * 发送验证码
   */
  async sendVerificationCode(phone, purpose = 'register') {
    // 检查短信服务是否启用
    if (!config.sms.enabled) {
      // 开发环境返回模拟验证码
      if (config.env === 'development') {
        const mockCode = '123456';
        await this.storeCode(phone, mockCode, purpose);
        logger.info(`[DEV] Mock SMS code sent to ${phone}: ${mockCode}`);
        return {
          success: true,
          message: '验证码已发送（开发模式使用模拟验证码 123456）',
          mock: true
        };
      }
      
      return {
        success: false,
        message: '短信服务未配置'
      };
    }

    // 检查发送频率限制（60秒内只能发一次）
    const lastSentKey = `${SMS_LAST_SENT_PREFIX}${phone}`;
    const lastSent = await store.get(lastSentKey);
    if (lastSent && Date.now() - lastSent < 60000) {
      return {
        success: false,
        message: '发送过于频繁，请稍后再试',
        code: 'RATE_LIMIT'
      };
    }

    // 生成验证码
    const code = this.generateCode();

    try {
      // 调用阿里云短信服务
      // 根据用途选择模板
      const templateCode = this.getTemplateCode(purpose);
      
      const params = {
        RegionId: config.sms.region,
        PhoneNumbers: phone,
        SignName: config.sms.signName,
        TemplateCode: templateCode,
        TemplateParam: JSON.stringify({ code })
      };

      const result = await this.client.request('SendSms', params, {
        method: 'POST'
      });

      if (result.Code === 'OK') {
        // 存储验证码（5分钟有效期）
        const expireMinutes = config.security.smsCodeExpireMinutes || 5;
        await this.storeCode(phone, code, purpose, expireMinutes * 60);
        
        // 记录最后发送时间（60秒过期）
        await store.set(lastSentKey, Date.now(), 60);

        logger.info(`SMS code sent to ${phone}`);
        
        return {
          success: true,
          message: '验证码已发送'
        };
      } else {
        logger.error(`SMS send failed: ${result.Message}`);
        return {
          success: false,
          message: '短信发送失败，请稍后再试'
        };
      }
    } catch (error) {
      logger.error('SMS send error:', error);
      return {
        success: false,
        message: '短信服务暂时不可用'
      };
    }
  }

  /**
   * 存储验证码
   */
  async storeCode(phone, code, purpose, ttlSeconds = 300) {
    const key = `${SMS_CODE_PREFIX}${purpose}_${phone}`;
    await store.set(key, {
      code,
      attempts: 0
    }, ttlSeconds);
  }

  /**
   * 验证验证码
   */
  async verifyCode(phone, code, purpose = 'verify') {
    const key = `${SMS_CODE_PREFIX}${purpose}_${phone}`;
    const record = await store.get(key);

    if (!record) {
      return {
        valid: false,
        message: '验证码不存在或已过期'
      };
    }

    // 检查尝试次数（最多3次）
    if (record.attempts >= 3) {
      await store.del(key);
      return {
        valid: false,
        message: '验证失败次数过多，请重新获取验证码'
      };
    }

    // 验证验证码
    if (record.code !== code) {
      // 增加失败次数
      record.attempts++;
      const ttlSeconds = config.security.smsCodeExpireMinutes * 60;
      await store.set(key, record, ttlSeconds);
      
      return {
        valid: false,
        message: '验证码错误'
      };
    }

    // 验证成功，删除验证码
    await store.del(key);
    
    return {
      valid: true,
      message: '验证成功'
    };
  }

  /**
   * 检查短信服务是否启用
   */
  isEnabled() {
    return this.initialized && config.sms.enabled;
  }

  /**
   * 发送自定义短信（用于提醒等场景）
   */
  async sendCustomMessage(phone, message) {
    if (!this.isEnabled()) {
      logger.warn('SMS service not enabled, cannot send custom message');
      return { success: false, error: 'SMS service not enabled' };
    }

    try {
      // 使用通知类模板（需要用户自己申请一个通知类短信模板）
      // 这里使用重置密码模板作为备用
      const params = {
        RegionId: config.sms.region,
        PhoneNumbers: phone,
        SignName: config.sms.signName,
        TemplateCode: config.sms.resetTemplateCode, // 使用重置模板
        TemplateParam: JSON.stringify({ code: message.substring(0, 20) }) // 截取部分内容
      };

      const result = await this.client.request('SendSms', params, { method: 'POST' });
      
      if (result.Code === 'OK') {
        logger.info(`Custom SMS sent to ${phone}`);
        return { success: true };
      } else {
        logger.error(`Failed to send custom SMS: ${result.Message}`);
        return { success: false, error: result.Message };
      }
    } catch (error) {
      logger.error('Error sending custom SMS:', error);
      return { success: false, error: error.message };
    }
  }
}

// 创建单例实例
const smsService = new SmsService();

export default smsService;
