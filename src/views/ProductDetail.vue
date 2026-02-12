<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { getProductDetail, deleteProduct } from '@/api/product.api'
import ProductForm from '@/components/product/ProductForm.vue'

/* ================= ROUTER ================= */
const route = useRoute()
const router = useRouter()
const productId = route.params.id
/* ================= STATE ================= */
const loading = ref(false)
const product = ref(null)
const isEditing = ref(false)
const activeImage = ref(null)
const renderGender = (gender) => {
  const map = {
    MEN: 'Nam',
    WOMEN: 'Nữ',
    UNISEX: 'Unisex'
  }
  return map[gender] || gender || '-'
}
/* ================= FETCH ================= */
const fetchProduct = async () => {
  try {
    loading.value = true
    const res = await getProductDetail(productId)
    product.value = res.data

    // set ảnh đại diện mặc định
    activeImage.value = res.data.images?.find((i) => i.thumbnail) || res.data.images?.[0] || null
  } catch {
    message.error('Không tải được chi tiết sản phẩm')
  } finally {
    loading.value = false
  }
}

onMounted(fetchProduct)

/* ================= COMPUTED ================= */
const thumbnail = computed(() => product.value?.images?.find((i) => i.thumbnail))

const gallery = computed(() => product.value?.images?.filter((i) => !i.thumbnail) || [])

/* ================= ACTION ================= */
const back = () => router.back()

const goEdit = () => {
  isEditing.value = true
}

const onDelete = () => {
  Modal.confirm({
    title: 'Xác nhận xóa sản phẩm',
    content: 'Bạn có chắc chắn muốn xóa sản phẩm này?',
    okType: 'danger',
    async onOk() {
      try {
        await deleteProduct(productId)
        message.success('Đã xóa sản phẩm')
        router.push('/products')
      } catch {
        message.error('Xóa sản phẩm thất bại')
      }
    },
  })
}
const onEditSuccess = async () => {
  isEditing.value = false
  await fetchProduct()
  message.success('Cập nhật sản phẩm thành công')
}
</script>

<template>
  <a-spin :spinning="loading">
    <div v-if="product" class="product-detail">
      <!-- ================= HEADER ================= -->
      <div class="header">
        <a-button @click="back">← Quay lại</a-button>

        <div class="title">
          <h2>{{ product.name }}</h2>
          <span class="sku">SKU: {{ product.sku }}</span>
        </div>

        <a-space>
          <a-tag :color="product.status === 'IN_STOCK' ? 'green' : 'red'">
            {{ product.status }}
          </a-tag>

          <a-button type="primary" @click="goEdit"> Chỉnh sửa </a-button>

          <a-button danger @click="onDelete"> Xóa </a-button>
        </a-space>
      </div>

      <a-divider />

      <a-row :gutter="24">
        <!-- ================= LEFT ================= -->
        <a-col :span="14">
          <a-card title="Hình đại diện" bordered>
            <img
              v-if="activeImage"
              :src="`http://localhost:8080/${activeImage.url}`"
              class="thumbnail"
            />
          </a-card>

          <a-card title="Gallery" bordered style="margin-top: 16px">
            <div class="gallery">
              <img
                v-for="(img, i) in gallery"
                :key="i"
                :src="`http://localhost:8080/${img.url}`"
                class="gallery-img"
                :class="{ active: activeImage?.id === img.id }"
                @click="activeImage = img"
              />
            </div>
          </a-card>
        </a-col>

        <!-- ================= RIGHT ================= -->
        <a-col :span="10">
          <a-card title="Thông tin sản phẩm" bordered>
            <a-descriptions column="1" size="small">
              <a-descriptions-item label="Tên">
                {{ product.name }}
              </a-descriptions-item>
              <a-descriptions-item label="SKU">
                {{ product.sku }}
              </a-descriptions-item>
              <a-descriptions-item label="Thương Hiệu">
                {{ product.brand || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Giới tính">
                {{ renderGender(product.gender) }}
              </a-descriptions-item>
              <a-descriptions-item label="Chất Liệu">
                {{ product.model || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Phiên Bản">
                {{ product.releaseYear || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Mô tả">
                {{ product.description || '-' }}
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
        </a-col>
      </a-row>

      <!-- ================= VARIANTS ================= -->
      <a-divider />

      <a-card title="Variants" bordered>
        <a-table :dataSource="product.variants" rowKey="id" bordered :pagination="false">
          <a-table-column title="Size" dataIndex="size" />
          <a-table-column title="Size type" dataIndex="sizeType" />
          <a-table-column title="Màu Sắc" dataIndex="colorway" />
          <a-table-column title="Tồn kho">
            <template #default="{ record }">
              <a-tag :color="record.stock > 0 ? 'green' : 'red'">
                {{ record.stock }}
              </a-tag>
            </template>
          </a-table-column>
        </a-table>
      </a-card>
    </div>
    <!-- ================= EDIT MODAL ================= -->
    <a-modal
      v-model:open="isEditing"
      title="Chỉnh sửa sản phẩm"
      width="900px"
      :footer="null"
      destroyOnClose
    >
      <ProductForm :edit="true" :product="product" @success="onEditSuccess" />
    </a-modal>
  </a-spin>
</template>

<style scoped>
.product-detail {
  background: #fff;
  padding: 16px;
}
.header {
  display: flex;
  align-items: center;
  gap: 16px;
}
.title {
  flex: 1;
}
.sku {
  font-size: 12px;
  color: #888;
}
.thumbnail {
  width: 100%;
  max-height: 320px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #eee;
}
.gallery {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.gallery img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #eee;
}
.gallery-img {
  cursor: pointer;
  transition: all 0.2s ease;
}

.gallery-img:hover {
  transform: scale(1.05);
}

.gallery-img.active {
  border: 2px solid #1890ff;
}
</style>
