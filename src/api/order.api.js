import api from '@/api/axios'

export const createOrder = (payload) => api.post('/orders', payload)
export const listOrders = (params = {}) => api.get('/orders', { params })
export const listOrdersByDate = (date) => api.get('/orders/by-date', { params: { date } })
export const getOrderDetail = (id) => api.get(`/orders/${id}`)
export const updateOrder = (id, payload) => api.put(`/orders/${id}`, payload)
export const cancelOrder = (id, payload) => api.post(`/orders/${id}/cancel`, payload)
export const deleteOrder = (id) => api.delete(`/orders/${id}`)
export const addOrderItems = (id, items) => api.post(`/orders/${id}/items`, items)
export const updateOrderItemQty = (id, itemId, payload) => api.put(`/orders/${id}/items/${itemId}`, payload)
export const applyReturn = (id, payload) => api.post(`/orders/${id}/returns`, payload)
export const updateOrderStatus = (id, payload) => api.patch(`/orders/${id}/status`, payload)
export const listOrdersByCustomer = (customerId) => api.get(`/orders/by-customer/${customerId}`)
export const listOrdersByStaff = (createdById) => api.get(`/orders/by-staff/${createdById}`)
export const returnReport = (params = {}) => api.get('/orders/returns/report', { params })

export const getOrdersDashboard = () => api.get('/orders/dashboard')
export const getOrdersByStaffStats = () => api.get('/orders/stats/by-staff')
export const getRevenueByCustomer = () => api.get('/orders/stats/revenue/by-customer')
export const getRevenueDaily = (params = {}) => api.get('/orders/stats/revenue/daily', { params })
export const getRevenueWeekly = (params = {}) => api.get('/orders/stats/revenue/weekly', { params })
export const getRevenueMonthly = (params = {}) => api.get('/orders/stats/revenue/monthly', { params })
export const getTopProducts = () => api.get('/orders/stats/top-products')
export const getReturnedProducts = () => api.get('/orders/stats/returned-products')

export const getOrderEmailPreview = (id) => api.get(`/orders/${id}/email-preview`)
export const sendOrderConfirmation = (id) => api.post(`/orders/${id}/send-confirmation-email`)

export const exportOrderPdf = (id) =>
  api.get(`/orders/${id}/export-pdf`, { responseType: 'blob' })

export const exportOrdersPdf = (params = {}) =>
  api.get('/orders/export-pdf', { params, responseType: 'blob' })

export const getOrderPrintHtml = (id) =>
  api.get(`/orders/${id}/print`, { responseType: 'text' })

export const printOrderHtmlUrl = (id) => `${api.defaults.baseURL}/orders/${id}/print`

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}
