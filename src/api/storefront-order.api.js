import api from '@/api/axios'

export const getMyOrders = () => api.get('/storefront/orders/my')

export const getMyOrderDetail = (orderId) => api.get(`/storefront/orders/my/${orderId}`)
