<script setup>
import { ref, inject, onMounted, onUnmounted, computed, watch } from 'vue'
import { motion, AnimatePresence } from 'motion-v'
import {
  getProducts,
  getProductsByIds,
  getCustomEquipments,
  createCustomEquipment,
  deleteCustomEquipment,
} from '../../api'
import Stars from '../common/Stars.vue'
import FormField from '../common/FormField.vue'
import Icon from '../common/Icon.vue'
import { categoryLabels, formatCurrency, catIcons, productImageUrl } from '../../utils/labels'

const emit = defineEmits(['go-shop'])

const user = inject('user')
const goToShop = inject('goToShop', null)
const addToEquipment = inject('addToEquipment', null)
const removeFromEquipment = inject('removeFromEquipment', null)
const openProductDetail = inject('openProductDetail', null)

const tab = ref('store')
const products = ref([])
const customItems = ref([])
const showForm = ref(false)
const showPicker = ref(false)
const pickerSearch = ref('')
const pickerQuery = ref('')
const pickerPage = ref(1)
const pickerLoading = ref(false)
const pickerProducts = ref([])
const pickerPagination = ref({
  current_page: 1,
  last_page: 1,
  total: 0,
  has_more_pages: false,
})
const submitting = ref(false)
const formError = ref('')
const attachingId = ref(null)

const form = ref({
  name: '',
  brand: '',
  category: 'racket',
  price: '',
  notes: '',
  image: '',
})

const categoryOptions = Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))

const myEquipment = computed(() => products.value)

const catGroups = computed(() => {
  const groups = {}
  myEquipment.value.forEach((p) => {
    if (!groups[p.category]) groups[p.category] = []
    groups[p.category].push(p)
  })
  return groups
})

const storeCount = computed(() => myEquipment.value.length)
const customCount = computed(() => customItems.value.length)

const ownedIds = computed(() => new Set((user.value?.equipment || []).map(String)))

const availableProducts = computed(() =>
  pickerProducts.value.filter((p) => !ownedIds.value.has(String(p.id))),
)

const pickerPageNumbers = computed(() => {
  const last = pickerPagination.value.last_page || 1
  const current = pickerPagination.value.current_page || 1
  const windowSize = 5
  let start = Math.max(1, current - Math.floor(windowSize / 2))
  const end = Math.min(last, start + windowSize - 1)
  start = Math.max(1, end - windowSize + 1)
  const pages = []
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

async function loadOwnedProducts() {
  const ids = user.value?.equipment || []
  products.value = await getProductsByIds(ids)
}

async function loadCustom() {
  if (!user.value?.id) return
  try {
    const data = await getCustomEquipments(user.value.id)
    customItems.value = Array.isArray(data) ? data : data?.data || []
  } catch {
    customItems.value = []
  }
}

let pickerTimer = null

async function loadPicker() {
  pickerLoading.value = true
  try {
    const res = await getProducts(undefined, {
      page: pickerPage.value,
      per_page: 12,
      ...(pickerQuery.value ? { search: pickerQuery.value } : {}),
    })
    pickerProducts.value = res.data
    if (res.pagination) {
      pickerPagination.value = res.pagination
      pickerPage.value = res.pagination.current_page
    }
  } finally {
    pickerLoading.value = false
  }
}

function goPickerPage(p) {
  const last = pickerPagination.value.last_page || 1
  const next = Math.min(Math.max(1, p), last)
  if (next === pickerPage.value) return
  pickerPage.value = next
  loadPicker()
}

watch(showPicker, (open) => {
  if (!open) return
  pickerSearch.value = ''
  pickerQuery.value = ''
  pickerPage.value = 1
  loadPicker()
})

watch(pickerSearch, (value) => {
  clearTimeout(pickerTimer)
  pickerTimer = setTimeout(() => {
    pickerQuery.value = value.trim()
    pickerPage.value = 1
    if (showPicker.value) loadPicker()
  }, 350)
})

function navigateShop() {
  if (goToShop) goToShop()
  else emit('go-shop')
}

function openForm() {
  form.value = { name: '', brand: '', category: 'racket', price: '', notes: '', image: '' }
  formError.value = ''
  showForm.value = true
}

function onImagePick(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    form.value.image = reader.result
  }
  reader.readAsDataURL(file)
}

async function submitCustom() {
  if (!form.value.name.trim()) {
    formError.value = 'Vui lòng nhập tên trang bị'
    return
  }
  formError.value = ''
  submitting.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      brand: form.value.brand.trim() || null,
      category: form.value.category,
      price: form.value.price ? Number(form.value.price) : null,
      notes: form.value.notes.trim() || null,
      image: form.value.image || null,
    }
    const created = await createCustomEquipment(user.value?.id || 'm1', payload)
    customItems.value.unshift(created?.id ? created : created?.data || created)
    showForm.value = false
  } catch {
    formError.value = 'Không thể lưu trang bị. Vui lòng thử lại.'
  } finally {
    submitting.value = false
  }
}

async function removeCustom(id) {
  try {
    await deleteCustomEquipment(id)
    customItems.value = customItems.value.filter((x) => x.id !== id)
  } catch {
    /* ignore */
  }
}

async function pickProduct(p) {
  if (!addToEquipment || attachingId.value) return
  attachingId.value = p.id
  try {
    await addToEquipment(p.id)
    await loadOwnedProducts()
  } finally {
    attachingId.value = null
  }
}

async function detachProduct(id) {
  if (removeFromEquipment) await removeFromEquipment(id)
  await loadOwnedProducts()
}

function viewProduct(p) {
  if (openProductDetail) openProductDetail(p)
}

onMounted(async () => {
  await Promise.all([loadOwnedProducts(), loadCustom()])
})

onUnmounted(() => {
  clearTimeout(pickerTimer)
})
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="page-title">Trang bị của tôi</h1>
      <p class="lede mt-3">
        Lưu lại vợt, giày và phụ kiện đang dùng để theo dõi chi phí và biết khi nào cần thay.
      </p>
    </header>

    <div class="flex gap-1 p-1 rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar" style="background: rgba(255,255,255,0.04)">
      <button
        v-for="t in [
          { id: 'store', label: 'Từ cửa hàng', count: storeCount },
          { id: 'custom', label: 'Tùy chỉnh', count: customCount },
        ]"
        :key="t.id"
        type="button"
        class="relative flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap min-h-[44px]"
        :style="{ color: tab === t.id ? '#84cc16' : '#64748b' }"
        @click="tab = t.id"
      >
        <motion.div
          v-if="tab === t.id"
          layout-id="equip-tab"
          class="absolute inset-0 rounded-lg"
          style="background: rgba(132,204,22,0.12); border: 1px solid rgba(132,204,22,0.2)"
          :transition="{ type: 'spring', stiffness: 400, damping: 30 }"
        />
        <span class="relative">{{ t.label }}</span>
        <span class="relative ml-1 mono text-[10px]" style="color: #475569">({{ t.count }})</span>
      </button>
    </div>

    <AnimatePresence mode="wait">
      <motion.div
        v-if="tab === 'store'"
        key="store"
        :initial="{ opacity: 0, y: 8 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: -8 }"
        class="space-y-5"
      >
        <div class="flex flex-col sm:flex-row gap-2">
          <motion.button
            type="button"
            class="btn-primary flex-1 px-4 py-3 rounded-xl text-sm font-semibold min-h-[48px]"
            :whileTap="{ scale: 0.98 }"
            @click="showPicker = true"
          >
            + Chọn từ cửa hàng
          </motion.button>
          <motion.button
            type="button"
            class="btn-ghost flex-1 px-4 py-3 rounded-xl text-sm font-semibold min-h-[48px]"
            :whileTap="{ scale: 0.98 }"
            @click="navigateShop"
          >
            Mở cửa hàng
          </motion.button>
        </div>

        <template v-if="storeCount > 0">
          <motion.div
            v-for="(items, cat, gi) in catGroups"
            :key="cat"
            :initial="{ opacity: 0, y: 15 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ delay: gi * 0.08 }"
          >
            <div class="flex items-center gap-2 mb-3">
              <div class="w-1 h-5 rounded-full" style="background: #84cc16" />
              <h2 class="font-heading font-bold text-base">{{ categoryLabels[cat] }}</h2>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <motion.div
                v-for="(p, i) in items"
                :key="p.id"
                class="rounded-2xl p-4 relative overflow-hidden"
                style="background: rgba(255,255,255,0.04); border: 1px solid rgba(132,204,22,0.12)"
                :initial="{ opacity: 0, scale: 0.92 }"
                :animate="{ opacity: 1, scale: 1 }"
                :transition="{ delay: gi * 0.08 + i * 0.05 }"
                :whileTap="{ scale: 0.98 }"
                @click="viewProduct(p)"
              >
                <div class="flex items-center gap-3 mb-3">
                  <div
                    class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl product-img-bg overflow-hidden shrink-0"
                    style="border: 1px solid rgba(132,204,22,0.2)"
                  >
                    <img
                      v-if="p.image"
                      :src="productImageUrl(p.image)"
                      :alt="p.name"
                      class="w-full h-full object-cover"
                    />
                    <span v-else>{{ catIcons[cat] || '◈' }}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="font-bold text-sm leading-snug">{{ p.name }}</div>
                    <div class="text-xs mt-0.5" style="color: #64748b">{{ p.brand }}</div>
                    <div class="mono text-sm font-semibold mt-1" style="color: #84cc16">
                      {{ formatCurrency(p.price) }}
                    </div>
                  </div>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <Stars :rating="p.rating" :size="12" />
                  <motion.button
                    type="button"
                    class="text-xs px-3 py-1.5 rounded-lg min-h-[36px]"
                    style="background: rgba(239,68,68,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.25)"
                    :whileTap="{ scale: 0.95 }"
                    @click.stop="detachProduct(p.id)"
                  >
                    Gỡ
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </template>

        <motion.div
          v-else
          class="surface-quiet px-6 py-14 text-center"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
        >
          <span
            class="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
            style="background: var(--accent-soft); color: var(--accent)"
          >
            <Icon name="racket" :size="23" />
          </span>
          <p class="font-heading font-bold text-[16px] mt-4">Chưa có trang bị nào từ cửa hàng</p>
          <p class="text-[13px] mt-1.5" style="color: var(--text-3)">
            Chọn sản phẩm bạn đang dùng để lưu vào danh sách này.
          </p>
        </motion.div>
      </motion.div>

      <motion.div
        v-else
        key="custom"
        :initial="{ opacity: 0, y: 8 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: -8 }"
        class="space-y-5"
      >
        <motion.button
          type="button"
          class="btn-primary w-full sm:w-auto px-4 py-3 rounded-xl text-sm font-semibold min-h-[48px]"
          :whileTap="{ scale: 0.97 }"
          @click="openForm"
        >
          + Thêm trang bị tùy chỉnh
        </motion.button>

        <div v-if="customCount === 0" class="surface-quiet px-6 py-14 text-center">
          <span
            class="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
            style="background: var(--accent-soft); color: var(--accent)"
          >
            <Icon name="bag" :size="23" />
          </span>
          <p class="font-heading font-bold text-[16px] mt-4">Chưa có trang bị tùy chỉnh</p>
          <p class="text-[13px] mt-1.5" style="color: var(--text-3)">
            Tải ảnh và nhập thông tin món đồ bạn tự mua ngoài cửa hàng.
          </p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <motion.div
            v-for="(item, i) in customItems"
            :key="item.id"
            class="rounded-2xl overflow-hidden relative"
            style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07)"
            :initial="{ opacity: 0, scale: 0.92 }"
            :animate="{ opacity: 1, scale: 1 }"
            :transition="{ delay: i * 0.05 }"
          >
            <div class="h-36 sm:h-32 product-img-bg flex items-center justify-center overflow-hidden">
              <img
                v-if="item.image"
                :src="item.image.startsWith('data:') || item.image.startsWith('http') ? item.image : productImageUrl(item.image)"
                :alt="item.name"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-4xl opacity-30">{{ catIcons[item.category] || '◈' }}</span>
            </div>
            <div class="p-4">
              <div class="text-[10px] font-semibold uppercase tracking-wider mb-1" style="color: #475569">
                {{ categoryLabels[item.category] || item.category }}
              </div>
              <div class="font-bold text-sm mb-1">{{ item.name }}</div>
              <div v-if="item.brand" class="text-xs mb-2" style="color: #64748b">{{ item.brand }}</div>
              <div v-if="item.price" class="mono text-sm font-semibold" style="color: #84cc16">
                {{ formatCurrency(item.price) }}
              </div>
              <p v-if="item.notes" class="text-xs mt-2 line-clamp-2" style="color: #64748b">{{ item.notes }}</p>
              <motion.button
                type="button"
                class="mt-3 w-full text-xs py-2 rounded-lg min-h-[40px]"
                style="background: rgba(239,68,68,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.25)"
                :whileTap="{ scale: 0.97 }"
                @click="removeCustom(item.id)"
              >
                Xóa trang bị
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>

    <!-- Custom upload modal -->
    <AnimatePresence>
      <motion.div
        v-if="showForm"
        class="fixed inset-0 modal-backdrop flex items-end sm:items-center justify-center p-0 sm:p-4"
        style="z-index: var(--z-modal)"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        @click="showForm = false"
      >
        <motion.div
          class="modal-sheet glass-strong w-full sm:max-w-md max-h-[92dvh] overflow-y-auto p-5 sm:p-6"
          :initial="{ y: '100%', opacity: 0 }"
          :animate="{ y: 0, opacity: 1 }"
          :exit="{ y: '100%', opacity: 0 }"
          :transition="{ type: 'spring', stiffness: 380, damping: 36 }"
          @click.stop
        >
          <div class="drag-handle sm:hidden" />
          <div class="flex items-center justify-between mb-5">
            <h2 class="font-heading text-lg font-extrabold">Thêm trang bị tùy chỉnh</h2>
            <button type="button" class="btn-ghost w-9 h-9 rounded-full text-sm" @click="showForm = false">✕</button>
          </div>

          <div class="space-y-4 pb-safe">
            <div>
              <label class="block uppercase tracking-wider font-semibold text-[11px] mb-1.5" style="color: #64748b">
                Ảnh trang bị
              </label>
              <label
                class="flex flex-col items-center justify-center h-36 rounded-xl cursor-pointer product-img-bg"
                style="border: 1px dashed rgba(255,255,255,0.12)"
              >
                <img
                  v-if="form.image"
                  :src="form.image"
                  alt="Preview"
                  class="w-full h-full object-cover rounded-xl"
                />
                <template v-else>
                  <span class="text-2xl mb-1 opacity-40">📷</span>
                  <span class="text-xs" style="color: #64748b">Chọn ảnh từ máy</span>
                </template>
                <input type="file" accept="image/*" class="hidden" @change="onImagePick" />
              </label>
            </div>

            <FormField v-model="form.name" label="Tên *" placeholder="VD: Vợt Yonex cá nhân" />
            <FormField v-model="form.brand" label="Thương hiệu" placeholder="VD: Yonex" />
            <FormField v-model="form.category" label="Danh mục" type="select" :options="categoryOptions" />
            <FormField v-model="form.price" label="Giá trị (VND)" type="number" placeholder="0" />
            <FormField v-model="form.notes" label="Ghi chú" type="textarea" placeholder="Mô tả thêm..." />

            <p v-if="formError" class="text-red-400 text-sm">{{ formError }}</p>

            <div class="flex gap-3 pt-2 sticky bottom-0 pb-1" style="background: linear-gradient(to top, var(--bg-2) 80%, transparent)">
              <motion.button
                type="button"
                class="flex-1 btn-ghost py-3 rounded-xl text-sm min-h-[48px]"
                :whileTap="{ scale: 0.97 }"
                @click="showForm = false"
              >
                Hủy
              </motion.button>
              <motion.button
                type="button"
                class="flex-1 btn-primary py-3 rounded-xl text-sm min-h-[48px]"
                :disabled="submitting"
                :whileTap="{ scale: 0.97 }"
                @click="submitCustom"
              >
                {{ submitting ? 'Đang lưu...' : 'Lưu' }}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>

    <!-- Pick from shop modal -->
    <AnimatePresence>
      <motion.div
        v-if="showPicker"
        class="fixed inset-0 modal-backdrop flex items-end sm:items-center justify-center p-0 sm:p-4"
        style="z-index: var(--z-modal)"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        @click="showPicker = false"
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
          <div class="flex items-center justify-between px-5 pb-3 shrink-0">
            <div>
              <h2 class="font-heading text-lg font-extrabold">Chọn từ cửa hàng</h2>
              <p class="text-xs mt-0.5" style="color: #64748b">Thêm sản phẩm vào trang bị của bạn</p>
            </div>
            <button type="button" class="btn-ghost w-9 h-9 rounded-full text-sm" @click="showPicker = false">✕</button>
          </div>

          <div class="px-5 pb-3 shrink-0">
            <input
              v-model="pickerSearch"
              type="search"
              placeholder="Tìm sản phẩm..."
              class="input-field w-full rounded-xl px-4 py-2.5 text-sm"
            />
          </div>

          <div class="flex-1 overflow-y-auto px-5 pb-6 space-y-2">
            <div v-if="pickerLoading" class="text-center py-10">
              <p class="text-sm" style="color: #64748b">Đang tải sản phẩm…</p>
            </div>
            <div v-else-if="availableProducts.length === 0" class="text-center py-10">
              <p class="text-sm" style="color: #64748b">
                {{ pickerQuery ? 'Không tìm thấy sản phẩm phù hợp' : 'Không còn sản phẩm để thêm' }}
              </p>
            </div>
            <template v-else>
              <motion.button
                v-for="p in availableProducts"
                :key="p.id"
                type="button"
                class="w-full flex items-center gap-3 p-3 rounded-xl text-left"
                style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06)"
                :disabled="attachingId === p.id"
                :whileTap="{ scale: 0.98 }"
                @click="pickProduct(p)"
              >
                <div
                  class="w-12 h-12 rounded-xl product-img-bg flex items-center justify-center overflow-hidden shrink-0 text-xl"
                >
                  <img
                    v-if="p.image"
                    :src="productImageUrl(p.image)"
                    :alt="p.name"
                    class="w-full h-full object-cover"
                  />
                  <span v-else>{{ catIcons[p.category] || '◈' }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-semibold truncate">{{ p.name }}</div>
                  <div class="text-xs" style="color: #64748b">{{ p.brand }} · {{ categoryLabels[p.category] }}</div>
                  <div class="mono text-xs font-semibold mt-0.5" style="color: #84cc16">{{ formatCurrency(p.price) }}</div>
                </div>
                <span class="text-lg shrink-0" style="color: #84cc16">
                  {{ attachingId === p.id ? '…' : '+' }}
                </span>
              </motion.button>

              <nav
                v-if="pickerPagination.last_page > 1"
                class="flex flex-col items-center gap-2 pt-4 pb-2"
                aria-label="Phân trang chọn sản phẩm"
              >
                <p class="mono text-[11px]" style="color: #64748b">
                  Trang {{ pickerPagination.current_page }} / {{ pickerPagination.last_page }}
                </p>
                <div class="flex flex-wrap items-center justify-center gap-1.5">
                  <button
                    type="button"
                    class="btn-ghost rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-30"
                    :disabled="pickerPagination.current_page <= 1 || pickerLoading"
                    @click="goPickerPage(pickerPagination.current_page - 1)"
                  >
                    Trước
                  </button>
                  <button
                    v-for="n in pickerPageNumbers"
                    :key="n"
                    type="button"
                    class="rounded-lg px-2.5 py-1.5 text-xs font-semibold min-w-[32px]"
                    :style="n === pickerPagination.current_page
                      ? 'background: rgba(132,204,22,0.18); color: #84cc16'
                      : 'color: #94a3b8'"
                    :disabled="pickerLoading"
                    @click="goPickerPage(n)"
                  >
                    {{ n }}
                  </button>
                  <button
                    type="button"
                    class="btn-ghost rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-30"
                    :disabled="!pickerPagination.has_more_pages || pickerLoading"
                    @click="goPickerPage(pickerPagination.current_page + 1)"
                  >
                    Sau
                  </button>
                </div>
              </nav>
            </template>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
