import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import Login from '../views/login/Login.vue'
import Register from '../views/login/Register.vue'
import ForgotPassword from '../views/login/ForgotPassword.vue'
import { message } from 'ant-design-vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'Login', component: Login, meta: { isPublic: true } },
    { path: '/register', name: 'Register', component: Register, meta: { isPublic: true } },
    { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPassword, meta: { isPublic: true } },
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'DashboardRedirect',
          redirect: to => {
            const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
            return roles.includes('ADMIN') ? '/users' : '/profile';
          }
        },
        {
          path: 'users',
          name: 'UserManagement',
          component: () => import('../views/login/UserManagement.vue'),
          meta: { roles: ['ADMIN'] }
        },
        {
          path: 'profile',
          name: 'UserProfile',
          component: () => import('../views/login/UserProfile.vue')
        },
        {
          path: 'logs',
          name: 'AuditLog',
          component: () => import('../views/login/AuditLog.vue'),
          meta: { roles: ['ADMIN', 'INVENTORY'] }
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('accessToken')
  const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]')

  if (!to.meta.isPublic && !token) {
    next('/login')
  } else if (to.meta.roles && !to.meta.roles.some(r => userRoles.includes(r))) {
    message.error('CẢNH BÁO: Truy cập trái phép! Bạn không có quyền vào đây.')
    next('/profile')
  } else {
    next()
  }
})

export default router