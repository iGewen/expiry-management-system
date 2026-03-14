import request from '@/utils/request'

export function getReminderSetting() {
  return request({
    url: '/reminders/setting',
    method: 'get'
  })
}

export function updateReminderSetting(data: {
  enabled?: boolean
  reminderTime?: string
  advanceDays?: number
  remindBySms?: boolean
  remindByEmail?: boolean
}) {
  return request({
    url: '/reminders/setting',
    method: 'put',
    data
  })
}

export function triggerReminder() {
  return request({
    url: '/reminders/trigger',
    method: 'post'
  })
}

export function getReminderLogs(params?: { page?: number; pageSize?: number }) {
  return request({
    url: '/reminders/logs',
    method: 'get',
    params
  })
}

export function getUpcomingProducts() {
  return request({
    url: '/reminders/upcoming',
    method: 'get'
  })
}
