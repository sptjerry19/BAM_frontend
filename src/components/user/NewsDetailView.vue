<script setup>
/**
 * News article detail — editorial UI only (mock data).
 */
import { computed, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { motion } from 'motion-v'
import Icon from '../common/Icon.vue'
import { getNewsById, getRelatedNews } from '../../data/news'

const route = useRoute()
const router = useRouter()

const article = computed(() => getNewsById(route.params.id))
const related = computed(() => (article.value ? getRelatedNews(article.value.id, 3) : []))

watch(
  article,
  (a) => {
    document.title = a?.title ? `${a.title} — JBadminton` : 'Tin tức — JBadminton'
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="!article" class="shell py-16 text-center">
    <p class="eyebrow">Tin tức</p>
    <h1 class="page-title mt-2">Không tìm thấy bài viết</h1>
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
    <!-- Hero -->
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
          {{ article.tag }} · {{ article.date }} · {{ article.read }} đọc
        </p>

        <motion.h1
          class="font-heading font-extrabold mt-4 max-w-[18ch] text-[clamp(32px,6.2vw,64px)] leading-[1.02] tracking-tight text-balance"
          :initial="{ opacity: 0, y: 18 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }"
        >
          {{ article.title }}
        </motion.h1>

        <p class="mt-5 max-w-xl text-[15px] sm:text-[16.5px] leading-relaxed opacity-90">
          {{ article.excerpt }}
        </p>

        <div class="mt-8 flex items-center gap-3">
          <img
            :src="article.author.avatar"
            :alt="article.author.name"
            class="w-11 h-11 rounded-full object-cover"
            style="border: 2px solid rgba(255,255,255,0.35)"
          />
          <div>
            <div class="text-[14px] font-semibold leading-tight">{{ article.author.name }}</div>
            <div class="text-[12px] opacity-75 mt-0.5">{{ article.author.role }}</div>
          </div>
        </div>
      </div>
    </header>

    <div class="shell">
      <p
        v-if="article.coverCaption"
        class="mt-3 text-[12px]"
        style="color: var(--text-3)"
      >
        {{ article.coverCaption }}
      </p>

      <!-- Body + aside -->
      <div class="mt-10 lg:mt-14 grid gap-12 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-16 items-start">
        <div class="news-prose">
          <template v-for="(block, i) in article.body" :key="i">
            <p v-if="block.type === 'p'" class="news-p">{{ block.text }}</p>

            <h2 v-else-if="block.type === 'h2'" class="news-h2">{{ block.text }}</h2>

            <figure v-else-if="block.type === 'quote'" class="news-quote">
              <blockquote>{{ block.text }}</blockquote>
              <figcaption v-if="block.cite">— {{ block.cite }}</figcaption>
            </figure>

            <figure v-else-if="block.type === 'image'" class="news-figure">
              <img :src="block.src" :alt="block.alt || ''" loading="lazy" />
              <figcaption v-if="block.caption">{{ block.caption }}</figcaption>
            </figure>
          </template>

          <div
            class="mt-12 pt-8 flex flex-wrap items-center justify-between gap-4"
            style="border-top: 1px solid var(--line)"
          >
            <div class="flex flex-wrap gap-2">
              <span class="chip text-[12px] py-1.5 px-3">{{ article.tag }}</span>
              <span class="chip text-[12px] py-1.5 px-3">{{ article.date }}</span>
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
                v-for="(block, i) in article.body.filter((b) => b.type === 'h2')"
                :key="i"
                class="text-[13.5px] leading-snug"
                style="color: var(--text-2)"
              >
                {{ block.text }}
              </li>
              <li
                v-if="article.body.filter((b) => b.type === 'h2').length === 0"
                class="text-[13.5px]"
                style="color: var(--text-3)"
              >
                Bài viết ngắn — đọc hết trong {{ article.read }}.
              </li>
            </ul>
          </div>

          <div style="border-top: 1px solid var(--line)" class="pt-6">
            <p class="text-[11px] uppercase tracking-[0.14em]" style="color: var(--text-3)">
              Tác giả
            </p>
            <div class="flex items-center gap-3 mt-3">
              <img
                :src="article.author.avatar"
                :alt="article.author.name"
                class="w-12 h-12 rounded-full object-cover"
              />
              <div class="min-w-0">
                <div class="font-semibold text-[14px]">{{ article.author.name }}</div>
                <div class="text-[12px] mt-0.5" style="color: var(--text-3)">
                  {{ article.author.role }}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <!-- Related -->
      <section class="mt-16 sm:mt-20" aria-labelledby="related-news">
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
                {{ item.tag }} · {{ item.date }}
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
.news-p {
  margin-top: 1.25rem;
  font-size: 16.5px;
  line-height: 1.75;
  color: var(--text-2);
  text-wrap: pretty;
}

.news-p:first-child {
  margin-top: 0;
}

.news-h2 {
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

.news-quote {
  margin: 2rem 0;
  padding: 1.25rem 0 1.25rem 1.25rem;
  border-left: 3px solid var(--accent);
}

.news-quote blockquote {
  font-family: var(--font-heading, inherit);
  font-weight: 600;
  font-size: clamp(18px, 2.2vw, 22px);
  line-height: 1.35;
  letter-spacing: -0.015em;
  color: var(--text);
}

.news-quote figcaption {
  margin-top: 0.75rem;
  font-size: 12.5px;
  color: var(--text-3);
}

.news-figure {
  margin: 2rem 0;
}

.news-figure img {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border-radius: var(--r-md);
}

.news-figure figcaption {
  margin-top: 0.65rem;
  font-size: 12.5px;
  color: var(--text-3);
}
</style>
