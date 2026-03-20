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

    <!-- 注册主体 -->
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
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <div class="feature-text">
                <span class="feature-title">商品全生命周期管理</span>
                <span class="feature-desc">从入库到出库，全程可视可控</span>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div class="feature-text">
                <span class="feature-title">多端提醒通知</span>
                <span class="feature-desc">APP、短信、邮件多渠道预警</span>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
                  <ellipse cx="12" cy="5" rx="9" ry="3"/>
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                </svg>
              </div>
              <div class="feature-text">
                <span class="feature-title">数据安全备份</span>
                <span class="feature-desc">多重加密，自动备份，数据无忧</span>
              </div>
            </div>
          </div>

          <!-- 服务承诺卡片 -->
          <div class="service-card">
            <p class="service-card-text">
              <span class="service-card-highlight">专业服务承诺</span><br>
              注册即享30天免费试用，专属客服一对一指导，助力企业快速上手
            </p>
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
            <h2 class="form-title">创建账号</h2>
            <p class="form-subtitle">填写以下信息完成注册</p>
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
              <div class="input-group">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input
                  type="text"
                  class="input-field"
                  placeholder="用户名 (4-16位字母数字)"
                  v-model="form.username"
                />
              </div>
            </el-form-item>

            <el-form-item prop="phone">
              <div class="input-group">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
                <input
                  type="tel"
                  class="input-field"
                  placeholder="手机号码"
                  v-model="form.phone"
                />
              </div>
            </el-form-item>

            <el-form-item prop="verifyCode">
              <div class="input-group has-button">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
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

            <el-form-item prop="password">
              <div class="input-group">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  :type="showPassword ? 'text' : 'password'"
                  class="input-field"
                  placeholder="密码 (8-20位，含字母数字)"
                  v-model="form.password"
                  @input="checkPasswordStrength"
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
              <!-- 密码强度指示器 -->
              <div class="password-strength" v-if="form.password">
                <div class="strength-bar" :class="strengthClass[0]"></div>
                <div class="strength-bar" :class="strengthClass[1]"></div>
                <div class="strength-bar" :class="strengthClass[2]"></div>
                <div class="strength-bar" :class="strengthClass[3]"></div>
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
                  placeholder="确认密码"
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

            <label class="checkbox-wrapper">
              <input type="checkbox" class="sr-only" v-model="agreed" />
              <span class="checkbox-custom">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              </span>
              <span class="checkbox-label">我已阅读并同意 <a href="#" class="link">服务协议</a> 和 <a href="#" class="link">隐私政策</a></span>
            </label>

            <button type="button" class="btn-primary" :disabled="loading" @click="handleRegister">
              {{ loading ? '注册中...' : '立即注册' }}
            </button>

            <p class="login-link">
              已有账号? <router-link to="/login" class="link">立即登录</router-link>
            </p>
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
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const agreed = ref(false)
const passwordStrength = ref(0)

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

// 密码强度类
const strengthClass = computed(() => {
  const strength = passwordStrength.value
  return [
    strength >= 1 ? (strength <= 2 ? 'weak' : strength <= 3 ? 'medium' : 'strong') : '',
    strength >= 2 ? (strength <= 2 ? 'weak' : strength <= 3 ? 'medium' : 'strong') : '',
    strength >= 3 ? (strength <= 3 ? 'medium' : 'strong') : '',
    strength >= 4 ? 'strong' : ''
  ]
})

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

// 检查密码强度
const checkPasswordStrength = () => {
  const value = form.password
  let strength = 0
  
  if (value.length >= 8) strength++
  if (value.length >= 12) strength++
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) strength++
  if (/[0-9]/.test(value)) strength++
  if (/[^A-Za-z0-9]/.test(value)) strength++
  
  passwordStrength.value = Math.min(strength, 4)
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
  if (!agreed.value) {
    ElMessage.warning('请先阅读并同意服务协议和隐私政策')
    return
  }
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

// 服务承诺卡片
.service-card {
  margin-top: 48px;
  padding: 20px;
  background: var(--accent-bg);
  border-radius: 12px;
  border: 1px solid var(--accent-subtle);
}

.service-card-text {
  font-size: 14px;
  color: var(--fg-secondary);
  margin: 0;
  line-height: 1.6;
}

.service-card-highlight {
  color: var(--accent);
  font-weight: 500;
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

// 飞书注册提示
.feishu-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: var(--accent-bg);
  border: 1px solid var(--accent-subtle);
  border-radius: 12px;
  margin-bottom: 20px;
  font-size: 13px;
  color: var(--accent);

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
}

// 输入框组
.input-group {
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

// 密码强度指示器
.password-strength {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.strength-bar {
  flex: 1;
  height: 3px;
  background: rgba(148, 163, 184, 0.2);
  border-radius: 2px;
  transition: background 0.3s ease;

  &.weak {
    background: var(--error);
  }

  &.medium {
    background: var(--warning);
  }

  &.strong {
    background: var(--success);
  }
}

// 复选框
.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  margin-bottom: 20px;
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
  flex-shrink: 0;

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

// 登录链接
.login-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: var(--fg-secondary);
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

  .input-field {
    height: 44px;
    font-size: 14px;
  }

  .btn-primary {
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
