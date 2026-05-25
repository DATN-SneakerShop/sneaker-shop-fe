<template>
  <div class="return-page">
    <div class="page-head">
      <div>
        <h2>Quản lý trả hàng hoàn tiền</h2>
        <p>Chỉ xử lý đơn đã hoàn thành và còn trong 7 ngày kể từ lúc giao/thành công.</p>
      </div>
      <a-space>
        <a-select v-model:value="filterStatus" allow-clear placeholder="Lọc trạng thái" style="width: 180px" @change="fetchReturns">
          <a-select-option v-for="s in statuses" :key="s" :value="s">{{ statusText(s) }}</a-select-option>
        </a-select>
        <a-button type="primary" @click="fetchReturns" :loading="loading">Tải lại</a-button>
      </a-space>
    </div>

    <a-table :columns="columns" :data-source="returns" row-key="id" :loading="loading" bordered>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'code'">
          <a @click="openDetail(record)">{{ record.code }}</a>
          <div class="muted">Đơn: {{ record.orderCode }}</div>
        </template>
        <template v-else-if="column.key === 'customer'">
          <div>{{ record.customerName || 'Khách lẻ' }}</div>
          <div class="muted">{{ record.customerPhone || '-' }}</div>
        </template>
        <template v-else-if="column.key === 'refundAmount'">
          {{ money(record.refundAmount) }}
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="statusColor(record.status)">{{ statusText(record.status) }}</a-tag>
        </template>
        <template v-else-if="column.key === 'createdAt'">
          {{ formatDate(record.createdAt) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button size="small" type="link" @click="openDetail(record)">Xử lý</a-button>
        </template>
      </template>
    </a-table>

    <a-drawer v-model:open="detailOpen" width="980" title="Chi tiết yêu cầu trả hàng hoàn tiền">
      <div v-if="selected">
        <a-descriptions bordered size="small" :column="2">
          <a-descriptions-item label="Mã yêu cầu">{{ selected.code }}</a-descriptions-item>
          <a-descriptions-item label="Mã đơn">{{ selected.orderCode }}</a-descriptions-item>
          <a-descriptions-item label="Khách hàng">{{ selected.customerName || 'Khách lẻ' }}</a-descriptions-item>
          <a-descriptions-item label="SĐT">{{ selected.customerPhone || '-' }}</a-descriptions-item>
          <a-descriptions-item label="Trạng thái">
            <a-tag :color="statusColor(selected.status)">{{ statusText(selected.status) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="Tiền hoàn">{{ money(selected.refundAmount) }}</a-descriptions-item>
          <a-descriptions-item label="Lý do" :span="2">{{ selected.reason || '-' }}</a-descriptions-item>
          <a-descriptions-item label="Ghi chú khách" :span="2">{{ selected.customerNote || '-' }}</a-descriptions-item>
          <a-descriptions-item label="Ghi chú admin" :span="2">{{ selected.adminNote || '-' }}</a-descriptions-item>
          <a-descriptions-item v-if="selected.rejectReason" label="Lý do từ chối" :span="2">{{ selected.rejectReason }}</a-descriptions-item>
        </a-descriptions>

        <h3 class="mt">Sản phẩm trả</h3>
        <a-table :columns="itemColumns" :data-source="selected.items || []" row-key="id" :pagination="false" size="small" bordered>
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'product'">
              <b>{{ record.productName }}</b>
              <div class="muted">SKU: {{ record.sku || '-' }} | Size: {{ record.size || '-' }} | Màu: {{ record.color || '-' }}</div>
            </template>
            <template v-else-if="column.key === 'refundAmount'">{{ money(record.refundAmount) }}</template>
            <template v-else-if="column.key === 'receive'">
              <a-input-number v-model:value="record.receivedQuantity" :min="0" :max="record.quantity" style="width: 90px" :disabled="selected.status !== 'APPROVED'" />
            </template>
            <template v-else-if="column.key === 'restock'">
              <a-input-number v-model:value="record.restockQuantity" :min="0" :max="record.receivedQuantity || 0" style="width: 90px" :disabled="selected.status !== 'APPROVED'" />
            </template>
            <template v-else-if="column.key === 'condition'">
              <a-select v-model:value="record.conditionStatus" style="width: 150px" :disabled="selected.status !== 'APPROVED'">
                <a-select-option value="NEW">Còn mới</a-select-option>
                <a-select-option value="USED">Đã dùng</a-select-option>
                <a-select-option value="DEFECTIVE">Lỗi</a-select-option>
                <a-select-option value="NOT_RESELLABLE">Không bán lại</a-select-option>
              </a-select>
            </template>
          </template>
        </a-table>

        <a-textarea v-model:value="adminNote" class="mt" :rows="3" placeholder="Ghi chú admin..." />

        <div class="actions">
          <a-button v-if="selected.status === 'PENDING'" type="primary" :loading="submitting" @click="approve">Duyệt</a-button>
          <a-button v-if="selected.status === 'PENDING'" danger :loading="submitting" @click="reject">Từ chối</a-button>
          <a-button v-if="selected.status === 'APPROVED'" type="primary" :loading="submitting" @click="receive">Xác nhận đã nhận hàng</a-button>
          <a-button v-if="selected.status === 'RECEIVED'" type="primary" :loading="submitting" @click="refund">Xác nhận hoàn tiền</a-button>
          <a-button v-if="selected.status === 'REFUNDED'" type="primary" :loading="submitting" @click="complete">Hoàn tất</a-button>
        </div>

        <h3 class="mt">Lịch sử xử lý</h3>
        <a-timeline>
          <a-timeline-item v-for="(h, idx) in selected.histories || []" :key="idx">
            {{ statusText(h.oldStatus) || 'Tạo mới' }} → {{ statusText(h.newStatus) }}
            <div class="muted">{{ h.note || '-' }} - {{ formatDate(h.createdAt) }}</div>
          </a-timeline-item>
        </a-timeline>
      </div>
    </a-drawer>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { Modal, message } from 'ant-design-vue'
import { getErrorMessage } from '@/utils/error'
import {
  listAdminReturnRequests,
  getAdminReturnRequestDetail,
  approveReturnRequest,
  rejectReturnRequest,
  receiveReturnRequest,
  refundReturnRequest,
  completeReturnRequest,
} from '@/api/return-refund.api'

const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED', 'COMPLETED']
const loading = ref(false)
const submitting = ref(false)
const returns = ref([])
const filterStatus = ref()
const detailOpen = ref(false)
const selected = ref(null)
const adminNote = ref('')

const columns = [
  { title: 'Yêu cầu', key: 'code' },
  { title: 'Khách hàng', key: 'customer' },
  { title: 'Tiền hoàn', key: 'refundAmount', width: 140 },
  { title: 'Trạng thái', key: 'status', width: 150 },
  { title: 'Ngày tạo', key: 'createdAt', width: 180 },
  { title: 'Hành động', key: 'action', width: 100 },
]

const itemColumns = [
  { title: 'Sản phẩm', key: 'product' },
  { title: 'Mua', dataIndex: 'boughtQuantity', key: 'boughtQuantity', width: 70 },
  { title: 'Đã trả', dataIndex: 'previouslyReturnedQuantity', key: 'previouslyReturnedQuantity', width: 80 },
  { title: 'Yêu cầu trả', dataIndex: 'quantity', key: 'quantity', width: 100 },
  { title: 'Đã nhận', key: 'receive', width: 110 },
  { title: 'Nhập kho', key: 'restock', width: 110 },
  { title: 'Tình trạng', key: 'condition', width: 170 },
  { title: 'Tiền hoàn', key: 'refundAmount', width: 130 },
]

const statusText = (s) => ({
  PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', RECEIVED: 'Đã nhận hàng', REFUNDED: 'Đã hoàn tiền', COMPLETED: 'Hoàn tất'
}[s] || s || '')

const statusColor = (s) => ({
  PENDING: 'orange', APPROVED: 'blue', REJECTED: 'red', RECEIVED: 'purple', REFUNDED: 'cyan', COMPLETED: 'green'
}[s] || 'default')

const money = (v) => Number(v || 0).toLocaleString('vi-VN') + ' đ'
const formatDate = (v) => v ? new Date(v).toLocaleString('vi-VN') : '-'

const fetchReturns = async () => {
  loading.value = true
  try {
    const res = await listAdminReturnRequests({ status: filterStatus.value })
    returns.value = res.data || []
  } catch (e) {
    message.error(getErrorMessage(e))
  } finally {
    loading.value = false
  }
}

const openDetail = async (record) => {
  detailOpen.value = true
  adminNote.value = ''
  try {
    const res = await getAdminReturnRequestDetail(record.id)
    selected.value = res.data
    selected.value.items = (selected.value.items || []).map(i => ({ ...i, receivedQuantity: i.receivedQuantity || i.quantity, restockQuantity: i.restockQuantity || 0, conditionStatus: i.conditionStatus || 'NEW' }))
  } catch (e) {
    message.error(getErrorMessage(e))
  }
}

const refreshDetail = async () => {
  if (!selected.value?.id) return
  const res = await getAdminReturnRequestDetail(selected.value.id)
  selected.value = res.data
  await fetchReturns()
}

const approve = async () => {
  submitting.value = true
  try {
    await approveReturnRequest(selected.value.id, { adminNote: adminNote.value })
    message.success('Đã duyệt yêu cầu trả hàng.')
    await refreshDetail()
  } catch (e) { message.error(getErrorMessage(e)) } finally { submitting.value = false }
}

const reject = () => {
  Modal.confirm({
    title: 'Từ chối yêu cầu trả hàng?',
    content: 'Yêu cầu sẽ kết thúc ở trạng thái từ chối.',
    okText: 'Từ chối', okType: 'danger', cancelText: 'Đóng',
    async onOk() {
      submitting.value = true
      try {
        await rejectReturnRequest(selected.value.id, { reason: adminNote.value || 'Admin từ chối yêu cầu trả hàng.' })
        message.success('Đã từ chối yêu cầu.')
        await refreshDetail()
      } catch (e) { message.error(getErrorMessage(e)) } finally { submitting.value = false }
    }
  })
}

const receive = async () => {
  submitting.value = true
  try {
    await receiveReturnRequest(selected.value.id, {
      adminNote: adminNote.value,
      items: (selected.value.items || []).map(i => ({
        returnItemId: i.id,
        receivedQuantity: i.receivedQuantity || 0,
        restockQuantity: i.restockQuantity || 0,
        conditionStatus: i.conditionStatus || 'NEW',
        note: i.note,
      }))
    })
    message.success('Đã xác nhận nhận hàng trả.')
    await refreshDetail()
  } catch (e) { message.error(getErrorMessage(e)) } finally { submitting.value = false }
}

const refund = async () => {
  submitting.value = true
  try {
    await refundReturnRequest(selected.value.id, { refundMethod: 'BANK_TRANSFER', adminNote: adminNote.value })
    message.success('Đã xác nhận hoàn tiền.')
    await refreshDetail()
  } catch (e) { message.error(getErrorMessage(e)) } finally { submitting.value = false }
}

const complete = async () => {
  submitting.value = true
  try {
    await completeReturnRequest(selected.value.id)
    message.success('Đã hoàn tất trả hàng hoàn tiền.')
    await refreshDetail()
  } catch (e) { message.error(getErrorMessage(e)) } finally { submitting.value = false }
}

onMounted(fetchReturns)
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.page-head h2 { margin: 0; }
.page-head p, .muted { color: #6b7280; margin: 4px 0 0; font-size: 13px; }
.mt { margin-top: 18px; }
.actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
</style>
