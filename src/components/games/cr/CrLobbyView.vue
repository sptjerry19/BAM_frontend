<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createCrRoom, joinCrRoom } from '../../../api'
import { persistCrSession } from '../../../composables/useCapitalRivals'
import { useAuth } from '../../../composables/useAuth'
import { useLocale } from '../../../composables/useLocale'

const router = useRouter()
const { user } = useAuth()
const { t } = useLocale()

const name = ref(user.value?.name || '')
const code = ref('')
const busy = ref(false)
const error = ref('')

function fail(e) {
  error.value = e?.api?.message || e?.message || t('games.cr.error')
}

async function createRoom() {
  busy.value = true
  error.value = ''
  try {
    const data = persistCrSession(await createCrRoom(name.value.trim() || undefined))
    await router.push({ name: 'cr-room', params: { code: data.room.code } })
  } catch (e) {
    fail(e)
  } finally {
    busy.value = false
  }
}

async function joinRoom() {
  const roomCode = code.value.trim().toUpperCase()
  if (!roomCode) {
    error.value = t('games.cr.needCode')
    return
  }
  busy.value = true
  error.value = ''
  try {
    const data = persistCrSession(
      await joinCrRoom(roomCode, {
        name: name.value.trim() || undefined,
        playerToken: undefined,
      }),
    )
    await router.push({ name: 'cr-room', params: { code: data.room.code } })
  } catch (e) {
    fail(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="cr-lobby">
    <p class="eyebrow">{{ t('games.cr.eyebrow') }}</p>
    <h1>{{ t('games.cr.title') }}</h1>
    <p class="lede">{{ t('games.cr.lede') }}</p>

    <label class="field">
      <span>{{ t('games.cr.displayName') }}</span>
      <input v-model="name" maxlength="32" :placeholder="t('games.cr.namePlaceholder')" />
    </label>

    <p class="lede">{{ t('games.cr.virtualRules') }}</p>
    <div class="actions">
      <button type="button" class="btn-primary" :disabled="busy" @click="createRoom">
        {{ t('games.cr.create') }}
      </button>
      <div class="join">
        <input
          v-model="code"
          maxlength="8"
          class="code"
          :placeholder="t('games.cr.codePlaceholder')"
          @keyup.enter="joinRoom"
        />
        <button type="button" class="btn-secondary" :disabled="busy" @click="joinRoom">
          {{ t('games.cr.join') }}
        </button>
      </div>
    </div>
    <p v-if="error" class="err">{{ error }}</p>
  </section>
</template>

<style scoped>
.cr-lobby {
  max-width: 40rem;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
}
.eyebrow {
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.75rem;
  color: var(--text-3);
}
h1 {
  font-size: 2rem;
  margin: 0.35rem 0 0.5rem;
}
.lede {
  color: var(--text-2);
  margin-bottom: 1.5rem;
}
.field,
.join {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.field span {
  font-size: 0.85rem;
  color: var(--text-3);
}
input {
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  border-radius: var(--r-md);
  padding: 0.7rem 0.85rem;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.25rem;
}
.join {
  flex-direction: row;
  align-items: stretch;
}
.code {
  flex: 1;
  text-transform: uppercase;
}
.btn-primary,
.btn-secondary {
  border-radius: var(--r-md);
  padding: 0.75rem 1rem;
  font-weight: 600;
}
.btn-primary {
  background: var(--text);
  color: var(--bg);
}
.btn-secondary {
  border: 1px solid var(--line);
}
.err {
  color: #c2410c;
  margin-top: 1rem;
}
</style>
