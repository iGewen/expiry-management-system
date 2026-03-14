import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { authApi } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN' || user.value?.role === 'SUPER_ADMIN')
  const isSuperAdmin = computed(() => user.value?.role === 'SUPER_ADMIN')

  // Actions
  function setUser(userData: User) {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  function setToken(tokenValue: string, refreshTokenValue?: string) {
    token.value = tokenValue
    localStorage.setItem('token', tokenValue)
    
    if (refreshTokenValue) {
      refreshToken.value = refreshTokenValue
      localStorage.setItem('refreshToken', refreshTokenValue)
    }
  }

  function clearUser() {
    user.value = null
    token.value = null
    refreshToken.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }

  function loadFromStorage() {
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token')
    const savedRefreshToken = localStorage.getItem('refreshToken')
    
    if (savedUser && savedToken) {
      try {
        user.value = JSON.parse(savedUser)
        token.value = savedToken
        refreshToken.value = savedRefreshToken
      } catch (error) {
        clearUser()
      }
    }
  }

  async function fetchUserInfo() {
    try {
      const res = await authApi.getCurrentUser()
      if (res.success && res.data) {
        setUser(res.data)
      } else {
        throw new Error('Failed to fetch user info')
      }
    } catch (error) {
      clearUser()
      throw error
    }
  }

  async function login(username: string, password: string) {
    const res = await authApi.login(username, password)
    
    if (res.success && res.data) {
      const { user: userData, token: tokenValue, refreshToken: refreshTokenValue } = res.data as any
      setUser(userData)
      setToken(tokenValue, refreshTokenValue)
      return true
    }
    
    return false
  }

  function logout() {
    clearUser()
    window.location.href = '/login'
  }

  // 检查 token 是否即将过期（可选）
  function isTokenExpiring(): boolean {
    if (!token.value) return true
    
    try {
      const payload = JSON.parse(atob(token.value.split('.')[1]))
      const exp = payload.exp * 1000 // 转换为毫秒
      const now = Date.now()
      const threshold = 5 * 60 * 1000 // 5 分钟阈值
      
      return exp - now < threshold
    } catch {
      return true
    }
  }

  return {
    user,
    token,
    refreshToken,
    isLoggedIn,
    isAdmin,
    isSuperAdmin,
    setUser,
    setToken,
    clearUser,
    loadFromStorage,
    fetchUserInfo,
    login,
    logout,
    isTokenExpiring
  }
})
