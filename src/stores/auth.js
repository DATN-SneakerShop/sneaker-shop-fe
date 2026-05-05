import axios from 'axios'
import { defineStore } from 'pinia'

const ACCESS_TOKEN_KEY = 'accessToken'
const CURRENT_USER_KEY = 'currentUser'
const LEGACY_KEYS = {
  fullName: 'userFullName',
  email: 'userEmail',
  roles: 'userRoles',
}

const authHttp = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
})

function parseJson(value, fallback = null) {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function normalizeRoles(rawRoles) {
  if (!Array.isArray(rawRoles)) return []

  return rawRoles
    .map((role) => {
      if (typeof role === 'string') return role
      if (role && typeof role === 'object') return role.name || role.code || role.authority || ''
      return ''
    })
    .filter(Boolean)
}

function normalizeUser(rawUser = {}, fallback = {}) {
  const merged = {
    ...fallback,
    ...rawUser,
  }

  const roles = normalizeRoles(
    merged.roles || merged.roleNames || merged.authorities || fallback.roles || [],
  )

  return {
    id: merged.id ?? merged.userId ?? fallback.id ?? null,
    username: merged.username ?? fallback.username ?? '',
    fullName:
      merged.fullName ||
      merged.name ||
      merged.displayName ||
      fallback.fullName ||
      fallback.name ||
      '',
    email: merged.email || fallback.email || '',
    roles,
    avatarUrl: merged.avatarUrl || fallback.avatarUrl || '',
    customerInfo: merged.customerInfo || fallback.customerInfo || null,
  }
}

function readLegacyUser() {
  return normalizeUser({
    fullName: localStorage.getItem(LEGACY_KEYS.fullName) || '',
    email: localStorage.getItem(LEGACY_KEYS.email) || '',
    roles: parseJson(localStorage.getItem(LEGACY_KEYS.roles), []),
  })
}

function readStoredUser() {
  const currentUser = parseJson(localStorage.getItem(CURRENT_USER_KEY), null)

  if (currentUser) {
    return normalizeUser(currentUser)
  }

  return readLegacyUser()
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY) || '',
    currentUser: readStoredUser(),
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken),
    userName: (state) => state.currentUser?.fullName || state.currentUser?.email || '',
    userRoles: (state) => normalizeRoles(state.currentUser?.roles || []),
    isAdmin() {
      return this.userRoles.includes('ADMIN')
    },
    isSales() {
      return this.userRoles.includes('SALES')
    },
  },

  actions: {
    persistSession() {
      if (this.accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, this.accessToken)
      } else {
        localStorage.removeItem(ACCESS_TOKEN_KEY)
      }

      if (this.currentUser && (this.currentUser.fullName || this.currentUser.email || this.currentUser.id)) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser))
      } else {
        localStorage.removeItem(CURRENT_USER_KEY)
      }

      localStorage.setItem(LEGACY_KEYS.fullName, this.currentUser?.fullName || '')
      localStorage.setItem(LEGACY_KEYS.email, this.currentUser?.email || '')
      localStorage.setItem(LEGACY_KEYS.roles, JSON.stringify(this.userRoles))
    },

    restoreSession() {
      this.accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) || ''
      this.currentUser = readStoredUser()

      if (this.accessToken && !this.currentUser?.fullName && !this.currentUser?.email) {
        this.currentUser = readLegacyUser()
      }

      this.persistSession()
    },

    setLoginSession(payload = {}) {
      const accessToken = payload.accessToken || payload.token || ''
      const currentUser = normalizeUser(payload.user || payload, this.currentUser)

      this.accessToken = accessToken
      this.currentUser = currentUser
      this.persistSession()
    },

    updateCurrentUser(user = {}) {
      this.currentUser = normalizeUser(user, this.currentUser)
      this.persistSession()
    },

    async fetchCurrentUser() {
      if (!this.accessToken) return null

      const response = await authHttp.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      const payload = response.data || {}
      this.currentUser = normalizeUser({
        id: payload.userId,
        username: payload.username,
        fullName: payload.fullName,
        email: payload.email,
        roles: payload.roles,
        customerInfo: payload.customerInfo || null,
      }, this.currentUser)

      this.persistSession()
      return this.currentUser
    },

    clearSession() {
      this.accessToken = ''
      this.currentUser = normalizeUser({})

      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(CURRENT_USER_KEY)
      localStorage.removeItem(LEGACY_KEYS.fullName)
      localStorage.removeItem(LEGACY_KEYS.email)
      localStorage.removeItem(LEGACY_KEYS.roles)
    },

    getPostLoginRedirect() {
      if (this.isAdmin) return '/users'
      if (this.isSales) return '/orders'
      return '/trang-chu'
    },
  },
})
