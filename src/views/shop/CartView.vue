<template>
  <div class="cart-page">
    <section class="cart-shell">
      <div class="cart-header">
        <div class="cart-header__text">
          <p class="cart-header__eyebrow">GIỎ HÀNG</p>
          <h1>Giỏ hàng của bạn</h1>
          <p class="cart-header__desc">Kiểm tra sản phẩm, giá khuyến mãi và số lượng trước khi sang bước thanh toán.</p>
        </div>

        <button
          class="btn btn-clear"
          type="button"
          @click="handleClearCart"
          :disabled="loading || !cart.items.length"
        >
          Xóa toàn bộ
        </button>
      </div>

      <div v-if="loading" class="cart-state">
        <span class="loader"></span> Đang tải giỏ hàng...
      </div>

      <div v-else-if="error" class="cart-state cart-state--error">
        {{ error }}
      </div>

      <div v-else-if="!cart.items.length" class="empty-state">
        <div class="empty-state__icon">🛒</div>
        <h3>Giỏ hàng đang trống</h3>
        <p>Hãy thêm vài sản phẩm bạn yêu thích rồi quay lại thanh toán.</p>
      </div>

      <div v-else class="cart-layout">
        <div class="cart-items">
          <article
            v-for="item in cart.items"
            :key="item.itemId"
            class="cart-item"
            :class="{ 'cart-item--disabled': item.stock <= 0 }"
          >
            <div class="cart-item__select">
              <label class="custom-checkbox">
                <input
                  type="checkbox"
                  :checked="item.selected"
                  @change="toggleSelection(item, $event)"
                />
                <span class="checkmark"></span>
              </label>
            </div>

            <div class="cart-item__image">
              <img :src="resolveCartImage(item.imageUrl, item.productName)" :alt="item.productName" />
            </div>

            <div class="cart-item__content">
              <h3>{{ item.productName }}</h3>
              <p class="sku">SKU: {{ item.sku || '---' }}</p>
              <p class="variant">
                <span v-if="item.color">Màu: {{ item.color }}</span>
                <span v-if="item.size" class="divider">|</span>
                <span v-if="item.size">Size: {{ item.size }}</span>
              </p>
              <p class="stock">
                <span v-if="item.stock > 0" class="in-stock">Tồn kho: {{ item.stock }}</span>
                <span v-else class="out-of-stock">Hết hàng</span>
              </p>
              <div v-if="item.onSale && item.promotionName" class="promotion-tag">
                <span>{{ item.promotionName }}</span>
              </div>
            </div>

            <div class="cart-item__price">
              <template v-if="item.onSale && item.originalUnitPrice > item.unitPrice">
                <div class="price-current">{{ formatVnd(item.unitPrice) }}</div>
                <div class="price-old">{{ formatVnd(item.originalUnitPrice) }}</div>
                <div class="price-save">Tiết kiệm {{ formatVnd(item.discountAmount) }}</div>
              </template>
              <template v-else>
                <div class="price-current">{{ formatVnd(item.unitPrice) }}</div>
              </template>
            </div>

            <div class="cart-item__qty">
              <button
                class="qty-btn"
                type="button"
                @click="decreaseQty(item)"
                :disabled="item.quantity <= 1 || pendingItemId === item.itemId"
              >
                -
              </button>
              <input
                class="qty-input"
                type="number"
                :value="item.quantity"
                @change="changeQty(item, $event)"
                :disabled="pendingItemId === item.itemId"
              />
              <button
                class="qty-btn"
                type="button"
                @click="increaseQty(item)"
                :disabled="item.quantity >= item.stock || pendingItemId === item.itemId || item.stock <= 0"
              >
                +
              </button>
            </div>

            <div class="cart-item__total">
              {{ formatVnd(item.lineTotal) }}
            </div>

            <div class="cart-item__actions">
              <button
                class="btn btn-remove"
                type="button"
                @click="handleRemoveItem(item)"
                :disabled="pendingItemId === item.itemId"
              >
                Xóa
              </button>
            </div>
          </article>
        </div>

        <aside class="cart-summary">
          <h3>Tóm tắt đơn hàng</h3>

          <div class="summary-body">
            <div class="summary-row">
              <span>Tổng số lượng</span>
              <strong>{{ totalItems }}</strong>
            </div>
            <div class="summary-row">
              <span>Sản phẩm đã chọn</span>
              <strong>{{ selectedItemCount }}</strong>
            </div>
          </div>

          <div class="summary-row summary-row--total">
            <span>Tạm tính</span>
            <strong>{{ formatVnd(subtotal) }}</strong>
          </div>

          <button
            class="btn btn-checkout"
            type="button"
            :disabled="selectedItemCount === 0"
            @click="handleProceedCheckout"
          >
            Tiếp tục thanh toán
          </button>
        </aside>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getErrorMessage } from '@/utils/error'
import {
  clearCart,
  getCurrentCart,
  removeCartItem,
  updateCartItemQuantity,
  updateCartItemSelection,
} from '@/api/cart.api'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cartStore = useCartStore()

const FILE_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const loading = ref(true)
const error = ref('')
const pendingItemId = ref(null)

const cart = ref({
  cartId: null,
  items: [],
  totalItems: 0,
  selectedItemCount: 0,
  subtotal: 0,
})

const totalItems = computed(() => Number(cart.value.totalItems || 0))
const selectedItemCount = computed(() => Number(cart.value.selectedItemCount || 0))
const subtotal = computed(() => Number(cart.value.subtotal || 0))

function svgPlaceholder(label, width = 120, height = 120, bg = '#f3f4f6', fg = '#111111') {
  const safeLabel = String(label || 'No Image')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${bg}"/>
          <stop offset="100%" stop-color="#ffffff"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <rect x="8" y="8" width="${width - 16}" height="${height - 16}" rx="12" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="2"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="'Inter', sans-serif" font-size="${Math.max(10, Math.min(width, height) / 8)}" font-weight="800" fill="${fg}">${safeLabel}</text>
    </svg>
  `
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function normalizeImageUrl(path, fallbackLabel = 'No Image') {
  if (!path) return svgPlaceholder(fallbackLabel)
  const value = String(path).trim()
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) return value
  return `${FILE_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`
}

function resolveCartImage(path, productName) {
  return normalizeImageUrl(path, productName || 'Sneaker')
}

function applyCartData(data = {}) {
  cart.value = {
    cartId: data.cartId || null,
    items: Array.isArray(data.items) ? data.items : [],
    totalItems: Number(data.totalItems || 0),
    selectedItemCount: Number(data.selectedItemCount || 0),
    subtotal: Number(data.subtotal || 0),
  }
  cartStore.setCartCount(cart.value.totalItems)
}

async function loadCart() {
  loading.value = true
  error.value = ''
  try {
    const res = await getCurrentCart()
    applyCartData(res.data || {})
  } catch (e) {
    error.value = getErrorMessage(e, 'Không tải được giỏ hàng')
  } finally {
    loading.value = false
  }
}

async function increaseQty(item) {
  if (item.quantity >= item.stock) return
  await updateQuantity(item, item.quantity + 1)
}

async function decreaseQty(item) {
  if (item.quantity <= 1) return
  await updateQuantity(item, item.quantity - 1)
}

async function changeQty(item, event) {
  const rawValue = Number(event.target.value)
  const safeValue = Number.isFinite(rawValue) ? rawValue : item.quantity
  if (safeValue < 1) {
    event.target.value = item.quantity
    return
  }
  if (safeValue > item.stock) {
    event.target.value = item.stock
    await updateQuantity(item, item.stock)
    return
  }
  await updateQuantity(item, safeValue)
}

async function updateQuantity(item, quantity) {
  try {
    pendingItemId.value = item.itemId
    const res = await updateCartItemQuantity(item.itemId, quantity)
    applyCartData(res.data || {})
  } catch (e) {
    message.error(getErrorMessage(e, 'Cập nhật số lượng thất bại'))
  } finally {
    pendingItemId.value = null
  }
}

async function toggleSelection(item, event) {
  try {
    pendingItemId.value = item.itemId
    const res = await updateCartItemSelection(item.itemId, event.target.checked)
    applyCartData(res.data || {})
  } catch (e) {
    message.error(getErrorMessage(e, 'Cập nhật lựa chọn thất bại'))
  } finally {
    pendingItemId.value = null
  }
}

async function handleRemoveItem(item) {
  try {
    pendingItemId.value = item.itemId
    const res = await removeCartItem(item.itemId)
    applyCartData(res.data || {})
    message.success('Đã xóa sản phẩm khỏi giỏ hàng')
  } catch (e) {
    message.error(getErrorMessage(e, 'Xóa sản phẩm thất bại'))
  } finally {
    pendingItemId.value = null
  }
}

async function handleClearCart() {
  const confirmed = window.confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng không?')
  if (!confirmed) return
  try {
    const res = await clearCart()
    applyCartData(res.data || {})
    message.success('Đã xóa toàn bộ giỏ hàng')
  } catch (e) {
    message.error(getErrorMessage(e, 'Xóa giỏ hàng thất bại'))
  }
}

function handleProceedCheckout() {
  router.push('/thanh-toan')
}

function formatVnd(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(value || 0))
}

onMounted(loadCart)
</script>

<style scoped>
/* ==================== GLOBAL LAYOUT ==================== */
.cart-page {
  padding: 40px 20px;
  background: #f8fafc;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.cart-shell {
  width: 100%;
  max-width: 1200px;
  background: #ffffff;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}

/* ==================== HEADER ==================== */
.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f1f5f9;
}

.cart-header__eyebrow {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #64748b;
  text-transform: uppercase;
}

.cart-header h1 {
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 800;
  color: #0f172a;
}

.cart-header__desc {
  margin: 0;
  color: #64748b;
  font-size: 15px;
}

/* ==================== MAIN GRID ==================== */
.cart-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 32px;
  align-items: start;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ==================== CART ITEM ==================== */
.cart-item {
  display: grid;
  grid-template-columns: 30px 100px 2fr 1.5fr auto 1.2fr auto;
  gap: 20px;
  align-items: center;
  padding: 20px;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  background: #ffffff;
  transition: all 0.2s ease;
}

.cart-item:hover {
  border-color: #e2e8f0;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
}

.cart-item--disabled {
  opacity: 0.6;
  filter: grayscale(100%);
}

/* Checkbox Customization */
.cart-item__select {
  display: flex;
  justify-content: center;
}

.custom-checkbox {
  position: relative;
  display: block;
  width: 20px;
  height: 20px;
  cursor: pointer;
}
.custom-checkbox input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}
.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 20px;
  width: 20px;
  background-color: #fff;
  border: 2px solid #cbd5e1;
  border-radius: 6px;
  transition: 0.2s ease;
}
.custom-checkbox:hover input ~ .checkmark {
  border-color: #3b82f6;
}
.custom-checkbox input:checked ~ .checkmark {
  background-color: #3b82f6;
  border-color: #3b82f6;
}
.checkmark:after {
  content: "";
  position: absolute;
  display: none;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.custom-checkbox input:checked ~ .checkmark:after {
  display: block;
}

/* Image */
.cart-item__image img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 12px;
  background: #f8fafc;
}

/* Product Content */
.cart-item__content h3 {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.sku, .variant, .stock {
  margin: 4px 0;
  color: #64748b;
  font-size: 13px;
}

.variant .divider {
  margin: 0 6px;
  color: #cbd5e1;
}

.in-stock {
  color: #059669;
  font-weight: 600;
}

.out-of-stock {
  color: #e11d48;
  font-weight: 600;
}

/* Promotion Tag - Circular Bubble */
.promotion-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #ffe4e6;
  color: #e11d48;
  font-size: 11px;
  font-weight: 800;
  text-align: center;
  line-height: 1.2;
}

/* Pricing */
.cart-item__price {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.price-current {
  font-weight: 700;
  color: #0f172a;
  font-size: 16px;
}

.price-old {
  font-size: 13px;
  color: #94a3b8;
  text-decoration: line-through;
}

.price-save {
  font-size: 12px;
  color: #e11d48;
  font-weight: 700;
}

/* Quantity Control */
.cart-item__qty {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border-radius: 8px;
  padding: 4px;
  border: 1px solid #e2e8f0;
}

.qty-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #0f172a;
  color: #ffffff;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}

.qty-btn:disabled {
  background: #cbd5e1;
  color: #64748b;
  cursor: not-allowed;
}

.qty-input {
  width: 40px;
  height: 28px;
  border: none;
  background: transparent;
  text-align: center;
  font-weight: 700;
  color: #0f172a;
  -moz-appearance: textfield;
}
.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Item Line Total */
.cart-item__total {
  font-weight: 800;
  color: #0f172a;
  font-size: 16px;
  text-align: right;
}

/* ==================== SUMMARY SIDEBAR ==================== */
.cart-summary {
  position: sticky;
  top: 24px;
  border: 1px solid #f1f5f9;
  border-radius: 20px;
  padding: 24px;
  background: #fafafa;
  box-shadow: 0 4px 15px rgba(0,0,0,0.02);
}

.cart-summary h3 {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
}

.summary-body {
  border-bottom: 1px dashed #cbd5e1;
  padding-bottom: 16px;
  margin-bottom: 16px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: #64748b;
  font-size: 15px;
}
.summary-row:last-child {
  margin-bottom: 0;
}

.summary-row strong {
  color: #0f172a;
  font-weight: 700;
}

.summary-row--total {
  font-size: 18px;
}
.summary-row--total strong {
  font-size: 22px;
  font-weight: 800;
}

/* ==================== BUTTONS ==================== */
.btn {
  border: none;
  border-radius: 10px;
  padding: 10px 18px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-remove {
  background: #fee2e2;
  color: #ef4444;
}
.btn-remove:hover:not(:disabled) {
  background: #fecaca;
}
.btn-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-clear {
  background: #0f172a;
  color: #ffffff;
  padding: 12px 24px;
}
.btn-clear:hover:not(:disabled) {
  background: #1e293b;
}
.btn-clear:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.btn-checkout {
  width: 100%;
  margin-top: 24px;
  background: #272f3e;
  color: #ffffff;
  padding: 16px;
  font-size: 16px;
  border-radius: 12px;
}
.btn-checkout:hover:not(:disabled) {
  background: #0f172a;
}
.btn-checkout:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

/* ==================== STATES ==================== */
.cart-state, .empty-state {
  padding: 40px;
  border-radius: 16px;
  background: #f8fafc;
  text-align: center;
  color: #64748b;
}

.empty-state__icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.empty-state h3 {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: 20px;
}

.cart-state--error {
  background: #fee2e2;
  color: #e11d48;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 1200px) {
  .cart-item {
    grid-template-columns: 30px 90px 2fr 1.5fr auto 1fr auto;
    gap: 16px;
  }
}

@media (max-width: 992px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }
  .cart-summary {
    position: static;
  }
}

@media (max-width: 768px) {
  .cart-page { padding: 16px; }
  .cart-shell { padding: 20px; border-radius: 16px; }

  .cart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .cart-header h1 { font-size: 24px; }

  .cart-item {
    grid-template-columns: 30px 80px 1fr;
    grid-template-areas:
      "check img info"
      "check img info"
      ". . price"
      ". . qty"
      ". . action";
    padding: 16px;
  }

  .cart-item__select { grid-area: check; }
  .cart-item__image { grid-area: img; }
  .cart-item__content { grid-area: info; }
  .cart-item__price { grid-area: price; margin-top: 8px;}
  .cart-item__qty { grid-area: qty; justify-content: flex-start; width: max-content; margin-top: 8px;}
  .cart-item__total { display: none; } /* Hide line total on small mobile */
  .cart-item__actions { grid-area: action; margin-top: 8px; text-align: left; }
}
</style>
