<template>
  <div class="log-audit">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>日志审计</span>
          <el-button v-if="userStore.isAdmin" type="danger" @click="handleClearLogs">
            <el-icon><Delete /></el-icon>
            清空日志
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="操作类型">
          <el-select 
            v-model="searchForm.action" 
            placeholder="请选择类型" 
            clearable 
            @clear="handleSearch"
            style="width: 180px;"
          >
            <el-option label="创建" value="CREATE" />
            <el-option label="更新" value="UPDATE" />
            <el-option label="删除" value="DELETE" />
            <el-option label="登录" value="LOGIN" />
            <el-option label="注册" value="REGISTER" />
            <el-option label="POST请求" value="POST_UNKNOWN" />
            <el-option label="GET请求" value="GET_UNKNOWN" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
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

      <el-table :data="logs" v-loading="loading" border>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="action" label="操作类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)">{{ getActionText(row.action) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="操作人" width="120" />
        <el-table-column prop="userRole" label="用户角色" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.userRole === 'SUPER_ADMIN'" type="danger">超级管理员</el-tag>
            <el-tag v-else-if="row.userRole === 'ADMIN'" type="warning">管理员</el-tag>
            <el-tag v-else>普通用户</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="details" label="详情" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ipAddress" label="IP地址" width="140" />
        <el-table-column prop="createdAt" label="操作时间" width="160">
          <template #default="{ row }">
            {{ dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="showDetail(row)">
              <el-icon><View /></el-icon>
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadLogs"
        @current-change="loadLogs"
        class="pagination"
      />
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="日志详情" width="600px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="操作类型">
          <el-tag :type="getActionType(currentLog.action)">{{ getActionText(currentLog.action) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentLog.username }}</el-descriptions-item>
        <el-descriptions-item label="用户角色">{{ currentLog.userRole }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentLog.ipAddress }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">
          {{ currentLog.createdAt ? dayjs(currentLog.createdAt).format('YYYY-MM-DD HH:mm:ss') : '' }}
        </el-descriptions-item>
        <el-descriptions-item label="详细信息">
          <pre v-if="currentLog.details" style="max-height: 200px; overflow: auto;">{{ currentLog.details }}</pre>
          <span v-else>无</span>
        </el-descriptions-item>
        <el-descriptions-item label="User Agent">
          <span style="word-break: break-all;">{{ currentLog.userAgent || '-' }}</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, View, Delete } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { getLogs, clearLogs } from '@/api/log'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const logs = ref<any[]>([])
const loading = ref(false)
const detailVisible = ref(false)
const currentLog = ref<any>({})

const searchForm = reactive({
  action: 'POST_UNKNOWN',  // 默认选择POST
  dateRange: [] as string[]
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const loadLogs = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    
    if (searchForm.action) params.action = searchForm.action
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    
    const data = await getLogs(params)
    logs.value = data?.logs || []
    pagination.total = data?.total || 0
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载日志列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadLogs()
}

const handleReset = () => {
  searchForm.action = 'POST_UNKNOWN'
  searchForm.dateRange = []
  handleSearch()
}

const handleClearLogs = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有日志吗？此操作不可恢复！',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    loading.value = true
    // 清空30天前的所有日志
    const beforeDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD')
    await clearLogs(beforeDate)
    
    ElMessage.success('日志清空成功')
    loadLogs()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '清空日志失败')
    }
  } finally {
    loading.value = false
  }
}

const showDetail = (row: any) => {
  currentLog.value = row
  detailVisible.value = true
}

const getActionType = (action: string) => {
  const typeMap: Record<string, any> = {
    CREATE: 'success',
    UPDATE: 'warning',
    DELETE: 'danger',
    LOGIN: 'info',
    REGISTER: 'success',
    POST_UNKNOWN: 'primary',
    GET_UNKNOWN: 'info'
  }
  return typeMap[action] || 'info'
}

const getActionText = (action: string) => {
  const textMap: Record<string, string> = {
    CREATE: '创建',
    UPDATE: '更新',
    DELETE: '删除',
    LOGIN: '登录',
    REGISTER: '注册',
    POST_UNKNOWN: 'POST请求',
    GET_UNKNOWN: 'GET请求'
  }
  return textMap[action] || action
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.log-audit {
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
