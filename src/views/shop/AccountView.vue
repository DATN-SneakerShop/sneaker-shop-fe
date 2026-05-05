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
          <div class="section-head">
            <h3>Đơn hàng của tôi</h3>
          </div>

          <div v-if="ordersLoading" class="account-state">
            Đang tải đơn hàng...
          </div>

          <div v-else-if="orders.length === 0" class="empty-state">
            Bạn chưa có đơn hàng nào.
          </div>

          <div v-else class="order-list">
            <div
              v-for="order in orders"
              :key="order.id"
              class="order-card"
            >
              <div class="order-card__top">
                <div>
                  <strong>{{ order.orderCode }}</strong>
                  <p>Tạo lúc: {{ formatDateTime(order.createdAt) }}</p>
                </div>
                <div class="order-card__amount">
                  {{ formatVnd(order.finalAmount) }}
                </div>
              </div>

              <div class="order-meta">
                <span class="status-chip">Đơn hàng: {{ order.orderStatus }}</span>
                <span class="status-chip">Thanh toán: {{ order.paymentStatus }}</span>
                <span class="status-chip">Vận chuyển: {{ order.shippingStatus }}</span>
                <span class="status-chip">PTTT: {{ order.paymentMethod }}</span>
                <span class="status-chip">SL: {{ order.totalItems }}</span>
              </div>

              <div class="card-actions">
                <button class="primary-btn" type="button" @click="handleViewOrderDetail(order.id)">
                  Xem chi tiết
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>

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
            <input :value="selectedOrder.orderStatus || ''" type="text" disabled />
          </div>

          <div class="account-field">
            <label>Trạng thái thanh toán</label>
            <input :value="selectedOrder.paymentStatus || ''" type="text" disabled />
          </div>

          <div class="account-field">
            <label>Trạng thái vận chuyển</label>
            <input :value="selectedOrder.shippingStatus || ''" type="text" disabled />
          </div>

          <div class="account-field">
            <label>Phương thức thanh toán</label>
            <input :value="selectedOrder.paymentMethod || ''" type="text" disabled />
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
              {{ formatVnd(item.lineTotalAmount) }}
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
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { getMyOrders, getMyOrderDetail } from '@/api/storefront-order.api'

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

/* ================= API BẢN ĐỒ VIỆT NAM ================= */
const provincesData = ref([])
const districtsData = ref([])
const wardsData = ref([])

const fetchVietnamProvinces = async () => {
  try {
    const res = await fetch("https://provinces.open-api.vn/api/?depth=3")
    provincesData.value = await res.json()
  } catch (e) {
    console.error("Lỗi lấy dữ liệu hành chính:", e)
  }
}

const onProvinceChange = () => {
  addressForm.value.district = ''
  addressForm.value.ward = ''
  const p = provincesData.value.find(x => x.name === addressForm.value.province)
  districtsData.value = p ? p.districts : []
  wardsData.value = []
}

const onDistrictChange = () => {
  addressForm.value.ward = ''
  const d = districtsData.value.find(x => x.name === addressForm.value.district)
  wardsData.value = d ? d.wards : []
}

/* ================= KẾT THÚC API BẢN ĐỒ ================= */


const hasCustomerProfile = computed(() => Boolean(profile.value?.customerInfo?.id))

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

    error.value = e.response?.data || 'Không tải được dữ liệu tài khoản'
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
    message.error(e.response?.data || 'Cập nhật hồ sơ thất bại')
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

const startEditAddress = (addr) => {
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

  // Mồi dữ liệu Quận/Huyện dựa trên Tỉnh/Thành đang có
  const p = provincesData.value.find(x => x.name === addr.province)
  districtsData.value = p ? p.districts : []

  const d = districtsData.value.find(x => x.name === addr.district)
  wardsData.value = d ? d.wards : []

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
    message.error(e.response?.data || 'Lưu địa chỉ thất bại')
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
    message.error(e.response?.data || 'Xóa địa chỉ thất bại')
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
    message.error(e.response?.data || 'Không tải được chi tiết đơn hàng')
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

  await fetchVietnamProvinces()
  await loadProfile()
})
</script>

<style scoped>
/* Toàn bộ CSS phần tài khoản giữ nguyên */
.account-page {
  padding: 24px 0;
}

.account-card {
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.account-card__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
}

.logout-btn,
.primary-btn,
.secondary-btn,
.danger-btn {
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
}

.logout-btn,
.primary-btn {
  background: #111;
  color: #fff;
}

.secondary-btn {
  background: #f1f1f1;
  color: #111;
}

.danger-btn {
  background: #fff1f0;
  color: #cf1322;
}

.account-state {
  padding: 16px;
  border-radius: 12px;
  background: #f5f5f5;
}

.account-state--error {
  background: #fff1f0;
  color: #cf1322;
}

.section-block + .section-block {
  margin-top: 28px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.account-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.account-field {
  padding: 14px;
  background: #f7f7f7;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.account-field--full {
  grid-column: 1 / -1;
}

.account-field label {
  font-size: 13px;
  color: #666;
}

.account-field input,
.account-field select,
.account-field textarea {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px 12px;
  outline: none;
  background: #fff;
}

.account-field input:disabled,
.account-field select:disabled,
.account-field textarea:disabled {
  background: #f0f0f0;
  color: #666;
}

.checkbox-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.empty-state {
  padding: 14px;
  background: #fafafa;
  border: 1px dashed #ddd;
  border-radius: 12px;
  color: #666;
}

.address-form {
  margin-bottom: 18px;
}

.address-card,
.order-card {
  padding: 14px;
  border: 1px solid #eee;
  border-radius: 12px;
  margin-bottom: 12px;
  background: #fff;
}

.address-card__top,
.order-card__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
}

.default-badge {
  background: #ff4d4f;
  color: white;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
}

.card-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.order-card__amount {
  font-weight: 700;
}

.order-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-chip {
  background: #f5f5f5;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
}

.order-products {
  margin-top: 20px;
}

.order-item-card {
  display: grid;
  grid-template-columns: 90px 1fr 140px;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 12px;
  margin-bottom: 10px;
}

.order-item-card img {
  width: 90px;
  height: 90px;
  object-fit: cover;
  border-radius: 10px;
  background: #f5f5f5;
}

.order-item-card__content p {
  margin: 4px 0;
  color: #666;
}

.order-item-card__price {
  font-weight: 700;
  text-align: right;
}

.order-summary-box {
  margin-top: 20px;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 16px;
  background: #fafafa;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.summary-row--total {
  border-top: 1px solid #ddd;
  padding-top: 10px;
  font-size: 18px;
  font-weight: 700;
}

.order-timeline {
  margin-top: 20px;
}

.order-timeline ul {
  margin: 0;
  padding-left: 18px;
}

.order-timeline li {
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .account-grid {
    grid-template-columns: 1fr;
  }

  .account-card__header,
  .section-head,
  .form-actions,
  .card-actions,
  .order-card__top {
    flex-direction: column;
    align-items: flex-start;
  }

  .order-item-card {
    grid-template-columns: 1fr;
  }

  .order-item-card__price {
    text-align: left;
  }
}

/* Ẩn thanh cuộn dọc (Scrollbar) cho modal trông sạch sẽ hơn */
.order-detail::-webkit-scrollbar {
  width: 6px;
}
.order-detail::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}
.order-detail::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}
.order-detail::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
