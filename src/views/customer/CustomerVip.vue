<template>
  <div style="padding: 24px">
    <a-card title="👑 Danh sách khách hàng VIP">
      <template #extra>
        <a-space wrap>
          <span style="font-weight:600; color:#555">Lọc theo điểm:</span>
          <a-input-number v-model:value="minPoint" :min="0" :max="1000000" style="width:120px" />
          <a-input-number v-model:value="maxPoint" :min="0" :max="1000000" style="width:120px" />
          <a-slider v-model:value="rangePoint" range :min="0" :max="100000" style="width:220px" @change="handleSliderChange" />
          <a-input v-model:value="keyword" allow-clear placeholder="Tìm tên/email/SĐT" style="width:220px" @change="applyFilter" />
          <a-button @click="fetchCustomers">Tải lại</a-button>
          <a-button @click="openAllHistory">📜 Lịch sử VIP</a-button>
        </a-space>
      </template>

      <div style="margin-bottom:10px">
        Tổng số khách trong danh sách VIP/điểm: <b>{{ filteredCustomers.length }}</b> |
        Khoảng điểm: <b>{{ minPoint }} - {{ maxPoint }}</b>
      </div>

      <a-table :dataSource="filteredCustomers" :columns="columns" rowKey="customerId" :loading="loading" bordered>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'rankName'">
            <a-tag color="gold">{{ record.rankName || 'BRONZE' }}</a-tag>
          </template>
          <template v-else-if="column.key === 'totalSpent'">
            <b>{{ formatMoney(record.totalSpent) }}</b>
          </template>
          <template v-else-if="column.key === 'orderCount'">
            <a-tag color="blue">{{ record.orderCount || 0 }} đơn</a-tag>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="isHistoryVisible" title="📜 Nhật ký biến động VIP / điểm" width="900px" :footer="null">
      <a-table :dataSource="historyTimeline" rowKey="historyKey" size="small" bordered :pagination="{ pageSize: 8 }">
        <a-table-column title="Thời gian">
          <template #default="{ record }">{{ formatDate(record.changedAt) }}</template>
        </a-table-column>
        <a-table-column title="Khách hàng" dataIndex="customerName" />
        <a-table-column title="Nội dung biến động">
          <template #default="{ record }">
            <div v-if="record.hasPoint">
              <a-tag color="orange">ĐIỂM</a-tag>
              {{ record.oldPoint }} → <b style="color:#1890ff">{{ record.newPoint }}</b>
              <span v-if="record.reason"> - {{ record.reason }}</span>
            </div>
            <div v-if="record.hasRank">
              <a-tag color="purple">HẠNG</a-tag>
              {{ record.oldRank || '-' }} → <b style="color:#722ed1">{{ record.newRank }}</b>
              <span v-if="record.reason"> - {{ record.reason }}</span>
            </div>
          </template>
        </a-table-column>
      </a-table>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '@/api/axios'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { getVipCustomers } from '@/api/customer'
import { getErrorMessage } from '@/utils/error'

const columns = [
  { title: 'Tên khách hàng', dataIndex: 'customerName', key: 'customerName' },
  { title: 'Email', dataIndex: 'customerEmail', key: 'customerEmail' },
  { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
  { title: 'Hạng', dataIndex: 'rankName', key: 'rankName', align: 'center' },
  { title: 'Điểm', dataIndex: 'point', key: 'point', align: 'center' },
  { title: 'Tổng chi tiêu', dataIndex: 'totalSpent', key: 'totalSpent', align: 'right' },
  { title: 'Số đơn', dataIndex: 'orderCount', key: 'orderCount', align: 'center' },
]

const customers = ref([])
const filteredCustomers = ref([])
const loading = ref(false)
const isHistoryVisible = ref(false)
const historyTimeline = ref([])
const keyword = ref('')
const minPoint = ref(0)
const maxPoint = ref(100000)
const rangePoint = ref([0, 100000])

const fetchCustomers = async () => {
  loading.value = true
  try {
    const res = await getVipCustomers({ minPoint: minPoint.value, maxPoint: maxPoint.value })
    customers.value = res.data || []
    applyFilter()
  } catch (err) {
    message.error(getErrorMessage(err, 'Không tải được danh sách khách VIP'))
  } finally {
    loading.value = false
  }
}

const applyFilter = () => {
  const kw = keyword.value.trim().toLowerCase()
  let data = [...customers.value]
  if (kw) {
    data = data.filter(c =>
      c.customerName?.toLowerCase().includes(kw)
      || c.customerEmail?.toLowerCase().includes(kw)
      || c.phone?.includes(kw)
    )
  }
  filteredCustomers.value = data
}

const handleSliderChange = (value) => {
  minPoint.value = value[0]
  maxPoint.value = value[1]
}

watch([minPoint, maxPoint], () => {
  rangePoint.value = [minPoint.value, maxPoint.value]
  fetchCustomers()
})

const openAllHistory = async () => {
  try {
    const res = await api.get('/khach-hang/history/all')
    const timeline = [
      ...(res.data?.pointHistory || []).map(i => ({ ...i, historyKey: `p-${i.id}`, hasPoint: true, hasRank: false })),
      ...(res.data?.rankHistory || []).map(i => ({ ...i, historyKey: `r-${i.id}`, hasPoint: false, hasRank: true })),
    ]
    timeline.sort((a, b) => new Date(b.changedAt || 0) - new Date(a.changedAt || 0))
    historyTimeline.value = timeline
    isHistoryVisible.value = true
  } catch (err) {
    message.error(getErrorMessage(err, 'Lỗi tải lịch sử VIP'))
  }
}

const formatMoney = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v || 0))
const formatDate = (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-'

onMounted(fetchCustomers)
</script>
