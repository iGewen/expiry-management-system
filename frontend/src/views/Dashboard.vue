<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon total">
            <el-icon :size="40"><Box /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">商品总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon warning">
            <el-icon :size="40"><WarningFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.warning }}</div>
            <div class="stat-label">即将过期</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon expired">
            <el-icon :size="40"><CircleCloseFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.expired }}</div>
            <div class="stat-label">已过期</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon today">
            <el-icon :size="40"><CirclePlusFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayAdded }}</div>
            <div class="stat-label">今日新增</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>商品状态分布</span>
          </template>
          <div ref="pieChartRef" style="width: 100%; height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>月度新增趋势</span>
          </template>
          <div ref="lineChartRef" style="width: 100%; height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="recent-products">
      <el-col :span="24">
        <el-card shadow="never">
          <template #header>
            <span>即将过期商品</span>
          </template>
          <el-table :data="expiringProducts" v-loading="loading">
            <el-table-column prop="name" label="商品名称" />
            <el-table-column prop="productionDate" label="生产日期" width="120">
              <template #default="{ row }">
                {{ dayjs(row.productionDate).format('YYYY-MM-DD') }}
              </template>
            </el-table-column>
            <el-table-column prop="expiryDate" label="过期日期" width="120">
              <template #default="{ row }">
                {{ dayjs(row.expiryDate).format('YYYY-MM-DD') }}
              </template>
            </el-table-column>
            <el-table-column prop="remainingDays" label="剩余天数" width="100">
              <template #default="{ row }">
                <el-tag :type="row.remainingDays <= 0 ? 'danger' : 'warning'">
                  {{ row.remainingDays }}天
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.status === 'EXPIRED'" type="danger">已过期</el-tag>
                <el-tag v-else-if="row.status === 'WARNING'" type="warning">即将过期</el-tag>
                <el-tag v-else type="success">正常</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Box, WarningFilled, CircleCloseFilled, CirclePlusFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { getProductStats, getProducts } from '@/api/product'
import type { Product } from '@/types'

const stats = ref({
  total: 0,
  warning: 0,
  expired: 0,
  todayAdded: 0
})

const expiringProducts = ref<Product[]>([])
const loading = ref(false)

const pieChartRef = ref<HTMLElement>()
const lineChartRef = ref<HTMLElement>()
let pieChart: echarts.ECharts | null = null
let lineChart: echarts.ECharts | null = null

const loadStats = async () => {
  try {
    const data = await getProductStats()
    if (data) {
      stats.value = data
      updatePieChart()
      updateLineChart(data.monthlyTrend || [])
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载统计数据失败')
  }
}

const loadExpiringProducts = async () => {
  loading.value = true
  try {
    const data = await getProducts({ status: 'WARNING,EXPIRED', pageSize: 10 })
    expiringProducts.value = data?.products || []
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载商品列表失败')
  } finally {
    loading.value = false
  }
}

const updatePieChart = () => {
  if (!pieChart || !pieChartRef.value) return
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      bottom: '5%',
      left: 'center'
    },
    series: [
      {
        name: '商品状态',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        data: [
          { value: stats.value.total - stats.value.warning - stats.value.expired, name: '正常', itemStyle: { color: '#67C23A' } },
          { value: stats.value.warning, name: '即将过期', itemStyle: { color: '#E6A23C' } },
          { value: stats.value.expired, name: '已过期', itemStyle: { color: '#F56C6C' } }
        ]
      }
    ]
  }
  
  pieChart.setOption(option)
}

const updateLineChart = (monthlyTrend: any[]) => {
  if (!lineChart || !lineChartRef.value) return
  
  const months = monthlyTrend.map(item => item.month)
  const counts = monthlyTrend.map(item => item.count)
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: months
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '新增商品',
        type: 'line',
        smooth: true,
        itemStyle: { color: '#409EFF' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        },
        data: counts
      }
    ]
  }
  
  lineChart.setOption(option)
}

const initCharts = () => {
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value)
  }
  if (lineChartRef.value) {
    lineChart = echarts.init(lineChartRef.value)
  }
  
  window.addEventListener('resize', handleResize)
}

const handleResize = () => {
  pieChart?.resize()
  lineChart?.resize()
}

onMounted(() => {
  initCharts()
  loadStats()
  loadExpiringProducts()
})

onUnmounted(() => {
  pieChart?.dispose()
  lineChart?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 10px;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 70px;
  border-radius: 12px;
  margin-right: 20px;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-icon.warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.stat-icon.expired {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
}

.stat-icon.today {
  background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.charts {
  margin-bottom: 20px;
}

.recent-products :deep(.el-card__header) {
  font-weight: bold;
}
</style>
