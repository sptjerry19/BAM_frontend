<script setup>
/**
 * Product detail — Nike-style PDP (gallery + sticky buy box).
 */
import { ref, inject, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProduct, getProductReviews, createProductReview } from '../../api'
import Stars from '../common/Stars.vue'
import Icon from '../common/Icon.vue'
import { categoryLabels, formatCurrency, productGallery } from '../../utils/labels'

const route = useRoute()
const router = useRouter()

const user = inject('user')
const cart = inject('cart')
const favorites = inject('favorites')
const addToCart = inject('addToCart')
const toggleFavorite = inject('toggleFavorite')
const addToEquipmentFn = inject('addToEquipment', null)
const requireAuth = inject('requireAuth', null)

const product = ref(null)
const loading = ref(true)
const loadError = ref('')
const activeImage = ref(0)
const openPanel = ref('details')

const reviews = ref([])
const reviewSummary = ref(null)
const loadingReviews = ref(false)
const reviewRating = ref(5)
const reviewText = ref('')
const submittingReview = ref(false)
const reviewError = ref('')
const addingEquip = ref(false)
const justAdded = ref(false)

const gallery = computed(() => productGallery(product.value))
const isFav = computed(() =>
  product.value ? favorites.value.includes(product.value.id) : false,
)
const inCart = computed(() =>
  product.value ? cart.value.find((x) => x.productId === product.value.id) : null,
)
const inMyEquipment = computed(() =>
  product.value ? (user.value?.equipment || []).includes(product.value.id) : false,
)

const avgRating = computed(() => {
  if (reviewSummary.value?.avg_rating != null) return Number(reviewSummary.value.avg_rating)
  if (reviews.value.length === 0) return product.value?.rating || 0
  const sum = reviews.value.reduce((s, r) => s + (r.rating || 0), 0)
  return sum / reviews.value.length
})

const reviewTotal = computed(() =>
  reviewSummary.value?.total ?? reviews.value.length ?? product.value?.reviews ?? 0,
)

const distribution = computed(() => {
  const dist = reviewSummary.value?.distribution
  if (dist) {
    const total = reviewTotal.value || 1
    return [5, 4, 3, 2, 1].map((star) => {
      const count = Number(dist[star] || 0)
      return {
        star,
        count,
        pct: reviewTotal.value ? Math.round((count / total) * 100) : 0,
      }
    })
  }
  const counts = [0, 0, 0, 0, 0]
  reviews.value.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating || 0)))
    counts[star - 1]++
  })
  return [5, 4, 3, 2, 1].map((star) => ({
    star,
    pct: reviews.value.length ? Math.round((counts[star - 1] / reviews.value.length) * 100) : 0,
    count: counts[star - 1],
  }))
})

async function loadProduct(id) {
  loading.value = true
  loadError.value = ''
  activeImage.value = 0
  try {
    product.value = await getProduct(id)
    document.title = product.value?.name
      ? `${product.value.name} — JBadminton`
      : 'Sản phẩm — JBadminton'
    loadReviews()
  } catch {
    product.value = null
    loadError.value = 'Không tìm thấy sản phẩm.'
  } finally {
    loading.value = false
  }
}

async function loadReviews() {
  if (!product.value?.id) return
  loadingReviews.value = true
  try {
    const data = await getProductReviews(product.value.id)
    if (Array.isArray(data)) {
      reviews.value = data
      reviewSummary.value = null
    } else {
      reviews.value = data?.reviews || []
      reviewSummary.value = data?.summary || null
    }
  } catch {
    reviews.value = []
    reviewSummary.value = null
  } finally {
    loadingReviews.value = false
  }
}

async function submitReview() {
  if (requireAuth && !requireAuth()) return
  if (!reviewText.value.trim()) {
    reviewError.value = 'Vui lòng nhập nội dung đánh giá'
    return
  }
  if (!user.value?.id) {
    reviewError.value = 'Vui lòng đăng nhập để gửi đánh giá'
    return
  }
  reviewError.value = ''
  submittingReview.value = true
  try {
    await createProductReview(product.value.id, {
      member_id: user.value.id,
      user_name: user.value?.name,
      avatar: user.value?.avatar,
      rating: reviewRating.value,
      comment: reviewText.value.trim(),
    })
    reviewText.value = ''
    reviewRating.value = 5
    await loadReviews()
  } catch {
    reviewError.value = 'Không thể gửi đánh giá. Vui lòng thử lại.'
  } finally {
    submittingReview.value = false
  }
}

function onAddToCart() {
  if (!product.value || product.value.stock === 0) return
  addToCart(product.value.id)
  justAdded.value = true
  setTimeout(() => {
    justAdded.value = false
  }, 1400)
}

async function onAddEquipment() {
  if (!product.value || inMyEquipment.value || addingEquip.value) return
  if (requireAuth && !requireAuth()) return
  addingEquip.value = true
  try {
    if (addToEquipmentFn) await addToEquipmentFn(product.value.id)
  } finally {
    addingEquip.value = false
  }
}

function formatReviewDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function togglePanel(id) {
  openPanel.value = openPanel.value === id ? '' : id
}

watch(
  () => route.params.id,
  (id) => {
    if (id) loadProduct(id)
  },
)

onMounted(() => loadProduct(route.params.id))
</script>

<template>
  <div class="pdp">
    <div class="shell pdp__crumb">
      <button type="button" class="pdp__back" @click="router.push({ name: 'shop' })">
        <Icon name="arrowLeft" :size="16" />
        Cửa hàng
      </button>
    </div>

    <div v-if="loading" class="shell pdp__skeleton" aria-busy="true">
      <div class="skeleton pdp__skel-gallery" />
      <div class="pdp__skel-buy">
        <div class="skeleton h-8 w-2/3" />
        <div class="skeleton h-5 w-1/3 mt-3" />
        <div class="skeleton h-6 w-1/4 mt-6" />
        <div class="skeleton h-12 w-full mt-8 rounded-full" />
      </div>
    </div>

    <div v-else-if="loadError || !product" class="shell py-24 text-center">
      <p class="page-title">{{ loadError || 'Không tìm thấy sản phẩm' }}</p>
      <button type="button" class="btn-primary mt-8 px-8 py-3" @click="router.push({ name: 'shop' })">
        Về cửa hàng
      </button>
    </div>

    <div v-else class="shell pdp__layout">
      <!-- Gallery -->
      <div class="pdp__gallery">
        <div class="pdp__thumbs" aria-label="Ảnh sản phẩm">
          <button
            v-for="(src, i) in gallery"
            :key="src + i"
            type="button"
            class="pdp__thumb"
            :class="{ 'is-active': activeImage === i }"
            :aria-label="`Ảnh ${i + 1}`"
            @click="activeImage = i"
          >
            <img :src="src" alt="" />
          </button>
        </div>
        <div class="pdp__stage product-img-bg">
          <img
            v-if="gallery.length"
            :src="gallery[Math.min(activeImage, gallery.length - 1)]"
            :alt="product.name"
          />
          <div v-else class="pdp__empty-img">Không có ảnh</div>

          <button
            type="button"
            class="pdp__fav"
            :class="{ 'is-on': isFav }"
            :aria-pressed="isFav"
            :aria-label="isFav ? 'Bỏ yêu thích' : 'Thêm yêu thích'"
            @click="toggleFavorite(product.id)"
          >
            <Icon name="heart" :size="20" />
          </button>
        </div>
      </div>

      <!-- Buy box -->
      <aside class="pdp__buy">
        <p class="pdp__brand">
          {{ product.brand }}
          <span v-if="categoryLabels[product.category]">
            · {{ categoryLabels[product.category] }}
          </span>
        </p>
        <h1 class="pdp__title">{{ product.name }}</h1>

        <div class="pdp__rating">
          <Stars :rating="avgRating" :size="14" />
          <button type="button" class="pdp__rating-link" @click="openPanel = 'reviews'">
            {{ avgRating.toFixed(1) }} ({{ reviewTotal }})
          </button>
        </div>

        <p class="pdp__price">
          <span>{{ formatCurrency(product.price) }}</span>
          <span
            v-if="product.original_price && product.original_price > product.price"
            class="pdp__price-was"
          >
            {{ formatCurrency(product.original_price) }}
          </span>
        </p>

        <p v-if="product.stock === 0" class="pdp__stock is-out">Tạm hết hàng</p>
        <p v-else-if="product.stock <= 5" class="pdp__stock">Chỉ còn {{ product.stock }} sản phẩm</p>

        <button
          type="button"
          class="btn-primary pdp__cta"
          :disabled="product.stock === 0"
          @click="onAddToCart"
        >
          {{
            product.stock === 0
              ? 'Hết hàng'
              : justAdded
                ? 'Đã thêm vào giỏ'
                : inCart
                  ? `Thêm vào giỏ · đang có ${inCart.qty}`
                  : 'Thêm vào giỏ'
          }}
        </button>

        <button
          type="button"
          class="btn-ghost pdp__equip"
          :disabled="inMyEquipment || addingEquip"
          @click="onAddEquipment"
        >
          {{ inMyEquipment ? 'Đã có trong trang bị' : 'Thêm vào trang bị' }}
        </button>

        <p class="pdp__ship">
          Giao trong 48 giờ nội thành · Đổi trả 14 ngày nếu chưa sử dụng.
        </p>

        <!-- Accordions -->
        <div class="pdp__panels">
          <div class="pdp__panel" :class="{ 'is-open': openPanel === 'details' }">
            <button type="button" class="pdp__panel-h" @click="togglePanel('details')">
              Chi tiết sản phẩm
              <Icon
                name="chevronDown"
                :size="18"
                :style="{
                  transform: openPanel === 'details' ? 'rotate(180deg)' : undefined,
                  transition: 'transform 0.2s',
                }"
              />
            </button>
            <div v-show="openPanel === 'details'" class="pdp__panel-b">
              <p>
                {{
                  product.description ||
                  `Sản phẩm chính hãng ${product.brand}, phù hợp cho người chơi cầu lông ở mọi trình độ.`
                }}
              </p>
              <ul>
                <li><span>Thương hiệu</span>{{ product.brand }}</li>
                <li>
                  <span>Danh mục</span>{{ categoryLabels[product.category] || product.category }}
                </li>
                <li><span>Tồn kho</span>{{ product.stock }} sản phẩm</li>
              </ul>
            </div>
          </div>

          <div class="pdp__panel" :class="{ 'is-open': openPanel === 'reviews' }">
            <button type="button" class="pdp__panel-h" @click="togglePanel('reviews')">
              Đánh giá ({{ reviewTotal }})
              <Icon
                name="chevronDown"
                :size="18"
                :style="{
                  transform: openPanel === 'reviews' ? 'rotate(180deg)' : undefined,
                  transition: 'transform 0.2s',
                }"
              />
            </button>
            <div v-show="openPanel === 'reviews'" class="pdp__panel-b">
              <div class="pdp__rev-sum">
                <div class="pdp__rev-score">
                  <strong>{{ avgRating.toFixed(1) }}</strong>
                  <Stars :rating="avgRating" :size="12" />
                </div>
                <div class="pdp__rev-bars">
                  <div v-for="d in distribution" :key="d.star" class="pdp__rev-row">
                    <span>{{ d.star }}</span>
                    <div class="rating-bar-track flex-1">
                      <div class="rating-bar-fill" :style="{ width: `${d.pct}%` }" />
                    </div>
                    <span>{{ d.count }}</span>
                  </div>
                </div>
              </div>

              <div v-if="loadingReviews" class="text-[13px]" style="color: var(--text-3)">
                Đang tải đánh giá...
              </div>
              <div v-else-if="!reviews.length" class="text-[13px]" style="color: var(--text-3)">
                Chưa có đánh giá nào. Hãy là người đầu tiên.
              </div>
              <ul v-else class="pdp__rev-list">
                <li v-for="r in reviews" :key="r.id || r.created_at + r.comment">
                  <div class="pdp__rev-meta">
                    <strong>{{ r.user_name || r.member_name || r.author || 'Thành viên' }}</strong>
                    <span>{{ formatReviewDate(r.created_at) }}</span>
                  </div>
                  <Stars :rating="r.rating" :size="11" />
                  <p>{{ r.comment }}</p>
                </li>
              </ul>

              <div class="pdp__rev-form">
                <p class="pdp__rev-form-label">Viết đánh giá</p>
                <div class="flex gap-1 mb-3">
                  <button
                    v-for="s in 5"
                    :key="s"
                    type="button"
                    class="text-xl leading-none"
                    :style="{ color: s <= reviewRating ? 'var(--text)' : 'var(--line-2)' }"
                    @click="reviewRating = s"
                  >
                    ★
                  </button>
                </div>
                <textarea
                  v-model="reviewText"
                  class="input-field w-full rounded-xl px-4 py-2.5 text-sm min-h-[80px] resize-none"
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                />
                <p v-if="reviewError" class="text-red-500 text-xs mt-2">{{ reviewError }}</p>
                <button
                  type="button"
                  class="btn-primary mt-3 px-6 py-2.5 text-sm"
                  :disabled="submittingReview"
                  @click="submitReview"
                >
                  {{ submittingReview ? 'Đang gửi...' : 'Gửi đánh giá' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
