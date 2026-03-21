<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '72px' : '240px'" class="sidebar">
      <!-- Logo 区域 -->
      <div class="logo-section">
        <div class="logo-icon">
          <img src="/icon/logo.png" alt="Logo" />
        </div>
        <transition name="fade">
          <span v-if="!isCollapse" class="logo-text">保质期管理</span>
        </transition>
      </div>
      
      <!-- 导航菜单 -->
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        router
        class="sidebar-menu"
        :class="{ 'is-collapse': isCollapse }"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon :size="20"><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
      
      <!-- 折叠按钮 -->
      <div class="collapse-trigger" @click="toggleCollapse">
        <el-icon :size="16">
          <DArrowLeft v-if="!isCollapse" />
          <DArrowRight v-else />
        </el-icon>
        <transition name="fade">
          <span v-if="!isCollapse" class="collapse-text">收起</span>
        </transition>
      </div>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <h2 class="page-title">{{ pageTitle }}</h2>
        </div>
        
        <div class="header-right">
          <!-- 用户信息 -->
          <div class="user-info">
            <div class="user-avatar">
              {{ userStore.user?.username?.charAt(0).toUpperCase() }}
            </div>
            <div class="user-details">
              <span class="username">{{ userStore.user?.username }}</span>
              <span class="role-badge" :class="userStore.user?.role?.toLowerCase()">
                {{ getRoleText(userStore.user?.role) }}
              </span>
            </div>
          </div>
          
          <!-- 下拉菜单 -->
          <el-dropdown @command="handleCommand" trigger="click">
            <div class="dropdown-trigger">
              <el-icon :size="18"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu class="user-dropdown">
                <el-dropdown-item command="settings">
                  <el-icon><User /></el-icon>
                  <span>个人设置</span>
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  <span>退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 页面内容 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { authApi } from '@/api/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataAnalysis,
  Box,
  Folder,
  Bell,
  PieChart,
  Upload,
  Document,
  Setting,
  FolderOpened,
  DArrowLeft,
  DArrowRight,
  ArrowDown,
  User,
  SwitchButton
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)

// 菜单项配置
const menuItems = computed(() => {
  const items = [
    { path: '/dashboard', title: '仪表盘', icon: DataAnalysis },
    { path: '/products', title: '商品管理', icon: Box },
    { path: '/categories', title: '分类管理', icon: Folder },
    { path: '/reminder', title: '过期提醒', icon: Bell },
    { path: '/statistics', title: '数据统计', icon: PieChart },
    { path: '/import-export', title: '导入导出', icon: Upload },
    { path: '/logs', title: '日志审计', icon: Document },
  ]
  
  if (userStore.isAdmin) {
    items.push(
      { path: '/admin', title: '系统管理', icon: Setting },
      { path: '/backup', title: '数据备份', icon: FolderOpened }
    )
  }
  
  return items
})

// 当前页面标题
const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/dashboard': '仪表盘',
    '/products': '商品管理',
    '/categories': '分类管理',
    '/reminder': '过期提醒',
    '/statistics': '数据统计',
    '/import-export': '导入导出',
    '/logs': '日志审计',
    '/admin': '系统管理',
    '/backup': '数据备份',
    '/settings': '个人设置'
  }
  return titles[route.path] || '保质期管理系统'
})

const activeMenu = computed(() => route.path)

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const getRoleText = (role?: string) => {
  const roles: Record<string, string> = {
    'SUPER_ADMIN': '超级管理员',
    'ADMIN': '管理员',
    'USER': '普通用户'
  }
  return roles[role || ''] || '用户'
}

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })

      await authApi.logout()
      userStore.clearUser()
      ElMessage.success('退出成功')
      router.push('/login')
    } catch (error) {
      // 用户取消
    }
  } else if (command === 'settings') {
    router.push('/settings')
  }
}
</script>

<style scoped lang="scss">
.main-layout {
  height: 100vh;
  background: #f8fafc;
}

// 侧边栏
.sidebar {
  background: white;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
  transition: width 0.3s ease;
  position: relative;
  z-index: 10;
}

.logo-section {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 16px;
  border-bottom: 1px solid #f1f5f9;
}

.logo-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
}

// 菜单样式
.sidebar-menu {
  border-right: none;
  flex: 1;
  padding: 12px 8px;
  
  &:not(.el-menu--collapse) {
    width: 100%;
  }
  
  :deep(.el-menu-item) {
    height: 48px;
    line-height: 48px;
    border-radius: 12px;
    margin-bottom: 4px;
    color: #64748b;
    font-weight: 500;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 20px !important;
    
    &:hover {
      background: #f1f5f9;
      color: #1e3a5f;
    }
    
    &.is-active {
      background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
      color: white;
    }
    
    .el-icon {
      margin-right: 12px !important;
      flex-shrink: 0;
    }
  }
  
  // 收起状态
  &.el-menu--collapse {
    :deep(.el-menu-item) {
      justify-content: center !important;
      padding: 0 !important;
      
      .el-icon {
        margin-right: 0 !important;
        margin-left: 0 !important;
      }
    }
  }
}

// 折叠按钮
.collapse-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #f1f5f9;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: #1e3a5f;
    background: #f8fafc;
  }
}

.collapse-text {
  font-size: 12px;
}

// Header
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 0 24px;
  height: 64px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 0;
  z-index: 9;
}

.header-left {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    background: #f1f5f9;
  }
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.user-details {
  display: flex;
  flex-direction: column;
  
  .username {
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
    line-height: 1.3;
  }
  
  .role-badge {
    font-size: 11px;
    color: #64748b;
    
    &.super_admin {
      color: #ef4444;
    }
    
    &.admin {
      color: #f59e0b;
    }
    
    &.user {
      color: #10b981;
    }
  }
}

.dropdown-trigger {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e2e8f0;
    color: #1e293b;
  }
}

// 下拉菜单
:deep(.user-dropdown) {
  padding: 8px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 20px 40px -10px rgba(0, 0, 0, 0.15);
  
  .el-dropdown-menu__item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-radius: 8px;
    color: #64748b;
    font-size: 14px;
    
    &:hover {
      background: #f8fafc;
      color: #1e293b;
    }
    
    .el-icon {
      font-size: 16px;
    }
  }
}

// 主内容区
.main-content {
  background: #f8fafc;
  padding: 24px;
  min-height: calc(100vh - 64px);
  overflow-y: auto;
}

// 过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
