import request from '@/utils/request'
import type { ApiResponse, PageData } from '@/types'

export interface ImportHistory {
  id: number
  filename: string
  totalCount: number
  successCount: number
  failCount: number
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL'
  errors: any[] | null
  createdAt: string
}

export const importHistoryApi = {
  // 获取导入历史列表
  getList(params?: any) {
    return request.get<ApiResponse<PageData & { histories: ImportHistory[] }>>('/import-history', { params })
  },

  // 删除导入历史
  delete(id: number) {
    return request.delete<ApiResponse>(`/import-history/${id}`)
  }
}

// 导出便捷函数
export const getImportHistories = (params?: any) => importHistoryApi.getList(params).then(res => res.data)
export const deleteImportHistory = (id: number) => importHistoryApi.delete(id).then(res => res.data)
