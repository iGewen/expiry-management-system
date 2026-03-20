<template>
  <div class="backup-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <div class="header-left">
        
        
      </div>
    </header>

    <!-- 备份状态卡片 -->
    <section class="status-section">
      <div class="status-card">
        <div class="status-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div class="status-info">
          <h3>数据保护状态</h3>
          <p class="status-text success">✓ 已启用自动备份</p>
          <p class="last-backup">上次备份：{{ lastBackupTime || '暂无备份记录' }}</p>
        </div>
      </div>
    </section>

    <!-- 操作区 -->
    <div class="action-grid">
      <!-- 创建备份 -->
      <div class="action-card">
        <div class="card-header">
          <div class="card-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div class="card-title">
            <h3>创建备份</h3>
            <p>手动创建当前数据库的完整备份</p>
          </div>
        </div>
        <div class="card-body">
          <div class="backup-options">
            <div class="option-item">
              <span class="option-label">备份类型</span>
              <el-radio-group v-model="backupType" size="large">
                <el-radio-button label="full">完整备份</el-radio-button>
                <el-radio-button label="data">仅数据</el-radio-button>
              </el-radio-group>
            </div>
            <div class="option-item">
              <span class="option-label">备份说明</span>
              <el-input v-model="backupNote" placeholder="可选：为本次备份添加说明" />
            </div>
          </div>
          <el-button type="primary" size="large" class="action-btn" :loading="creating" @click="handleCreateBackup">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            创建备份
          </el-button>
        </div>
      </div>

      <!-- 恢复备份 -->
      <div class="action-card">
        <div class="card-header">
          <div class="card-icon orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div class="card-title">
            <h3>恢复备份</h3>
            <p>从备份文件恢复系统数据</p>
          </div>
        </div>
        <div class="card-body">
          <el-upload class="upload-area" drag :auto-upload="false" :show-file-list="true" :limit="1" accept=".sql,.zip" @change="handleBackupFileChange">
            <div class="upload-content">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p>拖拽备份文件到此处</p>
              <span>支持 .sql、.zip 格式</span>
            </div>
          </el-upload>
          <el-button type="warning" size="large" class="action-btn" :loading="restoring" :disabled="!restoreFile" @click="handleRestore">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            恢复数据
          </el-button>
          <p class="warning-text"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>恢复操作将覆盖当前数据，请谨慎操作</p>
        </div>
      </div>
    </div>

    <!-- 备份列表 -->
    <section class="backup-list-section">
      <div class="section-header">
        <h2>备份记录</h2>
        <span class="record-count">共 {{ backups.length }} 条记录</span>
      </div>
      
      <div class="backup-grid">
        <div v-for="backup in backups" :key="backup.id" class="backup-item">
          <div class="backup-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="backup-info">
            <div class="backup-name">{{ backup.filename }}</div>
            <div class="backup-meta">
              <span class="backup-size">{{ formatSize(backup.size) }}</span>
              <span class="backup-time">{{ formatDate(backup.createdAt) }}</span>
            </div>
            <div v-if="backup.note" class="backup-note">{{ backup.note }}</div>
          </div>
          <div class="backup-actions">
            <el-button type="primary" size="small" @click="handleDownload(backup)">下载</el-button>
            <el-button type="danger" size="small" plain @click="handleDelete(backup)">删除</el-button>
          </div>
        </div>
        
        <div v-if="backups.length === 0" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <p>暂无备份记录</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import httpClient from '@/utils/request'

const backups = ref<any[]>([])
const creating = ref(false)
const restoring = ref(false)
const restoreFile = ref<File | null>(null)
const lastBackupTime = ref('')
const backupType = ref('full')
const backupNote = ref('')

const formatSize = (bytes: number) => { if (bytes < 1024) return bytes + ' B'; if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'; return (bytes / 1024 / 1024).toFixed(1) + ' MB' }
const formatDate = (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')

const loadBackups = async () => {
  try {
    const res = await httpClient.get('/backup')
    backups.value = res?.data || []
    if (backups.value.length > 0) lastBackupTime.value = formatDate(backups.value[0].createdAt)
  } catch (error) { console.error('Load backups error:', error) }
}

const handleCreateBackup = async () => {
  creating.value = true
  try {
    await httpClient.post('/backup', { type: backupType.value, note: backupNote.value })
    ElMessage.success('备份创建成功')
    backupNote.value = ''
    loadBackups()
  } catch (error: any) { ElMessage.error(error.response?.data?.message || '备份创建失败') }
  finally { creating.value = false }
}

const handleBackupFileChange = (file: any) => { restoreFile.value = file.raw }

const handleRestore = async () => {
  if (!restoreFile.value) { ElMessage.warning('请选择备份文件'); return }
  try { await ElMessageBox.confirm('恢复操作将覆盖当前数据，是否继续？', '警告', { type: 'warning', confirmButtonText: '确定恢复', cancelButtonText: '取消' }) }
  catch { return }
  restoring.value = true
  try {
    const formData = new FormData()
    formData.append('backupFile', restoreFile.value)
    await httpClient.post('/backup/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    ElMessage.success('数据恢复成功')
  } catch (error: any) { ElMessage.error(error.response?.data?.message || '恢复失败') }
  finally { restoring.value = false }
}

const handleDownload = async (backup: any) => {
  try {
    const res = await httpClient.get(`/backup/download/${backup.filename}`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(res as any)
    const link = document.createElement('a')
    link.href = url; link.download = backup.filename
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) { ElMessage.error('下载失败') }
}

const handleDelete = async (backup: any) => {
  try { await ElMessageBox.confirm('确定删除该备份？', '删除确认', { type: 'warning' }) }
  catch { return }
  try { await httpClient.delete(`/backup/${backup.filename}`); ElMessage.success('删除成功'); loadBackups() }
  catch (error: any) { ElMessage.error(error.response?.data?.message || '删除失败') }
}

onMounted(() => { loadBackups() })
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.backup-page { padding: 32px; background: #f8fafc; min-height: calc(100vh - 64px); }

.page-header { margin-bottom: 24px; }
.header-left { .page-title { font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0; } .page-desc { font-size: 14px; color: #64748b; margin: 0; } }

.status-section { margin-bottom: 24px; }
.status-card { background: linear-gradient(135deg, #1e3a5f, #2c5282); border-radius: 16px; padding: 24px; display: flex; align-items: center; gap: 20px; color: white; }
.status-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.15); border-radius: 16px; display: flex; align-items: center; justify-content: center; }
.status-info { h3 { font-size: 18px; margin: 0 0 8px 0; font-weight: 600; } .status-text { font-size: 14px; margin: 0 0 4px 0; &.success { color: #86efac; } } .last-backup { font-size: 13px; opacity: 0.8; margin: 0; } }

.action-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-bottom: 24px; @media (max-width: 1024px) { grid-template-columns: 1fr; } }

.action-card { background: white; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; overflow: hidden; }
.card-header { display: flex; align-items: center; gap: 16px; padding: 20px; border-bottom: 1px solid #f1f5f9; }
.card-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white;
  &.blue { background: linear-gradient(135deg, #1e3a5f, #2c5282); } &.orange { background: linear-gradient(135deg, #f59e0b, #f97316); }
}
.card-title { h3 { font-size: 16px; font-weight: 600; color: #1e293b; margin: 0 0 4px 0; } p { font-size: 13px; color: #64748b; margin: 0; } }
.card-body { padding: 20px; }

.backup-options { margin-bottom: 20px; .option-item { margin-bottom: 16px; &:last-child { margin-bottom: 0; } .option-label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; } } }

.upload-area { margin-bottom: 16px; :deep(.el-upload-dragger) { border: 2px dashed #e2e8f0; border-radius: 12px; background: #fafafa; padding: 24px; &:hover { border-color: #1e3a5f; } } }
.upload-content { text-align: center; color: #64748b; svg { color: #94a3b8; margin-bottom: 8px; } p { font-size: 14px; margin: 4px 0 0 0; } span { font-size: 12px; color: #94a3b8; } }

.action-btn { width: 100%; height: 44px; border-radius: 10px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; }
.warning-text { font-size: 12px; color: #f59e0b; margin-top: 12px; text-align: center; }

.backup-list-section { background: white; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; padding: 24px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; h2 { font-size: 18px; font-weight: 600; color: #1e293b; margin: 0; } .record-count { font-size: 13px; color: #64748b; } }

.backup-grid { display: flex; flex-direction: column; gap: 12px; }
.backup-item { display: flex; align-items: center; gap: 16px; padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; transition: all 0.2s ease; &:hover { background: #f1f5f9; } }
.backup-icon { width: 48px; height: 48px; background: rgba(30, 58, 95, 0.08); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #1e3a5f; flex-shrink: 0; }
.backup-info { flex: 1; min-width: 0; .backup-name { font-size: 14px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .backup-meta { font-size: 12px; color: #64748b; margin-top: 4px; span { margin-right: 12px; } } .backup-note { font-size: 12px; color: #94a3b8; margin-top: 4px; font-style: italic; } }
.backup-actions { display: flex; gap: 8px; flex-shrink: 0; }

.empty-state { text-align: center; padding: 48px; color: #94a3b8; p { margin: 12px 0 0 0; font-size: 14px; } }
</style>
