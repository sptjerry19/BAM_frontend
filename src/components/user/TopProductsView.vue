<script setup>
import { inject } from 'vue'
import { useRouter } from 'vue-router'
import { motion } from 'motion-v'
import Icon from '../common/Icon.vue'
import { formatCurrency } from '../../utils/labels'

const router = useRouter()
const openProductDetail = inject('openProductDetail', null)
const addToCart = inject('addToCart', null)

const TOP = [
  {
    rank: 1,
    id: 'p_demo_1',
    name: 'Yonex Astrox 88D Pro',
    brand: 'Yonex',
    category: 'Vợt',
    price: 3850000,
    sold: 1284,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&h=600&fit=crop',
  },
  {
    rank: 2,
    id: 'p_demo_2',
    name: 'Yonex Power Cushion 65Z3',
    brand: 'Yonex',
    category: 'Giày',
    price: 2890000,
    sold: 1102,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
  },
  {
    rank: 3,
    id: 'p_demo_3',
    name: 'Li-Ning Aeronaut 9000',
    brand: 'Li-Ning',
    category: 'Vợt',
    price: 3200000,
    sold: 956,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=600&h=600&fit=crop',
  },
  {
    rank: 4,
    id: 'p_demo_4',
    name: 'Victor Thruster K',
    brand: 'Victor',
    category: 'Vợt',
    price: 2750000,
    sold: 841,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&h=600&fit=crop',
  },
  {
    rank: 5,
    id: 'p_demo_5',
    name: 'AS-50 Tournament Cork',
    brand: 'Yonex',
    category: 'Cầu',
    price: 420000,
    sold: 790,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&h=600&fit=crop',
  },
  {
    rank: 6,
    id: 'p_demo_6',
    name: 'Pro Tour Bag 9R',
    brand: 'Victor',
    category: 'Túi',
    price: 1650000,
    sold: 712,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
  },
  {
    rank: 7,
    id: 'p_demo_7',
    name: 'BG80 Power String',
    brand: 'Yonex',
    category: 'Dây',
    price: 220000,
    sold: 688,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba6851?w=600&h=600&fit=crop',
  },
  {
    rank: 8,
    id: 'p_demo_8',
    name: 'Match Jersey Pro',
    brand: 'Li-Ning',
    category: 'Áo',
    price: 590000,
    sold: 640,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1521412644189-f30363aaf9ea?w=600&h=600&fit=crop',
  },
  {
    rank: 9,
    id: 'p_demo_9',
    name: 'AC102EX Overgrip',
    brand: 'Yonex',
    category: 'Grip',
    price: 85000,
    sold: 602,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=600&fit=crop',
  },
  {
    rank: 10,
    id: 'p_demo_10',
    name: 'Kawasaki Sky Flash',
    brand: 'Kawasaki',
    category: 'Giày',
    price: 1690000,
    sold: 558,
    rating: 4.3,
    image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=600&fit=crop',
  },
]

function onOpen(p) {
  if (openProductDetail) openProductDetail(p)
  else router.push({ name: 'shop' })
}

function onAdd(p) {
  if (addToCart) addToCart(p.id)
}
</script>

<template>
  <div>
    <header class="max-w-3xl">
      <p class="eyebrow">Bán chạy</p>
      <h1 class="page-title mt-2">Top 10 sản phẩm</h1>
      <p class="lede mt-3">
        Những món được đặt nhiều nhất trong 30 ngày qua tại JBadminton.
      </p>
    </header>

    <ol class="mt-10 space-y-3">
      <motion.li
        v-for="(p, i) in TOP"
        :key="p.id"
        class="surface p-3 sm:p-4 flex items-center gap-3 sm:gap-5"
        :initial="{ opacity: 0, y: 14 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: Math.min(i, 9) * 0.04 }"
      >
        <span
          class="mono w-8 sm:w-10 shrink-0 text-center font-bold text-[18px] sm:text-[22px]"
          :style="{ color: p.rank <= 3 ? 'var(--accent)' : 'var(--text-3)' }"
        >
          {{ String(p.rank).padStart(2, '0') }}
        </span>

        <button
          type="button"
          class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 product-img-bg"
          :aria-label="`Xem ${p.name}`"
          @click="onOpen(p)"
        >
          <img :src="p.image" :alt="p.name" class="w-full h-full object-cover" loading="lazy" />
        </button>

        <div class="min-w-0 flex-1">
          <p class="text-[10.5px] uppercase tracking-[0.1em]" style="color: var(--text-3)">
            {{ p.brand }} · {{ p.category }}
          </p>
          <button
            type="button"
            class="font-semibold text-[14px] sm:text-[15px] leading-snug mt-0.5 text-left line-clamp-2 hover:underline underline-offset-2"
            @click="onOpen(p)"
          >
            {{ p.name }}
          </button>
          <p class="mono text-[12.5px] mt-1.5" style="color: var(--text-3)">
            {{ p.sold.toLocaleString('vi-VN') }} đã bán · ★ {{ p.rating }}
          </p>
        </div>

        <div class="shrink-0 text-right flex flex-col items-end gap-2">
          <p class="mono text-[14px] sm:text-[16px] font-medium" style="color: var(--accent)">
            {{ formatCurrency(p.price) }}
          </p>
          <button
            type="button"
            class="icon-btn w-9 h-9"
            :aria-label="`Thêm ${p.name} vào giỏ`"
            @click="onAdd(p)"
          >
            <Icon name="bag" :size="16" />
          </button>
        </div>
      </motion.li>
    </ol>

    <div class="mt-10 text-center">
      <button
        type="button"
        class="btn-primary px-7 py-3.5 rounded-2xl text-[15px]"
        @click="router.push({ name: 'shop' })"
      >
        Xem toàn bộ cửa hàng
      </button>
    </div>
  </div>
</template>
