<template>
  <div style="padding:24px">

    <a-card title="📜 Lịch sử giao dịch khách hàng">

      <a-table
        :dataSource="historyList"
        rowKey="id"
        :loading="loading"
        bordered
      >

        <!-- Thời gian -->
        <a-table-column title="Thời gian" width="200px">
          <template #default="{record}">
            {{ dayjs(record.createdAt).format("DD/MM/YYYY HH:mm:ss") }}
          </template>
        </a-table-column>

        <!-- Khách hàng -->
        <a-table-column
          title="Khách hàng"
          dataIndex="customerName"
        />

        <!-- Mã đơn -->
        <a-table-column
          title="Mã đơn"
          dataIndex="orderCode"
        />

        <!-- Giá trị đơn -->
        <a-table-column title="Giá trị đơn">
          <template #default="{record}">
            {{ formatMoney(record.orderAmount) }}
          </template>
        </a-table-column>

        <!-- Thao tác -->
        <a-table-column title="Thao tác" width="120px">

          <template #default="{record}">

            <a-popconfirm
              title="Xóa giao dịch này?"
              ok-text="Xóa"
              cancel-text="Hủy"
              @confirm="deleteHistory(record.orderId)"
            >

              <a-button type="link" danger>
                Xóa
              </a-button>

            </a-popconfirm>

          </template>

        </a-table-column>

      </a-table>

    </a-card>

  </div>
</template>



<script setup>

import { ref, onMounted } from "vue"
import api from "@/api/axios"
import { message } from "ant-design-vue"
import dayjs from "dayjs"

const historyList = ref([])
const loading = ref(false)


/* ======================
   Load lịch sử giao dịch
====================== */

const fetchHistory = async () => {

  loading.value = true

  try {

    const res = await api.get("/khach-hang/history")

    historyList.value = res.data || []

  } catch (err) {

    console.error(err)

    message.error("Không tải được lịch sử giao dịch")

  } finally {

    loading.value = false

  }

}


/* ======================
   Xóa giao dịch
====================== */

const deleteHistory = async (id) => {

  try {

    await api.delete(`/khach-hang/history/${id}`)

    message.success("Đã xóa giao dịch")

    fetchHistory()

  } catch (err) {

    console.error(err)

    message.error("Không xóa được giao dịch")

  }

}


/* ======================
   Format tiền
====================== */

const formatMoney = (v) => {

  if (!v) return "-"

  return Number(v).toLocaleString("vi-VN")

}


onMounted(fetchHistory)

</script>