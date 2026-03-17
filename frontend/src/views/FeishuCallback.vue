<template>
  <div class="feishu-callback-container">
    <div class="loading-wrapper">
      <el-icon class="loading-icon" :size="48">
        <Loading />
      </el-icon>
      <p class="loading-text">{{ statusText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const statusText = ref('正在处理飞书登录...')

onMounted(async () => {
  const token = route.query.token as string
  const refreshToken = route.query.refreshToken as string
  const isNewUser = route.query.isNewUser === 'true'
  const userId = route.query.userId as string
  const username = route.query.username as string
  const error = route.query.error as string
  const errorMessage = route.query.message as string
  const state = route.query.state as string

  // 处理错误情况
  if (error) {
    statusText.value = errorMessage || '飞书登录失败'
    ElMessage.error(errorMessage || '飞书登录失败，请重试')
    setTimeout(() => {
      router.push('/login')
    }, 2000)
    return
  }

  // 检查是否有 token
  if (!token) {
    statusText.value = '授权失败：缺少登录凭证'
    setTimeout(() => {
      router.push('/login')
    }, 2000)
    return
  }

  try {
    statusText.value = '正在完成登录...'
    
    // 保存 token
    userStore.setToken(token, refreshToken)
    
    // 获取用户信息
    await userStore.fetchUserInfo()
    
    if (isNewUser) {
      ElMessage.success(`飞书登录成功，已为您创建账号「${decodeURIComponent(username || '')}」`)
    } else {
      ElMessage.success('飞书登录成功')
    }
    
    // 跳转到首页或指定页面
    const redirect = state || route.query.redirect as string
    router.push(redirect || '/')
  } catch (error: any) {
    console.error('Feishu callback error:', error)
    statusText.value = error.message || '登录失败'
    ElMessage.error('登录失败，请重试')
    
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }
})
</script>

<style scoped lang="scss">
.feishu-callback-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #E6F7FF 0%, #BAE7FF 50%, #91D5FF 100%);
}

.loading-wrapper {
  text-align: center;
  background: white;
  padding: 60px 80px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.loading-icon {
  color: #3370FF;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: 20px;
  font-size: 16px;
  color: #606266;
}
</style>
