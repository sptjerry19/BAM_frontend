<script setup>
import { ref, watch } from 'vue'
import { social, socialError } from '../../../api/social'
import { categoryLabels, formatCurrency } from '../../../utils/labels'
const props = defineProps({ profile: Object, preview: Boolean })
const emit = defineEmits(['open'])
const items = ref([]),
  category = ref(''),
  loading = ref(false),
  error = ref(''),
  page = ref(1),
  more = ref(false),
  selected = ref(null)
let generation = 0
async function load(reset = true) {
  const version = ++generation
  if (reset) {
    items.value = []
    page.value = 1
  }
  if (!props.profile.can_view_equipment) return
  loading.value = true
  error.value = ''
  try {
    const data = await social.get(
      props.profile.id
        ? `/profiles/${props.profile.id}/equipment`
        : `/member-profiles/${props.profile.member_id}/equipment`,
      {
        category: category.value || undefined,
        page: page.value,
        per_page: props.preview ? 4 : 12,
      },
    )
    if (version !== generation) return
    items.value.push(...data.data)
    more.value = data.has_more
  } catch (e) {
    if (version === generation) error.value = socialError(e)
  } finally {
    if (version === generation) loading.value = false
  }
}
watch(
  () => [
    props.profile.id,
    props.profile.member_id,
    props.profile.can_view_equipment,
    category.value,
  ],
  () => load(),
  { immediate: true },
)
</script>
<template>
  <section class="surface p-5">
    <header class="flex items-center justify-between gap-3 mb-4">
      <h2 class="font-heading font-bold text-xl">Trang bị</h2>
      <button v-if="preview" class="btn-text text-sm" @click="emit('open')">
        Xem tất cả
      </button>
      <RouterLink
        v-else-if="profile.is_owner"
        to="/equipment"
        class="btn-ghost px-3 py-2 rounded-xl text-sm"
        >Quản lý trang bị</RouterLink
      >
    </header>
    <p v-if="!profile.can_view_equipment" class="text-sm text-[var(--text-3)]">
      Danh sách trang bị được đặt riêng tư.
    </p>
    <template v-else>
      <label v-if="!preview" class="block mb-4 text-sm"
        >Loại trang bị
        <select v-model="category" class="social-input mt-2">
          <option value="">Tất cả</option>
          <option
            v-for="(label, key) in categoryLabels"
            :key="key"
            :value="key"
          >
            {{ label }}
          </option>
        </select>
      </label>
      <p v-if="error" role="alert" class="text-red-400 text-sm">
        {{ error }} <button class="underline" @click="load()">Thử lại</button>
      </p>
      <div
        class="grid gap-3"
        :class="preview ? 'grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'"
      >
        <article
          v-for="item in items"
          :key="`${item.source}-${item.id}`"
          class="rounded-xl overflow-hidden bg-[var(--bg-2)]"
        >
          <button class="w-full text-left" @click="selected = item">
            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.name"
              class="aspect-square w-full object-contain p-3"
              loading="lazy"
            />
            <div
              v-else
              class="aspect-square grid place-items-center text-[var(--text-3)] text-sm"
            >
              Chưa có ảnh
            </div>
            <div class="p-3">
              <p class="text-xs text-[var(--text-3)]">
                {{ item.brand || categoryLabels[item.category] }}
              </p>
              <h3 class="font-semibold mt-1 text-sm">{{ item.name }}</h3>
              <p class="text-xs text-[var(--text-3)] mt-2">
                {{
                  item.source === 'store' ? 'Từ cửa hàng' : 'Trang bị cá nhân'
                }}
              </p>
            </div>
          </button>
        </article>
      </div>
      <p v-if="loading" class="py-5 text-sm" aria-live="polite">
        Đang tải trang bị…
      </p>
      <p
        v-else-if="!items.length && !error"
        class="py-5 text-sm text-[var(--text-3)]"
      >
        Chưa có trang bị nào.
      </p>
      <button
        v-if="more && !preview"
        :disabled="loading"
        class="btn-ghost px-4 py-2 rounded-xl mt-4"
        @click="
          ($event) => {
            page++
            load(false)
          }
        "
      >
        Xem thêm
      </button>
    </template>
    <div
      v-if="selected"
      class="social-overlay"
      @click.self="selected = null"
      @keydown.esc="selected = null"
    >
      <section
        class="social-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Chi tiết trang bị"
        tabindex="-1"
      >
        <button
          class="btn-ghost float-right px-3 py-2 rounded-lg"
          autofocus
          @click="selected = null"
        >
          Đóng
        </button>
        <h3 class="text-xl font-bold pr-20">{{ selected.name }}</h3>
        <p class="mt-3">
          {{ selected.brand }} · {{ categoryLabels[selected.category] }}
        </p>
        <img
          v-if="selected.image"
          :src="selected.image"
          :alt="selected.name"
          class="w-full max-h-80 object-contain my-4"
        />
        <template v-if="profile.is_owner"
          ><p v-if="selected.price != null">
            Giá mua: {{ formatCurrency(selected.price) }}
          </p>
          <p class="whitespace-pre-wrap">{{ selected.notes }}</p></template
        >
        <RouterLink
          v-if="selected.product_id"
          :to="`/shop/${selected.product_id}`"
          class="btn-primary inline-block px-4 py-2 rounded-xl mt-4"
          >Xem sản phẩm</RouterLink
        >
      </section>
    </div>
  </section>
</template>
