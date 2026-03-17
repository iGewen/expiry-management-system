<template>
  <div class="log-audit-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <div class="header-left">
        <h1 class="page-title">日志审计</h1>
        <p class="page-desc">查看系统操作日志，追踪用户行为</p>
      </div>
      <div class="header-right">
        <el-button type="danger" plain @click="handleClearLogs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          清空日志
        </el-button>
        <el-button @click="handleExport">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          导出日志
        </el-button>
      </div>
    </header>

    <!-- 统计卡片 -->
    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="stat-body">
          <span class="stat-value">{{ stats.total }}</span>
          <span class="stat-label">总日志数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="stat-body">
          <span class="stat-value">{{ stats.today }}</span>
          <span class="stat-label">今日操作</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="stat-body">
          <span class="stat-value">{{ stats.users }}</span>
          <span class="stat-label">活跃用户</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div class="stat-body">
          <span class="stat-value">{{ stats.errors }}</span>
          <span class="stat-label">异常操作</span>
        </div>
      </div>
    </section>

    <!-- 筛选栏 -->
    <section class="filter-section">
      <div class="filter-bar">
        <div class="filter-item">
          <el-input v-model="searchForm.username" placeholder="搜索用户..." clearable @keyup.enter="handleSearch">
            <template #prefix>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </template>
          </el-input>
        </div>
        <div class="filter-item">
          <el-select v-model="searchForm.action" placeholder="操作类型" clearable @change="handleSearch">
            <el-option label="登录" value="LOGIN" />
            <el-option label="登出" value="LOGOUT" />
            <el-option label="新增" value="CREATE" />
            <el-option label="更新" value="UPDATE" />
            <el-option label="删除" value="DELETE" />
            <el-option label="导出" value="EXPORT" />
          </el-select>
        </div>
        <div class="filter-item">
          <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" @change="handleSearch" />
        </div>
        <el-button @click="handleReset">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          重置
        </el-button>
      </div>
    </section>

    <!-- 日志列表 -->
    <section class="table-section">
      <el-table :data="logs" v-loading="loading" class="data-table">
        <el-table-column type="index" label="#" width="60" />
        
        <el-table-column label="时间" width="170">
          <template #default="{ row }">
            <div class="time-cell">
              <span class="time-date">{{ formatDate(row.createdAt, 'YYYY-MM-DD') }}</span>
              <span class="time-clock">{{ formatDate(row.createdAt, 'HH:mm:ss') }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="用户" width="120">
          <template #default="{ row }">
            <div class="user-cell">
              <div class="user-avatar">{{ row.user?.username?.charAt(0)?.toUpperCase() || '?' }}</div>
              <span>{{ row.user?.username || '系统' }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="action" label="操作" width="100">
          <template #default="{ row }">
            <span class="action-badge" :class="getActionClass(row.action)">{{ getActionText(row.action) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="module" label="模块" width="100" />
        
        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="{ row }">
            <span class="desc-text">{{ row.description }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="ip" label="IP地址" width="130" />
        
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <span class="status-dot" :class="row.status === 'SUCCESS' ? 'success' : 'error'"></span>
            {{ row.status === 'SUCCESS' ? '成功' : '失败' }}
          </template>
        </el-table-column>
        
        <el-table-column label="详情" width="80">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="showDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" :page-sizes="[20, 50, 100]" layout="total, sizes, prev, pager, next" @size-change="loadLogs" @current-change="loadLogs" />
      </div>
    </section>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="日志详情" width="500px">
      <el-descriptions :column="1" border v-if="currentLog">
        <el-descriptions-item label="时间">{{ formatDate(currentLog.createdAt, 'YYYY-MM-DD HH:mm:ss') }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentLog.user?.username || '系统' }}</el-descriptions-item>
        <el-descriptions-item label="操作">{{ getActionText(currentLog.action) }}</el-descriptions-item>
        <el-descriptions-item label="模块">{{ currentLog.module }}</el-descriptions-item>
        <el-descriptions-item label="描述">{{ currentLog.description }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentLog.ip }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentLog.status === 'SUCCESS' ? '成功' : '失败' }}</el-descriptions-item>
        <el-descriptions-item label="详情">
          <pre class="detail-json">{{ JSON.stringify(currentLog.details || {}, null, 2) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import httpClient from '@/utils/request'

const logs = ref<any[]>([])
const loading = ref(false)
const detailVisible = ref(false)
const currentLog = ref<any>(null)

const searchForm = reactive({ username: '', action: '', dateRange: null as [string, string] | null })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const stats = computed(() => {
  let total = pagination.total, today = 0, users = 0, errors = 0
  logs.value.forEach((log: any) => { if (dayjs(log.createdAt).isSame(dayjs(), 'day')) today++; if (log.status !== 'SUCCESS') errors++ })
  users = [...new Set(logs.value.map((l: any) => l.user?.id))].filter(Boolean).length
  return { total, today, users, errors }
})

const formatDate = (date: string, format: string) => dayjs(date).format(format)

const getActionClass = (action: string) => {
  const classes: Record<string, string> = { LOGIN: 'blue', LOGOUT: 'gray', CREATE: 'green', UPDATE: 'orange', DELETE: 'red', EXPORT: 'purple' }
  return classes[action] || 'gray'
}

const getActionText = (action: string) => {
  const texts: Record<string, string> = { LOGIN: '登录', LOGOUT: '登出', CREATE: '新增', UPDATE: '更新', DELETE: '删除', EXPORT: '导出' }
  return texts[action] || action
}

const loadLogs = async () => {
  loading.value = true
  try {
    const params: any = { page: pagination.page, pageSize: pagination.pageSize }
    if (searchForm.username) params.username = searchForm.username
    if (searchForm.action) params.action = searchForm.action
    if (searchForm.dateRange) { params.startDate = searchForm.dateRange[0]; params.endDate = searchForm.dateRange[1] }
    const res = await httpClient.get('/logs', { params })
    logs.value = res?.data?.logs || []; pagination.total = res?.data?.total || 0
  } catch (error: any) { ElMessage.error(error.response?.data?.message || '获取日志失败') }
  finally { loading.value = false }
}

const handleSearch = () => { pagination.page = 1; loadLogs() }
const handleReset = () => { searchForm.username = ''; searchForm.action = ''; searchForm.dateRange = null; handleSearch() }
const handleExport = () => { ElMessage.success('日志导出功能开发中...') }
const showDetail = (row: any) => { currentLog.value = row; detailVisible.value = true }

const handleClearLogs = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有日志吗？此操作不可恢复。', '清空确认', { type: 'warning', confirmButtonText: '确认清空' })
    await httpClient.delete('/logs')
    ElMessage.success('日志已清空')
    loadLogs()
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error(error.response?.data?.message || '清空失败')
  }
}

onMounted(() => { loadLogs() })
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.log-audit-page { padding: 32px; background: #f8fafc; min-height: calc(100vh - 64px); }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.header-left {
  .page-title { font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0; }
  .page-desc { font-size: 14px; color: #64748b; margin: 0; }
}
.header-right { .el-button { height: 40px; padding: 0 20px; border-radius: 10px; } }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); } }
.stat-card { background: white; border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
  &.blue { background: #eef2ff; color: #6366f1; } &.green { background: #d1fae5; color: #10b981; }
  &.orange { background: #fef3c7; color: #f59e0b; } &.red { background: #fee2e2; color: #ef4444; }
}
.stat-body { display: flex; flex-direction: column; }
.stat-value { font-size: 24px; font-weight: 700; color: #1e293b; }
.stat-label { font-size: 13px; color: #64748b; margin-top: 2px; }

.filter-section { background: white; border-radius: 16px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; }
.filter-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.filter-item { :deep(.el-input), :deep(.el-select), :deep(.el-date-editor) { width: 180px; } }

.table-section { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; }
.data-table { --el-table-border-color: #f1f5f9;
  :deep(th) { background: #f8fafc !important; color: #64748b; font-weight: 600; font-size: 12px; text-transform: uppercase; padding: 14px 12px; }
  :deep(td) { padding: 12px; }
  :deep(.el-table__row:hover > td) { background: #fafafa !important; }
}

.time-cell { display: flex; flex-direction: column; .time-date { font-size: 13px; color: #1e293b; } .time-clock { font-size: 12px; color: #94a3b8; } }
.user-cell { display: flex; align-items: center; gap: 8px; .user-avatar { width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; } }
.action-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500;
  &.blue { background: #eef2ff; color: #6366f1; } &.gray { background: #f1f5f9; color: #64748b; }
  &.green { background: #d1fae5; color: #10b981; } &.orange { background: #fef3c7; color: #f59e0b; }
  &.red { background: #fee2e2; color: #ef4444; } &.purple { background: #f3e8ff; color: #8b5cf6; }
}
.desc-text { font-size: 13px; color: #64748b; }
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; &.success { background: #10b981; } &.error { background: #ef4444; } }
.pagination-wrapper { padding: 16px 20px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; }
.detail-json { margin: 0; padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 12px; overflow-x: auto; }
</style>
