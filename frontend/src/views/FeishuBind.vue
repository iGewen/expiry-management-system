<template>
  <div class="feishu-bind-container">
    <div class="bind-wrapper">
      <div class="bind-header">
        <img v-if="feishuAvatar" :src="feishuAvatar" class="avatar" />
        <h2>飞书账号绑定</h2>
        <p class="feishu-name">欢迎，{{ feishuName || '飞书用户' }}</p>
      </div>

      <div class="bind-options">
        <el-card class="option-card" @click="showBindDialog = true">
          <div class="option-icon">🔗</div>
          <h3>绑定已有账号</h3>
          <p>使用已有的用户名和密码登录，绑定飞书账号</p>
        </el-card>

        <el-card class="option-card" @click="createNewAccount">
          <div class="option-icon">✨</div>
          <h3>创建新账号</h3>
          <p>使用飞书信息创建新账号，快速开始使用</p>
        </el-card>
      </div>

      <div class="bind-footer">
        <el-button text @click="cancelBind">取消</el-button>
      </div>
    </div>

    <!-- 绑定已有账号对话框 -->
    <el-dialog v-model="showBindDialog" title="绑定已有账号" width="400px">
      <el-form :model="bindForm" :rules="bindRules" ref="bindFormRef">
        <el-form-item prop="username">
          <el-input v-model="bindForm.username" placeholder="用户名" size="large">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="bindForm.password"
            type="password"
            placeholder="密码"
            size="large"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBindDialog = false">取消</el-button>
        <el-button type="primary" :loading="bindLoading" @click="bindExistingAccount">
          绑定并登录
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { authApi } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const feishuName = ref('')
const feishuAvatar = ref('')
const tempToken = ref('')

const showBindDialog = ref(false)
const bindLoading = ref(false)
const bindFormRef = ref<FormInstance>()

const bindForm = reactive({
  username: '',
  password: ''
})

const bindRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

onMounted(() => {
  // 从 URL 获取飞书用户信息
  feishuName.value = route.query.feishuName as string || ''
  feishuAvatar.value = route.query.feishuAvatar as string || ''
  tempToken.value = route.query.tempToken as string || ''

  if (!tempToken.value) {
    ElMessage.error('授权信息已过期，请重新登录')
    router.push('/login')
  }
})

// 绑定已有账号
const bindExistingAccount = async () => {
  if (!bindFormRef.value) return

  await bindFormRef.value.validate(async (valid) => {
    if (!valid) return

    bindLoading.value = true
    try {
      const res = await authApi.bindFeishuAccount({
        tempToken: tempToken.value,
        username: bindForm.username,
        password: bindForm.password
      })

      if (res.success && res.data) {
        userStore.setUser(res.data.user)
        userStore.setToken(res.data.token, res.data.refreshToken)
        ElMessage.success('绑定成功，欢迎回来！')
        router.push('/')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '绑定失败')
    } finally {
      bindLoading.value = false
    }
  })
}

// 创建新账号
const createNewAccount = async () => {
  try {
    const res = await authApi.createFeishuAccount(tempToken.value)

    if (res.success && res.data) {
      userStore.setUser(res.data.user)
      userStore.setToken(res.data.token, res.data.refreshToken)
      ElMessage.success('账号创建成功！')
      router.push('/')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '创建账号失败')
  }
}

// 取消绑定
const cancelBind = () => {
  router.push('/login')
}
</script>

<style scoped lang="scss">
.feishu-bind-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #E6F7FF 0%, #BAE7FF 50%, #91D5FF 100%);
}

.bind-wrapper {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90%;
}

.bind-header {
  text-align: center;
  margin-bottom: 30px;

  .avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin-bottom: 16px;
  }

  h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    color: #303133;
  }

  .feishu-name {
    margin: 0;
    color: #909399;
    font-size: 14px;
  }
}

.bind-options {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 600px) {
    flex-direction: column;
  }
}

.option-card {
  flex: 1;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  padding: 24px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  .option-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    color: #303133;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: #909399;
  }
}

.bind-footer {
  text-align: center;
}
</style>
