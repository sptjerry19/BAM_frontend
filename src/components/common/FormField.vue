<script setup>
defineProps({
  label: { type: String, default: '' },
  modelValue: { type: [String, Number, Boolean], default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  min: { type: [Number, String], default: undefined },
  max: { type: [Number, String], default: undefined },
  step: { type: [Number, String], default: undefined },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="space-y-1.5">
    <label
      v-if="label"
      class="block uppercase tracking-wider font-semibold"
      style="font-size: 11px; color: #64748b"
    >
      {{ label }}
    </label>
    <select
      v-if="type === 'select'"
      class="input-field w-full rounded-xl px-4 py-2.5 text-sm"
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
    <textarea
      v-else-if="type === 'textarea'"
      class="input-field w-full rounded-xl px-4 py-2.5 text-sm min-h-[80px] resize-none"
      :placeholder="placeholder"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <input
      v-else
      class="input-field w-full rounded-xl px-4 py-2.5 text-sm"
      :type="type"
      :placeholder="placeholder"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      @input="$emit('update:modelValue', type === 'number' ? Number($event.target.value) : $event.target.value)"
    />
  </div>
</template>
