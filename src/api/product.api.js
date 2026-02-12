import api from '@/api/axios'
import qs from 'qs'

// ================= BASIC =================

// Danh sách sản phẩm (paging)
export const getProducts = (params) => api.get('/products', { params })

// Tạo sản phẩm (kèm variants + categoryIds)
export const createProduct = (data) => api.post('/products', data)

// Chi tiết sản phẩm (FULL: info + images + variants)
export const getProductDetail = (id) => api.get(`/products/${id}`)

// ================= ADVANCED SEARCH =================

export const searchProductsAdvanced = (params) =>
  api.get('/products/search', {
    params,
    paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
  })
// Cập nhật sản phẩm
export const updateProduct = (id, data) =>
  api.put(`/products/${id}`, data)

// Xóa sản phẩm
export const deleteProduct = (id) =>
  api.delete(`/products/${id}`)
