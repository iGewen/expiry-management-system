<template>
  <div class="statistics">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>商品状态分布</span>
              <el-radio-group v-model="chartType" size="small">
                <el-radio-button value="pie">饼图</el-radio-button>
                <el-radio-button value="bar">柱状图</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="statusChartRef" style="width: 100%; height: 400px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>月度新增趋势</span>
          </template>
          <div ref="trendChartRef" style="width: 100%; height: 400px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>商品保质期分布</span>
          </template>
          <div ref="shelfLifeChartRef" style="width: 100%; height: 400px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>过期商品Top10</span>
              <el-button type="primary" size="small" @click="loadStats">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <el-table :data="expiredProducts" v-loading="loading" height="400" border>
            <el-table-column type="index" label="排名" width="60">
              <template #default="{ row, $index }">
                {{ row.id === 0 ? '-' : $index + 1 }}
              </template>
            </el-table-column>
            <el-table-column prop="name" label="商品名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="remainingDays" label="过期天数" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.id !== 0" type="danger">{{ Math.abs(row.remainingDays) }}天</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getProductStats, getProducts } from '@/api/product'
import type { Product } from '@/types'

const loading = ref(false)
const chartType = ref('pie')
const expiredProducts = ref<Product[]>([])

const statusChartRef = ref<HTMLElement>()
const trendChartRef = ref<HTMLElement>()
const shelfLifeChartRef = ref<HTMLElement>()

let statusChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null
let shelfLifeChart: echarts.ECharts | null = null

const stats = ref<any>({})

const loadStats = async () => {
  loading.value = true
  try {
    const data = await getProductStats()
    stats.value = data
    
    updateStatusChart()
    updateTrendChart()
    updateShelfLifeChart()
    
    // 加载过期商品 - 默认显示10个
    const productsData = await getProducts({ status: 'EXPIRED', pageSize: 10, page: 1 })
    const products = productsData?.products || []
    
    // 填充到10条，保证表格高度一致
    while (products.length < 10) {
      products.push({
        id: 0,
        name: '-',
        remainingDays: 0,
        productionDate: '',
        expiryDate: '',
        shelfLife: 0,
        reminderDays: 0,
        status: 'NORMAL',
        createdAt: '',
        updatedAt: ''
      })
    }
    
    expiredProducts.value = products
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载统计数据失败')
  } finally {
    loading.value = false
  }
}

const updateStatusChart = () => {
  if (!statusChart || !statusChartRef.value) return
  
  const normal = stats.value.total - stats.value.warning - stats.value.expired
  
  const option = chartType.value === 'pie' ? {
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
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold'
          }
        },
        data: [
          { value: normal, name: '正常', itemStyle: { color: '#67C23A' } },
          { value: stats.value.warning, name: '即将过期', itemStyle: { color: '#E6A23C' } },
          { value: stats.value.expired, name: '已过期', itemStyle: { color: '#F56C6C' } }
        ]
      }
    ]
  } : {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['正常', '即将过期', '已过期']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '数量',
        type: 'bar',
        data: [
          { value: normal, itemStyle: { color: '#67C23A' } },
          { value: stats.value.warning, itemStyle: { color: '#E6A23C' } },
          { value: stats.value.expired, itemStyle: { color: '#F56C6C' } }
        ],
        barWidth: '40%',
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  }
  
  statusChart.setOption(option, true)
}

const updateTrendChart = () => {
  if (!trendChart || !trendChartRef.value) return
  
  const monthlyTrend = stats.value.monthlyTrend || []
  const months = monthlyTrend.map((item: any) => item.month)
  const counts = monthlyTrend.map((item: any) => item.count)
  
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
  
  trendChart.setOption(option)
}

const updateShelfLifeChart = () => {
  if (!shelfLifeChart || !shelfLifeChartRef.value) return
  
  // 模拟保质期分布数据
  const shelfLifeDistribution = [
    { range: '0-30天', count: Math.floor(stats.value.total * 0.2) },
    { range: '31-90天', count: Math.floor(stats.value.total * 0.3) },
    { range: '91-180天', count: Math.floor(stats.value.total * 0.25) },
    { range: '181-365天', count: Math.floor(stats.value.total * 0.15) },
    { range: '365天+', count: Math.floor(stats.value.total * 0.1) }
  ]
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: shelfLifeDistribution.map(item => item.range)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '商品数量',
        type: 'bar',
        data: shelfLifeDistribution.map(item => item.count),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        },
        barWidth: '50%',
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  }
  
  shelfLifeChart.setOption(option)
}

const initCharts = () => {
  if (statusChartRef.value) {
    statusChart = echarts.init(statusChartRef.value)
  }
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
  }
  if (shelfLifeChartRef.value) {
    shelfLifeChart = echarts.init(shelfLifeChartRef.value)
  }
  
  window.addEventListener('resize', handleResize)
}

const handleResize = () => {
  statusChart?.resize()
  trendChart?.resize()
  shelfLifeChart?.resize()
}

watch(chartType, () => {
  updateStatusChart()
})

onMounted(() => {
  initCharts()
  loadStats()
})

onUnmounted(() => {
  statusChart?.dispose()
  trendChart?.dispose()
  shelfLifeChart?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.statistics {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
