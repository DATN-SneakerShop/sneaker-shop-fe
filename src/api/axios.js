import axios from 'axios';
import { message } from 'ant-design-vue';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // Giữ nguyên baseURL
  timeout: 10000, // Thêm timeout 10s để tránh treo request
});

// 1. Interceptor cho Request (Gửi Token đi)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Đảm bảo dùng dấu backtick (huyền) và có khoảng trắng sau Bearer
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. Interceptor cho Response (Xử lý lỗi tập trung)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nếu Backend trả về 401 (Hết hạn token) hoặc 403 (Không có quyền)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      message.error('Phiên đăng nhập hết hạn hoặc bạn không có quyền!');
      localStorage.clear(); // Xóa sạch token cũ
      window.location.href = '/login'; // Đá văng về trang login
    }
    return Promise.reject(error);
  }
);

export default api;