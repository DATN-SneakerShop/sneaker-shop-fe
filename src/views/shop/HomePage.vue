<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
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
const FILE_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

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

  const value = String(path).trim()

  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:')
  ) {
    return value
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

async function handleAddToCart(product) {
  if (!product.defaultVariantId) {
    message.warning('Vui lòng vào trang chi tiết để chọn kích cỡ/phân loại phù hợp!')
    router.push(product.detailUrl)
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
    message.error(e?.response?.data || 'Không thể thêm vào giỏ hàng, vui lòng thử lại!')
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
    <section class="shop-filter-wrap" id="shop-section" ref="productListRef">
      <div class="section-title-wrap">
        <div>
          <h2>Sản phẩm nổi bật</h2>
          <div class="section-note">
            <template v-if="loadingProducts">Đang tải dữ liệu...</template>
            <template v-else>{{ filteredProducts.length }} sản phẩm</template>
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
          Tùy chỉnh bộ lọc
          <span v-if="activeFilterCount" class="filter-count">{{ activeFilterCount }}</span>
        </button>
      </div>

      <div class="shop-layout">
        <aside
          class="filter-sidebar"
          :class="{ 'show-on-mobile': isMobileFilterOpen }"
        >
          <div class="sidebar-header">
            <h3>Bộ lọc</h3>
            <button type="button" class="reset-link" @click="resetFilters">
              Xóa tất cả
            </button>
          </div>

          <div class="filter-block">
            <label class="filter-title" for="q">Tìm kiếm</label>
            <input
              id="q"
              v-model="searchInput"
              type="text"
              class="search-input"
              placeholder="Tên giày, thương hiệu..."
            />
          </div>

          <div class="filter-block">
            <div class="filter-title">Danh mục</div>
            <div class="category-pills vertical">
              <button
                type="button"
                class="pill category-filter"
                :class="{ active: !selectedCategoryId }"
                @click="selectCategory('')"
              >
                Tất cả
              </button>

              <button
                v-for="cat in categories"
                :key="cat.id"
                type="button"
                class="pill category-filter"
                :class="{ active: selectedCategoryId === String(cat.id) }"
                @click="selectCategory(String(cat.id))"
              >
                {{ cat.name }}
              </button>
            </div>
          </div>

          <div class="filter-block">
            <div class="filter-title">Hãng</div>
            <div class="checkbox-list">
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

          <div class="filter-block">
            <div class="filter-title">Giới tính</div>
            <select v-model="selectedGender" class="filter-select">
              <option value="">Tất cả</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Unisex">Unisex</option>
            </select>
          </div>

          <div class="filter-block">
            <div class="filter-title">Khoảng giá</div>
            <select v-model="selectedPriceRange" class="filter-select">
              <option value="">Tất cả mức giá</option>
              <option value="under_1m">Dưới 1 Triệu</option>
              <option value="1m_3m">1 - 3 Triệu</option>
              <option value="3m_5m">3 - 5 Triệu</option>
              <option value="over_5m">Hơn 5 Triệu</option>
            </select>
          </div>

          <div class="filter-block">
            <div class="filter-title">Kích cỡ</div>
            <div class="size-grid">
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

          <div class="filter-block">
            <div class="filter-title">Màu sắc</div>
            <div class="color-swatches">
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
        </aside>

        <div class="product-area">
          <div class="product-toolbar">
            <div class="toolbar-left">
              <div class="result-text">
                <template v-if="loadingProducts">Đang tải sản phẩm...</template>
                <template v-else>
                  Hiển thị {{ paginatedProducts.length }} / {{ filteredProducts.length }} sản phẩm
                </template>
              </div>
            </div>

            <div class="toolbar-right">
              <label class="sort-label" for="sortBy">Sắp xếp</label>
              <select id="sortBy" v-model="sortBy" class="sort-select">
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
              </select>
            </div>
          </div>

          <div class="product-grid-pro">
            <div v-if="loadingProducts" class="empty-state">
              <h3>Đang tải sản phẩm...</h3>
              <p>Hệ thống đang lấy dữ liệu từ database.</p>
            </div>

            <template v-else-if="paginatedProducts.length">
              <article
                v-for="(product, index) in paginatedProducts"
                :key="product.id"
                class="product-card-pro"
              >
                <router-link class="product-image-wrap" :to="product.detailUrl">
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
                </router-link>

                <div class="product-card-content">
                  <div class="product-top">
                    <div class="product-meta">
                      <span class="meta-item brand">{{ product.categoryName || 'Chưa phân loại' }}</span>
                      <span class="meta-dot">•</span>
                      <span class="meta-item">{{ product.productTypeName || product.brand || 'Khác' }}</span>
                    </div>

                    <h3 class="product-title">
                      <router-link :to="product.detailUrl">{{ product.productName }}</router-link>
                    </h3>

                    <div class="product-gender">{{ product.gender || 'Unisex' }}</div>
                  </div>

                  <div class="product-bottom">
                    <div class="price-stack">
                      <template v-if="product.salePrice">
                        <div class="price-label">Từ</div>
                        <div class="price">{{ formatPrice(product.salePrice) }}</div>
                        <div class="price-old">{{ formatPrice(product.originalPrice) }}</div>
                      </template>
                      <template v-else>
                        <div class="price">{{ formatPrice(product.originalPrice) }}</div>
                      </template>
                    </div>

                    <div class="card-actions">
                      <router-link class="btn btn-outline-dark" :to="product.detailUrl">Chi tiết</router-link>
                      <button class="btn btn-buy-now" @click.prevent="handleAddToCart(product)">
                        Thêm giỏ hàng
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </template>

            <div v-else class="empty-state">
              <h3>{{ loadError ? 'Không tải được dữ liệu' : 'Không tìm thấy giày nào' }}</h3>
              <p>
                {{
                  loadError
                    ? loadError
                    : 'Hiện chưa có mẫu giày nào phù hợp với bộ lọc của bạn. Vui lòng thử lại.'
                }}
              </p>
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
@import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,700;0,900;1,900&family=Inter:wght@400;500;600;700;800&display=swap');

.storefront-home {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0 24px 60px;
  font-family: 'Inter', sans-serif;
  color: #111;
  background-color: #fdfdfd;
  box-sizing: border-box;
}

.shop-filter-wrap {
  width: 100%;
  padding-top: 24px;
}

.section-title-wrap {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 24px;
}

.section-title-wrap h2 {
  margin: 0;
  font-family: 'Montserrat', sans-serif;
  font-size: 30px;
  font-weight: 900;
  text-transform: uppercase;
}

.section-note {
  margin-top: 6px;
  font-size: 14px;
  color: #666;
  font-weight: 600;
}

.shop-layout {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 28px;
  align-items: start;
  width: 100%;
}

.filter-sidebar {
  position: sticky;
  top: 24px;
  background: #fff;
  border: 1px solid #eaeaea;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
}

.reset-link {
  padding: 0;
  border: none;
  background: transparent;
  color: #ff4500;
  font-weight: 700;
  cursor: pointer;
}

.filter-block + .filter-block {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f1f1f1;
}

.filter-title {
  display: block;
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.search-input,
.filter-select,
.sort-select {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  font-family: inherit;
  font-size: 14px;
  background: #fff;
  box-sizing: border-box;
}

.search-input:focus,
.filter-select:focus,
.sort-select:focus {
  border-color: #ff4500;
  outline: none;
}

.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.category-pills.vertical {
  flex-direction: column;
}

.pill {
  padding: 10px 14px;
  border-radius: 10px;
  background: #fff;
  color: #111;
  border: 1px solid #e0e0e0;
  font-size: 13px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pill:hover {
  background: #f8f9fa;
  border-color: #111;
}

.pill.active {
  background: #111;
  color: #fff;
  border-color: #111;
}

.checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkbox-item {
  display: grid;
  grid-template-columns: 18px 1fr auto;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  cursor: pointer;
}

.checkbox-item input {
  accent-color: #111;
}

.checkbox-item small {
  color: #888;
  font-size: 12px;
}

.size-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.size-btn {
  height: 42px;
  border-radius: 10px;
  border: 1px solid #dddddd;
  background: #fff;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.size-btn:hover {
  border-color: #111;
}

.size-btn.active {
  background: #111;
  color: #fff;
  border-color: #111;
}

.color-swatches {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.color-swatch-item {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #e0e0e0;
  background: #fff;
  border-radius: 999px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.color-swatch-item:hover {
  border-color: #111;
}

.color-swatch-item.active {
  border-color: #111;
  background: #f8f8f8;
}

.color-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

.color-name {
  font-size: 13px;
  font-weight: 600;
  color: #222;
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
  background: #fff;
  border: 1px solid #eaeaea;
  border-radius: 16px;
}

.result-text {
  font-size: 14px;
  color: #666;
  font-weight: 600;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sort-label {
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.sort-select {
  width: 220px;
}

.product-grid-pro {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
  width: 100%;
}

.product-card-pro {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #eaeaea;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.product-card-pro:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.06);
}

.product-image-wrap {
  position: relative;
  aspect-ratio: 1 / 1;
  background: #f8f9fa;
  display: block;
  overflow: hidden;
}

.product-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.product-card-pro:hover .product-image-wrap img {
  transform: scale(1.05);
}

.badges-container {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}

.badge-tag {
  background: #111;
  color: #fff;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.badge-tag.hot {
  background: #ff4500;
}

.badge-tag.new {
  background: #007aff;
}

.badge-tag.discount {
  background: #e02b2b;
}

.product-card-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: space-between;
}

.product-meta {
  font-size: 11px;
  color: #666;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 8px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.meta-item.brand {
  color: #111;
}

.product-title {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
}

.product-title a {
  color: #111;
  text-decoration: none;
}

.product-title a:hover {
  color: #ff4500;
}

.product-gender {
  font-size: 12px;
  color: #888;
  margin-bottom: 16px;
}

.price-stack {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.price-label {
  font-size: 13px;
  color: #666;
  font-weight: 600;
}

.price {
  font-size: 18px;
  font-weight: 800;
  color: #ff4500;
}

.price-old {
  font-size: 13px;
  text-decoration: line-through;
  color: #999;
  margin-left: 4px;
}

.card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-outline-dark {
  border: 1px solid #e0e0e0;
  color: #111;
  padding: 10px;
  font-size: 13px;
  text-align: center;
  background: #fff;
}

.btn-outline-dark:hover {
  border-color: #111;
}

.btn-buy-now {
  background: #111;
  color: #fff;
  padding: 10px;
  font-size: 13px;
  border: none;
}

.btn-buy-now:hover {
  background: #ff4500;
}

.btn-outline {
  border: 1px solid #d8d8d8;
  color: #111;
  background: #fff;
  padding: 10px 14px;
}

.mobile-filter-toggle {
  display: none;
  gap: 8px;
}

.filter-count {
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #111;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  padding: 0 6px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  border: 1px dashed #ccc;
  border-radius: 12px;
  color: #666;
  background: #fff;
}

.empty-state h3 {
  color: #111;
  font-family: 'Montserrat', sans-serif;
  font-style: italic;
  font-weight: 900;
}

.pagination-lux {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 40px;
}

.page-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #eaeaea;
  background: #fff;
  font-weight: 700;
  cursor: pointer;
}

.page-btn:hover {
  background: #f4f4f4;
}

.page-btn.active {
  background: #111;
  color: #fff;
  border-color: #111;
}

.page-dots {
  font-weight: 700;
  color: #999;
  line-height: 40px;
}

@media screen and (max-width: 1600px) {
  .product-grid-pro {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media screen and (max-width: 1280px) {
  .product-grid-pro {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media screen and (max-width: 1024px) {
  .storefront-home {
    padding: 0 16px 48px;
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

  .product-grid-pro {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media screen and (max-width: 768px) {
  .section-title-wrap {
    align-items: stretch;
    flex-direction: column;
  }

  .product-toolbar {
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
    gap: 12px;
  }

  .card-actions {
    grid-template-columns: 1fr;
  }

  .size-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media screen and (max-width: 576px) {
  .storefront-home {
    padding: 0 12px 40px;
  }

  .section-title-wrap h2 {
    font-size: 24px;
  }

  .product-grid-pro {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .product-card-content {
    padding: 14px;
  }

  .product-title {
    font-size: 14px;
  }

  .price {
    font-size: 16px;
  }

  .size-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
