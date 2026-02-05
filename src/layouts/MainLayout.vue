<template>
    <a-layout style="min-height: 100vh">
        <a-layout-sider breakpoint="lg" collapsed-width="0"
            :style="{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 1001 }">
            <div class="logo"
                style="height: 32px; margin: 16px; background: rgba(255, 255, 255, 0.3); color: white; text-align: center; line-height: 32px; font-weight: bold;">
                SNEAKER SHOP
            </div>
            <a-menu v-model:selectedKeys="activeKey" theme="dark" mode="inline">
                <a-menu-item v-if="roles.includes('ADMIN')" key="users">
                    <template #icon><user-outlined /></template>
                    <router-link to="/users">Quản lý người dùng</router-link>
                </a-menu-item>

                <a-menu-item v-if="roles.includes('ADMIN') || roles.includes('INVENTORY')" key="logs">
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

        <a-layout :style="{ marginLeft: '200px', transition: 'all 0.2s' }">
            <a-layout-header
                style="background: #fff; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 1000; width: 100%">
                <span style="font-weight: bold">HỆ THỐNG QUẢN TRỊ</span>
                <div style="display: flex; gap: 8px">
                    <a-tag color="blue">{{ fullName }}</a-tag>
                    <a-tag color="orange" v-for="r in roles" :key="r">{{ r }}</a-tag>
                </div>
            </a-layout-header>

            <a-layout-content style="margin: 16px; overflow: initial">
                <div style="padding: 24px; background: #fff; min-height: 360px">
                    <router-view />
                </div>
            </a-layout-content>
        </a-layout>
    </a-layout>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Modal, message } from 'ant-design-vue';
import { UserOutlined, HistoryOutlined, LogoutOutlined } from '@ant-design/icons-vue';

const route = useRoute();
const router = useRouter();
const activeKey = ref(['users']);
const fullName = ref('');
const roles = ref([]);

const syncUserInfo = () => {
    fullName.value = localStorage.getItem('userFullName') || 'N/A';
    try {
        const storedRoles = localStorage.getItem('userRoles');
        roles.value = storedRoles ? JSON.parse(storedRoles) : [];
    } catch (e) { roles.value = []; }
};

const handleLogout = () => {
    Modal.confirm({
        title: 'Bạn muốn đăng xuất?',
        onOk() {
            localStorage.clear();
            router.push('/login');
            message.success('Đã đăng xuất');
        }
    });
};

watch(() => route.path, (path) => {
    const key = path.split('/')[1] || 'users';
    activeKey.value = [key];
    syncUserInfo();
}, { immediate: true });

onMounted(syncUserInfo);
</script>

<style scoped>
/* Đảm bảo layout mượt mà trên mobile */
@media (max-width: 992px) {
    .ant-layout {
        margin-left: 0 !important;
    }
}
</style>