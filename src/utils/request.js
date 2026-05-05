import axios from 'axios'
import { message } from 'ant-design-vue'

const request = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000
})

// ✅ REQUEST INTERCEPTOR (QUAN TRỌNG)
request.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken') // 🔥 ĐÚNG KEY
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// RESPONSE
request.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 403) {
      message.error('Bạn không có quyền thực hiện thao tác này')
    } else {
      message.error(
        error.response?.data?.message || 'Lỗi hệ thống'
      )
    }
    return Promise.reject(error)
  }
)

export default request
