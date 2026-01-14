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
    const status = error.response?.status;
    if (status === 401) {
      message.error('Phiên hết hạn, vui lòng đăng nhập lại');
      localStorage.clear();
      window.location.href = '/login';
    } else if (status === 403) {
      message.warning('Bạn không có quyền thực hiện hành động này!');
    }
    return Promise.reject(error);
  }
);

export default api;