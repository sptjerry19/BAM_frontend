<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { motion } from 'motion-v'
import { NEWS, NEWS_FILTERS } from '../../data/news'

const filter = ref('all')

const featured = computed(() => NEWS.find((n) => n.featured) || NEWS[0])

const list = computed(() =>
  NEWS.filter((n) => !n.featured).filter((n) => filter.value === 'all' || n.category === filter.value),
)
</script>

<template>
  <div>
    <header class="max-w-3xl">
      <p class="eyebrow">Cộng đồng</p>
      <h1 class="page-title mt-2">Tin tức</h1>
      <p class="lede mt-3">Giải đấu, lịch CLB và cập nhật trang bị — mọi thứ bạn cần trước khi xuống sân.</p>
    </header>

    <div class="flex flex-wrap gap-2 mt-8" role="tablist" aria-label="Lọc tin">
      <button
        v-for="f in NEWS_FILTERS"
        :key="f.id"
        type="button"
        role="tab"
        class="px-4 py-2 rounded-full text-[13px] font-semibold transition-colors"
        :aria-selected="filter === f.id"
        :style="{
          background: filter === f.id ? 'var(--text)' : 'transparent',
          color: filter === f.id ? 'var(--bg)' : 'var(--text-2)',
          border: `1px solid ${filter === f.id ? 'var(--text)' : 'var(--line)'}`,
        }"
        @click="filter = f.id"
      >
        {{ f.label }}
      </button>
    </div>

    <motion.article
      v-if="filter === 'all' || featured.category === filter"
      class="mt-10 relative overflow-hidden min-h-[320px] sm:min-h-[420px] flex items-end"
      style="border-radius: var(--r-lg)"
      :initial="{ opacity: 0, y: 18 }"
      :animate="{ opacity: 1, y: 0 }"
    >
      <RouterLink
        :to="{ name: 'news-detail', params: { id: featured.id } }"
        class="absolute inset-0 z-[1]"
        :aria-label="`Đọc bài: ${featured.title}`"
      />
      <img
        :src="featured.image"
        :alt="featured.title"
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div
        class="absolute inset-0"
        style="background: linear-gradient(180deg, transparent 20%, rgba(0,0,0,0.78) 100%)"
      />
      <div class="relative z-10 p-6 sm:p-10 max-w-2xl text-white pointer-events-none">
        <p class="text-[11px] uppercase tracking-[0.14em] opacity-80">{{ featured.tag }} · {{ featured.date }}</p>
        <h2 class="font-heading font-bold text-[28px] sm:text-[40px] leading-[1.05] mt-3">
          {{ featured.title }}
        </h2>
        <p class="mt-3 text-[15px] leading-relaxed opacity-90 max-w-xl">{{ featured.excerpt }}</p>
        <span class="btn-primary mt-6 px-6 py-3 rounded-full text-[14px] inline-flex pointer-events-none">
          Đọc bài
        </span>
      </div>
    </motion.article>

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
      <RouterLink
        v-for="(item, i) in list"
        :key="item.id"
        :to="{ name: 'news-detail', params: { id: item.id } }"
        class="group block"
      >
        <motion.article
          :initial="{ opacity: 0, y: 16 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ delay: Math.min(i, 6) * 0.05 }"
        >
          <div class="overflow-hidden aspect-[16/10]" style="border-radius: var(--r-md)">
            <img
              :src="item.image"
              :alt="item.title"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy"
            />
          </div>
          <p class="mt-4 text-[11px] uppercase tracking-[0.12em]" style="color: var(--text-3)">
            {{ item.tag }} · {{ item.date }} · {{ item.read }}
          </p>
          <h3 class="font-heading font-bold text-[18px] leading-snug mt-2 group-hover:underline underline-offset-4">
            {{ item.title }}
          </h3>
          <p class="mt-2 text-[14px] leading-relaxed line-clamp-2" style="color: var(--text-2)">
            {{ item.excerpt }}
          </p>
        </motion.article>
      </RouterLink>
    </div>

    <p v-if="list.length === 0" class="mt-16 text-center" style="color: var(--text-3)">
      Chưa có bài trong mục này.
    </p>
  </div>
</template>
