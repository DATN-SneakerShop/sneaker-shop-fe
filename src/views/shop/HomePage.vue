<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { getErrorMessage } from '@/utils/error'
import { useRouter } from 'vue-router'
import { getCategories } from '@/api/category.api'
import {
  getStorefrontHomeProducts,
  getStorefrontColors,
  getStorefrontSizes,
} from '@/api/product.api'
import { addToCart } from '@/api/cart.api'
import { useCartStore } from '@/stores/cart'

const ITEMS_PER_PAGE = 12
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const FILE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')

const router = useRouter()
const cartStore = useCartStore()

function svgPlaceholder(label, width = 600, height = 600, bg = '#f3f4f6', fg = '#111111') {
  const safeLabel = String(label)
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
      <rect x="18" y="18" width="${width - 36}" height="${height - 36}" rx="16" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="2"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="'Inter', sans-serif" font-size="${Math.max(20, Math.min(width, height) / 10)}" font-weight="900" font-style="italic" fill="${fg}">
        ${safeLabel}
      </text>
    </svg>
  `
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function normalizeImageUrl(path, fallbackLabel = 'Sneaker') {
  if (!path) return svgPlaceholder(fallbackLabel)

  let value = String(path).trim()
  if (!value) return svgPlaceholder(fallbackLabel)

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

function unwrapList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.content)) return payload.content
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function normalizeGender(value) {
  if (!value) return 'Unisex'
  const v = String(value).toUpperCase()
  if (v === 'MEN' || v === 'MALE' || v === 'NAM') return 'Nam'
  if (v === 'WOMEN' || v === 'FEMALE' || v === 'NU' || v === 'NỮ') return 'Nữ'
  return 'Unisex'
}

function normalizeColorName(value) {
  return String(value || '').trim()
}

function normalizeSizeName(value) {
  return String(value || '').trim()
}

function safeNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function resolveThumbnail(raw) {
  const fallbackLabel = raw?.productName || raw?.name || 'Sneaker'

  if (raw?.thumbnail) return normalizeImageUrl(raw.thumbnail, fallbackLabel)
  if (raw?.imageUrl) return normalizeImageUrl(raw.imageUrl, fallbackLabel)

  if (Array.isArray(raw?.images) && raw.images.length) {
    const firstImage = raw.images[0]
    if (typeof firstImage === 'string') return normalizeImageUrl(firstImage, fallbackLabel)
    if (firstImage?.url) return normalizeImageUrl(firstImage.url, fallbackLabel)
    if (firstImage?.imageUrl) return normalizeImageUrl(firstImage.imageUrl, fallbackLabel)
  }

  if (Array.isArray(raw?.variants) && raw.variants.length) {
    const firstVariantWithImage = raw.variants.find(v => v?.imageUrl)
    if (firstVariantWithImage?.imageUrl) {
      return normalizeImageUrl(firstVariantWithImage.imageUrl, fallbackLabel)
    }
  }

  return svgPlaceholder(fallbackLabel)
}

const colorPaletteMap = {
  Đen: '#111111',
  Trắng: '#f5f5f5',
  Đỏ: '#e53935',
  Xanh: '#1e88e5',
  'Xanh Dương': '#1e88e5',
  'Xanh Lá': '#43a047',
  Vàng: '#fbc02d',
  Cam: '#fb8c00',
  Hồng: '#ec407a',
  Xám: '#9e9e9e',
  Nâu: '#8d6e63',
  Tím: '#8e24aa',
  Be: '#d7ccc8',
  Kem: '#f3ead8',
  Bạc: '#b0bec5',
  Navy: '#283593'
}

const products = ref([])
const categories = ref([])
const colorOptions = ref([])
const sizeOptions = ref([])

const loadingProducts = ref(false)
const loadError = ref('')

const selectedCategoryId = ref('')
const selectedGender = ref('')
const selectedPriceRange = ref('')
const selectedBrandIds = ref([])
const selectedSizes = ref([])
const selectedColors = ref([])
const sortBy = ref('newest')

const searchInput = ref('')
const debouncedSearchQuery = ref('')
const currentPage = ref(1)
const isMobileFilterOpen = ref(false)
const productListRef = ref(null)

const openFilterSections = ref({
  category: true,
  brand: false,
  size: false,
  color: false
})

function toggleFilterSection(key) {
  openFilterSections.value[key] = !openFilterSections.value[key]
}

let searchTimer = null

function mapVariant(rawVariant) {
  return {
    id: rawVariant?.id ?? null,
    colorway: normalizeColorName(
      rawVariant?.colorway ??
      rawVariant?.color ??
      rawVariant?.colorName ??
      rawVariant?.mauSac
    ),
    size: normalizeSizeName(
      rawVariant?.size ??
      rawVariant?.sizeName ??
      rawVariant?.kichCo
    ),
    stock: safeNumber(rawVariant?.stock, 0),
    imageUrl: rawVariant?.imageUrl || rawVariant?.thumbnail || '',
    sku: rawVariant?.sku || '',
    price: safeNumber(rawVariant?.price, 0),
    salePrice: rawVariant?.salePrice != null ? safeNumber(rawVariant?.salePrice, 0) : null,
    status: rawVariant?.status || ''
  }
}

function extractVariants(raw) {
  const list = Array.isArray(raw?.variants) ? raw.variants : []
  return list
    .map(mapVariant)
    .filter(v => v.colorway || v.size || v.id)
}

function mapHomeProduct(raw) {
  const rawCatIds = raw.categoryIds || (raw.categoryId ? [raw.categoryId] : [])
  const safeCategoryIds = rawCatIds.map(id => String(id))

  const variants = extractVariants(raw)

  const brandValue = raw.productTypeName || raw.typeName || raw.brand || 'Khác'
  const brandIdValue = String(raw.typeId || raw.brand || brandValue)

  const originalPrice = safeNumber(raw.originalPrice ?? raw.price, 0)
  const salePrice =
    raw.salePrice != null && raw.salePrice !== ''
      ? safeNumber(raw.salePrice, 0)
      : null

  const finalSalePrice =
    salePrice && salePrice > 0
      ? salePrice
      : (() => {
          const variantSalePrices = variants
            .map(v => v.salePrice)
            .filter(v => v != null && v > 0)
          return variantSalePrices.length ? Math.min(...variantSalePrices) : null
        })()

  const finalOriginalPrice =
    originalPrice > 0
      ? originalPrice
      : (() => {
          const variantPrices = variants
            .map(v => v.price)
            .filter(v => v != null && v > 0)
          return variantPrices.length ? Math.min(...variantPrices) : 0
        })()

  const safeCreatedAt = raw.createdAt || raw.createdDate || raw.updatedAt || ''

  return {
    id: raw.id,
    productName: raw.productName || raw.name || '',
    productCode: raw.sku || raw.productCode || '',
    thumbnail: resolveThumbnail(raw),
    brand: raw.brand || '',
    productTypeName: brandValue,
    typeId: brandIdValue,
    gender: normalizeGender(raw.gender),
    status: raw.status || '',
    categoryIds: safeCategoryIds,
    categoryName: raw.categoryNames?.[0] || raw.categoryName || '',
    originalPrice: finalOriginalPrice,
    salePrice: finalSalePrice,
    badge: raw.badge || '',
    detailUrl: raw.detailUrl || `/trang-chu/san-pham/${raw.id}`,
    defaultVariantId: raw.defaultVariantId || raw.displayVariantId || null,
    createdAt: safeCreatedAt,
    variants
  }
}

const brandOptions = computed(() => {
  const map = new Map()

  products.value.forEach((product) => {
    const key = String(product.typeId || '')
    if (!key) return

    if (!map.has(key)) {
      map.set(key, {
        id: key,
        name: product.productTypeName || 'Khác',
        count: 0
      })
    }

    map.get(key).count += 1
  })

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
})

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedCategoryId.value) count += 1
  if (selectedGender.value) count += 1
  if (selectedPriceRange.value) count += 1
  if (debouncedSearchQuery.value) count += 1
  count += selectedBrandIds.value.length
  count += selectedSizes.value.length
  count += selectedColors.value.length
  return count
})

const filteredProducts = computed(() => {
  const keyword = debouncedSearchQuery.value.trim().toLowerCase()

  const filtered = products.value.filter((product) => {
    const effectivePrice = product.salePrice || product.originalPrice

    const matchCategory =
      !selectedCategoryId.value ||
      product.categoryIds.some(id => String(id) === String(selectedCategoryId.value))

    const matchBrand =
      !selectedBrandIds.value.length ||
      selectedBrandIds.value.includes(String(product.typeId))

    const matchGender =
      !selectedGender.value ||
      product.gender === selectedGender.value

    let matchPrice = true
    if (selectedPriceRange.value === 'under_1m') {
      matchPrice = effectivePrice < 1000000
    } else if (selectedPriceRange.value === '1m_3m') {
      matchPrice = effectivePrice >= 1000000 && effectivePrice <= 3000000
    } else if (selectedPriceRange.value === '3m_5m') {
      matchPrice = effectivePrice >= 3000000 && effectivePrice <= 5000000
    } else if (selectedPriceRange.value === 'over_5m') {
      matchPrice = effectivePrice > 5000000
    }

    const variants = Array.isArray(product.variants) ? product.variants : []

    const matchVariantCombination =
      (!selectedColors.value.length && !selectedSizes.value.length) ||
      variants.some((variant) => {
        const variantColor = normalizeColorName(variant.colorway)
        const variantSize = normalizeSizeName(variant.size)

        const colorOk =
          !selectedColors.value.length || selectedColors.value.includes(variantColor)

        const sizeOk =
          !selectedSizes.value.length || selectedSizes.value.includes(variantSize)

        return colorOk && sizeOk
      })

    const searchBlob = [
      product.productName,
      product.productCode,
      product.productTypeName,
      product.categoryName,
      product.gender,
      product.brand,
      ...variants.map(v => `${v.colorway} ${v.size} ${v.sku}`)
    ]
      .join(' ')
      .toLowerCase()

    const matchKeyword = !keyword || searchBlob.includes(keyword)

    return (
      matchCategory &&
      matchBrand &&
      matchGender &&
      matchPrice &&
      matchKeyword &&
      matchVariantCombination
    )
  })

  const sorted = [...filtered]

  if (sortBy.value === 'price_asc') {
    sorted.sort((a, b) => (a.salePrice || a.originalPrice) - (b.salePrice || b.originalPrice))
  } else if (sortBy.value === 'price_desc') {
    sorted.sort((a, b) => (b.salePrice || b.originalPrice) - (a.salePrice || a.originalPrice))
  } else {
    sorted.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime()
      const timeB = new Date(b.createdAt || 0).getTime()
      return timeB - timeA
    })
  }

  return sorted
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredProducts.value.length / ITEMS_PER_PAGE)))

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  return filteredProducts.value.slice(start, start + ITEMS_PER_PAGE)
})

const paginationItems = computed(() => {
  const items = []
  const page = currentPage.value
  const total = totalPages.value
  const start = Math.max(1, page - 2)
  const end = Math.min(total, page + 2)

  if (start > 1) {
    items.push({ type: 'page', page: 1, key: 'page-1' })
    if (start > 2) items.push({ type: 'dots', key: 'dots-left' })
  }

  for (let i = start; i <= end; i += 1) {
    items.push({ type: 'page', page: i, key: `page-${i}` })
  }

  if (end < total) {
    if (end < total - 1) items.push({ type: 'dots', key: 'dots-right' })
    items.push({ type: 'page', page: total, key: `page-${total}` })
  }

  return items
})


const heroStats = computed(() => [
  {
    value: products.value.length || '---',
    label: 'Mẫu giày đang bán'
  },
  {
    value: brandOptions.value.length || '---',
    label: 'Dòng sản phẩm'
  },
  {
    value: categories.value.length || '---',
    label: 'Danh mục nổi bật'
  }
])

const topCategories = computed(() => {
  return categories.value.slice(0, 6).map((cat) => {
    const count = products.value.filter(product =>
      product.categoryIds.some(id => String(id) === String(cat.id))
    ).length

    return {
      ...cat,
      count
    }
  })
})

const bestDealProduct = computed(() => {
  return products.value
    .filter(product => getDiscountPercent(product) > 0)
    .sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a))[0] || products.value[0] || null
})

const selectedCategoryName = computed(() => {
  if (!selectedCategoryId.value) return 'Tất cả sản phẩm'
  const found = categories.value.find(cat => String(cat.id) === String(selectedCategoryId.value))
  return found?.name || 'Sản phẩm đã lọc'
})

function formatPrice(value) {
  const num = safeNumber(value, 0)
  return new Intl.NumberFormat('vi-VN').format(num) + '₫'
}

function getDiscountPercent(product) {
  if (!product.salePrice || !product.originalPrice || product.originalPrice <= product.salePrice) return 0
  return Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100)
}

function toggleMobileFilter() {
  isMobileFilterOpen.value = !isMobileFilterOpen.value
}

function closeMobileFilterIfNeeded() {
  if (window.innerWidth <= 1024) {
    isMobileFilterOpen.value = false
  }
}

function scrollToProducts() {
  if (productListRef.value) {
    productListRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function selectCategory(categoryId) {
  selectedCategoryId.value = categoryId
  currentPage.value = 1
  scrollToProducts()
  closeMobileFilterIfNeeded()
}

function toggleBrand(brandId) {
  const value = String(brandId)
  const index = selectedBrandIds.value.indexOf(value)
  if (index >= 0) {
    selectedBrandIds.value.splice(index, 1)
  } else {
    selectedBrandIds.value.push(value)
  }
}

function toggleSize(sizeName) {
  const value = normalizeSizeName(sizeName)
  const index = selectedSizes.value.indexOf(value)
  if (index >= 0) {
    selectedSizes.value.splice(index, 1)
  } else {
    selectedSizes.value.push(value)
  }
}

function toggleColor(colorName) {
  const value = normalizeColorName(colorName)
  const index = selectedColors.value.indexOf(value)
  if (index >= 0) {
    selectedColors.value.splice(index, 1)
  } else {
    selectedColors.value.push(value)
  }
}

function resetFilters() {
  selectedCategoryId.value = ''
  selectedGender.value = ''
  selectedPriceRange.value = ''
  selectedBrandIds.value = []
  selectedSizes.value = []
  selectedColors.value = []
  sortBy.value = 'newest'
  searchInput.value = ''
  debouncedSearchQuery.value = ''
  currentPage.value = 1
}

function goToPage(page) {
  currentPage.value = Math.min(Math.max(1, page), totalPages.value)
  scrollToProducts()
}

function getProductDetailRoute(product) {
  const thumbnail = product?.thumbnail || ''
  const query = thumbnail && !String(thumbnail).startsWith('data:')
    ? { img: thumbnail }
    : {}

  return {
    path: product?.detailUrl || `/trang-chu/san-pham/${product?.id}`,
    query
  }
}

async function handleAddToCart(product) {
  if (!product.defaultVariantId) {
    message.warning('Vui lòng vào trang chi tiết để chọn kích cỡ/phân loại phù hợp!')
    router.push(getProductDetailRoute(product))
    return
  }

  try {
    const payload = {
      variantId: product.defaultVariantId,
      quantity: 1
    }

    const res = await addToCart(payload)
    const cartData = res.data || {}

    cartStore.setCartCount(cartData.totalItems || 0)
    message.success(`Đã thêm ${product.productName} vào giỏ hàng`)
  } catch (e) {
    message.error(getErrorMessage(e, 'Không thể thêm vào giỏ hàng, vui lòng thử lại!'))
  }
}

async function loadStorefrontData() {
  loadingProducts.value = true
  loadError.value = ''

  try {
    const [categoryRes, productRes, colorRes, sizeRes] = await Promise.all([
  getCategories(),
  getStorefrontHomeProducts(),
  getStorefrontColors(),
  getStorefrontSizes(),
])

    categories.value = unwrapList(categoryRes?.data)

    const rawList = Array.isArray(productRes?.data)
      ? productRes.data
      : unwrapList(productRes?.data)

    products.value = rawList.map(mapHomeProduct)

    colorOptions.value = unwrapList(colorRes?.data)
      .map(item => ({
        id: item.id,
        name: normalizeColorName(item.name),
        hex: colorPaletteMap[item.name] || '#d9d9d9'
      }))
      .filter(item => item.name)

    sizeOptions.value = unwrapList(sizeRes?.data)
      .map(item => ({
        id: item.id,
        name: normalizeSizeName(item.name)
      }))
      .filter(item => item.name)
      .sort((a, b) => {
        const aNum = Number(a.name)
        const bNum = Number(b.name)
        if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum
        return a.name.localeCompare(b.name)
      })

    if (!products.value.length) {
      loadError.value = 'Database chưa có sản phẩm để hiển thị ở trang chủ.'
    }
  } catch (error) {
    console.error('Lỗi tải dữ liệu storefront:', error)
    loadError.value = 'Không thể tải dữ liệu. Hãy kiểm tra lại kết nối backend.'
    message.error(loadError.value)
  } finally {
    loadingProducts.value = false
  }
}

watch(searchInput, (value) => {
  clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    debouncedSearchQuery.value = value.trim()
    currentPage.value = 1
  }, 300)
})

watch(
  [
    selectedCategoryId,
    selectedGender,
    selectedPriceRange,
    sortBy,
    selectedBrandIds,
    selectedSizes,
    selectedColors
  ],
  () => {
    currentPage.value = 1
  },
  { deep: true }
)

watch(filteredProducts, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

onMounted(() => {
  loadStorefrontData()
})

onBeforeUnmount(() => {
  clearTimeout(searchTimer)
})
</script>


<template>
  <div class="storefront-home">
    <section class="hero-showcase">
      <div class="hero-copy">
        <div class="eyebrow">
          <span class="eyebrow-dot"></span>
          Sneaker Store chính hãng
        </div>
        <h1>Nâng tầm phong cách với những đôi giày đáng tin cậy</h1>
        <p>
          Khám phá bộ sưu tập sneaker được tuyển chọn kỹ, hiển thị rõ giá, phân loại, size và màu sắc để khách hàng chọn mua nhanh hơn.
        </p>

        <div class="hero-actions">
          <button type="button" class="hero-btn primary" @click="scrollToProducts">
            Mua ngay
          </button>
          <button type="button" class="hero-btn secondary" @click="resetFilters">
            <!-- Xem tất cả sản phẩm -->
          </button>
        </div>

        <div class="hero-stats">
          <div v-for="item in heroStats" :key="item.label" class="hero-stat-card">
            <strong>{{ item.value }}</strong>
            <span>{{ item.label }}</span>
          </div>
        </div>
      </div>

      <div class="hero-visual">
        <div class="hero-orbit hero-orbit--one"></div>
        <div class="hero-orbit hero-orbit--two"></div>
        <div class="hero-product-card">
          <div class="hero-product-top">
            <span>Best Pick</span>
            <strong v-if="bestDealProduct">{{ getDiscountPercent(bestDealProduct) > 0 ? `-${getDiscountPercent(bestDealProduct)}%` : 'NEW' }}</strong>
          </div>
          <div class="hero-shoe-frame">
            <img
              v-if="bestDealProduct"
              :src="bestDealProduct.thumbnail"
              :alt="bestDealProduct.productName"
            />
            <div v-else class="hero-placeholder">Sneaker</div>
          </div>
          <div class="hero-product-info" v-if="bestDealProduct">
            <div>
              <span>{{ bestDealProduct.categoryName || 'Sneaker' }}</span>
              <h3>{{ bestDealProduct.productName }}</h3>
            </div>
            <strong>{{ formatPrice(bestDealProduct.salePrice || bestDealProduct.originalPrice) }}</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="trust-strip">
      <div class="trust-item">
        <strong>Cam kết chất lượng</strong>
        <span>Sản phẩm rõ thông tin, hình ảnh và phân loại</span>
      </div>
      <div class="trust-item">
        <strong>Đổi trả minh bạch</strong>
        <span>Hỗ trợ khách hàng sau mua dễ theo dõi</span>
      </div>
      <div class="trust-item">
        <strong>Thanh toán linh hoạt</strong>
        <span>COD hoặc chuyển khoản tùy nhu cầu</span>
      </div>
    </section>

    <section class="category-showcase" v-if="topCategories.length">
      <div class="section-heading-pro">
        <div>
          <!-- <span>Bộ sưu tập</span> -->
          <h2>Danh mục nổi bật</h2>
        </div>
        <button type="button" class="plain-action" @click="resetFilters">Xem tất cả</button>
      </div>

      <div class="category-grid-pro">
        <button
          v-for="cat in topCategories"
          :key="cat.id"
          type="button"
          class="category-card-pro"
          :class="{ active: selectedCategoryId === String(cat.id) }"
          @click="selectCategory(String(cat.id))"
        >
          <span>{{ cat.name }}</span>
          <strong>{{ cat.count }} sản phẩm</strong>
        </button>
      </div>
    </section>

    <section class="shop-filter-wrap" id="shop-section" ref="productListRef">
      <div class="section-title-wrap">
        <div>
          <span class="section-kicker">Cửa hàng</span>
          <h2>{{ selectedCategoryName }}</h2>
          <div class="section-note">
            <template v-if="loadingProducts">Đang tải dữ liệu...</template>
            <template v-else>{{ filteredProducts.length }} sản phẩm phù hợp</template>
          </div>
        </div>

        <button
          type="button"
          class="btn btn-outline mobile-filter-toggle"
          :class="{ 'is-open': isMobileFilterOpen }"
          @click="toggleMobileFilter"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          Bộ lọc
          <span v-if="activeFilterCount" class="filter-count">{{ activeFilterCount }}</span>
        </button>
      </div>

      <div class="shop-layout">
        <aside
          class="filter-sidebar smart-filter"
          :class="{ 'show-on-mobile': isMobileFilterOpen }"
        >
          <div class="sidebar-header smart-sidebar-header">
            <div>
              <span>Tùy chỉnh</span>
              <h3>Bộ lọc thông minh</h3>
              <p>Lọc nhanh theo nhu cầu mua giày</p>
            </div>

            <button
              v-if="activeFilterCount"
              type="button"
              class="reset-link reset-chip"
              @click="resetFilters"
            >
              Xóa {{ activeFilterCount }} lọc
            </button>
          </div>

          <div v-if="activeFilterCount" class="active-filter-bar">
            <span>Đang áp dụng</span>

            <button v-if="selectedCategoryId" type="button" @click="selectedCategoryId = ''">
              Danh mục ×
            </button>

            <button v-if="selectedGender" type="button" @click="selectedGender = ''">
              {{ selectedGender }} ×
            </button>

            <button v-if="selectedPriceRange" type="button" @click="selectedPriceRange = ''">
              Khoảng giá ×
            </button>

            <button
              v-if="debouncedSearchQuery"
              type="button"
              @click="searchInput = ''; debouncedSearchQuery = ''"
            >
              Tìm kiếm ×
            </button>

            <button
              v-for="brandId in selectedBrandIds"
              :key="`active-brand-${brandId}`"
              type="button"
              @click="toggleBrand(brandId)"
            >
              Hãng ×
            </button>

            <button
              v-for="size in selectedSizes"
              :key="`active-size-${size}`"
              type="button"
              @click="toggleSize(size)"
            >
              Size {{ size }} ×
            </button>

            <button
              v-for="color in selectedColors"
              :key="`active-color-${color}`"
              type="button"
              @click="toggleColor(color)"
            >
              {{ color }} ×
            </button>
          </div>

          <div class="smart-filter-body">
            <div class="filter-block search-block no-divider">
              <label class="filter-title" for="q">Tìm kiếm nhanh</label>
              <div class="search-box-pro">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  id="q"
                  v-model="searchInput"
                  type="text"
                  class="search-input"
                  placeholder="Tên giày, SKU, thương hiệu..."
                />
              </div>
            </div>

            <div class="filter-block two-col-filter compact-selects">
              <div>
                <div class="filter-title">Giới tính</div>
                <select v-model="selectedGender" class="filter-select">
                  <option value="">Tất cả</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </div>

              <div>
                <div class="filter-title">Khoảng giá</div>
                <select v-model="selectedPriceRange" class="filter-select">
                  <option value="">Tất cả</option>
                  <option value="under_1m">Dưới 1 triệu</option>
                  <option value="1m_3m">1 - 3 triệu</option>
                  <option value="3m_5m">3 - 5 triệu</option>
                  <option value="over_5m">Trên 5 triệu</option>
                </select>
              </div>
            </div>

            <div class="smart-section">
              <button type="button" class="smart-section-head" @click="toggleFilterSection('category')">
                <span>Danh mục</span>
                <strong>{{ selectedCategoryId ? 'Đã chọn' : 'Tất cả' }}</strong>
                <i>{{ openFilterSections.category ? '−' : '+' }}</i>
              </button>

              <div v-if="openFilterSections.category" class="smart-section-content">
                <div class="category-pills compact-pills">
                  <button
                    type="button"
                    class="pill category-filter"
                    :class="{ active: !selectedCategoryId }"
                    @click="selectCategory('')"
                  >
                    <span>Tất cả</span>
                  </button>

                  <button
                    v-for="cat in categories"
                    :key="cat.id"
                    type="button"
                    class="pill category-filter"
                    :class="{ active: selectedCategoryId === String(cat.id) }"
                    @click="selectCategory(String(cat.id))"
                  >
                    <span>{{ cat.name }}</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="smart-section">
              <button type="button" class="smart-section-head" @click="toggleFilterSection('brand')">
                <span>Hãng / dòng giày</span>
                <strong>{{ selectedBrandIds.length ? `${selectedBrandIds.length} chọn` : 'Tất cả' }}</strong>
                <i>{{ openFilterSections.brand ? '−' : '+' }}</i>
              </button>

              <div v-if="openFilterSections.brand" class="smart-section-content">
                <div class="checkbox-list compact-scroll-list">
                  <label
                    v-for="brand in brandOptions"
                    :key="brand.id"
                    class="checkbox-item"
                  >
                    <input
                      type="checkbox"
                      :checked="selectedBrandIds.includes(String(brand.id))"
                      @change="toggleBrand(brand.id)"
                    />
                    <span>{{ brand.name }}</span>
                    <small>{{ brand.count }}</small>
                  </label>
                </div>
              </div>
            </div>

            <div class="smart-section">
              <button type="button" class="smart-section-head" @click="toggleFilterSection('size')">
                <span>Kích cỡ</span>
                <strong>{{ selectedSizes.length ? `${selectedSizes.length} size` : 'Tất cả' }}</strong>
                <i>{{ openFilterSections.size ? '−' : '+' }}</i>
              </button>

              <div v-if="openFilterSections.size" class="smart-section-content">
                <div class="size-grid compact-size-grid">
                  <button
                    v-for="size in sizeOptions"
                    :key="size.id"
                    type="button"
                    class="size-btn"
                    :class="{ active: selectedSizes.includes(size.name) }"
                    @click="toggleSize(size.name)"
                  >
                    {{ size.name }}
                  </button>
                </div>
              </div>
            </div>

            <div class="smart-section">
              <button type="button" class="smart-section-head" @click="toggleFilterSection('color')">
                <span>Màu sắc</span>
                <strong>{{ selectedColors.length ? `${selectedColors.length} màu` : 'Tất cả' }}</strong>
                <i>{{ openFilterSections.color ? '−' : '+' }}</i>
              </button>

              <div v-if="openFilterSections.color" class="smart-section-content">
                <div class="color-swatches compact-color-grid">
                  <button
                    v-for="color in colorOptions"
                    :key="color.id"
                    type="button"
                    class="color-swatch-item"
                    :class="{ active: selectedColors.includes(color.name) }"
                    :title="color.name"
                    @click="toggleColor(color.name)"
                  >
                    <span
                      class="color-dot"
                      :style="{ backgroundColor: color.hex }"
                    />
                    <span class="color-name">{{ color.name }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div class="product-area">
          <div class="product-toolbar">
            <div class="toolbar-left">
              <div class="result-text">
                <template v-if="loadingProducts">Đang tải sản phẩm...</template>
                <template v-else>
                  Hiển thị <strong>{{ paginatedProducts.length }}</strong> / {{ filteredProducts.length }} sản phẩm
                </template>
              </div>
              <div v-if="activeFilterCount" class="active-filter-note">
                Đang áp dụng {{ activeFilterCount }} bộ lọc
              </div>
            </div>

            <div class="toolbar-right">
              <label class="sort-label" for="sortBy">Sắp xếp</label>
              <select id="sortBy" v-model="sortBy" class="sort-select">
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá: thấp đến cao</option>
                <option value="price_desc">Giá: cao đến thấp</option>
              </select>
            </div>
          </div>

          <div class="product-grid-pro">
            <div v-if="loadingProducts" class="empty-state loading-state">
              <div class="loader-ring"></div>
              <h3>Đang tải sản phẩm...</h3>
              <p>Hệ thống đang lấy dữ liệu mới nhất từ database.</p>
            </div>

            <template v-else-if="paginatedProducts.length">
              <article
                v-for="(product, index) in paginatedProducts"
                :key="product.id"
                class="product-card-pro"
              >
                <router-link class="product-image-wrap" :to="getProductDetailRoute(product)">
                  <img
                    :src="product.thumbnail"
                    :alt="product.productName"
                    :loading="index < 4 ? 'eager' : 'lazy'"
                    decoding="async"
                    width="600"
                    height="600"
                  />

                  <div class="image-overlay"></div>

                  <div class="badges-container">
                    <span v-if="product.badge" class="badge-tag" :class="product.badge.toLowerCase()">
                      {{ product.badge }}
                    </span>
                    <span v-if="getDiscountPercent(product) > 0" class="badge-tag discount">
                      -{{ getDiscountPercent(product) }}%
                    </span>
                  </div>

                  <div class="quick-view-hint">Xem chi tiết</div>
                </router-link>

                <div class="product-card-content">
                  <div class="product-top">
                    <div class="product-meta">
                      <span class="meta-item brand">{{ product.categoryName || 'Chưa phân loại' }}</span>
                      <span class="meta-dot">•</span>
                      <span class="meta-item">{{ product.productTypeName || product.brand || 'Khác' }}</span>
                    </div>

                    <h3 class="product-title">
                      <router-link :to="getProductDetailRoute(product)">{{ product.productName }}</router-link>
                    </h3>

                    <div class="product-subline">
                      <span>{{ product.gender || 'Unisex' }}</span>
                      <span v-if="product.productCode">Mã: {{ product.productCode }}</span>
                    </div>
                  </div>

                  <div class="variant-preview" v-if="product.variants.length">
                    <span
                      v-for="variant in product.variants.slice(0, 4)"
                      :key="`${variant.id}-${variant.size}-${variant.colorway}`"
                    >
                      {{ variant.size || variant.colorway }}
                    </span>
                    <small v-if="product.variants.length > 4">+{{ product.variants.length - 4 }}</small>
                  </div>

                  <div class="product-bottom">
                    <div class="price-stack">
                      <template v-if="product.salePrice">
                        <div class="price-label">Giá từ</div>
                        <div class="price">{{ formatPrice(product.salePrice) }}</div>
                        <div class="price-old">{{ formatPrice(product.originalPrice) }}</div>
                      </template>
                      <template v-else>
                        <div class="price-label">Giá bán</div>
                        <div class="price">{{ formatPrice(product.originalPrice) }}</div>
                      </template>
                    </div>

                    <div class="card-actions">
                      <router-link class="btn btn-outline-dark" :to="getProductDetailRoute(product)">Chi tiết</router-link>
                      <button class="btn btn-buy-now" @click.prevent="handleAddToCart(product)">
                        Thêm giỏ
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </template>

            <div v-else class="empty-state">
              <h3>{{ loadError ? 'Không tải được dữ liệu' : 'Không tìm thấy sản phẩm phù hợp' }}</h3>
              <p>
                {{
                  loadError
                    ? loadError
                    : 'Bạn hãy thử đổi danh mục, khoảng giá, size hoặc màu sắc để xem thêm nhiều mẫu giày khác.'
                }}
              </p>
              <button v-if="!loadError" type="button" class="hero-btn primary" @click="resetFilters">Xóa bộ lọc</button>
            </div>
          </div>

          <div id="paginationWrapper" v-if="!loadingProducts && totalPages > 1">
            <div class="pagination-lux">
              <button
                v-if="currentPage > 1"
                type="button"
                class="page-btn text-btn"
                @click="goToPage(currentPage - 1)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>

              <template v-for="item in paginationItems" :key="item.key">
                <span v-if="item.type === 'dots'" class="page-dots">...</span>
                <button
                  v-else
                  type="button"
                  class="page-btn"
                  :class="{ active: item.page === currentPage }"
                  @click="goToPage(item.page)"
                >
                  {{ item.page }}
                </button>
              </template>

              <button
                v-if="currentPage < totalPages"
                type="button"
                class="page-btn text-btn"
                @click="goToPage(currentPage + 1)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,700;0,800;0,900;1,900&family=Inter:wght@400;500;600;700;800;900&display=swap');

* {
  box-sizing: border-box;
}

.storefront-home {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 24px clamp(14px, 3vw, 38px) 72px;
  font-family: 'Inter', sans-serif;
  color: #111827;
  background:
    radial-gradient(circle at 12% 0%, rgba(255, 122, 24, 0.16), transparent 32%),
    radial-gradient(circle at 100% 12%, rgba(17, 24, 39, 0.08), transparent 30%),
    linear-gradient(180deg, #fffaf5 0%, #f7f8fb 42%, #ffffff 100%);
}

.hero-showcase {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
  gap: clamp(24px, 5vw, 72px);
  align-items: center;
  min-height: 560px;
  padding: clamp(32px, 5vw, 72px);
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 34px;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(17, 24, 39, 0.96), rgba(15, 23, 42, 0.9)),
    linear-gradient(45deg, #111827, #1f2937);
  box-shadow: 0 30px 90px rgba(15, 23, 42, 0.22);
}

.hero-showcase::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px),
    linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 54px 54px;
  mask-image: linear-gradient(90deg, #000, transparent 78%);
  pointer-events: none;
}

.hero-showcase::after {
  content: 'SNEAKER';
  position: absolute;
  right: -28px;
  bottom: -38px;
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(80px, 14vw, 210px);
  font-weight: 900;
  font-style: italic;
  line-height: 0.8;
  color: rgba(255, 255, 255, 0.045);
  pointer-events: none;
}

.hero-copy,
.hero-visual {
  position: relative;
  z-index: 1;
}

.eyebrow,
.section-kicker,
.section-heading-pro span,
.sidebar-header span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #f97316;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.eyebrow-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #f97316;
  box-shadow: 0 0 0 8px rgba(249, 115, 22, 0.18);
}

.hero-copy h1 {
  max-width: 850px;
  margin: 18px 0 18px;
  color: #ffffff;
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(42px, 6vw, 82px);
  line-height: 0.98;
  font-weight: 900;
  letter-spacing: -0.06em;
  text-transform: uppercase;
}

.hero-copy p {
  max-width: 660px;
  margin: 0;
  color: rgba(255, 255, 255, 0.74);
  font-size: 16px;
  line-height: 1.75;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 30px;
}

.hero-btn {
  min-height: 48px;
  padding: 0 22px;
  border: 0;
  border-radius: 999px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
}

.hero-btn:hover {
  transform: translateY(-2px);
}

.hero-btn.primary {
  color: #ffffff;
  background: linear-gradient(135deg, #ff4d00, #f97316);
  box-shadow: 0 18px 40px rgba(249, 115, 22, 0.34);
}

.hero-btn.secondary {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(12px);
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 34px;
  max-width: 680px;
}

.hero-stat-card {
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px);
}

.hero-stat-card strong {
  display: block;
  color: #ffffff;
  font-size: 24px;
  font-weight: 900;
}

.hero-stat-card span {
  display: block;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 12px;
  font-weight: 700;
}

.hero-visual {
  min-height: 430px;
  display: grid;
  place-items: center;
}

.hero-orbit {
  position: absolute;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.hero-orbit--one {
  width: 440px;
  height: 440px;
  background: radial-gradient(circle, rgba(249, 115, 22, 0.22), transparent 62%);
}

.hero-orbit--two {
  width: 620px;
  height: 220px;
  transform: rotate(-18deg);
}

.hero-product-card {
  position: relative;
  width: min(100%, 460px);
  padding: 18px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 34px 80px rgba(0, 0, 0, 0.32);
  transform: rotate(-3deg);
}

.hero-product-top,
.hero-product-info {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
}

.hero-product-top span,
.hero-product-info span {
  color: #6b7280;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hero-product-top strong {
  padding: 8px 12px;
  border-radius: 999px;
  color: #fff;
  background: #111827;
  font-size: 12px;
}

.hero-shoe-frame {
  display: grid;
  place-items: center;
  aspect-ratio: 1 / 0.78;
  margin: 14px 0;
  border-radius: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at center, rgba(249, 115, 22, 0.18), transparent 58%),
    #f3f4f6;
}

.hero-shoe-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.04);
}

.hero-placeholder {
  font-size: 44px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  font-style: italic;
}

.hero-product-info h3 {
  max-width: 260px;
  margin: 4px 0 0;
  font-size: 17px;
  line-height: 1.3;
}

.hero-product-info strong {
  color: #f97316;
  font-size: 18px;
  white-space: nowrap;
}

.trust-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 22px 0;
}

.trust-item {
  padding: 20px 22px;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
}

.trust-item strong {
  display: block;
  margin-bottom: 6px;
  font-size: 15px;
  font-weight: 900;
}

.trust-item span {
  color: #6b7280;
  font-size: 13px;
  line-height: 1.5;
}

.category-showcase,
.shop-filter-wrap {
  margin-top: 30px;
}

.section-heading-pro,
.section-title-wrap {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 20px;
}

.section-heading-pro h2,
.section-title-wrap h2 {
  margin: 6px 0 0;
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(26px, 4vw, 42px);
  font-weight: 900;
  letter-spacing: -0.04em;
  text-transform: uppercase;
}

.section-note {
  margin-top: 6px;
  color: #6b7280;
  font-size: 14px;
  font-weight: 700;
}

.plain-action,
.reset-link {
  border: none;
  background: transparent;
  color: #f97316;
  font-weight: 900;
  cursor: pointer;
}

.category-grid-pro {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
}

.category-card-pro {
  min-height: 118px;
  padding: 18px;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 24px;
  background:
    linear-gradient(145deg, #ffffff, #f9fafb);
  text-align: left;
  cursor: pointer;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.category-card-pro:hover,
.category-card-pro.active {
  transform: translateY(-4px);
  border-color: #111827;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.12);
}

.category-card-pro span {
  display: block;
  color: #111827;
  font-size: 16px;
  font-weight: 900;
}

.category-card-pro strong {
  display: inline-flex;
  margin-top: 16px;
  padding: 7px 10px;
  border-radius: 999px;
  color: #6b7280;
  background: #f3f4f6;
  font-size: 12px;
}

.shop-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 28px;
  align-items: start;
  width: 100%;
}

.filter-sidebar,
.product-toolbar,
.product-card-pro,
.empty-state {
  border: 1px solid rgba(17, 24, 39, 0.08);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.07);
}

.filter-sidebar {
  position: sticky;
  top: 22px;
  border-radius: 28px;
  padding: 22px;
  backdrop-filter: blur(14px);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
}

.sidebar-header h3 {
  margin: 6px 0 0;
  font-size: 18px;
  font-weight: 900;
}

.filter-block + .filter-block {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eef0f3;
}

.filter-title {
  display: block;
  margin-bottom: 12px;
  color: #374151;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.search-box-pro {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  padding: 0 14px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #f9fafb;
  color: #6b7280;
}

.search-input,
.filter-select,
.sort-select {
  width: 100%;
  height: 46px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #ffffff;
  color: #111827;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  outline: none;
}

.search-box-pro .search-input {
  height: auto;
  padding: 0;
  border: none;
  background: transparent;
}

.search-input,
.filter-select,
.sort-select {
  padding: 0 14px;
}

.search-input:focus,
.filter-select:focus,
.sort-select:focus {
  border-color: #f97316;
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.12);
}

.search-box-pro:focus-within {
  border-color: #f97316;
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.12);
}

.category-pills.vertical,
.checkbox-list,
.color-swatches {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pill {
  width: 100%;
  min-height: 44px;
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #ffffff;
  color: #111827;
  font-size: 13px;
  font-weight: 900;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pill:hover,
.pill.active {
  color: #ffffff;
  border-color: #111827;
  background: #111827;
  transform: translateX(3px);
}

.checkbox-item {
  display: grid;
  grid-template-columns: 18px 1fr auto;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  color: #374151;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.checkbox-item input {
  accent-color: #111827;
}

.checkbox-item small {
  min-width: 28px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #6b7280;
  text-align: center;
  font-size: 11px;
  font-weight: 900;
}

.two-col-filter {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.size-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 9px;
}

.size-btn {
  height: 42px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #ffffff;
  color: #111827;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
}

.size-btn:hover,
.size-btn.active {
  color: #ffffff;
  border-color: #111827;
  background: #111827;
}

.color-swatch-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-swatch-item:hover,
.color-swatch-item.active {
  border-color: #111827;
  background: #f9fafb;
  transform: translateX(3px);
}

.color-dot {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 1px solid rgba(17, 24, 39, 0.18);
  flex-shrink: 0;
}

.color-name {
  color: #374151;
  font-size: 13px;
  font-weight: 800;
}

.product-area {
  min-width: 0;
  width: 100%;
}

.product-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px 18px;
  border-radius: 24px;
}

.result-text {
  color: #6b7280;
  font-size: 14px;
  font-weight: 700;
}

.result-text strong {
  color: #111827;
}

.active-filter-note {
  margin-top: 4px;
  color: #f97316;
  font-size: 12px;
  font-weight: 900;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sort-label {
  color: #374151;
  font-size: 13px;
  font-weight: 900;
  white-space: nowrap;
}

.sort-select {
  width: 230px;
}

.product-grid-pro {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 22px;
  width: 100%;
}

.product-card-pro {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border-radius: 28px;
  transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;
}

.product-card-pro:hover {
  transform: translateY(-7px);
  border-color: rgba(17, 24, 39, 0.2);
  box-shadow: 0 26px 60px rgba(15, 23, 42, 0.13);
}

.product-image-wrap {
  position: relative;
  display: block;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 42%, rgba(249, 115, 22, 0.12), transparent 56%),
    #f3f4f6;
}

.product-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.55s ease, filter 0.55s ease;
}

.product-card-pro:hover .product-image-wrap img {
  transform: scale(1.065);
  filter: saturate(1.08) contrast(1.02);
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(17, 24, 39, 0.02), rgba(17, 24, 39, 0.22));
  opacity: 0;
  transition: opacity 0.24s ease;
}

.product-card-pro:hover .image-overlay {
  opacity: 1;
}

.badges-container {
  position: absolute;
  top: 14px;
  left: 14px;
  right: 14px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  pointer-events: none;
}

.badge-tag {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  color: #ffffff;
  background: rgba(17, 24, 39, 0.94);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  box-shadow: 0 10px 26px rgba(17, 24, 39, 0.18);
}

.badge-tag.hot,
.badge-tag.discount {
  background: linear-gradient(135deg, #ef4444, #f97316);
}

.badge-tag.new {
  background: linear-gradient(135deg, #2563eb, #06b6d4);
}

.quick-view-hint {
  position: absolute;
  left: 50%;
  bottom: 16px;
  transform: translate(-50%, 12px);
  opacity: 0;
  padding: 9px 14px;
  border-radius: 999px;
  color: #111827;
  background: rgba(255, 255, 255, 0.92);
  font-size: 12px;
  font-weight: 900;
  transition: all 0.24s ease;
}

.product-card-pro:hover .quick-view-hint {
  opacity: 1;
  transform: translate(-50%, 0);
}

.product-card-content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: space-between;
  padding: 18px;
}

.product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 9px;
  color: #6b7280;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.meta-item.brand {
  color: #111827;
}

.product-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 900;
  line-height: 1.38;
}

.product-title a {
  color: #111827;
  text-decoration: none;
}

.product-title a:hover {
  color: #f97316;
}

.product-subline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
}

.variant-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 14px 0 4px;
}

.variant-preview span,
.variant-preview small {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 8px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  font-size: 11px;
  font-weight: 900;
}

.product-bottom {
  margin-top: 14px;
}

.price-stack {
  display: flex;
  align-items: baseline;
  gap: 7px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.price-label {
  width: 100%;
  color: #9ca3af;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.price {
  color: #f97316;
  font-size: 20px;
  font-weight: 950;
  letter-spacing: -0.03em;
}

.price-old {
  color: #9ca3af;
  font-size: 13px;
  font-weight: 700;
  text-decoration: line-through;
}

.card-actions {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 10px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  border: none;
  border-radius: 14px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.22s ease;
}

.btn-outline-dark,
.btn-outline {
  color: #111827;
  background: #ffffff;
  border: 1px solid #e5e7eb;
}

.btn-outline-dark:hover,
.btn-outline:hover {
  border-color: #111827;
  background: #f9fafb;
}

.btn-buy-now {
  color: #ffffff;
  background: #111827;
}

.btn-buy-now:hover {
  background: #f97316;
  box-shadow: 0 12px 24px rgba(249, 115, 22, 0.25);
}

.mobile-filter-toggle {
  display: none;
  gap: 8px;
  min-height: 44px;
  padding: 0 14px;
}

.filter-count {
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #f97316;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 900;
  padding: 0 6px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 64px 24px;
  border-radius: 28px;
  color: #6b7280;
}

.empty-state h3 {
  margin: 12px 0 8px;
  color: #111827;
  font-family: 'Montserrat', sans-serif;
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.empty-state p {
  max-width: 520px;
  margin: 0 auto 18px;
  line-height: 1.6;
}

.loader-ring {
  width: 42px;
  height: 42px;
  margin: 0 auto;
  border: 4px solid #f3f4f6;
  border-top-color: #f97316;
  border-radius: 999px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.pagination-lux {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 38px;
}

.page-btn {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #111827;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.22s ease;
}

.page-btn:hover,
.page-btn.active {
  color: #ffffff;
  border-color: #111827;
  background: #111827;
}

.page-dots {
  color: #9ca3af;
  font-weight: 900;
  line-height: 42px;
}


.smart-filter {
  max-height: calc(100vh - 44px);
  overflow: hidden;
  padding: 18px;
}

.smart-sidebar-header {
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid #eef0f3;
}

.smart-sidebar-header h3 {
  margin: 4px 0 2px;
  font-size: 18px;
  font-weight: 950;
}

.smart-sidebar-header p {
  margin: 0;
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
}

.smart-filter-body {
  max-height: calc(100vh - 190px);
  overflow-y: auto;
  padding-right: 4px;
}

.smart-filter-body::-webkit-scrollbar,
.compact-scroll-list::-webkit-scrollbar {
  width: 5px;
}

.smart-filter-body::-webkit-scrollbar-thumb,
.compact-scroll-list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: #d1d5db;
}

.reset-chip {
  flex-shrink: 0;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: #fff7ed;
  color: #f97316;
  font-size: 12px;
}

.active-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 14px;
  padding: 10px;
  border-radius: 18px;
  background: #f9fafb;
  border: 1px solid #eef0f3;
}

.active-filter-bar span {
  width: 100%;
  color: #6b7280;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.active-filter-bar button {
  min-height: 28px;
  padding: 0 9px;
  border: 1px solid #fed7aa;
  border-radius: 999px;
  background: #fff7ed;
  color: #c2410c;
  font-size: 11px;
  font-weight: 900;
  cursor: pointer;
}

.no-divider {
  margin-top: 0 !important;
  padding-top: 0 !important;
  border-top: 0 !important;
}

.compact-selects {
  gap: 10px;
}

.smart-section {
  margin-top: 12px;
  border: 1px solid #eef0f3;
  border-radius: 18px;
  overflow: hidden;
  background: #ffffff;
}

.smart-section-head {
  width: 100%;
  min-height: 48px;
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 10px;
  padding: 0 13px;
  border: 0;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
}

.smart-section-head span {
  color: #111827;
  font-size: 13px;
  font-weight: 950;
}

.smart-section-head strong {
  color: #6b7280;
  font-size: 11px;
  font-weight: 900;
}

.smart-section-head i {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #f3f4f6;
  color: #111827;
  font-style: normal;
  font-weight: 950;
}

.smart-section-content {
  padding: 0 12px 12px;
}

.compact-pills {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px !important;
}

.compact-pills .pill {
  min-height: 38px;
  padding: 8px 10px;
  border-radius: 13px;
  font-size: 12px;
  text-align: center;
}

.compact-pills .pill:hover,
.compact-pills .pill.active {
  transform: translateY(-1px);
}

.compact-scroll-list {
  max-height: 180px;
  overflow-y: auto;
  padding-right: 4px;
}

.compact-size-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 7px;
}

.compact-size-grid .size-btn {
  height: 36px;
  border-radius: 12px;
  font-size: 12px;
}

.compact-color-grid {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px !important;
}

.compact-color-grid .color-swatch-item {
  min-height: 36px;
  padding: 7px 9px;
  border-radius: 13px;
}

.compact-color-grid .color-swatch-item:hover,
.compact-color-grid .color-swatch-item.active {
  transform: translateY(-1px);
}

.compact-color-grid .color-name {
  max-width: 82px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}


@media screen and (max-width: 1440px) {
  .product-grid-pro {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .category-grid-pro {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media screen and (max-width: 1180px) {
  .smart-filter {
    max-height: none;
    overflow: visible;
  }

  .smart-filter-body {
    max-height: none;
    overflow: visible;
  }

  .compact-pills,
  .compact-color-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .hero-showcase {
    grid-template-columns: 1fr;
  }

  .hero-visual {
    min-height: 360px;
  }

  .shop-layout {
    grid-template-columns: 1fr;
  }

  .filter-sidebar {
    display: none;
    position: static;
  }

  .filter-sidebar.show-on-mobile {
    display: block;
    margin-bottom: 16px;
  }

  .mobile-filter-toggle {
    display: inline-flex;
  }

  .two-col-filter {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media screen and (max-width: 900px) {
  .storefront-home {
    padding: 14px 12px 54px;
  }

  .hero-showcase {
    min-height: auto;
    padding: 28px;
    border-radius: 28px;
  }

  .hero-stats,
  .trust-strip,
  .category-grid-pro {
    grid-template-columns: 1fr;
  }

  .product-toolbar,
  .section-heading-pro,
  .section-title-wrap {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-right {
    flex-direction: column;
    align-items: stretch;
  }

  .sort-select {
    width: 100%;
  }

  .product-grid-pro {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }
}

@media screen and (max-width: 576px) {
  .compact-pills,
  .compact-color-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .compact-size-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .smart-sidebar-header {
    flex-direction: column;
  }

  .reset-chip {
    width: 100%;
  }

  .hero-copy h1 {
    font-size: 34px;
  }

  .hero-copy p {
    font-size: 14px;
  }

  .hero-actions,
  .card-actions,
  .two-col-filter {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .hero-btn {
    width: 100%;
  }

  .hero-product-card {
    transform: none;
  }

  .product-grid-pro {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .product-card-content {
    padding: 13px;
  }

  .product-title {
    font-size: 14px;
  }

  .price {
    font-size: 16px;
  }

  .card-actions {
    grid-template-columns: 1fr;
  }

  .size-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
