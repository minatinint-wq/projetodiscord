const API_URL = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const token = localStorage.getItem('orbit_token');
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Execute "npm run dev:full" e tente novamente.');
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Não foi possível concluir a operação.');
  return payload;
}

export const api = {
  login: input => request('/api/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  register: input => request('/api/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  me: () => request('/api/auth/me'),
  updateMe: input => request('/api/auth/me', { method: 'PATCH', body: JSON.stringify(input) }),
  profile: userId => request(`/api/users/${userId}`),
  servers: () => request('/api/servers'),
  createServer: name => request('/api/servers', { method: 'POST', body: JSON.stringify({ name }) }),
  createChannel: (serverId, input) => request(`/api/servers/${serverId}`, { method: 'POST', body: JSON.stringify(input) }),
  joinServer: serverId => request(`/api/servers/${serverId}/join`, { method: 'POST' }),
  updateChannel: (channelId, input) => request(`/api/channels/${channelId}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteChannel: channelId => request(`/api/channels/${channelId}`, { method: 'DELETE' }),
  messages: channelId => request(`/api/channels/${channelId}/messages`),
  sendMessage: (channelId, content) => request(`/api/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify({ content }) })
};

export function connectSocket(onEvent) {
  const token = localStorage.getItem('orbit_token');
  if (!token) return { send: () => {}, close: () => {} };
  const socketUrl = API_URL ? `${API_URL.replace(/^http/, 'ws')}/ws` : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
  const socket = new WebSocket(`${socketUrl}?token=${encodeURIComponent(token)}`);
  socket.onmessage = event => onEvent(JSON.parse(event.data));
  return { send: event => { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(event)); }, close: () => socket.close(), socket };
}
