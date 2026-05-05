<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'
import dayjs from 'dayjs'
import { message } from 'ant-design-vue'

const logs = ref([])
const loading = ref(false)
const searchText = ref('')

const columns = [
  { title: 'Thời gian', dataIndex: 'timestamp', key: 'timestamp', width: 180 },
  { title: 'Hành động', dataIndex: 'action', key: 'action', width: 150 },
  { title: 'Nội dung chi tiết', dataIndex: 'summary', key: 'summary' },
  { title: 'Người thực hiện', dataIndex: 'performedBy', key: 'performedBy', width: 150 },
]

const fetchLogs = async () => {
  loading.value = true
  try {
    const res = await api.get('/customer-audit-logs')
    logs.value = res.data
  } catch (err) {
    message.error('Không tải được nhật ký hoạt động')
  } finally {
    loading.value = false
  }
}

onMounted(fetchLogs)

const getActionLabel = (action) => {
  const map = {
    'CREATE': 'Thêm mới',
    'UPDATE': 'Cập nhật',
    'DELETE': 'Xoá / Ngừng hoạt động',
    'RANK': 'Thay đổi hạng',
    'POINT': 'Thay đổi điểm'
  }
  return map[action] || action
}

const getActionColor = (action) => {
  const map = {
    'CREATE': 'green',
    'UPDATE': 'blue',
    'DELETE': 'red',
    'RANK': 'purple',
    'POINT': 'orange'
  }
  return map[action] || 'default'
}

const filteredLogs = computed(() => {
  if (!searchText.value) return logs.value
  const s = searchText.value.toLowerCase()
  return logs.value.filter(log =>
    log.summary?.toLowerCase().includes(s) ||
    log.performedBy?.toLowerCase().includes(s)
  )
})
</script>

<template>
  <div style="padding: 24px">
    <a-card title="Nhật ký hoạt động khách hàng">
      <template #extra>
        <a-space>
          <a-input-search v-model:value="searchText" placeholder="Tìm nội dung hoặc người thực hiện..."
            style="width: 300px" />
          <a-button @click="fetchLogs" type="primary" ghost>Làm mới</a-button>
        </a-space>
      </template>

      <a-table :dataSource="filteredLogs" :columns="columns" rowKey="id" :loading="loading"
        :pagination="{ pageSize: 10 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'timestamp'">
            {{ dayjs(record.timestamp).format('DD/MM/YYYY HH:mm:ss') }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-tag :color="getActionColor(record.action)">
              {{ getActionLabel(record.action) }}
            </a-tag>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>