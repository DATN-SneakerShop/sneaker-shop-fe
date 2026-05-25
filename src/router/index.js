import { createRouter, createWebHistory } from 'vue-router'
import { message } from 'ant-design-vue'

import MainLayout from '../layouts/MainLayout.vue'
import StorefrontLayout from '../layouts/StorefrontLayout.vue'
import ForgotPassword from '../views/login/ForgotPassword.vue'
import Login from '../views/login/Login.vue'
import Register from '../views/login/Register.vue'
import { pinia } from '../stores'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'Login', component: Login, meta: { isPublic: true, guestOnly: true } },
    { path: '/register', name: 'Register', component: Register, meta: { isPublic: true, guestOnly: true } },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: ForgotPassword,
      meta: { isPublic: true, guestOnly: true },
    },

    /* ================= WEB USER ================= */
    {
      path: '/trang-chu',
      component: StorefrontLayout,
      meta: { isPublic: true },
      children: [
        {
          path: '',
          name: 'StorefrontHome',
          component: () => import('../views/shop/HomePage.vue'),
          meta: { isPublic: true },
        },
        {
  path: '/gio-hang',
  name: 'StorefrontCart',
  component: () => import('../views/shop/CartView.vue'),
  meta: { isPublic: true },
},
{
  path: '/order-lookup',
  name: 'StorefrontOrderLookup',
  component: () => import('../views/shop/OrderLookupView.vue'),
  meta: { isPublic: true },
},
{
  path: '/thanh-toan',
  name: 'StorefrontCheckout',
  component: () => import('../views/shop/CheckoutView.vue'),
  meta: { isPublic: true },
},
{
  path: '/thanh-toan/thanh-cong',
  name: 'StorefrontCheckoutSuccess',
  component: () => import('../views/shop/CheckoutSuccessView.vue'),
  meta: { isPublic: true },
},
        {
  path: 'san-pham/:id',
  name: 'StorefrontProductDetail',
  component: () => import('../views/shop/ProductDetail.vue')
},
        {
          path: '/tai-khoan',
          name: 'StorefrontAccount',
          component: () => import('../views/shop/AccountView.vue'),
          meta: { requiresAuth: true },
        },
      ],
    },
    {
      path: '/account',
      redirect: '/tai-khoan',
      meta: { isPublic: true },
    },

    /* ================= ADMIN / BACKOFFICE ================= */
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'DashboardRedirect',
          redirect: () => {
            const authStore = useAuthStore(pinia)

            if (!authStore.isAuthenticated) return '/trang-chu'
            if (authStore.isAdmin) return '/users'
            if (authStore.isSales) return '/orders'

            return '/trang-chu'
          },
        },

        {
          path: 'users',
          name: 'UserManagement',
          component: () => import('../views/login/UserManagement.vue'),
          meta: { roles: ['ADMIN'] },
        },
        {
          path: 'profile',
          name: 'UserProfile',
          component: () => import('../views/login/UserProfile.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'logs',
          name: 'AuditLog',
          component: () => import('../views/login/AuditLog.vue'),
          meta: { roles: ['ADMIN'] },
        },

        {
          path: 'products',
          name: 'ProductList',
          component: () => import('../views/product/ProductList.vue'),
        },
        {
          path: 'products/:id',
          name: 'ProductDetail',
          component: () => import('../views/product/ProductDetail.vue'),
        },
        {
          path: 'categories',
          name: 'CategoryList',
          component: () => import('../views/product/CategoryList.vue'),
        },
        {
          path: 'variants/colors',
          name: 'ColorList',
          component: () => import('../views/product/variants/ColorList.vue'),
          meta: { roles: ['ADMIN'] },
        },
        {
          path: 'variants/sizes',
          name: 'SizeList',
          component: () => import('../views/product/variants/SizeList.vue'),
          meta: { roles: ['ADMIN'] },
        },
        {
          path: 'variants/materials',
          name: 'MaterialList',
          component: () => import('../views/product/variants/MaterialList.vue'),
          meta: { roles: ['ADMIN'] },
        },
        {
          path: 'variants/soles',
          name: 'SoleList',
          component: () => import('../views/product/variants/SoleList.vue'),
          meta: { roles: ['ADMIN'] },
        },
        {
          path: 'prices/groups',
          name: 'PriceGroup',
          component: () => import('../views/pricing/PriceGroup.vue'),
          meta: { roles: ['ADMIN'] },
        },
        {
          path: 'promotions',
          name: 'PromotionManagement',
          component: () => import('../views/promotion/PromotionManagement.vue'),
          meta: { roles: ['ADMIN'] },
        },
        {
          path: 'promotions/create',
          name: 'PromotionForm',
          component: () => import('../views/promotion/PromotionForm.vue'),
          meta: { roles: ['ADMIN'] },
        },
        {
          path: 'voucher',
          name: 'VoucherList',
          component: () => import('../views/voucher/VoucherList.vue'),
          meta: { roles: ['ADMIN'] },
        },
        {
          path: 'vouchers/create',
          name: 'VoucherCreate',
          component: () => import('../views/voucher/VoucherCreateView.vue'),
          meta: { roles: ['ADMIN'] },
        },
        {
          path: 'promotions/report',
          name: 'PromotionReport',
          component: () => import('../views/promotion/PromotionReport.vue'),
        },
        {
          path: 'promotions/dashboard',
          name: 'PromotionDashboard',
          component: () => import('../views/promotion/PromotionStatistic.vue'),
        },
        {
          path: 'customers',
          name: 'CustomerManagement',
          component: () => import('../views/customer/CustomerManagement.vue'),
        },
        {
          path: 'customers-rank',
          name: 'CustomerRankConfig',
          component: () => import('../views/customer/CustomerRankConfig.vue'),
          meta: { roles: ['ADMIN'] },
        },
        {
          path: 'customers/logs',
          name: 'CustomerAuditLog',
          component: () => import('../views/customer/CustomerAuditLog.vue'),
        },
        {
          path: 'customers-spending',
          name: 'CustomerSpending',
          component: () => import('../views/customer/CustomerSpending.vue'),
        },
        {
          path: 'customers-history',
          name: 'CustomerHistory',
          component: () => import('../views/customer/CustomerHistory.vue'),
        },
        {
          path: 'customers-vip',
          name: 'CustomerVip',
          component: () => import('../views/customer/CustomerVip.vue'),
        },
        {
          path: 'customers-dashboard',
          name: 'CustomerDashboard',
          component: () => import('../views/customer/CustomerDashboard.vue'),
        },
        {
          path: 'orders',
          name: 'OrderList',
          component: () => import('../views/order/OrderList.vue'),
        },
        {
          path: 'orders/dashboard',
          name: 'OrderDashboard',
          component: () => import('../views/order/OrderDashboard.vue'),
        },
        {
          path: 'orders/create',
          name: 'OrderCreate',
          component: () => import('../views/order/OrderCreate.vue'),
        },
        {
          path: 'orders/returns/report',
          name: 'OrderReturnReport',
          component: () => import('../views/order/ReturnReport.vue'),
          meta: { roles: ['ADMIN', 'SALES'] },
        },
        {
          path: 'orders/returns/:returnId',
          name: 'OrderReturnDetail',
          component: () => import('../views/order/ReturnRefundDetail.vue'),
          meta: { roles: ['ADMIN', 'SALES'] },
        },
        {
          path: 'orders/return-refunds',
          redirect: '/orders/returns/report',
          meta: { roles: ['ADMIN', 'SALES'] },
        },
        {
          path: 'orders/:id',
          name: 'OrderDetail',
          component: () => import('../views/order/OrderDetail.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore(pinia)
  authStore.restoreSession()

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next(authStore.getPostLoginRedirect())
  }

  if (!to.meta.isPublic && !authStore.isAuthenticated) {
    return next('/login')
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login')
  }

  if (to.meta.roles && !to.meta.roles.some((role) => authStore.userRoles.includes(role))) {
    message.warning('CẢNH BÁO: Bạn không đủ quyền truy cập khu vực này!')
    return to.path !== '/profile' ? next('/profile') : next()
  }

  next()
})

export default router
