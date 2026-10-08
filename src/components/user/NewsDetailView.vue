<script setup>
/**
 * News article detail — data from /api/news/:id
 */
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { motion } from 'motion-v'
import Icon from '../common/Icon.vue'
import { getNewsItem, getNewsList } from '../../api'
import {
  formatNewsDate,
  formatReadTime,
  articleHtml,
  articleHeadings,
  articleTag,
  articleAuthor,
} from '../../data/news'

const route = useRoute()
const router = useRouter()

const article = ref(null)
const related = ref([])
const loading = ref(true)
const loadError = ref('')

const html = computed(() => articleHtml(article.value))
const headings = computed(() => articleHeadings(html.value))
const author = computed(() => articleAuthor(article.value))
const metaLine = computed(() => {
  if (!article.value) return ''
  return [
    articleTag(article.value),
    formatNewsDate(article.value.date),
    formatReadTime(article.value.read) ? `${formatReadTime(article.value.read)} đọc` : '',
  ]
    .filter(Boolean)
    .join(' · ')
})

async function loadRelated(item) {
  try {
    const params = { per_page: 6 }
    if (item.category_id) params.category_id = item.category_id
    const res = await getNewsList(params)
    related.value = res.data.filter((n) => String(n.id) !== String(item.id)).slice(0, 3)
  } catch {
    related.value = []
  }
}

async function loadArticle(id) {
  loading.value = true
  loadError.value = ''
  article.value = null
  related.value = []
  try {
    const data = await getNewsItem(id)
    article.value = data
    document.title = data?.title ? `${data.title} — JBadminton` : 'Tin tức — JBadminton'
    await loadRelated(data)
  } catch {
    article.value = null
    loadError.value = 'Không tìm thấy bài viết'
    document.title = 'Tin tức — JBadminton'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.id,
  (id) => {
    if (id) loadArticle(id)
  },
)

onMounted(() => {
  if (route.params.id) loadArticle(route.params.id)
})
</script>

<template>
  <div v-if="loading" class="pb-16">
    <div class="skeleton min-h-[52vw] sm:min-h-[420px] md:min-h-[520px]" />
    <div class="shell mt-10 max-w-[68ch] space-y-4">
      <div class="skeleton h-4 w-1/4" />
      <div class="skeleton h-8 w-3/4" />
      <div class="skeleton h-24 w-full" />
      <div class="skeleton h-24 w-full" />
    </div>
  </div>

  <div v-else-if="!article" class="shell py-16 text-center">
    <p class="eyebrow">Tin tức</p>
    <h1 class="page-title mt-2">{{ loadError || 'Không tìm thấy bài viết' }}</h1>
    <p class="lede mt-3 mx-auto">Bài có thể đã gỡ hoặc đường dẫn không còn đúng.</p>
    <button
      type="button"
      class="btn-primary mt-8 px-6 py-3 rounded-2xl text-[14px]"
      @click="router.push({ name: 'news' })"
    >
      Về danh sách tin
    </button>
  </div>

  <article v-else class="pb-16">
    <header class="relative overflow-hidden min-h-[52vw] sm:min-h-[420px] md:min-h-[520px] flex items-end">
      <img
        :src="article.image"
        :alt="article.title"
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div
        class="absolute inset-0"
        style="background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.72) 100%)"
      />

      <div class="shell relative z-10 w-full pb-10 pt-24 sm:pb-14 sm:pt-28 text-white">
        <RouterLink
          :to="{ name: 'news' }"
          class="inline-flex items-center gap-2 text-[13px] font-semibold opacity-85 hover:opacity-100 transition-opacity"
        >
          <span class="inline-flex rotate-180" aria-hidden="true">
            <Icon name="arrowRight" :size="16" />
          </span>
          Tin tức
        </RouterLink>

        <p class="mt-6 text-[11px] uppercase tracking-[0.16em] opacity-80">
          {{ metaLine }}
        </p>

        <motion.h1
          class="font-heading font-extrabold mt-4 max-w-[18ch] text-[clamp(32px,6.2vw,64px)] leading-[1.02] tracking-tight text-balance"
          :initial="{ opacity: 0, y: 18 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }"
        >
          {{ article.title }}
        </motion.h1>

        <p v-if="article.excerpt" class="mt-5 max-w-xl text-[15px] sm:text-[16.5px] leading-relaxed opacity-90">
          {{ article.excerpt }}
        </p>

        <div v-if="author" class="mt-8 flex items-center gap-3">
          <img
            v-if="author.avatar"
            :src="author.avatar"
            :alt="author.name"
            class="w-11 h-11 rounded-full object-cover"
            style="border: 2px solid rgba(255,255,255,0.35)"
          />
          <span
            v-else
            class="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-semibold"
            style="background: rgba(255,255,255,0.18); border: 2px solid rgba(255,255,255,0.35)"
          >
            {{ author.name.slice(0, 1) }}
          </span>
          <div>
            <div class="text-[14px] font-semibold leading-tight">{{ author.name }}</div>
            <div class="text-[12px] opacity-75 mt-0.5">{{ author.role }}</div>
          </div>
        </div>
      </div>
    </header>

    <div class="shell">
      <p
        v-if="article.cover_caption"
        class="mt-3 text-[12px]"
        style="color: var(--text-3)"
      >
        {{ article.cover_caption }}
      </p>

      <div class="mt-10 lg:mt-14 grid gap-12 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-16 items-start">
        <div>
          <div class="news-prose max-w-[100ch]" v-html="html" />

          <div
            class="mt-12 pt-8 flex flex-wrap items-center justify-between gap-4"
            style="border-top: 1px solid var(--line)"
          >
            <div class="flex flex-wrap gap-2">
              <span v-if="articleTag(article)" class="chip text-[12px] py-1.5 px-3">
                {{ articleTag(article) }}
              </span>
              <span v-if="article.date" class="chip text-[12px] py-1.5 px-3">
                {{ formatNewsDate(article.date) }}
              </span>
            </div>
            <button type="button" class="btn-text text-[13px]" disabled title="Sắp có">
              Chia sẻ bài viết
              <Icon name="arrowRight" :size="16" />
            </button>
          </div>
        </div>

        <aside class="lg:sticky lg:top-28 space-y-8">
          <div>
            <p class="text-[11px] uppercase tracking-[0.14em]" style="color: var(--text-3)">
              Trong bài này
            </p>
            <ul class="mt-3 space-y-2.5">
              <li
                v-for="(heading, i) in headings"
                :key="i"
                class="text-[13.5px] leading-snug"
                style="color: var(--text-2)"
              >
                {{ heading }}
              </li>
              <li
                v-if="headings.length === 0"
                class="text-[13.5px]"
                style="color: var(--text-3)"
              >
                {{ formatReadTime(article.read) ? `Bài viết ngắn — đọc hết trong ${formatReadTime(article.read)}.` : 'Đọc toàn bài bên trái.' }}
              </li>
            </ul>
          </div>

          <div v-if="author" style="border-top: 1px solid var(--line)" class="pt-6">
            <p class="text-[11px] uppercase tracking-[0.14em]" style="color: var(--text-3)">
              Tác giả
            </p>
            <div class="flex items-center gap-3 mt-3">
              <img
                v-if="author.avatar"
                :src="author.avatar"
                :alt="author.name"
                class="w-12 h-12 rounded-full object-cover"
              />
              <span
                v-else
                class="w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-semibold shrink-0"
                style="background: var(--bg-2); border: 1px solid var(--line)"
              >
                {{ author.name.slice(0, 1) }}
              </span>
              <div class="min-w-0">
                <div class="font-semibold text-[14px]">{{ author.name }}</div>
                <div class="text-[12px] mt-0.5" style="color: var(--text-3)">
                  {{ author.role }}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <section v-if="related.length" class="mt-16 sm:mt-20" aria-labelledby="related-news">
        <div class="flex items-end justify-between gap-4 mb-6">
          <div>
            <p class="eyebrow">Tiếp theo</p>
            <h2 id="related-news" class="section-head mt-1">Bài liên quan</h2>
          </div>
          <RouterLink :to="{ name: 'news' }" class="btn-text text-[13px] shrink-0">
            Tất cả tin
            <Icon name="arrowRight" :size="16" />
          </RouterLink>
        </div>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <RouterLink
            v-for="(item, i) in related"
            :key="item.id"
            :to="{ name: 'news-detail', params: { id: item.id } }"
            class="group block"
          >
            <motion.div
              :initial="{ opacity: 0, y: 14 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ delay: i * 0.06, duration: 0.4 }"
            >
              <div class="overflow-hidden aspect-[16/10]" style="border-radius: var(--r-md)">
                <img
                  :src="item.image"
                  :alt="item.title"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  loading="lazy"
                />
              </div>
              <p class="mt-3.5 text-[11px] uppercase tracking-[0.12em]" style="color: var(--text-3)">
                {{ articleTag(item) }}
                <template v-if="item.date"> · {{ formatNewsDate(item.date) }}</template>
              </p>
              <h3
                class="font-heading font-bold text-[17px] leading-snug mt-1.5 group-hover:underline underline-offset-4"
              >
                {{ item.title }}
              </h3>
            </motion.div>
          </RouterLink>
        </div>
      </section>
    </div>
  </article>
</template>

<style scoped>
.news-prose :deep(p) {
  margin-top: 1.25rem;
  font-size: 16.5px;
  line-height: 1.75;
  color: var(--text-2);
  text-wrap: pretty;
}

.news-prose :deep(p:first-child) {
  margin-top: 0;
}

.news-prose :deep(h2) {
  margin-top: 2.25rem;
  margin-bottom: 0.35rem;
  font-family: var(--font-heading, inherit);
  font-weight: 700;
  font-size: clamp(22px, 2.4vw, 28px);
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--text);
  text-wrap: balance;
}

.news-prose :deep(blockquote) {
  margin: 2rem 0;
  padding: 1.25rem 0 1.25rem 1.25rem;
  border-left: 3px solid var(--accent);
  font-family: var(--font-heading, inherit);
  font-weight: 600;
  font-size: clamp(18px, 2.2vw, 22px);
  line-height: 1.35;
  letter-spacing: -0.015em;
  color: var(--text);
}

.news-prose :deep(blockquote p) {
  margin: 0;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
}

.news-prose :deep(ul),
.news-prose :deep(ol) {
  margin: 1.25rem 0;
  padding-left: 1.2rem;
  color: var(--text-2);
  font-size: 16.5px;
  line-height: 1.75;
}

.news-prose :deep(li) {
  margin-top: 0.4rem;
}

.news-prose :deep(img) {
  width: 100%;
  margin: 2rem 0;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border-radius: var(--r-md);
}

.news-prose :deep(strong) {
  color: var(--text);
  font-weight: 600;
}
</style>
