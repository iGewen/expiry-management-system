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
   * 验证飞书 Webhook 地址并发送测试消息
   * 添加 URL 白名单验证，防止 SSRF 攻击
   */
  async validateWebhook(webhookUrl) {
    try {
      // 1. 验证 URL 格式
      if (!webhookUrl || typeof webhookUrl !== 'string') {
        throw new Error('Webhook 地址格式无效');
      }

      let url;
      try {
        url = new URL(webhookUrl);
      } catch (e) {
        throw new Error('Webhook 地址格式无效');
      }

      // 2. 只允许 HTTPS 协议
      if (url.protocol !== 'https:') {
        throw new Error('Webhook 地址必须使用 HTTPS 协议');
      }

      // 3. 白名单验证：只允许飞书官方域名
      const allowedHosts = [
        'open.feishu.cn',
        'open.larksuite.com'
      ];
      
      if (!allowedHosts.includes(url.hostname)) {
        logger.error(`Invalid webhook host: ${url.hostname}. Only Feishu/Lark official domains are allowed.`);
        throw new Error('Webhook 地址必须是飞书官方域名（open.feishu.cn 或 open.larksuite.com）');
      }

      // 4. 发送测试消息
      const response = await axios.post(webhookUrl, {
        msg_type: 'text',
        content: {
          text: '🔗 飞书机器人配置成功！\n\n这是一条测试消息，来自过期管理系统。'
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      // 飞书机器人返回 StatusCode 为 0 表示成功
      if (response.data?.StatusCode === 0 || response.data?.code === 0) {
        logger.info('Feishu webhook test successful');
        return true;
      }

      logger.warn('Feishu webhook test failed:', response.data);
      return false;
    } catch (error) {
      logger.error('Feishu webhook validation error:', error.message);
      throw new Error(error.message || '飞书 Webhook 地址无效或无法访问');
    }
  }

    /**
   * 发送飞书提醒消息（带重试机制）
   */
  async sendReminder(webhookUrl, products, maxRetries = 3) {
    if (!products || products.length === 0) {
      logger.warn("No products to send in Feishu reminder");
      return false;
    }

    const productText = products.map((p, i) => 
      `${i + 1}. ${p.name} - 剩余 ${p.remainingDays} 天`
    ).join("\n");

    logger.info(`Sending Feishu reminder to ${webhookUrl.substring(0, 50)}... with ${products.length} products`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(webhookUrl, {
          msg_type: "interactive",
          card: {
            header: {
              title: {
                tag: "plain_text",
                content: "⚠️ 商品过期提醒"
              },
              template: "orange"
            },
            elements: [
              {
                tag: "div",
                text: {
                  tag: "lark_md",
                  content: `**以下商品即将过期：**\n\n${productText}`
                }
              },
              {
                tag: "note",
                elements: [
                  {
                    tag: "plain_text",
                    content: `共 ${products.length} 件商品需要处理`
                  }
                ]
              }
            ]
          }
        }, {
          headers: {
            "Content-Type": "application/json"
          },
          timeout: 10000
        });

        const success = response.data?.StatusCode === 0 || response.data?.code === 0;
        logger.info(`Feishu reminder result (attempt ${attempt}): ${JSON.stringify(response.data)}`);
        
        if (success) {
          return true;
        }
        
        // 检查是否是限流错误
        if (response.data?.code === 11232 || response.data?.msg?.includes("frequency limited")) {
          if (attempt < maxRetries) {
            const waitTime = attempt * 3000;
            logger.warn(`Feishu rate limited, retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }
        
        return false;
      } catch (error) {
        logger.error(`Failed to send Feishu reminder (attempt ${attempt}):`, error.message);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
    
    return false;
  }

  /**
   * 检查飞书登录是否配置
   */
  isConfigured() {
    return !!(this.appId && this.appSecret && this.redirectUri);
  }

  /**
   * 获取飞书登录授权 URL
   * 需要获取用户手机号权限
   */
  getAuthorizationUrl(state) {
    if (!this.isConfigured()) {
      throw new Error('飞书登录未配置');
    }

    const params = new URLSearchParams({
      app_id: this.appId,
      redirect_uri: this.redirectUri,
      state: state || '',
      scope: 'contact:user.phone:readonly contact:user.base:readonly' // 获取用户手机号和基本信息
    });

    return `https://accounts.feishu.cn/open-apis/authen/v1/authorize?${params.toString()}`;
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
   * 飞书登录 - 第一步：获取用户信息
   * 返回飞书用户信息，不自动创建账号
   * 如果手机号匹配已有账号，自动绑定并登录
   */
  async getFeishuUserInfo(code) {
    if (!this.isConfigured()) {
      throw new Error('飞书登录未配置');
    }

    // 1. 通过 code 获取用户 token
    const tokenData = await this.getUserAccessToken(code);
    const userAccessToken = tokenData.access_token;

    // 2. 获取用户信息
    const feishuUser = await this.getUserInfo(userAccessToken);
    const { open_id, name, mobile, email, avatar_url } = feishuUser;

    // 处理手机号格式：去掉国际区号
    let cleanMobile = mobile;
    if (cleanMobile && cleanMobile.startsWith('+86')) {
      cleanMobile = cleanMobile.substring(3);
    }

    logger.info(`Feishu login attempt: open_id=${open_id}, name=${name}, mobile=${cleanMobile ? cleanMobile.slice(0,3)+'****'+cleanMobile.slice(-4) : 'none'}`);

    // 3. 检查是否已绑定
    const existingUser = await prisma.user.findFirst({
      where: { feishuOpenId: open_id }
    });

    if (existingUser) {
      // 已绑定，直接返回用户
      return {
        isBound: true,
        user: this.sanitizeUser(existingUser),
        feishuInfo: null
      };
    }

    // 4. 如果有手机号，检查是否匹配已有账号
    if (cleanMobile) {
      const existingPhoneUser = await prisma.user.findFirst({
        where: { phone: cleanMobile }
      });

      if (existingPhoneUser) {
        // 自动绑定并登录
        const updatedUser = await prisma.user.update({
          where: { id: existingPhoneUser.id },
          data: {
            feishuOpenId: open_id,
            avatar: avatar_url || existingPhoneUser.avatar
          }
        });

        logger.info(`Auto-bound Feishu to existing user ${updatedUser.username} by phone ${cleanMobile}`);

        return {
          isBound: true,
          user: this.sanitizeUser(updatedUser),
          feishuInfo: null
        };
      }
    }

    // 5. 未绑定，返回飞书用户信息（跳转注册页）
    return {
      isBound: false,
      user: null,
      feishuInfo: {
        openId: open_id,
        name: name,
        mobile: cleanMobile,
        email: email,
        avatar: avatar_url
      }
    };
  }

  /**
   * 生成随机用户名
   * 格式：feishu_ + 5位随机字母
   */
  generateRandomUsername() {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let suffix = '';
    for (let i = 0; i < 5; i++) {
      suffix += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return `feishu_${suffix}`;
  }

  /**
   * 绑定已有账号
   */
  async bindExistingAccount(openId, username, password) {
    // 验证用户名密码
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      throw new Error('用户名或密码错误');
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('用户名或密码错误');
    }

    // 检查该飞书账号是否已被绑定
    const existingBind = await prisma.user.findFirst({
      where: { feishuOpenId: openId }
    });

    if (existingBind) {
      throw new Error('该飞书账号已被其他用户绑定');
    }

    // 绑定
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { feishuOpenId: openId }
    });

    logger.info(`User ${user.username} bound Feishu account`);

    return this.sanitizeUser(updatedUser);
  }

  /**
   * 创建飞书新账号（使用飞书手机号）
   */
  async createNewAccount(feishuInfo) {
    const { openId, name, mobile, email, avatar } = feishuInfo;

    // 检查是否已绑定
    const existingUser = await prisma.user.findFirst({
      where: { feishuOpenId: openId }
    });

    if (existingUser) {
      throw new Error('该飞书账号已绑定其他用户');
    }

    // 如果有手机号，检查是否已存在
    if (mobile) {
      const existingPhone = await prisma.user.findFirst({
        where: { phone: mobile }
      });
      if (existingPhone) {
        throw new Error('该手机号已注册，请绑定已有账号');
      }
    }

    // 生成用户名：feishu_ + 5位随机字母
    const username = this.generateRandomUsername();
    const randomPassword = bcrypt.hashSync(Math.random().toString(36), 12);

    const user = await prisma.user.create({
      data: {
        username,
        password: randomPassword,
        phone: mobile || null,
        email: email || null,
        feishuOpenId: openId,
        avatar: avatar || null,
        isActive: true
      }
    });

    logger.info(`Created new user via Feishu: ${user.username}, phone: ${mobile || 'none'}`);

    return this.sanitizeUser(user);
  }

  /**
   * 解绑飞书账号
   */
  async unbindFeishuAccount(userId) {
    // 检查用户
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    if (!user.feishuOpenId) {
      throw new Error('该用户未绑定飞书账号');
    }

    // 解绑
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { feishuOpenId: null }
    });

    logger.info(`User ${user.username} unbound Feishu account`);

    return this.sanitizeUser(updatedUser);
  }

  /**
   * 生成用户名（避免重复）- 已废弃
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
    // 将 Prisma 对象转换为普通对象
    const plainUser = JSON.parse(JSON.stringify(user));
    const { password, ...safeUser } = plainUser;
    return safeUser;
  }
}

// 默认导出
export default new FeishuService();
