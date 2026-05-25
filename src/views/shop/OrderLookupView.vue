<template>
  <div class="order-lookup-page">
    <div class="lookup-bg"></div>

    <section class="lookup-shell">
      <section class="lookup-hero">
        <div class="hero-badge">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          Tra cứu đơn hàng
        </div>

        <h1>Kiểm tra đơn hàng nhanh, rõ ràng, dễ hiểu</h1>
        <p class="lookup-sub">
          Nhập mã đơn hàng để xem trạng thái xử lý, thanh toán, vận chuyển và sản phẩm trong đơn.
          Với đơn chuyển khoản, hệ thống sẽ hiển thị rõ khách đã chuyển bao nhiêu, còn thiếu hay chuyển dư bao nhiêu.
        </p>
      </section>

      <section class="lookup-card lookup-card--form">
        <form class="lookup-form" @submit.prevent="handleLookup">
          <div class="form-grid form-grid--single">
            <div class="form-field">
              <label>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                Mã đơn hàng
              </label>

              <div class="input-wrap">
                <input
                  v-model.trim="form.keyword"
                  type="text"
                  placeholder="Ví dụ: ORD202604001"
                />
              </div>

              <p class="field-hint">
                Nhập đúng mã đơn hàng để hệ thống tra cứu chính xác.
              </p>
            </div>
          </div>

          <div class="form-actions">
            <button class="primary-btn" type="submit" :disabled="loading">
              <span v-if="loading" class="spinner"></span>
              <template v-else>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                Tra cứu ngay
              </template>
            </button>
          </div>
        </form>

        <transition name="fade">
          <div v-if="errorMessage" class="lookup-state lookup-state--error">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>
        </transition>
      </section>

      <transition name="fade" mode="out-in">
        <section v-if="loading" class="lookup-card">
          <div class="lookup-state lookup-state--loading">
            <span class="spinner-large"></span>
            <p>Đang tải dữ liệu đơn hàng...</p>
          </div>
        </section>

        <section v-else-if="order" class="lookup-result">
          <div class="result-top">
            <div class="result-summary">
              <p class="order-date">Ngày đặt: {{ formatDateTime(order.createdAt) }}</p>
              <h2>Đơn hàng #{{ order.orderCode || '---' }}</h2>
              <p class="result-note">
                Đây là thông tin mới nhất của đơn hàng tại thời điểm hiện tại.
              </p>
            </div>

            <div class="result-total-box">
              <span>Tổng thanh toán</span>
              <strong>{{ formatVnd(order.finalAmount) }}</strong>
            </div>
          </div>

          <div class="status-row">
            <span class="status-chip" :class="getOrderStatusStyle(order.orderStatus)">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Đơn hàng: {{ orderStatusLabel(order.orderStatus, order) }}
            </span>

            <span class="status-chip" :class="getPaymentStatusStyle(order)">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
              </svg>
              Thanh toán: {{ paymentStatusLabel(order) }}
            </span>

            <span class="status-chip" :class="getShippingStatusStyle(order.shippingStatus, order.channel)">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
              Giao hàng: {{ shippingStatusLabel(order.shippingStatus, order.channel) }}
            </span>

            <span class="status-chip status-chip--outline">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              Hình thức TT: {{ paymentMethodLabel(order.paymentMethod) }}
            </span>
          </div>

          <div v-if="canShowPaymentQr" class="payment-action-bar">
            <div class="payment-action-info">
              <strong>Cần thanh toán thêm để hoàn tất đơn hàng</strong>
              <p>{{ transferStatusMessage }}</p>
            </div>

            <button class="secondary-btn" type="button" @click="openQrModal">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
                <path d="M14 14h3v3"></path>
                <path d="M21 14v7h-7"></path>
                <path d="M14 17h.01"></path>
                <path d="M17 14h.01"></path>
                <path d="M17 17h.01"></path>
                <path d="M20 17h.01"></path>
                <path d="M17 20h.01"></path>
                <path d="M20 20h.01"></path>
              </svg>
              Xem mã QR thanh toán
            </button>
          </div>

          <div class="overview-grid">
            <div class="overview-card">
              <div class="overview-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div class="overview-content">
                <span>Người nhận</span>
                <strong>{{ order.receiverName || '---' }}</strong>
                <small>{{ order.receiverPhone || '---' }}</small>
              </div>
            </div>

            <div class="overview-card">
              <div class="overview-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div class="overview-content">
                <span>Địa chỉ giao hàng</span>
                <strong>{{ fullShippingAddress(order) || '---' }}</strong>
              </div>
            </div>

            <div class="overview-card">
              <div class="overview-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
              </div>
              <div class="overview-content">
                <span>Đơn vị vận chuyển</span>
                <strong>{{ order.shippingCarrier || shippingCarrierLabel(order) }}</strong>
                <small>Mã vận đơn: {{ order.trackingCode || trackingCodeLabel(order) }}</small>
              </div>
            </div>

            <div class="overview-card">
              <div class="overview-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1v22"></path>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div class="overview-content">
                <span>Ghi chú đơn hàng</span>
                <strong>{{ order.note || 'Không có ghi chú' }}</strong>
              </div>
            </div>
          </div>

          <div class="content-grid">
            <div class="main-column">
              <section class="content-card">
                <div class="section-head">
                  <h3>Danh sách sản phẩm</h3>
                  <span>{{ (order.items || []).length }} sản phẩm</span>
                </div>

                <div class="product-list" v-if="order.items && order.items.length">
                  <div
                    v-for="item in order.items"
                    :key="item.id"
                    class="product-line"
                  >
                    <div class="product-image-wrapper">
                      <img
                        :src="item.imageUrlSnapshot || fallbackImage"
                        :alt="item.productNameSnapshot || 'product'"
                      />
                      <span class="product-qty-badge">x{{ item.quantity || 0 }}</span>
                    </div>

                    <div class="product-line__content">
                      <strong>{{ item.productNameSnapshot || 'Sản phẩm' }}</strong>
                      <div class="product-meta">
                        <span>Mã SP: {{ item.skuSnapshot || '---' }}</span>
                        <span>
                          Phân loại:
                          {{ item.colorSnapshot || '---' }} / {{ item.sizeSnapshot || '---' }}
                        </span>
                      </div>
                    </div>

                    <div class="product-line__price">
                      {{ formatVnd(item.lineTotalAmount) }}
                    </div>
                  </div>
                </div>

                <div v-else class="empty-inner">
                  Không có sản phẩm trong đơn hàng.
                </div>
              </section>

              <section class="content-card">
                <div class="section-head">
                  <h3>Tiến độ đơn hàng</h3>
                </div>

                <ul class="timeline-list">
                  <li v-if="order.createdAt" class="timeline-item is-done">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                      <strong>Đặt hàng thành công</strong>
                      <span>{{ formatDateTime(order.createdAt) }}</span>
                    </div>
                  </li>

                  <li
                    v-if="order.orderStatus === 'PROCESSING' || order.shippingStatus === 'READY_TO_SHIP' || order.shippedAt || order.completedAt"
                    class="timeline-item is-processing"
                  >
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                      <strong>{{ order.shippingStatus === 'READY_TO_SHIP' ? 'Đang chuẩn bị hàng' : 'Đã xác nhận đơn hàng' }}</strong>
                      <span>{{ formatDateTime(order.updatedAt || order.createdAt) }}</span>
                    </div>
                  </li>

                  <li
                    v-if="isBankTransferOrder && receivedAmount > 0"
                    class="timeline-item is-warning"
                  >
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                      <strong>{{ transferStateTitle }}</strong>
                      <span>{{ lastTransferReceivedAt ? formatDateTime(lastTransferReceivedAt) : '---' }}</span>
                    </div>
                  </li>

                  <li v-if="order.shippedAt" class="timeline-item is-shipping">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                      <strong>Đơn hàng đang được giao</strong>
                      <span>{{ formatDateTime(order.shippedAt) }}</span>
                    </div>
                  </li>

                  <li v-if="order.completedAt" class="timeline-item is-success">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                      <strong>Hoàn thành đơn hàng</strong>
                      <span>{{ formatDateTime(order.completedAt) }}</span>
                    </div>
                  </li>

                  <li v-if="order.cancelledAt" class="timeline-item is-cancel">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                      <strong>Đơn hàng đã hủy</strong>
                      <span>{{ formatDateTime(order.cancelledAt) }}</span>
                    </div>
                  </li>

                  <li v-if="order.returnedAt" class="timeline-item is-warning">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                      <strong>Đơn hàng hoàn / trả</strong>
                      <span>{{ formatDateTime(order.returnedAt) }}</span>
                    </div>
                  </li>
                </ul>
              </section>
            </div>

            <aside class="side-column">
              <section class="content-card sticky-card">
                <div class="section-head">
                  <h3>Chi tiết thanh toán</h3>
                </div>

                <div class="summary-content">
                  <div class="summary-row">
                    <span>Tổng tiền hàng</span>
                    <strong>{{ formatVnd(order.subtotalAmount) }}</strong>
                  </div>

                  <div
                    class="summary-row discount"
                    v-if="Number(order.promotionDiscountAmount || 0) > 0"
                  >
                    <span>Khuyến mãi</span>
                    <strong>- {{ formatVnd(order.promotionDiscountAmount) }}</strong>
                  </div>

                  <div
                    class="summary-row discount"
                    v-if="Number(order.voucherDiscountAmount || 0) > 0"
                  >
                    <span>Mã giảm giá</span>
                    <strong>- {{ formatVnd(order.voucherDiscountAmount) }}</strong>
                  </div>

                  <div class="summary-row">
                    <span>Phí vận chuyển</span>
                    <strong>{{ formatVnd(order.shippingFee) }}</strong>
                  </div>

                  <div class="summary-row total-row">
                    <span>Thành tiền</span>
                    <strong class="total-highlight">{{ formatVnd(order.finalAmount) }}</strong>
                  </div>
                </div>
              </section>

              <section
                v-if="isBankTransferOrder"
                class="content-card payment-status-card"
              >
                <div class="section-head">
                  <h3>Thanh toán chuyển khoản</h3>
                </div>

                <div class="transfer-state-box" :class="transferStateClass">
                  <div class="transfer-state-top">
                    <strong>{{ transferStateTitle }}</strong>
                    <span>{{ paymentStatusLabel(order) }}</span>
                  </div>

                  <p class="transfer-state-desc">
                    {{ transferStatusMessage }}
                  </p>

                  <div class="transfer-amount-grid">
                    <div class="transfer-amount-item">
                      <span>Khách cần trả</span>
                      <strong>{{ formatVnd(order.finalAmount) }}</strong>
                    </div>

                    <div class="transfer-amount-item">
                      <span>Đã nhận</span>
                      <strong>{{ formatVnd(receivedAmount) }}</strong>
                    </div>

                    <div
                      v-if="paymentDifference > 0"
                      class="transfer-amount-item is-danger"
                    >
                      <span>Còn thiếu</span>
                      <strong>{{ formatVnd(paymentDifference) }}</strong>
                    </div>

                    <div
                      v-else-if="paymentDifference < 0"
                      class="transfer-amount-item is-warning"
                    >
                      <span>Chuyển dư</span>
                      <strong>{{ formatVnd(Math.abs(paymentDifference)) }}</strong>
                    </div>

                    <div
                      v-else
                      class="transfer-amount-item is-success"
                    >
                      <span>Kết quả</span>
                      <strong>Đã nhận đủ</strong>
                    </div>
                  </div>

                  <div v-if="lastTransferReceivedAt" class="transfer-last-time">
                    Ghi nhận lần nhận tiền gần nhất: {{ formatDateTime(lastTransferReceivedAt) }}
                  </div>

                  <button
                    v-if="canShowPaymentQr"
                    class="primary-btn primary-btn--full"
                    type="button"
                    @click="openQrModal"
                  >
                    Xem mã QR thanh toán
                  </button>
                </div>
              </section>
            </aside>
          </div>
        </section>

        <section v-else class="lookup-card lookup-card--hint">
          <div class="lookup-empty">
            <div class="empty-icon-wrapper">
              <svg viewBox="0 0 24 24" width="44" height="44" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <h3>Chưa có dữ liệu tra cứu</h3>
            <p>Nhập mã đơn hàng phía trên để xem chi tiết đơn của bạn.</p>
          </div>
        </section>
      </transition>
    </section>

    <transition name="fade">
      <div v-if="qrModalOpen" class="qr-modal-backdrop" @click.self="qrModalOpen = false">
        <div class="qr-modal-card">
          <div class="qr-modal-head">
            <div>
              <h3>Mã QR thanh toán đơn hàng</h3>
              <p>Quét mã để chuyển khoản đúng nội dung đơn hàng.</p>
            </div>
            <button class="qr-close-btn" @click="qrModalOpen = false">×</button>
          </div>

          <div class="qr-modal-body">
            <div class="qr-preview-box">
              <img
                v-if="paymentQrImage"
                :src="paymentQrImage"
                alt="QR thanh toán"
                class="qr-preview-image"
              />
              <div v-else class="qr-preview-empty">
                Chưa có dữ liệu QR thanh toán
              </div>
            </div>

            <div class="qr-info-list">
              <div class="qr-info-item">
                <span>Mã đơn</span>
                <strong>{{ order?.orderCode || '---' }}</strong>
              </div>

              <div class="qr-info-item">
                <span>Số tiền cần thanh toán</span>
                <strong class="text-danger">
                  {{ formatVnd(paymentDifference > 0 ? paymentDifference : order?.finalAmount) }}
                </strong>
              </div>

              <div class="qr-info-item">
                <span>Ngân hàng</span>
                <strong>{{ paymentBankName }}</strong>
              </div>

              <div class="qr-info-item">
                <span>Số tài khoản</span>
                <strong>{{ paymentBankAccount }}</strong>
              </div>

              <div class="qr-info-item">
                <span>Chủ tài khoản</span>
                <strong>{{ paymentAccountName }}</strong>
              </div>

              <div class="qr-info-item">
                <span>Nội dung chuyển khoản</span>
                <strong class="text-primary">{{ paymentTransferContent }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import api from '@/api/axios'

const loading = ref(false)
const errorMessage = ref('')
const order = ref(null)
const qrModalOpen = ref(false)

const fallbackImage = 'https://via.placeholder.com/100x100?text=No+Image'

const form = ref({
  keyword: '',
})

function pickNumber(...values) {
  for (const value of values) {
    if (value === undefined || value === null || value === '') continue
    const num = Number(value)
    if (!Number.isNaN(num)) return num
  }
  return 0
}

function formatVnd(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(value || 0))
}

function formatDateTime(value) {
  if (!value) return '---'
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function fullShippingAddress(currentOrder) {
  return [
    currentOrder.shippingDetailAddress,
    currentOrder.shippingWard,
    currentOrder.shippingDistrict,
    currentOrder.shippingProvince,
  ]
    .filter(Boolean)
    .join(', ')
}

const isBankTransferOrder = computed(() =>
  String(order.value?.paymentMethod || '').toUpperCase() === 'BANK_TRANSFER'
)

const receivedAmount = computed(() =>
  pickNumber(
    order.value?.receivedAmount,
    order.value?.actualReceivedAmount,
    order.value?.paidAmount,
    order.value?.actualPaidAmount,
    order.value?.paymentActualAmount,
    order.value?.latestPayment?.actualAmount,
    order.value?.paymentTransaction?.actualAmount,
    order.value?.transactionSummary?.actualAmount
  )
)

const paymentDifference = computed(() =>
  pickNumber(order.value?.finalAmount) - receivedAmount.value
)

const lastTransferReceivedAt = computed(() =>
  order.value?.lastTransferReceivedAt
  || order.value?.paymentReceivedAt
  || order.value?.latestPayment?.confirmedAt
  || order.value?.paymentTransaction?.confirmedAt
  || order.value?.transactionSummary?.confirmedAt
  || null
)

const canShowPaymentQr = computed(() => {
  if (!isBankTransferOrder.value) return false

  const status = String(order.value?.paymentStatus || '').toUpperCase()
  if (['PAID', 'REFUNDED', 'FAILED'].includes(status)) return false
  if (String(order.value?.orderStatus || '').toUpperCase() === 'CANCELLED') return false

  return paymentDifference.value > 0 || ['UNPAID', 'PENDING', 'PARTIALLY_PAID'].includes(status)
})

const transferStateTitle = computed(() => {
  if (!isBankTransferOrder.value) return ''
  if (String(order.value?.paymentStatus || '').toUpperCase() === 'FAILED') return 'Thanh toán chuyển khoản lỗi'
  if (receivedAmount.value <= 0) return 'Chưa ghi nhận chuyển khoản'
  if (paymentDifference.value > 0) return 'Khách đang chuyển thiếu'
  if (paymentDifference.value < 0) return 'Khách đã chuyển dư'
  return 'Đã nhận đủ tiền'
})

const transferStateClass = computed(() => {
  if (!isBankTransferOrder.value) return ''
  if (String(order.value?.paymentStatus || '').toUpperCase() === 'FAILED') return 'is-underpaid'
  if (receivedAmount.value <= 0) return 'is-unpaid'
  if (paymentDifference.value > 0) return 'is-underpaid'
  if (paymentDifference.value < 0) return 'is-overpaid'
  return 'is-paid'
})

const transferStatusMessage = computed(() => {
  if (!isBankTransferOrder.value) return ''

  if (String(order.value?.paymentStatus || '').toUpperCase() === 'FAILED') {
    return order.value?.paymentErrorMessage || 'Thanh toán chuyển khoản lỗi. Bạn đã chuyển sai số tiền. Vui lòng liên hệ admin để được xử lý.'
  }

  if (receivedAmount.value <= 0) {
    return `Đơn hàng chưa ghi nhận khoản chuyển nào. Khách cần thanh toán ${formatVnd(order.value?.finalAmount)}.`
  }

  if (paymentDifference.value > 0) {
    return `Khách đã chuyển ${formatVnd(receivedAmount.value)}, còn thiếu ${formatVnd(paymentDifference.value)}.`
  }

  if (paymentDifference.value < 0) {
    return `Khách đã chuyển ${formatVnd(receivedAmount.value)}, dư ${formatVnd(Math.abs(paymentDifference.value))}.`
  }

  return `Khách đã chuyển đủ ${formatVnd(receivedAmount.value)}.`
})

const paymentQrImage = computed(() =>
  order.value?.qrImageUrl
  || order.value?.paymentQrImage
  || order.value?.paymentQrUrl
  || order.value?.sepayQrImageUrl
  || ''
)

const paymentBankName = computed(() =>
  order.value?.bankName
  || order.value?.bankCode
  || order.value?.paymentBankName
  || 'Đang cập nhật'
)

const paymentBankAccount = computed(() =>
  order.value?.bankAccountNo
  || order.value?.accountNumber
  || order.value?.paymentBankAccount
  || 'Đang cập nhật'
)

const paymentAccountName = computed(() =>
  order.value?.accountName
  || order.value?.bankAccountName
  || order.value?.paymentAccountName
  || 'Đang cập nhật'
)

const paymentTransferContent = computed(() =>
  order.value?.transferContent
  || order.value?.paymentCode
  || order.value?.lookupCode
  || order.value?.orderCode
  || 'Đang cập nhật'
)

function openQrModal() {
  qrModalOpen.value = true
}

function getOrderStatusStyle(status) {
  const value = String(status || '').toUpperCase()

  if (value === 'COMPLETED') return 'status-chip--success'
  if (value === 'CANCELLED') return 'status-chip--danger'
  if (value === 'SHIPPING') return 'status-chip--warning'
  if (value === 'PROCESSING') return 'status-chip--info'
  if (value === 'NEW') return 'status-chip--outline'

  return 'status-chip--outline'
}

function getShippingStatusStyle(status, channel) {
  if (String(channel || '').toUpperCase() === 'OFFLINE') {
    return 'status-chip--outline'
  }

  const value = String(status || '').toUpperCase()

  if (value === 'DELIVERED') return 'status-chip--success'
  if (['DELIVERY_FAILED', 'RETURNED_TO_SENDER'].includes(value)) return 'status-chip--danger'
  if (['SHIPPED', 'READY_TO_SHIP'].includes(value)) return 'status-chip--warning'
  if (value === 'PENDING') return 'status-chip--outline'

  return 'status-chip--outline'
}

function getPaymentStatusStyle(currentOrder) {
  const value = String(currentOrder?.paymentStatus || '').toUpperCase()

  if (String(currentOrder?.paymentMethod || '').toUpperCase() !== 'BANK_TRANSFER') {
    if (value === 'PAID') return 'status-chip--success'
    if (['FAILED', 'REFUNDED'].includes(value)) return 'status-chip--danger'
    if (['PENDING', 'PARTIALLY_PAID'].includes(value)) return 'status-chip--warning'
    return 'status-chip--outline'
  }

  if (receivedAmount.value <= 0) return 'status-chip--danger'
  if (paymentDifference.value > 0) return 'status-chip--warning'
  if (paymentDifference.value < 0) return 'status-chip--info'
  return 'status-chip--success'
}

function orderStatusLabel(status, currentOrder) {
  const value = String(status || '').toUpperCase()
  const channel = String(currentOrder?.channel || '').toUpperCase()
  const shipping = String(currentOrder?.shippingStatus || '').toUpperCase()
  const payment = String(currentOrder?.paymentStatus || '').toUpperCase()

  if (channel === 'OFFLINE' && payment === 'PAID') return 'Hoàn thành'

  if (value === 'NEW') return 'Chờ xác nhận'
  if (value === 'PROCESSING') {
    if (channel === 'ONLINE' && shipping === 'READY_TO_SHIP') return 'Đang chuẩn bị hàng'
    return 'Đã xác nhận'
  }
  if (value === 'SHIPPING') return 'Đang giao hàng'
  if (value === 'COMPLETED') return 'Hoàn thành'
  if (value === 'CANCELLED') return 'Đã hủy'

  return status || '---'
}

function shippingStatusLabel(status, channel) {
  if (String(channel || '').toUpperCase() === 'OFFLINE') return 'Nhận tại quầy'

  const value = String(status || '').toUpperCase()
  if (value === 'PENDING') return 'Chưa xử lý'
  if (value === 'READY_TO_SHIP') return 'Sẵn sàng giao'
  if (value === 'SHIPPED') return 'Đang giao'
  if (value === 'DELIVERED') return 'Giao thành công'
  if (value === 'DELIVERY_FAILED') return 'Giao thất bại'
  if (value === 'RETURNED_TO_SENDER') return 'Hoàn về kho'

  return status || '---'
}

function paymentStatusLabel(currentOrder) {
  const value = String(currentOrder?.paymentStatus || '').toUpperCase()

  if (String(currentOrder?.paymentMethod || '').toUpperCase() === 'BANK_TRANSFER') {
    if (String(order.value?.paymentStatus || '').toUpperCase() === 'FAILED') return 'Thanh toán chuyển khoản lỗi'
  if (receivedAmount.value <= 0) return 'Chưa ghi nhận chuyển khoản'
    if (paymentDifference.value > 0) return `Chuyển thiếu ${formatVnd(paymentDifference.value)}`
    if (paymentDifference.value < 0) return `Chuyển dư ${formatVnd(Math.abs(paymentDifference.value))}`
    return 'Đã nhận đủ tiền'
  }

  if (value === 'UNPAID') return 'Chưa thanh toán'
  if (value === 'PENDING') return 'Chờ xác nhận'
  if (value === 'PARTIALLY_PAID') return 'Thanh toán một phần'
  if (value === 'PAID') return 'Đã thanh toán'
  if (value === 'FAILED') return 'Thanh toán lỗi'
  if (value === 'PARTIALLY_REFUNDED') return 'Hoàn một phần'
  if (value === 'REFUNDED') return 'Đã hoàn tiền'

  return currentOrder?.paymentStatus || '---'
}

function paymentMethodLabel(value) {
  const normalized = String(value || '').toUpperCase()
  if (normalized === 'COD') return 'Thanh toán khi nhận hàng'
  if (normalized === 'BANK_TRANSFER') return 'Chuyển khoản ngân hàng'
  if (normalized === 'CASH') return 'Tiền mặt'
  if (normalized === 'VNPAY') return 'VNPay'
  if (normalized === 'MOMO') return 'Ví MoMo'
  return value || '---'
}

function shippingCarrierLabel(currentOrder) {
  if (String(currentOrder?.channel || '').toUpperCase() === 'OFFLINE') return 'Nhận trực tiếp tại cửa hàng'
  return 'Đang cập nhật'
}

function trackingCodeLabel(currentOrder) {
  if (String(currentOrder?.channel || '').toUpperCase() === 'OFFLINE') return 'Không áp dụng'
  return 'Đang cập nhật'
}

async function handleLookup() {
  errorMessage.value = ''
  order.value = null
  qrModalOpen.value = false

  if (!form.value.keyword) {
    errorMessage.value = 'Vui lòng nhập mã đơn hàng.'
    return
  }

  try {
    loading.value = true

    const res = await api.get('/storefront/orders/lookup', {
      params: {
        keyword: form.value.keyword,
      },
    })

    order.value = res.data || null

    if (!order.value) {
      errorMessage.value = 'Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn.'
    }
  } catch (e) {
    errorMessage.value =
      getErrorMessage(e, 'Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn.')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.order-lookup-page {
  --primary: #0f172a;
  --primary-2: #1e293b;
  --accent: #2563eb;
  --accent-soft: #eff6ff;
  --success: #16a34a;
  --success-bg: #f0fdf4;
  --success-border: #bbf7d0;
  --warning: #d97706;
  --warning-bg: #fffbeb;
  --warning-border: #fde68a;
  --danger: #dc2626;
  --danger-bg: #fef2f2;
  --danger-border: #fecaca;
  --info: #0284c7;
  --info-bg: #f0f9ff;
  --info-border: #bae6fd;

  --text-main: #0f172a;
  --text-soft: #64748b;
  --text-faint: #94a3b8;
  --line: #e2e8f0;
  --line-soft: #edf2f7;
  --bg-soft: #f8fafc;
  --white: #ffffff;
  --radius-xl: 28px;
  --radius-lg: 20px;
  --radius-md: 14px;
  --shadow-lg: 0 30px 80px rgba(15, 23, 42, 0.08);
  --shadow-md: 0 16px 40px rgba(15, 23, 42, 0.06);

  position: relative;
  max-width: 1180px;
  margin: 0 auto;
  padding: 32px 16px 72px;
  color: var(--text-main);
}

.lookup-bg {
  position: absolute;
  inset: 0 0 auto 0;
  height: 280px;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 35%),
    radial-gradient(circle at top right, rgba(15, 23, 42, 0.08), transparent 28%);
  pointer-events: none;
  z-index: 0;
}

.lookup-shell {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.lookup-hero {
  text-align: center;
  padding: 18px 0 10px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(226, 232, 240, 0.95);
  color: var(--accent);
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 16px;
  backdrop-filter: blur(8px);
}

.lookup-hero h1 {
  margin: 0 0 14px;
  font-size: 42px;
  line-height: 1.12;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--primary);
}

.lookup-sub {
  max-width: 760px;
  margin: 0 auto;
  color: var(--text-soft);
  line-height: 1.7;
  font-size: 16px;
}

.lookup-card,
.lookup-result {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(10px);
}

.lookup-card {
  padding: 28px;
}

.lookup-card--form {
  padding: 30px;
}

.lookup-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.form-grid--single {
  grid-template-columns: 1fr;
  max-width: 760px;
  margin: 0 auto;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-field label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
}

.form-field label svg {
  color: var(--text-soft);
}

.input-wrap {
  position: relative;
}

.form-field input {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 17px 18px;
  outline: none;
  font-size: 15px;
  background: var(--bg-soft);
  transition: all 0.22s ease;
  color: var(--text-main);
}

.form-field input::placeholder {
  color: #94a3b8;
}

.form-field input:focus {
  border-color: var(--accent);
  background: var(--white);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.10);
}

.field-hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-soft);
}

.form-actions {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}

.primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 220px;
  border: none;
  border-radius: 16px;
  padding: 15px 28px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-2) 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.22s ease;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.16);
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 20px 36px rgba(15, 23, 42, 0.20);
}

.primary-btn:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.lookup-state--error {
  margin-top: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid #fecaca;
  border-radius: 16px;
  padding: 14px 16px;
  font-size: 14px;
  font-weight: 600;
}

.lookup-state--loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 16px;
  color: var(--text-soft);
  text-align: center;
}

.lookup-result {
  padding: 28px;
}

.result-top {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 20px;
  align-items: stretch;
  margin-bottom: 22px;
}

.result-summary {
  border: 1px solid var(--line-soft);
  border-radius: 20px;
  padding: 22px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.order-date {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--text-soft);
}

.result-summary h2 {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.2;
}

.result-note {
  margin: 0;
  color: var(--text-soft);
  line-height: 1.6;
  font-size: 14px;
}

.result-total-box {
  border-radius: 20px;
  padding: 22px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.result-total-box span {
  font-size: 13px;
  opacity: 0.82;
  margin-bottom: 10px;
}

.result-total-box strong {
  font-size: 30px;
  line-height: 1.2;
  font-weight: 800;
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 22px;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 700;
  transition: all 0.2s;
}

.status-chip--success {
  background: var(--success-bg);
  border: 1px solid var(--success-border);
  color: var(--success);
}

.status-chip--warning {
  background: var(--warning-bg);
  border: 1px solid var(--warning-border);
  color: var(--warning);
}

.status-chip--danger {
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
  color: var(--danger);
}

.status-chip--info {
  background: var(--info-bg);
  border: 1px solid var(--info-border);
  color: var(--info);
}

.status-chip--outline {
  background: #fff;
  border: 1px solid var(--line);
  color: var(--text-soft);
}

.payment-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid var(--warning-border);
  background: linear-gradient(180deg, #fffdf5 0%, #fffaf0 100%);
  margin-bottom: 22px;
}

.payment-action-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.payment-action-info strong {
  font-size: 15px;
  color: var(--text-main);
}

.payment-action-info p {
  margin: 0;
  font-size: 14px;
  color: var(--text-soft);
  line-height: 1.6;
}

.secondary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 190px;
  border: 1px solid var(--primary);
  border-radius: 14px;
  padding: 13px 18px;
  background: #fff;
  color: var(--primary);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.22s ease;
}

.secondary-btn:hover {
  transform: translateY(-1px);
  background: #f8fafc;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.overview-card {
  background: #fff;
  border: 1px solid var(--line-soft);
  border-radius: 20px;
  padding: 18px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.overview-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: var(--bg-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  flex-shrink: 0;
}

.overview-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.overview-content span {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-soft);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.overview-content strong {
  font-size: 15px;
  line-height: 1.5;
  color: var(--text-main);
  word-break: break-word;
}

.overview-content small {
  font-size: 13px;
  color: var(--text-soft);
  line-height: 1.5;
  word-break: break-word;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(320px, 0.9fr);
  gap: 24px;
}

.main-column,
.side-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-card {
  background: #fff;
  border: 1px solid var(--line-soft);
  border-radius: 22px;
  padding: 22px;
  box-shadow: var(--shadow-md);
}

.sticky-card {
  position: sticky;
  top: 20px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.section-head h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
}

.section-head span {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-soft);
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.product-line {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  border: 1px solid var(--line-soft);
  border-radius: 18px;
  padding: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #fcfdff 100%);
}

.product-image-wrapper {
  position: relative;
  width: 84px;
  height: 84px;
}

.product-image-wrapper img {
  width: 100%;
  height: 100%;
  border-radius: 14px;
  object-fit: cover;
  border: 1px solid var(--line);
  background: #fff;
}

.product-qty-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 28px;
  height: 28px;
  border-radius: 999px;
  background: var(--primary);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  padding: 0 8px;
}

.product-line__content {
  min-width: 0;
}

.product-line__content strong {
  display: block;
  margin-bottom: 6px;
  font-size: 16px;
  line-height: 1.5;
}

.product-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--text-soft);
  font-size: 14px;
}

.product-line__price {
  font-size: 16px;
  font-weight: 800;
  color: var(--primary);
  white-space: nowrap;
}

.timeline-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.timeline-item {
  position: relative;
  display: flex;
  gap: 14px;
  padding-bottom: 20px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 7px;
  top: 18px;
  bottom: -2px;
  width: 2px;
  background: var(--line);
}

.timeline-dot {
  position: relative;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
  background: #cbd5e1;
  z-index: 1;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline-content strong {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
}

.timeline-content span {
  font-size: 13px;
  color: var(--text-soft);
}

.timeline-item.is-done .timeline-dot {
  background: var(--accent);
}

.timeline-item.is-processing .timeline-dot {
  background: #3b82f6;
}

.timeline-item.is-shipping .timeline-dot {
  background: var(--warning);
}

.timeline-item.is-success .timeline-dot {
  background: var(--success);
}

.timeline-item.is-cancel .timeline-dot {
  background: var(--danger);
}

.timeline-item.is-warning .timeline-dot {
  background: #f59e0b;
}

.summary-content {
  border: 1px solid var(--line-soft);
  border-radius: 18px;
  padding: 18px;
  background: var(--bg-soft);
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  color: var(--text-soft);
  font-size: 15px;
}

.summary-row strong {
  color: var(--text-main);
  font-weight: 700;
  text-align: right;
}

.summary-row.discount,
.summary-row.discount strong {
  color: var(--success);
}

.total-row {
  margin-top: 10px;
  padding-top: 18px;
  border-top: 1px dashed #cbd5e1;
}

.total-highlight {
  font-size: 24px;
  font-weight: 900;
  color: var(--primary) !important;
}

.payment-status-card {
  overflow: hidden;
}

.transfer-state-box {
  border-radius: 18px;
  padding: 18px;
  border: 1px solid var(--line);
}

.transfer-state-box.is-unpaid {
  background: var(--danger-bg);
  border-color: var(--danger-border);
}

.transfer-state-box.is-underpaid {
  background: var(--warning-bg);
  border-color: var(--warning-border);
}

.transfer-state-box.is-overpaid {
  background: var(--info-bg);
  border-color: var(--info-border);
}

.transfer-state-box.is-paid {
  background: var(--success-bg);
  border-color: var(--success-border);
}

.transfer-state-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.transfer-state-top strong {
  font-size: 16px;
  color: var(--text-main);
}

.transfer-state-top span {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-soft);
}

.transfer-state-desc {
  margin: 0 0 14px;
  font-size: 14px;
  color: var(--text-soft);
  line-height: 1.6;
}

.transfer-amount-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.transfer-amount-item {
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.transfer-amount-item span {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-soft);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.transfer-amount-item strong {
  font-size: 16px;
  color: var(--text-main);
  line-height: 1.4;
}

.transfer-amount-item.is-danger strong {
  color: var(--danger);
}

.transfer-amount-item.is-warning strong {
  color: var(--warning);
}

.transfer-amount-item.is-success strong {
  color: var(--success);
}

.transfer-last-time {
  margin-top: 12px;
  font-size: 13px;
  color: var(--text-soft);
}

.primary-btn--full {
  width: 100%;
  margin-top: 16px;
}

.lookup-card--hint {
  padding: 36px 20px;
}

.lookup-empty {
  text-align: center;
  color: var(--text-soft);
}

.empty-icon-wrapper {
  width: 82px;
  height: 82px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-soft);
  color: var(--text-faint);
  margin: 0 auto 14px;
}

.lookup-empty h3 {
  margin: 0 0 8px;
  font-size: 20px;
  color: var(--text-main);
}

.lookup-empty p {
  margin: 0;
  line-height: 1.6;
}

.empty-inner {
  border: 1px dashed var(--line);
  border-radius: 16px;
  padding: 18px;
  text-align: center;
  color: var(--text-soft);
  background: #fcfdff;
}

.qr-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.qr-modal-card {
  width: 100%;
  max-width: 760px;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.3);
  overflow: hidden;
}

.qr-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px 16px;
  border-bottom: 1px solid var(--line-soft);
}

.qr-modal-head h3 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 800;
  color: var(--text-main);
}

.qr-modal-head p {
  margin: 0;
  color: var(--text-soft);
  font-size: 14px;
  line-height: 1.6;
}

.qr-close-btn {
  border: none;
  background: #f8fafc;
  color: var(--text-main);
  width: 38px;
  height: 38px;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
}

.qr-modal-body {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  padding: 24px;
}

.qr-preview-box {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 20px;
  border: 1px solid var(--line);
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.qr-preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qr-preview-empty {
  color: var(--text-soft);
  text-align: center;
  padding: 20px;
  line-height: 1.6;
}

.qr-info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qr-info-item {
  border: 1px solid var(--line-soft);
  border-radius: 14px;
  padding: 14px 16px;
  background: #fcfdff;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qr-info-item span {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-soft);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.qr-info-item strong {
  font-size: 15px;
  line-height: 1.5;
  color: var(--text-main);
  word-break: break-word;
}

.spinner,
.spinner-large {
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
}

.spinner-large {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(15, 23, 42, 0.08);
  border-top-color: var(--primary);
  margin-bottom: 14px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 1100px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .sticky-card {
    position: static;
  }
}

@media (max-width: 768px) {
  .order-lookup-page {
    padding: 22px 12px 48px;
  }

  .lookup-hero h1 {
    font-size: 30px;
  }

  .lookup-card,
  .lookup-result,
  .lookup-card--form {
    padding: 18px;
  }

  .result-top {
    grid-template-columns: 1fr;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .product-line {
    grid-template-columns: 72px minmax(0, 1fr);
  }

  .product-image-wrapper {
    width: 72px;
    height: 72px;
  }

  .product-line__price {
    grid-column: 1 / -1;
    padding-top: 10px;
    margin-top: 4px;
    border-top: 1px dashed var(--line);
    text-align: right;
  }

  .status-row {
    gap: 8px;
  }

  .status-chip {
    width: 100%;
    justify-content: center;
  }

  .result-summary h2 {
    font-size: 22px;
  }

  .result-total-box strong {
    font-size: 24px;
  }

  .total-highlight {
    font-size: 22px;
  }

  .payment-action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .secondary-btn {
    width: 100%;
  }

  .transfer-amount-grid {
    grid-template-columns: 1fr;
  }

  .qr-modal-body {
    grid-template-columns: 1fr;
  }
}
</style>
