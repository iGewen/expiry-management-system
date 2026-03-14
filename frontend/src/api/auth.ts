import request from '@/utils/request'
import type { ApiResponse, RegisterForm, User } from '@/types'

export interface LoginResponse {
  user: User
  token: string
  refreshToken?: string
}

export interface ResetPasswordForm {
  phone: string
  newPassword: string
  verifyCode: string
}

export const authApi = {
  // 登录
  login(username: string, password: string) {
    return request.post<ApiResponse<LoginResponse>>('/auth/login', {
      username,
      password
    })
  },

  // 注册
  register(data: RegisterForm) {
    return request.post<ApiResponse<LoginResponse>>('/auth/register', data)
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
  resetPassword(data: ResetPasswordForm) {
    return request.post<ApiResponse>('/auth/reset-password', data)
  },

  // 刷新 Token
  refreshToken(refreshToken: string) {
    return request.post<ApiResponse<LoginResponse>>('/auth/refresh', { refreshToken })
  },

  // 获取当前用户信息
  getCurrentUser() {
    return request.get<ApiResponse<User>>('/auth/me')
  }
}
