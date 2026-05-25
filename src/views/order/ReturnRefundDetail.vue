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
              <a-alert
                v-if="canReceive"
                class="mb"
                type="info"
                show-icon
                message="Có thể tách cùng một biến thể thành nhiều dòng phân loại: còn bán lại được, khách làm hỏng, lỗi sản xuất... Hệ thống sẽ tự cộng tổng đã nhận, nhập kho và tiền hoàn thực tế."
              />

              <a-table :columns="itemColumns" :data-source="items" row-key="id" :pagination="false" bordered size="small" :expanded-row-keys="items.map(i => i.id)">
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'product'">
                    <b>{{ record.productName || '-' }}</b>
                    <div class="muted">SKU: {{ record.sku || '-' }} | Size: {{ record.size || '-' }} | Màu: {{ record.color || '-' }}</div>
                  </template>
                  <template v-else-if="column.key === 'receivedQuantity'">
                    <b>{{ inspectionTotal(record, 'quantity') }}</b>
                  </template>
                  <template v-else-if="column.key === 'restockQuantity'">
                    <b>{{ inspectionTotal(record, 'restockQuantity') }}</b>
                  </template>
                  <template v-else-if="column.key === 'refundAmount'">
                    {{ money(actualRefundAmount(record)) }}
                  </template>
                </template>

                <template #expandedRowRender="{ record }">
                  <div class="inspection-box">
                    <div class="inspection-head">
                      <div>
                        <b>Phân loại hàng nhận thực tế</b>
                        <div class="muted">
                          Tổng phân loại: {{ inspectionTotal(record, 'quantity') }} / {{ record.quantity }} | Nhập kho: {{ inspectionTotal(record, 'restockQuantity') }} | Hoàn tiền SL: {{ inspectionTotal(record, 'refundQuantity') }}
                        </div>
                      </div>
                      <a-button v-if="canReceive" size="small" type="primary" @click="addInspection(record)">+ Thêm dòng phân loại</a-button>
                    </div>

                    <a-table :columns="inspectionColumns" :data-source="record.inspections" :pagination="false" size="small" row-key="_key" bordered>
                      <template #bodyCell="{ column, record: row, index }">
                        <template v-if="column.key === 'conditionStatus'">
                          <a-select v-model:value="row.conditionStatus" style="width: 160px" :disabled="!canReceive" @change="normalizeInspectionRows(record)">
                            <a-select-option value="NEW">Còn bán lại được</a-select-option>
                            <a-select-option value="USED">Đã dùng</a-select-option>
                            <a-select-option value="DEFECTIVE">Lỗi sản xuất</a-select-option>
                            <a-select-option value="NOT_RESELLABLE">Khách làm hỏng / không bán lại</a-select-option>
                          </a-select>
                        </template>
                        <template v-else-if="column.key === 'quantity'">
                          <a-input-number v-model:value="row.quantity" :min="0" :max="record.quantity" style="width: 100%" :disabled="!canReceive" @change="normalizeInspectionRows(record)" />
                        </template>
                        <template v-else-if="column.key === 'restockQuantity'">
                          <a-input-number v-model:value="row.restockQuantity" :min="0" :max="row.quantity || 0" style="width: 100%" :disabled="!canReceive || row.conditionStatus !== 'NEW'" @change="normalizeInspectionRows(record)" />
                        </template>
                        <template v-else-if="column.key === 'refundQuantity'">
                          <a-input-number v-model:value="row.refundQuantity" :min="0" :max="row.quantity || 0" style="width: 100%" :disabled="!canReceive" @change="normalizeInspectionRows(record)" />
                        </template>
                        <template v-else-if="column.key === 'refundRate'">
                          <a-input-number v-model:value="row.refundRate" :min="0" :max="100" :step="10" addon-after="%" style="width: 100%" :disabled="!canReceive" @change="normalizeInspectionRows(record)" />
                        </template>
                        <template v-else-if="column.key === 'responsibility'">
                          <a-select v-model:value="row.responsibility" style="width: 145px" :disabled="!canReceive">
                            <a-select-option value="NONE">Không lỗi</a-select-option>
                            <a-select-option value="CUSTOMER">Khách hàng</a-select-option>
                            <a-select-option value="SHOP">Shop</a-select-option>
                            <a-select-option value="SUPPLIER">Nhà sản xuất/NCC</a-select-option>
                          </a-select>
                        </template>
                        <template v-else-if="column.key === 'dispositionType'">
                          <a-select v-model:value="row.dispositionType" style="width: 180px" :disabled="!canReceive" @change="normalizeInspectionRows(record)">
                            <a-select-option value="RESTOCKED">Nhập lại kho bán</a-select-option>
                            <a-select-option value="DAMAGED_BY_CUSTOMER">Hỏng do khách</a-select-option>
                            <a-select-option value="MANUFACTURER_DEFECT">Lỗi sản xuất/NCC</a-select-option>
                            <a-select-option value="REPAIR_PENDING">Chờ sửa chữa</a-select-option>
                            <a-select-option value="SUPPLIER_CLAIM">Chờ gửi NCC</a-select-option>
                            <a-select-option value="NOT_RESELLABLE_HOLD">Kho hàng lỗi</a-select-option>
                            <a-select-option value="DISPOSED">Hủy bỏ</a-select-option>
                            <a-select-option value="LIQUIDATION">Thanh lý</a-select-option>
                          </a-select>
                        </template>
                        <template v-else-if="column.key === 'warehouseLocation'">
                          <a-input v-model:value="row.warehouseLocation" placeholder="VD: Kho bán / Kệ lỗi A1" :disabled="!canReceive" />
                        </template>
                        <template v-else-if="column.key === 'refundAmount'">
                          {{ money(inspectionRefundAmount(record, row)) }}
                        </template>
                        <template v-else-if="column.key === 'note'">
                          <a-input v-model:value="row.note" placeholder="Ghi chú" :disabled="!canReceive" />
                        </template>
                        <template v-else-if="column.key === 'action'">
                          <a-button v-if="canReceive" danger size="small" @click="removeInspection(record, index)">Xóa</a-button>
                        </template>
                      </template>
                    </a-table>
                  </div>
                </template>
              </a-table>
            </a-card>

            <a-card v-if="hasDispositions" title="Hàng hoàn đã đi đâu" class="mb">
              <a-table :columns="dispositionColumns" :data-source="dispositionRows" :pagination="false" size="small" row-key="_key" bordered>
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'product'">
                    <b>{{ record.productName || '-' }}</b>
                    <div class="muted">SKU: {{ record.sku || '-' }} | Size: {{ record.size || '-' }} | Màu: {{ record.color || '-' }}</div>
                  </template>
                  <template v-else-if="column.key === 'conditionStatus'">{{ conditionText(record.conditionStatus) }}</template>
                  <template v-else-if="column.key === 'dispositionType'">
                    <a-tag>{{ dispositionText(record.dispositionType) }}</a-tag>
                  </template>
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
              <div class="money-row"><span>Tiền hoàn dự kiến ban đầu</span><b>{{ money(originalRefundAmount) }}</b></div>
              <div class="money-row"><span>Tiền hoàn thực tế</span><b>{{ money(actualRefundTotal) }}</b></div>
              <div class="money-row"><span>Phương thức hoàn</span><b>{{ refundMethodText(detail.refundMethod) }}</b></div>
              <div class="money-row"><span>Mã giao dịch</span><b>{{ detail.refundTransactionCode || '-' }}</b></div>
            </a-card>

            <a-card title="Điều khiển nghiệp vụ" class="mb">
              <a-form layout="vertical">
                <a-form-item label="Ghi chú xử lý">
                  <a-textarea v-model:value="adminNote" :rows="4" placeholder="Nhập ghi chú cho bước xử lý hiện tại" />
                </a-form-item>
                <a-form-item v-if="canComplete" label="Phương thức hoàn tiền">
                  <a-select v-model:value="refundMethod">
                    <a-select-option value="BANK_TRANSFER">Chuyển khoản</a-select-option>
                    <a-select-option value="CASH">Tiền mặt</a-select-option>
                    <a-select-option value="OTHER">Khác / theo phương thức gốc</a-select-option>
                  </a-select>
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
import { computed, onMounted, ref } from 'vue'
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
const refundMethod = ref('BANK_TRANSFER')

const itemColumns = [
  { title: 'Sản phẩm', key: 'product' },
  { title: 'Mua', dataIndex: 'boughtQuantity', key: 'boughtQuantity', width: 70, align: 'center' },
  { title: 'Đã trả', dataIndex: 'previouslyReturnedQuantity', key: 'previouslyReturnedQuantity', width: 80, align: 'center' },
  { title: 'Yêu cầu', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'center' },
  { title: 'Đã nhận', key: 'receivedQuantity', width: 90, align: 'center' },
  { title: 'Nhập kho', key: 'restockQuantity', width: 90, align: 'center' },
  { title: 'Tiền hoàn thực tế', key: 'refundAmount', width: 140, align: 'right' },
]

const inspectionColumns = [
  { title: 'Tình trạng', key: 'conditionStatus', width: 180 },
  { title: 'SL', key: 'quantity', width: 90 },
  { title: 'Nhập kho', key: 'restockQuantity', width: 110 },
  { title: 'SL hoàn tiền', key: 'refundQuantity', width: 115 },
  { title: 'Tỷ lệ hoàn', key: 'refundRate', width: 120 },
  { title: 'Trách nhiệm', key: 'responsibility', width: 155 },
  { title: 'Hướng xử lý', key: 'dispositionType', width: 190 },
  { title: 'Vị trí/kho', key: 'warehouseLocation', width: 180 },
  { title: 'Tiền hoàn', key: 'refundAmount', width: 120, align: 'right' },
  { title: 'Ghi chú', key: 'note', width: 180 },
  { title: '', key: 'action', width: 70 },
]

const dispositionColumns = [
  { title: 'Sản phẩm', key: 'product' },
  { title: 'Tình trạng', key: 'conditionStatus', width: 140 },
  { title: 'Hướng xử lý', key: 'dispositionType', width: 170 },
  { title: 'SL', dataIndex: 'quantity', key: 'quantity', width: 70, align: 'center' },
  { title: 'Nhập kho bán', dataIndex: 'restockQuantity', key: 'restockQuantity', width: 110, align: 'center' },
  { title: 'Không bán lại', dataIndex: 'nonResellableQuantity', key: 'nonResellableQuantity', width: 110, align: 'center' },
  { title: 'Vị trí/kho', dataIndex: 'warehouseLocation', key: 'warehouseLocation', width: 140 },
  { title: 'Ghi chú', dataIndex: 'note', key: 'note', width: 180 },
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

const originalRefundAmount = computed(() => Number(detail.value?.refundAmount || 0))
const actualRefundTotal = computed(() => items.value.reduce((sum, item) => sum + actualRefundAmount(item), 0))

const currentHint = computed(() => ({
  REQUESTED: { type: 'info', message: 'Đơn hoàn trả đã được tạo. Bước tiếp theo: phân loại hàng nhận thực tế rồi xác nhận đã nhận hàng trả từ khách.' },
  RECEIVED: { type: 'warning', message: 'Đã nhận hàng trả. Kiểm tra số lượng nhập kho, số lượng được hoàn tiền rồi duyệt hàng hoàn trả.' },
  ACCEPTED: { type: 'info', message: 'Hàng hoàn đã được duyệt. Bước cuối: xác nhận hoàn tiền để hệ thống cập nhật kho, thanh toán, đơn hàng và điểm VIP.' },
  COMPLETED: { type: 'success', message: 'Đơn hoàn trả đã hoàn tất. Không còn thao tác xử lý.' },
  REJECTED: { type: 'error', message: 'Đơn hoàn trả đã bị từ chối. Không còn thao tác xử lý.' },
}[normalizedStatus.value] || { type: 'info', message: 'Kiểm tra trạng thái đơn hoàn trả để xử lý bước tiếp theo.' }))

const newInspectionKey = () => `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`

const defaultInspectionRows = (item) => {
  const quantity = Number(item.receivedQuantity ?? item.quantity ?? 0)
  const restock = Number(item.restockQuantity ?? 0)
  return [{
    _key: newInspectionKey(),
    conditionStatus: item.conditionStatus || 'NEW',
    quantity,
    restockQuantity: restock,
    refundQuantity: quantity,
    refundRate: 100,
    responsibility: 'NONE',
    dispositionType: defaultDispositionType(item.conditionStatus || 'NEW', restock, 'NONE'),
    warehouseLocation: restock > 0 ? 'Kho bán' : 'Kho hàng hoàn lỗi',
    refundAmount: Number(item.refundAmount || 0),
    note: item.note || '',
  }]
}

const normalizeItem = (i) => {
  const mapped = {
    ...i,
    inspections: Array.isArray(i.inspections) && i.inspections.length
      ? i.inspections.map((x) => ({ ...x, _key: x.id || newInspectionKey() }))
      : defaultInspectionRows(i),
  }
  normalizeInspectionRows(mapped)
  return mapped
}

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await getAdminReturnRequestDetail(returnId)
    detail.value = res.data
    adminNote.value = ''
    refundTransactionCode.value = detail.value?.refundTransactionCode || ''
    refundMethod.value = detail.value?.refundMethod || 'BANK_TRANSFER'
    items.value = (detail.value?.items || []).map(normalizeItem)
  } catch (error) {
    message.error(getErrorMessage(error, 'Không tải được chi tiết đơn hoàn trả'))
  } finally {
    loading.value = false
  }
}

function addInspection(item) {
  item.inspections.push({
    _key: newInspectionKey(),
    conditionStatus: 'NEW',
    quantity: 0,
    restockQuantity: 0,
    refundQuantity: 0,
    refundRate: 100,
    responsibility: 'NONE',
    dispositionType: 'RESTOCKED',
    warehouseLocation: 'Kho bán',
    note: '',
  })
}

function removeInspection(item, index) {
  item.inspections.splice(index, 1)
  if (!item.inspections.length) addInspection(item)
  normalizeInspectionRows(item)
}

function normalizeInspectionRows(item) {
  const maxQty = Number(item.quantity || 0)
  item.inspections.forEach((row) => {
    row.quantity = clampNumber(row.quantity, 0, maxQty)
    row.restockQuantity = clampNumber(row.restockQuantity, 0, row.quantity)
    row.refundQuantity = clampNumber(row.refundQuantity, 0, row.quantity)
    row.refundRate = clampNumber(row.refundRate, 0, 100)
    if (row.conditionStatus !== 'NEW') row.restockQuantity = 0
    if (!row.responsibility) row.responsibility = defaultResponsibility(row.conditionStatus)
    row.dispositionType = normalizeDispositionType(row)
    if (!row.warehouseLocation) row.warehouseLocation = row.restockQuantity > 0 ? 'Kho bán' : 'Kho hàng hoàn lỗi'
    row.refundAmount = inspectionRefundAmount(item, row)
  })
}

function clampNumber(value, min, max) {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return min
  return Math.min(Math.max(n, min), max)
}

function defaultResponsibility(condition) {
  if (condition === 'DEFECTIVE') return 'SUPPLIER'
  if (condition === 'NOT_RESELLABLE') return 'CUSTOMER'
  return 'NONE'
}

function defaultDispositionType(condition, restockQuantity = 0, responsibility = '') {
  if (Number(restockQuantity || 0) > 0) return 'RESTOCKED'
  if (condition === 'NOT_RESELLABLE' || responsibility === 'CUSTOMER') return 'DAMAGED_BY_CUSTOMER'
  if (condition === 'DEFECTIVE' || responsibility === 'SUPPLIER' || responsibility === 'SHOP') return 'MANUFACTURER_DEFECT'
  return 'NOT_RESELLABLE_HOLD'
}

function normalizeDispositionType(row) {
  const restock = Number(row.restockQuantity || 0)
  if (restock > 0) return 'RESTOCKED'
  if (!row.dispositionType || row.dispositionType === 'RESTOCKED') {
    return defaultDispositionType(row.conditionStatus, restock, row.responsibility)
  }
  return row.dispositionType
}

function inspectionTotal(item, field) {
  return (item.inspections || []).reduce((sum, row) => sum + Number(row[field] || 0), 0)
}

function inspectionRefundAmount(item, row) {
  return Number(item.unitPrice || 0) * Number(row.refundQuantity || 0) * Number(row.refundRate || 0) / 100
}

function actualRefundAmount(item) {
  return (item.inspections || []).reduce((sum, row) => sum + inspectionRefundAmount(item, row), 0)
}

function validateInspectionBeforeReceive() {
  for (const item of items.value) {
    normalizeInspectionRows(item)
    const total = inspectionTotal(item, 'quantity')
    if (total < 0) {
      message.warning(`Sản phẩm ${item.productName || ''} có số lượng nhận không hợp lệ.`)
      return false
    }
    if (total > Number(item.quantity || 0)) {
      message.warning('Tổng số lượng phân loại không được vượt quá số lượng yêu cầu trả.')
      return false
    }
  }
  const totalReceived = items.value.reduce((sum, item) => sum + inspectionTotal(item, 'quantity'), 0)
  if (totalReceived <= 0) {
    message.warning('Phải có ít nhất 1 sản phẩm được shop nhận lại.')
    return false
  }
  return true
}

const receive = async () => {
  if (!validateInspectionBeforeReceive()) return

  submitting.value = true
  try {
    await receiveReturnRequest(returnId, {
      adminNote: adminNote.value,
      items: items.value.map((i) => ({
        returnItemId: i.id,
        receivedQuantity: inspectionTotal(i, 'quantity'),
        restockQuantity: inspectionTotal(i, 'restockQuantity'),
        conditionStatus: i.inspections?.[0]?.conditionStatus || 'NEW',
        note: i.note,
        inspections: i.inspections.map((row) => ({
          conditionStatus: row.conditionStatus || 'NEW',
          quantity: Number(row.quantity || 0),
          restockQuantity: Number(row.restockQuantity || 0),
          refundQuantity: Number(row.refundQuantity || 0),
          refundRate: Number(row.refundRate || 0),
          responsibility: row.responsibility || defaultResponsibility(row.conditionStatus),
          dispositionType: row.dispositionType || defaultDispositionType(row.conditionStatus, row.restockQuantity, row.responsibility),
          warehouseLocation: row.warehouseLocation,
          note: row.note,
        })),
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
          refundMethod: refundMethod.value,
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
const refundMethodText = (v) => ({ BANK_TRANSFER: 'Chuyển khoản', CASH: 'Tiền mặt', OTHER: 'Khác / theo phương thức gốc' }[v] || v || '-')
const statusText = (s) => ({
  REQUESTED: 'Đã tạo - chờ nhận hàng', RECEIVED: 'Đã nhận hàng hoàn', ACCEPTED: 'Đã duyệt hàng hoàn', COMPLETED: 'Đã hoàn tiền/hoàn tất', REJECTED: 'Từ chối',
  PENDING: 'Chờ duyệt (cũ)', APPROVED: 'Đã duyệt (cũ)', REFUNDED: 'Đã hoàn tiền (cũ)'
}[s] || s || '')
const statusColor = (s) => ({ REQUESTED: 'orange', RECEIVED: 'blue', ACCEPTED: 'purple', COMPLETED: 'green', REJECTED: 'red', PENDING: 'orange', APPROVED: 'blue', REFUNDED: 'cyan' }[s] || 'default')
const conditionText = (s) => ({ NEW: 'Còn bán lại', USED: 'Đã dùng', DEFECTIVE: 'Lỗi sản xuất', NOT_RESELLABLE: 'Không bán lại' }[s] || s || '-')
const dispositionText = (s) => ({
  RESTOCKED: 'Nhập kho bán',
  DAMAGED_BY_CUSTOMER: 'Hỏng do khách',
  MANUFACTURER_DEFECT: 'Lỗi sản xuất/NCC',
  REPAIR_PENDING: 'Chờ sửa',
  SUPPLIER_CLAIM: 'Chờ gửi NCC',
  NOT_RESELLABLE_HOLD: 'Kho hàng lỗi',
  DISPOSED: 'Hủy bỏ',
  LIQUIDATION: 'Thanh lý',
}[s] || s || '-')

const dispositionRows = computed(() => items.value.flatMap((item) => (item.dispositions || []).map((d, idx) => ({
  ...d,
  _key: `${item.id}_${d.id || idx}`,
  productName: item.productName,
  sku: item.sku,
  size: item.size,
  color: item.color,
}))))
const hasDispositions = computed(() => dispositionRows.value.length > 0)

onMounted(fetchDetail)
</script>

<style scoped>
.mb { margin-bottom: 16px; }
.muted { color: #6b7280; font-size: 12px; margin-top: 4px; }
.money-row { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px dashed #e5e7eb; }
.inspection-box { padding: 12px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; }
.inspection-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; }
</style>
