<template>
  <div class="checkout-page">
    <section class="checkout-shell">
      <div class="checkout-header">
        <div>
          <h1>Thanh toán</h1>
          <p>Điền thông tin người nhận và xác nhận đơn hàng.</p>
        </div>
      </div>

      <div v-if="loading" class="checkout-state">
        Đang tải dữ liệu thanh toán...
      </div>

      <div v-else-if="error" class="checkout-state checkout-state--error">
        {{ error }}
      </div>

      <div v-else-if="!cart.items.length" class="checkout-state">
        Giỏ hàng đang trống. Vui lòng quay lại giỏ hàng để chọn sản phẩm.
      </div>

      <div v-else class="checkout-layout">
        <div class="checkout-main">
          <section class="checkout-card">
            <h3>Thông tin người đặt</h3>

            <div class="form-grid">
              <div class="form-field">
                <label>Họ tên người đặt <span class="required">*</span></label>
                <input
                  v-model="form.ordererName"
                  type="text"
                  placeholder="Nhập họ tên"
                  :class="{ 'input-error': fieldErrors.ordererName }"
                />
                <small v-if="fieldErrors.ordererName" class="error-text">
                  {{ fieldErrors.ordererName }}
                </small>
              </div>

              <div class="form-field">
                <label>Email</label>
                <input
                  v-model="form.ordererEmail"
                  type="email"
                  placeholder="Nhập email"
                  :class="{ 'input-error': fieldErrors.ordererEmail }"
                />
                <small v-if="fieldErrors.ordererEmail" class="error-text">
                  {{ fieldErrors.ordererEmail }}
                </small>
              </div>

              <div class="form-field">
                <label>Số điện thoại</label>
                <input
                  v-model="form.ordererPhone"
                  type="text"
                  placeholder="Nhập số điện thoại"
                  :class="{ 'input-error': fieldErrors.ordererPhone }"
                />
                <small v-if="fieldErrors.ordererPhone" class="error-text">
                  {{ fieldErrors.ordererPhone }}
                </small>
              </div>
            </div>
          </section>

          <section class="checkout-card">
            <div class="section-head">
              <h3>Thông tin giao hàng</h3>

              <select
                v-if="savedAddresses.length"
                v-model="selectedSavedAddressId"
                @change="applySavedAddress"
                class="address-select"
              >
                <option value="">Chọn địa chỉ đã lưu</option>
                <option
                  v-for="addr in savedAddresses"
                  :key="addr.id"
                  :value="String(addr.id)"
                >
                  {{ addr.label || addr.recipientName }} - {{ addr.detailAddress }}
                </option>
              </select>
            </div>

            <div class="checkbox-wrapper">
              <label class="check-label">
                <input type="checkbox" v-model="useOrdererInfo" @change="syncOrdererInfo" />
                <span>Lấy thông tin người đặt làm người nhận (Họ tên & SĐT)</span>
              </label>
            </div>

            <div class="form-grid">
              <div class="form-field">
                <label>Người nhận <span class="required">*</span></label>
                <input
                  v-model="form.receiverName"
                  type="text"
                  placeholder="Nhập tên người nhận"
                  :class="{ 'input-error': fieldErrors.receiverName }"
                />
                <small v-if="fieldErrors.receiverName" class="error-text">
                  {{ fieldErrors.receiverName }}
                </small>
              </div>

              <div class="form-field">
                <label>Số điện thoại nhận hàng <span class="required">*</span></label>
                <input
                  v-model="form.receiverPhone"
                  type="text"
                  placeholder="Nhập số điện thoại người nhận"
                  :class="{ 'input-error': fieldErrors.receiverPhone }"
                />
                <small v-if="fieldErrors.receiverPhone" class="error-text">
                  {{ fieldErrors.receiverPhone }}
                </small>
              </div>

              <div class="form-field">
                <label>Nhãn địa chỉ</label>
                <input
                  v-model="form.addressLabel"
                  type="text"
                  placeholder="Ví dụ: Nhà riêng, Công ty..."
                />
              </div>

              <div class="form-field">
                <label>Tỉnh / Thành phố <span class="required">*</span></label>
                <select
                  v-model="selectedProvinceCode"
                  @change="handleProvinceChange"
                  :disabled="provinceLoading"
                  :class="{ 'input-error': fieldErrors.shippingProvince }"
                >
                  <option value="">
                    {{ provinceLoading ? 'Đang tải tỉnh / thành phố...' : 'Chọn tỉnh / thành phố' }}
                  </option>
                  <option
                    v-for="province in provinces"
                    :key="province.code"
                    :value="String(province.code)"
                  >
                    {{ province.name }}
                  </option>
                </select>
                <small v-if="fieldErrors.shippingProvince" class="error-text">
                  {{ fieldErrors.shippingProvince }}
                </small>
              </div>

              <div class="form-field">
                <label>Quận / Huyện <span class="required">*</span></label>
                <select
                  v-model="selectedDistrictCode"
                  @change="handleDistrictChange"
                  :disabled="!selectedProvinceCode || districtLoading"
                  :class="{ 'input-error': fieldErrors.shippingDistrict }"
                >
                  <option value="">
                    {{ districtLoading ? 'Đang tải quận / huyện...' : 'Chọn quận / huyện' }}
                  </option>
                  <option
                    v-for="district in districts"
                    :key="district.code"
                    :value="String(district.code)"
                  >
                    {{ district.name }}
                  </option>
                </select>
                <small v-if="fieldErrors.shippingDistrict" class="error-text">
                  {{ fieldErrors.shippingDistrict }}
                </small>
              </div>

              <div class="form-field">
                <label>Phường / Xã <span class="required">*</span></label>
                <select
                  v-model="selectedWardCode"
                  @change="handleWardChange"
                  :disabled="!selectedDistrictCode || wardLoading"
                  :class="{ 'input-error': fieldErrors.shippingWard }"
                >
                  <option value="">
                    {{ wardLoading ? 'Đang tải phường / xã...' : 'Chọn phường / xã' }}
                  </option>
                  <option
                    v-for="ward in wards"
                    :key="ward.code"
                    :value="String(ward.code)"
                  >
                    {{ ward.name }}
                  </option>
                </select>
                <small v-if="fieldErrors.shippingWard" class="error-text">
                  {{ fieldErrors.shippingWard }}
                </small>
              </div>

              <div class="form-field form-field--full">
                <label>Địa chỉ chi tiết <span class="required">*</span></label>
                <input
                  v-model="form.shippingDetailAddress"
                  type="text"
                  placeholder="Số nhà, ngõ ngách, tên đường..."
                  :class="{ 'input-error': fieldErrors.shippingDetailAddress }"
                />
                <small v-if="fieldErrors.shippingDetailAddress" class="error-text">
                  {{ fieldErrors.shippingDetailAddress }}
                </small>
              </div>

              <div class="form-field form-field--full">
                <label>Ghi chú đơn hàng</label>
                <textarea
                  v-model="form.note"
                  rows="2"
                  placeholder="Ví dụ: Giao giờ hành chính, gọi điện trước khi giao..."
                ></textarea>
              </div>
            </div>
          </section>

          <section class="checkout-card">
            <h3>Phương thức thanh toán</h3>
            <div class="payment-options">
              <label
                v-for="method in paymentMethods"
                :key="method.value"
                class="payment-option"
                :class="{
                  active: form.paymentMethod === method.value,
                  'payment-option--error': fieldErrors.paymentMethod,
                }"
              >
                <input
                  v-model="form.paymentMethod"
                  type="radio"
                  :value="method.value"
                />
                <div>
                  <strong>{{ method.label }}</strong>
                  <p>{{ method.description }}</p>
                </div>
              </label>
            </div>
            <small v-if="fieldErrors.paymentMethod" class="error-text">
              {{ fieldErrors.paymentMethod }}
            </small>
          </section>
        </div>

        <aside class="checkout-sidebar">

          <section class="checkout-card">
            <h3>Ưu đãi & Giảm giá</h3>

            <div class="voucher-triggers">
              <div class="voucher-trigger-row" @click="openVoucherModal('DISCOUNT')">
                <div class="vt-icon-box bg-discount">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                </div>
                <div class="vt-text">
                  <span class="vt-label">Mã Giảm Giá</span>
                  <span class="vt-selected" v-if="selectedVoucherCode">{{ getVoucherDisplay(selectedVoucherCode, 'DISCOUNT') }}</span>
                  <span class="vt-placeholder" v-else>Chọn mã ưu đãi</span>
                </div>
                <div class="vt-arrow">›</div>
              </div>

              <div class="vt-divider"></div>

              <div
                class="voucher-trigger-row"
                :class="{ 'is-disabled': finalSummary.shippingFee === 0 && !previewLoading }"
                @click="finalSummary.shippingFee > 0 ? openVoucherModal('SHIPPING') : null"
              >
                <div class="vt-icon-box bg-freeship">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                </div>
                <div class="vt-text">
                  <span class="vt-label">Mã Miễn Phí Vận Chuyển</span>
                  <span class="vt-selected" v-if="selectedFreeShipCode">{{ getVoucherDisplay(selectedFreeShipCode, 'SHIPPING') }}</span>
                  <span class="vt-placeholder success" v-else-if="finalSummary.shippingFee === 0 && !previewLoading">Đơn hàng đã được freeship</span>
                  <span class="vt-placeholder" v-else>Chọn mã vận chuyển</span>
                </div>
                <div class="vt-arrow" v-if="finalSummary.shippingFee > 0 || previewLoading">›</div>
              </div>
            </div>
          </section>

          <section class="checkout-card">
            <h3>Tóm tắt đơn hàng</h3>

            <div class="summary-items">
              <div
                v-for="item in selectedItems"
                :key="item.itemId"
                class="summary-item"
              >
                <div class="summary-item__info">
                  <strong>{{ item.productName }}</strong>
                  <span>
                    {{ item.color || '---' }} / {{ item.size || '---' }} x {{ item.quantity }}
                  </span>
                </div>
                <div class="summary-item__price">
                  {{ formatVnd(item.lineTotal) }}
                </div>
              </div>
            </div>

            <div class="summary-details">
              <div class="summary-row">
                <span>Tổng số lượng</span>
                <strong :class="{ 'text-danger': isOverTotalQuantityLimit }">{{ selectedTotalQuantity }} / {{ MAX_TOTAL_ITEMS_PER_ORDER }}</strong>
              </div>

              <div v-if="isOverTotalQuantityLimit" class="checkout-limit-warning">
                Tổng số lượng sản phẩm trong đơn không được vượt quá {{ MAX_TOTAL_ITEMS_PER_ORDER }}.
                Vui lòng quay lại giỏ hàng và giảm số lượng trước khi thanh toán.
              </div>

              <div class="summary-row">
                <span>Tạm tính</span>
                <strong>{{ formatVnd(finalSummary.subtotalAmount) }}</strong>
              </div>

              <div class="summary-row" v-if="finalSummary.promotionDiscountAmount > 0">
                <span>Sản phẩm khuyến mãi</span>
                <strong class="text-success">- {{ formatVnd(finalSummary.promotionDiscountAmount) }}</strong>
              </div>

              <div class="summary-row" v-if="finalSummary.voucherDiscountAmount > 0">
                <span>Giảm giá Voucher</span>
                <strong class="text-success">- {{ formatVnd(finalSummary.voucherDiscountAmount) }}</strong>
              </div>

              <div class="summary-row" v-if="finalSummary.vipDiscountAmount > 0">
                <span>Giảm giá VIP <small v-if="finalSummary.customerRankName">({{ finalSummary.customerRankName }})</small></span>
                <strong class="text-success">- {{ formatVnd(finalSummary.vipDiscountAmount) }}</strong>
              </div>

              <div class="summary-row" v-if="finalSummary.customerRankName && finalSummary.vipDiscountAmount <= 0">
                <span>Cấp độ thành viên</span>
                <strong>{{ finalSummary.customerRankName }}</strong>
              </div>

              <div class="summary-row">
                <span>Phí vận chuyển</span>
                <strong v-if="previewLoading" style="color:#666">Đang tính...</strong>
                <strong v-else>{{ finalSummary.shippingFee > 0 ? formatVnd(finalSummary.shippingFee) : 'Miễn phí' }}</strong>
              </div>

              <div class="summary-row" v-if="finalSummary.freeShipDiscountAmount > 0">
                <span>Hỗ trợ phí vận chuyển</span>
                <strong class="text-success">- {{ formatVnd(finalSummary.freeShipDiscountAmount) }}</strong>
              </div>

              <div class="summary-row summary-row--total">
                <span>Tổng thanh toán</span>
                <strong class="total-price">{{ formatVnd(finalSummary.finalAmount) }}</strong>
              </div>
            </div>

            <button
              class="btn btn-primary btn-block"
              type="button"
              @click="handleSubmitCheckout"
              :disabled="submitting || previewLoading || !selectedItems.length || isOverTotalQuantityLimit"
            >
              {{ submitting ? 'Đang đặt hàng...' : 'XÁC NHẬN ĐẶT HÀNG' }}
            </button>
          </section>
        </aside>
      </div>
    </section>

    <div class="v-modal-overlay" :class="{ 'is-active': voucherModal.open }" @click.self="closeVoucherModal">
      <div class="v-modal-content">
        <div class="v-modal-header">
          <h3>{{ voucherModal.type === 'SHIPPING' ? 'Chọn Mã Miễn Phí Vận Chuyển' : 'Chọn Mã Giảm Giá' }}</h3>
          <button class="btn-close" @click="closeVoucherModal">✕</button>
        </div>

        <div class="v-modal-body">
          <div v-if="activeModalVouchers.length === 0" class="v-modal-empty">
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="#cbd5e1" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            <p>Hiện không có mã ưu đãi nào khả dụng.</p>
          </div>

          <div
            v-else
            v-for="v in activeModalVouchers"
            :key="v.code"
            class="v-ticket"
            :class="{ 'is-disabled': v.disabled, 'is-selected': voucherModal.tempCode === v.code }"
            @click="selectTempVoucher(v)"
          >
            <div class="v-ticket-left" :class="voucherModal.type === 'SHIPPING' ? 'bg-freeship' : 'bg-discount'">
              <span>{{ voucherModal.type === 'SHIPPING' ? 'FreeShip' : 'Voucher' }}</span>
            </div>

            <div class="v-ticket-right">
              <div class="v-ticket-info">
                <h4>{{ v.name }}</h4>
                <p class="v-ticket-desc">{{ v.discountTitle }} {{ v.maxText }}</p>
                <p class="v-ticket-error" v-if="v.disabled">{{ v.errorText }}</p>
              </div>
              <div class="v-ticket-radio">
                <div class="radio-circle">
                  <div class="radio-inner" v-if="voucherModal.tempCode === v.code"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="v-modal-footer">
          <button class="btn btn-secondary" style="flex:1" @click="clearTempVoucher">Bỏ chọn mã</button>
          <button class="btn btn-primary" style="flex:2" @click="confirmVoucherSelection">Đồng ý</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getErrorMessage } from '@/utils/error'
import api from '@/api/axios'
import { getCurrentCart } from '@/api/cart.api'
import { previewCheckout, submitCheckout } from '@/api/checkout.api'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { getCartSessionKey } from '@/utils/cartSession'
import {
  fetchVietnamProvinces,
  fetchVietnamDistricts,
  fetchVietnamWards,
  findAddressUnitByName,
} from '@/utils/vietnamAddress'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()

const loading = ref(true)
const error = ref('')
const previewLoading = ref(false)
const submitting = ref(false)

const selectedSavedAddressId = ref('')
const savedAddresses = ref([])

// Voucher States
const availableVouchers = ref([])
const selectedVoucherCode = ref('')
const selectedFreeShipCode = ref('')

// Modal Voucher State
const voucherModal = ref({
  open: false,
  type: 'DISCOUNT',
  tempCode: ''
})

const fieldErrors = ref({})

const provinces = ref([])
const districts = ref([])
const wards = ref([])

const selectedProvinceCode = ref('')
const selectedDistrictCode = ref('')
const selectedWardCode = ref('')

const provinceLoading = ref(false)
const districtLoading = ref(false)
const wardLoading = ref(false)

const useOrdererInfo = ref(false)

const cart = ref({
  cartId: null,
  items: [],
})

const preview = ref({
  subtotalAmount: 0,
  promotionDiscountAmount: 0,
  voucherDiscountAmount: 0,
  shippingFee: 0,
  finalAmount: 0,
})

const form = ref({
  ordererName: '',
  ordererEmail: '',
  ordererPhone: '',
  receiverName: '',
  receiverPhone: '',
  shippingProvince: '',
  shippingDistrict: '',
  shippingWard: '',
  shippingDetailAddress: '',
  addressLabel: '',
  note: '',
  paymentMethod: 'COD',
})

const paymentMethods = [
  {
    value: 'COD',
    label: 'Thanh toán khi nhận hàng (COD)',
    description: 'Người nhận thanh toán tiền mặt khi giao hàng.',
  },
  {
    value: 'BANK_TRANSFER',
    label: 'Chuyển khoản ngân hàng',
    description: 'Thanh toán an toàn qua chuyển khoản quét mã QR tự động.',
  },
]

const MAX_TOTAL_ITEMS_PER_ORDER = 50

const selectedItems = computed(() =>
  (cart.value.items || []).filter((item) => item.selected),
)

const selectedTotalQuantity = computed(() =>
  selectedItems.value.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
)

const isOverTotalQuantityLimit = computed(() => selectedTotalQuantity.value > MAX_TOTAL_ITEMS_PER_ORDER)

function validateTotalQuantityLimit() {
  if (!isOverTotalQuantityLimit.value) return true
  message.warning(`Tổng số lượng sản phẩm trong đơn không được vượt quá ${MAX_TOTAL_ITEMS_PER_ORDER}.`)
  return false
}

// XỬ LÝ DỮ LIỆU VOUCHER CHO GIAO DIỆN TICKET MỚI
const parsedVouchers = computed(() => {
  const subtotal = preview.value.subtotalAmount || 0;
  return availableVouchers.value.map(v => {
    const isNotEnoughMoney = v.minOrderValue && subtotal < v.minOrderValue;
    const discountValText = v.type === 'PERCENT' ? `${v.value}%` : formatVnd(v.value);
    const maxText = v.maxDiscount ? `(Tối đa ${formatVnd(v.maxDiscount)})` : '';
    const errorText = isNotEnoughMoney ? `Mua thêm ${formatVnd(v.minOrderValue - subtotal)} để sử dụng mã này` : '';

    return {
      ...v,
      disabled: isNotEnoughMoney,
      discountTitle: `Giảm ${discountValText}`,
      maxText: maxText,
      errorText: errorText
    }
  });
})

const discountVouchers = computed(() => parsedVouchers.value.filter(v => v.type !== 'SHIPPING'))
const freeshipVouchers = computed(() => parsedVouchers.value.filter(v => v.type === 'SHIPPING'))

const activeModalVouchers = computed(() => {
  return voucherModal.value.type === 'DISCOUNT' ? discountVouchers.value : freeshipVouchers.value;
})

const finalSummary = computed(() => {
  const p = preview.value || {};
  let shipFee = p.shippingFee || 0;
  let freeshipDiscount = p.freeShipDiscountAmount || p.shippingDiscountAmount || 0;

  if (freeshipDiscount === 0 && selectedFreeShipCode.value) {
    const fsVoucher = freeshipVouchers.value.find(v => v.code === selectedFreeShipCode.value);
    if (fsVoucher && !fsVoucher.disabled) {
      freeshipDiscount = Math.min(shipFee, fsVoucher.value || 0);
    }
  }

  let finalAmt = p.finalAmount || 0;
  if ((p.freeShipDiscountAmount === undefined && p.shippingDiscountAmount === undefined) && freeshipDiscount > 0) {
      finalAmt = Math.max(0, finalAmt - freeshipDiscount);
  }

  return {
    subtotalAmount: p.subtotalAmount || 0,
    promotionDiscountAmount: p.promotionDiscountAmount || 0,
    voucherDiscountAmount: p.voucherDiscountAmount || 0,
    vipDiscountAmount: p.vipDiscountAmount || 0,
    customerRankName: p.customerRankName || '',
    customerRankDiscountPercent: p.customerRankDiscountPercent || 0,
    shippingFee: shipFee,
    freeShipDiscountAmount: freeshipDiscount,
    finalAmount: finalAmt
  }
});

// LOGIC MODAL VOUCHER
function openVoucherModal(type) {
  voucherModal.value.type = type;
  voucherModal.value.tempCode = type === 'DISCOUNT' ? selectedVoucherCode.value : selectedFreeShipCode.value;
  voucherModal.value.open = true;
  document.body.style.overflow = 'hidden'; // Khóa cuộn trang khi mở modal
}

function closeVoucherModal() {
  voucherModal.value.open = false;
  document.body.style.overflow = '';
}

function selectTempVoucher(v) {
  if (v.disabled) {
    message.warning(v.errorText);
    return;
  }
  // Nếu đang chọn mã này thì bỏ chọn, ngược lại thì chọn mã mới
  if (voucherModal.value.tempCode === v.code) {
    voucherModal.value.tempCode = '';
  } else {
    voucherModal.value.tempCode = v.code;
  }
}

function clearTempVoucher() {
  voucherModal.value.tempCode = '';
}

function confirmVoucherSelection() {
  if (voucherModal.value.type === 'DISCOUNT') {
    selectedVoucherCode.value = voucherModal.value.tempCode;
  } else {
    selectedFreeShipCode.value = voucherModal.value.tempCode;
  }
  closeVoucherModal();
  handlePreview(); // Tính lại tiền
}

function getVoucherDisplay(code, type) {
  const list = type === 'DISCOUNT' ? discountVouchers.value : freeshipVouchers.value;
  const v = list.find(x => x.code === code);
  return v ? `${v.discountTitle} ${v.maxText}` : code;
}


// LOGIC ĐỒNG BỘ THÔNG TIN (COPY)
function syncOrdererInfo() {
  if (useOrdererInfo.value) {
    form.value.receiverName = form.value.ordererName;
    form.value.receiverPhone = form.value.ordererPhone;
    clearFieldError('receiverName');
    clearFieldError('receiverPhone');
  }
}

watch(() => form.value.ordererName, (val) => {
  if (useOrdererInfo.value) form.value.receiverName = val;
});
watch(() => form.value.ordererPhone, (val) => {
  if (useOrdererInfo.value) form.value.receiverPhone = val;
});

watch(() => form.value.receiverName, (val) => {
  if (useOrdererInfo.value && val !== form.value.ordererName) useOrdererInfo.value = false;
});
watch(() => form.value.receiverPhone, (val) => {
  if (useOrdererInfo.value && val !== form.value.ordererPhone) useOrdererInfo.value = false;
});


function formatVnd(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(value || 0))
}

function clearFieldError(field) {
  if (fieldErrors.value[field]) {
    delete fieldErrors.value[field]
  }
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '')
}

function isValidPhone(phone) {
  const raw = String(phone || '').trim()
  const normalized = normalizePhone(raw)
  if (!raw) return false
  if (/^(0|\+84)[0-9]{9,10}$/.test(raw)) return true
  if (/^[0-9]{10,11}$/.test(normalized)) return true
  return false
}

function isValidEmail(email) {
  if (!email?.trim()) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function isValidName(name) {
  if (!name?.trim()) return false
  return name.trim().length >= 2
}

function fillOrdererFromAuth() {
  const user = authStore.currentUser || {}
  const customer = user.customerInfo || {}

  form.value.ordererName = user.fullName || customer.ten || ''
  form.value.ordererEmail = user.email || customer.email || ''
  form.value.ordererPhone = customer.phone || ''
}

function fillReceiverFromAddress(address) {
  if (!address) return

  form.value.receiverName = address.recipientName || form.value.receiverName
  form.value.receiverPhone = address.phone || form.value.receiverPhone
  form.value.shippingProvince = address.province || ''
  form.value.shippingDistrict = address.district || ''
  form.value.shippingWard = address.ward || ''
  form.value.shippingDetailAddress = address.detailAddress || ''
  form.value.addressLabel = address.label || ''
}

async function loadProvinces() {
  try {
    provinceLoading.value = true
    provinces.value = await fetchVietnamProvinces()
  } catch {
    provinces.value = []
    message.error('Không tải được danh sách tỉnh / thành phố mới nhất')
  } finally {
    provinceLoading.value = false
  }
}

async function loadDistricts(provinceCode) {
  if (!provinceCode) {
    districts.value = []
    wards.value = []
    return
  }
  try {
    districtLoading.value = true
    districts.value = await fetchVietnamDistricts(provinceCode)
  } catch {
    districts.value = []
    message.error('Không tải được danh sách quận / huyện')
  } finally {
    districtLoading.value = false
  }
}

async function loadWards(districtCode) {
  if (!districtCode || !selectedProvinceCode.value) {
    wards.value = []
    return
  }
  try {
    wardLoading.value = true
    wards.value = await fetchVietnamWards(selectedProvinceCode.value, districtCode)
  } catch {
    wards.value = []
    message.error('Không tải được danh sách phường / xã mới nhất')
  } finally {
    wardLoading.value = false
  }
}

async function handleProvinceChange() {
  const province = provinces.value.find((item) => String(item.code) === String(selectedProvinceCode.value))
  form.value.shippingProvince = province?.name || ''
  form.value.shippingDistrict = ''
  form.value.shippingWard = ''
  selectedDistrictCode.value = ''
  selectedWardCode.value = ''
  districts.value = []
  wards.value = []
  clearFieldError('shippingProvince')

  if (selectedProvinceCode.value) {
    await loadDistricts(selectedProvinceCode.value)
    handlePreview()
  }
}

async function handleDistrictChange() {
  const district = districts.value.find((item) => String(item.code) === String(selectedDistrictCode.value))
  form.value.shippingDistrict = district?.name || ''
  form.value.shippingWard = ''
  selectedWardCode.value = ''
  wards.value = []
  clearFieldError('shippingDistrict')

  if (selectedDistrictCode.value) {
    await loadWards(selectedDistrictCode.value)
    handlePreview()
  }
}

function handleWardChange() {
  const ward = wards.value.find((item) => String(item.code) === String(selectedWardCode.value))
  form.value.shippingWard = ward?.name || ''
  clearFieldError('shippingWard')
  handlePreview()
}

async function syncLocationSelectionsByName() {
  if (!form.value.shippingProvince || !provinces.value.length) return

  const province = findAddressUnitByName(provinces.value, form.value.shippingProvince)
  if (!province) return
  selectedProvinceCode.value = String(province.code)
  await loadDistricts(province.code)

  let district = findAddressUnitByName(districts.value, form.value.shippingDistrict)
  if (!district && districts.value.length === 1) {
    district = districts.value[0]
    form.value.shippingDistrict = district.name
  }
  if (!district) return
  selectedDistrictCode.value = String(district.code)
  await loadWards(district.code)

  const ward = findAddressUnitByName(wards.value, form.value.shippingWard)
  if (ward) {
    selectedWardCode.value = String(ward.code)
  }
}

async function applySavedAddress() {
  const address = savedAddresses.value.find((item) => String(item.id) === String(selectedSavedAddressId.value))
  fillReceiverFromAddress(address)
  await syncLocationSelectionsByName()
  handlePreview()
}

async function loadAvailableVouchers() {
  try {
    const customerId = authStore.currentUser?.customerInfo?.id || null
    const res = await api.get('/vouchers/available', { params: { customerId } })
    availableVouchers.value = res.data || []
  } catch (e) {
    console.warn('Không tải được danh sách voucher', e)
  }
}

function resetResolvedCartAfterSuccess() {
  cartStore.resetCart()
  cart.value = { cartId: null, items: [] }
}

async function loadCheckoutData() {
  loading.value = true
  error.value = ''
  try {
    const cartRes = await getCurrentCart()
    const cartData = cartRes.data || {}

    cart.value = {
      cartId: cartData.cartId || null,
      items: Array.isArray(cartData.items) ? cartData.items : [],
    }

    if (!selectedItems.value.length) {
      error.value = 'Giỏ hàng chưa có sản phẩm nào được chọn để thanh toán.'
      return
    }

    if (authStore.isAuthenticated) {
      try {
        const accountRes = await api.get('/auth/me')
        const account = accountRes.data || {}
        authStore.updateCurrentUser({ ...account })
        fillOrdererFromAuth()

        const addressRes = await api.get('/auth/me/addresses')
        savedAddresses.value = Array.isArray(addressRes.data) ? addressRes.data : []

        const defaultAddress = savedAddresses.value.find((item) => item.isDefault === 1)
        if (defaultAddress) {
          selectedSavedAddressId.value = String(defaultAddress.id)
          fillReceiverFromAddress(defaultAddress)
          await syncLocationSelectionsByName()
        }
      } catch (e) {
        console.warn("Không thể lấy thông tin địa chỉ đã lưu:", e);
      }
    }

    await loadAvailableVouchers()
    await handlePreview()
  } catch (e) {
    error.value = getErrorMessage(e, 'Không tải được dữ liệu thanh toán')
  } finally {
    loading.value = false
  }
}

async function handlePreview() {
  if (!validateTotalQuantityLimit()) return

  try {
    previewLoading.value = true
    const payload = {
      cartId: cart.value.cartId,
      customerId: authStore.currentUser?.customerInfo?.id || null,
      sessionKey: getCartSessionKey(),

      shippingProvinceCode: selectedProvinceCode.value || null,
      shippingProvince: form.value.shippingProvince || null,
      shippingDistrictCode: selectedDistrictCode.value || null,
      shippingDistrict: form.value.shippingDistrict || null,
      shippingWardCode: selectedWardCode.value || null,
      shippingWard: form.value.shippingWard || null,

      voucherCode: selectedVoucherCode.value || null,
      freeShipVoucherCode: selectedFreeShipCode.value || null,
    }

    const res = await previewCheckout(payload)
    preview.value = res.data || {}
  } catch (e) {
    message.error(getErrorMessage(e, 'Không thể tính toán đơn hàng'))
    selectedVoucherCode.value = ''
    selectedFreeShipCode.value = ''
  } finally {
    previewLoading.value = false
  }
}

function validateForm() {
  const errors = {}

  if (!isValidName(form.value.ordererName)) errors.ordererName = 'Vui lòng nhập họ tên người đặt'
  if (form.value.ordererEmail?.trim() && !isValidEmail(form.value.ordererEmail)) errors.ordererEmail = 'Email sai định dạng'
  if (form.value.ordererPhone?.trim() && !isValidPhone(form.value.ordererPhone)) errors.ordererPhone = 'SĐT người đặt không hợp lệ'

  if (!isValidName(form.value.receiverName)) errors.receiverName = 'Vui lòng nhập tên người nhận'
  if (!form.value.receiverPhone?.trim()) errors.receiverPhone = 'Vui lòng nhập SĐT người nhận'
  else if (!isValidPhone(form.value.receiverPhone)) errors.receiverPhone = 'SĐT người nhận không hợp lệ'

  if (!selectedProvinceCode.value || !form.value.shippingProvince?.trim()) errors.shippingProvince = 'Vui lòng chọn tỉnh / thành phố'
  if (!selectedDistrictCode.value || !form.value.shippingDistrict?.trim()) errors.shippingDistrict = 'Vui lòng chọn quận / huyện'
  if (!selectedWardCode.value || !form.value.shippingWard?.trim()) errors.shippingWard = 'Vui lòng chọn phường / xã'

  if (!form.value.shippingDetailAddress?.trim()) errors.shippingDetailAddress = 'Vui lòng nhập địa chỉ chi tiết'

  if (!form.value.paymentMethod) errors.paymentMethod = 'Vui lòng chọn hình thức thanh toán'

  fieldErrors.value = errors
  if (Object.keys(errors).length) {
    message.warning(Object.values(errors)[0])
    return false
  }
  return true
}

async function handleSubmitCheckout() {
  if (!validateTotalQuantityLimit()) return
  if (!validateForm()) return

  try {
    submitting.value = true
    const payload = {
      cartId: cart.value.cartId,
      customerId: authStore.currentUser?.customerInfo?.id || null,
      sessionKey: getCartSessionKey(),
      paymentMethod: form.value.paymentMethod,
      voucherCode: selectedVoucherCode.value || null,
      freeShipVoucherCode: selectedFreeShipCode.value || null,

      ordererName: form.value.ordererName || null,
      ordererEmail: form.value.ordererEmail || null,
      ordererPhone: form.value.ordererPhone || null,

      receiverName: form.value.receiverName,
      receiverPhone: form.value.receiverPhone,

      shippingProvinceCode: selectedProvinceCode.value || null,
      shippingProvince: form.value.shippingProvince,
      shippingDistrictCode: selectedDistrictCode.value || null,
      shippingDistrict: form.value.shippingDistrict,
      shippingWardCode: selectedWardCode.value || null,
      shippingWard: form.value.shippingWard,

      shippingDetailAddress: form.value.shippingDetailAddress,
      addressLabel: form.value.addressLabel || null,
      note: form.value.note || null,
    }

    const res = await submitCheckout(payload)
    const data = res.data || {}

    if (data.paymentUrl) {
      window.location.href = data.paymentUrl
      return
    }

    resetResolvedCartAfterSuccess()
    message.success('Đặt hàng thành công')
    router.push({
      name: 'StorefrontCheckoutSuccess',
      query: {
        orderCode: data.orderCode,
        lookupCode: data.lookupCode,
        total: data.finalAmount,
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentMethod,
      },
    })
  } catch (e) {
    message.error(getErrorMessage(e, 'Đặt hàng thất bại'))
  } finally {
    submitting.value = false
  }
}

const clearErr = (field) => watch(() => form.value[field], () => clearFieldError(field))
clearErr('ordererName'); clearErr('receiverName'); clearErr('receiverPhone'); clearErr('shippingDetailAddress'); clearErr('paymentMethod');

onMounted(async () => {
  await loadProvinces()
  await loadCheckoutData()
})
</script>

<style scoped>
.checkout-page {
  padding: 32px 16px;
  background: #f8fafc;
  min-height: 100vh;
}

.checkout-shell {
  max-width: 1140px;
  margin: 0 auto;
  background: transparent;
}

.checkout-header {
  margin-bottom: 24px;
}

.checkout-header h1 {
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 800;
  color: #0f172a;
}

.checkout-header p {
  margin: 0;
  color: #64748b;
  font-size: 15px;
}

.checkout-layout {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
  align-items: start;
}

.checkout-main,
.checkout-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.checkout-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
}

.checkout-card h3 {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.section-head h3 {
  margin: 0;
  padding: 0;
  border: none;
}

.checkbox-wrapper {
  margin-bottom: 16px;
}
.check-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #0f172a;
  font-weight: 600;
}
.check-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #2563eb;
  cursor: pointer;
}

.address-select {
  min-width: 260px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 8px 12px;
  outline: none;
  background: #f8fafc;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-field label {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-field input,
.form-field textarea,
.form-field select {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 12px 14px;
  outline: none;
  background: #fff;
  transition: all 0.2s ease;
  font-size: 14px;
  color: #0f172a;
}

.form-field input:focus,
.form-field textarea:focus,
.form-field select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-field textarea {
  resize: vertical;
}

.required {
  color: #ef4444;
}

.input-error {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
}

.error-text {
  color: #ef4444;
  font-size: 12px;
  margin-top: -2px;
}

/* ================== VOUCHER MENU UI (NEW) ================== */
.voucher-triggers {
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fafbfc;
}
.vt-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0 16px;
}
.voucher-trigger-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  cursor: pointer;
  transition: background 0.2s;
}
.voucher-trigger-row:hover {
  background: #f1f5f9;
}
.voucher-trigger-row:first-child { border-radius: 12px 12px 0 0; }
.voucher-trigger-row:last-child { border-radius: 0 0 12px 12px; }

.voucher-trigger-row.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.voucher-trigger-row.is-disabled:hover {
  background: transparent;
}

.vt-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}
.bg-discount { background: #ee4d2d; } /* Đỏ Shopee */
.bg-freeship { background: #00bfa5; } /* Xanh Freeship */

.vt-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.vt-label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}
.vt-placeholder {
  font-size: 14px;
  color: #94a3b8;
}
.vt-placeholder.success {
  color: #059669;
  font-weight: 600;
}
.vt-selected {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}
.vt-arrow {
  color: #cbd5e1;
  font-size: 20px;
  font-weight: 300;
  margin-left: 8px;
}

/* ================== VOUCHER MODAL TICKET UI ================== */
.v-modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(15, 23, 42, 0.6);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.v-modal-overlay.is-active {
  opacity: 1;
  pointer-events: auto;
}

.v-modal-content {
  background: #f3f4f6;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  transform: translateY(20px);
  transition: transform 0.3s ease;
}
.v-modal-overlay.is-active .v-modal-content {
  transform: translateY(0);
}

.v-modal-header {
  padding: 20px 24px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 16px 16px 0 0;
}
.v-modal-header h3 { margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; }
.btn-close { background: transparent; border: none; font-size: 18px; cursor: pointer; color: #64748b; }

.v-modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}
.v-modal-empty {
  text-align: center;
  padding: 40px 0;
  color: #64748b;
}

/* THẺ VOUCHER (TICKET) */
.v-ticket {
  display: flex;
  background: #fff;
  height: 110px;
  margin-bottom: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
}
.v-ticket:hover:not(.is-disabled) {
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
}
.v-ticket.is-selected {
  border-color: #ee4d2d; /* Viền đỏ khi được chọn */
  background: #fff5f5;
}
.v-ticket.is-disabled {
  opacity: 0.6;
  background: #f8fafc;
  cursor: not-allowed;
}
.v-ticket.is-disabled .v-ticket-left {
  background: #cbd5e1;
}

.v-ticket-left {
  width: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  border-right: 2px dashed #e2e8f0; /* Đường cắt viền */
}
.v-ticket-right {
  flex: 1;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.v-ticket-info h4 {
  margin: 0 0 6px;
  font-size: 15px;
  color: #1e293b;
  font-weight: 700;
}
.v-ticket-desc {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}
.v-ticket-error {
  margin: 6px 0 0;
  font-size: 12px;
  color: #ef4444;
}

/* Nút Radio tròn ảo */
.radio-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.v-ticket.is-selected .radio-circle {
  border-color: #ee4d2d;
}
.radio-inner {
  width: 10px;
  height: 10px;
  background: #ee4d2d;
  border-radius: 50%;
}

.v-modal-footer {
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #e2e8f0;
  border-radius: 0 0 16px 16px;
  display: flex;
  gap: 12px;
}


/* ================== CÁC CSS CŨ GIỮ NGUYÊN ================== */
.payment-options { display: flex; flex-direction: column; gap: 12px; }
.payment-option {
  display: flex; align-items: flex-start; gap: 12px; border: 1px solid #e2e8f0;
  border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s ease; background: #fff;
}
.payment-option:hover { border-color: #94a3b8; }
.payment-option.active { border-color: #2563eb; background: #eff6ff; }
.payment-option input[type="radio"] { margin-top: 4px; accent-color: #2563eb; width: 18px; height: 18px; }
.payment-option strong { display: block; font-size: 15px; color: #0f172a; margin-bottom: 4px; }
.payment-option p { margin: 0; color: #64748b; font-size: 13px; line-height: 1.5; }

.summary-items { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; max-height: 350px; overflow-y: auto; padding-right: 8px; }
.summary-items::-webkit-scrollbar { width: 4px; }
.summary-items::-webkit-scrollbar-track { background: #f1f5f9; }
.summary-items::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.summary-item { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0; }
.summary-item__info { display: flex; flex-direction: column; gap: 6px; }
.summary-item__info strong { font-size: 14px; color: #1e293b; line-height: 1.4; }
.summary-item__info span { color: #64748b; font-size: 13px; }
.summary-item__price { font-weight: 700; color: #0f172a; font-size: 15px; }

.summary-details { background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 20px; }
.summary-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; color: #475569; font-size: 14px; }
.summary-row:last-child { margin-bottom: 0; }
.summary-row strong { color: #0f172a; }
.text-success { color: #059669 !important; }
.text-danger { color: #dc2626 !important; }
.checkout-limit-warning { margin: 10px 0; padding: 10px 12px; border: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; border-radius: 10px; font-size: 13px; line-height: 1.5; }
.summary-row--total { border-top: 1px solid #cbd5e1; padding-top: 16px; margin-top: 4px; font-size: 16px; color: #0f172a; font-weight: 700; }
.total-price { font-size: 24px; color: #2563eb !important; font-weight: 800; }

.btn { border: none; border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s ease; font-weight: 700; font-size: 16px; text-align: center; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-primary { background: #0f172a; color: #fff; }
.btn-secondary { background: #e2e8f0; color: #0f172a; }
.btn-primary:hover:not(:disabled) { background: #1e293b; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2); }
.btn-block { width: 100%; }

.checkout-state { padding: 24px; border-radius: 12px; background: #fff; text-align: center; font-weight: 600; color: #64748b; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.checkout-state--error { background: #fef2f2; color: #ef4444; border: 1px solid #fca5a5; }

@media (max-width: 1024px) { .checkout-layout { grid-template-columns: 1fr; } }
@media (max-width: 768px) {
  .checkout-page { padding: 16px 8px; }
  .checkout-card { padding: 16px; }
  .form-grid { grid-template-columns: 1fr; }
  .section-head { flex-direction: column; align-items: stretch; }
  .address-select { width: 100%; }
}
</style>
