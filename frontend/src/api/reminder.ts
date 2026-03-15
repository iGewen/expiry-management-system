import request from '@/utils/request'

export function getReminderSetting() {
  return request.get('/reminders/setting')
}

export function updateReminderSetting(data: {
  enabled?: boolean
  reminderTime?: string
  phones?: string[]
  remindBySms?: boolean
  remindByEmail?: boolean
  feishuEnabled?: boolean
  feishuWebhook?: string
}) {
  return request.put('/reminders/setting', data)
}

export function triggerReminder() {
  return request.post('/reminders/trigger')
}

export function getReminderLogs(params?: { page?: number; pageSize?: number }) {
  return request.get('/reminders/logs', { params })
}

export function getUpcomingProducts() {
  return request.get('/reminders/upcoming')
}

export function testFeishuWebhook(webhookUrl: string) {
  return request.post('/reminders/test-feishu', { webhookUrl })
}
