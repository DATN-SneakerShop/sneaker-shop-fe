<script setup>
import { ref, onMounted } from 'vue'
import { getMaterials, saveMaterial, deleteMaterial } from '@/api/product.api' // 🔥 Sửa bỏ chữ 's'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined, EditOutlined, EyeInvisibleOutlined } from '@ant-design/icons-vue'

const list = ref([]); const loading = ref(false); const open = ref(false)
const form = ref({ id: null, name: '' })

const fetch = async () => {
  loading.value = true;
  try { const res = await getMaterials(); list.value = res.data }
  catch { message.error('Lỗi tải dữ liệu') }
  finally { loading.value = false }
}

const handleSave = async () => {
  if (!form.value.name) return message.warn('Vui lòng nhập tên chất liệu')
  try {
    await saveMaterial(form.value);
    message.success('Thành công');
    open.value = false;
    fetch()
  } catch (e) { message.error(e.response?.data?.message || 'Lỗi lưu dữ liệu') }
}

const handleHide = (id) => {
  Modal.confirm({
    title: 'Xác nhận ẩn chất liệu này?',
    onOk: async () => { await deleteMaterial(id); message.success('Đã ẩn'); fetch() }
  })
}
onMounted(fetch)
</script>

<template>
  <a-card title="🧶 Quản lý Chất liệu">
    <template #extra>
      <a-button type="primary" @click="open = true; form = { id: null, name: '' }">
        <plus-outlined /> Thêm mới
      </a-button>
    </template>
    <a-table :dataSource="list" :loading="loading" rowKey="id" bordered>
      <a-table-column title="Tên chất liệu" dataIndex="name" />
      <a-table-column title="Thao tác" width="200">
        <template #default="{ record }">
          <a-space>
            <a-button size="small" @click="form = { ...record }; open = true"><edit-outlined /> Sửa</a-button>
            <a-button size="small" danger @click="handleHide(record.id)"><eye-invisible-outlined /> Ẩn</a-button>
          </a-space>
        </template>
      </a-table-column>
    </a-table>
    <a-modal v-model:open="open" :title="form.id ? 'Sửa chất liệu' : 'Thêm mới'" @ok="handleSave">
      <a-form layout="vertical" class="mt-4">
        <a-form-item label="Tên chất liệu">
          <a-input v-model:value="form.name" placeholder="Ví dụ: Da thuộc, Vải Canvas..." />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>
