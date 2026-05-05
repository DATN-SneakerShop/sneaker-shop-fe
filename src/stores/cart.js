import { defineStore } from 'pinia'
import { getCurrentCart } from '@/api/cart.api'

export const useCartStore = defineStore('cart', {
  state: () => ({
    totalItems: 0,
    loaded: false,
  }),

  actions: {
    async refreshCartCount() {
      try {
        const res = await getCurrentCart()
        const data = res.data || {}
        this.totalItems = Number(data.totalItems || 0)
        this.loaded = true
      } catch (error) {
        this.totalItems = 0
        this.loaded = true
      }
    },

    setCartCount(count) {
      this.totalItems = Number(count || 0)
      this.loaded = true
    },

    resetCart() {
      this.totalItems = 0
      this.loaded = true
    },
  },
})
