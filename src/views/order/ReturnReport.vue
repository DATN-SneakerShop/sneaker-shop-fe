<template>
  <div class="return-report-page">
    <a-page-header
      title="Quản lý đơn hoàn trả"
      sub-title="Danh sách toàn bộ đơn hoàn trả; bấm Xử lý để mở trang xử lý riêng."
      @back="router.back()"
    />

    <a-row :gutter="16" class="mb-3">
      <a-col :span="6"><a-card><a-statistic title="Tổng đơn hoàn trả" :value="summary.total" /></a-card></a-col>
      <a-col :span="6"><a-card><a-statistic title="Chờ nhận hàng" :value="summary.requested" /></a-card></a-col>
      <a-col :span="6"><a-card><a-statistic title="Đã nhận hàng" :value="summary.received" /></a-card></a-col>
      <a-col :span="6"><a-card><a-statistic title="Hoàn tất" :value="summary.completed" /></a-card></a-col>
    </a-row>

    <a-card>
      <template #extra>
        <a-space wrap>
          <a-input-search v-model:value="keyword" placeholder="Tìm mã hoàn trả, mã đơn, khách hàng, SĐT" allow-clear style="width: 320px" />
          <a-select v-model:value="status" allow-clear placeholder="Lọc trạng thái" style="width: 220px" @change="fetch">
            <a-select-option v-for="s in statusOptions" :key="s" :value="s">{{ statusText(s) }}</a-select-option>
          </a-select>
          <a-button @click="fetch" :loading="loading">Tải lại</a-button>
        </a-space>
      </template>

      <a-table :dataSource="filteredRows" :columns="columns" rowKey="id" :loading="loading" :pagination="{ pageSize: 10 }" bordered>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'code'">
            <a @click="goDetail(record.id)">{{ record.code }}</a>
            <div class="muted">Đơn gốc: {{ record.orderCode || '-' }}</div>
          </template>
          <template v-else-if="column.key === 'customer'">
            <b>{{ record.customerName || 'Khách lẻ' }}</b>
            <div class="muted">{{ record.customerPhone || '-' }}</div>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">{{ statusText(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'items'">
            {{ (record.items || []).length }} dòng sản phẩm
          </template>
          <template v-else-if="column.key === 'refundAmount'">
            {{ money(record.refundAmount) }}
          </template>
          <template v-else-if="column.key === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="primary" size="small" @click="goDetail(record.id)">Xử lý</a-button>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { listAdminReturnRequests } from '@/api/return-refund.api'
import { getErrorMessage } from '@/utils/error'

const router = useRouter()
const loading = ref(false)
const rows = ref([])
const status = ref(undefined)
const keyword = ref('')

const statusOptions = ['REQUESTED', 'RECEIVED', 'ACCEPTED', 'COMPLETED', 'REJECTED', 'PENDING', 'APPROVED', 'REFUNDED']

const columns = [
  { title: 'Mã hoàn trả', key: 'code', width: 220 },
  { title: 'Khách hàng', key: 'customer', width: 220 },
  { title: 'Sản phẩm', key: 'items', width: 130 },
  { title: 'Tiền hoàn dự kiến', key: 'refundAmount', width: 160, align: 'right' },
  { title: 'Trạng thái', key: 'status', width: 170 },
  { title: 'Ngày tạo', key: 'createdAt', width: 180 },
  { title: 'Thao tác', key: 'action', width: 110 },
]

const filteredRows = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter((r) => [r.code, r.orderCode, r.customerName, r.customerPhone]
    .some((v) => String(v || '').toLowerCase().includes(q)))
})

const summary = computed(() => {
  const list = rows.value || []
  return {
    total: list.length,
    requested: list.filter((x) => ['REQUESTED', 'PENDING'].includes(x.status)).length,
    received: list.filter((x) => x.status === 'RECEIVED').length,
    completed: list.filter((x) => ['COMPLETED', 'REFUNDED'].includes(x.status)).length,
  }
})

const fetch = async () => {
  loading.value = true
  try {
    const res = await listAdminReturnRequests(status.value ? { status: status.value } : {})
    rows.value = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    message.error(getErrorMessage(error, 'Không tải được danh sách đơn hoàn trả'))
    rows.value = []
  } finally {
    loading.value = false
  }
}

const goDetail = (id) => router.push(`/orders/returns/${id}`)
const money = (v) => `${Number(v || 0).toLocaleString('vi-VN')} đ`
const formatDate = (v) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-')
const statusText = (s) => ({
  REQUESTED: 'Đã tạo - chờ nhận hàng',
  RECEIVED: 'Đã nhận hàng hoàn',
  ACCEPTED: 'Đã duyệt hàng hoàn',
  COMPLETED: 'Đã hoàn tiền/hoàn tất',
  REJECTED: 'Từ chối',
  PENDING: 'Chờ duyệt (cũ)',
  APPROVED: 'Đã duyệt (cũ)',
  REFUNDED: 'Đã hoàn tiền (cũ)',
}[s] || s || '-')
const statusColor = (s) => ({ REQUESTED: 'orange', RECEIVED: 'blue', ACCEPTED: 'purple', COMPLETED: 'green', REJECTED: 'red', PENDING: 'orange', APPROVED: 'blue', REFUNDED: 'cyan' }[s] || 'default')

onMounted(fetch)
</script>

<style scoped>
.mb-3 { margin-bottom: 16px; }
.muted { color: #6b7280; font-size: 12px; margin-top: 4px; }
</style>
