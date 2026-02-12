<script setup>
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import UploadImage from './UploadImage.vue'
import { createCategory, updateCategory } from '@/api/category.api'

/* ================= PROPS ================= */
const props = defineProps({
  open: Boolean,
  category: Object,
})

const emit = defineEmits(['update:open', 'success'])

/* ================= STATE ================= */
const form = ref({
  name: '',
  description: '',
})

/* Ảnh dùng cho UploadImage (multiple format) */
const images = ref([])

/* ================= RESET FORM ================= */
watch(
  () => props.open,
  (val) => {
    if (val) {
      if (props.category) {
        // EDIT MODE
        form.value = {
          name: props.category.name,
          description: props.category.description,
        }

        images.value = props.category.thumbnail
          ? [
              {
                url: props.category.thumbnail,
                thumbnail: true,
              },
            ]
          : []
      } else {
        // CREATE MODE
        form.value = { name: '', description: '' }
        images.value = []
      }
    }
  }
)

/* ================= SUBMIT ================= */
const submit = async () => {
  if (!form.value.name) {
    message.warning('Vui lòng nhập tên danh mục')
    return
  }

  // Lấy thumbnail từ images
  const thumbObj = images.value.find((img) => img.thumbnail)
  const thumbnail = thumbObj?.url || ''

  const payload = {
    ...form.value,
    thumbnail,
  }

  try {
    if (props.category?.id) {
      await updateCategory(props.category.id, payload)
      message.success('Cập nhật thành công')
    } else {
      await createCategory(payload)
      message.success('Thêm danh mục thành công')
    }

    emit('update:open', false)
    emit('success')
  } catch (e) {
    message.error('Có lỗi xảy ra')
    console.error(e)
  }
}
</script>

<template>
  <a-modal
    :open="open"
    :title="category ? 'Sửa danh mục' : 'Thêm danh mục'"
    ok-text="Lưu"
    cancel-text="Hủy"
    @ok="submit"
    @cancel="$emit('update:open', false)"
  >
    <a-form layout="vertical">
      
      <!-- TÊN -->
      <a-form-item label="Tên danh mục" required>
        <a-input v-model:value="form.name" placeholder="VD: Sneaker nam" />
      </a-form-item>

      <!-- MÔ TẢ -->
      <a-form-item label="Mô tả">
        <a-textarea
          v-model:value="form.description"
          placeholder="Mô tả danh mục"
          :rows="4"
        />
      </a-form-item>

      <!-- HÌNH ĐẠI DIỆN -->
      <a-form-item label="Hình đại diện">
        <UploadImage v-model="images" />
      </a-form-item>

    </a-form>
  </a-modal>
</template>
