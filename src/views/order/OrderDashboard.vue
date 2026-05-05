<template>
  <div>
    <a-page-header title="Dashboard đơn hàng" sub-title="" />

    <a-row :gutter="16">
      <a-col :xs="24" :sm="12" :lg="6" v-for="card in summaryCards" :key="card.key">
        <a-card :loading="loading" style="margin-bottom: 16px">
          <div style="color:#999">{{ card.label }}</div>
          <div style="font-size: 24px; font-weight: 700; margin-top: 8px">{{ card.value }}</div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16">
      <a-col :xs="24" :lg="12">
        <a-card title="Top sản phẩm bán chạy" :loading="loading" style="margin-bottom: 16px">
          <a-table
            :dataSource="dashboard?.topProducts || []"
            :columns="topProductColumns"
            rowKey="variantId"
            :pagination="false"
            size="small"
          />
        </a-card>
      </a-col>

      <a-col :xs="24" :lg="12">
        <a-card title="Top sản phẩm hoàn trả" :loading="loading" style="margin-bottom: 16px">
          <a-table
            :dataSource="dashboard?.topReturnedProducts || []"
            :columns="returnedColumns"
            rowKey="variantId"
            :pagination="false"
            size="small"
          />
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16">
      <a-col :xs="24" :lg="12">
        <a-card title="Doanh thu theo khách hàng" :loading="loading" style="margin-bottom: 16px">
          <a-table
            :dataSource="dashboard?.revenueByCustomer || []"
            :columns="customerRevenueColumns"
            rowKey="customerId"
            :pagination="false"
            size="small"
          />
        </a-card>
      </a-col>

      <a-col :xs="24" :lg="12">
        <a-card title="Doanh thu theo tháng" :loading="loading" style="margin-bottom: 16px">
          <a-table
            :dataSource="dashboard?.revenueMonthly || []"
            :columns="monthlyColumns"
            rowKey="month"
            :pagination="false"
            size="small"
          />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { getOrdersDashboard } from '@/api/order.api'

const loading = ref(false)
const dashboard = ref(null)

const fetchDashboard = async () => {
  loading.value = true
  try {
    const res = await getOrdersDashboard()
    dashboard.value = res.data
  } catch {
    message.error('Không tải được dashboard đơn hàng')
  } finally {
    loading.value = false
  }
}

const money = (v) => {
  if (v == null) return '-'
  try { return Number(v).toLocaleString('vi-VN') } catch { return v }
}

const summaryCards = computed(() => {
  const d = dashboard.value || {}
  return [
    { key: 'totalOrders', label: 'Tổng đơn', value: d.totalOrders ?? 0 },
    { key: 'completedOrders', label: 'Đơn hoàn tất', value: d.completedOrders ?? 0 },
    { key: 'cancelledOrders', label: 'Đơn hủy', value: d.cancelledOrders ?? 0 },
    { key: 'returnedOrders', label: 'Đơn có hoàn trả', value: d.returnedOrders ?? 0 },
    { key: 'revenueToday', label: 'Doanh thu hôm nay', value: money(d.revenueToday) },
    { key: 'revenueThisMonth', label: 'Doanh thu tháng này', value: money(d.revenueThisMonth) },
    { key: 'totalRevenue', label: 'Tổng doanh thu', value: money(d.totalRevenue) },
    { key: 'totalReturnedQuantity', label: 'Tổng SL hoàn trả', value: d.totalReturnedQuantity ?? 0 },
  ]
})

const topProductColumns = [
  { title: 'Variant ID', dataIndex: 'variantId', key: 'variantId', width: 100 },
  { title: 'Sản phẩm', dataIndex: 'productNameSnapshot', key: 'productNameSnapshot' },
  { title: 'SL thuần', dataIndex: 'netQuantity', key: 'netQuantity', width: 110 },
  { title: 'Doanh thu', dataIndex: 'revenue', key: 'revenue', width: 140, customRender: ({ text }) => money(text) },
]

const returnedColumns = [
  { title: 'Variant ID', dataIndex: 'variantId', key: 'variantId', width: 100 },
  { title: 'Sản phẩm', dataIndex: 'productNameSnapshot', key: 'productNameSnapshot' },
  { title: 'SL trả', dataIndex: 'returnedQuantity', key: 'returnedQuantity', width: 100 },
  { title: 'Tiền hoàn', dataIndex: 'returnedAmount', key: 'returnedAmount', width: 140, customRender: ({ text }) => money(text) },
]

const customerRevenueColumns = [
  { title: 'Khách hàng ID', dataIndex: 'customerId', key: 'customerId', width: 120 },
  { title: 'Số đơn', dataIndex: 'orderCount', key: 'orderCount', width: 100 },
  { title: 'Doanh thu', dataIndex: 'revenue', key: 'revenue', customRender: ({ text }) => money(text) },
]

const monthlyColumns = [
  { title: 'Tháng', dataIndex: 'month', key: 'month', width: 120 },
  { title: 'Số đơn', dataIndex: 'orderCount', key: 'orderCount', width: 100 },
  { title: 'Doanh thu', dataIndex: 'revenue', key: 'revenue', customRender: ({ text }) => money(text) },
]

onMounted(fetchDashboard)
</script>
