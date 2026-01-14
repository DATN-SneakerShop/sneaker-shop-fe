<template>
    <div style="padding: 24px">
        <a-card title="Thông tin tài khoản" style="max-width: 600px; margin: 0 auto">
            <a-descriptions bordered :column="1">
                <a-descriptions-item label="Tên đăng nhập">{{ username }}</a-descriptions-item>
                <a-descriptions-item label="Quyền hạn">
                    <a-tag color="orange">{{ role }}</a-tag>
                </a-descriptions-item>
            </a-descriptions>

            <a-divider>Đổi mật khẩu</a-divider>

            <a-form layout="vertical" @submit.prevent="handleUpdatePassword">
                <a-form-item label="Mật khẩu cũ">
                    <a-input-password v-model:value="form.oldPassword" />
                </a-form-item>
                <a-form-item label="Mật khẩu mới">
                    <a-input-password v-model:value="form.newPassword" />
                </a-form-item>
                <a-button type="primary" html-type="submit" :loading="loading" block>Cập nhật</a-button>
            </a-form>
        </a-card>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import api from '@/api/axios';

const username = localStorage.getItem('username');
const role = localStorage.getItem('userRole');
const loading = ref(false);
const form = ref({ oldPassword: '', newPassword: '' });

const handleUpdatePassword = async () => {
    if (!form.value.oldPassword || !form.value.newPassword) return message.warning('Nhập đủ thông tin');
    loading.value = true;
    try {
        await api.post('/auth/change-password', {
            username,
            oldPassword: form.value.oldPassword,
            newPassword: form.value.newPassword
        });
        message.success('Đổi mật khẩu thành công!');
        form.value = { oldPassword: '', newPassword: '' };
    } catch (err) {
        message.error(err.response?.data || 'Thất bại');
    } finally { loading.value = false; }
};
</script>