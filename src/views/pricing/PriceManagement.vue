<script setup>
import { ref, onMounted, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { getErrorMessage } from '@/utils/error'
import {
  getPriceBoard,
  getPriceHistory,
  createPrice,
  deletePrice
} from '@/api/prices'

/* ================= STATE ================= */
const products = ref([])
const historyVisible = ref(false)
const selectedProduct = ref(null)
const priceHistory = ref([])
const newPrice = ref(null)
const loading = ref(false)

/* ===== SEARCH ===== */
const keyword = ref('')
const minPrice = ref(null)
const maxPrice = ref(null)

/* ================= UTILS ================= */
const formatPrice = (price) => {
  if (price == null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN').format(price) + ' ₫'
}

/* ================= FILTER ================= */
const filteredProducts = computed(() => {
  return products.value.filter(p => {
    // search text
    const k = keyword.value?.toLowerCase()
    const matchText = !k ||
      p.productName?.toLowerCase().includes(k) ||
      p.sku?.toLowerCase().includes(k) ||
      p.colorway?.toLowerCase().includes(k) ||
      String(p.size).includes(k)

    // search price range
    const price = p.price
    const matchMin = minPrice.value == null || (price != null && price >= minPrice.value)
    const matchMax = maxPrice.value == null || (price != null && price <= maxPrice.value)

    return matchText && matchMin && matchMax
  })
})

/* ================= API ================= */
const loadProducts = async () => {
  try {
    loading.value = true
    const { data } = await getPriceBoard()
    products.value = data
  } finally {
    loading.value = false
  }
}

const openHistory = async (record) => {
  selectedProduct.value = record
  const { data } = await getPriceHistory(record.variantId)
  priceHistory.value = data
  historyVisible.value = true
}

const addPrice = async () => {
  if (!newPrice.value || newPrice.value < 1000) {
    return message.error('Giá phải ≥ 1.000 ₫')
  }

  try {
    loading.value = true

    await createPrice(selectedProduct.value.variantId, {
      price: Number(newPrice.value)
    })

    message.success('Cập nhật giá gốc thành công')
    newPrice.value = null
    await openHistory(selectedProduct.value)
    await loadProducts()
  } catch (e) {
    const errorMsg = getErrorMessage(e, 'Thêm giá thất bại')
    message.error(errorMsg)
  } finally {
    loading.value = false
  }
}

const removePrice = (record) => {
  Modal.confirm({
    title: 'Xóa giá',
    content: 'Dữ liệu này sẽ được chuyển vào trạng thái lưu trữ (xóa mềm).',
    okText: 'Xóa',
    cancelText: 'Hủy',
    async onOk() {
      try {
        await deletePrice(record.priceId)
        message.success('Đã xóa thành công')
        await openHistory(selectedProduct.value)
        await loadProducts()

      } catch (e) {
        const errorMsg = getErrorMessage(e, 'Không thể xóa')
        message.error(errorMsg)
      }
    }
  })
}

onMounted(loadProducts)
</script>
<template>
  <div>
    <h2>Quản lý giá sản phẩm</h2>

    <!-- ================= SEARCH ================= -->
    <a-space style="margin-bottom: 16px" wrap>
      <a-input v-model:value="keyword" placeholder="Tìm tên, SKU, màu, size..." allow-clear style="width: 260px" />

      <a-input-number v-model:value="minPrice" placeholder="Giá từ" :min="0" :step="1000" style="width: 160px"
        :controls="false" @keydown="e => ['-', '+', 'e'].includes(e.key) && e.preventDefault()" :formatter="v =>
          v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₫' : ''
          " :parser="v => {
    const n = Number(v.replace(/[^\d]/g, ''))
    return n >= 0 ? n : null
  }" />


      <a-input-number v-model:value="maxPrice" placeholder="Giá đến" :min="0" :step="1000" style="width: 160px"
        :controls="false" @keydown="e => ['-', '+', 'e'].includes(e.key) && e.preventDefault()" :formatter="v =>
          v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₫' : ''
          " :parser="v => {
    const n = Number(v.replace(/[^\d]/g, ''))
    return n >= 0 ? n : null
  }" />


      <a-button @click="() => {
        keyword = ''
        minPrice = null
        maxPrice = null
      }">
        Reset
      </a-button>
    </a-space>

    <!-- ================= BẢNG GIÁ ================= -->

    <a-table :columns="columns" :data-source="filteredProducts" row-key="id" bordered :loading="loading" :pagination="{
      pageSize: 5,
      showSizeChanger: false
    }">

      <a-table-column title="Sản phẩm" dataIndex="productName" />
      <a-table-column title="SKU" dataIndex="sku" />
      <a-table-column title="Màu" dataIndex="colorway" />
      <a-table-column title="Size" dataIndex="size" />

      <a-table-column title="Giá hiện tại">
        <template #default="{ record }">
          <a-tag v-if="record.price != null" color="green">
            {{ formatPrice(record.price) }}
          </a-tag>
          <a-tag v-else color="orange">
            Chưa có giá
          </a-tag>
        </template>
      </a-table-column>

      <a-table-column title="Thao tác">
        <template #default="{ record }">
          <a-button type="link" @click="openHistory(record)">
            Quản lý giá
          </a-button>
        </template>
      </a-table-column>
    </a-table>

    <!-- ================= MODAL LỊCH SỬ ================= -->
    <a-modal v-model:open="historyVisible" width="820px" :footer="null" title="Lịch sử giá">
      <p>
        <b>{{ selectedProduct?.productName }}</b>
      </p>
      <p class="sub-info">
        SKU: {{ selectedProduct?.sku }} |
        Màu: {{ selectedProduct?.colorway }} |
        Size: {{ selectedProduct?.size }}
      </p>

      <!-- ADD PRICE -->
      <a-space style="margin-bottom: 16px">
        <a-input-number v-model:value="newPrice" placeholder="Giá mới" style="width: 220px" :min="1000" :step="1000"
          :controls="false" @keydown="e => ['-', '+', 'e'].includes(e.key) && e.preventDefault()" :formatter="v =>
            v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₫' : ''
            " :parser="v => {
    const n = Number(v.replace(/[^\d]/g, ''))
    return n >= 1000 ? n : null
  }" />

        <a-button type="primary" :disabled="!newPrice || newPrice < 1000" :loading="loading" @click="addPrice">
          Thêm giá mới
        </a-button>
      </a-space>

      <!-- HISTORY TABLE -->
      <a-table :dataSource="priceHistory" rowKey="priceId" size="small" bordered>
        <a-table-column title="Giá">
          <template #default="{ record }">
            <a-tag v-if="record.active" color="green">
              {{ formatPrice(record.price) }}
            </a-tag>
            <span v-else class="old-price">
              {{ formatPrice(record.price) }}
            </span>
          </template>
        </a-table-column>

        <a-table-column title="Từ ngày" dataIndex="startDate" />
        <a-table-column title="Đến ngày">
          <template #default="{ record }">
            <a-badge v-if="record.active" status="success" text="Hiện tại" />
            <span v-else>{{ record.endDate }}</span>
          </template>
        </a-table-column>

        <a-table-column title="Hành động">
          <template #default="{ record }">
            <a-button danger size="small" v-if="!record.active" @click="removePrice(record)">
              Xóa
            </a-button>
          </template>
        </a-table-column>
      </a-table>
    </a-modal>
  </div>
</template>
.sub-info {
color: #6b7280;
margin-bottom: 12px;
}

.old-price {
color: #9ca3af;
text-decoration: line-through;
font-size: 13px;
}

:deep(.ant-table-tbody > tr:hover > td) {
background: #fafafa;
}
