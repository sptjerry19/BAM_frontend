import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'

import UserApp from '../components/user/UserApp.vue'
import HomeView from '../components/user/HomeView.vue'
import MapView from '../components/user/MapView.vue'
import ShopView from '../components/user/ShopView.vue'
import CartView from '../components/user/CartView.vue'
import EquipmentView from '../components/user/EquipmentView.vue'
import FavoritesView from '../components/user/FavoritesView.vue'
import ProfileView from '../components/user/ProfileView.vue'

import AdminApp from '../components/admin/AdminApp.vue'
import AdminDashboard from '../components/admin/AdminDashboard.vue'
import CourtsManager from '../components/admin/CourtsManager.vue'
import ProductsManager from '../components/admin/ProductsManager.vue'
import MembersManager from '../components/admin/MembersManager.vue'

import LoginView from '../components/auth/LoginView.vue'
import RegisterView from '../components/auth/RegisterView.vue'
import ForgotPasswordView from '../components/auth/ForgotPasswordView.vue'
import NotFoundView from '../components/common/NotFoundView.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true, title: 'Đăng nhập' },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { guestOnly: true, title: 'Tạo tài khoản' },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: ForgotPasswordView,
    meta: { guestOnly: true, title: 'Quên mật khẩu' },
  },

  {
    path: '/',
    component: UserApp,
    // Storefront is public — only child routes that hit auth APIs require login
    meta: { adminGoesToPanel: true },
    children: [
      {
        path: '',
        name: 'home',
        component: HomeView,
        meta: { fullBleed: true, title: 'Trang chủ' },
      },
      // Keep old /home URLs working
      { path: 'home', redirect: { name: 'home' } },
      {
        path: 'courts',
        name: 'courts',
        component: MapView,
        meta: { fullBleed: true, title: 'Đặt sân' },
      },
      { path: 'shop', name: 'shop', component: ShopView, meta: { title: 'Cửa hàng' } },
      { path: 'cart', name: 'cart', component: CartView, meta: { title: 'Giỏ hàng' } },
      { path: 'favorites', name: 'favorites', component: FavoritesView, meta: { title: 'Yêu thích' } },
      {
        path: 'equipment',
        name: 'equipment',
        component: EquipmentView,
        meta: { requiresAuth: true, title: 'Trang bị' },
      },
      {
        path: 'profile',
        name: 'profile',
        component: ProfileView,
        meta: { requiresAuth: true, title: 'Hồ sơ' },
      },
    ],
  },

  {
    path: '/admin',
    component: AdminApp,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', redirect: { name: 'admin-dashboard' } },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: AdminDashboard,
        meta: { title: 'Tổng quan' },
      },
      {
        path: 'courts',
        name: 'admin-courts',
        component: CourtsManager,
        meta: { title: 'Quản lý sân' },
      },
      {
        path: 'products',
        name: 'admin-products',
        component: ProductsManager,
        meta: { title: 'Sản phẩm' },
      },
      {
        path: 'members',
        name: 'admin-members',
        component: MembersManager,
        meta: { title: 'Thành viên' },
      },
    ],
  },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView, meta: { title: 'Không tìm thấy trang' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

function routeNeedsAuth(route) {
  return route.matched.some((record) => record.meta.requiresAuth)
}

router.beforeEach(async (to) => {
  const { bootstrap, bootstrapped, isAuthenticated, isAdmin } = useAuth()

  if (!bootstrapped.value) await bootstrap()

  if (to.meta.guestOnly && isAuthenticated.value) {
    return isAdmin.value ? { name: 'admin-dashboard' } : { name: 'home' }
  }

  if (routeNeedsAuth(to) && !isAuthenticated.value) {
    return { name: 'login', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } }
  }

  if (to.matched.some((r) => r.meta.requiresAdmin) && !isAdmin.value) {
    return { name: 'home' }
  }

  if (to.matched.some((r) => r.meta.adminGoesToPanel) && isAdmin.value) {
    return { name: 'admin-dashboard' }
  }

  return true
})

window.addEventListener('auth:logout', () => {
  const current = router.currentRoute.value
  if (current.meta.guestOnly) return
  // Stay on public storefront pages; only bounce protected ones to login
  if (routeNeedsAuth(current) || current.matched.some((r) => r.meta.requiresAdmin)) {
    router.replace({ name: 'login' })
  }
})

router.afterEach((to) => {
  const title = to.meta.title
  document.title = title ? `${title} — JBadminton` : 'JBadminton'
})

export default router
