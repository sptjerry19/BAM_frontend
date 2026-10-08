<script setup>
import { ref, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { uploadFiles } from '../../api'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Viết nội dung bài viết...' },
})

const emit = defineEmits(['update:modelValue'])

const uploading = ref(false)
const fileInput = ref(null)
const toolbarTick = ref(0)

const editor = useEditor({
  content: props.modelValue || '',
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
    }),
    Image.configure({ inline: false, allowBase64: false }),
    Placeholder.configure({ placeholder: props.placeholder }),
  ],
  editorProps: {
    attributes: {
      class: 'html-editor__content',
    },
  },
  onUpdate: ({ editor: instance }) => {
    emit('update:modelValue', instance.isEmpty ? '' : instance.getHTML())
  },
  onSelectionUpdate: () => {
    toolbarTick.value += 1
  },
  onTransaction: () => {
    toolbarTick.value += 1
  },
})

watch(
  () => props.modelValue,
  (value) => {
    const instance = editor.value
    if (!instance) return
    const next = value || ''
    const current = instance.isEmpty ? '' : instance.getHTML()
    if (next !== current) instance.commands.setContent(next, { emitUpdate: false })
  },
)

function run(command) {
  editor.value?.chain().focus()[command]().run()
}

function toggleHeading(level) {
  editor.value?.chain().focus().toggleHeading({ level }).run()
}

function setLink() {
  const instance = editor.value
  if (!instance) return
  if (instance.isActive('link')) {
    instance.chain().focus().unsetLink().run()
    return
  }
  const previous = instance.getAttributes('link').href || ''
  const url = window.prompt('Nhập URL liên kết', previous || 'https://')
  if (url === null) return
  if (!url.trim()) {
    instance.chain().focus().unsetLink().run()
    return
  }
  instance.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
}

function pickImage() {
  fileInput.value?.click()
}

async function onPickImage(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file || !editor.value) return
  uploading.value = true
  try {
    const res = await uploadFiles([file], 'news')
    const url = res?.urls?.[0]
    if (url) editor.value.chain().focus().setImage({ src: url }).run()
  } finally {
    uploading.value = false
  }
}

function isActive(name, attrs) {
  toolbarTick.value
  return editor.value?.isActive(name, attrs) ?? false
}
</script>

<template>
  <div class="html-editor rounded-xl overflow-hidden" style="border: 1px solid var(--line); background: var(--input-bg)">
    <div
      class="html-editor__toolbar flex flex-wrap gap-1 p-2"
      style="border-bottom: 1px solid var(--line); background: var(--bg-2)"
    >
      <button
        type="button"
        class="html-editor__btn"
        :class="{ 'is-active': isActive('bold') }"
        title="Đậm"
        @mousedown.prevent
        @click="run('toggleBold')"
      >
        B
      </button>
      <button
        type="button"
        class="html-editor__btn italic"
        :class="{ 'is-active': isActive('italic') }"
        title="Nghiêng"
        @mousedown.prevent
        @click="run('toggleItalic')"
      >
        I
      </button>
      <button
        type="button"
        class="html-editor__btn underline"
        :class="{ 'is-active': isActive('underline') }"
        title="Gạch chân"
        @mousedown.prevent
        @click="run('toggleUnderline')"
      >
        U
      </button>
      <span class="html-editor__sep" />
      <button
        type="button"
        class="html-editor__btn"
        :class="{ 'is-active': isActive('heading', { level: 2 }) }"
        title="Tiêu đề mục"
        @mousedown.prevent
        @click="toggleHeading(2)"
      >
        H2
      </button>
      <button
        type="button"
        class="html-editor__btn"
        :class="{ 'is-active': isActive('heading', { level: 3 }) }"
        title="Tiêu đề nhỏ"
        @mousedown.prevent
        @click="toggleHeading(3)"
      >
        H3
      </button>
      <span class="html-editor__sep" />
      <button
        type="button"
        class="html-editor__btn"
        :class="{ 'is-active': isActive('bulletList') }"
        title="Danh sách"
        @mousedown.prevent
        @click="run('toggleBulletList')"
      >
        •
      </button>
      <button
        type="button"
        class="html-editor__btn"
        :class="{ 'is-active': isActive('orderedList') }"
        title="Danh sách số"
        @mousedown.prevent
        @click="run('toggleOrderedList')"
      >
        1.
      </button>
      <button
        type="button"
        class="html-editor__btn"
        :class="{ 'is-active': isActive('blockquote') }"
        title="Trích dẫn"
        @mousedown.prevent
        @click="run('toggleBlockquote')"
      >
        “
      </button>
      <span class="html-editor__sep" />
      <button
        type="button"
        class="html-editor__btn"
        :class="{ 'is-active': isActive('link') }"
        title="Liên kết"
        @mousedown.prevent
        @click="setLink"
      >
        Link
      </button>
      <button
        type="button"
        class="html-editor__btn"
        :disabled="uploading"
        title="Chèn ảnh"
        @mousedown.prevent
        @click="pickImage"
      >
        {{ uploading ? '...' : 'Ảnh' }}
      </button>
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onPickImage" />
    </div>
    <EditorContent :editor="editor" />
  </div>
</template>

<style scoped>
.html-editor__btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-2);
  background: transparent;
  border: 1px solid transparent;
}

.html-editor__btn:hover,
.html-editor__btn.is-active {
  color: var(--text);
  background: var(--accent-soft);
  border-color: var(--line);
}

.html-editor__btn:disabled {
  opacity: 0.4;
}

.html-editor__sep {
  width: 1px;
  margin: 4px 2px;
  background: var(--line);
}

.html-editor :deep(.html-editor__content) {
  min-height: 220px;
  padding: 14px 16px 18px;
  outline: none;
  color: var(--text);
  font-size: 14.5px;
  line-height: 1.7;
}

.html-editor :deep(.html-editor__content p.is-editor-empty:first-child::before) {
  color: var(--text-3);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.html-editor :deep(.html-editor__content h2) {
  margin: 1.1rem 0 0.35rem;
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.html-editor :deep(.html-editor__content h3) {
  margin: 0.9rem 0 0.3rem;
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: 700;
}

.html-editor :deep(.html-editor__content p) {
  margin: 0.55rem 0;
}

.html-editor :deep(.html-editor__content ul),
.html-editor :deep(.html-editor__content ol) {
  margin: 0.55rem 0;
  padding-left: 1.2rem;
}

.html-editor :deep(.html-editor__content blockquote) {
  margin: 0.9rem 0;
  padding-left: 0.9rem;
  border-left: 3px solid var(--accent);
  font-weight: 600;
}

.html-editor :deep(.html-editor__content img) {
  max-width: 100%;
  margin: 0.8rem 0;
  border-radius: 10px;
}

.html-editor :deep(.html-editor__content a) {
  text-decoration: underline;
}
</style>
