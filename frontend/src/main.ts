import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/global.scss'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus, { 
  locale: zhCn,
  // 全局配置
  size: 'default',
  zIndex: 3000,
  // Message 配置
  message: {
    duration: 3000,
    showClose: true,
    grouping: true,
    offset: 20
  }
})

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 从 localStorage 加载用户信息
const userStore = useUserStore()
userStore.loadFromStorage()

app.mount('#app')
