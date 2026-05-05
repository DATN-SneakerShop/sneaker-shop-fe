<template>
  <div style="padding:24px">

    <a-page-header title="Dashboard khách hàng" />

    <!-- CARD -->
    <a-row :gutter="16">
      <a-col :span="6" v-for="card in summaryCards" :key="card.key">
        <a-card>
          <div style="color:#999">{{ card.label }}</div>
          <div style="font-size:24px;font-weight:700">
            {{ card.value }}
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- ===== 4 BLOCK ===== -->

    <a-row :gutter="16" style="margin-top:16px">

      <!-- TOP VIP -->
      <a-col :span="12">
        <a-card title="Top khách VIP">
          <a-table
            :dataSource="topVIP"
            :columns="columns"
            rowKey="id"
            :pagination="false"
            size="small"
          />
        </a-card>
      </a-col>

      <!-- TOP CHI TIÊU -->
      <a-col :span="12">
        <a-card title="Top chi tiêu">
          <a-table
            :dataSource="topSpending"
            :columns="spendingColumns"
            rowKey="id"
            :pagination="false"
            size="small"
          />
        </a-card>
      </a-col>

    </a-row>

    <a-row :gutter="16" style="margin-top:16px">

      <!-- LOYALTY -->
      <a-col :span="12">
        <a-card title="Khách trung thành">
          <a-table
            :dataSource="loyaltyCustomers"
            :columns="loyaltyColumns"
            rowKey="id"
            :pagination="false"
            size="small"
          />
        </a-card>
      </a-col>

      <!-- KHÁCH MỚI -->
      <a-col :span="12">
        <a-card title="Khách mới">
          <a-table
            :dataSource="newCustomers"
            :columns="newCustomerColumns"
            rowKey="id"
            :pagination="false"
            size="small"
          />
        </a-card>
      </a-col>

    </a-row>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import api from "@/api/axios"

const customers = ref([])

// ===== FETCH =====
const fetchCustomers = async () => {
  const res = await api.get("/khach-hang/filter", {
    params: { loaiKhach: "ALL" }
  })
  customers.value = res.data
}

// ===== CARD =====
const summaryCards = computed(() => {
  const list = customers.value

  return [
    {
      key: "total",
      label: "Tổng khách",
      value: list.length
    },
    {
      key: "vip",
      label: "Khách VIP",
      value: list.filter(i => i.loaiKhach === "VIP").length
    },
    {
      key: "loyal",
      label: "Loyalty",
      value: list.filter(i => i.loaiKhach === "LOYALTY").length
    },
    {
      key: "normal",
      label: "Khách thường",
      value: list.filter(i => i.loaiKhach === "NORMAL").length
    }
  ]
})

// ===== DATA BLOCK =====

// Top VIP
const topVIP = computed(() =>
  customers.value
    .filter(c => c.loaiKhach === "VIP")
    .sort((a, b) => b.diemTichLuy - a.diemTichLuy)
    .slice(0, 5)
)

// Top chi tiêu
const topSpending = computed(() =>
  [...customers.value]
    .map(c => ({
      ...c,
      totalSpent: c.diemTichLuy || 0
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5)
)

// Loyalty (có số lần mua)
const loyaltyCustomers = computed(() =>
  customers.value
    .filter(c => c.loaiKhach === "LOYALTY")
    .map(c => ({
      ...c,
      soLanMua: Math.floor((c.diemTichLuy || 0) / 1000)
    }))
    .slice(0, 5)
)

// Khách mới
const newCustomers = computed(() =>
  [...customers.value]
    .sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
    .slice(0, 5)
)

// ===== COLUMNS =====

// bảng chung
const columns = [
  { title: "Tên", dataIndex: "ten" },
  { title: "Email", dataIndex: "email" },
  {
    title: "Hạng",
    dataIndex: "loaiKhach",
    customRender: ({ text }) => {
      if (text === "VIP") return "⭐ VIP"
      if (text === "LOYALTY") return "💎 Loyalty"
      return text
    }
  },
  { title: "Điểm", dataIndex: "diemTichLuy" }
]

// Top chi tiêu
const spendingColumns = [
  { title: "Tên", dataIndex: "ten" },
  { title: "Email", dataIndex: "email" },
  { title: "Hạng", dataIndex: "loaiKhach" },
  {
    title: "Chi tiêu",
    dataIndex: "totalSpent",
    customRender: ({ text }) =>
      Number(text).toLocaleString("vi-VN") + " ₫"
  }
]

// Loyalty
const loyaltyColumns = [
  { title: "Tên", dataIndex: "ten" },
  { title: "Email", dataIndex: "email" },
  { title: "Hạng", dataIndex: "loaiKhach" },
  {
    title: "Số lần mua",
    dataIndex: "soLanMua",
    customRender: ({ text }) => `🛒 ${text} đơn`
  }
]

// Khách mới
const newCustomerColumns = [
  { title: "Tên", dataIndex: "ten" },
  { title: "Email", dataIndex: "email" }
]

onMounted(fetchCustomers)
</script>