<template>
  <div class="settings-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <div class="header-left">
        <h1 class="page-title">个人设置</h1>
        <p class="page-desc">管理您的账号信息和安全设置</p>
      </div>
    </header>

    <div class="settings-grid">
      <!-- 个人信息卡片 -->
      <div class="settings-card profile-card">
        <div class="card-header">
          <div class="card-icon blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="card-title">
            <h3>个人信息</h3>
            <p>管理您的基本资料</p>
          </div>
        </div>

        <div class="card-body">
          <div class="profile-section">
            <div class="avatar-section">
              <div class="user-avatar">{{ userStore.user?.username?.charAt(0).toUpperCase() }}</div>
              <div class="user-info">
                <div class="username">{{ userStore.user?.username }}</div>
                <div class="role-badge" :class="userStore.user?.role?.toLowerCase()">
                  {{ getRoleText(userStore.user?.role) }}
                </div>
              </div>
            </div>

            <el-form ref="profileFormRef" :model="profileForm" :rules="profileRules" class="settings-form">
              <el-form-item label="用户名">
                <el-input v-model="profileForm.username" disabled>
                  <template #prefix>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="手机号" prop="phone">
                <el-input v-model="profileForm.phone" placeholder="绑定手机号">
                  <template #prefix>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="5" width="18" height="14" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </template>
                </el-input>
              </el-form-item>

              <el-button type="primary" class="save-btn" :loading="savingProfile" @click="handleSaveProfile">
                保存修改
              </el-button>
            </el-form>
          </div>
        </div>
      </div>

      <!-- 第三方账号绑定卡片 -->
      <div class="settings-card bind-card">
        <div class="card-header">
          <div class="card-icon purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </div>
          <div class="card-title">
            <h3>第三方账号绑定</h3>
            <p>绑定第三方账号实现快捷登录</p>
          </div>
        </div>

        <div class="card-body">
          <div class="bind-list">
            <!-- 飞书 -->
            <div class="bind-item" :class="{ bound: isFeishuBound }">
              <div class="bind-icon feishu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#3370FF">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.5 15l-4-4 1.41-1.41L10.5 14.17l6.59-6.59L18.5 9l-8 8z"/>
                </svg>
              </div>
              <div class="bind-info">
                <div class="bind-name">飞书</div>
                <div class="bind-status" v-if="isFeishuBound">已绑定 · {{ userStore.user?.feishuOpenId?.slice(0, 12) }}...</div>
                <div class="bind-status" v-else>未绑定</div>
              </div>
              <el-button :type="isFeishuBound ? 'danger' : 'primary'" size="small" plain :loading="feishuLoading" @click="isFeishuBound ? handleUnbindFeishu() : handleBindFeishu()">
                {{ isFeishuBound ? '解绑' : '绑定' }}
              </el-button>
            </div>
            
            <!-- QQ (占位) -->
            <div class="bind-item disabled">
              <div class="bind-icon qq">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#12B7F5">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
              <div class="bind-info">
                <div class="bind-name">QQ</div>
                <div class="bind-status">功能开发中</div>
              </div>
              <el-button size="small" disabled>暂不可用</el-button>
            </div>
            
            <!-- 微信 (占位) -->
            <div class="bind-item disabled">
              <div class="bind-icon wechat">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#07C160">
                  <path d="M8.5 12.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                </svg>
              </div>
              <div class="bind-info">
                <div class="bind-name">微信</div>
                <div class="bind-status">功能开发中</div>
              </div>
              <el-button size="small" disabled>暂不可用</el-button>
            </div>
            
            <!-- 钉钉 (占位) -->
            <div class="bind-item disabled">
              <div class="bind-icon dingtalk">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#0089FF">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-2h-2v2zm0-4h2V7h-2v6z"/>
                </svg>
              </div>
              <div class="bind-info">
                <div class="bind-name">钉钉</div>
                <div class="bind-status">功能开发中</div>
              </div>
              <el-button size="small" disabled>暂不可用</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 修改密码卡片 -->
      <div class="settings-card password-card">
        <div class="card-header">
          <div class="card-icon orange">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div class="card-title">
            <h3>修改密码</h3>
            <p>定期更换密码保护账号安全</p>
          </div>
        </div>

        <div class="card-body">
          <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" class="settings-form" label-position="top">
            <el-form-item label="当前密码" prop="oldPassword">
              <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入当前密码" show-password />
            </el-form-item>

            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="passwordForm.newPassword" type="password" placeholder="6-20位，需包含字母和数字" show-password />
            </el-form-item>

            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
            </el-form-item>

            <el-button type="primary" class="save-btn" :loading="changingPassword" @click="handleChangePassword">
              修改密码
            </el-button>
          </el-form>
        </div>
      </div>

      <!-- 账号信息卡片 -->
      <div class="settings-card info-card">
        <div class="card-header">
          <div class="card-icon purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div class="card-title">
            <h3>账号信息</h3>
            <p>查看账号注册和使用情况</p>
          </div>
        </div>

        <div class="card-body">
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">注册时间</span>
              <span class="info-value">{{ formatDate(userStore.user?.createdAt) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">最后登录</span>
              <span class="info-value">{{ formatDate(userStore.user?.lastLoginAt) || '暂无' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">登录IP</span>
              <span class="info-value">{{ userStore.user?.lastLoginIp || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">用户ID</span>
              <span class="info-value copyable" @click="copyId">{{ userStore.user?.id }} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { authApi } from '@/api/auth'
import dayjs from 'dayjs'
import httpClient from '@/utils/request'

const router = useRouter()
const userStore = useUserStore()
const profileFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

const isFeishuBound = computed(() => !!userStore.user?.feishuOpenId)
const feishuLoading = ref(false)
const savingProfile = ref(false)
const changingPassword = ref(false)

const profileForm = ref({ username: userStore.user?.username || '', phone: userStore.user?.phone || '' })
const passwordForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })

const profileRules: FormRules = {
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }]
}

const validateConfirm = (_rule: any, value: any, callback: any) => {
  if (value !== passwordForm.value.newPassword) callback(new Error('两次输入密码不一致'))
  else callback()
}

const passwordRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }, { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validateConfirm, trigger: 'blur' }]
}

const getRoleText = (role?: string) => {
  const roles: Record<string, string> = { SUPER_ADMIN: '超级管理员', ADMIN: '管理员', USER: '普通用户' }
  return roles[role || ''] || role
}

const formatDate = (date?: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : ''

const handleSaveProfile = async () => {
  if (!profileFormRef.value) return
  await profileFormRef.value.validate(async (valid) => {
    if (!valid) return
    savingProfile.value = true
    try {
      const res = await httpClient.put('/users/profile', { phone: profileForm.value.phone })
      if (res.success) { ElMessage.success('保存成功'); userStore.setUser({ ...userStore.user!, phone: profileForm.value.phone }) }
    } catch (error: any) { ElMessage.error(error.response?.data?.message || '保存失败') }
    finally { savingProfile.value = false }
  })
}

const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return
    changingPassword.value = true
    try {
      const res = await authApi.changePassword({ oldPassword: passwordForm.value.oldPassword, newPassword: passwordForm.value.newPassword })
      if (res.success) { ElMessage.success('密码修改成功'); passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' } }
    } catch (error: any) { ElMessage.error(error.response?.data?.message || '修改失败') }
    finally { changingPassword.value = false }
  })
}

const handleBindFeishu = async () => {
  feishuLoading.value = true
  try {
    const res = await authApi.getFeishuAuthorizeUrl()
    if (res.success && res.data?.url) window.location.href = res.data.url
  } catch (error) { ElMessage.error('获取飞书授权链接失败') }
  finally { feishuLoading.value = false }
}

const handleUnbindFeishu = async () => {
  feishuLoading.value = true
  try {
    const res = await httpClient.post('/auth/feishu/unbind')
    if (res.success) { ElMessage.success('解除绑定成功'); userStore.setUser({ ...userStore.user!, feishuOpenId: null, feishuName: null }) }
  } catch (error: any) { ElMessage.error(error.response?.data?.message || '解除绑定失败') }
  finally { feishuLoading.value = false }
}

const copyId = () => {
  navigator.clipboard.writeText(String(userStore.user?.id || '')).then(() => ElMessage.success('ID已复制'))
}

onMounted(() => {
  profileForm.value = { username: userStore.user?.username || '', phone: userStore.user?.phone || '' }
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.settings-page {
  padding: 32px;
  background: #f8fafc;
  min-height: calc(100vh - 64px);
}

.page-header {
  margin-bottom: 24px;
}

.page-header .header-left .page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.page-header .header-left .page-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

@media (max-width: 1024px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

.settings-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  border: 1px solid #f1f5f9;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-icon.blue { background: #eef2ff; color: #6366f1; }
.card-icon.orange { background: #fef3c7; color: #f59e0b; }
.card-icon.purple { background: #f3e8ff; color: #8b5cf6; }
.card-icon.feishu-blue { background: #e8f1ff; color: #3370ff; }

.card-title h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.card-title p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.card-body {
  padding: 20px;
}

.profile-section .avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.profile-section .avatar-section .user-avatar {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: 600;
}

.profile-section .avatar-section .user-info .username {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.profile-section .avatar-section .user-info .role-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.role-badge.super_admin { background: #fee2e2; color: #dc2626; }
.role-badge.admin { background: #fef3c7; color: #d97706; }
.role-badge.user { background: #eef2ff; color: #6366f1; }

.settings-form .el-form-item__label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.settings-form .el-input__wrapper {
  border-radius: 10px;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
}

.settings-form .el-input__wrapper:hover {
  box-shadow: 0 0 0 1px #6366f1 inset;
}

.settings-form .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 2px #6366f1 inset;
}

.save-btn {
  width: 100%;
  height: 44px;
  border-radius: 10px;
  font-weight: 600;
  margin-top: 8px;
}

.feishu-status {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  background: #f8fafc;
  margin-bottom: 20px;
}

.feishu-status.bound {
  background: #eef2ff;
}

.feishu-status .status-icon {
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feishu-status .status-info .status-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.feishu-status .status-info .status-desc {
  font-size: 13px;
  color: #64748b;
}

.action-btn {
  width: 100%;
  height: 44px;
  border-radius: 10px;
  font-weight: 600;
}

.bind-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bind-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  transition: all 0.2s;
}

.bind-item.bound {
  background: #eef2ff;
  border-color: #6366f1;
}

.bind-item.disabled {
  opacity: 0.6;
}

.bind-item:hover:not(.disabled) {
  border-color: #6366f1;
}

.bind-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.bind-icon.feishu { color: #3370FF; }
.bind-icon.qq { color: #12B7F5; }
.bind-icon.wechat { color: #07C160; }
.bind-icon.dingtalk { color: #0089FF; }

.bind-info {
  flex: 1;
}

.bind-info .bind-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.bind-info .bind-status {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.info-list .info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f1f5f9;
}

.info-list .info-item:last-child {
  border-bottom: none;
}

.info-list .info-label {
  font-size: 14px;
  color: #64748b;
}

.info-list .info-value {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.info-list .info-value.copyable {
  cursor: pointer;
  color: #6366f1;
}

.info-list .info-value.copyable:hover {
  text-decoration: underline;
}
</style>
