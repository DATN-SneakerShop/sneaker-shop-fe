<template>
  <div class="promotion-form-container">
    <a-card :bordered="false" class="main-card">
      <template #title>
        <h2 class="form-title">{{ isEdit ? 'Cập nhật đợt giảm giá' : 'Tạo đợt giảm giá mới' }}</h2>
      </template>

      <a-form layout="vertical" class="top-form">
        <a-row :gutter="24">
          <a-col :xs="24" :md="10">
            <a-form-item label="Tên đợt giảm giá" required>
              <a-input size="large" v-model:value="form.name" placeholder="Ví dụ: Siêu Sale Mùa Hè..." />
              <div v-if="nameError" class="error-text">
                <i class="fas fa-exclamation-circle"></i> {{ nameError }}
              </div>
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="4" v-if="isEdit">
            <a-form-item label="Mã KM">
              <a-input size="large" v-model:value="form.code" readonly class="readonly-input" />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="6">
            <a-form-item label="Thời gian áp dụng" required>
              <a-range-picker
                size="large"
                v-model:value="dateRange"
                show-time
                style="width:100%"
                :disabled-date="disabledDate"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="4">
            <a-form-item label="Ưu tiên (Priority)">
              <a-input-number
                size="large"
                v-model:value="form.priority"
                :min="0"
                :max="10"
                style="width:100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>

      <a-divider class="custom-divider" />

      <div class="section-header">
        <h3><i class="fas fa-box-open"></i> Thiết lập sản phẩm áp dụng</h3>
        <a-input
          v-model:value="keyword"
          placeholder="🔍 Tìm kiếm theo tên sản phẩm..."
          allow-clear
          class="search-input"
        />
      </div>

      <a-table
        :columns="columns"
        :data-source="filteredProducts"
        row-key="id"
        :expandedRowKeys="expandedRows"
        @expand="onExpand"
        :pagination="{ pageSize: 5, showSizeChanger: false }"
        class="custom-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'image'">
            <div class="thumb-wrapper">
              <img :src="getImageUrl(record.thumbnail)" />
            </div>
          </template>

          <template v-if="column.key === 'product'">
            <div class="product-info">
              <span class="product-name">{{ record.name }}</span>
            </div>
          </template>

          <template v-if="column.key === 'brand'">
            <a-tag color="blue">{{ record.brand }}</a-tag>
          </template>

          <template v-if="column.key === 'variants'">
            <div class="variant-count">
              <span class="selected">{{ selectedCount(record) }}</span>
              <span class="separator">/</span>
              <span class="total">{{ record.loaded ? record.variants.length : record.variantCount }}</span>
            </div>
          </template>
        </template>

        <template #expandedRowRender="{ record }">
          <div class="variant-box">
            <a-table
              :data-source="record.variants"
              row-key="variantId"
              size="middle"
              :pagination="false"
              :loading="record.loading"
              class="inner-table"
            >
              <a-table-column title="Chọn" width="70px" align="center">
                <template #default="{ record: variant }">
                  <a-checkbox
                    :checked="selectedVariants.includes(Number(variant.variantId))"
                    :disabled="variant.stock === 0"
                    @change="toggleVariant(Number(variant.variantId))"
                  />
                </template>
              </a-table-column>

              <a-table-column title="Mã SKU" dataIndex="sku">
                <template #default="{ text }">
                  <span class="sku-text">{{ text }}</span>
                </template>
              </a-table-column>

              <a-table-column title="Màu sắc" dataIndex="colorway" />

              <a-table-column title="Size" dataIndex="size">
                <template #default="{ text }">
                  <a-tag>{{ text }}</a-tag>
                </template>
              </a-table-column>

              <a-table-column title="Thiết lập giảm">
                <template #default="{ record: variant }">
                  <div v-if="selectedVariants.includes(Number(variant.variantId))" class="discount-setup">
                    <a-select v-model:value="variantDiscounts[variant.variantId].type" class="discount-type-select">
                      <a-select-option value="PERCENT">%</a-select-option>
                      <a-select-option value="AMOUNT">VNĐ</a-select-option>
                    </a-select>
                    <a-input-number
                      v-model:value="variantDiscounts[variant.variantId].value"
                      :min="0"
                      :max="variantDiscounts[variant.variantId].type === 'PERCENT' ? 100 : undefined"
                      class="discount-value-input"
                      placeholder="Mức giảm"
                    />
                  </div>
                  <span v-else class="unselected-text">Vui lòng chọn</span>
                </template>
              </a-table-column>

              <a-table-column title="Giá dự kiến" align="right">
                <template #default="{ record: variant }">
                  <div class="price-preview">
                    <div class="old-price">{{ formatPrice(getSafePrice(variant)) }}</div>
                    <div class="new-price">
                      {{ formatPrice(calcDiscountPrice(getSafePrice(variant), variant.variantId)) }}
                    </div>
                  </div>
                </template>
              </a-table-column>

              <a-table-column title="Kho" align="center">
                <template #default="{ record: variant }">
                  <span v-if="variant.stock > 0" class="stock-badge ok">{{ variant.stock }}</span>
                  <span v-else class="stock-badge out">Hết</span>
                </template>
              </a-table-column>

            </a-table>
          </div>
        </template>
      </a-table>

      <div class="form-footer">
        <a-button size="large" @click="router.back()">Hủy bỏ</a-button>
        <a-button size="large" type="primary" class="btn-submit" @click="submit">
          <i class="fas fa-save" style="margin-right: 8px;"></i> {{ isEdit ? 'Lưu cập nhật' : 'Tạo đợt giảm giá' }}
        </a-button>
      </div>

    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { getPromotionProducts, getVariantsByProduct } from '@/api/product.api'
import { createPromotion, updatePromotion, getPromotionDetail } from '@/api/promotion'

const route = useRoute()
const router = useRouter()

const promotionId = route.query.id
const isEdit = !!promotionId

const form = reactive({
  name: '',
  code: '',
  priority: 0
})

let timer = null
watch(
  () => form.name,
  (val) => {
    if (!val || val.trim() === '') {
      nameError.value = ''
      return
    }
    clearTimeout(timer)
    timer = setTimeout(() => { checkName() }, 500)
  }
)

const dateRange = ref([])
const products = ref([])
const keyword = ref('')
const expandedRows = ref([])
const selectedVariants = ref([])
const variantDiscounts = ref({})
const nameError = ref('')

const IMAGE_BASE_URL = "http://localhost:8080/"
const getImageUrl = (path) => {
  if (!path) return '/no-image.png'
  return path.startsWith('http') ? path : IMAGE_BASE_URL + path
}

// Hàm lấy giá an toàn (để phòng trường hợp DTO trả về salePrice hoặc price)
const getSafePrice = (variant) => {
  return Number(variant.price || variant.salePrice || variant.retailPrice || 0)
}

const checkName = async () => {
  if (!form.name || form.name.trim() === '') return
  try {
    const url = isEdit
      ? `http://localhost:8080/api/admin/products/check-name?name=${form.name}&id=${promotionId}`
      : `http://localhost:8080/api/admin/products/check-name?name=${form.name}`
    const res = await fetch(url)
    const exists = await res.json()
    nameError.value = exists ? 'Tên đợt giảm giá đã tồn tại!' : ''
  } catch (e) {
    console.log(e)
  }
}

const columns = [
  { title: 'Ảnh', key: 'image', width: 120, align: 'center' },
  { title: 'Tên Sản phẩm', key: 'product' },
  { title: 'Thương hiệu', key: 'brand', width: 150 },
  { title: 'Đã chọn', key: 'variants', width: 120, align: 'center' }
]

const loadVariantsForProduct = async (product) => {
  if (product.loaded) return
  product.loading = true
  try {
    const variants = await getVariantsByProduct(product.id)
    product.variants = variants.map(v => ({
      ...v,
      variantId: Number(v.variantId ?? v.id)
    }))
    product.loaded = true
  } catch {
    message.error('Không load được biến thể')
  }
  product.loading = false
}

const loadDetail = async () => {
  const res = await getPromotionDetail(promotionId)
  form.name = res.name
  form.code = res.code
  form.priority = res.priority ?? 0
  dateRange.value = [dayjs(res.startTime), dayjs(res.endTime)]

  res.variants.forEach(v => {
    const vId = Number(v.variantId ?? v.id)
    selectedVariants.value.push(vId)
    variantDiscounts.value[vId] = {
      type: v.discountType || 'PERCENT',
      value: v.discountValue || 0
    }
  })
}

onMounted(async () => {
  try {
    const res = await getPromotionProducts()

    // Tự động bóc tách dữ liệu: Nếu axios bọc trong 'data' thì lấy data, không thì lấy luôn mảng
    const productList = res.data || res || []

    products.value = productList.map(p => ({
      ...p,
      variants: [],
      loaded: false,
      loading: false
    }))

    if (isEdit) {
      await loadDetail()
      await Promise.all(products.value.map(loadVariantsForProduct))
      expandedRows.value = products.value.map(p => p.id)
    }
  } catch (error) {
    console.error("Lỗi khi load sản phẩm: ", error)
  }
})

const filteredProducts = computed(() =>
  products.value.filter(p =>
    p.name.toLowerCase().includes(keyword.value.toLowerCase())
  )
)

const onExpand = async (expanded, record) => {
  if (expanded) {
    expandedRows.value.push(record.id)
    await loadVariantsForProduct(record)
  } else {
    expandedRows.value = expandedRows.value.filter(id => id !== record.id)
  }
}

const toggleVariant = id => {
  id = Number(id)
  if (selectedVariants.value.includes(id)) {
    selectedVariants.value = selectedVariants.value.filter(x => x !== id)
    delete variantDiscounts.value[id]
  } else {
    selectedVariants.value.push(id)
    variantDiscounts.value[id] = { type: 'PERCENT', value: 0 }
  }
}

const selectedCount = product =>
  product.variants.filter(v => selectedVariants.value.includes(v.variantId)).length

const calcDiscountPrice = (price, variantId) => {
  if (!selectedVariants.value.includes(variantId)) return price
  const conf = variantDiscounts.value[variantId]
  if (!conf || !conf.value) return price

  if (conf.type === 'PERCENT') {
    return Math.max(0, Math.floor(price * (100 - conf.value) / 100))
  } else {
    return Math.max(0, price - conf.value)
  }
}

const formatPrice = price =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

const disabledDate = current => current && current < dayjs().startOf('day')

const submit = async () => {
  if (!form.name || !dateRange.value.length) return message.error('Vui lòng điền tên và thời gian áp dụng!')
  if (!selectedVariants.value.length) return message.error('Phải chọn ít nhất 1 biến thể để giảm giá!')

  for (let id of selectedVariants.value) {
    if (!variantDiscounts.value[id] || variantDiscounts.value[id].value <= 0) {
      return message.error('Vui lòng nhập giá trị giảm (>0) cho các sản phẩm đã chọn!')
    }
  }

  const [start, end] = dateRange.value

  const payload = {
    name: form.name.trim(),
    priority: Number(form.priority ?? 0),
    startTime: start.format('YYYY-MM-DDTHH:mm:ss'),
    endTime: end.format('YYYY-MM-DDTHH:mm:ss'),
    details: selectedVariants.value.map(id => ({
      variantId: id,
      discountType: variantDiscounts.value[id].type,
      discountValue: Number(variantDiscounts.value[id].value)
    }))
  }

  try {
    isEdit ? await updatePromotion(promotionId, payload) : await createPromotion(payload)
    message.success(isEdit ? 'Cập nhật thành công!' : 'Tạo khuyến mãi thành công!')
    router.push('/promotions')
  } catch {
    message.error('Có lỗi xảy ra khi lưu. Vui lòng thử lại.')
  }
}
</script>

<style scoped>
/* Tổng quan Card */
.promotion-form-container {
  padding: 24px;
  background-color: #f0f2f5;
  min-height: 100vh;
}
.main-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.form-title {
  margin: 0;
  font-weight: 700;
  color: #1f1f1f;
  font-size: 20px;
}

/* Form Top */
.top-form {
  margin-top: 10px;
}
.readonly-input {
  background-color: #f5f5f5;
  color: #888;
  font-weight: 500;
}
.error-text {
  color: #ff4d4f;
  font-size: 13px;
  margin-top: 6px;
  font-weight: 500;
}
.custom-divider {
  margin: 32px 0;
}

/* Phần bảng sản phẩm */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}
.search-input {
  width: 320px;
  border-radius: 6px;
}
.custom-table :deep(.ant-table-thead > tr > th) {
  background-color: #fafafa;
  font-weight: 600;
  color: #595959;
}

/* Ảnh thu nhỏ */
.thumb-wrapper {
  width: 90px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  margin: 0 auto;
}
.thumb-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Thông tin sản phẩm */
.product-name {
  font-weight: 600;
  font-size: 15px;
  color: #262626;
}
.variant-count {
  font-weight: 600;
  background: #f0f5ff;
  border: 1px solid #adc6ff;
  padding: 4px 12px;
  border-radius: 20px;
  display: inline-block;
}
.variant-count .selected { color: #1677ff; }
.variant-count .separator { margin: 0 4px; color: #888; }
.variant-count .total { color: #595959; }

/* Bảng Biến Thể (Inner Table) */
.variant-box {
  background: #f9fbfd;
  padding: 16px 24px;
  border-radius: 8px;
  border: 1px dashed #d9d9d9;
  margin: 8px 0;
}
.inner-table :deep(.ant-table) {
  background: transparent;
}
.inner-table :deep(.ant-table-thead > tr > th) {
  background-color: #eff3f8;
  font-size: 13px;
}
.sku-text {
  font-family: monospace;
  color: #595959;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
}

/* Ô thiết lập giảm giá */
.discount-setup {
  display: flex;
  gap: 8px;
  align-items: center;
}
.discount-type-select {
  width: 70px;
}
.discount-value-input {
  width: 130px;
}
.unselected-text {
  color: #bfbfbf;
  font-style: italic;
  font-size: 13px;
}

/* Hiển thị giá */
.price-preview {
  text-align: right;
  line-height: 1.4;
}
.old-price {
  text-decoration: line-through;
  color: #a3a3a3;
  font-size: 13px;
}
.new-price {
  color: #f5222d;
  font-weight: 700;
  font-size: 15px;
}

/* Kho (Badge) */
.stock-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}
.stock-badge.ok {
  background-color: #f6ffed;
  color: #389e0d;
  border: 1px solid #b7eb8f;
}
.stock-badge.out {
  background-color: #fff1f0;
  color: #cf1322;
  border: 1px solid #ffa39e;
}

/* Nút Submit */
.form-footer {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}
.btn-submit {
  min-width: 160px;
  font-weight: 600;
  background-color: #1677ff;
}
.btn-submit:hover {
  background-color: #4096ff;
}
.variant-thumb {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
}
.variant-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
