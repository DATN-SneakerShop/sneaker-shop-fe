<template>
  <div>
    <a-page-header title="Báo cáo hoàn trả" sub-title="" @back="router.back()" />

    <a-card>
      <template #extra>
        <a-space>
          <a-select
            v-model:value="status"
            allow-clear
            placeholder="Lọc return status"
            style="width: 220px"
            @change="fetch"
          >
            <a-select-option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</a-select-option>
          </a-select>
          <a-button @click="fetch">Tải lại</a-button>
        </a-space>
      </template>

      <a-table :dataSource="rows" :columns="columns" rowKey="orderId" :loading="loading" :pagination="{ pageSize: 10 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag color="volcano">{{ record.returnStatus }}</a-tag>
          </template>

          <template v-if="column.key === 'money'">
            <div><b>Final: {{ money(record.finalAmount) }}</b></div>
            <div style="color:#999">Returned: {{ money(record.returnedAmount) }}</div>
            <div style="color:#999">Total: {{ money(record.totalAmount) }}</div>
          </template>

          <template v-if="column.key === 'returnedAt'">
            {{ formatDate(record.returnedAt) }}
          </template>

          <template v-if="column.key === 'action'">
            <a-button type="link" @click="router.push(`/orders/${record.orderId}`)">Chi tiết</a-button>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { returnReport } from '@/api/order.api'

const router = useRouter()
const loading = ref(false)
const rows = ref([])
const status = ref(undefined)

const statusOptions = ['NONE', 'PARTIAL', 'PARTIALLY_RETURNED', 'COMPLETED', 'RETURNED']

const columns = [
  { title: 'Mã đơn', dataIndex: 'orderCode', key: 'orderCode', width: 200 },
  { title: 'Return status', dataIndex: 'returnStatus', key: 'status', width: 180 },
  { title: 'Tiền', key: 'money' },
  { title: 'Thời điểm', dataIndex: 'returnedAt', key: 'returnedAt', width: 180 },
  { title: 'Thao tác', key: 'action', width: 120 },
]

const fetch = async () => {
  loading.value = true
  try {
    const res = await returnReport(status.value ? { status: status.value } : {})
    const data = res.data
    rows.value = (Array.isArray(data) ? data : data?.data) || []
  } catch {
    message.error('Không tải được báo cáo hoàn trả')
    rows.value = []
  } finally {
    loading.value = false
  }
}

const money = (v) => {
  if (v == null) return '-'
  try { return Number(v).toLocaleString('vi-VN') } catch { return v }
}

const formatDate = (v) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-')

onMounted(fetch)
</script>
