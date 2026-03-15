<template>
  <div class="product-manage">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>商品管理</span>
          <div class="header-actions">
            <!-- 导出按钮 -->
            <el-dropdown @command="handleExport" class="export-dropdown">
              <el-button type="success">
                <el-icon><Download /></el-icon>
                导出商品
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="7">导出近7天过期商品</el-dropdown-item>
                  <el-dropdown-item command="30">导出近30天过期商品</el-dropdown-item>
                  <el-dropdown-item command="all">导出全部商品</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <!-- 批量操作 -->
            <el-button
              v-if="selectedIds.length > 0"
              type="warning"
              @click="showBatchEditDialog"
            >
              <el-icon><Edit /></el-icon>
              批量编辑 ({{ selectedIds.length }})
            </el-button>
            <el-button
              v-if="selectedIds.length > 0"
              type="danger"
              @click="handleBatchDelete"
            >
              <el-icon><Delete /></el-icon>
              批量删除 ({{ selectedIds.length }})
            </el-button>
            <el-button type="primary" @click="showAddDialog">
              <el-icon><Plus /></el-icon>
              添加商品
            </el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="商品名称">
          <el-input v-model="searchForm.name" placeholder="请输入商品名称" clearable @clear="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable @clear="handleSearch" style="width: 140px;">
            <el-option label="正常" value="NORMAL" />
            <el-option label="即将过期" value="WARNING" />
            <el-option label="已过期" value="EXPIRED" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.categoryId" placeholder="请选择分类" clearable @clear="handleSearch" style="width: 140px;">
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            >
              <span :style="{ color: cat.color }">{{ cat.name }}</span>
            </el-option>
          </el-select>
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

      <el-table
        :data="products"
        v-loading="loading"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="序号" width="60" :index="indexMethod" />
        <el-table-column v-if="isSuperAdmin" prop="user.username" label="所属用户" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.user" type="info" size="small">
              {{ row.user.username }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="150" />
        <el-table-column label="分类" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.category" :style="{ color: row.category.color, borderColor: row.category.color }" size="small">
              {{ row.category.name }}
            </el-tag>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="productionDate" label="生产日期" width="120">
          <template #default="{ row }">
            {{ dayjs(row.productionDate).format('YYYY-MM-DD') }}
          </template>
        </el-table-column>
        <el-table-column prop="shelfLife" label="保质期(天)" width="100" />
        <el-table-column prop="expiryDate" label="过期日期" width="120">
          <template #default="{ row }">
            {{ dayjs(row.expiryDate).format('YYYY-MM-DD') }}
          </template>
        </el-table-column>
        <el-table-column prop="remainingDays" label="剩余天数" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
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
        <el-table-column prop="reminderDays" label="提醒天数" width="100" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handleEdit(row)" title="编辑">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button type="danger" size="small" @click="handleDelete(row)" title="删除">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadProducts"
        @current-change="loadProducts"
        class="pagination"
      />
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="生产日期" prop="productionDate">
          <el-date-picker
            v-model="form.productionDate"
            type="date"
            placeholder="选择生产日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="保质期" prop="shelfLife">
          <el-input-number
            v-model="form.shelfLife"
            :min="1"
            :max="36500"
            placeholder="请输入保质期天数"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="提醒天数" prop="reminderDays">
          <el-input-number
            v-model="form.reminderDays"
            :min="1"
            :max="365"
            placeholder="请输入提醒天数"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="商品分类">
          <el-select v-model="form.categoryId" placeholder="请选择分类" clearable style="width: 100%">
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            >
              <span :style="{ color: cat.color }">{{ cat.name }}</span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量编辑对话框 -->
    <el-dialog
      v-model="batchEditVisible"
      title="批量编辑"
      width="500px"
    >
      <el-alert
        :title="`已选择 ${selectedIds.length} 个商品`"
        type="info"
        :closable="false"
        style="margin-bottom: 20px;"
      />
      <el-form :model="batchForm" label-width="100px">
        <el-form-item label="修改分类">
          <el-select v-model="batchForm.categoryId" placeholder="选择新分类" clearable style="width: 100%">
            <el-option label="取消分类" :value="null" />
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            >
              <span :style="{ color: cat.color }">{{ cat.name }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="修改提醒天数">
          <el-input-number
            v-model="batchForm.reminderDays"
            :min="1"
            :max="365"
            placeholder="留空则不修改"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchEditVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBatchUpdate" :loading="batchSubmitting">确定修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Refresh, Edit, Delete, Download, ArrowDown } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { getProducts, createProduct, updateProduct, deleteProduct, batchDeleteProducts, batchUpdateProducts, exportExpiringProducts } from '@/api/product'
import { getCategories } from '@/api/category'
import type { Product } from '@/types'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const products = ref<Product[]>([])
const categories = ref<any[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('添加商品')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const selectedIds = ref<number[]>([])
const isSuperAdmin = computed(() => userStore.user?.role === 'SUPER_ADMIN')

// 批量编辑
const batchEditVisible = ref(false)
const batchSubmitting = ref(false)
const batchForm = reactive({
  categoryId: undefined as number | undefined,
  reminderDays: undefined as number | undefined
})

const searchForm = reactive({
  name: '',
  status: '',
  categoryId: undefined as number | undefined
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  id: 0,
  name: '',
  productionDate: '',
  shelfLife: 30,
  reminderDays: 3,
  categoryId: null as number | null
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  productionDate: [
    { required: true, message: '请选择生产日期', trigger: 'change' }
  ],
  shelfLife: [
    { required: true, message: '请输入保质期', trigger: 'blur' }
  ],
  reminderDays: [
    { required: true, message: '请输入提醒天数', trigger: 'blur' }
  ]
}

const loadProducts = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    
    if (searchForm.name) params.name = searchForm.name
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.categoryId) params.categoryId = searchForm.categoryId
    
    const res = await getProducts(params)
    products.value = res?.products || []
    pagination.total = res?.total || 0
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '获取商品列表失败')
  } finally {
    loading.value = false
  }
}

// 加载分类列表
const loadCategories = async () => {
  try {
    const res = await getCategories()
    categories.value = res.data || []
  } catch (error: any) {
    console.error('加载分类失败:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadProducts()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.status = ''
  searchForm.categoryId = undefined
  handleSearch()
}

const showAddDialog = () => {
  dialogTitle.value = '添加商品'
  dialogVisible.value = true
}

const handleEdit = (row: Product) => {
  dialogTitle.value = '编辑商品'
  form.id = row.id
  form.name = row.name
  form.productionDate = dayjs(row.productionDate).format('YYYY-MM-DD')
  form.shelfLife = row.shelfLife
  form.reminderDays = row.reminderDays
  form.categoryId = row.categoryId || null
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const data = {
        name: form.name,
        productionDate: form.productionDate,
        shelfLife: form.shelfLife,
        reminderDays: form.reminderDays,
        categoryId: form.categoryId
      }

      if (form.id) {
        await updateProduct(form.id, data)
        ElMessage.success('更新成功')
      } else {
        await createProduct(data)
        ElMessage.success('添加成功')
      }

      dialogVisible.value = false
      loadProducts()
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

const handleDelete = async (row: Product) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除商品 "${row.name}" 吗？`,
      '删除商品',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await deleteProduct(row.id)
    ElMessage.success('删除成功')
    loadProducts()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

const handleSelectionChange = (selection: Product[]) => {
  selectedIds.value = selection.map(item => item.id)
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 个商品吗？`,
      '批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await batchDeleteProducts(selectedIds.value)
    ElMessage.success('批量删除成功')
    selectedIds.value = []
    loadProducts()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '批量删除失败')
    }
  }
}

// 显示批量编辑对话框
const showBatchEditDialog = () => {
  batchForm.categoryId = undefined
  batchForm.reminderDays = undefined
  batchEditVisible.value = true
}

// 批量更新
const handleBatchUpdate = async () => {
  if (batchForm.categoryId === undefined && batchForm.reminderDays === undefined) {
    ElMessage.warning('请选择要修改的内容')
    return
  }

  batchSubmitting.value = true
  try {
    await batchUpdateProducts({
      ids: selectedIds.value,
      categoryId: batchForm.categoryId,
      reminderDays: batchForm.reminderDays
    })
    ElMessage.success('批量更新成功')
    batchEditVisible.value = false
    selectedIds.value = []
    loadProducts()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '批量更新失败')
  } finally {
    batchSubmitting.value = false
  }
}

// 导出商品
const handleExport = async (command: string) => {
  try {
    let blob: Blob
    let filename: string

    if (command === 'all') {
      // 导出全部商品
      const params: any = { pageSize: 10000 }
      if (searchForm.name) params.name = searchForm.name
      if (searchForm.status) params.status = searchForm.status
      if (searchForm.categoryId) params.categoryId = searchForm.categoryId
      
      const res = await getProducts(params)
      const products = res.data?.products || []
      
      // 生成Excel
      const data = products.map((p: any) => ({
        '商品名称': p.name,
        '分类': p.category?.name || '-',
        '生产日期': dayjs(p.productionDate).format('YYYY-MM-DD'),
        '保质期(天)': p.shelfLife,
        '过期日期': dayjs(p.expiryDate).format('YYYY-MM-DD'),
        '剩余天数': p.remainingDays,
        '状态': p.status === 'EXPIRED' ? '已过期' : p.status === 'WARNING' ? '即将过期' : '正常',
        '提醒天数': p.reminderDays
      }))
      
      // 使用第三方库或简单CSV
      const csv = [
        Object.keys(data[0] || {}).join(','),
        ...data.map((row: any) => Object.values(row).join(','))
      ].join('\n')
      
      blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
      filename = `商品清单_${dayjs().format('YYYYMMDD')}.csv`
    } else {
      // 导出即将过期商品
      const days = parseInt(command)
      const res = await exportExpiringProducts(days)
      blob = res
      filename = `即将过期商品_${days}天_${dayjs().format('YYYYMMDD')}.xlsx`
    }

    // 下载文件
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '导出失败')
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
  form.id = 0
  form.name = ''
  form.productionDate = ''
  form.shelfLife = 30
  form.reminderDays = 3
  form.categoryId = null
}

// 计算序号（跨页累计）
const indexMethod = (index: number) => {
  return (pagination.page - 1) * pagination.pageSize + index + 1
}

const getStatusType = (status: string) => {
  if (status === 'EXPIRED') return 'danger'
  if (status === 'WARNING') return 'warning'
  return 'success'
}

onMounted(() => {
  loadProducts()
  loadCategories()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.product-manage {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.card-header span {
  font-weight: 600;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.export-dropdown {
  margin-right: 10px;
}

.search-form {
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 12px;
}

.search-form :deep(.el-form-item__label) {
  line-height: 32px;
}

.search-form :deep(.el-form-item__content) {
  line-height: 32px;
}

.action-buttons {
  display: flex;
  gap: 5px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.text-gray {
  color: $text-placeholder;
}

@media (max-width: 768px) {
  .product-manage {
    padding: 12px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .header-actions {
    flex-wrap: wrap;
  }
  
  .search-form {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .search-form :deep(.el-form-item) {
    margin-bottom: 12px;
    margin-right: 0;
    width: 100%;
  }
  
  .search-form :deep(.el-form-item__content) {
    width: 100%;
  }
  
  .search-form :deep(.el-input),
  .search-form :deep(.el-select) {
    width: 100% !important;
  }
}
</style>
