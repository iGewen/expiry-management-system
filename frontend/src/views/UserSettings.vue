<template>
  <div class="user-settings">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>个人信息</span>
          </template>
          <el-form
            ref="infoFormRef"
            :model="infoForm"
            :rules="infoRules"
            label-width="100px"
          >
            <el-form-item label="用户名">
              <el-input v-model="infoForm.username" disabled />
            </el-form-item>
            <el-form-item label="手机号">
              <div class="phone-display">
                <span>{{ maskPhone(infoForm.phone) }}</span>
                <el-button type="primary" link @click="showPhoneDialog">
                  修改手机号
                </el-button>
              </div>
            </el-form-item>
            <el-form-item label="角色">
              <el-tag v-if="infoForm.role" :type="getRoleType(infoForm.role)">{{ getRoleText(infoForm.role) }}</el-tag>
              <span v-else>-</span>
            </el-form-item>
            <el-form-item label="注册时间">
              <span>{{ dayjs(infoForm.createdAt).format('YYYY-MM-DD HH:mm:ss') }}</span>
            </el-form-item>
            <el-form-item label="最后登录">
              <span>{{ infoForm.lastLoginAt ? dayjs(infoForm.lastLoginAt).format('YYYY-MM-DD HH:mm:ss') : '未知' }}</span>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>修改密码</span>
          </template>
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="100px"
          >
            <el-form-item label="原密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                placeholder="请输入原密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="请输入新密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleChangePassword" :loading="submitting">
                修改密码
              </el-button>
              <el-button @click="resetPasswordForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card shadow="never">
          <template #header>
            <span>我的操作记录</span>
          </template>
          <el-table :data="myLogs" v-loading="loading" max-height="400">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="action" label="操作类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getActionType(row.action)">{{ getActionText(row.action) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="details" label="操作详情" min-width="200" show-overflow-tooltip />
            <el-table-column prop="ipAddress" label="IP地址" width="140" />
            <el-table-column prop="createdAt" label="操作时间" width="160">
              <template #default="{ row }">
                {{ dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss') }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>

  <!-- 修改手机号对话框 -->
  <el-dialog v-model="phoneDialogVisible" title="修改手机号" width="400px">
    <el-form
      ref="phoneFormRef"
      :model="phoneForm"
      :rules="phoneRules"
      label-width="80px"
    >
      <el-form-item label="当前手机号">
        <el-input :value="maskPhone(infoForm.phone)" disabled />
      </el-form-item>
      <el-form-item label="新手机号" prop="newPhone">
        <el-input
          v-model="phoneForm.newPhone"
          placeholder="请输入11位手机号"
          maxlength="11"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="phoneDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleChangePhone" :loading="submitting">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'
import { changePassword, updateProfile } from '@/api/user'
import { getLogs } from '@/api/log'

const userStore = useUserStore()
const loading = ref(false)
const submitting = ref(false)
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

const infoRules: FormRules = {}

const passwordRules: FormRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
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
      // 更新 store 中的用户信息
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
    // 只查询当前用户的日志
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
      
      // 3秒后跳转到登录页
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

const getActionType = (action: string) => {
  const typeMap: Record<string, any> = {
    CREATE: 'success',
    UPDATE: 'warning',
    DELETE: 'danger',
    LOGIN: 'info',
    REGISTER: 'success'
  }
  return typeMap[action] || ''
}

const getActionText = (action: string) => {
  const textMap: Record<string, string> = {
    CREATE: '创建',
    UPDATE: '更新',
    DELETE: '删除',
    LOGIN: '登录',
    REGISTER: '注册'
  }
  return textMap[action] || action
}

onMounted(() => {
  loadUserInfo()
  loadMyLogs()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.user-settings {
  padding: 20px;
}

.phone-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  height: 32px;
  line-height: 32px;
  background-color: $bg-light;
  border-radius: $border-radius-base;
  
  span {
    color: $text-regular;
  }
}
</style>
