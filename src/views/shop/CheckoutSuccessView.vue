<template>
  <div class="checkout-success-page">
    <section class="success-card">
      <div class="icon">✓</div>
      <h1>Đặt hàng thành công</h1>
      <p class="desc">Đơn hàng của bạn đã được tạo thành công trong hệ thống.</p>

      <div class="info-grid">
        <div class="info-item">
          <span>Mã đơn hàng</span>
          <strong>{{ paymentInfo.orderCode || route.query.orderCode || '---' }}</strong>
        </div>

        <div class="info-item">
          <span>Tổng thanh toán</span>
          <strong>{{ formatVnd(paymentInfo.finalAmount || route.query.total) }}</strong>
        </div>

        <div class="info-item">
          <span>Trạng thái thanh toán</span>
          <strong :class="{ paid: paymentInfo.paymentStatus === 'PAID' }">
            {{ paymentInfo.paymentStatus || route.query.paymentStatus || '---' }}
          </strong>
        </div>
      </div>

      <div
        v-if="(paymentInfo.paymentMethod || route.query.paymentMethod) === 'BANK_TRANSFER'"
        class="bank-transfer-box"
      >
        <h2>Thanh toán chuyển khoản</h2>

        <div v-if="paymentInfo.qrImageUrl || route.query.qrImageUrl" class="qr-box">
          <img :src="paymentInfo.qrImageUrl || route.query.qrImageUrl" alt="SePay QR" />
        </div>

        <div class="bank-info">
          <div><b>Ngân hàng:</b> {{ paymentInfo.bankName || route.query.bankName || '-' }}</div>
          <div><b>Số tài khoản:</b> {{ paymentInfo.bankAccountNo || route.query.bankAccountNo || '-' }}</div>
          <div><b>Chủ tài khoản:</b> {{ paymentInfo.bankAccountName || route.query.bankAccountName || '-' }}</div>
          <div><b>Nội dung CK:</b> {{ paymentInfo.transferContent || route.query.transferContent || '-' }}</div>
        </div>

        <p class="note">
          Chuyển đúng nội dung để hệ thống tự động xác nhận thanh toán qua SePay webhook.
        </p>

        <button class="btn btn-secondary" @click="loadPaymentInfo" :disabled="loading">
          {{ loading ? 'Đang kiểm tra...' : 'Kiểm tra trạng thái thanh toán' }}
        </button>
      </div>

      <div class="actions">
        <RouterLink class="btn btn-primary" to="/trang-chu">
          Về trang chủ
        </RouterLink>
        <RouterLink class="btn btn-secondary" to="/tai-khoan">
          Tài khoản của tôi
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { getErrorMessage } from '@/utils/error'
import { getSepayPaymentInfo } from '@/api/checkout.api'

const route = useRoute()
const loading = ref(false)

const paymentInfo = reactive({
  orderCode: route.query.orderCode || '',
  lookupCode: route.query.lookupCode || '',
  paymentStatus: route.query.paymentStatus || '',
  paymentMethod: route.query.paymentMethod || '',
  finalAmount: route.query.total || 0,
  bankName: route.query.bankName || '',
  bankAccountNo: route.query.bankAccountNo || '',
  bankAccountName: route.query.bankAccountName || '',
  transferContent: route.query.transferContent || '',
  qrImageUrl: route.query.qrImageUrl || '',
})

function formatVnd(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(value || 0))
}

async function loadPaymentInfo() {
  if (!route.query.orderCode || !route.query.lookupCode) return

  try {
    loading.value = true
    const res = await getSepayPaymentInfo(route.query.orderCode, route.query.lookupCode)
    const data = res.data || {}

    paymentInfo.orderCode = data.orderCode || paymentInfo.orderCode
    paymentInfo.lookupCode = data.lookupCode || paymentInfo.lookupCode
    paymentInfo.paymentStatus = data.paymentStatus || paymentInfo.paymentStatus
    paymentInfo.paymentMethod = data.paymentMethod || paymentInfo.paymentMethod
    paymentInfo.finalAmount = data.finalAmount || paymentInfo.finalAmount
    paymentInfo.bankName = data.bankName || paymentInfo.bankName
    paymentInfo.bankAccountNo = data.bankAccountNo || paymentInfo.bankAccountNo
    paymentInfo.bankAccountName = data.bankAccountName || paymentInfo.bankAccountName
    paymentInfo.transferContent = data.transferContent || paymentInfo.transferContent
    paymentInfo.qrImageUrl = data.qrImageUrl || paymentInfo.qrImageUrl

    if (paymentInfo.paymentStatus === 'PAID') {
      message.success('Hệ thống đã ghi nhận thanh toán thành công')
    }
  } catch (e) {
    message.error(getErrorMessage(e, 'Không lấy được thông tin thanh toán'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if ((route.query.paymentMethod || '') === 'BANK_TRANSFER') {
    loadPaymentInfo()
  }
})
</script>

<style scoped>
.checkout-success-page {
  padding: 40px 0;
}

.success-card {
  max-width: 860px;
  margin: 0 auto;
  background: #fff;
  border-radius: 20px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 16px;
  border-radius: 999px;
  background: #111;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 32px;
  font-weight: 700;
}

.desc {
  color: #666;
  margin-bottom: 24px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.info-item {
  background: #f7f7f7;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item span {
  font-size: 13px;
  color: #666;
}

.bank-transfer-box {
  margin: 24px 0;
  padding: 24px;
  border-radius: 16px;
  background: #fafafa;
  border: 1px solid #eee;
}

.qr-box {
  margin: 16px auto;
}

.qr-box img {
  width: 280px;
  max-width: 100%;
  border-radius: 12px;
  border: 1px solid #eee;
}

.bank-info {
  display: grid;
  gap: 10px;
  text-align: left;
  max-width: 520px;
  margin: 0 auto 16px;
}

.note {
  color: #666;
  margin-bottom: 16px;
}

.paid {
  color: #16a34a;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.btn {
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  text-decoration: none;
  cursor: pointer;
}

.btn-primary {
  background: #111;
  color: #fff;
}

.btn-secondary {
  background: #f1f1f1;
  color: #111;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
  }
}
</style>
