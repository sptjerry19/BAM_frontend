import { ref, watch, effectScope } from 'vue'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import api from '../api/client'
import { useAuth } from './useAuth'

const status = ref('disconnected')
const connectionError = ref('')
const listeners = new Set()
let echo
let started = false
let generation = 0
const realtimeScope = effectScope(true)
let removeFocusListener = () => {}

export function useSocialRealtime() {
  const { token, user, clearAuth, refreshAuth } = useAuth()
  if (!started) {
    started = true
    realtimeScope.run(() =>
      watch(
        [token, () => user.value?.id],
        ([jwt, id], previous, onCleanup) => {
          const current = ++generation
          echo?.disconnect()
          echo = null
          status.value = 'disconnected'
          connectionError.value = ''
          if (!jwt || !id) return
          status.value = 'connecting'
          let refreshTimer, expiryTimer
          try {
            const expiry =
              JSON.parse(
                atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
              ).exp * 1000
            const refresh = async () => {
              try {
                await refreshAuth()
              } catch {
                if (current === generation && Date.now() < expiry)
                  refreshTimer = setTimeout(refresh, 5000)
              }
            }
            refreshTimer = setTimeout(
              refresh,
              Math.max(1000, expiry - Date.now() - 60000),
            )
            expiryTimer = setTimeout(
              () => {
                if (current === generation) clearAuth()
              },
              Math.max(0, expiry - Date.now()),
            )
            onCleanup(() => {
              clearTimeout(refreshTimer)
              clearTimeout(expiryTimer)
            })
          } catch {
            clearAuth()
            return
          }
          const key = import.meta.env.VITE_REVERB_APP_KEY
          if (!key) {
            status.value = 'unconfigured'
            return
          }
          const secure =
            (import.meta.env.VITE_REVERB_SCHEME ||
              location.protocol.replace(':', '')) === 'https'
          try {
            echo = new Echo({
              broadcaster: 'reverb',
              Pusher,
              key,
              wsHost: import.meta.env.VITE_REVERB_HOST || location.hostname,
              wsPort: Number(
                import.meta.env.VITE_REVERB_PORT ||
                  (secure ? 443 : location.port || 80),
              ),
              wssPort: Number(import.meta.env.VITE_REVERB_PORT || 443),
              forceTLS: secure,
              enabledTransports: ['ws', 'wss'],
              authorizer: (channel) => ({
                authorize: (socketId, callback) => {
                  api
                    .post('/broadcasting/auth', {
                      socket_id: socketId,
                      channel_name: channel.name,
                    })
                    .then((r) => {
                      if (current === generation) callback(null, r.data)
                    })
                    .catch((e) => {
                      if (current === generation) callback(e, null)
                    })
                },
              }),
            })
          } catch {
            status.value = 'failed'
            connectionError.value = 'Không thể khởi tạo kết nối realtime.'
            return
          }
          echo.connector.pusher.connection.bind(
            'state_change',
            ({ current: state }) => {
              if (current !== generation) return
              status.value = state === 'connected' ? 'authorizing' : state
              if (state === 'connecting' || state === 'connected')
                connectionError.value = ''
            },
          )
          echo.connector.pusher.connection.bind('error', () => {
            if (current !== generation) return
            status.value = 'failed'
            connectionError.value =
              'Không thể kết nối realtime. Vui lòng thử lại.'
          })
          const channel = echo.private(`users.${id}`)
          channel.error(() => {
            if (current !== generation) return
            status.value = 'unauthorized'
            connectionError.value =
              'Không thể xác thực kênh tin nhắn. Vui lòng thử lại hoặc đăng nhập lại.'
          })
          channel.subscribed(() => {
            if (current !== generation) return
            status.value = 'connected'
            connectionError.value = ''
            listeners.forEach((fn) => fn({ type: 'resync' }))
          })
          for (const type of [
            'MessageSent',
            'MessageRead',
            'ConversationChanged',
            'NotificationChanged',
          ]) {
            channel.listen(`.${type}`, (event) => {
              if (current === generation)
                listeners.forEach((fn) => fn({ ...event, type }))
            })
          }
        },
        { immediate: true },
      ),
    )
    // Revalidate the JWT on each reconnect/foreground. Channel authorization is
    // not re-run by the server for each frame of an existing connection.
    const onFocus = () => {
      if (token.value)
        api.get('/me').catch((e) => {
          if (e.response?.status === 401) clearAuth()
        })
    }
    window.addEventListener('focus', onFocus)
    removeFocusListener = () => window.removeEventListener('focus', onFocus)
  }
  return {
    status,
    connectionError,
    reconnect() {
      if (!echo) return
      connectionError.value = ''
      status.value = 'connecting'
      echo.disconnect()
      echo.connector.pusher.connect()
    },
    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
  }
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    ++generation
    realtimeScope.stop()
    echo?.disconnect()
    listeners.clear()
    removeFocusListener()
  })
}
