<script setup>
import { ref, onMounted, computed } from 'vue'
import { motion, AnimatePresence } from 'motion-v'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../api'
import Modal from '../common/Modal.vue'
import FormField from '../common/FormField.vue'
import Stars from '../common/Stars.vue'
import { categoryLabels, catIcons, formatCurrency, productImageUrl } from '../../utils/labels'

const products = ref([])
const loading = ref(true)
const showModal = ref(false)
const editing = ref(null)
const filterCategory = ref('')

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
  image: 'photo-1626224583764-f87db24ac4ea',
})

const form = ref(emptyForm())

const categories = Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))
const categoryOptions = [{ value: '', label: 'Tất cả' }, ...categories]
const categoryFormOptions = categories

const filtered = computed(() =>
  filterCategory.value
    ? products.value.filter((p) => p.category === filterCategory.value)
    : products.value,
)

function discountPct(product) {
  if (!product.original_price || product.original_price <= product.price) return 0
  return Math.round((1 - product.price / product.original_price) * 100)
}

async function load() {
  loading.value = true
  try {
    products.value = await getProducts()
  } finally {
    loading.value = false
  }
}

onMounted(load)

function openAdd() {
  editing.value = null
  form.value = emptyForm()
  form.value.id = `p${Date.now()}`
  showModal.value = true
}

function openEdit(product) {
  editing.value = product
  form.value = { ...product }
  showModal.value = true
}

async function save() {
  const data = { ...form.value }
  if (!data.original_price) data.original_price = null
  if (editing.value) {
    await updateProduct(editing.value.id, data)
  } else {
    await createProduct(data)
  }
  showModal.value = false
  await load()
}

async function remove(id) {
  if (confirm('Xóa sản phẩm này?')) {
    await deleteProduct(id)
    await load()
  }
}
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
      <div>
        <h1 class="page-title">Sản phẩm</h1>
        <p class="mt-1 text-sm" style="color: #64748b">{{ products.length }} sản phẩm</p>
      </div>
      <motion.button
        type="button"
        class="btn-primary rounded-xl px-5 py-2.5 text-sm w-full sm:w-auto"
        :whileHover="{ scale: 1.02 }"
        :whileTap="{ scale: 0.97 }"
        @click="openAdd"
      >
        + Thêm sản phẩm
      </motion.button>
    </div>

    <div class="flex flex-wrap gap-2 mb-6">
      <motion.button
        v-for="cat in categoryOptions"
        :key="cat.value"
        type="button"
        class="pill transition-all"
        :style="
          filterCategory === cat.value
            ? { background: 'rgba(132,204,22,0.15)', color: '#84cc16', border: '1px solid rgba(132,204,22,0.3)' }
            : { background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }
        "
        :whileTap="{ scale: 0.95 }"
        @click="filterCategory = cat.value"
      >
        <span v-if="cat.value" class="mr-1">{{ catIcons[cat.value] }}</span>
        {{ cat.value ? cat.label : 'Tất cả' }}
      </motion.button>
    </div>

    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="glass rounded-2xl h-72 shimmer" />
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <motion.div
        v-for="(product, i) in filtered"
        :key="product.id"
        class="glass rounded-2xl overflow-hidden group"
        :initial="{ opacity: 0, y: 16 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: i * 0.05, duration: 0.35 }"
        :whileHover="{ y: -3 }"
      >
        <div class="relative">
          <img
            :src="productImageUrl(product.image)"
            :alt="product.name"
            class="w-full h-44 object-cover"
          />
          <span
            v-if="discountPct(product) > 0"
            class="absolute top-3 left-3 pill mono"
            style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3)"
          >
            -{{ discountPct(product) }}%
          </span>
          <span
            v-if="product.featured"
            class="absolute top-3 right-3 pill"
            style="background: rgba(250,204,21,0.15); color: #facc15; border: 1px solid rgba(250,204,21,0.3)"
          >
            Hot
          </span>
        </div>
        <div class="p-4">
          <div class="flex items-center gap-2 mb-1">
            <span>{{ catIcons[product.category] }}</span>
            <span class="text-xs" style="color: #64748b">
              {{ product.brand }} · {{ categoryLabels[product.category] }}
            </span>
          </div>
          <div class="font-medium truncate mb-2" style="color: #f0f4ff">{{ product.name }}</div>
          <div class="flex items-center justify-between">
            <div>
              <span class="font-bold mono" style="color: #84cc16">{{ formatCurrency(product.price) }}</span>
              <span
                v-if="product.original_price && product.original_price > product.price"
                class="text-xs line-through ml-2 mono"
                style="color: #64748b"
              >
                {{ formatCurrency(product.original_price) }}
              </span>
            </div>
            <Stars :rating="product.rating" />
          </div>
          <div class="flex items-center justify-between mt-3">
            <span
              class="pill mono"
              :style="{
                background: product.stock > 0 ? 'rgba(132,204,22,0.12)' : 'rgba(239,68,68,0.12)',
                color: product.stock > 0 ? '#84cc16' : '#ef4444',
                border: `1px solid ${product.stock > 0 ? 'rgba(132,204,22,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }"
            >
              Kho: {{ product.stock }}
            </span>
            <div class="flex gap-2">
              <motion.button
                type="button"
                class="btn-ghost text-xs py-1.5 px-3 rounded-lg"
                :whileTap="{ scale: 0.95 }"
                @click="openEdit(product)"
              >
                Sửa
              </motion.button>
              <motion.button
                type="button"
                class="btn-ghost text-xs py-1.5 px-3 rounded-lg"
                style="color: #ef4444"
                :whileTap="{ scale: 0.95 }"
                @click="remove(product.id)"
              >
                Xóa
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>

    <AnimatePresence>
      <Modal v-if="showModal" :title="editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'" @close="showModal = false">
        <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <FormField v-model="form.name" label="Tên sản phẩm" />
          <FormField v-model="form.brand" label="Thương hiệu" />
          <FormField v-model="form.category" label="Danh mục" type="select" :options="categoryFormOptions" />
          <div class="grid grid-cols-2 gap-4">
            <FormField v-model="form.price" label="Giá" type="number" />
            <FormField v-model="form.original_price" label="Giá gốc" type="number" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <FormField v-model="form.stock" label="Tồn kho" type="number" />
            <FormField v-model="form.rating" label="Đánh giá" type="number" />
          </div>
          <FormField v-model="form.description" label="Mô tả" type="textarea" />
          <div class="flex gap-3 pt-2">
            <motion.button
              type="button"
              class="btn-primary flex-1 rounded-xl py-2.5 text-sm"
              :whileTap="{ scale: 0.97 }"
              @click="save"
            >
              Lưu
            </motion.button>
            <motion.button
              type="button"
              class="btn-ghost flex-1 rounded-xl py-2.5 text-sm"
              :whileTap="{ scale: 0.97 }"
              @click="showModal = false"
            >
              Hủy
            </motion.button>
          </div>
        </div>
      </Modal>
    </AnimatePresence>
  </div>
</template>
