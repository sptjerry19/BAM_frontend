<script setup>
import { ref, computed, onMounted } from 'vue'
import { motion, AnimatePresence } from 'motion-v'
import {
  getNewsList,
  createNews,
  updateNews,
  deleteNews,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadFiles,
} from '../../api'
import Modal from '../common/Modal.vue'
import FormField from '../common/FormField.vue'
import HtmlEditor from '../common/HtmlEditor.vue'
import { formatNewsDate } from '../../data/news'

const tab = ref('news')
const loading = ref(true)
const saving = ref(false)
const formError = ref('')

const articles = ref([])
const pagination = ref({ current_page: 1, last_page: 1, total: 0, has_more_pages: false })
const page = ref(1)
const categoryFilter = ref('')
const categories = ref([])
const uploading = ref(false)

const showNewsModal = ref(false)
const editingNews = ref(null)
const showCatModal = ref(false)
const editingCat = ref(null)

const emptyNews = () => ({
  title: '',
  category_id: '',
  tag: '',
  excerpt: '',
  date: new Date().toISOString().slice(0, 10),
  read: 3,
  featured: 0,
  cover_caption: '',
  image: '',
  content: '',
})

const emptyCat = () => ({
  name: '',
  image: '',
})

const newsForm = ref(emptyNews())
const catForm = ref(emptyCat())

const categoryOptions = computed(() =>
  categories.value.map((c) => ({ value: String(c.id), label: c.name })),
)

const featuredOptions = [
  { value: 0, label: 'Thường' },
  { value: 1, label: 'Nổi bật' },
]

function toDateInput(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function apiError(err) {
  const errors = err?.api?.errors || err?.response?.data?.errors
  if (errors && typeof errors === 'object') {
    const first = Object.values(errors).flat()[0]
    if (first) return first
  }
  return err?.api?.message || err?.response?.data?.message || 'Không lưu được. Thử lại.'
}

async function loadCategories() {
  categories.value = await getCategories()
}

async function loadNews() {
  loading.value = true
  try {
    const params = { page: page.value, per_page: 12 }
    if (categoryFilter.value) params.category_id = categoryFilter.value
    const res = await getNewsList(params)
    articles.value = res.data
    if (res.pagination) {
      pagination.value = res.pagination
      page.value = res.pagination.current_page
    }
  } finally {
    loading.value = false
  }
}

function onFilterCategory() {
  page.value = 1
  loadNews()
}

async function load() {
  loading.value = true
  try {
    await loadCategories()
    await loadNews()
  } finally {
    loading.value = false
  }
}

onMounted(load)

function goToPage(p) {
  const last = pagination.value.last_page || 1
  const next = Math.min(Math.max(1, p), last)
  if (next === page.value) return
  page.value = next
  loadNews()
}

function openAddNews() {
  if (!categories.value.length) {
    tab.value = 'categories'
    alert('Hãy tạo danh mục trước khi thêm bài viết.')
    return
  }
  editingNews.value = null
  newsForm.value = emptyNews()
  if (categoryOptions.value[0]) newsForm.value.category_id = categoryOptions.value[0].value
  formError.value = ''
  showNewsModal.value = true
}

function openEditNews(item) {
  editingNews.value = item
  newsForm.value = {
    title: item.title || '',
    category_id: String(item.category_id || ''),
    tag: item.tag || '',
    excerpt: item.excerpt || '',
    date: toDateInput(item.date),
    read: item.read || 0,
    featured: item.featured ? 1 : 0,
    cover_caption: item.cover_caption || '',
    image: item.image || '',
    content: item.content || item.body || '',
  }
  formError.value = ''
  showNewsModal.value = true
}

async function saveNews() {
  saving.value = true
  formError.value = ''
  try {
    const payload = {
      ...newsForm.value,
      category_id: Number(newsForm.value.category_id),
      featured: Boolean(Number(newsForm.value.featured)),
      read: Number(newsForm.value.read) || 0,
    }
    if (editingNews.value) {
      await updateNews(editingNews.value.id, payload)
    } else {
      await createNews(payload)
    }
    showNewsModal.value = false
    await loadNews()
  } catch (err) {
    formError.value = apiError(err)
  } finally {
    saving.value = false
  }
}

async function removeNews(id) {
  if (!confirm('Xóa bài viết này?')) return
  await deleteNews(id)
  if (articles.value.length === 1 && page.value > 1) page.value -= 1
  await loadNews()
}

async function uploadImage(event, target) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  uploading.value = true
  formError.value = ''
  try {
    const res = await uploadFiles([file], target === 'category' ? 'categories' : 'news')
    const url = res?.urls?.[0]
    if (!url) throw new Error('upload')
    if (target === 'category') catForm.value.image = url
    else newsForm.value.image = url
  } catch (err) {
    formError.value = apiError(err)
  } finally {
    uploading.value = false
  }
}

function openAddCat() {
  editingCat.value = null
  catForm.value = emptyCat()
  formError.value = ''
  showCatModal.value = true
}

function openEditCat(cat) {
  editingCat.value = cat
  catForm.value = { name: cat.name || '', image: cat.image || '' }
  formError.value = ''
  showCatModal.value = true
}

async function saveCat() {
  saving.value = true
  formError.value = ''
  try {
    if (editingCat.value) {
      await updateCategory(editingCat.value.id, catForm.value)
    } else {
      await createCategory(catForm.value)
    }
    showCatModal.value = false
    await loadCategories()
  } catch (err) {
    formError.value = apiError(err)
  } finally {
    saving.value = false
  }
}

async function removeCat(id) {
  if (!confirm('Xóa danh mục này?')) return
  try {
    await deleteCategory(id)
    await loadCategories()
  } catch (err) {
    alert(apiError(err))
  }
}
</script>

<template>
  <div class="admin-page">
    <header class="admin-page__head admin-page__head--row">
      <div>
        <p class="eyebrow">Nội dung</p>
        <h1 class="page-title mt-2">Quản lý tin tức</h1>
        <p class="lede mt-3">
          {{ pagination.total || articles.length }} bài · {{ categories.length }} danh mục
        </p>
      </div>
      <button
        v-if="tab === 'news'"
        type="button"
        class="btn-primary rounded-xl px-5 py-3 text-[14px] font-semibold"
        @click="openAddNews"
      >
        Thêm bài
      </button>
      <button
        v-else
        type="button"
        class="btn-primary rounded-xl px-5 py-3 text-[14px] font-semibold"
        @click="openAddCat"
      >
        Thêm danh mục
      </button>
    </header>

    <div class="flex flex-wrap items-center gap-2 mb-6" role="tablist" aria-label="Quản lý tin">
      <button
        type="button"
        class="px-4 py-2 rounded-full text-[13px] font-semibold"
        :style="{
          background: tab === 'news' ? 'var(--text)' : 'transparent',
          color: tab === 'news' ? 'var(--bg)' : 'var(--text-2)',
          border: `1px solid ${tab === 'news' ? 'var(--text)' : 'var(--line)'}`,
        }"
        @click="tab = 'news'"
      >
        Bài viết
      </button>
      <button
        type="button"
        class="px-4 py-2 rounded-full text-[13px] font-semibold"
        :style="{
          background: tab === 'categories' ? 'var(--text)' : 'transparent',
          color: tab === 'categories' ? 'var(--bg)' : 'var(--text-2)',
          border: `1px solid ${tab === 'categories' ? 'var(--text)' : 'var(--line)'}`,
        }"
        @click="tab = 'categories'"
      >
        Danh mục
      </button>
      <select
        v-if="tab === 'news' && categories.length"
        v-model="categoryFilter"
        class="ml-auto input-field rounded-full px-3 py-2 text-[13px]"
        @change="onFilterCategory"
      >
        <option value="">Tất cả danh mục</option>
        <option v-for="c in categories" :key="c.id" :value="String(c.id)">{{ c.name }}</option>
      </select>
    </div>

    <!-- News -->
    <div v-show="tab === 'news'">
      <div class="md:hidden space-y-3">
        <div v-if="loading" class="surface p-8 text-center text-sm" style="color: var(--text-3)">Đang tải...</div>
        <div
          v-else-if="!articles.length"
          class="surface p-8 text-center text-sm"
          style="color: var(--text-3)"
        >
          Chưa có bài viết.
        </div>
        <motion.article
          v-for="(item, i) in articles"
          :key="item.id"
          class="surface p-4"
          :initial="{ opacity: 0, y: 10 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ delay: i * 0.04 }"
        >
          <div class="flex items-start gap-3 mb-3">
            <img
              v-if="item.image"
              :src="item.image"
              alt=""
              class="w-16 h-16 rounded-xl object-cover shrink-0"
            />
            <div class="min-w-0 flex-1">
              <div class="font-semibold text-[15px] leading-snug">{{ item.title }}</div>
              <div class="text-[12px] mt-1" style="color: var(--text-3)">
                {{ item.category?.name || item.tag }} · {{ formatNewsDate(item.date) }}
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <button type="button" class="btn-ghost flex-1 text-[12px] py-2.5 rounded-xl font-semibold" @click="openEditNews(item)">
              Sửa
            </button>
            <button
              type="button"
              class="flex-1 text-[12px] py-2.5 rounded-xl font-semibold"
              style="background: rgba(239,68,68,0.08); color: #ef4444; border: 1px solid rgba(239,68,68,0.2)"
              @click="removeNews(item.id)"
            >
              Xóa
            </button>
          </div>
        </motion.article>
      </div>

      <div class="hidden md:block surface overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr style="color: var(--text-3); border-bottom: 1px solid var(--line)">
                <th class="text-left p-4 font-semibold text-[11px] uppercase tracking-[0.08em]">Bài viết</th>
                <th class="text-left p-4 font-semibold text-[11px] uppercase tracking-[0.08em]">Danh mục</th>
                <th class="text-left p-4 font-semibold text-[11px] uppercase tracking-[0.08em]">Ngày</th>
                <th class="text-left p-4 font-semibold text-[11px] uppercase tracking-[0.08em]">Nổi bật</th>
                <th class="text-right p-4 font-semibold text-[11px] uppercase tracking-[0.08em]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="5" class="p-8 text-center" style="color: var(--text-3)">Đang tải...</td>
              </tr>
              <tr v-else-if="!articles.length">
                <td colspan="5" class="p-8 text-center" style="color: var(--text-3)">Chưa có bài viết.</td>
              </tr>
              <tr
                v-for="item in articles"
                :key="item.id"
                class="admin-row"
                style="border-bottom: 1px solid var(--line)"
              >
                <td class="p-4">
                  <div class="flex items-center gap-3 min-w-0">
                    <img
                      v-if="item.image"
                      :src="item.image"
                      alt=""
                      class="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div class="min-w-0">
                      <div class="font-semibold truncate max-w-[320px]">{{ item.title }}</div>
                      <div class="text-[12px] mt-0.5 truncate max-w-[320px]" style="color: var(--text-3)">
                        {{ item.excerpt }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="p-4" style="color: var(--text-2)">{{ item.category?.name || item.tag }}</td>
                <td class="p-4 mono" style="color: var(--text-2)">{{ formatNewsDate(item.date) }}</td>
                <td class="p-4">{{ item.featured ? 'Có' : '—' }}</td>
                <td class="p-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button type="button" class="btn-ghost text-[12px] py-2 px-3 rounded-xl font-semibold" @click="openEditNews(item)">
                      Sửa
                    </button>
                    <button
                      type="button"
                      class="btn-ghost text-[12px] py-2 px-3 rounded-xl font-semibold"
                      style="color: #ef4444"
                      @click="removeNews(item.id)"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="pagination.last_page > 1"
        class="flex items-center justify-center gap-3 mt-5"
      >
        <button
          type="button"
          class="btn-ghost rounded-xl px-4 py-2 text-[13px] font-semibold disabled:opacity-30"
          :disabled="pagination.current_page <= 1"
          @click="goToPage(pagination.current_page - 1)"
        >
          Trước
        </button>
        <span class="mono text-[12.5px]" style="color: var(--text-3)">
          Trang {{ pagination.current_page }} / {{ pagination.last_page }}
        </span>
        <button
          type="button"
          class="btn-ghost rounded-xl px-4 py-2 text-[13px] font-semibold disabled:opacity-30"
          :disabled="!pagination.has_more_pages"
          @click="goToPage(pagination.current_page + 1)"
        >
          Sau
        </button>
      </div>
    </div>

    <!-- Categories -->
    <div v-show="tab === 'categories'">
      <div class="md:hidden space-y-3">
        <div
          v-if="!categories.length"
          class="surface p-8 text-center text-sm"
          style="color: var(--text-3)"
        >
          Chưa có danh mục.
        </div>
        <motion.article
          v-for="(cat, i) in categories"
          :key="cat.id"
          class="surface p-4"
          :initial="{ opacity: 0, y: 10 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ delay: i * 0.04 }"
        >
          <div class="flex items-center gap-3 mb-3">
            <img
              v-if="cat.image"
              :src="cat.image"
              alt=""
              class="w-12 h-12 rounded-xl object-cover shrink-0"
            />
            <div class="font-semibold">{{ cat.name }}</div>
          </div>
          <div class="flex gap-2">
            <button type="button" class="btn-ghost flex-1 text-[12px] py-2.5 rounded-xl font-semibold" @click="openEditCat(cat)">
              Sửa
            </button>
            <button
              type="button"
              class="flex-1 text-[12px] py-2.5 rounded-xl font-semibold"
              style="background: rgba(239,68,68,0.08); color: #ef4444; border: 1px solid rgba(239,68,68,0.2)"
              @click="removeCat(cat.id)"
            >
              Xóa
            </button>
          </div>
        </motion.article>
      </div>

      <div class="hidden md:block surface overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr style="color: var(--text-3); border-bottom: 1px solid var(--line)">
              <th class="text-left p-4 font-semibold text-[11px] uppercase tracking-[0.08em]">Danh mục</th>
              <th class="text-right p-4 font-semibold text-[11px] uppercase tracking-[0.08em]">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!categories.length">
              <td colspan="2" class="p-8 text-center" style="color: var(--text-3)">Chưa có danh mục.</td>
            </tr>
            <tr
              v-for="cat in categories"
              :key="cat.id"
              class="admin-row"
              style="border-bottom: 1px solid var(--line)"
            >
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <img
                    v-if="cat.image"
                    :src="cat.image"
                    alt=""
                    class="w-10 h-10 rounded-lg object-cover"
                  />
                  <div class="font-semibold">{{ cat.name }}</div>
                </div>
              </td>
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button type="button" class="btn-ghost text-[12px] py-2 px-3 rounded-xl font-semibold" @click="openEditCat(cat)">
                    Sửa
                  </button>
                  <button
                    type="button"
                    class="btn-ghost text-[12px] py-2 px-3 rounded-xl font-semibold"
                    style="color: #ef4444"
                    @click="removeCat(cat.id)"
                  >
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AnimatePresence>
      <Modal v-if="showNewsModal" wide :title="editingNews ? 'Sửa bài viết' : 'Thêm bài viết'" @close="showNewsModal = false">
        <div class="space-y-4">
          <p v-if="formError" class="text-[13px]" style="color: #ef4444">{{ formError }}</p>
          <FormField v-model="newsForm.title" label="Tiêu đề" />
          <FormField v-model="newsForm.category_id" label="Danh mục" type="select" :options="categoryOptions" />
          <div class="grid grid-cols-2 gap-4">
            <FormField v-model="newsForm.tag" label="Thẻ" />
            <FormField v-model="newsForm.featured" label="Nổi bật" type="select" :options="featuredOptions" />
          </div>
          <FormField v-model="newsForm.excerpt" label="Tóm tắt" type="textarea" />
          <div class="grid grid-cols-2 gap-4">
            <FormField v-model="newsForm.date" label="Ngày đăng" type="date" />
            <FormField v-model="newsForm.read" label="Phút đọc" type="number" :min="0" />
          </div>
          <div class="space-y-1.5">
            <label class="block uppercase tracking-wider font-semibold" style="font-size: 11px; color: #64748b">
              Ảnh bìa
            </label>
            <div class="flex items-start gap-3">
              <img
                v-if="newsForm.image"
                :src="newsForm.image"
                alt=""
                class="w-16 h-16 rounded-xl object-cover shrink-0"
              />
              <div class="flex-1 space-y-2 min-w-0">
                <FormField v-model="newsForm.image" placeholder="URL ảnh hoặc tải lên" />
                <label class="btn-ghost inline-flex items-center rounded-xl px-3 py-2 text-[12px] font-semibold cursor-pointer">
                  {{ uploading ? 'Đang tải...' : 'Tải ảnh lên' }}
                  <input type="file" accept="image/*" class="hidden" :disabled="uploading" @change="uploadImage($event, 'news')" />
                </label>
              </div>
            </div>
          </div>
          <FormField v-model="newsForm.cover_caption" label="Chú thích ảnh" />
          <div class="space-y-1.5">
            <label class="block uppercase tracking-wider font-semibold" style="font-size: 11px; color: #64748b">
              Nội dung
            </label>
            <HtmlEditor v-model="newsForm.content" placeholder="Viết nội dung bài viết..." />
          </div>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="btn-primary flex-1 rounded-xl py-3 text-[14px] font-semibold disabled:opacity-40"
              :disabled="saving || uploading"
              @click="saveNews"
            >
              {{ saving ? 'Đang lưu...' : 'Lưu' }}
            </button>
            <button type="button" class="btn-ghost flex-1 rounded-xl py-3 text-[14px] font-semibold" @click="showNewsModal = false">
              Hủy
            </button>
          </div>
        </div>
      </Modal>
    </AnimatePresence>

    <AnimatePresence>
      <Modal v-if="showCatModal" :title="editingCat ? 'Sửa danh mục' : 'Thêm danh mục'" @close="showCatModal = false">
        <div class="space-y-4">
          <p v-if="formError" class="text-[13px]" style="color: #ef4444">{{ formError }}</p>
          <FormField v-model="catForm.name" label="Tên danh mục" />
          <div class="space-y-1.5">
            <label class="block uppercase tracking-wider font-semibold" style="font-size: 11px; color: #64748b">
              Ảnh danh mục
            </label>
            <div class="flex items-start gap-3">
              <img
                v-if="catForm.image"
                :src="catForm.image"
                alt=""
                class="w-16 h-16 rounded-xl object-cover shrink-0"
              />
              <div class="flex-1 space-y-2 min-w-0">
                <FormField v-model="catForm.image" placeholder="URL ảnh hoặc tải lên" />
                <label class="btn-ghost inline-flex items-center rounded-xl px-3 py-2 text-[12px] font-semibold cursor-pointer">
                  {{ uploading ? 'Đang tải...' : 'Tải ảnh lên' }}
                  <input type="file" accept="image/*" class="hidden" :disabled="uploading" @change="uploadImage($event, 'category')" />
                </label>
              </div>
            </div>
          </div>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="btn-primary flex-1 rounded-xl py-3 text-[14px] font-semibold disabled:opacity-40"
              :disabled="saving || uploading"
              @click="saveCat"
            >
              {{ saving ? 'Đang lưu...' : 'Lưu' }}
            </button>
            <button type="button" class="btn-ghost flex-1 rounded-xl py-3 text-[14px] font-semibold" @click="showCatModal = false">
              Hủy
            </button>
          </div>
        </div>
      </Modal>
    </AnimatePresence>
  </div>
</template>
