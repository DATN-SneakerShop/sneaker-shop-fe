import api from '@/api/axios'
import qs from 'qs'

/* ================= QUẢN LÝ SẢN PHẨM (ADMIN) ================= */
export const getProducts = (params) => api.get('/admin/products', { params })
export const createProduct = (data) => api.post('/admin/products', data)
export const getProductDetail = (id) => api.get(`/admin/products/${id}`)
export const updateProduct = (id, data) => api.put(`/admin/products/${id}`, data)
export const deleteProduct = (id) => api.delete(`/admin/products/${id}`)

export const searchProductsAdvanced = (params) =>
  api.get('/admin/products/search', {
    params,
    paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
  })

export const updateProductStatus = (id, status) =>
  api.put(`/admin/products/${id}/status`, null, { params: { status } })

/* ================= MASTER DATA (BIẾN THỂ) ================= */
export const getSizes = () => api.get('/admin/sizes')
export const saveSize = (data) =>
  data.id ? api.put(`/admin/sizes/${data.id}`, data) : api.post('/admin/sizes', data)
export const deleteSize = (id) => api.delete(`/admin/sizes/${id}`)

export const getMaterials = () => api.get('/admin/materials')
export const saveMaterial = (data) =>
  data.id ? api.put(`/admin/materials/${data.id}`, data) : api.post('/admin/materials', data)
export const deleteMaterial = (id) => api.delete(`/admin/materials/${id}`)

export const getSoles = () => api.get('/admin/soles')
export const saveSole = (data) =>
  data.id ? api.put(`/admin/soles/${data.id}`, data) : api.post('/admin/soles', data)
export const deleteSole = (id) => api.delete(`/admin/soles/${id}`)

export const getColors = () => api.get('/admin/colors')
export const saveColor = (data) =>
  data.id ? api.put(`/admin/colors/${data.id}`, data) : api.post('/admin/colors', data)
export const deleteColor = (id) => api.delete(`/admin/colors/${id}`)

/* ================= STOREFRONT FILTER ================= */
export const getStorefrontColors = () => api.get('/storefront/colors')
export const getStorefrontSizes = () => api.get('/storefront/sizes')

/* ================= DÙNG CHO KHUYẾN MÃI ================= */
export const getVariantsByProduct = (productId) =>
  api.get(`/admin/promotion-products/${productId}/variants`).then(res => res.data)

export const getPromotionProducts = () => api.get('/admin/promotion-products')

export const getStorefrontHomeProducts = () => api.get('/products/home')
export const getStorefrontProductDetail = (id) => api.get(`/products/${id}`)
