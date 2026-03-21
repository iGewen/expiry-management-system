# 代码规范文档

## 1. 环境变量读取规范

### 必须使用 `config` 对象
```javascript
// ✅ 正确
import { config } from '../config/index.js';
const secret = config.jwt.secret;

// ❌ 错误
const secret = process.env.JWT_SECRET;
```

### config/index.js 集中管理
所有环境变量必须在 `backend/src/config/index.js` 中定义并导出。

## 2. 数据库操作规范

### 必须使用 Prisma
```javascript
// ✅ 正确
import prisma from '../config/database.js';
const user = await prisma.user.findUnique({ where: { id } });

// ❌ 错误
直接使用 mysql/sequelize
```

### 数据库迁移命令
```bash
# 开发环境
npm run prisma:migrate

# 生产环境 - 使用 db push 确保表存在
npx prisma db push

# 或使用 migrate deploy（需要先确保迁移表存在）
npx prisma migrate deploy
```

## 3. 错误处理规范

### Controller 层
```javascript
async controllerMethod(req, res) {
  try {
    // 业务逻辑
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
```

### 中间件层
```javascript
// 使用 express-async-errors 自动捕获
app.use(async (err, req, res, next) => {
  logger.error(err);
  res.status(err.status || 500).json({ success: false, message: err.message });
});
```

## 4. 日志规范

### 使用统一日志模块
```javascript
import logger from '../utils/logger.js';

logger.info('信息日志');
logger.warn('警告日志');
logger.error('错误日志', error);
```

## 5. Prisma Schema 规范

### 每次修改 Schema 后必须：
1. 运行 `npx prisma migrate dev` 创建迁移
2. 确保迁移文件完整
3. 提交迁移文件到 GitHub

### 禁止：
- 手动修改数据库表结构
- 跳过迁移文件直接修改 Schema

## 6. API 响应格式规范

```javascript
// 成功
res.json({ success: true, data: result });

// 失败
res.status(400).json({ success: false, message: '错误信息' });

// 分页
res.json({ 
  success: true, 
  data: { items, total, page, pageSize } 
});
```

## 7. Dockerfile 规范

### 后端 Dockerfile
```dockerfile
# 必须包含 prisma generate
RUN npx prisma generate

# 启动时使用 db push 确保表存在
CMD ["sh", "-c", "npx prisma db push && node src/app.js"]
```

### 禁止在 Dockerfile 中使用 `prisma migrate dev`

## 8. Git 提交规范

### 提交前检查
- [ ] 代码格式正确 (ESLint)
- [ ] 无 console.log/print
- [ ] Schema 修改后有对应迁移文件
- [ ] 迁移文件已提交

### 提交信息格式
```
type: 描述

type: feat | fix | docs | style | refactor | test | chore
```
