import api from '@/api/axios'

// Lấy danh sách category
export const getCategories = () => api.get('/categories')

// Thêm category
export const createCategory = (data) => api.post('/categories', data)
// Lấy sản phẩm theo category
export const getProductsByCategory = (id, params) =>
  api.get(`/categories/${id}/products`, { params })
// Cập nhật category
export const updateCategory = (id, data) =>
  api.put(`/categories/${id}`, data)

// Xóa category
export const deleteCategory = (id) =>
  api.delete(`/categories/${id}`)

