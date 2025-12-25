import request from '@/utils/request'
import type { ApiResponse, LoginForm, RegisterForm, User } from '@/types'

export const authApi = {
  // 登录
  login(data: LoginForm) {
    return request.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data)
  },

  // 注册
  register(data: RegisterForm) {
    return request.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data)
  },

  // 登出
  logout() {
    return request.post<ApiResponse>('/auth/logout')
  },

  // 修改密码
  changePassword(data: { oldPassword: string; newPassword: string }) {
    return request.put<ApiResponse>('/auth/change-password', data)
  },

  // 忘记密码
  forgotPassword(phone: string) {
    return request.post<ApiResponse<{ username: string }>>('/auth/forgot-password', { phone })
  },

  // 重置密码
  resetPassword(data: { phone: string; newPassword: string }) {
    return request.post<ApiResponse>('/auth/reset-password', data)
  },

  // 获取当前用户信息
  getCurrentUser() {
    return request.get<ApiResponse<User>>('/auth/me')
  }
}
