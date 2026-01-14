import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 1. Các trang công khai (Không có Sidebar/Header chung)
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: { isPublic: true }
    },
    {
      path: '/register',
      name: 'Register',
      component: Register,
      meta: { isPublic: true }
    },

    // 2. Các trang quản trị (Dùng chung MainLayout có Sidebar)
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '', // Trang chủ sau khi đăng nhập
          name: 'UserManagement',
          component: () => import('../views/UserManagement.vue')
        },
        {
          path: 'logs',
          name: 'AuditLog',
          component: () => import('../views/AuditLog.vue')
        },
        {
          path: 'profile',
          name: 'UserProfile',
          component: () => import('../views/UserProfile.vue')
        }
      ]
    }
  ]
})

// Giữ nguyên phần router.beforeEach cũ của bạn ở đây
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('accessToken');
  if (!to.meta.isPublic && !token) {
    next('/login');
  } else {
    next();
  }
});

export default router