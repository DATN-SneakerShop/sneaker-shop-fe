import api from '@/api/axios'

export const lookupOrder = (keyword, contact) =>
  api.get('/storefront/orders/lookup', {
    params: { keyword, contact },
  })
