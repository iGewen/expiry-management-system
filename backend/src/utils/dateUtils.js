/**
 * 日期计算工具函数 - 统一业务规则
 * 
 * 业务规则：
 * - 到期日 = 生产日期 + 保质期 - 1（生产当天算第1天）
 * - 剩余天数 = 到期日 - 当前日期（不包含今天）
 * 
 * 示例：
 * - 生产日期 2026-03-10，保质期 15 天
 * - 到期日 = 2026-03-10 + 15 - 1 = 2026-03-24
 * - 当前 2026-03-18，剩余天数 = 24 - 18 = 6 天
 */

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);

/**
 * 解析日期字符串为 dayjs 对象（UTC 模式）
 */
export function parseUTCDate(dateStr) {
  if (!dateStr) return null;
  return dayjs.utc(dateStr).startOf("day");
}

/**
 * 计算到期日
 * @param {string} productionDate - 生产日期 YYYY-MM-DD
 * @param {number} shelfLife - 保质期天数
 * @returns {Date} 到期日 Date 对象
 */
export function calculateExpiryDate(productionDate, shelfLife) {
  const prod = parseUTCDate(productionDate);
  // 核心规则：到期日 = 生产日期 + 保质期 - 1
  return prod.add(shelfLife - 1, "day").toDate();
}

/**
 * 计算剩余天数
 * @param {string|Date} expiryDate - 到期日
 * @param {Date} currentDate - 当前日期（可选，默认今天）
 * @returns {number} 剩余天数（可为负数）
 */
export function calculateRemainingDays(expiryDate, currentDate) {
  const expiry = parseUTCDate(expiryDate);
  const today = currentDate ? parseUTCDate(currentDate) : dayjs.utc().startOf("day");
  // 剩余天数 = 到期日 - 当前日期（不包含今天，即日期差）
  return expiry.diff(today, "day");
}

/**
 * 计算商品状态
 * @param {number} remainingDays - 剩余天数
 * @param {number} reminderDays - 提前提醒天数
 * @returns {string} EXPIRED | WARNING | NORMAL
 */
export function calculateStatus(remainingDays, reminderDays) {
  if (remainingDays < 0) {
    return "EXPIRED";
  } else if (remainingDays <= reminderDays) {
    return "WARNING";
  }
  return "NORMAL";
}

export { dayjs };
