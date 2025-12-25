// 用户相关类型
export interface User {
  id: number
  username: string
  phone?: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  isActive?: boolean
  createdAt?: string
  lastLoginAt?: string
}

export interface LoginForm {
  username: string
  password: string
  remember?: boolean
}

export interface RegisterForm {
  username: string
  password: string
  confirmPassword: string
  phone: string
}

// 商品相关类型
export interface Product {
  id: number
  name: string
  productionDate: string | Date
  shelfLife: number
  reminderDays: number
  expiryDate: string | Date
  remainingDays: number
  status: 'NORMAL' | 'WARNING' | 'EXPIRED'
  createdAt: string
  updatedAt: string
}

export interface ProductForm {
  name: string
  productionDate: string
  shelfLife: number
  reminderDays: number
}

export interface ProductFilter {
  page?: number
  pageSize?: number
  name?: string
  status?: string
  startDate?: string
  endDate?: string
}

// 日志相关类型
export interface Log {
  id: number
  userId: number
  username: string
  userRole: string
  action: string
  details?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

export interface LogFilter {
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
  action?: string
  searchUserId?: number
}

// 统计相关类型
export interface Statistics {
  total: number
  normal: number
  warning: number
  expired: number
  todayAdded: number
  statusDistribution: Array<{ name: string; value: number }>
  monthlyTrend: Array<{ month: string; count: number }>
  upcomingExpiry: Product[]
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
}

export interface PageData<T = any> {
  [x: string]: any
  total: number
  page: number
  pageSize: number
  totalPages: number
  items?: T[]
}
