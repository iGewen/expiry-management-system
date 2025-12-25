<template>
  <div class="product-manage">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>商品管理</span>
          <div>
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
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable @clear="handleSearch" style="width: 180px;">
            <el-option label="正常" value="NORMAL" />
            <el-option label="即将过期" value="WARNING" />
            <el-option label="已过期" value="EXPIRED" />
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
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column v-if="isSuperAdmin" prop="user.username" label="所属用户" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.user" type="info" size="small">
              {{ row.user.username }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="150" />
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
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              删除
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
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Refresh, Edit, Delete } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { getProducts, createProduct, updateProduct, deleteProduct, batchDeleteProducts } from '@/api/product'
import type { Product } from '@/types'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const products = ref<Product[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('添加商品')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const selectedIds = ref<number[]>([])

// 判断是否为超级管理员
const isSuperAdmin = computed(() => userStore.user?.role === 'SUPER_ADMIN')

const searchForm = reactive({
  name: '',
  status: ''  // 默认显示所有商品
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
  reminderDays: 3
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在32-100个字符', trigger: 'blur' }
  ],
  productionDate: [
    { required: true, message: '请选择生产日期', trigger: 'change' }
  ],
  shelfLife: [
    { required: true, message: '请输入保质期天数', trigger: 'blur' }
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
    
    const data = await getProducts(params)
    products.value = data?.products || []
    pagination.total = data?.total || 0
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载商品列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadProducts()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.status = ''
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
  dialogVisible.value = true
}

const handleDelete = async (row: Product) => {
  try {
    await ElMessageBox.confirm(
      `确认要删除商品「${row.name}」吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
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

// 处理表格选择变化
const handleSelectionChange = (selection: Product[]) => {
  selectedIds.value = selection.map(item => item.id)
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确认要删除选中的 ${selectedIds.value.length} 个商品吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await batchDeleteProducts(selectedIds.value)
    ElMessage.success(`成功删除 ${selectedIds.value.length} 个商品`)
    selectedIds.value = []
    loadProducts()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '批量删除失败')
    }
  }
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
        reminderDays: form.reminderDays
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

const resetForm = () => {
  formRef.value?.resetFields()
  form.id = 0
  form.name = ''
  form.productionDate = ''
  form.shelfLife = 30
  form.reminderDays = 3
}

const getStatusType = (status: string) => {
  if (status === 'EXPIRED') return 'danger'
  if (status === 'WARNING') return 'warning'
  return 'success'
}

onMounted(() => {
  loadProducts()
})
</script>

<style scoped>
.product-manage {
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
