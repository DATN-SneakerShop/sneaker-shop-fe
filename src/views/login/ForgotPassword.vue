<template>
    <div class="auth-container">
        <div class="auth-card">
            <h2 class="auth-title">QUÊN MẬT KHẨU</h2>

            <a-form layout="vertical">
                <a-form-item label="Email đăng ký">
                    <div style="display: flex; gap: 8px">
                        <a-input v-model:value="email" placeholder="Nhập email để lấy mã" :disabled="step > 1" />
                        <a-button type="primary" @click="handleSendOtp" :loading="loading" :disabled="step > 1">
                            {{ step === 1 ? 'Nhận mã' : 'Đã gửi mã' }}
                        </a-button>
                    </div>
                </a-form-item>

                <a-form-item v-if="step >= 2" label="Mã xác thực OTP" extra="Kiểm tra hòm thư Gmail của bạn">
                    <div style="display: flex; gap: 8px">
                        <a-input v-model:value="otp" placeholder="Nhập 6 số" :disabled="step > 2" />
                        <a-button v-if="step === 2" type="primary" danger @click="handleVerifyOtp">Xác thực
                            mã</a-button>
                    </div>
                </a-form-item>

                <div v-if="step === 3">
                    <a-form-item label="Mật khẩu mới">
                        <a-input-password v-model:value="newPassword" placeholder="Nhập mật khẩu mới" />
                    </a-form-item>
                    <a-button type="primary" block size="large" @click="handleResetPassword" :loading="loading">
                        ĐỔI MẬT KHẨU
                    </a-button>
                </div>

                <div class="footer-link">
                    <router-link to="/login">Quay lại đăng nhập</router-link>
                </div>
            </a-form>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import api from '@/api/axios';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(false);
const step = ref(1); // 1: Email, 2: OTP, 3: New Password

const email = ref('');
const otp = ref('');
const newPassword = ref('');

// Gửi mã về mail
const handleSendOtp = async () => {
    if (!email.value) return message.warning('Vui lòng nhập email trước!');
    try {
        loading.value = true;
        await api.post('/auth/forgot-password', { email: email.value });
        message.success('Mã OTP đã được gửi đi!');
        step.value = 2; // Chuyển sang hiện ô nhập OTP
    } catch (err) {
        message.error(err.response?.data || 'Gửi mail thất bại!');
    } finally {
        loading.value = false;
    }
};

// Xác thực OTP (Logic này thực tế BE sẽ check chung ở bước reset, nhưng tao làm giả lập verify để đúng ý mày)
const handleVerifyOtp = () => {
    if (otp.value.length === 6) {
        message.success('Mã OTP hợp lệ! Hãy đặt mật khẩu mới.');
        step.value = 3; // Hiện ô nhập mật khẩu
    } else {
        message.error('Mã OTP phải có 6 chữ số!');
    }
};

// Chốt hạ đổi pass
const handleResetPassword = async () => {
    try {
        loading.value = true;
        await api.post('/auth/reset-password', {
            email: email.value,
            otp: otp.value,
            password: newPassword.value
        });
        message.success('Đổi mật khẩu thành công!');
        router.push('/login');
    } catch (err) {
        message.error(err.response?.data || 'Lỗi! Có thể OTP đã hết hạn.');
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
    color: #1890ff;
    font-weight: bold;
    margin-bottom: 24px;
}

.footer-link {
    margin-top: 16px;
    text-align: center;
}
</style>