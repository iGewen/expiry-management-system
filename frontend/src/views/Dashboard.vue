<template>
  <div class="dashboard-page">
    <!-- 页面标题区 -->
    

    <!-- 核心指标卡片 -->
    <section class="metrics-grid">
      <div 
        v-for="(metric, index) in metrics" 
        :key="index"
        class="metric-card"
        :class="metric.type"
      >
        <div class="metric-icon">
          <component :is="metric.icon" :size="28" />
        </div>
        <div class="metric-body">
          <span class="metric-value">{{ metric.value }}</span>
          <span class="metric-label">{{ metric.label }}</span>
        </div>
        <div class="metric-footer">
          <div class="metric-trend" v-if="metric.trend !== undefined">
            <el-icon :size="14">
              <component :is="metric.trend >= 0 ? 'Top' : 'Bottom'" />
            </el-icon>
            <span>{{ Math.abs(metric.trend) }}%</span>
          </div>
          <span class="metric-period">较上月</span>
        </div>
      </div>
    </section>

    <!-- 图表区 -->
    <section class="charts-grid">
      <!-- 饼图卡片 -->
      <div class="chart-card">
        <div class="card-header">
          <div class="header-left">
            <h3 class="card-title">商品状态分布</h3>
            <span class="card-subtitle">按过期状态统计</span>
          </div>
          <div class="header-right">
            <el-tag type="info" effect="light" round>
              共 {{ stats.total }} 件
            </el-tag>
          </div>
        </div>
        <div class="card-body">
          <div ref="pieChartRef" class="chart-container"></div>
        </div>
      </div>

      <!-- 折线图卡片 -->
      <div class="chart-card">
        <div class="card-header">
          <div class="header-left">
            <h3 class="card-title">月度新增趋势</h3>
            <span class="card-subtitle">近6个月商品入库情况</span>
          </div>
        </div>
        <div class="card-body">
          <div ref="lineChartRef" class="chart-container"></div>
        </div>
      </div>
    </section>

    <!-- 预警商品列表 -->
    <section class="alert-section">
      <div class="section-header">
        <div class="section-left">
          <div class="section-icon warning">
            <el-icon :size="20"><WarningFilled /></el-icon>
          </div>
          <div class="section-title">
            <h3>即将过期商品</h3>
            <span>需要及时处理的商品预警</span>
          </div>
        </div>
        <div class="section-right">
          <el-tag type="warning" effect="light">
            {{ expiringProducts.length }} 件待处理
          </el-tag>
        </div>
      </div>
      
      <div class="alert-table-wrapper">
        <el-table 
          :data="expiringProducts" 
          v-loading="loading"
          class="alert-table"
        >
          <el-table-column prop="name" label="商品名称" min-width="180">
            <template #default="{ row }">
              <span class="txt">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="分类" width="80">
            <template #default="{ row }">
              <span v-if="row.category" class="tag" :style="{background: row.category.color || '#1e3a5f'}">{{ row.category.name }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="过期日期" width="90">
            <template #default="{ row }">
              <span class="txt">{{ dayjs(row.expiryDate).format('MM-DD') }}</span>
            </template>
          </el-table-column>
          <el-table-column label="剩余" width="70">
            <template #default="{ row }">
              <span class="txt">{{ row.remainingDays }}天</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="60">
            <template #default="{ row }">
              <span class="txt">{{ getStatusText(row.status) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="70">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 空状态 -->
        <div class="empty-state" v-if="!loading && expiringProducts.length === 0">
          <div class="empty-icon">
            <el-icon :size="48"><CircleCheck /></el-icon>
          </div>
          <div class="empty-text">
            <h4>太棒了！暂无即将过期的商品</h4>
            <p>所有商品都在保质期内，继续保持</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Box, 
  WarningFilled, 
  CircleCloseFilled, 
  CirclePlusFilled,
  Top,
  Bottom,
  PieChart,
  TrendCharts,
  Plus,
  CircleCheck
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { getProductStats, getProducts } from '@/api/product'
import type { Product } from '@/types'

const router = useRouter()

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

// 核心指标
const metrics = computed(() => [
  {
    type: 'primary',
    icon: Box,
    value: stats.value.total,
    label: '商品总数',
    trend: undefined
  },
  {
    type: 'warning',
    icon: WarningFilled,
    value: stats.value.warning,
    label: '即将过期',
    trend: undefined
  },
  {
    type: 'danger',
    icon: CircleCloseFilled,
    value: stats.value.expired,
    label: '已过期',
    trend: undefined
  },
  {
    type: 'success',
    icon: CirclePlusFilled,
    value: stats.value.todayAdded,
    label: '今日新增',
    trend: undefined
  }
])

const getDaysClass = (days: number) => {
  if (days <= 0) return 'expired'
  if (days <= 7) return 'critical'
  return 'warning'
}

const getStatusClass = (status: string) => {
  if (status === 'EXPIRED') return 'expired'
  if (status === 'WARNING') return 'warning'
  return 'normal'
}

const getStatusText = (status: string) => {
  if (status === 'EXPIRED') return '过期'
  if (status === 'WARNING') return '预警'
  return '正常'
}

const handleEdit = (row: Product) => {
  router.push(`/products?id=${row.id}`)
}

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
    const data = await getProducts({ status: 'WARNING', pageSize: 5 })
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
      formatter: '{b}: {c}件 ({d}%)',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: { 
        color: '#1e293b',
        fontSize: 14
      }
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      itemGap: 16,
      textStyle: { 
        color: '#64748b',
        fontSize: 13
      }
    },
    series: [{
      type: 'pie',
      radius: ['50%', '75%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 3
      },
      label: { show: false },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: '600'
        },
        itemStyle: {
          shadowBlur: 20,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.1)'
        }
      },
      data: [
        { 
          value: stats.value.total - stats.value.warning - stats.value.expired, 
          name: '正常', 
          itemStyle: { color: '#10b981' } 
        },
        { 
          value: stats.value.warning, 
          name: '即将过期', 
          itemStyle: { color: '#f59e0b' } 
        },
        { 
          value: stats.value.expired, 
          name: '已过期', 
          itemStyle: { color: '#ef4444' } 
        }
      ]
    }]
  }
  
  pieChart.setOption(option)
}

const updateLineChart = (monthlyTrend: any[]) => {
  if (!lineChart || !lineChartRef.value) return
  
  const months = monthlyTrend.map(item => item.month)
  const counts = monthlyTrend.map(item => item.count)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: { color: '#1e293b' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: months,
      axisLine: { 
        show: true,
        lineStyle: { color: '#e2e8f0' } 
      },
      axisTick: { show: false },
      axisLabel: { 
        color: '#64748b',
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { 
        color: '#64748b',
        fontSize: 12
      },
      splitLine: { 
        lineStyle: { 
          color: '#f1f5f9',
          type: 'dashed'
        } 
      }
    },
    series: [{
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      data: counts,
      lineStyle: {
        width: 3,
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#1e3a5f' },
          { offset: 1, color: '#2c5282' }
        ])
      },
      itemStyle: {
        color: '#1e3a5f',
        borderWidth: 3,
        borderColor: '#fff'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(30, 58, 95, 0.15)' },
          { offset: 1, color: 'rgba(30, 58, 95, 0.01)' }
        ])
      }
    }]
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

<style scoped lang="scss">
@import '@/styles/variables.scss';

.dashboard-page {
  padding: 32px;
  background: #f8fafc;
  min-height: calc(100vh - 64px);
}

// 页面标题
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.header-content {
  .page-title {
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 4px 0;
    letter-spacing: -0.5px;
  }
  
  .page-desc {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }
}

.header-actions {
  .el-button {
    height: 40px;
    padding: 0 20px;
    border-radius: 10px;
    font-weight: 500;
  }
}

// 核心指标网格
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
  
  @media (max-width: 1280px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.metric-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
  }
  
  &.primary::before { background: linear-gradient(90deg, #1e3a5f, #2c5282); }
  &.warning::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
  &.danger::before { background: linear-gradient(90deg, #ef4444, #f87171); }
  &.success::before { background: linear-gradient(90deg, #10b981, #34d399); }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .primary & {
    background: rgba(30, 58, 95, 0.08);
    color: #1e3a5f;
  }
  
  .warning & {
    background: #fef3c7;
    color: #f59e0b;
  }
  
  .danger & {
    background: #fee2e2;
    color: #ef4444;
  }
  
  .success & {
    background: #d1fae5;
    color: #10b981;
  }
}

.metric-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-value {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

.metric-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.metric-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  
  &.up {
    background: #d1fae5;
    color: #059669;
  }
  
  &.down {
    background: #fee2e2;
    color: #dc2626;
  }
}

.metric-period {
  font-size: 12px;
  color: #94a3b8;
}

// 图表网格
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 24px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.card-subtitle {
  font-size: 13px;
  color: #94a3b8;
}

.card-body {
  padding: 16px;
}

.chart-container {
  width: 100%;
  height: 280px;
}

// 预警区块
.alert-section {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #fef3c7 0%, #fff 100%);
  border-bottom: 1px solid #fef3c7;
}

.section-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.section-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.warning {
    background: #f59e0b;
    color: white;
  }
}

.section-title {
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 2px 0;
  }
  
  span {
    font-size: 13px;
    color: #64748b;
  }
}

.alert-table-wrapper {
  padding: 0;
  overflow-x: auto;
}

.alert-table {
  width: 100%;
  --el-table-border-color: #f1f5f9;
  
  :deep(th.el-table__cell) {
    background: #f8fafc !important;
    color: #64748b;
    font-weight: 600;
    font-size: 13px;
    padding: 12px 10px;
    white-space: nowrap;
  }
  
  :deep(td.el-table__cell) {
    padding: 10px;
    font-size: 13px;
  }
  
  :deep(.cell) {
    white-space: nowrap;
    overflow: visible;
  }
}

.txt { font-size: 13px; color: #1e293b; }
.tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; background: #1e3a5f; color: #fff; }

.days-badge {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  padding: 6px 12px;
  border-radius: 20px;
  
  &.expired {
    background: #fee2e2;
    .days-num { color: #dc2626; }
    .days-unit { color: #f87171; }
  }
  
  &.critical {
    background: #fee2e2;
    .days-num { color: #dc2626; }
    .days-unit { color: #f87171; }
  }
  
  &.warning {
    background: #fef3c7;
    .days-num { color: #d97706; }
    .days-unit { color: #fbbf24; }
  }
  
  .days-num {
    font-size: 16px;
    font-weight: 700;
  }
  
  .days-unit {
    font-size: 12px;
    font-weight: 500;
  }
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  
  &.expired {
    background: #fee2e2;
    color: #dc2626;
  }
  
  &.warning {
    background: #fef3c7;
    color: #d97706;
  }
  
  &.normal {
    background: #d1fae5;
    color: #059669;
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #d1fae5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #10b981;
  margin-bottom: 20px;
}

.empty-text {
  h4 {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px 0;
  }
  
  p {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }
}
</style>
