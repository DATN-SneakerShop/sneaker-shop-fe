<script setup>
import { ref, computed, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { getErrorMessage } from '@/utils/error'
import {
  SyncOutlined,
  PlusOutlined,
  DeleteOutlined,
  PictureOutlined,
  EditOutlined,
  AppstoreOutlined,
  ClearOutlined
} from '@ant-design/icons-vue'
import {
  searchProductsAdvanced,
  updateProduct,
  getProductDetail,
  getSizes,
  getColors
} from '@/api/product.api'
import ProductForm from '@/components/product/ProductForm.vue'

const products = ref([])
const loading = ref(false)

const colorOptions = ref([])
const sizeOptions = ref([])

const page = ref(1)
const pageSize = 10
const total = ref(0)
const keyword = ref('')

const open = ref(false)
const editMode = ref(false)
const productToEdit = ref(null)

const openVariantModal = ref(false)
const currentProduct = ref(null)

const variantsList = ref([])
const originalVariants = ref([])

const matrixColors = ref([])
const matrixSizes = ref([])
const matrixPrice = ref(0)
const matrixStock = ref(0)

const selectedIdx = ref(null)
const detailForm = ref({
  colorway: '',
  size: '',
  sku: '',
  price: 0,
  stock: 0,
  imageUrl: ''
})

const quickFilter = ref({
  color: undefined,
  size: undefined,
  keyword: ''
})

const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await searchProductsAdvanced({
      page: page.value - 1,
      size: pageSize,
      keyword: keyword.value?.trim() || undefined
    })
    products.value = res?.data?.content || []
    total.value = res?.data?.totalElements || 0
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchProducts()
  const [resCol, resSize] = await Promise.all([getColors(), getSizes()])
  colorOptions.value = resCol.data || []
  sizeOptions.value = resSize.data || []
})

const getImageSrc = (path) => {
  if (!path) return 'https://placehold.co/80x80?text=No+Image'
  if (path.startsWith('http')) return path
  const cleanPath = path.startsWith('/') ? path.substring(1) : path
  return `http://localhost:8080/${cleanPath}`
}

const variantKey = (v) => `${v.colorway || ''}|||${String(v.size || '')}`

const sortedVariants = computed(() => {
  return [...variantsList.value].sort((a, b) => {
    const colorA = (a.colorway || '').localeCompare(b.colorway || '')
    if (colorA !== 0) return colorA
    return String(a.size || '').localeCompare(String(b.size || ''))
  })
})

const filteredVariants = computed(() => {
  return sortedVariants.value.filter(v => {
    const matchColor = !quickFilter.value.color || v.colorway === quickFilter.value.color
    const matchSize = !quickFilter.value.size || String(v.size) === String(quickFilter.value.size)
    const kw = quickFilter.value.keyword?.trim()?.toLowerCase()
    const matchKeyword = !kw ||
      (v.colorway || '').toLowerCase().includes(kw) ||
      String(v.size || '').toLowerCase().includes(kw) ||
      (v.sku || '').toLowerCase().includes(kw)

    return matchColor && matchSize && matchKeyword
  })
})

const totalStock = computed(() =>
  variantsList.value.reduce((sum, v) => sum + Number(v.stock || 0), 0)
)

const totalReservedStock = computed(() =>
  variantsList.value.reduce((sum, v) => sum + Number(v.reservedQuantity || 0), 0)
)

const totalAvailableStock = computed(() =>
  variantsList.value.reduce((sum, v) => sum + Number(v.availableStock ?? Math.max(0, Number(v.stock || 0) - Number(v.reservedQuantity || 0))), 0)
)

const totalVariantCount = computed(() => variantsList.value.length)

const duplicateVariantKeys = computed(() => {
  const map = new Map()
  variantsList.value.forEach(v => {
    const key = variantKey(v)
    map.set(key, (map.get(key) || 0) + 1)
  })
  return new Set([...map.entries()].filter(([_, count]) => count > 1).map(([key]) => key))
})

const hasDuplicateVariants = computed(() => duplicateVariantKeys.value.size > 0)

const resetVariantStates = () => {
  matrixColors.value = []
  matrixSizes.value = []
  matrixPrice.value = currentProduct.value?.price || 0
  matrixStock.value = 0

  selectedIdx.value = null
  detailForm.value = {
    colorway: '',
    size: '',
    sku: '',
    price: 0,
    stock: 0,
    reservedQuantity: 0,
    availableStock: 0,
    imageUrl: ''
  }

  quickFilter.value = {
    color: undefined,
    size: undefined,
    keyword: ''
  }
}

const handleOpenVariantMatrix = async (record) => {
  const res = await getProductDetail(record.id)
  currentProduct.value = res.data

  originalVariants.value = JSON.parse(JSON.stringify(res.data.variants || []))
  variantsList.value = (res.data.variants || []).map(v => ({
    id: v.id || null,
    colorway: v.colorway || '',
    size: v.size || '',
    stock: Number(v.stock || 0),
    reservedQuantity: Number(v.reservedQuantity || 0),
    availableStock: Number(v.availableStock ?? Math.max(0, Number(v.stock || 0) - Number(v.reservedQuantity || 0))),
    price: Number(v.price ?? v.salePrice ?? res.data.price ?? 0),
    imageUrl: v.imageUrl || '',
    sku: v.sku || ''
  }))

  resetVariantStates()
  openVariantModal.value = true
}

const generateMatrix = () => {
  if (!matrixColors.value.length || !matrixSizes.value.length) {
    return message.warning('Vui lòng chọn ít nhất 1 màu và 1 kích cỡ.')
  }

  const validKeys = new Set()
  matrixColors.value.forEach(c => {
    matrixSizes.value.forEach(s => {
      validKeys.add(`${c}|||${s}`)
    })
  })

  let createdCount = 0
  let updatedCount = 0

  validKeys.forEach(key => {
    const [c, s] = key.split('|||')

    const existedIndex = variantsList.value.findIndex(
      v => v.colorway === c && String(v.size) === String(s)
    )

    if (existedIndex !== -1) {
      variantsList.value[existedIndex] = {
        ...variantsList.value[existedIndex],
        price: Number(matrixPrice.value || 0),
        stock: Number(matrixStock.value || 0),
        reservedQuantity: 0,
        availableStock: Number(matrixStock.value || 0)
      }
      updatedCount++
    } else {
      const old = originalVariants.value.find(
        ov => ov.colorway === c && String(ov.size) === String(s)
      )

      variantsList.value.push({
        id: old ? old.id : null,
        colorway: c,
        size: s,
        stock: Number(matrixStock.value || 0),
        reservedQuantity: Number(old?.reservedQuantity || 0),
        availableStock: Number(old?.availableStock ?? Math.max(0, Number(matrixStock.value || 0) - Number(old?.reservedQuantity || 0))),
        price: Number(matrixPrice.value || 0),
        imageUrl: old ? old.imageUrl || '' : '',
        sku: old ? old.sku || '' : ''
      })
      createdCount++
    }
  })

  variantsList.value = [...variantsList.value]

  if (selectedIdx.value !== null && variantsList.value[selectedIdx.value]) {
    detailForm.value = { ...variantsList.value[selectedIdx.value] }
  }

  message.success(
    `Đã tạo ${createdCount} biến thể mới và cập nhật ${updatedCount} biến thể theo Giá/Tồn mặc định.`
  )
}

const addSingleVariant = () => {
  const newVariant = {
    id: null,
    colorway: '',
    size: '',
    stock: Number(matrixStock.value || 0),
    reservedQuantity: 0,
    availableStock: Number(matrixStock.value || 0),
    price: Number(matrixPrice.value || currentProduct.value?.price || 0),
    imageUrl: '',
    sku: ''
  }
  variantsList.value.unshift(newVariant)
  selectVariantByRef(newVariant)
  message.success('Đã thêm 1 biến thể mới.')
}

const selectVariantByRef = (variant) => {
  const index = variantsList.value.findIndex(v => v === variant)
  if (index === -1) return
  selectedIdx.value = index
  detailForm.value = { ...variantsList.value[index] }
}

const selectVariant = (index) => {
  selectedIdx.value = index
  detailForm.value = { ...variantsList.value[index] }
}

const syncDetailToVariant = () => {
  if (selectedIdx.value === null || !variantsList.value[selectedIdx.value]) return
  variantsList.value[selectedIdx.value] = {
    ...variantsList.value[selectedIdx.value],
    ...detailForm.value,
    stock: Number(detailForm.value.stock || 0),
    reservedQuantity: Number(detailForm.value.reservedQuantity || 0),
    availableStock: Math.max(0, Number(detailForm.value.stock || 0) - Number(detailForm.value.reservedQuantity || 0)),
    price: Number(detailForm.value.price || 0)
  }
}

const updateVariantField = (variant, field, value) => {
  variant[field] = field === 'stock' || field === 'price' ? Number(value || 0) : value
  if (field === 'stock') {
    variant.availableStock = Math.max(0, Number(variant.stock || 0) - Number(variant.reservedQuantity || 0))
  }
  variantsList.value = [...variantsList.value]

  const realIndex = variantsList.value.findIndex(v => v === variant)
  if (realIndex === selectedIdx.value) {
    detailForm.value = { ...variantsList.value[realIndex] }
  }
}

const deleteVariant = (index) => {
  variantsList.value.splice(index, 1)

  if (selectedIdx.value === index) {
    selectedIdx.value = null
  } else if (selectedIdx.value > index) {
    selectedIdx.value--
  }
}

const removeVariantByRef = (variant) => {
  const index = variantsList.value.findIndex(v => v === variant)
  if (index === -1) return
  deleteVariant(index)
}

const clearAllVariants = () => {
  Modal.confirm({
    title: 'Xóa toàn bộ biến thể?',
    content: 'Thao tác này sẽ xóa toàn bộ danh sách biến thể đang hiển thị trong modal.',
    okText: 'Xóa hết',
    okButtonProps: { danger: true },
    cancelText: 'Hủy',
    onOk() {
      variantsList.value = []
      selectedIdx.value = null
      message.success('Đã xóa toàn bộ biến thể.')
    }
  })
}

const pickImageFromGallery = (url) => {
  if (!url) return
  detailForm.value.imageUrl = url
  syncDetailToVariant()
  message.success('Đã gắn ảnh cho biến thể.')
}

const applyImageToAllSameColor = () => {
  const targetColor = detailForm.value.colorway
  const targetUrl = detailForm.value.imageUrl

  if (!targetColor || !targetUrl) {
    return message.warning('Vui lòng chọn màu và chọn ảnh trước.')
  }

  let count = 0
  variantsList.value.forEach(v => {
    if (v.colorway === targetColor) {
      v.imageUrl = targetUrl
      count++
    }
  })

  variantsList.value = [...variantsList.value]
  message.success(`Đã áp dụng ảnh cho ${count} biến thể màu "${targetColor}".`)
}

const clearQuickFilter = () => {
  quickFilter.value = {
    color: undefined,
    size: undefined,
    keyword: ''
  }
}

const handleOpenEdit = async (record) => {
  const res = await getProductDetail(record.id)
  productToEdit.value = res.data
  editMode.value = true
  open.value = true
}

const validateVariantsBeforeSave = () => {
  if (!variantsList.value.length) {
    message.warning('Sản phẩm chưa có biến thể nào.')
    return false
  }

  const invalid = variantsList.value.find(v =>
    !v.colorway || !v.size || Number(v.price || 0) < 0 || Number(v.stock || 0) < 0
  )

  if (invalid) {
    message.warning('Vui lòng kiểm tra lại biến thể: màu, size, giá, tồn kho không được để trống hoặc âm.')
    return false
  }

  if (hasDuplicateVariants.value) {
    message.warning('Danh sách đang có biến thể trùng màu + kích cỡ. Vui lòng xử lý trước khi lưu.')
    return false
  }

  return true
}

const saveAllVariants = async () => {
  if (!validateVariantsBeforeSave()) return

  try {
    loading.value = true

    const payload = {
      ...currentProduct.value,
      categoryIds:
        currentProduct.value.categories?.map(c => c.id) ||
        currentProduct.value.categoryIds ||
        [],
      images:
        currentProduct.value.images?.map(img => ({
          url: img.url || img.imageUrl,
          imageUrl: img.url || img.imageUrl,
          image_url: img.url || img.imageUrl,
          thumbnail: !!img.thumbnail
        })) || [],
      variants: variantsList.value.map(v => ({
        id: v.id || null,
        size: String(v.size),
        colorway: v.colorway,
        price: Number(v.price || 0),
        stock: Number(v.stock || 0),
        imageUrl: v.imageUrl || '',
        sku: v.sku || ''
      }))
    }

    await updateProduct(currentProduct.value.id, payload)
    message.success('Lưu biến thể thành công!')
    openVariantModal.value = false
    fetchProducts()
  } catch (e) {
    console.error('Lỗi khi lưu Product:', getErrorMessage(e, 'Thao tác thất bại'))
    message.error(getErrorMessage(e, 'Lỗi lưu dữ liệu! Vui lòng kiểm tra console.'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="product-page">
    <div class="page-toolbar">
      <div>
        <h2 class="page-title">Quản lý sản phẩm</h2>
        <div class="page-subtitle">
          Tối ưu thao tác tạo ma trận, sửa nhanh danh sách biến thể và quản lý tồn kho.
        </div>
      </div>

      <a-button
        type="primary"
        size="large"
        @click="editMode = false; productToEdit = null; open = true"
      >
        <plus-outlined />
        Thêm sản phẩm
      </a-button>
    </div>

    <a-card class="table-card" :bordered="false">
      <div class="table-topbar">
        <a-input-search
          v-model:value="keyword"
          placeholder="Tìm theo tên hoặc SKU sản phẩm..."
          allow-clear
          style="max-width: 380px"
          @search="fetchProducts"
          @pressEnter="fetchProducts"
        />
      </div>

      <a-table
        :dataSource="products"
        :loading="loading"
        rowKey="id"
        bordered
        :pagination="{
          current: page,
          pageSize,
          total,
          showSizeChanger: false,
          onChange: (p) => { page = p; fetchProducts() }
        }"
      >
        <a-table-column title="Hình ảnh" width="100px" align="center">
          <template #default="{ record }">
            <img v-if="record.thumbnail" :src="getImageSrc(record.thumbnail)" class="product-img-main" />
            <div v-else class="no-img-placeholder">
              <picture-outlined />
            </div>
          </template>
        </a-table-column>

        <a-table-column title="Thông tin sản phẩm">
          <template #default="{ record }">
            <div class="product-name-main">{{ record.name }}</div>
            <div class="product-sku-main">SKU: {{ record.sku || '---' }}</div>
          </template>
        </a-table-column>

        <a-table-column title="Hành động" width="220px" align="center">
          <template #default="{ record }">
            <a-space>
              <a-button size="small" @click="handleOpenEdit(record)">
                <edit-outlined /> Sửa
              </a-button>
              <a-button type="primary" ghost size="small" @click="handleOpenVariantMatrix(record)">
                <appstore-outlined /> Biến thể
              </a-button>
            </a-space>
          </template>
        </a-table-column>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="openVariantModal"
      title="Thiết lập ma trận biến thể"
      width="1600px"
      :confirmLoading="loading"
      @ok="saveAllVariants"
      okText="Lưu toàn bộ biến thể"
      cancelText="Đóng"
      wrapClassName="variant-modal-wrap"
    >
      <div class="variant-modal-layout">
        <!-- LEFT -->
        <div class="variant-left">
          <a-card class="panel-card matrix-card" size="small" :bordered="false">
            <template #title>
              <div class="card-title-row">
                <span>Thiết lập ma trận</span>
                <a-tag color="blue">Tạo nhanh tổ hợp màu × size</a-tag>
              </div>
            </template>

            <div class="matrix-description">
              Khi bấm Áp dụng ma trận, hệ thống sẽ tạo biến thể còn thiếu và cập nhật Giá mặc định + Tồn kho mặc định cho các tổ hợp đã chọn.
            </div>

            <a-row :gutter="[12, 8]">
              <a-col :span="12">
                <a-form-item label="Màu sắc">
                  <a-select
                    v-model:value="matrixColors"
                    mode="multiple"
                    :options="colorOptions.map(o => ({ value: o.name, label: o.name }))"
                    placeholder="Chọn màu"
                    allow-clear
                  />
                </a-form-item>
              </a-col>

              <a-col :span="12">
                <a-form-item label="Kích cỡ">
                  <a-select
                    v-model:value="matrixSizes"
                    mode="multiple"
                    :options="sizeOptions.map(o => ({ value: o.name, label: o.name }))"
                    placeholder="Chọn size"
                    allow-clear
                  />
                </a-form-item>
              </a-col>

              <a-col :span="12">
                <a-form-item label="Giá mặc định">
                  <a-input-number
                    v-model:value="matrixPrice"
                    class="w-full"
                    :min="0"
                    :formatter="value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                    :parser="value => value.replace(/\$\s?|(,*)/g, '')"
                  />
                </a-form-item>
              </a-col>

              <a-col :span="12">
                <a-form-item label="Tồn kho mặc định">
                  <a-input-number
                    v-model:value="matrixStock"
                    class="w-full"
                    :min="0"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <div class="matrix-actions">
              <a-button type="primary" @click="generateMatrix">
                <sync-outlined />
                Áp dụng ma trận
              </a-button>
              <a-button @click="matrixColors = []; matrixSizes = []">
                <clear-outlined />
                Xóa chọn
              </a-button>
            </div>
          </a-card>

          <a-card class="panel-card variant-list-card" size="small" :bordered="false">
            <template #title>
              <div class="list-header-row">
                <div>
                  <div class="list-title">Danh sách biến thể</div>
                  <div class="list-meta">
                    {{ totalVariantCount }} biến thể • Tổng tồn kho: {{ totalStock }}
                  </div>
                </div>

                <a-space>
                  <a-button type="dashed" size="small" @click="addSingleVariant">
                    <plus-outlined />
                    Thêm 1
                  </a-button>
                  <a-button danger size="small" @click="clearAllVariants">
                    <delete-outlined />
                    Xóa sạch
                  </a-button>
                </a-space>
              </div>
            </template>

            <div class="quick-filter-box">
              <a-row :gutter="[8, 8]">
                <a-col :span="9">
                  <a-select
                    v-model:value="quickFilter.color"
                    allow-clear
                    placeholder="Lọc theo màu"
                    :options="colorOptions.map(o => ({ value: o.name, label: o.name }))"
                  />
                </a-col>

                <a-col :span="7">
                  <a-select
                    v-model:value="quickFilter.size"
                    allow-clear
                    placeholder="Lọc theo size"
                    :options="sizeOptions.map(o => ({ value: o.name, label: o.name }))"
                  />
                </a-col>

                <a-col :span="8">
                  <a-input-search
                    v-model:value="quickFilter.keyword"
                    allow-clear
                    placeholder="Tìm SKU / màu / size"
                    @search="() => {}"
                  />
                </a-col>
              </a-row>

              <div class="quick-filter-actions">
                <a-button size="small" @click="clearQuickFilter">Xóa lọc</a-button>
                <a-tag v-if="hasDuplicateVariants" color="red">
                  Có biến thể trùng màu + size
                </a-tag>
              </div>
            </div>

            <div class="quick-table-wrap">
              <table class="quick-variant-table">
                <thead>
                  <tr>
                    <th>Ảnh</th>
                    <th>Màu</th>
                    <th>Size</th>
                    <th>SKU</th>
                    <th>Giá</th>
                    <th>Tồn thực tế</th>
                    <th>Đang giữ</th>
                    <th>Có thể bán</th>
                    <th>Chi tiết</th>
                    <th>Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="filteredVariants.length === 0">
                    <td colspan="10">
                      <a-empty description="Chưa có biến thể phù hợp" />
                    </td>
                  </tr>

                  <tr
                    v-for="variant in filteredVariants"
                    :key="`${variant.id || 'new'}-${variant.colorway}-${variant.size}-${variant.sku}`"
                    :class="{
                      active: selectedIdx !== null && variantsList[selectedIdx] === variant,
                      duplicate: duplicateVariantKeys.has(variantKey(variant))
                    }"
                  >
                    <td>
                      <img :src="getImageSrc(variant.imageUrl)" class="table-thumb" />
                    </td>

                    <td>
                      <a-select
                        :value="variant.colorway"
                        size="small"
                        show-search
                        style="min-width: 120px"
                        :options="colorOptions.map(o => ({ value: o.name, label: o.name }))"
                        @change="val => updateVariantField(variant, 'colorway', val)"
                      />
                    </td>

                    <td>
                      <a-select
                        :value="variant.size"
                        size="small"
                        show-search
                        style="min-width: 90px"
                        :options="sizeOptions.map(o => ({ value: o.name, label: o.name }))"
                        @change="val => updateVariantField(variant, 'size', val)"
                      />
                    </td>

                    <td>
                      <a-input
                        :value="variant.sku"
                        size="small"
                        placeholder="SKU"
                        @change="e => updateVariantField(variant, 'sku', e.target.value)"
                      />
                    </td>

                    <td>
                      <a-input-number
                        :value="variant.price"
                        size="small"
                        :min="0"
                        style="width: 120px"
                        @change="val => updateVariantField(variant, 'price', val)"
                      />
                    </td>

                    <td>
                      <a-input-number
                        :value="variant.stock"
                        size="small"
                        :min="0"
                        style="width: 90px"
                        @change="val => updateVariantField(variant, 'stock', val)"
                      />
                    </td>

                    <td>
                      <a-tag color="orange">{{ Number(variant.reservedQuantity || 0) }}</a-tag>
                    </td>

                    <td>
                      <a-tag :color="Number(variant.availableStock ?? Math.max(0, Number(variant.stock || 0) - Number(variant.reservedQuantity || 0))) > 0 ? 'green' : 'red'">
                        {{ Number(variant.availableStock ?? Math.max(0, Number(variant.stock || 0) - Number(variant.reservedQuantity || 0))) }}
                      </a-tag>
                    </td>

                    <td>
                      <a-button size="small" @click="selectVariantByRef(variant)">
                        Chọn
                      </a-button>
                    </td>

                    <td>
                      <a-button danger type="text" size="small" @click="removeVariantByRef(variant)">
                        <delete-outlined />
                      </a-button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </a-card>
        </div>

        <!-- RIGHT -->
        <div class="variant-right">
          <div v-if="selectedIdx !== null" class="sticky-detail">
            <a-card class="panel-card detail-card" :bordered="false">
              <template #title>
                <div class="card-title-row">
                  <span>
                    Chỉnh sửa chi tiết:
                    {{ detailForm.colorway || 'Chưa chọn màu' }} /
                    {{ detailForm.size || 'Chưa chọn size' }}
                  </span>
                  <a-tag color="green">Edit sâu</a-tag>
                </div>
              </template>

              <a-row :gutter="[12, 8]">
                <a-col :span="8">
                  <a-form-item label="Màu sắc">
                    <a-select
                      v-model:value="detailForm.colorway"
                      show-search
                      :options="colorOptions.map(o => ({ value: o.name, label: o.name }))"
                      @change="syncDetailToVariant"
                    />
                  </a-form-item>
                </a-col>

                <a-col :span="8">
                  <a-form-item label="Kích cỡ">
                    <a-select
                      v-model:value="detailForm.size"
                      show-search
                      :options="sizeOptions.map(o => ({ value: o.name, label: o.name }))"
                      @change="syncDetailToVariant"
                    />
                  </a-form-item>
                </a-col>

                <a-col :span="8">
                  <a-form-item label="SKU riêng">
                    <a-input
                      v-model:value="detailForm.sku"
                      placeholder="Tự nhập hoặc để trống"
                      @change="syncDetailToVariant"
                    />
                  </a-form-item>
                </a-col>

                <a-col :span="12">
                  <a-form-item label="Giá bán">
                    <a-input-number
                      v-model:value="detailForm.price"
                      class="w-full"
                      :min="0"
                      @change="syncDetailToVariant"
                      :formatter="value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                      :parser="value => value.replace(/\$\s?|(,*)/g, '')"
                    />
                  </a-form-item>
                </a-col>

                <a-col :span="12">
                  <a-form-item label="Tồn kho thực tế">
                    <a-input-number
                      v-model:value="detailForm.stock"
                      class="w-full"
                      :min="0"
                      @change="syncDetailToVariant"
                    />
                  </a-form-item>
                </a-col>

                <a-col :span="12">
                  <a-form-item label="Đang giữ chỗ">
                    <a-input-number
                      v-model:value="detailForm.reservedQuantity"
                      class="w-full"
                      disabled
                    />
                  </a-form-item>
                </a-col>

                <a-col :span="12">
                  <a-form-item label="Có thể bán">
                    <a-input-number
                      :value="Number(detailForm.availableStock ?? Math.max(0, Number(detailForm.stock || 0) - Number(detailForm.reservedQuantity || 0)))"
                      class="w-full"
                      disabled
                    />
                  </a-form-item>
                </a-col>
              </a-row>

              <a-divider orientation="left">Ảnh biến thể</a-divider>

              <div class="selected-image-preview">
                <img :src="getImageSrc(detailForm.imageUrl)" class="selected-main-image" />
                <div class="selected-image-info">
                  <div class="selected-image-label">Ảnh hiện tại</div>
                  <div class="selected-image-path">{{ detailForm.imageUrl || 'Chưa chọn ảnh' }}</div>

                  <div class="mt-3" v-if="detailForm.imageUrl && detailForm.colorway">
                    <a-button type="primary" ghost size="small" @click="applyImageToAllSameColor">
                      Áp dụng ảnh này cho tất cả size cùng màu "{{ detailForm.colorway }}"
                    </a-button>
                  </div>
                </div>
              </div>

              <div class="gallery-block">
                <div class="gallery-title">Chọn từ thư viện ảnh của sản phẩm</div>

                <div class="gallery-grid" v-if="currentProduct?.images?.length">
                  <div
                    v-for="img in currentProduct.images"
                    :key="img.id || img.url || img.imageUrl"
                    :class="[
                      'gallery-item-wrapper',
                      { active: detailForm.imageUrl === (img.url || img.imageUrl) }
                    ]"
                    @click="pickImageFromGallery(img.url || img.imageUrl)"
                  >
                    <img :src="getImageSrc(img.url || img.imageUrl)" class="gallery-img" />
                    <div
                      class="check-overlay"
                      v-if="detailForm.imageUrl === (img.url || img.imageUrl)"
                    >
                      ✅
                    </div>
                  </div>
                </div>

                <a-empty
                  v-else
                  description="Sản phẩm này chưa có ảnh nào. Hãy thêm ảnh ở form sản phẩm trước."
                />
              </div>
            </a-card>
          </div>

          <div v-else class="no-selection">
            <div class="text-center">
              <picture-outlined class="empty-big-icon" />
              <div class="empty-title">Chưa chọn biến thể</div>
              <div class="empty-desc">Bấm “Chọn” trong danh sách bên trái để sửa chi tiết.</div>
            </div>
          </div>
        </div>
      </div>
    </a-modal>

    <a-modal v-model:open="open" title="Sản phẩm" width="900px" :footer="null">
      <ProductForm
        :open="open"
        :edit="editMode"
        :product="productToEdit"
        @success="fetchProducts(); open = false"
        @update:open="open = $event"
      />
    </a-modal>
  </div>
</template>

<style scoped>
.product-page {
  padding: 24px;
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(24, 144, 255, 0.08), transparent 22%),
    linear-gradient(180deg, #f6f8fb 0%, #eef2f6 100%);
}

.page-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 16px;
}

.page-title {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 700;
  color: #141414;
}

.page-subtitle {
  font-size: 13px;
  color: #8c8c8c;
}

.table-card {
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.table-topbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.product-img-main {
  width: 62px;
  height: 62px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid #edf2f7;
  background: #fff;
}

.no-img-placeholder {
  width: 62px;
  height: 62px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: #c0c4cc;
  border: 1px dashed #d9d9d9;
  font-size: 20px;
}

.product-name-main {
  font-weight: 700;
  font-size: 15px;
  color: #1677ff;
  margin-bottom: 4px;
}

.product-sku-main {
  font-size: 12px;
  color: #8c8c8c;
}

.variant-modal-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(380px, 0.8fr);
  gap: 20px;
  align-items: start;
}

.variant-left,
.variant-right {
  min-width: 0;
}

.panel-card {
  border-radius: 16px;
  margin-bottom: 16px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
}

.matrix-card {
  background: linear-gradient(180deg, #f8fbff 0%, #f2f8ff 100%);
  border: 1px solid #d6e9ff;
}

.variant-list-card,
.detail-card {
  background: #fff;
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-weight: 700;
}

.matrix-description {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 12px;
  line-height: 1.6;
}

.matrix-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.list-header-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.list-title {
  font-weight: 700;
  font-size: 15px;
  color: #141414;
}

.list-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #8c8c8c;
}

.quick-filter-box {
  margin-bottom: 12px;
  padding: 12px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
}

.quick-filter-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.quick-table-wrap {
  max-height: 600px;
  overflow: auto;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
}

.quick-variant-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 960px;
  background: #fff;
}

.quick-variant-table th,
.quick-variant-table td {
  border-bottom: 1px solid #f3f4f6;
  padding: 10px;
  text-align: left;
  vertical-align: middle;
}

.quick-variant-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #fafafa;
  font-size: 12px;
  color: #595959;
  font-weight: 700;
}

.quick-variant-table tbody tr:hover {
  background: #f9fcff;
}

.quick-variant-table tbody tr.active {
  background: #edf6ff;
}

.quick-variant-table tbody tr.duplicate {
  background: #fff2f0;
}

.table-thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #eef2f7;
  background: #fafafa;
}

.sticky-detail {
  position: sticky;
  top: 12px;
}

.selected-image-preview {
  display: flex;
  gap: 16px;
  margin-bottom: 18px;
  padding: 14px;
  border-radius: 14px;
  background: #fafcff;
  border: 1px solid #edf2f7;
}

.selected-main-image {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
}

.selected-image-info {
  flex: 1;
  min-width: 0;
}

.selected-image-label {
  font-size: 13px;
  font-weight: 700;
  color: #141414;
  margin-bottom: 6px;
}

.selected-image-path {
  font-size: 12px;
  color: #8c8c8c;
  word-break: break-all;
}

.gallery-block {
  margin-top: 10px;
}

.gallery-title {
  font-weight: 600;
  margin-bottom: 10px;
  color: #262626;
}

.gallery-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.gallery-item-wrapper {
  position: relative;
  width: 72px;
  height: 72px;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
  background: #fff;
}

.gallery-item-wrapper:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
}

.gallery-item-wrapper.active {
  border-color: #1677ff;
  box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.12);
}

.gallery-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.check-overlay {
  position: absolute;
  inset: 0;
  background: rgba(22, 119, 255, 0.24);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.no-selection {
  min-height: 620px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%);
  border: 2px dashed #d9d9d9;
  border-radius: 18px;
}

.empty-big-icon {
  font-size: 54px;
  color: #d9d9d9;
  margin-bottom: 14px;
}

.empty-title {
  font-size: 18px;
  font-weight: 700;
  color: #595959;
  margin-bottom: 6px;
}

.empty-desc {
  font-size: 13px;
  color: #8c8c8c;
}

.w-full {
  width: 100%;
}

.mt-3 {
  margin-top: 16px;
}

.text-center {
  text-align: center;
}

@media (max-width: 1400px) {
  .variant-modal-layout {
    grid-template-columns: 1fr;
  }

  .sticky-detail {
    position: static;
  }

  .no-selection {
    min-height: 280px;
  }
}
</style>
