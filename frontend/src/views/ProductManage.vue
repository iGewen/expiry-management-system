<template>
  <div class="product-page">
    <header class="page-header">
      <div class="header-left">
        <h1 class="page-title">商品管理</h1>
        <p class="page-desc">管理商品信息，追踪保质期状态</p>
      </div>
      <div class="header-right">
        <el-dropdown @command="handleExport" trigger="click">
          <el-button><el-icon><Download /></el-icon>导出<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="7">近7天过期</el-dropdown-item>
              <el-dropdown-item command="30">近30天过期</el-dropdown-item>
              <el-dropdown-item command="all">全部商品</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="primary" @click="showAddDialog"><el-icon><Plus /></el-icon>添加商品</el-button>
      </div>
    </header>

    <section class="filter-section">
      <div class="filter-bar">
        <el-input v-model="searchForm.name" placeholder="搜索商品..." clearable @keyup.enter="handleSearch" style="width:160px">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="searchForm.status" placeholder="状态" clearable @change="handleSearch" style="width:100px">
          <el-option label="正常" value="NORMAL" />
          <el-option label="预警" value="WARNING" />
          <el-option label="过期" value="EXPIRED" />
        </el-select>
        <el-select v-model="searchForm.categoryId" placeholder="分类" clearable @change="handleSearch" style="width:100px">
          <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
        </el-select>
        <el-button @click="handleReset"><el-icon><Refresh /></el-icon></el-button>
        <template v-if="selectedIds.length > 0">
          <el-button type="primary" @click="showBatchEditDialog">批量编辑({{ selectedIds.length }})</el-button>
          <el-button type="danger" @click="handleBatchDelete">批量删除</el-button>
        </template>
      </div>
    </section>

    <section class="table-section">
      <el-table :data="products" v-loading="loading" @selection-change="handleSelectionChange" style="width:100%">
        <el-table-column type="selection" width="40" />
        <el-table-column type="index" label="#" width="40" :index="indexMethod" />
        <el-table-column v-if="isSuperAdmin" label="用户" width="100">
          <template #default="{row}"><span class="txt user">{{ row.user?.username || '-' }}</span></template>
        </el-table-column>
        <el-table-column label="商品名称" min-width="160">
          <template #default="{row}"><span class="txt name">{{ row.name }}</span></template>
        </el-table-column>
        <el-table-column label="分类" width="80">
          <template #default="{row}">
            <span v-if="row.category" class="tag" :style="{background:row.category.color||'#6366f1',color:'#fff'}">{{ row.category.name }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="日期" width="130">
          <template #default="{row}"><span class="txt">{{ dayjs(row.productionDate).format('MM-DD') }} ~ {{ dayjs(row.expiryDate).format('MM-DD') }}</span></template>
        </el-table-column>
        <el-table-column label="剩余" width="60">
          <template #default="{row}"><span class="txt" :class="getDaysClass(row.remainingDays, row.status)">{{ row.remainingDays }}天</span></template>
        </el-table-column>
        <el-table-column label="状态" width="60">
          <template #default="{row}"><span class="txt" :class="getStatusClass(row.status)">{{ getStatusText(row.status) }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{row}">
            <div class="op-btns">
              <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" :page-sizes="[10,20,50,100]" layout="total,sizes,prev,pager,next" @size-change="loadProducts" @current-change="loadProducts" />
      </div>
    </section>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="商品名称" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="生产日期" prop="productionDate"><el-date-picker v-model="form.productionDate" type="date" style="width:100%" value-format="YYYY-MM-DD" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="保质期(天)" prop="shelfLife"><el-input-number v-model="form.shelfLife" :min="1" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="提醒天数(0=不提醒)"><el-input-number v-model="form.reminderDays" :min="0" style="width:100%" /></el-form-item>
        <el-form-item label="分类"><el-select v-model="form.categoryId" clearable style="width:100%"><el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button></template>
    </el-dialog>

    <el-dialog v-model="batchEditVisible" title="批量编辑" width="400px">
      <el-form :model="batchForm" label-position="top">
        <el-form-item label="分类"><el-select v-model="batchForm.categoryId" clearable style="width:100%"><el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" /></el-select></el-form-item>
        <el-form-item label="提醒天数(0=不修改)"><el-input-number v-model="batchForm.reminderDays" :min="0" style="width:100%" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="batchEditVisible=false">取消</el-button><el-button type="primary" @click="handleBatchSubmit" :loading="submitting">确定</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Refresh, Download, ArrowDown } from '@element-plus/icons-vue'
import { getProducts, deleteProduct, batchDeleteProducts, updateProduct, batchUpdateProducts, createProduct } from '@/api/product'
import { getCategories } from '@/api/category'
import { useUserStore } from '@/stores/user'
import type { Product, Category } from '@/types'
import dayjs from 'dayjs'

const userStore = useUserStore()
const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const batchEditVisible = ref(false)
const dialogTitle = ref('添加商品')
const submitting = ref(false)
const formRef = ref<FormInstance>()

const isSuperAdmin = computed(() => userStore.user?.role === 'SUPER_ADMIN')
const selectedIds = ref<number[]>([])

const searchForm = reactive({ name: '', status: '', categoryId: null as number|null })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const form = reactive({ id: 0, name: '', productionDate: '', shelfLife: 30, reminderDays: 7, categoryId: null as number|null })
const batchForm = reactive({ categoryId: null as number|null, reminderDays: 7 })

const rules: FormRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  productionDate: [{ required: true, message: '请选择生产日期', trigger: 'change' }],
  shelfLife: [{ required: true, message: '请输入保质期', trigger: 'blur' }]
}

const indexMethod = (index: number) => (pagination.page - 1) * pagination.pageSize + index + 1
const getDaysClass = (days: number, status: string) => {
  if (status === 'EXPIRED') return 'red'
  if (status === 'WARNING') return 'orange'
  return 'green'
}
const getStatusClass = (status: string) => status === 'EXPIRED' ? 'red' : status === 'WARNING' ? 'orange' : 'green'
const getStatusText = (status: string) => status === 'EXPIRED' ? '过期' : status === 'WARNING' ? '预警' : '正常'

const loadProducts = async () => {
  loading.value = true
  try {
    const params: any = { page: pagination.page, pageSize: pagination.pageSize }
    if (searchForm.name) params.name = searchForm.name
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.categoryId) params.categoryId = searchForm.categoryId
    const res = await getProducts(params)
    products.value = res?.products || []
    pagination.total = res?.total || 0
  } catch (e: any) { ElMessage.error(e.response?.data?.message || '加载失败') }
  finally { loading.value = false }
}

const loadCategories = async () => {
  try { const res = await getCategories(); categories.value = res?.data || [] } catch (e) {}
}

const handleSearch = () => { pagination.page = 1; loadProducts() }
const handleReset = () => { searchForm.name = ''; searchForm.status = ''; searchForm.categoryId = null; handleSearch() }

const showAddDialog = () => {
  dialogTitle.value = '添加商品'
  form.id = 0; form.name = ''; form.productionDate = ''; form.shelfLife = 30; form.reminderDays = 7; form.categoryId = null
  dialogVisible.value = true
}

const handleEdit = (row: Product) => {
  dialogTitle.value = '编辑商品'
  form.id = row.id; form.name = row.name; form.productionDate = row.productionDate; form.shelfLife = row.shelfLife; form.reminderDays = row.reminderDays; form.categoryId = row.categoryId ? Number(row.categoryId) : null
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (form.id) {
        await updateProduct(form.id, { name: form.name, productionDate: form.productionDate, shelfLife: form.shelfLife, reminderDays: form.reminderDays, categoryId: form.categoryId })
        ElMessage.success('更新成功')
      } else {
        await createProduct({ name: form.name, productionDate: form.productionDate, shelfLife: form.shelfLife, reminderDays: form.reminderDays, categoryId: form.categoryId })
        ElMessage.success('添加成功')
      }
      dialogVisible.value = false
      loadProducts()
    } catch (e: any) { ElMessage.error(e.response?.data?.message || '失败') }
    finally { submitting.value = false }
  })
}

const handleDelete = async (row: Product) => {
  try { await ElMessageBox.confirm(`删除「${row.name}」?`, '确认', { type: 'warning' }); await deleteProduct(row.id); ElMessage.success('删除成功'); loadProducts() } catch (e: any) { if (e !== 'cancel') ElMessage.error('删除失败') }
}

const handleSelectionChange = (sel: Product[]) => { selectedIds.value = sel.map(p => p.id) }
const showBatchEditDialog = () => { batchForm.categoryId = null; batchForm.reminderDays = 7; batchEditVisible.value = true }

const handleBatchSubmit = async () => {
  submitting.value = true
  try {
    const data: any = { ids: selectedIds.value }
    if (batchForm.categoryId !== null && batchForm.categoryId !== undefined) data.categoryId = batchForm.categoryId
    if (batchForm.reminderDays !== undefined && batchForm.reminderDays !== null && batchForm.reminderDays > 0) data.reminderDays = batchForm.reminderDays
    await batchUpdateProducts(data)
    ElMessage.success('批量更新成功')
    batchEditVisible.value = false
    loadProducts()
  }
  catch (e: any) { ElMessage.error(e.response?.data?.message || '批量更新失败') }
  finally { submitting.value = false }
}

const handleBatchDelete = async () => {
  try { await ElMessageBox.confirm(`删除 ${selectedIds.value.length} 个商品?`, '确认', { type: 'warning' }); await batchDeleteProducts(selectedIds.value); ElMessage.success('删除成功'); loadProducts() } catch (e: any) { if (e !== 'cancel') ElMessage.error('失败') }
}

const handleExport = async (cmd: string) => {
  try {
    let url = ''
    let filename = ''
    if (cmd === 'all') {
      url = '/api/products/export/all'
      filename = `商品列表_${dayjs().format('YYYYMMDD')}.xlsx`
    } else {
      url = `/api/products/export/expiring?days=${cmd}`
      filename = `即将过期商品_${cmd}天_${dayjs().format('YYYYMMDD')}.xlsx`
    }
    
    const token = localStorage.getItem('token')
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (!response.ok) throw new Error('导出失败')
    
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(downloadUrl)
    
    ElMessage.success('导出成功')
  } catch (e) { ElMessage.error('导出失败') }
}

onMounted(() => { loadProducts(); loadCategories() })
</script>

<style scoped lang="scss">
.product-page { padding: 24px; background: #f5f7fa; min-height: calc(100vh - 64px); }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 24px; font-weight: 700; color: #1f2937; margin: 0; }
.page-desc { font-size: 14px; color: #6b7280; margin: 4px 0 0 0; }
.header-right { display: flex; gap: 8px; }

.filter-section { background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.filter-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.table-section { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
:deep(.el-table) { font-size: 13px; }
:deep(.el-table th) { background: #f9fafb !important; color: #6b7280; font-weight: 600; font-size: 12px; padding: 10px 0; }
:deep(.el-table td) { padding: 8px 0; }

.txt { font-size: 13px; color: #374151; white-space: nowrap; }
.txt.name { font-weight: 500; }
.txt.user { display: inline-block; max-width: 90px; overflow: hidden; text-overflow: ellipsis; vertical-align: middle; }
.txt.green { color: #10b981; }
.txt.orange { color: #f59e0b; }
.txt.red { color: #ef4444; }
.tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; white-space: nowrap; }

.op-btns { display: flex; flex-direction: row; align-items: center; gap: 0; white-space: nowrap; }
.op-btns :deep(.el-button) { padding: 0 6px; margin: 0; }
.pagination-wrapper { padding: 12px 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; }
</style>
