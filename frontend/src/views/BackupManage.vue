<template>
  <div class="backup-container">
    <el-card class="backup-card">
      <template #header>
        <div class="card-header">
          <span>数据备份与恢复</span>
        </div>
      </template>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="primary" @click="createBackup" :loading="creating">
          <el-icon><Download /></el-icon>
          创建备份
        </el-button>
        <el-alert
          type="info"
          :closable="false"
          style="margin-top: 15px;"
        >
          <p>备份内容包括：商品数据、分类数据、提醒设置</p>
          <p>建议定期备份，防止数据丢失</p>
        </el-alert>
      </div>

      <el-divider />

      <!-- 备份列表 -->
      <div class="backup-list">
        <h3>历史备份</h3>
        <el-table :data="backups" v-loading="loading" stripe>
          <el-table-column prop="filename" label="文件名" />
          <el-table-column prop="createdAt" label="创建时间">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="size" label="大小">
            <template #default="{ row }">
              {{ formatSize(row.size) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="250">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="downloadBackup(row.filename)">
                下载
              </el-button>
              <el-button type="warning" size="small" @click="confirmRestore(row.filename)">
                恢复
              </el-button>
              <el-button type="danger" size="small" @click="confirmDelete(row.filename)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 恢复确认对话框 -->
    <el-dialog v-model="restoreDialogVisible" title="确认恢复" width="400px">
      <el-alert type="warning" :closable="false">
        <p>恢复备份将导入备份中的数据。</p>
        <p>已存在的相同商品不会重复导入。</p>
      </el-alert>
      <template #footer>
        <el-button @click="restoreDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="restoreBackup" :loading="restoring">
          确认恢复
        </el-button>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog v-model="deleteDialogVisible" title="确认删除" width="400px">
      <p>确定要删除这个备份文件吗？此操作不可恢复。</p>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="deleteBackup" :loading="deleting">
          确认删除
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import request from '../utils/request'

const backups = ref([])
const loading = ref(false)
const creating = ref(false)
const restoring = ref(false)
const deleting = ref(false)
const restoreDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const selectedFilename = ref('')

// 获取备份列表
const fetchBackups = async () => {
  loading.value = true
  try {
    const res = await request.get('/backup')
    console.log('Fetch backups response:', res)
    if (res.success) {
      backups.value = res.data
    } else {
      ElMessage.error(res.message || '获取备份列表失败')
    }
  } catch (error) {
    console.error('获取备份列表失败:', error)
    ElMessage.error('获取备份列表失败')
  } finally {
    loading.value = false
  }
}

// 创建备份
const createBackup = async () => {
  creating.value = true
  try {
    const res = await request.post('/backup')
    console.log('Create backup response:', res)
    if (res.success) {
      ElMessage.success(`备份创建成功！包含 ${res.data?.stats?.products || 0} 个商品`)
      await fetchBackups()
    } else {
      ElMessage.error(res.message || '创建备份失败')
    }
  } catch (error) {
    console.error('Create backup error:', error)
    ElMessage.error(error.response?.data?.message || '创建备份失败')
  } finally {
    creating.value = false
  }
}

// 下载备份
const downloadBackup = (filename) => {
  const token = localStorage.getItem('token')
  window.open(`/api/backup/download/${filename}?token=${token}`, '_blank')
}

// 确认恢复
const confirmRestore = (filename) => {
  selectedFilename.value = filename
  restoreDialogVisible.value = true
}

// 恢复备份
const restoreBackup = async () => {
  restoring.value = true
  try {
    const res = await request.post('/backup/restore', {
      filename: selectedFilename.value
    })
    if (res.success) {
      ElMessage.success(res.message)
      restoreDialogVisible.value = false
    } else {
      ElMessage.error(res.message || '恢复备份失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '恢复备份失败')
  } finally {
    restoring.value = false
  }
}

// 确认删除
const confirmDelete = (filename) => {
  selectedFilename.value = filename
  deleteDialogVisible.value = true
}

// 删除备份
const deleteBackup = async () => {
  deleting.value = true
  try {
    const res = await request.delete(`/backup/${selectedFilename.value}`)
    if (res.success) {
      ElMessage.success('删除成功')
      deleteDialogVisible.value = false
      await fetchBackups()
    } else {
      ElMessage.error(res.message || '删除备份失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '删除备份失败')
  } finally {
    deleting.value = false
  }
}

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 格式化文件大小
const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

onMounted(() => {
  fetchBackups()
})
</script>

<style scoped>
.backup-container {
  padding: 20px;
}

.backup-card {
  max-width: 900px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  margin-bottom: 20px;
}

.backup-list h3 {
  margin-bottom: 15px;
  color: #303133;
}
</style>
