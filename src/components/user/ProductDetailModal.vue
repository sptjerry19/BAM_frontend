<script setup>
import { ref, inject, computed, onMounted } from 'vue'
import { motion, AnimatePresence } from 'motion-v'
import { getProductReviews, createProductReview } from '../../api'
import Stars from '../common/Stars.vue'
import { categoryLabels, catIcons, formatCurrency, productGallery } from '../../utils/labels'

const props = defineProps({
  product: { type: Object, required: true },
  isFav: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'add-to-cart', 'toggle-fav', 'add-to-equipment'])

const user = inject('user')
const addToEquipmentFn = inject('addToEquipment', null)
const requireAuth = inject('requireAuth', null)

const tab = ref('info')
const reviews = ref([])
const reviewSummary = ref(null)
const loadingReviews = ref(true)
const reviewRating = ref(5)
const reviewText = ref('')
const submittingReview = ref(false)
const reviewError = ref('')
const addingEquip = ref(false)
const equipAdded = ref(false)
const activeImage = ref(0)

const gallery = computed(() => productGallery(props.product))

const avgRating = computed(() => {
  if (reviewSummary.value?.avg_rating != null) return Number(reviewSummary.value.avg_rating)
  if (reviews.value.length === 0) return props.product.rating || 0
  const sum = reviews.value.reduce((s, r) => s + (r.rating || 0), 0)
  return sum / reviews.value.length
})

const reviewTotal = computed(() =>
  reviewSummary.value?.total ?? reviews.value.length ?? props.product.reviews ?? 0,
)

const inMyEquipment = computed(() =>
  (user.value?.equipment || []).includes(props.product.id),
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
  const total = reviews.value.length || 1
  return [5, 4, 3, 2, 1].map((star) => ({
    star,
    pct: reviews.value.length ? Math.round((counts[star - 1] / total) * 100) : 0,
    count: counts[star - 1],
  }))
})

async function loadReviews() {
  loadingReviews.value = true
  try {
    const data = await getProductReviews(props.product.id)
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
    const created = await createProductReview(props.product.id, {
      member_id: user.value.id,
      user_name: user.value?.name,
      avatar: user.value?.avatar,
      rating: reviewRating.value,
      comment: reviewText.value.trim(),
    })
    const review = created?.id ? created : created?.data || created
    reviews.value.unshift(review)
    reviewSummary.value = null
    reviewText.value = ''
    reviewRating.value = 5
    await loadReviews()
  } catch {
    reviewError.value = 'Không thể gửi đánh giá. Vui lòng thử lại.'
  } finally {
    submittingReview.value = false
  }
}

async function addToEquipment() {
  if (inMyEquipment.value || addingEquip.value) return
  addingEquip.value = true
  try {
    if (addToEquipmentFn) await addToEquipmentFn(props.product.id)
    else emit('add-to-equipment', props.product.id)
    equipAdded.value = true
    setTimeout(() => { equipAdded.value = false }, 1500)
  } finally {
    addingEquip.value = false
  }
}

function formatReviewDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(loadReviews)
</script>

<template>
  <motion.div
    class="fixed inset-0 modal-backdrop flex items-end sm:items-center justify-center p-0 sm:p-4"
    style="z-index: var(--z-modal)"
    :initial="{ opacity: 0 }"
    :animate="{ opacity: 1 }"
    :exit="{ opacity: 0 }"
    @click="emit('close')"
  >
    <motion.div
      class="modal-sheet glass-strong w-full sm:max-w-6xl max-h-[92dvh] flex flex-col overflow-hidden"
      :initial="{ y: '100%', opacity: 0 }"
      :animate="{ y: 0, opacity: 1 }"
      :exit="{ y: '100%', opacity: 0 }"
      :transition="{ type: 'spring', stiffness: 380, damping: 36 }"
      @click.stop
    >
      <div class="drag-handle sm:hidden shrink-0" />

      <div class="flex items-start justify-between px-5 pt-2 sm:pt-5 pb-3 shrink-0">
        <div class="flex-1 min-w-0 pr-3">
          <div class="text-[10px] font-semibold uppercase tracking-wider mb-1" style="color: #475569">
            {{ product.brand }} · {{ categoryLabels[product.category] }}
          </div>
          <h2 class="font-heading text-lg font-extrabold leading-tight">{{ product.name }}</h2>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <motion.button
            type="button"
            class="w-9 h-9 rounded-full flex items-center justify-center"
            :style="{
              background: isFav ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
              color: isFav ? '#ef4444' : '#64748b',
              border: `1px solid ${isFav ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
            }"
            :whileTap="{ scale: 0.9 }"
            @click="emit('toggle-fav')"
          >
            {{ isFav ? '♥' : '♡' }}
          </motion.button>
          <motion.button
            type="button"
            class="w-9 h-9 rounded-full btn-ghost flex items-center justify-center text-sm"
            :whileTap="{ scale: 0.9, rotate: 90 }"
            @click="emit('close')"
          >
            ✕
          </motion.button>
        </div>
      </div>

      <div class="mx-5 shrink-0">
        <div
          class="h-40 sm:h-52 rounded-2xl flex items-center justify-center overflow-hidden product-img-bg"
          style="border: 1px solid rgba(255,255,255,0.06)"
        >
          <img
            v-if="gallery.length"
            :src="gallery[Math.min(activeImage, gallery.length - 1)]"
            :alt="product.name"
            class="w-full h-full object-cover"
          />
          <span v-else class="text-6xl opacity-35">{{ catIcons[product.category] || '◈' }}</span>
        </div>
        <div v-if="gallery.length > 1" class="flex gap-2 mt-2 overflow-x-auto no-scrollbar pb-1">
          <button
            v-for="(src, i) in gallery"
            :key="src + i"
            type="button"
            class="w-14 h-14 rounded-xl overflow-hidden shrink-0"
            :style="{
              border: `2px solid ${activeImage === i ? '#84cc16' : 'rgba(255,255,255,0.1)'}`,
            }"
            @click="activeImage = i"
          >
            <img :src="src" alt="" class="w-full h-full object-cover" />
          </button>
        </div>
      </div>

      <div class="flex gap-1 mx-5 mt-4 p-1 rounded-xl shrink-0" style="background: rgba(255,255,255,0.04)">
        <button
          v-for="t in [{ id: 'info', label: 'Thông tin' }, { id: 'reviews', label: 'Đánh giá' }]"
          :key="t.id"
          type="button"
          class="relative flex-1 py-2 rounded-lg text-xs font-semibold transition-colors"
          :style="{ color: tab === t.id ? '#84cc16' : '#64748b' }"
          @click="tab = t.id"
        >
          <motion.div
            v-if="tab === t.id"
            layout-id="product-detail-tab"
            class="absolute inset-0 rounded-lg"
            style="background: rgba(132,204,22,0.12); border: 1px solid rgba(132,204,22,0.2)"
            :transition="{ type: 'spring', stiffness: 400, damping: 30 }"
          />
          <span class="relative">{{ t.label }}</span>
          <span v-if="t.id === 'reviews'" class="relative ml-1 mono text-[10px]" style="color: #64748b">
            ({{ reviewTotal }})
          </span>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-5 py-4 pb-28 sm:pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            v-if="tab === 'info'"
            key="info"
            :initial="{ opacity: 0, x: -8 }"
            :animate="{ opacity: 1, x: 0 }"
            :exit="{ opacity: 0, x: 8 }"
            :transition="{ duration: 0.2 }"
            class="space-y-4"
          >
            <div class="flex items-center gap-3">
              <Stars :rating="avgRating" :size="14" />
              <span class="mono text-xs" style="color: #94a3b8">{{ avgRating.toFixed(1) }} ({{ reviewTotal }})</span>
              <span v-if="product.stock > 0" class="pill" style="background: rgba(132,204,22,0.12); color: #84cc16">
                Còn {{ product.stock }} sp
              </span>
              <span v-else class="pill" style="background: rgba(239,68,68,0.12); color: #ef4444">Hết hàng</span>
            </div>
            <div class="flex items-baseline gap-2 flex-wrap">
              <span class="mono text-xl font-bold" style="color: #84cc16">{{ formatCurrency(product.price) }}</span>
              <span
                v-if="product.original_price && product.original_price > product.price"
                class="mono text-sm line-through"
                style="color: #475569"
              >
                {{ formatCurrency(product.original_price) }}
              </span>
              <span
                v-if="product.original_price && product.original_price > product.price"
                class="pill text-[10px]"
                style="background: rgba(239,68,68,0.15); color: #ef4444"
              >
                -{{ Math.round((1 - product.price / product.original_price) * 100) }}%
              </span>
            </div>
            <p v-if="product.description" class="text-sm leading-relaxed" style="color: #94a3b8">
              {{ product.description }}
            </p>
            <p v-else class="text-sm" style="color: #64748b">
              Sản phẩm chính hãng {{ product.brand }}, phù hợp cho người chơi cầu lông ở mọi trình độ.
            </p>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="row in [
                  ['Thương hiệu', product.brand],
                  ['Danh mục', categoryLabels[product.category]],
                  ['Đánh giá', `${avgRating.toFixed(1)}/5.0`],
                  ['Tồn kho', `${product.stock} sản phẩm`],
                ]"
                :key="row[0]"
                class="rounded-xl p-3"
                style="background: rgba(255,255,255,0.04)"
              >
                <div class="text-[10px] font-semibold uppercase tracking-wider mb-1" style="color: #475569">{{ row[0] }}</div>
                <div class="text-sm font-semibold">{{ row[1] }}</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            v-else
            key="reviews"
            :initial="{ opacity: 0, x: 8 }"
            :animate="{ opacity: 1, x: 0 }"
            :exit="{ opacity: 0, x: -8 }"
            :transition="{ duration: 0.2 }"
            class="space-y-5"
          >
            <div class="rounded-2xl p-4" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06)">
              <div class="flex items-center gap-4 mb-4">
                <div class="text-center">
                  <div class="font-heading text-3xl font-extrabold" style="color: #facc15">
                    {{ avgRating.toFixed(1) }}
                  </div>
                  <Stars :rating="avgRating" :size="12" />
                </div>
                <div class="flex-1 space-y-1.5">
                  <div v-for="d in distribution" :key="d.star" class="flex items-center gap-2">
                    <span class="mono text-[10px] w-3" style="color: #64748b">{{ d.star }}</span>
                    <div class="rating-bar-track flex-1">
                      <div class="rating-bar-fill fill-bar" :style="{ width: `${d.pct}%` }" />
                    </div>
                    <span class="mono text-[10px] w-6 text-right" style="color: #475569">{{ d.count }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="loadingReviews" class="text-center py-6 text-sm" style="color: #64748b">
              Đang tải đánh giá...
            </div>

            <div v-else-if="reviews.length === 0" class="text-center py-6">
              <div class="text-3xl opacity-20 mb-2">★</div>
              <p class="text-sm" style="color: #64748b">Chưa có đánh giá nào</p>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="r in reviews"
                :key="r.id || r.created_at + r.comment"
                class="rounded-xl p-3"
                style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05)"
              >
                <div class="flex items-center justify-between mb-2 gap-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <img
                      v-if="r.avatar"
                      :src="r.avatar"
                      alt=""
                      class="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                    <span class="text-xs font-semibold truncate">
                      {{ r.user_name || r.member_name || r.author || 'Thành viên' }}
                    </span>
                  </div>
                  <span class="mono text-[10px] shrink-0" style="color: #475569">{{ formatReviewDate(r.created_at) }}</span>
                </div>
                <Stars :rating="r.rating" :size="11" />
                <p class="text-sm mt-2 leading-relaxed" style="color: #94a3b8">{{ r.comment }}</p>
              </div>
            </div>

            <div class="rounded-2xl p-4 space-y-3" style="background: rgba(132,204,22,0.04); border: 1px solid rgba(132,204,22,0.12)">
              <div class="text-xs font-semibold uppercase tracking-wider" style="color: #84cc16">Viết đánh giá</div>
              <div class="flex gap-1">
                <button
                  v-for="s in 5"
                  :key="s"
                  type="button"
                  class="text-xl leading-none transition-transform active:scale-90"
                  :style="{ color: s <= reviewRating ? '#facc15' : '#1e293b' }"
                  @click="reviewRating = s"
                >
                  ★
                </button>
              </div>
              <textarea
                v-model="reviewText"
                class="input-field w-full rounded-xl px-4 py-2.5 text-sm min-h-[72px] resize-none"
                placeholder="Chia sẻ trải nghiệm của bạn..."
              />
              <p v-if="reviewError" class="text-red-400 text-xs">{{ reviewError }}</p>
              <motion.button
                type="button"
                class="btn-primary w-full py-2.5 rounded-xl text-sm"
                :disabled="submittingReview"
                :whileTap="{ scale: 0.97 }"
                @click="submitReview"
              >
                {{ submittingReview ? 'Đang gửi...' : 'Gửi đánh giá' }}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        class="absolute bottom-0 inset-x-0 p-4 pb-safe sm:relative sm:pb-4 shrink-0 space-y-2"
        style="background: linear-gradient(to top, var(--bg-2) 70%, transparent); border-top: 1px solid var(--line)"
      >
        <div class="flex gap-2">
          <motion.button
            type="button"
            class="flex-1 py-3 rounded-xl text-sm font-semibold"
            :style="{
              background: inMyEquipment || equipAdded ? 'rgba(132,204,22,0.12)' : 'rgba(255,255,255,0.06)',
              color: inMyEquipment || equipAdded ? '#84cc16' : '#e2e8f0',
              border: `1px solid ${inMyEquipment || equipAdded ? 'rgba(132,204,22,0.3)' : 'rgba(255,255,255,0.1)'}`,
            }"
            :disabled="inMyEquipment || addingEquip"
            :whileTap="{ scale: 0.97 }"
            @click="addToEquipment"
          >
            {{ inMyEquipment || equipAdded ? '✓ Đã có trong trang bị' : '⊞ Thêm trang bị' }}
          </motion.button>
          <motion.button
            type="button"
            class="flex-[1.4] btn-primary py-3 rounded-xl text-sm font-bold disabled:opacity-40"
            :disabled="product.stock === 0"
            :whileTap="product.stock > 0 ? { scale: 0.97 } : {}"
            @click="emit('add-to-cart')"
          >
            {{ product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ' }}
          </motion.button>
        </div>
      </div>
    </motion.div>
  </motion.div>
</template>
