<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="gradient-bg"></div>
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <!-- 注册主体 -->
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
              <div class="icon-wrapper">✓</div>
              <span>商品全生命周期管理</span>
            </div>
            <div class="feature-item">
              <div class="icon-wrapper">✓</div>
              <span>多端提醒通知</span>
            </div>
            <div class="feature-item">
              <div class="icon-wrapper">✓</div>
              <span>数据安全备份</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧表单 -->
      <div class="login-form-wrapper">
        <div class="form-container">
          <div class="form-header">
            <div class="header-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
            </div>
            <h2>创建账号</h2>
            <p>注册成为系统用户</p>
          </div>

          <!-- 飞书注册提示 -->
          <div v-if="isFeishuRegister" class="feishu-notice">
            <span class="notice-icon">📱</span>
            <span>正在通过飞书注册，注册后将自动绑定飞书账号</span>
          </div>

          <el-form ref="formRef" :model="form" :rules="rules" class="login-form">
            <el-form-item prop="username">
              <div class="input-label">用户名</div>
              <el-input v-model="form.username" placeholder="4-20位字母、数字或下划线" size="large">
                <template #prefix>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="phone">
              <div class="input-label">手机号</div>
              <el-input v-model="form.phone" placeholder="请输入手机号" size="large">
                <template #prefix>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="5" width="18" height="14" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="verifyCode">
              <div class="input-label">验证码</div>
              <div class="code-row">
                <el-input v-model="form.verifyCode" placeholder="6位验证码" size="large" maxlength="6">
                  <template #prefix>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </template>
                </el-input>
                <el-button type="primary" size="large" :disabled="countdown > 0 || !isPhoneValid" :loading="sendingCode" @click="handleSendCode" class="code-btn">
                  {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>

            <el-form-item prop="password">
              <div class="input-label">密码</div>
              <el-input v-model="form.password" type="password" placeholder="6-20位，需包含字母和数字" size="large" show-password>
                <template #prefix>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="confirmPassword">
              <div class="input-label">确认密码</div>
              <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" size="large" show-password>
                <template #prefix>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </template>
              </el-input>
            </el-form-item>

            <el-button type="primary" size="large" class="login-button" :loading="loading" @click="handleRegister">
              {{ loading ? '注册中...' : (isFeishuRegister ? '注册并绑定飞书' : '立即注册') }}
            </el-button>

            <div class="register-hint">
              已有账号？<router-link to="/login" class="register-link">立即登录</router-link>
            </div>

            <div class="policy-text">
              注册即表示同意
              <router-link to="/disclaimer">《免责声明》</router-link>
              和
              <router-link to="/privacy-policy">《隐私政策》</router-link>
            </div>
          </el-form>
        </div>

        <div class="login-footer">
          <p>© 2024 商品保质期管理系统. All rights reserved.</p>
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

.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.bg-decoration {
  position: absolute; inset: 0;
  .gradient-bg { position: absolute; inset: 0; background: $gradient-bg; }
  .circle {
    position: absolute; border-radius: 50%; background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%);
    animation: float 25s infinite ease-in-out;
    &.circle-1 { width: 400px; height: 400px; top: -150px; left: -150px; }
    &.circle-2 { width: 300px; height: 300px; bottom: -100px; right: 5%; animation-delay: 5s; }
    &.circle-3 { width: 200px; height: 200px; top: 40%; right: -80px; animation-delay: 10s; }
  }
}

@keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-30px) rotate(180deg); } }

.login-wrapper {
  position: relative; z-index: 1; display: flex; width: 1100px; max-width: 95%; min-height: 640px;
  background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.5); overflow: hidden;
}

.login-banner {
  flex: 1; background: $gradient-primary; padding: 60px 50px; display: flex; align-items: center;
  position: relative;
  &::before { content: ''; position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); opacity: 0.3; }
}

.banner-content { position: relative; color: white; }
.logo { margin-bottom: 48px;
  .logo-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; animation: fadeInDown 0.8s ease-out; border: 1px solid rgba(255,255,255,0.2); }
  h1 { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 1px; animation: fadeInDown 0.8s ease-out 0.2s both; }
}
.slogan { font-size: 17px; margin-bottom: 56px; opacity: 0.9; animation: fadeInDown 0.8s ease-out 0.4s both; font-weight: 400; }

.features { .feature-item { display: flex; align-items: center; margin-bottom: 24px; font-size: 15px; animation: fadeInLeft 0.8s ease-out both;
  &:nth-child(1) { animation-delay: 0.6s; } &:nth-child(2) { animation-delay: 0.8s; } &:nth-child(3) { animation-delay: 1s; }
  .icon-wrapper { width: 32px; height: 32px; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 16px; border: 1px solid rgba(255,255,255,0.2); }
} }

.login-form-wrapper { flex: 1; display: flex; flex-direction: column; background: transparent; }

.form-container { flex: 1; padding: 50px 56px; display: flex; flex-direction: column; justify-content: center; }

.form-header { margin-bottom: 32px; animation: fadeInRight 0.8s ease-out; text-align: center;
  .header-icon { width: 64px; height: 64px; background: $gradient-primary; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: white; box-shadow: 0 8px 24px rgba(99, 102, 241, 0.25); }
  h2 { font-size: 26px; color: $text-primary; margin: 0 0 8px 0; font-weight: 700; }
  p { font-size: 14px; color: $text-secondary; margin: 0; }
}

.feishu-notice { display: flex; align-items: center; gap: 10px; padding: 14px 18px; background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px; margin-bottom: 20px; font-size: 13px; color: #6366f1; .notice-icon { font-size: 18px; } }

.login-form { animation: fadeInRight 0.8s ease-out 0.2s both;
  :deep(.el-form-item) { margin-bottom: 18px; }
  .input-label { font-size: 14px; font-weight: 600; color: $text-regular; margin-bottom: 8px; }
  :deep(.el-input .el-input__wrapper) { padding: 0 16px; height: 48px; border-radius: 12px; box-shadow: 0 0 0 1px $border-base inset; background: rgba(255,255,255,0.8); transition: all 200ms ease;
    &:hover { box-shadow: 0 0 0 1px $primary-color inset; }
    &.is-focus { box-shadow: 0 0 0 2px $primary-color inset, 0 0 0 4px rgba(99,102,241,0.1); }
  }
  :deep(.el-input__prefix) { color: $text-secondary; }
  :deep(.el-input__inner) { height: 48px; font-size: 15px; }
}

.code-row { display: flex; gap: 12px; :deep(.el-input) { flex: 1; } }
.code-btn { width: 120px; flex-shrink: 0; height: 48px; border-radius: 12px; }

.login-button { width: 100%; height: 48px; font-size: 16px; font-weight: 600; letter-spacing: 2px; border-radius: 12px; background: $gradient-primary; border: none; transition: all 0.2s ease; margin-top: 8px;
  &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.35); }
}

.register-hint { text-align: center; font-size: 14px; color: $text-secondary; margin-top: 20px; }
.register-link { color: $primary-color; font-weight: 600; text-decoration: none; &:hover { color: $primary-hover; text-decoration: underline; } }

.policy-text { text-align: center; margin-top: 20px; font-size: 12px; color: #94a3b8;
  a { color: $primary-color; text-decoration: none; &:hover { text-decoration: underline; } }
}

.login-footer { padding: 20px 56px; border-top: 1px solid rgba(0,0,0,0.05); text-align: center; background: rgba(255,255,255,0.3);
  p { margin: 0; font-size: 12px; color: $text-secondary; }
}

@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
@keyframes fadeInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }

@media (max-width: 992px) {
  .login-wrapper { flex-direction: column; width: 100%; max-width: 500px; min-height: auto; }
  .login-banner { padding: 40px 32px; .logo h1 { font-size: 24px; } .slogan { margin-bottom: 32px; font-size: 15px; } .features { display: none; } }
  .form-container { padding: 40px 32px; }
  .login-footer { padding: 16px 32px; }
}
</style>
