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

    <!-- 登录主体 -->
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
          <p class="slogan">智能管理 / 预防过期 / 保障品质</p>

          <!-- 功能列表 -->
          <div class="features">
            <div class="feature-item">
              <div class="feature-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
              </div>
              <div class="feature-text">
                <span class="feature-title">实时监控商品保质期</span>
                <span class="feature-desc">全天候自动追踪，精准掌握每件商品状态</span>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div class="feature-text">
                <span class="feature-title">智能预警提醒机制</span>
                <span class="feature-desc">多级预警策略，确保零遗漏零损失</span>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <div class="feature-text">
                <span class="feature-title">数据统计分析报表</span>
                <span class="feature-desc">可视化数据洞察，辅助科学决策</span>
              </div>
            </div>
          </div>

          <!-- 底部说明 -->
          <div class="service-promise">
            <span class="promise-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              数据安全保障
            </span>
            <span class="promise-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
              </svg>
              7x24技术支持
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
            <h2 class="form-title">欢迎登录</h2>
            <p class="form-subtitle">请使用您的账号登录系统</p>
          </div>

          <el-form
            ref="formRef"
            :model="loginForm"
            :rules="rules"
            class="auth-form"
          >
            <el-form-item prop="username">
              <div class="input-group">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input
                  type="text"
                  class="input-field"
                  placeholder="请输入用户名/手机号"
                  v-model="loginForm.username"
                  @keyup.enter="handleLogin"
                />
              </div>
            </el-form-item>

            <el-form-item prop="password">
              <div class="input-group">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  :type="showPassword ? 'text' : 'password'"
                  class="input-field"
                  placeholder="请输入密码"
                  v-model="loginForm.password"
                  @keyup.enter="handleLogin"
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

            <div class="form-options">
              <label class="checkbox-wrapper">
                <input type="checkbox" class="sr-only" v-model="loginForm.remember" />
                <span class="checkbox-custom">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </span>
                <span class="checkbox-label">记住我</span>
              </label>
              <router-link to="/forgot-password" class="link">忘记密码?</router-link>
            </div>

            <button type="button" class="btn-primary" :disabled="loading" @click="handleLogin">
              {{ loading ? '登录中...' : '登录' }}
            </button>

            <!-- 飞书登录 -->
            <div v-if="feishuEnabled" class="feishu-login">
              <div class="divider">
                <span>或</span>
              </div>
              <button type="button" class="btn-secondary" :disabled="feishuLoading" @click="handleFeishuLogin">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                飞书扫码登录
              </button>
            </div>

            <p class="register-link">
              还没有账号? <router-link to="/register" class="link">立即注册</router-link>
            </p>

            <div class="policy-links">
              <a href="#" class="policy-link">免责声明</a>
              <span class="divider-dot">|</span>
              <a href="#" class="policy-link">隐私政策</a>
            </div>
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import type { LoginForm } from '@/types'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const feishuEnabled = ref(false)
const feishuLoading = ref(false)
const showPassword = ref(false)

const loginForm = reactive<LoginForm>({
  username: '',
  password: '',
  remember: false
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

// 检查飞书登录是否可用
onMounted(async () => {
  try {
    const res = await authApi.getFeishuStatus()
    if (res.success && res.data?.enabled) {
      feishuEnabled.value = true
    }
  } catch (error) {
    console.log('Feishu login not available')
  }
})

const handleLogin = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const res = await authApi.login(loginForm.username, loginForm.password)
      
      if (res.success && res.data) {
        const { user, token, refreshToken } = res.data as any
        userStore.setUser(user)
        userStore.setToken(token, refreshToken)
        
        ElMessage.success('登录成功')
        
        // 如果有重定向地址，跳转到目标页面
        const redirect = router.currentRoute.value.query.redirect as string
        router.push(redirect || '/')
      }
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      loading.value = false
    }
  })
}

// 飞书登录
const handleFeishuLogin = async () => {
  feishuLoading.value = true
  try {
    const res = await authApi.getFeishuAuthorizeUrl()
    if (res.success && res.data?.url) {
      // 跳转到飞书授权页面
      window.location.href = res.data.url
    }
  } catch (error) {
    console.error('Feishu login error:', error)
    ElMessage.error('飞书登录失败，请稍后重试')
  } finally {
    feishuLoading.value = false
  }
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

// 品牌区域 - flex, gap: 16px, mb: 8
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
  margin: 0 0 24px 0;
  letter-spacing: 0.1em;
}

// 功能列表
.features {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  opacity: 0;
  transform: translateX(-20px);
  animation: slideIn 0.5s ease forwards;

  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
}

@keyframes slideIn {
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
}

.feature-icon {
  width: 36px;
  height: 36px;
  background: var(--accent-subtle);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--fg-primary);
}

.feature-desc {
  font-size: 14px;
  color: var(--fg-secondary);
}

// 底部说明
.service-promise {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid var(--border);
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
  margin-bottom: 32px;
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
    margin-bottom: 20px;
  }
}

// 输入框组
.input-group {
  position: relative;
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

// 复选框
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 1px solid var(--border);
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background: var(--input-bg);

  svg {
    width: 12px;
    height: 12px;
    color: white;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
}

.checkbox-wrapper input:checked + .checkbox-custom {
  background: var(--accent);
  border-color: var(--accent);

  svg {
    opacity: 1;
  }
}

.checkbox-label {
  font-size: 14px;
  color: var(--fg-secondary);
}

// 链接样式
.link {
  color: var(--accent);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s ease;

  &:hover {
    color: var(--accent-light);
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

// 分隔线
.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 24px 0;
  color: var(--fg-muted);
  font-size: 13px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }
}

// 次级按钮
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;

  &:hover:not(:disabled) {
    background: rgba(30, 58, 95, 0.03);
    border-color: var(--fg-muted);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

// 注册链接
.register-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: var(--fg-secondary);
}

// 政策链接
.policy-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
  font-size: 12px;
}

.policy-link {
  color: var(--fg-muted);
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: var(--fg-secondary);
  }
}

.divider-dot {
  color: var(--fg-muted);
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
// 响应式 - ≥1024px 显示左右分栏
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

// <1024px 单栏布局
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

  .input-field {
    height: 44px;
    font-size: 14px;
  }

  .btn-primary,
  .btn-secondary {
    height: 44px;
    font-size: 14px;
  }
}

// ========================================
// 屏幕阅读器专用类（隐藏元素但保持可访问性）
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

// 减少动画
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
