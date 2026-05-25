<template>
  <div class="account-page">
    <section class="account-card">
      <div class="account-card__header">
        <div>
          <h1>Tài khoản của tôi</h1>
          <p>Quản lý thông tin cá nhân, địa chỉ giao hàng và đơn hàng</p>
        </div>

        <button class="logout-btn" @click="handleLogout">
          Đăng xuất
        </button>
      </div>

      <div v-if="loading" class="account-state">
        Đang tải thông tin tài khoản...
      </div>

      <div v-else-if="unauthorized" class="account-state account-state--error">
        Bạn cần đăng nhập để xem tài khoản.
      </div>

      <div v-else-if="error" class="account-state account-state--error">
        {{ error }}
      </div>

      <div v-else>
        <div class="section-block">
          <div class="section-head">
            <h3>Hồ sơ cá nhân</h3>
          </div>

          <form class="profile-form" @submit.prevent="handleUpdateProfile">
            <div class="account-grid">
              <div class="account-field">
                <label>Họ tên</label>
                <input v-model="profileForm.fullName" type="text" placeholder="Nhập họ tên" />
              </div>

              <div class="account-field">
                <label>Email đăng nhập</label>
                <input :value="profile.email || ''" type="text" disabled />
              </div>

              <div class="account-field">
                <label>Số điện thoại</label>
                <input v-model="profileForm.phone" type="text" placeholder="Nhập số điện thoại" />
              </div>

              <div class="account-field">
                <label>Ngày sinh</label>
                <input v-model="profileForm.ngaySinh" type="date" />
              </div>

              <div class="account-field">
                <label>Hạng khách</label>
                <input :value="customer.loaiKhach || 'Chưa cập nhật'" type="text" disabled />
              </div>

              <div class="account-field">
                <label>Điểm tích lũy</label>
                <input :value="customer.diemTichLuy ?? 0" type="text" disabled />
              </div>
            </div>

            <div class="form-actions">
              <button class="primary-btn" type="submit" :disabled="savingProfile">
                {{ savingProfile ? 'Đang lưu...' : 'Lưu hồ sơ' }}
              </button>
            </div>
          </form>
        </div>

        <div v-if="hasCustomerProfile" class="section-block vip-panel">
          <div class="section-head">
            <h3>Thông tin VIP / điểm tích lũy</h3>
          </div>
          <div class="vip-grid">
            <div class="vip-card">
              <span>Cấp độ hiện tại</span>
              <strong>{{ vipInfo.rankName }}</strong>
            </div>
            <div class="vip-card">
              <span>Điểm tích lũy</span>
              <strong>{{ Number(vipInfo.points || 0).toLocaleString('vi-VN') }} điểm</strong>
            </div>
            <div class="vip-card">
              <span>Ưu đãi</span>
              <strong>{{ vipInfo.discountPercent > 0 ? `Giảm ${vipInfo.discountPercent}%` : 'Chưa có ưu đãi' }}</strong>
            </div>
            <div class="vip-card" v-if="vipInfo.nextRankName">
              <span>Hạng tiếp theo</span>
              <strong>Còn {{ Number(vipInfo.pointsToNextRank || 0).toLocaleString('vi-VN') }} điểm để lên {{ vipInfo.nextRankName }}</strong>
            </div>
          </div>
          <p v-if="vipInfo.description" class="vip-note">{{ vipInfo.description }}</p>
        </div>

        <div class="section-block">
          <div class="section-head">
            <h3>Địa chỉ giao hàng</h3>
            <button class="primary-btn" type="button" @click="startCreateAddress">
              Thêm địa chỉ
            </button>
          </div>

          <div v-if="!hasCustomerProfile" class="empty-state">
            Tài khoản này chưa có hồ sơ khách hàng.
          </div>

          <div v-else>
            <form
              v-if="showAddressForm"
              class="address-form"
              @submit.prevent="handleSubmitAddress"
            >
              <div class="account-grid">
                <div class="account-field">
                  <label>Nhãn</label>
                  <input v-model="addressForm.label" type="text" placeholder="Ví dụ: Nhà riêng" />
                </div>

                <div class="account-field">
                  <label>Tên người nhận</label>
                  <input v-model="addressForm.recipientName" type="text" placeholder="Nhập tên người nhận" />
                </div>

                <div class="account-field">
                  <label>Số điện thoại</label>
                  <input v-model="addressForm.phone" type="text" placeholder="Nhập số điện thoại" />
                </div>

                <div class="account-field">
                  <label>Tỉnh / Thành phố</label>
                  <select v-model="addressForm.province" @change="onProvinceChange" required>
                    <option value="" disabled>Chọn Tỉnh/Thành phố</option>
                    <option v-for="p in provincesData" :key="p.code" :value="p.name">{{ p.name }}</option>
                  </select>
                </div>

                <div class="account-field">
                  <label>Quận / Huyện</label>
                  <select v-model="addressForm.district" @change="onDistrictChange" :disabled="!addressForm.province" required>
                    <option value="" disabled>Chọn Quận/Huyện</option>
                    <option v-for="d in districtsData" :key="d.code" :value="d.name">{{ d.name }}</option>
                  </select>
                </div>

                <div class="account-field">
                  <label>Phường / Xã</label>
                  <select v-model="addressForm.ward" :disabled="!addressForm.district" required>
                    <option value="" disabled>Chọn Phường/Xã</option>
                    <option v-for="w in wardsData" :key="w.code" :value="w.name">{{ w.name }}</option>
                  </select>
                </div>

                <div class="account-field account-field--full">
                  <label>Địa chỉ chi tiết</label>
                  <input v-model="addressForm.detailAddress" type="text" placeholder="Số nhà, tên đường..." required/>
                </div>

                <div class="account-field">
                  <label class="checkbox-line">
                    <input v-model="addressForm.isDefault" type="checkbox" />
                    Đặt làm địa chỉ mặc định
                  </label>
                </div>
              </div>

              <div class="form-actions">
                <button class="primary-btn" type="submit" :disabled="savingAddress">
                  {{ savingAddress ? 'Đang lưu...' : (editingAddressId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ') }}
                </button>
                <button class="secondary-btn" type="button" @click="cancelAddressForm">
                  Hủy
                </button>
              </div>
            </form>

            <div v-if="addresses.length === 0" class="empty-state">
              Chưa có địa chỉ giao hàng.
            </div>

            <div
              v-for="addr in addresses"
              :key="addr.id"
              class="address-card"
            >
              <div class="address-card__top">
                <strong>{{ addr.recipientName || 'Chưa có người nhận' }}</strong>
                <span v-if="addr.isDefault === 1" class="default-badge">
                  Mặc định
                </span>
              </div>

              <p v-if="addr.label"><b>Nhãn:</b> {{ addr.label }}</p>
              <p>{{ addr.phone || 'Chưa có số điện thoại' }}</p>
              <p>{{ joinAddress(addr) }}</p>

              <div class="card-actions">
                <button class="secondary-btn" type="button" @click="startEditAddress(addr)">
                  Sửa
                </button>
                <button class="danger-btn" type="button" @click="handleDeleteAddress(addr.id)">
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="section-block">
          <div class="section-head order-section-head">
            <div>
              <h3>Đơn hàng của tôi</h3>
              <p>Theo dõi trạng thái xử lý, thanh toán và vận chuyển của từng đơn hàng.</p>
            </div>
          </div>

          <div v-if="!ordersLoading && orders.length > 0" class="order-overview">
            <div class="overview-card">
              <span>Tổng đơn</span>
              <strong>{{ orderStats.total }}</strong>
            </div>
            <div class="overview-card">
              <span>Đang xử lý</span>
              <strong>{{ orderStats.processing }}</strong>
            </div>
            <div class="overview-card">
              <span>Đã hoàn thành</span>
              <strong>{{ orderStats.completed }}</strong>
            </div>
            <div class="overview-card overview-card--money">
              <span>Tổng đã mua</span>
              <strong>{{ formatVnd(orderStats.totalAmount) }}</strong>
            </div>
          </div>

          <div v-if="ordersLoading" class="account-state">
            Đang tải đơn hàng...
          </div>

          <div v-else-if="orders.length === 0" class="empty-state">
            Bạn chưa có đơn hàng nào.
          </div>

          <div v-else class="order-list">
            <article
              v-for="order in orders"
              :key="order.id"
              class="order-card order-card--premium"
            >
              <div class="order-card__top">
                <div class="order-title">
                  <span class="order-code">{{ order.orderCode || '---' }}</span>
                  <p>Ngày đặt: {{ formatDateTime(order.createdAt) }}</p>
                </div>

                <div class="order-card__amount">
                  <span>Tổng thanh toán</span>
                  <strong>{{ formatVnd(order.finalAmount) }}</strong>
                </div>
              </div>

              <div class="order-progress-line">
                <span :class="['status-chip', 'status-chip--strong', statusClass(order.orderStatus)]">
                  {{ statusLabel('order', order.orderStatus) }}
                </span>
                <span :class="['status-chip', statusClass(order.paymentStatus)]">
                  {{ statusLabel('payment', order.paymentStatus) }}
                </span>
                <span :class="['status-chip', statusClass(order.shippingStatus)]">
                  {{ statusLabel('shipping', order.shippingStatus) }}
                </span>
              </div>

              <div class="order-info-grid">
                <div>
                  <span>Phương thức</span>
                  <strong>{{ statusLabel('paymentMethod', order.paymentMethod) }}</strong>
                </div>
                <div>
                  <span>Số sản phẩm</span>
                  <strong>{{ Number(order.totalItems || 0).toLocaleString('vi-VN') }}</strong>
                </div>
                <div>
                  <span>Mã tra cứu</span>
                  <strong>{{ order.lookupCode || '---' }}</strong>
                </div>
              </div>

              <div class="card-actions order-actions">
                <button class="primary-btn" type="button" @click="handleViewOrderDetail(order.id)">
                  Xem chi tiết đơn
                </button>
                <button
                  v-if="canRequestReturn(order)"
                  class="secondary-btn"
                  type="button"
                  @click="openReturnModal(order.id)"
                >
                  Yêu cầu trả hàng
                </button>
              </div>
            </article>
          </div>
        </div>

      </div>
    </section>



    <a-modal
      v-model:open="returnModalOpen"
      title="Yêu cầu trả hàng hoàn tiền"
      width="860px"
      ok-text="Gửi yêu cầu"
      cancel-text="Đóng"
      :confirmLoading="returnSubmitting"
      centered
      @ok="submitReturnRequest"
    >
      <div v-if="returnOrderLoading" class="account-state">Đang tải đơn hàng...</div>
      <div v-else-if="returnOrder">
        <p class="return-note">
          Chỉ đơn hàng đã hoàn thành trong vòng 7 ngày mới được yêu cầu trả hàng hoàn tiền.
        </p>
        <div class="account-field account-field--full">
          <label>Lý do trả hàng</label>
          <input v-model="returnForm.reason" type="text" placeholder="Ví dụ: Sản phẩm bị lỗi, sai size..." />
        </div>
        <div class="account-field account-field--full">
          <label>Ghi chú</label>
          <textarea v-model="returnForm.customerNote" rows="2" placeholder="Mô tả thêm tình trạng sản phẩm..." />
        </div>
        <div class="order-products">
          <h4>Chọn sản phẩm cần trả</h4>
          <div v-for="item in returnForm.items" :key="item.orderItemId" class="order-item-card">
            <input v-model="item.selected" type="checkbox" />
            <div class="order-item-card__content">
              <strong>{{ item.productNameSnapshot }}</strong>
              <p>SKU: {{ item.skuSnapshot || '---' }} | Size: {{ item.sizeSnapshot || '---' }} | Màu: {{ item.colorSnapshot || '---' }}</p>
              <p>Đã mua: {{ item.quantity }} | Đã trả: {{ item.returnedQuantity || 0 }} | Còn được trả: {{ item.maxReturn }}</p>
            </div>
            <div class="account-field" style="max-width: 120px;">
              <label>Số lượng</label>
              <input v-model.number="item.returnQuantity" type="number" min="1" :max="item.maxReturn" :disabled="!item.selected" />
            </div>
          </div>
        </div>
      </div>
    </a-modal>


    <a-modal
      v-model:open="isOrderDetailModalVisible"
      :title="selectedOrder ? `Chi tiết đơn hàng: ${selectedOrder.orderCode}` : 'Chi tiết đơn hàng'"
      width="800px"
      :footer="null"
      centered
    >
      <div v-if="orderDetailLoading" class="account-state">
        Đang tải chi tiết đơn hàng...
      </div>

      <div v-else-if="selectedOrder" class="order-detail" style="max-height: 70vh; overflow-y: auto; padding-right: 8px;">
        <div class="account-grid">
          <div class="account-field">
            <label>Mã đơn</label>
            <input :value="selectedOrder.orderCode || ''" type="text" disabled />
          </div>

          <div class="account-field">
            <label>Mã tra cứu</label>
            <input :value="selectedOrder.lookupCode || ''" type="text" disabled />
          </div>

          <div class="account-field">
            <label>Trạng thái đơn hàng</label>
            <input :value="statusLabel('order', selectedOrder.orderStatus)" type="text" disabled />
          </div>

          <div class="account-field">
            <label>Trạng thái thanh toán</label>
            <input :value="statusLabel('payment', selectedOrder.paymentStatus)" type="text" disabled />
          </div>

          <div class="account-field">
            <label>Trạng thái vận chuyển</label>
            <input :value="statusLabel('shipping', selectedOrder.shippingStatus)" type="text" disabled />
          </div>

          <div class="account-field">
            <label>Phương thức thanh toán</label>
            <input :value="statusLabel('paymentMethod', selectedOrder.paymentMethod)" type="text" disabled />
          </div>

          <div class="account-field">
            <label>Người nhận</label>
            <input :value="selectedOrder.receiverName || ''" type="text" disabled />
          </div>

          <div class="account-field">
            <label>SĐT nhận hàng</label>
            <input :value="selectedOrder.receiverPhone || ''" type="text" disabled />
          </div>

          <div class="account-field account-field--full">
            <label>Địa chỉ giao hàng</label>
            <input :value="selectedOrder.shippingAddressLine || fullShippingAddress(selectedOrder)" type="text" disabled />
          </div>

          <div class="account-field">
            <label>Đơn vị vận chuyển</label>
            <input :value="selectedOrder.shippingCarrier || 'Chưa cập nhật'" type="text" disabled />
          </div>

          <div class="account-field">
            <label>Mã vận đơn</label>
            <input :value="selectedOrder.trackingCode || 'Chưa cập nhật'" type="text" disabled />
          </div>

          <div class="account-field account-field--full">
            <label>Ghi chú</label>
            <textarea :value="selectedOrder.note || 'Không có ghi chú'" rows="2" disabled />
          </div>
        </div>

        <div class="order-products">
          <h4>Sản phẩm trong đơn</h4>

          <div
            v-for="item in selectedOrder.items"
            :key="item.id"
            class="order-item-card"
          >
            <img
              :src="toImageSrc(item.imageUrlSnapshot || item.image)"
              :alt="item.productNameSnapshot"
              @error="onImgError"
            />
            <div class="order-item-card__content">
              <strong>{{ item.productNameSnapshot }}</strong>
              <p>SKU: {{ item.skuSnapshot || '---' }}</p>
              <p>
                Màu: {{ item.colorSnapshot || '---' }} |
                Size: {{ item.sizeSnapshot || '---' }}
              </p>
              <p>Số lượng: {{ item.quantity }}</p>
            </div>
            <div class="order-item-card__price">
              <span>Thành tiền</span>
              <strong>{{ formatVnd(item.lineTotalAmount) }}</strong>
            </div>
          </div>
        </div>

        <div class="order-summary-box">
          <div class="summary-row">
            <span>Tạm tính</span>
            <strong>{{ formatVnd(selectedOrder.subtotalAmount) }}</strong>
          </div>
          <div class="summary-row">
            <span>Giảm giá khuyến mãi</span>
            <strong>- {{ formatVnd(selectedOrder.promotionDiscountAmount) }}</strong>
          </div>
          <div class="summary-row">
            <span>Giảm giá voucher</span>
            <strong>- {{ formatVnd(selectedOrder.voucherDiscountAmount) }}</strong>
          </div>
          <div class="summary-row">
            <span>Phí vận chuyển</span>
            <strong>{{ formatVnd(selectedOrder.shippingFee) }}</strong>
          </div>
          <div class="summary-row summary-row--total">
            <span>Tổng thanh toán</span>
            <strong>{{ formatVnd(selectedOrder.finalAmount) }}</strong>
          </div>
        </div>

        <div class="order-timeline">
          <h4>Timeline đơn hàng</h4>
          <ul>
            <li><b>Tạo đơn:</b> {{ formatDateTime(selectedOrder.createdAt) }}</li>
            <li><b>Cập nhật:</b> {{ formatDateTime(selectedOrder.updatedAt) }}</li>
            <li><b>Giao hàng:</b> {{ formatDateTime(selectedOrder.shippedAt) }}</li>
            <li><b>Hoàn tất:</b> {{ formatDateTime(selectedOrder.completedAt) }}</li>
            <li><b>Hủy đơn:</b> {{ formatDateTime(selectedOrder.cancelledAt) }}</li>
            <li><b>Trả hàng:</b> {{ formatDateTime(selectedOrder.returnedAt) }}</li>
          </ul>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getErrorMessage } from '@/utils/error'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { getMyOrders, getMyOrderDetail } from '@/api/storefront-order.api'
import { createReturnRequest } from '@/api/return-refund.api'
import {
  fetchVietnamProvinces,
  fetchVietnamDistricts,
  fetchVietnamWards,
  findAddressUnitByName,
} from '@/utils/vietnamAddress'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const unauthorized = ref(false)
const error = ref('')

const savingProfile = ref(false)
const savingAddress = ref(false)
const ordersLoading = ref(false)

const orderDetailLoading = ref(false)
const isOrderDetailModalVisible = ref(false) // Trạng thái đóng mở modal

const profile = ref({})
const customer = ref({})
const addresses = ref([])
const orders = ref([])
const selectedOrder = ref(null)
const returnModalOpen = ref(false)
const returnSubmitting = ref(false)
const returnOrderLoading = ref(false)
const returnOrder = ref(null)
const returnForm = ref({ orderId: null, reason: '', customerNote: '', items: [] })

const showAddressForm = ref(false)
const editingAddressId = ref(null)

const profileForm = ref({
  fullName: '',
  phone: '',
  ngaySinh: '',
})

const defaultAddressForm = () => ({
  label: '',
  recipientName: '',
  phone: '',
  province: '',
  district: '',
  ward: '',
  detailAddress: '',
  isDefault: false,
})

const addressForm = ref(defaultAddressForm())

/* ================= FIX HÌNH ẢNH ================= */
const API_FILE_BASE = 'http://localhost:8080/'
const fallbackImage = 'https://via.placeholder.com/100x100?text=No+Image'

const toImageSrc = (path) => {
  if (!path) return fallbackImage
  if (String(path).startsWith('http')) return path
  return `${API_FILE_BASE}${String(path).replace(/^\/+/, '')}`
}

const onImgError = (e) => {
  e.target.src = fallbackImage
}
/* ================= ============ ================= */

/* ================= API ĐỊA CHỈ VIỆT NAM ĐỒNG BỘ ================= */
const provincesData = ref([])
const districtsData = ref([])
const wardsData = ref([])

const loadVietnamAddressData = async () => {
  try {
    provincesData.value = await fetchVietnamProvinces()
  } catch (e) {
    console.error('Lỗi lấy dữ liệu hành chính mới nhất:', e)
  }
}

const onProvinceChange = async () => {
  addressForm.value.district = ''
  addressForm.value.ward = ''
  wardsData.value = []

  const province = findAddressUnitByName(provincesData.value, addressForm.value.province)
  districtsData.value = province ? await fetchVietnamDistricts(province.code) : []

  if (districtsData.value.length === 1 && districtsData.value[0].source === 'NEW_2025') {
    addressForm.value.district = districtsData.value[0].name
    await onDistrictChange()
  }
}

const onDistrictChange = async () => {
  addressForm.value.ward = ''

  const province = findAddressUnitByName(provincesData.value, addressForm.value.province)
  const district = findAddressUnitByName(districtsData.value, addressForm.value.district)
  wardsData.value = province && district ? await fetchVietnamWards(province.code, district.code) : []
}

/* ================= KẾT THÚC API ĐỊA CHỈ ================= */


const hasCustomerProfile = computed(() => Boolean(profile.value?.customerInfo?.id))

const vipInfo = computed(() => ({
  rankName: customer.value?.loaiKhach || 'BRONZE',
  points: customer.value?.diemTichLuy ?? 0,
  discountPercent: customer.value?.rankDiscountPercent ?? 0,
  nextRankName: customer.value?.nextRankName || '',
  pointsToNextRank: customer.value?.pointsToNextRank ?? 0,
  description: customer.value?.rankDescription || '',
}))


const orderStats = computed(() => {
  const list = Array.isArray(orders.value) ? orders.value : []
  return {
    total: list.length,
    processing: list.filter(order => ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKING', 'SHIPPING', 'DELIVERING'].includes(String(order.orderStatus || '').toUpperCase())).length,
    completed: list.filter(order => String(order.orderStatus || '').toUpperCase() === 'COMPLETED').length,
    totalAmount: list.reduce((sum, order) => sum + Number(order.finalAmount || 0), 0),
  }
})

const STATUS_LABELS = {
  order: {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    PROCESSING: 'Đang xử lý',
    PACKING: 'Đang đóng gói',
    SHIPPING: 'Đang giao hàng',
    DELIVERING: 'Đang giao hàng',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    CANCELED: 'Đã hủy',
    RETURN_REQUESTED: 'Đã yêu cầu trả hàng',
    RETURNED: 'Đã trả hàng',
    REFUNDED: 'Đã hoàn tiền',
  },
  payment: {
    UNPAID: 'Chưa thanh toán',
    PENDING: 'Chờ thanh toán',
    WAITING: 'Chờ thanh toán',
    PAID: 'Đã thanh toán',
    PARTIAL: 'Thanh toán một phần',
    FAILED: 'Thanh toán lỗi',
    ERROR: 'Thanh toán lỗi',
    REFUNDED: 'Đã hoàn tiền',
    CANCELLED: 'Đã hủy thanh toán',
  },
  shipping: {
    NOT_SHIPPED: 'Chưa giao hàng',
    PENDING: 'Chờ giao hàng',
    READY_TO_SHIP: 'Sẵn sàng giao',
    SHIPPING: 'Đang giao hàng',
    DELIVERING: 'Đang giao hàng',
    DELIVERED: 'Đã giao hàng',
    FAILED: 'Giao hàng thất bại',
    RETURNED: 'Đã hoàn hàng',
    CANCELLED: 'Đã hủy giao hàng',
  },
  paymentMethod: {
    CASH: 'Tiền mặt',
    COD: 'Thanh toán khi nhận hàng',
    BANK_TRANSFER: 'Chuyển khoản ngân hàng',
    TRANSFER: 'Chuyển khoản ngân hàng',
    ONLINE: 'Thanh toán online',
    VNPAY: 'VNPay',
    MOMO: 'MoMo',
    CARD: 'Thẻ ngân hàng',
  },
}

const statusLabel = (group, value) => {
  if (!value) return 'Chưa cập nhật'
  const normalized = String(value).trim().toUpperCase()
  return STATUS_LABELS[group]?.[normalized] || String(value).replaceAll('_', ' ')
}

const statusClass = (value) => {
  const normalized = String(value || '').trim().toUpperCase()
  if (['COMPLETED', 'PAID', 'DELIVERED', 'CONFIRMED'].includes(normalized)) return 'status-chip--success'
  if (['PENDING', 'WAITING', 'PROCESSING', 'PACKING', 'READY_TO_SHIP'].includes(normalized)) return 'status-chip--warning'
  if (['SHIPPING', 'DELIVERING'].includes(normalized)) return 'status-chip--info'
  if (['CANCELLED', 'CANCELED', 'FAILED', 'ERROR'].includes(normalized)) return 'status-chip--danger'
  if (['RETURN_REQUESTED', 'RETURNED', 'REFUNDED', 'PARTIAL'].includes(normalized)) return 'status-chip--purple'
  return 'status-chip--muted'
}



const canRequestReturn = (order) => {
  if (!order || order.orderStatus !== 'COMPLETED') return false
  const doneAt = order.completedAt || order.deliveredAt || order.updatedAt
  if (!doneAt) return false
  const deadline = new Date(doneAt)
  deadline.setDate(deadline.getDate() + 7)
  return deadline >= new Date()
}

const openReturnModal = async (orderId) => {
  returnModalOpen.value = true
  returnOrderLoading.value = true
  returnForm.value = { orderId, reason: '', customerNote: '', items: [] }
  try {
    const res = await getMyOrderDetail(orderId)
    returnOrder.value = res.data
    returnForm.value.items = (returnOrder.value.items || []).map(item => {
      const maxReturn = Math.max(0, Number(item.quantity || 0) - Number(item.returnedQuantity || 0))
      return {
        orderItemId: item.id,
        productNameSnapshot: item.productNameSnapshot,
        skuSnapshot: item.skuSnapshot,
        sizeSnapshot: item.sizeSnapshot,
        colorSnapshot: item.colorSnapshot,
        quantity: item.quantity,
        returnedQuantity: item.returnedQuantity || 0,
        maxReturn,
        selected: maxReturn > 0,
        returnQuantity: maxReturn > 0 ? 1 : 0,
      }
    })
  } catch (e) {
    message.error(getErrorMessage(e))
  } finally {
    returnOrderLoading.value = false
  }
}

const submitReturnRequest = async () => {
  const selectedItems = returnForm.value.items.filter(item => item.selected)
  const invalidItem = selectedItems.find(item => {
    const qty = Number(item.returnQuantity || 0)
    return !Number.isInteger(qty) || qty <= 0 || qty > Number(item.maxReturn || 0)
  })

  if (selectedItems.length === 0) {
    message.warning('Vui lòng chọn sản phẩm cần trả hàng.')
    return
  }

  if (invalidItem) {
    message.warning(`Số lượng trả của ${invalidItem.productNameSnapshot || 'sản phẩm'} không hợp lệ.`)
    return
  }

  const items = selectedItems.map(item => ({
    orderItemId: item.orderItemId,
    quantity: Number(item.returnQuantity || 0),
  }))

  returnSubmitting.value = true
  try {
    await createReturnRequest({
      orderId: returnForm.value.orderId,
      reason: returnForm.value.reason,
      customerNote: returnForm.value.customerNote,
      items,
    })
    message.success('Đã gửi yêu cầu trả hàng hoàn tiền. Vui lòng chờ admin duyệt.')
    returnModalOpen.value = false
    await loadOrders()
  } catch (e) {
    message.error(getErrorMessage(e))
  } finally {
    returnSubmitting.value = false
  }
}

const joinAddress = (addr) => {
  return [
    addr.detailAddress,
    addr.ward,
    addr.district,
    addr.province,
  ]
    .filter(Boolean)
    .join(', ') || 'Chưa có địa chỉ chi tiết'
}

const fullShippingAddress = (order) => {
  return [
    order.shippingDetailAddress,
    order.shippingWard,
    order.shippingDistrict,
    order.shippingProvince,
  ].filter(Boolean).join(', ')
}

const formatDateTime = (value) => {
  if (!value) return '---'
  return new Date(value).toLocaleString('vi-VN')
}

const formatVnd = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(value || 0))
}

const fillProfileForm = () => {
  profileForm.value = {
    fullName: profile.value?.fullName || customer.value?.ten || '',
    phone: customer.value?.phone || '',
    ngaySinh: customer.value?.ngaySinh || '',
  }
}

const loadOrders = async () => {
  try {
    ordersLoading.value = true
    const res = await getMyOrders()
    orders.value = Array.isArray(res.data) ? res.data : []
  } catch {
    orders.value = []
  } finally {
    ordersLoading.value = false
  }
}

const loadProfile = async () => {
  loading.value = true
  unauthorized.value = false
  error.value = ''

  try {
    const profileRes = await api.get('/auth/me')
    profile.value = profileRes.data || {}
    customer.value = profile.value.customerInfo || {}
    fillProfileForm()

    if (profile.value.customerInfo?.id) {
      const addrRes = await api.get('/auth/me/addresses')
      addresses.value = Array.isArray(addrRes.data) ? addrRes.data : []
    } else {
      addresses.value = []
    }

    authStore.updateCurrentUser({
      id: profile.value.userId,
      username: profile.value.username,
      fullName: profile.value.fullName,
      email: profile.value.email,
      roles: profile.value.roles,
      customerInfo: profile.value.customerInfo || null,
    })

    await loadOrders()
  } catch (e) {
    if (e.response?.status === 401) {
      unauthorized.value = true
      authStore.clearSession()
      router.push('/login')
      return
    }

    error.value = getErrorMessage(e, 'Không tải được dữ liệu tài khoản')
  } finally {
    loading.value = false
  }
}

const handleUpdateProfile = async () => {
  try {
    savingProfile.value = true

    const payload = {
      fullName: profileForm.value.fullName,
      phone: profileForm.value.phone || null,
      ngaySinh: profileForm.value.ngaySinh || null,
    }

    const res = await api.put('/auth/me/customer', payload)
    customer.value = res.data || {}
    profile.value = {
      ...profile.value,
      fullName: res.data?.ten || profileForm.value.fullName,
      customerInfo: res.data,
    }

    authStore.updateCurrentUser({
      fullName: profile.value.fullName,
      customerInfo: res.data,
    })

    message.success('Cập nhật hồ sơ thành công')
  } catch (e) {
    message.error(getErrorMessage(e, 'Cập nhật hồ sơ thất bại'))
  } finally {
    savingProfile.value = false
  }
}

const startCreateAddress = () => {
  editingAddressId.value = null
  addressForm.value = defaultAddressForm()
  districtsData.value = []
  wardsData.value = []
  showAddressForm.value = true
}

const startEditAddress = async (addr) => {
  editingAddressId.value = addr.id
  addressForm.value = {
    label: addr.label || '',
    recipientName: addr.recipientName || '',
    phone: addr.phone || '',
    province: addr.province || '',
    district: addr.district || '',
    ward: addr.ward || '',
    detailAddress: addr.detailAddress || '',
    isDefault: addr.isDefault === 1,
  }

  const province = findAddressUnitByName(provincesData.value, addr.province)
  districtsData.value = province ? await fetchVietnamDistricts(province.code) : []

  const district = findAddressUnitByName(districtsData.value, addr.district)
  wardsData.value = province && district ? await fetchVietnamWards(province.code, district.code) : []

  showAddressForm.value = true
}

const cancelAddressForm = () => {
  showAddressForm.value = false
  editingAddressId.value = null
  addressForm.value = defaultAddressForm()
}

const reloadAddresses = async () => {
  const addrRes = await api.get('/auth/me/addresses')
  addresses.value = Array.isArray(addrRes.data) ? addrRes.data : []
}

const handleSubmitAddress = async () => {
  try {
    savingAddress.value = true

    const payload = {
      label: addressForm.value.label || null,
      recipientName: addressForm.value.recipientName,
      phone: addressForm.value.phone,
      province: addressForm.value.province,
      district: addressForm.value.district,
      ward: addressForm.value.ward,
      detailAddress: addressForm.value.detailAddress,
      isDefault: addressForm.value.isDefault ? 1 : 0,
    }

    if (editingAddressId.value) {
      await api.put(`/auth/me/addresses/${editingAddressId.value}`, payload)
      message.success('Cập nhật địa chỉ thành công')
    } else {
      await api.post('/auth/me/addresses', payload)
      message.success('Thêm địa chỉ thành công')
    }

    await reloadAddresses()
    cancelAddressForm()
  } catch (e) {
    message.error(getErrorMessage(e, 'Lưu địa chỉ thất bại'))
  } finally {
    savingAddress.value = false
  }
}

const handleDeleteAddress = async (id) => {
  const confirmed = window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này không?')
  if (!confirmed) return

  try {
    await api.delete(`/auth/me/addresses/${id}`)
    message.success('Xóa địa chỉ thành công')
    await reloadAddresses()
  } catch (e) {
    message.error(getErrorMessage(e, 'Xóa địa chỉ thất bại'))
  }
}

const handleViewOrderDetail = async (orderId) => {
  try {
    // Mở popup trước để thấy trạng thái Loading
    isOrderDetailModalVisible.value = true
    orderDetailLoading.value = true
    selectedOrder.value = null

    const res = await getMyOrderDetail(orderId)
    selectedOrder.value = res.data || null
  } catch (e) {
    message.error(getErrorMessage(e, 'Không tải được chi tiết đơn hàng'))
    isOrderDetailModalVisible.value = false // Tắt popup nếu tải lỗi
  } finally {
    orderDetailLoading.value = false
  }
}

const handleLogout = () => {
  authStore.clearSession()
  router.push('/login')
}

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    unauthorized.value = true
    loading.value = false
    router.push('/login')
    return
  }

  await loadVietnamAddressData()
  await loadProfile()
})
</script>

<style scoped>
.account-page {
  min-height: 100vh;
  padding: 32px 0;
  background:
    radial-gradient(circle at top left, rgba(17, 24, 39, 0.08), transparent 32%),
    linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
}

.account-card {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 28px;
  padding: 28px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.09);
}

.account-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 6px;
  background: linear-gradient(90deg, #111827, #334155, #64748b);
}

.account-card__header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 22px;
  border-bottom: 1px solid #e5e7eb;
}

.account-card__header h1 {
  margin: 0;
  color: #0f172a;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.account-card__header p,
.section-head p {
  margin: 6px 0 0;
  color: #64748b;
}

.logout-btn,
.primary-btn,
.secondary-btn,
.danger-btn {
  border: none;
  min-height: 42px;
  padding: 10px 18px;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 700;
  transition: 0.2s ease;
}

.logout-btn,
.primary-btn {
  color: #fff;
  background: linear-gradient(135deg, #111827, #334155);
  box-shadow: 0 10px 22px rgba(17, 24, 39, 0.18);
}

.logout-btn:hover,
.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(17, 24, 39, 0.22);
}

.secondary-btn {
  background: #f1f5f9;
  color: #0f172a;
  border: 1px solid #e2e8f0;
}

.secondary-btn:hover {
  background: #e2e8f0;
}

.danger-btn {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.account-state,
.empty-state {
  padding: 18px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  color: #64748b;
}

.account-state--error {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.section-block {
  padding: 22px;
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.section-block + .section-block {
  margin-top: 24px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.section-head h3 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
  font-weight: 800;
}

.order-section-head {
  align-items: flex-start;
}

.account-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.account-field {
  padding: 14px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.account-field--full {
  grid-column: 1 / -1;
}

.account-field label {
  font-size: 13px;
  color: #64748b;
  font-weight: 700;
}

.account-field input,
.account-field select,
.account-field textarea {
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  padding: 11px 12px;
  outline: none;
  background: #fff;
  color: #0f172a;
  transition: 0.2s ease;
}

.account-field input:focus,
.account-field select:focus,
.account-field textarea:focus {
  border-color: #111827;
  box-shadow: 0 0 0 4px rgba(17, 24, 39, 0.08);
}

.account-field input:disabled,
.account-field select:disabled,
.account-field textarea:disabled {
  background: #f1f5f9;
  color: #475569;
}

.checkbox-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-actions,
.card-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.address-form {
  margin-bottom: 18px;
}

.address-card {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  margin-bottom: 12px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.address-card__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
}

.default-badge {
  background: #111827;
  color: white;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.vip-grid,
.order-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 14px;
}

.vip-card,
.overview-card {
  position: relative;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 16px;
  background: #fff;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.05);
}

.vip-card span,
.overview-card span,
.order-card__amount span,
.order-info-grid span,
.order-item-card__price span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}

.vip-card strong,
.overview-card strong {
  color: #0f172a;
  font-size: 18px;
}

.overview-card--money strong {
  color: #b45309;
}

.vip-note {
  margin: 12px 0 0;
  color: #475569;
}

.order-overview {
  margin-bottom: 18px;
}

.order-list {
  display: grid;
  gap: 14px;
}

.order-card--premium {
  position: relative;
  overflow: hidden;
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  background:
    linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98)),
    radial-gradient(circle at top right, rgba(15, 23, 42, 0.08), transparent 28%);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.07);
  transition: 0.2s ease;
}

.order-card--premium:hover {
  transform: translateY(-2px);
  border-color: #cbd5e1;
  box-shadow: 0 22px 42px rgba(15, 23, 42, 0.1);
}

.order-card__top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.order-code {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.order-code::before {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #111827;
  box-shadow: 0 0 0 5px rgba(17, 24, 39, 0.08);
}

.order-title p {
  margin: 6px 0 0;
  color: #64748b;
}

.order-card__amount {
  text-align: right;
  min-width: 180px;
}

.order-card__amount strong {
  color: #b45309;
  font-size: 20px;
  font-weight: 900;
}

.order-progress-line,
.order-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  border: 1px solid transparent;
}

.status-chip--strong {
  font-size: 13px;
}

.status-chip--success {
  color: #047857;
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.status-chip--warning {
  color: #b45309;
  background: #fffbeb;
  border-color: #fde68a;
}

.status-chip--info {
  color: #0369a1;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.status-chip--danger {
  color: #dc2626;
  background: #fef2f2;
  border-color: #fecaca;
}

.status-chip--purple {
  color: #7c3aed;
  background: #f5f3ff;
  border-color: #ddd6fe;
}

.status-chip--muted {
  color: #475569;
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.order-info-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 1fr;
  gap: 10px;
  margin-top: 14px;
}

.order-info-grid > div {
  padding: 12px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
}

.order-info-grid strong {
  color: #0f172a;
  font-size: 14px;
}

.order-actions {
  justify-content: flex-end;
}

.order-products {
  margin-top: 22px;
}

.order-products h4,
.order-timeline h4 {
  margin: 0 0 12px;
  color: #0f172a;
  font-size: 17px;
  font-weight: 900;
}

.order-item-card {
  display: grid;
  grid-template-columns: 92px 1fr 150px;
  gap: 14px;
  align-items: center;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  margin-bottom: 10px;
  background: #fff;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.04);
}

.order-item-card img {
  width: 92px;
  height: 92px;
  object-fit: cover;
  border-radius: 16px;
  background: #f1f5f9;
  border: 1px solid #e5e7eb;
}

.order-item-card__content strong {
  color: #0f172a;
  font-size: 15px;
}

.order-item-card__content p {
  margin: 5px 0;
  color: #64748b;
}

.order-item-card__price {
  text-align: right;
}

.order-item-card__price strong {
  color: #0f172a;
  font-size: 16px;
  font-weight: 900;
}

.order-summary-box {
  margin-top: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 18px;
  background: linear-gradient(180deg, #f8fafc, #ffffff);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 11px;
  color: #475569;
}

.summary-row strong {
  color: #0f172a;
}

.summary-row--total {
  border-top: 1px dashed #cbd5e1;
  padding-top: 14px;
  margin-bottom: 0;
  font-size: 18px;
  font-weight: 900;
}

.summary-row--total strong {
  color: #b45309;
  font-size: 22px;
}

.order-timeline {
  margin-top: 20px;
  padding: 16px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
}

.order-timeline ul {
  margin: 0;
  padding-left: 18px;
}

.order-timeline li {
  margin-bottom: 8px;
  color: #475569;
}

.return-note {
  color: #64748b;
  margin-bottom: 12px;
  padding: 12px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
}

.order-detail::-webkit-scrollbar {
  width: 6px;
}

.order-detail::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.order-detail::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.order-detail::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

@media (max-width: 768px) {
  .account-page {
    padding: 16px 0;
  }

  .account-card {
    padding: 18px;
    border-radius: 22px;
  }

  .account-card__header,
  .section-head,
  .form-actions,
  .card-actions,
  .order-card__top {
    flex-direction: column;
    align-items: flex-start;
  }

  .account-grid,
  .order-info-grid {
    grid-template-columns: 1fr;
  }

  .order-card__amount {
    text-align: left;
    min-width: 0;
  }

  .order-actions {
    justify-content: flex-start;
  }

  .order-item-card {
    grid-template-columns: 1fr;
  }

  .order-item-card img {
    width: 100%;
    height: 180px;
  }

  .order-item-card__price {
    text-align: left;
  }
}
</style>
