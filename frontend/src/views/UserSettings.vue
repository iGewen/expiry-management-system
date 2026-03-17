<template>
  <div class="user-settings">
    <!-- 顶部标题栏 -->
    <div class="page-header">
      <h1 class="page-title">个人设置</h1>
      <p class="page-subtitle">管理您的账号信息和安全设置</p>
    </div>

    <!-- 主内容区：双列网格 -->
    <div class="main-grid">
      <!-- 左列：个人信息 -->
      <div class="info-card">
        <div class="card-header">
          <div class="header-icon blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <span class="header-title">个人信息</span>
        </div>

        <div class="info-content">
          <div class="info-item">
            <span class="info-label">用户名</span>
            <span class="info-value">{{ infoForm.username }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">手机号</span>
            <div class="info-value-with-action">
              <span class="info-value">{{ maskPhone(infoForm.phone) }}</span>
              <el-button type="primary" link size="small" @click="showPhoneDialog">
                修改
              </el-button>
            </div>
          </div>

          <div class="info-item">
            <span class="info-label">角色</span>
            <el-tag v-if="infoForm.role" :type="getRoleType(infoForm.role)" class="role-tag">
              {{ getRoleText(infoForm.role) }}
            </el-tag>
          </div>

          <div class="info-item">
            <span class="info-label">注册时间</span>
            <span class="info-value">{{ formatDate(infoForm.createdAt) }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">最后登录</span>
            <div class="info-value-with-status">
              <span class="status-dot online"></span>
              <span class="info-value">{{ formatDate(infoForm.lastLoginAt) }}</span>
            </div>
          </div>
        </div>

        <!-- 飞书绑定区域（突出显示） -->
        <div class="feishu-section" :class="{ 'bound': userStore.user?.feishuOpenId }">
          <div class="feishu-header">
            <div class="feishu-icon-box">
              <span class="feishu-emoji">📱</span>
            </div>
            <div class="feishu-title-group">
              <span class="feishu-title">飞书账号绑定</span>
              <el-tag v-if="userStore.user?.feishuOpenId" type="success" size="small" effect="plain">已绑定</el-tag>
              <el-tag v-else type="info" size="small" effect="plain">未绑定</el-tag>
            </div>
          </div>
          <p class="feishu-desc">
            {{ userStore.user?.feishuOpenId ? '您可以使用飞书扫码快速登录' : '绑定飞书账号后，可以使用扫码登录' }}
          </p>
          <el-button 
            v-if="userStore.user?.feishuOpenId" 
            type="danger" 
            plain 
            @click="handleUnbindFeishu"
            :loading="feishuLoading"
          >
            解绑飞书账号
          </el-button>
          <el-button 
            v-else 
            type="primary" 
            @click="handleBindFeishu"
            :loading="feishuLoading"
          >
            绑定飞书账号
          </el-button>
        </div>
      </div>

      <!-- 右列：修改密码 -->
      <div class="password-card">
        <div class="card-header">
          <div class="header-icon pink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <span class="header-title">修改密码</span>
        </div>

        <el-form
          ref="passwordFormRef"
          :model="passwordForm"
          :rules="passwordRules"
          class="password-form"
        >
          <el-form-item prop="oldPassword">
            <template #label>
              <span class="form-label">原密码 <span class="required">*</span></span>
            </template>
            <el-input
              v-model="passwordForm.oldPassword"
              type="password"
              placeholder="请输入原密码"
              show-password
              size="large"
            />
          </el-form-item>

          <el-form-item prop="newPassword">
            <template #label>
              <span class="form-label">新密码 <span class="required">*</span></span>
            </template>
            <el-input
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="6-20位，包含字母和数字"
              show-password
              size="large"
            />
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <template #label>
              <span class="form-label">确认密码 <span class="required">*</span></span>
            </template>
            <el-input
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              show-password
              size="large"
            />
          </el-form-item>

          <div class="form-actions">
            <el-button type="primary" size="large" @click="handleChangePassword" :loading="submitting">
              <el-icon class="btn-icon"><Check /></el-icon>
              修改密码
            </el-button>
            <el-button size="large" @click="resetPasswordForm">
              <el-icon class="btn-icon"><RefreshRight /></el-icon>
              重置
            </el-button>
          </div>
        </el-form>
      </div>
    </div>

    <!-- 底部：操作记录 -->
    <div class="logs-section">
      <div class="logs-card">
        <div class="card-header">
          <div class="header-icon purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <span class="header-title">我的操作记录</span>
        </div>

        <div class="logs-table-wrapper">
          <el-table :data="myLogs" v-loading="loading" class="logs-table" stripe>
            <el-table-column type="index" label="#" width="50" align="center" />
            <el-table-column prop="action" label="操作类型" width="100">
              <template #default="{ row }">
                <span class="action-tag" :class="getActionClass(row.action)">
                  {{ getActionText(row.action) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="details" label="操作详情" min-width="250">
              <template #default="{ row }">
                <code class="details-code">{{ row.details || '-' }}</code>
              </template>
            </el-table-column>
            <el-table-column prop="ipAddress" label="IP地址" width="130">
              <template #default="{ row }">
                <span class="ip-address">{{ row.ipAddress || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="操作时间" width="160">
              <template #default="{ row }">
                <span class="time-text">{{ dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss') }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- 修改手机号对话框 -->
    <el-dialog 
      v-model="phoneDialogVisible" 
      title="修改手机号" 
      width="420px"
      class="custom-dialog"
      :close-on-click-modal="false"
    >
      <div class="dialog-content">
        <div class="current-phone-info">
          <span class="label">当前手机号</span>
          <span class="value">{{ maskPhone(infoForm.phone) }}</span>
        </div>
        
        <el-form
          ref="phoneFormRef"
          :model="phoneForm"
          :rules="phoneRules"
        >
          <el-form-item prop="newPhone">
            <template #label>
              <span class="form-label">新手机号 <span class="required">*</span></span>
            </template>
            <el-input
              v-model="phoneForm.newPhone"
              placeholder="请输入11位手机号"
              maxlength="11"
              size="large"
            >
              <template #prefix>
                <el-icon><Iphone /></el-icon>
              </template>
            </el-input>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="phoneDialogVisible = false" size="large">取消</el-button>
          <el-button type="primary" @click="handleChangePhone" :loading="submitting" size="large">确认修改</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Check, RefreshRight, Iphone } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'
import { changePassword, updateProfile } from '@/api/user'
import { getLogs } from '@/api/log'
import { authApi } from '@/api/auth'

const userStore = useUserStore()
const loading = ref(false)
const submitting = ref(false)
const feishuLoading = ref(false)
const phoneDialogVisible = ref(false)
const infoFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()
const phoneFormRef = ref<FormInstance>()

const infoForm = reactive({
  username: '',
  phone: '',
  role: '',
  createdAt: '',
  lastLoginAt: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const phoneForm = reactive({
  newPhone: ''
})

const myLogs = ref<any[]>([])

const validateConfirmPassword = (_rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules: FormRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/, message: '密码必须包含字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const phoneRules: FormRules = {
  newPhone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号', trigger: 'blur' }
  ]
}

const loadUserInfo = () => {
  const user = userStore.user
  if (user) {
    infoForm.username = user.username
    infoForm.phone = user.phone || ''
    infoForm.role = user.role
    infoForm.createdAt = user.createdAt || ''
    infoForm.lastLoginAt = user.lastLoginAt || ''
  }
}

const maskPhone = (phone: string | undefined) => {
  if (!phone) return '未设置'
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

const formatDate = (date: string | undefined) => {
  if (!date) return '未知'
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const showPhoneDialog = () => {
  phoneForm.newPhone = ''
  phoneDialogVisible.value = true
}

const handleChangePhone = async () => {
  if (!phoneFormRef.value) return
  
  await phoneFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      await ElMessageBox.confirm(
        `确认要将手机号修改为 ${phoneForm.newPhone} 吗？`,
        '修改手机号',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      submitting.value = true
      await updateProfile({ phone: phoneForm.newPhone })
      
      infoForm.phone = phoneForm.newPhone
      if (userStore.user) {
        userStore.user.phone = phoneForm.newPhone
      }
      
      ElMessage.success('手机号修改成功')
      phoneDialogVisible.value = false
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error(error.response?.data?.message || '手机号修改失败')
      }
    } finally {
      submitting.value = false
    }
  })
}

const loadMyLogs = async () => {
  loading.value = true
  try {
    const data = await getLogs({ 
      pageSize: 20,
      page: 1,
      searchUserId: userStore.user?.id 
    })
    myLogs.value = data?.logs || []
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载操作记录失败')
  } finally {
    loading.value = false
  }
}

const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      await changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      })
      
      ElMessage.success('密码修改成功，请重新登录')
      resetPasswordForm()
      
      setTimeout(() => {
        userStore.logout()
      }, 3000)
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '密码修改失败')
    } finally {
      submitting.value = false
    }
  })
}

const resetPasswordForm = () => {
  passwordFormRef.value?.resetFields()
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

const getRoleType = (role: string) => {
  const typeMap: Record<string, any> = {
    USER: '',
    ADMIN: 'warning',
    SUPER_ADMIN: 'danger'
  }
  return typeMap[role] || ''
}

const getRoleText = (role: string) => {
  const textMap: Record<string, string> = {
    USER: '普通用户',
    ADMIN: '管理员',
    SUPER_ADMIN: '超级管理员'
  }
  return textMap[role] || role
}

const getActionClass = (action: string) => {
  const classMap: Record<string, string> = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    LOGIN: 'login',
    LOGOUT: 'logout',
    REGISTER: 'register',
    'DELETE_USER': 'delete'
  }
  return classMap[action] || 'default'
}

const getActionText = (action: string) => {
  const textMap: Record<string, string> = {
    CREATE: '创建',
    UPDATE: '更新',
    DELETE: '删除',
    LOGIN: '登录',
    LOGOUT: '登出',
    REGISTER: '注册',
    'DELETE_USER': '删除用户'
  }
  return textMap[action] || action
}

// 飞书绑定
const handleBindFeishu = async () => {
  try {
    const res = await authApi.getFeishuAuthorizeUrl()
    if (res.success && res.data?.url) {
      const width = 600
      const height = 700
      const left = (window.screen.width - width) / 2
      const top = (window.screen.height - height) / 2
      
      const authWindow = window.open(
        res.data.url,
        'feishu-auth',
        `width=${width},height=${height},left=${left},top=${top},resizable=no,scrollbars=yes`
      )
      
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed)
          userStore.fetchUserInfo()
          loadUserInfo()
        }
      }, 500)
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取授权链接失败')
  }
}

// 飞书解绑
const handleUnbindFeishu = async () => {
  try {
    await ElMessageBox.confirm(
      '解绑后无法使用飞书扫码登录，确定要解绑吗？',
      '解绑飞书账号',
      {
        confirmButtonText: '确定解绑',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    feishuLoading.value = true
    await authApi.unbindFeishuAccount()
    
    if (userStore.user) {
      userStore.user.feishuOpenId = null
    }
    
    ElMessage.success('飞书账号解绑成功')
    loadUserInfo()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '解绑失败')
    }
  } finally {
    feishuLoading.value = false
  }
}

onMounted(() => {
  loadUserInfo()
  loadMyLogs()
})
</script>

<style scoped lang="scss">
.user-settings {
  min-height: 100%;
  background: #f5f7fa;
  padding: 24px;
}

// 顶部标题栏
.page-header {
  margin-bottom: 24px;
  
  .page-title {
    font-size: 24px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 8px 0;
  }
  
  .page-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }
}

// 主内容网格
.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
  
  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
}

// 卡片基础样式
.info-card,
.password-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
}

// 卡片头部
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  
  .header-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    
    &.blue {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }
    
    &.pink {
      background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
    }
    
    &.purple {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    }
    
    svg {
      stroke-width: 2.5;
    }
  }
  
  .header-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }
}

// 信息内容
.info-content {
  .info-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 0;
    border-bottom: 1px solid #f3f4f6;
    
    &:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-size: 14px;
      color: #6b7280;
    }
    
    .info-value {
      font-size: 14px;
      color: #1f2937;
      font-weight: 500;
    }
    
    .info-value-with-action {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .info-value {
        font-family: monospace;
      }
    }
    
    .info-value-with-status {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #10b981;
        
        &.online {
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
        }
      }
    }
    
    .role-tag {
      font-weight: 500;
    }
  }
}

// 飞书绑定区域
.feishu-section {
  margin-top: 24px;
  padding: 20px;
  background: #fefce8;
  border: 1px solid #fef08a;
  border-radius: 12px;
  
  &.bound {
    background: #f0fdf4;
    border-color: #86efac;
  }
  
  .feishu-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    
    .feishu-icon-box {
      width: 44px;
      height: 44px;
      background: #ffffff;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      
      .feishu-emoji {
        font-size: 24px;
      }
    }
    
    .feishu-title-group {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .feishu-title {
        font-size: 15px;
        font-weight: 600;
        color: #1f2937;
      }
    }
  }
  
  .feishu-desc {
    font-size: 13px;
    color: #6b7280;
    margin: 0 0 16px 0;
    padding-left: 56px;
  }
  
  .el-button {
    margin-left: 56px;
  }
}

// 密码表单
.password-form {
  .form-label {
    font-size: 14px;
    color: #374151;
    
    .required {
      color: #ef4444;
      margin-left: 2px;
    }
  }
  
  :deep(.el-form-item) {
    margin-bottom: 20px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  :deep(.el-form-item__label) {
    padding-bottom: 8px;
    line-height: 1.5;
  }
  
  :deep(.el-input__wrapper) {
    border-radius: 10px;
    box-shadow: 0 0 0 1px #e5e7eb inset;
    padding: 0 12px;
    
    &:hover {
      box-shadow: 0 0 0 1px #3b82f6 inset;
    }
    
    &.is-focus {
      box-shadow: 0 0 0 2px #3b82f6 inset;
    }
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 28px;
  
  .el-button {
    min-width: 120px;
    border-radius: 10px;
    
    .btn-icon {
      margin-right: 4px;
    }
  }
}

// 操作记录区域
.logs-section {
  .logs-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  }
}

.logs-table-wrapper {
  margin-top: 16px;
  
  .logs-table {
    :deep(.el-table__header) {
      th {
        background: #f9fafb;
        color: #374151;
        font-weight: 600;
        font-size: 13px;
        padding: 12px 0;
      }
    }
    
    :deep(.el-table__row) {
      td {
        padding: 12px 0;
      }
    }
    
    .action-tag {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      
      &.create {
        background: #dcfce7;
        color: #166534;
      }
      
      &.update {
        background: #fef3c7;
        color: #92400e;
      }
      
      &.delete,
      &.delete-user {
        background: #fee2e2;
        color: #991b1b;
      }
      
      &.login {
        background: #dbeafe;
        color: #1e40af;
      }
      
      &.logout {
        background: #f3f4f6;
        color: #4b5563;
      }
      
      &.register {
        background: #e0e7ff;
        color: #3730a3;
      }
      
      &.default {
        background: #f3f4f6;
        color: #6b7280;
      }
    }
    
    .details-code {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 12px;
      color: #4b5563;
      background: #f9fafb;
      padding: 6px 10px;
      border-radius: 6px;
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .ip-address {
      font-family: monospace;
      font-size: 13px;
      color: #6b7280;
    }
    
    .time-text {
      font-size: 13px;
      color: #6b7280;
    }
  }
}

// 对话框样式
.custom-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
  }
  
  :deep(.el-dialog__header) {
    padding: 20px 24px;
    border-bottom: 1px solid #f3f4f6;
    
    .el-dialog__title {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
  }
  
  :deep(.el-dialog__body) {
    padding: 24px;
  }
  
  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    border-top: 1px solid #f3f4f6;
  }
  
  .dialog-content {
    .current-phone-info {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 10px;
      
      .label {
        font-size: 14px;
        color: #6b7280;
      }
      
      .value {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        font-family: monospace;
      }
    }
    
    :deep(.el-input__wrapper) {
      border-radius: 10px;
      box-shadow: 0 0 0 1px #e5e7eb inset;
      
      &:hover {
        box-shadow: 0 0 0 1px #3b82f6 inset;
      }
      
      &.is-focus {
        box-shadow: 0 0 0 2px #3b82f6 inset;
      }
    }
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    
    .el-button {
      min-width: 100px;
      border-radius: 10px;
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .user-settings {
    padding: 16px;
  }
  
  .page-header {
    .page-title {
      font-size: 20px;
    }
  }
  
  .main-grid {
    gap: 16px;
  }
  
  .info-card,
  .password-card,
  .logs-card {
    padding: 16px;
  }
  
  .feishu-section {
    .feishu-desc,
    .el-button {
      padding-left: 0;
      margin-left: 0;
    }
  }
  
  .form-actions {
    flex-direction: column;
    
    .el-button {
      width: 100%;
    }
  }
}
</style>
