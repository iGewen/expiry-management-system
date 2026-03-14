<template>
  <div class="reminder-setting">
    <el-row :gutter="20">
      <!-- 提醒设置 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>过期提醒设置</span>
              <el-switch v-model="form.enabled" @change="handleSave" />
            </div>
          </template>

          <el-form :model="form" label-width="120px">
            <el-form-item label="提醒状态">
              <el-tag :type="form.enabled ? 'success' : 'info'">
                {{ form.enabled ? '已开启' : '已关闭' }}
              </el-tag>
              <span class="setting-desc">每天早上 {{ form.reminderTime }} 发送提醒</span>
            </el-form-item>

            <el-form-item label="提醒时间">
              <el-time-picker
                v-model="reminderTimeObj"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="选择提醒时间"
                @change="handleTimeChange"
                style="width: 150px"
              />
            </el-form-item>

            <el-form-item label="提前天数">
              <el-slider v-model="form.advanceDays" :min="1" :max="7" show-stops show-input style="width: 300px" />
              <div class="setting-desc">商品过期前 {{ form.advanceDays }} 天发送提醒</div>
            </el-form-item>

            <el-form-item label="提醒方式">
              <el-checkbox v-model="form.remindBySms" disabled>
                短信提醒（当前仅支持短信）
              </el-checkbox>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleSave" :loading="saving">保存设置</el-button>
              <el-button @click="handleTest">发送测试提醒</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 即将过期商品预览 -->
        <el-card shadow="never" style="margin-top: 20px">
          <template #header>
            <span>即将过期商品（{{ upcomingProducts.length }} 个）</span>
          </template>
          <el-empty v-if="upcomingProducts.length === 0" description="暂无即将过期的商品" />
          <el-table v-else :data="upcomingProducts" max-height="300" size="small">
            <el-table-column prop="name" label="商品名称" show-overflow-tooltip />
            <el-table-column label="剩余天数" width="100">
              <template #default="{ row }">
                <el-tag :type="row.remainingDays <= 0 ? 'danger' : row.remainingDays <= 3 ? 'warning' : 'info'">
                  {{ row.remainingDays }} 天
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="过期日期" width="120">
              <template #default="{ row }">
                {{ dayjs(row.expiryDate).format('MM-DD') }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 提醒历史 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="never">
          <template #header>
            <span>提醒历史记录</span>
          </template>
          <el-table :data="logs" v-loading="logsLoading" size="small">
            <el-table-column prop="productName" label="商品名称" show-overflow-tooltip />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'success' ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="发送时间" width="160">
              <template #default="{ row }">
                {{ dayjs(row.sentAt).format('MM-DD HH:mm') }}
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-if="total > 0"
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            layout="prev, pager, next"
            small
            class="pagination"
            @current-change="loadLogs"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { getReminderSetting, updateReminderSetting, triggerReminder, getReminderLogs, getUpcomingProducts } from '@/api/reminder'

const form = ref({
  enabled: true,
  reminderTime: '09:00',
  advanceDays: 3,
  remindBySms: true,
  remindByEmail: false
})

const reminderTimeObj = computed({
  get: () => {
    const [hour, minute] = form.value.reminderTime.split(':')
    const date = new Date()
    date.setHours(parseInt(hour), parseInt(minute), 0, 0)
    return date
  },
  set: (val: Date) => {
    if (val) {
      form.value.reminderTime = dayjs(val).format('HH:mm')
    }
  }
})

const saving = ref(false)
const upcomingProducts = ref<any[]>([])
const logs = ref<any[]>([])
const logsLoading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const loadSetting = async () => {
  try {
    const res = await getReminderSetting()
    if (res.data) {
      form.value = { ...form.value, ...res.data }
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '获取设置失败')
  }
}

const handleTimeChange = (val: string) => {
  if (val) {
    form.value.reminderTime = val
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    await updateReminderSetting(form.value)
    ElMessage.success('设置保存成功')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const handleTest = async () => {
  try {
    const res = await triggerReminder()
    if (res.data?.sent) {
      ElMessage.success(`测试提醒已发送，共 ${res.data.totalProducts} 个商品`)
    } else {
      ElMessage.info(res.data?.reason === 'no_products' ? '没有需要提醒的商品' : '无需发送')
    }
    loadUpcoming()
    loadLogs()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '发送失败')
  }
}

const loadUpcoming = async () => {
  try {
    const res = await getUpcomingProducts()
    upcomingProducts.value = res.data || []
  } catch (error: any) {
    console.error('获取即将过期商品失败:', error)
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

.setting-desc {
  margin-left: 12px;
  color: $text-secondary;
  font-size: 13px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

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
}
</style>
