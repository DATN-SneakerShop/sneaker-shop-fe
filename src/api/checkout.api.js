import api from '@/api/axios'
import { getCartSessionKey } from '@/utils/cartSession'

function buildHeaders() {
  return {
    'X-Cart-Session-Key': getCartSessionKey(),
  }
}

export const previewCheckout = (payload) =>
  api.post('/v1/checkout/preview', payload, {
    headers: buildHeaders(),
  })

export const submitCheckout = (payload) =>
  api.post('/v1/checkout', payload, {
    headers: buildHeaders(),
  })

export const getSepayPaymentInfo = (orderCode, lookupCode) =>
  api.get(`/v1/sepay/payment-info/${orderCode}`, {
    params: { lookupCode },
  })
