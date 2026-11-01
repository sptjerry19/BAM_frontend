// Only for the isolated localhost container described in SOCIAL-PROFILE.md.
import { createHash, createHmac } from 'node:crypto'
import assert from 'node:assert/strict'

const channel = 'private-users.2'
const origin = 'http://127.0.0.1:15173'
const key = 'social-smoke-key',
  secret = 'social-smoke-secret'
const socket = new WebSocket(
  'ws://127.0.0.1:18091/app/social-smoke-key?protocol=7&client=js&version=8.4.0&flash=false',
  { headers: { Origin: origin } },
)
let connectedResolve, subscribedResolve, receivedResolve, errorReject
const connected = new Promise((r) => (connectedResolve = r))
const subscribed = new Promise((r) => (subscribedResolve = r))
const received = new Promise((r) => (receivedResolve = r))
const failed = new Promise((_, reject) => (errorReject = reject))
const timeout = setTimeout(
  () => errorReject(new Error('Docker Reverb smoke test timed out')),
  15000,
)
socket.addEventListener('error', (e) =>
  errorReject(e.error || new Error('WebSocket error')),
)
socket.addEventListener('message', (event) => {
  const frame = JSON.parse(event.data)
  if (frame.event === 'pusher:connection_established')
    connectedResolve(JSON.parse(frame.data).socket_id)
  if (frame.event === 'pusher_internal:subscription_succeeded')
    subscribedResolve()
  if (frame.event === 'pusher:ping')
    socket.send(JSON.stringify({ event: 'pusher:pong', data: {} }))
  if (frame.event === 'DockerSmoke')
    receivedResolve(
      typeof frame.data === 'string' ? JSON.parse(frame.data) : frame.data,
    )
  if (frame.event === 'pusher:error') errorReject(new Error(frame.data))
})
try {
  const socketId = await Promise.race([connected, failed])
  const signature = createHmac('sha256', secret)
    .update(`${socketId}:${channel}`)
    .digest('hex')
  socket.send(
    JSON.stringify({
      event: 'pusher:subscribe',
      data: { channel, auth: `${key}:${signature}` },
    }),
  )
  await Promise.race([subscribed, failed])
  const path = '/apps/social-smoke/events'
  const body = JSON.stringify({
    name: 'DockerSmoke',
    channels: [channel],
    data: JSON.stringify({ passed: true }),
  })
  const params = new URLSearchParams({
    auth_key: key,
    auth_timestamp: String(Math.floor(Date.now() / 1000)),
    auth_version: '1.0',
    body_md5: createHash('md5').update(body).digest('hex'),
  })
  params.sort()
  const authSignature = createHmac('sha256', secret)
    .update(`POST\n${path}\n${params}`)
    .digest('hex')
  params.set('auth_signature', authSignature)
  const response = await fetch(`http://127.0.0.1:18091${path}?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
  assert.equal(response.status, 200)
  assert.deepEqual(await Promise.race([received, failed]), { passed: true })
  console.log(
    'PASS: Docker Reverb handshake, private channel signature, signed HTTP publish, WebSocket receive',
  )
} finally {
  clearTimeout(timeout)
  socket.close()
}
