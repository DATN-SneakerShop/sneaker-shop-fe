<template>
  <div class="system-log-container">
    <template v-if="isAdmin">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h2>Nhật ký hoạt động hệ thống</h2>
        <div>
          <a-button type="primary" style="background-color: #108ee9; border-color: #108ee9; margin-right: 8px;" @click="exportCSV">
            <template #icon><download-outlined /></template> Xuất CSV
          </a-button>

          <a-button type="primary" ghost @click="fetchLogs" :loading="loading">
            <template #icon><reload-outlined /></template> Làm mới dữ liệu
          </a-button>
        </div>
      </div>

      <a-card class="filter-card" :bordered="false" style="margin-bottom: 16px; border-radius: 8px;">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-input-search v-model:value="searchText" placeholder="🔍 Tìm kiếm User, Đối tượng, Nội dung..." allowClear />
          </a-col>
          <a-col :span="5">
            <a-select v-model:value="filterModule" placeholder="Lọc theo Module" style="width: 100%" allowClear>
              <a-select-option value="">Tất cả Module</a-select-option>
              <a-select-option value="AUTH">Xác thực (AUTH)</a-select-option>
              <a-select-option value="PRODUCT">Sản phẩm (PRODUCT)</a-select-option>
              <a-select-option value="CUSTOMER">Khách hàng (CUSTOMER)</a-select-option>
              <a-select-option value="PRICING">Giá cả (PRICING)</a-select-option>
            </a-select>
          </a-col>
          <a-col :span="5">
            <a-select v-model:value="filterAction" placeholder="Lọc theo Hành động" style="width: 100%" allowClear>
              <a-select-option value="">Tất cả Hành động</a-select-option>
              <a-select-option value="LOGIN">Đăng nhập</a-select-option>
              <a-select-option value="CREATE">Thêm mới</a-select-option>
              <a-select-option value="UPDATE">Cập nhật</a-select-option>
              <a-select-option value="DELETE">Xóa</a-select-option>
            </a-select>
          </a-col>
          <a-col :span="6">
             <a-select v-model:value="filterStatus" placeholder="Lọc theo Trạng thái" style="width: 100%" allowClear>
              <a-select-option value="">Tất cả Trạng thái</a-select-option>
              <a-select-option value="SUCCESS">Thành công</a-select-option>
              <a-select-option value="FAILED">Thất bại</a-select-option>
            </a-select>
          </a-col>
        </a-row>
      </a-card>

      <a-table :dataSource="filteredLogs" :columns="columns" rowKey="id" :loading="loading" :pagination="{ pageSize: 10 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>
          <template v-else-if="column.key === 'status'">
             <a-tag :color="record.status === 'SUCCESS' ? 'green' : 'red'">
                {{ record.status === 'SUCCESS' ? 'Thành công' : 'Thất bại' }}
             </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-tag :color="getActionColor(record.action)">{{ record.action }}</a-tag>
          </template>
        </template>
      </a-table>
    </template>
    <template v-else>
      <a-alert message="Bạn không có quyền truy cập trang này." type="error" show-icon />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { getSystemLogs } from '@/api/audit.api';

const logs = ref([]);
const loading = ref(false);

const searchText = ref('');
const filterModule = ref('');
const filterAction = ref('');
const filterStatus = ref('');

const isAdmin = computed(() => {
  const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
  return roles.includes('ADMIN');
});

const columns = [
  { title: 'Thời gian', key: 'createdAt', width: 160 },
  { title: 'Người thực hiện', dataIndex: 'username', key: 'username', width: 150 },
  { title: 'IP Address', dataIndex: 'ipAddress', key: 'ipAddress', width: 130 },
  { title: 'Module', dataIndex: 'module', key: 'module', width: 120 },
  { title: 'Hành động', key: 'action', width: 120 },
  { title: 'Đối tượng', dataIndex: 'entityName', key: 'entityName', width: 120 },
  { title: 'Trạng thái', key: 'status', width: 110 },
  { title: 'Nội dung chi tiết', dataIndex: 'summary', key: 'summary' }
];

const fetchLogs = async () => {
  loading.value = true;
  try {
    const res = await getSystemLogs();
    logs.value = res.data;
  } catch (error) {
    message.error('Không thể tải dữ liệu log!');
  } finally {
    loading.value = false;
  }
};

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    const sText = searchText.value.toLowerCase();
    const matchText = !sText ||
      (log.summary?.toLowerCase().includes(sText)) ||
      (log.username?.toLowerCase().includes(sText)) ||
      (log.entityName?.toLowerCase().includes(sText));
    const matchModule = !filterModule.value || log.module === filterModule.value;
    const matchAction = !filterAction.value || log.action === filterAction.value;
    const matchStatus = !filterStatus.value || log.status === filterStatus.value;
    return matchText && matchModule && matchAction && matchStatus;
  });
});

const getActionColor = (action) => {
  if (!action) return 'default';
  if (action.includes('CREATE') || action.includes('REGISTER')) return 'green';
  if (action.includes('UPDATE') || action.includes('EDIT')) return 'orange';
  if (action.includes('DELETE')) return 'red';
  if (action.includes('LOGIN')) return 'blue';
  if (action.includes('OTP')) return 'purple';
  return 'default';
};

const formatDate = (date) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : 'N/A');

// HÀM XUẤT CSV
const exportCSV = () => {
  if (!filteredLogs.value || filteredLogs.value.length === 0) {
    message.warning('Không có dữ liệu để xuất CSV!');
    return;
  }
  const headers = ['Thời gian', 'Người thực hiện', 'IP Address', 'Module', 'Hành động', 'Trạng thái', 'Nội dung chi tiết'];
  const csvRows = filteredLogs.value.map(log => {
    return [
      formatDate(log.createdAt),
      log.username || '',
      log.ipAddress || '',
      log.module || '',
      log.action || '',
      log.status === 'SUCCESS' ? 'Thành công' : 'Thất bại',
      `"${(log.summary || '').replace(/"/g, '""')}"`
    ].join(',');
  });
  const csvString = [headers.join(','), ...csvRows].join('\n');
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Bao_Cao_Log_${dayjs().format('YYYYMMDD_HHmmss')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  message.success('Xuất file CSV thành công!');
};

onMounted(() => {
  if (isAdmin.value) {
    fetchLogs();
  }
});
</script>

<style scoped>
.filter-card {
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
</style>
