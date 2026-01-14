<template>
    <div class="login-wrapper">
        <div class="login-card">
            <div class="login-header">
                <h2 class="brand-title">SNEAKER SHOP</h2>
                <p class="sub-title">Đăng nhập để quản lý đơn hàng của bạn</p>
            </div>

            <a-form :model="loginForm" :rules="rules" ref="formRef" layout="vertical" @finish="handleLogin">
                <a-form-item label="Tên đăng nhập" name="username">
                    <a-input v-model:value="loginForm.username" size="large" placeholder="Nhập tài khoản">
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
                    <p class="register-text">
                        Chưa có tài khoản? <router-link to="/register" class="link">Đăng ký ngay</router-link>
                    </p>

                    <div class="divider">
                        <span class="divider-text">Hoặc</span>
                    </div>

                    <a-button block size="large" class="google-btn" :loading="loading" @click="handleGoogleLogin">
                        <template #icon>
                            <img src="/src/assets/images/Google_Favicon_2025.svg.png" width="18"
                                style="margin-right: 8px" />
                        </template>
                        Tiếp tục với Google
                    </a-button>
                </div>
            </a-form>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { message } from 'ant-design-vue';
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import api from '@/api/axios';
import { googleTokenLogin } from "vue3-google-login";

const formRef = ref();
const loading = ref(false);
const loginForm = reactive({
    username: '',
    password: ''
});

/**
 * 1. BỘ QUY TẮC VALIDATE (Khớp với LoginRequest bên Backend)
 */
const rules = {
    username: [
        { required: true, message: 'Vui lòng nhập tên đăng nhập!', trigger: 'blur' },
        { min: 5, message: 'Tên đăng nhập phải có ít nhất 5 ký tự!', trigger: 'blur' }
    ],
    password: [
        { required: true, message: 'Vui lòng nhập mật khẩu!', trigger: 'blur' },
        { min: 6, message: 'Mật khẩu phải từ 6 ký tự trở lên!', trigger: 'blur' }
    ]
};

/**
 * 2. XỬ LÝ ĐĂNG NHẬP TRUYỀN THỐNG
 */
const handleLogin = async () => {
    loading.value = true;
    try {
        // Gọi API login
        const res = await api.post('/auth/login', {
            username: loginForm.username.trim(),
            password: loginForm.password.trim()
        });

        // Lưu thông tin và chuyển trang
        saveAuthAndRedirect(res.data);
        message.success('Đăng nhập thành công!');

    } catch (err) {
        // Bắt các lỗi từ Backend (401: Sai tài khoản/mật khẩu, 403: Bị khóa, 400: Validate lỗi)
        const errorMsg = err.response?.data || 'Hệ thống đang bận, vui lòng thử lại sau!';
        message.error(errorMsg);
        console.error("Login Error:", err);
    } finally {
        loading.value = false;
    }
};

/**
 * 3. XỬ LÝ ĐĂNG NHẬP GOOGLE
 */
const handleGoogleLogin = () => {
    googleTokenLogin().then(async (response) => {
        try {
            loading.value = true;

            // Lấy profile từ Google Access Token
            const googleInfo = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${response.access_token}`)
                .then(res => res.json());

            // Gửi sang Backend xử lý
            const res = await api.post('/auth/google-login', {
                googleId: String(googleInfo.sub),
                email: googleInfo.email,
                name: googleInfo.name || "Google User"
            });

            saveAuthAndRedirect(res.data);
            message.success('Đăng nhập bằng Google thành công!');

        } catch (error) {
            console.error("Google Login Error:", error);
            message.error("Xác thực Google thất bại hoặc lỗi hệ thống!");
        } finally {
            loading.value = false;
        }
    }).catch(error => {
        console.warn("User closed Google popup", error);
    });
};

/**
 * 4. HÀM DÙNG CHUNG: LƯU TOKEN & CHUYỂN TRANG
 */
const saveAuthAndRedirect = (data) => {
    localStorage.clear();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('username', data.username);
    localStorage.setItem('userRole', data.role);

    // Chuyển hướng sau 500ms để người dùng kịp thấy message success
    setTimeout(() => {
        window.location.href = '/';
    }, 500);
};
</script>

<style scoped>
.login-wrapper {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.login-card {
    width: 100%;
    max-width: 400px;
    padding: 40px;
    background: #fff;
    border-radius: 15px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.login-header {
    text-align: center;
    margin-bottom: 30px;
}

.brand-title {
    color: #1890ff;
    font-weight: 800;
    font-size: 28px;
    margin-bottom: 8px;
    letter-spacing: 1px;
}

.sub-title {
    color: #8c8c8c;
    font-size: 14px;
}

.login-submit-btn {
    height: 45px;
    font-weight: 600;
    font-size: 16px;
    margin-top: 10px;
}

.auth-footer {
    margin-top: 24px;
    text-align: center;
}

.register-text {
    margin-bottom: 16px;
    font-size: 14px;
}

.link {
    color: #1890ff;
    font-weight: 600;
}

.divider {
    margin: 20px 0;
    border-top: 1px solid #f0f0f0;
    position: relative;
}

.divider-text {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    padding: 0 15px;
    color: #bfbfbf;
    font-size: 13px;
}

.google-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 45px;
    border-color: #d9d9d9;
    border-radius: 8px;
    transition: all 0.3s;
}

.google-btn:hover {
    background: #f8f9fa;
    border-color: #40a9ff;
    color: #40a9ff;
}
</style>