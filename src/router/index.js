import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
// ĐÃ SỬA: Trỏ đúng vào folder login
import Login from '../views/login/Login.vue'
import Register from '../views/login/Register.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'Login', component: Login, meta: { isPublic: true } },
    { path: '/register', name: 'Register', component: Register, meta: { isPublic: true } },
    {
      path: '/',
      component: MainLayout,
      children: [
        // ĐÃ SỬA: Import từ folder login cho khớp cấu trúc mới
        { path: '', name: 'UserManagement', component: () => import('../views/login/UserManagement.vue') },
        { path: 'profile', name: 'UserProfile', component: () => import('../views/login/UserProfile.vue') },
        { path: 'logs', name: 'AuditLog', component: () => import('../views/login/AuditLog.vue') }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('accessToken')
  if (!to.meta.isPublic && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router