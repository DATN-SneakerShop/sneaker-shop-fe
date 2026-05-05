<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="login-header">
        <h2 class="brand-title">SNEAKER SHOP</h2>
        <p class="sub-title">Đăng nhập hệ thống quản lý</p>
      </div>

      <a-alert
        v-if="isSuspicious"
        type="error"
        show-icon
        message="Cảnh báo truy cập bất thường!"
        description="Bạn đã nhập sai thông tin nhiều lần. Hệ thống đã ghi nhận IP của bạn."
        style="margin-bottom: 16px; font-weight: bold"
      />

      <a-form :model="loginForm" :rules="rules" ref="formRef" layout="vertical" @finish="handleLogin">
        <a-form-item label="Email đăng nhập" name="username">
          <a-input v-model:value="loginForm.username" size="large" placeholder="Nhập email">
            <template #prefix><user-outlined style="color: rgba(0, 0, 0, 0.25)" /></template>
          </a-input>
        </a-form-item>

        <a-form-item label="Mật khẩu" name="password">
          <a-input-password v-model:value="loginForm.password" size="large" placeholder="Nhập mật khẩu">
            <template #prefix><lock-outlined style="color: rgba(0, 0, 0, 0.25)" /></template>
          </a-input-password>
        </a-form-item>

        <a-button type="primary" :loading="loading" block size="large" html-type="submit" class="login-submit-btn">
          ĐĂNG NHẬP
        </a-button>

        <div class="divider"><span>HOẶC</span></div>
        <div id="google-btn" style="display: flex; justify-content: center; margin-bottom: 16px"></div>

        <div class="auth-footer">
          <router-link to="/forgot-password" class="forgot-link">Quên mật khẩu?</router-link>
          <div class="register-hint">
            Chưa có tài khoản? <router-link to="/register">Đăng ký ngay</router-link>
          </div>
        </div>
      </a-form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { LockOutlined, UserOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'

import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'

const GOOGLE_CLIENT_ID = '1090844427851-g1hfpluc79irjnftmvn620m8g261rfct.apps.googleusercontent.com'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const loginForm = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: 'Vui lòng nhập Email!' }],
  password: [{ required: true, message: 'Vui lòng nhập mật khẩu!' }],
}

const failedAttempts = ref(0)
const isSuspicious = computed(() => failedAttempts.value >= 3)
let googleScriptEl = null

const mapAuthResponse = (payload = {}) => ({
  accessToken: payload.accessToken || payload.token || '',
  user: {
    id: payload.id ?? payload.userId ?? null,
    username: payload.username || loginForm.username || '',
    fullName: payload.fullName || payload.name || '',
    email: payload.email || loginForm.username || '',
    roles: payload.roles || payload.roleNames || payload.authorities || [],
  },
})

const redirectAfterLogin = () => {
  router.push(authStore.getPostLoginRedirect())
}

const applyLoginSession = async (payload) => {
  authStore.setLoginSession(mapAuthResponse(payload))
  await authStore.fetchCurrentUser()
  failedAttempts.value = 0
}

const initializeGoogleButton = () => {
  if (!window.google?.accounts?.id) return

  const googleButton = document.getElementById('google-btn')
  if (!googleButton) return

  googleButton.innerHTML = ''

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleLogin,
  })

  window.google.accounts.id.renderButton(googleButton, {
    theme: 'outline',
    size: 'large',
    width: '320',
  })
}

const ensureGoogleScript = () => {
  if (window.google?.accounts?.id) {
    initializeGoogleButton()
    return
  }

  googleScriptEl = document.querySelector('script[data-google-identity="true"]')

  if (!googleScriptEl) {
    googleScriptEl = document.createElement('script')
    googleScriptEl.src = 'https://accounts.google.com/gsi/client'
    googleScriptEl.async = true
    googleScriptEl.defer = true
    googleScriptEl.dataset.googleIdentity = 'true'
    document.head.appendChild(googleScriptEl)
  }

  googleScriptEl.addEventListener('load', initializeGoogleButton, { once: true })
}

const handleGoogleLogin = async (response) => {
  try {
    loading.value = true
    const res = await api.post('/auth/google', { credential: response.credential })

    await applyLoginSession(res.data)
    message.success(`Đăng nhập Google thành công! Chào mừng ${authStore.userName}`)
    redirectAfterLogin()
  } catch (err) {
    message.error(err.response?.data || 'Xác thực Google thất bại!')
  } finally {
    loading.value = false
  }
}

const handleLogin = async () => {
  try {
    loading.value = true
    const res = await api.post('/auth/login', loginForm)

    await applyLoginSession(res.data)
    message.success(`Chào mừng ${authStore.userName}!`)
    redirectAfterLogin()
  } catch (err) {
    failedAttempts.value += 1

    if (failedAttempts.value >= 3) {
      message.error('Phát hiện truy cập bất thường!')
    } else {
      message.error(err.response?.data || 'Sai tài khoản hoặc mật khẩu!')
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    redirectAfterLogin()
    return
  }

  ensureGoogleScript()
})

onUnmounted(() => {
  googleScriptEl?.removeEventListener?.('load', initializeGoogleButton)
})
</script>

<style scoped>
.login-wrapper {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f2f5;
}
.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.brand-title {
  color: #1890ff;
  font-weight: bold;
  text-align: center;
  margin-bottom: 5px;
}
.sub-title {
  text-align: center;
  color: #666;
  margin-bottom: 20px;
}
.auth-footer {
  margin-top: 10px;
  text-align: center;
}
.forgot-link {
  color: #ff4d4f;
  display: block;
  margin-bottom: 10px;
}
.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
  color: #999;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e8e8e8;
}
.divider span {
  padding: 0 10px;
  font-size: 13px;
}
</style>
