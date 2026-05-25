<template>
  <div style="padding:24px">
    <a-page-header title="Dashboard khách hàng" />

    <a-spin :spinning="loading">
      <a-row :gutter="16">
        <a-col :span="6" v-for="card in summaryCards" :key="card.key">
          <a-card>
            <div style="color:#999">{{ card.label }}</div>
            <div style="font-size:24px;font-weight:700">{{ card.value }}</div>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="16" style="margin-top:16px">
        <a-col :span="12">
          <a-card title="Top khách VIP">
            <a-table :dataSource="dashboard.topVip || []" :columns="vipColumns" rowKey="customerId" :pagination="false" size="small">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'rankName'"><a-tag color="gold">{{ record.rankName || 'BRONZE' }}</a-tag></template>
              </template>
            </a-table>
          </a-card>
        </a-col>

        <a-col :span="12">
          <a-card title="Top chi tiêu">
            <a-table :dataSource="dashboard.topSpending || []" :columns="spendingColumns" rowKey="customerId" :pagination="false" size="small">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'totalSpent'"><b>{{ formatMoney(record.totalSpent) }}</b></template>
              </template>
            </a-table>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="16" style="margin-top:16px">
        <a-col :span="12">
          <a-card title="Khách trung thành">
            <a-table :dataSource="dashboard.loyaltyCustomers || []" :columns="loyaltyColumns" rowKey="customerId" :pagination="false" size="small" />
          </a-card>
        </a-col>

        <a-col :span="12">
          <a-card title="Khách mới">
            <a-table :dataSource="dashboard.newCustomers || []" :columns="newCustomerColumns" rowKey="customerId" :pagination="false" size="small" />
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="16" style="margin-top:16px">
        <a-col :span="24">
          <a-card title="Giao dịch khách hàng gần đây">
            <a-table :dataSource="dashboard.recentTransactions || []" :columns="transactionColumns" rowKey="id" :pagination="false" size="small">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'netAmount'">{{ formatMoney(record.netAmount) }}</template>
                <template v-else-if="column.key === 'createdAt'">{{ formatDate(record.createdAt) }}</template>
                <template v-else-if="column.key === 'type'">
                  <a-tag :color="record.type === 'REFUND' ? 'orange' : 'green'">{{ record.type === 'REFUND' ? 'Hoàn tiền' : 'Mua hàng' }}</a-tag>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>
      </a-row>
    </a-spin>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { getCustomerDashboard } from '@/api/customer'
import { getErrorMessage } from '@/utils/error'

const loading = ref(false)
const dashboard = ref({})

const fetchDashboard = async () => {
  loading.value = true
  try {
    const res = await getCustomerDashboard()
    dashboard.value = res.data || {}
  } catch (err) {
    message.error(getErrorMessage(err, 'Không tải được dashboard khách hàng'))
  } finally {
    loading.value = false
  }
}

const summaryCards = computed(() => {
  const d = dashboard.value || {}
  return [
    { key: 'total', label: 'Tổng khách active', value: d.activeCustomers || 0 },
    { key: 'vip', label: 'Khách VIP/điểm', value: d.vipCustomers || 0 },
    { key: 'new', label: 'Khách mới tháng này', value: d.newCustomersThisMonth || 0 },
    { key: 'revenue', label: 'Tổng chi tiêu KH', value: formatMoney(d.totalCustomerRevenue) },
  ]
})

const vipColumns = [
  { title: 'Tên', dataIndex: 'customerName' },
  { title: 'Email', dataIndex: 'customerEmail' },
  { title: 'Hạng', dataIndex: 'rankName', key: 'rankName' },
  { title: 'Điểm', dataIndex: 'point' },
]

const spendingColumns = [
  { title: 'Tên', dataIndex: 'customerName' },
  { title: 'Email', dataIndex: 'customerEmail' },
  { title: 'Số đơn', dataIndex: 'orderCount' },
  { title: 'Chi tiêu', dataIndex: 'totalSpent', key: 'totalSpent' },
]

const loyaltyColumns = [
  { title: 'Tên', dataIndex: 'customerName' },
  { title: 'Email', dataIndex: 'customerEmail' },
  { title: 'Số đơn', dataIndex: 'orderCount' },
  { title: 'Điểm', dataIndex: 'point' },
]

const newCustomerColumns = [
  { title: 'Tên', dataIndex: 'customerName' },
  { title: 'Email', dataIndex: 'customerEmail' },
  { title: 'SĐT', dataIndex: 'phone' },
  { title: 'Hạng', dataIndex: 'rankName' },
]

const transactionColumns = [
  { title: 'Thời gian', dataIndex: 'createdAt', key: 'createdAt' },
  { title: 'Khách hàng', dataIndex: 'customerName' },
  { title: 'Mã đơn', dataIndex: 'orderCode' },
  { title: 'Loại', dataIndex: 'type', key: 'type' },
  { title: 'Thực chi', dataIndex: 'netAmount', key: 'netAmount' },
  { title: 'Trạng thái đơn', dataIndex: 'orderStatus' },
  { title: 'Thanh toán', dataIndex: 'paymentStatus' },
]

const formatMoney = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v || 0))
const formatDate = (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-'

onMounted(fetchDashboard)
</script>
