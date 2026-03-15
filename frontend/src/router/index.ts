import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresAuth: false, title: '注册' }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPassword.vue'),
    meta: { requiresAuth: false, title: '忘记密码' }
  },
  {
    path: '/privacy-policy',
    name: 'PrivacyPolicy',
    component: () => import('@/views/PrivacyPolicy.vue'),
    meta: { requiresAuth: false, title: '隐私政策' }
  },
  {
    path: '/disclaimer',
    name: 'Disclaimer',
    component: () => import('@/views/Disclaimer.vue'),
    meta: { requiresAuth: false, title: '免责声明' }
  },
  {
    path: '/',
    component: () => import('@/components/layout/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/ProductManage.vue'),
        meta: { title: '商品管理' }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/Statistics.vue'),
        meta: { title: '数据统计' }
      },
      {
        path: 'import-export',
        name: 'ImportExport',
        component: () => import('@/views/ImportExport.vue'),
        meta: { title: '导入导出' }
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('@/views/LogAudit.vue'),
        meta: { title: '日志审计', requiresAdmin: true }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/UserSettings.vue'),
        meta: { title: '用户设置' }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/CategoryManage.vue'),
        meta: { title: '分类管理' }
      },
      {
        path: 'reminder',
        name: 'Reminder',
        component: () => import('@/views/ReminderSetting.vue'),
        meta: { title: '过期提醒' }
      },
      {
        path: 'backup',
        name: 'Backup',
        component: () => import('@/views/BackupManage.vue'),
        meta: { title: '数据备份', requiresAdmin: true }
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('@/views/AdminManage.vue'),
        meta: { title: '系统管理', requiresAdmin: true }
      },
      // 404 页面
      {
        path: '404',
        name: 'NotFound',
        component: () => import('@/views/NotFound.vue'),
        meta: { title: '页面不存在' }
      }
    ]
  },
  // 兜底 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()

  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 商品保质期管理系统` : '商品保质期管理系统'

  // 检查是否需要认证
  if (to.meta.requiresAuth !== false) {
    if (!userStore.isLoggedIn) {
      // 保存目标路径，登录后跳转
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // 如果有 token 但没有用户信息，尝试获取
    if (!userStore.user) {
      try {
        await userStore.fetchUserInfo()
      } catch (error) {
        // 获取用户信息失败，跳转登录
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
        return
      }
    }
  }

  // 检查是否需要管理员权限
  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    ElMessage.warning('您没有权限访问该页面')
    next({ path: '/dashboard' })
    return
  }

  // 已登录用户访问登录/注册页，重定向到首页
  if (userStore.isLoggedIn && (to.path === '/login' || to.path === '/register')) {
    next({ path: '/dashboard' })
    return
  }

  next()
})

export default router
