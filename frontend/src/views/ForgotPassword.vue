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
          <h2>{{ verified ? '重置密码' : '忘记密码' }}</h2>
          <p>{{ verified ? '请输入您的新密码' : '通过手机号验证找回密码' }}</p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" class="forgot-form">
          <!-- 手机号输入 -->
          <el-form-item prop="phone">
            <el-input
              v-model="form.phone"
              placeholder="请输入注册时的手机号"
              size="large"
              :disabled="verified"
            >
              <template #prefix>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3.5 1A1.5 1.5 0 002 2.5v11A1.5 1.5 0 003.5 15h9a1.5 1.5 0 001.5-1.5v-11A1.5 1.5 0 0012.5 1h-9zM4 3h8v9H4V3z"/>
                </svg>
              </template>
            </el-input>
          </el-form-item>

          <!-- 已验证后显示新密码输入 -->
          <transition name="slide-fade">
            <el-form-item v-if="verified" prop="newPassword">
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
          </transition>

          <!-- 验证成功提示 -->
          <transition name="slide-fade">
            <div v-if="verified" class="verified-info">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="#1890FF">
                <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.97 6.03l-4.5 4.5a.75.75 0 01-1.06 0l-2-2a.75.75 0 111.06-1.06l1.47 1.47 3.97-3.97a.75.75 0 111.06 1.06z"/>
              </svg>
              <span>手机号验证成功，用户名：<strong>{{ verifiedUsername }}</strong></span>
            </div>
          </transition>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="submit-button"
              :loading="loading"
              @click="verified ? handleReset() : handleVerify()"
            >
              {{ loading ? (verified ? '重置中...' : '验证中...') : (verified ? '重置密码' : '验证手机号') }}
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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api/auth'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)
const verified = ref(false)
const verifiedUsername = ref('')

const form = reactive({
  phone: '',
  newPassword: ''
})

const rules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/, message: '必须包含字母和数字', trigger: 'blur' }
  ]
}

const handleVerify = async () => {
  if (!formRef.value) return

  await formRef.value.validateField('phone', async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const res = await authApi.forgotPassword(form.phone)
      if (res.success) {
        verified.value = true
        verifiedUsername.value = res.data?.username || ''
        ElMessage.success('手机号验证成功')
      }
    } catch (error) {
      console.error('Verify error:', error)
    } finally {
      loading.value = false
    }
  })
}

const handleReset = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const res = await authApi.resetPassword(form)
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

// 验证成功提示
.verified-info {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: $primary-light;
  border: 1px solid rgba(24, 144, 255, 0.2);
  border-radius: $border-radius-base;
  margin-bottom: 20px;
  
  svg {
    flex-shrink: 0;
    margin-right: 10px;
  }
  
  span {
    font-size: 14px;
    color: $text-regular;
    
    strong {
      color: $primary-color;
      font-weight: 600;
    }
  }
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

// 过渡动画
.slide-fade-enter-active {
  transition: all 0.4s ease;
}

.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(10px);
  opacity: 0;
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
}
</style>
