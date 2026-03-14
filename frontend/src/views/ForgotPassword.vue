<template>
  <div class="forgot-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>

    <!-- 忘记密码主体 -->
    <div class="forgot-wrapper">
      <div class="form-container">
        <div class="form-header">
          <div class="logo-mini">
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="8" fill="#1890FF"/>
              <path d="M12 24L20 32L36 16" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2>重置密码</h2>
          <p>通过手机号验证找回密码</p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" class="forgot-form">
          <!-- 手机号输入 -->
          <el-form-item prop="phone">
            <el-input
              v-model="form.phone"
              placeholder="请输入注册时的手机号"
              size="large"
            >
              <template #prefix>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3.5 1A1.5 1.5 0 002 2.5v11A1.5 1.5 0 003.5 15h9a1.5 1.5 0 001.5-1.5v-11A1.5 1.5 0 0012.5 1h-9zM4 3h8v9H4V3z"/>
                </svg>
              </template>
            </el-input>
          </el-form-item>

          <!-- 验证码输入 -->
          <el-form-item prop="verifyCode">
            <div class="code-input-wrapper">
              <el-input
                v-model="form.verifyCode"
                placeholder="验证码"
                size="large"
                maxlength="6"
              >
                <template #prefix>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1a4 4 0 00-4 4v2H3a1 1 0 00-1 1v6a1 1 0 001 1h10a1 1 0 001-1V8a1 1 0 00-1-1h-1V5a4 4 0 00-4-4zm2 6H6V5a2 2 0 114 0v2z"/>
                  </svg>
                </template>
              </el-input>
              <el-button
                type="primary"
                size="large"
                :disabled="countdown > 0 || !isPhoneValid"
                :loading="sendingCode"
                @click="handleSendCode"
                class="code-button"
              >
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>

          <!-- 新密码输入 -->
          <el-form-item prop="newPassword">
            <el-input
              v-model="form.newPassword"
              type="password"
              placeholder="请输入新密码(6-20位，含字母和数字)"
              size="large"
              show-password
            >
              <template #prefix>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M12 5V4a4 4 0 00-8 0v1H3v9h10V5h-1zm-6-1a2 2 0 114 0v1H6V4z"/>
                </svg>
              </template>
            </el-input>
          </el-form-item>

          <!-- 确认密码输入 -->
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              size="large"
              show-password
            >
              <template #prefix>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M12 5V4a4 4 0 00-8 0v1H3v9h10V5h-1zm-6-1a2 2 0 114 0v1H6V4z"/>
                </svg>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="submit-button"
              :loading="loading"
              @click="handleReset"
            >
              {{ loading ? '重置中...' : '重置密码' }}
            </el-button>
          </el-form-item>

          <div class="back-link">
            <router-link to="/login" class="link">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM7 11.5l-3.5-3.5L7 4.5v7z"/>
              </svg>
              返回登录
            </router-link>
          </div>
        </el-form>
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

const form = reactive({
  phone: '',
  verifyCode: '',
  newPassword: '',
  confirmPassword: ''
})

// 验证手机号是否有效
const isPhoneValid = computed(() => /^1[3-9]\d{9}$/.test(form.phone))

// 验证确认密码
const validateConfirmPassword = (_rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.newPassword) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  verifyCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/, message: '必须包含字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 发送验证码
const handleSendCode = async () => {
  if (!isPhoneValid.value) {
    ElMessage.warning('请输入正确的手机号')
    return
  }

  sendingCode.value = true
  try {
    const res = await httpClient.post('/auth/sms/reset', { phone: form.phone })
    if (res.success) {
      ElMessage.success('验证码已发送')
      // 开始倒计时
      countdown.value = 60
      const timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    }
  } catch (error) {
    // 为了安全，后端不暴露手机号是否注册，所以显示统一消息
    ElMessage.success('验证码已发送')
  } finally {
    sendingCode.value = false
  }
}

const handleReset = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const res = await authApi.resetPassword({
        phone: form.phone,
        newPassword: form.newPassword,
        verifyCode: form.verifyCode
      })
      if (res.success) {
        ElMessage.success('密码重置成功，请使用新密码登录')
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      }
    } catch (error) {
      console.error('Reset error:', error)
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.forgot-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #E6F7FF 0%, #BAE7FF 50%, #91D5FF 100%);
  position: relative;
  overflow: hidden;
}

// 背景装饰
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
    width: 220px;
    height: 220px;
    top: 15%;
    left: -60px;
  }
  
  .circle-2 {
    width: 160px;
    height: 160px;
    bottom: 15%;
    right: -40px;
    animation-delay: 7s;
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-25px) rotate(180deg); }
}

// 忘记密码主体
.forgot-wrapper {
  position: relative;
  z-index: 1;
  width: 480px;
  max-width: 95%;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.form-container {
  padding: 50px 55px;
}

.form-header {
  text-align: center;
  margin-bottom: 35px;
  animation: fadeInDown 0.8s ease-out;
  
  .logo-mini {
    margin-bottom: 20px;
    display: inline-block;
  }
  
  h2 {
    font-size: 26px;
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

.forgot-form {
  animation: fadeIn 0.8s ease-out 0.2s both;
  
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }
  
  :deep(.el-input) {
    .el-input__wrapper {
      padding: 12px 15px;
      box-shadow: 0 0 0 1px $border-base inset;
      transition: $transition-fast;
      
      &:hover:not(.is-disabled) {
        box-shadow: 0 0 0 1px $primary-color inset;
      }
      
      &.is-focus {
        box-shadow: 0 0 0 2px $primary-color inset;
      }
      
      &.is-disabled {
        background-color: $bg-gray;
      }
    }
    
    .el-input__prefix {
      color: $text-secondary;
    }
  }
}

.code-input-wrapper {
  display: flex;
  gap: 12px;
  width: 100%;
  
  :deep(.el-input) {
    flex: 1;
  }
}

.code-button {
  width: 120px;
  flex-shrink: 0;
}

.submit-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 1px;
  transition: $transition-base;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
}

.back-link {
  text-align: center;
  margin-top: 20px;
  
  .link {
    display: inline-flex;
    align-items: center;
    color: $text-secondary;
    font-size: 14px;
    text-decoration: none;
    transition: $transition-fast;
    
    svg {
      margin-right: 6px;
    }
    
    &:hover {
      color: $primary-color;
      text-decoration: none;
    }
  }
}

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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// 响应式
@media (max-width: 768px) {
  .forgot-wrapper {
    width: 100%;
    max-width: 420px;
  }
  
  .form-container {
    padding: 40px 30px;
  }
  
  .code-input-wrapper {
    flex-direction: column;
    gap: 10px;
  }
  
  .code-button {
    width: 100%;
  }
}
</style>
