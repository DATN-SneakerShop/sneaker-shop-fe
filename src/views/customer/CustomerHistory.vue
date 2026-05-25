<template>
  <div style="padding:24px">
    <a-card title="📜 Lịch sử giao dịch khách hàng">
      <template #extra>
        <a-space>
          <a-input v-model:value="keyword" allow-clear placeholder="Tìm khách, email, mã đơn..." style="width:280px" @change="applyFilter" />
          <a-select v-model:value="typeFilter" style="width:180px" @change="applyFilter">
            <a-select-option value="ALL">Tất cả giao dịch</a-select-option>
            <a-select-option value="ORDER">Đơn mua hàng</a-select-option>
            <a-select-option value="REFUND">Có hoàn tiền</a-select-option>
          </a-select>
          <a-button @click="fetchHistory">Tải lại</a-button>
        </a-space>
      </template>

      <a-table :dataSource="filteredHistory" rowKey="id" :loading="loading" bordered>
        <a-table-column title="Thời gian" width="180px">
          <template #default="{record}">{{ formatDate(record.createdAt) }}</template>
        </a-table-column>

        <a-table-column title="Khách hàng" dataIndex="customerName" />
        <a-table-column title="Email" dataIndex="customerEmail" />
        <a-table-column title="Mã đơn" dataIndex="orderCode" />

        <a-table-column title="Loại" width="130px">
          <template #default="{record}">
            <a-tag :color="record.type === 'REFUND' ? 'orange' : 'green'">
              {{ record.type === 'REFUND' ? 'Hoàn tiền' : 'Mua hàng' }}
            </a-tag>
          </template>
        </a-table-column>

        <a-table-column title="Giá trị đơn" align="right">
          <template #default="{record}">{{ formatMoney(record.orderAmount) }}</template>
        </a-table-column>

        <a-table-column title="Đã hoàn" align="right">
          <template #default="{record}">{{ formatMoney(record.returnedAmount) }}</template>
        </a-table-column>

        <a-table-column title="Thực chi" align="right">
          <template #default="{record}"><b>{{ formatMoney(record.netAmount) }}</b></template>
        </a-table-column>

        <a-table-column title="Trạng thái" width="170px">
          <template #default="{record}">
            <a-space direction="vertical" size="small">
              <a-tag color="blue">{{ record.orderStatus }}</a-tag>
              <a-tag color="purple">{{ record.paymentStatus }}</a-tag>
            </a-space>
          </template>
        </a-table-column>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { getCustomerTransactions } from '@/api/customer'
import { getErrorMessage } from '@/utils/error'

const historyList = ref([])
const filteredHistory = ref([])
const loading = ref(false)
const keyword = ref('')
const typeFilter = ref('ALL')

const fetchHistory = async () => {
  loading.value = true
  try {
    const res = await getCustomerTransactions()
    historyList.value = res.data || []
    applyFilter()
  } catch (err) {
    message.error(getErrorMessage(err, 'Không tải được lịch sử giao dịch'))
  } finally {
    loading.value = false
  }
}

const applyFilter = () => {
  const kw = keyword.value.trim().toLowerCase()
  let data = [...historyList.value]
  if (kw) {
    data = data.filter(i =>
      i.customerName?.toLowerCase().includes(kw)
      || i.customerEmail?.toLowerCase().includes(kw)
      || i.orderCode?.toLowerCase().includes(kw)
    )
  }
  if (typeFilter.value !== 'ALL') {
    data = data.filter(i => i.type === typeFilter.value)
  }
  filteredHistory.value = data
}

const formatMoney = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v || 0))
const formatDate = (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '-'

onMounted(fetchHistory)
</script>
