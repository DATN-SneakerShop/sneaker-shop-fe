import api from '@/api/axios'
import { getCartSessionKey } from '@/utils/cartSession'

function buildHeaders() {
  return {
    'X-Cart-Session-Key': getCartSessionKey(),
  }
}

export const getCurrentCart = () =>
  api.get('/v1/cart', {
    headers: buildHeaders(),
  })

export const addToCart = (payload) =>
  api.post('/v1/cart/items', payload, {
    headers: buildHeaders(),
  })

export const updateCartItemQuantity = (itemId, quantity) =>
  api.put(
    `/v1/cart/items/${itemId}/quantity`,
    { quantity },
    { headers: buildHeaders() },
  )

export const updateCartItemSelection = (itemId, selected) =>
  api.put(
    `/v1/cart/items/${itemId}/selection`,
    { selected },
    { headers: buildHeaders() },
  )

export const removeCartItem = (itemId) =>
  api.delete(`/v1/cart/items/${itemId}`, {
    headers: buildHeaders(),
  })

export const clearCart = () =>
  api.delete('/v1/cart/clear', {
    headers: buildHeaders(),
  })
