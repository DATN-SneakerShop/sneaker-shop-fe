<template>
    <div style="padding: 24px">
        <a-card title="Hồ sơ cá nhân" :loading="loading" style="max-width: 600px; margin: 0 auto">
            <a-descriptions bordered :column="1">
                <a-descriptions-item label="Tên đăng nhập"><b>{{ user.username }}</b></a-descriptions-item>
                <a-descriptions-item label="Họ và tên">{{ user.fullName }}</a-descriptions-item>
                <a-descriptions-item label="Email">{{ user.email }}</a-descriptions-item>
                <a-descriptions-item label="Quyền hạn">
                    <a-tag color="blue">{{ user.role }}</a-tag>
                </a-descriptions-item>
            </a-descriptions>
        </a-card>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/api/axios';
import { message } from 'ant-design-vue';

const user = ref({});
const loading = ref(true);

const loadProfile = async () => {
    try {
        const res = await api.get('/auth/me');
        user.value = res.data;
    } catch (err) {
        message.error("Không thể tải thông tin cá nhân");
    } finally {
        loading.value = false;
    }
};

onMounted(loadProfile);
</script>