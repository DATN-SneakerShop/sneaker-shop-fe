<template>
    <div class="auth-container">
        <div class="auth-card">
            <h2 class="auth-title">ĐĂNG KÝ TÀI KHOẢN</h2>
            <a-form :model="registerForm" :rules="rules" ref="formRef" layout="vertical" @finish="handleRegister">
                <a-form-item label="Họ và tên" name="fullName">
                    <a-input v-model:value="registerForm.fullName" placeholder="Nguyễn Văn A" />
                </a-form-item>
                <a-form-item label="Email" name="email">
                    <a-input v-model:value="registerForm.email" placeholder="example@gmail.com" />
                </a-form-item>
                <a-form-item label="Mật khẩu" name="password">
                    <a-input-password v-model:value="registerForm.password" />
                </a-form-item>
                <a-form-item label="Xác nhận mật khẩu" name="confirmPassword">
                    <a-input-password v-model:value="registerForm.confirmPassword" />
                </a-form-item>
                <a-button type="primary" block size="large" :loading="loading" html-type="submit">ĐĂNG KÝ</a-button>
                <div class="footer-link">Đã có tài khoản? <router-link to="/login">Đăng nhập</router-link></div>
            </a-form>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import api from '@/api/axios';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(false);
const registerForm = reactive({ fullName: '', email: '', password: '', confirmPassword: '' });

const rules = {
    email: [{ required: true, type: 'email', message: 'Email không hợp lệ!' }],
    fullName: [{ required: true, message: 'Vui lòng nhập họ tên!' }],
    password: [{ required: true, min: 6, message: 'Tối thiểu 6 ký tự!' }],
    confirmPassword: [
        { required: true, message: 'Cần xác nhận mật khẩu!' },
        { validator: async (_, v) => { if (v !== registerForm.password) throw new Error('Mật khẩu không khớp!'); } }
    ]
};

const handleRegister = async () => {
    try {
        loading.value = true;
        await api.post('/auth/register', {
            email: registerForm.email,
            fullName: registerForm.fullName,
            password: registerForm.password
        });
        message.success('Đăng ký thành công!');
        router.push('/login');
    } catch (err) {
        message.error(err.response?.data || 'Lỗi đăng ký!');
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.auth-container {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f0f2f5;
}

.auth-card {
    width: 400px;
    padding: 30px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.auth-title {
    text-align: center;
    margin-bottom: 20px;
    color: #1890ff;
    font-weight: bold;
}

.auth-link {
    text-align: center;
    margin-top: 15px;
}
</style>