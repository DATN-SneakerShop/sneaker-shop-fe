<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'
import {
  UserOutlined,
  HistoryOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  TagsOutlined
} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()

const activeKey = ref('users')
const username = ref('')
const roles = ref([])

// check ADMIN
const isAdmin = computed(() => roles.value.includes('ADMIN'))

const syncUserInfo = () => {
  username.value = localStorage.getItem('username') || 'Người dùng'
  try {
    const storedRoles = localStorage.getItem('userRoles')
    roles.value = storedRoles ? JSON.parse(storedRoles) : []
  } catch (e) {
    roles.value = []
  }
}

const handleLogout = () => {
  Modal.confirm({
    title: 'Xác nhận đăng xuất',
    content: 'Bạn có chắc chắn muốn rời khỏi hệ thống?',
    onOk() {
      localStorage.clear()
      message.success('Đã đăng xuất')
      router.push('/login')
    }
  })
}

// active menu theo route
watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/products')) {
      activeKey.value = 'products'
    } else if (path.startsWith('/categories')) {
      activeKey.value = 'categories'
    } else if (path === '/logs') {
      activeKey.value = 'logs'
    } else {
      activeKey.value = 'users'
    }
    syncUserInfo()
  },
  { immediate: true }
)

onMounted(syncUserInfo)
</script>

<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider collapsible>
      <div
        style="height: 32px; margin: 16px; background: rgba(255,255,255,.3);
        text-align: center; color: white; line-height: 32px;
        font-weight: bold; border-radius: 4px;">
        SNEAKER SHOP
      </div>

      <a-menu theme="dark" mode="inline" :selectedKeys="[activeKey]">
        <a-menu-item key="users">
          <template #icon><user-outlined /></template>
          <router-link to="/">Quản lý người dùng</router-link>
        </a-menu-item>

        <a-menu-item key="products">
          <template #icon><appstore-outlined /></template>
          <router-link to="/products">Sản phẩm</router-link>
        </a-menu-item>

        <a-menu-item key="categories">
          <template #icon><tags-outlined /></template>
          <router-link to="/categories">Danh mục</router-link>
        </a-menu-item>

        <a-menu-item v-if="isAdmin" key="logs">
          <template #icon><history-outlined /></template>
          <router-link to="/logs">Nhật ký hệ thống</router-link>
        </a-menu-item>

        <a-menu-divider style="background: rgba(255,255,255,0.1)" />

        <a-menu-item key="logout" @click="handleLogout" style="color:#ff4d4f">
          <template #icon>
            <logout-outlined style="color:#ff4d4f" />
          </template>
          <span>Đăng xuất</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <a-layout-header
        style="background:#fff; padding:0 24px;
        display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:bold">Bảng điều khiển</span>
        <div style="display:flex; align-items:center; gap:12px">
          <a-tag color="blue">Chào, {{ username }}</a-tag>
          <a-tag
            color="orange"
            v-for="role in roles"
            :key="role"
          >
            {{ role }}
          </a-tag>
        </div>
      </a-layout-header>

      <a-layout-content style="margin:16px">
        <div
          style="padding:24px; background:#fff;
          min-height:360px; border-radius:8px">
          <router-view />
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style>
.ant-menu-item-selected {
  font-weight: 600;
}
</style>
