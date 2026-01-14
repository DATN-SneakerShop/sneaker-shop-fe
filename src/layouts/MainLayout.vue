<template>
    <a-layout style="min-height: 100vh">
        <a-layout-sider collapsible>
            <div
                style="height: 32px; margin: 16px; background: rgba(255, 255, 255, 0.3); text-align: center; color: white; line-height: 32px; font-weight: bold; border-radius: 4px;">
                SNEAKER SHOP
            </div>

            <a-menu theme="dark" mode="inline" :selectedKeys="[activeKey]">
                <a-menu-item key="users">
                    <template #icon><user-outlined /></template>
                    <router-link to="/">Quản lý người dùng</router-link>
                </a-menu-item>

                <a-menu-item v-if="userRole && userRole.toUpperCase() === 'ADMIN'" key="logs">
                    <template #icon><history-outlined /></template>
                    <router-link to="/logs">Nhật ký hệ thống</router-link>
                </a-menu-item>

                <a-menu-divider style="background: rgba(255,255,255,0.1)" />

                <a-menu-item key="logout" @click="handleLogout" style="color: #ff4d4f">
                    <template #icon><logout-outlined style="color: #ff4d4f" /></template>
                    <span>Đăng xuất</span>
                </a-menu-item>
            </a-menu>
        </a-layout-sider>

        <a-layout>
            <a-layout-header
                style="background: #fff; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 4px rgba(0,21,41,.08)">
                <span style="font-weight: bold; font-size: 16px"></span>

                <div v-if="username" style="display: flex; align-items: center; gap: 12px">
                    <router-link to="/profile">
                        <a-tag color="blue" style="cursor: pointer">
                            <template #icon><user-outlined /></template>
                            Chào, {{ username }}
                        </a-tag>
                    </router-link>
                    <a-tag color="orange" v-if="userRole">{{ userRole }}</a-tag>
                </div>
            </a-layout-header>

            <a-layout-content style="margin: 16px">
                <div style="padding: 24px; background: #fff; min-height: 360px; border-radius: 8px">
                    <router-view />
                </div>
            </a-layout-content>

            <a-layout-footer style="text-align: center; color: #bfbfbf">
                Sneaker Shop ©2026
            </a-layout-footer>
        </a-layout>
    </a-layout>
</template>

<script setup>
import { ref, watch, onMounted, createVNode } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import {
    UserOutlined,
    HistoryOutlined,
    LogoutOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons-vue';

const route = useRoute();
const router = useRouter();
const activeKey = ref('users');

// Các biến trạng thái người dùng (Dùng ref để Vue có thể track thay đổi)
const username = ref('');
const userRole = ref('');

// Hàm cập nhật thông tin từ LocalStorage
const syncUserInfo = () => {
    username.value = localStorage.getItem('username') || '';
    userRole.value = localStorage.getItem('userRole') || '';
    console.log("Current Role:", userRole.value); // Để bro debug trong console
};

// Logic Đăng xuất có xác nhận
const handleLogout = () => {
    Modal.confirm({
        title: 'Xác nhận đăng xuất',
        icon: createVNode(ExclamationCircleOutlined),
        content: 'Bạn có chắc chắn muốn rời khỏi hệ thống không?',
        okText: 'Đăng xuất',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk() {
            localStorage.clear();
            message.success('Đã đăng xuất thành công!');
            router.push('/login');
        }
    });
};

// Theo dõi Route để highlight menu và cập nhật thông tin user
watch(() => route.path, (path) => {
    // 1. Highlight menu
    if (path === '/logs') activeKey.value = 'logs';
    else activeKey.value = 'users';

    // 2. Ép cập nhật lại thông tin user mỗi khi chuyển trang
    syncUserInfo();
}, { immediate: true });

onMounted(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        router.push('/login');
    } else {
        syncUserInfo();
    }
});
</script>

<style scoped>
:deep(.ant-menu-item-selected.ant-menu-item-danger) {
    background-color: rgba(255, 77, 79, 0.1);
}
</style>