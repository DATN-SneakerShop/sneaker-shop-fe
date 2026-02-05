import axios from 'axios';
import { message } from 'ant-design-vue';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      message.error('Phiên đăng nhập hết hạn!');
      localStorage.clear();
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      message.error('CẢNH BÁO: Hành động này bị hệ thống chặn do sai quyền!');
    }
    return Promise.reject(error);
  }
);

export default api;