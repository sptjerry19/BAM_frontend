<script setup>
import { reactive, inject, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { motion } from 'motion-v'
import Icon from '../common/Icon.vue'
import { emptyCheckout, readCheckout, writeCheckout } from '../../composables/useCheckout'

const user = inject('user')
const cart = inject('cart')
const router = useRouter()

const form = reactive(emptyCheckout())
const errors = reactive({
  name: '',
  phone: '',
  email: '',
  address: '',
})

const hasCart = computed(() => (cart.value?.length ?? 0) > 0)

onMounted(() => {
  if (!hasCart.value) {
    router.replace({ name: 'cart' })
    return
  }

  const saved = readCheckout()
  Object.assign(form, saved)

  if (user.value) {
    if (!form.name) form.name = user.value.name || ''
    if (!form.phone) form.phone = user.value.phone || ''
    if (!form.email) form.email = user.value.email || ''
    if (!form.address) form.address = user.value.address || ''
  }
})

function validate() {
  errors.name = form.name.trim() ? '' : 'Vui lòng nhập họ tên.'
  errors.phone = /^0\d{8,10}$/.test(form.phone.trim().replace(/\s/g, ''))
    ? ''
    : 'Số điện thoại không hợp lệ.'
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ? ''
    : 'Email không hợp lệ.'
  errors.address = form.address.trim().length >= 8
    ? ''
    : 'Vui lòng nhập địa chỉ giao hàng đầy đủ.'
  return !Object.values(errors).some(Boolean)
}

function continueToConfirm() {
  if (!validate()) return
  writeCheckout({
    name: form.name.trim(),
    phone: form.phone.trim().replace(/\s/g, ''),
    email: form.email.trim(),
    address: form.address.trim(),
    note: form.note.trim(),
    payment_method: form.payment_method || 'cod',
  })
  router.push({ name: 'checkout-confirm' })
}
</script>

<template>
  <div class="mx-auto">
    <button
      type="button"
      class="btn-text inline-flex items-center gap-1.5 mb-6"
      @click="router.push({ name: 'cart' })"
    >
      <Icon name="arrowLeft" :size="16" />
      Giỏ hàng
    </button>

    <p class="eyebrow ml-5">Bước 1 / 2</p>
    <h1 class="page-title mt-2">Thông tin giao hàng</h1>
    <p class="lede mt-3">
      {{ user ? 'Chúng tôi đã điền sẵn thông tin tài khoản — bạn có thể chỉnh trước khi tiếp tục.' : 'Không cần đăng nhập. Điền thông tin để nhận hàng.' }}
    </p>

    <motion.form
      class="surface p-6 sm:p-8 mt-8 space-y-5"
      :initial="{ opacity: 0, y: 16 }"
      :animate="{ opacity: 1, y: 0 }"
      @submit.prevent="continueToConfirm"
    >
      <div>
        <label class="block text-[12px] uppercase tracking-[0.08em] mb-2" style="color: var(--text-3)" for="co-name">
          Họ và tên
        </label>
        <input
          id="co-name"
          v-model="form.name"
          type="text"
          autocomplete="name"
          class="input-field w-full px-3.5 py-3 rounded-xl text-[14px]"
          placeholder="Nguyễn Văn A"
        />
        <p v-if="errors.name" class="mt-1.5 text-[13px]" style="color: #f87171">{{ errors.name }}</p>
      </div>

      <div class="grid sm:grid-cols-2 gap-5">
        <div>
          <label class="block text-[12px] uppercase tracking-[0.08em] mb-2" style="color: var(--text-3)" for="co-phone">
            Số điện thoại
          </label>
          <input
            id="co-phone"
            v-model="form.phone"
            type="tel"
            autocomplete="tel"
            class="input-field w-full px-3.5 py-3 rounded-xl text-[14px]"
            placeholder="09xxxxxxxx"
          />
          <p v-if="errors.phone" class="mt-1.5 text-[13px]" style="color: #f87171">{{ errors.phone }}</p>
        </div>
        <div>
          <label class="block text-[12px] uppercase tracking-[0.08em] mb-2" style="color: var(--text-3)" for="co-email">
            Email
          </label>
          <input
            id="co-email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            class="input-field w-full px-3.5 py-3 rounded-xl text-[14px]"
            placeholder="ban@email.com"
          />
          <p v-if="errors.email" class="mt-1.5 text-[13px]" style="color: #f87171">{{ errors.email }}</p>
        </div>
      </div>

      <div>
        <label class="block text-[12px] uppercase tracking-[0.08em] mb-2" style="color: var(--text-3)" for="co-address">
          Địa chỉ giao hàng
        </label>
        <textarea
          id="co-address"
          v-model="form.address"
          rows="3"
          autocomplete="street-address"
          class="input-field w-full px-3.5 py-3 rounded-xl text-[14px]"
          placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
        />
        <p v-if="errors.address" class="mt-1.5 text-[13px]" style="color: #f87171">{{ errors.address }}</p>
      </div>

      <div>
        <label class="block text-[12px] uppercase tracking-[0.08em] mb-2" style="color: var(--text-3)" for="co-note">
          Ghi chú (tuỳ chọn)
        </label>
        <textarea
          id="co-note"
          v-model="form.note"
          rows="2"
          class="input-field w-full px-3.5 py-3 rounded-xl text-[14px]"
          placeholder="Giao giờ hành chính, gọi trước khi đến..."
        />
      </div>

      <motion.button
        type="submit"
        class="w-full mt-2 py-3.5 rounded-2xl btn-primary text-[15px] flex items-center justify-center gap-2"
        :while-tap="{ scale: 0.985 }"
      >
        Tiếp tục kiểm tra đơn
        <Icon name="arrowRight" :size="17" />
      </motion.button>
    </motion.form>
  </div>
</template>
