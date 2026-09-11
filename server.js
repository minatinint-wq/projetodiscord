import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const dataFile = path.resolve(
  process.env.DATA_FILE || path.join(dataDir, "database.json"),
);
const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || (isProduction ? 8080 : 3001));
const host = process.env.HOST || (isProduction ? "0.0.0.0" : "127.0.0.1");
const DATABASE_URL = String(process.env.DATABASE_URL || "").trim();
const CORS_ORIGIN = String(process.env.CORS_ORIGIN || "").trim();
const DATA_ENCRYPTION_KEY = String(
  process.env.DATA_ENCRYPTION_KEY || "",
).trim();
const COLLECTIONS = [
  "users",
  "servers",
  "channels",
  "messages",
  "memberships",
  "friendships",
];
const sessions = new Map();
const sockets = new Map();
const voiceRooms = new Map();
const CREATOR_EMAIL = String(process.env.CREATOR_EMAIL || "")
  .trim()
  .toLowerCase();
const ALLOWED_BADGES = [
  "rara",
  "apoiador",
  "apoiador_inicial",
  "mes_1",
  "mes_3",
  "mes_6",
  "mes_9",
  "mes_12",
  "explorador",
  "anfitriao",
  "voz",
  "criador",
  "fundador",
  "moderador",
  "desenvolvedor",
  "eventos",
  "verificado",
  "cacador_bugs",
  "artista",
  "streamer",
];
let database;
let pgClient = null;
let saveQueue = Promise.resolve();
const encryptionKey = DATA_ENCRYPTION_KEY
  ? Buffer.from(DATA_ENCRYPTION_KEY, "base64")
  : null;
if (encryptionKey && encryptionKey.length !== 32)
  throw new Error("DATA_ENCRYPTION_KEY precisa conter 32 bytes em base64.");

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const hashPassword = (
  password,
  salt = crypto.randomBytes(16).toString("hex"),
) => ({ salt, hash: crypto.scryptSync(password, salt, 64).toString("hex") });
const verifyPassword = (password, record) => {
  if (!record?.salt || !record?.hash) return false;
  try {
    const actual = Buffer.from(hashPassword(password, record.salt).hash, "hex");
    const expected = Buffer.from(record.hash, "hex");
    return (
      actual.length === expected.length &&
      crypto.timingSafeEqual(actual, expected)
    );
  } catch {
    return false;
  }
};
const initials = (name) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const blankDatabase = () =>
  Object.fromEntries(COLLECTIONS.map((key) => [key, []]));
const normalizeDatabase = (input) =>
  Object.fromEntries(
    COLLECTIONS.map((key) => [
      key,
      Array.isArray(input?.[key]) ? input[key] : [],
    ]),
  );

function encodeDatabase(value) {
  const plain = JSON.stringify(value);
  if (!encryptionKey) return `${JSON.stringify(value, null, 2)}\n`;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  return [
    "SESH1",
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

function decodeDatabase(raw) {
  if (!raw.startsWith("SESH1:")) return JSON.parse(raw);
  if (!encryptionKey)
    throw new Error(
      "O banco local está criptografado, mas a chave não existe.",
    );
  const [, ivValue, tagValue, encryptedValue] = raw.split(":");
  if (!ivValue || !tagValue || !encryptedValue)
    throw new Error("Formato do banco criptografado inválido.");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey,
    Buffer.from(ivValue, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64"));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64")),
    decipher.final(),
  ]).toString("utf8");
  return JSON.parse(plain);
}

function starterServer(user) {
  const serverId = id();
  const generalId = id();
  const callId = id();
  return {
    server: {
      id: serverId,
      name: `Comunidade de ${user.displayName}`,
      icon: initials(user.displayName),
      tag: "SESH",
      banner: null,
      accentColor: "#c93642",
      ownerId: user.id,
      createdAt: now(),
    },
    membership: { userId: user.id, serverId, role: "owner", joinedAt: now() },
    channels: [
      {
        id: generalId,
        serverId,
        name: "geral",
        type: "text",
        topic: "Converse, compartilhe e crie junto",
        position: 0,
        createdAt: now(),
      },
      {
        id: callId,
        serverId,
        name: "Call da comunidade",
        type: "voice",
        topic: "Converse por áudio",
        position: 1,
        createdAt: now(),
      },
    ],
    message: {
      id: id(),
      channelId: generalId,
      authorId: user.id,
      content: `Bem-vindo ao Sesh, ${user.displayName}! Este é o seu primeiro canal.`,
      createdAt: now(),
      editedAt: null,
    },
  };
}
async function loadDatabase() {
  if (DATABASE_URL) {
    const { default: pg } = await import("pg");
    const ssl =
      process.env.DATABASE_SSL === "false"
        ? false
        : {
            rejectUnauthorized:
              process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
          };
    pgClient = new pg.Client({ connectionString: DATABASE_URL, ssl });
    await pgClient.connect();
    await pgClient.query(
      "CREATE TABLE IF NOT EXISTS app_state (key text primary key, value jsonb not null)",
    );
    const { rows } = await pgClient.query("SELECT key, value FROM app_state");
    const loaded = {};
    for (const row of rows) loaded[row.key] = row.value;
    database = normalizeDatabase(loaded);
    if (database.users.length) {
      console.log(
        `Sesh: ${database.users.length} usuário(s) carregados do PostgreSQL.`,
      );
      return;
    }
  } else {
    let loaded = null;
    try {
      loaded = decodeDatabase(await fs.readFile(dataFile, "utf8"));
    } catch {
      /* primeiro uso local */
    }
    database = normalizeDatabase(loaded || blankDatabase());
  }

  if (
    !database.users.length ||
    (!DATABASE_URL &&
      process.env.SEED_DEMO_USER !== "false" &&
      !database.users.some((user) => user.username === "demo"))
  ) {
    const password = hashPassword("demo123");
    const userId = id();
    const user = {
      id: userId,
      username: "demo",
      displayName: "Usuário Demo",
      email: "demo@sesh.local",
      password,
      avatarColor: "purple",
      createdAt: now(),
    };
    const starter = starterServer(user);
    database.users.push(user);
    database.servers.push(starter.server);
    database.memberships.push(starter.membership);
    database.channels.push(...starter.channels);
    database.messages.push(starter.message);
  }
  for (const user of database.users) {
    const badges = Array.isArray(user.badges) ? user.badges : [];
    user.badges = isCreator(user)
      ? [...new Set([...badges, "criador"])]
      : badges.filter((badge) => badge !== "criador");
  }
  await saveDatabase();
  console.log(
    `Sesh: ${database.users.length} usuário(s) carregados do armazenamento ${DATABASE_URL ? "PostgreSQL" : "local"}.`,
  );
}
async function persistDatabase() {
  if (pgClient) {
    for (const key of COLLECTIONS) {
      await pgClient.query(
        "INSERT INTO app_state (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [key, JSON.stringify(database[key] || [])],
      );
    }
    return;
  }
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, encodeDatabase(database), "utf8");
}
function saveDatabase() {
  saveQueue = saveQueue.catch(() => {}).then(persistDatabase);
  return saveQueue;
}
function json(res, status, payload) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
  };
  if (CORS_ORIGIN) headers["Access-Control-Allow-Origin"] = CORS_ORIGIN;
  res.writeHead(status, headers);
  res.end(JSON.stringify(payload));
}
function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarColor: user.avatarColor,
    avatar: user.avatar || null,
    banner: user.banner || null,
    bio: user.bio || "",
    badges: user.badges || [],
    status: user.status || "online",
    nameStyle: user.nameStyle || "default",
    nameColor: user.nameColor || "#f1f3f5",
    nameEffect: user.nameEffect || "solid",
    profileTheme: user.profileTheme || "default",
    profilePlate: user.profilePlate || "default",
    profileEffect: user.profileEffect || "none",
    avatarFrame: user.avatarFrame || "none",
    favoriteGame: user.favoriteGame || "",
    activityText: user.activityText || "",
    wishlist: user.wishlist || "",
  };
}
function isCreator(user) {
  return Boolean(
    CREATOR_EMAIL && (user?.email || "").toLowerCase() === CREATOR_EMAIL,
  );
}
function sanitizeBadges(target, badges) {
  const selected = Array.isArray(badges)
    ? [...new Set(badges.filter((badge) => ALLOWED_BADGES.includes(badge)))]
    : [];
  return isCreator(target)
    ? selected
    : selected.filter((badge) => badge !== "criador");
}
function sessionUser(user) {
  return {
    ...publicUser(user),
    email: user.email || "",
    isCreator: isCreator(user),
  };
}
function broadcastAll(event) {
  for (const [, socket] of sockets)
    if (socket.readyState === 1) socket.send(JSON.stringify(event));
}
function notifyUser(userId, event) {
  const socket = sockets.get(userId);
  if (socket?.readyState === 1) socket.send(JSON.stringify(event));
}
function voiceStateOf(userId) {
  for (const [channelId, room] of voiceRooms)
    if (room.has(userId)) {
      const channel = database.channels.find((item) => item.id === channelId);
      if (channel) return { channelId: channel.id, channelName: channel.name };
    }
  return null;
}
function presenceOf(user) {
  if (voiceStateOf(user.id)) return "voice";
  if (!sockets.has(user.id) || user.status === "invisible") return "offline";
  return user.status === "idle"
    ? "idle"
    : user.status === "dnd"
      ? "dnd"
      : "online";
}
function friendView(friendship, viewerId) {
  const otherId =
    friendship.requesterId === viewerId
      ? friendship.addresseeId
      : friendship.requesterId;
  const other = database.users.find((item) => item.id === otherId);
  if (!other) return null;
  const voice = voiceStateOf(other.id);
  return {
    friendshipId: friendship.id,
    direction: friendship.requesterId === viewerId ? "outgoing" : "incoming",
    presence: presenceOf(other),
    voice,
    ...publicUser(other),
  };
}
function getUser(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const userId = sessions.get(token);
  return database.users.find((user) => user.id === userId);
}
async function body(req) {
  let raw = "";
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 5_000_000) {
      const error = new Error("Corpo da requisição muito grande.");
      error.status = 413;
      throw error;
    }
    raw += chunk;
  }
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("JSON inválido.");
    error.status = 400;
    throw error;
  }
}
function serverForUser(user, serverId) {
  return database.servers.find(
    (server) =>
      server.id === serverId &&
      database.memberships.some(
        (m) => m.serverId === serverId && m.userId === user.id,
      ),
  );
}
function channelForUser(user, channelId) {
  const channel = database.channels.find((item) => item.id === channelId);
  return channel && serverForUser(user, channel.serverId) ? channel : null;
}
function decorateMessage(message) {
  const user = database.users.find((item) => item.id === message.authorId);
  return { ...message, author: publicUser(user) };
}
function decorateServer(server, user) {
  const memberCount = database.memberships.filter(
    (item) => item.serverId === server.id,
  ).length;
  const channels = database.channels
    .filter((item) => item.serverId === server.id)
    .sort((a, b) => a.position - b.position);
  return {
    ...server,
    memberCount,
    role: database.memberships.find(
      (item) => item.serverId === server.id && item.userId === user.id,
    )?.role,
    channels,
  };
}
function broadcast(channelId, event) {
  for (const [userId, socket] of sockets) {
    if (socket.readyState === 1) {
      const userChannels = database.channels.filter(
        (channel) =>
          channel.id === channelId &&
          database.memberships.some(
            (m) => m.serverId === channel.serverId && m.userId === userId,
          ),
      );
      if (userChannels.length) socket.send(JSON.stringify(event));
    }
  }
}
function broadcastServer(serverId, event) {
  for (const [userId, socket] of sockets) {
    if (
      socket.readyState === 1 &&
      serverForUser(
        database.users.find((user) => user.id === userId),
        serverId,
      )
    )
      socket.send(JSON.stringify(event));
  }
}
function voiceParticipants(channelId) {
  return [...(voiceRooms.get(channelId)?.keys() || [])]
    .map((userId) =>
      publicUser(database.users.find((user) => user.id === userId)),
    )
    .filter(Boolean);
}
function broadcastVoice(channelId, event) {
  for (const userId of voiceRooms.get(channelId)?.keys() || []) {
    const socket = sockets.get(userId);
    if (socket?.readyState === 1) socket.send(JSON.stringify(event));
  }
}
function broadcastVoiceState(channel) {
  const event = JSON.stringify({
    type: "voice.state",
    serverId: channel.serverId,
    channelId: channel.id,
    participants: voiceParticipants(channel.id),
  });
  for (const [userId, socket] of sockets) {
    if (socket.readyState !== 1) continue;
    const member = database.users.find((item) => item.id === userId);
    if (member && serverForUser(member, channel.serverId)) socket.send(event);
  }
}
function voiceStatesFor(serverId) {
  return [...voiceRooms.entries()]
    .filter(([cid]) =>
      database.channels.some((c) => c.id === cid && c.serverId === serverId),
    )
    .map(([cid]) => ({ channelId: cid, participants: voiceParticipants(cid) }));
}

async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname === "/api/health")
      return json(res, 200, { ok: true, time: now() });
    if (url.pathname === "/api/auth/register" && req.method === "POST") {
      const input = await body(req);
      const username = String(input.username || "")
        .trim()
        .toLowerCase();
      const displayName = String(input.displayName || username).trim();
      const email = String(input.email || "")
        .trim()
        .toLowerCase();
      if (!username || String(input.password || "").length < 6)
        return json(res, 400, {
          error:
            "Usuário e senha com pelo menos 6 caracteres são obrigatórios.",
        });
      if (!/^[a-z0-9_.-]{1,20}$/.test(username))
        return json(res, 400, {
          error:
            "Usuário inválido: use até 20 caracteres (letras, números, ponto, hífen ou underline), sem espaços.",
        });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
        return json(res, 400, {
          error: "Informe um e-mail verdadeiro e válido (ex.: voce@email.com).",
        });
      if (database.users.some((user) => user.username === username))
        return json(res, 409, {
          error: "Este nome de usuário já está em uso.",
        });
      if (
        database.users.some(
          (user) => (user.email || "").toLowerCase() === email,
        )
      )
        return json(res, 409, { error: "Este e-mail já está cadastrado." });
      const user = {
        id: id(),
        username,
        displayName,
        email,
        password: hashPassword(input.password),
        avatarColor: "purple",
        createdAt: now(),
      };
      database.users.push(user);
      await saveDatabase();
      const token = id();
      sessions.set(token, user.id);
      return json(res, 201, { token, user: sessionUser(user) });
    }
    if (url.pathname === "/api/auth/login" && req.method === "POST") {
      const input = await body(req);
      const identifier = String(input.username || "")
        .trim()
        .toLowerCase();
      const user = database.users.find(
        (item) =>
          item.username === identifier ||
          (item.email || "").toLowerCase() === identifier,
      );
      if (!user || !verifyPassword(input.password || "", user.password))
        return json(res, 401, { error: "Credenciais inválidas." });
      const token = id();
      sessions.set(token, user.id);
      return json(res, 200, { token, user: sessionUser(user) });
    }
    if (req.method === "GET" && !url.pathname.startsWith("/api/")) {
      const distDir = path.join(__dirname, "dist");
      const resolved = path.resolve(
        path.join(distDir, decodeURIComponent(url.pathname)),
      );
      if (
        resolved === distDir ||
        resolved.startsWith(`${distDir}${path.sep}`)
      ) {
        try {
          const data = await fs.readFile(resolved);
          const types = {
            ".html": "text/html; charset=utf-8",
            ".js": "text/javascript",
            ".css": "text/css",
            ".png": "image/png",
            ".gif": "image/gif",
            ".svg": "image/svg+xml",
            ".ico": "image/x-icon",
            ".json": "application/json",
            ".webp": "image/webp",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".woff2": "font/woff2",
          };
          res.writeHead(200, {
            "Content-Type":
              types[path.extname(resolved).toLowerCase()] ||
              "application/octet-stream",
          });
          return res.end(data);
        } catch {
          /* cai para o index.html (SPA) */
        }
        try {
          const index = await fs.readFile(path.join(distDir, "index.html"));
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          return res.end(index);
        } catch {
          /* dist ainda não existe */
        }
      }
    }
    const user = getUser(req);
    if (!user) return json(res, 401, { error: "Autenticação necessária." });
    if (url.pathname === "/api/auth/me" && req.method === "GET")
      return json(res, 200, { user: sessionUser(user) });
    if (url.pathname === "/api/auth/me" && req.method === "PATCH") {
      const input = await body(req);
      const displayName =
        input.displayName !== undefined
          ? String(input.displayName).trim()
          : user.displayName;
      const username =
        input.username !== undefined
          ? String(input.username).trim().toLowerCase()
          : user.username;
      if (!displayName)
        return json(res, 400, { error: "Nome de exibição é obrigatório." });
      if (!/^[a-z0-9_.-]{1,20}$/.test(username))
        return json(res, 400, {
          error:
            "Usuário inválido: use até 20 caracteres (letras, números, ponto, hífen ou underline), sem espaços.",
        });
      if (
        database.users.some(
          (item) => item.username === username && item.id !== user.id,
        )
      )
        return json(res, 409, {
          error: "Este nome de usuário já está em uso.",
        });
      if (input.bio !== undefined) user.bio = String(input.bio).slice(0, 300);
      if (input.email !== undefined) {
        const email = String(input.email).trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
          return json(res, 400, { error: "E-mail inválido." });
        if (
          database.users.some(
            (item) =>
              item.id !== user.id && (item.email || "").toLowerCase() === email,
          )
        )
          return json(res, 409, { error: "Este e-mail já está cadastrado." });
        user.email = email;
      }
      if (input.password !== undefined) {
        if (String(input.password).length < 6)
          return json(res, 400, {
            error: "A nova senha precisa ter pelo menos 6 caracteres.",
          });
        user.password = hashPassword(String(input.password));
      }
      if (input.avatar !== undefined) {
        if (input.avatar === null || input.avatar === "") user.avatar = null;
        else if (
          typeof input.avatar === "string" &&
          input.avatar.startsWith("data:image/") &&
          input.avatar.length <= 4000000
        )
          user.avatar = input.avatar;
        else
          return json(res, 400, {
            error: "Foto inválida: use uma imagem de até 3 MB.",
          });
      }
      if (input.banner !== undefined) {
        if (input.banner === null || input.banner === "") user.banner = null;
        else if (
          typeof input.banner === "string" &&
          input.banner.startsWith("data:image/") &&
          input.banner.length <= 4000000
        )
          user.banner = input.banner;
        else if (
          typeof input.banner === "string" &&
          /^#[0-9a-fA-F]{6}$/.test(input.banner)
        )
          user.banner = input.banner;
        else
          return json(res, 400, {
            error: "Banner inválido: use uma imagem de até 3 MB ou uma cor.",
          });
      }
      if (input.nameStyle !== undefined)
        user.nameStyle = [
          "default",
          "serif",
          "pixel",
          "gothic",
          "rounded",
          "bubble",
          "block",
          "mono",
          "script",
          "display",
          "blackletter",
          "handwritten",
        ].includes(input.nameStyle)
          ? input.nameStyle
          : "default";
      if (input.nameColor !== undefined)
        user.nameColor = /^#[0-9a-fA-F]{6}$/.test(String(input.nameColor))
          ? String(input.nameColor)
          : "#f1f3f5";
      if (input.nameEffect !== undefined)
        user.nameEffect = [
          "solid",
          "neon",
          "gradient",
          "outline",
          "desenho",
          "pop",
          "gummy",
          "prism",
        ].includes(input.nameEffect)
          ? input.nameEffect
          : "solid";
      if (input.profileTheme !== undefined)
        user.profileTheme = [
          "default",
          "purple",
          "red",
          "green",
          "blue",
        ].includes(input.profileTheme)
          ? input.profileTheme
          : "default";
      if (input.profilePlate !== undefined)
        user.profilePlate = ["default", "stars", "waves", "neon"].includes(
          input.profilePlate,
        )
          ? input.profilePlate
          : "default";
      if (input.profileEffect !== undefined)
        user.profileEffect = ["none", "sparkles", "glow", "embers"].includes(
          input.profileEffect,
        )
          ? input.profileEffect
          : "none";
      if (input.avatarFrame !== undefined)
        user.avatarFrame = ["none", "ruby", "gold", "neon", "ice"].includes(
          input.avatarFrame,
        )
          ? input.avatarFrame
          : "none";
      if (input.favoriteGame !== undefined)
        user.favoriteGame = String(input.favoriteGame || "")
          .trim()
          .slice(0, 80);
      if (input.activityText !== undefined)
        user.activityText = String(input.activityText || "")
          .trim()
          .slice(0, 120);
      if (input.wishlist !== undefined)
        user.wishlist = String(input.wishlist || "")
          .trim()
          .slice(0, 300);
      if (input.badges !== undefined) {
        if (!isCreator(user))
          return json(res, 403, {
            error: "Somente o criador pode gerenciar insígnias.",
          });
        user.badges = sanitizeBadges(user, input.badges);
      }
      if (input.status !== undefined) {
        const allowedStatus = ["online", "idle", "dnd", "invisible"];
        user.status = allowedStatus.includes(input.status)
          ? input.status
          : "online";
      }
      user.displayName = displayName;
      user.username = username;
      await saveDatabase();
      const output = publicUser(user);
      broadcastAll({ type: "user.updated", user: output });
      broadcastAll({
        type: "presence.updated",
        userId: user.id,
        presence: presenceOf(user),
      });
      return json(res, 200, { user: sessionUser(user) });
    }
    const profileMatch = url.pathname.match(/^\/api\/users\/([^/]+)$/);
    if (profileMatch && req.method === "GET") {
      const target = database.users.find((item) => item.id === profileMatch[1]);
      if (!target) return json(res, 404, { error: "Usuário não encontrado." });
      const badges = [...(target.badges || [])];
      let voice = null;
      for (const [channelId, room] of voiceRooms)
        if (room.has(target.id)) {
          const channel = database.channels.find(
            (item) => item.id === channelId,
          );
          if (channel)
            voice = { channelId: channel.id, channelName: channel.name };
        }
      return json(res, 200, { user: { ...publicUser(target), badges }, voice });
    }
    const badgeMatch = url.pathname.match(/^\/api\/users\/([^/]+)\/badges$/);
    if (badgeMatch && req.method === "PATCH") {
      if (!isCreator(user))
        return json(res, 403, {
          error: "Somente o criador pode gerenciar insígnias.",
        });
      const target = database.users.find((item) => item.id === badgeMatch[1]);
      if (!target) return json(res, 404, { error: "Usuário não encontrado." });
      const input = await body(req);
      target.badges = sanitizeBadges(target, input.badges);
      await saveDatabase();
      const output = publicUser(target);
      broadcastAll({ type: "user.updated", user: output });
      return json(res, 200, { user: output });
    }
    if (url.pathname === "/api/servers" && req.method === "GET")
      return json(res, 200, {
        servers: database.servers
          .filter((server) => serverForUser(user, server.id))
          .map((server) => decorateServer(server, user)),
      });
    if (url.pathname === "/api/servers" && req.method === "POST") {
      const input = await body(req);
      const name = String(input.name || "").trim();
      if (!name)
        return json(res, 400, { error: "Nome do servidor é obrigatório." });
      let icon = initials(name).slice(0, 1);
      if (
        typeof input.icon === "string" &&
        input.icon.startsWith("data:image/") &&
        input.icon.length <= 2000000
      )
        icon = input.icon;
      else if (typeof input.icon === "string" && input.icon)
        return json(res, 400, { error: "Ícone inválido." });
      const server = {
        id: id(),
        name,
        icon,
        tag: String(input.tag || initials(name))
          .replace(/[^a-z0-9]/gi, "")
          .slice(0, 4)
          .toUpperCase(),
        banner: null,
        accentColor: "#c93642",
        ownerId: user.id,
        createdAt: now(),
      };
      database.servers.push(server);
      database.memberships.push({
        userId: user.id,
        serverId: server.id,
        role: "owner",
        joinedAt: now(),
      });
      const templates = {
        gaming: [
          ["geral", "text"],
          ["clips", "text"],
          ["Geral", "voice"],
        ],
        friends: [
          ["geral", "text"],
          ["conversa", "text"],
          ["Papo voz", "voice"],
        ],
        study: [
          ["geral", "text"],
          ["duvidas", "text"],
          ["recursos", "text"],
          ["Estudos voz", "voice"],
        ],
        school: [
          ["geral", "text"],
          ["trabalhos", "text"],
          ["avisos", "text"],
          ["Sala voz", "voice"],
        ],
      };
      const layout = templates[input.template] || [
        ["geral", "text"],
        ["Call da comunidade", "voice"],
      ];
      const channels = layout.map(([channelName, type], position) => ({
        id: id(),
        serverId: server.id,
        name: channelName.toLowerCase(),
        type,
        topic: type === "text" ? "Comece uma conversa" : "Converse por áudio",
        position,
        createdAt: now(),
      }));
      database.channels.push(...channels);
      const general = channels.find((channel) => channel.type === "text");
      database.messages.push({
        id: id(),
        channelId: general.id,
        authorId: user.id,
        content: `Bem-vindo ao ${name}! Este é o começo da sua comunidade.`,
        createdAt: now(),
        editedAt: null,
      });
      await saveDatabase();
      return json(res, 201, { server: decorateServer(server, user) });
    }
    const serverRootMatch = url.pathname.match(/^\/api\/servers\/([^/]+)$/);
    if (serverRootMatch && req.method === "PATCH") {
      const server = serverForUser(user, serverRootMatch[1]);
      if (!server) return json(res, 404, { error: "Servidor não encontrado." });
      if (server.ownerId !== user.id)
        return json(res, 403, {
          error: "Somente o dono pode editar o servidor.",
        });
      const input = await body(req);
      if (input.name !== undefined) {
        const name = String(input.name).trim().slice(0, 80);
        if (!name) return json(res, 400, { error: "Nome é obrigatório." });
        server.name = name;
      }
      if (input.icon !== undefined) {
        if (input.icon === null || input.icon === "")
          server.icon = initials(server.name).slice(0, 1);
        else if (
          typeof input.icon === "string" &&
          input.icon.startsWith("data:image/") &&
          input.icon.length <= 2000000
        )
          server.icon = input.icon;
        else return json(res, 400, { error: "Ícone inválido." });
      }
      if (input.tag !== undefined) {
        const tag = String(input.tag || "")
          .trim()
          .toUpperCase();
        if (tag && !/^[A-Z0-9]{2,4}$/.test(tag))
          return json(res, 400, {
            error: "A tag deve ter de 2 a 4 letras ou números.",
          });
        server.tag = tag;
      }
      if (input.banner !== undefined) {
        if (input.banner === null || input.banner === "") server.banner = null;
        else if (
          typeof input.banner === "string" &&
          input.banner.startsWith("data:image/") &&
          input.banner.length <= 4000000
        )
          server.banner = input.banner;
        else
          return json(res, 400, { error: "Banner inválido ou muito grande." });
      }
      if (input.accentColor !== undefined) {
        const color = String(input.accentColor);
        if (!/^#[0-9a-fA-F]{6}$/.test(color))
          return json(res, 400, { error: "Cor inválida." });
        server.accentColor = color;
      }
      await saveDatabase();
      broadcastServer(server.id, {
        type: "server.updated",
        serverId: server.id,
        server: decorateServer(server, user),
      });
      return json(res, 200, { server: decorateServer(server, user) });
    }
    const serverMatch = url.pathname.match(/^\/api\/servers\/([^/]+)$/);
    const channelMatch = url.pathname.match(
      /^\/api\/channels\/([^/]+)\/messages$/,
    );
    const channelRootMatch = url.pathname.match(/^\/api\/channels\/([^/]+)$/);
    if (serverMatch && req.method === "GET") {
      const server = serverForUser(user, serverMatch[1]);
      if (!server) return json(res, 404, { error: "Servidor não encontrado." });
      return json(res, 200, {
        server: decorateServer(server, user),
        members: database.memberships
          .filter((m) => m.serverId === server.id)
          .map((m) =>
            publicUser(database.users.find((item) => item.id === m.userId)),
          ),
        voice: voiceStatesFor(server.id),
      });
    }
    if (serverMatch && req.method === "POST") {
      const server = serverForUser(user, serverMatch[1]);
      if (!server || server.ownerId !== user.id)
        return json(res, 403, { error: "Somente o dono pode criar canais." });
      const input = await body(req);
      const channel = {
        id: id(),
        serverId: server.id,
        name: String(input.name || "novo-canal")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-"),
        type: input.type === "voice" ? "voice" : "text",
        topic: input.topic || "",
        position: database.channels.filter((c) => c.serverId === server.id)
          .length,
        createdAt: now(),
      };
      database.channels.push(channel);
      await saveDatabase();
      broadcastServer(server.id, {
        type: "channel.created",
        serverId: server.id,
        channel,
      });
      return json(res, 201, { channel });
    }
    if (channelRootMatch && req.method === "DELETE") {
      const channel = channelForUser(user, channelRootMatch[1]);
      const server =
        channel &&
        database.servers.find((item) => item.id === channel.serverId);
      if (!channel || !server || server.ownerId !== user.id)
        return json(res, 403, { error: "Sem permissão." });
      database.channels = database.channels.filter(
        (item) => item.id !== channel.id,
      );
      database.messages = database.messages.filter(
        (item) => item.channelId !== channel.id,
      );
      await saveDatabase();
      broadcastServer(server.id, {
        type: "channel.deleted",
        serverId: server.id,
        channelId: channel.id,
      });
      return json(res, 200, { ok: true });
    }
    if (channelRootMatch && req.method === "PATCH") {
      const channel = channelForUser(user, channelRootMatch[1]);
      const server =
        channel &&
        database.servers.find((item) => item.id === channel.serverId);
      if (!channel || !server || server.ownerId !== user.id)
        return json(res, 403, { error: "Sem permissão." });
      const input = await body(req);
      if (input.name !== undefined) {
        const name = String(input.name)
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-");
        if (!name)
          return json(res, 400, { error: "Nome do canal é obrigatório." });
        channel.name = name;
      }
      if (input.topic !== undefined) channel.topic = String(input.topic);
      await saveDatabase();
      broadcastServer(server.id, {
        type: "channel.updated",
        serverId: server.id,
        channel,
      });
      return json(res, 200, { channel });
    }
    const serverJoinMatch = url.pathname.match(
      /^\/api\/servers\/([^/]+)\/join$/,
    );
    if (serverJoinMatch && req.method === "POST") {
      const server = database.servers.find(
        (item) => item.id === serverJoinMatch[1],
      );
      if (!server)
        return json(res, 404, {
          error: "Servidor não encontrado. Verifique o ID do convite.",
        });
      if (
        !database.memberships.some(
          (m) => m.serverId === server.id && m.userId === user.id,
        )
      ) {
        database.memberships.push({
          userId: user.id,
          serverId: server.id,
          role: "member",
          joinedAt: now(),
        });
        await saveDatabase();
        broadcastServer(server.id, {
          type: "member.joined",
          serverId: server.id,
          member: publicUser(user),
        });
      }
      return json(res, 200, { server: decorateServer(server, user) });
    }
    if (channelMatch && req.method === "GET") {
      const channel = channelForUser(user, channelMatch[1]);
      if (!channel) return json(res, 404, { error: "Canal não encontrado." });
      const requestedLimit = Number(url.searchParams.get("limit") || 100);
      const limit = Number.isFinite(requestedLimit)
        ? Math.max(1, Math.min(Math.trunc(requestedLimit), 200))
        : 100;
      return json(res, 200, {
        messages: database.messages
          .filter((message) => message.channelId === channel.id)
          .slice(-limit)
          .map(decorateMessage),
      });
    }
    if (channelMatch && req.method === "POST") {
      const channel = channelForUser(user, channelMatch[1]);
      const input = await body(req);
      const content = String(input.content || "").trim();
      if (!channel || !content || content.length > 4000)
        return json(res, 400, { error: "Mensagem inválida." });
      const message = {
        id: id(),
        channelId: channel.id,
        authorId: user.id,
        content,
        createdAt: now(),
        editedAt: null,
      };
      database.messages.push(message);
      await saveDatabase();
      const output = decorateMessage(message);
      broadcast(channel.id, { type: "message.created", message: output });
      return json(res, 201, { message: output });
    }
    if (url.pathname === "/api/friends" && req.method === "GET") {
      const friends = database.friendships
        .filter(
          (item) =>
            (item.requesterId === user.id || item.addresseeId === user.id) &&
            item.status === "accepted",
        )
        .map((item) => friendView(item, user.id))
        .filter(Boolean);
      const pending = database.friendships
        .filter(
          (item) =>
            (item.requesterId === user.id || item.addresseeId === user.id) &&
            item.status === "pending",
        )
        .map((item) => friendView(item, user.id))
        .filter(Boolean);
      return json(res, 200, { friends, pending });
    }
    if (url.pathname === "/api/friends" && req.method === "POST") {
      const input = await body(req);
      const uname = String(input.username || "")
        .trim()
        .toLowerCase();
      const target = database.users.find((item) => item.username === uname);
      if (!target)
        return json(res, 404, {
          error: "Usuário não encontrado. Confira o nome (sem o @).",
        });
      if (target.id === user.id)
        return json(res, 400, { error: "Você não pode se adicionar." });
      const existing = database.friendships.find(
        (item) =>
          (item.requesterId === target.id && item.addresseeId === user.id) ||
          (item.requesterId === user.id && item.addresseeId === target.id),
      );
      if (existing) {
        if (existing.status === "accepted")
          return json(res, 409, { error: "Vocês já são amigos." });
        if (existing.requesterId === target.id) {
          existing.status = "accepted";
          await saveDatabase();
          notifyUser(target.id, { type: "friends.updated" });
          notifyUser(user.id, { type: "friends.updated" });
          return json(res, 200, { ok: true, accepted: true });
        }
        return json(res, 409, {
          error: "Você já enviou um convite para esta pessoa.",
        });
      }
      database.friendships.push({
        id: id(),
        requesterId: user.id,
        addresseeId: target.id,
        status: "pending",
        createdAt: now(),
      });
      await saveDatabase();
      notifyUser(target.id, { type: "friends.updated" });
      notifyUser(user.id, { type: "friends.updated" });
      return json(res, 201, { ok: true });
    }
    const friendMatch = url.pathname.match(
      /^\/api\/friends\/([^/]+)(\/accept)?$/,
    );
    if (friendMatch && req.method === "POST") {
      const friendship = database.friendships.find(
        (item) =>
          item.id === friendMatch[1] &&
          item.addresseeId === user.id &&
          item.status === "pending",
      );
      if (!friendship)
        return json(res, 404, { error: "Solicitação não encontrada." });
      friendship.status = "accepted";
      await saveDatabase();
      notifyUser(friendship.requesterId, { type: "friends.updated" });
      notifyUser(friendship.addresseeId, { type: "friends.updated" });
      return json(res, 200, { ok: true });
    }
    if (friendMatch && req.method === "DELETE") {
      const friendship = database.friendships.find(
        (item) =>
          item.id === friendMatch[1] &&
          (item.requesterId === user.id || item.addresseeId === user.id),
      );
      if (!friendship) return json(res, 404, { error: "Não encontrado." });
      database.friendships = database.friendships.filter(
        (item) => item !== friendship,
      );
      await saveDatabase();
      notifyUser(friendship.requesterId, { type: "friends.updated" });
      notifyUser(friendship.addresseeId, { type: "friends.updated" });
      return json(res, 200, { ok: true });
    }
    return json(res, 404, { error: "Rota não encontrada." });
  } catch (error) {
    const status = Number(error.status) || 500;
    if (status >= 500) console.error(error);
    return json(res, status, {
      error: status >= 500 ? "Erro interno do servidor." : error.message,
    });
  }
}

await loadDatabase();
const server = http.createServer(handler);
const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", (socket, req) => {
  const token = new URL(req.url, `http://${req.headers.host}`).searchParams.get(
    "token",
  );
  const userId = sessions.get(token);
  if (!userId) return socket.close(1008, "Unauthorized");
  sockets.set(userId, socket);
  const connected = database.users.find((item) => item.id === userId);
  if (connected)
    broadcastAll({
      type: "presence.updated",
      userId,
      presence: presenceOf(connected),
    });
  socket.on("message", (raw) => {
    try {
      const event = JSON.parse(raw.toString());
      if (event.type === "voice.join" || event.type === "voice.leave") {
        const channel = database.channels.find(
          (item) => item.id === event.channelId && item.type === "voice",
        );
        if (
          !channel ||
          !serverForUser(
            database.users.find((user) => user.id === userId),
            channel.serverId,
          )
        )
          return;
        if (!voiceRooms.has(channel.id)) voiceRooms.set(channel.id, new Map());
        const room = voiceRooms.get(channel.id);
        const wasPresent = room.has(userId);
        const changing = event.type === "voice.join" ? !wasPresent : wasPresent;
        if (event.type === "voice.join") room.set(userId, true);
        else room.delete(userId);
        if (changing) {
          broadcastVoice(channel.id, {
            type: "voice.participants",
            channelId: channel.id,
            participants: voiceParticipants(channel.id),
          });
          broadcastVoiceState(channel);
        }
        if (event.type === "voice.leave" && room.size === 0)
          voiceRooms.delete(channel.id);
      } else if (
        ["voice.offer", "voice.answer", "voice.ice"].includes(event.type)
      ) {
        const sharedRoom = [...voiceRooms.values()].some(
          (room) => room.has(userId) && room.has(event.targetUserId),
        );
        if (!sharedRoom) return;
        const target = sockets.get(event.targetUserId);
        if (target?.readyState === 1)
          target.send(JSON.stringify({ ...event, fromUserId: userId }));
      }
    } catch {
      /* ignore malformed realtime events */
    }
  });
  socket.on("close", () => {
    if (sockets.get(userId) === socket) sockets.delete(userId);
    for (const [channelId, room] of voiceRooms)
      if (room.delete(userId)) {
        const channel = database.channels.find((item) => item.id === channelId);
        if (channel) broadcastVoiceState(channel);
        if (!room.size) voiceRooms.delete(channelId);
      }
    const departed = database.users.find((item) => item.id === userId);
    if (departed)
      broadcastAll({
        type: "presence.updated",
        userId,
        presence: presenceOf(departed),
      });
  });
});
server.on("error", (error) => {
  if (error.code === "EADDRINUSE")
    console.error(
      `A porta ${port} já está em uso. O Sesh continuará usando o servidor existente.`,
    );
  else throw error;
});
wss.on("error", (error) => {
  if (error.code !== "EADDRINUSE") console.error(error);
});
server.listen(port, host, () =>
  console.log(`Sesh API em http://${host}:${port}`),
);
export { server };
