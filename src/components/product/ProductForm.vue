<script setup>
import { ref, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import { getErrorMessage } from '@/utils/error'
import { createProduct, updateProduct, getMaterials, getSoles } from '@/api/product.api'
import { getCategories } from '@/api/category.api'
import UploadImage from './UploadImage.vue'

const props = defineProps({
  open: Boolean,
  edit: { type: Boolean, default: false },
  product: { type: Object, default: null },
})
const emit = defineEmits(['update:open', 'success'])

const BRAND_OPTIONS = ['Nike', 'Adidas', 'Puma', 'Converse', 'Vans', 'New Balance', 'MLB']
const STATUS_OPTIONS = [
  { value: 'Còn hàng', label: 'Còn hàng' },
  { value: 'Hết hàng', label: 'Hết hàng' },
  { value: 'Đặt trước', label: 'Đặt trước' },
  { value: 'Ngừng bán', label: 'Ngừng bán' },
]
const GENDER_OPTIONS = [
  { value: 'MEN', label: 'Nam' },
  { value: 'WOMEN', label: 'Nữ' },
  { value: 'UNISEX', label: 'Unisex' },
]

const loading = ref(false)
const categories = ref([])
const materialOptions = ref([])
const soleOptions = ref([])

const emptyForm = () => ({
  name: '',
  sku: '',
  brand: '',
  model: '',
  releaseYear: '',
  status: 'Còn hàng',
  gender: 'UNISEX',
  material: undefined,
  sole: undefined,
  categoryIds: [],
  description: '',
  images: []
})

const form = ref(emptyForm())

const fetchData = async () => {
  try {
    const [resCat, resMat, resSole] = await Promise.all([
      getCategories(),
      getMaterials(),
      getSoles()
    ])
    categories.value = resCat.data || []
    materialOptions.value = resMat.data || []
    soleOptions.value = resSole.data || []
  } catch (e) {
    message.error('Không tải được dữ liệu danh mục/chất liệu/đế')
  }
}

onMounted(() => { fetchData() })

watch(() => props.open, (val) => {
  if (val && !props.edit) form.value = emptyForm()
})

watch(() => props.product, (p) => {
  if (!p || !props.edit) return
  form.value = {
    name: p.name || '',
    sku: p.sku || '',
    brand: p.brand || '',
    model: p.model || '',
    releaseYear: p.releaseYear || '',
    status: p.status || 'Còn hàng',
    gender: p.gender || 'UNISEX',
    material: p.material || undefined,
    sole: p.sole || undefined,
    description: p.description || '',
    categoryIds: p.categoryIds || [],
    images: (p.images || []).map(img => ({
      url: img.url || img.imageUrl,
      thumbnail: !!img.thumbnail
    })),
  }
}, { immediate: true })

const generateSku = (name, brand) => {
  let str = `${name || ''} ${brand || ''}`.trim().toLowerCase();
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  str = str.replace(/[đĐ]/g, 'd');
  str = str.replace(/([^0-9a-z-\s])/g, '');
  str = str.replace(/(\s+)/g, '-').replace(/-+/g, '-');
  return str.toUpperCase();
}

watch([() => form.value.name, () => form.value.brand], () => {
  if (!props.edit) form.value.sku = generateSku(form.value.name, form.value.brand)
})

const setThumbnail = (index) => {
  form.value.images.forEach((img, i) => { img.thumbnail = (i === index); });
}

const submit = async () => {
  if (loading.value) return
  if (!form.value.name?.trim() || !form.value.sku?.trim() || !form.value.categoryIds.length) {
    return message.error('Vui lòng điền đầy đủ thông tin bắt buộc!')
  }
  if (!form.value.images || form.value.images.length === 0) {
    return message.error('Cần tải lên ít nhất 1 hình ảnh chung!')
  }

  loading.value = true
  try {
    const imagesToSend = form.value.images || []
    let hasThumbnail = imagesToSend.some(i => i.thumbnail)
    if (!hasThumbnail && imagesToSend.length > 0) imagesToSend[0].thumbnail = true
    const thumbnail = imagesToSend.find((i) => i.thumbnail)

    const payload = {
      ...form.value,
      material: form.value.material || null,
      sole: form.value.sole || null,
      categoryIds: [...form.value.categoryIds],
      thumbnail: thumbnail?.url || thumbnail?.imageUrl || null,
      images: imagesToSend.map(img => ({
        url: img.url || img.imageUrl,
        imageUrl: img.url || img.imageUrl,
        image_url: img.url || img.imageUrl,
        thumbnail: !!img.thumbnail
      })),
      variants: props.edit ? (props.product?.variants || []) : []
    }

    if (props.edit) {
      await updateProduct(props.product.id, payload)
      message.success('Cập nhật thành công')
    } else {
      await createProduct(payload)
      message.success('Tạo sản phẩm thành công!')
    }
    emit('success')
    emit('update:open', false)
  } catch (e) {
    message.error(getErrorMessage(e, 'Thao tác thất bại!'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <a-form layout="vertical">
    <a-row :gutter="16">
      <a-col :span="12"><a-form-item label="Tên sản phẩm" required><a-input
            v-model:value="form.name" /></a-form-item></a-col>
      <a-col :span="12"><a-form-item label="SKU" required><a-input v-model:value="form.sku"
            :disabled="edit" /></a-form-item></a-col>
    </a-row>

    <a-row :gutter="16">
      <a-col :span="8">
        <a-form-item label="Thương hiệu">
          <a-select v-model:value="form.brand" show-search allow-clear>
            <a-select-option v-for="b in BRAND_OPTIONS" :key="b" :value="b">{{ b }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
      <a-col :span="8">
        <a-form-item label="Đối tượng">
          <a-select v-model:value="form.gender">
            <a-select-option v-for="g in GENDER_OPTIONS" :key="g.value" :value="g.value">{{ g.label }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
      <a-col :span="8">
        <a-form-item label="Trạng thái">
          <a-select v-model:value="form.status">
            <a-select-option v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
    </a-row>

    <a-row :gutter="16">
      <a-col :span="8">
        <a-form-item label="Danh mục" required>
          <a-select v-model:value="form.categoryIds" mode="multiple" placeholder="Chọn danh mục">
            <a-select-option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
      <a-col :span="8">
        <a-form-item label="Chất liệu">
          <a-select v-model:value="form.material" allow-clear show-search placeholder="Chọn chất liệu">
            <a-select-option v-for="m in materialOptions" :key="m.id || m.name" :value="m.name">{{ m.name }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
      <a-col :span="8">
        <a-form-item label="Loại đế">
          <a-select v-model:value="form.sole" allow-clear show-search placeholder="Chọn loại đế">
            <a-select-option v-for="s in soleOptions" :key="s.id || s.name" :value="s.name">{{ s.name }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
    </a-row>

    <a-row :gutter="16">
      <a-col :span="12"><a-form-item label="Năm phát hành"><a-input
            v-model:value="form.releaseYear" /></a-form-item></a-col>
      <a-col :span="12"><a-form-item label="Mô hình"><a-input
            v-model:value="form.model" /></a-form-item></a-col>
    </a-row>

    <a-form-item label="Mô tả"><a-textarea v-model:value="form.description" :rows="3" /></a-form-item>

    <a-divider>Thư viện hình ảnh chung</a-divider>
    <UploadImage v-model="form.images" />

    <div v-if="form.images && form.images.length > 0" class="mt-3">
      <p class="mb-2"><b>Click vào ảnh để đặt làm Ảnh đại diện (Thumbnail):</b></p>
      <div class="thumbnail-grid">
        <div v-for="(img, idx) in form.images" :key="idx"
          :class="['thumb-wrapper', { active: img.thumbnail || (!form.images.some(i => i.thumbnail) && idx === 0) }]"
          @click="setThumbnail(idx)">
          <img :src="img.url" class="thumb-img" />
          <div class="star-overlay" v-if="img.thumbnail || (!form.images.some(i => i.thumbnail) && idx === 0)">⭐ Đại
            diện</div>
        </div>
      </div>
    </div>

    <a-divider />
    <div style="display: flex; justify-content: flex-end; gap: 8px;">
      <a-button @click="emit('update:open', false)">Hủy bỏ</a-button>
      <a-button type="primary" :loading="loading" @click="submit">{{ edit ? 'Lưu thay đổi' : 'Tạo sản phẩm'
        }}</a-button>
    </div>
  </a-form>
</template>

<style scoped>
.mt-3 {
  margin-top: 16px;
}

.mb-2 {
  margin-bottom: 8px;
}

.thumbnail-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #d9d9d9;
}

.thumb-wrapper {
  position: relative;
  width: 90px;
  height: 90px;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.thumb-wrapper:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.thumb-wrapper.active {
  border-color: #fadb14;
  box-shadow: 0 0 8px rgba(250, 219, 20, 0.4);
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.star-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(250, 219, 20, 0.9);
  color: #fff;
  font-size: 11px;
  font-weight: bold;
  text-align: center;
  padding: 2px 0;
}
</style>
