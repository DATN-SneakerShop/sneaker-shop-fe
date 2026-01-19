import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'Login', component: Login, meta: { isPublic: true } },
    { path: '/register', name: 'Register', component: Register, meta: { isPublic: true } },
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', name: 'UserManagement', component: () => import('../views/UserManagement.vue') },
        { path: 'profile', name: 'UserProfile', component: () => import('../views/UserProfile.vue') },
        { path: 'logs', name: 'AuditLog', component: () => import('../views/AuditLog.vue') }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('accessToken');
  if (!to.meta.isPublic && !token) {
    next('/login');
  } else {
    next();
  }
});

export default router;