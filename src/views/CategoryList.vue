<script setup>
import { ref, onMounted } from 'vue'
import CategoryForm from '@/components/product/CategoryForm.vue'
import { getCategories, getProductsByCategory } from '@/api/category.api'
import { deleteCategory } from '@/api/category.api'
import { message, Modal } from 'ant-design-vue'

/* ================= STATE ================= */
const categories = ref([])
const products = ref([])
const selectedCategoryId = ref(null)
const open = ref(false)
const loadingProducts = ref(false)
const editingCategory = ref(null)

/* ================= API ================= */
const fetchCategories = async () => {
  const res = await getCategories()
  categories.value = res.data
}
const handleDelete = (id) => {
  Modal.confirm({
    title: 'Bạn có chắc muốn xóa?',
    onOk: async () => {
      await deleteCategory(id)
      message.success('Xóa thành công')
      fetchCategories()
    },
  })
}
const fetchProductsByCategory = async (id) => {
  try {
    loadingProducts.value = true
    selectedCategoryId.value = id

    const res = await getProductsByCategory(id, {
      page: 0,
      size: 20,
    })

    products.value = res.data.content
  } catch (e) {
    console.error('Lỗi load sản phẩm', e)
  } finally {
    loadingProducts.value = false
  }
}

/* ================= LIFE ================= */
onMounted(fetchCategories)
</script>
<template>
  <a-space direction="vertical" style="width: 100%">
    <a-button
      type="primary"
      @click="
        () => {
          editingCategory = null
          open = true
        }
      "
    >
      + Thêm danh mục
    </a-button>

<!-- ================= CATEGORY TABLE ================= -->
<a-table :dataSource="categories" rowKey="id" bordered>

  <!-- ẢNH -->
  <a-table-column title="Ảnh" width="100">
    <template #default="{ record }">
      <img
        v-if="record.thumbnail"
        :src="`http://localhost:8080/${record.thumbnail}`"
        style="width:60px;height:60px;object-fit:cover;border-radius:6px"
      />
      <span v-else>—</span>
    </template>
  </a-table-column>

  <!-- TÊN DANH MỤC -->
  <a-table-column title="Tên danh mục">
    <template #default="{ record }">
      <a
        style="cursor:pointer;font-weight:600"
        @click="fetchProductsByCategory(record.id)"
      >
        {{ record.name }}
      </a>
    </template>
  </a-table-column>

  <!-- MÔ TẢ -->
  <a-table-column title="Mô tả" dataIndex="description" />

  <!-- HÀNH ĐỘNG -->
  <a-table-column title="Hành động" width="180">
    <template #default="{ record }">
      <a-space>
        <a-button
          size="small"
          type="primary"
          @click="() => {
            editingCategory = record
            open = true
          }"
        >
          Sửa
        </a-button>

        <a-button
          size="small"
          danger
          @click="handleDelete(record.id)"
        >
          Xóa
        </a-button>
      </a-space>
    </template>
  </a-table-column>
</a-table>


    <!-- ================= PRODUCT TABLE ================= -->
    <a-card v-if="selectedCategoryId" title="Danh sách sản phẩm" style="margin-top: 20px">
      <a-table :dataSource="products" :loading="loadingProducts" rowKey="id" bordered>
        <!-- ẢNH -->
        <a-table-column title="Ảnh" width="100">
          <template #default="{ record }">
            <img
              v-if="record.thumbnail"
              :src="`http://localhost:8080/${record.thumbnail}`"
              style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px"
            />
            <span v-else>—</span>
          </template>
        </a-table-column>

        <!-- TÊN -->
        <a-table-column title="Tên sản phẩm" dataIndex="name" />

        <!-- SKU -->
        <a-table-column title="SKU" dataIndex="sku" />

        <!-- TRẠNG THÁI -->
        <a-table-column title="Trạng thái">
          <template #default="{ record }">
            <a-tag
              :color="
                record.status === 'Còn Hàng'
                  ? 'green'
                  : record.status === 'Hết Hàng'
                    ? 'red'
                    : 'orange'
              "
            >
              {{ record.status }}
            </a-tag>
          </template>
        </a-table-column>
      </a-table>
    </a-card>

    <CategoryForm
      v-model:open="open"
      :category="editingCategory"
      @success="
        () => {
          editingCategory = null
          fetchCategories()
        }
      "
    />
  </a-space>
</template>
