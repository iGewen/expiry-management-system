<template>
  <div class="category-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <div class="header-left">
        <h1 class="page-title">分类管理</h1>
        <p class="page-desc">管理商品分类，便于分类查看和统计</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          添加分类
        </el-button>
      </div>
    </header>

    <!-- 统计卡片 -->
    <section class="stats-grid">
      <div class="stat-card primary">
        <div class="stat-icon">
          <el-icon><Folder /></el-icon>
        </div>
        <div class="stat-body">
          <span class="stat-value">{{ totalStats.total }}</span>
          <span class="stat-label">分类总数</span>
        </div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon">
          <el-icon><Box /></el-icon>
        </div>
        <div class="stat-body">
          <span class="stat-value">{{ totalStats.products }}</span>
          <span class="stat-label">商品总数</span>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <div class="stat-body">
          <span class="stat-value">{{ totalStats.warning }}</span>
          <span class="stat-label">预警商品</span>
        </div>
      </div>
      <div class="stat-card danger">
        <div class="stat-icon">
          <el-icon><CircleCloseFilled /></el-icon>
        </div>
        <div class="stat-body">
          <span class="stat-value">{{ totalStats.expired }}</span>
          <span class="stat-label">过期商品</span>
        </div>
      </div>
    </section>

    <!-- 分类列表 -->
    <section class="table-section">
      <el-table 
        :data="categories" 
        v-loading="loading"
        class="data-table"
      >
        <el-table-column type="index" label="#" width="60" />
        
        <el-table-column label="分类" min-width="200">
          <template #default="{ row }">
            <div class="category-cell">
              <div class="category-color" :style="{ background: row.color }"></div>
              <div class="category-info">
                <span class="category-name">{{ row.name }}</span>
                <span class="category-id">ID: {{ row.id }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="商品数量" width="120" align="center">
          <template #default="{ row }">
            <div class="count-badge">
              <span class="count-num">{{ row.productCount || 0 }}</span>
              <span class="count-unit">件</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="状态分布" min-width="220">
          <template #default="{ row }">
            <div class="status-bars">
              <template v-for="item in getSortedStats(row)" :key="item.type">
                <div class="status-bar" :class="item.type" :style="{ width: item.percent }">
                  <span>{{ item.count }}</span>
                </div>
              </template>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row }">
            <div class="action-cell">
              <el-button type="primary" link size="small" @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button 
                type="danger" 
                link 
                size="small" 
                @click="handleDelete(row)"
                :disabled="row.productCount > 0"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="450px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="rules" 
        label-position="top"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" maxlength="20" show-word-limit />
        </el-form-item>
        
        <el-form-item label="分类颜色" prop="color">
          <div class="color-picker-wrapper">
            <el-color-picker v-model="form.color" :predefine="predefineColors" />
            <div class="color-preview" :style="{ background: form.color }"></div>
          </div>
          <div class="color-presets">
            <div 
              v-for="color in predefineColors" 
              :key="color"
              class="color-option"
              :class="{ active: form.color === color }"
              :style="{ background: color }"
              @click="form.color = color"
            ></div>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分类商品详情 -->
    <el-dialog
      v-model="categoryDialogVisible"
      :title="`${currentCategory?.name} - 商品列表`"
      width="800px"
    >
      <div class="category-filter">
        <el-radio-group v-model="categorySearch.status" @change="loadCategoryProducts">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button label="NORMAL">正常</el-radio-button>
          <el-radio-button label="WARNING">即将过期</el-radio-button>
          <el-radio-button label="EXPIRED">已过期</el-radio-button>
        </el-radio-group>
      </div>
      
      <el-table :data="categoryProducts" v-loading="productsLoading" max-height="400">
        <el-table-column prop="name" label="商品名称" min-width="150" />
        <el-table-column label="过期日期" width="120">
          <template #default="{ row }">
            {{ dayjs(row.expiryDate).format('YYYY-MM-DD') }}
          </template>
        </el-table-column>
        <el-table-column label="剩余天数" width="100">
          <template #default="{ row }">
            <el-tag :type="row.remainingDays <= 0 ? 'danger' : row.remainingDays <= 7 ? 'warning' : 'success'">
              {{ row.remainingDays }}天
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'EXPIRED'" type="danger">已过期</el-tag>
            <el-tag v-else-if="row.status === 'WARNING'" type="warning">即将过期</el-tag>
            <el-tag v-else type="success">正常</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Edit, Delete, Folder, Box, WarningFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { getCategories, createCategory, updateCategory, deleteCategory, getCategoryDetail } from '@/api/category'

const categories = ref<any[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('添加分类')
const submitting = ref(false)
const formRef = ref<FormInstance>()

const categoryDialogVisible = ref(false)
const currentCategory = ref<any>(null)
const categoryProducts = ref<any[]>([])
const productsLoading = ref(false)

const categorySearch = reactive({
  status: ''
})

const form = reactive({
  id: 0,
  name: '',
  color: '#6366f1'
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  color: [{ required: true, message: '请选择分类颜色', trigger: 'change' }]
}

const predefineColors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'
]

const totalStats = computed(() => {
  const stats = { total: 0, products: 0, warning: 0, expired: 0 }
  categories.value.forEach(cat => {
    stats.total++
    stats.products += cat.productCount || 0
    stats.warning += cat.stats?.warning || 0
    stats.expired += cat.stats?.expired || 0
  })
  return stats
})

const getPercent = (row: any, type: string) => {
  const total = row.productCount || 0
  if (total === 0) return '0%'
  const count = row.stats?.[type] || 0
  return `${(count / total) * 100}%`
}

const getSortedStats = (row: any) => {
  const total = row.productCount || 0
  const stats = [
    { type: 'normal', count: row.stats?.normal || 0 },
    { type: 'warning', count: row.stats?.warning || 0 },
    { type: 'expired', count: row.stats?.expired || 0 }
  ]
  // 过滤掉数量为0的，按数量从多到少排序
  return stats
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count)
    .map(s => ({
      ...s,
      percent: total === 0 ? '0%' : `${(s.count / total) * 100}%`
    }))
}

const loadCategories = async () => {
  loading.value = true
  try {
    const res = await getCategories()
    categories.value = res.data || []
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '获取分类列表失败')
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  dialogTitle.value = '添加分类'
  form.id = 0
  form.name = ''
  form.color = '#6366f1'
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑分类'
  form.id = row.id
  form.name = row.name
  form.color = row.color
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (form.id) {
        await updateCategory(form.id, { name: form.name, color: form.color })
        ElMessage.success('更新成功')
      } else {
        await createCategory({ name: form.name, color: form.color })
        ElMessage.success('添加成功')
      }
      dialogVisible.value = false
      loadCategories()
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

const handleDelete = async (row: any) => {
  if (row.productCount > 0) {
    ElMessage.warning('该分类下有商品，无法删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要删除分类「${row.name}」吗？`, '删除确认', { type: 'warning' })
    await deleteCategory(row.id)
    ElMessage.success('删除成功')
    loadCategories()
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error(error.response?.data?.message || '删除失败')
  }
}

const showCategoryProducts = async (category: any) => {
  currentCategory.value = category
  categorySearch.status = ''
  categoryDialogVisible.value = true
  loadCategoryProducts()
}

const loadCategoryProducts = async () => {
  if (!currentCategory.value) return
  productsLoading.value = true
  try {
    const res = await getCategoryDetail(currentCategory.value.id)
    let products = res.data?.products || []
    if (categorySearch.status) {
      products = products.filter((p: any) => p.status === categorySearch.status)
    }
    categoryProducts.value = products
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '获取商品列表失败')
  } finally {
    productsLoading.value = false
  }
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.category-page {
  padding: 32px;
  background: #f8fafc;
  min-height: calc(100vh - 64px);
}

// 页面头部
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

// 统计卡片
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
  }
  
  &.primary::before { background: #6366f1; }
  &.success::before { background: #10b981; }
  &.warning::before { background: #f59e0b; }
  &.danger::before { background: #ef4444; }
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .primary & { background: #eef2ff; color: #6366f1; }
  .success & { background: #d1fae5; color: #10b981; }
  .warning & { background: #fef3c7; color: #f59e0b; }
  .danger & { background: #fee2e2; color: #ef4444; }
}

.stat-body {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

// 表格区
.table-section {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
}

.data-table {
  --el-table-border-color: #f1f5f9;
  
  :deep(th) {
    background: #f8fafc !important;
    color: #64748b;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    padding: 14px 12px;
  }
  
  :deep(td) { padding: 12px; }
  
  :deep(.el-table__row:hover > td) { background: #fafafa !important; }
}

.category-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-color {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
}

.category-info {
  display: flex;
  flex-direction: column;
}

.category-name {
  font-weight: 600;
  color: #1e293b;
}

.category-id {
  font-size: 12px;
  color: #94a3b8;
}

.count-badge {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  padding: 6px 12px;
  background: #f1f5f9;
  border-radius: 20px;
  
  .count-num {
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
  }
  
  .count-unit {
    font-size: 12px;
    color: #64748b;
  }
}

.status-bars {
  display: flex;
  height: 24px;
  border-radius: 12px;
  overflow: hidden;
  background: #f1f5f9;
}

.status-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: white;
  min-width: 0;
  
  &.normal { background: #10b981; }
  &.warning { background: #f59e0b; }
  &.expired { background: #ef4444; }
  
  span { padding: 0 4px; }
}

.action-cell {
  display: flex;
  justify-content: center;
  gap: 8px;
}

// 颜色选择器
.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-preview {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.color-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  
  &:hover { transform: scale(1.1); }
  
  &.active {
    border-color: #1e293b;
    box-shadow: 0 0 0 2px rgba(30, 41, 59, 0.2);
  }
}

// 分类筛选
.category-filter {
  margin-bottom: 16px;
}

// 响应式
@media (max-width: 768px) {
  .category-page { padding: 16px; }
  
  .page-header { flex-direction: column; gap: 16px; }
  
  .header-right { width: 100%; }
}
</style>
