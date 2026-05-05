import axios from 'axios'
import { message, Modal } from 'ant-design-vue'

import router from '../router'
import { pinia } from '../stores'
import { useAuthStore } from '../stores/auth'

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
})

api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore(pinia)
    const token = authStore.accessToken || localStorage.getItem('accessToken')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const authStore = useAuthStore(pinia)

    if (status === 401) {
      if (authStore.isAuthenticated) {
        message.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!')
      }
      authStore.clearSession()
      router.push('/login')
    } else if (status === 403) {
      Modal.error({
        title: 'CẢNH BÁO BẢO MẬT: TRUY CẬP TRÁI PHÉP!',
        content:
          'Bạn không có quyền thao tác trên Module này. Hệ thống đã ghi nhận hành vi vượt quyền của bạn vào nhật ký bảo mật (Mức độ: DANGER).',
        okText: 'Đã hiểu',
        okType: 'danger',
      })
    } else if (status === 500) {
      Modal.warning({
        title: 'LỖI HỆ THỐNG (500)',
        content:
          typeof error.response?.data === 'string'
            ? error.response.data
            : 'Đã xảy ra lỗi nghiêm trọng trên máy chủ. Máy quét đã ghi log (Mức độ: ERROR).',
        okText: 'Đóng',
      })
    }

    return Promise.reject(error)
  },
)

export default api
