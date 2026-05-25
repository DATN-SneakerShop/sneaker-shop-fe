<template>
  <div class="create-order-page">
    <a-page-header
      title="Tạo đơn hàng"
      sub-title=""
      @back="router.back()"
      class="page-header"
    />

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :xl="9">
        <a-card class="panel-card" :bordered="false">
          <template #title>
            <div class="card-title">Thông tin đơn hàng</div>
          </template>

          <a-form layout="vertical">
            <a-form-item label="Khách hàng">
              <a-select
                v-model:value="form.customerId"
                show-search
                allow-clear
                placeholder="Chọn khách hàng (bỏ trống = khách lẻ)"
                :options="customerOptions"
                :filter-option="filterCustomer"
              />

              <a-alert
                v-if="selectedCustomerRank && selectedCustomerRank.discountPercent > 0"
                :message="`👑 Khách hàng ${selectedCustomerRank.name}: Tự động giảm ${selectedCustomerRank.discountPercent}% trên tổng đơn (Chưa tính phí ship)`"
                type="success"
                show-icon
                style="margin-top: 10px;"
              />
            </a-form-item>

            <a-row :gutter="12">
              <a-col :span="12">
                <a-form-item label="Kênh bán" required>
                  <a-select
                    v-model:value="form.channel"
                    :options="channelOptions"
                  />
                </a-form-item>
              </a-col>

              <a-col :span="12">
                <a-form-item label="Thanh toán" required>
                  <a-select
                    v-model:value="form.paymentMethod"
                    :options="paymentMethodOptions"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <a-alert
              v-if="isOffline"
              type="info"
              show-icon
              class="mb-16"
              message="Đơn bán tại cửa hàng"
              description="Đơn tại cửa hàng không áp dụng phí ship. Hệ thống sẽ tự đặt phí ship = 0."
            />


            <a-card v-if="!isOffline" size="small" class="online-info-card" :bordered="false">
              <template #title>Thông tin người đặt</template>

              <a-form-item label="Họ tên người đặt" required>
                <a-input v-model:value="form.ordererName" placeholder="Họ tên người đặt" />
              </a-form-item>

              <a-form-item label="Email">
                <a-input v-model:value="form.ordererEmail" placeholder="Nhập email" />
              </a-form-item>

              <a-form-item label="Số điện thoại" required>
                <a-input v-model:value="form.ordererPhone" placeholder="Nhập số điện thoại" />
              </a-form-item>
            </a-card>

            <a-card v-if="!isOffline" size="small" class="online-info-card" :bordered="false">
              <template #title>Thông tin giao hàng</template>

              <a-form-item>
                <a-checkbox v-model:checked="form.useOrdererAsReceiver">
                  Lấy thông tin người đặt làm người nhận (Họ tên & SĐT)
                </a-checkbox>
              </a-form-item>

              <a-form-item label="Người nhận" required>
                <a-input
                  v-model:value="form.receiverName"
                  placeholder="Nhập tên người nhận"
                  :disabled="form.useOrdererAsReceiver"
                />
              </a-form-item>

              <a-form-item label="Số điện thoại nhận hàng" required>
                <a-input
                  v-model:value="form.receiverPhone"
                  placeholder="Nhập số điện thoại người nhận"
                  :disabled="form.useOrdererAsReceiver"
                />
              </a-form-item>

              <a-form-item label="Nhãn địa chỉ">
                <a-input v-model:value="form.addressLabel" placeholder="Ví dụ: Nhà riêng, Công ty..." />
              </a-form-item>

              <a-form-item label="Tỉnh / Thành phố" required>
                <a-select
                  v-model:value="selectedProvinceCode"
                  show-search
                  allow-clear
                  :loading="addressLoading"
                  :options="provinceOptions"
                  :filter-option="filterAddressOption"
                  placeholder="Chọn tỉnh / thành phố"
                  @change="handleProvinceChange"
                />
              </a-form-item>

              <a-form-item label="Quận / Huyện" required>
                <a-select
                  v-model:value="selectedDistrictCode"
                  show-search
                  allow-clear
                  :disabled="!selectedProvinceCode"
                  :options="districtOptions"
                  :filter-option="filterAddressOption"
                  placeholder="Chọn quận / huyện"
                  @change="handleDistrictChange"
                />
              </a-form-item>

              <a-form-item label="Phường / Xã" required>
                <a-select
                  v-model:value="selectedWardCode"
                  show-search
                  allow-clear
                  :disabled="!selectedDistrictCode"
                  :options="wardOptions"
                  :filter-option="filterAddressOption"
                  placeholder="Chọn phường / xã"
                  @change="handleWardChange"
                />
              </a-form-item>

              <a-form-item label="Địa chỉ chi tiết" required>
                <a-input v-model:value="form.shippingDetailAddress" placeholder="Số nhà, ngõ ngách, tên đường..." />
              </a-form-item>
            </a-card>

           <a-row :gutter="12">
              <a-col :span="12">
                <a-form-item label="Phí ship">
                  <a-input-number
                    v-model:value="form.shippingFee"
                    style="width: 100%"
                    :min="0"
                    :disabled="isOffline"
                    :placeholder="isOffline ? 'Bán tại cửa hàng' : 'Nhập phí ship'"
                    @change="normalizeNumberFields"
                  />
                </a-form-item>
              </a-col>

              <a-col :span="12">
                <a-form-item label="Mã Miễn Phí Vận Chuyển">
                  <a-select
                    v-model:value="form.freeShipVoucherId"
                    placeholder="Chọn mã Free Ship"
                    allow-clear
                    :options="availableFreeShips"
                    :disabled="isOffline || form.shippingFee === 0"
                  >
                    <template #option="{ label, disabled }">
                      <div :style="disabled ? 'color: #ccc; cursor: not-allowed' : ''">
                        {{ label }}
                      </div>
                    </template>
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>

            <a-form-item label="Giảm giá nhập tay">
              <a-input-number
                v-model:value="form.discountAmount"
                style="width: 100%"
                :min="0"
                placeholder="Nhập số tiền giảm"
                @change="normalizeNumberFields"
              />
            </a-form-item>

            <a-form-item label="Ghi chú">
              <a-textarea
                v-model:value="form.note"
                :rows="4"
                placeholder="Ví dụ: khách muốn giao giờ hành chính, kiểm tra hàng trước khi giao..."
              />
            </a-form-item>

            <a-col :span="12">
  <a-form-item label="Voucher">
    <a-select
      v-model:value="form.voucherId"
      placeholder="Chọn Voucher"
      allow-clear
      :options="availableDiscountVouchers"
    >
      <template #option="{ label, disabled, minOrderValue }">
        <div :style="disabled ? 'color: #ccc; cursor: not-allowed' : ''">
          {{ label }}
          <div v-if="disabled" style="font-size: 11px; color: #ff4d4f">
            (Chưa đủ đơn tối thiểu {{ formatMoney(minOrderValue) }})
          </div>
        </div>
      </template>
    </a-select>
  </a-form-item>
</a-col>
          </a-form>
        </a-card>

        <a-card class="panel-card summary-card" :bordered="false">
          <template #title>
            <div class="card-title">Tổng thanh toán</div>
          </template>

          <div class="summary-list">
            <div class="summary-row">
              <span>Tạm tính</span>
              <b>{{ formatMoney(summary.subtotal) }}</b>
            </div>

            <div class="summary-row" v-if="summary.rankDiscount > 0">
              <span>Ưu đãi hạng ({{ selectedCustomerRank?.name }})</span>
              <b class="text-danger">- {{ formatMoney(summary.rankDiscount) }}</b>
            </div>

            <div class="summary-row">
              <span>Giảm giá Voucher / Nhập tay</span>
              <b class="text-danger">- {{ formatMoney(summary.discount) }}</b>
            </div>

            <div class="summary-row">
              <span>Phí ship</span>
              <b>{{ formatMoney(summary.shipping) }}</b>
            </div>

            <div class="summary-total">
              <span>Tổng cộng</span>
              <span>{{ formatMoney(summary.total) }}</span>
            </div>
          </div>

          <a-divider />

          <a-space wrap>
            <a-button type="primary" size="large" :loading="saving" @click="handleCreate">
              Tạo đơn
            </a-button>
            <a-button size="large" @click="router.push('/orders')">
              Quay lại danh sách
            </a-button>
          </a-space>
        </a-card>
      </a-col>

      <a-col :xs="24" :xl="15">
        <a-card class="panel-card" :bordered="false">
          <template #title>
            <div class="card-title">Sản phẩm trong đơn</div>
          </template>

          <template #extra>
            <a-space wrap>
              <a-button type="primary" @click="openAddItemModal">
                + Thêm sản phẩm
              </a-button>
              <a-button @click="openQuickAdd">
                + Nhập nhanh Variant ID
              </a-button>
            </a-space>
          </template>

          <div v-if="items.length" class="order-items-topbar">
            <div class="items-count">
              {{ items.length }} sản phẩm trong đơn
            </div>
          </div>

          <a-table
            :dataSource="items"
            :columns="itemColumns"
            rowKey="_k"
            :pagination="false"
            size="middle"
            :scroll="{ x: 1050 }"
            class="order-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'image'">
                <img
                  :src="record.thumbnail || fallbackImage"
                  alt="product"
                  class="variant-thumb"
                  @error="onImgError"
                />
              </template>

              <template v-if="column.key === 'name'">
                <div class="product-cell">
                  <div class="product-name">{{ record.productNameSnapshot }}</div>
                  <div class="product-sub">SKU: {{ record.skuSnapshot }}</div>
                </div>
              </template>

              <template v-if="column.key === 'stock'">
                <a-tag :color="Number(record.stock || 0) > 0 ? 'green' : 'orange'">
                  {{ record.stock ?? 0 }}
                </a-tag>
              </template>

              <template v-if="column.key === 'qty'">
                <a-input-number
                  v-model:value="record.quantity"
                  :min="1"
                  :max="maxQty(record)"
                  style="width: 84px"
                  @change="() => handleQtyChange(record)"
                />
              </template>

              <template v-if="column.key === 'unitPrice'">
                <b>{{ formatMoney(record.unitPrice) }}</b>
              </template>

              <template v-if="column.key === 'line'">
                <b class="line-total">{{ formatMoney(lineTotal(record)) }}</b>
              </template>

              <template v-if="column.key === 'action'">
                <a-button type="link" danger @click="removeItem(record._k)">
                  Xóa
                </a-button>
              </template>
            </template>
          </a-table>

          <a-empty
            v-if="items.length === 0"
            description="Chưa có sản phẩm nào trong đơn"
            class="empty-box"
          />

          <div v-if="promotions.length" class="promo-box">
            <div class="promo-title">Khuyến mãi áp dụng</div>

            <div
              v-for="promo in promotions"
              :key="promo.promotionId"
              class="promo-item"
            >
              <div class="promo-name">
                🔥 {{ promo.promotionName }}
              </div>
              <div class="promo-desc">
                Giảm <b style="color: #ff4d4f">{{ promo.percent }}%</b>
                (tương đương <b style="color: #ff4d4f">{{ formatMoney(promo.discountAmount) }}</b>) cho:
                {{ promo.products.join(', ') }}
              </div>
            </div>
          </div>

          <div v-if="groupDiscounts.length" class="promo-box">
            <div class="promo-title">Giảm giá theo nhóm khách</div>

            <div
              v-for="g in groupDiscounts"
              :key="g.productName + g.type"
              class="promo-item"
            >
              <div class="promo-name">{{ g.productName }}</div>
              <div class="promo-desc">
                {{ g.type }}:
                {{ formatMoney(g.originalPrice) }}
                →
                <b>{{ formatMoney(g.discount) }}</b>
                <span class="text-danger">(-{{ formatMoney(g.finalPrice) }})</span>
              </div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-modal
      v-model:open="modal.open"
      title="Thêm sản phẩm vào đơn"
      width="1120px"
      :footer="null"
      class="add-product-modal"
    >
      <div class="add-product-layout">
        <div class="product-pane">
          <div class="pane-header">
            <a-input-search
              v-model:value="modal.search"
              placeholder="Tìm theo tên sản phẩm..."
              allow-clear
              @search="searchProducts"
            />
          </div>

          <div class="pane-body product-list-scroll">
            <div
              v-for="item in modal.products"
              :key="item.id"
              class="product-list-item"
              :class="{ active: modal.selectedProduct?.id === item.id }"
              @click="selectProduct(item)"
            >
              <img
                :src="getProductThumb(item)"
                alt="product"
                class="list-thumb"
                @error="onImgError"
              />

              <div class="product-list-content">
                <div class="product-list-name">
                  {{ item.name || item.tenSanPham || ('Product #' + item.id) }}
                </div>
                <div class="product-list-sku">
                  SKU: {{ item.sku || '-' }}
                </div>
              </div>
            </div>

            <a-empty
              v-if="!modal.loading && modal.products.length === 0"
              description="Không có sản phẩm"
            />
          </div>
        </div>

        <div class="variant-pane">
          <div v-if="!modal.selectedProduct" class="variant-empty">
            <a-empty description="Chọn một sản phẩm để xem các biến thể" />
          </div>

          <div v-else>
            <div class="selected-product-box">
              <img
                :src="getProductThumb(modal.selectedProduct)"
                alt="selected-product"
                class="selected-thumb"
                @error="onImgError"
              />

              <div class="selected-content">
                <div class="selected-name">
                  {{
                    modal.selectedProduct.name ||
                    modal.selectedProduct.tenSanPham ||
                    `Product#${modal.selectedProduct.id}`
                  }}
                </div>
                <div class="selected-sub">
                  SKU: {{ modal.selectedProduct.sku || '-' }}
                </div>
              </div>
            </div>

            <div class="variant-section-title">Danh sách variants</div>

            <a-spin :spinning="modal.loading">
              <div v-if="modal.variants.length" class="variant-grid">
                <div
                  v-for="record in modal.variants"
                  :key="record.id"
                  class="variant-card"
                >
                  <img
                    :src="getVariantImage(record)"
                    alt="variant"
                    class="variant-card-thumb"
                    @error="onImgError"
                  />

                  <div class="variant-card-body">
                    <div class="variant-id">Variant #{{ record.id }}</div>

                    <div class="variant-meta">
                      <span>Size: <b>{{ record.size || '-' }}</b></span>
                      <span>Màu: <b>{{ record.colorway || '-' }}</b></span>
                    </div>

                    <div class="variant-bottom">
                      <a-tag :color="Number(record.stock || 0) > 0 ? 'green' : 'red'">
                        Tồn: {{ record.stock ?? 0 }}
                      </a-tag>

                      <div class="variant-price">
                        {{ formatMoney(record.salePrice ?? record.price ?? record.giaBan) }}
                      </div>
                    </div>

                    <a-button
                      block
                      type="primary"
                      :disabled="Number(record.stock || 0) <= 0"
                      @click="addVariant(record)"
                    >
                      {{ Number(record.stock || 0) > 0 ? 'Thêm vào đơn' : 'Hết hàng' }}
                    </a-button>
                  </div>
                </div>
              </div>

              <a-empty
                v-else
                description="Sản phẩm này chưa có variant"
              />
            </a-spin>
          </div>
        </div>
      </div>
    </a-modal>

    <a-modal
      v-model:open="quick.open"
      title="Nhập nhanh Variant"
      @ok="quickAdd"
      :confirmLoading="quick.loading"
      ok-text="Thêm vào đơn"
      cancel-text="Đóng"
    >
      <a-form layout="vertical">
        <a-form-item label="Variant ID" required>
          <a-input-number
            v-model:value="quick.variantId"
            style="width:100%"
            :min="1"
          />
        </a-form-item>

        <a-form-item label="Tên sản phẩm (snapshot)" required>
          <a-input v-model:value="quick.productNameSnapshot" />
        </a-form-item>

        <a-form-item label="SKU (snapshot)" required>
          <a-input v-model:value="quick.skuSnapshot" />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Số lượng" required>
              <a-input-number
                v-model:value="quick.quantity"
                style="width:100%"
                :min="1"
              />
            </a-form-item>
          </a-col>

          <a-col :span="12">
            <a-form-item label="Đơn giá" required>
              <a-input-number
                v-model:value="quick.unitPrice"
                style="width:100%"
                :min="0"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getErrorMessage } from '@/utils/error'
import api from '@/api/axios'
import { getProducts, getProductDetail } from '@/api/product.api'
import { createOrder } from '@/api/order.api'
import { getCustomerRanks } from '@/api/customer'
import {
  fetchVietnamProvinces,
  fetchVietnamDistricts,
  fetchVietnamWards,
} from '@/utils/vietnamAddress'


const ranks = ref([])

const selectedCustomerRank = computed(() => {
  if (!form.customerId) return null;
  const customer = customers.value.find(c => c.id === form.customerId);
  if (!customer || !customer.loaiKhach) return null;

  // Đối chiếu tên Hạng của khách với bảng cấu hình Hạng để lấy được % giảm giá
  return ranks.value.find(r => r.name === customer.loaiKhach) || null;
})

const router = useRouter()

const API_FILE_BASE = 'http://localhost:8080/'
const fallbackImage = 'https://via.placeholder.com/48x48?text=No+Img'

const saving = ref(false)

const addressLoading = ref(false)
const vietnamAdministrativeUnits = ref([])
const selectedProvinceCode = ref(null)
const selectedDistrictCode = ref(null)
const selectedWardCode = ref(null)

const form = reactive({
  customerId: null,
  channel: 'OFFLINE',
  paymentMethod: 'CASH',
  shippingFee: 0,
  discountAmount: 0,
  note: '',
  voucherId: null,
  freeShipVoucherId: null,
  ordererName: '',
  ordererEmail: '',
  ordererPhone: '',
  useOrdererAsReceiver: true,
  receiverName: '',
  receiverPhone: '',
  addressLabel: '',
  shippingProvince: '',
  shippingDistrict: '',
  shippingWard: '',
  shippingDetailAddress: '',
  shippingAddressLine: ''
})

const items = reactive([])
let seq = 1

const promotions = ref([])
const groupDiscounts = ref([])

const selectedDiscount = ref(null)
const customerDiscountOptions = ref([])

const channelOptions = [
  { value: 'OFFLINE', label: 'Cửa hàng' },
  { value: 'ONLINE', label: 'Online' },
]

const paymentMethodOptions = computed(() => {
  if (form.channel === 'ONLINE') {
    return [
      { value: 'COD', label: 'COD' },
      { value: 'BANK_TRANSFER', label: 'Chuyển khoản' },
    ]
  }
  return [
    { value: 'CASH', label: 'Tiền mặt tại quầy' },
    { value: 'BANK_TRANSFER', label: 'Chuyển khoản' },
    { value: 'COD', label: 'COD' },
  ]
})

const isOffline = computed(() => form.channel === 'OFFLINE')

const provinceOptions = computed(() =>
  vietnamAdministrativeUnits.value.map((province) => ({
    value: province.code,
    label: province.name,
  }))
)

const selectedProvince = computed(() =>
  vietnamAdministrativeUnits.value.find((province) => province.code === selectedProvinceCode.value) || null
)

const districtOptions = computed(() =>
  (selectedProvince.value?.districts || []).map((district) => ({
    value: district.code,
    label: district.name,
  }))
)

const selectedDistrict = computed(() =>
  (selectedProvince.value?.districts || []).find((district) => district.code === selectedDistrictCode.value) || null
)

const wardOptions = computed(() =>
  (selectedDistrict.value?.wards || []).map((ward) => ({
    value: ward.code,
    label: ward.name,
  }))
)

const filterAddressOption = (input, option) =>
  String(option?.label || '')
    .toLowerCase()
    .includes(String(input || '').toLowerCase())

const resetDistrictAndWard = () => {
  selectedDistrictCode.value = null
  selectedWardCode.value = null
  form.shippingDistrict = ''
  form.shippingWard = ''
}

const handleProvinceChange = async (value, option) => {
  form.shippingProvince = option?.label || ''
  resetDistrictAndWard()

  if (!value) return
  try {
    addressLoading.value = true
    const province = vietnamAdministrativeUnits.value.find((item) => String(item.code) === String(value))
    const districts = await fetchVietnamDistricts(value)
    if (province) province.districts = districts

    if (districts.length === 1 && districts[0].source === 'NEW_2025') {
      selectedDistrictCode.value = districts[0].code
      form.shippingDistrict = districts[0].name
      await handleDistrictChange(districts[0].code, { label: districts[0].name })
    }
  } catch {
    message.warning('Không tải được dữ liệu Quận/Huyện của tỉnh đã chọn.')
  } finally {
    addressLoading.value = false
  }
}

const handleDistrictChange = async (value, option) => {
  form.shippingDistrict = option?.label || ''
  selectedWardCode.value = null
  form.shippingWard = ''

  if (!selectedProvinceCode.value || !value) return
  try {
    addressLoading.value = true
    const district = selectedDistrict.value
    const wards = await fetchVietnamWards(selectedProvinceCode.value, value)
    if (district) district.wards = wards
  } catch {
    message.warning('Không tải được dữ liệu Phường/Xã mới nhất.')
  } finally {
    addressLoading.value = false
  }
}

const handleWardChange = (value, option) => {
  form.shippingWard = option?.label || ''
}

const fetchVietnamAdministrativeUnits = async () => {
  addressLoading.value = true
  try {
    vietnamAdministrativeUnits.value = await fetchVietnamProvinces()
  } catch {
    vietnamAdministrativeUnits.value = []
    message.warning('Không tải được dữ liệu Tỉnh/Huyện/Xã Việt Nam mới nhất. Vui lòng kiểm tra kết nối mạng.')
  } finally {
    addressLoading.value = false
  }
}

const syncReceiverFromOrderer = () => {
  if (!form.useOrdererAsReceiver) return
  form.receiverName = form.ordererName
  form.receiverPhone = form.ordererPhone
}

watch(
  () => [form.useOrdererAsReceiver, form.ordererName, form.ordererPhone],
  syncReceiverFromOrderer,
  { immediate: true }
)

const itemColumns = [
  { title: 'Ảnh', key: 'image', width: 72 },
  { title: 'Variant ID', dataIndex: 'variantId', key: 'variantId', width: 100 },
  { title: 'Sản phẩm', key: 'name', width: 280 },
  { title: 'Tồn kho', dataIndex: 'stock', key: 'stock', width: 100 },
  { title: 'SL', key: 'qty', width: 100 },
  { title: 'Đơn giá', key: 'unitPrice', width: 140 },
  { title: 'Thành tiền', key: 'line', width: 150 },
  { title: '', key: 'action', width: 80, fixed: 'right' },
]

const customers = ref([])
const customerOptions = computed(() =>
  customers.value.map((c) => ({
    value: c.id,
    label: `${c.ten || c.name || 'Khách'} - ${c.loaiKhach || c.customerType || ''} (${c.email || ''})`
  }))
)

const filterCustomer = (input, option) =>
  String(option?.label || '')
    .toLowerCase()
    .includes(String(input || '').toLowerCase())

const modal = reactive({
  open: false,
  search: '',
  loading: false,
  products: [],
  selectedProduct: null,
  variants: [],
})

const quick = reactive({
  open: false,
  loading: false,
  variantId: null,
  quantity: 1,
  unitPrice: 0,
  skuSnapshot: '',
  productNameSnapshot: '',
})

const normalizeNumber = (value, min = 0) => {
  const n = Number(value)
  if (Number.isNaN(n)) return min
  return n < min ? min : n
}

const normalizeNumberFields = () => {
  if (isOffline.value) {
    form.shippingFee = 0
  } else {
    form.shippingFee = normalizeNumber(form.shippingFee, 0)
  }

  form.discountAmount = normalizeNumber(form.discountAmount, 0)
}

const lineTotal = (r) => {
  const qty = normalizeNumber(r.quantity, 0)
  const price = normalizeNumber(r.unitPrice, 0)
  const disc = normalizeNumber(r.lineDiscountAmount, 0)
  return Math.max(0, price * qty - disc)
}

const summary = computed(() => {
  const subtotal = items.reduce((s, it) => s + lineTotal(it), 0)
  const shippingFee = isOffline.value ? 0 : normalizeNumber(form.shippingFee || 0, 0)

  // 1. TÍNH TOÁN FREE SHIP
  let shippingDiscount = 0;
  const selectedFS = vouchers.value.find(v => v.id === form.freeShipVoucherId)
  if (selectedFS && !selectedFS.disabled) {
    shippingDiscount = Math.min(shippingFee, selectedFS.value)
  }

  // 2. TÍNH TOÁN VOUCHER GIẢM HÓA ĐƠN
  let productDiscount = 0;
  const selectedV = vouchers.value.find(v => v.id === form.voucherId)
  if (selectedV && !selectedV.disabled) {
    if (selectedV.type === 'PERCENT') {
      productDiscount = (subtotal * selectedV.value) / 100
      if (selectedV.maxDiscount && productDiscount > selectedV.maxDiscount) {
        productDiscount = selectedV.maxDiscount
      }
    } else {
      productDiscount = selectedV.value
    }
  }

  // 🔥 3. TÍNH TOÁN ƯU ĐÃI HẠNG KHÁCH (Dựa vào % của Hạng đó)
  let rankDiscountAmount = 0;
  if (selectedCustomerRank.value && selectedCustomerRank.value.discountPercent > 0) {
    rankDiscountAmount = (subtotal * selectedCustomerRank.value.discountPercent) / 100;
  }

  // 4. Ưu đãi nhập tay
  const manualDiscount = normalizeNumber(form.discountAmount || 0, 0)

  // TỔNG TIỀN ĐƯỢC GIẢM (Voucher + Nhập tay) - Không cộng rank vào đây để hiển thị tách biệt ở giao diện
  const extraDiscount = productDiscount + manualDiscount;

  // TỔNG TIỀN PHẢI TRẢ = (Tạm tính - Tiền giảm hạng - Tiền giảm khác) + Tiền Ship
  const finalTotal = Math.max(0, subtotal - rankDiscountAmount - extraDiscount + Math.max(0, shippingFee - shippingDiscount))

  return {
    subtotal,
    rankDiscount: rankDiscountAmount, // Trả ra riêng để hiển thị ở html
    discount: extraDiscount,
    shipping: shippingFee,
    total: finalTotal
  }
})
const formatMoney = (v) => {
  if (v == null) return '-'
  try {
    return `${Number(v).toLocaleString('vi-VN')} đ`
  } catch {
    return v
  }
}

const toImageSrc = (path) => {
  if (!path) return fallbackImage
  if (String(path).startsWith('http')) return path
  return `${API_FILE_BASE}${String(path).replace(/^\/+/, '')}`
}

const onImgError = (e) => {
  e.target.src = fallbackImage
}

const getProductThumb = (product) => {
  if (product?.thumbnail) return toImageSrc(product.thumbnail)

  if (Array.isArray(product?.images) && product.images.length > 0) {
    const thumb = product.images.find((x) => x?.isThumbnail) || product.images[0]
    if (thumb?.url) return toImageSrc(thumb.url)
  }

  return fallbackImage
}

const getVariantImage = (variant) => {
  if (variant?.thumbnail) return toImageSrc(variant.thumbnail)
  if (variant?.imageUrl) return toImageSrc(variant.imageUrl)
  if (variant?.image) return toImageSrc(variant.image)

  if (Array.isArray(variant?.images) && variant.images.length > 0) {
    const thumb = variant.images.find((x) => x?.isThumbnail) || variant.images[0]
    if (thumb?.url) return toImageSrc(thumb.url)
  }

  if (modal.selectedProduct) return getProductThumb(modal.selectedProduct)

  return fallbackImage
}

const maxQty = (record) => {
  const stock = Number(record?.stock ?? 0)
  return stock > 0 ? stock : 999999
}

// 🔥 FIX: TỰ ĐỘNG NHÂN TIỀN GIẢM LÊN KHI ĐỔI SỐ LƯỢNG
const handleQtyChange = (record) => {
  record.quantity = normalizeNumber(record.quantity, 1)

  if (Number(record.stock || 0) > 0 && Number(record.quantity) > Number(record.stock)) {
    record.quantity = Number(record.stock)
    message.warning(`Số lượng không được vượt tồn kho (${record.stock})`)
  }

  record.lineDiscountAmount = (record.unitDiscount || 0) * record.quantity;
  recalc()
}

const recalc = () => {
  normalizeNumberFields()
  calculatePromotion()
  calculateGroupDiscount()
}

const removeItem = (k) => {
  const idx = items.findIndex((i) => i._k === k)
  if (idx >= 0) items.splice(idx, 1)
  calculatePromotion()
  calculateGroupDiscount()
}

const fetchCustomers = async () => {
  try {
    const res = await api.get('/khach-hang/filter', { params: { loaiKhach: 'ALL' } })
    customers.value = res.data || []
  } catch {
    customers.value = []
  }
}

watch(
  () => form.channel,
  (channel) => {
    if (channel === 'ONLINE' && form.paymentMethod === 'CASH') {
      form.paymentMethod = 'COD'
    }
    if (channel === 'OFFLINE') {
      form.shippingFee = 0
      form.ordererName = ''
      form.ordererEmail = ''
      form.ordererPhone = ''
      form.receiverName = ''
      form.receiverPhone = ''
      form.addressLabel = ''
      form.shippingProvince = ''
      form.shippingDistrict = ''
      form.shippingWard = ''
      selectedProvinceCode.value = null
      selectedDistrictCode.value = null
      selectedWardCode.value = null
      form.shippingDetailAddress = ''
      form.shippingAddressLine = ''
    } else {
      syncReceiverFromOrderer()
    }
  },
  { immediate: true }
)

watch(
  () => form.customerId,
  (id) => {
    const customer = customers.value.find(c => c.id === id)

    if (!customer) {
      customerDiscountOptions.value = []
      selectedDiscount.value = null
      calculateGroupDiscount()
      return
    }

    const options = []

    if (Number(customer.uuDaiTheoDiem || 0) > 0) {
      options.push({
        label: `Ưu đãi theo điểm (${customer.uuDaiTheoDiem}%)`,
        value: Number(customer.uuDaiTheoDiem)
      })
    }

    if (Number(customer.uuDaiTheoNhom || 0) > 0) {
      options.push({
        label: `Ưu đãi theo hạng (${customer.uuDaiTheoNhom}%)`,
        value: Number(customer.uuDaiTheoNhom)
      })
    }

    customerDiscountOptions.value = options
    calculateGroupDiscount()
  }
)

const openAddItemModal = async () => {
  modal.open = true
  modal.selectedProduct = null
  modal.variants = []
  modal.search = ''
  await searchProducts()
}

const searchProducts = async () => {
  modal.loading = true
  try {
    const res = await getProducts({ page: 0, size: 30 })
    const list = res.data?.content || res.data || []
    const q = modal.search.trim().toLowerCase()

    modal.products = q
      ? list.filter((p) =>
          String(p.name || p.tenSanPham || '')
            .toLowerCase()
            .includes(q)
        )
      : list
  } catch {
    message.error('Không tải được danh sách sản phẩm')
    modal.products = []
  } finally {
    modal.loading = false
  }
}

const selectProduct = async (p) => {
  modal.loading = true
  modal.selectedProduct = p
  modal.variants = []

  try {
    const res = await getProductDetail(p.id)
    modal.variants = res.data?.variants || res.data?.productVariants || []
  } catch {
    modal.variants = []
    message.error('Không tải được variants của sản phẩm')
  } finally {
    modal.loading = false
  }
}

// 🔥 FIX: LẤY ĐÚNG GIÁ TRỊ GIẢM GIÁ (KHÔNG CẦN GỌI API GROUP NỮA ĐỂ TRÁNH LỖI 0đ)
const addVariant = async (v) => {
  const stock = Number(v.stock || 0)
  if (stock <= 0) {
    message.warning('Variant này đã hết hàng')
    return
  }

  const existed = items.find((x) => Number(x.variantId) === Number(v.id))
  if (existed) {
    if (Number(existed.quantity) + 1 > stock) {
      message.warning(`Không thể thêm vượt tồn kho (${stock})`)
      return
    }
    existed.quantity = Number(existed.quantity) + 1
    existed.lineDiscountAmount = (existed.unitDiscount || 0) * existed.quantity
    recalc()
    modal.open = false
    return
  }

  const productName =
    modal.selectedProduct?.name ||
    modal.selectedProduct?.tenSanPham ||
    `Product#${modal.selectedProduct?.id}`

  const sku = modal.selectedProduct?.sku || v?.sku || ''

  // Lấy chuẩn giá gốc và giá Sale từ sản phẩm
  const basePrice = Number(v.price || v.giaBan || 0);
  const finalPrice = Number(v.salePrice || basePrice);

  // Tính toán tiền giảm
  const unitDiscount = Math.max(0, basePrice - finalPrice);

  items.push({
    _k: `k${seq++}`,
    variantId: Number(v.id),
    quantity: 1,
    unitPrice: basePrice, // Hiển thị nguyên giá
    unitDiscount: unitDiscount,
    lineDiscountAmount: unitDiscount,
    skuSnapshot: String(sku || `VAR-${v.id}`),
    productNameSnapshot: String(productName),
    basePrice: basePrice,
    stock,
    thumbnail: getVariantImage(v),
  })

  await calculatePromotion()
  await calculateGroupDiscount()

  modal.open = false
}

const openQuickAdd = () => {
  quick.open = true
  quick.loading = false
  quick.variantId = null
  quick.quantity = 1
  quick.unitPrice = 0
  quick.skuSnapshot = ''
  quick.productNameSnapshot = ''
}

const validateQuickAdd = () => {
  if (!quick.variantId || Number(quick.variantId) <= 0) {
    message.warning('Variant ID phải lớn hơn 0')
    return false
  }
  if (!quick.productNameSnapshot || !String(quick.productNameSnapshot).trim()) {
    message.warning('Tên sản phẩm không được để trống')
    return false
  }
  if (!quick.skuSnapshot || !String(quick.skuSnapshot).trim()) {
    message.warning('SKU không được để trống')
    return false
  }
  if (!quick.quantity || Number(quick.quantity) <= 0) {
    message.warning('Số lượng phải lớn hơn 0')
    return false
  }
  if (quick.unitPrice == null || Number(quick.unitPrice) < 0) {
    message.warning('Đơn giá phải lớn hơn hoặc bằng 0')
    return false
  }
  return true
}

const quickAdd = () => {
  if (!validateQuickAdd()) return

  const existed = items.find((x) => Number(x.variantId) === Number(quick.variantId))
  if (existed) {
    existed.quantity = Number(existed.quantity) + Number(quick.quantity)
    recalc()
    quick.open = false
    return
  }

  items.push({
    _k: `k${seq++}`,
    variantId: Number(quick.variantId),
    quantity: Number(quick.quantity || 1),
    unitPrice: Number(quick.unitPrice || 0),
    basePrice: Number(quick.unitPrice || 0),
    skuSnapshot: String(quick.skuSnapshot).trim(),
    productNameSnapshot: String(quick.productNameSnapshot).trim(),
    lineDiscountAmount: 0,
    stock: 0,
    thumbnail: fallbackImage,
  })

  calculatePromotion()
  calculateGroupDiscount()
  quick.open = false
}

// 🔥 FIX CHUẨN 100%: Dùng API lấy giảm giá của 1 cái, Front-end tự nhân lên!
const calculatePromotion = async () => {
  if (items.length === 0) {
    promotions.value = [];
    return;
  }

  const promoList = [];

  for (const item of items) {
    try {
      // 1. CÚ LỪA BACKEND: Luôn ép quantity = 1 để lấy số tiền giảm của 1 đôi giày
      const res = await api.post('/pricing/calculate', {
        variantId: item.variantId,
        quantity: 1 // 🔥 Chốt chặn quan trọng nhất ở đây
      });

      if (res.data && res.data.onSale) {
        // 2. Lấy số tiền giảm của ĐÚNG 1 SẢN PHẨM
        const discountForOne = Number(res.data.discountAmount || 0);

        // 3. Front-end tự nhân với số lượng khách đang chọn
        item.lineDiscountAmount = discountForOne * item.quantity;

        // 4. Tính ra % để hiển thị cho đẹp giao diện
        const basePrice = Number(item.basePrice || 0);
        let percent = basePrice > 0 ? (discountForOne / basePrice) * 100 : 0;
        const percentStr = percent % 1 === 0 ? percent.toFixed(0) : percent.toFixed(1);

        promoList.push({
          promotionId: item.variantId,
          promotionName: res.data.promotionName || 'Đang khuyến mãi',
          discountAmount: item.lineDiscountAmount,
          percent: percentStr,
          products: [item.productNameSnapshot]
        });
      } else {
        item.lineDiscountAmount = 0;
      }
    } catch {
      item.lineDiscountAmount = 0;
    }
  }

  promotions.value = promoList;
};

// 🔥 FIX: XÓA SỔ HOÀN TOÀN LOGIC GIẢM GIÁ NHÓM ĐỂ TRÁNH LỖI BACKEND
const calculateGroupDiscount = async () => {
  groupDiscounts.value = [];
};

const isBlank = (value) => !value || !String(value).trim()

const validateOnlineShippingInfo = () => {
  if (isOffline.value) return true

  if (isBlank(form.ordererName)) {
    message.warning('Họ tên người đặt không được để trống')
    return false
  }
  if (isBlank(form.ordererPhone)) {
    message.warning('Số điện thoại người đặt không được để trống')
    return false
  }
  if (!isBlank(form.ordererEmail) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.ordererEmail).trim())) {
    message.warning('Email không đúng định dạng')
    return false
  }
  if (isBlank(form.receiverName)) {
    message.warning('Người nhận không được để trống')
    return false
  }
  if (isBlank(form.receiverPhone)) {
    message.warning('Số điện thoại nhận hàng không được để trống')
    return false
  }
  if (isBlank(form.shippingProvince)) {
    message.warning('Tỉnh / Thành phố không được để trống')
    return false
  }
  if (isBlank(form.shippingDistrict)) {
    message.warning('Quận / Huyện không được để trống')
    return false
  }
  if (isBlank(form.shippingWard)) {
    message.warning('Phường / Xã không được để trống')
    return false
  }
  if (isBlank(form.shippingDetailAddress)) {
    message.warning('Địa chỉ chi tiết không được để trống')
    return false
  }
  return true
}

const validateOrder = () => {
  normalizeNumberFields()

  if (!form.channel || !String(form.channel).trim()) {
    message.warning('Kênh bán không được để trống')
    return false
  }

  if (!form.paymentMethod || !String(form.paymentMethod).trim()) {
    message.warning('Phương thức thanh toán không được để trống')
    return false
  }

  if (form.channel === 'ONLINE' && form.paymentMethod === 'CASH') {
    message.warning('Đơn online chỉ hỗ trợ COD hoặc chuyển khoản.')
    return false
  }

  if (!validateOnlineShippingInfo()) return false

  if (isOffline.value && Number(form.shippingFee || 0) !== 0) {
    message.warning('Đơn bán tại cửa hàng không được có phí ship')
    return false
  }

  if (!isOffline.value && Number(form.shippingFee || 0) < 0) {
    message.warning('Phí ship không hợp lệ')
    return false
  }

  if (Number(form.discountAmount || 0) < 0) {
    message.warning('Giảm giá không hợp lệ')
    return false
  }

  if (!items.length) {
    message.warning('Bạn phải thêm ít nhất 1 sản phẩm')
    return false
  }

  for (const item of items) {
    if (!item.variantId || Number(item.variantId) <= 0) {
      message.warning('Có sản phẩm chưa có Variant ID hợp lệ')
      return false
    }

    if (!item.productNameSnapshot || !String(item.productNameSnapshot).trim()) {
      message.warning('Tên sản phẩm không được để trống')
      return false
    }

    if (!item.skuSnapshot || !String(item.skuSnapshot).trim()) {
      message.warning('SKU không được để trống')
      return false
    }

    if (!item.quantity || Number(item.quantity) <= 0) {
      message.warning(`Số lượng của ${item.productNameSnapshot} phải lớn hơn 0`)
      return false
    }

    if (item.unitPrice == null || Number(item.unitPrice) < 0) {
      message.warning(`Đơn giá của ${item.productNameSnapshot} không hợp lệ`)
      return false
    }

    if (Number(item.stock || 0) > 0 && Number(item.quantity) > Number(item.stock)) {
      message.warning(`Số lượng của ${item.productNameSnapshot} vượt tồn kho`)
      return false
    }
  }

  return true
}

const handleCreate = async () => {
  if (!validateOrder()) return

  saving.value = true
  try {
    const payload = {
      customerId: form.customerId || null,
      voucherId: form.voucherId || null,
      freeShipVoucherId: form.freeShipVoucherId || null,
      channel: form.channel,
      paymentMethod: form.paymentMethod,
      shippingFee: isOffline.value ? 0 : Number(form.shippingFee || 0),
      ordererName: isOffline.value ? null : String(form.ordererName || '').trim(),
      ordererEmail: isOffline.value ? null : String(form.ordererEmail || '').trim(),
      ordererPhone: isOffline.value ? null : String(form.ordererPhone || '').trim(),
      receiverName: isOffline.value ? null : String(form.receiverName || '').trim(),
      receiverPhone: isOffline.value ? null : String(form.receiverPhone || '').trim(),
      addressLabel: isOffline.value ? null : String(form.addressLabel || '').trim(),
      shippingProvince: isOffline.value ? null : String(form.shippingProvince || '').trim(),
      shippingDistrict: isOffline.value ? null : String(form.shippingDistrict || '').trim(),
      shippingWard: isOffline.value ? null : String(form.shippingWard || '').trim(),
      shippingDetailAddress: isOffline.value ? null : String(form.shippingDetailAddress || '').trim(),
      shippingAddressLine: isOffline.value
        ? null
        : [form.shippingDetailAddress, form.shippingWard, form.shippingDistrict, form.shippingProvince]
            .map(v => String(v || '').trim())
            .filter(Boolean)
            .join(', '),

      // 🔥 FIX 1: Cộng cả tiền giảm giá của Hạng Kim Cương/Vàng vào đây
      discountAmount: Number(summary.value.discount || 0) + Number(summary.value.rankDiscount || 0),

      note: form.note,
      items: items.map((i) => ({
        variantId: Number(i.variantId),
        quantity: Number(i.quantity || 1),
        skuSnapshot: String(i.skuSnapshot).trim(),
        productNameSnapshot: String(i.productNameSnapshot).trim(),

        // 🔥 FIX 2: Gửi kèm Đơn giá và Tiền khuyến mãi sản phẩm lên Backend
        unitPrice: Number(i.unitPrice || 0),
        lineDiscountAmount: Number(i.lineDiscountAmount || 0)
      })),
    }

    const res = await createOrder(payload)
    const order = res.data

    message.success('Tạo đơn thành công')

    const id = order?.id
    if (id) router.push(`/orders/${id}`)
    else router.push('/orders')
  } catch (e) {
    message.error(getErrorMessage(e, 'Tạo đơn thất bại'))
  } finally {
    saving.value = false
  }
}

const vouchers = ref([])
const availableVouchers = computed(() => {
  return vouchers.value.map(v => {

    // Điều kiện 1: Đơn tối thiểu (minOrderValue)
    const subtotal = items.reduce((s, it) => s + lineTotal(it), 0)
    const isNotEnoughMoney = v.minOrderValue && subtotal < v.minOrderValue

    return {
      ...v,
      disabled: isNotEnoughMoney, // Vô hiệu hóa nếu chưa đủ tiền
      label: `${v.name} - Giảm ${
  v.type === 'PERCENT'
    ? `${v.value}%`
    : formatMoney(v.value)
} ${
  v.type === 'PERCENT' && v.maxDiscount
    ? `(Tối đa ${formatMoney(v.maxDiscount)})`
    : ''
}`,
      value: v.id
    }
  })
})
const availableFreeShips = computed(() => {
  return availableVouchers.value.filter(v => v.type === 'SHIPPING');
})
const availableDiscountVouchers = computed(() => {
  return availableVouchers.value.filter(v => v.type !== 'SHIPPING');
})

const fetchVouchers = async (customerId) => {
  try {
    // Gửi customerId lên, nếu trống thì Backend sẽ tự xử lý trả về voucher công khai
    const res = await api.get('/vouchers/available', {
      params: { customerId: customerId || null }
    })
    vouchers.value = res.data || []
  } catch {
    vouchers.value = []
  }
}

// Theo dõi khi thay đổi khách hàng
watch(() => form.customerId, (newId) => {
  fetchVouchers(newId) // Tải lại danh sách voucher phù hợp
  form.voucherId = null // Reset voucher đã chọn để tránh sai lệch đơn tối thiểu
  form.freeShipVoucherId = null
})

onMounted(() => {
  fetchCustomers()
  searchProducts()
  fetchVouchers(null) // Tải voucher công khai ngay khi mở trang cho khách lẻ
  fetchVietnamAdministrativeUnits()
})


onMounted(async () => {
  fetchCustomers()
  searchProducts()

  // 🔥 Lấy thông tin cấu hình hạng từ DB
  try {
    const resRanks = await getCustomerRanks();
    ranks.value = resRanks.data || [];
  } catch (e) {
    console.error("Lỗi lấy cấu hình hạng", e);
  }
})
</script>

<style scoped>
.create-order-page {
  padding-bottom: 24px;
  background: #f5f7fb;
  min-height: 100%;
}

.page-header {
  background: #fff;
  margin-bottom: 16px;
  border-radius: 14px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
}

.panel-card {
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #172033;
}

.summary-card {
  margin-top: 16px;
}

.online-info-card {
  margin-bottom: 16px;
  background: #f8fafc;
  border-radius: 14px;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #4b5563;
  font-size: 14px;
}

.summary-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  border-radius: 14px;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

.order-items-topbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.items-count {
  color: #6b7280;
  font-size: 13px;
}

.order-table :deep(.ant-table-thead > tr > th) {
  background: #f8fafc;
  font-weight: 700;
}

.product-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.product-name {
  font-weight: 600;
  color: #111827;
}

.product-sub {
  font-size: 12px;
  color: #6b7280;
}

.line-total {
  color: #1677ff;
}

.empty-box {
  margin-top: 20px;
}

.mb-16 {
  margin-bottom: 16px;
}

.text-danger {
  color: #ff4d4f;
}

.promo-box {
  margin-top: 16px;
  padding: 14px 16px;
  background: #fafcff;
  border-radius: 14px;
  border: 1px solid #e8eef8;
}

.promo-title {
  font-weight: 700;
  margin-bottom: 10px;
  color: #172033;
}

.promo-item {
  padding: 10px 0;
  border-bottom: 1px dashed #e5e7eb;
}

.promo-item:last-child {
  border-bottom: none;
}

.promo-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.promo-desc {
  font-size: 13px;
  color: #6b7280;
}

.variant-thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  display: block;
}

.add-product-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  min-height: 520px;
}

.product-pane,
.variant-pane {
  background: #fafbfd;
  border: 1px solid #edf1f7;
  border-radius: 16px;
  overflow: hidden;
}

.pane-header {
  padding: 14px;
  background: #fff;
  border-bottom: 1px solid #edf1f7;
}

.pane-body {
  padding: 12px;
}

.product-list-scroll {
  max-height: 460px;
  overflow: auto;
}

.product-list-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.product-list-item:hover {
  background: #fff;
  border-color: #dbeafe;
}

.product-list-item.active {
  background: #eff6ff;
  border-color: #91caff;
}

.list-thumb {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.product-list-content {
  min-width: 0;
}

.product-list-name {
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
}

.product-list-sku {
  font-size: 12px;
  color: #6b7280;
  margin-top: 3px;
}

.variant-pane {
  padding: 14px;
}

.variant-empty {
  min-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-product-box {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 14px;
  border: 1px solid #e5eaf3;
  border-radius: 14px;
  background: #fff;
}

.selected-thumb {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.selected-content {
  min-width: 0;
}

.selected-name {
  font-weight: 700;
  color: #111827;
}

.selected-sub {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.variant-section-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #172033;
}

.variant-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.variant-card {
  background: #fff;
  border: 1px solid #e8edf5;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.variant-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.variant-card-thumb {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
  background: #f3f4f6;
}

.variant-card-body {
  padding: 12px;
}

.variant-id {
  font-weight: 700;
  margin-bottom: 8px;
  color: #111827;
}

.variant-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #4b5563;
  font-size: 13px;
  margin-bottom: 10px;
}

.variant-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.variant-price {
  font-size: 15px;
  font-weight: 700;
  color: #1677ff;
}

@media (max-width: 992px) {
  .add-product-layout {
    grid-template-columns: 1fr;
  }

  .variant-grid {
    grid-template-columns: 1fr;
  }
}
</style>
