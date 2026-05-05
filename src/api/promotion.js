// promotions.js
import request from '@/utils/request'

export const getPromotions = () => {
  return request.get('/admin/promotions')
}

export const getPromotionDetail = (id) => {
  return request.get(`/admin/promotions/${id}`)
}

export const createPromotion = (data) => {
  return request.post('/admin/promotions', data)
}

export const updatePromotion = (id, data) => {
  return request.put(`/admin/promotions/${id}`, data)
}

export const togglePromotionApi = (id, active) => {
  return request.patch(`/admin/promotions/${id}/toggle`, null, {
    params: { active }
  })
}

export const deletePromotion = (id) => {
  return request.delete(`/admin/promotions/${id}`)
}
export const getActivePromotionReport = () => {
  return request.get('/reports/promotions/active')
}
export const getPromotionDashboard = () => {
  return request.get('/reports/promotion-dashboard').then(res => res.data || res)
}

