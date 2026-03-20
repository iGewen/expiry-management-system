import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 文件类型检测（魔数检查）
function getFileMagicNumber(buffer) {
  // 读取文件头部的前几个字节
  return buffer.slice(0, 8).toString('hex');
}

// 允许的文件类型魔数
const FILE_SIGNATURES = {
  // Excel .xlsx (PK zip signature)
  '504b': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Excel .xls (D0 CF)
  'd0cf': 'application/vnd.ms-excel',
  // CSV text
  'efbbbf': 'text/csv'
};

function detectFileType(buffer) {
  const magic = getFileMagicNumber(buffer);
  
  // 检查已知的文件签名
  for (const [signature, mimeType] of Object.entries(FILE_SIGNATURES)) {
    if (magic.startsWith(signature)) {
      return mimeType;
    }
  }
  
  return null;
}

// 安全存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 使用 UUID 避免文件名冲突
    const uniqueSuffix = crypto.randomUUID();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// 文件过滤 - 安全检查
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.xlsx', '.xls', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    cb(new Error('只支持 Excel (.xlsx, .xls) 和 CSV 文件'));
    return;
  }
  
  // 验证 MIME 类型
  const allowedMimes = config.upload.allowedMimeTypes;
  if (!allowedMimes.includes(file.mimetype)) {
    // 如果 MIME 类型不在列表中，检查文件内容
    // 这里会通过后续的文件类型检测来验证
  }
  
  cb(null, true);
};

// 文件大小限制
const limits = {
  fileSize: config.upload.maxSize
};

// 创建 multer 实例
export const upload = multer({
  storage,
  fileFilter,
  limits
});

// 清理上传目录中的临时文件
export async function cleanupUploads(maxAgeHours = 24) {
  try {
    const files = fs.readdirSync(uploadDir);
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    
    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    console.error('Cleanup uploads error:', error);
  }
}

// 定期清理（每小时）
setInterval(() => cleanupUploads(24), 60 * 60 * 1000);

// 文件内容验证中间件
export function verifyFileContent(req, res, next) {
  if (!req.file) {
    return next();
  }
  
  const buffer = fs.readFileSync(req.file.path);
  
  const detectedType = detectFileType(buffer);
  const ext = path.extname(req.file.originalname).toLowerCase();
  
  // 验证文件内容与扩展名是否匹配
  const validCombinations = {
    '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    '.xls': ['application/vnd.ms-excel'],
    '.csv': ['text/csv', null] // CSV可能没有明确签名
  };
  
  if (!detectedType && ext === '.csv') {
    // CSV文件允许没有签名
    return next();
  }
  
  if (!detectedType || !validCombinations[ext]?.includes(detectedType)) {
    // 删除无效文件
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      success: false,
      message: '文件内容与扩展名不匹配，可能存在安全风险'
    });
  }
  
  next();
}
