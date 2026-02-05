<template>
    <div class="login-wrapper">
        <div class="login-card">
            <div class="login-header">
                <h2 class="brand-title">SNEAKER SHOP</h2>
                <p class="sub-title">Đăng nhập hệ thống quản lý</p>
            </div>

            <a-form :model="loginForm" :rules="rules" ref="formRef" layout="vertical" @finish="handleLogin">
                <a-form-item label="Email đăng nhập" name="username">
                    <a-input v-model:value="loginForm.username" size="large" placeholder="Nhập email">
                        <template #prefix><user-outlined style="color: rgba(0,0,0,.25)" /></template>
                    </a-input>
                </a-form-item>

                <a-form-item label="Mật khẩu" name="password">
                    <a-input-password v-model:value="loginForm.password" size="large" placeholder="Nhập mật khẩu">
                        <template #prefix><lock-outlined style="color: rgba(0,0,0,.25)" /></template>
                    </a-input-password>
                </a-form-item>

                <a-button type="primary" :loading="loading" block size="large" html-type="submit"
                    class="login-submit-btn">
                    ĐĂNG NHẬP
                </a-button>

                <div class="auth-footer">
                    <router-link to="/forgot-password" class="forgot-link">Quên mật khẩu?</router-link>
                    <div class="register-hint">
                        Chưa có tài khoản? <router-link to="/register">Đăng ký ngay</router-link>
                    </div>
                </div>
            </a-form>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import api from '@/api/axios';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(false);
const loginForm = reactive({ username: '', password: '' });
const rules = {
    username: [{ required: true, message: 'Vui lòng nhập Email!' }],
    password: [{ required: true, message: 'Vui lòng nhập mật khẩu!' }]
};

const handleLogin = async () => {
    try {
        loading.value = true;
        const res = await api.post('/auth/login', loginForm);
        const { accessToken, fullName, roles } = res.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('userFullName', fullName);
        localStorage.setItem('userRoles', JSON.stringify(roles));

        message.success(`Chào ${fullName}!`);

        if (roles.includes('ADMIN')) {
            router.push('/users');
        } else {
            router.push('/profile');
        }
    } catch (err) {
        message.error(err.response?.data || 'Sai tài khoản hoặc mật khẩu!');
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.login-wrapper {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f0f2f5;
}

.login-card {
    width: 400px;
    padding: 40px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.brand-title {
    color: #1890ff;
    font-weight: bold;
    text-align: center;
}

.auth-footer {
    margin-top: 20px;
    text-align: center;
}

.forgot-link {
    color: #ff4d4f;
    display: block;
    margin-bottom: 10px;
}
</style>