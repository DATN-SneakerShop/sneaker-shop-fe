<template>
  <div class="product-page-container">
    <nav class="breadcrumb" v-if="!loading && !error">
      <span>Trang chủ</span>
      <span class="separator">/</span>
      <span>Sản phẩm</span>
      <span class="separator">/</span>
      <span class="current">{{ product.name }}</span>
    </nav>

    <div v-if="loading" class="skeleton-wrapper grid-layout">
      <div class="left-column">
        <div class="skeleton-gallery glass-card">
          <div class="skeleton-main-image skeleton-anim"></div>
          <div class="skeleton-thumbnails">
            <div v-for="i in 5" :key="i" class="skeleton-thumb skeleton-anim"></div>
          </div>
        </div>
      </div>
      <div class="right-column">
        <div class="skeleton-info glass-card">
          <div class="skeleton-title skeleton-anim"></div>
          <div class="skeleton-meta skeleton-anim" style="width: 40%"></div>
          <div class="skeleton-price skeleton-anim"></div>
          <div class="skeleton-variant skeleton-anim" style="width: 70%"></div>
          <div class="skeleton-variant skeleton-anim" style="width: 90%"></div>
          <div class="skeleton-button-group">
            <div class="skeleton-button skeleton-anim"></div>
            <div class="skeleton-button skeleton-anim"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="error-state glass-card">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="loadProductDetail" class="btn-retry">Thử lại ngay</button>
    </div>

    <div v-else-if="product.id" class="product-detail-shell grid-layout">

      <div class="left-column">
        <section class="gallery-section glass-card">
          <div class="main-image-box">
            <img :src="currentDisplayImage" :alt="product.name" @error="handleImageError" />
            <div class="image-floating-badges">
              <span v-if="hasDiscount" class="floating-badge sale">Giảm giá</span>
              <span v-if="selectedVariant?.stock > 0" class="floating-badge stock">Còn hàng</span>
            </div>
          </div>

          <div class="thumbnail-list" v-if="allImages.length > 1">
            <div
              v-for="(img, idx) in allImages"
              :key="idx"
              class="thumbnail-item"
              :class="{ active: currentDisplayImage === img.url }"
              @click="selectImage(img.url)"
            >
              <img
                :src="img.thumbnail || img.url"
                :alt="`${product.name} thumbnail ${idx}`"
                @error="handleImageError"
              />
              <div class="thumbnail-overlay"></div>
            </div>
          </div>
        </section>

        <section class="product-description glass-card" v-if="product.description">
          <div class="desc-header">
            <h4>Mô tả chi tiết</h4>
          </div>
          <div class="desc-content">
            <p>{{ product.description }}</p>
          </div>
        </section>
      </div>

      <div class="right-column">
        <section class="info-section">

          <div class="product-header glass-card">
            <div class="eyebrow-row">
              <span class="eyebrow">SNEAKER SHOP</span>
              <span class="stock-pill" :class="{ active: maxStock > 0 }">
                <span class="status-dot" :class="{ 'in-stock': maxStock > 0, 'out-stock': maxStock <= 0 }"></span>
                {{ maxStock > 0 ? 'Còn hàng' : 'Tạm hết hàng' }}
              </span>
            </div>

            <h1 class="product-title">{{ product.name }}</h1>

            <div class="product-meta">
              <div class="meta-chip">
                <span class="label">Mã SP</span>
                <strong>{{ product.sku || 'Đang cập nhật' }}</strong>
              </div>
              <div class="meta-chip" v-if="selectedVariant?.colorway">
                <span class="label">Màu</span>
                <strong>{{ selectedVariant.colorway }}</strong>
              </div>
              <div class="meta-chip" v-if="selectedVariant?.size">
                <span class="label">Size</span>
                <strong>{{ selectedVariant.size }}</strong>
              </div>
              <div class="meta-chip" v-if="product.material">
                <span class="label">Chất liệu</span>
                <strong>{{ product.material }}</strong>
              </div>
              <div class="meta-chip" v-if="product.sole">
                <span class="label">Đế</span>
                <strong>{{ product.sole }}</strong>
              </div>
            </div>
          </div>

          <div class="purchase-box glass-card">

            <div class="price-board">
              <div class="price-topline">Giá bán</div>
              <template v-if="selectedVariant">
                <div class="price-current">{{ formatVnd(selectedVariant.price) }}</div>
                <div
                  v-if="
                    selectedVariant.originalPrice &&
                    selectedVariant.originalPrice > 0 &&
                    selectedVariant.originalPrice > selectedVariant.price
                  "
                  class="price-old-wrapper"
                >
                  <span class="price-old">{{ formatVnd(selectedVariant.originalPrice) }}</span>
                  <span class="discount-badge">
                    -{{ Math.round((1 - selectedVariant.price / selectedVariant.originalPrice) * 100) }}%
                  </span>
                  <span class="save-amount">
                    Tiết kiệm {{ formatVnd(selectedVariant.originalPrice - selectedVariant.price) }}
                  </span>
                </div>
              </template>
              <template v-else>
                <div class="price-current">{{ priceRange }}</div>
              </template>
            </div>

            <hr class="section-divider" />

            <div class="selection-panel">
              <div class="variants-container">
                <div class="variant-group" v-if="availableColors.length">
                  <div class="variant-header">
                    <h4 class="variant-label">Màu sắc</h4>
                    <span class="selected-value">{{ selectedColor || 'Chưa chọn' }}</span>
                  </div>
                  <div class="variant-options">
                    <button
                      v-for="color in availableColors"
                      :key="color"
                      class="variant-btn"
                      :class="{
                        active: color === selectedColor,
                        disabled: !isColorAvailable(color)
                      }"
                      :disabled="!isColorAvailable(color)"
                      @click="selectColor(color)"
                    >
                      {{ color }}
                    </button>
                  </div>
                </div>

                <div class="variant-group" v-if="availableSizes.length">
                  <div class="variant-header">
                    <h4 class="variant-label">Kích cỡ</h4>
                    <span class="selected-value">{{ selectedSize || 'Chưa chọn' }}</span>
                  </div>
                  <div class="variant-options size-options">
                    <button
                      v-for="size in availableSizes"
                      :key="size"
                      class="variant-btn size-btn"
                      :class="{
                        active: size === selectedSize,
                        disabled: isSizeDisabled(size)
                      }"
                      :disabled="isSizeDisabled(size)"
                      @click="selectSize(size)"
                    >
                      {{ size }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="selection-summary" v-if="selectedVariant">
                <div class="summary-item">
                  <span>Biến thể đã chọn</span>
                  <strong>{{ selectedVariant.colorway || '-' }} / {{ selectedVariant.size || '-' }}</strong>
                </div>
                <div class="summary-item">
                  <span>Tồn kho</span>
                  <strong :class="{ 'danger-text': selectedVariant.stock <= 0 }">
                    {{ selectedVariant.stock > 0 ? `${selectedVariant.stock} sản phẩm` : 'Hết hàng' }}
                  </strong>
                </div>
              </div>
            </div>

            <hr class="section-divider" />

            <div class="purchase-panel">
              <div class="quantity-section">
                <div class="quantity-head">
                  <h4 class="variant-label">Số lượng</h4>
                </div>
                <div class="quantity-control-wrapper">
                  <div class="quantity-control">
                    <button class="qty-btn" @click="decreaseQty" :disabled="quantity <= 1 || !selectedVariant || selectedVariant.stock === 0">
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                    <input type="number" class="qty-input" v-model.number="quantity" @blur="validateQuantity" :disabled="!selectedVariant || selectedVariant.stock === 0" />
                    <button class="qty-btn" @click="increaseQty" :disabled="!selectedVariant || quantity >= maxStock || selectedVariant.stock === 0">
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                  </div>
                </div>
              </div>

              <div class="action-buttons">
                <button class="btn btn-add-cart" :disabled="!canAddToCart" @click="handleAddToCart">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="icon-btn">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Thêm vào giỏ
                </button>
                <button class="btn btn-buy-now" :disabled="!canAddToCart" @click="handleBuyNow">
                  Mua ngay
                </button>
              </div>
            </div>
          </div>

          <div class="product-policy glass-card">
            <div class="policy-item">
              <div class="policy-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                <strong>Đổi trả 7 ngày</strong>
                <span>Hỗ trợ nhanh chóng</span>
              </div>
            </div>
            <div class="policy-item">
              <div class="policy-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4V3.055A9.001 9.001 0 0012 21a9.001 9.001 0 00-3-17.945z"></path></svg>
              </div>
              <div>
                <strong>Chính hãng</strong>
                <span>Cam kết chất lượng</span>
              </div>
            </div>
            <div class="policy-item">
              <div class="policy-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
              </div>
              <div>
                <strong>Thanh toán</strong>
                <span>An toàn, tiện lợi</span>
              </div>
            </div>
          </div>

        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import { getErrorMessage } from '@/utils/error'
import { useRoute, useRouter } from 'vue-router'
import { getStorefrontProductDetail } from '@/api/product.api'
import { addToCart } from '@/api/cart.api'
import { useCartStore } from '@/stores/cart'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const product = ref({})
const variants = ref([])
const allImages = ref([])

const selectedColor = ref('')
const selectedSize = ref('')
const quantity = ref(1)

const loading = ref(true)
const error = ref('')

const activeImageUrl = ref('')

function svgPlaceholder(label = 'No Image', width = 600, height = 600) {
  const safeLabel = String(label)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <rect x="18" y="18" width="${width - 36}" height="${height - 36}" rx="16" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="2"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="800" fill="#111827">${safeLabel}</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const fallbackImage = svgPlaceholder('No Image')

const loadProductDetail = async () => {
  loading.value = true
  error.value = ''

  try {
    const res = await getStorefrontProductDetail(route.params.id)
    const data = res?.data ?? res

    product.value = data
    variants.value = data.variants || []

    const images = buildProductImages(data, variants.value)
    const mainImage = resolveMainProductImage(data, variants.value, images)

    allImages.value = images
    activeImageUrl.value = mainImage

    // Chỉ tự chọn biến thể mặc định để hiển thị giá/tồn kho.
    // KHÔNG đổi ảnh ở lần load đầu, vì yêu cầu là vào chi tiết phải show ngay ảnh đại diện của sản phẩm.
    initDefaultVariant(false)

    if (!activeImageUrl.value || activeImageUrl.value === fallbackImage) {
      activeImageUrl.value = mainImage || fallbackImage
    }
  } catch (e) {
    error.value = 'Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.'
    console.error('Lỗi tải chi tiết SP:', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadProductDetail)
watch(() => route.params.id, loadProductDetail)

const availableColors = computed(() => {
  return [...new Set(variants.value.map(v => v.colorway).filter(Boolean))]
})

const availableSizes = computed(() => {
  return [...new Set(variants.value.map(v => v.size).filter(Boolean))]
})

const selectedVariant = computed(() => {
  if (!selectedColor.value || !selectedSize.value) return null
  return variants.value.find(v => v.colorway === selectedColor.value && v.size === selectedSize.value)
})

const maxStock = computed(() => {
  return selectedVariant.value ? selectedVariant.value.stock : 0
})

const canAddToCart = computed(() => {
  return selectedVariant.value && selectedVariant.value.stock > 0 && quantity.value > 0 && quantity.value <= maxStock.value
})

const hasDiscount = computed(() => {
  return !!(
    selectedVariant.value &&
    selectedVariant.value.originalPrice &&
    selectedVariant.value.originalPrice > selectedVariant.value.price
  )
})

const priceRange = computed(() => {
  if (!variants.value.length) return '0 đ'
  const prices = variants.value
    .map(v => Number(v.price || 0))
    .filter(v => v > 0)

  if (!prices.length) return '0 đ'

  const min = Math.min(...prices)
  const max = Math.max(...prices)

  if (min === max) return formatVnd(min)
  return `${formatVnd(min)} - ${formatVnd(max)}`
})

const currentDisplayImage = computed(() => {
  return activeImageUrl.value || fallbackImage
})

function initDefaultVariant(shouldSyncVariantImage = true) {
  if (!variants.value.length) return

  const firstAvailable = variants.value.find(v => v.stock > 0) || variants.value[0]

  if (firstAvailable) {
    selectedColor.value = firstAvailable.colorway
    selectedSize.value = firstAvailable.size

    if (shouldSyncVariantImage) {
      updateImageFromVariant(firstAvailable)
    }
  }
}

function selectColor(color) {
  if (!isColorAvailable(color)) return
  selectedColor.value = color

  const validVariantForNewColor = variants.value.find(
    v => v.colorway === color && v.size === selectedSize.value && v.stock > 0
  )

  if (!validVariantForNewColor) {
    const firstValidSize = variants.value.find(v => v.colorway === color && v.stock > 0)
    selectedSize.value = firstValidSize ? firstValidSize.size : ''
  }

  quantity.value = 1

  const matchedVariant =
    variants.value.find(v => v.colorway === color && v.size === selectedSize.value) ||
    variants.value.find(v => v.colorway === color)

  updateImageFromVariant(matchedVariant)
}

function selectSize(size) {
  if (isSizeDisabled(size)) return
  selectedSize.value = size
  quantity.value = 1

  const matchedVariant = variants.value.find(
    v => v.colorway === selectedColor.value && v.size === size
  )
  updateImageFromVariant(matchedVariant)
}

function isColorAvailable(color) {
  return variants.value.some(v => v.colorway === color && v.stock > 0)
}

function isSizeDisabled(size) {
  if (!selectedColor.value) return false
  const variant = variants.value.find(v => v.size === size && v.colorway === selectedColor.value)
  return !variant || variant.stock === 0
}

function selectImage(url) {
  if (url) activeImageUrl.value = url
}

function updateImageFromVariant(variant) {
  const variantImage = normalizeImageUrl(variant?.imageUrl)
  if (variantImage && variantImage !== fallbackImage) {
    activeImageUrl.value = variantImage
  }
}

function handleImageError(e) {
  if (e?.target?.src !== fallbackImage) {
    e.target.src = fallbackImage
  }
}

function increaseQty() {
  if (quantity.value < maxStock.value) quantity.value++
}

function decreaseQty() {
  if (quantity.value > 1) quantity.value--
}

function validateQuantity() {
  if (typeof quantity.value !== 'number' || isNaN(quantity.value) || quantity.value < 1) {
    quantity.value = 1
  } else if (quantity.value > maxStock.value) {
    quantity.value = maxStock.value
  }
}

async function handleAddToCart() {
  if (!canAddToCart.value) return

  try {
    const payload = {
      variantId: selectedVariant.value.id,
      quantity: quantity.value,
    }

    await addToCart(payload)

    const currentCount = Number(
      cartStore.cartCount ?? cartStore.count ?? cartStore.totalItems ?? 0
    )
    cartStore.setCartCount(currentCount + quantity.value)

    message.success('Đã thêm sản phẩm vào giỏ hàng')
  } catch (e) {
    message.error(getErrorMessage(e, 'Không thể thêm vào giỏ hàng'))
  }
}

async function handleBuyNow() {
  if (!canAddToCart.value) return
  await handleAddToCart()
  router.push('/gio-hang')
}

function formatVnd(value) {
  if (!value && value !== 0) return ''
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value)
}
function getImageValue(img) {
  if (!img) return ''
  if (typeof img === 'string') return img
  return img.url || img.imageUrl || img.path || img.filePath || img.thumbnail || ''
}

function isPrimaryImage(img) {
  if (!img || typeof img !== 'object') return false
  return !!(img.thumbnail || img.isThumbnail || img.isMain || img.isPrimary || img.main || img.primary)
}

function pushUniqueImage(images, value, thumbnail) {
  const url = normalizeImageUrl(value)
  if (!url || url === fallbackImage || images.some(img => img.url === url)) return

  images.push({
    url,
    thumbnail: normalizeImageUrl(thumbnail || value),
  })
}

function buildProductImages(data, variantList) {
  const images = []

  pushUniqueImage(images, data?.thumbnail)
  pushUniqueImage(images, data?.imageUrl)

  const gallery = Array.isArray(data?.images) ? data.images : []
  const primaryImages = gallery.filter(isPrimaryImage)
  const normalImages = gallery.filter(img => !isPrimaryImage(img))

  primaryImages.forEach(img => pushUniqueImage(images, getImageValue(img), img?.thumbnail || img?.thumbnailUrl))
  normalImages.forEach(img => pushUniqueImage(images, getImageValue(img), img?.thumbnail || img?.thumbnailUrl))

  ;(variantList || []).forEach(variant => pushUniqueImage(images, variant?.imageUrl))

  return images
}

function resolveMainProductImage(data, variantList, images) {
  const candidates = [
    data?.thumbnail,
    route.query?.img,
    data?.imageUrl,
    ...(Array.isArray(data?.images) ? data.images.filter(isPrimaryImage).map(getImageValue) : []),
    ...(images || []).map(img => img.url),
    ...(variantList || []).map(variant => variant?.imageUrl),
  ]

  for (const candidate of candidates) {
    const url = normalizeImageUrl(candidate)
    if (url && url !== fallbackImage) return url
  }

  return fallbackImage
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const FILE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')

function normalizeImageUrl(path) {
  if (!path) return fallbackImage

  let value = String(path).trim()
  if (!value) return fallbackImage

  value = value.replace(/\\/g, '/')

  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:') ||
    value.startsWith('blob:')
  ) {
    return value
  }

  const lowerValue = value.toLowerCase()
  const uploadIndex = lowerValue.lastIndexOf('/uploads/')
  if (uploadIndex >= 0) {
    value = value.substring(uploadIndex)
  } else if (lowerValue.startsWith('uploads/')) {
    value = `/${value}`
  } else if (lowerValue.includes('uploads/')) {
    value = `/${value.substring(lowerValue.indexOf('uploads/'))}`
  } else if (!value.startsWith('/')) {
    value = `/uploads/${value}`
  }

  return `${FILE_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`
}
</script>

<style scoped>
:global(body) {
  background:
    radial-gradient(circle at top left, rgba(99, 102, 241, 0.05), transparent 28%),
    radial-gradient(circle at top right, rgba(225, 29, 72, 0.05), transparent 25%),
    #f6f7fb;
}

.product-page-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 36px 16px 60px;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #111827;
}

.glass-card {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow:
    0 10px 30px rgba(15, 23, 42, 0.06),
    0 2px 10px rgba(15, 23, 42, 0.03);
  border-radius: 24px;
  backdrop-filter: blur(10px);
}

.breadcrumb {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 24px;
}

.breadcrumb .separator {
  color: #cbd5e1;
}

.breadcrumb .current {
  color: #111827;
  font-weight: 700;
}

/* Nâng cấp Grid: Chia cột hợp lý hơn */
.grid-layout {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 28px;
  align-items: start;
}

/* Chia Layout rõ ràng thành Left - Right */
.left-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.right-column {
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Bỏ sticky cũ của gallery vì giờ đã phân chia cột */
.gallery-section,
.product-description,
.product-header,
.purchase-box,
.product-policy {
  padding: 22px;
}

.main-image-box {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
  position: relative;
}

.main-image-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.55s ease;
}

.main-image-box:hover img {
  transform: scale(1.045);
}

.image-floating-badges {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.floating-badge {
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2px;
  backdrop-filter: blur(6px);
}

.floating-badge.sale {
  background: rgba(225, 29, 72, 0.92);
  color: #fff;
}

.floating-badge.stock {
  background: rgba(255, 255, 255, 0.92);
  color: #111827;
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.thumbnail-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-top: 16px;
  padding-bottom: 4px;
}

.thumbnail-list::-webkit-scrollbar {
  height: 6px;
}

.thumbnail-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 999px;
}

.thumbnail-item {
  width: 86px;
  height: 86px;
  flex-shrink: 0;
  border-radius: 18px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  border: 2px solid transparent;
  opacity: 0.75;
  transition: 0.25s ease;
  background: #fff;
}

.thumbnail-item:hover {
  opacity: 1;
  transform: translateY(-2px);
}

.thumbnail-item.active {
  opacity: 1;
  border-color: #111827;
  box-shadow: 0 6px 20px rgba(17, 24, 39, 0.12);
}

.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.eyebrow-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.eyebrow {
  display: inline-flex;
  font-size: 12px;
  font-weight: 800;
  color: #6366f1;
  letter-spacing: 0.16em;
}

.stock-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
}

.stock-pill.active {
  color: #065f46;
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.in-stock {
  background: #10b981;
  box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.12);
}

.status-dot.out-stock {
  background: #ef4444;
  box-shadow: 0 0 0 5px rgba(239, 68, 68, 0.12);
}

.product-title {
  font-size: 32px;
  line-height: 1.25;
  font-weight: 800;
  margin: 0 0 18px;
  color: #0f172a;
  letter-spacing: -0.04em;
}

.product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta-chip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  flex: 1;
  min-width: 100px;
}

.meta-chip .label {
  font-size: 12px;
  color: #6b7280;
}

.meta-chip strong {
  color: #0f172a;
  font-size: 14px;
}

/* Bổ sung divider giữa các phần gộp chung card */
.section-divider {
  border: none;
  border-top: 1px dashed #cbd5e1;
  margin: 24px 0;
}

.price-topline {
  font-size: 13px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}

.price-current {
  font-size: 38px;
  line-height: 1;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.04em;
}

.price-old-wrapper {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.price-old {
  font-size: 17px;
  color: #94a3b8;
  text-decoration: line-through;
}

.discount-badge {
  background: linear-gradient(135deg, #e11d48 0%, #fb7185 100%);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  padding: 6px 10px;
  border-radius: 999px;
}

.save-amount {
  font-size: 13px;
  color: #be123c;
  font-weight: 700;
}

.variants-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.variant-group + .variant-group {
  padding-top: 20px;
  border-top: 1px solid #eef2f7;
}

.variant-header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.variant-label {
  font-size: 13px;
  font-weight: 800;
  color: #111827;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.selected-value {
  font-size: 13px;
  color: #6366f1;
  font-weight: 700;
}

.variant-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.variant-btn {
  min-width: 78px;
  padding: 11px 18px;
  border-radius: 14px;
  border: 1px solid #dbe2ea;
  background: #fff;
  color: #111827;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.22s ease;
}

.variant-btn:hover:not(.disabled) {
  border-color: #111827;
  transform: translateY(-1px);
}

.variant-btn.active {
  background: #111827;
  color: #fff;
  border-color: #111827;
  box-shadow: 0 10px 24px rgba(17, 24, 39, 0.16);
}

.variant-btn.disabled {
  background: #f8fafc;
  color: #94a3b8;
  border-color: #e5e7eb;
  cursor: not-allowed;
  opacity: 0.7;
}

.size-btn {
  min-width: 64px;
  text-align: center;
}

.selection-summary {
  margin-top: 18px;
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-item span {
  font-size: 12px;
  color: #64748b;
}

.summary-item strong {
  font-size: 14px;
  color: #0f172a;
}

.danger-text {
  color: #dc2626;
}

.quantity-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.quantity-control-wrapper {
  display: flex;
  align-items: center;
  gap: 20px;
}

.quantity-control {
  display: inline-flex;
  align-items: center;
  border: 1px solid #dbe2ea;
  border-radius: 16px;
  height: 50px;
  background: #fff;
  overflow: hidden;
}

.qty-btn {
  background: transparent;
  border: none;
  width: 50px;
  height: 100%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0f172a;
  transition: 0.2s ease;
}

.qty-btn:hover:not(:disabled) {
  background: #f8fafc;
}

.qty-btn:disabled {
  cursor: not-allowed;
  color: #cbd5e1;
}

.qty-input {
  width: 62px;
  height: 100%;
  border: none;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  outline: none;
  color: #111827;
  -moz-appearance: textfield;
}

.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 14px;
  margin-top: 18px;
}

.btn {
  height: 56px;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: 0.25s ease;
  flex: 1;
  letter-spacing: 0.01em;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none !important;
}

.btn-add-cart {
  background: #fff;
  border: 1.5px solid #111827;
  color: #111827;
}

.btn-add-cart:hover:not(:disabled) {
  background: #111827;
  color: #fff;
  transform: translateY(-1px);
}

.btn-buy-now {
  background: linear-gradient(135deg, #111827 0%, #374151 100%);
  border: none;
  color: #fff;
  box-shadow: 0 14px 30px rgba(17, 24, 39, 0.18);
}

.btn-buy-now:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 18px 34px rgba(17, 24, 39, 0.22);
}

.icon-btn {
  width: 18px;
  height: 18px;
  margin-right: 10px;
}

.product-policy {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.policy-item {
  display: flex;
  align-items: center;
  gap: 14px;
}

.policy-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.policy-icon svg {
  width: 20px;
  height: 20px;
  color: #111827;
}

.policy-item strong {
  display: block;
  font-size: 14px;
  color: #0f172a;
  margin-bottom: 2px;
}

.policy-item span {
  display: block;
  font-size: 13px;
  color: #64748b;
}

.product-description .desc-header {
  margin-bottom: 14px;
}

.product-description .desc-header h4 {
  font-size: 18px;
  font-weight: 800;
  margin: 0;
  color: #0f172a;
}

.desc-content p {
  font-size: 15px;
  line-height: 1.9;
  color: #475569;
  white-space: pre-wrap;
  margin: 0;
}

.error-state {
  text-align: center;
  padding: 80px 24px;
}

.error-icon {
  font-size: 42px;
  margin-bottom: 14px;
}

.error-state p {
  color: #64748b;
  font-size: 16px;
  margin-bottom: 22px;
}

.btn-retry {
  padding: 12px 24px;
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
}

.skeleton-anim {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 14px;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-main-image {
  width: 100%;
  aspect-ratio: 1;
  margin-bottom: 16px;
  border-radius: 20px;
}

.skeleton-thumbnails {
  display: flex;
  gap: 12px;
}

.skeleton-thumb {
  width: 80px;
  height: 80px;
  border-radius: 18px;
}

.skeleton-title {
  height: 42px;
  width: 82%;
  margin-bottom: 24px;
}

.skeleton-meta {
  height: 20px;
  margin-bottom: 28px;
}

.skeleton-price {
  height: 44px;
  width: 46%;
  margin-bottom: 34px;
}

.skeleton-variant {
  height: 60px;
  margin-bottom: 24px;
}

.skeleton-button-group {
  display: flex;
  gap: 16px;
  margin-top: 34px;
}

.skeleton-button {
  height: 56px;
  flex: 1;
  border-radius: 16px;
}

@media (max-width: 1024px) {
  .grid-layout {
    grid-template-columns: 1fr;
  }

  .right-column {
    position: static; /* Gỡ sticky trên Tablet/Mobile */
  }
}

@media (max-width: 768px) {
  .product-page-container {
    padding: 20px 12px 96px;
  }

  .product-title {
    font-size: 26px;
  }

  .price-current {
    font-size: 30px;
  }

  .action-buttons {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    z-index: 60;
    padding: 12px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(226, 232, 240, 0.9);
    border-radius: 22px;
    backdrop-filter: blur(14px);
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.14);
  }

  .btn {
    height: 52px;
    font-size: 14px;
  }

  .quantity-head,
  .variant-header,
  .eyebrow-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
