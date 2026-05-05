<script setup>
import { ref, computed, onMounted } from "vue"
import { message } from "ant-design-vue"
import { getPriceGroupBoard, saveGroupPrice } from "@/api/prices"

/* ================= STATE ================= */

const data = ref([])
const loading = ref(false)
const keyword = ref("")
const viewMode = ref("GROUP") // GROUP | FINAL

/* ================= FORMAT ================= */

const formatPrice = (price) => {
  if (!price) return "0 ₫"
  return new Intl.NumberFormat("vi-VN").format(price) + " ₫"
}

/* ================= PRICE HELPERS ================= */

const getGroupItem = (record, group) =>
  record.groupPrices?.find(g => g.loaiKhach === group)

const getGroupPrice = (record, group) =>
  getGroupItem(record, group)?.price ?? record.basePrice

const getFinalPrice = (record, group) =>
  getGroupItem(record, group)?.finalPrice ?? getGroupPrice(record, group)

const hasPromotion = (record, group) =>
  getFinalPrice(record, group) < getGroupPrice(record, group)

/* ================= FILTER ================= */

const filteredData = computed(() => {
  const k = keyword.value?.toLowerCase()

  if (!k) return data.value

  return data.value.filter(p =>
    p.productName?.toLowerCase().includes(k) ||
    p.sku?.toLowerCase().includes(k) ||
    p.colorway?.toLowerCase().includes(k) ||
    String(p.size).includes(k)
  )
})

/* ================= API ================= */

const loadData = async () => {
  try {
    loading.value = true
    const res = await getPriceGroupBoard()

    data.value = Array.isArray(res.data)
      ? res.data
      : res.data?.content || []

  } catch {
    message.error("Không tải được dữ liệu")
  } finally {
    loading.value = false
  }
}
/* ================= XEM CHI TIẾT ================= */

const detailVisible = ref(false)
const detailRecord = ref(null)

const openDetail = (record) => {
  detailRecord.value = record
  detailVisible.value = true
}

/* ================= INIT ================= */

onMounted(loadData)
/* ================= MODAL ================= */

const modalVisible = ref(false)
const editingRecord = ref(null)
const editingGroup = ref(null)
const discountAmount = ref(0)
const formatDate = (d) => {
if(!d) return '-'
return new Date(d).toLocaleString('vi-VN')
}
const activePromotions = computed(() => {

  if(!detailRecord.value?.promotions) return []

  const now = new Date()

  const valid = detailRecord.value.promotions.filter(p => {

    const start = new Date(p.startTime)
    const end = new Date(p.endTime)

    return p.active && now >= start && now <= end
  })

  if(!valid.length) return []

  // lấy khuyến mãi giảm nhiều nhất
  const best = valid.reduce((max,p) =>
    p.discountValue > max.discountValue ? p : max
  )

  return [best]

})

/* ================= EDIT ================= */

const openEdit = (record, group) => {
  editingRecord.value = record
  editingGroup.value = group

  const currentPrice = getGroupPrice(record, group)

  discountAmount.value =
    record.basePrice - currentPrice > 0
      ? record.basePrice - currentPrice
      : 0

  modalVisible.value = true
}

const finalPrice = computed(() => {
  if (!editingRecord.value) return 0

  const result =
    editingRecord.value.basePrice - discountAmount.value

  return result > 0 ? result : 0
})

const savePrice = async () => {

  if (finalPrice.value < 0) {
    return message.error("Số tiền giảm không được lớn hơn giá gốc");
  }

  try {
    loading.value = true;

    await saveGroupPrice(
      editingRecord.value.variantId,
      editingGroup.value,
      discountAmount.value
    );

    message.success("Cập nhật mức ưu đãi thành công");
    modalVisible.value = false;
    await loadData();

  } catch (e) {
    message.error(e.response?.data?.message || "Lỗi cập nhật giá");
  } finally {
    loading.value = false;
  }
}


onMounted(loadData)
</script>

<template>
<div>

<h2>Quản lý giá theo nhóm</h2>

<a-radio-group v-model:value="viewMode" style="margin-bottom:16px">
<a-radio-button value="GROUP">Theo nhóm khách</a-radio-button>
<a-radio-button value="FINAL">Giá cuối theo KM</a-radio-button>
</a-radio-group>

<a-input
v-model:value="keyword"
placeholder="Tìm tên, SKU, màu, size..."
allow-clear
style="width:260px; margin-bottom:16px"
/>

<a-table
:data-source="filteredData"
row-key="variantId"
bordered
:loading="loading"
:pagination="{ pageSize:5, showSizeChanger:false }"
>

<a-table-column title="Sản phẩm" dataIndex="productName" />
<a-table-column title="SKU" dataIndex="sku" />
<a-table-column title="Màu" dataIndex="colorway" />
<a-table-column title="Size" dataIndex="size" />

<a-table-column title="Giá gốc">
<template #default="{record}">
<span style="color:#52c41a;font-weight:600">
{{ formatPrice(record.basePrice) }}
</span>
</template>
</a-table-column>

<!-- VIP -->
<a-table-column title="VIP">
<template #default="{record}">

<template v-if="viewMode==='GROUP'">
<a-tag color="purple">
👑 {{ formatPrice(getGroupPrice(record,'VIP')) }}
</a-tag>
</template>

<template v-else>

<div v-if="hasPromotion(record,'VIP')">

<div style="text-decoration:line-through;color:#999">
{{ formatPrice(getGroupPrice(record,'VIP')) }}
</div>

<div style="color:#ff4d4f;font-weight:600">
{{ formatPrice(getFinalPrice(record,'VIP')) }}
</div>

</div>

<div v-else>
{{ formatPrice(getGroupPrice(record,'VIP')) }}
</div>

</template>

</template>
</a-table-column>

<!-- THUONG -->
<a-table-column title="THƯỜNG">
<template #default="{record}">

<template v-if="viewMode==='GROUP'">
<a-tag color="blue">
{{ formatPrice(getGroupPrice(record,'THUONG')) }}
</a-tag>
</template>

<template v-else>

<div v-if="hasPromotion(record,'THUONG')">

<div style="text-decoration:line-through;color:#999">
{{ formatPrice(getGroupPrice(record,'THUONG')) }}
</div>

<div style="color:#ff4d4f;font-weight:600">
{{ formatPrice(getFinalPrice(record,'THUONG')) }}
</div>

</div>

<div v-else>
{{ formatPrice(getGroupPrice(record,'THUONG')) }}
</div>

</template>

</template>
</a-table-column>

<a-table-column title="Thao tác">
<template #default="{record}">
<a-space>

<template v-if="viewMode==='GROUP'">
<a-button type="link" @click="openEdit(record,'VIP')">
Sửa VIP
</a-button>

<a-button type="link" @click="openEdit(record,'THUONG')">
Sửa Thường
</a-button>
</template>

<a-button
v-else
type="primary"
ghost
shape="round"
@click="openDetail(record)"
>
Xem chi tiết
</a-button>

</a-space>
</template>
</a-table-column>

</a-table>

<!-- MODAL -->

<a-modal
  v-model:open="modalVisible"
  :title="`Thiết lập mức giảm cho nhóm ${editingGroup}`"
  @ok="savePrice"
  :confirmLoading="loading"
  okText="Xác nhận lưu"
  cancelText="Hủy"
>
  <p><b>Sản phẩm:</b> {{ editingRecord?.productName }}</p>

  <a-divider />

  <p>
    <b>Giá gốc hiện tại:</b>
    <span style="color:#52c41a; font-weight: bold">
      {{ formatPrice(editingRecord?.basePrice) }}
    </span>
  </p>

  <a-form-item label="Số tiền giảm (Ưu đãi riêng)">
    <a-input-number
      v-model:value="discountAmount"
      style="width:100%"
      :min="0"
      :max="editingRecord?.basePrice"
      :step="1000"
      :formatter="v => v ? v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₫' : ''"
      :parser="v => Number(v.replace(/[^\d]/g,''))"
    />
  </a-form-item>

  <p>
    <b>Giá hiển thị cho khách {{ editingGroup }}:</b>
    <span style="color:red; font-size:18px; font-weight: bold">
      {{ formatPrice(finalPrice) }}
    </span>
    <br/>
    <small style="color: #999">(Giá này sẽ tự động thay đổi nếu giá gốc sản phẩm thay đổi)</small>
  </p>
</a-modal>
<!-- DRAWER XEM CHI TIẾT -->

<a-drawer
v-model:open="detailVisible"
title="Chi tiết giá sản phẩm"
width="600"
>

<div v-if="detailRecord" class="product-detail">

<!-- PRODUCT HEADER -->
<div class="product-header">

<a-image
:src="detailRecord.image ? `http://localhost:8080/${detailRecord.image}` : '/no-image.png'"
width="80"
height="80"
style="object-fit:cover;border-radius:8px"
/>

<div class="product-info">

<div class="product-name">
{{ detailRecord.productName }}
</div>

<div class="product-variant">
{{ detailRecord.colorway }} • Size {{ detailRecord.size }}
</div>

<div class="product-sku">
SKU: {{ detailRecord.sku }}
</div>

</div>

</div>
<a-descriptions title="Thông tin sản phẩm" :column="1" bordered size="small">

<a-descriptions-item label="Tên sản phẩm">
{{ detailRecord.productName }}
</a-descriptions-item>

<a-descriptions-item label="SKU">
{{ detailRecord.productSku }}
</a-descriptions-item>


<a-descriptions-item label="Thương hiệu">
{{ detailRecord.brand || '-' }}
</a-descriptions-item>

<a-descriptions-item label="Đối tượng">
{{ detailRecord.gender || '-' }}
</a-descriptions-item>

<a-descriptions-item label="Chất liệu / Model">
{{ detailRecord.model || '-' }}
</a-descriptions-item>

<a-descriptions-item label="Năm phát hành">
{{ detailRecord.releaseYear || '-' }}
</a-descriptions-item>

<a-descriptions-item label="Mô tả">
{{ detailRecord.description || '-' }}
</a-descriptions-item>

</a-descriptions>

<a-divider />



<!-- PRICE BLOCK -->
<div class="price-section">

<!-- BASE PRICE -->
<div class="price-row">

<div class="price-label">
Giá gốc
</div>

<div class="price-value base">
{{ formatPrice(detailRecord.basePrice) }}
</div>

</div>

<!-- VIP -->
<div class="price-row">

<div class="price-label">
Giá VIP
</div>

<div class="price-box">

<div
v-if="hasPromotion(detailRecord,'VIP')"
class="old-price"
>
{{ formatPrice(getGroupPrice(detailRecord,'VIP')) }}
</div>

<div class="new-price">
{{ formatPrice(getFinalPrice(detailRecord,'VIP')) }}
</div>

</div>

</div>

<!-- NORMAL -->
<div class="price-row">

<div class="price-label">
Giá Thường
</div>

<div class="price-box">

<div
v-if="hasPromotion(detailRecord,'THUONG')"
class="old-price"
>
{{ formatPrice(getGroupPrice(detailRecord,'THUONG')) }}
</div>

<div class="new-price">
{{ formatPrice(getFinalPrice(detailRecord,'THUONG')) }}
</div>

</div>

</div>

</div>

<!-- PROMOTION INFO -->
<!-- PROMOTION INFO -->
<a-divider v-if="detailRecord.promotions?.length" />

<div
v-if="activePromotions.length"

class="promotion-section"
>

<div class="promotion-title">
Khuyến mãi áp dụng
</div>

<a-card
v-for="p in activePromotions"
:key="p.id"
size="small"
style="margin-bottom:10px"
>

<a-descriptions :column="2" size="small" bordered>

<a-descriptions-item label="Tên">
{{ p.name }}
</a-descriptions-item>

<a-descriptions-item label="Mã">
{{ p.code }}
</a-descriptions-item>

<a-descriptions-item label="Giảm giá">
<a-tag color="red">
{{ p.discountValue }}%
</a-tag>
</a-descriptions-item>

<a-descriptions-item label="Ưu tiên">
<a-badge :count="p.priority" />
</a-descriptions-item>

<a-descriptions-item label="Thời gian">
{{ formatDate(p.startTime) }}
→
{{ formatDate(p.endTime) }}
</a-descriptions-item>

<a-descriptions-item label="Trạng thái">
<a-tag color="green" v-if="p.active">Hoạt động</a-tag>
<a-tag v-else>Ngừng</a-tag>
</a-descriptions-item>

</a-descriptions>

</a-card>

</div>

</div>

</a-drawer>
</div>
</template>
<style>
.product-detail{
display:flex;
flex-direction:column;
gap:16px;
}

.product-header{
display:flex;
gap:16px;
align-items:center;
}

.product-name{
font-size:16px;
font-weight:600;
}

.product-variant{
font-size:13px;
color:#888;
}

.product-sku{
font-size:12px;
color:#1890ff;
}

.price-section{
display:flex;
flex-direction:column;
gap:12px;
}

.price-row{
display:flex;
justify-content:space-between;
align-items:center;
padding:8px 0;
border-bottom:1px solid #f0f0f0;
}

.price-label{
font-weight:500;
color:#666;
}

.price-box{
text-align:right;
}

.base{
color:#52c41a;
font-weight:600;
}

.old-price{
text-decoration:line-through;
color:#999;
font-size:13px;
}

.new-price{
color:#ff4d4f;
font-weight:600;
font-size:16px;
}

.promotion-section{
display:flex;
flex-direction:column;
gap:8px;
}

.promotion-title{
font-weight:600;
}
</style>
