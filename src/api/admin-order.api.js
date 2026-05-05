import api from '@/api/axios'

export const listAdminOrders = (params = {}) => api.get('/admin/orders', { params })
export const getAdminOrderDetail = (id) => api.get(`/admin/orders/${id}`)
export const updateAdminOrderMeta = (id, payload) => api.put(`/admin/orders/${id}`, payload)
export const updateAdminOrderStatus = (id, payload) => api.patch(`/admin/orders/${id}/status`, payload)
export const cancelAdminOrder = (id, payload) => api.post(`/admin/orders/${id}/cancel`, payload)
export const applyAdminOrderReturn = (id, payload) => api.post(`/admin/orders/${id}/returns`, payload)

export const getAdminOrderCounterPaymentQr = (id) => api.get(`/admin/orders/${id}/counter-payment-qr`)
