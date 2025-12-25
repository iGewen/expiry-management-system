<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <!-- 登录主体 -->
    <div class="login-wrapper">
      <!-- 左侧宣传区 -->
      <div class="login-banner">
        <div class="banner-content">
          <div class="logo">
            <div class="logo-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="8" fill="#00FF00"/>
                <path d="M12 24L20 32L36 16" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h1>商品保质期管理系统</h1>
          </div>
          <p class="slogan">智能管理 · 预防过期 · 保障品质</p>
          <div class="features">
            <div class="feature-item">
              <i class="icon">✓</i>
              <span>实时监控商品保质期</span>
            </div>
            <div class="feature-item">
              <i class="icon">✓</i>
              <span>智能预警提醒机制</span>
            </div>
            <div class="feature-item">
              <i class="icon">✓</i>
              <span>数据统计分析报表</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="login-form-wrapper">
        <div class="form-container">
          <div class="form-header">
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
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                size="large"
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm0 1c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M12 5V4a4 4 0 00-8 0v1H3v9h10V5h-1zm-6-1a2 2 0 114 0v1H6V4z"/>
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
                {{ loading ? '登录中...' : '登 录' }}
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
import { ref, reactive } from 'vue'
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

const handleLogin = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const res = await authApi.login(loginForm)
      
      if (res.success && res.data) {
        userStore.setUser(res.data.user)
        userStore.setToken(res.data.token)
        
        ElMessage.success('登录成功')
        router.push('/')
      }
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #E6F7FF 0%, #BAE7FF 50%, #91D5FF 100%);
  position: relative;
  overflow: hidden;
}

// 背景装饰圆圈
.bg-decoration {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  
  .circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(24, 144, 255, 0.1);
    animation: float 20s infinite ease-in-out;
  }
  
  .circle-1 {
    width: 300px;
    height: 300px;
    top: -100px;
    left: -100px;
    animation-delay: 0s;
  }
  
  .circle-2 {
    width: 200px;
    height: 200px;
    bottom: -50px;
    right: 10%;
    animation-delay: 5s;
  }
  
  .circle-3 {
    width: 150px;
    height: 150px;
    top: 50%;
    right: -50px;
    animation-delay: 10s;
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

// 登录主体
.login-wrapper {
  position: relative;
  z-index: 1;
  display: flex;
  width: 1000px;
  max-width: 95%;
  min-height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

// 左侧宣传区
.login-banner {
  flex: 1;
  background: linear-gradient(135deg, $primary-color 0%, #40A9FF 100%);
  padding: 60px 50px;
  display: flex;
  align-items: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');
    opacity: 0.3;
  }
}

.banner-content {
  position: relative;
  color: white;
}

.logo {
  margin-bottom: 40px;
  
  .logo-icon {
    margin-bottom: 20px;
    animation: fadeInDown 0.8s ease-out;
  }
  
  h1 {
    font-size: 32px;
    font-weight: 600;
    margin: 0;
    letter-spacing: 1px;
    animation: fadeInDown 0.8s ease-out 0.2s both;
  }
}

.slogan {
  font-size: 18px;
  margin-bottom: 50px;
  opacity: 0.95;
  animation: fadeInDown 0.8s ease-out 0.4s both;
}

.features {
  .feature-item {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    font-size: 16px;
    animation: fadeInLeft 0.8s ease-out both;
    
    &:nth-child(1) { animation-delay: 0.6s; }
    &:nth-child(2) { animation-delay: 0.8s; }
    &:nth-child(3) { animation-delay: 1s; }
    
    .icon {
      width: 24px;
      height: 24px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      font-style: normal;
      font-weight: bold;
    }
  }
}

// 右侧表单区
.login-form-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.form-container {
  flex: 1;
  padding: 60px 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-header {
  margin-bottom: 40px;
  animation: fadeInRight 0.8s ease-out;
  
  h2 {
    font-size: 28px;
    color: $text-primary;
    margin: 0 0 10px 0;
    font-weight: 600;
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
    margin-bottom: 24px;
  }
  
  :deep(.el-input) {
    .el-input__wrapper {
      padding: 12px 15px;
      box-shadow: 0 0 0 1px $border-base inset;
      
      &:hover {
        box-shadow: 0 0 0 1px $primary-color inset;
      }
      
      &.is-focus {
        box-shadow: 0 0 0 2px $primary-color inset;
      }
    }
    
    .el-input__prefix {
      color: $text-secondary;
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
  }
}

.forgot-link {
  color: $primary-color;
  font-size: 14px;
  text-decoration: none;
  transition: $transition-fast;
  
  &:hover {
    color: $primary-hover;
    text-decoration: underline;
  }
}

.login-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 2px;
  border-radius: $border-radius-base;
  transition: $transition-base;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
}

.register-hint {
  text-align: center;
  font-size: 14px;
  color: $text-secondary;
  margin-top: 20px;
}

.register-link {
  color: $primary-color;
  font-weight: 500;
  text-decoration: none;
  transition: $transition-fast;
  
  &:hover {
    color: $primary-hover;
    text-decoration: underline;
  }
}

.login-footer {
  padding: 20px 50px;
  border-top: 1px solid $border-light;
  text-align: center;
  
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
    transition: $transition-fast;

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
@media (max-width: 768px) {
  .login-wrapper {
    flex-direction: column;
    width: 100%;
    max-width: 500px;
  }
  
  .login-banner {
    padding: 40px 30px;
  }
  
  .form-container {
    padding: 40px 30px;
  }
}
</style>
