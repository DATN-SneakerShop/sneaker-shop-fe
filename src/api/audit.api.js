import api from './axios';

// API lấy toàn bộ log (cũ)
export const getSystemLogs = () => {
    return api.get('/management/logs');
};

// 🔥 [TEAM NOTE] - MỚI THÊM: API Lọc log nâng cao từ Backend
export const filterSystemLogs = (params) => {
    return api.get('/management/logs/filter', { params });
};

// 🔥 [TEAM NOTE] - MỚI THÊM: API Lấy báo cáo thống kê log theo User
export const getUserLogReport = () => {
    return api.get('/management/logs/report/user');
};
