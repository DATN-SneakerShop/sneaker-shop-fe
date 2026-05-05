<template>
  <div class="voucher-page">

    <!-- FILTER -->
    <a-card title="Bộ lọc" style="margin-bottom:16px">
      <a-row :gutter="[16,16]">

        <a-col :span="6">
          <a-input v-model:value="filter.keyword" placeholder="Mã / tên..." />
        </a-col>

        <a-col :span="8">
          <a-range-picker v-model:value="filter.dateRange" style="width:100%" />
        </a-col>

        <a-col :span="5">
          <a-select v-model:value="filter.status" style="width:100%">
            <a-select-option value="ALL">Tất cả</a-select-option>
            <a-select-option value="ACTIVE">Hoạt động</a-select-option>
            <a-select-option value="UPCOMING">Sắp diễn ra</a-select-option>
            <a-select-option value="EXPIRED">Hết hạn</a-select-option>
            <a-select-option value="INACTIVE">Đã tắt</a-select-option>
          </a-select>
        </a-col>

      </a-row>
    </a-card>

    <!-- TABLE -->
    <a-card title="Danh sách voucher">

      <template #extra>
        <a-space>
          <a-button @click="resetFilter">Đặt lại</a-button>
          <a-button type="primary" @click="openCreate">
            + Thêm voucher
          </a-button>
        </a-space>
      </template>

      <a-table
        :columns="columns"
        :data-source="filteredVouchers"
        row-key="id"
        :loading="loading"
      >

        <template #bodyCell="{ column, record }">

          <!-- TYPE -->
          <template v-if="column.key === 'type'">
            <a-tag color="blue" v-if="record.type === 'PERCENT'">%</a-tag>
            <a-tag color="purple" v-else>VNĐ</a-tag>
          </template>

          <template v-if="column.dataIndex === 'minOrderValue'">
            <span class="money">
            {{ record.minOrderValue?.toLocaleString() }} đ
            </span>
          </template>

          <!-- VALUE -->
          <template v-if="column.key === 'value'">
            <span v-if="record.type === 'PERCENT'">
              {{ record.value }}%
              <br />
              <small>Max: {{ record.maxDiscount?.toLocaleString() }} đ</small>
            </span>
            <span v-else>
              {{ record.value?.toLocaleString() }} đ
            </span>
          </template>

          <!-- DATE -->
          <template v-if="column.dataIndex === 'startDate'">
            {{ dayjs(record.startDate).format('DD/MM/YYYY HH:mm') }}
          </template>

          <template v-if="column.dataIndex === 'endDate'">
            {{ dayjs(record.endDate).format('DD/MM/YYYY HH:mm') }}
          </template>

          <!-- PUBLIC -->
          <template v-if="column.key === 'public'">
            <a-tag color="green" v-if="record.isPublic">Công khai</a-tag>
            <a-tag color="orange" v-else>Riêng tư</a-tag>
          </template>

          <!-- STATUS -->
          <template v-if="column.key === 'status'">
            <a-tag :color="statusColor(record)">
              {{ statusLabel(record) }}
            </a-tag>

            <div v-if="getStatus(record)==='UPCOMING'" class="countdown">
              Bắt đầu sau: {{ getCountdown(record.startDate) }}
            </div>

            <div v-if="getStatus(record)==='ACTIVE'" class="countdown red">
              Còn: {{ getCountdown(record.endDate) }}
            </div>
          </template>

          <!-- USAGE -->
          <template v-if="column.key === 'usage'">
            {{ record.usedCount }}/{{ record.quantity }}
          </template>

          <!-- ACTION -->
          <template v-if="column.key === 'action'">
  <a-space>
    <a-button size="small" @click="openDetail(record)">👁</a-button>
    <a-button size="small" @click="openEdit(record)">✏️</a-button>

    <a-popconfirm
      title="Bạn chắc muốn xóa?"
      @confirm="deleteVoucher(record.id)"
    >
      <a-button size="small" danger>🗑</a-button>
    </a-popconfirm>

    <a-tooltip :title="isExpired(record) ? 'Voucher đã hết hạn, không thể bật' : ''">
      <a-switch
  :checked="record.status === 'ACTIVE'"
  :disabled="isExpired(record)"
  checked-children="ON"
  un-checked-children="OFF"
  @change="(checked) => toggleVoucher(record, checked)"
/>
    </a-tooltip>
  </a-space>
</template>

        </template>

      </a-table>
    </a-card>
    <a-modal
  v-model:visible="detailVisible"
  title="Chi tiết phiếu giảm giá"
  :footer="null"
  width="800px"
>
  <div v-if="selectedVoucher" class="voucher-detail">
    <a-descriptions bordered :column="2" size="small">
      <a-descriptions-item label="Tên">{{ selectedVoucher.name }}</a-descriptions-item>
      <a-descriptions-item label="Mã">{{ selectedVoucher.code }}</a-descriptions-item>

      <a-descriptions-item label="Giá trị giảm">
        <b style="color: #f5222d">
          {{ selectedVoucher.type === 'PERCENT' ? selectedVoucher.value + '%' : selectedVoucher.value?.toLocaleString() + ' đ' }}
        </b>
      </a-descriptions-item>
      <a-descriptions-item label="Giá trị giảm tối đa">
        {{ selectedVoucher.maxDiscount ? selectedVoucher.maxDiscount.toLocaleString() + ' đ' : '---' }}
      </a-descriptions-item>

      <a-descriptions-item label="Giá trị đơn hàng tối thiểu">
        {{ selectedVoucher.minOrderValue?.toLocaleString() }} đ
      </a-descriptions-item>
      <a-descriptions-item label="Số lượng">
        {{ selectedVoucher.quantity }}
      </a-descriptions-item>

      <a-descriptions-item label="Thời gian áp dụng" :span="2">
        {{ dayjs(selectedVoucher.startDate).format('HH:mm DD/MM/YYYY') }} -
        {{ dayjs(selectedVoucher.endDate).format('HH:mm DD/MM/YYYY') }}
      </a-descriptions-item>

      <a-descriptions-item label="Trạng thái">
        <a-tag :color="statusColor(selectedVoucher)">{{ statusLabel(selectedVoucher) }}</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="Phiếu giảm giá riêng tư">
        <a-tag :color="selectedVoucher.isPublic ? 'green' : 'orange'">
          {{ selectedVoucher.isPublic ? 'Công khai' : 'Riêng tư' }}
        </a-tag>
      </a-descriptions-item>

      <a-descriptions-item label="Mô tả" :span="2">
        {{ selectedVoucher.description || 'Không có mô tả' }}
      </a-descriptions-item>

      <a-descriptions-item label="Ngày tạo">
        {{ dayjs(selectedVoucher.createdAt).format('HH:mm DD/MM/YYYY') }}
      </a-descriptions-item>
      <a-descriptions-item label="Ngày cập nhật">
        {{ dayjs(selectedVoucher.updatedAt).format('HH:mm DD/MM/YYYY') }}
      </a-descriptions-item>
    </a-descriptions>
  </div>
</a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import api from '@/api/axios'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'

dayjs.extend(duration)
const router = useRouter()

const vouchers = ref([])
const loading = ref(false)
const now = ref(dayjs())
let timer = null

onMounted(() => {
  loadVouchers()
  timer = setInterval(() => now.value = dayjs(), 1000)
})

onUnmounted(() => clearInterval(timer))

const loadVouchers = async () => {
  try {
    loading.value = true
    const res = await api.get('/vouchers')
    vouchers.value = res.data
  } catch {
    message.error('Lỗi load voucher')
  } finally {
    loading.value = false
  }
}

/* STATUS */
const isExpired = v =>
  v.endDate && dayjs().isAfter(dayjs(v.endDate))

const getStatus = (v) => {
  if (v.status === 'INACTIVE') return 'INACTIVE'
  if (now.value.isBefore(dayjs(v.startDate))) return 'UPCOMING'
  if (now.value.isAfter(dayjs(v.endDate))) return 'EXPIRED'
  return 'ACTIVE'
}

const statusLabel = (v) => {
  const s = getStatus(v)
  return s === 'ACTIVE' ? 'Hoạt động'
       : s === 'UPCOMING' ? 'Sắp diễn ra'
       : s === 'EXPIRED' ? 'Hết hạn'
       : 'Đã tắt'
}

const statusColor = (v) => {
  const s = getStatus(v)
  return s === 'ACTIVE' ? 'green'
       : s === 'UPCOMING' ? 'blue'
       : s === 'EXPIRED' ? 'red'
       : 'default'
}

const getCountdown = (time) => {
  const diff = dayjs(time).diff(now.value)
  if (diff <= 0) return '0s'
  const d = dayjs.duration(diff)
  return `${d.days()}d ${d.hours()}h ${d.minutes()}m ${d.seconds()}s`
}

/* FILTER */
const filter = ref({
  keyword: '',
  status: 'ALL',
  dateRange: null
})

const filteredVouchers = computed(() =>
  vouchers.value.filter(v => {

    if (filter.value.keyword &&
      !v.name.toLowerCase().includes(filter.value.keyword.toLowerCase()) &&
      !v.code.toLowerCase().includes(filter.value.keyword.toLowerCase()))
      return false

    if (filter.value.status !== 'ALL' &&
        getStatus(v) !== filter.value.status)
      return false

   if (filter.value.dateRange) {
  const [start, end] = filter.value.dateRange

  if (dayjs(v.startDate).isAfter(end) ||
      dayjs(v.endDate).isBefore(start))
    return false
}

    return true
  })
)

const resetFilter = () => {
  filter.value = {
    keyword: '',
    status: 'ALL',
    dateRange: null
  }
}

/* ACTION */
const openCreate = () => {
  router.push('/vouchers/create')
}

const openEdit = (v) => {
  router.push({ path: '/vouchers/create', query: { id: v.id } })
}
// 1. Khai báo các biến điều khiển Modal
const detailVisible = ref(false);
const selectedVoucher = ref(null);

// 2. Cập nhật lại hàm openDetail để mở Modal khi bấm icon mắt
const openDetail = (v) => {
  selectedVoucher.value = v; // Gán dữ liệu của dòng vừa bấm vào biến tạm
  detailVisible.value = true; // Mở Modal lên
};

const deleteVoucher = async (id) => {
  try {
    await api.delete(`/vouchers/${id}`)
    message.success('Đã xóa')
    loadVouchers()
  } catch {
    message.error('Xóa thất bại')
  }
}

const toggleVoucher = async (record, checked) => {
  // Nếu cố tình bật một cái đã hết hạn
  if (checked && isExpired(record)) {
    message.error('Voucher đã hết hạn, không thể bật hoạt động!');
    return;
  }

  try {
    // Gọi API cập nhật trạng thái
    // Lưu ý: Backend cần nhận field 'status' hoặc biến boolean tùy em thiết kế
    await api.put(`/vouchers/${record.id}/status`, {
      status: checked ? 'ACTIVE' : 'INACTIVE'
    });

    // Cập nhật giá trị ngay trên giao diện để người dùng thấy thay đổi
    record.status = checked ? 'ACTIVE' : 'INACTIVE';
    message.success(checked ? 'Đã bật voucher thành công' : 'Đã tắt voucher');

  } catch (err) {
    console.error(err);
    message.error('Cập nhật trạng thái thất bại');
  }
};

/* TABLE */
const columns = [
  { title: 'Mã', dataIndex: 'code' },
  { title: 'Tên', dataIndex: 'name' },
  { title: 'Loại', key: 'type' },
  { title: 'Giá trị', key: 'value' },
  { title: 'Đơn tối thiểu', dataIndex: 'minOrderValue' },
  { title: 'Công khai', key: 'public' },
  { title: 'Bắt đầu', dataIndex: 'startDate' },
  { title: 'Kết thúc', dataIndex: 'endDate' },
  { title: 'Đã dùng', key: 'usage' },
  { title: 'Trạng thái', key: 'status' },
  { title: 'Thao tác', key: 'action' }
]
</script>

<style scoped>
.voucher-page { padding:16px }
.countdown { font-size:12px; color:#999 }
.countdown.red { color:#ff4d4f }
</style>
