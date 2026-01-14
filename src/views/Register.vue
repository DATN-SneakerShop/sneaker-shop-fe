<template>
    <div class="auth-container">
        <div class="auth-card">
            <h2 class="auth-title">TẠO TÀI KHOẢN</h2>

            <a-form :model="registerForm" :rules="rules" ref="formRef" layout="vertical">
                <a-form-item label="Tên đăng nhập" name="username">
                    <a-input v-model:value="registerForm.username" placeholder="Ví dụ: hieund99" />
                </a-form-item>

                <a-form-item label="Email" name="email">
                    <a-input v-model:value="registerForm.email" placeholder="email@example.com" />
                </a-form-item>

                <a-form-item label="Họ và tên" name="fullName">
                    <a-input v-model:value="registerForm.fullName" placeholder="Nhập tên của bạn" />
                </a-form-item>

                <a-form-item label="Mật khẩu" name="password">
                    <a-input-password v-model:value="registerForm.password" placeholder="Tối thiểu 6 ký tự" />
                </a-form-item>

                <a-form-item label="Xác nhận mật khẩu" name="confirmPassword">
                    <a-input-password v-model:value="registerForm.confirmPassword" placeholder="Nhập lại mật khẩu" />
                </a-form-item>

                <a-button type="primary" block size="large" :loading="loading" @click="handleRegister">
                    ĐĂNG KÝ NGAY
                </a-button>

                <div class="auth-link">
                    Đã có tài khoản? <router-link to="/login">Đăng nhập</router-link>
                </div>
            </a-form>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { message } from 'ant-design-vue';
import api from '@/api/axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const formRef = ref();
const loading = ref(false);

const registerForm = reactive({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: ''
});

// BỘ QUY TẮC VALIDATE
const rules = {
    username: [
        { required: true, message: 'Tên đăng nhập không được để trống' },
        { min: 5, message: 'Tối thiểu 5 ký tự' },
        { pattern: /^[a-zA-Z0-9]+$/, message: 'Không được chứa khoảng trắng hoặc ký tự đặc biệt' }
    ],
    email: [
        { required: true, message: 'Email không được để trống' },
        { type: 'email', message: 'Email không hợp lệ' }
    ],
    fullName: [
        { required: true, message: 'Vui lòng nhập họ tên' }
    ],
    password: [
        { required: true, message: 'Mật khẩu không được để trống' },
        { min: 6, message: 'Mật khẩu phải từ 6 ký tự trở lên' }
    ],
    confirmPassword: [
        { required: true, message: 'Vui lòng xác nhận mật khẩu' },
        {
            validator: async (_rule, value) => {
                if (value !== registerForm.password) {
                    throw new Error('Mật khẩu xác nhận không khớp!');
                }
            }
        }
    ]
};

const handleRegister = async () => {
    try {
        // 1. Chạy validate toàn bộ form ở FE
        await formRef.value.validate();

        loading.value = true;
        // 2. Gửi API lên BE
        await api.post('/auth/register', {
            username: registerForm.username,
            email: registerForm.email,
            fullName: registerForm.fullName,
            password: registerForm.password
        });

        message.success('Đăng ký thành công! Đang chuyển hướng...');
        setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
        if (err.response) {
            // Hiển thị lỗi từ BE (ví dụ: Username đã tồn tại)
            message.error(err.response.data || 'Đăng ký thất bại');
        }
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