<template>
  <div class="log-audit-page">
    <!-- 页面头部 -->

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
        <div class="stat-icon purple">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div class="stat-body">
          <span class="stat-value">{{ stats.actions }}</span>
          <span class="stat-label">操作类型</span>
        </div>
      </div>
    </section>

    <!-- 筛选栏 -->
    <section class="filter-section">
      <div class="filter-bar" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <el-input v-model="searchForm.username" placeholder="搜索用户..." clearable @keyup.enter="handleSearch" style="width:180px;">
            <template #prefix>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </template>
          </el-input>
          <el-select v-model="searchForm.action" placeholder="操作类型" clearable @change="handleSearch" style="width:180px;">
            <el-option label="登录" value="LOGIN" />
            <el-option label="登出" value="LOGOUT" />
            <el-option label="创建商品" value="CREATE_PRODUCT" />
            <el-option label="更新商品" value="UPDATE_PRODUCT" />
            <el-option label="删除商品" value="DELETE_PRODUCT" />
            <el-option label="批量更新" value="UPDATE_PRODUCTS" />
            <el-option label="批量删除" value="DELETE_PRODUCTS" />
            <el-option label="导入商品" value="IMPORT_PRODUCTS" />
          </el-select>
          <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" @change="handleSearch" style="width:260px;" />
          <el-button @click="handleReset">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            重置
          </el-button>
        </div>
        <div style="display:flex;gap:8px;">
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
      </div>
    </section>

    <!-- 日志列表 -->
    <section class="table-section">
      <el-table :data="logs" v-loading="loading" class="data-table" style="width: 100%" table-layout="auto">
        <el-table-column type="index" label="#" width="60" align="center" />
        
        <el-table-column label="时间" min-width="170">
          <template #default="{ row }">
            <span class="time-text">{{ formatDateTime(row.createdAt) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="用户" min-width="160">
          <template #default="{ row }">
            <div class="user-cell">
              <div class="user-avatar">{{ (row.username || '?').charAt(0).toUpperCase() }}</div>
              <div class="user-info">
                <span class="user-name">{{ row.username || '系统' }}</span>
                <span class="user-role">{{ getRoleText(row.userRole) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" min-width="130">
          <template #default="{ row }">
            <span class="action-badge" :class="getActionClass(row.action)">{{ getActionText(row.action) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="模块" width="80" align="center">
          <template #default="{ row }">
            <span class="module-text">{{ getModule(row.action) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="描述" min-width="200">
          <template #default="{ row }">
            <span class="desc-text">{{ getDescription(row) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="IP地址" min-width="130">
          <template #default="{ row }">
            <span class="ip-text">{{ formatIp(row.ipAddress) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="80" fixed="right">
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
    <el-dialog v-model="detailVisible" title="日志详情" width="700px" :close-on-click-modal="false">
      <div class="detail-content" v-if="currentLog">
        <div class="detail-row">
          <div class="detail-label">日志ID</div>
          <div class="detail-value">{{ currentLog.id }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">操作时间</div>
          <div class="detail-value">{{ formatDateTime(currentLog.createdAt) }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">操作用户</div>
          <div class="detail-value">
            <span class="user-badge">{{ currentLog.username || '系统' }}</span>
            <span class="role-badge">{{ getRoleText(currentLog.userRole) }}</span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-label">操作类型</div>
          <div class="detail-value">
            <span class="action-badge" :class="getActionClass(currentLog.action)">{{ getActionText(currentLog.action) }}</span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-label">所属模块</div>
          <div class="detail-value">{{ getModule(currentLog.action) }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">操作描述</div>
          <div class="detail-value">{{ getDescription(currentLog) }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">IP地址</div>
          <div class="detail-value">{{ formatIp(currentLog.ipAddress) }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">客户端</div>
          <div class="detail-value user-agent">{{ currentLog.userAgent || '-' }}</div>
        </div>
        <div class="detail-row full-width">
          <div class="detail-label">详细信息</div>
          <div class="detail-value">
            <pre class="detail-json">{{ formatDetails(currentLog.details) }}</pre>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
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
  let total = pagination.total, today = 0, users = 0, actions = 0
  const userSet = new Set()
  const actionSet = new Set()
  logs.value.forEach((log: any) => {
    if (dayjs(log.createdAt).isSame(dayjs(), 'day')) today++
    if (log.username) userSet.add(log.username)
    if (log.action) actionSet.add(log.action)
  })
  users = userSet.size
  actions = actionSet.size
  return { total, today, users, actions }
})

const formatDateTime = (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')

const formatIp = (ip: string) => {
  if (!ip) return '-'
  return ip.replace('::ffff:', '')
}

const getRoleText = (role: string) => {
  const roles: Record<string, string> = {
    'SUPER_ADMIN': '超级管理员',
    'ADMIN': '管理员',
    'USER': '普通用户'
  }
  return roles[role] || role || '-'
}

const getActionClass = (action: string) => {
  if (action?.includes('CREATE')) return 'green'
  if (action?.includes('UPDATE')) return 'orange'
  if (action?.includes('DELETE')) return 'red'
  if (action?.includes('IMPORT')) return 'purple'
  if (action === 'LOGIN') return 'blue'
  if (action === 'LOGOUT') return 'gray'
  return 'gray'
}

const getActionText = (action: string) => {
  const texts: Record<string, string> = {
    'LOGIN': '登录',
    'LOGOUT': '登出',
    'CREATE_PRODUCT': '创建商品',
    'UPDATE_PRODUCT': '更新商品',
    'DELETE_PRODUCT': '删除商品',
    'UPDATE_PRODUCTS': '批量更新',
    'DELETE_PRODUCTS': '批量删除',
    'IMPORT_PRODUCTS': '导入商品',
    'CREATE_CATEGORY': '创建分类',
    'UPDATE_CATEGORY': '更新分类',
    'DELETE_CATEGORY': '删除分类',
    'UPDATE_USER': '更新用户',
    'DELETE_USER': '删除用户',
    'TRIGGER_REMINDER': '发送提醒',
    'UPDATE_REMINDER_SETTING': '更新提醒设置',
    'CREATE_BACKUP': '创建备份',
    'RESTORE_BACKUP': '恢复备份',
    'DELETE_BACKUP': '删除备份'
  }
  return texts[action] || action || '-'
}

const getModule = (action: string) => {
  if (!action) return '-'
  if (action.includes('PRODUCT')) return '商品'
  if (action.includes('CATEGORY')) return '分类'
  if (action.includes('USER')) return '用户'
  if (action.includes('REMINDER')) return '提醒'
  if (action.includes('BACKUP')) return '备份'
  if (action === 'LOGIN' || action === 'LOGOUT') return '认证'
  return '系统'
}

const getDescription = (row: any) => {
  if (!row.details) return '-'
  try {
    const details = typeof row.details === 'string' ? JSON.parse(row.details) : row.details
    if (details.message) return details.message
    if (details.responseMessage) return details.responseMessage
    return `${row.action || '操作'}`
  } catch {
    return row.action || '-'
  }
}

const formatDetails = (details: any) => {
  if (!details) return '{}'
  try {
    const parsed = typeof details === 'string' ? JSON.parse(details) : details
    return JSON.stringify(parsed, null, 2)
  } catch {
    return details
  }
}

const loadLogs = async () => {
  loading.value = true
  try {
    const params: any = { page: pagination.page, pageSize: pagination.pageSize }
    if (searchForm.username) params.username = searchForm.username
    if (searchForm.action) params.action = searchForm.action
    if (searchForm.dateRange) { params.startDate = searchForm.dateRange[0]; params.endDate = searchForm.dateRange[1] }
    const res = await httpClient.get('/logs', { params })
    logs.value = res?.data?.logs || []
    pagination.total = res?.data?.total || 0
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '获取日志失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pagination.page = 1; loadLogs() }
const handleReset = () => {
  searchForm.username = ''
  searchForm.action = ''
  searchForm.dateRange = null
  handleSearch()
}
const handleExport = () => { ElMessage.success('日志导出功能开发中...') }
const showDetail = (row: any) => {
  currentLog.value = row
  detailVisible.value = true
}

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
.header-right { display: flex; gap: 12px; .el-button { height: 40px; padding: 0 20px; border-radius: 10px; } }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); } }
.stat-card { background: white; border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
  &.blue { background: rgba(30, 58, 95, 0.08); color: #1e3a5f; } &.green { background: #d1fae5; color: #10b981; }
  &.orange { background: #fef3c7; color: #f59e0b; } &.purple { background: #f3e8ff; color: #2c5282; }
}
.stat-body { display: flex; flex-direction: column; }
.stat-value { font-size: 24px; font-weight: 700; color: #1e293b; }
.stat-label { font-size: 13px; color: #64748b; margin-top: 2px; }

.filter-section { background: white; border-radius: 16px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; }
.filter-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.filter-item { :deep(.el-input), :deep(.el-select) { width: 180px; } :deep(.el-date-editor) { width: 260px; } }

.table-section { background: white; border-radius: 16px; overflow: visible; box-shadow: 0 1px 3px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; min-width: 1200px; }
.data-table { --el-table-border-color: #f1f5f9;
  :deep(th) { background: #f8fafc !important; color: #64748b; font-weight: 600; font-size: 13px; padding: 14px 12px; white-space: nowrap; overflow: visible; }
  :deep(th .cell) { overflow: visible; white-space: nowrap; }
  :deep(td) { padding: 12px; vertical-align: middle; }
  :deep(td .cell) { overflow: visible; }
  :deep(.el-table__row:hover > td) { background: #fafafa !important; }
}

.time-text { font-size: 13px; color: #1e293b; white-space: nowrap; }
.user-cell { display: flex; align-items: center; gap: 10px; }
.user-avatar { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #1e3a5f, #2c5282); color: white; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; flex-shrink: 0; }
.user-info { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; }
.user-name { font-size: 13px; font-weight: 500; color: #1e293b; white-space: nowrap; }
.user-role { font-size: 11px; color: #94a3b8; white-space: nowrap; }

.action-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; white-space: nowrap;
  &.blue { background: rgba(30, 58, 95, 0.08); color: #1e3a5f; } &.gray { background: #f1f5f9; color: #64748b; }
  &.green { background: #d1fae5; color: #10b981; } &.orange { background: #fef3c7; color: #f59e0b; }
  &.red { background: #fee2e2; color: #ef4444; } &.purple { background: #f3e8ff; color: #2c5282; }
}
.module-text { font-size: 13px; color: #64748b; }
.desc-text { font-size: 13px; color: #1e293b; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ip-text { font-size: 12px; color: #64748b; font-family: monospace; }

.pagination-wrapper { padding: 16px 20px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; }

// 详情弹窗样式
.detail-content { display: flex; flex-wrap: wrap; gap: 16px; }
.detail-row { display: flex; width: calc(50% - 8px); align-items: flex-start; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 8px;
  &.full-width { width: 100%; flex-direction: column; }
}
.detail-label { font-size: 13px; color: #64748b; min-width: 70px; flex-shrink: 0; }
.detail-value { font-size: 14px; color: #1e293b; flex: 1; word-break: break-all; }
.user-badge { display: inline-block; padding: 2px 8px; background: rgba(30, 58, 95, 0.08); color: #1e3a5f; border-radius: 4px; font-size: 12px; margin-right: 8px; }
.role-badge { display: inline-block; padding: 2px 8px; background: #f1f5f9; color: #64748b; border-radius: 4px; font-size: 11px; }
.user-agent { font-size: 12px; color: #94a3b8; word-break: break-all; }
.detail-json { margin: 0; padding: 12px; background: #1e293b; color: #10b981; border-radius: 8px; font-size: 12px; overflow-x: auto; max-height: 300px; white-space: pre-wrap; word-break: break-all; }
</style>
