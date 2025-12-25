import request from '@/utils/request'
import type { ApiResponse, Log, LogFilter, PageData } from '@/types'

export const logApi = {
  // 获取日志列表
  getList(params?: LogFilter) {
    return request.get<ApiResponse<PageData & { logs: Log[] }>>('/logs', { params })
  },

  // 获取操作类型列表
  getActionTypes() {
    return request.get<ApiResponse<string[]>>('/logs/actions')
  },

  // 清空日志
  clearLogs(beforeDate: string) {
    return request.delete<ApiResponse>('/logs', { data: { beforeDate } })
  }
}

// 导出便捷函数
export const getLogs = (params?: LogFilter) => logApi.getList(params).then(res => res.data)
export const getLogActionTypes = () => logApi.getActionTypes().then(res => res.data)
export const clearLogs = (beforeDate: string) => logApi.clearLogs(beforeDate).then(res => res.data)
