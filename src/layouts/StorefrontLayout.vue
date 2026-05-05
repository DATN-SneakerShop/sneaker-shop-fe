<template>
  <div class="storefront-layout">
    <header class="site-header">
      <div class="container header-wrap">
        <RouterLink class="logo" :to="homeUrl" @click="closeMenu">
          <img
            class="logo-mark-img"
            :src="shopLogo"
            :alt="shopName"
            width="46"
            height="46"
            loading="eager"
            decoding="async"
          >
          <span>{{ shopName }}</span>
        </RouterLink>

        <button
          id="mobileMenuToggle"
          ref="mobileMenuToggleRef"
          class="mobile-menu-toggle"
          type="button"
          aria-label="Mở menu"
          :aria-expanded="isMenuOpen ? 'true' : 'false'"
          @click="toggleMenu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <nav
          id="headerMenu"
          ref="headerMenuRef"
          class="menu"
          :class="{ 'is-open': isMenuOpen }"
        >
          <RouterLink :to="homeUrl" @click="closeMenu">Trang chủ</RouterLink>
          <RouterLink to="/order-lookup">Tra cứu đơn hàng</RouterLink>

          <template v-if="isAuthenticated">
            <RouterLink :to="accountUrl" @click="closeMenu">Xin chào, {{ displayUserName }}</RouterLink>
            <button class="auth-action-btn" type="button" @click="handleLogout">Đăng xuất</button>
          </template>
          <template v-else>
            <RouterLink :to="loginUrl" @click="closeMenu">Đăng nhập</RouterLink>
          </template>

          <RouterLink
            id="headerCartLink"
            class="cart-link"
            :to="cartUrl"
            @click="closeMenu"
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
              aria-hidden="true"
            >
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            Giỏ hàng
            <span id="cartItemCount" class="cart-badge">{{ resolvedCartItemCount }}</span>
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="container main-content">
      <router-view />
    </main>

    <footer class="site-footer">
      <div class="container">
        <div class="footer-top">
          <div class="footer-col brand-col">
            <div class="footer-logo-wrap">
              <img :src="shopLogo" alt="SneakerShop" class="footer-logo-img">
              <h4>SneakerShop</h4>
            </div>
            <p class="brand-tagline">Nâng tầm bước chân. Thể hiện phong cách. Authentic 100%.</p>

            <ul class="contact-list">
              <li>
                <div class="contact-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <div class="contact-text">
                  <span>0988 888 888</span>
                </div>
              </li>
              <li>
                <div class="contact-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <div class="contact-text">
                  <span>08:00 - 22:00</span>
                </div>
              </li>
              <li>
                <div class="contact-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <div class="contact-text">
                  <span>Quận 1, TP. Hồ Chí Minh</span>
                </div>
              </li>
            </ul>
          </div>

          <div class="footer-col links-col">
            <h4>Danh mục</h4>
            <ul>
              <li><a href="#">Hàng mới về</a></li>
              <li><a href="#">Giày Sneaker Nam</a></li>
              <li><a href="#">Giày Sneaker Nữ</a></li>
              <li><a href="#">Phiên bản giới hạn</a></li>
              <li><a href="#">Phụ kiện & Vệ sinh</a></li>
              <li><a href="#" class="highlight-link">Sale Off mùa này</a></li>
            </ul>
          </div>

          <div class="footer-col links-col">
            <h4>Hỗ trợ</h4>
            <ul>
              <li><a href="#">Tài khoản của bạn</a></li>
              <li><a href="#">Kiểm tra đơn hàng</a></li>
              <li><a href="#">Chính sách đổi trả</a></li>
              <li><a href="#">Hướng dẫn chọn Size</a></li>
              <li><a href="#">Câu hỏi thường gặp (FAQ)</a></li>
            </ul>
          </div>

          <div class="footer-col newsletter-col">
            <h4>Đăng ký nhận tin</h4>
            <p class="newsletter-desc">Đừng bỏ lỡ các đợt hype drop và ưu đãi độc quyền dành riêng cho member.</p>
            <div class="newsletter-form">
              <input type="email" placeholder="Nhập email của bạn..." />
              <button type="button" aria-label="Đăng ký">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            </div>

            <div class="footer-socials">
              <a :href="shopFacebookLink || '#'" target="_blank" rel="noopener noreferrer" title="Facebook">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>

              <a :href="shopInstagramLink || '#'" target="_blank" rel="noopener noreferrer" title="Instagram">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>

              <a :href="shopZaloLink || '#'" target="_blank" rel="noopener noreferrer" title="Zalo">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p class="copyright">&copy; {{ currentYear }} SneakerShop. Thiết kế dành riêng cho tín đồ Sneaker.</p>
          <div class="payment-methods">
            <svg viewBox="0 0 38 24" width="38" height="24" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="pi-visa"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"></path><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"></path><path d="M28.3 10.1H28c-.4 1-.7 1.5-1 3h1.9c-.3-1.5-.3-2.2-.6-3zm2.9 5.9h-1.7c-.1 0-.1 0-.2-.1l-.2-.9-.1-.2h-2.4c-.1 0-.2 0-.2.2l-.3.9c0 .1-.1.1-.1.1h-2.1l.2-.5L27 8.7c0-.5.3-.7.8-.7h1.5c.1 0 .2 0 .2.2l1.4 6.5c.1.4.2.7.2 1.1.1.1.1.1.1.2zm-13.4-.3l.4-1.8c.1 0 .2.1.2.1.7.3 1.4.5 2.1.4.2 0 .5-.1.7-.2.5-.2.5-.7.1-1.1-.2-.2-.5-.3-.8-.5-.4-.2-.8-.4-1.1-.7-1.2-1-.8-2.4-.1-3.1.6-.4.9-.8 1.7-.8 1.2 0 2.5 0 3.1.2h.1c-.1.6-.2 1.1-.4 1.7-.5-.2-1-.4-1.5-.4-.3 0-.6 0-.9.1-.2 0-.3.1-.4.2-.2.2-.2.5 0 .7l.5.4c.4.2.8.4 1.1.6.5.3 1 .8 1.1 1.4.2.9-.1 1.7-.9 2.3-.5.4-1.1.6-1.8.8-1.1.1-2.5.1-3.3-.2zM22.1 8h-1.6l-1.5 7.9h1.5L22.1 8zm-8.9 8h-1.6V8h2.1ll2.8 5c.1.1.2.3.2.4l.2 2.6h1.5l-.2-7.9h-2l-2.7 4.8-.3.5v-5.3h-1.5V16z" fill="#142688"></path></svg>
            <svg viewBox="0 0 38 24" width="38" height="24" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="pi-master"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"></path><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"></path><circle fill="#EB001B" cx="15" cy="12" r="7"></circle><circle fill="#F79E1B" cx="23" cy="12" r="7"></circle><path fill="#FF5F00" d="M22 12c0-2.4-1.2-4.5-3-5.7-1.8 1.3-3 3.4-3 5.7s1.2 4.5 3 5.7c1.8-1.2 3-3.3 3-5.7z"></path></svg>
            <svg viewBox="0 0 38 24" width="38" height="24" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="pi-paypal"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"></path><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"></path><path fill="#003087" d="M23.9 8.3c.2-1 0-1.7-.6-2.3-.6-.7-1.7-1-3.1-1h-4.1c-.3 0-.5.2-.6.5L14 15.6c0 .2.1.4.3.4h2.6l-.4 2.4c0 .2.2.4.4.4h2.8c.2 0 .4-.1.4-.3l.1-1c0-.2.2-.4.4-.4h1.5c1.4 0 2.5-.4 3.1-1.2.6-.7.8-1.8.6-3.1-.1-.3-.2-.5-.2-.7-.1-.3-.2-.5-.3-.7-.2-.4-.5-.8-.8-1.1-.4-.3-.8-.5-1.3-.7z"></path><path fill="#009CDE" d="M22.7 6.4c-.6-.6-1.5-1-2.9-1h-4.1c-.3 0-.5.2-.6.5L13.1 15c0 .2.1.4.3.4h2.9l.9-5.8c.1-.2.3-.4.5-.4h2c1.4 0 2.5-.4 3.1-1.2.6-.7.8-1.8.6-3.1-.1-.3-.2-.5-.2-.7-.1-.3-.2-.5-.3-.7z"></path><path fill="#012169" d="M21 11.2c-.3 1.5-1.5 1.5-3 1.5h-1.6c-.2 0-.4.2-.4.4l-.8 5.4c0 .2.1.4.3.4h2.8c.2 0 .4-.1.4-.3l.1-1c0-.2.2-.4.4-.4h1.5c1.4 0 2.5-.4 3.1-1.2.3-.4.5-.8.6-1.3.1-.5.1-1 .1-1.5-.1 0-.1 0-.2-.1-.4-.3-.8-.5-1.3-.7z"></path></svg>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { useCartStore } from '@/stores/cart'
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'

import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  pageTitle: {
    type: String,
    default: '',
  },
  shopName: {
    type: String,
    default: 'SneakerShop',
  },
  shopLogo: {
    type: String,
    default: '/logo.png',
  },
  shopTagline: {
    type: String,
    default: 'Nâng tầm bước chân. Thể hiện phong cách. Authentic 100%.',
  },

  homeUrl: {
    type: [String, Object],
    default: '/trang-chu',
  },
  orderLookupUrl: {
    type: [String, Object],
    default: '/order-lookup',
  },
  accountUrl: {
    type: [String, Object],
    default: '/tai-khoan',
  },
  loginUrl: {
    type: [String, Object],
    default: '/login',
  },
 cartUrl: {
  type: [String, Object],
  default: '/gio-hang',
},

  cartItemCount: {
    type: Number,
    default: 0,
  },

  shopPhone: {
    type: String,
    default: '0988 888 888',
  },
  shopHours: {
    type: String,
    default: '08:00 - 22:00',
  },
  shopAddress: {
    type: String,
    default: 'Quận 1, TP. Hồ Chí Minh',
  },
  shopFacebookLink: {
    type: String,
    default: '#',
  },
  shopInstagramLink: {
    type: String,
    default: '#',
  },
  shopZaloLink: {
    type: String,
    default: '#',
  },
})

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()

const isMenuOpen = ref(false)
const headerMenuRef = ref(null)
const mobileMenuToggleRef = ref(null)
const currentYear = new Date().getFullYear()

const resolvedPageTitle = computed(() => {
  const title = (props.pageTitle || '').trim()
  return title || props.shopName
})

const resolvedCartItemCount = computed(() => {
  const storeValue = Number(cartStore.totalItems || 0)
  if (Number.isFinite(storeValue) && storeValue >= 0) {
    return Math.floor(storeValue)
  }

  const propValue = Number(props.cartItemCount)
  if (!Number.isFinite(propValue) || propValue < 0) return 0
  return Math.floor(propValue)
})

const isAuthenticated = computed(() => authStore.isAuthenticated)
const displayUserName = computed(() => authStore.userName || 'Tài khoản')

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

function handleDocumentClick(event) {
  const menuEl = headerMenuRef.value
  const toggleEl = mobileMenuToggleRef.value
  const target = event.target

  if (!menuEl || !toggleEl || !target) return

  if (!menuEl.contains(target) && !toggleEl.contains(target)) {
    closeMenu()
  }
}

function handleLogout() {
  closeMenu()
  authStore.clearSession()
  cartStore.resetCart()
  message.success('Bạn đã đăng xuất thành công')
  router.push('/login')
}

watchEffect(() => {
  if (typeof document !== 'undefined') {
    document.title = resolvedPageTitle.value
  }
})

onMounted(async () => {
  document.addEventListener('click', handleDocumentClick)
  await cartStore.refreshCartCount()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style>
/* ==========================================================================
   MODERN SNEAKER SHOP STYLESHEET
   ========================================================================== */

@import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,700;0,900;1,900&family=Inter:wght@400;500;600;700&display=swap');

:root {
  --lux-dark: #111111;
  --lux-light: #ffffff;
  --sneaker-accent: #ff4500;
  --sneaker-accent-hover: #e03c00;
  --lux-muted: #666666;
  --lux-border: rgba(0, 0, 0, 0.08);
  --transition-smooth: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

body {
  font-family: 'Inter', sans-serif;
  color: var(--lux-dark);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f8f9fa;
  margin: 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* ================= HEADER ================= */
.site-header {
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.04);
  border-bottom: 1px solid var(--lux-border);
  position: sticky;
  top: 0;
  z-index: 1000;
  padding: 16px 0;
  transition: var(--transition-smooth);
}

.header-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  font-style: italic;
  font-size: 22px;
  letter-spacing: -0.5px;
  text-transform: uppercase;
  color: var(--lux-dark);
  text-decoration: none;
  transition: var(--transition-smooth);
}

.logo span {
  background: linear-gradient(90deg, var(--lux-dark), var(--sneaker-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-mark-img {
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: var(--transition-smooth);
}

.logo:hover {
  transform: translateX(2px);
}

.site-header .menu {
  display: flex;
  align-items: center;
  gap: 32px;
}

.site-header .menu a {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 500;
  color: var(--lux-muted);
  text-decoration: none;
  transition: var(--transition-smooth);
  padding: 8px 0;
  display: inline-flex;
  align-items: center;
  position: relative;
}

.site-header .menu a::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: 0;
  left: 0;
  background-color: var(--sneaker-accent);
  transition: width 0.3s ease;
  border-radius: 2px;
}

.site-header .menu a:hover,
.site-header .menu a.router-link-active {
  color: var(--lux-dark);
  font-weight: 600;
}

.site-header .menu a:hover::after,
.site-header .menu a.router-link-active::after {
  width: 100%;
}

.auth-action-btn {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 500;
  color: var(--lux-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px 0;
  position: relative;
}

.auth-action-btn::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: 0;
  left: 0;
  background-color: var(--sneaker-accent);
  transition: width 0.3s ease;
  border-radius: 2px;
}

.auth-action-btn:hover {
  color: var(--lux-dark);
  font-weight: 600;
}

.auth-action-btn:hover::after {
  width: 100%;
}

.cart-link {
  gap: 8px;
  color: var(--lux-dark) !important;
  font-weight: 600 !important;
}

.cart-badge {
  background-color: var(--sneaker-accent);
  color: #fff;
  border-radius: 20px;
  padding: 2px 8px;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  min-width: 20px;
  text-align: center;
  display: inline-block;
  box-shadow: 0 2px 6px rgba(255, 69, 0, 0.25);
}

.mobile-menu-toggle {
  display: none;
  background: transparent;
  border: none;
  color: var(--lux-dark);
  cursor: pointer;
  padding: 8px;
}

.main-content {
  min-height: 60vh;
  padding-top: 40px;
}

/* ================= FOOTER ================= */
.site-footer {
  background-color: #ffffff;
  border-top: 1px solid var(--lux-border);
  padding: 80px 0 24px;
  margin-top: 80px;
  color: var(--lux-dark);
}

.footer-top {
  display: grid;
  grid-template-columns: 3fr 2fr 2fr 3fr;
  gap: 40px;
  margin-bottom: 60px;
}

.footer-col h4 {
  font-family: 'Montserrat', sans-serif;
  font-size: 16px;
  font-weight: 800;
  margin-top: 0;
  margin-bottom: 24px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Cột 1: Brand */
.footer-logo-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.footer-logo-img {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
}

.brand-col h4 {
  font-family: 'Montserrat', sans-serif;
  font-size: 20px;
  font-style: italic;
  margin-bottom: 0;
}

.brand-tagline {
  color: var(--lux-muted);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 24px;
  max-width: 90%;
}

.contact-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contact-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--lux-muted);
}

.contact-icon {
  color: var(--sneaker-accent);
  display: flex;
}

.contact-text {
  font-weight: 500;
  color: var(--lux-dark);
}

/* Cột 2 & 3: Links */
.links-col ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.links-col li {
  margin-bottom: 16px;
}

.links-col a {
  color: var(--lux-muted);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition-smooth);
  display: inline-block;
}

.links-col a:hover {
  color: var(--sneaker-accent);
  transform: translateX(4px);
}

.highlight-link {
  color: var(--sneaker-accent) !important;
  font-weight: 600 !important;
}

/* Cột 4: Newsletter & Social */
.newsletter-desc {
  font-size: 14px;
  color: var(--lux-muted);
  line-height: 1.5;
  margin-bottom: 16px;
}

.newsletter-form {
  display: flex;
  margin-bottom: 32px;
}

.newsletter-form input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--lux-border);
  border-right: none;
  border-radius: 8px 0 0 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  outline: none;
  transition: var(--transition-smooth);
}

.newsletter-form input:focus {
  border-color: var(--sneaker-accent);
}

.newsletter-form button {
  background-color: var(--lux-dark);
  color: #fff;
  border: none;
  border-radius: 0 8px 8px 0;
  padding: 0 20px;
  cursor: pointer;
  transition: var(--transition-smooth);
  display: flex;
  align-items: center;
  justify-content: center;
}

.newsletter-form button:hover {
  background-color: var(--sneaker-accent);
}

.footer-socials {
  display: flex;
  gap: 12px;
}

.footer-socials a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f4f4f4;
  color: var(--lux-dark);
  transition: var(--transition-smooth);
}

.footer-socials a:hover {
  background: var(--sneaker-accent);
  color: #fff;
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(255, 69, 0, 0.2);
}

/* Footer Bottom */
.footer-bottom {
  border-top: 1px solid var(--lux-border);
  padding-top: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.copyright {
  font-size: 14px;
  color: var(--lux-muted);
  margin: 0;
}

.payment-methods {
  display: flex;
  gap: 8px;
  align-items: center;
}

.payment-methods svg {
  border: 1px solid var(--lux-border);
  border-radius: 4px;
  padding: 2px;
  background: #fff;
}

/* ================= MOBILE OPTIMIZATION ================= */
@media (max-width: 992px) {
  .footer-top {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .header-wrap {
    position: relative;
  }

  .logo span {
    font-size: 18px;
  }

  .mobile-menu-toggle {
    display: block;
  }

  .site-header .menu {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: #ffffff;
    flex-direction: column;
    padding: 16px 0 24px 0;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    border-top: 1px solid var(--lux-border);
    gap: 0;
  }

  .site-header .menu a {
    padding: 14px 24px;
    width: 100%;
    text-align: left;
    font-size: 15px;
  }

  .site-header .menu a::after {
    display: none;
  }

  .site-header .menu.is-open {
    display: flex;
  }

  .footer-top {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .brand-tagline {
    max-width: 100%;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}
</style>
