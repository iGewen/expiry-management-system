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

    <!-- 注册主体 -->
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
                <span class="feature-title">商品全生命周期管理</span>
                <span class="feature-desc">入库、存储、出库全程跟踪</span>
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
                <span class="feature-title">多端提醒通知</span>
                <span class="feature-desc">邮件、短信、APP多渠道告警</span>
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
                <span class="feature-title">数据安全备份</span>
                <span class="feature-desc">云端加密存储，自动备份</span>
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
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
            </div>
            <h2 class="form-title">创建账号</h2>
            <p class="form-subtitle">注册成为系统用户</p>
          </div>

          <!-- 飞书注册提示 -->
          <div v-if="isFeishuRegister" class="feishu-notice">
            <svg class="notice-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="5" width="18" height="14" rx="2"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>正在通过飞书注册，注册后将自动绑定飞书账号</span>
          </div>

          <el-form ref="formRef" :model="form" :rules="rules" class="auth-form">
            <el-form-item prop="username">
              <div class="input-label">用户名</div>
              <el-input v-model="form.username" placeholder="4-20位字母、数字或下划线" size="large">
                <template #prefix>
                  <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="phone">
              <div class="input-label">手机号</div>
              <el-input v-model="form.phone" placeholder="请输入手机号" size="large">
                <template #prefix>
                  <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="5" width="18" height="14" rx="2"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="verifyCode">
              <div class="input-label">验证码</div>
              <div class="code-row">
                <el-input v-model="form.verifyCode" placeholder="6位验证码" size="large" maxlength="6">
                  <template #prefix>
                    <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </template>
                </el-input>
                <el-button size="large" class="btn-code" :disabled="countdown > 0 || !isPhoneValid" :loading="sendingCode" @click="handleSendCode">
                  {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>

            <el-form-item prop="password">
              <div class="input-label">密码</div>
              <el-input v-model="form.password" type="password" placeholder="6-20位，需包含字母和数字" size="large" show-password>
                <template #prefix>
                  <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="confirmPassword">
              <div class="input-label">确认密码</div>
              <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" size="large" show-password>
                <template #prefix>
                  <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </template>
              </el-input>
            </el-form-item>

            <el-button type="primary" size="large" class="btn-primary" :loading="loading" @click="handleRegister">
              {{ loading ? '注册中...' : (isFeishuRegister ? '注册并绑定飞书' : '立即注册') }}
            </el-button>

            <div class="form-footer">
              <span class="footer-text">已有账号？</span>
              <router-link to="/login" class="link">立即登录</router-link>
            </div>

            <div class="policy-text">
              注册即表示同意
              <router-link to="/disclaimer" class="policy-link">《免责声明》</router-link>
              和
              <router-link to="/privacy-policy" class="policy-link">《隐私政策》</router-link>
            </div>
          </el-form>
        </div>

        <div class="auth-footer">
          <p class="copyright">© 2024 商品保质期管理系统. All rights reserved.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import httpClient from '@/utils/request'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)

const isFeishuRegister = ref(false)
const feishuTempToken = ref('')

const form = reactive({
  username: '',
  phone: '',
  verifyCode: '',
  password: '',
  confirmPassword: ''
})

const isPhoneValid = computed(() => /^1[3-9]\d{9}$/.test(form.phone))

onMounted(() => {
  const tempToken = route.query.tempToken as string
  const phone = route.query.phone as string
  const username = route.query.username as string
  if (tempToken) {
    isFeishuRegister.value = true
    feishuTempToken.value = tempToken
    if (phone) form.phone = decodeURIComponent(phone)
    if (username) form.username = decodeURIComponent(username)
  }
})

const validatePass2 = (_rule: any, value: any, callback: any) => {
  if (value === '') callback(new Error('请再次输入密码'))
  else if (value !== form.password) callback(new Error('两次输入密码不一致'))
  else callback()
}

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 20, message: '长度在 4 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  verifyCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/, message: '必须包含字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [{ required: true, validator: validatePass2, trigger: 'blur' }]
}

const handleSendCode = async () => {
  if (!isPhoneValid.value) { ElMessage.warning('请输入正确的手机号'); return }
  sendingCode.value = true
  try {
    const res = await httpClient.post('/auth/sms/register', { phone: form.phone })
    if (res.success) {
      ElMessage.success(res.message || '验证码已发送')
      countdown.value = 60
      const timer = setInterval(() => { countdown.value--; if (countdown.value <= 0) clearInterval(timer) }, 1000)
    }
  } catch (error) { console.error('Send code error:', error) }
  finally { sendingCode.value = false }
}

const handleRegister = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      if (isFeishuRegister.value && feishuTempToken.value) {
        const res = await httpClient.post('/auth/feishu/create-with-register', {
          tempToken: feishuTempToken.value, username: form.username, password: form.password, phone: form.phone, verifyCode: form.verifyCode
        })
        if (res.success && res.data) {
          const { user, token, refreshToken } = res.data
          userStore.setUser(user); userStore.setToken(token, refreshToken)
          ElMessage.success('注册成功，已绑定飞书账号')
          router.push('/')
        }
      } else {
        const res = await authApi.register(form)
        if (res.success && res.data) {
          const { user, token, refreshToken } = res.data as any
          userStore.setUser(user); userStore.setToken(token, refreshToken)
          ElMessage.success('注册成功')
          router.push('/')
        }
      }
    } catch (error) { console.error('Register error:', error) }
    finally { loading.value = false }
  })
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
  padding: 50px 56px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 448px;
  margin: 0 auto;
}

// 表单头部
.form-header {
  text-align: center;
  margin-bottom: 28px;
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

// 飞书注册提示
.feishu-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: $accent-bg;
  border: 1px solid $accent-subtle;
  border-radius: 12px;
  margin-bottom: 20px;
  font-size: 13px;
  color: $accent;
  
  .notice-icon {
    flex-shrink: 0;
  }
}

// ========================================
// 表单样式
// ========================================
.auth-form {
  :deep(.el-form-item) {
    margin-bottom: 16px;
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

// 验证码行
.code-row {
  display: flex;
  gap: 12px;
  
  :deep(.el-input) {
    flex: 1;
  }
}

.btn-code {
  width: 120px;
  flex-shrink: 0;
  height: 48px;
  border-radius: 12px;
  background: $accent-subtle;
  border: none;
  color: $accent;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: rgba(30, 58, 95, 0.12);
  }
  
  &:disabled {
    color: $fg-muted;
    background: $input-bg;
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

// 表单底部
.form-footer {
  text-align: center;
  margin-top: 20px;
  
  .footer-text {
    color: $fg-secondary;
    font-size: 14px;
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

// 政策文字
.policy-text {
  text-align: center;
  margin-top: 16px;
  font-size: 12px;
  color: $fg-muted;
  
  .policy-link {
    color: $accent;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
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
    margin: 0;
    font-size: 12px;
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
  .btn-code {
    height: 44px;
  }
  
  .btn-code {
    width: 100px;
    font-size: 13px;
  }
}
</style>