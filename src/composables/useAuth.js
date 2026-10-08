import { ref, computed, readonly } from 'vue'
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getMe,
  forgotPassword as apiForgot,
  resetPassword as apiReset,
} from '../api'
import { TOKEN_KEY } from '../api/client'

const USER_KEY = 'bm_user'

const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const user = ref(readStoredUser())
const bootstrapped = ref(false)
const loading = ref(false)

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persist(nextToken, nextUser) {
  token.value = nextToken || ''
  user.value = nextUser || null
  if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken)
  else localStorage.removeItem(TOKEN_KEY)
  if (nextUser) localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
  else localStorage.removeItem(USER_KEY)
}

function applyAuthPayload(payload) {
  persist(payload.access_token, payload.user)
  return payload.user
}

function clearAuth() {
  persist('', null)
}

function apiErrorMessage(err, fallback = 'Đã có lỗi xảy ra') {
  return (
    err?.api?.message ||
    err?.response?.data?.message ||
    (err?.api?.errors && Object.values(err.api.errors).flat()?.[0]) ||
    fallback
  )
}

export function useAuth() {
  const isAuthenticated = computed(() => Boolean(token.value && user.value))
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isUser = computed(() => user.value?.role === 'user')
  const memberId = computed(() => user.value?.member_id || user.value?.member?.id || null)

  async function bootstrap() {
    if (bootstrapped.value) return
    if (!token.value) {
      bootstrapped.value = true
      return
    }
    try {
      const me = await getMe()
      persist(token.value, me)
    } catch {
      clearAuth()
    } finally {
      bootstrapped.value = true
    }
  }

  async function login(email, password) {
    loading.value = true
    try {
      const data = await apiLogin({ email, password })
      return applyAuthPayload(data)
    } finally {
      loading.value = false
    }
  }

  async function register(payload) {
    loading.value = true
    try {
      const data = await apiRegister(payload)
      return applyAuthPayload(data)
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      if (token.value) await apiLogout()
    } catch {
      /* ignore */
    } finally {
      clearAuth()
    }
  }

  function replaceUser(nextUser) {
    persist(token.value, nextUser)
  }

  async function forgotPassword(email) {
    loading.value = true
    try {
      return await apiForgot({ email })
    } finally {
      loading.value = false
    }
  }

  async function resetPassword(payload) {
    loading.value = true
    try {
      return await apiReset(payload)
    } finally {
      loading.value = false
    }
  }

  return {
    token: readonly(token),
    user: readonly(user),
    bootstrapped: readonly(bootstrapped),
    loading: readonly(loading),
    isAuthenticated,
    isAdmin,
    isUser,
    memberId,
    bootstrap,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    replaceUser,
    clearAuth,
    apiErrorMessage,
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    clearAuth()
  })
}
