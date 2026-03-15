-- 更新 reminder_settings 表结构
-- 1. 添加 phones 列存储多个手机号
-- 2. 移除 advanceDays 列

-- 添加 phones 列
ALTER TABLE reminder_settings ADD COLUMN phones VARCHAR(500) NOT NULL DEFAULT '[]';

-- 删除 advanceDays 列
ALTER TABLE reminder_settings DROP COLUMN advanceDays;
