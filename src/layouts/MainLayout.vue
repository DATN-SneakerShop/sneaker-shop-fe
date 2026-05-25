<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider v-model:collapsed="collapsed" breakpoint="lg" collapsed-width="0" :style="{
      overflow: 'auto',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 1001
    }" @breakpoint="onBreakpoint">
      <div class="logo"
        style="height: 32px; margin: 16px; background: rgba(255, 255, 255, 0.3); color: white; text-align: center; line-height: 32px; font-weight: bold;">
        SNEAKER SHOP
      </div>

      <a-menu v-model:selectedKeys="activeKey" v-model:openKeys="openKeys" theme="dark" mode="inline">
        <a-menu-item v-if="roles.includes('ADMIN')" key="users">
          <template #icon><user-outlined /></template>
          <router-link to="/users">Quản lý tài khoản</router-link>
        </a-menu-item>

        <a-sub-menu key="sub-product">
          <template #icon><shopping-outlined /></template>
          <template #title>Quản lý Sản phẩm</template>
          <a-menu-item key="products">
            <router-link to="/products">Danh sách sản phẩm</router-link>
          </a-menu-item>
          <a-menu-item key="categories">
            <router-link to="/categories">Danh mục sản phẩm</router-link>
          </a-menu-item>

          <a-sub-menu key="sub-variants" title="Quản lý biến thể">
            <a-menu-item key="v-color">
              <router-link to="/variants/colors">🎨 Màu sắc</router-link>
            </a-menu-item>
            <a-menu-item key="v-size">
              <router-link to="/variants/sizes">📏 Kích cỡ</router-link>
            </a-menu-item>
            <a-menu-item key="v-material">
              <router-link to="/variants/materials">🧶 Chất liệu</router-link>
            </a-menu-item>
            <a-menu-item key="v-sole">
              <router-link to="/variants/soles">👟 Loại đế</router-link>
            </a-menu-item>
          </a-sub-menu>
        </a-sub-menu>

        <a-sub-menu key="sub-promotion">
          <template #icon><percentage-outlined /></template>
          <template #title>Khuyến mãi</template>
          <a-menu-item key="promotions">
            <router-link to="/promotions">Đợt giảm giá</router-link>
          </a-menu-item>
          <a-menu-item key="voucher">
            <router-link to="/voucher">Voucher</router-link>
          </a-menu-item>
         <a-menu-item key="promotion-report">
    <router-link to="/promotions/report">Khuyến mãi hoạt động</router-link>
  </a-menu-item>
  <a-menu-item key="promotions-dashboard">
            <router-link to="/promotions/dashboard">Thống kê Khuyến mãi</router-link>
          </a-menu-item>
        </a-sub-menu>

        <a-sub-menu key="sub-customer">
          <template #icon><team-outlined /></template>
          <template #title>Quản lý Khách Hàng</template>
          <a-menu-item key="customers">
            <router-link to="/customers">Danh sách khách hàng</router-link>
          </a-menu-item>
          <a-menu-item key="customers-rank">
            <router-link to="/customers-rank">Cấu hình Hạng & Điểm</router-link>
          </a-menu-item>
          <a-menu-item key="customers-spending">
            <router-link to="/customers-spending">Thông tin chi tiêu</router-link>
          </a-menu-item>
          <a-menu-item key="customers-history">
            <router-link to="/customers-history">Lịch sử giao dịch</router-link>
          </a-menu-item>
          <a-menu-item key="customers-vip">
            <router-link to="/customers-vip">Danh sách khách VIP</router-link>
          </a-menu-item>
          <a-menu-item key="customers-dashboard">
            <router-link to="/customers-dashboard">Dashboard Khách Hàng</router-link>
          </a-menu-item>
        </a-sub-menu>

        <a-sub-menu key="sub-order">
          <template #icon><shopping-cart-outlined /></template>
          <template #title>Quản lý Đơn hàng</template>
          <a-menu-item key="orders">
            <router-link to="/orders">Danh sách đơn hàng</router-link>
          </a-menu-item>
          <a-menu-item key="orders-dashboard">
            <router-link to="/orders/dashboard">Dashboard đơn hàng</router-link>
          </a-menu-item>
          <a-menu-item key="order-create">
            <router-link to="/orders/create">Tạo đơn hàng</router-link>
          </a-menu-item>
          <a-menu-item key="order-return-refunds">
            <router-link to="/orders/return-refunds">Trả hàng hoàn tiền</router-link>
          </a-menu-item>
          <a-menu-item key="order-returns">
            <router-link to="/orders/returns/report">Báo cáo hoàn trả</router-link>
          </a-menu-item>
        </a-sub-menu>

        <a-menu-item v-if="roles.includes('ADMIN') || roles.includes('SALES')" key="admin-chat">
          <template #icon><message-outlined /></template>
          <router-link to="/admin/chat">Tin nhắn khách hàng</router-link>
        </a-menu-item>

        <a-menu-item v-if="roles.includes('ADMIN')" key="logs">
          <template #icon><history-outlined /></template>
          <router-link to="/logs">Nhật ký hệ thống</router-link>
        </a-menu-item>

        <a-menu-item key="profile">
          <template #icon><user-outlined /></template>
          <router-link to="/profile">Hồ sơ cá nhân</router-link>
        </a-menu-item>

        <a-menu-divider />

        <a-menu-item key="logout" @click="handleLogout" style="color: #ff4d4f">
          <template #icon><logout-outlined style="color: #ff4d4f" /></template>
          <span>Đăng xuất</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout :style="{ marginLeft: collapsed ? '0' : '200px', transition: 'all 0.2s' }">
      <a-layout-header
        style="background: #fff; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 1000;">
        <span style="font-weight: bold">HỆ THỐNG QUẢN TRỊ</span>
        <div style="display: flex; gap: 8px">
          <a-tag color="blue">{{ fullName }}</a-tag>
          <a-tag color="orange" v-for="r in roles" :key="r">{{ r }}</a-tag>
        </div>
      </a-layout-header>

      <a-layout-content style="margin: 16px">
        <div style="padding: 24px; background: #fff; min-height: 360px">
          <router-view />
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'
import {
  UserOutlined,
  TeamOutlined,
  ShoppingOutlined,
  HistoryOutlined,
  PercentageOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
  MessageOutlined
} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()

const activeKey = ref(['users'])
const openKeys = ref(['sub-product'])
const collapsed = ref(false)
const fullName = ref('')
const roles = ref([])

const onBreakpoint = (broken) => {
  collapsed.value = broken
}

const syncUserInfo = () => {
  fullName.value = localStorage.getItem('userFullName') || 'N/A'
  try {
    const storedRoles = localStorage.getItem('userRoles')
    roles.value = storedRoles ? JSON.parse(storedRoles) : []
  } catch {
    roles.value = []
  }
}

const handleLogout = () => {
  Modal.confirm({
    title: 'Xác nhận đăng xuất?',
    onOk() {
      localStorage.clear()
      router.push('/login')
      message.success('Hẹn gặp lại!')
    }
  })
}

watch(
  () => route.path,
  (path) => {
    // 🔥 LOGIC SÁNG ĐÈN CHO BIẾN THỂ (3 CẤP)
    if (path.startsWith('/variants/colors')) {
      activeKey.value = ['v-color']
      openKeys.value = ['sub-product', 'sub-variants']
    } else if (path.startsWith('/variants/sizes')) {
      activeKey.value = ['v-size']
      openKeys.value = ['sub-product', 'sub-variants']
    } else if (path.startsWith('/variants/materials')) {
      activeKey.value = ['v-material']
      openKeys.value = ['sub-product', 'sub-variants']
    } else if (path.startsWith('/variants/soles')) {
      activeKey.value = ['v-sole']
      openKeys.value = ['sub-product', 'sub-variants']
    } else if (path.startsWith('/products')) {
      activeKey.value = ['products']
      openKeys.value = ['sub-product']
    } else if (path.startsWith('/categories')) {
      activeKey.value = ['categories']
      openKeys.value = ['sub-product']
    } else if (path.startsWith('/prices/groups')) {
      activeKey.value = ['prices-groups']
      openKeys.value = ['sub-promotion']
    } else if (path.startsWith('/promotions/report')) {
      activeKey.value = ['promotion-report']
      openKeys.value = ['sub-promotion']
    } else if (path.startsWith('/promotions')) {
      activeKey.value = ['promotions']
      openKeys.value = ['sub-promotion']
    } else if (path.startsWith('/voucher')) {
      activeKey.value = ['voucher']
      openKeys.value = ['sub-promotion']
    } else if (path.startsWith('/promotions/dashboard')) {
      activeKey.value = ['promotions-dashboard']
      openKeys.value = ['sub-promotion']
    } else if (path.startsWith('/customers-rank')) {
      activeKey.value = ['customers-rank']
      openKeys.value = ['sub-customer']
    } else if (path.startsWith('/customers-history')) {
      activeKey.value = ['customers-history']
      openKeys.value = ['sub-customer']
    } else if (path.startsWith('/customers-spending')) {
      activeKey.value = ['customers-spending']
      openKeys.value = ['sub-customer']
    } else if (path.startsWith('/customers-vip')) {
      activeKey.value = ['customers-vip']
      openKeys.value = ['sub-customer']
    } else if (path.startsWith('/customers-dashboard')) {
      activeKey.value = ['customers-dashboard']
      openKeys.value = ['sub-customer']
    } else if (path.startsWith('/customers')) {
      activeKey.value = ['customers']
      openKeys.value = ['sub-customer']
    } else if (path.startsWith('/orders/dashboard')) {
      activeKey.value = ['orders-dashboard']
      openKeys.value = ['sub-order']
    } else if (path.startsWith('/orders/returns')) {
      activeKey.value = ['order-returns']
      openKeys.value = ['sub-order']
    } else if (path.startsWith('/orders/create')) {
      activeKey.value = ['order-create']
      openKeys.value = ['sub-order']
    } else if (path.startsWith('/orders')) {
      activeKey.value = ['orders']
      openKeys.value = ['sub-order']
    } else if (path.startsWith('/admin/chat')) {
      activeKey.value = ['admin-chat']
    } else if (path.startsWith('/logs')) {
      activeKey.value = ['logs']
    } else if (path.startsWith('/profile')) {
      activeKey.value = ['profile']
    } else {
      activeKey.value = ['users']
    }

    syncUserInfo()
  },
  { immediate: true }
)

onMounted(syncUserInfo)
</script>
