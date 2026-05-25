import api from '@/api/axios'

export const createReturnRequest = (payload) => api.post('/returns', payload)
export const getMyReturnRequests = () => api.get('/returns/my')
export const getMyReturnRequestDetail = (id) => api.get(`/returns/${id}`)

export const listAdminReturnRequests = (params = {}) => api.get('/admin/returns', { params })
export const createAdminReturnRequest = (payload) => api.post('/admin/returns', payload)
export const getAdminReturnRequestDetail = (id) => api.get(`/admin/returns/${id}`)
export const approveReturnRequest = (id, payload = {}) => api.put(`/admin/returns/${id}/approve`, payload)
export const rejectReturnRequest = (id, payload = {}) => api.put(`/admin/returns/${id}/reject`, payload)
export const receiveReturnRequest = (id, payload = {}) => api.put(`/admin/returns/${id}/receive`, payload)
export const refundReturnRequest = (id, payload = {}) => api.put(`/admin/returns/${id}/refund`, payload)
export const completeReturnRequest = (id) => api.put(`/admin/returns/${id}/complete`)
