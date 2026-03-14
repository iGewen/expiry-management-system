import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// API 响应类型
interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  code?: string
  errors?: Array<{ field: string; message: string }>
}

// 分页响应类型
interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 请求配置类型，包含重试选项
interface RequestConfig extends AxiosRequestConfig {
  retry?: number
  retryDelay?: number
}

class HttpClient {
  private instance: AxiosInstance
  private refreshPromise: Promise<void> | null = null

  constructor() {
    this.instance = axios.create({
      baseURL: '/api',
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token')
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        // 返回完整的响应，但会在 axios 处理后变成 response.data
        return response
      },
      async (error) => {
        const { response, config } = error

        if (!response) {
          // 网络错误，尝试重试
          return this.handleRetry(config, error)
        }

        const { status, data } = response

        // 处理 401 - Token 过期
        if (status === 401 && data?.code === 'AUTH_TOKEN_EXPIRED') {
          // 尝试刷新 Token
          if (!this.refreshPromise) {
            this.refreshPromise = this.refreshToken()
          }

          try {
            await this.refreshPromise
            this.refreshPromise = null
            
            // 重试原请求
            const token = localStorage.getItem('token')
            if (config.headers && token) {
              config.headers.Authorization = `Bearer ${token}`
            }
            return this.instance.request(config)
          } catch (refreshError) {
            this.refreshPromise = null
            this.handleLogout()
            return Promise.reject(refreshError)
          }
        }

        // 其他 401 错误
        if (status === 401) {
          if (config.url?.includes('/auth/login')) {
            ElMessage.error(data.message || '用户名或密码错误')
          } else {
            this.handleLogout()
          }
          return Promise.reject(error)
        }

        // 处理其他错误
        switch (status) {
          case 400:
            if (data.errors && Array.isArray(data.errors)) {
              const messages = data.errors.map((e: any) => `${e.field}: ${e.message}`).join('\n')
              ElMessage.error(messages)
            } else {
              ElMessage.error(data.message || '请求参数错误')
            }
            break
          case 403:
            ElMessage.error(data.message || '权限不足')
            break
          case 404:
            ElMessage.error(data.message || '请求的资源不存在')
            break
          case 409:
            ElMessage.error(data.message || '数据已存在')
            break
          case 429:
            ElMessage.error(data.message || '请求过于频繁，请稍后再试')
            break
          case 500:
            ElMessage.error(data.message || '服务器错误')
            break
          default:
            ElMessage.error(data.message || '请求失败')
        }

        return Promise.reject(error)
      }
    )
  }

  // 处理请求重试
  private async handleRetry(config: RequestConfig, error: any): Promise<any> {
    const retry = config.retry || 0
    const retryDelay = config.retryDelay || 1000

    if (retry > 0) {
      const newConfig = { ...config, retry: retry - 1 }
      await this.delay(retryDelay)
      return this.instance.request(newConfig)
    }

    ElMessage.error('网络错误，请检查网络连接')
    return Promise.reject(error)
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken')
    
    if (!refreshToken) {
      throw new Error('No refresh token')
    }

    try {
      const response = await axios.post<ApiResponse>('/api/auth/refresh', {
        refreshToken
      })

      if (response.data.success && response.data.data) {
        const { token, refreshToken: newRefreshToken } = response.data.data as any
        localStorage.setItem('token', token)
        localStorage.setItem('refreshToken', newRefreshToken)
      } else {
        throw new Error('Token refresh failed')
      }
    } catch (error) {
      throw error
    }
  }

  private handleLogout() {
    ElMessage.error('登录已过期，请重新登录')
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    router.push('/login')
  }

  // 创建去重键
  private createDedupKey(config: AxiosRequestConfig): string {
    return `${config.method}-${config.url}-${JSON.stringify(config.params)}-${JSON.stringify(config.data)}`
  }

  // GET 请求
  async get<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.get(url, config)
    return response.data
  }

  // POST 请求
  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.post(url, data, config)
    return response.data
  }

  // PUT 请求
  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.put(url, data, config)
    return response.data
  }

  // DELETE 请求
  async delete<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.delete(url, config)
    return response.data
  }

  // 文件上传
  async upload<T = any>(url: string, file: File, onProgress?: (percent: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await this.instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      }
    })
    return response.data
  }
}

export default new HttpClient()
export type { ApiResponse, PaginatedResponse, RequestConfig }
