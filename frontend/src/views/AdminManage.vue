<template>
  <div class="admin-manage">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable @clear="handleSearch" style="width: 200px" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.role" placeholder="请选择角色" clearable @clear="handleSearch" style="width: 150px">
            <el-option label="普通用户" value="USER" />
            <el-option label="管理员" value="ADMIN" />
            <el-option label="超级管理员" value="SUPER_ADMIN" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.isActive" placeholder="请选择状态" clearable @clear="handleSearch" style="width: 120px">
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <el-table :data="users" v-loading="loading" border>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="phone" label="手机号" width="130">
          <template #default="{ row }">
            <span>{{ row.phone || '未设置' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)">{{ getRoleText(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="160">
          <template #default="{ row }">
            {{ dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="160">
          <template #default="{ row }">
            {{ row.lastLoginAt ? dayjs(row.lastLoginAt).format('YYYY-MM-DD HH:mm:ss') : '未登录' }}
          </template>
        </el-table-column>
        <el-table-column prop="_count.products" label="商品数" width="100" />
        <el-table-column label="操作" width="420" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.role !== 'SUPER_ADMIN'"
              type="info"
              size="small"
              @click="handleChangePhone(row)"
            >
              <el-icon><Phone /></el-icon>
              修改手机号
            </el-button>
            <el-button
              v-if="row.role !== 'SUPER_ADMIN'"
              type="warning"
              size="small"
              @click="handleChangeRole(row)"
            >
              <el-icon><Edit /></el-icon>
              修改角色
            </el-button>
            <el-button
              v-if="row.role !== 'SUPER_ADMIN'"
              type="primary"
              size="small"
              @click="handleResetPassword(row)"
            >
              <el-icon><Key /></el-icon>
              重置密码
            </el-button>
            <el-button
              v-if="row.role !== 'SUPER_ADMIN'"
              :type="row.isActive ? 'danger' : 'success'"
              size="small"
              @click="handleToggleStatus(row)"
            >
              <el-icon><Lock /></el-icon>
              {{ row.isActive ? '禁用' : '启用' }}
            </el-button>
            <el-tag v-if="row.role === 'SUPER_ADMIN'" type="info" size="small">不可操作</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadUsers"
        @current-change="loadUsers"
        class="pagination"
      />
    </el-card>

    <!-- 修改角色对话框 -->
    <el-dialog v-model="roleDialogVisible" title="修改用户角色" width="400px">
      <el-form :model="roleForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="roleForm.username" disabled />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="roleForm.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="普通用户" value="USER" />
            <el-option label="管理员" value="ADMIN" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitRole" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="重置用户密码" width="400px">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="passwordForm.username" disabled />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入6-20位密码，包含字母和数字"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitPassword" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 修改手机号对话框 -->
    <el-dialog v-model="phoneDialogVisible" title="修改用户手机号" width="400px">
      <el-form ref="phoneFormRef" :model="phoneForm" :rules="phoneRules" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="phoneForm.username" disabled />
        </el-form-item>
        <el-form-item label="当前手机号">
          <el-input :value="phoneForm.currentPhone || '未设置'" disabled />
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
        <el-button type="primary" @click="handleSubmitPhone" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Edit, Lock, Key, Phone } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { getUsers, updateUserRole, updateUserStatus, updateUser } from '@/api/user'
import { userApi } from '@/api/user'
import type { User } from '@/types'

const users = ref<User[]>([])
const loading = ref(false)
const roleDialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const phoneDialogVisible = ref(false)
const submitting = ref(false)
const passwordFormRef = ref<FormInstance>()
const phoneFormRef = ref<FormInstance>()

const searchForm = reactive({
  username: '',
  role: '',
  isActive: undefined as boolean | undefined
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const roleForm = reactive<{
  id: number
  username: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
}>({
  id: 0,
  username: '',
  role: 'USER'
})

const passwordForm = reactive({
  id: 0,
  username: '',
  newPassword: '',
  confirmPassword: ''
})

const phoneForm = reactive({
  id: 0,
  username: '',
  currentPhone: '',
  newPhone: ''
})

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

const loadUsers = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    
    if (searchForm.username) params.username = searchForm.username
    if (searchForm.role) params.role = searchForm.role
    if (searchForm.isActive !== undefined) params.isActive = searchForm.isActive
    
    const data = await getUsers(params)
    users.value = data?.users || []
    pagination.total = data?.total || 0
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadUsers()
}

const handleReset = () => {
  searchForm.username = ''
  searchForm.role = ''
  searchForm.isActive = undefined
  handleSearch()
}

const handleChangeRole = (row: User) => {
  roleForm.id = row.id
  roleForm.username = row.username
  roleForm.role = row.role
  roleDialogVisible.value = true
}

const handleSubmitRole = async () => {
  submitting.value = true
  try {
    await updateUserRole(roleForm.id, { role: roleForm.role })
    ElMessage.success('角色修改成功')
    roleDialogVisible.value = false
    loadUsers()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '角色修改失败')
  } finally {
    submitting.value = false
  }
}

const handleToggleStatus = async (row: User) => {
  const action = row.isActive ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(
      `确认要${action}用户「${row.username}」吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await updateUserStatus(row.id, { isActive: !row.isActive })
    ElMessage.success(`${action}成功`)
    loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || `${action}失败`)
    }
  }
}

const handleResetPassword = (row: User) => {
  passwordForm.id = row.id
  passwordForm.username = row.username
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordDialogVisible.value = true
}

const handleSubmitPassword = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      await userApi.resetPassword(passwordForm.id, passwordForm.newPassword)
      ElMessage.success('密码重置成功')
      passwordDialogVisible.value = false
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '密码重置失败')
    } finally {
      submitting.value = false
    }
  })
}

const handleChangePhone = (row: User) => {
  phoneForm.id = row.id
  phoneForm.username = row.username
  phoneForm.currentPhone = row.phone || ''
  phoneForm.newPhone = ''
  phoneDialogVisible.value = true
}

const handleSubmitPhone = async () => {
  if (!phoneFormRef.value) return
  
  await phoneFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      await ElMessageBox.confirm(
        `确认要将用户「${phoneForm.username}」的手机号修改为 ${phoneForm.newPhone} 吗？`,
        '修改手机号',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      submitting.value = true
      await updateUser(phoneForm.id, { phone: phoneForm.newPhone })
      ElMessage.success('手机号修改成功')
      phoneDialogVisible.value = false
      loadUsers()
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error(error.response?.data?.message || '手机号修改失败')
      }
    } finally {
      submitting.value = false
    }
  })
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

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.admin-manage {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
