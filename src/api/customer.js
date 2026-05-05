import api from '@/api/axios'

// 1. Lấy danh sách tài khoản
export const getAllUsers = () => api.get('/management/users')

// 2. CÁC HÀM NGHIỆP VỤ KHÁCH HÀNG (Đã thêm 2 hàm mới)
export const getAllCustomers = () => api.get('/khach-hang')
export const filterCustomersByRank = (params) => api.get('/khach-hang/filter', { params })
export const searchCustomers = (keyword) => api.get('/khach-hang/search', { params: { keyword } })
export const deleteCustomer = (id) => api.delete(`/khach-hang/${id}`)
export const clearAllCustomerData = () => api.delete('/khach-hang/all')
export const updateCustomer = (id, data) => api.put(`/khach-hang/${id}`, data)

// 3. ĐỊA CHỈ KHÁCH HÀNG
export const getCustomerAddresses = (customerId) => api.get(`/khach-hang/${customerId}/dia-chi`)
export const saveCustomerAddress = (data) => api.post(`/khach-hang/${data.customerId}/dia-chi`, data)
export const deleteCustomerAddress = (id) => api.delete(`/khach-hang/dia-chi/${id}`)

// 4. CẤU HÌNH HẠNG & ĐIỂM
export const getCustomerRanks = () => api.get('/customer-ranks')
export const createCustomerRank = (data) => api.post('/customer-ranks', data)
export const updateCustomerRank = (id, data) => api.put(`/customer-ranks/${id}`, data)
export const deleteCustomerRank = (id) => api.delete(`/customer-ranks/${id}`)
