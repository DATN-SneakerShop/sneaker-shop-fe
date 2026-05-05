<template>
  <div class="promotion-report">
    <a-card title="KHUYẾN MÃI ĐANG ÁP DỤNG ĐANG HOẠT ĐỘNG" :bordered="false">
      <template #extra>
        <a-button type="primary" @click="fetchReport" :loading="loading">Làm mới</a-button>
      </template>

      <a-row :gutter="16" style="margin-bottom: 24px">
        <a-col :span="8">
          <a-statistic title="Tổng chương trình đang chạy" :value="reportData.totalActive || 0" />
        </a-col>
      </a-row>

      <a-table
        :columns="columns"
        :data-source="combinedDataSource"
        :loading="loading"
        row-key="rowKey"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <a-tag :color="record.displayType === 'Voucher' ? 'orange' : 'blue'">
              {{ record.displayType }}
            </a-tag>
          </template>

          <template v-if="column.key === 'status'">
            <a-badge status="processing" text="Đang hoạt động" />
          </template>

          <template v-if="column.key === 'priority'">
            <a-tag color="red" style="border-radius: 50%">
              {{ record.priority || 0 }}
            </a-tag>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
// ✅ SỬA TÊN FILE TẠI ĐÂY: bỏ chữ 's' ở promotion
import { getActivePromotionReport } from '@/api/promotion';

const loading = ref(false);
const reportData = ref({ promotions: [], vouchers: [], totalActive: 0 });

const columns = [
  { title: 'Loại', key: 'type', width: 120 },
  { title: 'Mã', dataIndex: 'code', key: 'code' },
  { title: 'Tên chương trình', dataIndex: 'name', key: 'name' },
  { title: 'Ưu tiên', key: 'priority', align: 'center' },
  { title: 'Trạng thái', key: 'status' },
];

const combinedDataSource = computed(() => {
  const p = (reportData.value.promotions || []).map(item => ({
    ...item,
    rowKey: `p-${item.id}`,
    displayType: 'Giảm giá trực tiếp',
    priority: item.priority || 0
  }));

  const v = (reportData.value.vouchers || []).map(item => ({
    ...item,
    rowKey: `v-${item.id}`,
    displayType: 'Voucher',
    priority: 0
  }));

  return [...p, ...v];
});

const fetchReport = async () => {
  loading.value = true;
  try {
    const res = await getActivePromotionReport();
    // Gán dữ liệu (res hoặc res.data tùy thuộc request.js của em)
    reportData.value = res.data || res;
  } catch (error) {
    console.error("Lỗi:", error);
    message.error("Không thể tải dữ liệu báo cáo");
  } finally {
    loading.value = false;
  }
};

onMounted(fetchReport);
</script>
