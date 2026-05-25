<template>
  <div class="return-detail-page">
    <a-page-header title="Xử lý đơn hoàn trả" :sub-title="detail?.code || ''" @back="router.push('/orders/returns/report')">
      <template #extra>
        <a-button @click="fetchDetail" :loading="loading">Tải lại</a-button>
        <a-button v-if="detail?.orderId" @click="router.push(`/orders/${detail.orderId}`)">Xem đơn gốc</a-button>
      </template>
    </a-page-header>

    <a-spin :spinning="loading">
      <template v-if="detail">
        <a-alert class="mb" :type="currentHint.type" show-icon :message="currentHint.message" />

        <a-row :gutter="16">
          <a-col :span="16">
            <a-card title="Thông tin đơn hoàn trả" class="mb">
              <a-descriptions bordered size="small" :column="2">
                <a-descriptions-item label="Mã hoàn trả">{{ detail.code }}</a-descriptions-item>
                <a-descriptions-item label="Trạng thái"><a-tag :color="statusColor(detail.status)">{{ statusText(detail.status) }}</a-tag></a-descriptions-item>
                <a-descriptions-item label="Mã đơn gốc">{{ detail.orderCode || '-' }}</a-descriptions-item>
                <a-descriptions-item label="Ngày tạo">{{ formatDate(detail.createdAt) }}</a-descriptions-item>
                <a-descriptions-item label="Khách hàng">{{ detail.customerName || 'Khách lẻ' }}</a-descriptions-item>
                <a-descriptions-item label="SĐT">{{ detail.customerPhone || '-' }}</a-descriptions-item>
                <a-descriptions-item label="Lý do" :span="2">{{ detail.reason || '-' }}</a-descriptions-item>
                <a-descriptions-item label="Ghi chú khách" :span="2">{{ detail.customerNote || '-' }}</a-descriptions-item>
                <a-descriptions-item label="Ghi chú xử lý" :span="2">{{ detail.adminNote || '-' }}</a-descriptions-item>
                <a-descriptions-item v-if="detail.rejectReason" label="Lý do từ chối" :span="2">{{ detail.rejectReason }}</a-descriptions-item>
              </a-descriptions>
            </a-card>

            <a-card title="Sản phẩm hoàn trả" class="mb">
              <a-table :columns="itemColumns" :data-source="items" row-key="id" :pagination="false" bordered size="small">
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'product'">
                    <b>{{ record.productName || '-' }}</b>
                    <div class="muted">SKU: {{ record.sku || '-' }} | Size: {{ record.size || '-' }} | Màu: {{ record.color || '-' }}</div>
                  </template>
                  <template v-else-if="column.key === 'receive'">
                    <a-input-number v-model:value="record.receivedQuantity" :min="0" :max="record.quantity" style="width: 100%" :disabled="!canReceive" />
                  </template>
                  <template v-else-if="column.key === 'restock'">
                    <a-input-number v-model:value="record.restockQuantity" :min="0" :max="record.receivedQuantity || 0" style="width: 100%" :disabled="!canReceive" />
                  </template>
                  <template v-else-if="column.key === 'condition'">
                    <a-select v-model:value="record.conditionStatus" style="width: 160px" :disabled="!canReceive">
                      <a-select-option value="NEW">Còn mới</a-select-option>
                      <a-select-option value="USED">Đã dùng</a-select-option>
                      <a-select-option value="DEFECTIVE">Lỗi</a-select-option>
                      <a-select-option value="NOT_RESELLABLE">Không bán lại</a-select-option>
                    </a-select>
                  </template>
                  <template v-else-if="column.key === 'refundAmount'">{{ money(record.refundAmount) }}</template>
                </template>
              </a-table>
            </a-card>

            <a-card title="Timeline xử lý">
              <a-timeline>
                <a-timeline-item v-for="(h, idx) in detail.histories || []" :key="idx" :color="statusColor(h.newStatus)">
                  {{ statusText(h.oldStatus) || 'Tạo mới' }} → {{ statusText(h.newStatus) }}
                  <div class="muted">{{ h.note || '-' }} - {{ h.createdBy || '-' }} - {{ formatDate(h.createdAt) }}</div>
                </a-timeline-item>
              </a-timeline>
            </a-card>
          </a-col>

          <a-col :span="8">
            <a-card title="Tổng quan hoàn tiền" class="mb">
              <div class="money-row"><span>Tiền hoàn dự kiến</span><b>{{ money(detail.refundAmount) }}</b></div>
              <div class="money-row"><span>Phương thức hoàn</span><b>{{ refundMethodText(detail.refundMethod) }}</b></div>
              <div class="money-row"><span>Mã giao dịch</span><b>{{ detail.refundTransactionCode || '-' }}</b></div>
            </a-card>

            <a-card title="Điều khiển nghiệp vụ" class="mb">
              <a-form layout="vertical">
                <a-form-item label="Ghi chú xử lý">
                  <a-textarea v-model:value="adminNote" :rows="4" placeholder="Nhập ghi chú cho bước xử lý hiện tại" />
                </a-form-item>
                <a-form-item v-if="canComplete" label="Mã giao dịch hoàn tiền">
                  <a-input v-model:value="refundTransactionCode" placeholder="VD: RF20260524001" />
                </a-form-item>
              </a-form>

              <a-space direction="vertical" style="width: 100%">
                <a-button v-if="canReceive" type="primary" block :loading="submitting" @click="receive">Xác nhận đã nhận hàng trả</a-button>
                <a-button v-if="canAccept" type="primary" block :loading="submitting" @click="accept">Duyệt hàng hoàn trả</a-button>
                <a-button v-if="canComplete" type="primary" block :loading="submitting" @click="completeRefund">Xác nhận hoàn tiền & hoàn tất</a-button>
                <a-button v-if="canReject" danger block :loading="submitting" @click="reject">Từ chối đơn hoàn trả</a-button>
              </a-space>
            </a-card>
          </a-col>
        </a-row>
      </template>
    </a-spin>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { getErrorMessage } from '@/utils/error'
import { getAdminReturnRequestDetail, receiveReturnRequest, approveReturnRequest, rejectReturnRequest, refundReturnRequest } from '@/api/return-refund.api'

const route = useRoute()
const router = useRouter()
const returnId = route.params.returnId
const loading = ref(false)
const submitting = ref(false)
const detail = ref(null)
const items = ref([])
const adminNote = ref('')
const refundTransactionCode = ref('')

const itemColumns = [
  { title: 'Sản phẩm', key: 'product' },
  { title: 'Mua', dataIndex: 'boughtQuantity', key: 'boughtQuantity', width: 70, align: 'center' },
  { title: 'Đã trả', dataIndex: 'previouslyReturnedQuantity', key: 'previouslyReturnedQuantity', width: 80, align: 'center' },
  { title: 'Yêu cầu', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'center' },
  { title: 'Đã nhận', key: 'receive', width: 110 },
  { title: 'Nhập kho', key: 'restock', width: 110 },
  { title: 'Tình trạng', key: 'condition', width: 180 },
  { title: 'Tiền hoàn', key: 'refundAmount', width: 130, align: 'right' },
]

const normalizedStatus = computed(() => {
  const s = detail.value?.status
  if (s === 'PENDING') return 'REQUESTED'
  if (s === 'APPROVED') return 'RECEIVED'
  if (s === 'REFUNDED') return 'COMPLETED'
  return s
})
const canReceive = computed(() => normalizedStatus.value === 'REQUESTED')
const canAccept = computed(() => normalizedStatus.value === 'RECEIVED')
const canComplete = computed(() => normalizedStatus.value === 'ACCEPTED')
const canReject = computed(() => ['REQUESTED', 'RECEIVED'].includes(normalizedStatus.value))

const currentHint = computed(() => ({
  REQUESTED: { type: 'info', message: 'Đơn hoàn trả đã được tạo. Bước tiếp theo: xác nhận đã nhận hàng trả từ khách.' },
  RECEIVED: { type: 'warning', message: 'Đã nhận hàng trả. Kiểm tra tình trạng hàng, số lượng nhập lại kho rồi duyệt hàng hoàn trả.' },
  ACCEPTED: { type: 'info', message: 'Hàng hoàn đã được duyệt. Bước cuối: xác nhận hoàn tiền để hệ thống cập nhật kho, thanh toán, đơn hàng và điểm VIP.' },
  COMPLETED: { type: 'success', message: 'Đơn hoàn trả đã hoàn tất. Không còn thao tác xử lý.' },
  REJECTED: { type: 'error', message: 'Đơn hoàn trả đã bị từ chối. Không còn thao tác xử lý.' },
}[normalizedStatus.value] || { type: 'info', message: 'Kiểm tra trạng thái đơn hoàn trả để xử lý bước tiếp theo.' }))

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await getAdminReturnRequestDetail(returnId)
    detail.value = res.data
    adminNote.value = ''
    refundTransactionCode.value = detail.value?.refundTransactionCode || ''
    items.value = (detail.value?.items || []).map((i) => ({
      ...i,
      receivedQuantity: i.receivedQuantity ?? i.quantity,
      restockQuantity: i.restockQuantity ?? 0,
      conditionStatus: i.conditionStatus || 'NEW',
    }))
  } catch (error) {
    message.error(getErrorMessage(error, 'Không tải được chi tiết đơn hoàn trả'))
  } finally {
    loading.value = false
  }
}

const clampReturnReceiveRows = () => {
  items.value.forEach((i) => {
    const requested = Number(i.quantity || 0)
    let received = Number(i.receivedQuantity || 0)
    let restock = Number(i.restockQuantity || 0)

    if (!Number.isFinite(received) || received < 0) received = 0
    if (!Number.isFinite(restock) || restock < 0) restock = 0
    if (received > requested) received = requested
    if (restock > received) restock = received

    i.receivedQuantity = received
    i.restockQuantity = restock
  })
}

watch(items, clampReturnReceiveRows, { deep: true })

const receive = async () => {
  clampReturnReceiveRows()
  const invalidItem = items.value.find((i) => {
    const requested = Number(i.quantity || 0)
    const received = Number(i.receivedQuantity || 0)
    const restock = Number(i.restockQuantity || 0)
    return received < 0 || received > requested || restock < 0 || restock > received
  })

  if (invalidItem) {
    message.warning('Số lượng nhận hàng trả hoặc nhập lại kho không hợp lệ.')
    return
  }

  submitting.value = true
  try {
    await receiveReturnRequest(returnId, {
      adminNote: adminNote.value,
      items: items.value.map((i) => ({
        returnItemId: i.id,
        receivedQuantity: Number(i.receivedQuantity || 0),
        restockQuantity: Number(i.restockQuantity || 0),
        conditionStatus: i.conditionStatus || 'NEW',
        note: i.note,
      }))
    })
    message.success('Đã xác nhận nhận hàng trả.')
    await fetchDetail()
  } catch (error) { message.error(getErrorMessage(error)) } finally { submitting.value = false }
}

const accept = async () => {
  submitting.value = true
  try {
    await approveReturnRequest(returnId, { adminNote: adminNote.value })
    message.success('Đã duyệt hàng hoàn trả.')
    await fetchDetail()
  } catch (error) { message.error(getErrorMessage(error)) } finally { submitting.value = false }
}

const reject = () => {
  Modal.confirm({
    title: 'Từ chối đơn hoàn trả?',
    content: 'Đơn hoàn trả sẽ kết thúc ở trạng thái từ chối.',
    okText: 'Từ chối', okType: 'danger', cancelText: 'Đóng',
    async onOk() {
      submitting.value = true
      try {
        await rejectReturnRequest(returnId, { reason: adminNote.value || 'Admin từ chối đơn hoàn trả.' })
        message.success('Đã từ chối đơn hoàn trả.')
        await fetchDetail()
      } catch (error) { message.error(getErrorMessage(error)) } finally { submitting.value = false }
    }
  })
}

const completeRefund = () => {
  Modal.confirm({
    title: 'Xác nhận đã hoàn tiền?',
    content: 'Sau bước này hệ thống sẽ cập nhật kho, trạng thái đơn hàng, trạng thái thanh toán và trừ điểm VIP nếu có.',
    okText: 'Xác nhận hoàn tiền', cancelText: 'Đóng',
    async onOk() {
      submitting.value = true
      try {
        await refundReturnRequest(returnId, {
          refundMethod: 'BANK_TRANSFER',
          transactionCode: refundTransactionCode.value,
          adminNote: adminNote.value,
        })
        message.success('Đã hoàn tiền và hoàn tất đơn hoàn trả.')
        await fetchDetail()
      } catch (error) { message.error(getErrorMessage(error)) } finally { submitting.value = false }
    }
  })
}

const money = (v) => `${Number(v || 0).toLocaleString('vi-VN')} đ`
const formatDate = (v) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-')
const refundMethodText = (v) => ({ BANK_TRANSFER: 'Chuyển khoản', CASH: 'Tiền mặt', ORIGINAL_METHOD: 'Theo phương thức gốc' }[v] || v || '-')
const statusText = (s) => ({
  REQUESTED: 'Đã tạo - chờ nhận hàng', RECEIVED: 'Đã nhận hàng hoàn', ACCEPTED: 'Đã duyệt hàng hoàn', COMPLETED: 'Đã hoàn tiền/hoàn tất', REJECTED: 'Từ chối',
  PENDING: 'Chờ duyệt (cũ)', APPROVED: 'Đã duyệt (cũ)', REFUNDED: 'Đã hoàn tiền (cũ)'
}[s] || s || '')
const statusColor = (s) => ({ REQUESTED: 'orange', RECEIVED: 'blue', ACCEPTED: 'purple', COMPLETED: 'green', REJECTED: 'red', PENDING: 'orange', APPROVED: 'blue', REFUNDED: 'cyan' }[s] || 'default')

onMounted(fetchDetail)
</script>

<style scoped>
.mb { margin-bottom: 16px; }
.muted { color: #6b7280; font-size: 12px; margin-top: 4px; }
.money-row { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px dashed #e5e7eb; }
</style>
