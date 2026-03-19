const http = require('http');
const { exec } = require('child_process');
const crypto = require('crypto');

// 配置
const CONFIG = {
  port: 9000,
  secret: process.env.WEBHOOK_SECRET || 'default-secret', // Webhook 密钥
  projectPath: '/var/www/expiry-management-system',
  branches: ['main'] // 监听的分支
};

// 执行命令
function runCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`执行: ${command}`);
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(`错误: ${error}`);
        reject(error);
        return;
      }
      console.log(`输出: ${stdout}`);
      if (stderr) console.error(`stderr: ${stderr}`);
      resolve(stdout);
    });
  });
}

// 验证 webhook 签名
function verifySignature(body, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// 部署函数
async function deploy() {
  console.log('[' + new Date().toISOString() + '] 开始部署...');
  
  try {
    const { projectPath } = CONFIG;
    
    // 1. 拉取最新代码
    await runCommand('git pull origin main', projectPath);
    
    // 2. 安装后端依赖（如果有更新）
    await runCommand('npm install', `${projectPath}/backend`);
    
    // 3. 生成 Prisma Client
    await runCommand('npx prisma generate', `${projectPath}/backend`);
    
    // 4. 安装前端依赖
    await runCommand('npm install', `${projectPath}/frontend`);
    
    // 5. 构建前端
    await runCommand('npm run build', `${projectPath}/frontend`);
    
    // 6. 重启后端服务
    await runCommand('pm2 restart expiry-backend', projectPath);
    
    console.log('[' + new Date().toISOString() + '] 部署完成！');
    return true;
  } catch (error) {
    console.error('[' + new Date().toISOString() + '] 部署失败:', error);
    return false;
  }
}

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  // 只接受 POST 请求到 /webhook 路径
  if (req.method !== 'POST' || req.url !== '/webhook') {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      // 验证签名（如果配置了密钥）
      const signature = req.headers['x-hub-signature-256'];
      if (CONFIG.secret && signature) {
        if (!verifySignature(body, signature, CONFIG.secret)) {
          res.statusCode = 401;
          res.end('Unauthorized');
          return;
        }
      }

      // 解析 webhook 数据
      const payload = JSON.parse(body);
      const branch = payload.ref?.replace('refs/heads/', '');
      
      console.log(`收到 push 事件，分支: ${branch}`);

      // 检查是否是监听的分支
      if (!CONFIG.branches.includes(branch)) {
        res.statusCode = 200;
        res.end(`忽略分支: ${branch}`);
        return;
      }

      // 立即响应，避免超时
      res.statusCode = 202;
      res.end('部署任务已启动');

      // 异步执行部署
      deploy();
      
    } catch (error) {
      console.error('处理 webhook 错误:', error);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });
});

server.listen(CONFIG.port, () => {
  console.log(`Webhook 服务已启动，监听端口: ${CONFIG.port}`);
  console.log(`Webhook URL: http://your-server:${CONFIG.port}/webhook`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('正在关闭 webhook 服务...');
  server.close(() => {
    process.exit(0);
  });
});
