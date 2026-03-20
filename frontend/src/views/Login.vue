<template>
  <div class="auth-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="bg-grid"></div>
      <div class="bg-glow bg-glow-1"></div>
      <div class="bg-glow bg-glow-2"></div>
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
    </div>

    <!-- 登录主体 -->
    <div class="auth-wrapper">
      <!-- 左侧信息面板 -->
      <div class="info-panel">
        <div class="info-content">
          <!-- 品牌区域 -->
          <div class="brand-section">
            <div class="brand-logo">
              <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                <path d="M12 24L20 32L36 16" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="brand-text">
              <h1 class="brand-title">商品保质期管理系统</h1>
              <p class="brand-subtitle">Enterprise Expiration Management</p>
            </div>
          </div>

          <!-- 标语 -->
          <p class="slogan">智能管理 · 预防过期 · 保障品质</p>

          <!-- 功能列表 -->
          <div class="features">
            <div class="feature-item">
              <div class="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div class="feature-text">
                <span class="feature-title">实时监控商品保质期</span>
                <span class="feature-desc">自动追踪库存商品有效期状态</span>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div class="feature-text">
                <span class="feature-title">智能预警提醒机制</span>
                <span class="feature-desc">多渠道及时通知临期商品</span>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div class="feature-text">
                <span class="feature-title">数据统计分析报表</span>
                <span class="feature-desc">可视化展示过期损耗趋势</span>
              </div>
            </div>
          </div>

          <!-- 服务承诺 -->
          <div class="service-promise">
            <div class="promise-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span class="promise-text">数据安全保障 · 7×24小时服务支持</span>
          </div>
        </div>
      </div>

      <!-- 右侧表单卡片 -->
      <div class="form-panel">
        <div class="form-card">
          <div class="form-header">
            <div class="header-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
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
              <div class="input-label">用户名</div>
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                size="large"
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="password">
              <div class="input-label">密码</div>
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <div class="form-options">
                <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
                <router-link to="/forgot-password" class="link">忘记密码？</router-link>
              </div>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="btn-primary"
                :loading="loading"
                @click="handleLogin"
              >
                {{ loading ? '登录中...' : '登 录' }}
              </el-button>
            </el-form-item>

            <!-- 飞书登录 -->
            <el-form-item v-if="feishuEnabled">
              <div class="divider">
                <span>或</span>
              </div>
              <el-button
                size="large"
                class="btn-feishu"
                :loading="feishuLoading"
                @click="handleFeishuLogin"
              >
                <img src="/icon/feishu.svg" class="feishu-icon" alt="飞书" />
                飞书扫码登录
              </el-button>
            </el-form-item>

            <div class="form-footer">
              <span class="footer-text">还没有账号？</span>
              <router-link to="/register" class="link">立即注册</router-link>
            </div>
          </el-form>
        </div>

        <div class="auth-footer">
          <p class="copyright">© 2024 商品保质期管理系统. All rights reserved.</p>
          <p class="policy-links">
            <router-link to="/disclaimer" class="footer-link">免责声明</router-link>
            <span class="divider-dot">·</span>
            <router-link to="/privacy-policy" class="footer-link">隐私政策</router-link>
          </p>
        </div>
      </div>
    </div>
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

<style scoped lang="scss">
@import '@/styles/variables.scss';

// ========================================
// 页面容器
// ========================================
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: $gradient-bg-auth;
  font-family: $font-family-sans;
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

.bg-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(30, 58, 95, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(30, 58, 95, 0.02) 1px, transparent 1px);
  background-size: 60px 60px;
}

.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  
  &.bg-glow-1 {
    width: 600px;
    height: 600px;
    top: -200px;
    left: -200px;
    background: rgba(30, 58, 95, 0.04);
  }
  
  &.bg-glow-2 {
    width: 400px;
    height: 400px;
    bottom: -100px;
    right: -100px;
    background: rgba(59, 130, 246, 0.03);
  }
}

.floating-shape {
  position: absolute;
  border: 1px solid rgba(30, 58, 95, 0.06);
  border-radius: 12px;
  animation: float 20s infinite ease-in-out;
  
  &.shape-1 {
    width: 80px;
    height: 80px;
    top: 15%;
    right: 8%;
    animation-delay: 0s;
  }
  
  &.shape-2 {
    width: 60px;
    height: 60px;
    bottom: 20%;
    left: 5%;
    animation-delay: 5s;
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

// ========================================
// 主体布局
// ========================================
.auth-wrapper {
  position: relative;
  z-index: 10;
  display: flex;
  width: 1024px;
  max-width: 95%;
  min-height: 640px;
  background: $bg-card;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px $shadow-auth;
  border: 1px solid $border-auth;
  overflow: hidden;
}

// ========================================
// 左侧信息面板
// ========================================
.info-panel {
  width: 50%;
  padding-right: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-card;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: 20%;
    height: 60%;
    width: 1px;
    background: linear-gradient(transparent, $border-auth 20%, $border-auth 80%, transparent);
    transform: translateY(0);
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
  width: 56px;
  height: 56px;
  background: $gradient-accent;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 20px $shadow-logo;
  flex-shrink: 0;
}

.brand-title {
  font-size: 22px;
  font-weight: 700;
  color: $fg-primary;
  margin: 0;
  line-height: 1.3;
}

.brand-subtitle {
  font-size: 12px;
  color: $fg-muted;
  margin: 4px 0 0 0;
  letter-spacing: 0.5px;
}

// 标语
.slogan {
  font-size: 14px;
  color: $accent;
  font-weight: 600;
  margin: 0 0 24px 0;
  letter-spacing: 0.1em;
}

// 功能列表
.features {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 48px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
}

.feature-icon {
  width: 36px;
  height: 36px;
  background: $accent-subtle;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $accent;
  flex-shrink: 0;
}

.feature-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature-title {
  font-size: 15px;
  font-weight: 600;
  color: $fg-primary;
}

.feature-desc {
  font-size: 13px;
  color: $fg-secondary;
}

// 服务承诺
.service-promise {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid $border-auth;
  font-size: 14px;
}

.promise-icon {
  color: $accent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.promise-text {
  font-size: 13px;
  color: $fg-secondary;
}

// ========================================
// 右侧表单面板
// ========================================
.form-panel {
  width: 50%;
  display: flex;
  flex-direction: column;
  background: $bg-card;
}

.form-card {
  flex: 1;
  padding: 60px 56px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 448px;
  margin: 0 auto;
}

// 表单头部
.form-header {
  text-align: center;
  margin-bottom: 36px;
}

.header-icon {
  width: 64px;
  height: 64px;
  background: $accent-subtle;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: $accent;
}

.form-title {
  font-size: 26px;
  font-weight: 700;
  color: $fg-primary;
  margin: 0 0 8px 0;
}

.form-subtitle {
  font-size: 14px;
  color: $fg-muted;
  margin: 0;
}

// ========================================
// 表单样式
// ========================================
.auth-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }
  
  .input-label {
    font-size: 14px;
    font-weight: 500;
    color: $fg-primary;
    margin-bottom: 8px;
  }
  
  :deep(.el-input) {
    .el-input__wrapper {
      padding: 0 16px;
      height: 48px;
      border-radius: 12px;
      background: $input-bg;
      box-shadow: 0 0 0 1px $border-input inset;
      transition: all 0.2s ease;

      &:hover {
        box-shadow: 0 0 0 1px $accent inset;
      }

      &.is-focus {
        background: $input-focus-bg;
        box-shadow: 0 0 0 2px $accent inset, 0 0 0 4px $accent-subtle;
      }
    }

    .el-input__prefix {
      color: $fg-muted;
      margin-right: 10px;
    }
    
    &.is-focus .el-input__prefix {
      color: $accent;
    }

    .el-input__inner {
      height: 48px;
      font-size: 15px;
      color: $fg-primary;
      
      &::placeholder {
        color: $fg-muted;
      }
    }
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-top: -4px;
  
  :deep(.el-checkbox) {
    .el-checkbox__label {
      color: $fg-secondary;
      font-size: 14px;
    }
    
    .el-checkbox__input.is-checked .el-checkbox__inner {
      background-color: $accent;
      border-color: $accent;
    }
    
    .el-checkbox__input.is-checked + .el-checkbox__label {
      color: $fg-secondary;
    }
  }
}

// 链接样式
.link {
  color: $accent;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s ease;
  
  &:hover {
    color: $accent-light;
    text-decoration: underline;
  }
}

// 主按钮
.btn-primary {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
  border-radius: 12px;
  background: $gradient-accent;
  border: none;
  color: white;
  transition: all 0.2s ease;
  margin-top: 8px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px $shadow-button;
  }
  
  &:active {
    transform: translateY(0);
  }
}

// 分隔线
.divider {
  width: 100%;
  text-align: center;
  position: relative;
  margin: 8px 0;
  
  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: calc(50% - 30px);
    height: 1px;
    background: $border-input;
  }
  
  &::before {
    left: 0;
  }
  
  &::after {
    right: 0;
  }
  
  span {
    color: $fg-muted;
    font-size: 14px;
    padding: 0 16px;
  }
}

// 飞书按钮
.btn-feishu {
  width: 100%;
  height: 48px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 12px;
  background: transparent;
  border: 1px solid $border-input;
  color: $fg-primary;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  
  &:hover {
    background: rgba(30, 58, 95, 0.03);
    border-color: $accent;
  }
  
  .feishu-icon {
    width: 20px;
    height: 20px;
  }
}

// 表单底部
.form-footer {
  text-align: center;
  margin-top: 24px;
  
  .footer-text {
    color: $fg-secondary;
    font-size: 14px;
  }
}

// ========================================
// 页面底部
// ========================================
.auth-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  padding: 16px 0;
  border-top: 1px solid $border-auth;
  text-align: center;
  background: rgba($bg-primary, 0.9);
  backdrop-filter: blur(4px);
  
  .copyright {
    margin: 0 0 8px 0;
    font-size: 12px;
    color: $fg-muted;
  }
  
  .policy-links {
    margin: 0;
    font-size: 12px;
  }
  
  .footer-link {
    color: $fg-muted;
    text-decoration: none;
    transition: color 0.2s ease;
    
    &:hover {
      color: $fg-secondary;
    }
  }
  
  .divider-dot {
    margin: 0 8px;
    color: $fg-muted;
  }
}

// ========================================
// 响应式适配
// ========================================
@media (max-width: 992px) {
  .auth-wrapper {
    flex-direction: column;
    width: 100%;
    max-width: 480px;
    min-height: auto;
  }
  
  .info-panel {
    padding: 40px 32px;
    
    &::after {
      display: none;
    }
    
    .features {
      display: none;
    }
    
    .service-promise {
      display: none;
    }
  }
  
  .brand-section {
    margin-bottom: 0;
    justify-content: center;
  }
  
  .slogan {
    text-align: center;
    margin-bottom: 0;
  }
  
  .form-card {
    padding: 40px 32px;
  }
  
  .auth-footer {
    padding: 16px 32px;
  }
}

@media (max-width: 576px) {
  .auth-wrapper {
    border-radius: 16px;
    max-width: 95%;
  }
  
  .info-panel {
    padding: 32px 24px;
  }
  
  .brand-title {
    font-size: 18px;
  }
  
  .slogan {
    font-size: 14px;
  }
  
  .form-card {
    padding: 32px 24px;
  }
  
  .form-title {
    font-size: 22px;
  }
  
  :deep(.el-input) {
    .el-input__wrapper {
      height: 44px;
    }
    
    .el-input__inner {
      height: 44px;
    }
  }
  
  .btn-primary,
  .btn-feishu {
    height: 44px;
  }
}
</style>