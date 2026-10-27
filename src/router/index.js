import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useLocale } from '../composables/useLocale'

import UserApp from '../components/user/UserApp.vue'
import HomeView from '../components/user/HomeView.vue'
import MapView from '../components/user/MapView.vue'
import CourtDetailView from '../components/user/CourtDetailView.vue'
import BookingCheckoutView from '../components/user/BookingCheckoutView.vue'
import ShopView from '../components/user/ShopView.vue'
import ProductDetailView from '../components/user/ProductDetailView.vue'
import CartView from '../components/user/CartView.vue'
import CheckoutInfoView from '../components/user/CheckoutInfoView.vue'
import CheckoutConfirmView from '../components/user/CheckoutConfirmView.vue'
import EquipmentView from '../components/user/EquipmentView.vue'
import FavoritesView from '../components/user/FavoritesView.vue'
import ProfileView from '../components/user/ProfileView.vue'
import NewsView from '../components/user/NewsView.vue'
import NewsDetailView from '../components/user/NewsDetailView.vue'
import RankingsView from '../components/user/RankingsView.vue'
import AthleteProfileView from '../components/user/AthleteProfileView.vue'
import TopProductsView from '../components/user/TopProductsView.vue'

import AdminApp from '../components/admin/AdminApp.vue'
import AdminDashboard from '../components/admin/AdminDashboard.vue'
import CourtsManager from '../components/admin/CourtsManager.vue'
import ProductsManager from '../components/admin/ProductsManager.vue'
import MembersManager from '../components/admin/MembersManager.vue'
import NewsManager from '../components/admin/NewsManager.vue'

import LoginView from '../components/auth/LoginView.vue'
import RegisterView from '../components/auth/RegisterView.vue'
import ForgotPasswordView from '../components/auth/ForgotPasswordView.vue'
import NotFoundView from '../components/common/NotFoundView.vue'
import TourAssetStudio from '../components/games/tour/TourAssetStudio.vue'
import CrLobbyView from '../components/games/cr/CrLobbyView.vue'
import CrRoomView from '../components/games/cr/CrRoomView.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true, title: 'Đăng nhập', titleKey: 'titles.login' },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { guestOnly: true, title: 'Tạo tài khoản', titleKey: 'titles.register' },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: ForgotPasswordView,
    meta: { guestOnly: true, title: 'Quên mật khẩu', titleKey: 'titles.forgotPassword' },
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
        meta: { fullBleed: true, title: 'Trang chủ', titleKey: 'titles.home' },
      },
      // Keep old /home URLs working
      { path: 'home', redirect: { name: 'home' } },
      {
        path: 'courts',
        name: 'courts',
        component: MapView,
        meta: { fullBleed: true, title: 'Đặt sân', titleKey: 'titles.courts' },
      },
      {
        path: 'courts/:id',
        name: 'court-detail',
        component: CourtDetailView,
        meta: { fullBleed: true, title: 'Chi tiết sân', titleKey: 'titles.courtDetail' },
      },
      {
        path: 'courts/:id/checkout',
        name: 'court-booking-checkout',
        component: BookingCheckoutView,
        meta: { requiresAuth: true, title: 'Thanh toán đặt sân', titleKey: 'titles.courtBookingCheckout' },
      },
      { path: 'shop', name: 'shop', component: ShopView, meta: { fullBleed: true, title: 'Cửa hàng', titleKey: 'titles.shop' } },
      {
        path: 'shop/:id',
        name: 'product-detail',
        component: ProductDetailView,
        meta: { fullBleed: true, title: 'Chi tiết sản phẩm', titleKey: 'titles.productDetail' },
      },
      { path: 'cart', name: 'cart', component: CartView, meta: { title: 'Giỏ hàng', titleKey: 'titles.cart' } },
      {
        path: 'checkout',
        name: 'checkout-info',
        component: CheckoutInfoView,
        meta: { title: 'Thông tin thanh toán', titleKey: 'titles.checkoutInfo' },
      },
      {
        path: 'checkout/confirm',
        name: 'checkout-confirm',
        component: CheckoutConfirmView,
        meta: { title: 'Xác nhận đơn hàng', titleKey: 'titles.checkoutConfirm' },
      },
      { path: 'favorites', name: 'favorites', component: FavoritesView, meta: { title: 'Yêu thích', titleKey: 'titles.favorites' } },
      { path: 'news', name: 'news', component: NewsView, meta: { title: 'Tin tức', titleKey: 'titles.news' } },
      {
        path: 'news/:id',
        name: 'news-detail',
        component: NewsDetailView,
        meta: { fullBleed: true, title: 'Chi tiết tin', titleKey: 'titles.newsDetail' },
      },
      {
        path: 'rankings',
        name: 'rankings',
        component: RankingsView,
        meta: { title: 'Bảng xếp hạng', titleKey: 'titles.rankings' },
      },
      {
        path: 'athletes/:id',
        name: 'athlete-profile',
        component: AthleteProfileView,
        meta: { fullBleed: true, title: 'Hồ sơ vận động viên', titleKey: 'titles.athleteProfile' },
      },
      {
        path: 'top-products',
        name: 'top-products',
        component: TopProductsView,
        meta: { title: 'Top 10 sản phẩm', titleKey: 'titles.topProducts' },
      },
      {
        path: 'equipment',
        name: 'equipment',
        component: EquipmentView,
        meta: { requiresAuth: true, title: 'Trang bị', titleKey: 'titles.equipment' },
      },
      {
        path: 'profile',
        name: 'profile',
        component: ProfileView,
        meta: { requiresAuth: true, fullBleed: true, title: 'Hồ sơ', titleKey: 'titles.profile' },
      },
      {
        path: 'games',
        name: 'cr-lobby',
        component: CrLobbyView,
        meta: { title: 'Capital Rivals', titleKey: 'titles.crLobby' },
      },
      {
        path: 'games/cr/:code',
        name: 'cr-room',
        component: CrRoomView,
        meta: { fullBleed: true, title: 'Capital Rivals', titleKey: 'titles.crRoom' },
      },
      {
        path: 'games/tour/studio',
        name: 'tour-studio',
        component: TourAssetStudio,
        meta: { title: 'JB Tour assets', titleKey: 'titles.tourStudio' },
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
      {
        path: 'news',
        name: 'admin-news',
        component: NewsManager,
        meta: { title: 'Tin tức' },
      },
    ],
  },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView, meta: { title: 'Không tìm thấy trang', titleKey: 'titles.notFound' } },
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
  const { t } = useLocale()
  const title = to.meta.titleKey ? t(to.meta.titleKey) : to.meta.title
  document.title = title ? `${title} — JBadminton` : 'JBadminton'
})

export default router
