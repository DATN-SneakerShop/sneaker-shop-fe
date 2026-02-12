import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // PUBLIC
    { path: '/login', name: 'Login', component: Login, meta: { isPublic: true } },
    { path: '/register', name: 'Register', component: Register, meta: { isPublic: true } },

    // MAIN LAYOUT
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'UserManagement',
          component: () => import('../views/UserManagement.vue'),
        },
        {
          path: 'categories/:id/products',
          name: 'ProductsByCategory',
          component: () => import('@/views/ProductList.vue'),
        },
        {
          path: 'products',
          name: 'ProductList',
          component: () => import('@/views/ProductList.vue'),
        },
        {
          path: 'products/:id',
          name: 'ProductDetail',
          component: () => import('@/views/ProductDetail.vue'),
        },
        {
          path: 'categories',
          name: 'CategoryList',
          component: () => import('@/views/CategoryList.vue'),
        },
        {
          path: 'profile',
          name: 'UserProfile',
          component: () => import('../views/UserProfile.vue'),
        },
        {
          path: 'logs',
          name: 'AuditLog',
          component: () => import('../views/AuditLog.vue'),
        },
      ],
    },
  ],
})

// AUTH GUARD
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('accessToken')
  if (!to.meta?.isPublic && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
