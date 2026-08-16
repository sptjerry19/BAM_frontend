<script setup>
/**
 * Nested category filter — parent accordion + optional subcategories (UI only).
 * Emits the selected leaf/parent id; parent maps API category until BE supports subs.
 */
import { ref, computed, watch } from 'vue'
import Icon from '../common/Icon.vue'

const props = defineProps({
  modelValue: { type: String, default: 'all' },
  /** @type {{ id: string, label: string, children?: { id: string, label: string }[] }[]} */
  tree: { type: Array, required: true },
  /** Parent/leaf ids the products API already accepts */
  apiIds: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

const expanded = ref({})
const apiSet = computed(() => new Set(props.apiIds))

const parents = computed(() => props.tree.filter((n) => n.id !== 'all'))

function isExpanded(id) {
  return Boolean(expanded.value[id])
}

function toggle(id) {
  expanded.value = { ...expanded.value, [id]: !expanded.value[id] }
}

function select(id) {
  emit('update:modelValue', id)
}

function isActive(id) {
  return props.modelValue === id
}

function parentOwnsSelection(parent) {
  if (props.modelValue === parent.id) return true
  return (parent.children || []).some((c) => c.id === props.modelValue)
}

function canSelectParent(parent) {
  return apiSet.value.has(parent.id) || !parent.children?.length
}

function onParentActivate(parent) {
  if (parent.children?.length && !apiSet.value.has(parent.id)) {
    toggle(parent.id)
    return
  }
  select(parent.id)
}

watch(
  () => props.modelValue,
  (id) => {
    const next = { ...expanded.value }
    for (const p of parents.value) {
      if (p.id === id || (p.children || []).some((c) => c.id === id)) {
        next[p.id] = true
      }
    }
    expanded.value = next
  },
  { immediate: true },
)
</script>

<template>
  <div class="cat-dd">
    <button
      type="button"
      class="cat-dd__all"
      :class="{ 'is-active': isActive('all') }"
      :aria-pressed="isActive('all')"
      @click="select('all')"
    >
      <span class="plp__check" aria-hidden="true" />
      Tất cả
    </button>

    <div
      v-for="parent in parents"
      :key="parent.id"
      class="cat-dd__group"
      :class="{ 'is-open': isExpanded(parent.id), 'has-sel': parentOwnsSelection(parent) }"
    >
      <div class="cat-dd__row">
        <button
          type="button"
          class="cat-dd__parent"
          :class="{ 'is-active': isActive(parent.id) }"
          :aria-pressed="isActive(parent.id)"
          @click="onParentActivate(parent)"
        >
          <span
            class="plp__check"
            :class="{ 'is-muted': !canSelectParent(parent) }"
            aria-hidden="true"
          />
          <span class="cat-dd__label">{{ parent.label }}</span>
        </button>

        <button
          v-if="parent.children?.length"
          type="button"
          class="cat-dd__toggle"
          :aria-expanded="isExpanded(parent.id)"
          :aria-label="`${isExpanded(parent.id) ? 'Thu gọn' : 'Mở'} ${parent.label}`"
          @click.stop="toggle(parent.id)"
        >
          <Icon
            name="chevronDown"
            :size="16"
            :style="{
              transform: isExpanded(parent.id) ? 'rotate(180deg)' : undefined,
              transition: 'transform 0.2s',
            }"
          />
        </button>
      </div>

      <ul
        v-if="parent.children?.length"
        v-show="isExpanded(parent.id)"
        class="cat-dd__subs"
      >
        <li v-if="canSelectParent(parent)">
          <button
            type="button"
            class="cat-dd__sub"
            :class="{ 'is-active': isActive(parent.id) }"
            @click="select(parent.id)"
          >
            Tất cả {{ parent.label.toLowerCase() }}
          </button>
        </li>
        <li v-for="child in parent.children" :key="child.id">
          <button
            type="button"
            class="cat-dd__sub"
            :class="{ 'is-active': isActive(child.id) }"
            :aria-pressed="isActive(child.id)"
            @click="select(child.id)"
          >
            {{ child.label }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
