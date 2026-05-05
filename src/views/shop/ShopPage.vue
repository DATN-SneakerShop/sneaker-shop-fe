<template>
  <div style="padding: 24px">
    <a-alert
      v-if="vipMessage"
      :message="vipMessage"
      type="success"
      show-icon
      style="margin-bottom: 20px"
    />

    <h2>Trang bán hàng</h2>

    <div style="margin-bottom: 20px;">
      <a-radio-group v-model:value="selectedCategory">
        <a-radio-button value="ALL">TẤT CẢ</a-radio-button>
        <a-radio-button value="N1">N1</a-radio-button>
      </a-radio-group>
    </div>

    <a-row :gutter="16">
      <a-col :span="6" v-for="p in filteredProducts" :key="p.id">
        <a-card :title="p.name" hoverable>
          <p><b>Giá:</b> {{ p.price }} đ</p>
          <a-button type="primary" block @click="addToCart(p)"> Thêm vào giỏ </a-button>
        </a-card>
      </a-col>
    </a-row>

    <div v-if="filteredProducts.length === 0" style="text-align: center; margin-top: 20px;">
      Không có sản phẩm nào thuộc danh mục này.
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue' // Nhớ import thêm computed
import { message } from 'ant-design-vue'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const products = ref([])
const vipMessage = ref('')

// 1. Thêm biến lưu tab đang chọn (Mặc định là xem tất cả)
const selectedCategory = ref('ALL')

// 2. Viết computed để tự động lọc sản phẩm
const filteredProducts = computed(() => {
  if (selectedCategory.value === 'ALL') {
    return products.value
  }

  // Lọc các sản phẩm có chứa danh mục tương ứng
  // LƯU Ý: Chữ 'category' ở đây phải khớp với tên trường dữ liệu mà API của bạn trả về!
  // Có thể API của bạn trả về p.type, p.tag, hoặc p.danhMuc... Hãy kiểm tra console.log(res.data) nhé.
  return products.value.filter(p => p.category === selectedCategory.value)
})

const loadProducts = async () => {
  try {
    const res = await api.get('/products')
    products.value = res.data
    // Gợi ý: Hãy mở dòng console.log bên dưới ra để xem cấu trúc thực sự của 1 sản phẩm
    // console.log('Dữ liệu 1 sản phẩm:', products.value[0])
  } catch {
    message.error('Không tải được danh sách sản phẩm')
  }
}

const checkVip = async () => {
  try {
    const email = authStore.currentUser?.email
    if (!email) return

    const res = await api.get('/khach-hang/vip-notification', {
      params: { email },
    })

    if (res.data) {
      vipMessage.value = res.data
    }
  } catch {
    console.log('VIP check error')
  }
}

const addToCart = (product) => {
  message.success(`Đã thêm ${product.name} vào giỏ hàng`)
}

onMounted(() => {
  loadProducts()
  checkVip()
})
</script>
