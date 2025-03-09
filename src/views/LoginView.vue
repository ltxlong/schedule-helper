<template>
  <div class="login-container">
    <el-card class="login-card">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">排班表助手</h1>
      </div>
      <el-form class="login-form" @submit.prevent="handleLogin">
        <el-form-item class="mb-4">
          <el-input
            v-model="password"
            type="password"
            placeholder="请输入访问密码"
            :prefix-icon="Lock"
            class="login-input"
          />
        </el-form-item>
        <el-form-item class="mb-0">
          <el-button 
            type="primary" 
            class="login-button"
            @click.prevent="handleLogin"
          >
            <template #icon>
              <el-icon class="el-icon--left"><Right /></el-icon>
            </template>
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, Right } from '@element-plus/icons-vue'
import { validatePassword } from '../router/index'

const router = useRouter()
const password = ref('')

const handleLogin = async () => {
  const isValid = await validatePassword(password.value)
  if (isValid) {
    // 设置cookie，有效期为7天
    document.cookie = "authenticated=true; path=/; max-age=604800; SameSite=Strict";
    router.push('/')
    ElMessage({
      type: 'success',
      message: '登录成功'
    })
  } else {
    await ElMessage.error('密码错误，请重试')
  }
}
</script>

<style>
/* 重置 Element Plus 的默认样式 */
.el-card {
  --el-card-padding: 0;
  width: auto !important;
  max-width: none !important;
}
</style>

<style scoped>
.login-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  padding: 1rem;
  min-height: 100vh;
  height: 100vh;
  width: 100vw;
}

.login-card {
  width: 100% !important;
  max-width: 384px !important;
  margin: 0 auto;
}

.login-card :deep(.el-card__body) {
  padding: 2rem !important;
  width: 100% !important;
}

.login-form {
  width: 100%;
}

.login-form :deep(.el-form-item__content) {
  @apply flex flex-col;
  width: 100%;
}

.login-input {
  width: 100% !important;
}

.login-input :deep(.el-input__wrapper) {
  @apply shadow-sm hover:shadow transition-shadow duration-200 !important;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
  width: 100% !important;
}

.login-button {
  @apply w-full h-10 text-base rounded-lg !important;
  background: linear-gradient(to right, #4f46e5, #4338ca) !important;
}

.login-button:hover {
  background: linear-gradient(to right, #4338ca, #3730a3) !important;
}

:deep(.el-card) {
  border-radius: 0.75rem !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
  width: 100% !important;
}

/* 确保所有表单元素都是全宽的 */
:deep(.el-input),
:deep(.el-form-item),
:deep(.el-button) {
  width: 100% !important;
}
</style>
