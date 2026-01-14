import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import Login from '../views/Login.vue'
import { message } from 'ant-design-vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'Login', component: Login, meta: { isPublic: true } },
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', name: 'UserManagement', component: () => import('../views/UserManagement.vue') },
        { path: 'logs', name: 'AuditLog', component: () => import('../views/AuditLog.vue') },
        { path: 'profile', name: 'UserProfile', component: () => import('../views/UserProfile.vue') }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('accessToken');
  const userRole = localStorage.getItem('userRole');

  if (!to.meta.isPublic && !token) {
    next('/login');
  } else if (to.path === '/logs' && userRole !== 'ADMIN') {
    message.error('Bạn không có quyền truy cập nhật ký hệ thống!');
    next('/');
  } else {
    next();
  }
});

export default router;