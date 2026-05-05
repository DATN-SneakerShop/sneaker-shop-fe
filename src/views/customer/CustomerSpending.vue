<script setup>
import { ref, onMounted, computed } from "vue"
import api from "@/api/axios"
import { message } from "ant-design-vue"
import { TrophyOutlined, UserOutlined, WalletOutlined, SearchOutlined } from '@ant-design/icons-vue'

const loading = ref(false)
const customers = ref([])
const filteredCustomers = ref([])
const topCustomers = ref([])

const searchText = ref("")
const spendingFilter = ref("ALL")
const sortOrder = ref("DESC")

/* ================= FORMAT TIỀN TỆ ================= */
const formatMoney = (value) => {
  if (!value) return "0 ₫"
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND"
  }).format(value)
}

/* ================= FETCH DATA (FIX LỖI 400) ================= */
const fetchSpendingData = async () => {
  loading.value = true
  try {
    // 🔥 Gọi song song 2 API với try-catch riêng để thằng này lỗi không kéo thằng kia chết theo
    const [resSpending, resTop] = await Promise.allSettled([
      api.get("/orders/customer-spending"),
      api.get("/orders/top-customers")
    ])

    if (resSpending.status === 'fulfilled') {
      customers.value = resSpending.value.data || []
      filteredCustomers.value = resSpending.value.data || []
    } else {
      console.error("Lỗi API spending:", resSpending.reason)
    }

    if (resTop.status === 'fulfilled') {
      topCustomers.value = resTop.value.data || []
    } else {
      console.error("Lỗi API Top Customers:", resTop.reason)
    }
  } catch (err) {
    message.error("Lỗi hệ thống khi tải dữ liệu chi tiêu")
  } finally {
    loading.value = false
  }
}

/* ================= BỘ LỌC & TÌM KIẾM ================= */
const applyFilter = () => {
  let data = [...customers.value]

  if (searchText.value) {
    data = data.filter(c =>
      c.customerName?.toLowerCase().includes(searchText.value.toLowerCase())
    )
  }

  if (spendingFilter.value !== "ALL") {
    data = data.filter(c => (c.totalSpent || 0) >= Number(spendingFilter.value))
  }

  data.sort((a, b) =>
    sortOrder.value === "DESC"
      ? (b.totalSpent || 0) - (a.totalSpent || 0)
      : (a.totalSpent || 0) - (b.totalSpent || 0)
  )

  filteredCustomers.value = data
}

const columns = [
  { title: "Mã khách", dataIndex: "customerId", key: "customerId", width: 120 },
  { title: "Tên khách hàng", dataIndex: "customerName", key: "customerName" },
  { title: "Tổng chi tiêu", dataIndex: "totalSpent", key: "totalSpent", align: 'right' },
  { title: "Số đơn đã mua", dataIndex: "orderCount", key: "orderCount", align: 'center' }
]

onMounted(fetchSpendingData)
</script>

<template>
  <div class="spending-page">
    <div class="page-header">
      <h2>🏆 Thống kê chi tiêu khách hàng</h2>
      <p style="color: #8c8c8c">Dữ liệu được cập nhật dựa trên tổng hóa đơn đã thanh toán thành công</p>
    </div>

    <a-row :gutter="16" class="top-cards">
      <a-col :span="8" v-for="(rank, index) in ['🥇 Quán quân', '🥈 Á quân', '🥉 Top 3']" :key="index">
        <a-card :bordered="false" class="rank-card" :class="`rank-${index + 1}`">
          <a-statistic :title="rank" :value="topCustomers[index]?.totalSpent || 0" :precision="0" suffix="₫"
            :value-style="{ color: '#fff', fontWeight: 'bold' }">
            <template #prefix>
              <trophy-outlined v-if="index === 0" />
              <user-outlined v-else />
            </template>
          </a-statistic>
          <div class="customer-name">
            {{ topCustomers[index]?.customerName || 'Chưa có dữ liệu' }}
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-card class="main-card">
      <template #title>
        <div class="table-toolbar">
          <a-space size="middle">
            <a-input v-model:value="searchText" placeholder="Tìm tên khách..." style="width: 250px" allow-clear
              @pressEnter="applyFilter">
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
          <template v-if="column.key === 'orderCount'">
            <a-tag color="blue">{{ record.orderCount || 0 }} đơn</a-tag>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<style scoped>
.spending-page {
  padding: 8px;
}

.page-header {
  margin-bottom: 24px;
}

.top-cards {
  margin-bottom: 24px;
}

.rank-card {
  border-radius: 12px;
  transition: transform 0.3s;
  color: white;
}

.rank-card:hover {
  transform: translateY(-5px);
}

/* Màu sắc cho các thẻ hạng */
.rank-1 {
  background: linear-gradient(135deg, #ff9c6e 0%, #fa8c16 100%);
  box-shadow: 0 4px 12px rgba(250, 140, 22, 0.3);
}

.rank-2 {
  background: linear-gradient(135deg, #69c0ff 0%, #1890ff 100%);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.rank-3 {
  background: linear-gradient(135deg, #95de64 0%, #52c41a 100%);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
}

.customer-name {
  margin-top: 12px;
  font-size: 16px;
  font-weight: 600;
  text-align: right;
  opacity: 0.9;
}

.main-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
