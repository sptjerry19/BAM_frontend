import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const fixture = JSON.parse(
  readFileSync(
    new URL(
      '../../backend/storage/framework/testing/social-smoke.json',
      import.meta.url,
    ),
  ),
)
const api = process.env.SOCIAL_SMOKE_API || 'http://127.0.0.1:18090/api'
async function request(path, user, method = 'GET', body) {
  const response = await fetch(`${api}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${fixture.users[user].token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json()
  assert.ok(
    response.ok,
    `${method} ${path} returned ${response.status}: ${data.message}`,
  )
  return data.data ?? data
}
const sockets = []
try {
  const socket = new WebSocket(
    'ws://127.0.0.1:8091/app/social-smoke-key?protocol=7&client=js&version=8.4.0&flash=false',
    { headers: { Origin: 'http://127.0.0.1:15173' } },
  )
  sockets.push(socket)
  let received, connectedResolve, subscribedResolve
  const connected = new Promise((r) => (connectedResolve = r))
  const subscribed = new Promise((r) => (subscribedResolve = r))
  const message = new Promise((r) => (received = r))
  socket.addEventListener('message', (event) => {
    const frame = JSON.parse(event.data)
    if (frame.event === 'pusher:connection_established')
      connectedResolve(JSON.parse(frame.data).socket_id)
    if (frame.event === 'pusher_internal:subscription_succeeded')
      subscribedResolve()
    if (frame.event === 'pusher:ping')
      socket.send(JSON.stringify({ event: 'pusher:pong', data: {} }))
    if (frame.event === 'MessageSent')
      received(
        typeof frame.data === 'string' ? JSON.parse(frame.data) : frame.data,
      )
  })
  const timeout = (p, label) =>
    Promise.race([
      p,
      new Promise((_, reject) => {
        const t = setTimeout(
          () => reject(new Error(`${label} timed out`)),
          15000,
        )
        t.unref()
      }),
    ])
  const socketId = await timeout(connected, 'WebSocket handshake')
  const auth = await request('/broadcasting/auth', 'b', 'POST', {
    socket_id: socketId,
    channel_name: `private-users.${fixture.users.b.id}`,
  })
  socket.send(
    JSON.stringify({
      event: 'pusher:subscribe',
      data: { channel: `private-users.${fixture.users.b.id}`, auth: auth.auth },
    }),
  )
  await timeout(subscribed, 'Private subscription')
  const conversation = await request('/conversations', 'a', 'POST', {
    user_id: fixture.users.b.id,
  })
  if (conversation.status === 'pending')
    await request(`/conversations/${conversation.id}/accept`, 'b', 'PUT')
  const clientId = crypto.randomUUID()
  const sent = await request(
    `/conversations/${conversation.id}/messages`,
    'a',
    'POST',
    { body: 'Kiểm thử nhắn tin qua WebSocket', client_message_id: clientId },
  )
  const event = await timeout(message, 'MessageSent event via outbox')
  assert.equal(event.message_id, sent.id)
  assert.equal(event.conversation_id, conversation.id)
  assert.equal(event.body, undefined, 'Socket must not leak message content')
  const history = await request(
    `/conversations/${conversation.id}/messages`,
    'b',
  )
  assert.equal(history.data.at(-1).body, 'Kiểm thử nhắn tin qua WebSocket')
  const repeated = await request(
    `/conversations/${conversation.id}/messages`,
    'a',
    'POST',
    { body: 'Kiểm thử nhắn tin qua WebSocket', client_message_id: clientId },
  )
  assert.equal(repeated.id, sent.id)
  const forbidden = await fetch(
    `${api}/conversations/${conversation.id}/messages`,
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${fixture.users.c.token}`,
      },
    },
  )
  assert.equal(forbidden.status, 403)
  console.log(
    'PASS: handshake, JWT private subscription, HTTP persist, outbox -> Reverb -> receiver, history sync, retry deduplication, third-user denial',
  )
} finally {
  for (const socket of sockets) socket.close()
}
