<template>
  <div class="category-manage">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>商品分类管理</span>
              <el-button type="primary" @click="showAddDialog">
                <el-icon><Plus /></el-icon>
                添加分类
              </el-button>
            </div>
          </template>

          <el-table :data="categories" v-loading="loading" style="width: 100%">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column label="分类名称" min-width="150">
              <template #default="{ row }">
                <div class="category-name">
                  <span
                    class="color-dot"
                    :style="{ backgroundColor: row.color }"
                  />
                  <span>{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="商品数量" width="120">
              <template #default="{ row }">
                <el-tag type="info">{{ row.productCount }} 个</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="160">
              <template #default="{ row }">
                {{ dayjs(row.createdAt).format('YYYY-MM-DD HH:mm') }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="showEditDialog(row)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button type="danger" size="small" @click="handleDelete(row)" :disabled="row.productCount > 0">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 添加/编辑分类对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : '添加分类'"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="颜色" prop="color">
          <div class="color-picker-wrapper">
            <span
              class="color-preview"
              :style="{ backgroundColor: form.color }"
            />
            <el-button size="small" @click="showColorPicker = true">
              选择颜色
            </el-button>
          </div>
          <div v-if="showColorPicker" class="color-presets">
            <span
              v-for="color in predefineColors"
              :key="color"
              class="color-option"
              :style="{ backgroundColor: color }"
              :class="{ active: form.color === color }"
              @click="selectColor(color)"
            />
          </div>
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/category'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const showColorPicker = ref(false)
const isEdit = ref(false)
const formRef = ref()
const categories = ref<any[]>([])

const form = ref({
  id: null,
  name: '',
  color: '#409EFF'
})

const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  color: [
    { required: true, message: '请选择颜色', trigger: 'change' }
  ]
}

const predefineColors = [
  '#409EFF',
  '#67C23A',
  '#E6A23C',
  '#F56C6C',
  '#909399',
  '#C0C4CC',
  '#FFD700',
  '#FF69B4',
  '#00CED1',
  '#9370DB'
]

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
  isEdit.value = false
  showColorPicker.value = false
  form.value = {
    id: null,
    name: '',
    color: predefineColors[Math.floor(Math.random() * predefineColors.length)]
  }
  dialogVisible.value = true
}

const showEditDialog = (row: any) => {
  isEdit.value = true
  showColorPicker.value = false
  form.value = {
    id: row.id,
    name: row.name,
    color: row.color
  }
  dialogVisible.value = true
}

const selectColor = (color: string) => {
  form.value.color = color
  showColorPicker.value = false
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    submitting.value = true
    try {
      if (isEdit.value) {
        await updateCategory(form.value.id!, { name: form.value.name, color: form.value.color })
        ElMessage.success('分类更新成功')
      } else {
        await createCategory({ name: form.value.name, color: form.value.color })
        ElMessage.success('分类创建成功')
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
  try {
    await ElMessageBox.confirm(
      `确定要删除分类 "${row.name}" 吗？`,
      '删除分类',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteCategory(row.id)
    ElMessage.success('分类删除成功')
    loadCategories()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.category-manage {
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

.category-name {
  display: flex;
  align-items: center;
  gap: 10px;

  .color-dot {
    width: 16px;
    height: 16px;
    border-radius: 4px;
  }
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-preview {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
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
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.1);
  }

  &.active {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }
}

@media (max-width: 576px) {
  .category-manage {
    padding: 12px;
  }
}
</style>
