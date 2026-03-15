<template>
  <div class="reminder-setting">
    <el-row :gutter="20">
      <!-- 提醒设置 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="setting-card">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon><Bell /></el-icon>
                <span>过期提醒设置</span>
              </div>
              <el-switch v-model="form.enabled" active-text="开启" inactive-text="关闭" />
            </div>
          </template>

          <el-form :model="form" label-width="120px" :disabled="!form.enabled">
            <el-form-item label="提醒状态">
              <el-tag :type="form.enabled ? 'success' : 'info'" effect="dark">
                {{ form.enabled ? '已开启' : '已关闭' }}
              </el-tag>
              <span class="setting-desc">开启后将在设定时间自动发送过期提醒短信</span>
            </el-form-item>

            <el-form-item label="提醒时间">
              <el-time-select
                v-model="form.reminderTime"
                start="06:00"
                step="00:30"
                end="22:00"
                placeholder="选择提醒时间"
                style="width: 150px"
              />
            </el-form-item>

            <el-form-item label="提醒手机号">
              <div class="phones-container">
                <div v-for="(phone, index) in form.phones" :key="index" class="phone-item">
                  <el-input 
                    v-model="form.phones[index]" 
                    placeholder="请输入手机号"
                    maxlength="11"
                    style="width: 200px"
                  >
                    <template #prefix>
                      <el-icon><Phone /></el-icon>
                    </template>
                  </el-input>
                  <el-button 
                    type="danger" 
                    :icon="Delete" 
                    circle 
                    size="small"
                    @click="removePhone(index)"
                    :disabled="form.phones.length === 1"
                  />
                </div>
                <el-button 
                  type="primary" 
                  plain 
                  :icon="Plus" 
                  @click="addPhone"
                  :disabled="form.phones.length >= 5"
                >
                  添加手机号
                </el-button>
                <div class="phone-tip">
                  最多添加5个手机号，提醒将发送到所有已填写的手机号
                </div>
              </div>
            </el-form-item>

            <el-form-item label="提醒方式">
              <el-checkbox v-model="form.remindBySms" disabled>
                <el-icon><Message /></el-icon>
                短信提醒
              </el-checkbox>
              <el-tag type="info" size="small" class="method-tag">当前仅支持短信</el-tag>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleSave" :loading="saving">
                <el-icon><Check /></el-icon>
                保存设置
              </el-button>
              <el-button @click="handleTest" type="warning" plain :disabled="form.phones.length === 0">
                <el-icon><Promotion /></el-icon>
                发送测试
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 提醒说明 -->
        <el-card shadow="never" class="info-card">
          <template #header>
            <div class="header-title">
              <el-icon><InfoFilled /></el-icon>
              <span>提醒说明</span>
            </div>
          </template>
          <div class="info-content">
            <ul>
              <li>系统会根据每个商品单独设置的 <strong>提醒天数</strong> 发送提醒</li>
              <li>在商品管理页面可以为每个商品设置不同的提醒提前天数</li>
              <li>短信提醒使用阿里云服务，需要在阿里云控制台申请模板</li>
              <li>每天定时检查，过期商品不再发送提醒</li>
              <li>所有用户均可使用短信提醒功能，只需填写手机号并开启提醒</li>
            </ul>
          </div>
        </el-card>
      </el-col>

      <!-- 即将过期商品 + 提醒历史 -->
      <el-col :xs="24" :lg="12">
        <!-- 即将过期商品预览 -->
        <el-card shadow="never" class="preview-card">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon><WarningFilled /></el-icon>
                <span>即将过期商品</span>
                <el-tag type="warning" size="small">{{ upcomingProducts.length }} 个</el-tag>
              </div>
              <el-button size="small" text @click="loadUpcoming">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          
          <div v-if="upcomingProductsLoading" class="loading-container">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>
          <el-empty v-else-if="upcomingProducts.length === 0" description="暂无即将过期的商品" :image-size="80" />
          <div v-else class="product-list">
            <div 
              v-for="product in upcomingProducts.slice(0, 10)" 
              :key="product.id" 
              class="product-item"
              :class="getExpireClass(product.remainingDays)"
            >
              <div class="product-info">
                <span class="product-name">{{ product.name }}</span>
                <span class="product-date">过期: {{ dayjs(product.expiryDate).format('MM-DD') }}</span>
              </div>
              <div class="product-days">
                <el-tag :type="getExpireType(product.remainingDays)" size="small">
                  {{ product.remainingDays }} 天
                </el-tag>
                <span class="reminder-days">提醒: {{ product.reminderDays }}天前</span>
              </div>
            </div>
            <div v-if="upcomingProducts.length > 10" class="more-info">
              还有 {{ upcomingProducts.length - 10 }} 个商品即将过期...
            </div>
          </div>
        </el-card>

        <!-- 提醒历史 -->
        <el-card shadow="never" class="history-card">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon><Clock /></el-icon>
                <span>提醒历史记录</span>
              </div>
              <el-button size="small" text @click="loadLogs">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <el-table 
            :data="logs" 
            v-loading="logsLoading" 
            size="small"
            max-height="300"
            style="width: 100%"
          >
            <el-table-column prop="productName" label="商品名称" min-width="120" show-overflow-tooltip />
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'success' ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="发送时间" width="140">
              <template #default="{ row }">
                {{ dayjs(row.sentAt).format('MM-DD HH:mm') }}
              </template>
            </el-table-column>
            <el-table-column label="详情" width="60" align="center">
              <template #default="{ row }">
                <el-tooltip v-if="row.errorMsg" :content="row.errorMsg" placement="top">
                  <el-icon style="color: #f56c6c;"><Warning /></el-icon>
                </el-tooltip>
                <span v-else class="text-gray">-</span>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-if="total > 0"
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            small
            class="pagination"
            @current-change="loadLogs"
            @size-change="loadLogs"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Bell, 
  Check, 
  Promotion, 
  InfoFilled, 
  WarningFilled, 
  Clock, 
  Refresh, 
  Loading,
  Warning,
  Message,
  Phone,
  Plus,
  Delete
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { getReminderSetting, updateReminderSetting, triggerReminder, getReminderLogs, getUpcomingProducts } from '@/api/reminder'

const form = ref({
  enabled: true,
  reminderTime: '09:00',
  phones: [''] as string[],
  remindBySms: true,
  remindByEmail: false
})

const saving = ref(false)
const upcomingProducts = ref<any[]>([])
const upcomingProductsLoading = ref(false)
const logs = ref<any[]>([])
const logsLoading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 添加手机号
const addPhone = () => {
  if (form.value.phones.length < 5) {
    form.value.phones.push('')
  }
}

// 删除手机号
const removePhone = (index: number) => {
  if (form.value.phones.length > 1) {
    form.value.phones.splice(index, 1)
  }
}

const loadSetting = async () => {
  try {
    const res = await getReminderSetting()
    if (res.data) {
      form.value.enabled = res.data.enabled ?? true
      form.value.reminderTime = res.data.reminderTime || '09:00'
      form.value.phones = res.data.phones?.length > 0 ? res.data.phones : ['']
      form.value.remindBySms = res.data.remindBySms ?? true
      form.value.remindByEmail = res.data.remindByEmail ?? false
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '获取设置失败')
  }
}

const handleSave = async () => {
  // 验证手机号
  const validPhones = form.value.phones.filter(p => p.trim() !== '')
  if (validPhones.length === 0) {
    ElMessage.warning('请至少填写一个手机号')
    return
  }
  
  // 验证手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/
  for (const phone of validPhones) {
    if (!phoneRegex.test(phone)) {
      ElMessage.warning(`手机号 ${phone} 格式不正确`)
      return
    }
  }
  
  saving.value = true
  try {
    await updateReminderSetting({
      enabled: form.value.enabled,
      reminderTime: form.value.reminderTime,
      phones: validPhones,
      remindBySms: form.value.remindBySms,
      remindByEmail: form.value.remindByEmail
    })
    ElMessage.success('设置保存成功')
    // 更新表单中的phones为有效手机号
    form.value.phones = validPhones.length > 0 ? validPhones : ['']
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const handleTest = async () => {
  // 验证手机号
  const validPhones = form.value.phones.filter(p => p.trim() !== '')
  if (validPhones.length === 0) {
    ElMessage.warning('请先填写手机号')
    return
  }
  
  try {
    const res = await triggerReminder()
    if (res.data?.sent) {
      ElMessage.success(`测试提醒已发送，共 ${res.data.totalProducts} 个商品，${res.data.totalMessages} 条短信`)
    } else {
      const reasonMap: Record<string, string> = {
        no_products: '没有需要提醒的商品',
        reminder_disabled: '提醒已关闭',
        no_phones: '未配置提醒手机号'
      }
      ElMessage.info(reasonMap[res.data?.reason] || '无需发送')
    }
    loadUpcoming()
    loadLogs()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '发送失败')
  }
}

const loadUpcoming = async () => {
  upcomingProductsLoading.value = true
  try {
    const res = await getUpcomingProducts()
    upcomingProducts.value = res.data || []
  } catch (error: any) {
    console.error('获取即将过期商品失败:', error)
  } finally {
    upcomingProductsLoading.value = false
  }
}

const loadLogs = async () => {
  logsLoading.value = true
  try {
    const res = await getReminderLogs({ page: page.value, pageSize: pageSize.value })
    logs.value = res.data?.logs || []
    total.value = res.data?.total || 0
  } catch (error: any) {
    console.error('获取提醒历史失败:', error)
  } finally {
    logsLoading.value = false
  }
}

const getExpireType = (days: number) => {
  if (days <= 0) return 'danger'
  if (days <= 3) return 'danger'
  if (days <= 7) return 'warning'
  return 'info'
}

const getExpireClass = (days: number) => {
  if (days <= 0) return 'expired'
  if (days <= 3) return 'warning'
  if (days <= 7) return 'soon'
  return 'normal'
}

onMounted(() => {
  loadSetting()
  loadUpcoming()
  loadLogs()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.reminder-setting {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  
  .el-icon {
    font-size: 18px;
    color: $primary-color;
  }
}

.setting-desc {
  margin-left: 12px;
  color: $text-secondary;
  font-size: 13px;
  line-height: 1.6;
}

.phones-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.phone-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.phone-tip {
  font-size: 12px;
  color: $text-placeholder;
  margin-top: 4px;
}

.remind-methods {
  display: flex;
  align-items: center;
  gap: 8px;
}

.method-tag {
  margin-left: 4px;
}

.info-card {
  margin-top: 20px;
  
  .info-content {
    ul {
      margin: 0;
      padding-left: 20px;
      line-height: 2;
      color: $text-regular;
      
      li {
        margin-bottom: 4px;
      }
      
      strong {
        color: $primary-color;
      }
    }
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: $text-secondary;
  
  .el-icon {
    font-size: 24px;
    margin-bottom: 8px;
  }
}

.product-list {
  max-height: 400px;
  overflow-y: auto;
}

.product-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: #f5f7fa;
  border-left: 3px solid $success-color;
  transition: all 0.2s;
  
  &:hover {
    background: #eef1f5;
  }
  
  &.expired {
    border-left-color: $danger-color;
    background: rgba($danger-color, 0.05);
  }
  
  &.warning {
    border-left-color: $danger-color;
  }
  
  &.soon {
    border-left-color: $warning-color;
  }
  
  &.normal {
    border-left-color: $success-color;
  }
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  .product-name {
    font-weight: 500;
    color: $text-primary;
  }
  
  .product-date {
    font-size: 12px;
    color: $text-secondary;
  }
}

.product-days {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  
  .reminder-days {
    font-size: 11px;
    color: $text-placeholder;
  }
}

.more-info {
  text-align: center;
  padding: 12px;
  color: $text-secondary;
  font-size: 13px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.text-gray {
  color: $text-placeholder;
}

// Card 统一样式
.setting-card,
.preview-card,
.history-card,
.info-card {
  border-radius: 8px;
  
  :deep(.el-card__header) {
    padding: 14px 20px;
    border-bottom: 1px solid $border-light;
  }
  
  :deep(.el-card__body) {
    padding: 20px;
  }
}

.history-card {
  margin-top: 20px;
}

// 响应式
@media (max-width: 992px) {
  .reminder-setting {
    padding: 12px;
  }
  
  .el-col {
    margin-bottom: 20px;
  }
  
  .el-col:last-child {
    margin-bottom: 0;
  }
  
  .product-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .product-days {
    align-items: flex-start;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
  
  .phone-item {
    flex-wrap: wrap;
  }
}
</style>
