<template>
  <div class="order-admin-page">
    <a-page-header title="Quản lý đơn hàng" sub-title="Màn hình vận hành đơn hàng cho admin">
      <template #extra>
        <a-space wrap>
          <a-button @click="router.push('/orders/dashboard')">Dashboard</a-button>
          <a-button @click="router.push('/orders/returns/report')">Báo cáo hoàn trả</a-button>
          <a-button type="primary" @click="router.push('/orders/create')">Tạo đơn</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-card class="filter-card" :bordered="false">
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :xs="24" :md="12" :lg="6">
            <a-form-item label="Mã đơn / mã tra cứu / tên / email / số điện thoại">
              <a-input
                v-model:value="filters.keyword"
                allow-clear
                placeholder="Ví dụ: ORD, LOOKUP, 09..., email..."
                @pressEnter="fetchOrders"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12" :lg="3">
            <a-form-item label="Trạng thái đơn">
              <a-select v-model:value="filters.orderStatus" allow-clear placeholder="Order status">
                <a-select-option v-for="value in orderStatusOptions" :key="value" :value="value">
                  {{ orderStatusText(value) }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12" :lg="3">
            <a-form-item label="Thanh toán">
              <a-select v-model:value="filters.paymentStatus" allow-clear placeholder="Payment status">
                <a-select-option v-for="value in paymentStatusOptions" :key="value" :value="value">
                  {{ paymentStatusText(value) }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12" :lg="3">
            <a-form-item label="Vận chuyển">
              <a-select v-model:value="filters.shippingStatus" allow-clear placeholder="Shipping status">
                <a-select-option v-for="value in shippingStatusOptions" :key="value" :value="value">
                  {{ shippingStatusText(value) }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12" :lg="3">
            <a-form-item label="PT thanh toán">
              <a-select v-model:value="filters.paymentMethod" allow-clear placeholder="Payment method">
                <a-select-option v-for="value in paymentMethodOptions" :key="value" :value="value">
                  {{ paymentMethodText(value) }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12" :lg="3">
            <a-form-item label="Từ ngày">
              <a-date-picker
                v-model:value="filters.dateFrom"
                style="width: 100%"
                value-format="YYYY-MM-DD"
                format="DD/MM/YYYY"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12" :lg="3">
            <a-form-item label="Đến ngày">
              <a-date-picker
                v-model:value="filters.dateTo"
                style="width: 100%"
                value-format="YYYY-MM-DD"
                format="DD/MM/YYYY"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-space>
          <a-button type="primary" :loading="loading" @click="fetchOrders">Lọc đơn hàng</a-button>
          <a-button @click="resetFilters">Đặt lại</a-button>
        </a-space>
      </a-form>
    </a-card>

    <a-card class="list-card" :bordered="false">
      <a-tabs v-model:activeKey="activeTab" class="order-tabs">
        <a-tab-pane key="needs" tab="Cần xử lý" />
        <a-tab-pane key="shipping" tab="Đang giao" />
        <a-tab-pane key="payment" tab="Chờ thanh toán" />
        <a-tab-pane key="completed" tab="Hoàn tất" />
        <a-tab-pane key="cancelled" tab="Đã hủy" />
        <a-tab-pane key="all" tab="Tất cả" />
      </a-tabs>
      <div class="list-summary">
        <div>
          <div class="list-summary__label">Tổng đơn hiển thị</div>
          <div class="list-summary__value">{{ displayRows.length }}</div>
        </div>
      </div>

      <a-table
        rowKey="id"
        :columns="columns"
        :dataSource="displayRows"
        :loading="loading"
        :pagination="{ pageSize: 10, showSizeChanger: false }"
        :scroll="{ x: 1500 }"
        :locale="{ emptyText: emptyText }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'priority'">
            <a-tag :color="getPriority(record).color">
              {{ getPriority(record).label }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'orderCode'">
            <div class="order-code-cell">
              <router-link :to="`/orders/${record.id}`" class="order-code-link">
                {{ record.orderCode }}
              </router-link>
              <div class="sub-text">Lookup: {{ record.lookupCode || '-' }}</div>
            </div>
          </template>

          <template v-else-if="column.key === 'createdAt'">
            <div>{{ formatDate(record.createdAt) }}</div>
          </template>

          <template v-else-if="column.key === 'customer'">
            <div class="stack-cell">
              <div class="fw-600" :style="{ color: record.customerId ? '#1677ff' : '#8c8c8c' }">
                {{ record.customerId ? 'Khách thành viên' : 'Khách vãng lai (Lẻ)' }}
              </div>
              <div class="sub-text">{{ displayValidName(record.ordererName) || 'Khách mua tại quầy' }}</div>
              <div class="sub-text">{{ displayValidName(record.ordererPhone) || displayValidName(record.ordererEmail) || '-' }}</div>
            </div>
          </template>

          <template v-else-if="column.key === 'receiver'">
            <div class="stack-cell">
              <div>{{ displayValidName(record.receiverName) || '-' }}</div>
              <div class="sub-text">{{ displayValidName(record.receiverPhone) || '-' }}</div>
            </div>
          </template>

          <template v-else-if="column.key === 'itemCount'">
            {{ record.itemCount ?? 0 }}
          </template>

          <template v-else-if="column.key === 'money'">
            <div class="stack-cell">
              <div class="money-strong">{{ formatMoney(record.finalAmount) }}</div>
              <div class="sub-text">Total: {{ formatMoney(record.totalAmount) }}</div>
            </div>
          </template>

          <template v-else-if="column.key === 'paymentMethod'">
            <a-tag>{{ paymentMethodText(record.paymentMethod) }}</a-tag>
          </template>

          <template v-else-if="column.key === 'orderStatus'">
            <a-tag :color="orderStatusColor(record.orderStatus)">
              {{ orderStatusText(record.orderStatus) }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'paymentStatus'">
            <a-tag :color="paymentStatusColor(record.paymentStatus)">
              {{ paymentStatusText(record.paymentStatus) }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'shippingStatus'">
            <a-tag v-if="record.channel === 'OFFLINE'" color="blue">
              Nhận tại quầy
            </a-tag>
            <a-tag v-else :color="shippingStatusColor(record.shippingStatus)">
              {{ shippingStatusText(record.shippingStatus) }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" @click="router.push(`/orders/${record.id}`)">Chi tiết</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { getErrorMessage } from '@/utils/error'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { listAdminOrders } from '@/api/admin-order.api'

const router = useRouter()
const loading = ref(false)
const rows = ref([])
const activeTab = ref('needs')

const filters = reactive({
  keyword: '',
  orderStatus: undefined,
  paymentStatus: undefined,
  shippingStatus: undefined,
  paymentMethod: undefined,
  dateFrom: undefined,
  dateTo: undefined,
})

const orderStatusOptions = ['NEW', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED']
const paymentStatusOptions = ['UNPAID', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED']
const shippingStatusOptions = ['PENDING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'DELIVERY_FAILED', 'RETURNED_TO_SENDER']
const paymentMethodOptions = ['COD', 'CASH', 'BANK_TRANSFER', 'VNPAY', 'MOMO']

const columns = [
  { title: 'Mã đơn', key: 'orderCode', width: 220, fixed: 'left' },
  { title: 'Ngày tạo', key: 'createdAt', dataIndex: 'createdAt', width: 170 },
  { title: 'Ưu tiên', key: 'priority', width: 230 },
  { title: 'Khách hàng', key: 'customer', width: 230 },
  { title: 'Người nhận', key: 'receiver', width: 180 },
  { title: 'SL SP', key: 'itemCount', dataIndex: 'itemCount', width: 110, align: 'center' },
  { title: 'Tổng tiền', key: 'money', width: 160 },
  { title: 'Thanh toán', key: 'paymentMethod', dataIndex: 'paymentMethod', width: 150 },
  { title: 'Trạng thái', key: 'orderStatus', dataIndex: 'orderStatus', width: 150 },
  { title: 'TT Tiền', key: 'paymentStatus', dataIndex: 'paymentStatus', width: 160 },
  { title: 'Vận chuyển', key: 'shippingStatus', dataIndex: 'shippingStatus', width: 170 },
  { title: 'Thao tác', key: 'action', width: 110, fixed: 'right' },
]

const getPriority = (order = {}) => {
  if (order.shippingStatus === 'DELIVERY_FAILED') return { score: 100, label: 'Giao thất bại - cần xử lý', color: 'red', level: 'danger' }
  if (order.paymentStatus === 'PARTIALLY_PAID') return { score: 95, label: 'Thanh toán thiếu - cần đối soát', color: 'red', level: 'danger' }
  if (order.paymentStatus === 'PAID' && order.orderStatus === 'NEW') return { score: 90, label: 'Đã thanh toán - cần xử lý', color: 'red', level: 'danger' }
  if (order.paymentStatus === 'PAID' && order.orderStatus === 'PROCESSING') return { score: 80, label: 'Đã thanh toán - cần chuẩn bị hàng', color: 'orange', level: 'warning' }
  if (order.paymentMethod === 'COD' && order.orderStatus === 'NEW') return { score: 70, label: 'COD mới - cần xác nhận', color: 'blue', level: 'info' }
  if (order.shippingStatus === 'SHIPPED' || order.orderStatus === 'SHIPPING') return { score: 60, label: 'Đang giao - cần theo dõi', color: 'purple', level: 'info' }
  if (order.paymentStatus === 'PENDING') return { score: 40, label: 'Chờ thanh toán', color: 'gold', level: 'warning' }
  if (order.orderStatus === 'COMPLETED') return { score: 10, label: 'Đã hoàn tất', color: 'green', level: 'done' }
  if (order.orderStatus === 'CANCELLED') return { score: 0, label: 'Đã hủy', color: 'default', level: 'muted' }
  return { score: 50, label: 'Cần theo dõi', color: 'cyan', level: 'info' }
}

const matchesActiveTab = (order) => {
  switch (activeTab.value) {
    case 'needs':
      return !['COMPLETED', 'CANCELLED'].includes(order.orderStatus)
    case 'shipping':
      return order.orderStatus === 'SHIPPING' || ['READY_TO_SHIP', 'SHIPPED', 'DELIVERY_FAILED'].includes(order.shippingStatus)
    case 'payment':
      return ['UNPAID', 'PENDING', 'PARTIALLY_PAID'].includes(order.paymentStatus) && order.orderStatus !== 'CANCELLED'
    case 'completed':
      return order.orderStatus === 'COMPLETED'
    case 'cancelled':
      return order.orderStatus === 'CANCELLED'
    case 'all':
    default:
      return true
  }
}

const displayRows = computed(() =>
  [...rows.value]
    .filter(matchesActiveTab)
    .sort((a, b) => {
      const priorityDiff = getPriority(b).score - getPriority(a).score
      if (priorityDiff !== 0) return priorityDiff
      return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
    })
)

const emptyText = computed(() => {
  if (loading.value) return 'Đang tải đơn hàng...'
  return 'Không có đơn hàng phù hợp bộ lọc'
})

const buildParams = () => {
  const params = {}
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params[key] = value
    }
  })
  return params
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const response = await listAdminOrders(buildParams())
    rows.value = Array.isArray(response.data) ? response.data : []
  } catch (error) {
    message.error(getErrorMessage(error, 'Không tải được danh sách đơn hàng'))
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.keyword = ''
  filters.orderStatus = undefined
  filters.paymentStatus = undefined
  filters.shippingStatus = undefined
  filters.paymentMethod = undefined
  filters.dateFrom = undefined
  filters.dateTo = undefined
  fetchOrders()
}

// LỌC CHUỖI 'null' TỪ BACKEND
const displayValidName = (val) => {
  if (!val || String(val).trim().toLowerCase() === 'null' || String(val).trim().toLowerCase() === 'undefined') return ''
  return String(val).trim()
}

const formatDate = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '-')

const formatMoney = (value) => {
  if (value == null) return '-'
  return `${Number(value).toLocaleString('vi-VN')} đ`
}

const orderStatusText = (value) => ({
  NEW: 'Mới',
  PROCESSING: 'Đang xử lý',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}[value] || value || '-')

const paymentStatusText = (value) => ({
  UNPAID: 'Chưa thanh toán',
  PENDING: 'Chờ xác nhận',
  PARTIALLY_PAID: 'Thanh toán 1 phần',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán lỗi',
  PARTIALLY_REFUNDED: 'Hoàn 1 phần',
  REFUNDED: 'Đã hoàn tiền',
}[value] || value || '-')

const shippingStatusText = (value) => ({
  PENDING: 'Chưa xử lý',
  READY_TO_SHIP: 'Sẵn sàng giao',
  SHIPPED: 'Đã gửi vận chuyển',
  DELIVERED: 'Giao thành công',
  DELIVERY_FAILED: 'Giao thất bại',
  RETURNED_TO_SENDER: 'Hoàn về kho',
}[value] || value || '-')

const paymentMethodText = (value) => ({
  COD: 'COD',
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  VNPAY: 'VNPay',
  MOMO: 'MoMo',
}[value] || value || '-')

const orderStatusColor = (value) => ({
  NEW: 'blue',
  PROCESSING: 'gold',
  SHIPPING: 'purple',
  COMPLETED: 'green',
  CANCELLED: 'red',
}[value] || 'default')

const paymentStatusColor = (value) => ({
  UNPAID: 'default',
  PENDING: 'processing',
  PARTIALLY_PAID: 'gold',
  PAID: 'green',
  FAILED: 'red',
  PARTIALLY_REFUNDED: 'orange',
  REFUNDED: 'volcano',
}[value] || 'default')

const shippingStatusColor = (value) => ({
  PENDING: 'default',
  READY_TO_SHIP: 'cyan',
  SHIPPED: 'purple',
  DELIVERED: 'green',
  DELIVERY_FAILED: 'red',
  RETURNED_TO_SENDER: 'volcano',
}[value] || 'default')

onMounted(fetchOrders)
</script>

<style scoped>
.order-admin-page {
  padding-bottom: 16px;
}

.filter-card,
.list-card {
  border-radius: 16px;
  margin-bottom: 16px;
}

.order-tabs {
  margin-bottom: 12px;
}

.list-summary {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.list-summary__label {
  color: #8c8c8c;
  font-size: 12px;
}

.list-summary__value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.order-code-link {
  font-weight: 700;
}

.sub-text {
  color: #8c8c8c;
  font-size: 12px;
}

.stack-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.money-strong {
  font-weight: 700;
}

.fw-600 {
  font-weight: 600;
}

:deep(.ant-table-thead > tr > th) {
  font-weight: 700;
}

:deep(.ant-card-body) {
  padding: 20px;
}
</style>
