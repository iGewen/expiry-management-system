import request from '@/utils/request'
import type { ApiResponse, User, PageData } from '@/types'

export const userApi = {
  // 获取用户列表（管理员）
  getList(params?: any) {
    return request.get<ApiResponse<PageData & { users: User[] }>>('/users', { params })
  },

  // 获取用户详情（管理员）
  getById(id: number) {
    return request.get<ApiResponse<User>>(`/users/${id}`)
  },

  // 更新用户（管理员）
  update(id: number, data: Partial<User>) {
    return request.put<ApiResponse<User>>(`/users/${id}`, data)
  },

  // 重置用户密码（管理员）
  resetPassword(id: number, newPassword: string) {
    return request.put<ApiResponse>(`/users/${id}/password`, { newPassword })
  },

  // 删除用户（超级管理员）
  delete(id: number) {
    return request.delete<ApiResponse>(`/users/${id}`)
  },

  // 获取用户统计（管理员）
  getStatistics() {
    return request.get<ApiResponse>('/users/stats')
  },

  // 更新个人信息
  updateProfile(data: { phone?: string }) {
    return request.put<ApiResponse<User>>('/users/profile', data)
  },

  // 修改密码
  changePassword(data: { oldPassword: string; newPassword: string }) {
    return request.put<ApiResponse>('/auth/change-password', data)
  }
}

// 导出便捷函数
export const getUsers = (params?: any) => userApi.getList(params).then(res => res.data)
export const getUser = (id: number) => userApi.getById(id).then(res => res.data)
export const updateUser = (id: number, data: Partial<User>) => userApi.update(id, data).then(res => res.data)
export const updateUserRole = (id: number, data: { role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' }) => userApi.update(id, data).then(res => res.data)
export const updateUserStatus = (id: number, data: { isActive: boolean }) => userApi.update(id, data).then(res => res.data)
export const updateProfile = (data: { phone?: string }) => userApi.updateProfile(data).then(res => res.data)
export const changePassword = (data: { oldPassword: string; newPassword: string }) => userApi.changePassword(data).then(res => res.data)
