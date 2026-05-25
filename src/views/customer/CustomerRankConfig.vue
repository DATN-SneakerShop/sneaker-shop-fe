<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getErrorMessage } from '@/utils/error'
import { PlusOutlined, EditOutlined, DeleteOutlined, TrophyOutlined } from '@ant-design/icons-vue'
import { getCustomerRanks, createCustomerRank, updateCustomerRank, deleteCustomerRank } from '@/api/customer'

const ranks = ref([])
const loading = ref(false)
const modalVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)

const form = ref({
  id: null,
  name: '',
  minPoints: 0,
  discountPercent: 0,
  description: ''
})

const columns = [
  { title: 'Tên Hạng', dataIndex: 'name', key: 'name', align: 'center' },
  { title: 'Điểm tối thiểu', dataIndex: 'minPoints', key: 'minPoints', align: 'center' },
  { title: 'Ưu đãi giảm giá (%)', dataIndex: 'discountPercent', key: 'discountPercent', align: 'center' },
  { title: 'Mô tả', dataIndex: 'description', key: 'description' },
  { title: 'Thao tác', key: 'action', align: 'center', width: 200 }
]

const formatNumber = (num) => {
  if (num === null || num === undefined) return 0
  return new Intl.NumberFormat('vi-VN').format(num)
}

const fetchRanks = async () => {
  loading.value = true
  try {
    const res = await getCustomerRanks()
    ranks.value = res.data
  } catch (err) {
    message.error('Lỗi khi tải cấu hình hạng')
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  isEdit.value = false
  form.value = { id: null, name: '', minPoints: 0, discountPercent: 0, description: '' }
  modalVisible.value = true
}

const openEditModal = (record) => {
  isEdit.value = true
  form.value = { ...record }
  modalVisible.value = true
}

const handleSubmit = async () => {
  if (!form.value.name || form.value.minPoints < 0 || form.value.discountPercent < 0) {
    return message.warning('Vui lòng điền thông tin hợp lệ (Tên hạng và các số >= 0)')
  }

  submitLoading.value = true
  try {
    if (isEdit.value) {
      await updateCustomerRank(form.value.id, form.value)
      message.success('Cập nhật cấu hình hạng thành công!')
    } else {
      await createCustomerRank(form.value)
      message.success('Thêm hạng thành công!')
    }
    modalVisible.value = false
    fetchRanks()
  } catch (err) {
    message.error(getErrorMessage(err, 'Có lỗi xảy ra, tên hạng có thể bị trùng!'))
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (id) => {
  try {
    await deleteCustomerRank(id)
    message.success('Đã xóa cấu hình hạng')
    fetchRanks()
  } catch (err) {
    message.error('Lỗi khi xóa')
  }
}

onMounted(() => {
  fetchRanks()
})
</script>

<template>
  <div style="padding: 24px">
    <a-card title="🏆 CẤU HÌNH HẠNG & ĐIỂM KHÁCH HÀNG">
      <template #extra>
        <a-button type="primary" @click="openAddModal">
          <template #icon><plus-outlined /></template> Thêm hạng mới
        </a-button>
      </template>

      <a-alert message="Hướng dẫn tự động hóa"
        description="Khi khách hàng mua hàng, hệ thống sẽ tự động cộng điểm (10.000 VNĐ = 1 điểm). Khách đạt điểm tối thiểu của hạng nào sẽ tự động được set lên hạng đó (Quét từ cao xuống thấp) và nhận % ưu đãi tương ứng."
        type="info" show-icon style="margin-bottom: 20px" />

      <a-table :dataSource="ranks" :columns="columns" rowKey="id" :loading="loading" bordered :pagination="false">
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'name'">
            <a-tag :color="index === 0 ? 'gold' : (index === 1 ? 'blue' : 'default')"
              style="font-size: 14px; padding: 4px 10px; font-weight: bold;">
              <trophy-outlined v-if="index === 0" /> {{ record.name }}
            </a-tag>
          </template>

          <template v-if="column.key === 'minPoints'">
            <b style="color: #1890ff; font-size: 16px;">{{ formatNumber(record.minPoints) }}</b> <span
              style="color: #888">điểm</span>
          </template>

          <template v-if="column.key === 'discountPercent'">
            <b style="color: #f5222d; font-size: 16px;">Giảm {{ record.discountPercent }}%</b>
          </template>

          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="primary" size="small" ghost @click="openEditModal(record)">
                <template #icon><edit-outlined /></template> Sửa
              </a-button>
              <a-popconfirm title="Bạn có chắc chắn muốn xóa hạng này?" @confirm="handleDelete(record.id)">
                <a-button type="text" danger size="small">
                  <template #icon><delete-outlined /></template> Xóa
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="modalVisible" :title="isEdit ? '✏️ Chỉnh sửa hạng' : '✨ Thêm hạng mới'"
      :confirmLoading="submitLoading" @ok="handleSubmit">
      <a-form layout="vertical">
        <a-form-item label="Tên Hạng (Ví dụ: VIP, DIAMOND...)" required>
          <a-input v-model:value="form.name" placeholder="Nhập tên hạng..." />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Điểm tối thiểu để đạt hạng" required>
              <a-input-number v-model:value="form.minPoints" :min="0" style="width: 100%"
                :formatter="value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                :parser="value => value.replace(/\$\s?|(,*)/g, '')" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="% Giảm giá trực tiếp" required>
              <a-input-number v-model:value="form.discountPercent" :min="0" :max="100" style="width: 100%" suffix="%" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="Mô tả quyền lợi">
          <a-textarea v-model:value="form.description" :rows="3" placeholder="Ví dụ: Ưu đãi sinh nhật, Freeship..." />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
