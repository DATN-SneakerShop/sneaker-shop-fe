import api from '@/api/axios'

// Lấy toàn bộ danh mục
export const getCategories = () => api.get('/categories')

// Lấy sản phẩm theo danh mục (phân trang)
export const getProductsByCategory = (id, params) =>
    api.get(`/categories/${id}/products`, { params })

// Xóa danh mục
export const deleteCategory = (id) => api.delete(`/categories/${id}`)

// Tạo danh mục mới
export const createCategory = (data) => api.post('/categories', data)

// Cập nhật danh mục
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data)