<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>

    <!-- 注册主体 -->
    <div class="register-wrapper">
      <div class="form-container">
        <div class="form-header">
          <div class="logo-mini">
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="8" fill="#1890FF"/>
              <path d="M12 24L20 32L36 16" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2>创建账号</h2>
          <p>欢迎加入商品保质期管理系统</p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" class="register-form">
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="用户名(4-20位字母或数字)"
              size="large"
            >
              <template #prefix>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm0 1c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="phone">
            <el-input
              v-model="form.phone"
              placeholder="手机号"
              size="large"
            >
              <template #prefix>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3.5 1A1.5 1.5 0 002 2.5v11A1.5 1.5 0 003.5 15h9a1.5 1.5 0 001.5-1.5v-11A1.5 1.5 0 0012.5 1h-9zM4 3h8v9H4V3z"/>
                </svg>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="密码(6-20位，含字母和数字)"
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

          <el-form-item prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="确认密码"
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
              class="register-button"
              :loading="loading"
              @click="handleRegister"
            >
              {{ loading ? '注册中...' : '注 册' }}
            </el-button>
          </el-form-item>

          <div class="login-hint">
            已有账号？
            <router-link to="/login" class="login-link">立即登录</router-link>
          </div>
        </el-form>

        <div class="register-footer">
          <p>
            注册即表示同意
            <router-link to="/disclaimer" class="policy-link">《免责声明》</router-link>
            和
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

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

const validatePass2 = (_rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 20, message: '长度在 4 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9]+$/, message: '只能包含字母和数字', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/, message: '必须包含字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePass2, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const res = await authApi.register(form)
      
      if (res.success && res.data) {
        userStore.setUser(res.data.user)
        userStore.setToken(res.data.token)
        
        ElMessage.success('注册成功')
        router.push('/')
      }
    } catch (error) {
      console.error('Register error:', error)
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
    width: 250px;
    height: 250px;
    top: 10%;
    left: -80px;
  }
  
  .circle-2 {
    width: 180px;
    height: 180px;
    bottom: 10%;
    right: -60px;
    animation-delay: 8s;
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-30px) rotate(180deg); }
}

// 注册主体
.register-wrapper {
  position: relative;
  z-index: 1;
  width: 500px;
  max-width: 95%;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.form-container {
  padding: 50px 60px;
}

.form-header {
  text-align: center;
  margin-bottom: 40px;
  animation: fadeInDown 0.8s ease-out;
  
  .logo-mini {
    margin-bottom: 20px;
    display: inline-block;
  }
  
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

.register-form {
  animation: fadeIn 0.8s ease-out 0.2s both;
  
  :deep(.el-form-item) {
    margin-bottom: 20px;
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

.register-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 2px;
  margin-top: 10px;
  transition: $transition-base;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
}

.login-hint {
  text-align: center;
  font-size: 14px;
  color: $text-secondary;
  margin-top: 20px;
}

.login-link {
  color: $primary-color;
  font-weight: 500;
  text-decoration: none;
  transition: $transition-fast;
  
  &:hover {
    color: $primary-hover;
    text-decoration: underline;
  }
}

.register-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid $border-light;
  text-align: center;
  
  p {
    margin: 0;
    font-size: 12px;
    color: $text-secondary;
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
  .register-wrapper {
    width: 100%;
    max-width: 450px;
  }
  
  .form-container {
    padding: 40px 30px;
  }
}
</style>
