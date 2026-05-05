import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    cartCount: 0,
  }),

  getters: {
    resolvedCartItemCount: (state) => Number(state.cartCount || 0),
  },

  actions: {
    setCartCount(count) {
      this.cartCount = Number(count || 0)
    },

    resetCart() {
      this.cartCount = 0
    },
  },
})
