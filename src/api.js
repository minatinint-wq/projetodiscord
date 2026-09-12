const API_URL = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const legacyToken = localStorage.getItem("orbit_token");
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(legacyToken ? { Authorization: `Bearer ${legacyToken}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor local do Sesh.");
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
  games: (query = "") => request(`/api/games?q=${encodeURIComponent(query)}`),
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
  messages: (channelId) => request(`/api/channels/${channelId}/messages`),
  sendMessage: (channelId, input) =>
    request(`/api/channels/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

export function connectSocket(onEvent) {
  const socketUrl = API_URL
    ? `${API_URL.replace(/^http/, "ws")}/ws`
    : `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
  let socket = null;
  let closed = false;
  const pending = [];
  const connection = {
    send: (event) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(event));
      } else if (!closed) {
        pending.push(event);
      }
    },
    close: () => {
      closed = true;
      pending.length = 0;
      socket?.close();
    },
    get socket() {
      return socket;
    },
  };
  api
    .wsTicket()
    .then(({ ticket }) => {
      if (closed) return;
      socket = new WebSocket(
        `${socketUrl}?ticket=${encodeURIComponent(ticket)}`,
      );
      socket.onopen = () => {
        for (const event of pending.splice(0))
          socket.send(JSON.stringify(event));
      };
      socket.onmessage = (event) => onEvent(JSON.parse(event.data));
      socket.onerror = () =>
        console.error("WebSocket: conexão indisponível.");
    })
    .catch((error) => console.error("WebSocket:", error.message));
  return connection;
}
