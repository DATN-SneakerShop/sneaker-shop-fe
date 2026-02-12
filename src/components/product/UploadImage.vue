<script setup>
import { ref, watch } from 'vue'
import { uploadProductImage } from '@/api/upload.api'
import { message } from 'ant-design-vue'

/* ================= MODEL ================= */
const modelValue = defineModel({ default: [] })
const loading = ref(false)

/* ================= UPLOAD ================= */
const upload = async ({ file }) => {
  try {
    loading.value = true
    const res = await uploadProductImage(file)

    modelValue.value.push({
      url: res.data.url,
      thumbnail: modelValue.value.length === 0
    })

    message.success('Upload ảnh thành công')
  } catch (e) {
    message.error('Upload thất bại')
  } finally {
    loading.value = false
  }
}

/* ================= ACTION ================= */
const setThumbnail = (index) => {
  modelValue.value.forEach((img, i) => {
    img.thumbnail = i === index
  })
}

const removeImage = (index) => {
  const wasThumbnail = modelValue.value[index]?.thumbnail

  modelValue.value.splice(index, 1)

  // nếu xoá thumbnail → set ảnh đầu làm thumbnail
  if (wasThumbnail && modelValue.value.length > 0) {
    modelValue.value[0].thumbnail = true
  }
}
</script>

<template>
  <div class="image-list">
    <div
      v-for="(img, index) in modelValue"
      :key="index"
      class="image-item"
    >
      <img :src="`http://localhost:8080/${img.url}`" />

      <div class="actions">
        <a-button
          v-if="!img.thumbnail"
          size="small"
          type="primary"
          @click="setThumbnail(index)"
        >
          Set thumbnail
        </a-button>

        <a-button
          size="small"
          danger
          @click="removeImage(index)"
        >
          Xóa
        </a-button>
      </div>

      <span v-if="img.thumbnail" class="thumb-label">
        Thumbnail
      </span>
    </div>

    <a-upload
      :customRequest="upload"
      list-type="picture-card"
      :showUploadList="false"
      :disabled="loading"
    >
      <div>{{ loading ? 'Uploading...' : 'Upload' }}</div>
    </a-upload>
  </div>
</template>

<style scoped>
.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-item {
  position: relative;
  width: 120px;
}

.image-item img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #eee;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
}

.thumb-label {
  position: absolute;
  top: 6px;
  left: 6px;
  background: #52c41a;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
}
</style>
