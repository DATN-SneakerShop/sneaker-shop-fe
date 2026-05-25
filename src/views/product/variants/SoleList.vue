<script setup>
import { ref, onMounted } from 'vue'
import { getSoles, saveSole, deleteSole } from '@/api/product.api' // 🔥 Sửa đúng tên hàm
import { message, Modal } from 'ant-design-vue'
import { getErrorMessage } from '@/utils/error'
import { PlusOutlined, EditOutlined, EyeInvisibleOutlined } from '@ant-design/icons-vue'

const list = ref([]); const loading = ref(false); const open = ref(false)
const form = ref({ id: null, name: '' })

const fetch = async () => {
  loading.value = true;
  try { const res = await getSoles(); list.value = res.data } // 🔥 Sửa getSoles
  catch { message.error('Lỗi tải dữ liệu') }
  finally { loading.value = false }
}

const handleSave = async () => {
  if (!form.value.name) return message.warn('Vui lòng nhập tên loại đế')
  try {
    await saveSole(form.value);
    message.success('Thành công');
    open.value = false;
    fetch()
  } catch (e) { message.error(getErrorMessage(e, 'Lỗi lưu dữ liệu')) }
}

const handleHide = (id) => {
  Modal.confirm({
    title: 'Xác nhận ẩn loại đế này?',
    onOk: async () => { await deleteSole(id); message.success('Đã ẩn'); fetch() }
  })
}
onMounted(fetch)
</script>

<template>
  <a-card title="👟 Quản lý Loại đế">
    <template #extra>
      <a-button type="primary" @click="open = true; form = { id: null, name: '' }">
        <plus-outlined /> Thêm mới
      </a-button>
    </template>
    <a-table :dataSource="list" :loading="loading" rowKey="id" bordered>
      <a-table-column title="Tên loại đế" dataIndex="name" />
      <a-table-column title="Thao tác" width="200">
        <template #default="{ record }">
          <a-space>
            <a-button size="small" @click="form = { ...record }; open = true"><edit-outlined /> Sửa</a-button>
            <a-button size="small" danger @click="handleHide(record.id)"><eye-invisible-outlined /> Ẩn</a-button>
          </a-space>
        </template>
      </a-table-column>
    </a-table>
    <a-modal v-model:open="open" :title="form.id ? 'Sửa loại đế' : 'Thêm mới'" @ok="handleSave">
      <a-form layout="vertical" class="mt-4">
        <a-form-item label="Tên loại đế">
          <a-input v-model:value="form.name" placeholder="Ví dụ: Cao su, Đế trấu..." />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>
