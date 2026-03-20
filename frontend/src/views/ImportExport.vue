<template>
  <div class="import-export-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <div class="header-left">
        
        
      </div>
    </header>

    <!-- 功能卡片 -->
    <div class="cards-grid">
      <!-- 导入卡片 -->
      <div class="feature-card import-card">
        <div class="card-header">
          <div class="card-icon import-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div class="card-title">
            <h3>数据导入</h3>
            <p>批量导入商品数据到系统</p>
          </div>
        </div>

        <div class="card-body">
          <el-upload
            ref="uploadRef"
            class="upload-area"
            drag
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            accept=".xlsx,.xls,.csv"
            @change="handleFileChange"
          >
            <div class="upload-content">
              <div class="upload-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <p class="upload-text">拖拽文件到此处，或 <span class="link-text">点击上传</span></p>
              <p class="upload-hint">支持 .xlsx、.xls、.csv 格式，单次最多 1000 条</p>
            </div>
          </el-upload>

          <div class="template-section">
            <span class="template-label">没有模板？</span>
            <el-button type="primary" link @click="downloadTemplate">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              下载导入模板
            </el-button>
          </div>

          <div class="import-rules">
            <h4><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:6px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>导入说明</h4>
            <ul>
              <li>商品名称为必填项</li>
              <li>生产日期格式：YYYY-MM-DD</li>
              <li>保质期为天数，如：30 表示 30 天</li>
              <li>分类名称需与系统中已有的分类一致</li>
            </ul>
          </div>

          <el-button 
            type="primary" 
            size="large" 
            class="action-btn"
            :loading="importing"
            :disabled="!selectedFile"
            @click="handleImport"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            开始导入
          </el-button>

          <!-- 导入结果 -->
          <div v-if="importResult" class="import-result">
            <el-alert :title="importResult.title" :type="importResult.type" :description="importResult.detail" show-icon :closable="false" />
          </div>
        </div>
      </div>

      <!-- 导出卡片 -->
      <div class="feature-card export-card">
        <div class="card-header">
          <div class="card-icon export-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div class="card-title">
            <h3>数据导出</h3>
            <p>导出商品数据到 Excel 文件</p>
          </div>
        </div>

        <div class="card-body">
          <div class="export-options">
            <h4>选择导出范围</h4>
            <el-radio-group v-model="exportRange" class="export-range">
              <el-radio label="all">
                <div class="radio-content">
                  <span class="radio-title">全部商品</span>
                  <span class="radio-desc">导出系统中所有商品数据</span>
                </div>
              </el-radio>
              <el-radio label="expiring">
                <div class="radio-content">
                  <span class="radio-title">即将过期商品</span>
                  <span class="radio-desc">导出 30 天内即将过期的商品</span>
                </div>
              </el-radio>
              <el-radio label="expired">
                <div class="radio-content">
                  <span class="radio-title">已过期商品</span>
                  <span class="radio-desc">导出所有已过期的商品</span>
                </div>
              </el-radio>
              <el-radio label="category">
                <div class="radio-content">
                  <span class="radio-title">按分类导出</span>
                  <span class="radio-desc">选择特定分类进行导出</span>
                </div>
              </el-radio>
            </el-radio-group>

            <div v-if="exportRange === 'category'" class="category-select">
              <el-select v-model="selectedCategory" placeholder="选择分类" size="large" style="width: 100%;">
                <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
              </el-select>
            </div>
          </div>

          <div class="export-fields">
            <h4>选择导出字段</h4>
            <el-checkbox-group v-model="exportFields">
              <el-checkbox label="name">商品名称</el-checkbox>
              <el-checkbox label="category">分类</el-checkbox>
              <el-checkbox label="productionDate">生产日期</el-checkbox>
              <el-checkbox label="shelfLife">保质期</el-checkbox>
              <el-checkbox label="expiryDate">过期日期</el-checkbox>
              <el-checkbox label="remainingDays">剩余天数</el-checkbox>
              <el-checkbox label="status">状态</el-checkbox>
            </el-checkbox-group>
          </div>

          <div class="export-format">
            <h4>导出格式</h4>
            <el-radio-group v-model="exportFormat">
              <el-radio-button label="xlsx">Excel (.xlsx)</el-radio-button>
              <el-radio-button label="csv">CSV (.csv)</el-radio-button>
            </el-radio-group>
          </div>

          <el-button 
            type="primary" 
            size="large" 
            class="action-btn"
            :loading="exporting"
            @click="handleExport"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            开始导出
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getProducts, exportProducts, importProducts } from '@/api/product'
import { getCategories } from '@/api/category'
import httpClient from '@/utils/request'
import dayjs from 'dayjs'

const uploadRef = ref()
const selectedFile = ref<File | null>(null)
const importing = ref(false)
const exporting = ref(false)
const importResult = ref<any>(null)
const categories = ref<any[]>([])

const exportRange = ref('all')
const selectedCategory = ref<number | null>(null)
const exportFields = ref(['name', 'category', 'productionDate', 'shelfLife', 'expiryDate', 'remainingDays', 'status'])
const exportFormat = ref('xlsx')

const loadCategories = async () => {
  try {
    const res = await getCategories()
    categories.value = res.data || []
  } catch (error) { console.error('Load categories error:', error) }
}

const handleFileChange = (file: any) => {
  selectedFile.value = file.raw
  importResult.value = null
}

const downloadTemplate = () => {
  const template = '商品名称,分类名称,生产日期,保质期(天),提前提醒天数\n示例商品,食品,2024-01-01,30,7'
  const blob = new Blob(['\ufeff' + template], { type: 'text/csv;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = '商品导入模板.csv'
  document.body.appendChild(link); link.click(); document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const handleImport = async () => {
  if (!selectedFile.value) { ElMessage.warning('请先选择文件'); return }
  importing.value = true
  importResult.value = null
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    const res = await httpClient.post('/products/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    if (res.success) {
      importResult.value = { title: '导入成功', type: 'success', detail: `成功导入 ${res.data?.success || 0} 条，跳过 ${res.data?.skipped || 0} 条` }
      ElMessage.success('导入完成')
    }
  } catch (error: any) {
    importResult.value = { title: '导入失败', type: 'error', detail: error.response?.data?.message || '导入过程中发生错误' }
  } finally { importing.value = false }
}

const handleExport = async () => {
  exporting.value = true
  try {
    let blob: Blob
    let filename: string
    let apiUrl = '/products/export/all'
    const params: any = { format: exportFormat.value }
    
    if (exportRange.value === 'category' && selectedCategory.value) {
      params.categoryId = selectedCategory.value
    } else if (exportRange.value === 'expiring') {
      apiUrl = '/products/export/expiring'
      params.days = 30
    } else if (exportRange.value === 'expired') {
      params.status = 'EXPIRED'
    }

    const res = await httpClient.get(apiUrl, { params, responseType: 'blob' })
    blob = res as any
    filename = `商品数据_${dayjs().format('YYYYMMDD_HHmmss')}.${exportFormat.value}`
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = filename
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '导出失败')
  } finally { exporting.value = false }
}

onMounted(() => { loadCategories() })
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.import-export-page { padding: 32px; background: #f8fafc; min-height: calc(100vh - 64px); }

.page-header { margin-bottom: 24px; }
.header-left {
  .page-title { font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0; }
  .page-desc { font-size: 14px; color: #64748b; margin: 0; }
}

.cards-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; @media (max-width: 1024px) { grid-template-columns: 1fr; } }

.feature-card { background: white; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; overflow: hidden; display: flex; flex-direction: column; }

.card-header { display: flex; align-items: center; gap: 16px; padding: 24px; border-bottom: 1px solid #f1f5f9; }
.card-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white;
  &.import-icon { background: linear-gradient(135deg, #1e3a5f, #2c5282); }
  &.export-icon { background: linear-gradient(135deg, #10b981, #14b8a6); }
}
.card-title {
  h3 { font-size: 18px; font-weight: 600; color: #1e293b; margin: 0 0 4px 0; }
  p { font-size: 13px; color: #64748b; margin: 0; }
}

.card-body { padding: 24px; display: flex; flex-direction: column; flex: 1; }

.upload-area {
  :deep(.el-upload-dragger) { border: 2px dashed #e2e8f0; border-radius: 12px; background: #fafafa; transition: all 0.3s ease;
    &:hover { border-color: #1e3a5f; background: rgba(30, 58, 95, 0.04); }
  }
}

.upload-content { padding: 32px; text-align: center; }
.upload-icon { color: #94a3b8; margin-bottom: 12px; }
.upload-text { font-size: 14px; color: #64748b; margin: 0 0 8px 0; .link-text { color: #1e3a5f; font-weight: 500; } }
.upload-hint { font-size: 12px; color: #94a3b8; margin: 0; }

.template-section { display: flex; align-items: center; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #f1f5f9; }
.template-label { font-size: 13px; color: #64748b; }

.import-rules { margin-top: 20px; padding: 16px; background: #f8fafc; border-radius: 12px;
  h4 { font-size: 14px; font-weight: 600; color: #1e293b; margin: 0 0 12px 0; }
  ul { margin: 0; padding: 0; list-style: none;
    li { font-size: 13px; color: #64748b; padding: 6px 0; padding-left: 16px; position: relative;
      &::before { content: '•'; position: absolute; left: 0; color: #1e3a5f; }
    }
  }
}

.action-btn { width: 100%; height: 48px; border-radius: 12px; font-size: 15px; font-weight: 600; margin-top: auto; display: flex; align-items: center; justify-content: center; gap: 8px; }

.import-result { margin-top: 16px; }

.export-options, .export-fields, .export-format {
  h4 { font-size: 14px; font-weight: 600; color: #1e293b; margin: 0 0 12px 0; }
}

.export-range { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
  :deep(.el-radio) { height: auto; align-items: center; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 10px; margin-right: 0;
    &:hover { border-color: #1e3a5f; background: rgba(30, 58, 95, 0.04); }
    &.is-checked { border-color: #1e3a5f; background: rgba(30, 58, 95, 0.08); }
  }
}

.radio-content { display: flex; flex-direction: column; gap: 2px; margin-left: 8px;
  .radio-title { font-size: 14px; font-weight: 500; color: #1e293b; }
  .radio-desc { font-size: 12px; color: #64748b; }
}

.category-select { margin-top: 12px; }

.export-fields { margin-top: 20px; padding-top: 20px; border-top: 1px solid #f1f5f9;
  :deep(.el-checkbox-group) { display: flex; flex-wrap: wrap; gap: 12px; }
  :deep(.el-checkbox) { margin-right: 0; }
}

.export-format { margin-top: 20px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
</style>
