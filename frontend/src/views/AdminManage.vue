<template>
  <div class="admin-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <div class="header-left">
        
        
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          添加用户
        </el-button>
      </div>
    </header>

    <!-- 筛选栏 -->
    <section class="filter-section">
      <div class="filter-bar">
        <div class="filter-item">
          <el-input v-model="searchForm.username" placeholder="搜索用户名..." clearable @keyup.enter="handleSearch">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="filter-item">
          <el-select v-model="searchForm.role" placeholder="全部角色" clearable @change="handleSearch">
            <el-option label="超级管理员" value="SUPER_ADMIN" />
            <el-option label="管理员" value="ADMIN" />
            <el-option label="普通用户" value="USER" />
          </el-select>
        </div>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </div>
    </section>

    <!-- 用户列表 -->
    <section class="table-section">
      <el-table :data="users" v-loading="loading" class="data-table">
        <el-table-column type="index" label="#" width="60" />
        
        <el-table-column label="用户" min-width="180">
          <template #default="{ row }">
            <div class="user-cell">
              <div class="user-avatar">
                {{ row.username?.charAt(0).toUpperCase() }}
              </div>
              <div class="user-info">
                <span class="user-name">{{ row.username }}</span>
                <span class="user-phone">{{ row.phone || '未绑定手机' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="角色" min-width="110" align="center">
          <template #default="{ row }">
            <span class="role-badge" :class="row.role.toLowerCase()">
              {{ getRoleText(row.role) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="飞书绑定" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.feishuOpenId" type="success" effect="light" size="small">
              已绑定
            </el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        
        <el-table-column label="注册时间" width="120" align="center">
          <template #default="{ row }">
            <span class="date-text">{{ formatDate(row.createdAt) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="最后登录" width="120" align="center">
          <template #default="{ row }">
            <span class="date-text">{{ formatDate(row.lastLoginAt) || '-' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-cell">
              <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="warning" link size="small" @click="handleChangePassword(row)">重置密码</el-button>
              <el-button 
                v-if="isSuperAdmin && row.id !== currentUserId && row.role !== 'SUPER_ADMIN'"
                type="danger" 
                link 
                size="small" 
                @click="showDeleteConfirm(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadUsers"
          @current-change="loadUsers"
        />
      </div>
    </section>

    <!-- 添加/编辑用户对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="450px">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item v-if="!form.id" label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="超级管理员" value="SUPER_ADMIN" v-if="isSuperAdmin" />
            <el-option label="管理员" value="ADMIN" />
            <el-option label="普通用户" value="USER" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="重置密码" width="400px">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-position="top">
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitPassword" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog v-model="deleteDialogVisible" title="删除用户确认" width="500px">
      <el-alert type="error" :closable="false" show-icon style="margin-bottom: 20px;">
        <template #title>
          <strong>警告：此操作将永久删除用户「{{ deleteForm.username }}」</strong>
        </template>
        <template #default>
          删除后将无法恢复，该用户的所有数据将被清除。
        </template>
      </el-alert>
      
      <div class="delete-info">
        <p><strong>用户信息：</strong></p>
        <ul>
          <li>用户名：{{ deleteForm.username }}</li>
          <li>手机号：{{ deleteForm.phone || '未设置' }}</li>
          <li>角色：{{ getRoleText(deleteForm.role) }}</li>
        </ul>
      </div>

      <el-form :model="deleteForm" label-position="top">
        <el-form-item label="删除理由（必填，至少5个字符）">
          <el-input 
            v-model="deleteForm.reason" 
            type="textarea" 
            :rows="3"
            placeholder="请输入删除该用户的理由..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button 
          type="danger" 
          @click="handleConfirmDelete" 
          :loading="deleting"
          :disabled="deleteForm.reason.length < 5"
        >
          确认删除
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { getUsers, updateUser, userApi } from '@/api/user'
import { useUserStore } from '@/stores/user'
import type { User } from '@/types'
import dayjs from 'dayjs'

const userStore = useUserStore()
const users = ref<User[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('添加用户')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()
const deleteDialogVisible = ref(false)
const deleting = ref(false)

const isSuperAdmin = computed(() => userStore.user?.role === 'SUPER_ADMIN')
const currentUserId = computed(() => userStore.user?.id)

const searchForm = reactive({
  username: '',
  role: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  id: 0,
  username: '',
  password: '',
  phone: '',
  role: 'USER'
})

const passwordForm = reactive({
  id: 0,
  newPassword: '',
  confirmPassword: ''
})

const deleteForm = reactive({
  id: 0,
  username: '',
  phone: '',
  role: '',
  reason: ''
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const passwordRules: FormRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== passwordForm.newPassword) callback(new Error('两次密码不一致'))
        else callback()
      },
      trigger: 'blur'
    }
  ]
}

const getRoleText = (role: string) => {
  const roles: Record<string, string> = {
    'SUPER_ADMIN': '超级管理员',
    'ADMIN': '管理员',
    'USER': '普通用户'
  }
  return roles[role] || role
}

const formatDate = (date: string) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD')
}

const loadUsers = async () => {
  loading.value = true
  try {
    const params: any = { page: pagination.page, pageSize: pagination.pageSize }
    if (searchForm.username) params.username = searchForm.username
    if (searchForm.role) params.role = searchForm.role
    const res = await getUsers(params)
    users.value = res?.users || []
    pagination.total = res?.total || 0
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '获取用户列表失败')
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
  handleSearch()
}

const showAddDialog = () => {
  dialogTitle.value = '添加用户'
  form.id = 0
  form.username = ''
  form.password = ''
  form.phone = ''
  form.role = 'USER'
  dialogVisible.value = true
}

const handleEdit = (row: User) => {
  dialogTitle.value = '编辑用户'
  form.id = row.id
  form.username = row.username
  form.password = ''
  form.phone = row.phone || ''
  form.role = row.role
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (form.id) {
        await updateUser(form.id, { phone: form.phone, role: form.role as any })
        ElMessage.success('更新成功')
      } else {
        // 创建用户需要调用注册接口或管理员创建接口
        ElMessage.warning('请使用注册页面创建新用户')
        return
      }
      dialogVisible.value = false
      loadUsers()
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

const handleChangePassword = (row: User) => {
  passwordForm.id = row.id
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

const showDeleteConfirm = (row: User) => {
  deleteForm.id = row.id
  deleteForm.username = row.username
  deleteForm.phone = row.phone || ''
  deleteForm.role = row.role
  deleteForm.reason = ''
  deleteDialogVisible.value = true
}

const handleConfirmDelete = async () => {
  if (deleteForm.reason.length < 5) {
    ElMessage.warning('请输入至少5个字符的删除理由')
    return
  }
  deleting.value = true
  try {
    await userApi.delete(deleteForm.id, deleteForm.reason)
    ElMessage.success('删除成功')
    deleteDialogVisible.value = false
    loadUsers()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '删除失败')
  } finally {
    deleting.value = false
  }
}

const handleDelete = async (row: User) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户「${row.username}」吗？`, '删除确认', { type: 'warning' })
    await userApi.delete(row.id)
    ElMessage.success('删除成功')
    loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error(error.response?.data?.message || '删除失败')
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.admin-page {
  padding: 32px;
  background: #f8fafc;
  min-height: calc(100vh - 64px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left {
  .page-title {
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 4px 0;
  }
  
  .page-desc {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }
}

.header-right {
  .el-button {
    height: 40px;
    padding: 0 20px;
    border-radius: 10px;
    font-weight: 500;
  }
}

// 筛选区
.filter-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-item {
  :deep(.el-input),
  :deep(.el-select) {
    width: 180px;
  }
}

// 表格区
.table-section {
  background: white;
  border-radius: 16px;
  overflow: visible;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
  min-width: 900px;
}

.data-table {
  --el-table-border-color: #f1f5f9;
  
  :deep(th) {
    background: #f8fafc !important;
    color: #64748b;
    font-weight: 600;
    font-size: 13px;
    padding: 14px 12px;
    white-space: nowrap;
  }
  
  :deep(th .cell) { overflow: visible; white-space: nowrap; }
  :deep(td) { padding: 12px; }
  :deep(td .cell) { overflow: visible; }
  :deep(.el-table__row:hover > td) { background: #fafafa !important; }
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: #1e293b;
}

.user-phone {
  font-size: 12px;
  color: #94a3b8;
}

.role-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  
  &.super_admin { background: #fee2e2; color: #dc2626; }
  &.admin { background: #fef3c7; color: #d97706; }
  &.user { background: #e0e7ff; color: #6366f1; }
}

.date-text {
  font-size: 13px;
  color: #64748b;
}

.text-muted {
  color: #cbd5e1;
}

.action-cell {
  display: flex;
  justify-content: flex-start;
  gap: 4px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.delete-info {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  
  p { margin: 0 0 8px 0; font-weight: 600; }
  
  ul {
    margin: 0;
    padding-left: 20px;
    
    li { margin: 4px 0; font-size: 13px; color: #64748b; }
  }
}

.pagination-wrapper {
  padding: 16px 20px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
}

// 响应式
@media (max-width: 768px) {
  .admin-page { padding: 16px; }
  .page-header { flex-direction: column; gap: 16px; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .filter-item {
    :deep(.el-input),
    :deep(.el-select) { width: 100%; }
  }
}
</style>
