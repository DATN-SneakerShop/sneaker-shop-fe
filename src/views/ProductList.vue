<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { searchProductsAdvanced } from '@/api/product.api'
import { getCategories } from '@/api/category.api'
import ProductForm from '@/components/product/ProductForm.vue'

/* ================= ROUTER ================= */
const router = useRouter()

/* ================= STATE ================= */
const products = ref([])
const categories = ref([])
const loading = ref(false)

const page = ref(1)
const pageSize = 10
const total = ref(0)

/* ================= FILTER ================= */
const keyword = ref('')
const selectedCategories = ref([])
const sizeFilter = ref(null)
const colorway = ref('')
const brand = ref('')
const gender = ref(null)

/* ================= MODAL ================= */
const open = ref(false)

/* ================= FETCH PRODUCTS ================= */
const fetchProducts = async () => {
  try {
    loading.value = true

    const params = {
      page: page.value - 1,
      size: pageSize,
      keyword: keyword.value || undefined,
      sizeFilter: sizeFilter.value || undefined,
      colorway: colorway.value || undefined,
      brand: brand.value || undefined,
      gender: gender.value || undefined
    }

    // MULTI CATEGORY
    if (selectedCategories.value.length > 0) {
      params.categoryIds = selectedCategories.value
    }

    const res = await searchProductsAdvanced(params)

    products.value = res?.data?.content || []
    total.value = res?.data?.totalElements || 0

  } catch (err) {
    console.error(err)
    message.error('Không tải được danh sách sản phẩm')
  } finally {
    loading.value = false
  }
}

/* ================= FETCH CATEGORIES ================= */
const fetchCategories = async () => {
  try {
    const res = await getCategories()
    categories.value = res?.data || []
  } catch (err) {
    console.error(err)
    message.error('Không tải được danh mục')
  }
}

/* ================= LIFE CYCLE ================= */
onMounted(() => {
  fetchCategories()
  fetchProducts()
})

/* ================= ACTION ================= */
const onSearch = () => {
  page.value = 1
  fetchProducts()
}

const onReset = () => {
  keyword.value = ''
  selectedCategories.value = []
  sizeFilter.value = null
  colorway.value = ''
  brand.value = ''
  gender.value = null
  page.value = 1
  fetchProducts()
}

const onPageChange = (p) => {
  page.value = p
  fetchProducts()
}

/* ================= NAVIGATE ================= */
const goDetail = (id) => {
  router.push(`/products/${id}`)
}

/* ================= HELPER ================= */
const renderStatus = (status) => {
  const map = {
    IN_STOCK: 'Còn hàng',
    OUT_OF_STOCK: 'Hết hàng',
    PRE_ORDER: 'Đặt trước',
    DISCONTINUED: 'Ngừng bán'
  }
  return map[status] || status
}
</script>

<template>
  <a-space direction="vertical" style="width: 100%">

    <!-- ================= FILTER ================= -->
    <a-card size="small">
      <a-row :gutter="12">

        <!-- KEYWORD -->
        <a-col :span="4">
          <a-input
            v-model:value="keyword"
            placeholder="Tên / SKU"
            allow-clear
          />
        </a-col>

        <!-- CATEGORY -->
        <a-col :span="6">
          <a-select
            v-model:value="selectedCategories"
            mode="multiple"
            allow-clear
            placeholder="Danh mục"
            style="width: 100%"
          >
            <a-select-option
              v-for="c in categories"
              :key="c.id"
              :value="c.id"
            >
              {{ c.name }}
            </a-select-option>
          </a-select>
        </a-col>

        <!-- SIZE -->
        <a-col :span="3">
          <a-input
            v-model:value="sizeFilter"
            placeholder="Size"
            allow-clear
          />
        </a-col>

        <!-- COLORWAY -->
        <a-col :span="3">
          <a-input
            v-model:value="colorway"
            placeholder="Colorway"
            allow-clear
          />
        </a-col>

        <!-- BRAND -->
        <a-col :span="3">
          <a-input
            v-model:value="brand"
            placeholder="Brand"
            allow-clear
          />
        </a-col>

        <!-- GENDER -->
        <a-col :span="3">
          <a-select
            v-model:value="gender"
            allow-clear
            placeholder="Gender"
            style="width: 100%"
          >
            <a-select-option value="MEN">Nam</a-select-option>
            <a-select-option value="WOMEN">Nữ</a-select-option>
            <a-select-option value="UNISEX">Unisex</a-select-option>
          </a-select>
        </a-col>

      </a-row>

      <a-space style="margin-top: 12px">
        <a-button type="primary" @click="onSearch">
          Tìm kiếm
        </a-button>

        <a-button @click="onReset">
          Reset
        </a-button>

        <a-button type="primary" @click="open = true">
          + Thêm sản phẩm
        </a-button>
      </a-space>
    </a-card>

    <!-- ================= TABLE ================= -->
    <a-table
      :data-source="products"
      :loading="loading"
      :pagination="false"
      row-key="id"
      bordered
    >

      <!-- IMAGE -->
      <a-table-column title="Ảnh" width="90">
        <template #default="{ record }">
          <img
            v-if="record.thumbnail"
            :src="`http://localhost:8080/${record.thumbnail}`"
            style="width:60px;height:60px;object-fit:cover;border-radius:6px"
          />
          <span v-else>—</span>
        </template>
      </a-table-column>

      <!-- PRODUCT -->
      <a-table-column title="Sản phẩm">
        <template #default="{ record }">
          <a
            style="font-weight:600;cursor:pointer"
            @click="goDetail(record.id)"
          >
            {{ record.name }}
          </a>
          <div style="font-size:12px;color:#999">
            SKU: {{ record.sku }}
          </div>
        </template>
      </a-table-column>

      <!-- CATEGORY -->
      <a-table-column title="Danh mục">
        <template #default="{ record }">
          <a-tag
            v-for="(name, index) in record.categoryNames"
            :key="index"
            color="blue"
          >
            {{ name }}
          </a-tag>
        </template>
      </a-table-column>

      <!-- STATUS -->
      <a-table-column title="Trạng thái">
        <template #default="{ record }">
          {{ renderStatus(record.status) }}
        </template>
      </a-table-column>

    </a-table>

    <!-- ================= PAGINATION ================= -->
    <a-pagination
      :current="page"
      :total="total"
      :pageSize="pageSize"
      @change="onPageChange"
      show-less-items
    />

    <!-- ================= MODAL ================= -->
    <a-modal
      v-model:open="open"
      title="Thêm sản phẩm"
      width="900px"
      destroyOnClose
      :footer="null"
    >
      <ProductForm
        :open="open"
        @update:open="open = false"
        @success="fetchProducts"
      />
    </a-modal>

  </a-space>
</template>
