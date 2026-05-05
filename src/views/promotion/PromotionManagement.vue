<template>
  <div class="promotion-page">

    <a-alert
      v-if="notificationCount > 0"
      type="warning"
      show-icon
      style="margin-bottom:16px"
      :message="`Có ${notificationCount} khuyến mãi sắp hết hạn hoặc đã hết hạn`"
    />
    <a-card
      v-if="notifications.length"
      title="Thông báo khuyến mãi"
      style="margin-bottom:16px"
    >
      <a-list
        :data-source="showAllNotifications ? notifications : notifications.slice(0,5)"
        bordered
      >
        <template #renderItem="{ item }">
          <a-list-item style="cursor:pointer" @click="openEdit({ id: item.id })">
            {{ item.message }}
          </a-list-item>
        </template>
      </a-list>
      <div v-if="notifications.length > 0" style="text-align:center;margin-top:10px">
        <a-button type="link" @click="showAllNotifications = !showAllNotifications">
          {{ showAllNotifications ? "Thu gọn" : "Xem chi tiết" }}
        </a-button>
      </div>
    </a-card>

    <a-card title="Bộ lọc tìm kiếm" style="margin-bottom:16px">
      <a-row :gutter="[16,16]" align="middle">
        <a-col :xs="24" :md="8" :lg="8">
          <div class="filter-item">
            <span class="filter-label">Tên đợt giảm giá</span>
            <a-input v-model:value="filter.keyword" placeholder="Nhập tên..." allow-clear />
          </div>
        </a-col>
        <a-col :xs="24" :md="8" :lg="8">
          <div class="filter-item">
            <span class="filter-label">Thời gian diễn ra</span>
            <a-range-picker v-model:value="filter.dateRange" format="DD/MM/YYYY" style="width:100%" />
          </div>
        </a-col>
        <a-col :xs="24" :md="8" :lg="8">
          <div class="filter-item">
            <span class="filter-label">Trạng thái</span>
            <a-select v-model:value="filter.status" style="width: 100%">
              <a-select-option value="ALL">Tất cả</a-select-option>
              <a-select-option value="ACTIVE">Đang diễn ra</a-select-option>
              <a-select-option value="UPCOMING">Sắp diễn ra</a-select-option>
              <a-select-option value="INACTIVE">Đã kết thúc / Đã tắt</a-select-option>
            </a-select>
          </div>
        </a-col>
      </a-row>
    </a-card>

    <a-card title="Danh sách giảm giá">
      <template #extra>
        <a-space>
          <a-button @click="resetFilter">Đặt lại</a-button>
          <a-button type="primary" @click="router.push('/promotions/create')">
            + Tạo đợt giảm giá
          </a-button>
        </a-space>
      </template>

      <a-table
        :columns="columns"
        :data-source="filteredPromotions"
        row-key="id"
        bordered
        :loading="loading"
        :pagination="{ pageSize: 5, showSizeChanger: false }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'priority'">
            <a-badge :count="record.priority || 0" :color="record.priority >= 5 ? 'red' : 'gold'" />
          </template>

          <template v-if="column.key === 'variantCount'">
            <b>{{ record.variantIds?.length || 0 }}</b> sản phẩm
          </template>

          <template v-if="column.key === 'status'">
            <a-tag :color="statusColor(record)">
              {{ statusLabel(record) }}
            </a-tag>
            <div v-if="getPromotionStatus(record) === 'UPCOMING'" class="countdown">
              Bắt đầu sau: {{ getCountdown(record.startTime) }}
            </div>
            <div v-if="getPromotionStatus(record) === 'ACTIVE'" class="countdown red">
              Còn: {{ getCountdown(record.endTime) }}
            </div>
          </template>

          <template v-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="openDetail(record)">👁</a-button>
              <a-button size="small" @click="openEdit(record)">✏️</a-button>
              <a-popconfirm
                title="Bạn có chắc muốn xóa?"
                ok-text="Xóa"
                cancel-text="Hủy"
                @confirm="softDelete(record.id)"
              >
                <a-button size="small" danger>🗑</a-button>
              </a-popconfirm>

              <a-switch
                :checked="record.active"
                :disabled="isExpired(record)"
                checked-children="ON"
                un-checked-children="OFF"
                @change="(checked) => togglePromotion(record, checked)"
              />
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="detailVisible"
      title="Chi tiết đợt giảm giá"
      width="900px"
      :footer="null"
    >
      <a-descriptions bordered :column="2" size="small">
        <a-descriptions-item label="Tên"><b>{{ selectedPromotion?.name }}</b></a-descriptions-item>
        <a-descriptions-item label="Mã"><a-tag color="blue">{{ selectedPromotion?.code }}</a-tag></a-descriptions-item>
        <a-descriptions-item label="Ưu tiên">
          <a-badge :count="selectedPromotion?.priority || 0" :color="selectedPromotion?.priority >= 5 ? 'red' : 'gold'" />
        </a-descriptions-item>
        <a-descriptions-item label="Trạng thái">
          <a-tag :color="statusColor(selectedPromotion)">{{ statusLabel(selectedPromotion) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="Thời gian áp dụng" :span="2">
          {{ dayjs(selectedPromotion?.startTime).format('HH:mm DD/MM/YYYY') }}
          →
          {{ dayjs(selectedPromotion?.endTime).format('HH:mm DD/MM/YYYY') }}
        </a-descriptions-item>
      </a-descriptions>

      <a-divider>
        Danh sách sản phẩm cấu hình ({{ selectedPromotion?.variants?.length || 0 }} biến thể)
      </a-divider>

      <a-table
        v-if="selectedPromotion?.variants?.length"
        :data-source="selectedPromotion.variants"
        :pagination="false"
        :showHeader="false"
        rowKey="variantId"
        bordered
        size="small"
        :scroll="{ y: 320 }"
      >
        <a-table-column>
          <template #default="{ record }">
            <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 8px;">
              <div style="display:flex; gap:14px; align-items:center;">
                <img
    :src="record.thumbnail ? record.thumbnail : '/no-image.png'"
    style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px; border: 1px solid #eee;"
  />
                <div>
                  <div style="font-weight:600;">{{ record.productName }}</div>
                  <div style="color:#888; font-size:13px;">Màu: {{ record.color }} - Size {{ record.size }}</div>
                  <div style="color:#1890ff; font-size:12px;">SKU: {{ record.sku }}</div>
                  <div style="font-size:12px; color:#666;">Tồn: {{ record.stock }}</div>
                </div>
              </div>

              <div style="text-align:right; min-width:160px;">
                <div style="margin-bottom: 4px;">
                  <a-tag color="orange">
                    Giảm {{ record.discountValue }} {{ record.discountType === 'PERCENT' ? '%' : '₫' }}
                  </a-tag>
                </div>
                <div v-if="record.discountedPrice < record.price" style="text-decoration:line-through; color:#999; font-size: 13px;">
                  {{ record.price?.toLocaleString() }} ₫
                </div>
                <div style="color:#52c41a; font-weight:bold; font-size: 16px;">
                  {{ record.discountedPrice?.toLocaleString() }} ₫
                </div>
              </div>
            </div>
          </template>
        </a-table-column>
      </a-table>

      <div v-else style="text-align:center; padding:20px; color:#999;">
        Không có sản phẩm áp dụng
      </div>
    </a-modal>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { message } from 'ant-design-vue'
import { getPromotions, getPromotionDetail, deletePromotion, togglePromotionApi } from '@/api/promotion'

dayjs.extend(duration)
const router = useRouter()

const loading = ref(false)
const promotions = ref([])
const detailVisible = ref(false)
const selectedPromotion = ref(null)
const now = ref(dayjs())
const showAllNotifications = ref(false)

const softDelete = async (id) => {
  try {
    await deletePromotion(id)
    message.success('Đã xóa thành công')
    await loadPromotions()
  } catch {
    message.error('Xóa thất bại')
  }
}

let timer = null

onMounted(() => {
  loadPromotions()
  timer = setInterval(() => now.value = dayjs(), 1000)
})

onUnmounted(() => clearInterval(timer))

const loadPromotions = async () => {
  try {
    loading.value = true
    const data = await getPromotions()
    promotions.value = data.map(p => ({
      ...p,
      active: dayjs().isAfter(dayjs(p.endTime)) ? false : p.active,
      priority: p.priority || 0
    })).sort((a, b) => {
      const statusOrder = { ACTIVE: 3, UPCOMING: 2, INACTIVE: 1 }
      const s1 = statusOrder[getPromotionStatus(a)]
      const s2 = statusOrder[getPromotionStatus(b)]
      if (s1 !== s2) return s2 - s1
      return (b.priority || 0) - (a.priority || 0) || b.id - a.id
    })
  } catch {
    message.error('Không tải được danh sách giảm giá')
  } finally {
    loading.value = false
  }
}

const isExpired = p => p?.endTime && now.value.isAfter(dayjs(p.endTime))
const isExpiringSoon = p => {
  if (!p?.endTime) return false
  const diff = dayjs(p.endTime).diff(now.value)
  return diff > 0 && diff <= 86400000
}

const getPromotionStatus = p => {
  if (!p) return 'INACTIVE'
  if (isExpired(p)) return 'INACTIVE'
  if (now.value.isBefore(dayjs(p.startTime))) return 'UPCOMING'
  if (!p.active) return 'INACTIVE'
  return 'ACTIVE'
}

const statusLabel = p => {
  const s = getPromotionStatus(p)
  return s === 'ACTIVE' ? 'Đang diễn ra' : s === 'UPCOMING' ? 'Sắp diễn ra' : 'Đã kết thúc'
}

const statusColor = p => {
  const s = getPromotionStatus(p)
  return s === 'ACTIVE' ? 'green' : s === 'UPCOMING' ? 'blue' : 'red'
}

const togglePromotion = async (record, checked) => {
  if (isExpired(record)) {
    return message.error('Khuyến mãi đã hết hạn')
  }
  try {
    await togglePromotionApi(record.id, checked)
    record.active = checked
    message.success(checked ? 'Đã bật' : 'Đã tắt')
  } catch {
    message.error('Cập nhật thất bại')
  }
}

const getCountdown = time => {
  const diff = dayjs(time).diff(now.value)
  if (diff <= 0) return '0m'
  const d = dayjs.duration(diff)
  return `${d.days() ? d.days() + 'd ' : ''}${d.hours()}h ${d.minutes()}m ${d.seconds()}s`
}

const filter = ref({
  keyword: '',
  status: 'ALL',
  dateRange: null,
})

const notifications = computed(() => {
  const list = []
  promotions.value.forEach(p => {
    if (isExpired(p)) list.push({ id: p.id, message: `❌ ${p.name} đã hết hạn` })
    else if (isExpiringSoon(p)) list.push({ id: p.id, message: `⚠️ ${p.name} sắp hết hạn` })
  })
  return list
})

const notificationCount = computed(() => notifications.value.length)

const filteredPromotions = computed(() =>
  promotions.value.filter(p => {
    if (filter.value.keyword && !p.name.toLowerCase().includes(filter.value.keyword.toLowerCase())) return false
    if (filter.value.status !== 'ALL' && getPromotionStatus(p) !== filter.value.status) return false
    return true
  })
)

const resetFilter = () => {
  filter.value = { keyword: '', status: 'ALL', dateRange: null }
}

const openDetail = async record => {
  const data = await getPromotionDetail(record.id)
  selectedPromotion.value = { ...data, priority: data.priority || 0 }
  detailVisible.value = true
}

const openEdit = record => router.push({ path: '/promotions/create', query: { id: record.id } })

const columns = [
  { title: 'Mã', dataIndex: 'code' },
  { title: 'Tên đợt', dataIndex: 'name' },
  { title: 'Sản phẩm áp dụng', key: 'variantCount' },
  { title: 'Ưu tiên', dataIndex: 'priority', sorter: (a, b) => b.priority - a.priority },
  { title: 'Trạng thái', key: 'status' },
  { title: 'Thao tác', key: 'action' }
]

</script>

<style scoped>
.promotion-page { padding: 16px; }
.filter-label { display: block; margin-bottom: 6px; font-weight: 500;}
.countdown { font-size: 12px; color: #999; }
.countdown.red { color: #ff4d4f; }
</style>
