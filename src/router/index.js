import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useLocale } from '../composables/useLocale'

const UserApp = () => import('../components/user/UserApp.vue')
const HomeView = () => import('../components/user/HomeView.vue')
const MapView = () => import('../components/user/MapView.vue')
const CourtDetailView = () => import('../components/user/CourtDetailView.vue')
const BookingCheckoutView = () => import('../components/user/BookingCheckoutView.vue')
const ShopView = () => import('../components/user/ShopView.vue')
const ProductDetailView = () => import('../components/user/ProductDetailView.vue')
const CartView = () => import('../components/user/CartView.vue')
const CheckoutInfoView = () => import('../components/user/CheckoutInfoView.vue')
const CheckoutConfirmView = () => import('../components/user/CheckoutConfirmView.vue')
const EquipmentView = () => import('../components/user/EquipmentView.vue')
const FavoritesView = () => import('../components/user/FavoritesView.vue')
const ProfileView = () => import('../components/user/ProfileView.vue')
const PortfolioView = () => import('../components/user/PortfolioView.vue')
const MessagesView = () => import('../components/user/MessagesView.vue')
const NotificationsView = () => import('../components/user/NotificationsView.vue')
const SocialPostView = () => import('../components/user/SocialPostView.vue')
const AccountSettingsView = () => import('../components/user/AccountSettingsView.vue')
const NewsView = () => import('../components/user/NewsView.vue')
const NewsDetailView = () => import('../components/user/NewsDetailView.vue')
const RankingsView = () => import('../components/user/RankingsView.vue')
const AthleteProfileView = () => import('../components/user/AthleteProfileView.vue')
const TopProductsView = () => import('../components/user/TopProductsView.vue')

const AdminApp = () => import('../components/admin/AdminApp.vue')
const AdminDashboard = () => import('../components/admin/AdminDashboard.vue')
const CourtsManager = () => import('../components/admin/CourtsManager.vue')
const ProductsManager = () => import('../components/admin/ProductsManager.vue')
const MembersManager = () => import('../components/admin/MembersManager.vue')
const NewsManager = () => import('../components/admin/NewsManager.vue')
const SocialReportsView = () => import('../components/admin/SocialReportsView.vue')

const LoginView = () => import('../components/auth/LoginView.vue')
const RegisterView = () => import('../components/auth/RegisterView.vue')
const ForgotPasswordView = () => import('../components/auth/ForgotPasswordView.vue')
const NotFoundView = () => import('../components/common/NotFoundView.vue')
const TourAssetStudio = () => import('../components/games/tour/TourAssetStudio.vue')
const CrLobbyView = () => import('../components/games/cr/CrLobbyView.vue')
const CrRoomView = () => import('../components/games/cr/CrRoomView.vue')

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
        path: 'portfolio',
        name: 'portfolio',
        component: PortfolioView,
        meta: { fullBleed: true, title: 'Portfolio' },
      },
      { path: 'users/:id', name: 'social-profile', component: ProfileView, meta: { fullBleed: true, title: 'Trang cá nhân' } },
      { path: 'posts/:id', name: 'social-post', component: SocialPostView, meta: { title: 'Bài viết' } },
      { path: 'messages', name: 'messages', component: MessagesView, meta: { requiresAuth: true, title: 'Tin nhắn' } },
      { path: 'notifications', name: 'notifications', component: NotificationsView, meta: { requiresAuth: true, title: 'Thông báo' } },
      { path: 'settings/account', name: 'account-settings', component: AccountSettingsView, meta: { requiresAuth: true, title: 'Cài đặt tài khoản' } },
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
      { path: 'social-reports', name: 'admin-social-reports', component: SocialReportsView, meta: { title: 'Báo cáo cộng đồng' } },
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
