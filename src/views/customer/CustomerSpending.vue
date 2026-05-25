<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { TrophyOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons-vue'
import { getCustomerSpending, getTopSpendingCustomers } from '@/api/customer'
import { getErrorMessage } from '@/utils/error'

const loading = ref(false)
const customers = ref([])
const filteredCustomers = ref([])
const topCustomers = ref([])

const searchText = ref('')
const spendingFilter = ref('ALL')
const sortOrder = ref('DESC')

const formatMoney = (value) => {
  const n = Number(value || 0)
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

const fetchSpendingData = async () => {
  loading.value = true
  try {
    const [resSpending, resTop] = await Promise.all([
      getCustomerSpending(),
      getTopSpendingCustomers(3),
    ])
    customers.value = resSpending.data || []
    topCustomers.value = resTop.data || []
    applyFilter()
  } catch (err) {
    message.error(getErrorMessage(err, 'Không tải được thống kê chi tiêu khách hàng'))
  } finally {
    loading.value = false
  }
}

const applyFilter = () => {
  let data = [...customers.value]
  const keyword = searchText.value.trim().toLowerCase()

  if (keyword) {
    data = data.filter(c =>
      c.customerName?.toLowerCase().includes(keyword)
      || c.customerEmail?.toLowerCase().includes(keyword)
      || c.phone?.includes(keyword)
    )
  }

  if (spendingFilter.value !== 'ALL') {
    data = data.filter(c => Number(c.totalSpent || 0) >= Number(spendingFilter.value))
  }

  data.sort((a, b) => sortOrder.value === 'DESC'
    ? Number(b.totalSpent || 0) - Number(a.totalSpent || 0)
    : Number(a.totalSpent || 0) - Number(b.totalSpent || 0))

  filteredCustomers.value = data
}

const columns = [
  { title: 'Mã khách', dataIndex: 'customerId', key: 'customerId', width: 100 },
  { title: 'Tên khách hàng', dataIndex: 'customerName', key: 'customerName' },
  { title: 'Email', dataIndex: 'customerEmail', key: 'customerEmail' },
  { title: 'Hạng', dataIndex: 'rankName', key: 'rankName', align: 'center' },
  { title: 'Điểm', dataIndex: 'point', key: 'point', align: 'center' },
  { title: 'Tổng chi tiêu', dataIndex: 'totalSpent', key: 'totalSpent', align: 'right' },
  { title: 'Số đơn đã mua', dataIndex: 'orderCount', key: 'orderCount', align: 'center' },
]

onMounted(fetchSpendingData)
</script>

<template>
  <div class="spending-page">
    <div class="page-header">
      <h2>🏆 Thống kê chi tiêu khách hàng</h2>
      <p style="color: #8c8c8c">Tính theo đơn đã hoàn thành/thanh toán, đã trừ phần hoàn tiền nếu có.</p>
    </div>

    <a-row :gutter="16" class="top-cards">
      <a-col :span="8" v-for="(rank, index) in ['🥇 Quán quân', '🥈 Á quân', '🥉 Top 3']" :key="index">
        <a-card :bordered="false" class="rank-card" :class="`rank-${index + 1}`">
          <a-statistic :title="rank" :value="Number(topCustomers[index]?.totalSpent || 0)" :precision="0" suffix="₫"
            :value-style="{ color: '#fff', fontWeight: 'bold' }">
            <template #prefix>
              <trophy-outlined v-if="index === 0" />
              <user-outlined v-else />
            </template>
          </a-statistic>
          <div class="customer-name">{{ topCustomers[index]?.customerName || 'Chưa có dữ liệu' }}</div>
        </a-card>
      </a-col>
    </a-row>

    <a-card class="main-card">
      <template #title>
        <div class="table-toolbar">
          <a-space size="middle" wrap>
            <a-input v-model:value="searchText" placeholder="Tìm tên, email, SĐT..." style="width: 260px" allow-clear
              @change="applyFilter" @pressEnter="applyFilter">
              <template #prefix><search-outlined /></template>
            </a-input>

            <a-select v-model:value="spendingFilter" style="width: 200px" @change="applyFilter">
              <a-select-option value="ALL">Tất cả mức chi tiêu</a-select-option>
              <a-select-option value="1000000">Trên 1.000.000đ</a-select-option>
              <a-select-option value="5000000">Trên 5.000.000đ</a-select-option>
              <a-select-option value="10000000">Trên 10.000.000đ</a-select-option>
            </a-select>

            <a-select v-model:value="sortOrder" style="width: 180px" @change="applyFilter">
              <a-select-option value="DESC">Chi tiêu: Cao → Thấp</a-select-option>
              <a-select-option value="ASC">Chi tiêu: Thấp → Cao</a-select-option>
            </a-select>
          </a-space>
        </div>
      </template>

      <a-table :dataSource="filteredCustomers" :columns="columns" rowKey="customerId" :loading="loading" bordered>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'totalSpent'">
            <b style="color: #f5222d; font-size: 15px">{{ formatMoney(record.totalSpent) }}</b>
          </template>
          <template v-else-if="column.key === 'orderCount'">
            <a-tag color="blue">{{ record.orderCount || 0 }} đơn</a-tag>
          </template>
          <template v-else-if="column.key === 'rankName'">
            <a-tag color="gold">{{ record.rankName || 'BRONZE' }}</a-tag>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<style scoped>
.spending-page { padding: 8px; }
.page-header { margin-bottom: 24px; }
.top-cards { margin-bottom: 24px; }
.rank-card { border-radius: 12px; transition: transform 0.3s; color: white; }
.rank-card:hover { transform: translateY(-5px); }
.rank-1 { background: linear-gradient(135deg, #ff9c6e 0%, #fa8c16 100%); box-shadow: 0 4px 12px rgba(250, 140, 22, 0.3); }
.rank-2 { background: linear-gradient(135deg, #69c0ff 0%, #1890ff 100%); box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3); }
.rank-3 { background: linear-gradient(135deg, #95de64 0%, #52c41a 100%); box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3); }
.customer-name { margin-top: 12px; font-size: 16px; font-weight: 600; text-align: right; opacity: 0.9; }
.main-card { border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); }
.table-toolbar { display: flex; align-items: center; justify-content: space-between; }
</style>
