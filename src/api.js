const API_URL = import.meta.env.VITE_API_URL || "";
function requestSignal(externalSignal) {
  if (externalSignal) return { signal: externalSignal, cancel() {} };
  if (typeof globalThis.AbortSignal?.timeout === "function") return { signal: globalThis.AbortSignal.timeout(60000), cancel() {} };
  if (typeof globalThis.AbortController !== "function") return { signal: undefined, cancel() {} };
  const controller = new globalThis.AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 60000);
  return { signal: controller.signal, cancel: () => globalThis.clearTimeout(timeoutId) };
}

async function request(path, options = {}) {
  // Sessão via cookie httpOnly (credentials:include). Nenhum token em
  // localStorage: o legado "orbit_token" foi removido do envio — qualquer
  // resquício é apagado uma vez pelo cliente em main.jsx.
  const timeout = requestSignal(options.signal);
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      signal: timeout.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    if (["AbortError", "TimeoutError"].includes(error?.name))
      throw new Error("O servidor demorou para responder. Aguarde alguns segundos e tente novamente.");
    throw new Error("Não foi possível conectar ao Sesh. Verifique sua conexão e tente novamente.");
  } finally {
    timeout.cancel();
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(payload.error || "Não foi possível concluir a operação.");
  return payload;
}

export const api = {
  login: (input) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(input) }),
  register: (input) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  resendVerification: () => request("/api/auth/resend-verification", { method: "POST" }),
  me: () => request("/api/auth/me"),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  wsTicket: () => request("/api/auth/ws-ticket", { method: "POST" }),
  subscriptionPlans: () => request("/api/subscriptions/plans"),
  mySubscription: () => request("/api/subscriptions/me"),
  updateSubscription: (userId, input) =>
    request(`/api/admin/users/${userId}/subscription`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  catalog: () => request("/api/catalog"),
  games: (query = "", page = 1, limit = 24) => request(`/api/games?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`),
  adminCatalog: () => request("/api/admin/catalog"),
  createCatalogItem: (input) =>
    request("/api/admin/catalog", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  removeCatalogItem: (itemId) =>
    request(`/api/admin/catalog/${itemId}`, { method: "DELETE" }),
  updateMe: (input) =>
    request("/api/auth/me", { method: "PATCH", body: JSON.stringify(input) }),
  updateUserBadges: (userId, badges) =>
    request(`/api/users/${userId}/badges`, {
      method: "PATCH",
      body: JSON.stringify({ badges }),
    }),
  profile: (userId) => request(`/api/users/${userId}`),
  friends: () => request("/api/friends"),
  addFriend: (username) =>
    request("/api/friends", {
      method: "POST",
      body: JSON.stringify({ username }),
    }),
  acceptFriend: (id) =>
    request(`/api/friends/${id}/accept`, { method: "POST" }),
  removeFriend: (id) => request(`/api/friends/${id}`, { method: "DELETE" }),
  servers: () => request("/api/servers"),
  server: (serverId) => request(`/api/servers/${serverId}`),
  createServer: (name, options = {}) =>
    request("/api/servers", {
      method: "POST",
      body: JSON.stringify({
        name,
        icon: options.icon,
        template: options.template,
      }),
    }),
  createChannel: (serverId, input) =>
    request(`/api/servers/${serverId}`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  joinServer: (serverId) =>
    request(`/api/servers/${serverId}/join`, { method: "POST" }),
  leaveServer: (serverId) =>
    request(`/api/servers/${serverId}`, { method: "DELETE" }),
  updateServer: (serverId, input) =>
    request(`/api/servers/${serverId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  moderateMember: (serverId, userId, input) =>
    request(`/api/servers/${serverId}/members/${userId}/moderation`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  updateChannel: (channelId, input) =>
    request(`/api/channels/${channelId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  deleteChannel: (channelId) =>
    request(`/api/channels/${channelId}`, { method: "DELETE" }),
  directMessages: (userId) => request(`/api/direct/${userId}/messages?attachments=refs`),
  directMessage: (userId, messageId) => request(`/api/direct/${userId}/messages/${messageId}`),
  sendDirectMessage: (userId, input) => request(`/api/direct/${userId}/messages`, { method: "POST", body: JSON.stringify(input) }),
  // Histórico leve: texto na hora, anexos (base64 pesado) sob demanda.
  messages: (channelId) => request(`/api/channels/${channelId}/messages?limit=100&attachments=refs`),
  message: (channelId, messageId) => request(`/api/channels/${channelId}/messages/${messageId}`),
  sendMessage: (channelId, input) =>
    request(`/api/channels/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateMessage: (channelId, messageId, input) =>
    request(`/api/channels/${channelId}/messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  deleteMessage: (channelId, messageId) =>
    request(`/api/channels/${channelId}/messages/${messageId}`, {
      method: "DELETE",
    }),
  reactToMessage: (channelId, messageId, emoji) =>
    request(`/api/channels/${channelId}/messages/${messageId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
    }),
  reportMessage: (channelId, messageId, reason) =>
    request(`/api/channels/${channelId}/messages/${messageId}/report`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  forwardMessage: (channelId, messageId) =>
    request(`/api/channels/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify({ forwardedMessageId: messageId }),
    }),
};

export function connectSocket(onEvent) {
  const socketUrl = API_URL ? `${API_URL.replace(/^http/, "ws")}/ws`
    : `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
  let socket, timer, pingTimer, closed = false, attempts = 0;
  const pending = [];
  const emit = (event) => Promise.resolve().then(() => onEvent(event)).catch((error) => console.error("Sesh realtime:", error));
  const reconnect = () => {
    if (closed) return;
    emit({ type: "connection.status", connected: false });
    clearTimeout(timer);
    timer = setTimeout(open, Math.min(15000, 750 * 2 ** attempts++) + Math.random() * 400);
  };
  async function open() {
    try {
      const { ticket } = await api.wsTicket();
      if (closed) return;
      socket = new WebSocket(`${socketUrl}?ticket=${encodeURIComponent(ticket)}`);
      socket.onopen = () => {
        const recovered = attempts > 0;
        attempts = 0;
        emit({ type: "connection.status", connected: true, recovered });
        const ping = () => socket?.readyState === WebSocket.OPEN && socket.send(JSON.stringify({ type: "connection.ping", sentAt: Date.now() }));
        ping();
        clearInterval(pingTimer);
        pingTimer = setInterval(ping, 5_000);
        for (const event of pending.splice(0)) socket.send(JSON.stringify(event));
      };
      socket.onmessage = ({ data }) => { try { const event=JSON.parse(data); if(event.type==="connection.pong"&&Number.isSafeInteger(event.sentAt)) emit({type:"connection.latency",rtt:Math.max(0,Date.now()-event.sentAt)}); else emit(event); } catch {} };
      socket.onclose = () => { clearInterval(pingTimer); reconnect(); };
      socket.onerror = () => socket?.close();
    } catch { reconnect(); }
  }
  open();
  return {
    send(event) {
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(event));
      else if (!closed && pending.length < 50 && !event.type?.startsWith("voice.")) pending.push(event);
    },
    close() { closed = true; clearTimeout(timer); clearInterval(pingTimer); pending.length = 0; socket?.close(); },
    get socket() { return socket; },
  };
}
