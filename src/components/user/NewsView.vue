<script setup>
import { ref, computed } from 'vue'
import { motion } from 'motion-v'

const FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'tournament', label: 'Giải đấu' },
  { id: 'club', label: 'Câu lạc bộ' },
  { id: 'gear', label: 'Trang bị' },
]

const NEWS = [
  {
    id: 'n1',
    category: 'tournament',
    tag: 'Giải đấu',
    title: 'JBadminton Open 2026 mở đăng ký từ tuần này',
    excerpt: 'Hơn 200 suất cho hạng phong trào và bán chuyên. Đăng ký sớm giữ suất sân trung tâm Cầu Giấy.',
    date: '14.08.2026',
    read: '4 phút',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&h=800&fit=crop',
    featured: true,
  },
  {
    id: 'n2',
    category: 'club',
    tag: 'CLB',
    title: 'Lịch tối thứ Ba: sparring cấp độ trung cấp',
    excerpt: 'Nhóm 12 người, ưu tiên thành viên Gold. Mang vợt của bạn hoặc mượn tại quầy.',
    date: '12.08.2026',
    read: '2 phút',
    image: 'https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=800&h=600&fit=crop',
  },
  {
    id: 'n3',
    category: 'gear',
    tag: 'Trang bị',
    title: 'Astrox thế hệ mới đã có tại cửa hàng',
    excerpt: 'Ba màu khung, cân nặng 3U/4U. Đặt thử vợt 15 phút miễn phí khi mua kèm căng vợt.',
    date: '10.08.2026',
    read: '3 phút',
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=600&fit=crop',
  },
  {
    id: 'n4',
    category: 'tournament',
    tag: 'Giải đấu',
    title: 'Kết quả vòng loại miền Bắc — điểm nổi bật',
    excerpt: 'Đôi nam nữ U35 lập kỷ lục điểm số nội bộ. Xem lại highlight trên trang xếp hạng.',
    date: '08.08.2026',
    read: '5 phút',
    image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&h=600&fit=crop',
  },
  {
    id: 'n5',
    category: 'club',
    tag: 'CLB',
    title: 'Workshop kỹ thuật smash cho người mới',
    excerpt: 'Coach Linh hướng dẫn tư thế và nhịp chân. Suất tối thứ Sáu còn 6 chỗ.',
    date: '05.08.2026',
    read: '3 phút',
    image: 'https://images.unsplash.com/photo-1521412644189-f30363aaf9ea?w=800&h=600&fit=crop',
  },
  {
    id: 'n6',
    category: 'gear',
    tag: 'Trang bị',
    title: 'Cách chọn giày sân trong nhà mùa ẩm',
    excerpt: 'Đế non-marking, độ ôm gót và lưới thoáng — checklist nhanh trước khi xuống sân.',
    date: '01.08.2026',
    read: '4 phút',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop',
  },
]

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
        v-for="f in FILTERS"
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
      <img
        :src="featured.image"
        :alt="featured.title"
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div
        class="absolute inset-0"
        style="background: linear-gradient(180deg, transparent 20%, rgba(0,0,0,0.78) 100%)"
      />
      <div class="relative z-10 p-6 sm:p-10 max-w-2xl text-white">
        <p class="text-[11px] uppercase tracking-[0.14em] opacity-80">{{ featured.tag }} · {{ featured.date }}</p>
        <h2 class="font-heading font-bold text-[28px] sm:text-[40px] leading-[1.05] mt-3">
          {{ featured.title }}
        </h2>
        <p class="mt-3 text-[15px] leading-relaxed opacity-90 max-w-xl">{{ featured.excerpt }}</p>
        <button type="button" class="btn-primary mt-6 px-6 py-3 rounded-full text-[14px]">
          Đọc bài
        </button>
      </div>
    </motion.article>

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
      <motion.article
        v-for="(item, i) in list"
        :key="item.id"
        class="group cursor-pointer"
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
    </div>

    <p v-if="list.length === 0" class="mt-16 text-center" style="color: var(--text-3)">
      Chưa có bài trong mục này.
    </p>
  </div>
</template>
