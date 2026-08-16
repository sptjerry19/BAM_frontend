<script setup>
import { ref, onMounted, computed } from 'vue'
import { motion, AnimatePresence } from 'motion-v'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../api'
import Modal from '../common/Modal.vue'
import FormField from '../common/FormField.vue'
import Stars from '../common/Stars.vue'
import { categoryLabels, catIcons, formatCurrency, productCoverUrl, productImageUrl } from '../../utils/labels'

const products = ref([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const editing = ref(null)
const filterCategory = ref('')
const formError = ref('')

const emptyForm = () => ({
  id: '',
  name: '',
  brand: '',
  category: 'racket',
  price: 0,
  original_price: null,
  stock: 0,
  rating: 4.5,
  reviews: 0,
  description: '',
  featured: false,
})

const form = ref(emptyForm())
/** Existing remote URLs kept when editing */
const existingImages = ref([])
/** Local File objects pending upload */
const pendingFiles = ref([])
/** Object URLs for pending file previews */
const pendingPreviews = ref([])

const categories = Object.entries(categoryLabels)
  .filter(([value]) => value !== 'other')
  .map(([value, label]) => ({ value, label }))
const categoryOptions = [{ value: '', label: 'Tất cả' }, ...categories]
const categoryFormOptions = categories

const filtered = computed(() =>
  filterCategory.value
    ? products.value.filter((p) => p.category === filterCategory.value)
    : products.value,
)

const previewItems = computed(() => [
  ...existingImages.value.map((url) => ({ type: 'remote', url: productImageUrl(url), key: url })),
  ...pendingPreviews.value.map((url, i) => ({ type: 'local', url, key: `local-${i}` })),
])

function discountPct(product) {
  if (!product.original_price || product.original_price <= product.price) return 0
  return Math.round((1 - product.price / product.original_price) * 100)
}

async function load() {
  loading.value = true
  try {
    products.value = (await getProducts(undefined, { per_page: 100 })).data
  } finally {
    loading.value = false
  }
}

onMounted(load)

function revokePreviews() {
  pendingPreviews.value.forEach((url) => URL.revokeObjectURL(url))
  pendingPreviews.value = []
}

function openAdd() {
  editing.value = null
  form.value = emptyForm()
  form.value.id = `p${Date.now()}`
  existingImages.value = []
  pendingFiles.value = []
  revokePreviews()
  formError.value = ''
  showModal.value = true
}

function openEdit(product) {
  editing.value = product
  form.value = {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    original_price: product.original_price,
    stock: product.stock,
    rating: product.rating,
    reviews: product.reviews,
    description: product.description || '',
    featured: !!product.featured,
  }
  const imgs = Array.isArray(product.images) ? [...product.images] : []
  existingImages.value = imgs.length ? imgs : (product.image ? [product.image] : [])
  pendingFiles.value = []
  revokePreviews()
  formError.value = ''
  showModal.value = true
}

function onPickImages(e) {
  const files = [...(e.target.files || [])]
  e.target.value = ''
  if (!files.length) return

  const room = 12 - (existingImages.value.length + pendingFiles.value.length)
  const accepted = files.slice(0, Math.max(0, room))
  pendingFiles.value.push(...accepted)
  pendingPreviews.value.push(...accepted.map((f) => URL.createObjectURL(f)))
}

function removePreview(item, index) {
  if (item.type === 'remote') {
    existingImages.value = existingImages.value.filter((u) => u !== item.key)
    return
  }
  const localIndex = index - existingImages.value.length
  if (localIndex < 0) return
  URL.revokeObjectURL(pendingPreviews.value[localIndex])
  pendingFiles.value.splice(localIndex, 1)
  pendingPreviews.value.splice(localIndex, 1)
}

function buildFormData() {
  const fd = new FormData()
  const data = form.value
  if (!editing.value) fd.append('id', data.id)
  fd.append('name', data.name)
  fd.append('brand', data.brand)
  fd.append('category', data.category)
  fd.append('price', String(Number(data.price) || 0))
  if (data.original_price) fd.append('original_price', String(Number(data.original_price)))
  fd.append('stock', String(Number(data.stock) || 0))
  fd.append('rating', String(Number(data.rating) || 0))
  fd.append('reviews', String(Number(data.reviews) || 0))
  if (data.description) fd.append('description', data.description)
  fd.append('featured', data.featured ? '1' : '0')

  existingImages.value.forEach((url) => fd.append('keep_images[]', url))
  pendingFiles.value.forEach((file) => fd.append('image_files[]', file))

  return fd
}

async function save() {
  formError.value = ''
  if (!form.value.name?.trim() || !form.value.brand?.trim()) {
    formError.value = 'Vui lòng nhập tên và thương hiệu'
    return
  }
  if (!existingImages.value.length && !pendingFiles.value.length) {
    formError.value = 'Vui lòng thêm ít nhất 1 hình ảnh'
    return
  }

  saving.value = true
  try {
    const fd = buildFormData()
    if (editing.value) await updateProduct(editing.value.id, fd)
    else await createProduct(fd)
    showModal.value = false
    revokePreviews()
    await load()
  } catch (err) {
    formError.value = err?.api?.message || err?.response?.data?.message || 'Không thể lưu sản phẩm'
  } finally {
    saving.value = false
  }
}

async function remove(id) {
  if (confirm('Xóa sản phẩm này?')) {
    await deleteProduct(id)
    await load()
  }
}
</script>

<template>
  <div class="admin-page">
    <header class="admin-page__head admin-page__head--row">
      <div>
        <p class="eyebrow">Kho hàng</p>
        <h1 class="page-title mt-2">Sản phẩm</h1>
        <p class="lede mt-3">{{ products.length }} sản phẩm trong catalog</p>
      </div>
      <button type="button" class="btn-primary rounded-xl px-5 py-3 text-[14px] font-semibold" @click="openAdd">
        Thêm sản phẩm
      </button>
    </header>

    <div class="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Lọc danh mục">
      <button
        v-for="cat in categoryOptions"
        :key="cat.value"
        type="button"
        role="tab"
        class="admin-chip"
        :class="{ 'is-active': filterCategory === cat.value }"
        :aria-selected="filterCategory === cat.value"
        @click="filterCategory = cat.value"
      >
        <span v-if="cat.value" class="mr-1 opacity-70">{{ catIcons[cat.value] }}</span>
        {{ cat.value ? cat.label : 'Tất cả' }}
      </button>
    </div>

    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="surface h-72 shimmer" />
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <motion.article
        v-for="(product, i) in filtered"
        :key="product.id"
        class="surface overflow-hidden group"
        :initial="{ opacity: 0, y: 14 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: Math.min(i, 8) * 0.04, duration: 0.32 }"
      >
        <div class="relative">
          <img
            :src="productCoverUrl(product)"
            :alt="product.name"
            class="w-full h-48 object-cover"
          />
          <span
            v-if="(product.images || []).length > 1"
            class="absolute bottom-3 right-3 admin-badge"
          >
            {{ product.images.length }} ảnh
          </span>
          <span
            v-if="discountPct(product) > 0"
            class="absolute top-3 left-3 admin-badge admin-badge--warn"
          >
            -{{ discountPct(product) }}%
          </span>
          <span
            v-if="product.featured"
            class="absolute top-3 right-3 admin-badge"
          >
            Nổi bật
          </span>
        </div>
        <div class="p-4">
          <div class="text-[12px] mb-1" style="color: var(--text-3)">
            {{ product.brand }} · {{ categoryLabels[product.category] }}
          </div>
          <div class="font-semibold truncate text-[15px]">{{ product.name }}</div>
          <div class="flex items-center justify-between mt-2 gap-2">
            <div class="min-w-0">
              <span class="font-heading font-bold mono text-[15px]">{{ formatCurrency(product.price) }}</span>
              <span
                v-if="product.original_price && product.original_price > product.price"
                class="text-[12px] line-through ml-2 mono"
                style="color: var(--text-3)"
              >
                {{ formatCurrency(product.original_price) }}
              </span>
            </div>
            <Stars :rating="product.rating" />
          </div>
          <div class="flex items-center justify-between mt-4 gap-2">
            <span
              class="admin-badge"
              :class="product.stock > 0 ? '' : 'admin-badge--danger'"
            >
              Kho: {{ product.stock }}
            </span>
            <div class="flex gap-2">
              <button type="button" class="btn-ghost text-[12px] py-2 px-3 rounded-xl font-semibold" @click="openEdit(product)">
                Sửa
              </button>
              <button
                type="button"
                class="btn-ghost text-[12px] py-2 px-3 rounded-xl font-semibold"
                style="color: #ef4444"
                @click="remove(product.id)"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      </motion.article>
    </div>

    <AnimatePresence>
      <Modal v-if="showModal" :title="editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'" @close="showModal = false">
        <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <div class="admin-label mb-1.5">Hình ảnh * (tối đa 12)</div>
            <div class="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
              <div
                v-for="(item, idx) in previewItems"
                :key="item.key"
                class="relative aspect-square rounded-xl overflow-hidden"
                style="border: 1px solid var(--line)"
              >
                <img :src="item.url" alt="" class="w-full h-full object-cover" />
                <button
                  type="button"
                  class="absolute top-1 right-1 w-6 h-6 rounded-full text-xs"
                  style="background: rgba(239,68,68,0.9); color: #fff"
                  @click="removePreview(item, idx)"
                >
                  ✕
                </button>
              </div>
              <label
                v-if="previewItems.length < 12"
                class="aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer"
                style="border: 1px dashed var(--line); background: var(--bg-2)"
              >
                <span class="text-lg font-bold">+</span>
                <span class="text-[10px] mt-1" style="color: var(--text-3)">Thêm ảnh</span>
                <input type="file" accept="image/*" multiple class="hidden" @change="onPickImages" />
              </label>
            </div>
            <p class="text-[11px]" style="color: var(--text-3)">Ảnh đầu tiên là ảnh bìa.</p>
          </div>

          <FormField v-model="form.name" label="Tên sản phẩm" />
          <FormField v-model="form.brand" label="Thương hiệu" />
          <FormField v-model="form.category" label="Danh mục" type="select" :options="categoryFormOptions" />
          <div class="grid grid-cols-2 gap-4">
            <FormField v-model="form.price" label="Giá" type="number" />
            <FormField v-model="form.original_price" label="Giá gốc" type="number" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <FormField v-model="form.stock" label="Tồn kho" type="number" />
            <FormField v-model="form.rating" label="Đánh giá" type="number" :min="0" :max="5" :step="0.1" />
          </div>
          <FormField v-model="form.description" label="Mô tả" type="textarea" />

          <label class="flex items-center gap-2 text-[14px] cursor-pointer" style="color: var(--text-2)">
            <input v-model="form.featured" type="checkbox" class="rounded" />
            Sản phẩm nổi bật
          </label>

          <p v-if="formError" class="text-sm" style="color: #ef4444">{{ formError }}</p>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="btn-primary flex-1 rounded-xl py-3 text-[14px] font-semibold disabled:opacity-50"
              :disabled="saving"
              @click="save"
            >
              {{ saving ? 'Đang lưu...' : 'Lưu' }}
            </button>
            <button
              type="button"
              class="btn-ghost flex-1 rounded-xl py-3 text-[14px] font-semibold"
              @click="showModal = false"
            >
              Hủy
            </button>
          </div>
        </div>
      </Modal>
    </AnimatePresence>
  </div>
</template>
