<template>
  <div class="import-export">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>批量导入</span>
          </template>
          <div class="import-section">
            <el-alert
              title="导入说明"
              type="info"
              :closable="false"
              style="margin-bottom: 20px;"
            >
              <p>请下载模板文件，按照格式填写数据后上传</p>
              <p>支持格式：Excel (.xlsx), CSV (.csv)</p>
              <p>必填字段：商品名称、生产日期、保质期天数</p>
            </el-alert>

            <el-button type="primary" @click="downloadTemplate">
              <el-icon><Download /></el-icon>
              下载模板
            </el-button>

            <el-divider />

            <el-upload
              ref="uploadRef"
              :auto-upload="false"
              :limit="1"
              :on-change="handleFileChange"
              :on-exceed="handleExceed"
              accept=".xlsx,.csv"
              drag
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  只能上传 xlsx/csv 文件，且不超过 10MB
                </div>
              </template>
            </el-upload>

            <el-button
              type="success"
              :loading="importing"
              :disabled="!selectedFile"
              @click="handleImport"
              style="margin-top: 20px; width: 100%;"
            >
              <el-icon><Upload /></el-icon>
              开始导入
            </el-button>

            <el-progress
              v-if="importProgress > 0"
              :percentage="importProgress"
              :status="importProgress === 100 ? 'success' : undefined"
              style="margin-top: 20px;"
            />
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>批量导出</span>
          </template>
           <div class="export-section">
            <el-alert
              title="导出说明"
              type="info"
              :closable="false"
              style="margin-bottom: 20px;"
            >
              <p>可以按照筛选条件导出商品数据</p>
              <p>支持格式：Excel (.xlsx), CSV (.csv)</p>
              <p>支持按状态和日期范围筛选导出</p>
            </el-alert>

            <div style="height: 32px; margin-bottom: 20px;">
              <!-- 占位，与左侧下载模板按钮对齐 -->
            </div>

            <el-divider />

            <div class="export-form-wrapper">
              <el-form :model="exportForm" label-width="100px">
                <el-form-item label="商品状态">
                  <el-select v-model="exportForm.status" placeholder="全部" clearable>
                    <el-option label="正常" value="NORMAL" />
                    <el-option label="即将过期" value="WARNING" />
                    <el-option label="已过期" value="EXPIRED" />
                  </el-select>
                </el-form-item>
                <el-form-item label="日期范围">
                  <el-date-picker
                    v-model="exportForm.dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    value-format="YYYY-MM-DD"
                    style="width: 100%;"
                  />
                </el-form-item>
                <el-form-item label="导出格式">
                  <el-radio-group v-model="exportForm.format">
                    <el-radio value="xlsx">Excel (.xlsx)</el-radio>
                    <el-radio value="csv">CSV (.csv)</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-form>
              
              <!-- 占位，使按钮与左侧上传区域底部对齐 -->
              <div style="height: 72px;"></div>
            </div>

            <el-button
              type="success"
              :loading="exporting"
              @click="handleExport"
              style="margin-top: 20px; width: 100%;"
            >
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card shadow="never">
          <template #header>
            <span>导入历史</span>
          </template>
          <el-table :data="importHistory" v-loading="loading">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="filename" label="文件名" min-width="200" />
            <el-table-column prop="totalCount" label="总记录数" width="100" />
            <el-table-column prop="successCount" label="成功" width="80">
              <template #default="{ row }">
                <el-tag type="success">{{ row.successCount }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="failCount" label="失败" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.failCount > 0" type="danger">{{ row.failCount }}</el-tag>
                <span v-else>0</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.status === 'SUCCESS'" type="success">成功</el-tag>
                <el-tag v-else-if="row.status === 'PARTIAL'" type="warning">部分成功</el-tag>
                <el-tag v-else type="danger">失败</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="导入时间" width="160">
              <template #default="{ row }">
                {{ dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss') }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button type="danger" size="small" @click="handleDeleteHistory(row.id)">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type UploadInstance, type UploadFile } from 'element-plus'
import { Download, UploadFilled, Upload, Delete } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { exportProducts } from '@/api/product'
import { getImportHistories, deleteImportHistory } from '@/api/importHistory'
import request from '@/utils/request'

const uploadRef = ref<UploadInstance>()
const selectedFile = ref<File | null>(null)
const importing = ref(false)
const exporting = ref(false)
const loading = ref(false)
const importProgress = ref(0)

const exportForm = reactive({
  status: '',
  dateRange: [] as string[],
  format: 'xlsx'
})

const importHistory = ref<any[]>([])

// 加载导入历史
const loadImportHistory = async () => {
  loading.value = true
  try {
    const data = await getImportHistories()
    importHistory.value = data?.histories || []
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载导入历史失败')
  } finally {
    loading.value = false
  }
}

// 删除导入历史
const handleDeleteHistory = async (id: number) => {
  try {
    await ElMessageBox.confirm('确认要删除此导入记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteImportHistory(id)
    ElMessage.success('删除成功')
    loadImportHistory()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

onMounted(() => {
  loadImportHistory()
})

const downloadTemplate = () => {
  const template = [
    {
      '商品名称': '示例商品',
      '生产日期': '2024-01-01',
      '保质期天数': 365,
      '提醒天数': 3
    }
  ]
  
  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '商品数据')
  XLSX.writeFile(wb, '商品导入模板.xlsx')
  ElMessage.success('模板下载成功')
}

const handleFileChange = (file: UploadFile) => {
  if (file.raw) {
    const isExcel = file.raw.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    const isCsv = file.raw.type === 'text/csv'
    const isLt10M = file.raw.size / 1024 / 1024 < 10

    if (!isExcel && !isCsv) {
      ElMessage.error('只能上传 Excel 或 CSV 文件')
      return false
    }
    if (!isLt10M) {
      ElMessage.error('文件大小不能超过 10MB')
      return false
    }
    selectedFile.value = file.raw
  }
}

const handleExceed = () => {
  ElMessage.warning('每次只能上传一个文件')
}

const handleImport = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请选择要导入的文件')
    return
  }

  importing.value = true
  importProgress.value = 0

  try {
    // 模拟进度
    const progressInterval = setInterval(() => {
      if (importProgress.value < 90) {
        importProgress.value += 10
      }
    }, 200)

    // 直接上传文件到后端
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    
    const response = await request.post('/products/batch/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    clearInterval(progressInterval)
    importProgress.value = 100
    
    console.log('Import response:', response.data) // 调试日志
    const result = response.data.data // 后端返回 { success: true, data: { success: 0, failed: 0 } }
    console.log('Import result:', result) // 调试日志
    
    // 后端已经保存了导入历史，直接重新加载
    const successCount = result?.success || 0
    const failedCount = result?.failed || 0
    const totalCount = successCount + failedCount
    
    // 显示消息
    if (totalCount > 0) {
      ElMessage.success(`导入完成，成功 ${successCount} 条，失败 ${failedCount} 条`)
      if (failedCount > 0 && result?.errors && result.errors.length > 0) {
        console.error('导入错误详情:', result.errors)
      }
    } else {
      ElMessage.success('导入成功')
    }
    
    // 重新加载导入历史
    loadImportHistory()
    
    uploadRef.value?.clearFiles()
    selectedFile.value = null
    
    setTimeout(() => {
      importProgress.value = 0
    }, 2000)
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '导入失败')
    importProgress.value = 0
  } finally {
    importing.value = false
  }
}

const handleExport = async () => {
  exporting.value = true
  try {
    const params: any = {
      pageSize: 10000  // 设置很大的值以获取所有数据
    }
    if (exportForm.status) params.status = exportForm.status
    if (exportForm.dateRange && exportForm.dateRange.length === 2) {
      params.startDate = exportForm.dateRange[0]
      params.endDate = exportForm.dateRange[1]
    }

    const data = await exportProducts(params)
    
    // 生成Excel文件
    const ws = XLSX.utils.json_to_sheet(data.map((item: any) => ({
      '商品名称': item.name,
      '生产日期': dayjs(item.productionDate).format('YYYY-MM-DD'),
      '保质期天数': item.shelfLife,
      '过期日期': dayjs(item.expiryDate).format('YYYY-MM-DD'),
      '剩余天数': item.remainingDays,
      '状态': item.status === 'EXPIRED' ? '已过期' : item.status === 'WARNING' ? '即将过期' : '正常',
      '提醒天数': item.reminderDays,
      '创建时间': dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')
    })))
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '商品数据')
    
    const filename = `商品数据_${dayjs().format('YYYYMMDDHHmmss')}.${exportForm.format}`
    XLSX.writeFile(wb, filename)
    
    ElMessage.success(`导出成功，共 ${data.length} 条数据`)
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '导出失败')
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.import-export {
  padding: 20px;
}

.import-section,
.export-section {
  padding: 10px 0;
}

:deep(.el-upload-dragger) {
  padding: 40px;
}
</style>
