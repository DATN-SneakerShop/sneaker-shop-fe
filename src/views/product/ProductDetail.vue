<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getProductDetail, deleteProduct } from '@/api/product.api'
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()
const product = ref({})
const loading = ref(false)

/* ================= FORMAT DỮ LIỆU ================= */
const formatPrice = (price) => {
  if (!price) return "0 ₫"
  return new Intl.NumberFormat("vi-VN").format(price) + " ₫"
}

/* ================= FETCH DATA ================= */
const fetchDetail = async () => {
  try {
    loading.value = true
    const res = await getProductDetail(route.params.id) // Gọi API lấy chi tiết
    product.value = res.data
  } catch (e) {
    message.error('Không tải được thông tin sản phẩm!')
  } finally {
    loading.value = false
  }
}

onMounted(fetchDetail)

/* ================= ACTIONS ================= */
const handleDelete = async () => {
  try {
    await deleteProduct(product.value.id)
    message.success('Đã xóa sản phẩm thành công')
    router.push('/products')
  } catch {
    message.error('Xóa thất bại!')
  }
}
</script>

<template>
  <div class="detail-page" v-if="product.id">
    <div class="detail-header">
      <div class="left">
        <a-button @click="router.push('/products')">
          <template #icon><arrow-left-outlined /></template> Quay lại
        </a-button>
        <div class="title-info">
          <h1>{{ product.name }}</h1>
          <a-tag color="blue">SKU: {{ product.sku }}</a-tag>
          <a-tag :color="product.status === 'Ngừng bán' ? 'red' : 'green'">{{ product.status }}</a-tag>
        </div>
      </div>
      <div class="right">
        <a-space>
          <a-button type="primary"><edit-outlined /> Chỉnh sửa</a-button>
          <a-popconfirm title="Xóa sản phẩm này?" @confirm="handleDelete">
            <a-button danger><delete-outlined /> Xóa</a-button>
          </a-popconfirm>
        </a-space>
      </div>
    </div>

    <a-row :gutter="24" style="margin-top: 24px">
      <a-col :span="14">
        <a-card title="Hình ảnh đại diện" :bordered="false" class="custom-card">
          <div class="main-image-wrapper">
            <img :src="product.thumbnail ? `http://localhost:8080/${product.thumbnail}` : '/no-image.png'"
              class="main-img" />
          </div>
        </a-card>

        <a-card title="Thư viện ảnh" :bordered="false" style="margin-top: 24px" class="custom-card">
          <div class="gallery">
            <div v-for="(img, index) in product.images" :key="index" class="gallery-item">
              <img :src="`http://localhost:8080/${img.url}`" />
            </div>
            <div v-if="!product.images?.length" style="color: #999">Chưa có ảnh thư viện.</div>
          </div>
        </a-card>
      </a-col>

      <a-col :span="10">
        <a-card title="Thông tin sản phẩm" :bordered="false" class="custom-card info-card">
          <a-descriptions :column="1" bordered size="small">
            <a-descriptions-item label="Tên sản phẩm">{{ product.name }}</a-descriptions-item>
            <a-descriptions-item label="SKU">{{ product.sku }}</a-descriptions-item>
            <a-descriptions-item label="Thương hiệu">{{ product.brand || '-' }}</a-descriptions-item>
            <a-descriptions-item label="Đối tượng">{{ product.gender || '-' }}</a-descriptions-item>
            <a-descriptions-item label="Năm phát hành">{{ product.releaseYear || '-' }}</a-descriptions-item>
            <a-descriptions-item label="Chất liệu">{{ product.material || '-' }}</a-descriptions-item>
            <a-descriptions-item label="Loại đế">{{ product.sole || '-' }}</a-descriptions-item>
            <a-descriptions-item label="Mô tả">{{ product.description || 'Chưa có mô tả.' }}</a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
    </a-row>

    <a-card title="Danh sách biến thể" :bordered="false" style="margin-top: 24px" class="custom-card">
      <a-table :dataSource="product.variants" rowKey="id" :pagination="false" bordered>
        <a-table-column title="Ảnh" width="100px">
          <template #default="{ record }">
            <img
              :src="record.imageUrl ? `http://localhost:8080/${record.imageUrl}` : 'http://localhost:8080/' + product.thumbnail"
              style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px" />
          </template>
        </a-table-column>
        <a-table-column title="Size" dataIndex="size" align="center" />
        <a-table-column title="Màu sắc" dataIndex="colorway" />

        <a-table-column title="Giá bán" align="right">
          <template #default="{ record }">
            <span style="color: #f5222d; font-weight: bold">{{ formatPrice(record.price) }}</span>
          </template>
        </a-table-column>

        <a-table-column title="Tồn kho" align="center">
          <template #default="{ record }">
            <a-tag :color="record.stock > 10 ? 'green' : 'red'">{{ record.stock }}</a-tag>
          </template>
        </a-table-column>
      </a-table>
    </a-card>
  </div>
  <div v-else style="padding: 100px; text-align: center">
    <a-spin size="large" />
  </div>
</template>

<style scoped>
.detail-page {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.detail-header .left {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.title-info h1 {
  margin: 8px 0 4px 0;
  font-size: 24px;
  font-weight: bold;
}

.custom-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.main-image-wrapper {
  width: 100%;
  text-align: center;
  background: #fafafa;
  border-radius: 8px;
}

.main-img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
}

.gallery {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.gallery-item img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #eee;
}

.info-card {
  height: 100%;
}
</style>
