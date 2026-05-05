<script setup>
import { ref, watch } from 'vue'
import { uploadProductImage } from '@/api/upload.api'
import { message } from 'ant-design-vue'

const props = defineProps({
  single: { type: Boolean, default: false }
})

const modelValue = defineModel({ default: [] })
const loading = ref(false)

const upload = async ({ file }) => {
  try {
    loading.value = true
    const res = await uploadProductImage(file)

    if (props.single) {
      modelValue.value = [
        {
          url: res.data.url,
          thumbnail: true
        }
      ]
    } else {
      modelValue.value.push({
        url: res.data.url,
        thumbnail: modelValue.value.length === 0
      })
    }

    message.success('Tải ảnh lên thành công')
  } catch (e) {
    message.error('Tải ảnh thất bại')
  } finally {
    loading.value = false
  }
}

const setThumbnail = (index) => {
  modelValue.value.forEach((img, i) => {
    img.thumbnail = i === index
  })
}

const removeImage = (index) => {
  const wasThumbnail = modelValue.value[index]?.thumbnail
  modelValue.value.splice(index, 1)

  if (wasThumbnail && modelValue.value.length > 0) {
    modelValue.value[0].thumbnail = true
  }
}
</script>

<template>
  <div class="image-list">
    <div v-for="(img, index) in modelValue" :key="index" class="image-item">
      <img :src="img.url.startsWith('http') ? img.url : `http://localhost:8080/${img.url}`" />

      <div class="actions">
        <a-button v-if="!img.thumbnail" size="small" type="primary" @click="setThumbnail(index)">
          Đặt làm ảnh đại diện
        </a-button>

        <a-button size="small" danger @click="removeImage(index)">
          Xóa ảnh
        </a-button>
      </div>

      <span v-if="img.thumbnail" class="thumb-label">
        Ảnh đại diện
      </span>
    </div>

    <a-upload :customRequest="upload" list-type="picture-card" :showUploadList="false" :disabled="loading" multiple>
      <div>{{ loading ? 'Đang tải...' : 'Tải lên' }}</div>
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
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #d9d9d9;
}

.image-item img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}

.actions {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-item:hover .actions {
  opacity: 1;
}

.thumb-label {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: #52c41a;
  color: white;
  font-size: 11px;
  text-align: center;
  padding: 2px 0;
}
</style>
