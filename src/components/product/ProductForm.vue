<script setup>
import { ref, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import { createProduct, updateProduct } from '@/api/product.api'
import { getCategories } from '@/api/category.api'
import UploadImage from './UploadImage.vue'

/* ================= PROPS / EMITS ================= */
const props = defineProps({
  open: Boolean, // dùng cho create
  edit: {
    type: Boolean,
    default: false,
  },
  product: {
    type: Object,
    default: null,
  },
})
const emit = defineEmits(['update:open', 'success'])

/* ================= STATE ================= */
const loading = ref(false)
const categories = ref([])
const STATUS_OPTIONS = [
  { value: 'IN_STOCK', label: 'Còn hàng' },
  { value: 'OUT_OF_STOCK', label: 'Hết hàng' },
  { value: 'PRE_ORDER', label: 'Đặt trước' },
  { value: 'DISCONTINUED', label: 'Ngừng bán' },
]
const GENDER_OPTIONS = [
  { value: 'MEN', label: 'Nam' },
  { value: 'WOMEN', label: 'Nữ' },
  { value: 'UNISEX', label: 'Unisex' },
]

/**
 * 🔑 LƯU ẢNH BAN ĐẦU (CHỈ DÙNG KHI EDIT)
 * để tránh mất ảnh khi submit
 */
const originalImages = ref([])

const emptyForm = () => ({
  name: '',
  sku: '',
  brand: '',
  model: '',
  releaseYear: '',
  status: 'Còn Hàng',
  gender: 'UNISEX', //
  categoryIds: [],
  description: '',
  images: [],
  variants: [
    {
      size: '',
      sizeType: 'VN',
      colorway: '',
      stock: 0,
    },
  ],
})

const form = ref(emptyForm())

/* ================= INIT ================= */
onMounted(async () => {
  try {
    const res = await getCategories()
    categories.value = res.data
  } catch {
    message.error('Không tải được danh mục')
  }
})

/* ================= WATCH ================= */

// reset form khi đóng modal create
watch(
  () => props.open,
  (val) => {
    if (!val && !props.edit) {
      form.value = emptyForm()
      originalImages.value = []
    }
  },
)

// fill data khi edit
watch(
  () => props.product,
  (p) => {
    if (!p || !props.edit) return

    form.value = {
      name: p.name,
      sku: p.sku,
      brand: p.brand,
      model: p.model,
      releaseYear: p.releaseYear,
      status: p.status,
      gender: p.gender || 'UNISEX',
      description: p.description,
      categoryIds: p.categoryIds || [],
      images: [...(p.images || [])], // clone để tránh mất reference
      variants:
        p.variants?.map((v) => ({
          id: v.id,
          size: v.size,
          sizeType: v.sizeType,
          colorway: v.colorway,
          stock: v.stock,
        })) || [],
    }

    /**
     * 🔑 lưu ảnh gốc khi edit
     */
    originalImages.value = [...(p.images || [])]
  },
  { immediate: true },
)

/* ================= METHODS ================= */
const addVariant = () => {
  form.value.variants.push({
    size: '',
    sizeType: 'VN',
    colorway: '',
    stock: 0,
  })
}

const removeVariant = (index) => {
  form.value.variants.splice(index, 1)
}

/* ================= VALIDATE ================= */
const validate = () => {
  if (!form.value.name.trim()) {
    message.error('Tên sản phẩm không được để trống')
    return false
  }

  if (!form.value.sku.trim()) {
    message.error('SKU cha không được để trống')
    return false
  }

  if (!form.value.categoryIds.length) {
    message.error('Vui lòng chọn ít nhất 1 danh mục')
    return false
  }

  if (!form.value.images.length) {
    message.error('Cần ít nhất 1 hình ảnh')
    return false
  }

  if (!form.value.images.find((i) => i.thumbnail)) {
    message.error('Phải chọn 1 ảnh làm thumbnail')
    return false
  }

  if (!form.value.variants.length) {
    message.error('Cần ít nhất 1 variant')
    return false
  }

  for (const v of form.value.variants) {
    if (!v.size || !v.sizeType || !v.colorway) {
      message.error('Variant phải có size, sizeType và colorway')
      return false
    }
    if (v.stock == null) {
      message.error('Variant phải có tồn kho')
      return false
    }
  }

  return true
}

/* ================= SUBMIT ================= */
const submit = async () => {
  if (!validate()) return

  loading.value = true
  try {
    /**
     * 🔑 FIX MẤT ẢNH:
     * nếu user không chỉnh ảnh → giữ ảnh cũ
     */
    const imagesToSend = form.value.images.length ? form.value.images : originalImages.value

    const thumbnail = imagesToSend.find((i) => i.thumbnail)

    const payload = {
      name: form.value.name,
      sku: form.value.sku,
      brand: form.value.brand,
      model: form.value.model,
      releaseYear: form.value.releaseYear,
      status: form.value.status,
      gender: form.value.gender, // 👈 thêm dòng này
      description: form.value.description,
      categoryIds: form.value.categoryIds,
      thumbnail: thumbnail?.url || null,
      images: imagesToSend,
      variants: form.value.variants,
    }

    if (props.edit) {
      await updateProduct(props.product.id, payload)
      message.success('Cập nhật sản phẩm thành công')
    } else {
      await createProduct(payload)
      message.success('Thêm sản phẩm thành công')
    }

    emit('success')
    emit('update:open', false)
  } catch (e) {
    message.error(e?.response?.data?.message || 'Thao tác thất bại')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <a-form layout="vertical">
    <!-- BASIC INFO -->
    <a-row :gutter="16">
      <a-col :span="12">
        <a-form-item label="Tên sản phẩm" required>
          <a-input v-model:value="form.name" />
        </a-form-item>
      </a-col>

      <a-col :span="12">
        <a-form-item label="SKU" required>
          <a-input v-model:value="form.sku" :disabled="edit" />
        </a-form-item>
      </a-col>
    </a-row>

    <a-row :gutter="16">
      <a-col :span="6">
        <a-form-item label="Thương Hiệu">
          <a-input v-model:value="form.brand" />
        </a-form-item>
      </a-col>

      <a-col :span="6">
        <a-form-item label="Đối Tượng">
          <a-select v-model:value="form.gender">
            <a-select-option v-for="g in GENDER_OPTIONS" :key="g.value" :value="g.value">
              {{ g.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-col>

      <a-col :span="8">
        <a-form-item label="Chất Liệu">
          <a-input v-model:value="form.model" />
        </a-form-item>
      </a-col>
      <a-col :span="8">
        <a-form-item label="Trạng thái">
          <a-select v-model:value="form.status">
            <a-select-option v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">
              {{ s.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
      <a-col :span="8">
        <a-form-item label="Phiên bản / Năm phát hành">
          <a-input v-model:value="form.releaseYear" style="width: 100%" />
        </a-form-item>
      </a-col>
    </a-row>

    <a-form-item label="Danh mục" required>
      <a-select v-model:value="form.categoryIds" mode="multiple" placeholder="Chọn danh mục">
        <a-select-option v-for="c in categories" :key="c.id" :value="c.id">
          {{ c.name }}
        </a-select-option>
      </a-select>
    </a-form-item>

    <a-form-item label="Mô tả">
      <a-textarea v-model:value="form.description" rows="3" />
    </a-form-item>

    <!-- VARIANTS -->
    <a-divider>Variants</a-divider>

    <!-- VARIANT HEADER -->
    <a-row :gutter="12" style="font-weight: 600; margin-bottom: 8px">
      <a-col :span="4">Size</a-col>
      <a-col :span="4">Loại size</a-col>
      <a-col :span="6">Màu sắc</a-col>
      <a-col :span="4">Tồn kho</a-col>
      <a-col :span="2"></a-col>
    </a-row>

    <!-- VARIANT LIST -->
    <div
      v-for="(v, index) in form.variants"
      :key="index"
      style="border: 1px solid #eee; padding: 12px; margin-bottom: 12px"
    >
      <a-row :gutter="12">
        <a-col :span="4">
          <a-input v-model:value="v.size" placeholder="Size" />
        </a-col>

        <a-col :span="4">
          <a-select v-model:value="v.sizeType">
            <a-select-option value="VN">VN</a-select-option>
            <a-select-option value="EU">EU</a-select-option>
            <a-select-option value="UK">UK</a-select-option>
          </a-select>
        </a-col>

        <a-col :span="6">
          <a-input v-model:value="v.colorway" placeholder="Colorway" />
        </a-col>
        <a-col :span="4">
          <a-input-number v-model:value="v.stock" placeholder="Stock" />
        </a-col>

        <a-col :span="2">
          <a-button danger v-if="form.variants.length > 1" @click="removeVariant(index)">
            X
          </a-button>
        </a-col>
      </a-row>
    </div>

    <a-button type="dashed" block @click="addVariant"> + Thêm variant </a-button>

    <!-- IMAGES -->
    <a-divider>Hình ảnh</a-divider>
    <UploadImage v-model="form.images" />

    <!-- ACTION -->
    <a-divider />
    <a-space>
      <a-button @click="emit('update:open', false)">Hủy</a-button>
      <a-button type="primary" :loading="loading" @click="submit">
        {{ edit ? 'Cập nhật' : 'Thêm sản phẩm' }}
      </a-button>
    </a-space>
  </a-form>
</template>
