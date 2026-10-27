const prefix = 'cr_player_token_'

export function crTokenKey(code) {
  return `${prefix}${String(code || '').toUpperCase()}`
}

export function readCrToken(code) {
  try {
    return localStorage.getItem(crTokenKey(code)) || ''
  } catch {
    return ''
  }
}

export function writeCrToken(code, token) {
  if (!code || !token) return
  localStorage.setItem(crTokenKey(code), token)
}

export function clearCrToken(code) {
  localStorage.removeItem(crTokenKey(code))
}

export function persistCrSession(payload) {
  const code = payload?.room?.code
  const token = payload?.you?.player_token
  if (code && token) writeCrToken(code, token)
  return payload
}
