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

    <!-- 重置密码主体 -->
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
          <p class="slogan">安全找回 · 保护账号</p>

          <!-- 安全提示卡片 -->
          <div class="security-card">
            <div class="security-header">
              <div class="security-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3 class="security-title">安全提示</h3>
            </div>
            <ul class="security-list">
              <li>
                <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>验证码将发送到您的注册手机</span>
              </li>
              <li>
                <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>验证码有效期为5分钟</span>
              </li>
              <li>
                <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>请勿将验证码告知他人</span>
              </li>
            </ul>
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
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h2 class="form-title">重置密码</h2>
            <p class="form-subtitle">通过手机验证找回账号密码</p>
          </div>

          <el-form ref="formRef" :model="form" :rules="rules" class="auth-form">
            <el-form-item prop="phone">
              <div class="input-label">手机号</div>
              <el-input v-model="form.phone" placeholder="请输入注册时的手机号" size="large">
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

            <el-form-item prop="newPassword">
              <div class="input-label">新密码</div>
              <el-input v-model="form.newPassword" type="password" placeholder="6-20位，需包含字母和数字" size="large" show-password>
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
              <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入新密码" size="large" show-password>
                <template #prefix>
                  <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </template>
              </el-input>
            </el-form-item>

            <el-button type="primary" size="large" class="btn-primary" :loading="loading" @click="handleReset">
              {{ loading ? '重置中...' : '重置密码' }}
            </el-button>

            <div class="form-footer">
              <router-link to="/login" class="back-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                返回登录
              </router-link>
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

// 安全提示卡片
.security-card {
  padding: 24px;
  background: $input-bg;
  border: 1px solid $border-auth;
  border-radius: 16px;
  margin-bottom: 32px;
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
  background: $accent-subtle;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $accent;
}

.security-title {
  font-size: 16px;
  font-weight: 600;
  color: $fg-primary;
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
    color: $fg-secondary;
    
    &:not(:last-child) {
      border-bottom: 1px solid rgba(148, 163, 184, 0.15);
    }
    
    .check-icon {
      color: $accent;
      flex-shrink: 0;
    }
  }
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
  margin-top: 24px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: $fg-secondary;
  font-size: 14px;
  text-decoration: none;
  transition: color 0.2s ease;
  
  svg {
    width: 14px;
    height: 14px;
  }
  
  &:hover {
    color: $accent;
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
    
    .security-card {
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