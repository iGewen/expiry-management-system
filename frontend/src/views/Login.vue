<template>
  <div class="login-container">
    <!-- 背景渐变 + 装饰元素 -->
    <div class="bg-decoration">
      <div class="gradient-bg"></div>
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
      <div class="circle circle-4"></div>
    </div>

    <!-- 登录主体 -->
    <div class="login-wrapper">
      <!-- 左侧宣传区 -->
      <div class="login-banner">
        <div class="banner-content">
          <div class="logo">
            <div class="logo-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="white" fill-opacity="0.2"/>
                <path d="M12 24L20 32L36 16" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h1>商品保质期管理系统</h1>
          </div>
          <p class="slogan">智能管理 · 预防过期 · 保障品质</p>
          <div class="features">
            <div class="feature-item">
              <div class="icon-wrapper">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M8 1v14M1 8h14"/>
                </svg>
              </div>
              <span>实时监控商品保质期</span>
            </div>
            <div class="feature-item">
              <div class="icon-wrapper">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M8 1v14M1 8h14"/>
                </svg>
              </div>
              <span>智能预警提醒机制</span>
            </div>
            <div class="feature-item">
              <div class="icon-wrapper">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M8 1v14M1 8h14"/>
                </svg>
              </div>
              <span>数据统计分析报表</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="login-form-wrapper">
        <div class="form-container">
          <div class="form-header">
            <div class="header-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h2>欢迎登录</h2>
            <p>请使用您的账号登录系统</p>
          </div>

          <el-form
            ref="formRef"
            :model="loginForm"
            :rules="rules"
            class="login-form"
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <div class="form-options">
                <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
                <router-link to="/forgot-password" class="forgot-link">忘记密码？</router-link>
              </div>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="login-button"
                :loading="loading"
                @click="handleLogin"
              >
                <svg v-if="!loading" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                {{ loading ? '登录中...' : '登 录' }}
              </el-button>
            </el-form-item>

            <!-- 飞书登录 -->
            <el-form-item v-if="feishuEnabled">
              <div class="divider-text">
                <span>或</span>
              </div>
              <el-button
                size="large"
                class="feishu-button"
                :loading="feishuLoading"
                @click="handleFeishuLogin"
              >
                <svg class="feishu-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.5 15l-4-4 1.41-1.41L10.5 14.17l6.59-6.59L18.5 9l-8 8z"/>
                </svg>
                飞书扫码登录
              </el-button>
            </el-form-item>

            <div class="register-hint">
              还没有账号？
              <router-link to="/register" class="register-link">立即注册</router-link>
            </div>
          </el-form>
        </div>

        <div class="login-footer">
          <p>© 2024 商品保质期管理系统. All rights reserved.</p>
          <p class="policy-links">
            <router-link to="/disclaimer" class="policy-link">《免责声明》</router-link>
            <span class="divider">|</span>
            <router-link to="/privacy-policy" class="policy-link">《隐私政策》</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import type { LoginForm } from '@/types'

const router = useRouter()
const route = useRoute()
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

.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

// 背景装饰
.bg-decoration {
  position: absolute;
  inset: 0;
  
  .gradient-bg {
    position: absolute;
    inset: 0;
    background: $gradient-bg;
  }
  
  .circle {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%);
    animation: float 25s infinite ease-in-out;
    
    &.circle-1 {
      width: 400px;
      height: 400px;
      top: -150px;
      left: -150px;
    }
    
    &.circle-2 {
      width: 300px;
      height: 300px;
      bottom: -100px;
      right: 5%;
      animation-delay: 5s;
    }
    
    &.circle-3 {
      width: 200px;
      height: 200px;
      top: 40%;
      right: -80px;
      animation-delay: 10s;
    }
    
    &.circle-4 {
      width: 150px;
      height: 150px;
      top: 20%;
      left: 10%;
      animation-delay: 15s;
    }
  }
}

@keyframes float {
  0%, 100% { 
    transform: translateY(0) rotate(0deg) scale(1); 
  }
  50% { 
    transform: translateY(-30px) rotate(180deg) scale(1.1); 
  }
}

// 登录主体
.login-wrapper {
  position: relative;
  z-index: 1;
  display: flex;
  width: 1100px;
  max-width: 95%;
  min-height: 640px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.5);
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 
      0 25px 70px rgba(0, 0, 0, 0.1),
      0 2px 6px rgba(0, 0, 0, 0.06);
  }
}

// 左侧宣传区
.login-banner {
  flex: 1;
  background: $gradient-primary;
  padding: 60px 50px;
  display: flex;
  align-items: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');
    opacity: 0.3;
  }
}

.banner-content {
  position: relative;
  color: white;
}

.logo {
  margin-bottom: 48px;
  
  .logo-icon {
    width: 64px;
    height: 64px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    animation: fadeInDown 0.8s ease-out;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  h1 {
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    letter-spacing: 1px;
    animation: fadeInDown 0.8s ease-out 0.2s both;
  }
}

.slogan {
  font-size: 17px;
  margin-bottom: 56px;
  opacity: 0.9;
  animation: fadeInDown 0.8s ease-out 0.4s both;
  font-weight: 400;
}

.features {
  .feature-item {
    display: flex;
    align-items: center;
    margin-bottom: 24px;
    font-size: 15px;
    animation: fadeInLeft 0.8s ease-out both;
    
    &:nth-child(1) { animation-delay: 0.6s; }
    &:nth-child(2) { animation-delay: 0.8s; }
    &:nth-child(3) { animation-delay: 1s; }
    
    .icon-wrapper {
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
  }
}

// 右侧表单区
.login-form-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: transparent;
}

.form-container {
  flex: 1;
  padding: 60px 56px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-header {
  margin-bottom: 40px;
  animation: fadeInRight 0.8s ease-out;
  text-align: center;
  
  .header-icon {
    width: 64px;
    height: 64px;
    background: $gradient-primary;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    color: white;
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.25);
  }
  
  h2 {
    font-size: 26px;
    color: $text-primary;
    margin: 0 0 8px 0;
    font-weight: 700;
  }
  
  p {
    font-size: 14px;
    color: $text-secondary;
    margin: 0;
  }
}

.login-form {
  animation: fadeInRight 0.8s ease-out 0.2s both;
  
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }
  
  .input-label {
    font-size: 14px;
    font-weight: 600;
    color: $text-regular;
    margin-bottom: 8px;
  }
  
  :deep(.el-input) {
    .el-input__wrapper {
      padding: 0 16px;
      height: 48px;
      border-radius: 12px;
      box-shadow: 0 0 0 1px $border-base inset;
      background: rgba(255, 255, 255, 0.8);
      transition: all 200ms ease;

      &:hover {
        box-shadow: 0 0 0 1px $primary-color inset;
      }

      &.is-focus {
        box-shadow: 0 0 0 2px $primary-color inset, 0 0 0 4px rgba(99, 102, 241, 0.1);
      }
    }

    .el-input__prefix {
      color: $text-secondary;
    }

    .el-input__inner {
      height: 48px;
      font-size: 15px;
    }
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  
  :deep(.el-checkbox__label) {
    color: $text-regular;
    font-size: 14px;
  }
}

.forgot-link {
  color: $primary-color;
  font-size: 14px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    color: $primary-hover;
    text-decoration: underline;
  }
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
  border-radius: 12px;
  background: $gradient-primary;
  border: none;
  transition: all 0.2s ease;
  
  .btn-icon {
    margin-right: 8px;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
  }
  
  &:active {
    transform: translateY(0);
  }
}

// 飞书登录
.divider-text {
  width: 100%;
  text-align: center;
  position: relative;
  margin-bottom: 16px;
  
  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 40%;
    height: 1px;
    background: linear-gradient(90deg, transparent, $border-light, transparent);
  }
  
  &::before {
    left: 0;
  }
  
  &::after {
    right: 0;
  }
  
  span {
    background: transparent;
    padding: 0 16px;
    color: $text-secondary;
    font-size: 14px;
  }
}

.feishu-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: #3370FF;
  border-color: #3370FF;
  color: white;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  
  &:hover {
    background: #2860E1;
    border-color: #2860E1;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(51, 112, 255, 0.3);
  }
  
  .feishu-icon {
    width: 20px;
    height: 20px;
  }
}

.register-hint {
  text-align: center;
  font-size: 14px;
  color: $text-secondary;
  margin-top: 24px;
}

.register-link {
  color: $primary-color;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  
  &:hover {
    color: $primary-hover;
    text-decoration: underline;
  }
}

.login-footer {
  padding: 20px 56px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  text-align: center;
  background: rgba(255, 255, 255, 0.3);
  
  p {
    margin: 0;
    font-size: 12px;
    color: $text-secondary;

    &.policy-links {
      margin-top: 8px;
    }
  }

  .policy-link {
    color: $primary-color;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover {
      color: $primary-hover;
      text-decoration: underline;
    }
  }

  .divider {
    margin: 0 12px;
    color: $text-placeholder;
  }
}

// 动画
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// 响应式
@media (max-width: 992px) {
  .login-wrapper {
    flex-direction: column;
    width: 100%;
    max-width: 500px;
    min-height: auto;
  }
  
  .login-banner {
    padding: 40px 32px;
    
    .logo {
      margin-bottom: 32px;
      
      h1 {
        font-size: 24px;
      }
    }
    
    .slogan {
      margin-bottom: 32px;
      font-size: 15px;
    }
    
    .features {
      display: none;
    }
  }
  
  .form-container {
    padding: 40px 32px;
  }
  
  .form-header {
    .header-icon {
      width: 56px;
      height: 56px;
    }
    
    h2 {
      font-size: 24px;
    }
  }
  
  .login-footer {
    padding: 16px 32px;
  }
}

@media (max-width: 576px) {
  .login-wrapper {
    border-radius: 16px;
  }
  
  .login-banner {
    padding: 32px 24px;
  }
  
  .form-container {
    padding: 32px 24px;
  }
  
  .login-form {
    :deep(.el-input) {
      .el-input__wrapper {
        height: 44px;
      }
    }
  }
  
  .login-button,
  .feishu-button {
    height: 44px;
  }
}
</style>
