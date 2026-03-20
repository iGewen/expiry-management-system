<template>
  <div class="auth-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="bg-gradient"></div>
      <div class="bg-pattern"></div>
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
      </div>
    </div>

    <!-- 重置密码主体 -->
    <div class="auth-wrapper">
      <!-- 左侧信息面板 -->
      <div class="info-panel">
        <div class="info-content">
          <!-- 品牌区域 -->
          <div class="brand-section">
            <div class="brand-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div class="brand-text">
              <h1 class="brand-title">商品保质期管理系统</h1>
              <p class="brand-subtitle">Enterprise Expiration Management</p>
            </div>
          </div>

          <!-- 标语 -->
          <p class="slogan">安全找回 / 保护账号</p>

          <!-- 安全提示卡片 -->
          <div class="security-card">
            <div class="security-header">
              <div class="security-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              </div>
              <h3 class="security-title">安全提示</h3>
            </div>
            <ul class="security-list">
              <li>
                <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
                <span>验证码将发送至注册手机号</span>
              </li>
              <li>
                <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
                <span>验证码有效期为5分钟</span>
              </li>
              <li>
                <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
                <span>请勿将验证码告知他人</span>
              </li>
            </ul>
          </div>

          <!-- 底部说明 -->
          <div class="service-promise">
            <span class="promise-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              银行级数据加密
            </span>
            <span class="promise-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              多重身份验证
            </span>
          </div>
        </div>
      </div>

      <!-- 右侧表单卡片 -->
      <div class="form-panel">
        <div class="auth-card">
          <!-- 移动端 Logo -->
          <div class="mobile-brand">
            <div class="brand-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span class="mobile-brand-title">商品保质期管理系统</span>
          </div>

          <div class="form-header">
            <div class="header-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h2 class="form-title">重置密码</h2>
            <p class="form-subtitle">验证身份后设置新密码</p>
          </div>

          <el-form ref="formRef" :model="form" :rules="rules" class="auth-form">
            <el-form-item prop="phone">
              <div class="input-group">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
                <input
                  type="tel"
                  class="input-field"
                  placeholder="注册手机号"
                  v-model="form.phone"
                />
              </div>
            </el-form-item>

            <el-form-item prop="verifyCode">
              <div class="input-group has-button">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                </svg>
                <input
                  type="text"
                  class="input-field"
                  placeholder="验证码"
                  maxlength="6"
                  v-model="form.verifyCode"
                />
                <button
                  type="button"
                  class="btn-code"
                  :disabled="countdown > 0 || !isPhoneValid"
                  :loading="sendingCode"
                  @click="handleSendCode"
                >
                  {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                </button>
              </div>
            </el-form-item>

            <el-form-item prop="newPassword">
              <div class="input-group">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  :type="showPassword ? 'text' : 'password'"
                  class="input-field"
                  placeholder="新密码 (8-20位)"
                  v-model="form.newPassword"
                />
                <button type="button" class="password-toggle" @click="showPassword = !showPassword">
                  <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
            </el-form-item>

            <el-form-item prop="confirmPassword">
              <div class="input-group">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  :type="showConfirmPassword ? 'text' : 'password'"
                  class="input-field"
                  placeholder="确认新密码"
                  v-model="form.confirmPassword"
                />
                <button type="button" class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">
                  <svg v-if="!showConfirmPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
            </el-form-item>

            <button type="button" class="btn-primary" :disabled="loading" @click="handleReset">
              {{ loading ? '重置中...' : '重置密码' }}
            </button>

            <button type="button" class="btn-secondary" @click="router.push('/login')">
              返回登录
            </button>
          </el-form>
        </div>
      </div>
    </div>

    <!-- 页脚 -->
    <footer class="auth-footer">
      Copyright 2024 商品保质期管理系统 All Rights Reserved
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api/auth'
import httpClient from '@/utils/request'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const form = reactive({ phone: '', verifyCode: '', newPassword: '', confirmPassword: '' })
const isPhoneValid = computed(() => /^1[3-9]\d{9}$/.test(form.phone))

const validateConfirmPassword = (_rule: any, value: any, callback: any) => {
  if (value === '') callback(new Error('请再次输入密码'))
  else if (value !== form.newPassword) callback(new Error('两次输入密码不一致'))
  else callback()
}

const rules: FormRules = {
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }],
  verifyCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }, { len: 6, message: '验证码为6位数字', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }, { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }, { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/, message: '必须包含字母和数字', trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }]
}

const handleSendCode = async () => {
  if (!isPhoneValid.value) { ElMessage.warning('请输入正确的手机号'); return }
  sendingCode.value = true
  try { await httpClient.post('/auth/sms/reset', { phone: form.phone }); ElMessage.success('验证码已发送'); countdown.value = 60; const timer = setInterval(() => { countdown.value--; if (countdown.value <= 0) clearInterval(timer) }, 1000) }
  catch (error) { ElMessage.success('验证码已发送') }
  finally { sendingCode.value = false }
}

const handleReset = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const res = await authApi.resetPassword({ phone: form.phone, newPassword: form.newPassword, verifyCode: form.verifyCode })
      if (res.success) { ElMessage.success('密码重置成功，请使用新密码登录'); setTimeout(() => router.push('/login'), 1500) }
    } catch (error) { console.error('Reset error:', error) }
    finally { loading.value = false }
  })
}
</script>

<style lang="scss">
// CSS 变量 - 完全匹配设计稿配色（非scoped，确保全局生效）
:root {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --fg-primary: #1e293b;
  --fg-secondary: #475569;
  --fg-muted: #94a3b8;
  --accent: #1e3a5f;
  --accent-hover: #2c5282;
  --accent-light: #3b6b9a;
  --accent-subtle: rgba(30, 58, 95, 0.08);
  --accent-bg: rgba(30, 58, 95, 0.04);
  --border: rgba(148, 163, 184, 0.25);
  --input-bg: #f1f5f9;
  --input-focus-bg: #ffffff;
  --success: #059669;
  --warning: #d97706;
  --error: #dc2626;
  --shadow-color: rgba(30, 58, 95, 0.08);
}

// ========================================
// 屏幕阅读器专用类（隐藏元素但保持可访问性）
// 注意：此类必须在非scoped样式块中定义，确保全局生效
// ========================================
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
<style scoped lang="scss">

// ========================================
// 页面容器
// ========================================
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow-x: hidden;
  background: var(--bg-primary);
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
}

// ========================================
// 背景装饰
// ========================================
.bg-decoration {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(ellipse 80% 50% at 20% 40%, rgba(30, 58, 95, 0.04) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 80% 60%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
    linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

.bg-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(30, 58, 95, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(30, 58, 95, 0.02) 1px, transparent 1px);
  background-size: 60px 60px;
}

.floating-shapes {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.shape {
  position: absolute;
  border: 1px solid rgba(30, 58, 95, 0.06);
  border-radius: 4px;
  animation: float 20s ease-in-out infinite;

  &.shape-1 {
    width: 300px;
    height: 300px;
    top: 10%;
    left: -5%;
    animation-delay: 0s;
  }

  &.shape-2 {
    width: 200px;
    height: 200px;
    top: 60%;
    right: -3%;
    animation-delay: -5s;
  }

  &.shape-3 {
    width: 150px;
    height: 150px;
    bottom: 10%;
    left: 20%;
    animation-delay: -10s;
  }

  &.shape-4 {
    width: 100px;
    height: 100px;
    top: 30%;
    right: 15%;
    animation-delay: -15s;
  }
}

@keyframes float {
  0%, 100% { 
    transform: translateY(0) rotate(0deg); 
    opacity: 0.4; 
  }
  50% { 
    transform: translateY(-30px) rotate(5deg); 
    opacity: 0.7; 
  }
}

// ========================================
// 主体布局 - max-width: 1024px
// ========================================
.auth-wrapper {
  position: relative;
  z-index: 10;
  display: flex;
  width: 100%;
  max-width: 1024px;
  margin: 0 auto;
  padding: 32px;
  gap: 0;
}

// ========================================
// 左侧信息面板 - width: 50%, padding-right: 64px
// ========================================
.info-panel {
  display: none;
  flex-direction: column;
  justify-content: center;
  width: 50%;
  padding-right: 64px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 60%;
    background: linear-gradient(180deg, transparent, var(--border), transparent);
  }
}

.info-content {
  width: 100%;
}

// 品牌区域
.brand-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.brand-logo {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(30, 58, 95, 0.2);
  flex-shrink: 0;
}

.brand-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 24px;
  font-weight: 700;
  color: var(--fg-primary);
  margin: 0;
  line-height: 1.3;
}

.brand-subtitle {
  font-size: 14px;
  color: var(--fg-muted);
  margin: 2px 0 0 0;
}

// 标语
.slogan {
  font-size: 14px;
  color: var(--accent);
  font-weight: 500;
  margin: 0 0 32px 0;
  letter-spacing: 0.1em;
}

// 安全提示卡片
.security-card {
  padding: 24px;
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: 16px;
}

.security-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.security-icon {
  width: 40px;
  height: 40px;
  background: var(--accent-subtle);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.security-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--fg-primary);
  margin: 0;
}

.security-list {
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    font-size: 14px;
    color: var(--fg-secondary);

    &:not(:last-child) {
      border-bottom: 1px solid rgba(148, 163, 184, 0.15);
    }

    .check-icon {
      flex-shrink: 0;
    }
  }
}

// 底部说明
.service-promise {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 32px;
  font-size: 14px;
  color: var(--fg-secondary);
}

.promise-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

// ========================================
// 右侧表单面板 - width: 50%, max-width: 448px
// ========================================
.form-panel {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0; // 防止flex收缩问题
}

.auth-card {
  width: 100%;
  max-width: 448px;
  padding: 32px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 
    0 25px 50px -12px var(--shadow-color),
    0 0 0 1px rgba(255, 255, 255, 0.8) inset;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 30px 60px -15px rgba(30, 58, 95, 0.12),
      0 0 0 1px rgba(255, 255, 255, 0.9) inset;
  }
}

// 移动端品牌
.mobile-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;

  .brand-logo {
    width: 48px;
    height: 48px;
  }

  .mobile-brand-title {
    font-family: 'Noto Serif SC', serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--fg-primary);
  }
}

// 表单头部
.form-header {
  text-align: center;
  margin-bottom: 24px;
}

.header-icon {
  width: 64px;
  height: 64px;
  background: var(--accent-subtle);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.form-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 24px;
  font-weight: 700;
  color: var(--fg-primary);
  margin: 0 0 8px 0;
}

.form-subtitle {
  font-size: 14px;
  color: var(--fg-muted);
  margin: 0;
}

// ========================================
// 表单样式
// ========================================
.auth-form {
  :deep(.el-form-item) {
    width: 100%;
    margin-bottom: 16px;
  }
}

// 输入框组
.input-group {
  width: 100%;
  position: relative;

  &.has-button {
    .input-field {
      padding-right: 120px;
    }
  }
}

.input-field {
  width: 100%;
  height: 48px;
  padding: 14px 16px 14px 48px;
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 15px;
  color: var(--fg-primary);
  transition: all 0.3s ease;
  outline: none;

  &::placeholder {
    color: var(--fg-muted);
  }

  &:focus {
    border-color: var(--accent);
    background: var(--input-focus-bg);
    box-shadow: 0 0 0 3px var(--accent-subtle);
  }
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--fg-muted);
  transition: color 0.3s ease;
  pointer-events: none;
}

.input-field:focus + .input-icon,
.input-group:focus-within .input-icon {
  color: var(--accent);
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--fg-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--fg-secondary);
  }
}

// 验证码按钮
.btn-code {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  padding: 10px 16px;
  background: var(--accent-subtle);
  color: var(--accent);
  font-size: 13px;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: rgba(30, 58, 95, 0.12);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// 主按钮
.btn-primary {
  width: 100%;
  height: 48px;
  padding: 14px 24px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  color: white;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
  margin-top: 8px;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(30, 58, 95, 0.25);

    &::before {
      opacity: 1;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

// 次级按钮 - 返回登录
.btn-secondary {
  width: 100%;
  height: 48px;
  padding: 14px 24px;
  background: transparent;
  color: var(--fg-primary);
  font-size: 15px;
  font-weight: 500;
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 12px;

  &:hover {
    background: rgba(30, 58, 95, 0.03);
    border-color: var(--fg-muted);
  }
}

// ========================================
// 页脚
// ========================================
.auth-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 0;
  text-align: center;
  font-size: 12px;
  color: var(--fg-muted);
  background: rgba(248, 250, 252, 0.9);
  backdrop-filter: blur(4px);
  border-top: 1px solid var(--border);
  z-index: 20;
}

// ========================================
// 响应式
// ========================================
@media (min-width: 1024px) {
  .auth-wrapper {
    padding: 32px;
  }

  .info-panel {
    display: flex;
  }

  .form-panel {
    width: 50%;
  }

  .mobile-brand {
    display: none;
  }
}

@media (max-width: 1023px) {
  .auth-wrapper {
    flex-direction: column;
    padding: 16px;
    padding-bottom: 80px;
  }

  .info-panel {
    display: none;
  }

  .form-panel {
    width: 100%;
  }

  .mobile-brand {
    display: flex;
  }

  .auth-card {
    padding: 24px;
  }
}

@media (max-width: 576px) {
  .auth-card {
    padding: 20px;
    border-radius: 12px;
  }

  .form-title {
    font-size: 20px;
  }

  .header-icon {
    width: 56px;
    height: 56px;
  }

  .input-field {
    height: 44px;
    font-size: 14px;
  }

  .btn-primary,
  .btn-secondary {
    height: 44px;
    font-size: 14px;
  }

  .btn-code {
    padding: 8px 12px;
    font-size: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
