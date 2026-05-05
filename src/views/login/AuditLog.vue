<template>
  <div class="system-log-container">
    <template v-if="isAdmin">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h2>Nhật ký hoạt động hệ thống & Bảo mật</h2>
        <div>
          <a-button type="dashed" style="margin-right: 8px; border-color: #722ed1; color: #722ed1" @click="openReportModal">
            <template #icon><bar-chart-outlined /></template> Báo cáo User
          </a-button>

          <a-button type="primary" style="background-color: #108ee9; border-color: #108ee9; margin-right: 8px;" @click="exportCSV">
            <template #icon><download-outlined /></template> Xuất CSV Nâng cao
          </a-button>

          <a-button type="primary" ghost @click="resetAndFetch" :loading="loading">
            <template #icon><reload-outlined /></template> Làm mới
          </a-button>
        </div>
      </div>

      <a-card class="filter-card" :bordered="false" style="margin-bottom: 16px; border-radius: 8px;">
        <a-row :gutter="12">
          <a-col :span="5">
            <a-input-search v-model:value="searchText" placeholder="🔍 Tìm User, IP, Nội dung..." allowClear />
          </a-col>
          <a-col :span="3">
            <a-select v-model:value="filterTime" placeholder="Thời gian" style="width: 100%">
              <a-select-option value="ALL">Tất cả</a-select-option>
              <a-select-option value="TODAY">Hôm nay</a-select-option>
              <a-select-option value="WEEK">Tuần này</a-select-option>
              <a-select-option value="MONTH">Tháng này</a-select-option>
            </a-select>
          </a-col>
          <a-col :span="4">
            <a-select v-model:value="filterModule" placeholder="Module" style="width: 100%" allowClear>
              <a-select-option value="">Tất cả Module</a-select-option>
              <a-select-option value="AUTH">Xác thực</a-select-option>
              <a-select-option value="SECURITY">Bảo mật</a-select-option>
              <a-select-option value="SYSTEM">Hệ thống</a-select-option>
              <a-select-option value="PRODUCT">Sản phẩm</a-select-option>
              <a-select-option value="CUSTOMER">Khách hàng</a-select-option>
              <a-select-option value="ORDER">Đơn hàng</a-select-option>
            </a-select>
          </a-col>

          <a-col :span="4">
             <a-select v-model:value="filterLevel" placeholder="Mức độ (Level)" style="width: 100%" allowClear>
              <a-select-option value="">Tất cả Mức độ</a-select-option>
              <a-select-option value="INFO">INFO (Thông thường)</a-select-option>
              <a-select-option value="WARNING">WARNING (Cảnh báo)</a-select-option>
              <a-select-option value="ERROR">ERROR (Lỗi)</a-select-option>
              <a-select-option value="DANGER">DANGER (Nguy hiểm)</a-select-option>
            </a-select>
          </a-col>

          <a-col :span="4">
            <a-select v-model:value="filterAction" placeholder="Hành động" style="width: 100%" allowClear>
              <a-select-option value="">Tất cả Hành động</a-select-option>
              <a-select-option value="LOGIN">Đăng nhập</a-select-option>
              <a-select-option value="CREATE">Thêm mới</a-select-option>
              <a-select-option value="UPDATE">Cập nhật</a-select-option>
              <a-select-option value="DELETE">Xóa</a-select-option>
            </a-select>
          </a-col>

          <a-col :span="4">
             <a-select v-model:value="filterStatus" placeholder="Trạng thái" style="width: 100%" allowClear>
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

          <template v-else-if="column.key === 'logLevel'">
             <a-tag :color="getLevelColor(record.logLevel)">
                {{ record.logLevel || 'INFO' }}
             </a-tag>
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

      <a-modal v-model:open="isReportVisible" title="📊 Báo cáo hoạt động theo User" width="700px" :footer="null">
        <a-table :dataSource="reportData" :columns="reportColumns" rowKey="username" :loading="loadingReport" :pagination="{ pageSize: 5 }">
           <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'successCount'">
                <span style="color: #52c41a; font-weight: bold;">{{ record.successCount }}</span>
              </template>
              <template v-if="column.key === 'failedCount'">
                <span style="color: #f5222d; font-weight: bold;">{{ record.failedCount }}</span>
              </template>
           </template>
        </a-table>
      </a-modal>

    </template>
    <template v-else>
      <a-alert message="Bạn không có quyền truy cập trang này." type="error" show-icon />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ReloadOutlined, DownloadOutlined, BarChartOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

import { getSystemLogs, getUserLogReport } from '@/api/audit.api';

dayjs.extend(isBetween);

const logs = ref([]);
const loading = ref(false);

const searchText = ref('');
const filterTime = ref('WEEK');
const filterModule = ref('');
const filterAction = ref('');
const filterStatus = ref('');
const filterLevel = ref(''); // 🔥 MỚI: Biến lưu trữ lọc Level

const isReportVisible = ref(false);
const reportData = ref([]);
const loadingReport = ref(false);

const isAdmin = computed(() => {
  const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
  return roles.includes('ADMIN');
});

// 🔥 NÂNG CẤP COLUMNS: Thêm cột Mức độ
const columns = [
  { title: 'Thời gian', key: 'createdAt', width: 150 },
  { title: 'Mức độ', key: 'logLevel', width: 100, align: 'center' },
  { title: 'Thực hiện', dataIndex: 'username', key: 'username', width: 130 },
  { title: 'IP Address', dataIndex: 'ipAddress', key: 'ipAddress', width: 120 },
  { title: 'Module', dataIndex: 'module', key: 'module', width: 110 },
  { title: 'Hành động', key: 'action', width: 120 },
  { title: 'Trạng thái', key: 'status', width: 100 },
  { title: 'Nội dung chi tiết', dataIndex: 'summary', key: 'summary' }
];

const reportColumns = [
  { title: 'User / Tài khoản', dataIndex: 'username', key: 'username' },
  { title: 'Tổng thao tác', dataIndex: 'totalAction', key: 'totalAction', align: 'center' },
  { title: 'Thành công', dataIndex: 'successCount', key: 'successCount', align: 'center' },
  { title: 'Thất bại', dataIndex: 'failedCount', key: 'failedCount', align: 'center' }
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

const resetAndFetch = () => {
  searchText.value = '';
  filterTime.value = 'WEEK';
  filterModule.value = '';
  filterAction.value = '';
  filterStatus.value = '';
  filterLevel.value = ''; // Reset cả filter level
  fetchLogs();
};

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    const sText = searchText.value.toLowerCase();
    const matchText = !sText ||
      (log.summary?.toLowerCase().includes(sText)) ||
      (log.username?.toLowerCase().includes(sText)) ||
      (log.ipAddress?.toLowerCase().includes(sText)) ||
      (log.entityName?.toLowerCase().includes(sText));

    const matchModule = !filterModule.value || log.module === filterModule.value;
    const matchAction = !filterAction.value || log.action === filterAction.value;
    const matchStatus = !filterStatus.value || log.status === filterStatus.value;

    // 🔥 MỚI: Lọc theo Level
    const matchLevel = !filterLevel.value || (log.logLevel || 'INFO') === filterLevel.value;

    let matchTime = true;
    if (log.createdAt && filterTime.value !== 'ALL') {
      const logDate = dayjs(log.createdAt);
      const now = dayjs();

      if (filterTime.value === 'TODAY') {
        matchTime = logDate.isSame(now, 'day');
      } else if (filterTime.value === 'WEEK') {
        matchTime = logDate.isAfter(now.subtract(7, 'day'));
      } else if (filterTime.value === 'MONTH') {
        matchTime = logDate.isSame(now, 'month');
      }
    }

    return matchText && matchModule && matchAction && matchStatus && matchLevel && matchTime;
  });
});

const openReportModal = async () => {
  isReportVisible.value = true;
  loadingReport.value = true;
  try {
    const res = await getUserLogReport();
    reportData.value = res.data;
  } catch (err) {
    message.error('Lỗi khi tải báo cáo!');
  } finally {
    loadingReport.value = false;
  }
};

// 🔥 HÀM MỚI: Lấy màu cho Tag Mức độ
const getLevelColor = (level) => {
  if (!level) return 'blue';
  if (level === 'DANGER') return '#cf1322'; // Đỏ sẫm
  if (level === 'ERROR') return 'red';
  if (level === 'WARNING') return 'orange';
  return 'blue'; // INFO
};

const getActionColor = (action) => {
  if (!action) return 'default';
  if (action.includes('CREATE') || action.includes('REGISTER')) return 'green';
  if (action.includes('UPDATE') || action.includes('EDIT')) return 'orange';
  if (action.includes('DELETE') || action.includes('CANCEL')) return 'red';
  if (action.includes('LOGIN')) return 'blue';
  if (action.includes('OTP')) return 'purple';
  return 'default';
};

const formatDate = (date) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : 'N/A');

// 🔥 NÂNG CẤP: Xuất CSV kèm theo cột Mức độ cảnh báo (Yêu cầu 4)
const exportCSV = () => {
  if (!filteredLogs.value || filteredLogs.value.length === 0) {
    message.warning('Không có dữ liệu để xuất CSV!');
    return;
  }
  const headers = ['Thời gian', 'Mức độ', 'Người thực hiện', 'IP Address', 'Module', 'Hành động', 'Trạng thái', 'Nội dung chi tiết'];
  const csvRows = filteredLogs.value.map(log => {
    return [
      formatDate(log.createdAt),
      log.logLevel || 'INFO',
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
  link.setAttribute('download', `Bao_Cao_Bao_Mat_${dayjs().format('YYYYMMDD_HHmmss')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  message.success('Xuất file CSV nâng cao thành công!');
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
