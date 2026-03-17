import axios from 'axios';
import logger from '../utils/logger.js';
import prisma from '../config/database.js';
import bcrypt from 'bcrypt';

/**
 * 飞书 OAuth 登录服务
 * 文档：https://open.feishu.cn/document/common-capabilities/sso/web-application-implement/login
 */
export class FeishuService {
  constructor() {
    this.appId = process.env.FEISHU_APP_ID;
    this.appSecret = process.env.FEISHU_APP_SECRET;
    this.redirectUri = process.env.FEISHU_REDIRECT_URI;
    
    // 飞书 API 端点
    this.apiBaseUrl = 'https://open.feishu.cn/open-apis';
  }

  /**
   * 检查飞书登录是否配置
   */
  isConfigured() {
    return !!(this.appId && this.appSecret && this.redirectUri);
  }

  /**
   * 获取飞书登录授权 URL
   */
  getAuthorizationUrl(state) {
    if (!this.isConfigured()) {
      throw new Error('飞书登录未配置');
    }

    const params = new URLSearchParams({
      app_id: this.appId,
      redirect_uri: this.redirectUri,
      state: state || '',
      scope: 'contact:user.base:readonly' // 获取用户基本信息
    });

    return `https://open.feishu.cn/open-apis/authen/v1/authorize?${params.toString()}`;
  }

  /**
   * 通过 code 获取用户 access_token
   */
  async getUserAccessToken(code) {
    try {
      // 先获取 app_access_token
      const appAccessToken = await this.getAppAccessToken();
      
      // 用 code 换取 user_access_token
      const response = await axios.post(
        `${this.apiBaseUrl}/authen/v1/oidc/access_token`,
        {
          grant_type: 'authorization_code',
          code: code
        },
        {
          headers: {
            'Authorization': `Bearer ${appAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.msg || '获取用户token失败');
      }

      return response.data.data;
    } catch (error) {
      logger.error('Failed to get user access token:', error.response?.data || error.message);
      throw new Error('飞书授权失败');
    }
  }

  /**
   * 获取 App Access Token
   */
  async getAppAccessToken() {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/auth/v3/app_access_token/internal`,
        {
          app_id: this.appId,
          app_secret: this.appSecret
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.msg || '获取app_access_token失败');
      }

      return response.data.app_access_token;
    } catch (error) {
      logger.error('Failed to get app access token:', error.response?.data || error.message);
      throw new Error('飞书应用认证失败');
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(userAccessToken) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/authen/v1/user_info`,
        {
          headers: {
            'Authorization': `Bearer ${userAccessToken}`
          }
        }
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.msg || '获取用户信息失败');
      }

      return response.data.data;
    } catch (error) {
      logger.error('Failed to get user info:', error.response?.data || error.message);
      throw new Error('获取飞书用户信息失败');
    }
  }

  /**
   * 飞书登录/注册
   * 1. 检查是否已绑定飞书账号
   * 2. 已绑定 -> 直接登录
   * 3. 未绑定 -> 检查手机号/邮箱是否已注册
   *    - 已注册 -> 绑定并登录
   *    - 未注册 -> 创建新账号并登录
   */
  async loginWithFeishu(code, ipAddress) {
    if (!this.isConfigured()) {
      throw new Error('飞书登录未配置');
    }

    // 1. 通过 code 获取用户 token
    const tokenData = await this.getUserAccessToken(code);
    const userAccessToken = tokenData.access_token;

    // 2. 获取用户信息
    const feishuUser = await this.getUserInfo(userAccessToken);
    const { open_id, name, mobile, email, avatar_url } = feishuUser;

    logger.info(`Feishu login attempt: open_id=${open_id}, name=${name}`);

    // 3. 查找是否已有飞书绑定
    let user = await prisma.user.findFirst({
      where: {
        feishuOpenId: open_id
      }
    });

    if (user) {
      // 已绑定，直接登录
      logger.info(`Feishu login: user ${user.username} logged in via Feishu`);
      return {
        user: this.sanitizeUser(user),
        isNewUser: false,
        isBound: true
      };
    }

    // 4. 未绑定，尝试通过手机号或邮箱查找已有账号
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: mobile },
          { email: email }
        ]
      }
    });

    if (existingUser) {
      // 绑定已有账号
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          feishuOpenId: open_id,
          avatar: avatar_url || existingUser.avatar
        }
      });

      logger.info(`Feishu login: bound to existing user ${user.username}`);
      return {
        user: this.sanitizeUser(user),
        isNewUser: false,
        isBound: true
      };
    }

    // 5. 创建新用户
    const username = this.generateUsername(name, open_id);
    const randomPassword = bcrypt.hashSync(Math.random().toString(36), 12);

    user = await prisma.user.create({
      data: {
        username,
        password: randomPassword,
        phone: mobile || null,
        email: email || null,
        feishuOpenId: open_id,
        avatar: avatar_url,
        status: 'active'
      }
    });

    logger.info(`Feishu login: created new user ${user.username}`);
    return {
      user: this.sanitizeUser(user),
      isNewUser: true,
      isBound: true
    };
  }

  /**
   * 生成用户名（避免重复）
   */
  generateUsername(name, openId) {
    // 使用飞书名字 + openId后4位
    const baseName = name || 'feishu_user';
    const suffix = openId.slice(-4);
    let username = `${baseName}_${suffix}`;
    
    // 移除特殊字符，只保留字母数字下划线
    username = username.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_');
    
    return username.substring(0, 50); // 限制长度
  }

  /**
   * 清理用户敏感信息
   */
  sanitizeUser(user) {
    const { password, ...safeUser } = user;
    return safeUser;
  }
}
