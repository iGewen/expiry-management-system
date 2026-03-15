import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
// 按需引入时，只需要引入样式
import 'element-plus/dist/index.css'
import './styles/global.css'
// 图标仍然需要全局注册（按需引入插件不处理图标）
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus, {
  locale: zhCn
})

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 从 localStorage 加载用户信息
const userStore = useUserStore()
userStore.loadFromStorage()

app.mount('#app')
