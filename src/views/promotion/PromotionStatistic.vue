<template>
  <div class="promo-dashboard" style="padding: 24px; background: #f0f2f5; min-height: 100vh;">
    <h2 style="margin-bottom: 24px; font-weight: bold;">DASHBOARD THỐNG KÊ KHUYẾN MÃI</h2>

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :sm="12" :md="6">
        <a-card style="border-radius: 10px; border-top: 4px solid #1890ff;">
          <a-statistic title="Tổng Tiền Giảm (Voucher)" :value="data.totalVoucherDiscount" :precision="0" suffix="đ" />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6">
        <a-card style="border-radius: 10px; border-top: 4px solid #fa8c16;">
          <a-statistic title="Tổng Tiền Giảm (Sản phẩm)" :value="data.totalProductDiscount" :precision="0" suffix="đ" />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6">
        <a-card style="border-radius: 10px; border-top: 4px solid #52c41a;">
          <a-statistic title="Lượt Dùng Voucher" :value="data.totalVoucherUsage" suffix="Lượt" />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6">
        <a-card style="border-radius: 10px; border-top: 4px solid #eb2f96;">
          <a-statistic title="Doanh Thu Đơn Có KM" :value="data.totalPromoRevenue" :precision="0" suffix="đ" />
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" style="margin-top: 24px;">
      <a-col :span="24">
        <a-card title="📊 Báo Cáo Chi Phí Khuyến Mãi Theo Tháng" style="border-radius: 10px;">
          <a-table :dataSource="data.chartData" :columns="monthCols" :pagination="false" rowKey="monthLabel" size="middle" bordered>
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'totalMonth'">
                <span style="font-weight: bold; color: #f5222d;">
                  {{ (record.voucherDiscount + record.productDiscount).toLocaleString() }} đ
                </span>
              </template>

              <template v-if="column.dataIndex === 'voucherDiscount'">
                <div style="display: flex; flex-direction: column;">
                  <span>{{ record.voucherDiscount.toLocaleString() }} đ</span>
                  <a-progress
                    :percent="getPercent(record.voucherDiscount, record.voucherDiscount + record.productDiscount)"
                    size="small"
                    strokeColor="#1890ff"
                    :showInfo="false"
                  />
                </div>
              </template>

              <template v-if="column.dataIndex === 'productDiscount'">
                <div style="display: flex; flex-direction: column;">
                  <span>{{ record.productDiscount.toLocaleString() }} đ</span>
                  <a-progress
                    :percent="getPercent(record.productDiscount, record.voucherDiscount + record.productDiscount)"
                    size="small"
                    strokeColor="#fa8c16"
                    :showInfo="false"
                  />
                </div>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" style="margin-top: 24px;">
      <a-col :xs="24" :md="12">
        <a-card title="🏆 Top 5 Voucher Dùng Nhiều Nhất" style="border-radius: 10px;">
          <a-table :dataSource="data.topVouchers" :columns="voucherCols" :pagination="false" rowKey="code" size="small">
            <template #bodyCell="{ column, text }">
              <span v-if="column.dataIndex === 'totalDiscount'" style="color: red; font-weight: bold;">
                {{ text.toLocaleString() }} đ
              </span>
            </template>
          </a-table>
        </a-card>
      </a-col>
      <a-col :xs="24" :md="12">
        <a-card title="🔥 Top 5 Sản Phẩm 'Đốt' Tiền KM Nhất" style="border-radius: 10px;">
          <a-table :dataSource="data.topProducts" :columns="productCols" :pagination="false" rowKey="productName" size="small">
            <template #bodyCell="{ column, text }">
              <span v-if="column.dataIndex === 'totalDiscount'" style="color: red; font-weight: bold;">
                {{ text.toLocaleString() }} đ
              </span>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
// Sửa đường dẫn import tùy theo project của em
import { getPromotionDashboard } from '@/api/promotion';

const data = ref({
  totalVoucherDiscount: 0,
  totalProductDiscount: 0,
  totalVoucherUsage: 0,
  totalPromoRevenue: 0,
  chartData: [],
  topVouchers: [],
  topProducts: []
});

// Cột cho Bảng theo tháng
const monthCols = [
  { title: 'Thời gian (Tháng)', dataIndex: 'monthLabel', key: 'monthLabel', width: '20%' },
  { title: 'Giảm qua Voucher', dataIndex: 'voucherDiscount', key: 'voucherDiscount' },
  { title: 'Giảm trực tiếp Sản phẩm', dataIndex: 'productDiscount', key: 'productDiscount' },
  { title: 'Tổng Cộng', key: 'totalMonth', align: 'right' }
];

const voucherCols = [
  { title: 'Mã Voucher', dataIndex: 'code', key: 'code' },
  { title: 'Lượt Dùng', dataIndex: 'usageCount', key: 'usageCount' },
  { title: 'Tổng Tiền Đã Giảm', dataIndex: 'totalDiscount', key: 'totalDiscount' }
];

const productCols = [
  { title: 'Tên Sản Phẩm', dataIndex: 'productName', key: 'productName' },
  { title: 'SL Bán Khuyến Mãi', dataIndex: 'soldQuantity', key: 'soldQuantity' },
  { title: 'Tổng Tiền Đã Giảm', dataIndex: 'totalDiscount', key: 'totalDiscount' }
];

// Hàm tính % để vẽ thanh tiến độ
const getPercent = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};

const loadData = async () => {
  try {
    const res = await getPromotionDashboard();
    // THAY ĐỔI Ở ĐÂY: Thêm .data để lấy đúng payload từ Backend trả về
    data.value = res.data || res;
  } catch (error) {
    console.error("Lỗi chi tiết:", error);
    message.error("Lỗi khi tải dữ liệu thống kê!");
  }
};

onMounted(() => {
  loadData();
});
</script>
