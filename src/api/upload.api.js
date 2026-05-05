import api from '@/api/axios'

// Upload ảnh tạm (preview)
export const uploadProductImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)

  return api.post('/product-images/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// Gắn ảnh vào product
export const attachProductImage = (productId, data) =>
  api.post(`/products/${productId}/images`, data)

// Lấy ảnh theo product
export const getProductImages = (productId) => api.get(`/products/${productId}/images`)

// Set thumbnail
export const setThumbnail = (imageId) => api.put(`/product-images/${imageId}/thumbnail`)

// Xoá ảnh
export const deleteProductImage = (imageId) => api.delete(`/product-images/${imageId}`)